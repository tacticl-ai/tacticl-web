import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import BugReportIcon from '@mui/icons-material/BugReport';

const funnySubtitles = [
  'Our bits got flipped. Unflipping in progress...',
  'Houston, we have a problem at the API gateway',
  'Error 418: Just kidding. But something did break.',
  'The code monkeys are investigating',
  'Segfault in the matrix. Neo is on it.',
  "This wasn't in the sprint planning",
  'Have you tried mass-producing it off and on again?',
];

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  message = 'Something went wrong.',
  onRetry,
}: ErrorStateProps) {
  const subtitle = useMemo(
    () => funnySubtitles[Math.floor(Math.random() * funnySubtitles.length)],
    [],
  );

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
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Keyframes */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes errGlitch {
            0%, 100% {
              clip-path: inset(0 0 0 0);
              text-shadow: none;
            }
            10% {
              clip-path: inset(20% 0 30% 0);
              text-shadow: -3px 0 #ff3333, 3px 0 #00ffff;
            }
            20% {
              clip-path: inset(60% 0 10% 0);
              text-shadow: 3px 0 #ff3333, -3px 0 #00ffff;
            }
            30% {
              clip-path: inset(0 0 0 0);
              text-shadow: none;
            }
            50% {
              clip-path: inset(40% 0 20% 0);
              text-shadow: -2px 0 #ff3333, 2px 0 #00ffff;
            }
            60% {
              clip-path: inset(0 0 0 0);
              text-shadow: none;
            }
            80% {
              clip-path: inset(10% 0 60% 0);
              text-shadow: 2px 0 #ff3333, -2px 0 #00ffff;
            }
            90% {
              clip-path: inset(0 0 0 0);
              text-shadow: none;
            }
          }
          @keyframes errRetryGlow {
            0%, 100% {
              box-shadow: 0 0 4px rgba(108, 99, 255, 0.3);
            }
            50% {
              box-shadow: 0 0 16px rgba(108, 99, 255, 0.6), 0 0 32px rgba(108, 99, 255, 0.2);
            }
          }
          @keyframes errBinaryRain {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
          }
        }
      `}</style>

      {/* Binary rain background */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          opacity: 0.04,
          fontFamily: '"Courier New", monospace',
          fontSize: 11,
          lineHeight: 1.6,
          color: '#fff',
          whiteSpace: 'pre',
          userSelect: 'none',
          '@media (prefers-reduced-motion: no-preference)': {
            '&::before, &::after': {
              content:
                '"01001010 0xDEAD 10110 0xFF 01101 0xBEEF 10010 0xCAFE 01110 0xF00D 10101 0xBAAD 01001 0xC0DE 11010 0xFACE 01010 0xBABE 10110 0xFEED 01001010 0xDEAD 10110 0xFF 01101 0xBEEF 10010 0xCAFE 01110 0xF00D 10101 0xBAAD 01001 0xC0DE"',
              position: 'absolute',
              left: 0,
              right: 0,
              display: 'block',
              wordBreak: 'break-all',
            },
            '&::before': {
              animation: 'errBinaryRain 20s linear infinite',
              top: 0,
            },
            '&::after': {
              animation: 'errBinaryRain 20s linear infinite -10s',
              top: 0,
            },
          },
        }}
      />

      {/* Glitchy icon */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          '@media (prefers-reduced-motion: no-preference)': {
            animation: 'errGlitch 3s ease-in-out infinite',
          },
        }}
      >
        <BugReportIcon
          sx={{
            fontSize: 64,
            color: 'error.main',
          }}
        />
      </Box>

      {/* Fun subtitle */}
      <Typography
        variant="body1"
        sx={{
          position: 'relative',
          zIndex: 1,
          color: 'text.secondary',
          fontStyle: 'italic',
          textAlign: 'center',
          maxWidth: 400,
          px: 2,
        }}
      >
        {subtitle}
      </Typography>

      {/* Actual error message */}
      <Typography
        variant="body2"
        sx={{
          position: 'relative',
          zIndex: 1,
          color: 'text.secondary',
          opacity: 0.7,
          textAlign: 'center',
          maxWidth: 360,
          px: 2,
        }}
      >
        {message}
      </Typography>

      {/* Retry button with glow */}
      {onRetry && (
        <Button
          variant="outlined"
          onClick={onRetry}
          size="small"
          sx={{
            position: 'relative',
            zIndex: 1,
            mt: 1,
            borderColor: 'primary.main',
            color: 'primary.main',
            '@media (prefers-reduced-motion: no-preference)': {
              animation: 'errRetryGlow 2s ease-in-out infinite',
            },
          }}
        >
          Retry
        </Button>
      )}
    </Box>
  );
}
