import { create } from 'zustand';
import type { VoiceState } from '../components/command/VoiceSphere';
import type { CheckpointDecision } from './protocol';

export type { VoiceState };

export interface TranscriptTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  partial?: boolean;
  ts: number;
}

/** Active human-in-the-loop gate awaiting an operator decision. */
export interface ActiveCheckpoint {
  checkpointId: string;
  title: string;
  options: CheckpointDecision[];
}

/** Current PDLC operation state for the ACTIVE OPERATION strip. */
export interface ActiveOperationState {
  role?: string;
  phase?: string;
  runId?: string;
  note?: string;
}

/**
 * The seam between the command-center UI and the voice plane. The MOCK below
 * drives a believable listen→think→speak loop for design/review. The LIVE
 * backend (tacticl-core conversation WebSocket: Deepgram STT inbound,
 * ElevenLabs TTS outbound) implements this same interface and is swapped in
 * via `setBackend` — the UI never changes.
 */
export interface VoiceBackend {
  /** Begin capturing the mic (or open the gateway turn). */
  start(): void;
  /** Stop capturing → backend transcribes, routes to the agent, speaks back. */
  stop(): void;
  /**
   * Submit a typed command as a final user turn (no mic). Routes through the
   * same agent path as a spoken turn and narrates the response back. Optional —
   * a backend that supports only voice may omit it.
   */
  sendText?(text: string): void;
  /** Send a HITL checkpoint decision upstream. Optional for the mock. */
  decide?(checkpointId: string, decision: CheckpointDecision, feedback?: string): void;
  dispose(): void;
}

interface VoiceStore {
  state: VoiceState;
  level: number;
  transcript: TranscriptTurn[];
  backend: VoiceBackend | null;
  checkpoint: ActiveCheckpoint | null;
  operation: ActiveOperationState | null;
  error: string | null;
  // primitives the backend drives:
  setState: (s: VoiceState) => void;
  setLevel: (l: number) => void;
  pushTurn: (t: Omit<TranscriptTurn, 'id' | 'ts'>) => string;
  /** Patch by stable id; if the id is unseen, append it (server-driven ids). */
  patchTurn: (id: string, text: string, partial?: boolean, role?: 'user' | 'assistant') => void;
  setCheckpoint: (c: ActiveCheckpoint | null) => void;
  setOperation: (o: ActiveOperationState | null) => void;
  setError: (e: string | null) => void;
  // UI actions:
  startListening: () => void;
  stopListening: () => void;
  /** Push a typed operator turn to the transcript and route it to the backend. */
  sendText: (text: string) => void;
  setBackend: (b: VoiceBackend) => void;
  /** Resolve the active checkpoint with a decision and clear it. */
  decideCheckpoint: (decision: CheckpointDecision, feedback?: string) => void;
}

let _seq = 0;
const nextId = () => `t${++_seq}`;

export const useVoice = create<VoiceStore>((set, get) => ({
  state: 'idle',
  level: 0,
  transcript: [],
  backend: null,
  checkpoint: null,
  operation: null,
  error: null,

  setState: (s) => set({ state: s }),
  setLevel: (l) => set({ level: l }),
  pushTurn: (t) => {
    const id = nextId();
    set((st) => ({ transcript: [...st.transcript, { ...t, id, ts: Date.now() }] }));
    return id;
  },
  patchTurn: (id, text, partial, role) =>
    set((st) => {
      const exists = st.transcript.some((x) => x.id === id);
      if (exists) {
        return {
          transcript: st.transcript.map((x) => (x.id === id ? { ...x, text, partial } : x)),
        };
      }
      // Server-assigned id we haven't seen — append it as a new turn.
      return {
        transcript: [
          ...st.transcript,
          { id, role: role ?? 'assistant', text, partial, ts: Date.now() },
        ],
      };
    }),
  setCheckpoint: (c) => set({ checkpoint: c }),
  setOperation: (o) => set({ operation: o }),
  setError: (e) => set({ error: e }),

  setBackend: (b) => set({ backend: b }),
  startListening: () => get().backend?.start(),
  stopListening: () => get().backend?.stop(),
  sendText: (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    // The store owns the operator turn — single source of truth. Backends
    // implement sendText only to drive the response (mock: think→speak loop;
    // live: emit a {text} UP frame). They must NOT re-push the user turn.
    get().pushTurn({ role: 'user', text: trimmed });
    get().backend?.sendText?.(trimmed);
  },
  decideCheckpoint: (decision, feedback) => {
    const { backend, checkpoint } = get();
    if (!checkpoint) return;
    backend?.decide?.(checkpoint.checkpointId, decision, feedback);
    set({ checkpoint: null });
  },
}));

/* ────────────────────────────────────────────────────────────────────────
   MOCK backend — design/review driver. Replace with a WebSocket-backed impl.
   ──────────────────────────────────────────────────────────────────────── */
const DEMO = [
  { user: 'Add a /health endpoint to the API and wire it into the readiness probe.', agent: 'On it. I’ll add a lightweight health controller, wire it to the readiness probe, and open a fix PR — I’ll bring it back for your approval before anything ships.' },
  { user: 'Also, draft a new feature: a weekly activity digest.', agent: 'Got it. Routing that to the feature pipeline — I’ll draft a PRD first and bring it back for your approval before any code.' },
];

export function createMockVoiceBackend(): VoiceBackend {
  let levelTimer: ReturnType<typeof setInterval> | null = null;
  let timers: ReturnType<typeof setTimeout>[] = [];
  let turn = 0;

  const clearLevel = () => {
    if (levelTimer) clearInterval(levelTimer);
    levelTimer = null;
  };
  const rampLevel = (target: () => number) => {
    clearLevel();
    levelTimer = setInterval(() => useVoice.getState().setLevel(target()), 50);
  };

  /** Drive a believable thinking→speaking→idle loop that narrates `reply`. */
  const speakReply = (reply: string, thinkDelay = 900) => {
    const s = useVoice.getState();
    s.setState('thinking');
    s.setLevel(0.1);
    timers.push(
      setTimeout(() => {
        const cur = useVoice.getState();
        cur.setState('speaking');
        rampLevel(() => 0.3 + Math.random() * 0.55);
        const id = cur.pushTurn({ role: 'assistant', text: '', partial: true });
        const words = reply.split(' ');
        words.forEach((_, i) =>
          timers.push(
            setTimeout(() => useVoice.getState().patchTurn(id, words.slice(0, i + 1).join(' '), true), 55 * (i + 1)),
          ),
        );
        const dur = 55 * (words.length + 1);
        timers.push(
          setTimeout(() => {
            const f = useVoice.getState();
            f.patchTurn(id, reply, false);
            clearLevel();
            f.setLevel(0);
            f.setState('idle');
          }, dur + 200),
        );
      }, thinkDelay),
    );
  };

  return {
    start() {
      const s = useVoice.getState();
      s.setState('listening');
      // simulated mic envelope
      rampLevel(() => 0.35 + Math.random() * 0.5);
      const line = DEMO[turn % DEMO.length].user;
      const id = s.pushTurn({ role: 'user', text: '', partial: true });
      // "transcribe" progressively
      const words = line.split(' ');
      words.forEach((_, i) => {
        timers.push(
          setTimeout(() => useVoice.getState().patchTurn(id, words.slice(0, i + 1).join(' '), true), 90 * (i + 1)),
        );
      });
      timers.push(setTimeout(() => useVoice.getState().patchTurn(id, line, false), 90 * (words.length + 1)));
    },
    stop() {
      clearLevel();
      const reply = DEMO[turn % DEMO.length].agent;
      turn++;
      speakReply(reply);
    },
    sendText(text) {
      // The store already pushed the operator turn — only narrate the response.
      clearLevel();
      const reply = `Copy that — “${text}”. Routing it through the agent now; I’ll bring the result back here and surface any human gate before it ships.`;
      speakReply(reply, 700);
    },
    dispose() {
      clearLevel();
      timers.forEach(clearTimeout);
      timers = [];
    },
  };
}
