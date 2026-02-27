import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import KeyIcon from '@mui/icons-material/Key';
import TopBar from '../components/layout/TopBar';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import { useTokens, useRemoveToken, useCreateToken } from '../hooks/useTokens';
import type { TokenProvider } from '../api/types';

export default function TokenListPage() {
  const { data: tokens, isLoading, isError, refetch } = useTokens();
  const removeToken = useRemoveToken();
  const createToken = useCreateToken();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [provider, setProvider] = useState<TokenProvider>('ANTHROPIC');
  const [label, setLabel] = useState('');
  const [token, setToken] = useState('');

  const handleOpen = () => {
    setProvider('ANTHROPIC');
    setLabel('');
    setToken('');
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!label.trim() || !token.trim()) return;
    createToken.mutate(
      { provider, label: label.trim(), token: token.trim() },
      { onSuccess: () => setDialogOpen(false) },
    );
  };

  const displayTokens = tokens ?? [];

  return (
    <>
      <TopBar
        title="Tokens"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={handleOpen}>
            Add Token
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState message="Loading tokens..." />
      ) : isError ? (
        <ErrorState message="Failed to load tokens." onRetry={refetch} />
      ) : displayTokens.length === 0 ? (
        <EmptyState
          icon={KeyIcon}
          title="No tokens configured"
          description="Add an API token so Tacticl agents can interact with external services."
          actionLabel="Add Token"
          onAction={handleOpen}
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {displayTokens.map((token) => {
            const dailyPct =
              token.usageLimits.dailyTokens > 0
                ? (token.currentUsage.todayTokens /
                    token.usageLimits.dailyTokens) *
                  100
                : 0;
            const monthPct =
              token.usageLimits.monthlyTokens > 0
                ? (token.currentUsage.monthTokens /
                    token.usageLimits.monthlyTokens) *
                  100
                : 0;

            return (
              <Card key={token.id}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      mb: 1.5,
                    }}
                  >
                    <KeyIcon sx={{ color: 'text.secondary' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2">
                        {token.label}
                      </Typography>
                    </Box>
                    <Chip
                      label={token.provider}
                      size="small"
                      variant="outlined"
                    />
                    <IconButton
                      size="small"
                      title="Remove token"
                      onClick={() => removeToken.mutate(token.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  {token.usageLimits.dailyTokens > 0 && (
                    <Box sx={{ mb: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 0.5,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Today
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(
                            token.currentUsage.todayTokens / 1000
                          ).toFixed(0)}
                          k /{' '}
                          {(
                            token.usageLimits.dailyTokens / 1000
                          ).toFixed(0)}
                          k tokens
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(dailyPct, 100)}
                        color={dailyPct > 80 ? 'warning' : 'primary'}
                      />
                    </Box>
                  )}
                  {token.usageLimits.monthlyTokens > 0 && (
                    <Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 0.5,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          This month
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(
                            token.currentUsage.monthTokens / 1000000
                          ).toFixed(1)}
                          M /{' '}
                          {(
                            token.usageLimits.monthlyTokens / 1000000
                          ).toFixed(0)}
                          M tokens
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(monthPct, 100)}
                        color={monthPct > 80 ? 'warning' : 'primary'}
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Token</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            select
            label="Provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value as TokenProvider)}
            size="small"
            fullWidth
          >
            <MenuItem value="ANTHROPIC">Anthropic</MenuItem>
            <MenuItem value="GITHUB">GitHub</MenuItem>
            <MenuItem value="OPENAI">OpenAI</MenuItem>
          </TextField>
          <TextField
            label="Label"
            placeholder="e.g. Production key"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            size="small"
            fullWidth
            autoFocus
          />
          <TextField
            label="Token"
            placeholder="sk-..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            size="small"
            fullWidth
            type="password"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!label.trim() || !token.trim() || createToken.isPending}
          >
            {createToken.isPending ? 'Adding...' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
