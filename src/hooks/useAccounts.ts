import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '../api/accounts';

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsApi.list(),
    refetchInterval: 30_000,
  });
}

export function useConnectAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ platform, redirectUri }: { platform: string; redirectUri: string }) => {
      const result = await accountsApi.getOAuthUrl(platform, redirectUri);
      window.open(result.authUrl, '_blank', 'width=600,height=700');
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  });
}

export function useHandleOAuthCallback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      platform,
      code,
      redirectUri,
      codeVerifier,
    }: {
      platform: string;
      code: string;
      redirectUri: string;
      codeVerifier?: string;
    }) => accountsApi.handleOAuthCallback(platform, code, redirectUri, codeVerifier),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  });
}

export function useDisconnectAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountsApi.disconnect(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  });
}
