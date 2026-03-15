# Centralized Auth Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a standalone cidadel-web auth frontend (forked from Strategiz auth) with runtime subdomain-based theming, and clean up tacticl-web to redirect to it.

**Architecture:** Fork strategiz-ui/apps/auth into a new cidadel-web repo. Add runtime hostname detection to select product theme (Tacticl vs Strategiz). Remove @strategiz/shared dependency (provider connection features are Strategiz-specific, not needed for core auth). Update tacticl-web to remove dev token login and point all auth flows to auth.tacticl.ai.

**Tech Stack:** React 19, TypeScript, Vite, MUI 7, Redux Toolkit, Firebase Hosting, WebAuthn (SimpleWebAuthn), Firebase Phone Auth

---

## WORKSTREAM 1: cidadel-web (new repo)

### Task 1: Initialize cidadel-web repo from Strategiz auth app

**Files:**
- Copy: `strategiz-ui/apps/auth/` → new `cidadel-web/` directory
- Modify: `cidadel-web/package.json`
- Delete: `cidadel-web/src/components/providers/` (Strategiz-specific)
- Delete: `cidadel-web/src/features/auth/config/providerOauthConfig.ts`
- Delete: `cidadel-web/src/features/auth/hooks/useProviderOAuth.ts`
- Delete: `cidadel-web/src/features/auth/hooks/useProviderIntegration.ts`
- Delete: `cidadel-web/src/features/auth/services/providerOauthService.ts`
- Delete: `cidadel-web/src/features/auth/clients/providerClient.ts`
- Delete: `cidadel-web/src/features/auth/screens/ProviderCallbackScreen.tsx`
- Delete: `cidadel-web/src/features/auth/screens/ProviderOAuthCallbackScreen.tsx`
- Delete: `cidadel-web/src/features/auth/components/RobinhoodLoginDialog.tsx`
- Delete: `cidadel-web/src/features/auth/components/ProviderApiKeyDialog.tsx`
- Delete: `cidadel-web/src/services/providerService.ts`

**Step 1: Create cidadel-web directory and copy auth app**

```bash
cd /Users/cuztomizer/Documents/GitHub
mkdir cidadel-web
cp -r strategiz-ui/apps/auth/* cidadel-web/
cp strategiz-ui/apps/auth/.env* cidadel-web/
cp strategiz-ui/apps/auth/.gitignore cidadel-web/ 2>/dev/null || true
```

**Step 2: Initialize git repo**

```bash
cd cidadel-web
git init
```

**Step 3: Update package.json**

Remove `@strategiz/shared` dependency, rename package:

```json
{
  "name": "cidadel-web",
  "version": "1.0.0",
  "private": true
}
```

Remove `@strategiz/shared` from dependencies. Keep all other deps.

**Step 4: Remove Strategiz-specific provider files**

Delete all provider/trading-platform-specific files listed above. These are Strategiz-specific (Robinhood, Schwab, etc.) and not relevant to centralized auth.

**Step 5: Remove provider routes from App.tsx**

Remove any routes referencing ProviderCallbackScreen or ProviderOAuthCallbackScreen.

**Step 6: Fix any import errors from removed files**

Grep for imports of removed files and clean them up. The `ConnectProvidersModal` and `ProviderConnectionGrid` components in `src/components/providers/` should be fully removed.

**Step 7: Install dependencies and verify build**

```bash
npm install
npm run build
```

Expected: Build succeeds with no import errors.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: initialize cidadel-web from strategiz auth app

Fork strategiz-ui/apps/auth into standalone repo.
Remove @strategiz/shared dependency and Strategiz-specific
provider integration files (Robinhood, trading platforms)."
```

---

### Task 2: Add runtime subdomain-based product theming

**Files:**
- Create: `cidadel-web/src/config/products.ts`
- Modify: `cidadel-web/src/config/productConfig.ts`
- Create: `cidadel-web/public/logos/tacticl.svg` (copy from tacticl-web)
- Keep: `cidadel-web/public/logos/strategiz.svg` (rename existing logo)

**Step 1: Create the product config map**

Create `src/config/products.ts`:

```typescript
export interface ProductTheme {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  background: string;
  paperColor: string;
  logoPath: string;
  tagline: string;
  dashboardUrl: string;
  defaultRedirect: string;
  authApiUrl: string;
  apiBaseUrl: string;
}

const PRODUCT_CONFIGS: Record<string, ProductTheme> = {
  tacticl: {
    name: 'Tacticl',
    primaryColor: '#6C63FF',
    secondaryColor: '#03DAC6',
    fontFamily: 'Inter, Roboto, sans-serif',
    background: 'linear-gradient(135deg, #08081a 0%, #150a35 100%)',
    paperColor: '#1E1E1E',
    logoPath: '/logos/tacticl.svg',
    tagline: 'Your AI Agents, Distributed Everywhere',
    dashboardUrl: 'https://app.tacticl.ai',
    defaultRedirect: '/chat',
    authApiUrl: 'https://tacticl-core-43628135674.us-east1.run.app',
    apiBaseUrl: 'https://tacticl-core-43628135674.us-east1.run.app',
  },
  strategiz: {
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
    authApiUrl: 'https://auth-api.strategiz.ai',
    apiBaseUrl: 'https://api.strategiz.ai',
  },
};

function detectProduct(): string {
  const hostname = window.location.hostname;
  if (hostname.includes('tacticl')) return 'tacticl';
  if (hostname.includes('strategiz')) return 'strategiz';
  // Fallback to env var or default
  const envProduct = import.meta.env.VITE_PRODUCT_NAME?.toLowerCase();
  if (envProduct && PRODUCT_CONFIGS[envProduct]) return envProduct;
  return 'strategiz';
}

export const currentProduct = detectProduct();
export const productTheme = PRODUCT_CONFIGS[currentProduct];
```

**Step 2: Update productConfig.ts to use runtime detection**

Replace the existing `productConfig.ts` to delegate to runtime detection, with env var overrides still supported:

```typescript
import { productTheme, type ProductTheme } from './products';

// Env vars override runtime detection (for local dev)
export const productConfig: ProductTheme = {
  name: import.meta.env.VITE_PRODUCT_NAME || productTheme.name,
  primaryColor: import.meta.env.VITE_PRIMARY_COLOR || productTheme.primaryColor,
  secondaryColor: productTheme.secondaryColor,
  fontFamily: import.meta.env.VITE_FONT_FAMILY || productTheme.fontFamily,
  background: import.meta.env.VITE_BACKGROUND || productTheme.background,
  paperColor: productTheme.paperColor,
  logoPath: import.meta.env.VITE_LOGO_PATH || productTheme.logoPath,
  tagline: import.meta.env.VITE_TAGLINE || productTheme.tagline,
  dashboardUrl: productTheme.dashboardUrl,
  defaultRedirect: productTheme.defaultRedirect,
  authApiUrl: import.meta.env.VITE_AUTH_API_URL || productTheme.authApiUrl,
  apiBaseUrl: import.meta.env.VITE_API_URL || productTheme.apiBaseUrl,
};
```

**Step 3: Copy Tacticl logo**

```bash
mkdir -p cidadel-web/public/logos
cp tacticl-web/public/tacticl-logo.svg cidadel-web/public/logos/tacticl.svg
cp cidadel-web/public/logo.svg cidadel-web/public/logos/strategiz.svg
```

Note: If tacticl-web doesn't have an SVG logo, extract or create one from the TacticlLogo component.

**Step 4: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add runtime subdomain-based product theming

Detect product from hostname (tacticl/strategiz) at runtime.
Single deployment serves both products with correct theme.
Env vars still work as overrides for local development."
```

---

### Task 3: Update API config for multi-product support

**Files:**
- Modify: `cidadel-web/src/config/api.config.ts`

**Step 1: Update API config to use product theme URLs**

Update `api.config.ts` to derive URLs from the runtime product config instead of only env vars:

```typescript
import { productConfig } from './productConfig';

export const API_BASE_URL = productConfig.apiBaseUrl;
export const AUTH_API_URL = productConfig.authApiUrl;
export const FRONTEND_URL = import.meta.env.VITE_AUTH_URL || `https://auth.${productConfig.name.toLowerCase()}.ai`;

export const ALLOWED_REDIRECT_DOMAINS = [
  'strategiz.ai', 'console.strategiz.ai', 'auth.strategiz.ai',
  'strategiz.io', 'console.strategiz.io', 'auth.strategiz.io',
  'tacticl.ai', 'app.tacticl.ai', 'auth.tacticl.ai',
  'tacticl.io', 'app.tacticl.io', 'auth.tacticl.io',
  // Firebase hosting
  'strategiz-auth.web.app', 'strategiz-auth.firebaseapp.com',
  'cidadel-web.web.app', 'cidadel-web.firebaseapp.com',
  // Localhost
  'localhost',
];
```

**Step 2: Update post-auth redirect logic**

Check `src/services/redirectService.ts` and ensure it uses `productConfig.dashboardUrl + productConfig.defaultRedirect` as the default redirect target (not hardcoded Strategiz URLs).

**Step 3: Verify build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: update API config for multi-product URL routing

API base URLs now derive from runtime product detection.
Added tacticl.ai domains to allowed redirect list.
Post-auth redirect uses product-specific dashboard URL."
```

---

### Task 4: Update MUI theme to use product colors dynamically

**Files:**
- Modify: `cidadel-web/src/theme/theme.ts`

**Step 1: Update theme to use productConfig colors**

The current theme has hardcoded cyan (`#00D9FF`) colors. Update it to use `productConfig.primaryColor`:

```typescript
import { createTheme } from '@mui/material/styles';
import { productConfig } from '../config/productConfig';

const { primaryColor, secondaryColor, fontFamily, paperColor } = productConfig;

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: primaryColor,
    },
    secondary: {
      main: secondaryColor || '#64748b',
    },
    background: {
      default: '#0a0a0e',
      paper: paperColor,
    },
  },
  typography: {
    fontFamily,
    // ... keep existing typography config, use fontFamily variable
  },
  components: {
    // ... update all hardcoded #00D9FF / cyan references to use primaryColor
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          boxShadow: `0 0 20px ${primaryColor}40`,
          '&:hover': {
            boxShadow: `0 0 30px ${primaryColor}60`,
          },
        },
      },
    },
    // ... similarly for MuiTab, MuiTextField focus states, etc.
  },
});
```

**Step 2: Update AuthLayout glow effects**

AuthLayout uses `productConfig.primaryColor` for glow effects — verify this still works with the updated productConfig.

**Step 3: Verify visually**

```bash
npm run dev
```

Open http://localhost:3001 — should see Strategiz theme by default.
Set `VITE_PRODUCT_NAME=Tacticl` in .env, restart — should see purple Tacticl theme.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: dynamic MUI theme from product config

Theme colors, fonts, and glow effects now derive from
runtime product detection instead of hardcoded values."
```

---

### Task 5: Update environment files and index.html

**Files:**
- Modify: `cidadel-web/.env`
- Modify: `cidadel-web/.env.production`
- Delete: `cidadel-web/.env.tacticl` (no longer needed — runtime detection handles it)
- Modify: `cidadel-web/index.html`

**Step 1: Update .env for local development**

```env
VITE_PRODUCT_NAME=Tacticl
VITE_API_URL=http://localhost:8080
VITE_AUTH_API_URL=http://localhost:8080
VITE_AUTH_URL=http://localhost:3001
VITE_MAIN_APP_URL=http://localhost:5173
```

(Default to Tacticl for local dev since that's what we're building first)

**Step 2: Update .env.production**

```env
# No product-specific vars needed — runtime detection handles theming
# These are fallbacks only
VITE_AUTH_URL=https://auth.tacticl.ai
```

**Step 3: Update index.html**

- Change title to use generic "Sign In" or dynamic product name
- Remove Strategiz-specific redirect script
- Keep Google Fonts for both Inter and Orbitron
- Update favicon to a generic cidadel favicon or product-aware
- Remove `strategiz.io` redirect script

**Step 4: Delete .env.tacticl (no longer needed)**

```bash
rm cidadel-web/.env.tacticl
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: update env files and index.html for multi-product

Runtime subdomain detection replaces per-product env files.
Local dev defaults to Tacticl. index.html is product-generic."
```

---

### Task 6: Set up Firebase Hosting deployment

**Files:**
- Create: `cidadel-web/firebase.json`
- Create: `cidadel-web/.firebaserc`

**Step 1: Create firebase.json**

```json
{
  "hosting": {
    "public": "build",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ],
    "headers": [
      {
        "source": "/index.html",
        "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
      },
      {
        "source": "/assets/**",
        "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
      }
    ]
  }
}
```

**Step 2: Create .firebaserc**

```json
{
  "projects": {
    "default": "cidadel-web"
  }
}
```

Note: The Firebase project needs to be created separately. Both `auth.tacticl.ai` and `auth.strategiz.ai` custom domains should point to this single Firebase Hosting deployment.

**Step 3: Verify build + hosting emulator**

```bash
npm run build
npx firebase emulators:start --only hosting
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Firebase Hosting config for SPA deployment

Single deployment serves both auth.tacticl.ai and auth.strategiz.ai.
SPA rewrite for client-side routing. Cache headers for assets."
```

---

### Task 7: Verify end-to-end auth flow locally

**Step 1: Start cidadel-core backend**

```bash
cd /Users/cuztomizer/Documents/GitHub/cidadel-core
./gradlew bootRun
```

(Or ensure it's running on localhost:8443 / localhost:8080)

**Step 2: Start cidadel-web**

```bash
cd /Users/cuztomizer/Documents/GitHub/cidadel-web
npm run dev
```

**Step 3: Test sign-in flow**

- Open http://localhost:3001/signin
- Verify Tacticl theme loads (purple, Inter font)
- Test at least one auth method (TOTP or passkey)
- Verify redirect back to localhost:5173 (tacticl-web) with auth_token param

**Step 4: Test sign-up flow**

- Open http://localhost:3001/signup
- Verify 2-step flow works
- Verify email OTP step

**Step 5: Document any issues found for follow-up**

---

## WORKSTREAM 2: tacticl-web cleanup

### Task 8: Remove LoginPage and update routes

**Files:**
- Delete: `tacticl-web/src/pages/LoginPage.tsx`
- Modify: `tacticl-web/src/App.tsx` (lines 10, 58)

**Step 1: Delete LoginPage.tsx**

```bash
rm src/pages/LoginPage.tsx
```

**Step 2: Remove LoginPage import and route from App.tsx**

In `src/App.tsx`:
- Remove: `import LoginPage from './pages/LoginPage'` (line 10)
- Remove: `<Route path="/login" element={<LoginPage />} />` (line 58)

**Step 3: Verify build**

```bash
npm run build
```

Expected: Build succeeds. No references to LoginPage remain.

**Step 4: Commit**

```bash
git add src/pages/LoginPage.tsx src/App.tsx
git commit -m "feat: remove dev token login page

Dev token login replaced by centralized Cidadel auth at auth.tacticl.ai.
ProtectedRoute already redirects unauthenticated users there."
```

---

### Task 9: Update LandingPage CTAs to point to auth.tacticl.ai

**Files:**
- Modify: `tacticl-web/src/pages/LandingPage.tsx` (line 20)

**Step 1: Update SIGNUP_URL constant**

Change line 20 from:
```typescript
const SIGNUP_URL = '/login';
```
to:
```typescript
const SIGNUP_URL = 'https://auth.tacticl.ai/signup';
```

**Step 2: Add SIGNIN_URL constant**

Add near line 20:
```typescript
const SIGNIN_URL = 'https://auth.tacticl.ai/signin';
```

**Step 3: Update header sign-in link if present**

Check if the PublicHeader or LandingPage has a "Sign In" link/button. If so, point it to `SIGNIN_URL`.

**Step 4: Verify build**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add src/pages/LandingPage.tsx
git commit -m "feat: update landing page CTAs to centralized auth

Get Started and Sign Up buttons now redirect to auth.tacticl.ai
instead of the removed /login page."
```

---

### Task 10: Verify ProtectedRoute and API client redirects

**Files:**
- Read (verify only): `tacticl-web/src/components/auth/ProtectedRoute.tsx`
- Read (verify only): `tacticl-web/src/api/client.ts`
- Read (verify only): `tacticl-web/src/stores/auth-store.ts`

**Step 1: Verify ProtectedRoute redirect URL**

Confirm it redirects to `https://auth.tacticl.ai/signin?redirect={currentUrl}`.
Current code (lines 26-27) already does this. No changes needed.

**Step 2: Verify client.ts 401 redirect URL**

Confirm 401 handling redirects to `https://auth.tacticl.ai/signin?redirect={currentUrl}`.
Current code (lines 37-41) already does this. No changes needed.

**Step 3: Verify auth-store.ts SSO hydration**

Confirm `hydrate()` reads `auth_token` and `user_id` from URL params.
Current code (lines 21-36) already does this. No changes needed.

**Step 4: Verify useAuth.ts logout**

Check if logout should redirect to auth.tacticl.ai/signin or just clear local state and go to landing page.
Current behavior (clear state → navigate to `/`) is acceptable since the landing page has sign-in links.

**Step 5: Document verification results**

No code changes expected. Just confirm all redirect URLs are correct.

---

### Task 11: Clean up any remaining /login references

**Files:**
- Search all files in `tacticl-web/src/` for references to `/login`

**Step 1: Search for /login references**

```bash
grep -r "'/login'" src/ --include="*.ts" --include="*.tsx"
grep -r '"/login"' src/ --include="*.ts" --include="*.tsx"
```

**Step 2: Update any remaining references**

If any components still link to `/login`, update them to `https://auth.tacticl.ai/signin`.

**Step 3: Verify build**

```bash
npm run build
npm run lint
```

**Step 4: Commit (if changes were needed)**

```bash
git add -A
git commit -m "fix: remove remaining /login references

All auth links now point to centralized auth at auth.tacticl.ai."
```

---

### Task 12: End-to-end verification of tacticl-web auth flow

**Step 1: Start tacticl-web dev server**

```bash
npm run dev
```

**Step 2: Test unauthenticated access**

- Open http://localhost:5173/chat (protected route)
- Should redirect to auth.tacticl.ai/signin?redirect=http://localhost:5173/chat

**Step 3: Test landing page**

- Open http://localhost:5173/
- "Get Started" button should link to auth.tacticl.ai/signup
- "Sign Up Free" button should link to auth.tacticl.ai/signup

**Step 4: Test SSO token hydration**

- Open http://localhost:5173/?auth_token=test-token&user_id=test-user
- Should store token in localStorage and clean URL params
- Should render authenticated state

**Step 5: Test logout**

- Click logout
- Should clear localStorage, navigate to landing page
- Clicking "Get Started" should go to auth.tacticl.ai

---

## Summary

| Task | Repo | Description | Depends On |
|------|------|-------------|------------|
| 1 | cidadel-web | Initialize repo from Strategiz auth | — |
| 2 | cidadel-web | Runtime subdomain theming | Task 1 |
| 3 | cidadel-web | Multi-product API config | Task 2 |
| 4 | cidadel-web | Dynamic MUI theme | Task 2 |
| 5 | cidadel-web | Env files and index.html | Task 1 |
| 6 | cidadel-web | Firebase Hosting config | Task 1 |
| 7 | cidadel-web | E2E verification | Tasks 1-6 |
| 8 | tacticl-web | Remove LoginPage + routes | — |
| 9 | tacticl-web | Update LandingPage CTAs | Task 8 |
| 10 | tacticl-web | Verify redirects (read-only) | Task 8 |
| 11 | tacticl-web | Clean up /login references | Task 8 |
| 12 | tacticl-web | E2E verification | Tasks 8-11 |

**Parallelism:** Workstream 1 (Tasks 1-7) and Workstream 2 (Tasks 8-12) can be done in parallel since they're in different repos.
