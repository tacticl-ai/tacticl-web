import { create } from 'zustand';

const AUTH_API_URL =
  import.meta.env.VITE_AUTH_API_URL || 'https://auth-api.tacticl.ai';

const TOKEN_KEY = 'tacticl_access_token';
const REFRESH_KEY = 'tacticl_refresh_token';

/** Read the stored access token (used by API client and WebSocket). */
export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

interface AuthState {
  userId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hydrate: () => Promise<void>;
  clearAuth: () => void;
}

function cleanUrl() {
  const params = new URLSearchParams(window.location.search);
  params.delete('auth_token');
  params.delete('user_id');
  const clean = params.toString();
  const newUrl = window.location.pathname + (clean ? `?${clean}` : '');
  window.history.replaceState({}, '', newUrl);
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  isLoading: true,
  isAuthenticated: false,

  hydrate: async () => {
    const params = new URLSearchParams(window.location.search);
    const authToken = params.get('auth_token');

    // 1. Exchange one-time auth token for session tokens
    if (authToken) {
      try {
        const response = await fetch(`${AUTH_API_URL}/v1/auth/token/exchange`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: authToken }),
        });

        if (response.ok) {
          const data = await response.json();
          // Store Bearer tokens for API calls
          if (data.accessToken) localStorage.setItem(TOKEN_KEY, data.accessToken);
          if (data.refreshToken) localStorage.setItem(REFRESH_KEY, data.refreshToken);
          cleanUrl();
          set({ userId: data.userId || data.user?.id || null, isAuthenticated: true, isLoading: false });
          return;
        }
      } catch (error) {
        console.error('Token exchange failed:', error);
      }
      cleanUrl();
    }

    // 2. Check for stored token in localStorage
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      try {
        const response = await fetch(`${AUTH_API_URL}/v1/auth/session/validate-cookie`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Authorization': `Bearer ${storedToken}` },
        });
        if (response.ok) {
          const data = await response.json();
          set({ userId: data.userId || data.user?.id || null, isAuthenticated: true, isLoading: false });
          return;
        }
      } catch { /* token invalid or expired */ }
      // Token is invalid — clear it
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
    }

    // 3. Fallback: validate via cookie alone (e.g. if cookie domain is set correctly)
    try {
      const response = await fetch(`${AUTH_API_URL}/v1/auth/session/validate-cookie`, {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        set({ userId: data.userId || data.user?.id || null, isAuthenticated: true, isLoading: false });
        return;
      }
    } catch { /* not authenticated */ }

    set({ userId: null, isAuthenticated: false, isLoading: false });
  },

  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    set({ userId: null, isAuthenticated: false });
  },
}));
