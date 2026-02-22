import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import type {
  CreateSparkRequest,
  SparkPriority,
  CheckpointPolicy,
} from '../../api/types';

interface CreateSparkDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSparkRequest) => void;
  loading?: boolean;
}

export default function CreateSparkDialog({
  open,
  onClose,
  onSubmit,
  loading,
}: CreateSparkDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<SparkPriority>('NORMAL');
  const [checkpointPolicy, setCheckpointPolicy] =
    useState<CheckpointPolicy>('CHECKPOINT_MAJOR');

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      priority,
      checkpointPolicy,
    });
    setTitle('');
    setDescription('');
    setPriority('NORMAL');
    setCheckpointPolicy('CHECKPOINT_MAJOR');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>New Spark</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Reduce Cloud Run costs"
            fullWidth
            autoFocus
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you want done..."
            multiline
            rows={4}
            fullWidth
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={priority}
                label="Priority"
                onChange={(e) => setPriority(e.target.value as SparkPriority)}
              >
                <MenuItem value="LOW">Low</MenuItem>
                <MenuItem value="NORMAL">Normal</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="URGENT">Urgent</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Checkpoint Policy</InputLabel>
              <Select
                value={checkpointPolicy}
                label="Checkpoint Policy"
                onChange={(e) =>
                  setCheckpointPolicy(e.target.value as CheckpointPolicy)
                }
              >
                <MenuItem value="AUTO">Auto (no pauses)</MenuItem>
                <MenuItem value="CHECKPOINT_MAJOR">
                  Major actions only
                </MenuItem>
                <MenuItem value="CHECKPOINT_ALL">All decisions</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!title.trim() || !description.trim() || loading}
        >
          {loading ? 'Creating...' : 'Create Spark'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
