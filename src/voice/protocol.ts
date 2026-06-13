/**
 * Voice WebSocket protocol contract — shared between tacticl-web (this file) and
 * tacticl-core (which implements the same wire format server-side).
 *
 * Topology: browser <-> tacticl-core voice WebSocket. Deepgram (STT) and
 * ElevenLabs (TTS) run SERVER-SIDE only — no third-party API keys ever reach the
 * browser. The browser streams raw mic PCM up and plays TTS audio chunks down,
 * interleaved with small JSON control frames on the same socket.
 *
 * Run flow: voice transcript -> tacticl ingress dispatch -> arbiter -> PDLC
 * pipeline; pipeline RunUpdates flow back as TTS narration + HUD/sphere state
 * frames + HITL checkpoints.
 *
 * ── Frame multiplexing on one socket ──────────────────────────────────────
 *  - BINARY frames carry audio (PCM/mp3). Direction decides meaning:
 *      UP   = 16 kHz mono signed-16-bit little-endian PCM mic chunks (~20–40 ms).
 *      DOWN = TTS audio chunks. ASSUMPTION: 16 kHz mono signed-16-bit LE PCM,
 *             matching the mic format, so the player can stream it raw. If the
 *             server elects to send mp3 instead, it MUST first send a
 *             {type:'audio_format'} control frame so the client can decode.
 *  - TEXT frames carry JSON control messages (the unions below).
 *
 * The audio sample rate / format are centralised here so both ends agree.
 */

/** Canonical audio transport parameters. Both mic-up and (default) TTS-down. */
export const AUDIO_SAMPLE_RATE = 16000;
export const AUDIO_CHANNELS = 1;
/** signed 16-bit little-endian PCM. */
export const AUDIO_BITS_PER_SAMPLE = 16;

/** Sphere / HUD state mirror of the UI's VoiceState. */
export type VoiceWireState = 'idle' | 'listening' | 'thinking' | 'speaking';

export type TranscriptRole = 'user' | 'assistant';

/** Checkpoint decisions a human can take at a HITL gate. */
export type CheckpointDecision = 'APPROVE' | 'CHANGES' | 'REJECT';

/* ────────────────────────────────────────────────────────────────────────
   DOWN: server -> browser JSON control frames.
   ──────────────────────────────────────────────────────────────────────── */

/** Drive the sphere/HUD state machine. */
export interface StateFrame {
  type: 'state';
  state: VoiceWireState;
}

/** Smoothed amplitude (TTS envelope while speaking, VAD while listening). 0..1. */
export interface LevelFrame {
  type: 'level';
  level: number;
}

/** STT partials/finals (role 'user') and assistant narration (role 'assistant'). */
export interface TranscriptFrame {
  type: 'transcript';
  role: TranscriptRole;
  /** Stable turn id — partials patch the same id until partial:false. */
  id: string;
  text: string;
  partial: boolean;
}

/** PDLC role-strip / active-operation updates. */
export interface HudFrame {
  type: 'hud';
  /** Active PDLC role, e.g. "Implementer". */
  role?: string;
  /** Pipeline phase label. */
  phase?: string;
  /** Run/correlation id for the active operation. */
  runId?: string;
  /** Free-form status note rendered in the operation panel. */
  note?: string;
}

/** Human-in-the-loop gate — the UI surfaces approve/changes/reject affordances. */
export interface CheckpointFrame {
  type: 'checkpoint';
  checkpointId: string;
  title: string;
  options: CheckpointDecision[];
}

/**
 * Identifies the durable conversation this socket is bound to. Sent right after
 * connect — for a fresh conversation it carries the server-assigned id so the
 * client can resume it later and surface it in the conversation picker.
 */
export interface ConversationFrame {
  type: 'conversation';
  id: string;
  title?: string;
}

/** Server-side error surfaced to the operator. */
export interface ErrorFrame {
  type: 'error';
  message: string;
}

/**
 * Optional negotiation frame: tells the client the DOWN audio codec when it is
 * not the default raw PCM (e.g. 'mp3'). Documented for forward-compat; the
 * client treats absence as the canonical PCM assumption above.
 */
export interface AudioFormatFrame {
  type: 'audio_format';
  codec: 'pcm16' | 'mp3';
  sampleRate?: number;
  channels?: number;
}

/** Discriminated union of all server -> browser control frames. */
export type DownControlMessage =
  | StateFrame
  | LevelFrame
  | TranscriptFrame
  | HudFrame
  | CheckpointFrame
  | ConversationFrame
  | ErrorFrame
  | AudioFormatFrame;

/* ────────────────────────────────────────────────────────────────────────
   UP: browser -> server JSON control frames. (Audio goes as binary.)
   ──────────────────────────────────────────────────────────────────────── */

/** Push-to-talk pressed — open a capture turn. */
export interface StartFrame {
  type: 'start';
}

/**
 * A typed command — the operator submitted text via the HUD composer instead of
 * speaking. tacticl-core MUST treat this as a complete, final user turn: skip
 * STT, route the text straight to ingress dispatch → arbiter → PDLC, and narrate
 * the response back over TTS + transcript/hud/checkpoint frames exactly as for a
 * voice turn. No {start}/{stop} bracketing — a TextFrame is self-contained.
 */
export interface TextFrame {
  type: 'text';
  text: string;
}

/** Push-to-talk released — close capture; server transcribes + routes. */
export interface StopFrame {
  type: 'stop';
}

/** User started speaking during TTS — abort playback and re-listen. */
export interface BargeInFrame {
  type: 'barge_in';
}

/** A spoken or clicked HITL checkpoint decision. */
export interface DecisionFrame {
  type: 'decision';
  checkpointId: string;
  decision: CheckpointDecision;
  feedback?: string;
}

/** Discriminated union of all browser -> server control frames. */
export type UpControlMessage =
  | StartFrame
  | StopFrame
  | TextFrame
  | BargeInFrame
  | DecisionFrame;

/* ────────────────────────────────────────────────────────────────────────
   Token exchange — short-lived session token issued before the WS opens.
   ──────────────────────────────────────────────────────────────────────── */

export interface VoiceTokenResponse {
  token: string;
  /** Optional absolute WS URL override from the server (else use VITE_VOICE_WS_URL). */
  wsUrl?: string;
  /** Optional seconds-to-live, for proactive re-fetch on reconnect. */
  expiresIn?: number;
}

/* ────────────────────────────────────────────────────────────────────────
   Encoders / decoders. JSON control frames are sent/received as TEXT; audio is
   raw binary. These helpers keep both ends honest about the wire shape.
   ──────────────────────────────────────────────────────────────────────── */

/** Serialise a browser -> server control message to a TEXT frame payload. */
export function encodeUpControl(msg: UpControlMessage): string {
  return JSON.stringify(msg);
}

/** Serialise a server -> browser control message (used by the backend + tests). */
export function encodeDownControl(msg: DownControlMessage): string {
  return JSON.stringify(msg);
}

/** Type guard: is this parsed object a known DOWN control message? */
export function isDownControlMessage(value: unknown): value is DownControlMessage {
  if (typeof value !== 'object' || value === null) return false;
  const t = (value as { type?: unknown }).type;
  return (
    t === 'state' ||
    t === 'level' ||
    t === 'transcript' ||
    t === 'hud' ||
    t === 'checkpoint' ||
    t === 'conversation' ||
    t === 'error' ||
    t === 'audio_format'
  );
}

/**
 * Decode an incoming TEXT frame into a typed DOWN control message. Returns null
 * on malformed JSON or an unrecognised shape (callers should ignore null).
 */
export function decodeDownControl(data: string): DownControlMessage | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch {
    return null;
  }
  return isDownControlMessage(parsed) ? parsed : null;
}
