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
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ChatIcon from '@mui/icons-material/Chat';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DevicesIcon from '@mui/icons-material/Devices';
import FolderIcon from '@mui/icons-material/Folder';
import KeyIcon from '@mui/icons-material/Key';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import CableIcon from '@mui/icons-material/Cable';
import SettingsIcon from '@mui/icons-material/Settings';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TacticlLogo from '../TacticlLogo';
import { useSidebar } from './SidebarContext';

export const SIDEBAR_WIDTH = 240;
export const SIDEBAR_COLLAPSED_WIDTH = 64;

const navItems = [
  { label: 'Chat', path: '/chat', icon: ChatIcon },
  { label: 'Sparks', path: '/sparks', icon: AutoAwesomeIcon },
  { label: 'Devices', path: '/devices', icon: DevicesIcon },
  { label: 'Repos', path: '/repos', icon: FolderIcon },
  { label: 'Tokens', path: '/tokens', icon: KeyIcon },
  { label: 'Templates', path: '/templates', icon: BookmarkIcon },
];

const secondaryItems = [
  { label: 'Connections', path: '/connections', icon: CableIcon },
  { label: 'Settings', path: '/settings', icon: SettingsIcon },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { collapsed, toggleCollapsed } = useSidebar();

  const currentWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  const renderItems = (items: typeof navItems) =>
    items.map((item) => {
      const isActive = 'exact' in item && item.exact
        ? location.pathname === item.path
        : location.pathname.startsWith(item.path);

      const button = (
        <ListItemButton
          selected={isActive}
          onClick={() => navigate(item.path)}
          sx={{
            borderRadius: 1,
            mx: 1,
            justifyContent: collapsed ? 'center' : 'flex-start',
            px: collapsed ? 1.5 : 2,
            '&.Mui-selected': {
              bgcolor: 'rgba(108, 99, 255, 0.12)',
              '&:hover': { bgcolor: 'rgba(108, 99, 255, 0.18)' },
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: collapsed ? 0 : 36,
              justifyContent: 'center',
            }}
          >
            <item.icon
              sx={{
                fontSize: 20,
                color: isActive ? 'primary.main' : 'text.secondary',
              }}
            />
          </ListItemIcon>
          {!collapsed && (
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'primary.main' : 'text.primary',
              }}
            />
          )}
        </ListItemButton>
      );

      return (
        <ListItem key={item.path} disablePadding>
          {collapsed ? (
            <Tooltip title={item.label} placement="right" arrow>
              {button}
            </Tooltip>
          ) : (
            button
          )}
        </ListItem>
      );
    });

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: currentWidth,
        flexShrink: 0,
        transition: 'width 200ms ease',
        '& .MuiDrawer-paper': {
          width: currentWidth,
          boxSizing: 'border-box',
          bgcolor: 'background.default',
          transition: 'width 200ms ease',
          overflowX: 'hidden',
        },
      }}
    >
      <Toolbar>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            cursor: 'pointer',
            overflow: 'hidden',
            width: '100%',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
          onClick={() => navigate('/chat')}
        >
          <TacticlLogo size={collapsed ? 28 : 32} />
          {!collapsed && (
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: -0.5, whiteSpace: 'nowrap' }}>
              Tacticl
            </Typography>
          )}
        </Box>
      </Toolbar>
      <List sx={{ py: 0.5 }}>{renderItems(navItems)}</List>
      <Divider sx={{ my: 1 }} />
      <List sx={{ py: 0.5 }}>{renderItems(secondaryItems)}</List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <Box sx={{ display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end', p: 1 }}>
        <IconButton onClick={toggleCollapsed} size="small" title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
        </IconButton>
      </Box>
    </Drawer>
  );
}
