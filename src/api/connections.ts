import { api } from './client';
import type { Connection, OAuthAuthorizeResponse, OAuthCallbackResponse } from './types';

export const connectionsApi = {
  list: () =>
    api.get<Connection[]>('/v1/connections'),

  getOAuthUrl: (platform: string, redirectUri: string) =>
    api.get<OAuthAuthorizeResponse>(
      `/v1/connections/oauth/${platform}/url?redirectUri=${encodeURIComponent(redirectUri)}`,
    ),

  handleOAuthCallback: (platform: string, code: string, redirectUri: string, codeVerifier?: string) =>
    api.post<OAuthCallbackResponse>(
      `/v1/connections/oauth/${platform}/callback`,
      { code, redirectUri, codeVerifier },
    ),

  disconnect: (id: string) =>
    api.delete<void>(`/v1/connections/${id}`),
};
