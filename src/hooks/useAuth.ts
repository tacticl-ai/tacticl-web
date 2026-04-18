import { useAuthStore } from '../stores/auth-store';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

const AUTH_API_URL =
  import.meta.env.VITE_AUTH_API_URL || 'https://auth-api.tacticl.ai';

export function useAuth() {
  const { userId, isLoading, isAuthenticated, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const logout = async () => {
    try {
      await fetch(`${AUTH_API_URL}/v1/auth/sessions/revoke`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch { /* best-effort */ }
    queryClient.clear();
    clearAuth();
    navigate('/', { replace: true });
  };

  return { userId, isLoading, isAuthenticated, logout };
}
