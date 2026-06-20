import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reposApi, settingsReposApi } from '../api/repos';
import type { GrantRepoRequest, AttachRepoRequest } from '../api/types';

// ── Legacy provider-grant hooks (RepoListPage / GrantRepoCard) ──────────────
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

// ── P5 Settings repo-memory hooks (attach by URL / list / revoke) ───────────
export function useSettingsRepos() {
  return useQuery({
    queryKey: ['settings-repos'],
    queryFn: () => settingsReposApi.list(),
    retry: false,
  });
}

export function useAttachRepo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AttachRepoRequest) => settingsReposApi.attach(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings-repos'] }),
  });
}

export function useRevokeSettingsRepo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (repoId: string) => settingsReposApi.revoke(repoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings-repos'] }),
  });
}
