import { api } from './client';
import type { RepoGrant, GrantRepoRequest } from './types';

export const reposApi = {
  list: () => api.get<RepoGrant[]>('/api/repos'),

  grant: (data: GrantRepoRequest) =>
    api.post<RepoGrant>('/api/repos/grant', data),

  revoke: (id: string) => api.delete<void>(`/api/repos/${id}`),
};
