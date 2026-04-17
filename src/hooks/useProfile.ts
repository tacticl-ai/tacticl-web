import { useQuery } from '@tanstack/react-query';
import { profileApi } from '../api/profile';
import { useAuthStore } from '../stores/auth-store';

export function useProfile() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: profile = null, isLoading: loading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.me(),
    enabled: isAuthenticated,
    retry: false,
    staleTime: 5 * 60_000,
  });

  return { profile, loading };
}
