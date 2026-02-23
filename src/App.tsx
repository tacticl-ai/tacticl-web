import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import SparkListPage from './pages/SparkListPage';
import SparkDetailPage from './pages/SparkDetailPage';
import DeviceListPage from './pages/DeviceListPage';
import DeviceDetailPage from './pages/DeviceDetailPage';
import RepoListPage from './pages/RepoListPage';
import TokenListPage from './pages/TokenListPage';
import TemplateListPage from './pages/TemplateListPage';
import SocialPage from './pages/SocialPage';
import SettingsPage from './pages/SettingsPage';
import { useWebSocket } from './hooks/useWebSocket';
import { useAuthStore } from './stores/auth-store';

/** Show landing page for unauthenticated visitors, redirect to /chat for authenticated users */
function LandingOrDashboard() {
  const token = useAuthStore((s) => s.token);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) return null;
  if (token) return <Navigate to="/chat" replace />;
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
        <Route path="/login" element={<LoginPage />} />

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
          <Route path="/devices" element={<DeviceListPage />} />
          <Route path="/devices/:id" element={<DeviceDetailPage />} />
          <Route path="/repos" element={<RepoListPage />} />
          <Route path="/tokens" element={<TokenListPage />} />
          <Route path="/templates" element={<TemplateListPage />} />
          <Route path="/social" element={<SocialPage />} />
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
        <AppInner />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
