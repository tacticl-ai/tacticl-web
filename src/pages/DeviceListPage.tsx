import Box from '@mui/material/Box';
import DevicesIcon from '@mui/icons-material/Devices';
import TopBar from '../components/layout/TopBar';
import DeviceCard from '../components/devices/DeviceCard';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import { useDevices } from '../hooks/useDevices';

export default function DeviceListPage() {
  const { data: devices, isLoading, isError, refetch } = useDevices();

  return (
    <>
      <TopBar title="Devices" />

      {isLoading ? (
        <LoadingState message="Loading devices..." />
      ) : isError ? (
        <ErrorState message="Failed to load devices." onRetry={refetch} />
      ) : (devices ?? []).length === 0 ? (
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
          {(devices ?? []).map((device) => (
            <DeviceCard key={device.id} device={device} />
          ))}
        </Box>
      )}
    </>
  );
}
