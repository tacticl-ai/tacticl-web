import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import FolderIcon from '@mui/icons-material/Folder';
import GitHubIcon from '@mui/icons-material/GitHub';
import { formatDistanceToNow } from 'date-fns';
import TopBar from '../components/layout/TopBar';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import { useRepos, useRevokeRepo, useGrantRepo } from '../hooks/useRepos';
import type { RepoProvider, RepoAccessLevel } from '../api/types';

export default function RepoListPage() {
  const { data: repos, isLoading, isError, refetch } = useRepos();
  const revokeRepo = useRevokeRepo();
  const grantRepo = useGrantRepo();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [provider, setProvider] = useState<RepoProvider>('GITHUB');
  const [repoFullName, setRepoFullName] = useState('');
  const [accessLevel, setAccessLevel] = useState<RepoAccessLevel>('READ');

  const handleOpen = () => {
    setProvider('GITHUB');
    setRepoFullName('');
    setAccessLevel('READ');
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!repoFullName.trim()) return;
    grantRepo.mutate(
      { provider, repoFullName: repoFullName.trim(), accessLevel },
      { onSuccess: () => setDialogOpen(false) },
    );
  };

  const displayRepos = repos ?? [];

  return (
    <>
      <TopBar
        title="Repositories"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={handleOpen}>
            Connect Repo
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState message="Loading repositories..." />
      ) : isError ? (
        <ErrorState message="Failed to load repositories." onRetry={refetch} />
      ) : displayRepos.length === 0 ? (
        <EmptyState
          icon={FolderIcon}
          title="No repos connected"
          description="Connect a GitHub repository to grant Tacticl access for code analysis and PRs."
          actionLabel="Connect Repo"
          onAction={handleOpen}
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {displayRepos.map((repo) => (
            <Card key={repo.id}>
              <CardContent
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  py: 1.5,
                  '&:last-child': { pb: 1.5 },
                }}
              >
                <GitHubIcon sx={{ color: 'text.secondary' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2">
                    {repo.repoFullName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {repo.provider} &middot; Granted{' '}
                    {formatDistanceToNow(new Date(repo.grantedAt), {
                      addSuffix: true,
                    })}
                  </Typography>
                </Box>
                <Chip
                  label={repo.accessLevel}
                  size="small"
                  variant="outlined"
                  color={
                    repo.accessLevel === 'ADMIN'
                      ? 'error'
                      : repo.accessLevel === 'WRITE'
                        ? 'warning'
                        : 'default'
                  }
                />
                <IconButton
                  size="small"
                  title="Revoke access"
                  onClick={() => revokeRepo.mutate(repo.id)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Connect Repository</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            select
            label="Provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value as RepoProvider)}
            size="small"
            fullWidth
          >
            <MenuItem value="GITHUB">GitHub</MenuItem>
            <MenuItem value="GITLAB">GitLab</MenuItem>
            <MenuItem value="BITBUCKET">Bitbucket</MenuItem>
          </TextField>
          <TextField
            label="Repository"
            placeholder="owner/repo"
            value={repoFullName}
            onChange={(e) => setRepoFullName(e.target.value)}
            size="small"
            fullWidth
            autoFocus
          />
          <TextField
            select
            label="Access Level"
            value={accessLevel}
            onChange={(e) => setAccessLevel(e.target.value as RepoAccessLevel)}
            size="small"
            fullWidth
          >
            <MenuItem value="READ">Read</MenuItem>
            <MenuItem value="WRITE">Write</MenuItem>
            <MenuItem value="ADMIN">Admin</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!repoFullName.trim() || grantRepo.isPending}
          >
            {grantRepo.isPending ? 'Connecting...' : 'Connect'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
