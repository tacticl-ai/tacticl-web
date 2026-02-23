import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import TacticlLogo from '../TacticlLogo';

type LoadingVariant = 'fullPage' | 'inline' | 'skeleton';
type LoadingSize = 'sm' | 'md' | 'lg';

const loadingMessages = [
  'Warming up the neural networks...',
  'Consulting the oracle...',
  'Crunching the data bits...',
  'Asking the AI overlords...',
  'Reticulating splines...',
  'Deploying carrier pigeons...',
  'Compiling the quantum bits...',
  'Bribing the load balancer...',
  'Negotiating with the cache...',
  'Defragmenting the multiverse...',
  'Spawning daemon processes...',
  'Calibrating the flux capacitor...',
];

const sizeConfig: Record<LoadingSize, { logo: number; orbit: number; container: number; fontSize: string }> = {
  sm: { logo: 28, orbit: 28, container: 80, fontSize: '0.75rem' },
  md: { logo: 48, orbit: 40, container: 136, fontSize: '0.875rem' },
  lg: { logo: 64, orbit: 56, container: 180, fontSize: '1rem' },
};

interface LoadingStateProps {
  message?: string;
  variant?: LoadingVariant;
  size?: LoadingSize;
}

function SkeletonVariant() {
  return (
    <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto' }}>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes skelShimmer {
            0% { background-position: -400px 0; }
            100% { background-position: 400px 0; }
          }
        }
      `}</style>
      {/* Card-like skeleton with shimmer */}
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            mb: 2,
            p: 2,
            borderRadius: 1,
            border: '1px solid rgba(255,255,255,0.06)',
            backgroundColor: 'rgba(255,255,255,0.02)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <Skeleton
              variant="circular"
              width={36}
              height={36}
              sx={{
                bgcolor: 'rgba(108,99,255,0.08)',
                '&::after': {
                  background: 'linear-gradient(90deg, transparent, rgba(108,99,255,0.06), transparent)',
                },
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Skeleton
                variant="text"
                width="60%"
                sx={{
                  bgcolor: 'rgba(108,99,255,0.08)',
                  '&::after': {
                    background: 'linear-gradient(90deg, transparent, rgba(108,99,255,0.06), transparent)',
                  },
                }}
              />
              <Skeleton
                variant="text"
                width="40%"
                sx={{
                  bgcolor: 'rgba(108,99,255,0.05)',
                  '&::after': {
                    background: 'linear-gradient(90deg, transparent, rgba(108,99,255,0.04), transparent)',
                  },
                }}
              />
            </Box>
          </Box>
          <Skeleton
            variant="rounded"
            height={48}
            sx={{
              bgcolor: 'rgba(108,99,255,0.05)',
              '&::after': {
                background: 'linear-gradient(90deg, transparent, rgba(108,99,255,0.04), transparent)',
              },
            }}
          />
        </Box>
      ))}
    </Box>
  );
}

function OrbitalLoader({ size = 'md', message, displayMessage }: {
  size: LoadingSize;
  message?: string;
  displayMessage: string;
}) {
  const cfg = sizeConfig[size];
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (message) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => setVisible(true), 400);
    }, 2800);
    return () => clearInterval(interval);
  }, [message]);

  return (
    <>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes loadOrbit1 {
            from { transform: rotate(0deg) translateX(${cfg.orbit}px) rotate(0deg); }
            to { transform: rotate(360deg) translateX(${cfg.orbit}px) rotate(-360deg); }
          }
          @keyframes loadOrbit2 {
            from { transform: rotate(120deg) translateX(${cfg.orbit + 10}px) rotate(-120deg); }
            to { transform: rotate(480deg) translateX(${cfg.orbit + 10}px) rotate(-480deg); }
          }
          @keyframes loadOrbit3 {
            from { transform: rotate(240deg) translateX(${cfg.orbit + 20}px) rotate(-240deg); }
            to { transform: rotate(600deg) translateX(${cfg.orbit + 20}px) rotate(-600deg); }
          }
          @keyframes loadGlow {
            0%, 100% {
              filter: drop-shadow(0 0 4px rgba(108, 99, 255, 0.2));
            }
            50% {
              filter: drop-shadow(0 0 12px rgba(108, 99, 255, 0.4));
            }
          }
          @keyframes loadPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.08); }
          }
          @keyframes loadDots {
            0% { content: ''; }
            25% { content: '.'; }
            50% { content: '..'; }
            75% { content: '...'; }
          }
        }
      `}</style>

      {/* Logo with orbiting dots */}
      <Box
        sx={{
          position: 'relative',
          width: cfg.container,
          height: cfg.container,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '@media (prefers-reduced-motion: no-preference)': {
            animation: 'loadGlow 3s ease-in-out infinite',
          },
        }}
      >
        <Box
          sx={{
            '@media (prefers-reduced-motion: no-preference)': {
              animation: 'loadPulse 2s ease-in-out infinite',
            },
          }}
        >
          <TacticlLogo size={cfg.logo} />
        </Box>

        {/* Orbiting dot 1 */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 6,
            height: 6,
            ml: '-3px',
            mt: '-3px',
            borderRadius: '50%',
            backgroundColor: 'primary.main',
            opacity: 0.8,
            '@media (prefers-reduced-motion: no-preference)': {
              animation: 'loadOrbit1 3s linear infinite',
            },
          }}
        />

        {/* Orbiting dot 2 */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 6,
            height: 6,
            ml: '-3px',
            mt: '-3px',
            borderRadius: '50%',
            backgroundColor: 'primary.main',
            opacity: 0.5,
            '@media (prefers-reduced-motion: no-preference)': {
              animation: 'loadOrbit2 4.5s linear infinite',
            },
          }}
        />

        {/* Orbiting dot 3 */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 6,
            height: 6,
            ml: '-3px',
            mt: '-3px',
            borderRadius: '50%',
            backgroundColor: 'primary.main',
            opacity: 0.3,
            '@media (prefers-reduced-motion: no-preference)': {
              animation: 'loadOrbit3 6s linear infinite',
            },
          }}
        />
      </Box>

      {/* Message with typing cursor */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            textAlign: 'center',
            minHeight: '1.5em',
            fontSize: cfg.fontSize,
            fontFamily: '"Courier New", monospace',
            transition: 'opacity 0.4s ease',
            opacity: message ? 1 : visible ? 1 : 0,
          }}
        >
          {displayMessage}
        </Typography>
        <Box
          sx={{
            width: 2,
            height: 16,
            backgroundColor: 'primary.main',
            opacity: 0.7,
            '@media (prefers-reduced-motion: no-preference)': {
              animation: 'loadCursorBlink 1s step-end infinite',
            },
          }}
        />
      </Box>

      {/* cursor blink for this component */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes loadCursorBlink {
            0%, 100% { opacity: 0.7; }
            50% { opacity: 0; }
          }
        }
      `}</style>
    </>
  );
}

export default function LoadingState({ message, variant = 'inline', size = 'md' }: LoadingStateProps) {
  const [msgIndex, setMsgIndex] = useState(() => Math.floor(Math.random() * loadingMessages.length));

  useEffect(() => {
    if (message) return;
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [message]);

  const displayMessage = message || loadingMessages[msgIndex];

  if (variant === 'skeleton') {
    return <SkeletonVariant />;
  }

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: variant === 'fullPage' ? 0 : 8,
        gap: 3,
        ...(variant === 'fullPage' && {
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          backgroundColor: 'rgba(13, 13, 26, 0.92)',
          backdropFilter: 'blur(4px)',
        }),
      }}
    >
      <OrbitalLoader size={size} message={message} displayMessage={displayMessage} />
    </Box>
  );
}
