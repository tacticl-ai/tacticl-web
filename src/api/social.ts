import { api } from './client';
import type { SocialPost, CreatePostRequest } from './types';

export const socialApi = {
  listPosts: (state?: string) =>
    api.get<SocialPost[]>(state ? `/api/social/posts?state=${state}` : '/api/social/posts'),

  getPost: (id: string) =>
    api.get<SocialPost>(`/api/social/posts/${id}`),

  createPost: (data: CreatePostRequest) =>
    api.post<SocialPost>('/api/social/posts', data),

  cancelPost: (id: string) =>
    api.delete<void>(`/api/social/posts/${id}`),
};
