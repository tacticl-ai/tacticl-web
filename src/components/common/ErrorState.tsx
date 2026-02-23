import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  message = 'Something went wrong.',
  onRetry,
}: ErrorStateProps) {
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
      <ErrorOutlineIcon
        sx={{ fontSize: 48, color: 'error.main', opacity: 0.7 }}
      />
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
      {onRetry && (
        <Button variant="outlined" onClick={onRetry} size="small">
          Retry
        </Button>
      )}
    </Box>
  );
}
