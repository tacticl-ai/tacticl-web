import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import TopBar from '../components/layout/TopBar';
import { settingsApi } from '../api/settings';
import type { UserConfig } from '../api/settings';

function DomainListEditor({
  label,
  domains,
  onChange,
}: {
  label: string;
  domains: string[];
  onChange: (domains: string[]) => void;
}) {
  const [input, setInput] = useState('');

  const add = () => {
    const trimmed = input.trim().toLowerCase();
    if (trimmed && !domains.includes(trimmed)) {
      onChange([...domains, trimmed]);
      setInput('');
    }
  };

  const remove = (domain: string) => onChange(domains.filter((d) => d !== domain));

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>{label}</Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        <TextField
          size="small"
          placeholder="e.g. example.com"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          sx={{ flex: 1 }}
        />
        <Button variant="outlined" size="small" onClick={add} disabled={!input.trim()}>
          Add
        </Button>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {domains.length === 0 && (
          <Typography variant="caption" color="text.disabled">None</Typography>
        )}
        {domains.map((d) => (
          <Chip key={d} label={d} size="small" onDelete={() => remove(d)} />
        ))}
      </Box>
    </Box>
  );
}

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data: saved, isLoading, isError } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get(),
    staleTime: 30_000,
    retry: false,
  });

  const [local, setLocal] = useState<UserConfig | null>(null);
  useEffect(() => { if (saved) setLocal(saved); }, [saved]);

  const update = useMutation({
    mutationFn: (cfg: Partial<UserConfig>) => settingsApi.update(cfg),
    onSuccess: (updated) => {
      qc.setQueryData(['settings'], updated);
      setLocal(updated);
    },
  });

  const dirty = local && saved && JSON.stringify(local) !== JSON.stringify(saved);

  if (isLoading) {
    return (
      <>
        <TopBar title="Settings" />
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  if (isError || !local) {
    return (
      <>
        <TopBar title="Settings" />
        <Box sx={{ maxWidth: 640, mx: 'auto', pt: 4 }}>
          <Alert severity="error">
            Settings could not be loaded. The settings endpoint may not be available yet.
          </Alert>
        </Box>
      </>
    );
  }

  return (
    <>
      <TopBar title="Settings" />

      <Box sx={{ maxWidth: 640, mx: 'auto' }}>
        {/* Agent Limits */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Agent Limits</Typography>

            <TextField
              label="Max Concurrent Sparks"
              type="number"
              size="small"
              fullWidth
              sx={{ mb: 2 }}
              value={local.maxConcurrentSparks}
              onChange={(e) =>
                setLocal({ ...local, maxConcurrentSparks: Math.max(1, parseInt(e.target.value) || 1) })
              }
              inputProps={{ min: 1, max: 20 }}
              helperText="How many sparks can run at the same time"
            />

            <TextField
              label="Monthly Spending Limit"
              type="number"
              size="small"
              fullWidth
              value={local.spendingLimit}
              onChange={(e) =>
                setLocal({ ...local, spendingLimit: Math.max(0, parseFloat(e.target.value) || 0) })
              }
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              inputProps={{ min: 0, step: 5 }}
              helperText="Set to 0 to block all spending"
            />
          </CardContent>
        </Card>

        {/* Domain Controls */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 0.5 }}>Domain Controls</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Control which websites the agent can access. Allowlist takes precedence.
            </Typography>

            <Box sx={{ mb: 2 }}>
              <DomainListEditor
                label="Allowlist (agent can always access)"
                domains={local.domainAllowlist}
                onChange={(d) => setLocal({ ...local, domainAllowlist: d })}
              />
            </Box>

            <DomainListEditor
              label="Blocklist (agent cannot access)"
              domains={local.domainBlocklist}
              onChange={(d) => setLocal({ ...local, domainBlocklist: d })}
            />
          </CardContent>
        </Card>

        {/* Account */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>Account</Typography>
            <Typography variant="body2" color="text.secondary">
              Account management is handled through the auth portal at auth.tacticl.ai.
            </Typography>
          </CardContent>
        </Card>

        {/* Save error */}
        {update.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>Failed to save settings. Please try again.</Alert>
        )}

        {/* Save bar */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          {dirty && (
            <Button
              variant="text"
              onClick={() => setLocal(saved!)}
              disabled={update.isPending}
            >
              Discard
            </Button>
          )}
          <Button
            variant="contained"
            disabled={!dirty || update.isPending}
            onClick={() => update.mutate(local!)}
            sx={{ bgcolor: '#6C63FF', '&:hover': { bgcolor: '#5A52D5' } }}
          >
            {update.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </Box>
      </Box>
    </>
  );
}
