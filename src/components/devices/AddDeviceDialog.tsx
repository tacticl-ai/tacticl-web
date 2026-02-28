import { useEffect, useRef, useCallback, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Fade from '@mui/material/Fade';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import VpnKeyRoundedIcon from '@mui/icons-material/VpnKeyRounded';
import CloseIcon from '@mui/icons-material/Close';
import { useCreatePairingCode } from '../../hooks/useDevicePairing';
import { useDevices } from '../../hooks/useDevices';

interface AddDeviceDialogProps {
  open: boolean;
  onClose: () => void;
}

const DOWNLOAD_BASE = 'https://github.com/tacticl-ai/tacticl-releases/releases/latest/download';

function getOS(): { label: string; downloadUrl: string } {
  const ua = navigator.userAgent;
  if (ua.includes('Mac')) return { label: 'macOS', downloadUrl: `${DOWNLOAD_BASE}/tacticl-device.dmg` };
  if (ua.includes('Win')) return { label: 'Windows', downloadUrl: `${DOWNLOAD_BASE}/tacticl-device-Setup.exe` };
  if (ua.includes('Linux')) return { label: 'Linux', downloadUrl: `${DOWNLOAD_BASE}/tacticl-device.AppImage` };
  return { label: 'your computer', downloadUrl: `${DOWNLOAD_BASE}/tacticl-device.dmg` };
}

export default function AddDeviceDialog({ open, onClose }: AddDeviceDialogProps) {
  const { mutate: generateCode, data, isPending, isError, reset } = useCreatePairingCode();
  const { data: devices } = useDevices();
  const initialDeviceCount = useRef<number | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [copied, setCopied] = useState(false);

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
      setCopied(false);
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
    }, (data.expiresIn - 30) * 1000);
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
    if (data?.code) {
      navigator.clipboard.writeText(data.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const { label: osLabel, downloadUrl } = getOS();
  const codeReady = !isPending && !isError && data;

  const stepCircle = (icon: React.ReactNode, active: boolean) => (
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: active ? 'primary.main' : 'rgba(108,99,255,0.15)',
        color: active ? '#fff' : 'primary.light',
        flexShrink: 0,
        transition: 'all 0.3s',
      }}
    >
      {icon}
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: 'background.paper',
          },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          pt: 3,
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Connect a device
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: 3, pb: 3, pt: 0 }}>
        {newDevicePaired ? (
          <Fade in>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircleIcon
                sx={{ fontSize: 72, color: 'success.main', mb: 2 }}
              />
              <Typography variant="h5" fontWeight={600} gutterBottom>
                You're all set!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Your device is connected and ready to receive sparks.
              </Typography>
              <Button
                variant="contained"
                onClick={onClose}
                sx={{ borderRadius: 2, px: 4 }}
              >
                Done
              </Button>
            </Box>
          </Fade>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Step 1: Download */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              {stepCircle(<DownloadRoundedIcon fontSize="small" />, true)}
              <Box sx={{ flex: 1, pt: 0.5 }}>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                  Download Tacticl Device
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<DownloadRoundedIcon />}
                  sx={{
                    borderRadius: 2,
                    borderColor: 'rgba(108,99,255,0.4)',
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(108,99,255,0.08)' },
                  }}
                >
                  Download for {osLabel}
                </Button>
              </Box>
            </Box>

            {/* Step 2: Open */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              {stepCircle(<LaptopMacIcon fontSize="small" />, true)}
              <Box sx={{ pt: 0.5 }}>
                <Typography variant="body2" fontWeight={600}>
                  Open the app
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Install and launch Tacticl Device
                </Typography>
              </Box>
            </Box>

            {/* Step 3: Enter code */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              {stepCircle(<VpnKeyRoundedIcon fontSize="small" />, codeReady != null)}
              <Box sx={{ flex: 1, pt: 0.5 }}>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>
                  Enter your pairing code
                </Typography>

                {isPending ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">
                      Generating code...
                    </Typography>
                  </Box>
                ) : isError ? (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Couldn't generate a pairing code right now.
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={generate}
                      sx={{
                        borderRadius: 2,
                        borderColor: 'rgba(108,99,255,0.4)',
                        '&:hover': { borderColor: 'primary.main' },
                      }}
                    >
                      Try again
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1,
                        bgcolor: 'rgba(108,99,255,0.1)',
                        border: '1px solid rgba(108,99,255,0.25)',
                        borderRadius: 2,
                        px: 2.5,
                        py: 1.5,
                      }}
                    >
                      <Typography
                        variant="h4"
                        sx={{
                          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                          fontWeight: 700,
                          letterSpacing: 6,
                          color: 'primary.light',
                        }}
                      >
                        {formattedCode}
                      </Typography>
                      <Tooltip title={copied ? 'Copied!' : 'Copy code'}>
                        <IconButton
                          onClick={handleCopy}
                          size="small"
                          sx={{
                            color: copied ? 'success.main' : 'text.secondary',
                            ml: 0.5,
                          }}
                        >
                          {copied ? (
                            <CheckIcon fontSize="small" />
                          ) : (
                            <ContentCopyIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 1 }}
                    >
                      Expires in 5 minutes
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Waiting indicator */}
            {codeReady && (
              <Fade in>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1.5,
                    mt: 1,
                    py: 1.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(3,218,198,0.06)',
                    border: '1px solid rgba(3,218,198,0.15)',
                  }}
                >
                  <CircularProgress size={16} sx={{ color: 'secondary.main' }} />
                  <Typography variant="body2" color="secondary.main">
                    Waiting for your device to connect...
                  </Typography>
                </Box>
              </Fade>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
