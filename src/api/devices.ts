import { api } from './client';
import type { Device, PairingTokenResponseDto } from './types';

export const devicesApi = {
  list: () => api.get<Device[]>('/v1/connections/devices'),

  get: (id: string) => api.get<Device>(`/v1/connections/devices/${id}`),

  remove: (id: string) => api.delete<void>(`/v1/connections/devices/${id}`),

  updatePreferences: (id: string, preferences: Record<string, boolean>) =>
    api.put<Device>(`/v1/connections/devices/${id}/preferences`, preferences),

  createPairingCode: () =>
    api.post<PairingTokenResponseDto>('/v1/connections/devices/pair'),
};
