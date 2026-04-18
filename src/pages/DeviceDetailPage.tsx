import { useParams, Navigate } from 'react-router-dom';
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
import ErrorState from '../components/common/ErrorState';
import { useDevice, useUpdateDevicePreferences } from '../hooks/useDevices';
import type { SparkType } from '../api/types';

const SPARK_TYPES: SparkType[] = ['code', 'social', 'research', 'devops'];

export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const deviceId = id ?? '';
  const { data: device, isLoading, isError, refetch } = useDevice(deviceId);
  const updatePrefs = useUpdateDevicePreferences(deviceId);

  if (!id) {
    return <Navigate to="/devices" replace />;
  }

  if (isLoading) {
    return (
      <>
        <TopBar title="Device" />
        <LoadingState />
      </>
    );
  }

  if (isError || !device) {
    return (
      <>
        <TopBar title="Device" />
        <ErrorState message="Failed to load device details." onRetry={refetch} />
      </>
    );
  }

  const handleTogglePref = (type: SparkType) => {
    const newPrefs = {
      ...device.sparkPreferences,
      [type]: !device.sparkPreferences[type],
    };
    updatePrefs.mutate(newPrefs);
  };

  return (
    <>
      <TopBar title={device.name} />

      {/* Device Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <ComputerIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5">{device.name}</Typography>
                <DeviceStatusIndicator state={device.state} size={12} />
                <Chip label={device.state} size="small" />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {device.platform} · {device.deviceType.toLowerCase()}
                {device.daemonVersion && ` · v${device.daemonVersion}`}
              </Typography>
            </Box>
          </Box>

          {device.specs && (
            <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  CPU
                </Typography>
                <Typography variant="body2">{device.specs.cpuCores} cores</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  RAM
                </Typography>
                <Typography variant="body2">{device.specs.ramGb} GB</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Disk Free
                </Typography>
                <Typography variant="body2">{device.specs.diskFreeGb} GB</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Active Daemons
                </Typography>
                <Typography variant="body2">{device.activeDaemons}</Typography>
              </Box>
            </Box>
          )}

          <Typography variant="caption" color="text.secondary">
            Registered{' '}
            {formatDistanceToNow(new Date(device.createdAt), { addSuffix: true })}
            {' &middot; '}
            Last seen{' '}
            {formatDistanceToNow(new Date(device.lastSeenAt), { addSuffix: true })}
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
                  checked={!!device.sparkPreferences[type]}
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
          {device.clonedRepos.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No repos cloned on this device.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {device.clonedRepos.map((repo) => (
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
          {Object.keys(device.capabilities).length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No capabilities reported.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {Object.entries(device.capabilities).map(([key, val]) => (
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
