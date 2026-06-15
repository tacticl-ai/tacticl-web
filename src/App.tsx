import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import PricingPage from './pages/PricingPage';
import DashboardPage from './pages/DashboardPage';
import SparkDetailPage from './pages/SparkDetailPage';
import LinksPage from './pages/LinksPage';
import SettingsHubPage from './pages/SettingsHubPage';
import TelegramLinkPage from './pages/TelegramLinkPage';
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

        {/* ── The four consolidated full-bleed HUD surfaces (no AppLayout chrome) ── */}
        <Route path="/command" element={<ProtectedRoute><CommandCenter /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/links" element={<ProtectedRoute><LinksPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsHubPage /></ProtectedRoute>} />

        {/* Pipeline detail drill-in (from Dashboard rows) + telegram link — standalone, auth-gated. */}
        <Route path="/sparks/:id" element={<ProtectedRoute><SparkDetailPage /></ProtectedRoute>} />
        <Route path="/telegram/link" element={<ProtectedRoute><TelegramLinkPage /></ProtectedRoute>} />

        {/* Retired legacy routes → redirect into the consolidated surfaces. */}
        <Route path="/chat" element={<Navigate to="/command" replace />} />
        <Route path="/sparks" element={<Navigate to="/dashboard" replace />} />
        <Route path="/pipelines" element={<Navigate to="/dashboard" replace />} />
        <Route path="/connections/*" element={<Navigate to="/links" replace />} />
        <Route path="/connections" element={<Navigate to="/links" replace />} />
        <Route path="/devices/*" element={<Navigate to="/settings" replace />} />
        <Route path="/devices" element={<Navigate to="/settings" replace />} />
        <Route path="/repos" element={<Navigate to="/settings" replace />} />
        <Route path="/tokens" element={<Navigate to="/settings" replace />} />
        <Route path="/templates" element={<Navigate to="/settings" replace />} />

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
