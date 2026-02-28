import { api } from './client';
import type { Connection, OAuthAuthorizeResponse, OAuthCallbackResponse } from './types';

export const connectionsApi = {
  list: () =>
    api.get<Connection[]>('/api/social/integrations'),

  getOAuthUrl: (platform: string, redirectUri: string) =>
    api.get<OAuthAuthorizeResponse>(
      `/api/social/oauth/${platform}/authorize?redirectUri=${encodeURIComponent(redirectUri)}`,
    ),

  handleOAuthCallback: (platform: string, code: string, redirectUri: string, codeVerifier?: string) => {
    let url = `/api/social/oauth/${platform}/callback?code=${encodeURIComponent(code)}&redirectUri=${encodeURIComponent(redirectUri)}`;
    if (codeVerifier) url += `&codeVerifier=${encodeURIComponent(codeVerifier)}`;
    return api.get<OAuthCallbackResponse>(url);
  },

  disconnect: (id: string) =>
    api.delete<void>(`/api/social/integrations/${id}`),
};
