import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { connectionsApi } from '../api/connections';
import type { GithubInstallCallbackRequest } from '../api/types';

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

// ── GitHub App org grant ────────────────────────────────────────────────────

/** Repos in scope for the user's linked GitHub org (via the App install grant). */
export function useGithubRepos() {
  return useQuery({
    queryKey: ['github-repos'],
    queryFn: () => connectionsApi.githubRepos(),
    staleTime: 30_000,
    retry: false,
  });
}

/**
 * Opens the GitHub App install URL (popup/redirect, like useConnectPlatform).
 * GitHub redirects back to /settings?installation_id=…&setup_action=install,
 * which the ConnectionsSection useEffect picks up to finalize the grant.
 */
export function useInstallGithubApp() {
  return useMutation({
    mutationFn: async () => {
      const result = await connectionsApi.githubInstallUrl();
      if (!result?.url) {
        throw new Error('GitHub App is not configured');
      }
      window.open(result.url, '_blank', 'width=900,height=800');
      return result;
    },
    onError: (error) => {
      console.error('Failed to start GitHub App install:', error);
    },
  });
}

/** Finalizes the GitHub App install once GitHub redirects back to /settings. */
export function useHandleGithubInstallCallback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: GithubInstallCallbackRequest) =>
      connectionsApi.handleGithubInstallCallback(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['github-repos'] });
    },
    onError: (error) => {
      console.error('Failed to finalize GitHub App install:', error);
    },
  });
}

export function validateOAuthState(urlState: string | null): boolean {
  const savedState = sessionStorage.getItem(OAUTH_STATE_KEY);
  sessionStorage.removeItem(OAUTH_STATE_KEY);
  if (!urlState || !savedState) return false;
  return urlState === savedState;
}
