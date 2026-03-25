import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SettingsIcon from '@mui/icons-material/Settings';

const DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { label: 'Pipelines', path: '/pipelines', icon: <ListAltIcon /> },
];

const bottomItems = [
  { label: 'Settings', path: '/settings', icon: <SettingsIcon /> },
];

interface SidebarProps {
  variant?: 'permanent' | 'temporary';
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ variant = 'permanent', open = true, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1,
            background: 'linear-gradient(135deg, #4ade80 0%, #2d7a4d 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.875rem',
            color: '#0d0d15',
          }}
        >
          T
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2, color: '#e0e0e0' }}>
            Tacticl
          </Typography>
          <Typography variant="caption" sx={{ color: '#666', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Console
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Main nav */}
      <List sx={{ flex: 1, px: 1, pt: 1 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={isActive(item.path)}
            onClick={() => {
              navigate(item.path);
              onClose?.();
            }}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: 'rgba(74, 222, 128, 0.08)',
                '&:hover': { backgroundColor: 'rgba(74, 222, 128, 0.12)' },
                '& .MuiListItemIcon-root': { color: '#4ade80' },
                '& .MuiListItemText-primary': { color: '#4ade80', fontWeight: 600 },
              },
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.04)' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: '#666' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.875rem' }} />
          </ListItemButton>
        ))}
      </List>

      {/* Bottom nav */}
      <Divider />
      <List sx={{ px: 1, pb: 1 }}>
        {bottomItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={isActive(item.path)}
            onClick={() => {
              navigate(item.path);
              onClose?.();
            }}
            sx={{
              borderRadius: 1,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.04)' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: '#666' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.875rem', color: '#999' }} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
