# Chat-Driven Setup Actions

## Problem

The chat interface can create sparks and handle confirmations, but cannot help users connect accounts, grant repo access, add API tokens, or pair devices. Users must navigate to separate pages to complete setup, breaking the conversational flow. If someone says "post this to Twitter" without Twitter connected, the agent has no way to guide them through connecting it inline.

## Decision

Extend `AgentCommandResponse` with a structured `actions` array. The backend agent detects missing connections and returns action descriptors alongside its response text. The frontend renders inline action cards inside the chat bubble, and auto-resumes the original command after the user completes all required actions.

## Data Model

### New types (`src/api/types.ts`)

```typescript
type AgentActionType = 'connect_account' | 'grant_repo' | 'add_token' | 'connect_device';

interface AgentAction {
  type: AgentActionType;
  platform?: string;            // 'twitter', 'github', 'youtube', etc.
  provider?: RepoProvider;      // 'GITHUB', 'GITLAB', 'BITBUCKET'
  tokenProvider?: TokenProvider; // 'ANTHROPIC', 'GITHUB', 'OPENAI'
  repoFullName?: string;        // 'owner/repo'
  accessLevel?: RepoAccessLevel;// 'READ', 'WRITE', 'ADMIN'
  message?: string;             // Agent's human-readable explanation
}
```

### Extended response

```typescript
interface AgentCommandResponse {
  // ... existing fields unchanged ...
  actions?: AgentAction[];  // structured setup actions
}
```

### Extended local chat message state

```typescript
interface ChatMessage {
  // ... existing fields unchanged ...
  actions?: AgentAction[];
  actionsCompleted?: boolean;
  originalCommand?: string;
}
```

## Action Card Components

Four inline card components rendered inside `MessageBubble`, below the response text.

### ActionCard (router)
Takes an `AgentAction` and renders the appropriate card. Styled with subtle border and slightly different background to distinguish from plain text.

### ConnectAccountCard
- Platform icon + name (reuses shared `platforms` constant extracted from AccountsPage)
- "Connect {Platform}" button
- Calls `accountsApi.getOAuthUrl()` with `redirectUri = origin + '/chat'`
- Redirects to OAuth provider; on return, ChatPage handles `?code=&platform=` params
- On success: card updates to "Connected!" with green checkmark

### GrantRepoCard
- Pre-fills provider, repo name, access level from the action
- Editable inline form (provider select, repo name input, access level select)
- "Grant Access" button calls `reposApi.grant()`
- On success: card updates to "Granted!"

### AddTokenCard
- Shows provider name (e.g., "Anthropic API Key")
- Password-masked token input + label field
- "Save Token" button calls `tokensApi.create()`
- On success: card updates to "Saved!"

### ConnectDeviceCard
- Compact inline version of the AddDeviceDialog pairing flow
- Shows pairing code, OS-specific download link, polls for device connection
- On paired: card updates to "Paired!"

### Shared card states
- **Pending**: Shows the action UI (button/form)
- **Loading**: Spinner while processing
- **Completed**: Green checkmark + success label

## Auto-Resume Flow

```
1. User: "post this to Twitter"
2. Backend returns responseText + actions: [{ type: 'connect_account', platform: 'twitter' }]
3. ChatMessage stored with originalCommand = "post this to Twitter"
4. MessageBubble renders text + ConnectAccountCard
5. User clicks Connect -> OAuth redirect -> returns to /chat
6. ChatPage handles OAuth callback, completes exchange
7. Card updates to "Connected!", actionsCompleted = true
8. Frontend auto-re-sends agentApi.command({ text: originalCommand })
9. New response appears — task proceeds
```

### Multiple actions
If the backend returns 2+ actions, auto-resume fires only when ALL are completed.

### Surviving OAuth redirects
Before OAuth redirect, persist to sessionStorage:

```typescript
{
  pendingAction: {
    originalCommand: string;
    sessionId: string;
    sparkType?: SparkType;
    model?: string;
    messageId: string;
    actions: AgentAction[];
  }
}
```

On return to `/chat`, restore from sessionStorage, complete the OAuth exchange, mark action done, and trigger auto-resume if all actions are complete.

### Deduplication
A `resumed` flag on the message prevents auto-resume from firing more than once.

## File Changes

### Modified
| File | Change |
|------|--------|
| `src/api/types.ts` | Add `AgentAction`, `AgentActionType`, extend `AgentCommandResponse` |
| `src/pages/ChatPage.tsx` | OAuth callback handler, originalCommand storage, action card rendering, auto-resume logic, sessionStorage persist/restore |

### New
| File | Purpose |
|------|---------|
| `src/components/chat/ActionCard.tsx` | Router: picks the right card by action type |
| `src/components/chat/ConnectAccountCard.tsx` | OAuth connect flow inline |
| `src/components/chat/GrantRepoCard.tsx` | Inline repo grant form |
| `src/components/chat/AddTokenCard.tsx` | Inline token input |
| `src/components/chat/ConnectDeviceCard.tsx` | Compact pairing flow inline |

### Shared constant extraction
Extract the `platforms` array (icons, colors, keys) from `AccountsPage.tsx` into a shared location (e.g., `src/components/common/platformInfo.ts`) so both AccountsPage and the chat action cards can use it.

### Reused existing code
- `accountsApi` OAuth methods
- `reposApi.grant()`
- `tokensApi.create()`
- `useConnectAccount`, `useHandleOAuthCallback` hooks
- Device pairing code request from `devicesApi`

### Not changed
- Backend (assumes it will start returning `actions`; field is optional and backward compatible)
- Existing pages (AccountsPage, RepoListPage, etc. keep working as-is)
- WebSocket layer
