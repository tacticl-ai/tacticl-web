/**
 * micCapture — getUserMedia + AudioWorklet pipeline that produces 16 kHz mono
 * Int16 PCM chunks for the voice WebSocket, plus a smoothed input level for the
 * sphere while listening.
 *
 * The heavy lifting (downsample + Int16 conversion) happens off the main thread
 * in `public/voice/mic-worklet.js`. This class owns the AudioContext + media
 * stream lifecycle and forwards worklet messages to callbacks.
 */

import { AUDIO_SAMPLE_RATE } from '../protocol';

/** Public URL of the worklet module (served from /public). */
const WORKLET_URL = '/voice/mic-worklet.js';

export interface MicCaptureCallbacks {
  /** Each ~20 ms 16 kHz mono Int16 PCM chunk, ready to send up the socket. */
  onChunk: (chunk: ArrayBuffer) => void;
  /** Smoothed input level 0..1 (drives the sphere while listening). */
  onLevel?: (level: number) => void;
  /** Surfaced if mic permission/init fails after start(). */
  onError?: (err: Error) => void;
}

export class MicCapture {
  private readonly callbacks: MicCaptureCallbacks;
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private node: AudioWorkletNode | null = null;
  private starting = false;
  private active = false;

  constructor(callbacks: MicCaptureCallbacks) {
    this.callbacks = callbacks;
  }

  get isActive(): boolean {
    return this.active;
  }

  /**
   * Acquire the mic and begin emitting PCM chunks. Idempotent: a second call
   * while active resolves immediately. Throws (and routes to onError) if the
   * browser blocks the mic or lacks AudioWorklet support.
   */
  async start(): Promise<void> {
    if (this.active || this.starting) return;
    this.starting = true;
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone capture is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      this.stream = stream;

      // Request a 16 kHz context; browsers that ignore it are handled by the
      // worklet's defensive resampler.
      const AudioCtor: typeof AudioContext =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtor({ sampleRate: AUDIO_SAMPLE_RATE });
      this.ctx = ctx;
      if (ctx.state === 'suspended') await ctx.resume();

      if (!ctx.audioWorklet) {
        throw new Error('AudioWorklet is not supported in this browser.');
      }
      await ctx.audioWorklet.addModule(WORKLET_URL);

      const node = new AudioWorkletNode(ctx, 'mic-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 0,
        channelCount: 1,
      });
      this.node = node;
      node.port.onmessage = (ev: MessageEvent) => {
        const data = ev.data as { type: string; buffer?: ArrayBuffer; level?: number };
        if (data.type === 'chunk' && data.buffer) {
          this.callbacks.onChunk(data.buffer);
        } else if (data.type === 'level' && typeof data.level === 'number') {
          this.callbacks.onLevel?.(data.level);
        }
      };

      const source = ctx.createMediaStreamSource(stream);
      this.source = source;
      source.connect(node);
      // No output connection — we don't want to monitor the mic to speakers.

      this.active = true;
    } catch (err) {
      // Roll back any partially-acquired resources on a failed start.
      this.teardown();
      const error = err instanceof Error ? err : new Error(String(err));
      this.callbacks.onError?.(error);
      throw error;
    } finally {
      this.starting = false;
    }
  }

  /** Stop capture and release the mic + audio graph. Safe to call repeatedly. */
  stop(): void {
    this.teardown();
  }

  /** Fully release everything; called by stop() and on failed start(). */
  private teardown(): void {
    this.active = false;
    if (this.node) {
      this.node.port.onmessage = null;
      try {
        this.node.disconnect();
      } catch {
        /* already disconnected */
      }
      this.node = null;
    }
    if (this.source) {
      try {
        this.source.disconnect();
      } catch {
        /* already disconnected */
      }
      this.source = null;
    }
    if (this.stream) {
      for (const track of this.stream.getTracks()) track.stop();
      this.stream = null;
    }
    if (this.ctx) {
      const ctx = this.ctx;
      this.ctx = null;
      // close() returns a promise; we don't await on teardown.
      void ctx.close().catch(() => {
        /* context may already be closed */
      });
    }
    this.callbacks.onLevel?.(0);
  }
}
