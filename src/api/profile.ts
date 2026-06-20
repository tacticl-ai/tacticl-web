import { api } from './client';
import type { UserProfileResponse, UpdateProfileRequest } from './types';

export const profileApi = {
  me: () => api.get<UserProfileResponse>('/v1/users/me'),

  // P5 write: PUT /v1/users/me { displayName?, avatarUrl? } → 200 UserProfileResponse
  update: (data: UpdateProfileRequest) =>
    api.put<UserProfileResponse>('/v1/users/me', data),
};
