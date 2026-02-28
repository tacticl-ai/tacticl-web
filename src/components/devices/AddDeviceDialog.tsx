import { useEffect, useRef, useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import IconButton from '@mui/material/IconButton';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useCreatePairingCode } from '../../hooks/useDevicePairing';
import { useDevices } from '../../hooks/useDevices';
import { ApiError } from '../../api/client';

interface AddDeviceDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function AddDeviceDialog({ open, onClose }: AddDeviceDialogProps) {
  const { mutate: generateCode, data, isPending, isError, error, reset } = useCreatePairingCode();
  const { data: devices } = useDevices();
  const initialDeviceCount = useRef<number | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generate = useCallback(() => {
    generateCode();
  }, [generateCode]);

  // Generate code on open
  useEffect(() => {
    if (open) {
      initialDeviceCount.current = devices?.length ?? 0;
      generate();
    } else {
      reset();
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    }
  }, [open, generate, reset, devices?.length]);

  // Auto-refresh code before 5 min expiry
  useEffect(() => {
    if (!data || !open) return;
    refreshTimerRef.current = setTimeout(() => {
      generate();
    }, (data.expiresIn - 30) * 1000); // Refresh 30s before expiry
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [data, open, generate]);

  // Detect new device paired
  const newDevicePaired =
    initialDeviceCount.current !== null &&
    (devices?.length ?? 0) > initialDeviceCount.current;

  const formattedCode = data?.code
    ? `${data.code.slice(0, 3)} ${data.code.slice(3)}`
    : '';

  const handleCopy = () => {
    if (data?.code) navigator.clipboard.writeText(data.code);
  };

  const errorMessage = error
    ? error instanceof ApiError
      ? `Failed to generate code (${error.status}): ${error.message}`
      : `Failed to generate code: ${error.message}`
    : '';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add Device</DialogTitle>
      <DialogContent>
        {newDevicePaired ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CheckCircleOutlineIcon
              sx={{ fontSize: 64, color: 'success.main', mb: 2 }}
            />
            <Typography variant="h6" gutterBottom>
              Device paired!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your device is now connected and ready to receive sparks.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              1. Download and install{' '}
              <Typography
                component="a"
                href="https://github.com/tacticl-ai/tacticl-device/releases"
                target="_blank"
                rel="noopener noreferrer"
                variant="body2"
                sx={{ color: 'primary.main', textDecoration: 'underline' }}
              >
                Tacticl Device
              </Typography>
              <br />
              2. Open the app
              <br />
              3. Enter this pairing code
            </Typography>

            {isPending ? (
              <CircularProgress size={32} sx={{ my: 3 }} />
            ) : isError ? (
              <Box sx={{ my: 3 }}>
                <ErrorOutlineIcon sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
                <Typography variant="body2" color="error.main" sx={{ mb: 1 }}>
                  {errorMessage}
                </Typography>
                <Button
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={generate}
                  sx={{ textTransform: 'none' }}
                >
                  Retry
                </Button>
              </Box>
            ) : (
              <Box sx={{ my: 3 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    bgcolor: 'action.hover',
                    borderRadius: 2,
                    px: 3,
                    py: 1.5,
                  }}
                >
                  <Typography
                    variant="h3"
                    sx={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      letterSpacing: 4,
                    }}
                  >
                    {formattedCode}
                  </Typography>
                  <IconButton onClick={handleCopy} size="small" title="Copy code">
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mt: 1 }}
                >
                  Code expires in 5 minutes
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          {newDevicePaired ? 'Done' : 'Cancel'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
