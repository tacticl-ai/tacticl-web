import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import TopBar from '../components/layout/TopBar';
import DeviceCard from '../components/devices/DeviceCard';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import AddDeviceDialog from '../components/devices/AddDeviceDialog';
import { useDevices } from '../hooks/useDevices';

export default function DeviceListPage() {
  const { data: devices, isLoading, isError, refetch } = useDevices();
  const [showAddDialog, setShowAddDialog] = useState(false);

  return (
    <>
      <TopBar
        title="Devices"
        actions={
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setShowAddDialog(true)}
          >
            Add Device
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState message="Loading devices..." />
      ) : isError ? (
        <ErrorState message="Failed to load devices." onRetry={refetch} />
      ) : (devices ?? []).length === 0 ? (
        <EmptyState
          variant="devices"
          title="No devices registered"
          description="Pair your first device to start running sparks locally."
          actionLabel="Add Device"
          onAction={() => setShowAddDialog(true)}
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

      <AddDeviceDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
      />
    </>
  );
}
