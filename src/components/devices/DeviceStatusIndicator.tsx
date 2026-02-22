import Box from '@mui/material/Box';
import type { DeviceState } from '../../api/types';

const stateColors: Record<DeviceState, string> = {
  ONLINE: '#4CAF50',
  OFFLINE: '#757575',
  BUSY: '#FF9800',
};

interface DeviceStatusIndicatorProps {
  state: DeviceState;
  size?: number;
}

export default function DeviceStatusIndicator({
  state,
  size = 10,
}: DeviceStatusIndicatorProps) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        bgcolor: stateColors[state],
        boxShadow:
          state === 'ONLINE'
            ? `0 0 6px ${stateColors[state]}`
            : 'none',
        flexShrink: 0,
      }}
    />
  );
}
