import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tokensApi } from '../api/tokens';
import type { CreateTokenRequest } from '../api/types';

export function useTokens() {
  return useQuery({
    queryKey: ['tokens'],
    queryFn: () => tokensApi.list(),
  });
}

export function useCreateToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTokenRequest) => tokensApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tokens'] }),
  });
}

export function useRemoveToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tokensApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tokens'] }),
  });
}
