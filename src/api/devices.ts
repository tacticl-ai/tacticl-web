import { api } from './client';
import type { Device, PairingCodeResponse } from './types';

export const devicesApi = {
  list: () => api.get<Device[]>('/v1/devices'),

  get: (id: string) => api.get<Device>(`/v1/devices/${id}`),

  remove: (id: string) => api.delete<void>(`/v1/devices/${id}`),

  updatePreferences: (id: string, preferences: Record<string, boolean>) =>
    api.put<Device>(`/v1/devices/${id}/preferences`, preferences),

  createPairingCode: () =>
    api.post<PairingCodeResponse>('/v1/devices/pairing-code'),
};
