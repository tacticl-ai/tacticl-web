import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import ComputerIcon from '@mui/icons-material/Computer';
import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import PublicIcon from '@mui/icons-material/Public';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import DeviceStatusIndicator from './DeviceStatusIndicator';
import type { Device, DeviceType } from '../../api/types';

const deviceIcons: Record<DeviceType, typeof ComputerIcon> = {
  MACOS: LaptopMacIcon,
  WINDOWS: ComputerIcon,
  LINUX: ComputerIcon,
  IOS: PhoneIphoneIcon,
  ANDROID: PhoneAndroidIcon,
  WEB: PublicIcon,
};

interface DeviceCardProps {
  device: Device;
}

export default function DeviceCard({ device }: DeviceCardProps) {
  const navigate = useNavigate();
  const Icon = deviceIcons[device.deviceType] || ComputerIcon;

  const activePrefs = Object.entries(device.sparkPreferences)
    .filter(([, enabled]) => enabled)
    .map(([type]) => type);

  return (
    <Card>
      <CardActionArea onClick={() => navigate(`/devices/${device.id}`)}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <Icon sx={{ color: 'text.secondary', fontSize: 28 }} />
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {device.name}
                </Typography>
                <DeviceStatusIndicator state={device.state} />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {device.platform} &middot; {device.deviceType.toLowerCase()}
              </Typography>
            </Box>
          </Box>

          {device.specs && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {device.specs.cpuCores} cores &middot; {device.specs.ramGb}GB RAM
              &middot; {device.specs.diskFreeGb}GB free
            </Typography>
          )}

          {activePrefs.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
              {activePrefs.map((type) => (
                <Chip
                  key={type}
                  label={type}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              ))}
            </Box>
          )}

          {device.activeDaemons > 0 && (
            <Typography variant="body2" color="primary.main" sx={{ mb: 0.5 }}>
              {device.activeDaemons} active daemon
              {device.activeDaemons > 1 ? 's' : ''}
            </Typography>
          )}

          <Typography variant="caption" color="text.secondary">
            Last seen{' '}
            {formatDistanceToNow(new Date(device.lastSeenAt), {
              addSuffix: true,
            })}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
