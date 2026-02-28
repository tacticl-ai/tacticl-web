import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import LinkIcon from '@mui/icons-material/Link';
import TopBar from '../components/layout/TopBar';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import { useAccounts, useConnectAccount, useDisconnectAccount, useHandleOAuthCallback, validateOAuthState } from '../hooks/useAccounts';
import type { Connection } from '../api/types';
import { platforms, getPlatformInfo } from '../components/common/platformInfo';
import type { PlatformInfo } from '../components/common/platformInfo';

function getIntegrationForPlatform(
  integrations: Connection[],
  platformKey: string,
): Connection | undefined {
  return integrations.find(
    (i) =>
      i.platform.toLowerCase() === platformKey ||
      (platformKey === 'twitter' && i.platform.toLowerCase() === 'x'),
  );
}

/**
 * AccountsPage provides a platform-centric grid for connecting and managing
 * OAuth account integrations (GitHub, YouTube, Twitter, etc.).
 *
 * For social media content publishing (posts, scheduling), see SocialPage
 * which focuses on content operations across connected platforms.
 */
export default function AccountsPage() {
  const { data: accounts, isLoading, isError, refetch } = useAccounts();
  const connectAccount = useConnectAccount();
  const disconnectAccount = useDisconnectAccount();
  const handleOAuthCallback = useHandleOAuthCallback();
  const [searchParams, setSearchParams] = useSearchParams();

  const displayAccounts = accounts ?? [];

  const [oauthError, setOauthError] = useState<string | null>(null);

  // Handle OAuth callback params in URL
  useEffect(() => {
    const code = searchParams.get('code');
    const platform = searchParams.get('platform');
    const state = searchParams.get('state');
    const codeVerifier = searchParams.get('code_verifier') || undefined;

    if (code && platform) {
      // Validate OAuth state parameter to prevent CSRF attacks
      if (!validateOAuthState(state)) {
        setOauthError('Invalid OAuth state. The authentication request may have been tampered with. Please try again.');
        setSearchParams({});
        return;
      }

      const redirectUri = window.location.origin + '/accounts';
      handleOAuthCallback.mutate(
        { platform, code, redirectUri, codeVerifier },
        {
          onSettled: () => {
            // Clean up URL params
            setSearchParams({});
          },
          onError: () => {
            setOauthError('Failed to connect account. Please try again.');
          },
        },
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = (platformKey: string) => {
    const redirectUri = window.location.origin + '/accounts';
    connectAccount.mutate({ platform: platformKey, redirectUri });
  };

  if (isLoading) {
    return (
      <>
        <TopBar title="Accounts" />
        <LoadingState message="Loading accounts..." />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <TopBar title="Accounts" />
        <ErrorState message="Failed to load accounts." onRetry={refetch} />
      </>
    );
  }

  // Identify agent-created accounts (those that have a spark-like origin or unusual pattern)
  // For now, we show all connected accounts in the grid and any extras separately
  const agentCreatedAccounts = displayAccounts.filter(
    (a) => !platforms.some((p) => p.key === a.platform.toLowerCase() || (a.platform.toLowerCase() === 'x' && p.key === 'twitter')),
  );

  return (
    <>
      <TopBar title="Accounts" />

      {oauthError && (
        <Alert severity="error" onClose={() => setOauthError(null)} sx={{ mb: 2 }}>
          {oauthError}
        </Alert>
      )}

      {/* Platform Cards */}
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Connected Accounts
      </Typography>

      {displayAccounts.length === 0 ? (
        <EmptyState
          variant="social"
          title="No accounts connected"
          description="Connect your social and developer accounts to let agents act on your behalf."
        />
      ) : null}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {platforms.map((platform) => {
          const integration = getIntegrationForPlatform(displayAccounts, platform.key);
          const isConnected = !!integration;

          return (
            <Grid key={platform.key} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardContent sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Avatar
                      src={integration?.profileImageUrl}
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
                          {integration.platformUsername}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Chip
                    label={isConnected ? 'Connected' : 'Not Connected'}
                    size="small"
                    color={isConnected ? 'success' : 'default'}
                    variant={isConnected ? 'filled' : 'outlined'}
                  />
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  {isConnected ? (
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      startIcon={<LinkOffIcon />}
                      onClick={() => disconnectAccount.mutate(integration.id)}
                      disabled={disconnectAccount.isPending}
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<LinkIcon />}
                      onClick={() => handleConnect(platform.key)}
                      disabled={connectAccount.isPending}
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

      {/* Agent-Created Accounts */}
      {agentCreatedAccounts.length > 0 && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Agent-Created Accounts
          </Typography>
          <Stack spacing={1.5}>
            {agentCreatedAccounts.map((account) => {
              const platformInfo = getPlatformInfo(account.platform);
              return (
                <Card key={account.id}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        src={account.profileImageUrl}
                        sx={{
                          bgcolor: platformInfo?.color ?? 'action.selected',
                          width: 36,
                          height: 36,
                          '& .MuiSvgIcon-root': { color: '#fff', fontSize: 18 },
                        }}
                      >
                        {platformInfo?.icon ?? <LinkIcon />}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2">
                          {account.platform} - {account.platformUsername}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Connected {new Date(account.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={() => disconnectAccount.mutate(account.id)}
                        disabled={disconnectAccount.isPending}
                      >
                        Disconnect
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        </>
      )}
    </>
  );
}
