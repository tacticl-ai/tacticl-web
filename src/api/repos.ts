import { api } from './client';
import type {
  RepoGrant,
  GrantRepoRequest,
  SettingsRepo,
  AttachRepoRequest,
} from './types';

// Legacy provider-scoped repo grants (chat "grant repo" card / RepoListPage).
export const reposApi = {
  list: () => api.get<RepoGrant[]>('/v1/repos'),

  grant: (data: GrantRepoRequest) =>
    api.post<RepoGrant>('/v1/repos/grant', data),

  revoke: (id: string) => api.delete<void>(`/v1/repos/${id}`),
};

// P5 Settings repo memory — attach by URL / list / revoke.
// GET /v1/repos → SettingsRepo[]; POST /v1/repos → SettingsRepo;
// DELETE /v1/repos/{repoId} → 204.
export const settingsReposApi = {
  list: () => api.get<SettingsRepo[]>('/v1/repos'),

  attach: (data: AttachRepoRequest) =>
    api.post<SettingsRepo>('/v1/repos', data),

  revoke: (repoId: string) => api.delete<void>(`/v1/repos/${repoId}`),
};
