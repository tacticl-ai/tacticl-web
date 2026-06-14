import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import PricingPage from './pages/PricingPage';
import SparkListPage from './pages/SparkListPage';
import DashboardPage from './pages/DashboardPage';
import PipelineListPage from './pages/PipelineListPage';
import SparkDetailPage from './pages/SparkDetailPage';
import DeviceListPage from './pages/DeviceListPage';
import DeviceDetailPage from './pages/DeviceDetailPage';
import RepoListPage from './pages/RepoListPage';
import TokenListPage from './pages/TokenListPage';
import TemplateListPage from './pages/TemplateListPage';
import TelegramLinkPage from './pages/TelegramLinkPage';
import ConnectionsOverviewPage from './pages/connections/ConnectionsOverviewPage';
import SocialConnectionsPage from './pages/connections/SocialConnectionsPage';
import MediaConnectionsPage from './pages/connections/MediaConnectionsPage';
import DeveloperConnectionsPage from './pages/connections/DeveloperConnectionsPage';
import ProductivityConnectionsPage from './pages/connections/ProductivityConnectionsPage';
import SettingsPage from './pages/SettingsPage';
import CommandCenter from './components/command/CommandCenter';
import ErrorBoundary from './components/auth/ErrorBoundary';
import { useWebSocket } from './hooks/useWebSocket';
import { useAuthStore } from './stores/auth-store';

/** Show landing page for unauthenticated visitors, land authenticated users in the command center */
function LandingOrDashboard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10_000,
    },
  },
});

function AppInner() {
  const hydrate = useAuthStore((s) => s.hydrate);
  useEffect(() => { hydrate(); }, [hydrate]);

  useWebSocket();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingOrDashboard />} />
        <Route path="/pricing" element={<PricingPage />} />

        {/* Command center — full-bleed immersive HUD, no AppLayout chrome. Auth-gated.
            This is now the primary chat surface; the old /chat redirects here. */}
        <Route path="/command" element={<ProtectedRoute><CommandCenter /></ProtectedRoute>} />
        <Route path="/chat" element={<Navigate to="/command" replace />} />

        {/* Dashboard — full-bleed "DEVELOPMENT PIPELINE" HUD, no AppLayout chrome.
            Primary landing surface; shares the COMMAND/DASHBOARD/LINKS/CONFIG nav. */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

        {/* Protected */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/sparks" element={<SparkListPage />} />
          <Route path="/sparks/:id" element={<SparkDetailPage />} />
          <Route path="/pipelines" element={<PipelineListPage />} />
          <Route path="/devices" element={<DeviceListPage />} />
          <Route path="/devices/:id" element={<DeviceDetailPage />} />
          <Route path="/repos" element={<RepoListPage />} />
          <Route path="/tokens" element={<TokenListPage />} />
          <Route path="/templates" element={<TemplateListPage />} />
          <Route path="/connections" element={<ConnectionsOverviewPage />} />
          <Route path="/connections/social" element={<SocialConnectionsPage />} />
          <Route path="/connections/media" element={<MediaConnectionsPage />} />
          <Route path="/connections/developer" element={<DeveloperConnectionsPage />} />
          <Route path="/connections/productivity" element={<ProductivityConnectionsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/telegram/link" element={<TelegramLinkPage />} />
        </Route>

        {/* 404 catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ErrorBoundary>
          <AppInner />
        </ErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
