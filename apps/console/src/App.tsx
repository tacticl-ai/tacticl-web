import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme/index.ts';
import ConsoleLayout from './components/layout/ConsoleLayout.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import PipelineListPage from './pages/PipelineListPage.tsx';
import PipelineDetailPage from './pages/PipelineDetailPage.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 15_000,
      refetchOnWindowFocus: false,
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
            <Route element={<ConsoleLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="pipelines" element={<PipelineListPage />} />
              <Route path="pipelines/:id" element={<PipelineDetailPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
