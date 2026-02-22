import Box from '@mui/material/Box';
import DevicesIcon from '@mui/icons-material/Devices';
import TopBar from '../components/layout/TopBar';
import DeviceCard from '../components/devices/DeviceCard';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import { useDevices } from '../hooks/useDevices';
import type { Device } from '../api/types';

// Mock data for development
const MOCK_DEVICES: Device[] = [
  {
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
  },
  {
    id: 'd2',
    userId: 'u1',
    name: 'Linux Workstation',
    deviceType: 'COMPUTER',
    platform: 'LINUX',
    specs: { cpuCores: 16, ramGb: 64, diskFreeGb: 512 },
    state: 'OFFLINE',
    lastSeenAt: new Date(Date.now() - 86400000).toISOString(),
    capabilities: { git: true, docker: true },
    clonedRepos: ['strategiz-core'],
    activeDaemons: 0,
    daemonVersion: '0.1.0',
    sparkPreferences: { code: true, devops: true, research: false, social: false },
    createdAt: new Date(Date.now() - 5184000000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'd3',
    userId: 'u1',
    name: 'iPhone 16 Pro',
    deviceType: 'PHONE',
    platform: 'IOS',
    specs: null,
    state: 'ONLINE',
    lastSeenAt: new Date(Date.now() - 60000).toISOString(),
    capabilities: { notifications: true },
    clonedRepos: [],
    activeDaemons: 0,
    daemonVersion: null,
    sparkPreferences: { social: true },
    createdAt: new Date(Date.now() - 1209600000).toISOString(),
    updatedAt: new Date(Date.now() - 60000).toISOString(),
  },
];

export default function DeviceListPage() {
  const { data: devices, isLoading } = useDevices();
  const displayDevices = devices ?? MOCK_DEVICES;

  return (
    <>
      <TopBar title="Devices" />

      {isLoading && !devices ? (
        <LoadingState message="Loading devices..." />
      ) : displayDevices.length === 0 ? (
        <EmptyState
          icon={DevicesIcon}
          title="No devices registered"
          description="Register a device by installing the Tacticl desktop app or mobile app."
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
          {displayDevices.map((device) => (
            <DeviceCard key={device.id} device={device} />
          ))}
        </Box>
      )}
    </>
  );
}
