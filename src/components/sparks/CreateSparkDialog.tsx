import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { useCreateSpark } from '../../hooks/useSparks';
import type { SparkPriority, CheckpointPolicy } from '../../api/types';

interface CreateSparkDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateSparkDialog({ open, onClose }: CreateSparkDialogProps) {
  const navigate = useNavigate();
  const { mutate: createSpark, isPending } = useCreateSpark();

  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<SparkPriority>('NORMAL');
  const [checkpointPolicy, setCheckpointPolicy] = useState<CheckpointPolicy>('CHECKPOINT_MAJOR');

  const handleSubmit = () => {
    if (!description.trim()) return;
    createSpark(
      {
        title: '',
        description: description.trim(),
        priority,
        checkpointPolicy,
      },
      {
        onSuccess: (spark) => {
          onClose();
          setDescription('');
          setPriority('NORMAL');
          setCheckpointPolicy('CHECKPOINT_MAJOR');
          navigate(`/sparks/${spark.id}`);
        },
      },
    );
  };

  const handleClose = () => {
    if (!isPending) {
      onClose();
      setDescription('');
      setPriority('NORMAL');
      setCheckpointPolicy('CHECKPOINT_MAJOR');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>New Spark</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            label="What do you want done?"
            multiline
            minRows={3}
            maxRows={8}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the task in natural language..."
            fullWidth
            autoFocus
          />

          <div>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Priority
            </Typography>
            <ToggleButtonGroup
              value={priority}
              exclusive
              onChange={(_, v) => v && setPriority(v)}
              size="small"
            >
              <ToggleButton value="LOW">Low</ToggleButton>
              <ToggleButton value="NORMAL">Normal</ToggleButton>
              <ToggleButton value="HIGH">High</ToggleButton>
            </ToggleButtonGroup>
          </div>

          <div>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Checkpoint Policy
            </Typography>
            <ToggleButtonGroup
              value={checkpointPolicy}
              exclusive
              onChange={(_, v) => v && setCheckpointPolicy(v)}
              size="small"
            >
              <ToggleButton value="AUTO">Auto</ToggleButton>
              <ToggleButton value="CHECKPOINT_MAJOR">Major Only</ToggleButton>
              <ToggleButton value="CHECKPOINT_ALL">All</ToggleButton>
            </ToggleButtonGroup>
          </div>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!description.trim() || isPending}
        >
          {isPending ? 'Creating...' : 'Create Spark'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
