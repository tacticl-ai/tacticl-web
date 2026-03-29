import { api } from './client';
import type { AgentToken, CreateTokenRequest } from './types';

export const tokensApi = {
  list: () => api.get<AgentToken[]>('/v1/tokens'),

  create: (data: CreateTokenRequest) =>
    api.post<AgentToken>('/v1/tokens', data),

  remove: (id: string) => api.delete<void>(`/v1/tokens/${id}`),

  usage: (id: string) => api.get<AgentToken>(`/v1/tokens/${id}/usage`),
};
