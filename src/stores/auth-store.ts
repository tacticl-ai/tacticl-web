import { create } from 'zustand';

const AUTH_API_URL =
  import.meta.env.VITE_AUTH_API_URL || 'https://auth-api.tacticl.ai';

interface AuthState {
  userId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hydrate: () => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  isLoading: true,
  isAuthenticated: false,

  hydrate: async () => {
    const params = new URLSearchParams(window.location.search);
    const authToken = params.get('auth_token');

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
          params.delete('auth_token');
          params.delete('user_id');
          const clean = params.toString();
          const newUrl = window.location.pathname + (clean ? `?${clean}` : '');
          window.history.replaceState({}, '', newUrl);
          set({ userId: data.userId || data.user?.id || null, isAuthenticated: true, isLoading: false });
          return;
        }
      } catch (error) {
        console.error('Token exchange failed:', error);
      }
      params.delete('auth_token');
      params.delete('user_id');
      const clean = params.toString();
      const newUrl = window.location.pathname + (clean ? `?${clean}` : '');
      window.history.replaceState({}, '', newUrl);
    }

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
    set({ userId: null, isAuthenticated: false });
  },
}));
