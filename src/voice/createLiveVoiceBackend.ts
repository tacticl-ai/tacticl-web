/**
 * createLiveVoiceBackend — the production VoiceBackend.
 *
 * Wires the tacticl-core voice WebSocket to the command-center store. Deepgram
 * (STT) and ElevenLabs (TTS) live server-side; this client only streams raw mic
 * PCM up and plays TTS audio down, plus exchanges JSON control frames.
 *
 * Lifecycle:
 *   1. fetch a short-lived session token (POST token URL with the auth bearer)
 *   2. open the WebSocket with ?token=...
 *   3. start()  → push-to-talk down: state 'listening', send {start}, stream mic
 *   4. stop()   → push-to-talk up:  send {stop}, state 'thinking'
 *   5. DOWN frames drive the store (state/level/transcript/hud/checkpoint/error)
 *      + the TtsPlayer; binary DOWN frames are TTS audio chunks
 *   6. barge-in: mic energy while 'speaking' → flush playback + send {barge_in}
 *
 * Robustness: bounded exponential-backoff reconnect, idempotent start/stop,
 * full teardown on dispose().
 */

import { useVoice } from './useVoice';
import { MicCapture } from './audio/micCapture';
import { TtsPlayer } from './audio/ttsPlayer';
import type { VoiceBackend } from './useVoice';
import {
  decodeDownControl,
  encodeUpControl,
  type CheckpointDecision,
  type DownControlMessage,
} from './protocol';

const DEFAULT_TOKEN_PATH = '/v1/voice/token';
const MAX_RECONNECT_DELAY_MS = 15000;
const BASE_RECONNECT_DELAY_MS = 500;
/** Smoothed mic level above this during 'speaking' triggers barge-in. */
const BARGE_IN_LEVEL = 0.22;

export interface LiveVoiceBackendOptions {
  /** WebSocket base URL, e.g. wss://api.tacticl.ai/v1/voice/stream. Required. */
  wsUrl: string;
  /** Token endpoint URL (absolute or path on VITE_API_BASE_URL). */
  tokenUrl?: string;
  /** API base used to resolve a relative tokenUrl. */
  apiBaseUrl?: string;
  /** Supplies the stored auth bearer for the token request. */
  getAuthToken?: () => string | null;
}

export function createLiveVoiceBackend(opts: LiveVoiceBackendOptions): VoiceBackend {
  const store = useVoice;

  const tokenUrl = resolveTokenUrl(opts);
  const getAuthToken = opts.getAuthToken ?? (() => null);

  let ws: WebSocket | null = null;
  let mic: MicCapture | null = null;
  const tts = new TtsPlayer({
    onLevel: (l) => {
      // Only let TTS own the level while the sphere is in 'speaking'.
      if (store.getState().state === 'speaking') store.getState().setLevel(l);
    },
    onDrained: () => {
      // Server is authoritative on state, but if it never sends idle we still
      // settle the sphere when audio finishes.
      const s = store.getState();
      if (s.state === 'speaking') {
        s.setState('idle');
        s.setLevel(0);
      }
    },
  });

  let disposed = false;
  let listening = false;
  let reconnectAttempts = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  /** In-flight connect; resolves only once the WS is OPEN so callers can safely send. */
  let connectPromise: Promise<void> | null = null;
  /** Set true once we've sent {start} and are streaming this turn. */
  let turnOpen = false;
  let bargedThisTurn = false;

  /* ── WebSocket connection ─────────────────────────────────────────────── */

  async function connect(): Promise<void> {
    if (disposed) return;
    // Already connected — nothing to do.
    if (ws && ws.readyState === WebSocket.OPEN) return;
    // A connect is already in flight — await the same promise (don't open a 2nd socket).
    if (connectPromise) return connectPromise;

    connectPromise = (async () => {
      try {
        const token = await fetchToken();
        if (disposed) return;
        const url = buildWsUrl(opts.wsUrl, token);
        const socket = new WebSocket(url);
        socket.binaryType = 'arraybuffer';
        ws = socket;
        socket.onmessage = (ev) => handleMessage(ev);
        socket.onerror = () => {
          // onclose will follow and drive reconnect.
        };
        // Resolve ONLY once the socket is OPEN, so the caller can safely send the
        // {start}/{text} frame (a previous version sent it while still CONNECTING,
        // which silently dropped it and the turn never began server-side).
        await new Promise<void>((resolve, reject) => {
          socket.onopen = () => {
            reconnectAttempts = 0;
            store.getState().setError(null);
            resolve();
          };
          socket.onclose = () => {
            if (ws === socket) ws = null;
            // If it closed before opening, fail this connect; reconnect either way.
            reject(new Error('Voice link closed before it opened.'));
            if (!disposed) scheduleReconnect();
          };
        });
      } catch (err) {
        store.getState().setError(
          err instanceof Error ? err.message : 'Voice link failed to authenticate.',
        );
        if (!disposed) scheduleReconnect();
        throw err;
      } finally {
        connectPromise = null;
      }
    })();
    return connectPromise;
  }

  async function fetchToken(): Promise<string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const bearer = getAuthToken();
    if (bearer) headers['Authorization'] = `Bearer ${bearer}`;

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: '{}',
    });
    if (!res.ok) {
      throw new Error(`Voice token request failed (${res.status}).`);
    }
    const data = (await res.json()) as { token?: string };
    if (!data.token) throw new Error('Voice token response missing token.');
    return data.token;
  }

  function scheduleReconnect(): void {
    if (disposed || reconnectTimer) return;
    const delay = Math.min(
      MAX_RECONNECT_DELAY_MS,
      BASE_RECONNECT_DELAY_MS * 2 ** reconnectAttempts,
    );
    reconnectAttempts += 1;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      void connect();
    }, delay);
  }

  function sendControl(msg: Parameters<typeof encodeUpControl>[0]): boolean {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(encodeUpControl(msg));
      return true;
    }
    return false;
  }

  /* ── Inbound frame handling ───────────────────────────────────────────── */

  function handleMessage(ev: MessageEvent): void {
    if (typeof ev.data === 'string') {
      const msg = decodeDownControl(ev.data);
      if (msg) handleControl(msg);
      return;
    }
    // Binary = TTS audio chunk.
    if (ev.data instanceof ArrayBuffer) {
      void tts.enqueue(ev.data);
    } else if (ev.data instanceof Blob) {
      void ev.data.arrayBuffer().then((buf) => tts.enqueue(buf));
    }
  }

  function handleControl(msg: DownControlMessage): void {
    const s = store.getState();
    switch (msg.type) {
      case 'state':
        s.setState(msg.state);
        if (msg.state === 'idle') s.setLevel(0);
        break;
      case 'level':
        // Server VAD/envelope wins unless we're listening (mic owns that level).
        if (s.state !== 'listening') s.setLevel(clamp01(msg.level));
        break;
      case 'transcript':
        s.patchTurn(msg.id, msg.text, msg.partial, msg.role);
        break;
      case 'hud':
        s.setOperation({
          role: msg.role,
          phase: msg.phase,
          runId: msg.runId,
          note: msg.note,
        });
        break;
      case 'checkpoint':
        s.setCheckpoint({
          checkpointId: msg.checkpointId,
          title: msg.title,
          options: msg.options,
        });
        break;
      case 'audio_format':
        tts.setCodec(msg.codec);
        break;
      case 'error':
        s.setError(msg.message);
        break;
    }
  }

  /* ── Mic streaming ────────────────────────────────────────────────────── */

  function ensureMic(): MicCapture {
    if (mic) return mic;
    mic = new MicCapture({
      onChunk: (chunk) => {
        if (ws && ws.readyState === WebSocket.OPEN && turnOpen) ws.send(chunk);
      },
      onLevel: (level) => {
        const cur = store.getState();
        if (cur.state === 'listening') {
          cur.setLevel(level);
        } else if (cur.state === 'speaking' && level > BARGE_IN_LEVEL && !bargedThisTurn) {
          bargedThisTurn = true;
          handleBargeIn();
        }
      },
      onError: (err) => store.getState().setError(err.message),
    });
    return mic;
  }

  function handleBargeIn(): void {
    tts.flush();
    sendControl({ type: 'barge_in' });
    const s = store.getState();
    s.setState('listening');
    turnOpen = true;
    sendControl({ type: 'start' });
  }

  /* ── VoiceBackend surface ─────────────────────────────────────────────── */

  return {
    start() {
      if (disposed || listening) return;
      listening = true;
      bargedThisTurn = false;
      const s = store.getState();
      s.setState('listening');
      s.setError(null);
      // Interrupt any in-flight TTS the moment the operator starts a new turn.
      tts.flush();
      // Prime the TTS AudioContext inside this push-to-talk gesture so the reply
      // isn't muted by the browser autoplay policy.
      void tts.unlock();

      void (async () => {
        try {
          await connect();
          turnOpen = true;
          sendControl({ type: 'start' });
          await ensureMic().start();
        } catch (err) {
          listening = false;
          turnOpen = false;
          store.getState().setState('idle');
          store.getState().setError(
            err instanceof Error ? err.message : 'Microphone unavailable.',
          );
        }
      })();
    },

    stop() {
      if (!listening) return;
      listening = false;
      turnOpen = false;
      mic?.stop();
      sendControl({ type: 'stop' });
      const s = store.getState();
      // Hand off to the server: it will emit thinking → speaking → idle.
      if (s.state === 'listening') {
        s.setState('thinking');
        s.setLevel(0.1);
      }
    },

    sendText(text: string) {
      if (disposed) return;
      const trimmed = text.trim();
      if (!trimmed) return;
      // Interrupt any in-flight TTS — a new typed command supersedes the reply.
      tts.flush();
      // Prime the TTS AudioContext inside this send gesture (autoplay policy).
      void tts.unlock();
      const s = store.getState();
      s.setError(null);
      // Hand off to the server: tacticl-core treats the {text} frame as a final
      // user turn (no STT, no {start}/{stop}) and narrates the response back via
      // transcript/state/hud/checkpoint frames + TTS — same as a spoken turn.
      s.setState('thinking');
      s.setLevel(0.1);
      void (async () => {
        try {
          await connect();
          if (!sendControl({ type: 'text', text: trimmed })) {
            store.getState().setError('Voice link not ready — command not sent.');
            store.getState().setState('idle');
          }
        } catch (err) {
          store.getState().setState('idle');
          store.getState().setError(
            err instanceof Error ? err.message : 'Voice link failed.',
          );
        }
      })();
    },

    decide(checkpointId: string, decision: CheckpointDecision, feedback?: string) {
      sendControl({ type: 'decision', checkpointId, decision, feedback });
    },

    dispose() {
      disposed = true;
      listening = false;
      turnOpen = false;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      mic?.stop();
      mic = null;
      tts.dispose();
      if (ws) {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        try {
          ws.close();
        } catch {
          /* already closing */
        }
        ws = null;
      }
    },
  };
}

/* ── helpers ────────────────────────────────────────────────────────────── */

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function resolveTokenUrl(opts: LiveVoiceBackendOptions): string {
  const raw = opts.tokenUrl || DEFAULT_TOKEN_PATH;
  if (/^https?:\/\//i.test(raw)) return raw;
  const base = (opts.apiBaseUrl || '').replace(/\/$/, '');
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return `${base}${path}`;
}

function buildWsUrl(wsUrl: string, token: string): string {
  const sep = wsUrl.includes('?') ? '&' : '?';
  return `${wsUrl}${sep}token=${encodeURIComponent(token)}`;
}
