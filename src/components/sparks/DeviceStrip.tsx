// src/components/sparks/DeviceStrip.tsx
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import CloudIcon from '@mui/icons-material/Cloud';
import LaptopIcon from '@mui/icons-material/Laptop';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import TabletIcon from '@mui/icons-material/Tablet';
import WatchIcon from '@mui/icons-material/Watch';
import type { Device, Spark } from '../../api/types';

interface DeviceStripProps {
  devices: Device[];
  sparks: Spark[];
  activeDeviceId: string | null; // null = no filter, 'cloud' = no-device sparks
  onDeviceChange: (deviceId: string | null) => void;
}

const deviceIcons: Record<string, typeof LaptopIcon> = {
  COMPUTER: LaptopIcon,
  PHONE: PhoneIphoneIcon,
  TABLET: TabletIcon,
  WATCH: WatchIcon,
};

const stateColors: Record<string, string> = {
  ONLINE: '#34D399',
  BUSY: '#FBBF24',
  OFFLINE: '#44444F',
};

export default function DeviceStrip({ devices, sparks, activeDeviceId, onDeviceChange }: DeviceStripProps) {
  const activeSparks = sparks.filter((s) => s.status === 'EXECUTING' || s.status === 'ROUTING' || s.status === 'CHECKPOINT' || s.status === 'PENDING');

  const deviceEntries = devices.map((d) => ({
    id: d.id,
    name: d.name,
    icon: deviceIcons[d.deviceType] || LaptopIcon,
    stateColor: stateColors[d.state] || stateColors.OFFLINE,
    stateLabel: d.state.toLowerCase(),
    sparkCount: activeSparks.filter((s) => s.deviceId === d.id).length,
  }));

  const cloudSparkCount = activeSparks.filter((s) => !s.deviceId).length;

  const handleClick = (id: string) => {
    onDeviceChange(activeDeviceId === id ? null : id);
  };

  const cardSx = (id: string) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 1.25,
    px: 1.75,
    py: 1.25,
    bgcolor: activeDeviceId === id ? 'rgba(108,99,255,0.08)' : 'background.paper',
    border: '1px solid',
    borderColor: activeDeviceId === id ? 'rgba(108,99,255,0.3)' : 'divider',
    borderRadius: '10px',
    minWidth: 150,
    flexShrink: 0,
    transition: 'all 0.2s',
    '&:hover': { borderColor: 'rgba(255,255,255,0.12)', bgcolor: 'action.hover' },
  });

  return (
    <Box sx={{ display: 'flex', gap: 1.25, mb: 3, overflowX: 'auto', pb: 0.5 }}>
      {deviceEntries.map((d) => {
        const Icon = d.icon;
        return (
          <ButtonBase key={d.id} onClick={() => handleClick(d.id)} sx={cardSx(d.id)}>
            <Box sx={{ position: 'relative', width: 34, height: 34, borderRadius: '8px', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Box sx={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: '50%', bgcolor: d.stateColor, border: '2px solid', borderColor: 'background.paper' }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</Typography>
              <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                {d.sparkCount > 0 ? `${d.sparkCount} spark${d.sparkCount > 1 ? 's' : ''}` : ''}{d.sparkCount > 0 ? ' \u00B7 ' : ''}{d.stateLabel}
              </Typography>
            </Box>
          </ButtonBase>
        );
      })}

      {/* Cloud card */}
      <ButtonBase onClick={() => handleClick('cloud')} sx={cardSx('cloud')}>
        <Box sx={{ position: 'relative', width: 34, height: 34, borderRadius: '8px', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CloudIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Box sx={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: '50%', bgcolor: '#34D399', border: '2px solid', borderColor: 'background.paper' }} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 500 }}>Cloud</Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
            {cloudSparkCount > 0 ? `${cloudSparkCount} spark${cloudSparkCount > 1 ? 's' : ''}` : 'no sparks'}
          </Typography>
        </Box>
      </ButtonBase>
    </Box>
  );
}
