import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { devicesApi } from '../api/devices';

export function useDevices() {
  return useQuery({
    queryKey: ['devices'],
    queryFn: () => devicesApi.list(),
    refetchInterval: 15_000,
  });
}

export function useDevice(id: string) {
  return useQuery({
    queryKey: ['devices', id],
    queryFn: () => devicesApi.get(id),
    refetchInterval: 10_000,
  });
}

export function useUpdateDevicePreferences(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prefs: Record<string, boolean>) =>
      devicesApi.updatePreferences(id, prefs),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['devices'] }),
  });
}

export function useRemoveDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => devicesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['devices'] }),
  });
}
