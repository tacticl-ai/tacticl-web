interface TacticlLogoProps {
  size?: number;
  animated?: boolean;
}

export default function TacticlLogo({ size = 40, animated = true }: TacticlLogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <defs>
        <linearGradient id="barGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="stemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#08081a" />
          <stop offset="100%" stopColor="#150a35" />
        </linearGradient>
      </defs>

      <style>
        {animated
          ? `
          @keyframes logoFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
          }
          @keyframes logoPulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
          }
          @keyframes dotPulse1 {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
          @keyframes dotPulse2 {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
          .logo-float { animation: logoFloat 3s ease-in-out infinite; }
          .logo-glow { animation: logoPulse 2.5s ease-in-out infinite; }
          .logo-dot1 { animation: dotPulse1 2s ease-in-out infinite; }
          .logo-dot2 { animation: dotPulse2 2s ease-in-out infinite 0.7s; }
        `
          : ''}
      </style>

      {/* Background */}
      <rect width="200" height="200" rx="40" fill="url(#bgGrad)" />

      {/* Top bar - back layers */}
      <rect x="55" y="68" width="90" height="4" rx="2" fill="url(#barGrad)" opacity={0.25} />
      <rect x="45" y="58" width="110" height="6" rx="3" fill="url(#barGrad)" opacity={0.5} />

      {/* Top bar - main */}
      <rect
        className={animated ? 'logo-float' : undefined}
        x="35"
        y="45"
        width="130"
        height="8"
        rx="4"
        fill="url(#barGrad)"
      />

      {/* Stem - side layers */}
      <rect x="82" y="85" width="16" height="65" rx="3" fill="url(#stemGrad)" opacity={0.2} />
      <rect x="102" y="85" width="16" height="65" rx="3" fill="url(#stemGrad)" opacity={0.2} />

      {/* Stem - main */}
      <rect x="88" y="78" width="24" height="80" rx="4" fill="url(#stemGrad)" />

      {/* Base glow */}
      <ellipse
        className={animated ? 'logo-glow' : undefined}
        cx="100"
        cy="162"
        rx="40"
        ry="4"
        fill="#8b5cf6"
        opacity={0.3}
      />

      {/* Accent dots */}
      <circle className={animated ? 'logo-dot1' : undefined} cx="40" cy="49" r="3" fill="#06b6d4" />
      <circle className={animated ? 'logo-dot2' : undefined} cx="160" cy="49" r="3" fill="#8b5cf6" />
      <circle cx="100" cy="162" r="4" fill="#ec4899" />
    </svg>
  );
}
