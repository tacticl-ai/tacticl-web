import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LinkIcon from '@mui/icons-material/Link';
import { getPlatformInfo } from '../common/platformInfo';
import { useConnectPlatform } from '../../hooks/useConnections';
import type { AgentAction } from '../../api/types';

interface ConnectAccountCardProps {
  action: AgentAction;
  onComplete: () => void;
}

export default function ConnectAccountCard({ action, onComplete }: ConnectAccountCardProps) {
  const [completed, setCompleted] = useState(false);
  const connectPlatform = useConnectPlatform();
  const platform = action.platform ?? '';
  const info = getPlatformInfo(platform);

  const handleConnect = () => {
    const redirectUri = window.location.origin + '/chat';
    connectPlatform.mutate(
      { platform, redirectUri },
      {
        onSuccess: () => {
          setCompleted(true);
          onComplete();
        },
      },
    );
  };

  if (completed) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
        <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
        <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
          {info?.name ?? platform} connected!
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1.5,
        mt: 1.5,
        borderRadius: 2,
        bgcolor: 'rgba(108,99,255,0.08)',
        border: '1px solid rgba(108,99,255,0.2)',
      }}
    >
      <Avatar
        sx={{
          bgcolor: info?.color ?? 'action.selected',
          width: 32,
          height: 32,
          '& .MuiSvgIcon-root': { color: '#fff', fontSize: 18 },
        }}
      >
        {info?.icon ?? <LinkIcon />}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600}>
          {info?.name ?? platform}
        </Typography>
        {action.message && (
          <Typography variant="caption" color="text.secondary">
            {action.message}
          </Typography>
        )}
      </Box>
      <Button
        size="small"
        variant="contained"
        onClick={handleConnect}
        disabled={connectPlatform.isPending}
        startIcon={connectPlatform.isPending ? <CircularProgress size={14} /> : <LinkIcon />}
        sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.75rem' }}
      >
        Connect
      </Button>
    </Box>
  );
}
