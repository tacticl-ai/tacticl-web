import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import AddIcon from '@mui/icons-material/Add';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/layout/TopBar';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import { useTemplates, useCreateTemplate } from '../hooks/useTemplates';

export default function TemplateListPage() {
  const { data: templates, isLoading, isError, refetch } = useTemplates();
  const navigate = useNavigate();
  const createTemplate = useCreateTemplate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  const handleOpen = () => {
    setName('');
    setDescription('');
    setTags('');
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!name.trim() || !description.trim()) return;
    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    createTemplate.mutate(
      { name: name.trim(), description: description.trim(), tags: parsedTags.length ? parsedTags : undefined },
      { onSuccess: () => setDialogOpen(false) },
    );
  };

  const displayTemplates = templates ?? [];

  return (
    <>
      <TopBar
        title="Templates"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={handleOpen}>
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
          onAction={handleOpen}
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
                    `/?template=${tmpl.id}`,
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>New Template</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            label="Name"
            placeholder="e.g. Code Review"
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="small"
            fullWidth
            autoFocus
          />
          <TextField
            label="Description"
            placeholder="What does this template do?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            size="small"
            fullWidth
            multiline
            minRows={2}
          />
          <TextField
            label="Tags"
            placeholder="e.g. code, review, pr"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            size="small"
            fullWidth
            helperText="Comma-separated"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!name.trim() || !description.trim() || createTemplate.isPending}
          >
            {createTemplate.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
