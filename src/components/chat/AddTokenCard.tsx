import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { useCreateToken } from '../../hooks/useTokens';
import type { AgentAction, TokenProvider } from '../../api/types';

interface AddTokenCardProps {
  action: AgentAction;
  onComplete: () => void;
}

const TOKEN_LABELS: Record<string, string> = {
  ANTHROPIC: 'Anthropic API Key',
  GITHUB: 'GitHub Token',
  OPENAI: 'OpenAI API Key',
};

export default function AddTokenCard({ action, onComplete }: AddTokenCardProps) {
  const [completed, setCompleted] = useState(false);
  const [provider, setProvider] = useState<TokenProvider>(action.tokenProvider ?? 'ANTHROPIC');
  const [label, setLabel] = useState(TOKEN_LABELS[action.tokenProvider ?? 'ANTHROPIC'] ?? '');
  const [token, setToken] = useState('');
  const createToken = useCreateToken();

  const handleSave = () => {
    if (!token.trim()) return;
    createToken.mutate(
      { provider, label: label.trim() || provider, token: token.trim() },
      {
        onSuccess: () => {
          setCompleted(true);
          onComplete();
        },
      },
    );
  };

  if (completed) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
        <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
        <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
          {TOKEN_LABELS[provider] ?? provider} saved!
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 1.5,
        mt: 1.5,
        borderRadius: 2,
        bgcolor: 'rgba(108,99,255,0.08)',
        border: '1px solid rgba(108,99,255,0.2)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <VpnKeyIcon sx={{ fontSize: 20, color: 'primary.light' }} />
        <Typography variant="body2" fontWeight={600}>
          Add API Token
        </Typography>
      </Box>
      {action.message && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          {action.message}
        </Typography>
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            select
            size="small"
            value={provider}
            onChange={(e) => {
              const p = e.target.value as TokenProvider;
              setProvider(p);
              setLabel(TOKEN_LABELS[p] ?? '');
            }}
            sx={{ minWidth: 120, '& .MuiInputBase-root': { fontSize: '0.8125rem' } }}
          >
            <MenuItem value="ANTHROPIC">Anthropic</MenuItem>
            <MenuItem value="GITHUB">GitHub</MenuItem>
            <MenuItem value="OPENAI">OpenAI</MenuItem>
          </TextField>
          <TextField
            size="small"
            placeholder="Label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            sx={{ flex: 1, '& .MuiInputBase-root': { fontSize: '0.8125rem' } }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            type="password"
            placeholder="Paste your API key..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            sx={{ flex: 1, '& .MuiInputBase-root': { fontSize: '0.8125rem' } }}
          />
          <Button
            size="small"
            variant="contained"
            onClick={handleSave}
            disabled={!token.trim() || createToken.isPending}
            startIcon={createToken.isPending ? <CircularProgress size={14} /> : undefined}
            sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.75rem' }}
          >
            Save
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
