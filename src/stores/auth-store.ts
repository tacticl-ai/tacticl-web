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
    const token = localStorage.getItem('tacticl-auth-token');
    const userId = localStorage.getItem('tacticl-user-id');

    // Check for token in URL params (SSO redirect from auth.strategiz.ai)
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('auth_token');
    const urlUserId = params.get('user_id');

    if (urlToken) {
      localStorage.setItem('tacticl-auth-token', urlToken);
      if (urlUserId) localStorage.setItem('tacticl-user-id', urlUserId);
      // Clean URL
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
    localStorage.setItem('tacticl-auth-token', token);
    localStorage.setItem('tacticl-user-id', userId);
    set({ token, userId });
  },

  clearAuth: () => {
    localStorage.removeItem('tacticl-auth-token');
    localStorage.removeItem('tacticl-user-id');
    set({ token: null, userId: null });
  },
}));
