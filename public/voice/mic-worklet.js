/* eslint-disable */
/**
 * mic-worklet.js — AudioWorkletProcessor for voice capture.
 *
 * Runs in the AudioWorkletGlobalScope (a separate realm: no DOM, no window, no
 * imports). Loaded via `audioContext.audioWorklet.addModule(<url>)`. It receives
 * the mic graph's native-rate mono float32 frames, linearly downsamples them to
 * 16 kHz, converts to signed 16-bit little-endian PCM, batches into ~20 ms
 * chunks, and posts each chunk's ArrayBuffer (transferred, zero-copy) back to
 * the main thread along with a smoothed RMS level for the sphere.
 *
 * The host AudioContext is created at 16 kHz where the browser allows it, in
 * which case `outRate === inRate` and the resampler is a pass-through. We still
 * resample defensively because some browsers ignore the requested sampleRate.
 */

const TARGET_RATE = 16000;
// ~20 ms of 16 kHz audio = 320 samples per emitted chunk.
const CHUNK_SAMPLES = 320;

class MicProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // Fractional read cursor into the (conceptual) resampled stream.
    this._resamplePos = 0;
    // Accumulator of resampled float samples awaiting chunking.
    this._acc = [];
    // Smoothed RMS level (0..1-ish) for the UI sphere.
    this._level = 0;
    this._lastLevelPost = 0;
  }

  /**
   * @param {Float32Array[][]} inputs
   * @returns {boolean} keep processor alive
   */
  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const channel = input[0];
    if (!channel || channel.length === 0) return true;

    const inRate = sampleRate; // AudioWorkletGlobalScope global
    const ratio = inRate / TARGET_RATE;

    // ── compute block RMS for the level meter ──────────────────────────
    let sumSq = 0;
    for (let i = 0; i < channel.length; i++) sumSq += channel[i] * channel[i];
    const rms = Math.sqrt(sumSq / channel.length);
    // Map RMS to a perceptually useful 0..1 with gentle gain + smoothing.
    const target = Math.min(1, rms * 4);
    this._level += (target - this._level) * 0.25;

    // Throttle level posts to ~30 Hz to avoid flooding the message port.
    const nowMs = currentTime * 1000;
    if (nowMs - this._lastLevelPost > 33) {
      this._lastLevelPost = nowMs;
      this.port.postMessage({ type: 'level', level: this._level });
    }

    // ── linear-interpolate down to TARGET_RATE ─────────────────────────
    // pos walks the input buffer in steps of `ratio`; relative to this block.
    let pos = this._resamplePos;
    while (pos < channel.length) {
      const i0 = Math.floor(pos);
      const i1 = Math.min(i0 + 1, channel.length - 1);
      const frac = pos - i0;
      const sample = channel[i0] * (1 - frac) + channel[i1] * frac;
      this._acc.push(sample);
      pos += ratio;
    }
    // Carry the fractional remainder into the next block.
    this._resamplePos = pos - channel.length;

    // ── emit fixed-size Int16 PCM chunks ───────────────────────────────
    while (this._acc.length >= CHUNK_SAMPLES) {
      const slice = this._acc.splice(0, CHUNK_SAMPLES);
      const pcm = new Int16Array(CHUNK_SAMPLES);
      for (let i = 0; i < CHUNK_SAMPLES; i++) {
        let s = slice[i];
        if (s > 1) s = 1;
        else if (s < -1) s = -1;
        // 32767 / -32768 clamp for signed 16-bit.
        pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      // Transfer the underlying buffer (zero-copy) to the main thread.
      this.port.postMessage({ type: 'chunk', buffer: pcm.buffer }, [pcm.buffer]);
    }

    return true;
  }
}

registerProcessor('mic-processor', MicProcessor);
