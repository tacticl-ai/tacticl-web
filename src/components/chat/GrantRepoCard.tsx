import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FolderIcon from '@mui/icons-material/Folder';
import { useGrantRepo } from '../../hooks/useRepos';
import type { AgentAction, RepoProvider, RepoAccessLevel } from '../../api/types';

interface GrantRepoCardProps {
  action: AgentAction;
  onComplete: () => void;
}

export default function GrantRepoCard({ action, onComplete }: GrantRepoCardProps) {
  const [completed, setCompleted] = useState(false);
  const [provider, setProvider] = useState<RepoProvider>(action.provider ?? 'GITHUB');
  const [repoFullName, setRepoFullName] = useState(action.repoFullName ?? '');
  const [accessLevel, setAccessLevel] = useState<RepoAccessLevel>(action.accessLevel as RepoAccessLevel ?? 'READ');
  const grantRepo = useGrantRepo();

  const handleGrant = () => {
    if (!repoFullName.trim()) return;
    grantRepo.mutate(
      { provider, repoFullName: repoFullName.trim(), accessLevel },
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
          {repoFullName} access granted!
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
        <FolderIcon sx={{ fontSize: 20, color: 'primary.light' }} />
        <Typography variant="body2" fontWeight={600}>
          Grant Repository Access
        </Typography>
      </Box>
      {action.message && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          {action.message}
        </Typography>
      )}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <TextField
          select
          size="small"
          value={provider}
          onChange={(e) => setProvider(e.target.value as RepoProvider)}
          sx={{ minWidth: 100, '& .MuiInputBase-root': { fontSize: '0.8125rem' } }}
        >
          <MenuItem value="GITHUB">GitHub</MenuItem>
          <MenuItem value="GITLAB">GitLab</MenuItem>
          <MenuItem value="BITBUCKET">Bitbucket</MenuItem>
        </TextField>
        <TextField
          size="small"
          placeholder="owner/repo"
          value={repoFullName}
          onChange={(e) => setRepoFullName(e.target.value)}
          sx={{ flex: 1, minWidth: 140, '& .MuiInputBase-root': { fontSize: '0.8125rem' } }}
        />
        <TextField
          select
          size="small"
          value={accessLevel}
          onChange={(e) => setAccessLevel(e.target.value as RepoAccessLevel)}
          sx={{ minWidth: 90, '& .MuiInputBase-root': { fontSize: '0.8125rem' } }}
        >
          <MenuItem value="READ">Read</MenuItem>
          <MenuItem value="WRITE">Write</MenuItem>
          <MenuItem value="ADMIN">Admin</MenuItem>
        </TextField>
        <Button
          size="small"
          variant="contained"
          onClick={handleGrant}
          disabled={!repoFullName.trim() || grantRepo.isPending}
          startIcon={grantRepo.isPending ? <CircularProgress size={14} /> : undefined}
          sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.75rem' }}
        >
          Grant
        </Button>
      </Box>
    </Box>
  );
}
