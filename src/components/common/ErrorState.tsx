import { useState, useEffect, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

const ASCII_ART = [
  `  _____ ____  ____
 | ____|  _ \\|  _ \\
 |  _| | |_) | |_) |
 | |___|  _ <|  _ <
 |_____|_| \\_\\_| \\_\\`,
  ` _____  _    ___ _
|  ___/ _  |_ _| |
| |_ / _  | | || |
|  _/ ___ || || |___
|_|/_/   \\_|___|_____|`,
  `  ____   ___   ___  __  __
 | __ ) / _ \\ / _ \\|  \\/  |
 |  _ \\| | | | | | | |\\/| |
 | |_) | |_| | |_| | |  | |
 |____/ \\___/ \\___/|_|  |_|`,
];

const GLITCH_CHARS = '!@#$%^&*()_+-=[]{}|;:<>?/~`0123456789';

const funnyMessages = [
  'Oops, the bits got tangled',
  '404: Humor module not found',
  'Segfault in the fun department',
  'Looks like this page took a wrong turn at the API gateway',
  'The hamster powering this server needs a break',
  'Our bits got flipped. Unflipping in progress...',
  'Error 418: Just kidding. But something did break.',
  'The code monkeys are investigating',
  "This wasn't in the sprint planning",
  'Stack overflow in the coffee machine',
  'Kernel panic: too much swag',
  'Exception caught: RealityNotFoundError',
];

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  fullPage?: boolean;
}

function useGlitchText(text: string): string {
  const [glitched, setGlitched] = useState(text);

  useEffect(() => {
    let frame: number;
    let timeout: ReturnType<typeof setTimeout>;

    const scheduleGlitch = () => {
      timeout = setTimeout(
        () => {
          const chars = text.split('');
          const numGlitches = Math.floor(Math.random() * 4) + 1;
          for (let i = 0; i < numGlitches; i++) {
            const idx = Math.floor(Math.random() * chars.length);
            if (chars[idx] !== ' ' && chars[idx] !== '\n') {
              chars[idx] = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
            }
          }
          setGlitched(chars.join(''));

          // Restore after brief flicker
          frame = requestAnimationFrame(() => {
            setTimeout(() => {
              setGlitched(text);
              scheduleGlitch();
            }, 80);
          });
        },
        1500 + Math.random() * 2000,
      );
    };

    scheduleGlitch();

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(frame);
    };
  }, [text]);

  return glitched;
}

export default function ErrorState({
  title,
  message = 'Something went wrong.',
  onRetry,
  fullPage = false,
}: ErrorStateProps) {
  const subtitle = useMemo(
    () => funnyMessages[Math.floor(Math.random() * funnyMessages.length)],
    [],
  );

  const asciiArt = useMemo(
    () => ASCII_ART[Math.floor(Math.random() * ASCII_ART.length)],
    [],
  );

  const glitchedArt = useGlitchText(asciiArt);

  const handleRetry = useCallback(() => {
    onRetry?.();
  }, [onRetry]);

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: fullPage ? 0 : 8,
        gap: 2,
        position: 'relative',
        overflow: 'hidden',
        ...(fullPage && { minHeight: '100vh' }),
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
          @keyframes errScanlines {
            0% { background-position: 0 0; }
            100% { background-position: 0 4px; }
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
          @keyframes errCursorBlink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
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

      {/* CRT scanline overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.03,
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
          '@media (prefers-reduced-motion: no-preference)': {
            animation: 'errScanlines 0.2s linear infinite',
          },
        }}
      />

      {/* Glitchy ASCII art */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          '@media (prefers-reduced-motion: no-preference)': {
            animation: 'errGlitch 3s ease-in-out infinite',
          },
        }}
      >
        <Typography
          component="pre"
          sx={{
            fontFamily: '"Courier New", monospace',
            fontSize: { xs: 10, sm: 13 },
            lineHeight: 1.3,
            color: 'error.main',
            textAlign: 'center',
            userSelect: 'none',
          }}
        >
          {glitchedArt}
        </Typography>
      </Box>

      {/* Title */}
      {title && (
        <Typography
          variant="h6"
          sx={{
            position: 'relative',
            zIndex: 1,
            color: 'text.primary',
            fontWeight: 600,
            textAlign: 'center',
            px: 2,
          }}
        >
          {title}
        </Typography>
      )}

      {/* Terminal-style message */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          backgroundColor: 'rgba(0,0,0,0.3)',
          borderRadius: 1,
          border: '1px solid rgba(255,255,255,0.06)',
          px: 2.5,
          py: 1.5,
          maxWidth: 440,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontFamily: '"Courier New", monospace',
            color: '#CF6679',
            fontSize: 13,
          }}
        >
          <Box component="span" sx={{ color: 'text.secondary' }}>
            ${' '}
          </Box>
          {message}
          <Box
            component="span"
            sx={{
              display: 'inline-block',
              width: 8,
              height: 14,
              backgroundColor: '#CF6679',
              ml: 0.5,
              verticalAlign: 'text-bottom',
              '@media (prefers-reduced-motion: no-preference)': {
                animation: 'errCursorBlink 1s step-end infinite',
              },
            }}
          />
        </Typography>
      </Box>

      {/* Fun subtitle */}
      <Typography
        variant="body2"
        sx={{
          position: 'relative',
          zIndex: 1,
          color: 'text.secondary',
          fontStyle: 'italic',
          textAlign: 'center',
          maxWidth: 400,
          px: 2,
          opacity: 0.7,
        }}
      >
        {subtitle}
      </Typography>

      {/* Retry button with glow */}
      {onRetry && (
        <Button
          variant="outlined"
          onClick={handleRetry}
          size="small"
          sx={{
            position: 'relative',
            zIndex: 1,
            mt: 1,
            borderColor: 'primary.main',
            color: 'primary.main',
            fontFamily: '"Courier New", monospace',
            letterSpacing: 1,
            '@media (prefers-reduced-motion: no-preference)': {
              animation: 'errRetryGlow 2s ease-in-out infinite',
            },
          }}
        >
          {'> retry'}
        </Button>
      )}
    </Box>
  );
}
