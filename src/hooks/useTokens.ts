import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tokensApi, apiTokensApi } from '../api/tokens';
import type { CreateTokenRequest, CreateApiTokenRequest } from '../api/types';

// ── Legacy BYOK provider-token hooks (TokenListPage / AddTokenCard) ─────────
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

// ── P5 personal API-token hooks (create-once / list-masked / revoke) ────────
export function useApiTokens() {
  return useQuery({
    queryKey: ['api-tokens'],
    queryFn: () => apiTokensApi.list(),
    retry: false,
  });
}

export function useCreateApiToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateApiTokenRequest) => apiTokensApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-tokens'] }),
  });
}

export function useRevokeApiToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiTokensApi.revoke(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-tokens'] }),
  });
}
