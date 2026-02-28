# Chat-Driven Setup Actions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let the backend agent return structured "action" payloads in chat responses so the frontend renders inline cards for connecting accounts, granting repos, adding tokens, and pairing devices — then auto-resumes the original command.

**Architecture:** Extend `AgentCommandResponse` with an optional `actions` array. New `ActionCard` components render inside `MessageBubble`. On action completion, the original user command is automatically re-sent. OAuth redirects are survived via sessionStorage.

**Tech Stack:** React 19, TypeScript, MUI 7, TanStack React Query, existing API hooks

---

### Task 1: Add AgentAction types to types.ts

**Files:**
- Modify: `src/api/types.ts`

**Step 1: Add the new types after the existing `AgentCommandResponse` interface**

Add these types at the end of the Agent section (after line 363):

```typescript
// ─── Agent Actions (chat-driven setup) ──────────────────

export type AgentActionType = 'connect_account' | 'grant_repo' | 'add_token' | 'connect_device';

export interface AgentAction {
  type: AgentActionType;
  platform?: string;
  provider?: RepoProvider;
  tokenProvider?: TokenProvider;
  repoFullName?: string;
  accessLevel?: RepoAccessLevel;
  message?: string;
}
```

**Step 2: Add `actions` field to `AgentCommandResponse`**

Add after the `deviceName` field:

```typescript
  actions?: AgentAction[];
```

**Step 3: Verify the build compiles**

Run: `npx tsc --noEmit`
Expected: No errors (new types are additive)

**Step 4: Commit**

```bash
git add src/api/types.ts
git commit -m "feat: add AgentAction types for chat-driven setup"
```

---

### Task 2: Extract shared platform info constant

**Files:**
- Create: `src/components/common/platformInfo.ts`
- Modify: `src/pages/AccountsPage.tsx`

**Step 1: Create the shared platform info file**

Extract the `platforms` array and helper functions from AccountsPage into a shared module:

```typescript
import YouTubeIcon from '@mui/icons-material/YouTube';
import InstagramIcon from '@mui/icons-material/Instagram';
import MailIcon from '@mui/icons-material/Mail';
import XIcon from '@mui/icons-material/X';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import FacebookIcon from '@mui/icons-material/Facebook';
import GitHubIcon from '@mui/icons-material/GitHub';
import { createElement } from 'react';

export interface PlatformInfo {
  key: string;
  name: string;
  icon: React.ReactElement;
  color: string;
}

export const platforms: PlatformInfo[] = [
  { key: 'youtube', name: 'YouTube', icon: createElement(YouTubeIcon), color: '#FF0000' },
  { key: 'instagram', name: 'Instagram', icon: createElement(InstagramIcon), color: '#E4405F' },
  { key: 'gmail', name: 'Gmail', icon: createElement(MailIcon), color: '#D14836' },
  { key: 'twitter', name: 'X (Twitter)', icon: createElement(XIcon), color: '#000000' },
  { key: 'tiktok', name: 'TikTok', icon: createElement(VideoLibraryIcon), color: '#010101' },
  { key: 'linkedin', name: 'LinkedIn', icon: createElement(LinkedInIcon), color: '#0A66C2' },
  { key: 'facebook', name: 'Facebook', icon: createElement(FacebookIcon), color: '#1877F2' },
  { key: 'github', name: 'GitHub', icon: createElement(GitHubIcon), color: '#181717' },
];

export function getPlatformInfo(key: string): PlatformInfo | undefined {
  return platforms.find(
    (p) => p.key === key.toLowerCase() || (key.toLowerCase() === 'x' && p.key === 'twitter'),
  );
}
```

**Step 2: Update AccountsPage to import from shared module**

Remove the local `PlatformInfo` interface, `platforms` array, and `getPlatformInfo` function. Replace with:

```typescript
import { platforms, getPlatformInfo } from '../components/common/platformInfo';
import type { PlatformInfo } from '../components/common/platformInfo';
```

Keep the `getIntegrationForPlatform` function in AccountsPage since it's page-specific.

**Step 3: Verify the build compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/common/platformInfo.ts src/pages/AccountsPage.tsx
git commit -m "refactor: extract shared platform info constant"
```

---

### Task 3: Create ConnectAccountCard component

**Files:**
- Create: `src/components/chat/ConnectAccountCard.tsx`

**Step 1: Create the component**

```typescript
import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LinkIcon from '@mui/icons-material/Link';
import { getPlatformInfo } from '../common/platformInfo';
import { useConnectAccount } from '../../hooks/useAccounts';
import type { AgentAction } from '../../api/types';

interface ConnectAccountCardProps {
  action: AgentAction;
  onComplete: () => void;
}

export default function ConnectAccountCard({ action, onComplete }: ConnectAccountCardProps) {
  const [completed, setCompleted] = useState(false);
  const connectAccount = useConnectAccount();
  const platform = action.platform ?? '';
  const info = getPlatformInfo(platform);

  const handleConnect = () => {
    const redirectUri = window.location.origin + '/chat';
    connectAccount.mutate(
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
        disabled={connectAccount.isPending}
        startIcon={connectAccount.isPending ? <CircularProgress size={14} /> : <LinkIcon />}
        sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.75rem' }}
      >
        Connect
      </Button>
    </Box>
  );
}
```

**Step 2: Verify the build compiles**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/components/chat/ConnectAccountCard.tsx
git commit -m "feat: add ConnectAccountCard for inline OAuth connect"
```

---

### Task 4: Create GrantRepoCard component

**Files:**
- Create: `src/components/chat/GrantRepoCard.tsx`

**Step 1: Create the component**

```typescript
import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FolderIcon from '@mui/icons-material/Folder';
import { useGrantRepo } from '../../hooks/useRepos';
import type { AgentAction, RepoProvider, RepoAccessLevel } from '../../api/types';

interface GrantRepoCardProps {
  action: AgentAction;
  onComplete: () => void;
}

export default function GrantRepoCard({ action, onComplete }: GrantRepoCardProps) {
  const [completed, setCompleted] = useState(false);
  const [provider, setProvider] = useState<RepoProvider>(action.provider ?? 'GITHUB');
  const [repoFullName, setRepoFullName] = useState(action.repoFullName ?? '');
  const [accessLevel, setAccessLevel] = useState<RepoAccessLevel>(action.accessLevel as RepoAccessLevel ?? 'READ');
  const grantRepo = useGrantRepo();

  const handleGrant = () => {
    if (!repoFullName.trim()) return;
    grantRepo.mutate(
      { provider, repoFullName: repoFullName.trim(), accessLevel },
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
          {repoFullName} access granted!
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
        <FolderIcon sx={{ fontSize: 20, color: 'primary.light' }} />
        <Typography variant="body2" fontWeight={600}>
          Grant Repository Access
        </Typography>
      </Box>
      {action.message && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          {action.message}
        </Typography>
      )}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <TextField
          select
          size="small"
          value={provider}
          onChange={(e) => setProvider(e.target.value as RepoProvider)}
          sx={{ minWidth: 100, '& .MuiInputBase-root': { fontSize: '0.8125rem' } }}
        >
          <MenuItem value="GITHUB">GitHub</MenuItem>
          <MenuItem value="GITLAB">GitLab</MenuItem>
          <MenuItem value="BITBUCKET">Bitbucket</MenuItem>
        </TextField>
        <TextField
          size="small"
          placeholder="owner/repo"
          value={repoFullName}
          onChange={(e) => setRepoFullName(e.target.value)}
          sx={{ flex: 1, minWidth: 140, '& .MuiInputBase-root': { fontSize: '0.8125rem' } }}
        />
        <TextField
          select
          size="small"
          value={accessLevel}
          onChange={(e) => setAccessLevel(e.target.value as RepoAccessLevel)}
          sx={{ minWidth: 90, '& .MuiInputBase-root': { fontSize: '0.8125rem' } }}
        >
          <MenuItem value="READ">Read</MenuItem>
          <MenuItem value="WRITE">Write</MenuItem>
          <MenuItem value="ADMIN">Admin</MenuItem>
        </TextField>
        <Button
          size="small"
          variant="contained"
          onClick={handleGrant}
          disabled={!repoFullName.trim() || grantRepo.isPending}
          startIcon={grantRepo.isPending ? <CircularProgress size={14} /> : undefined}
          sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.75rem' }}
        >
          Grant
        </Button>
      </Box>
    </Box>
  );
}
```

**Step 2: Verify the build compiles**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/components/chat/GrantRepoCard.tsx
git commit -m "feat: add GrantRepoCard for inline repo access grants"
```

---

### Task 5: Create AddTokenCard component

**Files:**
- Create: `src/components/chat/AddTokenCard.tsx`

**Step 1: Create the component**

```typescript
import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { useCreateToken } from '../../hooks/useTokens';
import type { AgentAction, TokenProvider } from '../../api/types';

interface AddTokenCardProps {
  action: AgentAction;
  onComplete: () => void;
}

const TOKEN_LABELS: Record<string, string> = {
  ANTHROPIC: 'Anthropic API Key',
  GITHUB: 'GitHub Token',
  OPENAI: 'OpenAI API Key',
};

export default function AddTokenCard({ action, onComplete }: AddTokenCardProps) {
  const [completed, setCompleted] = useState(false);
  const [provider, setProvider] = useState<TokenProvider>(action.tokenProvider ?? 'ANTHROPIC');
  const [label, setLabel] = useState(TOKEN_LABELS[action.tokenProvider ?? 'ANTHROPIC'] ?? '');
  const [token, setToken] = useState('');
  const createToken = useCreateToken();

  const handleSave = () => {
    if (!token.trim()) return;
    createToken.mutate(
      { provider, label: label.trim() || provider, token: token.trim() },
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
          {TOKEN_LABELS[provider] ?? provider} saved!
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
        <VpnKeyIcon sx={{ fontSize: 20, color: 'primary.light' }} />
        <Typography variant="body2" fontWeight={600}>
          Add API Token
        </Typography>
      </Box>
      {action.message && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          {action.message}
        </Typography>
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            select
            size="small"
            value={provider}
            onChange={(e) => {
              const p = e.target.value as TokenProvider;
              setProvider(p);
              setLabel(TOKEN_LABELS[p] ?? '');
            }}
            sx={{ minWidth: 120, '& .MuiInputBase-root': { fontSize: '0.8125rem' } }}
          >
            <MenuItem value="ANTHROPIC">Anthropic</MenuItem>
            <MenuItem value="GITHUB">GitHub</MenuItem>
            <MenuItem value="OPENAI">OpenAI</MenuItem>
          </TextField>
          <TextField
            size="small"
            placeholder="Label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            sx={{ flex: 1, '& .MuiInputBase-root': { fontSize: '0.8125rem' } }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            type="password"
            placeholder="Paste your API key..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            sx={{ flex: 1, '& .MuiInputBase-root': { fontSize: '0.8125rem' } }}
          />
          <Button
            size="small"
            variant="contained"
            onClick={handleSave}
            disabled={!token.trim() || createToken.isPending}
            startIcon={createToken.isPending ? <CircularProgress size={14} /> : undefined}
            sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.75rem' }}
          >
            Save
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
```

**Step 2: Verify the build compiles**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/components/chat/AddTokenCard.tsx
git commit -m "feat: add AddTokenCard for inline API token input"
```

---

### Task 6: Create ConnectDeviceCard component

**Files:**
- Create: `src/components/chat/ConnectDeviceCard.tsx`

**Step 1: Create the component**

This is a compact inline version of `AddDeviceDialog`. It reuses `useCreatePairingCode` and `useDevices` to detect when a new device pairs.

```typescript
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
```

**Step 2: Verify the build compiles**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/components/chat/ConnectDeviceCard.tsx
git commit -m "feat: add ConnectDeviceCard for inline device pairing"
```

---

### Task 7: Create ActionCard router component

**Files:**
- Create: `src/components/chat/ActionCard.tsx`

**Step 1: Create the router component**

```typescript
import type { AgentAction } from '../../api/types';
import ConnectAccountCard from './ConnectAccountCard';
import GrantRepoCard from './GrantRepoCard';
import AddTokenCard from './AddTokenCard';
import ConnectDeviceCard from './ConnectDeviceCard';

interface ActionCardProps {
  action: AgentAction;
  onComplete: () => void;
}

export default function ActionCard({ action, onComplete }: ActionCardProps) {
  switch (action.type) {
    case 'connect_account':
      return <ConnectAccountCard action={action} onComplete={onComplete} />;
    case 'grant_repo':
      return <GrantRepoCard action={action} onComplete={onComplete} />;
    case 'add_token':
      return <AddTokenCard action={action} onComplete={onComplete} />;
    case 'connect_device':
      return <ConnectDeviceCard action={action} onComplete={onComplete} />;
    default:
      return null;
  }
}
```

**Step 2: Verify the build compiles**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/components/chat/ActionCard.tsx
git commit -m "feat: add ActionCard router component"
```

---

### Task 8: Integrate action cards into ChatPage

**Files:**
- Modify: `src/pages/ChatPage.tsx`

This is the largest task. It covers:
1. Extending `ChatMessage` with action fields
2. Rendering `ActionCard` in `MessageBubble`
3. Tracking action completion and triggering auto-resume
4. Handling OAuth callback params on `/chat`
5. SessionStorage persist/restore for surviving OAuth redirects

**Step 1: Add imports to ChatPage**

Add at the top:

```typescript
import { useSearchParams } from 'react-router-dom';
import ActionCard from '../components/chat/ActionCard';
import { useHandleOAuthCallback, validateOAuthState } from '../hooks/useAccounts';
import type { AgentAction } from '../api/types';
```

**Step 2: Extend the ChatMessage interface**

Add these fields:

```typescript
interface ChatMessage {
  // ... existing fields ...
  actions?: AgentAction[];
  completedActions?: Set<number>;  // indices of completed actions
  originalCommand?: string;
  resumed?: boolean;
}
```

**Step 3: Add sessionStorage constants and helpers**

After the `SESSION_ID` constant:

```typescript
const PENDING_ACTION_KEY = 'tacticl_chat_pending_action';

interface PendingActionState {
  originalCommand: string;
  sessionId: string;
  sparkType?: SparkType | '';
  model?: string;
}

function savePendingAction(state: PendingActionState) {
  sessionStorage.setItem(PENDING_ACTION_KEY, JSON.stringify(state));
}

function loadPendingAction(): PendingActionState | null {
  const raw = sessionStorage.getItem(PENDING_ACTION_KEY);
  sessionStorage.removeItem(PENDING_ACTION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
```

**Step 4: Add OAuth callback handling to ChatPage component**

Inside the `ChatPage` function, after the existing hook calls, add:

```typescript
const [searchParams, setSearchParams] = useSearchParams();
const handleOAuthCallback = useHandleOAuthCallback();

// Handle OAuth callback when returning from provider
useEffect(() => {
  const code = searchParams.get('code');
  const platform = searchParams.get('platform');
  const state = searchParams.get('state');
  const codeVerifier = searchParams.get('code_verifier') || undefined;

  if (code && platform) {
    if (!validateOAuthState(state)) {
      setSearchParams({});
      return;
    }
    const redirectUri = window.location.origin + '/chat';
    handleOAuthCallback.mutate(
      { platform, code, redirectUri, codeVerifier },
      {
        onSettled: () => setSearchParams({}),
        onSuccess: () => {
          // Check for pending action to auto-resume
          const pending = loadPendingAction();
          if (pending) {
            sendMessage(pending.originalCommand);
          }
        },
      },
    );
  }
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

**Step 5: Update the sendMessage response handler to store actions**

In the `sendMessage` function, update the response mapping to include action fields:

```typescript
// In the response handler, add to the message mapping:
actions: response.actions,
originalCommand: response.actions?.length ? msg : undefined,
completedActions: response.actions?.length ? new Set<number>() : undefined,
```

**Step 6: Add action completion handler**

Add a new function to `ChatPage`:

```typescript
const handleActionComplete = useCallback((messageId: string, actionIndex: number) => {
  setMessages((prev) => {
    const updated = prev.map((m) => {
      if (m.id !== messageId || !m.actions) return m;
      const newCompleted = new Set(m.completedActions);
      newCompleted.add(actionIndex);

      // Check if all actions are now complete
      const allDone = m.actions.length === newCompleted.size;

      if (allDone && m.originalCommand && !m.resumed) {
        // Auto-resume: re-send original command after a brief delay
        setTimeout(() => sendMessage(m.originalCommand), 500);
        return { ...m, completedActions: newCompleted, resumed: true };
      }

      return { ...m, completedActions: newCompleted };
    });
    return updated;
  });
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

**Step 7: Pass handleActionComplete to MessageBubble**

Update the `MessageBubble` rendering:

```typescript
{messages.map((msg) => (
  <MessageBubble
    key={msg.id}
    message={msg}
    onConfirm={handleConfirm}
    onActionComplete={handleActionComplete}
  />
))}
```

**Step 8: Update MessageBubble to render action cards**

Update the `MessageBubbleProps` interface and component:

```typescript
interface MessageBubbleProps {
  message: ChatMessage;
  onConfirm: (messageId: string, confirmationId: string, approved: boolean) => void;
  onActionComplete: (messageId: string, actionIndex: number) => void;
}
```

Add action card rendering inside the bubble, after the spark chip and before the confirmation buttons:

```typescript
{message.actions && message.actions.length > 0 && (
  <Box sx={{ mt: 1.5 }}>
    {message.actions.map((action, idx) => (
      <ActionCard
        key={idx}
        action={action}
        onComplete={() => onActionComplete(message.id, idx)}
      />
    ))}
  </Box>
)}
```

**Step 9: Add OAuth-aware connect for ConnectAccountCard**

For OAuth flows that redirect away from the page, save the pending action state before redirect. Update the `useConnectAccount` hook call flow: before the OAuth redirect happens, call `savePendingAction()`.

In `ChatPage`, wrap the connect logic so that when a `connect_account` action triggers OAuth, we persist state:

The `useConnectAccount` hook already opens a popup (`window.open`), so no page redirect happens. The popup handles OAuth and returns. If the popup approach fails and falls back to redirect, the sessionStorage backup ensures auto-resume.

**Step 10: Verify the build compiles**

Run: `npx tsc --noEmit`
Then: `npm run dev` to verify in browser

**Step 11: Commit**

```bash
git add src/pages/ChatPage.tsx
git commit -m "feat: integrate action cards into chat with auto-resume"
```

---

### Task 9: Verify end-to-end and clean up

**Files:**
- All modified files

**Step 1: Run the linter**

Run: `npm run lint`
Fix any issues found.

**Step 2: Run the build**

Run: `npm run build`
Expected: Clean build with no errors

**Step 3: Manual verification checklist**

Since the backend needs to return `actions` for full testing, verify:
- The app compiles and runs without errors
- Chat page loads correctly with no regressions
- Existing message bubbles render normally (no action cards appear when `actions` is undefined)
- The AccountsPage still works correctly after the platform info extraction

**Step 4: Commit any lint fixes**

```bash
git add -A
git commit -m "chore: lint fixes for chat-driven setup"
```
