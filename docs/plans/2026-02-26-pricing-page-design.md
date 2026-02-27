# Pricing Page Design

**Date:** 2026-02-26
**Status:** Approved

---

## Overview

Build a pricing section/page for Tacticl that displays the 4-tier subscription model (Starter, Pro, Max, Enterprise) with monthly/annual toggle, matching the existing dark landing page aesthetic.

## Architecture

- **Shared component:** `src/components/pricing/PricingSection.tsx` — pricing cards + billing toggle
- **Landing page integration:** Embed `<PricingSection />` between "How It Works" and CTA sections with `id="pricing"`
- **Standalone route:** `src/pages/PricingPage.tsx` at `/pricing` — wraps PricingSection with PublicHeader + footer
- **Nav update:** Add "Pricing" link to PublicHeader's `NAV_LINKS`
- **Route update:** Add `/pricing` as a public route in App.tsx

## Visual Design

### Layout
- Dark background: `#0F0F23` (matches features section)
- Scroll-reveal animation via existing `useScrollReveal` hook
- 4 cards in horizontal row using MUI `Grid`
- Responsive: 4-col desktop, 2-col tablet, 1-col mobile
- Monthly/Annual pill toggle at top (`ToggleButtonGroup`)
- "14-day free trial" callout text centered above cards

### Card Style
- Glassmorphic: semi-transparent bg (`rgba(255,255,255,0.02)`), subtle border, hover glow
- 3D tilt on hover via existing `useTilt3D` hook
- Pro card elevated: glowing purple border, "Most Popular" badge
- Color coding: Starter=cyan (#06b6d4), Pro=purple (#6C63FF), Max=violet (#8b5cf6), Enterprise=pink (#ec4899)

### Card Content

Each card contains:
1. Tier name + color accent
2. Price (switches with toggle) — annual shows strikethrough monthly price + savings badge
3. Token allocation description
4. Device count
5. Feature checklist with checkmark icons
6. CTA button

### Tier Data

| | Starter | Pro | Max | Enterprise |
|---|---|---|---|---|
| Monthly | $49/mo | $129/mo | $349/mo | Custom |
| Annual | $39/mo | $99/mo | $279/mo | Custom |
| Tokens | 250K/mo | 750K/mo | 2.5M/mo | Custom |
| Devices | 3 | 10 | Unlimited | Unlimited |
| Models | Haiku + Sonnet | All models | All + priority | All + dedicated |
| CTA | Start Free Trial | Start Free Trial | Start Free Trial | Contact Sales |

### Feature Lists (progressive)

**Starter:**
- All 6 spark types
- Manual checkpoints
- 1 social platform
- Community support

**Pro (everything in Starter +):**
- All AI models
- Scheduling
- 3 social platforms
- Email support (48h)

**Max (everything in Pro +):**
- Priority routing
- Recurring schedules
- Unlimited social platforms
- Priority support (4h)
- BYOK option

**Enterprise (everything in Max +):**
- Dedicated queue
- Custom checkpoint policies
- API access
- Dedicated CSM

## Files to Create/Modify

1. **Create** `src/components/pricing/PricingSection.tsx` — main pricing component
2. **Create** `src/pages/PricingPage.tsx` — standalone pricing page
3. **Modify** `src/pages/LandingPage.tsx` — import and embed PricingSection
4. **Modify** `src/components/layout/PublicHeader.tsx` — add Pricing nav link
5. **Modify** `src/App.tsx` — add /pricing route
