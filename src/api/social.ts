import { api } from './client';
import type { SocialIntegration, SocialPost, CreatePostRequest, OAuthAuthorizeResponse, OAuthCallbackResponse } from './types';

export const socialApi = {
  listIntegrations: () =>
    api.get<SocialIntegration[]>('/api/social/integrations'),

  getIntegration: (id: string) =>
    api.get<SocialIntegration>(`/api/social/integrations/${id}`),

  disconnectIntegration: (id: string) =>
    api.delete<void>(`/api/social/integrations/${id}`),

  getOAuthUrl: (platform: string, redirectUri: string) =>
    api.get<OAuthAuthorizeResponse>(
      `/api/social/oauth/${platform}/authorize?redirectUri=${encodeURIComponent(redirectUri)}`
    ),

  handleOAuthCallback: (platform: string, code: string, redirectUri: string, codeVerifier?: string) => {
    let url = `/api/social/oauth/${platform}/callback?code=${encodeURIComponent(code)}&redirectUri=${encodeURIComponent(redirectUri)}`;
    if (codeVerifier) url += `&codeVerifier=${encodeURIComponent(codeVerifier)}`;
    return api.get<OAuthCallbackResponse>(url);
  },

  listPosts: (state?: string) =>
    api.get<SocialPost[]>(state ? `/api/social/posts?state=${state}` : '/api/social/posts'),

  getPost: (id: string) =>
    api.get<SocialPost>(`/api/social/posts/${id}`),

  createPost: (data: CreatePostRequest) =>
    api.post<SocialPost>('/api/social/posts', data),

  cancelPost: (id: string) =>
    api.delete<void>(`/api/social/posts/${id}`),
};
