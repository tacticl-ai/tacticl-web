import { api } from './client';

export interface UserProfileResponse {
  displayName: string;
  email: string;
  avatarUrl: string | null;
}

export const profileApi = {
  me: () => api.get<UserProfileResponse>('/v1/users/me'),
};
