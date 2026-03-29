import { api } from './client';
import type { Connection, OAuthAuthorizeResponse, OAuthCallbackResponse } from './types';

export const connectionsApi = {
  list: () =>
    api.get<Connection[]>('/v1/social/integrations'),

  getOAuthUrl: (platform: string, redirectUri: string) =>
    api.get<OAuthAuthorizeResponse>(
      `/v1/social/oauth/${platform}/authorize?redirectUri=${encodeURIComponent(redirectUri)}`,
    ),

  handleOAuthCallback: (platform: string, code: string, redirectUri: string, codeVerifier?: string) => {
    let url = `/v1/social/oauth/${platform}/callback?code=${encodeURIComponent(code)}&redirectUri=${encodeURIComponent(redirectUri)}`;
    if (codeVerifier) url += `&codeVerifier=${encodeURIComponent(codeVerifier)}`;
    return api.get<OAuthCallbackResponse>(url);
  },

  disconnect: (id: string) =>
    api.delete<void>(`/v1/social/integrations/${id}`),
};
