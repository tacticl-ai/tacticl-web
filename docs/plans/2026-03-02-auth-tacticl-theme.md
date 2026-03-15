# auth.tacticl.ai Purple Theme via Cidadel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Get auth.tacticl.ai serving from cidadel-web with Tacticl's purple (#6C63FF) theme, replacing the broken strategiz-ui auth deployment.

**Architecture:** Single cidadel-web Firebase deployment serves both auth.tacticl.ai and auth.strategiz.ai. Runtime hostname detection in `products.ts` applies the correct brand theme. Fix hardcoded green colors and black button text to be dynamic from productConfig.

**Tech Stack:** React 19, MUI 7, Vite, Firebase Hosting, TypeScript

---

### Task 1: Add `contrastText` to product config

**Files:**
- Modify: `cidadel-web/src/config/products.ts`

**Step 1: Add `contrastText` to `ProductTheme` interface and both product configs**

```typescript
// In ProductTheme interface, add:
contrastText: string;

// In tacticl config:
contrastText: '#ffffff',  // white on dark purple

// In strategiz config:
contrastText: '#000000',  // black on bright green
```

**Step 2: Verify type-check passes**

Run: `cd /Users/cuztomizer/Documents/GitHub/cidadel-web && npx tsc --noEmit`
Expected: Error about `contrastText` missing in productConfig.ts (we fix next)

**Step 3: Update productConfig.ts to include contrastText**

```typescript
// In cidadel-web/src/config/productConfig.ts, add:
contrastText: productTheme.contrastText,
```

**Step 4: Run type-check to verify it passes**

Run: `cd /Users/cuztomizer/Documents/GitHub/cidadel-web && npx tsc --noEmit`
Expected: PASS

**Step 5: Commit**

```bash
cd /Users/cuztomizer/Documents/GitHub/cidadel-web
git add src/config/products.ts src/config/productConfig.ts
git commit -m "feat: add contrastText to product theme config"
```

---

### Task 2: Fix theme.ts to use dynamic contrastText

**Files:**
- Modify: `cidadel-web/src/theme/theme.ts`

**Step 1: Update the theme to use contrastText from productConfig**

In `cidadel-web/src/theme/theme.ts`, the `darkTheme` has `contrastText: '#000000'` hardcoded on line 40. Change to:

```typescript
// Line 4: add contrastText to destructured imports
const { primaryColor, secondaryColor, fontFamily, paperColor, contrastText } = productConfig;

// Line 40: use dynamic contrastText
contrastText: contrastText,

// Line 143-144: containedPrimary button color
containedPrimary: {
  color: contrastText,
  // ... rest stays the same
},
```

**Step 2: Run type-check**

Run: `cd /Users/cuztomizer/Documents/GitHub/cidadel-web && npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**

```bash
cd /Users/cuztomizer/Documents/GitHub/cidadel-web
git add src/theme/theme.ts
git commit -m "feat: use dynamic contrastText in MUI theme"
```

---

### Task 3: Fix hardcoded `color: 'black'` in SignInForm

**Files:**
- Modify: `cidadel-web/src/features/auth/components/SignInForm.tsx`

**Step 1: Replace all hardcoded `color: 'black'` on buttons with dynamic contrastText**

Import contrastText and replace all 4 instances of `color: 'black'` in button sx props:

```typescript
// Line 28: add to import
import { productConfig } from '../../../config/productConfig';

// Line 64: add contrastText to destructure
const { primaryColor: neonGreen, contrastText } = productConfig;

// Lines 202, 299, 364, 425: Replace color: 'black' with:
color: contrastText,
```

**Step 2: Run type-check**

Run: `cd /Users/cuztomizer/Documents/GitHub/cidadel-web && npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**

```bash
cd /Users/cuztomizer/Documents/GitHub/cidadel-web
git add src/features/auth/components/SignInForm.tsx
git commit -m "fix: use dynamic contrastText for button labels in SignInForm"
```

---

### Task 4: Fix hardcoded green in SignUpForm

**Files:**
- Modify: `cidadel-web/src/features/auth/components/SignUpForm.tsx`

**Step 1: Replace all hardcoded `color: 'black'` and `rgba(57, 255, 20, 0.3)` values**

```typescript
// Line 37: add contrastText
const { primaryColor: neonGreen, contrastText, dashboardUrl, defaultRedirect } = productConfig;

// Replace every instance of:
//   color: 'black'  →  color: contrastText
//   backgroundColor: 'rgba(57, 255, 20, 0.3)'  →  backgroundColor: alpha(neonGreen, 0.3)
//   color: 'rgba(0, 0, 0, 0.5)'  →  color: alpha(contrastText, 0.5)
```

There are approximately 10 instances of `color: 'black'` and 8 instances of `rgba(57, 255, 20, 0.3)` in this file.

**Step 2: Run type-check**

Run: `cd /Users/cuztomizer/Documents/GitHub/cidadel-web && npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**

```bash
cd /Users/cuztomizer/Documents/GitHub/cidadel-web
git add src/features/auth/components/SignUpForm.tsx
git commit -m "fix: replace hardcoded green/black colors with dynamic theme values in SignUpForm"
```

---

### Task 5: Fix hardcoded colors in RecoveryScreen

**Files:**
- Modify: `cidadel-web/src/features/auth/screens/RecoveryScreen.tsx`

**Step 1: Replace `color: 'black'` with dynamic contrastText**

```typescript
// Add contrastText to the productConfig destructure
const { primaryColor: neonGreen, contrastText } = productConfig;

// Replace all color: 'black' instances with color: contrastText
```

**Step 2: Run type-check**

Run: `cd /Users/cuztomizer/Documents/GitHub/cidadel-web && npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**

```bash
cd /Users/cuztomizer/Documents/GitHub/cidadel-web
git add src/features/auth/screens/RecoveryScreen.tsx
git commit -m "fix: use dynamic contrastText in RecoveryScreen"
```

---

### Task 6: Remove stale tacticl-auth target from strategiz-ui

**Files:**
- Modify: `strategiz-ui/firebase.json`

**Step 1: Remove the `tacticl-auth` hosting block**

Remove the entire hosting entry with `"site": "tacticl-auth"` (lines ~335-396 in `strategiz-ui/firebase.json`). This prevents the old green-themed auth from deploying to the tacticl-auth Firebase site.

**Step 2: Verify firebase.json is still valid JSON**

Run: `cd /Users/cuztomizer/Documents/GitHub/strategiz-ui && node -e "JSON.parse(require('fs').readFileSync('firebase.json','utf8')); console.log('Valid JSON')"`
Expected: "Valid JSON"

**Step 3: Commit**

```bash
cd /Users/cuztomizer/Documents/GitHub/strategiz-ui
git add firebase.json
git commit -m "chore: remove stale tacticl-auth hosting target (moved to cidadel-web)"
```

---

### Task 7: Build and verify cidadel-web locally

**Step 1: Build cidadel-web**

Run: `cd /Users/cuztomizer/Documents/GitHub/cidadel-web && npm run build`
Expected: Build succeeds with no errors

**Step 2: Preview locally and verify both themes**

Run: `cd /Users/cuztomizer/Documents/GitHub/cidadel-web && npm run preview`

Verify in browser:
- `localhost:4173` → should show default (strategiz) green theme
- Theme detection is hostname-based, so to test tacticl theme add `VITE_PRODUCT_NAME=Tacticl` override or check `products.ts` detection logic

**Step 3: Commit any remaining fixes**

---

### Task 8: Manual deployment steps (not automated)

These require Firebase Console and DNS access — document for the user:

1. **Firebase Console** → Hosting → cidadel-web site → Add custom domain → `auth.tacticl.ai`
2. **DNS Provider** → Add CNAME record: `auth.tacticl.ai` → Firebase-provided target
3. **Firebase Console** → Also add `auth.strategiz.ai` as custom domain (to fully migrate off strategiz-ui auth)
4. **Google Cloud Console** → OAuth → Add `https://auth.tacticl.ai/auth/oauth/google/signin/callback` to authorized redirect URIs
5. **Facebook Developer Console** → Add `https://auth.tacticl.ai` to Valid OAuth Redirect URIs
6. **Deploy:** `cd /Users/cuztomizer/Documents/GitHub/cidadel-web && npm run build && firebase deploy`
