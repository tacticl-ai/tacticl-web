# Pricing Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a pricing section with 4 tier cards and monthly/annual toggle, embedded on the landing page and available as a standalone `/pricing` route.

**Architecture:** A single `PricingSection` component holds all pricing data, the billing toggle, and the card grid. It's embedded into LandingPage between "How It Works" and the CTA, and also wrapped by a standalone `PricingPage` for the `/pricing` route. PublicHeader gets a new "Pricing" nav link.

**Tech Stack:** React 19, TypeScript, MUI 7, React Router 7, existing hooks (useScrollReveal, useTilt3D from LandingPage)

---

## Context for the Implementer

- **Design doc:** `docs/plans/2026-02-26-pricing-page-design.md`
- **Theme:** Dark mode. Primary: `#6C63FF`. Accents: cyan `#06b6d4`, violet `#8b5cf6`, pink `#ec4899`. Backgrounds: `#0D0D1A`, `#0F0F23`.
- **Landing page patterns:** See `src/pages/LandingPage.tsx` for scroll-reveal, 3D tilt, glassmorphic cards, section structure.
- **No tests exist in this project.** This is a frontend-only SPA with no test infrastructure. Skip TDD steps — verify by running `npm run build` and visual inspection.

---

### Task 1: Create PricingSection Component

**Files:**
- Create: `src/components/pricing/PricingSection.tsx`

**Step 1: Create the pricing data and types**

The tier data array lives at the top of the file. Each tier has: name, monthly price, annual price, token allocation, device count, accent color, features array, CTA label, CTA href, and a `highlighted` boolean for Pro.

```typescript
// Tier data structure
interface PricingTier {
  name: string;
  monthlyPrice: number | null; // null = custom
  annualPrice: number | null;
  tokens: string;
  devices: string;
  models: string;
  color: string;
  features: string[];
  cta: string;
  ctaHref: string;
  highlighted: boolean;
}

const tiers: PricingTier[] = [
  {
    name: 'Starter',
    monthlyPrice: 49,
    annualPrice: 39,
    tokens: '250K tokens/mo',
    devices: '3 devices',
    models: 'Haiku + Sonnet',
    color: '#06b6d4',
    features: [
      'All 6 spark types',
      'Manual checkpoints',
      '1 social platform',
      'Community support',
    ],
    cta: 'Start Free Trial',
    ctaHref: '/login',
    highlighted: false,
  },
  {
    name: 'Pro',
    monthlyPrice: 129,
    annualPrice: 99,
    tokens: '750K tokens/mo',
    devices: '10 devices',
    models: 'All models',
    color: '#6C63FF',
    features: [
      'Everything in Starter',
      'All AI models',
      'Scheduling',
      '3 social platforms',
      'Email support (48h)',
    ],
    cta: 'Start Free Trial',
    ctaHref: '/login',
    highlighted: true,
  },
  {
    name: 'Max',
    monthlyPrice: 349,
    annualPrice: 279,
    tokens: '2.5M tokens/mo',
    devices: 'Unlimited devices',
    models: 'All + priority routing',
    color: '#8b5cf6',
    features: [
      'Everything in Pro',
      'Priority routing',
      'Recurring schedules',
      'Unlimited social platforms',
      'Priority support (4h)',
      'BYOK option',
    ],
    cta: 'Start Free Trial',
    ctaHref: '/login',
    highlighted: false,
  },
  {
    name: 'Enterprise',
    monthlyPrice: null,
    annualPrice: null,
    tokens: 'Custom allocation',
    devices: 'Unlimited devices',
    models: 'All + dedicated',
    color: '#ec4899',
    features: [
      'Everything in Max',
      'Dedicated queue',
      'Custom checkpoint policies',
      'API access',
      'Dedicated CSM',
    ],
    cta: 'Contact Sales',
    ctaHref: 'mailto:sales@tacticl.ai',
    highlighted: false,
  },
];
```

**Step 2: Build the PricingSection component**

The component renders:
1. Section header ("Simple, transparent pricing")
2. Subheading + "14-day free trial" callout
3. Monthly/Annual toggle (`ToggleButtonGroup` with two `ToggleButton`s)
4. 4-card `Grid` — each card is a glassmorphic box

Key implementation details:
- `useState<'monthly' | 'annual'>('monthly')` for toggle state
- Annual toggle shows a "Save 20%" chip next to the Annual button
- Each card shows: tier name in accent color, price (big number), "/mo" suffix, billing subtitle ("billed monthly" or "billed annually"), annual cards show strikethrough of monthly price
- Enterprise card shows "Custom" instead of a price
- Feature list uses `CheckCircleOutlineIcon` (already imported in LandingPage) with accent color
- Pro card gets: thicker border glow in purple, `position: 'relative'` with a "Most Popular" chip absolutely positioned at top center
- CTA buttons: highlighted tier gets `variant="contained"` with gradient, others get `variant="outlined"`

**Step 3: Export the component**

Default export `PricingSection`. It accepts an optional `id` prop for anchor linking.

```typescript
interface PricingSectionProps {
  id?: string;
}
export default function PricingSection({ id }: PricingSectionProps) { ... }
```

**Step 4: Verify build**

Run: `npm run build`
Expected: No TypeScript or build errors.

**Step 5: Commit**

```bash
git add src/components/pricing/PricingSection.tsx
git commit -m "feat: Add PricingSection component with tier cards and billing toggle"
```

---

### Task 2: Create Standalone PricingPage

**Files:**
- Create: `src/pages/PricingPage.tsx`

**Step 1: Build PricingPage**

This is a thin wrapper that matches the LandingPage structure:
- Import `PublicHeader` from `../components/layout/PublicHeader`
- Import `PricingSection` from `../components/pricing/PricingSection`
- Outer `Box` with `bgcolor: '#0D0D1A'`, `minHeight: '100vh'`, `color: '#fff'`
- `<PublicHeader />` at top
- `<Box sx={{ pt: 12 }}>` spacer for fixed header
- `<PricingSection />`
- Footer matching LandingPage footer (same `<Box component="footer">` with copyright text)

```typescript
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import PublicHeader from '../components/layout/PublicHeader';
import PricingSection from '../components/pricing/PricingSection';

export default function PricingPage() {
  return (
    <Box sx={{ bgcolor: '#0D0D1A', minHeight: '100vh', color: '#fff' }}>
      <PublicHeader />
      <Box sx={{ pt: 12 }} />
      <PricingSection />
      <Box
        component="footer"
        sx={{
          bgcolor: '#0D0D1A',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          py: 4,
          textAlign: 'center',
        }}
      >
        <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
          &copy; 2026 Tacticl. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/pages/PricingPage.tsx
git commit -m "feat: Add standalone PricingPage at /pricing"
```

---

### Task 3: Add /pricing Route to App.tsx

**Files:**
- Modify: `src/App.tsx:8-9` (imports) and `src/App.tsx:53-54` (routes)

**Step 1: Add import**

After the `LandingPage` import (line 8), add:
```typescript
import PricingPage from './pages/PricingPage';
```

**Step 2: Add route**

After the `/login` route (line 54), add:
```tsx
<Route path="/pricing" element={<PricingPage />} />
```

This goes in the public routes section (outside the `ProtectedRoute` wrapper).

**Step 3: Verify build**

Run: `npm run build`
Expected: No errors.

**Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: Add /pricing public route"
```

---

### Task 4: Embed PricingSection in LandingPage

**Files:**
- Modify: `src/pages/LandingPage.tsx:16` (imports) and `src/pages/LandingPage.tsx:751-753` (between How It Works and CTA)

**Step 1: Add import**

After the `PublicHeader` import (line 17), add:
```typescript
import PricingSection from '../components/pricing/PricingSection';
```

**Step 2: Embed between How It Works and CTA**

At line 752 (after the closing `</Box>` of the How It Works section, before the `{/* ========== CTA Section ========== */}` comment), insert:

```tsx
      {/* ========== Pricing Section ========== */}
      <PricingSection id="pricing" />
```

**Step 3: Verify build**

Run: `npm run build`
Expected: No errors.

**Step 4: Commit**

```bash
git add src/pages/LandingPage.tsx
git commit -m "feat: Embed PricingSection on landing page"
```

---

### Task 5: Add Pricing Nav Link to PublicHeader

**Files:**
- Modify: `src/components/layout/PublicHeader.tsx:20-23` (NAV_LINKS array)

**Step 1: Add Pricing to NAV_LINKS**

Change the `NAV_LINKS` array from:
```typescript
const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
];
```

To:
```typescript
const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
];
```

Note: On the landing page, this anchors to `#pricing` (the embedded section). On the standalone `/pricing` page, users navigated there directly. This is consistent with Features and How It Works behavior.

**Step 2: Verify build**

Run: `npm run build`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/components/layout/PublicHeader.tsx
git commit -m "feat: Add Pricing link to public header navigation"
```

---

### Task 6: Visual QA and Final Commit

**Step 1: Run dev server**

Run: `npm run dev`

**Step 2: Visual checks**

Open `http://localhost:5173` and verify:
- [ ] Landing page: Pricing section appears between "How it works" and the CTA
- [ ] Pricing section: 4 cards visible, Pro card highlighted with "Most Popular" badge
- [ ] Monthly/Annual toggle switches prices correctly
- [ ] Annual prices show strikethrough of monthly price
- [ ] Enterprise card shows "Custom" pricing and "Contact Sales" button
- [ ] Cards have glassmorphic style, hover glow, 3D tilt effect
- [ ] Responsive: 2-col on tablet width, 1-col on mobile width
- [ ] Header "Pricing" link scrolls to the pricing section
- [ ] Navigate to `/pricing` directly — standalone page renders with header + pricing + footer
- [ ] "Start Free Trial" buttons link to `/login`

**Step 3: Fix any visual issues found**

**Step 4: Final build check**

Run: `npm run build && npm run lint`
Expected: No errors.

**Step 5: Commit design doc + any fixes**

```bash
git add docs/plans/2026-02-26-pricing-page-design.md docs/plans/2026-02-26-pricing-page-impl.md
git commit -m "docs: Add pricing page design and implementation plan"
```
