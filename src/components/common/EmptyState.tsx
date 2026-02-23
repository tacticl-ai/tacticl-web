import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import type { SvgIconComponent } from '@mui/icons-material';

type EmptyVariant = 'sparks' | 'devices' | 'social' | 'default';

interface EmptyStateProps {
  /** Pass an MUI icon component for custom icon display (backward-compat) */
  icon?: SvgIconComponent;
  /** Use a built-in variant with animated SVG art */
  variant?: EmptyVariant;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

/* ---- Inline SVG illustrations per variant ---- */

function SparksSvg() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes sparkFloat1 {
            0%, 100% { transform: translate(0, 0); opacity: 0.7; }
            50% { transform: translate(3px, -6px); opacity: 1; }
          }
          @keyframes sparkFloat2 {
            0%, 100% { transform: translate(0, 0); opacity: 0.5; }
            50% { transform: translate(-4px, -4px); opacity: 0.9; }
          }
          @keyframes sparkFloat3 {
            0%, 100% { transform: translate(0, 0); opacity: 0.4; }
            50% { transform: translate(2px, -8px); opacity: 0.8; }
          }
          @keyframes sparkGlow {
            0%, 100% { filter: drop-shadow(0 0 2px rgba(108,99,255,0.3)); }
            50% { filter: drop-shadow(0 0 8px rgba(108,99,255,0.6)); }
          }
        }
      `}</style>
      {/* Inbox shape */}
      <path
        d="M20 36 L48 20 L76 36 L76 72 Q76 76 72 76 L24 76 Q20 76 20 72 Z"
        stroke="#6C63FF"
        strokeWidth="2"
        fill="none"
        opacity="0.4"
      />
      <line x1="20" y1="36" x2="36" y2="52" stroke="#6C63FF" strokeWidth="2" opacity="0.3" />
      <line x1="76" y1="36" x2="60" y2="52" stroke="#6C63FF" strokeWidth="2" opacity="0.3" />
      {/* Floating particles */}
      <circle cx="30" cy="30" r="2" fill="#6C63FF" style={{ animation: 'sparkFloat1 3s ease-in-out infinite' }} />
      <circle cx="65" cy="25" r="1.5" fill="#9D97FF" style={{ animation: 'sparkFloat2 3.5s ease-in-out infinite' }} />
      <circle cx="48" cy="15" r="2.5" fill="#6C63FF" style={{ animation: 'sparkFloat3 4s ease-in-out infinite' }} />
      <circle cx="75" cy="40" r="1" fill="#9D97FF" style={{ animation: 'sparkFloat1 2.8s ease-in-out infinite 0.5s' }} />
      <circle cx="22" cy="50" r="1.5" fill="#6C63FF" style={{ animation: 'sparkFloat2 3.2s ease-in-out infinite 1s' }} />
      {/* Center star */}
      <g style={{ animation: 'sparkGlow 2.5s ease-in-out infinite' }}>
        <path d="M48 42 L50 47 L55 48 L50 49 L48 54 L46 49 L41 48 L46 47 Z" fill="#6C63FF" />
      </g>
    </svg>
  );
}

function DevicesSvg() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes devPulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.8; }
          }
          @keyframes devRing {
            0% { r: 20; opacity: 0.4; }
            100% { r: 38; opacity: 0; }
          }
        }
      `}</style>
      {/* Pulsing rings */}
      <circle cx="48" cy="46" r="20" stroke="#6C63FF" strokeWidth="1" fill="none" style={{ animation: 'devRing 2.5s ease-out infinite' }} />
      <circle cx="48" cy="46" r="20" stroke="#6C63FF" strokeWidth="1" fill="none" style={{ animation: 'devRing 2.5s ease-out infinite 0.8s' }} />
      <circle cx="48" cy="46" r="20" stroke="#6C63FF" strokeWidth="1" fill="none" style={{ animation: 'devRing 2.5s ease-out infinite 1.6s' }} />
      {/* Laptop shape */}
      <rect x="30" y="32" width="36" height="24" rx="3" stroke="#6C63FF" strokeWidth="2" fill="none" opacity="0.6" />
      <rect x="34" y="36" width="28" height="16" rx="1" fill="#6C63FF" opacity="0.1" />
      {/* Screen glow */}
      <rect x="34" y="36" width="28" height="16" rx="1" fill="#6C63FF" style={{ animation: 'devPulse 2s ease-in-out infinite' }} />
      {/* Base */}
      <path d="M24 58 L72 58 Q74 58 74 60 L74 62 Q74 64 72 64 L24 64 Q22 64 22 62 L22 60 Q22 58 24 58 Z" stroke="#6C63FF" strokeWidth="1.5" fill="none" opacity="0.4" />
      {/* Power indicator */}
      <circle cx="48" cy="44" r="2" fill="#6C63FF" style={{ animation: 'devPulse 1.5s ease-in-out infinite' }} />
    </svg>
  );
}

function SocialSvg() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes socFloat1 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(2px, -3px) rotate(5deg); }
            75% { transform: translate(-2px, 2px) rotate(-3deg); }
          }
          @keyframes socFloat2 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(-3px, -2px) rotate(-4deg); }
            66% { transform: translate(2px, 3px) rotate(3deg); }
          }
          @keyframes socFloat3 {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(3px, -4px); }
          }
          @keyframes socLine {
            0%, 100% { stroke-dashoffset: 0; }
            50% { stroke-dashoffset: 8; }
          }
        }
      `}</style>
      {/* Connection lines */}
      <line x1="48" y1="48" x2="24" y2="28" stroke="#6C63FF" strokeWidth="1" opacity="0.2" strokeDasharray="4 4" style={{ animation: 'socLine 3s linear infinite' }} />
      <line x1="48" y1="48" x2="72" y2="28" stroke="#6C63FF" strokeWidth="1" opacity="0.2" strokeDasharray="4 4" style={{ animation: 'socLine 3s linear infinite 0.5s' }} />
      <line x1="48" y1="48" x2="28" y2="70" stroke="#6C63FF" strokeWidth="1" opacity="0.2" strokeDasharray="4 4" style={{ animation: 'socLine 3s linear infinite 1s' }} />
      <line x1="48" y1="48" x2="68" y2="70" stroke="#6C63FF" strokeWidth="1" opacity="0.2" strokeDasharray="4 4" style={{ animation: 'socLine 3s linear infinite 1.5s' }} />
      {/* Center hub */}
      <circle cx="48" cy="48" r="8" fill="#6C63FF" opacity="0.15" />
      <circle cx="48" cy="48" r="4" fill="#6C63FF" opacity="0.5" />
      {/* Floating social nodes */}
      <g style={{ animation: 'socFloat1 4s ease-in-out infinite' }}>
        <circle cx="24" cy="28" r="6" stroke="#6C63FF" strokeWidth="1.5" fill="none" opacity="0.5" />
        <text x="24" y="31" textAnchor="middle" fontSize="8" fill="#6C63FF" opacity="0.6">X</text>
      </g>
      <g style={{ animation: 'socFloat2 4.5s ease-in-out infinite' }}>
        <circle cx="72" cy="28" r="6" stroke="#9D97FF" strokeWidth="1.5" fill="none" opacity="0.5" />
        <text x="72" y="31" textAnchor="middle" fontSize="7" fill="#9D97FF" opacity="0.6">in</text>
      </g>
      <g style={{ animation: 'socFloat3 3.5s ease-in-out infinite' }}>
        <circle cx="28" cy="70" r="6" stroke="#6C63FF" strokeWidth="1.5" fill="none" opacity="0.5" />
        <text x="28" y="73" textAnchor="middle" fontSize="8" fill="#6C63FF" fontFamily="monospace" opacity="0.6">G</text>
      </g>
      <g style={{ animation: 'socFloat1 5s ease-in-out infinite 1s' }}>
        <circle cx="68" cy="70" r="6" stroke="#9D97FF" strokeWidth="1.5" fill="none" opacity="0.5" />
        <text x="68" y="73" textAnchor="middle" fontSize="7" fill="#9D97FF" opacity="0.6">fb</text>
      </g>
    </svg>
  );
}

function DefaultSvg() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes defDash {
            0% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: -20; }
          }
          @keyframes defFade {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0.5; }
          }
        }
      `}</style>
      {/* Dashed circle */}
      <circle
        cx="48" cy="48" r="30"
        stroke="#6C63FF"
        strokeWidth="2"
        strokeDasharray="6 4"
        fill="none"
        opacity="0.3"
        style={{ animation: 'defDash 4s linear infinite' }}
      />
      {/* Inner shape */}
      <circle cx="48" cy="48" r="16" fill="#6C63FF" opacity="0.06" />
      {/* Plus sign */}
      <line x1="48" y1="40" x2="48" y2="56" stroke="#6C63FF" strokeWidth="2" strokeLinecap="round" opacity="0.5" style={{ animation: 'defFade 2s ease-in-out infinite' }} />
      <line x1="40" y1="48" x2="56" y2="48" stroke="#6C63FF" strokeWidth="2" strokeLinecap="round" opacity="0.5" style={{ animation: 'defFade 2s ease-in-out infinite' }} />
    </svg>
  );
}

const variantSvg: Record<EmptyVariant, React.FC> = {
  sparks: SparksSvg,
  devices: DevicesSvg,
  social: SocialSvg,
  default: DefaultSvg,
};

export default function EmptyState({
  icon: Icon,
  variant,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  // Determine which SVG variant to use
  const resolvedVariant = variant ?? 'default';
  const SvgIllustration = variantSvg[resolvedVariant];

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        gap: 2,
      }}
    >
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes emptyFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
          @keyframes emptyRotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes emptyPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          @keyframes emptyBtnGlow {
            0%, 100% {
              box-shadow: 0 0 4px rgba(108, 99, 255, 0.2);
            }
            50% {
              box-shadow: 0 0 12px rgba(108, 99, 255, 0.4), 0 0 24px rgba(108, 99, 255, 0.15);
            }
          }
        }
      `}</style>

      {/* Icon / illustration container */}
      <Box
        sx={{
          position: 'relative',
          width: 120,
          height: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '@media (prefers-reduced-motion: no-preference)': {
            animation: 'emptyFloat 3s ease-in-out infinite',
          },
        }}
      >
        {/* Outer dotted rotating circle */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2px dotted',
            borderColor: 'primary.main',
            opacity: 0.2,
            '@media (prefers-reduced-motion: no-preference)': {
              animation: 'emptyRotate 60s linear infinite',
            },
          }}
        />

        {/* Inner solid circle background */}
        <Box
          sx={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            backgroundColor: 'primary.main',
            opacity: 0.08,
            position: 'absolute',
          }}
        />

        {/* Icon or SVG illustration */}
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            '@media (prefers-reduced-motion: no-preference)': {
              animation: 'emptyPulse 2s ease-in-out infinite',
            },
          }}
        >
          {Icon ? (
            <Icon
              sx={{
                fontSize: 56,
                color: 'primary.main',
                opacity: 0.7,
              }}
            />
          ) : (
            <SvgIllustration />
          )}
        </Box>
      </Box>

      <Typography variant="h6" color="text.primary" sx={{ fontWeight: 400 }}>
        {title}
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ maxWidth: 360, textAlign: 'center' }}
      >
        {description}
      </Typography>

      {actionLabel && onAction && (
        <Button
          variant="contained"
          onClick={onAction}
          sx={{
            mt: 1,
            '@media (prefers-reduced-motion: no-preference)': {
              animation: 'emptyBtnGlow 2.5s ease-in-out infinite',
            },
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
