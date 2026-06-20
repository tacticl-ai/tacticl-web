import { useEffect, useRef } from 'react';
import type { VoiceState } from './VoiceSphere';
import './DataSphere.css';

/**
 * DataSphere — the "DATA-SPHERE+ ORB" (variant B) hero of the Jarvis command
 * center, ported VERBATIM from docs/mockups/command.html (the `ds-*` block).
 *
 * A holographic data-sphere: a breathing white-hot nucleus + flickering hot
 * ring behind an SVG wireframe globe (latitude/longitude ellipses, animated
 * meridians, glowing data arcs, a static lattice, pulsing data nodes, and
 * traveling pulse packets), wrapped in a glass core, a holographic scanline
 * shimmer, depth fog, an outer bloom halo + cyan corona, cardinal HUD ticks,
 * and three 3D-tilted orbiting rings each carrying a comet.
 *
 * State reactivity mirrors the mockup: `ds-state-{state}` is toggled onto BOTH
 * `.ds-orb` (heart/bloom/wire) and `.ds-stage` (rings/bloom/corona siblings).
 * A gentle pointer-parallax tilt leans the sphere toward the cursor.
 *
 * Pure presentational — consumes `state` only. Brand: violet #6C63FF dominant,
 * #B25CFF magenta is the 'thinking' shift, #03DAC6 / #15E0C8 cyan are sparing
 * accents. All colors/animations live in DataSphere.css.
 */
interface DataSphereProps {
  state: VoiceState;
  /** Optional explicit size (px or any CSS length). Defaults to the mockup's
   *  responsive `clamp(220px, min(100%, 40vmin), 420px)`. */
  size?: number | string;
}

export default function DataSphere({ state, size }: DataSphereProps) {
  const orbRef = useRef<HTMLDivElement>(null);

  // Gentle pointer-parallax tilt (mockup IIFE ~1085-1103): the sphere eases
  // toward the cursor via requestAnimationFrame. Cleaned up on unmount.
  useEffect(() => {
    const orb = orbRef.current;
    if (!orb) return;

    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 16;
      ty = (e.clientY / window.innerHeight - 0.5) * 16;
    };

    const frame = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      orb.style.transform =
        `translate(${cx.toFixed(2)}px,${cy.toFixed(2)}px) ` +
        `rotateX(${(-cy * 0.45).toFixed(2)}deg) ` +
        `rotateY(${(cx * 0.45).toFixed(2)}deg)`;
      raf = requestAnimationFrame(frame);
    };

    window.addEventListener('pointermove', onMove);
    raf = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const stateClass = `ds-state-${state}`;
  const stageStyle =
    size != null
      ? ({ ['--ds-size' as string]: typeof size === 'number' ? `${size}px` : size } as React.CSSProperties)
      : undefined;

  return (
    <div
      className={`ds-stage ${stateClass}`}
      style={stageStyle}
      role="img"
      aria-label={`Voice assistant orb — ${state}`}
    >
      {/* strengthened bloom halo (sibling of .ds-orb, reacts via .ds-stage state class) */}
      <div className="ds-bloom" />
      <div className="ds-corona" />

      {/* cardinal HUD ticks */}
      <div className="ds-hud-ring">
        <svg viewBox="0 0 400 400" aria-hidden="true">
          <g stroke="rgba(124,160,255,.5)" strokeWidth="1.4" fill="none">
            <line x1="200" y1="6" x2="200" y2="26" stroke="rgba(21,224,200,.8)" />
            <line x1="200" y1="374" x2="200" y2="394" stroke="rgba(21,224,200,.8)" />
            <line x1="6" y1="200" x2="26" y2="200" stroke="rgba(178,92,255,.8)" />
            <line x1="374" y1="200" x2="394" y2="200" stroke="rgba(178,92,255,.8)" />
          </g>
          <g stroke="rgba(124,160,255,.28)" strokeWidth="1">
            <line x1="200" y1="8" x2="200" y2="18" />
            <line x1="296" y1="22" x2="291" y2="32" />
            <line x1="378" y1="104" x2="368" y2="109" />
            <line x1="392" y1="200" x2="382" y2="200" />
            <line x1="378" y1="296" x2="368" y2="291" />
            <line x1="296" y1="378" x2="291" y2="368" />
            <line x1="200" y1="392" x2="200" y2="382" />
            <line x1="104" y1="378" x2="109" y2="368" />
            <line x1="22" y1="296" x2="32" y2="291" />
            <line x1="8" y1="200" x2="18" y2="200" />
            <line x1="22" y1="104" x2="32" y2="109" />
            <line x1="104" y1="22" x2="109" y2="32" />
          </g>
          <g fontFamily="JetBrains Mono, monospace" fontSize="9" fill="rgba(124,160,255,.55)" letterSpacing="1">
            <text x="200" y="44" textAnchor="middle">N</text>
            <text x="362" y="204" textAnchor="middle">E</text>
            <text x="200" y="364" textAnchor="middle">S</text>
            <text x="40" y="204" textAnchor="middle">W</text>
          </g>
        </svg>
      </div>

      <div ref={orbRef} className={`ds-orb ${stateClass}`}>
        <div className="ds-core" />

        {/* LIVING HEART: white-hot nucleus + flickering hot ring, BEHIND the
            wireframe globe, IN FRONT of the deep .ds-core */}
        <div className="ds-hotring" />
        <div className="ds-nucleus" />

        {/* SVG wireframe globe */}
        <div className="ds-globe-wrap">
          <svg viewBox="0 0 200 200" aria-hidden="true">
            <defs>
              <radialGradient id="dsGlobeFade" cx="42%" cy="38%" r="72%">
                <stop offset="0%" stopColor="#aab4ff" stopOpacity=".9" />
                <stop offset="55%" stopColor="#6c8bff" stopOpacity=".55" />
                <stop offset="100%" stopColor="#3a3f8a" stopOpacity=".18" />
              </radialGradient>
              <linearGradient id="dsArcGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#15E0C8" />
                <stop offset="100%" stopColor="#6C63FF" />
              </linearGradient>
              <linearGradient id="dsArcGrad2" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#B25CFF" />
                <stop offset="100%" stopColor="#15E0C8" />
              </linearGradient>
              <filter id="dsSoft" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="0.8" />
              </filter>
              <radialGradient id="dsNodeGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#15E0C8" />
                <stop offset="100%" stopColor="#15E0C8" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="dsNodeGlowV" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#8a86ff" />
                <stop offset="100%" stopColor="#6C63FF" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* outer sphere outline */}
            <circle cx="100" cy="100" r="92" fill="none" stroke="url(#dsGlobeFade)" strokeWidth="1.1" opacity=".85" />
            <circle cx="100" cy="100" r="92" fill="none" stroke="#15E0C8" strokeWidth="0.5" opacity=".25" />

            {/* parallels (latitude ellipses) */}
            <g className="ds-wire-stroke" fill="none" stroke="url(#dsGlobeFade)" strokeWidth="0.7" opacity=".6">
              <ellipse cx="100" cy="40" rx="55" ry="9" />
              <ellipse cx="100" cy="64" rx="78" ry="14" />
              <ellipse cx="100" cy="100" rx="92" ry="19" />
              <ellipse cx="100" cy="136" rx="78" ry="14" />
              <ellipse cx="100" cy="160" rx="55" ry="9" />
            </g>

            {/* meridians (longitude ellipses, vertical) — animate rx to fake rotation */}
            <g className="ds-wire-stroke" fill="none" stroke="url(#dsGlobeFade)" strokeWidth="0.7" opacity=".55">
              <ellipse cx="100" cy="100" rx="92" ry="92" />
              <ellipse cx="100" cy="100" rx="70" ry="92">
                <animate attributeName="rx" values="70;92;70;28;70" dur="13s" repeatCount="indefinite" />
                <animate attributeName="opacity" values=".55;.7;.55;.3;.55" dur="13s" repeatCount="indefinite" />
              </ellipse>
              <ellipse cx="100" cy="100" rx="40" ry="92">
                <animate attributeName="rx" values="40;72;92;72;40" dur="13s" repeatCount="indefinite" />
              </ellipse>
              <ellipse cx="100" cy="100" rx="14" ry="92">
                <animate attributeName="rx" values="14;48;78;48;14" dur="13s" repeatCount="indefinite" />
                <animate attributeName="opacity" values=".5;.65;.45;.65;.5" dur="13s" repeatCount="indefinite" />
              </ellipse>
            </g>

            {/* glowing data arcs that pulse (processing) */}
            <g fill="none" strokeWidth="1.3" opacity=".9">
              <path
                className="ds-arc"
                d="M55,58 Q100,20 148,72"
                stroke="url(#dsArcGrad)"
                strokeLinecap="round"
                strokeDasharray="6 140"
                strokeDashoffset="0"
              >
                <animate attributeName="stroke-dashoffset" values="0;-146" dur="2.6s" repeatCount="indefinite" />
              </path>
              <path
                className="ds-arc"
                d="M40,120 Q100,170 160,118"
                stroke="url(#dsArcGrad2)"
                strokeLinecap="round"
                strokeDasharray="5 150"
                strokeDashoffset="0"
              >
                <animate attributeName="stroke-dashoffset" values="0;-155" dur="3.1s" repeatCount="indefinite" />
              </path>
              <path
                className="ds-arc"
                d="M70,150 Q120,95 142,52"
                stroke="url(#dsArcGrad)"
                strokeLinecap="round"
                strokeDasharray="5 120"
                strokeDashoffset="0"
              >
                <animate attributeName="stroke-dashoffset" values="0;-125" dur="2.2s" repeatCount="indefinite" />
              </path>
              <path
                className="ds-arc"
                d="M58,90 Q150,80 150,140"
                stroke="url(#dsArcGrad2)"
                strokeLinecap="round"
                strokeDasharray="4 130"
                strokeDashoffset="0"
              >
                <animate attributeName="stroke-dashoffset" values="0;-134" dur="3.6s" repeatCount="indefinite" />
              </path>
            </g>

            {/* static faint connection lattice */}
            <g stroke="#6C63FF" strokeWidth="0.45" opacity=".35">
              <line x1="55" y1="58" x2="148" y2="72" />
              <line x1="40" y1="120" x2="160" y2="118" />
              <line x1="70" y1="150" x2="142" y2="52" />
              <line x1="58" y1="90" x2="150" y2="140" />
              <line x1="100" y1="35" x2="100" y2="165" />
            </g>

            {/* luminous data nodes (pulsing) */}
            <g>
              <circle className="ds-node ds-node-pulse" cx="55" cy="58" r="5" fill="url(#dsNodeGlow)">
                <animate attributeName="r" values="3;6;3" dur="2.4s" repeatCount="indefinite" />
              </circle>
              <circle cx="55" cy="58" r="1.6" fill="#fff" />

              <circle className="ds-node ds-node-pulse" cx="148" cy="72" r="5" fill="url(#dsNodeGlowV)">
                <animate attributeName="r" values="4;7;4" dur="3s" repeatCount="indefinite" begin="-0.6s" />
              </circle>
              <circle cx="148" cy="72" r="1.6" fill="#fff" />

              <circle className="ds-node ds-node-pulse" cx="40" cy="120" r="5" fill="url(#dsNodeGlow)">
                <animate attributeName="r" values="3;5.5;3" dur="2.8s" repeatCount="indefinite" begin="-1.1s" />
              </circle>
              <circle cx="40" cy="120" r="1.4" fill="#fff" />

              <circle className="ds-node ds-node-pulse" cx="160" cy="118" r="5" fill="url(#dsNodeGlowV)">
                <animate attributeName="r" values="3;6;3" dur="2.5s" repeatCount="indefinite" begin="-1.6s" />
              </circle>
              <circle cx="160" cy="118" r="1.6" fill="#fff" />

              <circle className="ds-node ds-node-pulse" cx="70" cy="150" r="4.5" fill="url(#dsNodeGlow)">
                <animate attributeName="r" values="2.5;5;2.5" dur="3.3s" repeatCount="indefinite" begin="-0.3s" />
              </circle>
              <circle cx="70" cy="150" r="1.4" fill="#fff" />

              <circle className="ds-node ds-node-pulse" cx="142" cy="52" r="4.5" fill="url(#dsNodeGlowV)">
                <animate attributeName="r" values="2.5;5.5;2.5" dur="2.7s" repeatCount="indefinite" begin="-2s" />
              </circle>
              <circle cx="142" cy="52" r="1.4" fill="#fff" />

              <circle className="ds-node ds-node-pulse" cx="100" cy="35" r="4" fill="url(#dsNodeGlow)">
                <animate attributeName="r" values="2.5;5;2.5" dur="3.4s" repeatCount="indefinite" begin="-1.4s" />
              </circle>
              <circle cx="100" cy="35" r="1.3" fill="#fff" />

              <circle className="ds-node ds-node-pulse" cx="100" cy="165" r="4" fill="url(#dsNodeGlowV)">
                <animate attributeName="r" values="2.5;5;2.5" dur="2.9s" repeatCount="indefinite" begin="-0.9s" />
              </circle>
              <circle cx="100" cy="165" r="1.3" fill="#fff" />
            </g>

            {/* traveling pulse packets along a meridian path */}
            <circle className="ds-packet" r="2.6" fill="#fff">
              <animateMotion dur="4s" repeatCount="indefinite" path="M100,35 Q150,100 100,165 Q50,100 100,35" />
            </circle>
            <circle className="ds-packet" r="2" fill="#15E0C8">
              <animateMotion
                dur="5.2s"
                repeatCount="indefinite"
                begin="-1.5s"
                path="M40,120 Q100,170 160,118 Q100,60 40,120"
              />
            </circle>
          </svg>
        </div>

        {/* holographic scanline shimmer over sphere */}
        <div className="ds-holo-scan" />
        <div className="ds-depth-fog" />
      </div>

      {/* orbiting elliptical rings with comet nodes */}
      <div className="ds-rings">
        <div className="ds-ring r1">
          <span className="ds-comet" />
        </div>
        <div className="ds-ring r2">
          <span className="ds-comet" />
        </div>
        <div className="ds-ring r3">
          <span className="ds-comet" />
        </div>
      </div>
    </div>
  );
}
