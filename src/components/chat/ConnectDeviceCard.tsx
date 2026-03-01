import { useEffect, useRef, useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import DevicesIcon from '@mui/icons-material/Devices';
import { useCreatePairingCode } from '../../hooks/useDevicePairing';
import { useDevices } from '../../hooks/useDevices';
import type { AgentAction } from '../../api/types';

const DOWNLOAD_BASE = 'https://github.com/tacticl-ai/tacticl-releases/releases/latest/download';

function getOS(): { label: string; downloadUrl: string } {
  const ua = navigator.userAgent;
  if (ua.includes('Mac')) return { label: 'macOS', downloadUrl: `${DOWNLOAD_BASE}/tacticl-device.dmg` };
  if (ua.includes('Win')) return { label: 'Windows', downloadUrl: `${DOWNLOAD_BASE}/tacticl-device-Setup.exe` };
  if (ua.includes('Linux')) return { label: 'Linux', downloadUrl: `${DOWNLOAD_BASE}/tacticl-device.AppImage` };
  return { label: 'your computer', downloadUrl: `${DOWNLOAD_BASE}/tacticl-device.dmg` };
}

interface ConnectDeviceCardProps {
  action: AgentAction;
  onComplete: () => void;
}

export default function ConnectDeviceCard({ action, onComplete }: ConnectDeviceCardProps) {
  const { mutate: generateCode, data, isPending, isError } = useCreatePairingCode();
  const { data: devices } = useDevices();
  const initialDeviceCount = useRef<number | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [copied, setCopied] = useState(false);
  const [completed, setCompleted] = useState(false);

  const generate = useCallback(() => {
    generateCode();
  }, [generateCode]);

  // Generate code on mount
  useEffect(() => {
    initialDeviceCount.current = devices?.length ?? 0;
    generate();
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh code before 5 min expiry
  useEffect(() => {
    if (!data) return;
    refreshTimerRef.current = setTimeout(() => generate(), (data.expiresIn - 30) * 1000);
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [data, generate]);

  // Detect new device paired
  useEffect(() => {
    if (
      initialDeviceCount.current !== null &&
      (devices?.length ?? 0) > initialDeviceCount.current &&
      !completed
    ) {
      setCompleted(true);
      onComplete();
    }
  }, [devices?.length, completed, onComplete]);

  const formattedCode = data?.code ? `${data.code.slice(0, 3)} ${data.code.slice(3)}` : '';
  const { label: osLabel, downloadUrl } = getOS();

  const handleCopy = () => {
    if (data?.code) {
      navigator.clipboard.writeText(data.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (completed) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
        <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
        <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
          Device paired!
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 1.5,
        mt: 1.5,
        borderRadius: 2,
        bgcolor: 'rgba(108,99,255,0.08)',
        border: '1px solid rgba(108,99,255,0.2)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <DevicesIcon sx={{ fontSize: 20, color: 'primary.light' }} />
        <Typography variant="body2" fontWeight={600}>
          Connect a Device
        </Typography>
      </Box>
      {action.message && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          {action.message}
        </Typography>
      )}

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Download link */}
        <Button
          size="small"
          variant="outlined"
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          startIcon={<DownloadRoundedIcon />}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '0.75rem',
            borderColor: 'rgba(108,99,255,0.4)',
          }}
        >
          Download for {osLabel}
        </Button>

        {/* Pairing code */}
        {isPending ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="caption" color="text.secondary">Generating code...</Typography>
          </Box>
        ) : isError ? (
          <Button size="small" variant="text" onClick={generate} sx={{ fontSize: '0.75rem' }}>
            Retry
          </Button>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography
              variant="body2"
              sx={{
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                fontWeight: 700,
                letterSpacing: 3,
                color: 'primary.light',
                bgcolor: 'rgba(108,99,255,0.1)',
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
              }}
            >
              {formattedCode}
            </Typography>
            <Tooltip title={copied ? 'Copied!' : 'Copy code'}>
              <IconButton onClick={handleCopy} size="small" sx={{ color: copied ? 'success.main' : 'text.secondary' }}>
                {copied ? <CheckIcon sx={{ fontSize: 16 }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* Waiting indicator */}
      {data && !isPending && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
          <CircularProgress size={14} sx={{ color: 'secondary.main' }} />
          <Typography variant="caption" color="secondary.main">
            Waiting for device to connect...
          </Typography>
        </Box>
      )}
    </Box>
  );
}
