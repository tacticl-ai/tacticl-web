import { api } from './client';
import type { RepoGrant, GrantRepoRequest } from './types';

export const reposApi = {
  list: () => api.get<RepoGrant[]>('/v1/repos'),

  grant: (data: GrantRepoRequest) =>
    api.post<RepoGrant>('/v1/repos/grant', data),

  revoke: (id: string) => api.delete<void>(`/v1/repos/${id}`),
};
