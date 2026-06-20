import { api } from './client';
import type {
  AgentToken,
  CreateTokenRequest,
  ApiTokenSummary,
  CreateApiTokenRequest,
  CreatedApiToken,
} from './types';

// Legacy BYOK provider tokens (Anthropic/OpenAI keys w/ usage limits).
export const tokensApi = {
  list: () => api.get<AgentToken[]>('/v1/tokens'),

  create: (data: CreateTokenRequest) =>
    api.post<AgentToken>('/v1/tokens', data),

  remove: (id: string) => api.delete<void>(`/v1/tokens/${id}`),

  usage: (id: string) => api.get<AgentToken>(`/v1/tokens/${id}/usage`),
};

// P5 personal API tokens — create (plaintext returned ONCE) / list (masked) / revoke.
// POST /v1/tokens { name } → 201 CreatedApiToken;
// GET /v1/tokens → 200 ApiTokenSummary[]; DELETE /v1/tokens/{id} → 204.
export const apiTokensApi = {
  list: () => api.get<ApiTokenSummary[]>('/v1/tokens'),

  create: (data: CreateApiTokenRequest) =>
    api.post<CreatedApiToken>('/v1/tokens', data),

  revoke: (id: string) => api.delete<void>(`/v1/tokens/${id}`),
};
