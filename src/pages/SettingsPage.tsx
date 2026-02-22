import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import TopBar from '../components/layout/TopBar';
import type { CheckpointPolicy } from '../api/types';

export default function SettingsPage() {
  const [defaultCheckpointPolicy, setDefaultCheckpointPolicy] =
    useState<CheckpointPolicy>('CHECKPOINT_MAJOR');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [checkpointNotifications, setCheckpointNotifications] = useState(true);
  const [completionNotifications, setCompletionNotifications] = useState(true);
  const [failureNotifications, setFailureNotifications] = useState(true);

  return (
    <>
      <TopBar title="Settings" />

      <Box sx={{ maxWidth: 640, mx: 'auto' }}>
        {/* Checkpoint Defaults */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Default Checkpoint Policy
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              New sparks will use this checkpoint policy unless overridden.
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Default Policy</InputLabel>
              <Select
                value={defaultCheckpointPolicy}
                label="Default Policy"
                onChange={(e) =>
                  setDefaultCheckpointPolicy(
                    e.target.value as CheckpointPolicy,
                  )
                }
              >
                <MenuItem value="AUTO">
                  Auto — fully autonomous, no pauses
                </MenuItem>
                <MenuItem value="CHECKPOINT_MAJOR">
                  Major actions — pause before PRs, pushes, deletes
                </MenuItem>
                <MenuItem value="CHECKPOINT_ALL">
                  All decisions — pause at every decision point
                </MenuItem>
              </Select>
            </FormControl>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Notifications
            </Typography>

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Channels
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                />
              }
              label="Email notifications"
              sx={{ display: 'block', mb: 0.5 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={pushNotifications}
                  onChange={(e) => setPushNotifications(e.target.checked)}
                />
              }
              label="Push notifications (mobile)"
              sx={{ display: 'block' }}
            />

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Events
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={checkpointNotifications}
                  onChange={(e) =>
                    setCheckpointNotifications(e.target.checked)
                  }
                />
              }
              label="Checkpoint requires approval"
              sx={{ display: 'block', mb: 0.5 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={completionNotifications}
                  onChange={(e) =>
                    setCompletionNotifications(e.target.checked)
                  }
                />
              }
              label="Spark completed"
              sx={{ display: 'block', mb: 0.5 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={failureNotifications}
                  onChange={(e) =>
                    setFailureNotifications(e.target.checked)
                  }
                />
              }
              label="Spark failed"
              sx={{ display: 'block' }}
            />
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Account management is handled through the auth portal at auth.tacticl.ai.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </>
  );
}
