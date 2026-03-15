# Centralized Auth with Cidadel-Web

**Date**: 2026-03-02
**Status**: Approved

## Problem

tacticl-web has a dev token login page (`LoginPage.tsx`) that was a temporary scaffold. We need real sign-in/sign-up backed by the centralized Cidadel auth service. Strategiz already has a production auth UI at `strategiz-ui/apps/auth` that talks to cidadel-core.

## Solution

Two workstreams:

1. **cidadel-web** (new repo) — Fork the Strategiz auth app into a standalone, multi-product auth frontend with runtime subdomain-based theming.
2. **tacticl-web cleanup** (this repo) — Remove dev token login, point all auth flows to cidadel-web.

---

## Workstream 1: cidadel-web

### Source

Fork from `/Users/cuztomizer/Documents/GitHub/strategiz-ui/apps/auth`.

### Runtime Subdomain Theming

Single deployment serves multiple products. Theme is selected at runtime based on the hostname:

| Subdomain | Product | Primary | Font | Background | Logo |
|-----------|---------|---------|------|------------|------|
| `auth.tacticl.ai` | Tacticl | `#6C63FF` | Inter | `#121212` | Tacticl logo |
| `auth.strategiz.ai` | Strategiz | `#39FF14` | Orbitron | `#0c0c0e` gradient | Strategiz logo |

**Implementation**: A `products.ts` config map keyed by hostname pattern. Falls back to env vars for local dev.

```typescript
const PRODUCT_CONFIGS: Record<string, ProductConfig> = {
  'tacticl': {
    name: 'Tacticl',
    primaryColor: '#6C63FF',
    secondaryColor: '#03DAC6',
    fontFamily: 'Inter, Roboto, sans-serif',
    background: '#121212',
    paperColor: '#1E1E1E',
    logoPath: '/logos/tacticl.svg',
    tagline: 'Your AI Agents, Distributed Everywhere',
    dashboardUrl: 'https://app.tacticl.ai',
    defaultRedirect: '/chat',
  },
  'strategiz': {
    name: 'Strategiz',
    primaryColor: '#39FF14',
    secondaryColor: '#00D9FF',
    fontFamily: 'Orbitron, sans-serif',
    background: 'linear-gradient(135deg, #0c0c0e 0%, #060606 100%)',
    paperColor: '#1a1a1e',
    logoPath: '/logos/strategiz.svg',
    tagline: 'Algorithmic Trading Platform',
    dashboardUrl: 'https://console.strategiz.ai',
    defaultRedirect: '/onboarding',
  },
};
```

### Auth Methods (same as Strategiz)

- Passkeys (WebAuthn)
- TOTP (authenticator app)
- SMS OTP
- Google OAuth
- Facebook OAuth
- Email OTP (sign-up verification)
- Device trust (welcome back)
- Account recovery (email + SMS)

### Pages

- `/signin` — Tabbed sign-in (passkey, TOTP, SMS) + OAuth buttons
- `/signup` — 2-step (email verify → choose auth method)
- `/recovery` — Multi-step account recovery
- `/auth/oauth/:provider/callback` — OAuth callbacks

### Post-Auth Redirect

After successful auth, redirect to:
1. The `redirect` query param if provided and on the allowed domain list
2. The product's `dashboardUrl` + `defaultRedirect` as fallback

### Deployment

- Firebase Hosting (single project)
- Both `auth.tacticl.ai` and `auth.strategiz.ai` point to the same deployment
- SPA rewrite: all routes → `/index.html`

---

## Workstream 2: tacticl-web Cleanup

### Changes

1. **Delete `LoginPage.tsx`** — Remove the dev token login page entirely.

2. **Remove `/login` route from `App.tsx`** — No more local login route.

3. **Update `LandingPage.tsx` CTAs**:
   - "Get Started" → `https://auth.tacticl.ai/signup`
   - "Sign Up Free" → `https://auth.tacticl.ai/signup`
   - "Sign In" (if present) → `https://auth.tacticl.ai/signin`

4. **Verify `ProtectedRoute`** — Already redirects to `auth.tacticl.ai/signin?redirect={currentUrl}`. Confirm this is correct.

5. **Verify `client.ts` 401 handling** — Already redirects to `auth.tacticl.ai/signin` on unauthorized. Confirm.

6. **Keep SSO hydration in `auth-store.ts`** — The `hydrate()` function reads `auth_token` + `user_id` from URL params on mount. This is how cidadel-web passes credentials back after auth. No changes needed.

### What Stays

- Auth store (`auth-store.ts`) — token/userId management, localStorage persistence
- ProtectedRoute HOC — guards authenticated routes
- API client Bearer token injection and 401 handling
- WebSocket auth with token

---

## Data Flow (Post-Implementation)

```
User visits app.tacticl.ai
  → ProtectedRoute checks token
  → No token → redirect to auth.tacticl.ai/signin?redirect=app.tacticl.ai/chat
  → Cidadel-web loads with Tacticl theme
  → User signs in (passkey/TOTP/SMS/OAuth)
  → Cidadel backend issues PASETO token
  → Redirect to app.tacticl.ai/chat?auth_token=...&user_id=...
  → tacticl-web hydrate() reads params, stores token
  → User is authenticated, API calls include Bearer token
```

## Future Considerations

- Additional products can be added by extending the `PRODUCT_CONFIGS` map
- Per-product feature flags (e.g., disable Facebook OAuth for Tacticl)
- Shared session across products (SSO between Tacticl and Strategiz)
