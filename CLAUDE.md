# CLAUDE.md — Tacticl Web

## Overview

Web dashboard for Tacticl — the personal AI assistant that remotes into all your devices. This is a React SPA that provides a web interface for managing Sparks (AI tasks), connected devices, social media, and the agent chat interface. Deployed on Firebase Hosting, talks to tacticl-core (Java/Cloud Run) backend via REST + WebSocket.

## Tech Stack

- React 19, TypeScript 5.9, Vite 7.3
- MUI 7 (Material UI) with Emotion — dark theme
- Zustand (auth store, spark progress) + TanStack React Query 5 (server state)
- React Router 7 (client-side routing)
- WebSocket (real-time spark progress)
- Firebase Hosting (SPA deployment)

## Project Structure

```
src/
├── pages/                  # Route page components
│   ├── ChatPage.tsx        # Main agent chat interface
│   ├── SparkListPage.tsx   # List & filter sparks
│   ├── SparkDetailPage.tsx # Spark details, tactics, timeline
│   ├── DeviceListPage.tsx  # Connected devices
│   ├── DeviceDetailPage.tsx
│   ├── RepoListPage.tsx    # Granted repo access
│   ├── TokenListPage.tsx   # API tokens (Anthropic, GitHub, etc.)
│   ├── TemplateListPage.tsx # Spark templates
│   ├── SocialPage.tsx      # Social post creation & scheduling
│   ├── AccountsPage.tsx    # Connected social accounts (OAuth)
│   ├── SettingsPage.tsx    # User preferences
│   ├── LoginPage.tsx       # Dev token login
│   └── LandingPage.tsx     # Public landing page
├── components/
│   ├── layout/             # AppLayout, Sidebar (240px), TopBar, PublicHeader
│   ├── auth/               # ProtectedRoute HOC
│   ├── sparks/             # SparkCard, SparkStatusBadge, SparkTimeline, CheckpointApproval
│   ├── devices/            # DeviceCard, DeviceStatusIndicator
│   ├── common/             # LoadingState, EmptyState, ErrorState
│   └── TacticlLogo.tsx
├── api/                    # API client modules
│   ├── client.ts           # Base ApiClient (auto Bearer token, 401 logout)
│   ├── types.ts            # All TypeScript interfaces
│   ├── sparks.ts           # Spark CRUD, tactics, logs
│   ├── devices.ts          # Device list, remove, preferences
│   ├── agent.ts            # Command, history, activity, transcribe
│   ├── checkpoints.ts      # List, get, decide
│   ├── social.ts           # Integrations, posts, OAuth
│   ├── accounts.ts         # Connected accounts, OAuth, disconnect
│   ├── repos.ts            # List, grant, revoke repo access
│   ├── tokens.ts           # API token CRUD, usage
│   └── templates.ts        # Spark template CRUD
├── hooks/                  # React Query hooks per resource
│   ├── useAuth.ts
│   ├── useSparks.ts        # Refetches every 10s
│   ├── useDevices.ts
│   ├── useAgent.ts
│   ├── useSparkProgress.ts # Real-time progress from WebSocket
│   ├── useWebSocket.ts     # WS lifecycle + message handling
│   └── ... (useCheckpoints, useSocial, useAccounts, useRepos, useTokens, useTemplates)
├── stores/
│   └── auth-store.ts       # Zustand: token, userId, hydration from localStorage
├── lib/
│   └── websocket.ts        # WS client: auto-reconnect, heartbeat, message types
├── theme/
│   └── index.ts            # MUI dark theme (primary: #6C63FF, secondary: #03DAC6)
├── App.tsx                 # Router + providers (QueryClient, ThemeProvider)
└── main.tsx                # React root mount
```

## Build Commands

```bash
npm install                 # Install dependencies
npm run dev                 # Dev server on :5173 (HMR)
npm run build               # tsc + vite build → dist/
npm run lint                # ESLint
npm run preview             # Preview production build
```

## Deployment

Firebase Hosting from `dist/` directory:
```bash
npm run build && firebase deploy --only hosting
```

- SPA rewrite: all routes → `/index.html`
- `/index.html`: no-cache
- `/assets/**`: immutable, 1 year cache (Vite hash-busted)

## Environment Variables

```
VITE_API_BASE_URL    # Backend URL (required)
                     # Dev: http://localhost:8080
                     # Prod: https://tacticl-core-254aoetxaa-ue.a.run.app
                     # QA: https://tacticl-core-qa-bflhiwsnmq-ue.a.run.app
VITE_WS_URL          # WebSocket URL (optional, derived from API base)
VITE_WS_BASE_URL     # Alternative WS URL fallback
```

## Auth Flow

```
1. LoginPage: email → POST /api/auth/dev-token → { token, userId }
2. SSO: redirect from auth.strategiz.ai with ?auth_token=...&user_id=...
3. Token stored in localStorage (tacticl-auth-token, tacticl-user-id)
4. All API calls: Authorization: Bearer {token}
5. 401 → auto logout + redirect
```

## Routes

| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/` | LandingPage / redirect | No | Landing if anon, /chat if authenticated |
| `/login` | LoginPage | No | Dev token login |
| `/chat` | ChatPage | Yes | Agent chat with history |
| `/sparks` | SparkListPage | Yes | Spark list & filter |
| `/sparks/:id` | SparkDetailPage | Yes | Spark detail, tactics, logs |
| `/devices` | DeviceListPage | Yes | Connected devices |
| `/devices/:id` | DeviceDetailPage | Yes | Device detail & preferences |
| `/repos` | RepoListPage | Yes | Granted repo access |
| `/tokens` | TokenListPage | Yes | API tokens & usage |
| `/templates` | TemplateListPage | Yes | Spark templates |
| `/social` | SocialPage | Yes | Social posts & scheduling |
| `/accounts` | AccountsPage | Yes | Connected social accounts |
| `/settings` | SettingsPage | Yes | User preferences |

## Key Patterns

- **API Client**: `src/api/client.ts` — auto Bearer token, 401 logout, credentials: include
- **React Query hooks**: Each resource has query + mutation hooks with cache invalidation
- **WebSocket**: Real-time spark progress (spark_progress, spark_status, spark_checkpoint, spark_completed, spark_failed)
- **Auto-reconnect**: Exponential backoff 1s → 30s, heartbeat ping every 30s
- **ProtectedRoute**: Checks auth store token, shows spinner while hydrating, redirects if unauthenticated

## Data Types (src/api/types.ts)

Key interfaces:
- `Spark` — PENDING → EXECUTING → CHECKPOINT → COMPLETED | FAILED | CANCELLED
- `Device` — type (PHONE, TABLET, COMPUTER, WATCH), state (ONLINE, OFFLINE, BUSY)
- `Checkpoint` — approval gate for agent actions
- `SocialIntegration` — OAuth-connected platform account
- `SocialPost` — draft/scheduled post with state machine
- `AgentToken` — API token with usage tracking
- `SparkTemplate` — reusable Spark configuration

## Theme

MUI dark theme:
- Primary: #6C63FF (purple)
- Secondary: #03DAC6 (teal)
- Background: #121212
- Paper: #1E1E1E
- Font: Inter, Roboto
