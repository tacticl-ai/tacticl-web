import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TopBar from '../../components/layout/TopBar';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import {
  useConnections,
  useConnectPlatform,
  useDisconnectPlatform,
  useHandleOAuthCallback,
  validateOAuthState,
} from '../../hooks/useConnections';
import { getPlatformsByCategory, getConnectionForPlatform } from '../../config/platformConfig';
import type { Connection } from '../../api/types';

const mediaPlatforms = getPlatformsByCategory('media');

export default function MediaConnectionsPage() {
  const navigate = useNavigate();
  const { data: connections, isLoading, isError, refetch } = useConnections();
  const connectPlatform = useConnectPlatform();
  const disconnectPlatform = useDisconnectPlatform();
  const handleOAuthCallback = useHandleOAuthCallback();
  const [searchParams, setSearchParams] = useSearchParams();
  const [oauthError, setOauthError] = useState<string | null>(null);

  const displayConnections = connections ?? [];

  useEffect(() => {
    const code = searchParams.get('code');
    const platform = searchParams.get('platform');
    const state = searchParams.get('state');
    const codeVerifier = searchParams.get('code_verifier') || undefined;

    if (code && platform) {
      if (!validateOAuthState(state)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- OAuth callback runs once on mount
        setOauthError('Invalid OAuth state. Please try again.');
        setSearchParams({});
        return;
      }

      const redirectUri = window.location.origin + '/connections/media';
      handleOAuthCallback.mutate(
        { platform, code, redirectUri, codeVerifier },
        {
          onSettled: () => setSearchParams({}),
          onError: () => setOauthError('Failed to connect. Please try again.'),
        },
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = (platformKey: string) => {
    const redirectUri = window.location.origin + '/connections/media';
    connectPlatform.mutate({ platform: platformKey, redirectUri });
  };

  if (isLoading) {
    return (
      <>
        <TopBar title="Media Connections" />
        <LoadingState message="Loading connections..." />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <TopBar title="Media Connections" />
        <ErrorState message="Failed to load connections." onRetry={refetch} />
      </>
    );
  }

  return (
    <>
      <TopBar
        title="Media Connections"
        actions={
          <Button
            variant="text"
            startIcon={<ArrowBackIcon />}
            size="small"
            onClick={() => navigate('/connections')}
          >
            All Connections
          </Button>
        }
      />

      {oauthError && (
        <Alert severity="error" onClose={() => setOauthError(null)} sx={{ mb: 2 }}>
          {oauthError}
        </Alert>
      )}

      <Grid container spacing={2}>
        {mediaPlatforms.map((platform) => {
          const connection = getConnectionForPlatform(displayConnections as Connection[], platform.key);
          const isConnected = !!connection;
          const needsReconnect = connection?.tokenRefreshNeeded;

          return (
            <Grid key={platform.key} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'border-color 200ms ease, box-shadow 200ms ease',
                  border: 1,
                  borderColor: 'divider',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    borderColor: platform.color,
                    boxShadow: `0 4px 16px ${platform.color}15`,
                  },
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 4,
                    height: '100%',
                    bgcolor: isConnected ? platform.color : 'transparent',
                    transition: 'background-color 200ms ease',
                  }}
                />
                <CardContent sx={{ flex: 1, pl: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Avatar
                      src={connection?.profileImageUrl}
                      sx={{
                        bgcolor: platform.color,
                        width: 40,
                        height: 40,
                        '& .MuiSvgIcon-root': { color: '#fff' },
                      }}
                    >
                      {platform.icon}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {platform.name}
                      </Typography>
                      {isConnected && (
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {connection.platformUsername}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isConnected ? (
                      <Chip label="Connected" size="small" color="success" variant="filled" />
                    ) : (
                      <Chip label="Not Connected" size="small" variant="outlined" />
                    )}
                    {needsReconnect && (
                      <Chip
                        icon={<WarningAmberIcon />}
                        label="Reconnect"
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2, pl: 3 }}>
                  {isConnected ? (
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      startIcon={<LinkOffIcon />}
                      onClick={() => disconnectPlatform.mutate(connection.id)}
                      disabled={disconnectPlatform.isPending}
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<LinkIcon />}
                      onClick={() => handleConnect(platform.key)}
                      disabled={connectPlatform.isPending}
                      sx={{
                        bgcolor: platform.color,
                        '&:hover': { bgcolor: platform.color, filter: 'brightness(1.2)' },
                      }}
                    >
                      Connect
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </>
  );
}
