import { api } from './client';

export interface UserConfig {
  maxConcurrentSparks: number;
  spendingLimit: number;
  domainAllowlist: string[];
  domainBlocklist: string[];
}

export const settingsApi = {
  get: () => api.get<UserConfig>('/v1/settings'),
  update: (data: Partial<UserConfig>) => api.put<UserConfig>('/v1/settings', data),
};
