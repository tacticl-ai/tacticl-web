import { api } from './client';
import type { SocialIntegration, OAuthAuthorizeResponse, OAuthCallbackResponse } from './types';

export const accountsApi = {
  /** List all connected accounts (reuses social integrations endpoint) */
  list: () =>
    api.get<SocialIntegration[]>('/api/social/integrations'),

  /** Get OAuth authorization URL for a platform */
  getOAuthUrl: (platform: string, redirectUri: string) =>
    api.get<OAuthAuthorizeResponse>(
      `/api/social/oauth/${platform}/authorize?redirectUri=${encodeURIComponent(redirectUri)}`
    ),

  /** Handle OAuth callback */
  handleOAuthCallback: (platform: string, code: string, redirectUri: string, codeVerifier?: string) => {
    let url = `/api/social/oauth/${platform}/callback?code=${encodeURIComponent(code)}&redirectUri=${encodeURIComponent(redirectUri)}`;
    if (codeVerifier) url += `&codeVerifier=${encodeURIComponent(codeVerifier)}`;
    return api.get<OAuthCallbackResponse>(url);
  },

  /** Disconnect an account */
  disconnect: (id: string) =>
    api.delete<void>(`/api/social/integrations/${id}`),
};
