/**
 * ttsPlayer — gapless Web Audio playback queue for inbound TTS audio chunks.
 *
 * Accepts raw 16 kHz mono signed-16-bit-LE PCM chunks (the documented DOWN
 * default) and schedules them back-to-back on a single AudioContext timeline so
 * there are no clicks between chunks. Also supports decoding self-contained
 * compressed blobs (e.g. mp3) via decodeAudioData when the server negotiates a
 * non-PCM codec.
 *
 * For the sphere, it emits a smoothed output level derived from an AnalyserNode
 * while audio is playing, and reports when the queue drains (so the backend can
 * flip the sphere back to idle).
 *
 * Barge-in: stop() immediately silences and flushes everything so the user can
 * interrupt mid-sentence.
 */

import { AUDIO_SAMPLE_RATE } from '../protocol';

export interface TtsPlayerCallbacks {
  /** Smoothed output amplitude 0..1 (drives the sphere while speaking). */
  onLevel?: (level: number) => void;
  /** Fired when the scheduled queue fully drains (playback finished). */
  onDrained?: () => void;
}

export type TtsCodec = 'pcm16' | 'mp3';

export class TtsPlayer {
  private readonly callbacks: TtsPlayerCallbacks;
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gain: GainNode | null = null;
  private freqData: Uint8Array | null = null;

  /** Absolute context time at which the next chunk should start. */
  private nextStartAt = 0;
  /** Live source nodes so barge-in can hard-stop them. */
  private readonly sources = new Set<AudioBufferSourceNode>();
  /** Number of chunks scheduled but not yet finished, for drain detection. */
  private pending = 0;

  private codec: TtsCodec = 'pcm16';
  private level = 0;
  private levelRaf = 0;

  constructor(callbacks: TtsPlayerCallbacks = {}) {
    this.callbacks = callbacks;
  }

  /** Negotiated DOWN audio codec (default raw PCM). */
  setCodec(codec: TtsCodec): void {
    this.codec = codec;
  }

  private ensureContext(): AudioContext {
    if (this.ctx) return this.ctx;
    const AudioCtor: typeof AudioContext =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtor();
    const gain = ctx.createGain();
    gain.gain.value = 1;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    gain.connect(analyser);
    analyser.connect(ctx.destination);

    this.ctx = ctx;
    this.gain = gain;
    this.analyser = analyser;
    this.freqData = new Uint8Array(analyser.frequencyBinCount);
    this.nextStartAt = ctx.currentTime;
    return ctx;
  }

  /**
   * Enqueue an inbound TTS audio chunk for gapless playback. For 'pcm16' the
   * chunk is interpreted as raw 16 kHz mono Int16 LE; for 'mp3' it is decoded
   * as a self-contained compressed blob.
   */
  async enqueue(chunk: ArrayBuffer): Promise<void> {
    const ctx = this.ensureContext();
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {
        /* resume may be blocked until a gesture; chunk will start late */
      });
    }

    let buffer: AudioBuffer;
    if (this.codec === 'mp3') {
      try {
        buffer = await ctx.decodeAudioData(chunk.slice(0));
      } catch {
        return; // undecodable fragment — drop it rather than break the stream
      }
    } else {
      buffer = this.pcm16ToAudioBuffer(ctx, chunk);
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    if (this.gain) src.connect(this.gain);

    // Schedule strictly after the previous chunk to avoid overlap/gaps; if we've
    // fallen behind real time, snap to now.
    const startAt = Math.max(this.nextStartAt, ctx.currentTime);
    src.start(startAt);
    this.nextStartAt = startAt + buffer.duration;

    this.pending += 1;
    this.sources.add(src);
    src.onended = () => {
      this.sources.delete(src);
      this.pending = Math.max(0, this.pending - 1);
      if (this.pending === 0) {
        this.stopLevelLoop();
        this.callbacks.onDrained?.();
      }
    };

    this.startLevelLoop();
  }

  /** Convert raw 16 kHz mono Int16 LE PCM into a 1-channel AudioBuffer. */
  private pcm16ToAudioBuffer(ctx: AudioContext, chunk: ArrayBuffer): AudioBuffer {
    const view = new DataView(chunk);
    const frames = Math.floor(chunk.byteLength / 2);
    const buffer = ctx.createBuffer(1, Math.max(1, frames), AUDIO_SAMPLE_RATE);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) {
      // little-endian signed 16-bit -> float [-1, 1)
      channel[i] = view.getInt16(i * 2, true) / 0x8000;
    }
    return buffer;
  }

  /** Hard-stop all playback and flush the queue (barge-in / interrupt). */
  stop(): void {
    for (const src of this.sources) {
      try {
        src.onended = null;
        src.stop();
        src.disconnect();
      } catch {
        /* already stopped */
      }
    }
    this.sources.clear();
    this.pending = 0;
    if (this.ctx) this.nextStartAt = this.ctx.currentTime;
    this.stopLevelLoop();
  }

  /** Alias for stop() — flush the queue without tearing down the context. */
  flush(): void {
    this.stop();
  }

  /** True while audio is scheduled/playing. */
  get isPlaying(): boolean {
    return this.pending > 0;
  }

  /** Release the AudioContext entirely. */
  dispose(): void {
    this.stop();
    this.callbacks.onLevel?.(0);
    if (this.ctx) {
      const ctx = this.ctx;
      this.ctx = null;
      this.gain = null;
      this.analyser = null;
      this.freqData = null;
      void ctx.close().catch(() => {
        /* already closed */
      });
    }
  }

  private startLevelLoop(): void {
    if (this.levelRaf) return;
    const tick = () => {
      if (!this.analyser || !this.freqData) {
        this.levelRaf = 0;
        return;
      }
      // getByteFrequencyData expects a Uint8Array<ArrayBuffer>; ours is exactly that.
      this.analyser.getByteFrequencyData(this.freqData as Uint8Array<ArrayBuffer>);
      let sum = 0;
      for (let i = 0; i < this.freqData.length; i++) sum += this.freqData[i];
      const avg = sum / this.freqData.length / 255; // 0..1
      const target = Math.min(1, avg * 1.6);
      this.level += (target - this.level) * 0.3;
      this.callbacks.onLevel?.(this.level);
      this.levelRaf = requestAnimationFrame(tick);
    };
    this.levelRaf = requestAnimationFrame(tick);
  }

  private stopLevelLoop(): void {
    if (this.levelRaf) {
      cancelAnimationFrame(this.levelRaf);
      this.levelRaf = 0;
    }
    this.level = 0;
    this.callbacks.onLevel?.(0);
  }
}
