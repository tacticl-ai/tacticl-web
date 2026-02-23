import { useAuthStore } from '../stores/auth-store';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const { token, userId, isLoading, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const logout = () => {
    clearAuth();
    navigate('/login', { replace: true });
  };

  return {
    token,
    userId,
    isLoading,
    isAuthenticated: !!token,
    logout,
  };
}
