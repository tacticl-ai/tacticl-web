import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TopBar from '../../components/layout/TopBar';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import {
  useConnections,
  useConnectPlatform,
  useDisconnectPlatform,
  useHandleOAuthCallback,
  validateOAuthState,
} from '../../hooks/useConnections';
import { useSocialPosts, useCreatePost, useCancelPost } from '../../hooks/useSocial';
import { getPlatformsByCategory, getConnectionForPlatform } from '../../config/platformConfig';
import type { Connection, PostState } from '../../api/types';

const socialPlatforms = getPlatformsByCategory('social');

const postFilters: { value: string; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'QUEUED', label: 'Queued' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'FAILED', label: 'Failed' },
];

const stateChipColor: Record<PostState, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  DRAFT: 'default',
  QUEUED: 'info',
  PUBLISHING: 'warning',
  PUBLISHED: 'success',
  FAILED: 'error',
  CANCELLED: 'default',
};

export default function SocialConnectionsPage() {
  const navigate = useNavigate();
  const { data: connections, isLoading, isError, refetch } = useConnections();
  const connectPlatform = useConnectPlatform();
  const disconnectPlatform = useDisconnectPlatform();
  const handleOAuthCallback = useHandleOAuthCallback();
  const [searchParams, setSearchParams] = useSearchParams();

  const [oauthError, setOauthError] = useState<string | null>(null);
  const [postFilter, setPostFilter] = useState('ALL');
  const posts = useSocialPosts(postFilter === 'ALL' ? undefined : postFilter);
  const createPost = useCreatePost();
  const cancelPost = useCancelPost();
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostDate, setNewPostDate] = useState('');

  const displayConnections = connections ?? [];
  const displayPosts = posts.data ?? [];

  // Handle OAuth callback
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

      const redirectUri = window.location.origin + '/connections/social';
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
    const redirectUri = window.location.origin + '/connections/social';
    connectPlatform.mutate({ platform: platformKey, redirectUri });
  };

  const handleCreatePost = () => {
    createPost.mutate(
      {
        content: newPostContent,
        ...(newPostDate ? { publishDate: new Date(newPostDate).toISOString() } : {}),
      },
      {
        onSuccess: () => {
          setNewPostOpen(false);
          setNewPostContent('');
          setNewPostDate('');
        },
      },
    );
  };

  if (isLoading) {
    return (
      <>
        <TopBar title="Social Connections" />
        <LoadingState message="Loading connections..." />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <TopBar title="Social Connections" />
        <ErrorState message="Failed to load connections." onRetry={refetch} />
      </>
    );
  }

  return (
    <>
      <TopBar
        title="Social Connections"
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

      {/* Platform Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {socialPlatforms.map((platform) => {
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
                {/* Brand accent stripe */}
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
                      <Chip
                        label="Connected"
                        size="small"
                        color="success"
                        variant="filled"
                        sx={{ '& .MuiChip-label': { fontSize: '0.75rem' } }}
                      />
                    ) : (
                      <Chip
                        label="Not Connected"
                        size="small"
                        variant="outlined"
                        sx={{ '& .MuiChip-label': { fontSize: '0.75rem' } }}
                      />
                    )}
                    {needsReconnect && (
                      <Chip
                        icon={<WarningAmberIcon />}
                        label="Reconnect"
                        size="small"
                        color="warning"
                        variant="outlined"
                        sx={{ '& .MuiChip-label': { fontSize: '0.75rem' } }}
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

      {/* Posts Section */}
      <Divider sx={{ mb: 3 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Posts
        </Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          size="small"
          onClick={() => setNewPostOpen(true)}
        >
          New Post
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <ToggleButtonGroup
          value={postFilter}
          exclusive
          onChange={(_, v) => v && setPostFilter(v)}
          size="small"
        >
          {postFilters.map((f) => (
            <ToggleButton key={f.value} value={f.value}>
              {f.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {posts.isLoading ? (
        <LoadingState message="Loading posts..." />
      ) : posts.isError ? (
        <ErrorState message="Failed to load posts." onRetry={posts.refetch} />
      ) : displayPosts.length === 0 ? (
        <EmptyState
          variant="social"
          title="No posts"
          description="Create a post to publish across your connected social accounts."
          actionLabel="New Post"
          onAction={() => setNewPostOpen(true)}
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {displayPosts.map((post) => (
            <Card key={post.id}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        mb: 1,
                      }}
                    >
                      {post.content}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={post.state}
                        size="small"
                        color={stateChipColor[post.state] ?? 'default'}
                      />
                      {post.publishDate && (
                        <Typography variant="caption" color="text.secondary">
                          {new Date(post.publishDate).toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  {(post.state === 'DRAFT' || post.state === 'QUEUED') && (
                    <IconButton
                      size="small"
                      title="Cancel post"
                      onClick={() => cancelPost.mutate(post.id)}
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* New Post Dialog */}
      <Dialog open={newPostOpen} onClose={() => setNewPostOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Post</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Content"
            multiline
            rows={4}
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            fullWidth
          />
          <TextField
            label="Schedule (optional)"
            type="datetime-local"
            value={newPostDate}
            onChange={(e) => setNewPostDate(e.target.value)}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewPostOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreatePost}
            disabled={!newPostContent.trim() || createPost.isPending}
          >
            {createPost.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
