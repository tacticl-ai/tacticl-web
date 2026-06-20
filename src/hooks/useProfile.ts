import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../api/profile';
import type { UpdateProfileRequest, UserProfileResponse } from '../api/types';
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

/** P5 PUT /v1/users/me — saves displayName/avatarUrl and refreshes the profile query. */
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => profileApi.update(data),
    onSuccess: (updated: UserProfileResponse) => {
      qc.setQueryData(['profile'], updated);
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
