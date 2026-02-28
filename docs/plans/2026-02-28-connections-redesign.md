# Connections Redesign

## Overview

Rename and restructure "Accounts" / "Social" into a unified **Connections** section with category-based sub-pages and modernized card UI. Replaces the previous accounts-restructure plan.

## Decision Record

- **Top-level name:** Connections (was "Accounts")
- **Individual item:** Connection (replaces `SocialIntegration`)
- **Categories:** Social, Media, Developer, Productivity
- **Structure:** Category overview cards → sub-pages per category
- **Visual direction:** Modernized cards with brand colors, hover effects, status indicators
- **Backward compat:** None needed (dev mode, no users/data)
- **Data cleanup:** User will delete all existing integration data

## Naming Convention

| Concept | Name | Example |
|---------|------|---------|
| Top-level section | Connections | Sidebar: "Connections", route: `/connections` |
| Individual linked service | Connection | type: `Connection` |
| Categories | Social, Media, Developer, Productivity | `/connections/social` |
| TypeScript type | `Connection` | Replaces `SocialIntegration` |
| Hook | `useConnections()` | Replaces `useAccounts()` |
| API module | `connections.ts` | Replaces `accounts.ts` + OAuth parts of `social.ts` |

## Route Structure

| Route | Page | Description |
|-------|------|-------------|
| `/connections` | ConnectionsOverviewPage | 4 category cards |
| `/connections/social` | SocialConnectionsPage | Social platforms + posts |
| `/connections/media` | MediaConnectionsPage | YouTube, Google Photos |
| `/connections/developer` | DeveloperConnectionsPage | GitHub, Gmail |
| `/connections/productivity` | ProductivityConnectionsPage | Coming soon placeholder |

## Data Model

Rename `SocialIntegration` → `Connection`:

```typescript
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

export type ConnectionCategory = 'social' | 'media' | 'developer' | 'productivity';
```

Category mapping is frontend-only via `platformConfig.ts`.

## Platform Categorization

| Social | Media | Developer | Productivity |
|--------|-------|-----------|-------------|
| X/Twitter | Google Photos | GitHub | (coming soon) |
| Instagram | YouTube | Gmail | Slack, Notion, etc. |
| LinkedIn | | | |
| Facebook | | | |
| TikTok | | | |

## File Structure

### Create

- `src/config/platformConfig.ts` — Platform definitions with categories, icons, colors
- `src/api/connections.ts` — OAuth + CRUD (replaces accounts.ts)
- `src/hooks/useConnections.ts` — Replaces useAccounts.ts
- `src/pages/connections/ConnectionsOverviewPage.tsx`
- `src/pages/connections/SocialConnectionsPage.tsx`
- `src/pages/connections/MediaConnectionsPage.tsx`
- `src/pages/connections/DeveloperConnectionsPage.tsx`
- `src/pages/connections/ProductivityConnectionsPage.tsx`

### Modify

- `src/api/types.ts` — Rename SocialIntegration → Connection, add ConnectionCategory
- `src/api/social.ts` — Remove duplicate OAuth methods, keep posts only
- `src/hooks/useSocial.ts` — Remove integration hooks, keep posts only
- `src/App.tsx` — Replace routes
- `src/components/layout/Sidebar.tsx` — Replace "Social" + "Accounts" with single "Connections"

### Delete

- `src/pages/AccountsPage.tsx`
- `src/pages/SocialPage.tsx`
- `src/api/accounts.ts`
- `src/hooks/useAccounts.ts`

## Visual Design

### Overview Cards (ConnectionsOverviewPage)

- Subtle gradient border on hover using category accent color
- Connected count as prominent stat
- Platform icon row with brand-colored avatars (connected = full opacity, unconnected = dimmed)
- Hover lift effect (translateY -2px + increased shadow)
- Generous whitespace and larger touch targets

### Platform Cards (Sub-pages)

- Brand color accent stripe (left edge)
- **Connected state:** avatar, username, green "Connected" badge, disconnect button
- **Disconnected state:** dimmed card, "Connect" button in platform brand color
- **Token health:** amber warning dot + "Reconnect" CTA when `tokenRefreshNeeded` is true
- Hover effect: border glow in platform brand color
- 200ms ease transitions for all state changes

### Posts Section (SocialConnectionsPage only)

- Post cards with status chips (Draft, Queued, Published, Failed)
- Compact layout: platform icon, preview text, scheduled time
- Filter toggle chips (not dropdown)

## Sidebar

- Remove "Social" entry
- Rename "Accounts" → "Connections" (use CableIcon or LinkIcon)
- Single entry in secondary nav items

## OAuth Flow

No changes to the OAuth flow itself. Only updates:
- Redirect URIs point to new routes (`/connections/social`, `/connections/media`, etc.)
- Hook/API function names use "connection" terminology
- State validation unchanged (sessionStorage + crypto.randomUUID)
