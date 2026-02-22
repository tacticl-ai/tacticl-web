import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Autocomplete from '@mui/material/Autocomplete';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import TopBar from '../components/layout/TopBar';
import { useCreateSpark } from '../hooks/useSparks';
import type { SparkPriority, CheckpointPolicy } from '../api/types';

export default function SparkCreatePage() {
  const navigate = useNavigate();
  const createSpark = useCreateSpark();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<SparkPriority>('NORMAL');
  const [checkpointPolicy, setCheckpointPolicy] =
    useState<CheckpointPolicy>('CHECKPOINT_MAJOR');
  const [repoAccess, setRepoAccess] = useState<string[]>([]);
  const [isScheduled, setIsScheduled] = useState(false);
  const [schedule, setSchedule] = useState('');

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) return;
    createSpark.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        priority,
        checkpointPolicy,
        repoAccess: repoAccess.length > 0 ? repoAccess : undefined,
        schedule: isScheduled && schedule ? schedule : undefined,
      },
      { onSuccess: (spark) => navigate(`/sparks/${spark.id}`) },
    );
  };

  // Placeholder repo list — will come from repo grants API
  const availableRepos = [
    'strategiz-core',
    'strategiz-ui',
    'tacticl-core',
    'tacticl-web',
    'tacticl-mobile',
    'tacticl-desktop',
  ];

  return (
    <>
      <TopBar title="Create Spark" />

      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              What do you want done?
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
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
                placeholder="Describe what you want done in natural language. Be as specific or as vague as you like."
                multiline
                rows={5}
                fullWidth
              />

              <Autocomplete
                multiple
                options={availableRepos}
                value={repoAccess}
                onChange={(_, v) => setRepoAccess(v)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip
                        key={key}
                        label={option}
                        size="small"
                        {...tagProps}
                      />
                    );
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Repo Access"
                    placeholder="Select repos this spark can access"
                  />
                )}
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={priority}
                    label="Priority"
                    onChange={(e) =>
                      setPriority(e.target.value as SparkPriority)
                    }
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
                      setCheckpointPolicy(
                        e.target.value as CheckpointPolicy,
                      )
                    }
                  >
                    <MenuItem value="AUTO">Auto (no pauses)</MenuItem>
                    <MenuItem value="CHECKPOINT_MAJOR">
                      Major actions only
                    </MenuItem>
                    <MenuItem value="CHECKPOINT_ALL">
                      All decisions
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isScheduled}
                      onChange={(e) => setIsScheduled(e.target.checked)}
                    />
                  }
                  label="Recurring schedule"
                />
                {isScheduled && (
                  <TextField
                    label="Cron Expression"
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    placeholder="0 9 * * 1 (every Monday at 9am)"
                    fullWidth
                    sx={{ mt: 1 }}
                    helperText="Standard cron format: minute hour day month weekday"
                  />
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={() => navigate('/sparks')}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={
              !title.trim() || !description.trim() || createSpark.isPending
            }
          >
            {createSpark.isPending ? 'Creating...' : 'Create Spark'}
          </Button>
        </Box>
      </Box>
    </>
  );
}
