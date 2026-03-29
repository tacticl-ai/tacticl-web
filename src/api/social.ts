import { api } from './client';
import type { SocialPost, CreatePostRequest } from './types';

export const socialApi = {
  listPosts: (state?: string) =>
    api.get<SocialPost[]>(state ? `/v1/social/posts?state=${state}` : '/v1/social/posts'),

  getPost: (id: string) =>
    api.get<SocialPost>(`/v1/social/posts/${id}`),

  createPost: (data: CreatePostRequest) =>
    api.post<SocialPost>('/v1/social/posts', data),

  cancelPost: (id: string) =>
    api.delete<void>(`/v1/social/posts/${id}`),
};
