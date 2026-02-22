import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import FolderIcon from '@mui/icons-material/Folder';
import GitHubIcon from '@mui/icons-material/GitHub';
import { formatDistanceToNow } from 'date-fns';
import TopBar from '../components/layout/TopBar';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import { useRepos, useRevokeRepo } from '../hooks/useRepos';

export default function RepoListPage() {
  const { data: repos, isLoading, isError, refetch } = useRepos();
  const revokeRepo = useRevokeRepo();

  const displayRepos = repos ?? [];

  return (
    <>
      <TopBar
        title="Repositories"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} size="small">
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
          onAction={() => {}}
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
    </>
  );
}
