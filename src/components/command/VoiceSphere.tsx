import { useEffect, useRef } from 'react';

/**
 * VoiceSphere — the hero of the Jarvis command center.
 *
 * A premium, dependency-free, audio-reactive energy orb built from two layered,
 * DPR-aware canvases:
 *
 *  1. A WebGL plasma CORE (GLSL fragment shader) — true volumetric depth via
 *     ray-marched-feeling 3D simplex noise: a hot near-white center falling
 *     through a glowing violet body to a luminous rim, with rotating internal
 *     turbulence, fresnel rim-light, a faint chromatic split (violet → magenta
 *     highlights → a thin cyan rim accent) and additive bloom. Gracefully falls
 *     back to a layered canvas-2D plasma if WebGL is unavailable.
 *
 *  2. A canvas-2D HUD overlay — multi-axis counter-rotating orbital rings (an
 *     orrery/gyroscope feel), a rotating wireframe latitude/longitude globe so
 *     it reads as a SPHERE not a circle, drifting energy motes / a nebula
 *     particle field, a reactive radial energy waveform, expanding shock rings
 *     on audio peaks, and cardinal HUD ticks.
 *
 * Everything is driven by `state` + a smoothed `level` (0..1):
 *  • idle      — slow calm breathing + gentle ambient drift (alive, not static)
 *  • listening — particles/energy converge inward + brighten, rings spin up
 *  • thinking  — faster swirl/turbulence, palette shifts toward magenta
 *  • speaking  — energy emits outward, waveform/pulse blooms with the TTS envelope
 *
 * Brand: violet #6C63FF is DOMINANT (core, glow, energy); #B25CFF magenta is the
 * 'thinking' shift; #03DAC6 cyan is a SPARING rim/peak accent only.
 *
 * Pure presentational: it consumes `state` + `level`. The voice service owns
 * producing those.
 */
export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface VoiceSphereProps {
  state: VoiceState;
  /** Smoothed audio amplitude 0..1 (mic level when listening, TTS envelope when speaking). */
  level: number;
  /** Rendered diameter in px (square). */
  size?: number;
}

type RGB = { r: number; g: number; b: number };

const CYAN: RGB = { r: 3, g: 218, b: 198 }; // #03DAC6 — sparing rim/peak accent
const VIOLET: RGB = { r: 108, g: 99, b: 255 }; // #6C63FF — brand base / dominant
const MAGENTA: RGB = { r: 178, g: 92, b: 255 }; // #B25CFF — 'thinking' shift
const WHITE: RGB = { r: 255, g: 255, b: 255 };

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function mix(a: RGB, b: RGB, t: number): RGB {
  return { r: lerp(a.r, b.r, t), g: lerp(a.g, b.g, t), b: lerp(a.b, b.b, t) };
}
function rgba(c: RGB, a: number) {
  return `rgba(${c.r | 0},${c.g | 0},${c.b | 0},${a})`;
}
function clamp01(x: number) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/* ─────────────────────────────────────────────────────────────────────────
 * GLSL — volumetric plasma core.
 * 3D simplex noise → fbm turbulence sampled on a rotating sphere; fresnel rim
 * light; hot-core → violet body → bright rim ramp; chromatic split + bloom.
 * Audio (uLevel) swells the body, brightens the hot center and ripples the
 * surface; uTurb (thinking) accelerates the swirl and shifts hue to magenta.
 * ──────────────────────────────────────────────────────────────────────── */
const VERT_SRC = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG_SRC = `
precision highp float;

uniform vec2  uRes;
uniform float uTime;
uniform float uLevel;   // smoothed audio 0..1
uniform float uTurb;    // thinking turbulence 0..1
uniform float uActive;  // listening/speaking energy 0..1
uniform float uEmit;    // speaking outward emission 0..1
uniform float uConverge;// listening inward pull 0..1
uniform vec3  uViolet;
uniform vec3  uMagenta;
uniform vec3  uCyan;
uniform vec3  uHot;

// ── Ashima 3D simplex noise (public domain) ──
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(
        i.z+vec4(0.0,i1.z,i2.z,1.0))
      + i.y+vec4(0.0,i1.y,i2.y,1.0))
      + i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

float fbm(vec3 p){
  float a=0.5, f=0.0;
  for(int i=0;i<5;i++){ f+=a*snoise(p); p*=2.02; a*=0.5; }
  return f;
}

mat3 rotY(float a){ float c=cos(a),s=sin(a); return mat3(c,0.,s, 0.,1.,0., -s,0.,c); }
mat3 rotX(float a){ float c=cos(a),s=sin(a); return mat3(1.,0.,0., 0.,c,-s, 0.,s,c); }

void main(){
  // centered, aspect-correct coords; sphere radius ~0.78 of half-min
  vec2 uv = (gl_FragCoord.xy*2.0 - uRes) / min(uRes.x, uRes.y);
  float r = length(uv);

  float coreR = 0.62 + uLevel*0.10;          // audio swells the body
  float edge  = 1.0 - smoothstep(coreR-0.02, coreR+0.10, r);

  // reconstruct a sphere normal (z out of screen) for fresnel + 3D sampling
  float z2 = max(coreR*coreR - r*r, 0.0);
  vec3  nrm = vec3(uv, sqrt(z2)) / max(coreR, 1e-3);
  float fres = pow(1.0 - clamp(nrm.z, 0.0, 1.0), 2.2); // rim brightening

  float swirl = uTime*(0.18 + uTurb*0.55);
  mat3 rot = rotY(swirl) * rotX(swirl*0.6 + 0.4);

  // outward/inward drift of the turbulence with speaking/listening
  float radialDrift = uTime*(0.15 + uTurb*0.4) - uEmit*uTime*0.5 + uConverge*uTime*0.5;
  vec3 sp = rot * (nrm * (1.6 + uTurb*0.6));
  sp.z += radialDrift;

  float n  = fbm(sp + uTime*0.08);
  float n2 = fbm(sp*2.3 - uTime*0.13 + 11.0);
  float turb = (n*0.65 + n2*0.35);
  turb = turb*0.5 + 0.5;                      // 0..1

  // audio ripple riding the surface
  turb += sin((r*22.0) - uTime*6.0) * 0.06 * (uActive + uEmit);

  float depth = clamp(nrm.z, 0.0, 1.0);

  // ── iridescent body — an oil-slick / holographic sheen that shifts violet →
  //    magenta → (sparing) cyan across depth, surface angle and slow time. This
  //    is what reads as "modern": the sphere is never one flat purple. ──
  float ang  = atan(uv.y, uv.x);
  float irid = 0.5 + 0.5*sin(depth*3.4 + turb*2.2 + uTime*0.5 + ang*0.6);
  vec3 sheen = mix(uViolet, uMagenta, smoothstep(0.15, 0.85, irid));
  sheen = mix(sheen, uCyan, smoothstep(0.72, 1.0, irid) * 0.4);   // sparing cyan kiss
  vec3 body  = mix(uViolet, sheen, 0.62 + turb*0.30);
  body = mix(body, uMagenta, uTurb*0.6);                          // 'thinking' shift

  // turbulent plasma luminance — punchier contrast than before
  vec3 col = body * (0.30 + turb*1.05);
  col += uViolet * pow(turb, 3.0) * 0.75;                         // glowing filaments

  // hot pulsing heart — crisp + bright (not a muddy smear)
  float hotMask = pow(smoothstep(0.42, 1.0, depth), 1.7) * (0.72 + uLevel*0.95);
  col = mix(col, uHot, hotMask);

  // moving specular glint → glossy 3D-sphere read (the big "cool" upgrade)
  vec3  L = normalize(vec3(0.42, 0.58, 0.85));
  float spec = pow(max(dot(nrm, L), 0.0), 24.0);
  col += vec3(1.0) * spec * (0.55 + uActive*0.45);
  float specWide = pow(max(dot(nrm, L), 0.0), 4.0) * 0.18;        // soft sheen
  col += mix(uViolet, vec3(1.0), 0.6) * specWide;

  // bright iridescent fresnel rim
  vec3 rimCol = mix(uViolet, mix(uMagenta, uCyan, 0.35), smoothstep(0.55, 1.0, fres));
  col += rimCol * fres * (1.35 + uActive*0.6 + uEmit*0.6);

  // chromatic split at the limb (fake refraction)
  float ca = fres * 0.16;
  col.r += ca * 0.7;
  col.b += ca * 0.25;

  col *= edge;

  // punchy outer bloom / atmosphere
  float halo = exp(-pow(max(r-coreR, 0.0)*3.6, 1.5));
  vec3 haloCol = mix(uViolet, uMagenta, uTurb*0.6 + 0.18);
  col += haloCol * halo * (0.42 + uLevel*0.65 + uActive*0.28);
  col += uViolet * uEmit * halo * 0.75;                           // speaking flash

  // saturation-preserving ACES-ish tonemap — kills the old muddy desaturation
  col = (col*(2.51*col+0.03))/(col*(2.43*col+0.59)+0.14);
  float alpha = clamp(edge + halo*0.95, 0.0, 1.0);
  gl_FragColor = vec4(col, alpha);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

/** Builds the plasma-core GL program; returns null if anything fails. */
function initGL(gl: WebGLRenderingContext) {
  const vs = compile(gl, gl.VERTEX_SHADER, VERT_SRC);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    gl.deleteProgram(prog);
    return null;
  }
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  gl.useProgram(prog);

  const u = (n: string) => gl.getUniformLocation(prog, n);
  const uniforms = {
    uRes: u('uRes'),
    uTime: u('uTime'),
    uLevel: u('uLevel'),
    uTurb: u('uTurb'),
    uActive: u('uActive'),
    uEmit: u('uEmit'),
    uConverge: u('uConverge'),
    uViolet: u('uViolet'),
    uMagenta: u('uMagenta'),
    uCyan: u('uCyan'),
    uHot: u('uHot'),
  };
  const norm = (c: RGB): [number, number, number] => [c.r / 255, c.g / 255, c.b / 255];
  gl.uniform3fv(uniforms.uViolet, norm(VIOLET));
  gl.uniform3fv(uniforms.uMagenta, norm(MAGENTA));
  gl.uniform3fv(uniforms.uCyan, norm(CYAN));
  gl.uniform3fv(uniforms.uHot, norm({ r: 235, g: 225, b: 255 }));

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // additive-feel bloom over the dark page

  return { uniforms };
}

/** A drifting energy mote / particle in the nebula field. */
interface Mote {
  ang: number; // orbital angle
  rad: number; // orbital radius (fraction of baseR)
  speed: number; // angular speed
  size: number;
  phase: number; // twinkle phase
  tilt: number; // out-of-plane bob factor
}

export default function VoiceSphere({ state, level, size = 360 }: VoiceSphereProps) {
  const glCanvasRef = useRef<HTMLCanvasElement>(null);
  const hudCanvasRef = useRef<HTMLCanvasElement>(null);
  // Refs so the RAF loop reads live values without re-subscribing.
  const stateRef = useRef(state);
  const levelRef = useRef(level);
  stateRef.current = state;
  levelRef.current = level;

  useEffect(() => {
    const glCanvas = glCanvasRef.current;
    const hudCanvas = hudCanvasRef.current;
    if (!glCanvas || !hudCanvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = Math.round(size * dpr);

    // ── GL core (with graceful canvas-2D fallback) ──
    glCanvas.width = px;
    glCanvas.height = px;
    const gl = (glCanvas.getContext('webgl', { premultipliedAlpha: false, antialias: true, alpha: true }) ||
      glCanvas.getContext('experimental-webgl', { premultipliedAlpha: false, antialias: true, alpha: true })) as
      | WebGLRenderingContext
      | null;
    const glState = gl ? initGL(gl) : null;
    const fallback2d = !glState ? glCanvas.getContext('2d') : null;
    if (fallback2d) fallback2d.scale(dpr, dpr);

    // ── HUD overlay (canvas-2D) ──
    hudCanvas.width = px;
    hudCanvas.height = px;
    const hud = hudCanvas.getContext('2d');
    if (!hud) return;
    hud.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const baseR = size * 0.24;

    // particle field — seeded once per mount/size
    const motes: Mote[] = Array.from({ length: 46 }, () => ({
      ang: Math.random() * Math.PI * 2,
      rad: 1.25 + Math.random() * 1.55,
      speed: (0.1 + Math.random() * 0.35) * (Math.random() < 0.5 ? 1 : -1),
      size: 0.6 + Math.random() * 1.9,
      phase: Math.random() * Math.PI * 2,
      tilt: 0.25 + Math.random() * 0.7,
    }));

    let raf = 0;
    const start = performance.now();
    let smooth = 0; // eased level
    let turbE = 0; // eased turbulence (thinking)
    let activeE = 0; // eased active energy
    let emitE = 0; // eased speaking emission
    let convE = 0; // eased listening convergence
    const shocks: { r: number; a: number; w: number }[] = []; // expanding peak rings
    let lastPeakAt = 0;

    /* Canvas-2D plasma fallback — layered radial gradients with a touch of
       per-frame turbulence so the orb still has depth without WebGL. */
    const drawFallbackCore = (
      g: CanvasRenderingContext2D,
      t: number,
      accent: RGB,
      coreR: number,
      energy: number
    ) => {
      const TWO_PI = Math.PI * 2;
      g.save();
      g.translate(cx, cy);
      g.globalCompositeOperation = 'lighter';

      // outer atmosphere bloom (behind the body) — violet → magenta falloff
      const bloom = g.createRadialGradient(0, 0, coreR * 0.55, 0, 0, coreR * 2.5);
      bloom.addColorStop(0, rgba(accent, 0.3 + energy * 0.28));
      bloom.addColorStop(0.5, rgba(mix(accent, MAGENTA, 0.5), 0.12 + energy * 0.14));
      bloom.addColorStop(1, rgba(accent, 0));
      g.fillStyle = bloom;
      g.beginPath();
      g.arc(0, 0, coreR * 2.5, 0, TWO_PI);
      g.fill();

      // body: hot near-white heart → violet body → IRIDESCENT magenta → sparing cyan rim
      const grad = g.createRadialGradient(-coreR * 0.28, -coreR * 0.3, coreR * 0.04, 0, 0, coreR);
      grad.addColorStop(0, rgba(mix(WHITE, accent, 0.12), 1.0));
      grad.addColorStop(0.26, rgba(mix(accent, WHITE, 0.38), 0.96));
      grad.addColorStop(0.58, rgba(accent, 0.92));
      grad.addColorStop(0.82, rgba(mix(accent, MAGENTA, 0.55), 0.72));
      grad.addColorStop(0.95, rgba(mix(MAGENTA, CYAN, 0.4), 0.4));
      grad.addColorStop(1, rgba(accent, 0));
      g.fillStyle = grad;
      g.beginPath();
      g.arc(0, 0, coreR, 0, TWO_PI);
      g.fill();

      // colorful drifting turbulence (alternating magenta / sparing cyan)
      for (let i = 0; i < 6; i++) {
        const a = t * (0.3 + i * 0.11) + (i * TWO_PI) / 6;
        const rr = coreR * (0.2 + 0.1 * i);
        const bx = Math.cos(a) * coreR * 0.34;
        const by = Math.sin(a * 1.3) * coreR * 0.3;
        const bc = i % 2 ? mix(accent, MAGENTA, 0.6) : mix(accent, CYAN, 0.3);
        const bg = g.createRadialGradient(bx, by, 0, bx, by, rr);
        bg.addColorStop(0, rgba(bc, 0.26 + energy * 0.22));
        bg.addColorStop(1, rgba(bc, 0));
        g.fillStyle = bg;
        g.beginPath();
        g.arc(bx, by, rr, 0, TWO_PI);
        g.fill();
      }

      // crisp off-center specular glint → glossy 3D-sphere read
      const sx = -coreR * 0.34;
      const sy = -coreR * 0.38;
      const spec = g.createRadialGradient(sx, sy, 0, sx, sy, coreR * 0.36);
      spec.addColorStop(0, rgba(WHITE, 0.85));
      spec.addColorStop(0.5, rgba(WHITE, 0.16));
      spec.addColorStop(1, rgba(WHITE, 0));
      g.fillStyle = spec;
      g.beginPath();
      g.arc(sx, sy, coreR * 0.36, 0, TWO_PI);
      g.fill();

      // bright iridescent rim ring
      g.lineWidth = Math.max(1.5, coreR * 0.025);
      g.strokeStyle = rgba(mix(accent, CYAN, 0.3), 0.4 + energy * 0.3);
      g.beginPath();
      g.arc(0, 0, coreR * 0.99, 0, TWO_PI);
      g.stroke();

      g.restore();
    };

    const render = (now: number) => {
      const t = (now - start) / 1000;
      const st = stateRef.current;
      const lvl = clamp01(levelRef.current);
      const thinking = st === 'thinking';
      const listening = st === 'listening';
      const speaking = st === 'speaking';
      const active = listening || speaking;

      // ── eased drivers (60fps-smooth, frame-rate-tolerant) ──
      smooth += (lvl - smooth) * 0.16;
      turbE += ((thinking ? 1 : 0) - turbE) * 0.05;
      activeE += ((active ? 1 : 0) - activeE) * 0.08;
      emitE += ((speaking ? 0.7 + smooth * 0.6 : 0) - emitE) * 0.1;
      convE += ((listening ? 0.6 + smooth * 0.5 : 0) - convE) * 0.08;

      // breathing baseline keeps idle alive
      const breathe = 1 + Math.sin(t * 1.5) * 0.035;
      // overall visible "energy" for HUD intensity
      const energy = thinking ? 0.55 + 0.15 * Math.sin(t * 3) : st === 'idle' ? 0.34 + 0.08 * Math.sin(t * 1.4) : 0.45 + smooth * 0.6;

      // ── palette per state (violet dominant; magenta on thinking) ──
      const accent = mix(VIOLET, MAGENTA, turbE * (0.55 + 0.15 * Math.sin(t * 3)));
      const accentBright = mix(accent, mix(WHITE, accent, 0.4), 0.35 * activeE);
      const rimHi = mix(accent, CYAN, 0.5); // sparing cyan-leaning highlight

      // ════════════════ LAYER 1 — plasma core ════════════════
      if (glState && gl) {
        gl.viewport(0, 0, px, px);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        const u = glState.uniforms;
        gl.uniform2f(u.uRes, px, px);
        gl.uniform1f(u.uTime, t);
        gl.uniform1f(u.uLevel, smooth * (active ? 1 : 0.55) + (st === 'idle' ? 0.17 + 0.06 * Math.sin(t * 1.4) : 0.04));
        gl.uniform1f(u.uTurb, turbE);
        gl.uniform1f(u.uActive, activeE);
        gl.uniform1f(u.uEmit, emitE);
        gl.uniform1f(u.uConverge, convE);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      } else if (fallback2d) {
        fallback2d.clearRect(0, 0, size, size);
        const coreR = baseR * breathe * (1 + smooth * 0.22);
        drawFallbackCore(fallback2d, t, accent, coreR, energy);
      }

      // ════════════════ LAYER 2 — HUD overlay ════════════════
      hud.clearRect(0, 0, size, size);
      hud.save();
      hud.translate(cx, cy);

      // ── holographic conic sweep ──
      hud.save();
      hud.globalCompositeOperation = 'lighter';
      hud.rotate(t * (thinking ? 1.0 : 0.3));
      const sweep = hud.createConicGradient(0, 0, 0);
      sweep.addColorStop(0, rgba(accent, 0));
      sweep.addColorStop(0.05, rgba(accent, 0.14 + energy * 0.1));
      sweep.addColorStop(0.13, rgba(accent, 0));
      sweep.addColorStop(1, rgba(accent, 0));
      hud.fillStyle = sweep;
      hud.beginPath();
      hud.arc(0, 0, baseR * 2.8, 0, Math.PI * 2);
      hud.fill();
      hud.restore();

      // ── nebula particle field / energy motes (behind rings) ──
      hud.save();
      hud.globalCompositeOperation = 'lighter';
      for (const m of motes) {
        m.ang += m.speed * 0.01 * (1 + turbE * 1.6 + activeE * 0.5);
        // listening pulls motes inward; speaking pushes them out; idle drifts
        const pull = 1 - convE * 0.32 + emitE * 0.25;
        const orbit = baseR * m.rad * pull;
        // fake 3D: bob the y by a tilt so the field reads spherical, not flat
        const x = Math.cos(m.ang) * orbit;
        const y = Math.sin(m.ang) * orbit * (1 - m.tilt * 0.5) + Math.sin(t * 0.6 + m.phase) * baseR * 0.08 * m.tilt;
        const tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 2.2 + m.phase));
        const a = tw * (0.18 + energy * 0.4) * (m.rad < 2.0 ? 1 : 0.6);
        const ms = m.size * (1 + smooth * 0.6);
        const mg = hud.createRadialGradient(x, y, 0, x, y, ms * 2.4);
        const mc = m.rad > 2.4 ? rimHi : accentBright;
        mg.addColorStop(0, rgba(mc, a));
        mg.addColorStop(1, rgba(mc, 0));
        hud.fillStyle = mg;
        hud.beginPath();
        hud.arc(x, y, ms * 2.4, 0, Math.PI * 2);
        hud.fill();
      }
      hud.restore();

      // ── wireframe latitude/longitude globe (reads as a SPHERE) ──
      const globeR = baseR * 1.06 * breathe * (1 + smooth * 0.12);
      const spin = t * (0.25 + turbE * 0.5);
      hud.save();
      hud.globalCompositeOperation = 'lighter';
      hud.lineWidth = 0.8;
      // longitudes — ellipses whose width tracks a rotating phase
      for (let i = 0; i < 6; i++) {
        const ph = spin + (i / 6) * Math.PI;
        const w = Math.abs(Math.cos(ph));
        hud.strokeStyle = rgba(accent, (0.04 + 0.12 * w) * (0.6 + energy * 0.6));
        hud.beginPath();
        hud.ellipse(0, 0, Math.max(0.5, globeR * w), globeR, 0, 0, Math.PI * 2);
        hud.stroke();
      }
      // latitudes — stacked horizontal rings, foreshortened by tilt
      const tilt = 0.42;
      for (let k = -2; k <= 2; k++) {
        const lat = (k / 3) * (Math.PI / 2);
        const ry = globeR * Math.cos(lat) * tilt;
        const yo = globeR * Math.sin(lat);
        hud.strokeStyle = rgba(accent, 0.07 * (0.7 + energy * 0.6));
        hud.beginPath();
        hud.ellipse(0, yo, globeR * Math.cos(lat), Math.max(0.5, ry), 0, 0, Math.PI * 2);
        hud.stroke();
      }
      hud.restore();

      // ── multi-axis counter-rotating orbital rings (orrery) ──
      // Each ring lives on its own 3D tilt → drawn as a rotated, scaled ellipse.
      const rings = [
        { r: 1.5, speed: 0.5, dir: 1, tiltX: 0.32, tiltZ: 0.5, seg: 40, gap: 0.34, w: 1.4, hi: false },
        { r: 1.9, speed: 0.3, dir: -1, tiltX: 0.62, tiltZ: -0.9, seg: 64, gap: 0.42, w: 1.0, hi: true },
        { r: 2.3, speed: 0.16, dir: 1, tiltX: 0.18, tiltZ: 1.7, seg: 22, gap: 0.3, w: 2.0, hi: false },
      ];
      hud.globalCompositeOperation = 'lighter';
      for (const ring of rings) {
        const rr = baseR * ring.r * (1 + smooth * 0.06);
        const ry = rr * ring.tiltX; // foreshortened minor axis = 3D tilt
        const col = ring.hi ? rimHi : accent;
        hud.save();
        hud.rotate(ring.tiltZ + t * ring.speed * ring.dir * (1 + turbE * 1.6));
        hud.lineWidth = ring.w;
        hud.strokeStyle = rgba(col, 0.45 + energy * 0.32);
        hud.shadowColor = rgba(col, 0.7);
        hud.shadowBlur = 9;
        const segs = ring.seg;
        for (let i = 0; i < segs; i++) {
          const a0 = (i / segs) * Math.PI * 2;
          const a1 = a0 + (Math.PI * 2 / segs) * (1 - ring.gap);
          hud.beginPath();
          hud.ellipse(0, 0, rr, Math.max(1, ry), 0, a0, a1);
          hud.stroke();
        }
        // a couple of bright orbiting nodes on the ring path
        for (let n = 0; n < 2; n++) {
          const na = t * ring.speed * 1.6 * ring.dir + (n * Math.PI);
          const nx = Math.cos(na) * rr;
          const ny = Math.sin(na) * ry;
          const ng = hud.createRadialGradient(nx, ny, 0, nx, ny, ring.w * 4);
          ng.addColorStop(0, rgba(mix(col, WHITE, 0.4), 0.9));
          ng.addColorStop(1, rgba(col, 0));
          hud.fillStyle = ng;
          hud.beginPath();
          hud.arc(nx, ny, ring.w * 4, 0, Math.PI * 2);
          hud.fill();
        }
        hud.restore();
      }
      hud.shadowBlur = 0;

      // ── reactive radial energy waveform ──
      if (active) {
        const bars = 120;
        const ampR = globeR * (1.04 + smooth * 0.45);
        const drawWave = (rOffset: number, jitter: number) => {
          hud.beginPath();
          for (let i = 0; i <= bars; i++) {
            const ang = (i / bars) * Math.PI * 2;
            const noise =
              Math.sin(ang * 6 + t * 6) * 0.5 +
              Math.sin(ang * 13 - t * 4) * 0.3 +
              Math.sin(ang * 3 + t * 2 + jitter) * 0.2;
            const spike = baseR * (0.06 + smooth * 0.55) * (0.5 + 0.5 * noise);
            const r = ampR + spike + rOffset;
            const x = Math.cos(ang) * r;
            const y = Math.sin(ang) * r;
            if (i === 0) hud.moveTo(x, y);
            else hud.lineTo(x, y);
          }
          hud.closePath();
        };
        hud.globalCompositeOperation = 'lighter';
        // soft glow pass
        hud.lineWidth = 3.5;
        hud.strokeStyle = rgba(accent, 0.1 + smooth * 0.15);
        drawWave(0, 0);
        hud.stroke();
        // sparing cyan inner ghost
        hud.lineWidth = 1;
        hud.strokeStyle = rgba(rimHi, 0.2 + smooth * 0.18);
        drawWave(-baseR * 0.05, 1.7);
        hud.stroke();
        // crisp violet primary
        hud.lineWidth = 1.6;
        hud.strokeStyle = rgba(accentBright, 0.6 + smooth * 0.2);
        drawWave(0, 0);
        hud.stroke();
      }

      // ── expanding shock rings on audio peaks ──
      if (active && smooth > 0.5 && now - lastPeakAt > 200) {
        shocks.push({ r: globeR * 1.04, a: 0.55, w: 2.2 });
        lastPeakAt = now;
      }
      hud.globalCompositeOperation = 'lighter';
      for (let i = shocks.length - 1; i >= 0; i--) {
        const s = shocks[i];
        s.r += 2.6;
        s.a -= 0.013;
        s.w *= 0.985;
        if (s.a <= 0) {
          shocks.splice(i, 1);
          continue;
        }
        hud.beginPath();
        hud.arc(0, 0, s.r, 0, Math.PI * 2);
        hud.lineWidth = Math.max(0.5, s.w);
        // peak rings are the sparing cyan accent for contrast against violet
        hud.strokeStyle = rgba(CYAN, s.a);
        hud.stroke();
      }

      // ── cardinal HUD ticks ──
      hud.globalCompositeOperation = 'source-over';
      hud.strokeStyle = rgba(accent, 0.5 + energy * 0.2);
      hud.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2 + Math.PI / 4 + t * 0.05;
        const r0 = baseR * 2.55;
        const r1 = baseR * 2.68;
        hud.beginPath();
        hud.moveTo(Math.cos(ang) * r0, Math.sin(ang) * r0);
        hud.lineTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
        hud.stroke();
      }

      hud.restore();
      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf);
      if (gl) {
        const ext = gl.getExtension('WEBGL_lose_context');
        ext?.loseContext();
      }
    };
  }, [size]);

  return (
    <div
      style={{ position: 'relative', width: size, height: size }}
      role="img"
      aria-label={`Voice assistant orb — ${state}`}
    >
      <canvas ref={glCanvasRef} style={{ position: 'absolute', inset: 0, width: size, height: size, display: 'block' }} />
      <canvas
        ref={hudCanvasRef}
        style={{ position: 'absolute', inset: 0, width: size, height: size, display: 'block' }}
      />
    </div>
  );
}
