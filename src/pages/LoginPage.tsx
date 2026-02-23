import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth-store';
import { api } from '../api/client';
import TacticlLogo from '../components/TacticlLogo';

interface DevTokenResponse {
  token: string;
  userId: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleLogin = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.post<DevTokenResponse>('/api/auth/dev-token', {
        userId: email.trim(),
      });
      setAuth(res.token, res.userId);
      navigate('/', { replace: true });
    } catch {
      setError('Failed to authenticate. The backend may be starting up — try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLogin();
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <TacticlLogo size={72} />
        <Typography variant="h4" sx={{ mt: 2, fontWeight: 700, letterSpacing: -0.5 }}>
          Tacticl
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Your distributed AI agent platform
        </Typography>
      </Box>

      <Card sx={{ width: '100%', maxWidth: 400 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Sign in
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Email or User ID"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="you@example.com"
            fullWidth
            autoFocus
            disabled={loading}
            sx={{ mb: 2 }}
          />

          <Button
            variant="contained"
            fullWidth
            onClick={handleLogin}
            disabled={!email.trim() || loading}
            sx={{ height: 44 }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Continue'}
          </Button>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
            Dev mode — enter any identifier to get started
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
