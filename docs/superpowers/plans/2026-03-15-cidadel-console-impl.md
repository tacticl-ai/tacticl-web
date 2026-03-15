# Cidadel Console Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone Cidadel Console (`cidadel-console` repo) with a landing page, product management dashboard, and multi-step product registration wizard. Add backend CRUD endpoints to cidadel-core. Register Cidadel as a product in cidadel-web.

**Architecture:** Three independent workstreams: (1) cidadel-core backend adds `/v1/admin/products/*` CRUD endpoints using existing ProductRepository, (2) cidadel-web adds "cidadel" product config to products.ts, (3) new cidadel-console React SPA with landing page, dashboard, and registration wizard. Same tech stack and patterns as tacticl-web.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7.3, MUI 7, Zustand, TanStack React Query 5, React Router 7, Firebase Hosting

**Spec:** `docs/superpowers/specs/2026-03-15-cidadel-console-design.md`

---

## Chunk 1: Backend — Product Admin API (cidadel-core)

**Working directory:** `/Users/cuztomizer/Documents/GitHub/cidadel-core`

### Task 1: Create ProductAdminController with CRUD endpoints

**Files:**
- Create: `service/service-auth/src/main/java/io/cidadel/identity/service/auth/controller/admin/ProductAdminController.java`

**Context:**
- Follow the pattern of `ProductThemeController` (extends `BaseController`, uses `@RestController`, `@RequestMapping`)
- `ProductRepository` already has `findById()`, `findAll()`, `save(product, userId)`. There is no `delete` — use soft-delete via `setIsActive(false)` + `save()`
- `ProductService` has a `reload()` method to refresh the cache after mutations

- [ ] **Step 1: Create the controller**

```java
package io.cidadel.identity.service.auth.controller.admin;

import io.cidadel.identity.data.product.entity.ProductEntity;
import io.cidadel.identity.data.product.repository.ProductRepository;
import io.cidadel.identity.data.product.service.ProductService;
import io.cidadel.service.base.controller.BaseController;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin endpoints for managing product configurations.
 * All endpoints require an authenticated admin user.
 */
@RestController
@RequestMapping("/v1/admin/products")
@Tag(name = "Product Admin", description = "Product CRUD for console")
public class ProductAdminController extends BaseController {

	private static final Logger log = LoggerFactory.getLogger(ProductAdminController.class);

	private final ProductRepository productRepository;
	private final ProductService productService;

	public ProductAdminController(ProductRepository productRepository, ProductService productService) {
		this.productRepository = productRepository;
		this.productService = productService;
	}

	@Override
	protected String getModuleName() {
		return "service-auth";
	}

	@GetMapping
	@Operation(summary = "List all products")
	public ResponseEntity<Collection<ProductEntity>> listProducts() {
		return ResponseEntity.ok(productService.getAll());
	}

	@GetMapping("/{productId}")
	@Operation(summary = "Get product by ID")
	public ResponseEntity<ProductEntity> getProduct(@PathVariable String productId) {
		return productService.findById(productId)
				.map(ResponseEntity::ok)
				.orElse(ResponseEntity.notFound().build());
	}

	@GetMapping("/check-id/{productId}")
	@Operation(summary = "Check if product ID is available")
	public ResponseEntity<Map<String, Boolean>> checkProductId(@PathVariable String productId) {
		boolean available = productService.findById(productId).isEmpty();
		return ResponseEntity.ok(Map.of("available", available));
	}

	@PostMapping
	@Operation(summary = "Create a new product")
	public ResponseEntity<ProductEntity> createProduct(@RequestBody ProductEntity product) {
		// Check for duplicate
		if (productService.findById(product.getProductId()).isPresent()) {
			return ResponseEntity.badRequest().build();
		}

		String userId = getCurrentUserId();
		log.info("Creating product '{}' by user {}", product.getProductId(), userId);

		ProductEntity saved = productRepository.save(product, userId);
		productService.reload();
		return ResponseEntity.ok(saved);
	}

	@PutMapping("/{productId}")
	@Operation(summary = "Update an existing product")
	public ResponseEntity<ProductEntity> updateProduct(
			@PathVariable String productId,
			@RequestBody ProductEntity product) {

		Optional<ProductEntity> existing = productService.findById(productId);
		if (existing.isEmpty()) {
			return ResponseEntity.notFound().build();
		}

		product.setProductId(productId);
		String userId = getCurrentUserId();
		log.info("Updating product '{}' by user {}", productId, userId);

		ProductEntity saved = productRepository.save(product, userId);
		productService.reload();
		return ResponseEntity.ok(saved);
	}

	@DeleteMapping("/{productId}")
	@Operation(summary = "Soft-delete a product")
	public ResponseEntity<Void> deleteProduct(@PathVariable String productId) {
		Optional<ProductEntity> existing = productService.findById(productId);
		if (existing.isEmpty()) {
			return ResponseEntity.notFound().build();
		}

		ProductEntity product = existing.get();
		product.setIsActive(false);
		String userId = getCurrentUserId();
		log.info("Soft-deleting product '{}' by user {}", productId, userId);

		productRepository.save(product, userId);
		productService.reload();
		return ResponseEntity.noContent().build();
	}
}
```

- [ ] **Step 2: Verify build compiles**

Run: `cd /Users/cuztomizer/Documents/GitHub/cidadel-core && ./gradlew :service:service-auth:compileJava --no-daemon 2>&1 | tail -5`
Expected: `BUILD SUCCESSFUL`

If `getCurrentUserId()` does not exist on `BaseController`, check the base class for the correct method name (may be `getUserId()` or accessed via security context). Fix accordingly.

If `setIsActive()` does not exist on `BaseEntity`, check the base entity for the active/status field name and adjust.

- [ ] **Step 3: Commit**

```bash
cd /Users/cuztomizer/Documents/GitHub/cidadel-core
git add service/service-auth/src/main/java/io/cidadel/identity/service/auth/controller/admin/ProductAdminController.java
git commit -m "feat: add product admin CRUD controller

Endpoints: GET/POST/PUT/DELETE /v1/admin/products
Includes product ID availability check.
Reloads product cache after mutations."
```

---

### Task 2: Add CORS config for cidadel.ai origins

**Files:**
- Modify: `application-api/src/main/resources/application-prod.properties`

- [ ] **Step 1: Add cidadel.ai to CORS allowed origins**

In the `cidadel.cors.allowed-origin-patterns` property, add cidadel console domains. Find the line starting with `cidadel.cors.allowed-origin-patterns=` and append:
```
,https://cidadel\\.ai,https://.*\\.cidadel\\.ai,https://cidadel-console\\.web\\.app,https://cidadel-console\\.firebaseapp\\.com
```

- [ ] **Step 2: Verify the properties file is valid**

Run: `cd /Users/cuztomizer/Documents/GitHub/cidadel-core && ./gradlew :application-api:compileJava --no-daemon 2>&1 | tail -3`
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 3: Commit**

```bash
cd /Users/cuztomizer/Documents/GitHub/cidadel-core
git add application-api/src/main/resources/application-prod.properties
git commit -m "feat: add cidadel.ai console domains to CORS config"
```

---

## Chunk 2: cidadel-web — Register Cidadel as a Product

**Working directory:** `/Users/cuztomizer/Documents/GitHub/cidadel-web`

### Task 3: Add cidadel product config to products.ts

**Files:**
- Modify: `src/config/products.ts`

- [ ] **Step 1: Add cidadel entry to PRODUCT_CONFIGS**

After the `pointstax` entry in the `PRODUCT_CONFIGS` map, add:

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
},
```

- [ ] **Step 2: Add cidadel to hostname detection in detectProduct()**

Add before the strategiz check:
```typescript
if (hostname.includes('cidadel')) return 'cidadel';
```

- [ ] **Step 3: Create cidadel shield logo SVG**

Create `public/logos/cidadel.svg` — a gold shield icon on transparent background:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#C8AA3C"/>
      <stop offset="50%" stop-color="#E8D060"/>
      <stop offset="100%" stop-color="#A8882A"/>
    </linearGradient>
  </defs>
  <path d="M50 5L10 22v28c0 26 17 43 40 45 23-2 40-19 40-45V22L50 5z" fill="url(#gold)"/>
  <path d="M50 15L20 28v22c0 20 13 34 30 36 17-2 30-16 30-36V28L50 15z" fill="#060a18"/>
  <path d="M50 25L30 34v16c0 14 9 24 20 26 11-2 20-12 20-26V34L50 25z" fill="url(#gold)" opacity="0.6"/>
</svg>
```

- [ ] **Step 4: Build and verify**

Run: `cd /Users/cuztomizer/Documents/GitHub/cidadel-web && npm run build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 5: Deploy cidadel-web**

Run: `cd /Users/cuztomizer/Documents/GitHub/cidadel-web && firebase deploy --only hosting 2>&1 | tail -5`
Expected: Deploy complete

- [ ] **Step 6: Commit**

```bash
cd /Users/cuztomizer/Documents/GitHub/cidadel-web
git add src/config/products.ts public/logos/cidadel.svg
git commit -m "feat: add Cidadel product config with Electric Fortress gold theme"
```

---

### Task 4: Register cidadel product in Firestore

- [ ] **Step 1: Create the Firestore document**

Using the Firebase Admin SDK or Firebase Console, create document `products/cidadel`:

```bash
cd /Users/cuztomizer/Documents/GitHub/cidadel-core
# Use a script or the Firebase Console to add this document
node -e "
const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'cidadel' });
const db = admin.firestore();
db.collection('products').doc('cidadel').set({
  displayName: 'Cidadel',
  brandColor: '#C8AA3C',
  logoUrl: null,
  frontendUrl: 'https://auth.cidadel.ai',
  cookieDomain: '.cidadel.ai',
  allowedOrigins: ['https://cidadel.ai', 'https://auth.cidadel.ai', 'http://localhost:5173'],
  emailSenderName: 'Cidadel',
  emailReplyTo: 'support@cidadel.ai',
  tokenIssuer: 'cidadel.ai',
  tokenAudience: 'cidadel-console',
  cookiePrefix: 'cidadel',
  onboardingUrl: 'https://cidadel.ai/console',
  isActive: true,
  version: 1,
  createdDate: admin.firestore.FieldValue.serverTimestamp(),
  modifiedDate: admin.firestore.FieldValue.serverTimestamp()
});
console.log('Cidadel product document created');
"
```

If firebase-admin is not installed or this script doesn't work, create the document manually via Firebase Console at https://console.firebase.google.com/project/cidadel/firestore — collection `products`, document ID `cidadel`, with the fields above.

---

## Chunk 3: cidadel-console — Project Scaffolding

**Working directory:** `/Users/cuztomizer/Documents/GitHub/cidadel-console`

### Task 5: Initialize cidadel-console repo

- [ ] **Step 1: Create directory and initialize**

```bash
cd /Users/cuztomizer/Documents/GitHub
mkdir cidadel-console && cd cidadel-console
git init
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "cidadel-console",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@emotion/react": "^11.14.0",
    "@emotion/styled": "^11.14.0",
    "@mui/icons-material": "^7.1.0",
    "@mui/material": "^7.1.0",
    "@tanstack/react-query": "^5.75.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router-dom": "^7.6.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "@vitejs/plugin-react": "^4.5.0",
    "eslint": "^9.27.0",
    "typescript": "~5.9.0",
    "vite": "^7.3.0"
  }
}
```

- [ ] **Step 3: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5173,
  },
});
```

- [ ] **Step 4: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

- [ ] **Step 5: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Cidadel — AI-Powered Identity Platform" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <title>Cidadel — AI-Powered Identity Platform</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create firebase.json**

```json
{
  "hosting": {
    "public": "dist",
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

- [ ] **Step 7: Create .firebaserc**

```json
{
  "projects": {
    "default": "cidadel"
  },
  "targets": {
    "cidadel": {
      "hosting": {
        "cidadel-console": ["cidadel-console"]
      }
    }
  }
}
```

Note: The Firebase Hosting site `cidadel-console` needs to be created in the Firebase Console first. If it doesn't exist, run: `firebase hosting:sites:create cidadel-console --project cidadel`

- [ ] **Step 8: Create .gitignore**

```
node_modules
dist
.env
.env.local
.env.*.local
*.log
```

- [ ] **Step 9: Install dependencies and verify**

```bash
cd /Users/cuztomizer/Documents/GitHub/cidadel-console
npm install
```

- [ ] **Step 10: Commit**

```bash
cd /Users/cuztomizer/Documents/GitHub/cidadel-console
git add -A
git commit -m "feat: initialize cidadel-console project

React 19, Vite 7, MUI 7, Zustand, React Query.
Firebase Hosting config for SPA deployment."
```

---

### Task 6: Create Electric Fortress MUI theme

**Files:**
- Create: `src/theme/index.ts`

- [ ] **Step 1: Create theme file**

```typescript
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#C8AA3C',
      light: '#E8D060',
      dark: '#A8882A',
      contrastText: '#060a18',
    },
    secondary: {
      main: '#162040',
      light: '#1e3060',
      dark: '#0c1225',
    },
    background: {
      default: '#060a18',
      paper: '#0f1a30',
    },
    text: {
      primary: '#E8E6E0',
      secondary: 'rgba(232, 230, 224, 0.6)',
    },
    divider: 'rgba(200, 170, 60, 0.12)',
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.03em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.02em' },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          background: 'linear-gradient(135deg, #C8AA3C 0%, #E8D060 100%)',
          color: '#060a18',
          boxShadow: '0 4px 24px rgba(200, 170, 60, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #D4B644 0%, #F0D868 100%)',
            boxShadow: '0 6px 32px rgba(200, 170, 60, 0.4)',
          },
        },
        outlinedPrimary: {
          borderColor: 'rgba(200, 170, 60, 0.5)',
          color: '#C8AA3C',
          '&:hover': {
            borderColor: '#C8AA3C',
            backgroundColor: 'rgba(200, 170, 60, 0.08)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(200, 170, 60, 0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(200, 170, 60, 0.1)',
          '&:hover': {
            borderColor: 'rgba(200, 170, 60, 0.25)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(6, 10, 24, 0.9)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(200, 170, 60, 0.08)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0a1020',
          borderRight: '1px solid rgba(200, 170, 60, 0.08)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#C8AA3C',
            },
          },
        },
      },
    },
  },
});

export default theme;
```

- [ ] **Step 2: Commit**

```bash
git add src/theme/index.ts
git commit -m "feat: add Electric Fortress MUI dark theme (gold + deep blue)"
```

---

### Task 7: Create auth store and API client

**Files:**
- Create: `src/stores/auth-store.ts`
- Create: `src/api/client.ts`
- Create: `src/api/types.ts`
- Create: `src/api/products.ts`

- [ ] **Step 1: Create auth store** (same pattern as tacticl-web)

```typescript
// src/stores/auth-store.ts
import { create } from 'zustand';

interface AuthState {
  token: string | null;
  userId: string | null;
  isLoading: boolean;
  hydrate: () => void;
  setAuth: (token: string, userId: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userId: null,
  isLoading: true,

  hydrate: () => {
    const token = localStorage.getItem('cidadel-auth-token');
    const userId = localStorage.getItem('cidadel-user-id');

    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('auth_token');
    const urlUserId = params.get('user_id');

    if (urlToken) {
      localStorage.setItem('cidadel-auth-token', urlToken);
      if (urlUserId) localStorage.setItem('cidadel-user-id', urlUserId);
      params.delete('auth_token');
      params.delete('user_id');
      const clean = params.toString();
      const newUrl = window.location.pathname + (clean ? `?${clean}` : '');
      window.history.replaceState({}, '', newUrl);
      set({ token: urlToken, userId: urlUserId, isLoading: false });
      return;
    }

    set({ token, userId, isLoading: false });
  },

  setAuth: (token: string, userId: string) => {
    localStorage.setItem('cidadel-auth-token', token);
    localStorage.setItem('cidadel-user-id', userId);
    set({ token, userId });
  },

  clearAuth: () => {
    localStorage.removeItem('cidadel-auth-token');
    localStorage.removeItem('cidadel-user-id');
    set({ token: null, userId: null });
  },
}));
```

- [ ] **Step 2: Create API client**

```typescript
// src/api/client.ts
import { useAuthStore } from '../stores/auth-store';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://cidadel-api-iboj74jsea-ue.a.run.app';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

class ApiClient {
  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = useAuthStore.getState().token;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (response.status === 401) {
      useAuthStore.getState().clearAuth();
      const redirectUrl = encodeURIComponent(window.location.href);
      window.location.href = `https://auth.cidadel.ai/signin?redirect=${redirectUrl}`;
      throw new ApiError(401, 'Unauthorized');
    }

    if (!response.ok) {
      const body = await response.text();
      throw new ApiError(response.status, body);
    }

    if (response.status === 204) return undefined as T;
    return response.json();
  }

  get<T>(path: string) { return this.request<T>(path); }
  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
  }
  put<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined });
  }
  delete<T>(path: string) { return this.request<T>(path, { method: 'DELETE' }); }
}

export const api = new ApiClient();
```

- [ ] **Step 3: Create types**

```typescript
// src/api/types.ts
export interface Product {
  productId: string;
  displayName: string;
  brandColor: string;
  logoUrl: string | null;
  frontendUrl: string;
  cookieDomain: string;
  allowedOrigins: string[];
  emailSenderName: string;
  emailReplyTo: string;
  tokenIssuer: string;
  tokenAudience: string;
  cookiePrefix: string;
  vaultSecretsPath: string | null;
  onboardingUrl: string | null;
  isActive: boolean;
  createdDate: string | null;
  modifiedDate: string | null;
}

export interface ProductIdCheck {
  available: boolean;
}
```

- [ ] **Step 4: Create products API module**

```typescript
// src/api/products.ts
import { api } from './client';
import type { Product, ProductIdCheck } from './types';

const BASE = '/v1/admin/products';

export const productsApi = {
  list: () => api.get<Product[]>(BASE),
  get: (id: string) => api.get<Product>(`${BASE}/${id}`),
  create: (product: Partial<Product>) => api.post<Product>(BASE, product),
  update: (id: string, product: Partial<Product>) => api.put<Product>(`${BASE}/${id}`, product),
  remove: (id: string) => api.delete<void>(`${BASE}/${id}`),
  checkId: (id: string) => api.get<ProductIdCheck>(`${BASE}/check-id/${id}`),
};
```

- [ ] **Step 5: Commit**

```bash
git add src/stores/auth-store.ts src/api/client.ts src/api/types.ts src/api/products.ts
git commit -m "feat: add auth store, API client, and product API module"
```

---

### Task 8: Create React Query hooks for products

**Files:**
- Create: `src/hooks/useProducts.ts`

- [ ] **Step 1: Create hooks**

```typescript
// src/hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api/products';
import type { Product } from '../api/types';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: productsApi.list,
    staleTime: 30_000,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (product: Partial<Product>) => productsApi.create(product),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, product }: { id: string; product: Partial<Product> }) =>
      productsApi.update(id, product),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useCheckProductId(id: string) {
  return useQuery({
    queryKey: ['products', 'check-id', id],
    queryFn: () => productsApi.checkId(id),
    enabled: id.length >= 2,
    staleTime: 5_000,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useProducts.ts
git commit -m "feat: add React Query hooks for product CRUD"
```

---

### Task 9: Create App shell with routing, layout, and ProtectedRoute

**Files:**
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/components/auth/ProtectedRoute.tsx`
- Create: `src/components/layout/ConsoleLayout.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/PublicHeader.tsx`
- Create: `src/vite-env.d.ts`

- [ ] **Step 1: Create vite-env.d.ts**

```typescript
/// <reference types="vite/client" />
```

- [ ] **Step 2: Create main.tsx**

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 3: Create ProtectedRoute**

```typescript
// src/components/auth/ProtectedRoute.tsx
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuthStore } from '../../stores/auth-store';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress sx={{ color: '#C8AA3C' }} />
      </Box>
    );
  }

  if (!token) {
    const redirectUrl = encodeURIComponent(window.location.href);
    window.location.href = `https://auth.cidadel.ai/signin?redirect=${redirectUrl}`;
    return null;
  }

  return <>{children}</>;
}
```

- [ ] **Step 4: Create Sidebar**

```typescript
// src/components/layout/Sidebar.tsx
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ShieldIcon from '@mui/icons-material/Shield';
import { useNavigate, useLocation } from 'react-router-dom';

const SIDEBAR_WIDTH = 240;

const navItems = [
  { label: 'Dashboard', path: '/console', icon: <DashboardIcon /> },
  { label: 'Register Product', path: '/console/products/new', icon: <AddCircleOutlineIcon /> },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, boxSizing: 'border-box' },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <ShieldIcon sx={{ color: '#C8AA3C', fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#C8AA3C', letterSpacing: '0.05em', fontSize: '1.1rem' }}>
          CIDADEL
        </Typography>
      </Box>

      <List sx={{ px: 1 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => navigate(item.path)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: 'rgba(200, 170, 60, 0.1)',
                '&:hover': { bgcolor: 'rgba(200, 170, 60, 0.15)' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: location.pathname === item.path ? '#C8AA3C' : 'text.secondary' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
}

export { SIDEBAR_WIDTH };
```

- [ ] **Step 5: Create ConsoleLayout**

```typescript
// src/components/layout/ConsoleLayout.tsx
import Box from '@mui/material/Box';
import { Outlet } from 'react-router-dom';
import Sidebar, { SIDEBAR_WIDTH } from './Sidebar';

export default function ConsoleLayout() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3, ml: `${SIDEBAR_WIDTH}px` }}>
        <Outlet />
      </Box>
    </Box>
  );
}
```

- [ ] **Step 6: Create PublicHeader**

```typescript
// src/components/layout/PublicHeader.tsx
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import ShieldIcon from '@mui/icons-material/Shield';

const SIGNIN_URL = 'https://auth.cidadel.ai/signin';

export default function PublicHeader() {
  return (
    <AppBar position="fixed" elevation={0}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShieldIcon sx={{ color: '#C8AA3C', fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#C8AA3C', letterSpacing: '0.05em', fontSize: '1.1rem' }}>
            CIDADEL
          </Typography>
        </Box>
        <Button variant="outlined" size="small" href={SIGNIN_URL}>
          Sign In
        </Button>
      </Toolbar>
    </AppBar>
  );
}
```

- [ ] **Step 7: Create App.tsx**

```typescript
// src/App.tsx
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ConsoleLayout from './components/layout/ConsoleLayout';
import LandingPage from './pages/LandingPage';
import ConsoleDashboard from './pages/ConsoleDashboard';
import ProductRegistration from './pages/ProductRegistration';
import ProductDetail from './pages/ProductDetail';
import { useAuthStore } from './stores/auth-store';

function LandingOrConsole() {
  const token = useAuthStore((s) => s.token);
  const isLoading = useAuthStore((s) => s.isLoading);
  if (isLoading) return null;
  if (token) return <Navigate to="/console" replace />;
  return <LandingPage />;
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 10_000 } },
});

function AppInner() {
  const hydrate = useAuthStore((s) => s.hydrate);
  useEffect(() => { hydrate(); }, [hydrate]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingOrConsole />} />
        <Route element={<ProtectedRoute><ConsoleLayout /></ProtectedRoute>}>
          <Route path="/console" element={<ConsoleDashboard />} />
          <Route path="/console/products/new" element={<ProductRegistration />} />
          <Route path="/console/products/:id" element={<ProductDetail />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppInner />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 8: Create placeholder pages** (will be fleshed out in later tasks)

Create minimal placeholder pages so the app compiles:

```typescript
// src/pages/LandingPage.tsx
export default function LandingPage() {
  return <div>Landing Page — TODO</div>;
}
```

```typescript
// src/pages/ConsoleDashboard.tsx
export default function ConsoleDashboard() {
  return <div>Console Dashboard — TODO</div>;
}
```

```typescript
// src/pages/ProductRegistration.tsx
export default function ProductRegistration() {
  return <div>Product Registration — TODO</div>;
}
```

```typescript
// src/pages/ProductDetail.tsx
export default function ProductDetail() {
  return <div>Product Detail — TODO</div>;
}
```

- [ ] **Step 9: Verify build**

```bash
cd /Users/cuztomizer/Documents/GitHub/cidadel-console
npm run build 2>&1 | tail -5
```
Expected: Build succeeds

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add app shell with routing, layout, auth, and placeholder pages

ConsoleLayout with sidebar, ProtectedRoute with cidadel auth redirect,
PublicHeader for landing page, React Router with console/* routes."
```

---

## Chunk 4: Landing Page

### Task 10: Build the Cidadel landing page

**Files:**
- Modify: `src/pages/LandingPage.tsx`

- [ ] **Step 1: Implement full landing page**

Build a landing page following the same structure as tacticl-web's `LandingPage.tsx` but with Cidadel's Electric Fortress branding:

- **PublicHeader** at top (already created)
- **Hero section**: Shield logo, "Identity Infrastructure for Your Product Portfolio" headline, "Drop-in auth that looks like yours" subtitle, "Get Started" CTA button (links to `https://auth.cidadel.ai/signup`), subtle grid overlay background with gold glow
- **Features grid** (3 cards): Multi-Product Theming, Passwordless Auth (Passkeys + TOTP + SMS), AI-Powered Security (future)
- **How it works** (3 steps): Register your product → Configure branding → Get a branded auth portal
- **CTA section**: "Ready to secure your product?" with Sign Up button
- **Footer**: "© 2026 Cidadel. All rights reserved."

Use the gold color `#C8AA3C` for all accents, `#060a18` backgrounds, grid overlay pattern from the Electric Fortress mockup. Follow the same scroll-reveal animation pattern as tacticl-web if desired, or keep it simpler.

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -3
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/LandingPage.tsx
git commit -m "feat: add Cidadel landing page with Electric Fortress branding"
```

---

## Chunk 5: Console Dashboard

### Task 11: Build the console dashboard with product cards

**Files:**
- Modify: `src/pages/ConsoleDashboard.tsx`
- Create: `src/components/products/ProductCard.tsx`
- Create: `src/components/common/LoadingState.tsx`
- Create: `src/components/common/EmptyState.tsx`

- [ ] **Step 1: Create LoadingState component**

```typescript
// src/components/common/LoadingState.tsx
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

export default function LoadingState() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
      <CircularProgress sx={{ color: '#C8AA3C' }} />
    </Box>
  );
}
```

- [ ] **Step 2: Create EmptyState component**

```typescript
// src/components/common/EmptyState.tsx
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useNavigate } from 'react-router-dom';

export default function EmptyState() {
  const navigate = useNavigate();
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>No products registered yet</Typography>
      <Typography sx={{ color: 'text.secondary', mb: 4 }}>Register your first product to get a branded auth portal.</Typography>
      <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={() => navigate('/console/products/new')}>
        Register Product
      </Button>
    </Box>
  );
}
```

- [ ] **Step 3: Create ProductCard component**

```typescript
// src/components/products/ProductCard.tsx
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../api/types';

export default function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();

  return (
    <Card sx={{ height: '100%' }}>
      <CardActionArea onClick={() => navigate(`/console/products/${product.productId}`)} sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box
              sx={{
                width: 48, height: 48, borderRadius: 2,
                background: product.brandColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem', fontWeight: 700, color: '#fff',
              }}
            >
              {product.displayName.charAt(0)}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontSize: '1rem' }}>{product.displayName}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>{product.productId}</Typography>
            </Box>
            <Chip
              label={product.isActive ? 'Active' : 'Inactive'}
              size="small"
              color={product.isActive ? 'success' : 'default'}
              variant="outlined"
            />
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {product.frontendUrl || 'No domain configured'}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
```

- [ ] **Step 4: Implement ConsoleDashboard**

```typescript
// src/pages/ConsoleDashboard.tsx
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/products/ProductCard';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';

export default function ConsoleDashboard() {
  const { data: products, isLoading } = useProducts();
  const navigate = useNavigate();

  if (isLoading) return <LoadingState />;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>Products</Typography>

      {(!products || products.length === 0) ? (
        <EmptyState />
      ) : (
        <Grid container spacing={3}>
          {products.map((product) => (
            <Grid key={product.productId} size={{ xs: 12, sm: 6, md: 4 }}>
              <ProductCard product={product} />
            </Grid>
          ))}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ height: '100%', borderStyle: 'dashed', borderColor: 'rgba(200,170,60,0.2)' }}>
              <CardActionArea onClick={() => navigate('/console/products/new')} sx={{ height: '100%', minHeight: 140 }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <AddCircleOutlineIcon sx={{ fontSize: 40, color: '#C8AA3C' }} />
                  <Typography sx={{ color: '#C8AA3C', fontWeight: 600 }}>Register New Product</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
```

- [ ] **Step 5: Verify build and commit**

```bash
npm run build 2>&1 | tail -3
git add src/pages/ConsoleDashboard.tsx src/components/products/ProductCard.tsx src/components/common/LoadingState.tsx src/components/common/EmptyState.tsx
git commit -m "feat: add console dashboard with product cards grid"
```

---

## Chunk 6: Product Registration Wizard

### Task 12: Build the 6-step registration wizard

**Files:**
- Modify: `src/pages/ProductRegistration.tsx`
- Create: `src/components/products/wizard/StepIdentity.tsx`
- Create: `src/components/products/wizard/StepBranding.tsx`
- Create: `src/components/products/wizard/StepDomains.tsx`
- Create: `src/components/products/wizard/StepEmail.tsx`
- Create: `src/components/products/wizard/StepTokens.tsx`
- Create: `src/components/products/wizard/StepPreview.tsx`

Each step component receives `data` (the current form state) and `onChange` (callback to update form state).

- [ ] **Step 1: Create StepIdentity**

Fields: Product Name (TextField), Product ID (TextField, auto-slugified from name, with uniqueness check via `useCheckProductId`), Tagline (TextField), Description (TextField multiline).

Auto-slug: on name change, generate ID as `name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')`. Show green/red indicator based on `useCheckProductId` result. Allow manual editing of the slug.

- [ ] **Step 2: Create StepBranding**

Fields: Primary Color (MUI TextField with `type="color"` + hex text input), Secondary Color (same), Logo URL (TextField — file upload is future), Font Family (Select dropdown: Inter, Orbitron, Roboto, Poppins, Montserrat), Background (two TextFields for gradient start/end colors with a preview strip).

Show a small preview box that renders a mini card with the selected colors.

- [ ] **Step 3: Create StepDomains**

Fields: Dashboard URL (TextField, required), Default Redirect Path (TextField, default `/dashboard`), Cookie Domain (TextField, auto-derived from dashboard URL — e.g. if dashboard is `https://app.tacticl.ai`, cookie domain is `.tacticl.ai`), Allowed Origins (chip-style list — auto-populated from dashboard URL, editable).

- [ ] **Step 4: Create StepEmail**

Fields: Sender Name (TextField), Reply-To Email (TextField with email validation).

Simple step — just two fields.

- [ ] **Step 5: Create StepTokens**

Fields: Token Issuer (TextField, auto-derived from cookie domain), Token Audience (TextField, default `{productId}-api`), Access Token TTL (Select: 15min, 30min, 1hr, 2hr, 4hr), Refresh Token TTL (Select: 7 days, 14 days, 30 days, 90 days).

- [ ] **Step 6: Create StepPreview**

Render a mockup of a sign-in page using the product's branding (primary color, font, background gradient). Show a summary table of all configured values. Show a "Create Product" button that calls `useCreateProduct` mutation.

The sign-in mockup should include: logo/initial, product name, email field (mock), "Sign In" button in the primary color, and the product's background.

- [ ] **Step 7: Wire up ProductRegistration page**

```typescript
// src/pages/ProductRegistration.tsx
import { useState } from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import StepIdentity from '../components/products/wizard/StepIdentity';
import StepBranding from '../components/products/wizard/StepBranding';
import StepDomains from '../components/products/wizard/StepDomains';
import StepEmail from '../components/products/wizard/StepEmail';
import StepTokens from '../components/products/wizard/StepTokens';
import StepPreview from '../components/products/wizard/StepPreview';
import { useCreateProduct } from '../hooks/useProducts';
import type { Product } from '../api/types';

const STEPS = ['Identity', 'Branding', 'Domains', 'Email', 'Tokens', 'Preview'];

const INITIAL_DATA: Partial<Product> = {
  productId: '',
  displayName: '',
  brandColor: '#6C63FF',
  logoUrl: null,
  frontendUrl: '',
  cookieDomain: '',
  allowedOrigins: [],
  emailSenderName: '',
  emailReplyTo: '',
  tokenIssuer: '',
  tokenAudience: '',
  cookiePrefix: '',
};

export default function ProductRegistration() {
  const [activeStep, setActiveStep] = useState(0);
  const [data, setData] = useState<Partial<Product>>(INITIAL_DATA);
  const navigate = useNavigate();
  const createProduct = useCreateProduct();

  const handleChange = (updates: Partial<Product>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const handleCreate = async () => {
    await createProduct.mutateAsync(data);
    navigate('/console');
  };

  const stepContent = [
    <StepIdentity data={data} onChange={handleChange} />,
    <StepBranding data={data} onChange={handleChange} />,
    <StepDomains data={data} onChange={handleChange} />,
    <StepEmail data={data} onChange={handleChange} />,
    <StepTokens data={data} onChange={handleChange} />,
    <StepPreview data={data} onCreate={handleCreate} isCreating={createProduct.isPending} />,
  ];

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>Register New Product</Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mb: 4 }}>{stepContent[activeStep]}</Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button disabled={activeStep === 0} onClick={() => setActiveStep((s) => s - 1)}>
          Back
        </Button>
        {activeStep < STEPS.length - 1 && (
          <Button variant="contained" onClick={() => setActiveStep((s) => s + 1)}>
            Next
          </Button>
        )}
      </Box>
    </Box>
  );
}
```

Each step component should follow this interface:
```typescript
interface StepProps {
  data: Partial<Product>;
  onChange: (updates: Partial<Product>) => void;
}
```

StepPreview has an additional `onCreate: () => void` and `isCreating: boolean` prop.

- [ ] **Step 8: Verify build and commit**

```bash
npm run build 2>&1 | tail -3
git add src/pages/ProductRegistration.tsx src/components/products/wizard/
git commit -m "feat: add 6-step product registration wizard

Steps: Identity, Branding, Domains, Email, Tokens, Preview.
Live sign-in preview with chosen branding in final step."
```

---

## Chunk 7: Product Detail Page & Deployment

### Task 13: Build product detail/edit page

**Files:**
- Modify: `src/pages/ProductDetail.tsx`

- [ ] **Step 1: Implement ProductDetail**

Fetch product by ID from URL params using `useProduct(id)`. Display a form with the same fields as the registration wizard but in a single-page edit layout (not a wizard). Include a "Save" button that calls `useUpdateProduct`. Show a "Delete" button with confirmation dialog.

Use the same field components from the wizard steps but laid out in sections (Identity, Branding, Domains, Email, Tokens) on one page.

- [ ] **Step 2: Verify build and commit**

```bash
npm run build 2>&1 | tail -3
git add src/pages/ProductDetail.tsx
git commit -m "feat: add product detail/edit page with all sections"
```

---

### Task 14: Build and deploy

- [ ] **Step 1: Create the Firebase Hosting site** (if not already exists)

```bash
firebase hosting:sites:create cidadel-console --project cidadel 2>&1 || echo "Site may already exist"
```

- [ ] **Step 2: Final build**

```bash
cd /Users/cuztomizer/Documents/GitHub/cidadel-console
npm run build
```

- [ ] **Step 3: Deploy**

```bash
firebase deploy --only hosting:cidadel-console --project cidadel
```

- [ ] **Step 4: Commit any final changes**

```bash
git add -A
git commit -m "chore: final build and deployment config"
```

---

## Summary

| Task | Repo | Description | Depends On |
|------|------|-------------|------------|
| 1 | cidadel-core | Product Admin CRUD Controller | — |
| 2 | cidadel-core | CORS config for cidadel.ai | — |
| 3 | cidadel-web | Add cidadel product config | — |
| 4 | cidadel-web | Register cidadel in Firestore | — |
| 5 | cidadel-console | Initialize repo + scaffolding | — |
| 6 | cidadel-console | Electric Fortress MUI theme | Task 5 |
| 7 | cidadel-console | Auth store + API client | Task 5 |
| 8 | cidadel-console | React Query hooks | Task 7 |
| 9 | cidadel-console | App shell, routing, layout | Tasks 6-8 |
| 10 | cidadel-console | Landing page | Task 9 |
| 11 | cidadel-console | Console dashboard | Task 9 |
| 12 | cidadel-console | Registration wizard | Task 9 |
| 13 | cidadel-console | Product detail page | Task 9 |
| 14 | cidadel-console | Build & deploy | Tasks 10-13 |

**Parallelism:** Tasks 1-2 (cidadel-core), Tasks 3-4 (cidadel-web), and Task 5 (cidadel-console init) can run in parallel. Within cidadel-console, Tasks 10-13 can run in parallel after Task 9.
