import { useState } from 'react';
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
import EmptyState from '../components/common/EmptyState';
import type { RepoGrant } from '../api/types';

const MOCK_REPOS: RepoGrant[] = [
  {
    id: 'r1',
    userId: 'u1',
    provider: 'GITHUB',
    repoFullName: 'user/strategiz-core',
    accessLevel: 'WRITE',
    grantedAt: new Date(Date.now() - 2592000000).toISOString(),
  },
  {
    id: 'r2',
    userId: 'u1',
    provider: 'GITHUB',
    repoFullName: 'user/strategiz-ui',
    accessLevel: 'WRITE',
    grantedAt: new Date(Date.now() - 2592000000).toISOString(),
  },
  {
    id: 'r3',
    userId: 'u1',
    provider: 'GITHUB',
    repoFullName: 'user/tacticl-core',
    accessLevel: 'ADMIN',
    grantedAt: new Date(Date.now() - 604800000).toISOString(),
  },
];

export default function RepoListPage() {
  const [repos] = useState<RepoGrant[]>(MOCK_REPOS);

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

      {repos.length === 0 ? (
        <EmptyState
          icon={FolderIcon}
          title="No repos connected"
          description="Connect a GitHub repository to grant Tacticl access for code analysis and PRs."
          actionLabel="Connect Repo"
          onAction={() => {}}
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {repos.map((repo) => (
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
                <IconButton size="small" title="Revoke access">
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
