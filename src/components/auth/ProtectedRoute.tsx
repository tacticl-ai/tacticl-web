import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuthStore } from '../../stores/auth-store';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    const redirectUrl = encodeURIComponent(window.location.href);
    window.location.href = `https://auth.tacticl.ai/signin?redirect=${redirectUrl}`;
    return null;
  }

  return <>{children}</>;
}
