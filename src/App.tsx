import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import AppLayout from './components/layout/AppLayout';
import SparkListPage from './pages/SparkListPage';
import SparkDetailPage from './pages/SparkDetailPage';
import SparkCreatePage from './pages/SparkCreatePage';
import DeviceListPage from './pages/DeviceListPage';
import DeviceDetailPage from './pages/DeviceDetailPage';
import RepoListPage from './pages/RepoListPage';
import TokenListPage from './pages/TokenListPage';
import TemplateListPage from './pages/TemplateListPage';
import SocialPage from './pages/SocialPage';
import SettingsPage from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/sparks" replace />} />
              <Route path="/sparks" element={<SparkListPage />} />
              <Route path="/sparks/new" element={<SparkCreatePage />} />
              <Route path="/sparks/:id" element={<SparkDetailPage />} />
              <Route path="/devices" element={<DeviceListPage />} />
              <Route path="/devices/:id" element={<DeviceDetailPage />} />
              <Route path="/repos" element={<RepoListPage />} />
              <Route path="/tokens" element={<TokenListPage />} />
              <Route path="/templates" element={<TemplateListPage />} />
              <Route path="/social" element={<SocialPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
