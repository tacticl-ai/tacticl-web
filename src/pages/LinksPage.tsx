// src/pages/LinksPage.tsx
// LINKS has been folded into SETTINGS → "Connections" (2026-06 IA re-cut). The
// former full-bleed connection grid + OAuth flow now lives in SettingsHubPage's
// ConnectionsSection, which owns the useConnections / useConnectPlatform /
// useHandleOAuthCallback hooks and handles the OAuth callback at /settings.
//
// This component is kept only as a safety redirect: /links is routed to
// /settings in App.tsx, but if anything (a bookmark, a stale OAuth redirect_uri
// pointing at /links) still hits this page, forward to /settings and preserve
// the query string so an in-flight OAuth callback (?code&platform&state) is not
// lost.
import { Navigate, useLocation } from 'react-router-dom';

export default function LinksPage() {
  const { search } = useLocation();
  return <Navigate to={`/settings${search}`} replace />;
}
