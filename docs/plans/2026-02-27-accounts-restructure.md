# Accounts Restructure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Merge Social and Accounts pages into a unified Accounts section with category sub-pages (Social, Media, Developer) and add Google Photos as a connectable platform.

**Architecture:** Replace the flat AccountsPage and SocialPage with a category overview page at `/accounts` that links to three sub-pages. Each sub-page shows platform cards for its category with connect/disconnect. The Social sub-page also includes the posts workflow. A shared `platformConfig.ts` defines all platforms and their categories.

**Tech Stack:** React 19, TypeScript, MUI 7, React Router 7, TanStack React Query 5

---

### Task 1: Create shared platform configuration

**Files:**
- Create: `src/config/platformConfig.ts`

**Step 1: Create the platform config file**

```typescript
import YouTubeIcon from '@mui/icons-material/YouTube';
import InstagramIcon from '@mui/icons-material/Instagram';
import MailIcon from '@mui/icons-material/Mail';
import XIcon from '@mui/icons-material/X';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import FacebookIcon from '@mui/icons-material/Facebook';
import GitHubIcon from '@mui/icons-material/GitHub';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import { createElement } from 'react';
import type { ReactElement } from 'react';

export type PlatformCategory = 'social' | 'media' | 'developer';

export interface PlatformInfo {
  key: string;
  name: string;
  icon: ReactElement;
  color: string;
  category: PlatformCategory;
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

export const categoryLabels: Record<PlatformCategory, string> = {
  social: 'Social',
  media: 'Media',
  developer: 'Developer',
};

export const categoryDescriptions: Record<PlatformCategory, string> = {
  social: 'Connect social platforms to publish and manage content',
  media: 'Connect media services to access photos and videos',
  developer: 'Connect developer tools and email',
};

export function getPlatformsByCategory(category: PlatformCategory): PlatformInfo[] {
  return platforms.filter((p) => p.category === category);
}

export function getPlatformInfo(key: string): PlatformInfo | undefined {
  return platforms.find(
    (p) => p.key === key.toLowerCase() || (key.toLowerCase() === 'x' && p.key === 'twitter'),
  );
}

export function getIntegrationForPlatform(
  integrations: { platform: string }[],
  platformKey: string,
) {
  return integrations.find(
    (i) =>
      i.platform.toLowerCase() === platformKey ||
      (platformKey === 'twitter' && i.platform.toLowerCase() === 'x'),
  );
}
```

**Step 2: Commit**

```bash
git add src/config/platformConfig.ts
git commit -m "feat: add shared platform configuration with categories"
```

---

### Task 2: Create AccountsOverviewPage

**Files:**
- Create: `src/pages/accounts/AccountsOverviewPage.tsx`

This is the new `/accounts` page showing 3 category cards. Each card displays:
- Category icon and name
- Connected account count (from the accounts query)
- Mini avatar row of connected platform icons
- Status chip (connected count / total)
- Clicking navigates to `/accounts/{category}`

**Step 1: Create the overview page**

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
import TopBar from '../../components/layout/TopBar';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import { useAccounts } from '../../hooks/useAccounts';
import {
  type PlatformCategory,
  categoryLabels,
  categoryDescriptions,
  getPlatformsByCategory,
  getIntegrationForPlatform,
} from '../../config/platformConfig';
import type { SocialIntegration } from '../../api/types';

const categoryIcons: Record<PlatformCategory, React.ReactElement> = {
  social: <ShareIcon />,
  media: <PhotoLibraryIcon />,
  developer: <CodeIcon />,
};

const categories: PlatformCategory[] = ['social', 'media', 'developer'];

export default function AccountsOverviewPage() {
  const { data: accounts, isLoading, isError, refetch } = useAccounts();
  const navigate = useNavigate();
  const displayAccounts = accounts ?? [];

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

  return (
    <>
      <TopBar title="Accounts" />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Connect your accounts to let Tacticl act on your behalf across platforms.
      </Typography>

      <Grid container spacing={3}>
        {categories.map((category) => {
          const categoryPlatforms = getPlatformsByCategory(category);
          const connectedPlatforms = categoryPlatforms.filter((p) =>
            getIntegrationForPlatform(displayAccounts as SocialIntegration[], p.key),
          );
          const connectedCount = connectedPlatforms.length;
          const totalCount = categoryPlatforms.length;

          return (
            <Grid key={category} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'border-color 0.2s',
                  border: 1,
                  borderColor: 'divider',
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                <CardActionArea
                  onClick={() => navigate(`/accounts/${category}`)}
                  sx={{ height: '100%', p: 0 }}
                >
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44 }}>
                        {categoryIcons[category]}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {categoryLabels[category]}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {categoryDescriptions[category]}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <AvatarGroup max={5} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: 12 } }}>
                        {categoryPlatforms.map((p) => {
                          const connected = !!getIntegrationForPlatform(displayAccounts as SocialIntegration[], p.key);
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
git add src/pages/accounts/AccountsOverviewPage.tsx
git commit -m "feat: add accounts overview page with category cards"
```

---

### Task 3: Create SocialAccountsPage

**Files:**
- Create: `src/pages/accounts/SocialAccountsPage.tsx`

Merges the social platforms from AccountsPage + full SocialPage (posts) into one page. Uses shared `platformConfig` for platform data.

**Step 1: Create the social accounts page**

This page should:
- Have a back button/breadcrumb linking to `/accounts`
- Show social platform cards (X, Instagram, LinkedIn, Facebook, TikTok) with connect/disconnect
- Handle OAuth callback params (code, platform, state in URL)
- Show the Posts section below (filter toggles, post list, new post dialog)
- Reuse hooks: `useAccounts`, `useConnectAccount`, `useDisconnectAccount`, `useHandleOAuthCallback`, `validateOAuthState` from `useAccounts`
- Reuse hooks: `useSocialPosts`, `useCreatePost`, `useCancelPost` from `useSocial`
- Use `getPlatformsByCategory('social')` from `platformConfig` for the platform list

Pattern: Take the current `AccountsPage.tsx` platform card rendering (lines 168-241) filtered to social category + the current `SocialPage.tsx` posts section (lines 224-363) and combine them. Keep the OAuth callback handling from `AccountsPage.tsx` (lines 86-114), updating the redirect URI to `/accounts/social`.

**Step 2: Commit**

```bash
git add src/pages/accounts/SocialAccountsPage.tsx
git commit -m "feat: add social accounts sub-page with posts"
```

---

### Task 4: Create MediaAccountsPage

**Files:**
- Create: `src/pages/accounts/MediaAccountsPage.tsx`

**Step 1: Create the media accounts page**

Same pattern as social but:
- Back button to `/accounts`
- Shows media platforms only: Google Photos, YouTube
- Connect/disconnect with OAuth
- No posts section (future: photo browser)
- Redirect URI: `/accounts/media`
- Uses `getPlatformsByCategory('media')` from `platformConfig`

**Step 2: Commit**

```bash
git add src/pages/accounts/MediaAccountsPage.tsx
git commit -m "feat: add media accounts sub-page"
```

---

### Task 5: Create DeveloperAccountsPage

**Files:**
- Create: `src/pages/accounts/DeveloperAccountsPage.tsx`

**Step 1: Create the developer accounts page**

Same pattern as media but:
- Shows developer platforms: GitHub, Gmail
- Uses `getPlatformsByCategory('developer')` from `platformConfig`
- Redirect URI: `/accounts/developer`

**Step 2: Commit**

```bash
git add src/pages/accounts/DeveloperAccountsPage.tsx
git commit -m "feat: add developer accounts sub-page"
```

---

### Task 6: Update routing and sidebar

**Files:**
- Modify: `src/App.tsx` — Update routes
- Modify: `src/components/layout/Sidebar.tsx` — Remove Social entry
- Modify (or delete): `src/pages/AccountsPage.tsx` — Replace with redirect or remove
- Modify (or delete): `src/pages/SocialPage.tsx` — Replace with redirect or remove

**Step 1: Update App.tsx routes**

Replace the `/social` and `/accounts` routes with:
```typescript
import AccountsOverviewPage from './pages/accounts/AccountsOverviewPage';
import SocialAccountsPage from './pages/accounts/SocialAccountsPage';
import MediaAccountsPage from './pages/accounts/MediaAccountsPage';
import DeveloperAccountsPage from './pages/accounts/DeveloperAccountsPage';

// In the protected routes:
<Route path="/accounts" element={<AccountsOverviewPage />} />
<Route path="/accounts/social" element={<SocialAccountsPage />} />
<Route path="/accounts/media" element={<MediaAccountsPage />} />
<Route path="/accounts/developer" element={<DeveloperAccountsPage />} />
<Route path="/social" element={<Navigate to="/accounts/social" replace />} />
```

Remove old imports for `SocialPage` and `AccountsPage`.

**Step 2: Update Sidebar.tsx**

Remove the Social entry from `secondaryItems`. Keep Accounts and Settings:

```typescript
const secondaryItems = [
  { label: 'Accounts', path: '/accounts', icon: AccountCircleIcon },
  { label: 'Settings', path: '/settings', icon: SettingsIcon },
];
```

**Step 3: Delete old page files**

Delete `src/pages/AccountsPage.tsx` and `src/pages/SocialPage.tsx` since they are fully replaced.

**Step 4: Commit**

```bash
git add src/App.tsx src/components/layout/Sidebar.tsx
git rm src/pages/AccountsPage.tsx src/pages/SocialPage.tsx
git commit -m "feat: wire up accounts sub-routes, remove old pages"
```

---

### Task 7: Verify and clean up

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

**Step 3: Manual testing checklist**

- [ ] `/accounts` shows 3 category cards with correct counts
- [ ] Clicking each card navigates to the correct sub-page
- [ ] `/accounts/social` shows social platforms + posts section
- [ ] `/accounts/media` shows Google Photos + YouTube
- [ ] `/accounts/developer` shows GitHub + Gmail
- [ ] Connect/Disconnect OAuth flow works on each sub-page
- [ ] `/social` redirects to `/accounts/social`
- [ ] Sidebar shows single "Accounts" entry (no "Social")
- [ ] Back button on each sub-page returns to `/accounts`

**Step 4: Final commit if any fixes**

```bash
git add -A
git commit -m "fix: lint and build fixes for accounts restructure"
```
