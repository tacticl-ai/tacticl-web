import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '../api/accounts';

const OAUTH_STATE_KEY = 'tacticl_oauth_state';

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
      // Generate and store a random state for CSRF protection before redirecting
      const state = crypto.randomUUID();
      sessionStorage.setItem(OAUTH_STATE_KEY, state);
      const separator = result.authUrl.includes('?') ? '&' : '?';
      const authUrlWithState = `${result.authUrl}${separator}state=${encodeURIComponent(state)}`;
      window.open(authUrlWithState, '_blank', 'width=600,height=700');
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
    onError: (error) => {
      console.error('Failed to connect account:', error);
    },
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
    onError: (error) => {
      console.error('Failed to handle OAuth callback:', error);
    },
  });
}

export function useDisconnectAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountsApi.disconnect(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
    onError: (error) => {
      console.error('Failed to disconnect account:', error);
    },
  });
}

/** Validate the OAuth state parameter to prevent CSRF attacks. */
export function validateOAuthState(urlState: string | null): boolean {
  const savedState = sessionStorage.getItem(OAUTH_STATE_KEY);
  sessionStorage.removeItem(OAUTH_STATE_KEY);
  if (!urlState || !savedState) return false;
  return urlState === savedState;
}
