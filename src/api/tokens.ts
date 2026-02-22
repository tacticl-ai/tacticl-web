import { api } from './client';
import type { AgentToken, CreateTokenRequest } from './types';

export const tokensApi = {
  list: () => api.get<AgentToken[]>('/api/tokens'),

  create: (data: CreateTokenRequest) =>
    api.post<AgentToken>('/api/tokens', data),

  remove: (id: string) => api.delete<void>(`/api/tokens/${id}`),

  usage: (id: string) => api.get<AgentToken>(`/api/tokens/${id}/usage`),
};
