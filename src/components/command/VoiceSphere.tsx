import { useEffect, useRef } from 'react';

/**
 * VoiceSphere — the hero of the Jarvis command center.
 *
 * A dependency-free canvas orb: a luminous core that breathes + reacts to the
 * audio `level`, wrapped in counter-rotating segmented HUD arcs, a holographic
 * sweep, a reactive radial waveform, and expanding pulse rings on voice peaks.
 * State drives the palette: idle (dim cyan), listening (bright cyan + outer
 * pulse), thinking (violet arcs accelerate), speaking (cyan waveform blooms).
 *
 * Pure presentational: it consumes `state` + `level` (0..1). The voice service
 * (mock now, tacticl-core WebSocket later) owns producing those.
 */
export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface VoiceSphereProps {
  state: VoiceState;
  /** Smoothed audio amplitude 0..1 (mic level when listening, TTS envelope when speaking). */
  level: number;
  /** Rendered diameter in px (square). */
  size?: number;
}

const CYAN = { r: 3, g: 218, b: 198 }; // #03DAC6
const VIOLET = { r: 108, g: 99, b: 255 }; // #6C63FF

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function mix(a: typeof CYAN, b: typeof CYAN, t: number) {
  return { r: lerp(a.r, b.r, t), g: lerp(a.g, b.g, t), b: lerp(a.b, b.b, t) };
}
function rgba(c: { r: number; g: number; b: number }, a: number) {
  return `rgba(${c.r | 0},${c.g | 0},${c.b | 0},${a})`;
}

export default function VoiceSphere({ state, level, size = 360 }: VoiceSphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Refs so the RAF loop reads live values without re-subscribing.
  const stateRef = useRef(state);
  const levelRef = useRef(level);
  stateRef.current = state;
  levelRef.current = level;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const baseR = size * 0.22;

    let raf = 0;
    let start = performance.now();
    let smooth = 0; // eased level
    const pulses: { r: number; a: number }[] = []; // expanding peak rings
    let lastPeakAt = 0;

    const render = (now: number) => {
      const t = (now - start) / 1000;
      const st = stateRef.current;
      const lvl = Math.max(0, Math.min(1, levelRef.current));
      smooth += (lvl - smooth) * 0.18;

      // palette per state
      const thinking = st === 'thinking';
      const active = st === 'listening' || st === 'speaking';
      const accent = mix(CYAN, VIOLET, thinking ? 0.85 : active ? 0.12 : 0.35);
      const energy = thinking ? 0.45 + 0.15 * Math.sin(t * 3) : st === 'idle' ? 0.18 : 0.35 + smooth * 0.65;

      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.translate(cx, cy);

      // ── ambient bloom ──────────────────────────────────────────────
      const bloom = ctx.createRadialGradient(0, 0, baseR * 0.2, 0, 0, baseR * 3.4);
      bloom.addColorStop(0, rgba(accent, 0.18 + energy * 0.22));
      bloom.addColorStop(0.5, rgba(accent, 0.05));
      bloom.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bloom;
      ctx.fillRect(-cx, -cy, size, size);

      // ── holographic sweep (rotating soft wedge) ────────────────────
      ctx.save();
      ctx.rotate(t * (thinking ? 1.1 : 0.35));
      const sweep = ctx.createConicGradient(0, 0, 0);
      sweep.addColorStop(0, rgba(accent, 0));
      sweep.addColorStop(0.06, rgba(accent, 0.16 + energy * 0.12));
      sweep.addColorStop(0.14, rgba(accent, 0));
      sweep.addColorStop(1, rgba(accent, 0));
      ctx.fillStyle = sweep;
      ctx.beginPath();
      ctx.arc(0, 0, baseR * 2.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ── segmented HUD arcs (counter-rotating) ──────────────────────
      const arcs = [
        { r: baseR * 1.55, speed: 0.6, dir: 1, span: 1.7, seg: 34, w: 1.5 },
        { r: baseR * 1.95, speed: 0.32, dir: -1, span: 2.5, seg: 60, w: 1 },
        { r: baseR * 2.35, speed: 0.18, dir: 1, span: 0.9, seg: 18, w: 2 },
      ];
      for (const arc of arcs) {
        ctx.save();
        ctx.rotate(t * arc.speed * arc.dir * (thinking ? 2.2 : 1));
        ctx.lineWidth = arc.w;
        ctx.strokeStyle = rgba(accent, 0.5 + energy * 0.3);
        ctx.shadowColor = rgba(accent, 0.6);
        ctx.shadowBlur = 8;
        const segs = arc.seg;
        const gap = 0.32;
        for (let i = 0; i < segs; i++) {
          const a0 = (i / segs) * arc.span;
          const a1 = a0 + (arc.span / segs) * (1 - gap);
          ctx.beginPath();
          ctx.arc(0, 0, arc.r, a0, a1);
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.shadowBlur = 0;

      // ── reactive radial waveform ───────────────────────────────────
      if (active) {
        const bars = 96;
        const ampR = baseR * (1.02 + smooth * 0.5);
        ctx.beginPath();
        for (let i = 0; i <= bars; i++) {
          const ang = (i / bars) * Math.PI * 2;
          const noise =
            Math.sin(ang * 6 + t * 6) * 0.5 + Math.sin(ang * 13 - t * 4) * 0.3 + Math.sin(ang * 3 + t * 2) * 0.2;
          const spike = baseR * (0.08 + smooth * 0.55) * (0.5 + 0.5 * noise);
          const r = ampR + spike;
          const x = Math.cos(ang) * r;
          const y = Math.sin(ang) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = rgba(accent, 0.55);
        ctx.stroke();
      }

      // ── peak pulse rings ───────────────────────────────────────────
      if (active && smooth > 0.55 && now - lastPeakAt > 220) {
        pulses.push({ r: baseR * 1.1, a: 0.5 });
        lastPeakAt = now;
      }
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.r += 2.2;
        p.a -= 0.012;
        if (p.a <= 0) {
          pulses.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.lineWidth = 1;
        ctx.strokeStyle = rgba(accent, p.a);
        ctx.stroke();
      }

      // ── core sphere ────────────────────────────────────────────────
      const breathe = 1 + Math.sin(t * 1.6) * 0.03;
      const coreR = baseR * breathe * (1 + smooth * 0.22);
      const core = ctx.createRadialGradient(-coreR * 0.3, -coreR * 0.3, coreR * 0.1, 0, 0, coreR);
      core.addColorStop(0, rgba(mix(accent, { r: 255, g: 255, b: 255 }, 0.55), 0.95));
      core.addColorStop(0.45, rgba(accent, 0.85));
      core.addColorStop(1, rgba(accent, 0.04));
      ctx.fillStyle = core;
      ctx.shadowColor = rgba(accent, 0.8);
      ctx.shadowBlur = 28 + energy * 26;
      ctx.beginPath();
      ctx.arc(0, 0, coreR, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // inner latitude lines (gives the orb depth)
      ctx.strokeStyle = rgba({ r: 255, g: 255, b: 255 }, 0.12);
      ctx.lineWidth = 0.75;
      for (let k = -2; k <= 2; k++) {
        const ry = coreR * 0.9 * Math.cos((k / 3) * (Math.PI / 2));
        ctx.beginPath();
        ctx.ellipse(0, (coreR * 0.9 * k) / 3, coreR * 0.92, Math.max(2, ry), 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // ── cardinal HUD ticks ─────────────────────────────────────────
      ctx.strokeStyle = rgba(accent, 0.5);
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const r0 = baseR * 2.5;
        const r1 = baseR * 2.62;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * r0, Math.sin(ang) * r0);
        ctx.lineTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
        ctx.stroke();
      }

      ctx.restore();
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, display: 'block' }}
      role="img"
      aria-label={`Voice assistant orb — ${state}`}
    />
  );
}
