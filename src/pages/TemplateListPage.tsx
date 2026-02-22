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
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import { useTemplates } from '../hooks/useTemplates';

export default function TemplateListPage() {
  const { data: templates, isLoading, isError, refetch } = useTemplates();
  const navigate = useNavigate();

  const displayTemplates = templates ?? [];

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

      {isLoading ? (
        <LoadingState message="Loading templates..." />
      ) : isError ? (
        <ErrorState message="Failed to load templates." onRetry={refetch} />
      ) : displayTemplates.length === 0 ? (
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
          {displayTemplates.map((tmpl) => (
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
