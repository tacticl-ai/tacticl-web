import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TacticlLogo from '../TacticlLogo';

const loadingMessages = [
  'Warming up the neural networks...',
  'Consulting the oracle...',
  'Crunching the data bits...',
  'Asking the AI overlords...',
  'Reticulating splines...',
  'Deploying carrier pigeons...',
  'Compiling the quantum bits...',
  'Bribing the load balancer...',
];

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message }: LoadingStateProps) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (message) return; // Skip cycling if a fixed message is provided

    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMsgIndex((prev) => (prev + 1) % loadingMessages.length);
        setVisible(true);
      }, 500);
    }, 2500);

    return () => clearInterval(interval);
  }, [message]);

  const displayMessage = message || loadingMessages[msgIndex];

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        gap: 3,
      }}
    >
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes loadOrbit1 {
            from { transform: rotate(0deg) translateX(40px) rotate(0deg); }
            to { transform: rotate(360deg) translateX(40px) rotate(-360deg); }
          }
          @keyframes loadOrbit2 {
            from { transform: rotate(120deg) translateX(50px) rotate(-120deg); }
            to { transform: rotate(480deg) translateX(50px) rotate(-480deg); }
          }
          @keyframes loadOrbit3 {
            from { transform: rotate(240deg) translateX(60px) rotate(-240deg); }
            to { transform: rotate(600deg) translateX(60px) rotate(-600deg); }
          }
          @keyframes loadGlow {
            0%, 100% {
              filter: drop-shadow(0 0 4px rgba(108, 99, 255, 0.2));
            }
            50% {
              filter: drop-shadow(0 0 12px rgba(108, 99, 255, 0.4));
            }
          }
        }
      `}</style>

      {/* Logo with orbiting dots */}
      <Box
        sx={{
          position: 'relative',
          width: 136,
          height: 136,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '@media (prefers-reduced-motion: no-preference)': {
            animation: 'loadGlow 3s ease-in-out infinite',
          },
        }}
      >
        <TacticlLogo size={48} />

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

      {/* Cycling message with fade */}
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          textAlign: 'center',
          minHeight: '1.5em',
          transition: 'opacity 0.5s ease',
          opacity: message ? 1 : visible ? 1 : 0,
        }}
      >
        {displayMessage}
      </Typography>
    </Box>
  );
}
