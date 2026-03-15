# Cidadel Console — Design Spec

**Date**: 2026-03-15
**Status**: Approved

## Overview

Build a standalone Cidadel Console (`cidadel-console` repo) — a product management dashboard for the Cidadel identity platform. Includes a public landing page and an authenticated console for registering and managing products that use Cidadel for auth.

**Target audience**: Internal (you/your team) now, designed to open to external developers later.

## System Architecture

```
cidadel.ai (cidadel-console)
├── / ...................... Landing page (anon)
├── /console ............... Dashboard (authed) — product cards, quick actions
├── /console/products/new .. Registration wizard
├── /console/products/:id .. Product detail/edit
├── /console/users ......... User management (future)
└── /console/health ........ System health (future)

auth.cidadel.ai (cidadel-web) — shared auth portal, already exists
cidadel-api (cidadel-core)  — backend, add /v1/admin/products/* CRUD endpoints
```

### Data Flow

1. User visits `cidadel.ai` → sees landing page
2. Clicks "Sign In" → redirects to `auth.cidadel.ai/signin?redirect=cidadel.ai/console`
3. Authenticates (passkey/Google/TOTP) → redirects back with `?auth_token=...&user_id=...`
4. Console hydrates token from URL, stores in localStorage
5. Console calls `cidadel-api/v1/admin/products/*` with Bearer token
6. Admin-only middleware on backend verifies user has admin role

### Deployments

- **cidadel-console**: New repo, Firebase Hosting (free tier), domain `cidadel.ai`
- **cidadel-web**: Add "cidadel" product config to `products.ts` for auth portal theming
- **cidadel-core**: Add `/v1/admin/products/*` CRUD endpoints, no new infrastructure

## Tech Stack

Same proven stack as tacticl-web:

- React 19, TypeScript 5.9, Vite 7.3
- MUI 7 with Emotion — Electric Fortress gold theme
- Zustand (auth store) + TanStack React Query 5 (server state)
- React Router 7 (client-side routing)
- Firebase Hosting (SPA deployment)

## Brand Identity — Electric Fortress

- **Primary**: `#C8AA3C` (electric gold)
- **Secondary**: `#162040` (deep blue)
- **Background**: `linear-gradient(135deg, #060a18 0%, #0c1225 100%)`
- **Paper**: `#0f1a30`
- **Contrast text**: `#060a18` (dark on gold buttons)
- **Font**: Inter, sans-serif
- **Logo motif**: Gold shield on dark background, subtle grid overlay, glow rings
- **Tagline**: "AI-Powered Identity Platform"

## Project Structure

```
cidadel-console/
├── src/
│   ├── pages/
│   │   ├── LandingPage.tsx          # Public landing page
│   │   ├── ConsoleDashboard.tsx     # Product cards + quick actions
│   │   ├── ProductRegistration.tsx  # Multi-step registration wizard
│   │   └── ProductDetail.tsx        # Edit existing product
│   ├── components/
│   │   ├── layout/                  # ConsoleLayout, Sidebar, PublicHeader
│   │   ├── products/                # ProductCard, wizard step components
│   │   └── common/                  # LoadingState, EmptyState, ErrorState
│   ├── api/
│   │   ├── client.ts                # Base ApiClient (Bearer token, 401 redirect)
│   │   ├── types.ts                 # TypeScript interfaces
│   │   └── products.ts              # Product CRUD API calls
│   ├── hooks/
│   │   ├── useAuth.ts               # Auth hook
│   │   └── useProducts.ts           # React Query hooks for products
│   ├── stores/
│   │   └── auth-store.ts            # Zustand: token, userId, SSO hydration
│   └── theme/
│       └── index.ts                 # MUI Electric Fortress gold theme
├── public/
│   └── logos/                       # Cidadel shield logo SVG
├── firebase.json
├── .firebaserc
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Console Dashboard

### MVP Sections

1. **Product Cards** — Grid of registered products. Each card shows logo, name, brand color swatch, status badge (active/inactive), and domain. Plus a prominent "Register New Product" card with + icon.

2. **Quick Actions** — Top bar shortcuts: Register Product, Open Auth Portal Preview, Reload Product Cache.

### Future Sections (post-MVP)

3. **Auth Analytics** — Sign-ins, sign-ups, active sessions, failed logins. Needs backend analytics endpoints.
4. **Recent Activity Feed** — Timeline of events. Needs backend event logging.
5. **User Management** — Sidebar nav section. Browse/search users, view sessions, revoke access.
6. **System Health** — API status, Firestore/Vault connectivity indicators.

## Registration Wizard

6-step wizard for registering a new product:

### Step 1: Product Identity
- **Product Name** (required) — e.g. "Tacticl"
- **Product ID** (auto-generated slug from name, editable) — e.g. "tacticl"
  - Real-time uniqueness check via `GET /v1/admin/products/check-id/:id`
- **Tagline** (optional) — e.g. "Your AI Agents, Distributed Everywhere"
- **Description** (optional) — Brief product description

### Step 2: Branding & Theme
- **Primary Color** — MUI color picker, hex input
- **Secondary Color** — MUI color picker, hex input
- **Contrast Text** — Auto-calculated from primary (white/black), with manual override toggle
- **Logo** — File upload (SVG/PNG, max 2MB), preview
- **Font Family** — Dropdown: Inter, Orbitron, Roboto, Poppins, etc.
- **Background Style** — Solid color or gradient (two-color gradient builder)

### Step 3: Domains & URLs
- **Dashboard URL** (required) — Where users redirect after login. e.g. `https://app.tacticl.ai`
- **Default Redirect Path** — Post-login path. e.g. `/chat`, `/dashboard`
- **Auth Domain** — Auto-derived: `auth.{productId}.ai` (editable)
- **Cookie Domain** — Auto-derived from dashboard URL domain (editable)
- **Allowed Origins** — Auto-populated from dashboard URL and auth domain, editable list

### Step 4: Email Configuration
- **Sender Name** — e.g. "Tacticl" (used in From: field)
- **Reply-To Email** — e.g. `support@tacticl.ai`

### Step 5: Token Configuration
- **Token Issuer** — e.g. `tacticl.ai`
- **Token Audience** — e.g. `tacticl-api`
- **Access Token TTL** — Dropdown: 15min, 30min, 1hr, 2hr, 4hr (default: 1hr)
- **Refresh Token TTL** — Dropdown: 7 days, 14 days, 30 days, 90 days (default: 30 days)

### Step 6: Live Preview & Confirm
- **Sign-in page mockup** — Rendered with chosen branding (colors, logo, font, background)
- **Settings summary** — All configured values in a review table
- **"Create Product" button** — Calls `POST /v1/admin/products`

## Backend API (cidadel-core additions)

New service module or new controller in existing `service-auth`:

### Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/v1/admin/products` | List all products | Admin |
| `GET` | `/v1/admin/products/:id` | Get product detail | Admin |
| `POST` | `/v1/admin/products` | Create product | Admin |
| `PUT` | `/v1/admin/products/:id` | Update product | Admin |
| `DELETE` | `/v1/admin/products/:id` | Soft-delete (set isActive=false) | Admin |
| `POST` | `/v1/admin/products/:id/logo` | Upload logo to GCS, save URL | Admin |
| `GET` | `/v1/admin/products/check-id/:id` | Check if product ID available | Admin |

### Request/Response

**POST /v1/admin/products** request body:
```json
{
  "productId": "tacticl",
  "displayName": "Tacticl",
  "brandColor": "#6C63FF",
  "logoUrl": null,
  "frontendUrl": "https://auth.tacticl.ai",
  "cookieDomain": ".tacticl.ai",
  "allowedOrigins": ["https://app.tacticl.ai", "https://auth.tacticl.ai"],
  "emailSenderName": "Tacticl",
  "emailReplyTo": "support@tacticl.ai",
  "tokenIssuer": "tacticl.ai",
  "tokenAudience": "tacticl-api",
  "cookiePrefix": "tacticl",
  "onboardingUrl": "https://app.tacticl.ai/chat"
}
```

All fields map directly to existing `ProductEntity`. The repository's `save()` method already exists.

### Authorization

Admin role check using cidadel-core's existing `framework-authorization` module. The admin role should be checked against a Firestore-stored role or a claim in the PASETO token.

## Cidadel Product Self-Registration

Register "cidadel" as a product in the system:

### Firestore Document
```json
{
  "productId": "cidadel",
  "displayName": "Cidadel",
  "brandColor": "#C8AA3C",
  "frontendUrl": "https://auth.cidadel.ai",
  "cookieDomain": ".cidadel.ai",
  "allowedOrigins": ["https://cidadel.ai", "https://auth.cidadel.ai"],
  "emailSenderName": "Cidadel",
  "tokenIssuer": "cidadel.ai",
  "tokenAudience": "cidadel-console",
  "cookiePrefix": "cidadel",
  "onboardingUrl": "https://cidadel.ai/console",
  "isActive": true
}
```

### cidadel-web products.ts Addition
```typescript
cidadel: {
  name: 'Cidadel',
  primaryColor: '#C8AA3C',
  secondaryColor: '#162040',
  fontFamily: 'Inter, sans-serif',
  titleFontFamily: 'Inter, sans-serif',
  background: 'linear-gradient(135deg, #060a18 0%, #0c1225 100%)',
  paperColor: '#0f1a30',
  logoPath: '/logos/cidadel.svg',
  tagline: 'AI-Powered Identity Platform',
  dashboardUrl: 'https://cidadel.ai',
  defaultRedirect: '/console',
  authApiUrl: 'https://cidadel-api-iboj74jsea-ue.a.run.app',
  apiBaseUrl: 'https://cidadel-api-iboj74jsea-ue.a.run.app',
  contrastText: '#060a18',
}
```

## Landing Page

Public page at `cidadel.ai/` — visible when not authenticated.

**Value proposition** (blending all three directions):
- Hero: "Identity infrastructure for your product portfolio"
- Sub: "Drop-in auth that looks like yours. Register your product, get a branded sign-in page instantly."
- Features: Multi-product theming, Passkeys + OAuth + TOTP, AI-powered fraud detection (future), Self-service console

**Structure**: Same pattern as tacticl-web LandingPage — hero with CTA, features grid, how-it-works steps, CTA footer. Electric Fortress dark theme with gold accents, shield motif, grid overlay.

## Future Considerations

- **Auth Methods per product** — Toggle which auth methods are available (needs backend feature flags)
- **OAuth Credential Management** — Self-service Google/Facebook app credentials (needs Vault integration)
- **Security Policies per product** — MFA enforcement, session limits, IP allowlisting
- **Analytics Dashboard** — Sign-in/sign-up metrics, active sessions, failed login tracking
- **Billing** — Usage-based pricing when opened to external users
- **API Keys** — Per-product API keys for backend-to-backend auth
