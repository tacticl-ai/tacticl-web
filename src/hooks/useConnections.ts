import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { connectionsApi } from '../api/connections';

const OAUTH_STATE_KEY = 'tacticl_oauth_state';

export function useConnections() {
  return useQuery({
    queryKey: ['connections'],
    queryFn: () => connectionsApi.list(),
    refetchInterval: 30_000,
  });
}

export function useConnectPlatform() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ platform, redirectUri }: { platform: string; redirectUri: string }) => {
      const result = await connectionsApi.getOAuthUrl(platform, redirectUri);
      const state = crypto.randomUUID();
      sessionStorage.setItem(OAUTH_STATE_KEY, state);
      const separator = result.authUrl.includes('?') ? '&' : '?';
      const authUrlWithState = `${result.authUrl}${separator}state=${encodeURIComponent(state)}`;
      window.open(authUrlWithState, '_blank', 'width=600,height=700');
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['connections'] }),
    onError: (error) => {
      console.error('Failed to connect platform:', error);
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
    }) => connectionsApi.handleOAuthCallback(platform, code, redirectUri, codeVerifier),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['connections'] }),
    onError: (error) => {
      console.error('Failed to handle OAuth callback:', error);
    },
  });
}

export function useDisconnectPlatform() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => connectionsApi.disconnect(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['connections'] }),
    onError: (error) => {
      console.error('Failed to disconnect platform:', error);
    },
  });
}

export function validateOAuthState(urlState: string | null): boolean {
  const savedState = sessionStorage.getItem(OAUTH_STATE_KEY);
  sessionStorage.removeItem(OAUTH_STATE_KEY);
  if (!urlState || !savedState) return false;
  return urlState === savedState;
}
