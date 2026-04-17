import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import PricingPage from './pages/PricingPage';
import ChatPage from './pages/ChatPage';
import SparkListPage from './pages/SparkListPage';
import PipelineListPage from './pages/PipelineListPage';
import SparkDetailPage from './pages/SparkDetailPage';
import DeviceListPage from './pages/DeviceListPage';
import DeviceDetailPage from './pages/DeviceDetailPage';
import RepoListPage from './pages/RepoListPage';
import TokenListPage from './pages/TokenListPage';
import TemplateListPage from './pages/TemplateListPage';
import ConnectionsOverviewPage from './pages/connections/ConnectionsOverviewPage';
import SocialConnectionsPage from './pages/connections/SocialConnectionsPage';
import MediaConnectionsPage from './pages/connections/MediaConnectionsPage';
import DeveloperConnectionsPage from './pages/connections/DeveloperConnectionsPage';
import ProductivityConnectionsPage from './pages/connections/ProductivityConnectionsPage';
import SettingsPage from './pages/SettingsPage';
import ErrorBoundary from './components/auth/ErrorBoundary';
import { useWebSocket } from './hooks/useWebSocket';
import { useAuthStore } from './stores/auth-store';

/** Show landing page for unauthenticated visitors, redirect to /chat for authenticated users */
function LandingOrDashboard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/chat" replace />;
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

        {/* Protected */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/chat" element={<ChatPage />} />
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
