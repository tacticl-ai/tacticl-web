import { api } from './client';
import type { UserProfileResponse } from './types';

export type { UserProfileResponse };

export const profileApi = {
  me: () => api.get<UserProfileResponse>('/v1/users/me'),
};
