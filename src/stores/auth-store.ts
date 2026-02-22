import { create } from 'zustand';

interface AuthState {
  token: string | null;
  isLoading: boolean;
  hydrate: () => void;
  setToken: (token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isLoading: true,

  hydrate: () => {
    const token = localStorage.getItem('tacticl-auth-token');
    set({ token, isLoading: false });
  },

  setToken: (token: string) => {
    localStorage.setItem('tacticl-auth-token', token);
    set({ token });
  },

  clearAuth: () => {
    localStorage.removeItem('tacticl-auth-token');
    set({ token: null });
  },
}));
