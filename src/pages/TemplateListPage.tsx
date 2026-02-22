import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/layout/TopBar';
import EmptyState from '../components/common/EmptyState';
import type { SparkTemplate } from '../api/types';

const MOCK_TEMPLATES: SparkTemplate[] = [
  {
    id: 'tmpl1',
    userId: 'u1',
    name: 'Weekly Cost Audit',
    description:
      'Analyze Cloud Run, ClickHouse, and Firebase costs. Suggest optimizations.',
    defaultRepos: ['strategiz-core'],
    defaultSchedule: '0 9 * * 1',
    defaultCheckpointPolicy: 'CHECKPOINT_MAJOR',
    tags: ['cost', 'infra', 'weekly'],
    createdAt: new Date(Date.now() - 604800000).toISOString(),
  },
  {
    id: 'tmpl2',
    userId: 'u1',
    name: 'Dead Code Cleanup',
    description:
      'Find unused exports, components, and utilities. Remove them and verify build.',
    defaultRepos: ['strategiz-ui'],
    defaultSchedule: null,
    defaultCheckpointPolicy: 'CHECKPOINT_ALL',
    tags: ['code', 'cleanup'],
    createdAt: new Date(Date.now() - 1209600000).toISOString(),
  },
  {
    id: 'tmpl3',
    userId: 'u1',
    name: 'Dependency Security Scan',
    description:
      'Run npm audit and mvn dependency-check. Create issues for critical vulnerabilities.',
    defaultRepos: ['strategiz-core', 'strategiz-ui', 'tacticl-core'],
    defaultSchedule: '0 8 * * *',
    defaultCheckpointPolicy: 'CHECKPOINT_MAJOR',
    tags: ['security', 'deps', 'daily'],
    createdAt: new Date(Date.now() - 2592000000).toISOString(),
  },
];

export default function TemplateListPage() {
  const [templates] = useState<SparkTemplate[]>(MOCK_TEMPLATES);
  const navigate = useNavigate();

  return (
    <>
      <TopBar
        title="Templates"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} size="small">
            New Template
          </Button>
        }
      />

      {templates.length === 0 ? (
        <EmptyState
          icon={BookmarkIcon}
          title="No templates yet"
          description="Save common spark configurations as templates for quick reuse."
          actionLabel="Create Template"
          onAction={() => {}}
        />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            },
            gap: 2,
          }}
        >
          {templates.map((tmpl) => (
            <Card key={tmpl.id}>
              <CardActionArea
                onClick={() =>
                  navigate(
                    `/sparks/new?templateId=${tmpl.id}`,
                  )
                }
              >
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {tmpl.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {tmpl.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {tmpl.tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    ))}
                    {tmpl.defaultSchedule && (
                      <Chip
                        label="scheduled"
                        size="small"
                        color="info"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}
    </>
  );
}
