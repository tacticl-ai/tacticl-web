import { useAuthStore } from '../stores/auth-store';

const AUTH_URL =
  import.meta.env.VITE_AUTH_URL || 'https://auth.tacticl.ai';

export function useAuth() {
  const { token, isLoading, clearAuth } = useAuthStore();

  const login = () => {
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `${AUTH_URL}/login?redirect_uri=${returnUrl}`;
  };

  const logout = () => {
    clearAuth();
  };

  return {
    token,
    isLoading,
    isAuthenticated: !!token,
    login,
    logout,
  };
}
