import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reposApi } from '../api/repos';
import type { GrantRepoRequest } from '../api/types';

export function useRepos() {
  return useQuery({
    queryKey: ['repos'],
    queryFn: () => reposApi.list(),
  });
}

export function useGrantRepo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: GrantRepoRequest) => reposApi.grant(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['repos'] }),
  });
}

export function useRevokeRepo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reposApi.revoke(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['repos'] }),
  });
}
