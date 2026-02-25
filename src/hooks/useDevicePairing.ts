import { useMutation, useQueryClient } from '@tanstack/react-query';
import { devicesApi } from '../api/devices';

export function useCreatePairingCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => devicesApi.createPairingCode(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['devices'] }),
  });
}
