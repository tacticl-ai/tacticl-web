import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialApi } from '../api/social';

export function useSocialIntegrations() {
  return useQuery({
    queryKey: ['social-integrations'],
    queryFn: () => socialApi.listIntegrations(),
    refetchInterval: 30_000,
  });
}

export function useDisconnectIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => socialApi.disconnectIntegration(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['social-integrations'] }),
  });
}

export function useSocialPosts(state?: string) {
  return useQuery({
    queryKey: ['social-posts', state],
    queryFn: () => socialApi.listPosts(state),
    refetchInterval: 15_000,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: socialApi.createPost,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['social-posts'] }),
  });
}

export function useCancelPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => socialApi.cancelPost(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['social-posts'] }),
  });
}
