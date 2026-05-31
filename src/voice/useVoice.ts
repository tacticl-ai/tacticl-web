import { create } from 'zustand';
import type { VoiceState } from '../components/command/VoiceSphere';

export type { VoiceState };

export interface TranscriptTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  partial?: boolean;
  ts: number;
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
  dispose(): void;
}

interface VoiceStore {
  state: VoiceState;
  level: number;
  transcript: TranscriptTurn[];
  backend: VoiceBackend | null;
  // primitives the backend drives:
  setState: (s: VoiceState) => void;
  setLevel: (l: number) => void;
  pushTurn: (t: Omit<TranscriptTurn, 'id' | 'ts'>) => string;
  patchTurn: (id: string, text: string, partial?: boolean) => void;
  // UI actions:
  startListening: () => void;
  stopListening: () => void;
  setBackend: (b: VoiceBackend) => void;
}

let _seq = 0;
const nextId = () => `t${++_seq}`;

export const useVoice = create<VoiceStore>((set, get) => ({
  state: 'idle',
  level: 0,
  transcript: [],
  backend: null,

  setState: (s) => set({ state: s }),
  setLevel: (l) => set({ level: l }),
  pushTurn: (t) => {
    const id = nextId();
    set((st) => ({ transcript: [...st.transcript, { ...t, id, ts: Date.now() }] }));
    return id;
  },
  patchTurn: (id, text, partial) =>
    set((st) => ({
      transcript: st.transcript.map((x) => (x.id === id ? { ...x, text, partial } : x)),
    })),

  setBackend: (b) => set({ backend: b }),
  startListening: () => get().backend?.start(),
  stopListening: () => get().backend?.stop(),
}));

/* ────────────────────────────────────────────────────────────────────────
   MOCK backend — design/review driver. Replace with a WebSocket-backed impl.
   ──────────────────────────────────────────────────────────────────────── */
const DEMO = [
  { user: 'There’s a bug in the strategiz sign-in — the passkey sheet gets stuck.', agent: 'On it. That reads as a WebAuthn concurrency issue — a second credentials.get() while one’s pending. I’ll open a fix PR against strategiz-core and walk you through it.' },
  { user: 'Also, draft a new feature: weekly portfolio digest email.', agent: 'Got it. Routing that to the strategiz feature pipeline — I’ll draft a PRD first and bring it back for your approval before any code.' },
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
      const s = useVoice.getState();
      s.setLevel(0.1);
      s.setState('thinking');
      timers.push(
        setTimeout(() => {
          const reply = DEMO[turn % DEMO.length].agent;
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
              turn++;
            }, dur + 200),
          );
        }, 900),
      );
    },
    dispose() {
      clearLevel();
      timers.forEach(clearTimeout);
      timers = [];
    },
  };
}
