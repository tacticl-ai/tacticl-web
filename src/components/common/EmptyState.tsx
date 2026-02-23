import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import type { SvgIconComponent } from '@mui/icons-material';

interface EmptyStateProps {
  icon: SvgIconComponent;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
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

      {/* Icon container with decorative elements */}
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

        {/* Icon with scale pulse */}
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            '@media (prefers-reduced-motion: no-preference)': {
              animation: 'emptyPulse 2s ease-in-out infinite',
            },
          }}
        >
          <Icon
            sx={{
              fontSize: 56,
              color: 'primary.main',
              opacity: 0.7,
            }}
          />
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
