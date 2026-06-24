import { api } from './client';
import type {
  Connection,
  GithubInstallCallbackRequest,
  GithubInstallUrlResponse,
  GithubRepo,
  OAuthAuthorizeResponse,
  OAuthCallbackResponse,
} from './types';

export const connectionsApi = {
  list: () =>
    api.get<Connection[]>('/v1/connections'),

  getOAuthUrl: (platform: string, redirectUri: string) =>
    api.get<OAuthAuthorizeResponse>(
      `/v1/connections/oauth/${platform}/url?redirectUri=${encodeURIComponent(redirectUri)}`,
    ),

  handleOAuthCallback: (platform: string, code: string, redirectUri: string, codeVerifier?: string) =>
    api.post<OAuthCallbackResponse>(
      `/v1/connections/oauth/${platform}/callback`,
      { code, redirectUri, codeVerifier },
    ),

  disconnect: (id: string) =>
    api.delete<void>(`/v1/connections/${id}`),

  // ── GitHub App org grant ──────────────────────────────────────────────
  // Repos in scope for the user's linked GitHub org. Returns [] (never 500)
  // when no installation / app is configured.
  githubRepos: () =>
    api.get<GithubRepo[]>('/v1/connections/github/repos'),

  // GitHub App install URL. `url` is null/empty when the app is unconfigured.
  githubInstallUrl: () =>
    api.get<GithubInstallUrlResponse>('/v1/connections/github/install/url'),

  // Persists installationId (+orgLogin) onto the user's GITHUB connection
  // after GitHub redirects back from the App install flow.
  handleGithubInstallCallback: (req: GithubInstallCallbackRequest) =>
    api.post<Connection>('/v1/connections/github/install/callback', req),
};
