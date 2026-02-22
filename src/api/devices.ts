import { api } from './client';
import type { Device } from './types';

export const devicesApi = {
  list: () => api.get<Device[]>('/api/devices'),

  get: (id: string) => api.get<Device>(`/api/devices/${id}`),

  remove: (id: string) => api.delete<void>(`/api/devices/${id}`),

  updatePreferences: (id: string, preferences: Record<string, boolean>) =>
    api.put<Device>(`/api/devices/${id}/preferences`, preferences),
};
