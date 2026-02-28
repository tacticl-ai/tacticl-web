# Connections Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rename and restructure Accounts/Social into a unified Connections section with category sub-pages and modernized card UI.

**Architecture:** Replace `SocialIntegration` with `Connection` throughout the data layer. Create a shared `platformConfig.ts` for platform definitions. Build 5 new page components under `src/pages/connections/`. Consolidate `accounts.ts` and OAuth methods from `social.ts` into a single `connections.ts` API module. Update routing and sidebar.

**Tech Stack:** React 19, TypeScript 5.9, MUI 7, React Router 7, TanStack React Query 5, Zustand

---

### Task 1: Create shared platform configuration

**Files:**
- Create: `src/config/platformConfig.ts`

**Step 1: Create the platform config file**

```typescript
import { createElement } from 'react';
import type { ReactElement } from 'react';
import YouTubeIcon from '@mui/icons-material/YouTube';
import InstagramIcon from '@mui/icons-material/Instagram';
import MailIcon from '@mui/icons-material/Mail';
import XIcon from '@mui/icons-material/X';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import FacebookIcon from '@mui/icons-material/Facebook';
import GitHubIcon from '@mui/icons-material/GitHub';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';

export type ConnectionCategory = 'social' | 'media' | 'developer' | 'productivity';

export interface PlatformInfo {
  key: string;
  name: string;
  icon: ReactElement;
  color: string;
  category: ConnectionCategory;
}

export const platforms: PlatformInfo[] = [
  // Social
  { key: 'twitter', name: 'X (Twitter)', icon: createElement(XIcon), color: '#000000', category: 'social' },
  { key: 'instagram', name: 'Instagram', icon: createElement(InstagramIcon), color: '#E4405F', category: 'social' },
  { key: 'linkedin', name: 'LinkedIn', icon: createElement(LinkedInIcon), color: '#0A66C2', category: 'social' },
  { key: 'facebook', name: 'Facebook', icon: createElement(FacebookIcon), color: '#1877F2', category: 'social' },
  { key: 'tiktok', name: 'TikTok', icon: createElement(VideoLibraryIcon), color: '#010101', category: 'social' },
  // Media
  { key: 'google_photos', name: 'Google Photos', icon: createElement(PhotoLibraryIcon), color: '#4285F4', category: 'media' },
  { key: 'youtube', name: 'YouTube', icon: createElement(YouTubeIcon), color: '#FF0000', category: 'media' },
  // Developer
  { key: 'github', name: 'GitHub', icon: createElement(GitHubIcon), color: '#181717', category: 'developer' },
  { key: 'gmail', name: 'Gmail', icon: createElement(MailIcon), color: '#D14836', category: 'developer' },
];

export const categoryLabels: Record<ConnectionCategory, string> = {
  social: 'Social',
  media: 'Media',
  developer: 'Developer',
  productivity: 'Productivity',
};

export const categoryDescriptions: Record<ConnectionCategory, string> = {
  social: 'Publish and manage content across social platforms',
  media: 'Access photos and videos from media services',
  developer: 'Connect developer tools and email',
  productivity: 'Integrate with productivity and collaboration tools',
};

export function getPlatformsByCategory(category: ConnectionCategory): PlatformInfo[] {
  return platforms.filter((p) => p.category === category);
}

export function getPlatformInfo(key: string): PlatformInfo | undefined {
  return platforms.find(
    (p) => p.key === key.toLowerCase() || (key.toLowerCase() === 'x' && p.key === 'twitter'),
  );
}

export function getConnectionForPlatform<T extends { platform: string }>(
  connections: T[],
  platformKey: string,
): T | undefined {
  return connections.find(
    (c) =>
      c.platform.toLowerCase() === platformKey ||
      (platformKey === 'twitter' && c.platform.toLowerCase() === 'x'),
  );
}
```

**Step 2: Commit**

```bash
git add src/config/platformConfig.ts
git commit -m "feat: add shared platform configuration with categories"
```

---

### Task 2: Rename types in data model

**Files:**
- Modify: `src/api/types.ts` (lines 269-312)

**Step 1: Rename SocialIntegration to Connection and update related types**

Replace the Social section (lines 269-312) in `src/api/types.ts`:

Old (lines 269-312):
```typescript
// ─── Social ─────────────────────────────────────────────

export interface SocialIntegration {
  id: string;
  platform: string;
  platformUsername: string;
  profileImageUrl?: string;
  disabled: boolean;
  tokenRefreshNeeded: boolean;
  tokenExpiresAt?: string;
  createdAt: string;
}

export type PostState = 'DRAFT' | 'QUEUED' | 'PUBLISHING' | 'PUBLISHED' | 'CANCELLED' | 'FAILED';

export interface SocialPost {
  id: string;
  content: string;
  mediaUrls: string[];
  targetIntegrationIds: string[];
  state: PostState;
  publishDate?: string;
  publishedPostId?: string;
  publishedUrl?: string;
  createdAt: string;
}

export interface CreatePostRequest {
  content: string;
  mediaUrls?: string[];
  targetIntegrationIds?: string[];
  publishDate?: string;
}

export interface OAuthAuthorizeResponse {
  authUrl: string;
  codeVerifier: string;
}

export interface OAuthCallbackResponse {
  integrationId: string | null;
  platform: string;
  success: boolean;
}
```

New:
```typescript
// ─── Connections ─────────────────────────────────────────

export interface Connection {
  id: string;
  platform: string;
  platformUsername: string;
  profileImageUrl?: string;
  disabled: boolean;
  tokenRefreshNeeded: boolean;
  tokenExpiresAt?: string;
  createdAt: string;
}

export type PostState = 'DRAFT' | 'QUEUED' | 'PUBLISHING' | 'PUBLISHED' | 'CANCELLED' | 'FAILED';

export interface SocialPost {
  id: string;
  content: string;
  mediaUrls: string[];
  targetConnectionIds: string[];
  state: PostState;
  publishDate?: string;
  publishedPostId?: string;
  publishedUrl?: string;
  createdAt: string;
}

export interface CreatePostRequest {
  content: string;
  mediaUrls?: string[];
  targetConnectionIds?: string[];
  publishDate?: string;
}

export interface OAuthAuthorizeResponse {
  authUrl: string;
  codeVerifier: string;
}

export interface OAuthCallbackResponse {
  connectionId: string | null;
  platform: string;
  success: boolean;
}
```

**Step 2: Verify build compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: Type errors in files still referencing old names (accounts.ts, social.ts, etc.) — that's fine, we fix those next.

**Step 3: Commit**

```bash
git add src/api/types.ts
git commit -m "refactor: rename SocialIntegration to Connection in data model"
```

---

### Task 3: Create connections API module

**Files:**
- Create: `src/api/connections.ts`

**Step 1: Create the connections API**

This replaces `accounts.ts` and the OAuth methods from `social.ts`:

```typescript
import { api } from './client';
import type { Connection, OAuthAuthorizeResponse, OAuthCallbackResponse } from './types';

export const connectionsApi = {
  list: () =>
    api.get<Connection[]>('/api/social/integrations'),

  getOAuthUrl: (platform: string, redirectUri: string) =>
    api.get<OAuthAuthorizeResponse>(
      `/api/social/oauth/${platform}/authorize?redirectUri=${encodeURIComponent(redirectUri)}`,
    ),

  handleOAuthCallback: (platform: string, code: string, redirectUri: string, codeVerifier?: string) => {
    let url = `/api/social/oauth/${platform}/callback?code=${encodeURIComponent(code)}&redirectUri=${encodeURIComponent(redirectUri)}`;
    if (codeVerifier) url += `&codeVerifier=${encodeURIComponent(codeVerifier)}`;
    return api.get<OAuthCallbackResponse>(url);
  },

  disconnect: (id: string) =>
    api.delete<void>(`/api/social/integrations/${id}`),
};
```

**Step 2: Commit**

```bash
git add src/api/connections.ts
git commit -m "feat: add connections API module"
```

---

### Task 4: Trim social API to posts-only

**Files:**
- Modify: `src/api/social.ts`

**Step 1: Remove all integration/OAuth methods, keep only posts**

Replace the entire file with:

```typescript
import { api } from './client';
import type { SocialPost, CreatePostRequest } from './types';

export const socialApi = {
  listPosts: (state?: string) =>
    api.get<SocialPost[]>(state ? `/api/social/posts?state=${state}` : '/api/social/posts'),

  getPost: (id: string) =>
    api.get<SocialPost>(`/api/social/posts/${id}`),

  createPost: (data: CreatePostRequest) =>
    api.post<SocialPost>('/api/social/posts', data),

  cancelPost: (id: string) =>
    api.delete<void>(`/api/social/posts/${id}`),
};
```

**Step 2: Commit**

```bash
git add src/api/social.ts
git commit -m "refactor: trim social API to posts-only, remove duplicate OAuth"
```

---

### Task 5: Create useConnections hook

**Files:**
- Create: `src/hooks/useConnections.ts`

**Step 1: Create the hook**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { connectionsApi } from '../api/connections';

const OAUTH_STATE_KEY = 'tacticl_oauth_state';

export function useConnections() {
  return useQuery({
    queryKey: ['connections'],
    queryFn: () => connectionsApi.list(),
    refetchInterval: 30_000,
  });
}

export function useConnectPlatform() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ platform, redirectUri }: { platform: string; redirectUri: string }) => {
      const result = await connectionsApi.getOAuthUrl(platform, redirectUri);
      const state = crypto.randomUUID();
      sessionStorage.setItem(OAUTH_STATE_KEY, state);
      const separator = result.authUrl.includes('?') ? '&' : '?';
      const authUrlWithState = `${result.authUrl}${separator}state=${encodeURIComponent(state)}`;
      window.open(authUrlWithState, '_blank', 'width=600,height=700');
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['connections'] }),
    onError: (error) => {
      console.error('Failed to connect platform:', error);
    },
  });
}

export function useHandleOAuthCallback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      platform,
      code,
      redirectUri,
      codeVerifier,
    }: {
      platform: string;
      code: string;
      redirectUri: string;
      codeVerifier?: string;
    }) => connectionsApi.handleOAuthCallback(platform, code, redirectUri, codeVerifier),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['connections'] }),
    onError: (error) => {
      console.error('Failed to handle OAuth callback:', error);
    },
  });
}

export function useDisconnectPlatform() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => connectionsApi.disconnect(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['connections'] }),
    onError: (error) => {
      console.error('Failed to disconnect platform:', error);
    },
  });
}

export function validateOAuthState(urlState: string | null): boolean {
  const savedState = sessionStorage.getItem(OAUTH_STATE_KEY);
  sessionStorage.removeItem(OAUTH_STATE_KEY);
  if (!urlState || !savedState) return false;
  return urlState === savedState;
}
```

**Step 2: Commit**

```bash
git add src/hooks/useConnections.ts
git commit -m "feat: add useConnections hook with OAuth support"
```

---

### Task 6: Trim useSocial hook to posts-only

**Files:**
- Modify: `src/hooks/useSocial.ts`

**Step 1: Remove integration hooks, keep only post hooks**

Replace the entire file with:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialApi } from '../api/social';

export function useSocialPosts(state?: string) {
  return useQuery({
    queryKey: ['social-posts', state],
    queryFn: () => socialApi.listPosts(state),
    refetchInterval: 15_000,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: socialApi.createPost,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['social-posts'] }),
    onError: (error) => {
      console.error('Failed to create post:', error);
    },
  });
}

export function useCancelPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => socialApi.cancelPost(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['social-posts'] }),
    onError: (error) => {
      console.error('Failed to cancel post:', error);
    },
  });
}
```

**Step 2: Commit**

```bash
git add src/hooks/useSocial.ts
git commit -m "refactor: trim useSocial to posts-only hooks"
```

---

### Task 7: Create ConnectionsOverviewPage

**Files:**
- Create: `src/pages/connections/ConnectionsOverviewPage.tsx`

**Step 1: Create the overview page with modernized category cards**

```typescript
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import ShareIcon from '@mui/icons-material/Share';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import CodeIcon from '@mui/icons-material/Code';
import BuildIcon from '@mui/icons-material/Build';
import TopBar from '../../components/layout/TopBar';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import { useConnections } from '../../hooks/useConnections';
import {
  type ConnectionCategory,
  categoryLabels,
  categoryDescriptions,
  getPlatformsByCategory,
  getConnectionForPlatform,
} from '../../config/platformConfig';
import type { Connection } from '../../api/types';

const categoryIcons: Record<ConnectionCategory, React.ReactElement> = {
  social: <ShareIcon />,
  media: <PhotoLibraryIcon />,
  developer: <CodeIcon />,
  productivity: <BuildIcon />,
};

const categoryAccentColors: Record<ConnectionCategory, string> = {
  social: '#6C63FF',
  media: '#FF6B6B',
  developer: '#03DAC6',
  productivity: '#FF9800',
};

const categories: ConnectionCategory[] = ['social', 'media', 'developer', 'productivity'];

export default function ConnectionsOverviewPage() {
  const { data: connections, isLoading, isError, refetch } = useConnections();
  const navigate = useNavigate();
  const displayConnections = connections ?? [];

  if (isLoading) {
    return (
      <>
        <TopBar title="Connections" />
        <LoadingState message="Loading connections..." />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <TopBar title="Connections" />
        <ErrorState message="Failed to load connections." onRetry={refetch} />
      </>
    );
  }

  return (
    <>
      <TopBar title="Connections" />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Connect your accounts to let Tacticl act on your behalf across platforms.
      </Typography>

      <Grid container spacing={3}>
        {categories.map((category) => {
          const categoryPlatforms = getPlatformsByCategory(category);
          const connectedPlatforms = categoryPlatforms.filter((p) =>
            getConnectionForPlatform(displayConnections as Connection[], p.key),
          );
          const connectedCount = connectedPlatforms.length;
          const totalCount = categoryPlatforms.length;
          const accentColor = categoryAccentColors[category];
          const isComingSoon = category === 'productivity';

          return (
            <Grid key={category} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease',
                  border: 1,
                  borderColor: 'divider',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 24px ${accentColor}20`,
                    borderColor: accentColor,
                  },
                  ...(isComingSoon && { opacity: 0.6 }),
                }}
              >
                {/* Accent stripe */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    bgcolor: accentColor,
                  }}
                />
                <CardActionArea
                  onClick={() => navigate(`/connections/${category}`)}
                  disabled={isComingSoon}
                  sx={{ height: '100%', p: 0 }}
                >
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        sx={{
                          bgcolor: `${accentColor}20`,
                          color: accentColor,
                          width: 44,
                          height: 44,
                        }}
                      >
                        {categoryIcons[category]}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                          {categoryLabels[category]}
                        </Typography>
                        {isComingSoon && (
                          <Chip label="Coming Soon" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                        )}
                      </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40 }}>
                      {categoryDescriptions[category]}
                    </Typography>

                    {!isComingSoon && (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <AvatarGroup
                          max={5}
                          sx={{
                            '& .MuiAvatar-root': {
                              width: 28,
                              height: 28,
                              fontSize: 12,
                              border: '2px solid',
                              borderColor: 'background.paper',
                            },
                          }}
                        >
                          {categoryPlatforms.map((p) => {
                            const connected = !!getConnectionForPlatform(
                              displayConnections as Connection[],
                              p.key,
                            );
                            return (
                              <Avatar
                                key={p.key}
                                sx={{
                                  bgcolor: p.color,
                                  opacity: connected ? 1 : 0.3,
                                  '& .MuiSvgIcon-root': { color: '#fff', fontSize: 14 },
                                }}
                              >
                                {p.icon}
                              </Avatar>
                            );
                          })}
                        </AvatarGroup>
                        <Chip
                          label={`${connectedCount} / ${totalCount}`}
                          size="small"
                          color={connectedCount > 0 ? 'success' : 'default'}
                          variant={connectedCount > 0 ? 'filled' : 'outlined'}
                        />
                      </Box>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </>
  );
}
```

**Step 2: Commit**

```bash
git add src/pages/connections/ConnectionsOverviewPage.tsx
git commit -m "feat: add connections overview page with category cards"
```

---

### Task 8: Create SocialConnectionsPage

**Files:**
- Create: `src/pages/connections/SocialConnectionsPage.tsx`

**Step 1: Create the social connections page (platforms + posts)**

This merges the social platforms from AccountsPage + full SocialPage posts into one page with modernized cards.

```typescript
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
```

**Step 2: Commit**

```bash
git add src/pages/connections/SocialConnectionsPage.tsx
git commit -m "feat: add social connections page with posts"
```

---

### Task 9: Create MediaConnectionsPage

**Files:**
- Create: `src/pages/connections/MediaConnectionsPage.tsx`

**Step 1: Create the media connections page**

Same pattern as social but for Google Photos + YouTube, no posts section.

```typescript
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
```

**Step 2: Commit**

```bash
git add src/pages/connections/MediaConnectionsPage.tsx
git commit -m "feat: add media connections page"
```

---

### Task 10: Create DeveloperConnectionsPage

**Files:**
- Create: `src/pages/connections/DeveloperConnectionsPage.tsx`

**Step 1: Create the developer connections page**

Same pattern as media, for GitHub + Gmail.

```typescript
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

const developerPlatforms = getPlatformsByCategory('developer');

export default function DeveloperConnectionsPage() {
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
        setOauthError('Invalid OAuth state. Please try again.');
        setSearchParams({});
        return;
      }

      const redirectUri = window.location.origin + '/connections/developer';
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
    const redirectUri = window.location.origin + '/connections/developer';
    connectPlatform.mutate({ platform: platformKey, redirectUri });
  };

  if (isLoading) {
    return (
      <>
        <TopBar title="Developer Connections" />
        <LoadingState message="Loading connections..." />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <TopBar title="Developer Connections" />
        <ErrorState message="Failed to load connections." onRetry={refetch} />
      </>
    );
  }

  return (
    <>
      <TopBar
        title="Developer Connections"
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
        {developerPlatforms.map((platform) => {
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
```

**Step 2: Commit**

```bash
git add src/pages/connections/DeveloperConnectionsPage.tsx
git commit -m "feat: add developer connections page"
```

---

### Task 11: Create ProductivityConnectionsPage

**Files:**
- Create: `src/pages/connections/ProductivityConnectionsPage.tsx`

**Step 1: Create the coming soon placeholder page**

```typescript
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BuildIcon from '@mui/icons-material/Build';
import TopBar from '../../components/layout/TopBar';

export default function ProductivityConnectionsPage() {
  const navigate = useNavigate();

  return (
    <>
      <TopBar
        title="Productivity Connections"
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

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 10,
          gap: 2,
        }}
      >
        <BuildIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.4 }} />
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Coming Soon
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, textAlign: 'center' }}>
          Productivity integrations like Slack, Notion, and Google Drive are on the way.
          Stay tuned for updates.
        </Typography>
      </Box>
    </>
  );
}
```

**Step 2: Commit**

```bash
git add src/pages/connections/ProductivityConnectionsPage.tsx
git commit -m "feat: add productivity connections placeholder page"
```

---

### Task 12: Update routing and sidebar

**Files:**
- Modify: `src/App.tsx` (lines 19-20 imports, lines 74-75 routes)
- Modify: `src/components/layout/Sidebar.tsx` (lines 20-22 imports, lines 40-44 items)

**Step 1: Update App.tsx**

Replace imports (lines 19-20):

Old:
```typescript
import SocialPage from './pages/SocialPage';
import AccountsPage from './pages/AccountsPage';
```

New:
```typescript
import ConnectionsOverviewPage from './pages/connections/ConnectionsOverviewPage';
import SocialConnectionsPage from './pages/connections/SocialConnectionsPage';
import MediaConnectionsPage from './pages/connections/MediaConnectionsPage';
import DeveloperConnectionsPage from './pages/connections/DeveloperConnectionsPage';
import ProductivityConnectionsPage from './pages/connections/ProductivityConnectionsPage';
```

Replace routes (lines 74-75):

Old:
```typescript
          <Route path="/social" element={<SocialPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
```

New:
```typescript
          <Route path="/connections" element={<ConnectionsOverviewPage />} />
          <Route path="/connections/social" element={<SocialConnectionsPage />} />
          <Route path="/connections/media" element={<MediaConnectionsPage />} />
          <Route path="/connections/developer" element={<DeveloperConnectionsPage />} />
          <Route path="/connections/productivity" element={<ProductivityConnectionsPage />} />
```

**Step 2: Update Sidebar.tsx**

Replace imports — remove `ShareIcon` and `AccountCircleIcon` (lines 20-21), add `CableIcon`:

Old:
```typescript
import ShareIcon from '@mui/icons-material/Share';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
```

New:
```typescript
import CableIcon from '@mui/icons-material/Cable';
```

Replace secondary items (lines 40-44):

Old:
```typescript
const secondaryItems = [
  { label: 'Social', path: '/social', icon: ShareIcon },
  { label: 'Accounts', path: '/accounts', icon: AccountCircleIcon },
  { label: 'Settings', path: '/settings', icon: SettingsIcon },
];
```

New:
```typescript
const secondaryItems = [
  { label: 'Connections', path: '/connections', icon: CableIcon },
  { label: 'Settings', path: '/settings', icon: SettingsIcon },
];
```

**Step 3: Commit**

```bash
git add src/App.tsx src/components/layout/Sidebar.tsx
git commit -m "feat: wire up connections routes and sidebar"
```

---

### Task 13: Delete old files

**Files:**
- Delete: `src/pages/AccountsPage.tsx`
- Delete: `src/pages/SocialPage.tsx`
- Delete: `src/api/accounts.ts`
- Delete: `src/hooks/useAccounts.ts`

**Step 1: Remove old files**

```bash
git rm src/pages/AccountsPage.tsx src/pages/SocialPage.tsx src/api/accounts.ts src/hooks/useAccounts.ts
```

**Step 2: Commit**

```bash
git commit -m "chore: remove old accounts/social pages and API"
```

---

### Task 14: Build verification

**Step 1: Run lint**

```bash
npm run lint
```

Fix any lint errors.

**Step 2: Run build**

```bash
npm run build
```

Fix any TypeScript or build errors.

**Step 3: Commit fixes if any**

```bash
git add -A
git commit -m "fix: lint and build fixes for connections redesign"
```
