import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import ComputerIcon from '@mui/icons-material/Computer';
import { formatDistanceToNow } from 'date-fns';
import TopBar from '../components/layout/TopBar';
import DeviceStatusIndicator from '../components/devices/DeviceStatusIndicator';
import LoadingState from '../components/common/LoadingState';
import { useDevice, useUpdateDevicePreferences } from '../hooks/useDevices';
import type { Device, SparkType } from '../api/types';

const SPARK_TYPES: SparkType[] = ['code', 'social', 'research', 'devops'];

// Mock for development
const MOCK_DEVICE: Device = {
  id: 'd1',
  userId: 'u1',
  name: 'MacBook Pro - Office',
  deviceType: 'COMPUTER',
  platform: 'MACOS',
  specs: { cpuCores: 10, ramGb: 32, diskFreeGb: 128 },
  state: 'ONLINE',
  lastSeenAt: new Date(Date.now() - 30000).toISOString(),
  capabilities: { git: true, docker: true, gcloud: true },
  clonedRepos: ['strategiz-core', 'strategiz-ui', 'tacticl-core'],
  activeDaemons: 2,
  daemonVersion: '0.1.0',
  sparkPreferences: { code: true, devops: true, research: true, social: false },
  createdAt: new Date(Date.now() - 2592000000).toISOString(),
  updatedAt: new Date(Date.now() - 30000).toISOString(),
};

export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: device, isLoading } = useDevice(id!);
  const updatePrefs = useUpdateDevicePreferences(id!);

  const d = device ?? MOCK_DEVICE;

  if (isLoading && !device) {
    return (
      <>
        <TopBar title="Device" />
        <LoadingState />
      </>
    );
  }

  const handleTogglePref = (type: SparkType) => {
    const newPrefs = {
      ...d.sparkPreferences,
      [type]: !d.sparkPreferences[type],
    };
    updatePrefs.mutate(newPrefs);
  };

  return (
    <>
      <TopBar title={d.name} />

      {/* Device Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <ComputerIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5">{d.name}</Typography>
                <DeviceStatusIndicator state={d.state} size={12} />
                <Chip label={d.state} size="small" />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {d.platform} &middot; {d.deviceType.toLowerCase()}
                {d.daemonVersion && ` &middot; v${d.daemonVersion}`}
              </Typography>
            </Box>
          </Box>

          {d.specs && (
            <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  CPU
                </Typography>
                <Typography variant="body2">{d.specs.cpuCores} cores</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  RAM
                </Typography>
                <Typography variant="body2">{d.specs.ramGb} GB</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Disk Free
                </Typography>
                <Typography variant="body2">{d.specs.diskFreeGb} GB</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Active Daemons
                </Typography>
                <Typography variant="body2">{d.activeDaemons}</Typography>
              </Box>
            </Box>
          )}

          <Typography variant="caption" color="text.secondary">
            Registered{' '}
            {formatDistanceToNow(new Date(d.createdAt), { addSuffix: true })}
            {' &middot; '}
            Last seen{' '}
            {formatDistanceToNow(new Date(d.lastSeenAt), { addSuffix: true })}
          </Typography>
        </CardContent>
      </Card>

      {/* Spark Preferences */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Spark Preferences
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose which types of sparks this device should handle.
          </Typography>
          {SPARK_TYPES.map((type) => (
            <FormControlLabel
              key={type}
              control={
                <Switch
                  checked={!!d.sparkPreferences[type]}
                  onChange={() => handleTogglePref(type)}
                />
              }
              label={type.charAt(0).toUpperCase() + type.slice(1)}
              sx={{ display: 'block', mb: 0.5 }}
            />
          ))}
        </CardContent>
      </Card>

      {/* Cloned Repos */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Cloned Repositories
          </Typography>
          {d.clonedRepos.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No repos cloned on this device.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {d.clonedRepos.map((repo) => (
                <Chip key={repo} label={repo} variant="outlined" />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Capabilities */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Capabilities
          </Typography>
          {Object.keys(d.capabilities).length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No capabilities reported.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {Object.entries(d.capabilities).map(([key, val]) => (
                <Chip
                  key={key}
                  label={key}
                  color={val ? 'success' : 'default'}
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </>
  );
}
