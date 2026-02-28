# Accounts Restructure Design

## Overview

Merge the current separate Social and Accounts pages into a unified Accounts section with category-based sub-pages. Add Google Photos as a connectable platform.

## Decision Record

- **Page name:** Accounts (kept as-is)
- **Structure:** Category Cards + Sub-pages (Approach A)
- **Categories:** Social, Media, Developer
- **Posts UI:** Lives within the Social sub-page

## Architecture

### Accounts Overview (`/accounts`)

Three category cards in a responsive grid:

- **Social** — X, Instagram, LinkedIn, Facebook, TikTok
- **Media** — Google Photos, YouTube
- **Developer** — GitHub, Gmail

Each card shows: category icon, name, connected count, mini platform icon row, status indicator. Clicking navigates to the category sub-page.

### Social Sub-page (`/accounts/social`)

- Back navigation to `/accounts`
- Social platform cards (connect/disconnect via OAuth)
- Posts section below: filter toggles, post cards, New Post dialog
- Merges current AccountsPage (social subset) + SocialPage

### Media Sub-page (`/accounts/media`)

- Back navigation to `/accounts`
- Google Photos and YouTube platform cards (connect/disconnect)
- Connection management only (photo browser is future scope)

### Developer Sub-page (`/accounts/developer`)

- Back navigation to `/accounts`
- GitHub and Gmail platform cards (connect/disconnect)

## Routing Changes

| Old Route | New Route | Notes |
|-----------|-----------|-------|
| `/accounts` | `/accounts` | Now shows category overview |
| `/social` | Redirect to `/accounts/social` | Backward compat |
| — | `/accounts/social` | Social accounts + posts |
| — | `/accounts/media` | Media accounts |
| — | `/accounts/developer` | Developer accounts |

## Sidebar Changes

- Remove "Social" entry
- Keep single "Accounts" entry (AccountCircleIcon)

## Platform Categorization

| Social | Media | Developer |
|--------|-------|-----------|
| X/Twitter | Google Photos | GitHub |
| Instagram | YouTube | Gmail |
| LinkedIn | | |
| Facebook | | |
| TikTok | | |

## OAuth Flow

- Google Photos uses same `/api/social/oauth/{platform}/authorize` pattern with `platform=google_photos`
- Redirect URI updates per sub-page (e.g., `/accounts/social` for social platforms)

## Data Model

- No changes to `SocialIntegration` type — Google Photos is just another platform
- Platform categorization is frontend-only (a `platformCategories` map)
- Posts API unchanged

## Files Affected

- `src/pages/AccountsPage.tsx` — Rewrite as category overview
- `src/pages/SocialPage.tsx` — Becomes `/accounts/social` sub-page (merge posts + social accounts)
- New: `src/pages/accounts/AccountsOverviewPage.tsx`
- New: `src/pages/accounts/SocialAccountsPage.tsx`
- New: `src/pages/accounts/MediaAccountsPage.tsx`
- New: `src/pages/accounts/DeveloperAccountsPage.tsx`
- `src/components/layout/Sidebar.tsx` — Remove Social entry
- `src/App.tsx` — Update routes
- `src/api/types.ts` — No changes needed
