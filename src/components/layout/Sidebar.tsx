import { useLocation, useNavigate } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import ChatIcon from '@mui/icons-material/Chat';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DevicesIcon from '@mui/icons-material/Devices';
import FolderIcon from '@mui/icons-material/Folder';
import KeyIcon from '@mui/icons-material/Key';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ShareIcon from '@mui/icons-material/Share';
import SettingsIcon from '@mui/icons-material/Settings';
import TacticlLogo from '../TacticlLogo';

export const SIDEBAR_WIDTH = 240;

const navItems = [
  { label: 'Chat', path: '/chat', icon: ChatIcon },
  { label: 'Sparks', path: '/sparks', icon: AutoAwesomeIcon },
  { label: 'Devices', path: '/devices', icon: DevicesIcon },
  { label: 'Repos', path: '/repos', icon: FolderIcon },
  { label: 'Tokens', path: '/tokens', icon: KeyIcon },
  { label: 'Templates', path: '/templates', icon: BookmarkIcon },
];

const secondaryItems = [
  { label: 'Social', path: '/social', icon: ShareIcon },
  { label: 'Settings', path: '/settings', icon: SettingsIcon },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const renderItems = (items: typeof navItems) =>
    items.map((item) => {
      const isActive = 'exact' in item && item.exact
        ? location.pathname === item.path
        : location.pathname.startsWith(item.path);
      return (
        <ListItem key={item.path} disablePadding>
          <ListItemButton
            selected={isActive}
            onClick={() => navigate(item.path)}
            sx={{
              borderRadius: 1,
              mx: 1,
              '&.Mui-selected': {
                bgcolor: 'rgba(108, 99, 255, 0.12)',
                '&:hover': { bgcolor: 'rgba(108, 99, 255, 0.18)' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <item.icon
                sx={{
                  fontSize: 20,
                  color: isActive ? 'primary.main' : 'text.secondary',
                }}
              />
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'primary.main' : 'text.primary',
              }}
            />
          </ListItemButton>
        </ListItem>
      );
    });

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: SIDEBAR_WIDTH,
          boxSizing: 'border-box',
          bgcolor: 'background.default',
        },
      }}
    >
      <Toolbar>
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
          onClick={() => navigate('/chat')}
        >
          <TacticlLogo size={32} />
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: -0.5 }}>
            Tacticl
          </Typography>
        </Box>
      </Toolbar>
      <List sx={{ py: 0.5 }}>{renderItems(navItems)}</List>
      <Divider sx={{ my: 1 }} />
      <List sx={{ py: 0.5 }}>{renderItems(secondaryItems)}</List>
    </Drawer>
  );
}
