import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Avatar from '@mui/material/Avatar';
import ShareIcon from '@mui/icons-material/Share';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import XIcon from '@mui/icons-material/X';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import CancelIcon from '@mui/icons-material/Cancel';
import TopBar from '../components/layout/TopBar';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import {
  useSocialIntegrations,
  useDisconnectIntegration,
  useSocialPosts,
  useCreatePost,
  useCancelPost,
} from '../hooks/useSocial';
import { socialApi } from '../api/social';
import type { PostState, Connection } from '../api/types';

const platformIcons: Record<string, React.ReactElement> = {
  twitter: <XIcon />,
  x: <XIcon />,
  linkedin: <LinkedInIcon />,
  github: <GitHubIcon />,
  instagram: <InstagramIcon />,
  facebook: <FacebookIcon />,
};

const platformOptions = [
  { key: 'twitter', label: 'Twitter / X', icon: <XIcon /> },
  { key: 'linkedin', label: 'LinkedIn', icon: <LinkedInIcon /> },
  { key: 'github', label: 'GitHub', icon: <GitHubIcon /> },
  { key: 'instagram', label: 'Instagram', icon: <InstagramIcon /> },
  { key: 'facebook', label: 'Facebook', icon: <FacebookIcon /> },
];

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

function getStatusColor(integration: Connection): string {
  if (integration.disabled) return '#f44336';
  if (integration.tokenRefreshNeeded) return '#ff9800';
  return '#4caf50';
}

function getPlatformIcon(platform: string): React.ReactElement {
  return platformIcons[platform.toLowerCase()] ?? <ShareIcon />;
}

/**
 * SocialPage manages social media content publishing: creating posts, scheduling,
 * and viewing post status across connected platforms. It focuses on content operations.
 *
 * For account connection/disconnection management, see AccountsPage which provides
 * a platform-centric grid view for connecting and managing OAuth integrations.
 */
export default function SocialPage() {
  const integrations = useSocialIntegrations();
  const disconnectIntegration = useDisconnectIntegration();
  const [postFilter, setPostFilter] = useState('ALL');
  const posts = useSocialPosts(postFilter === 'ALL' ? undefined : postFilter);
  const createPost = useCreatePost();
  const cancelPost = useCancelPost();

  const [connectOpen, setConnectOpen] = useState(false);
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostDate, setNewPostDate] = useState('');

  const displayIntegrations = integrations.data ?? [];
  const displayPosts = posts.data ?? [];

  const handleConnect = async (platform: string) => {
    setConnectOpen(false);
    const redirectUri = window.location.origin + '/accounts';
    const resp = await socialApi.getOAuthUrl(platform, redirectUri);
    // Generate and store a random state for CSRF protection before redirecting
    const state = crypto.randomUUID();
    sessionStorage.setItem('tacticl_oauth_state', state);
    const separator = resp.authUrl.includes('?') ? '&' : '?';
    const authUrlWithState = `${resp.authUrl}${separator}state=${encodeURIComponent(state)}`;
    window.open(authUrlWithState, '_blank', 'noopener');
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

  return (
    <>
      <TopBar
        title="Social"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            size="small"
            onClick={() => setConnectOpen(true)}
          >
            Connect Account
          </Button>
        }
      />

      {/* Section 1: Connected Accounts */}
      {integrations.isLoading ? (
        <LoadingState message="Loading integrations..." />
      ) : integrations.isError ? (
        <ErrorState message="Failed to load integrations." onRetry={integrations.refetch} />
      ) : displayIntegrations.length === 0 ? (
        <EmptyState
          variant="social"
          title="No accounts connected"
          description="Connect your social accounts to publish content directly from Tacticl."
          actionLabel="Connect Account"
          onAction={() => setConnectOpen(true)}
        />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            },
            gap: 2,
          }}
        >
          {displayIntegrations.map((integration) => (
            <Card key={integration.id}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    src={integration.profileImageUrl}
                    sx={{ bgcolor: 'action.selected', width: 40, height: 40 }}
                  >
                    {getPlatformIcon(integration.platform)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2" noWrap>
                        {integration.platform}
                      </Typography>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: getStatusColor(integration),
                          flexShrink: 0,
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {integration.platformUsername}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    title="Disconnect"
                    onClick={() => disconnectIntegration.mutate(integration.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Section 2: Posts */}
      <Divider sx={{ my: 4 }} />

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

      {/* Connect Account Dialog */}
      <Dialog open={connectOpen} onClose={() => setConnectOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Connect Account</DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <List disablePadding>
            {platformOptions.map((opt) => (
              <ListItemButton key={opt.key} onClick={() => handleConnect(opt.key)}>
                <ListItemIcon>{opt.icon}</ListItemIcon>
                <ListItemText primary={opt.label} />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
      </Dialog>

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
