import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../hooks/useAuth';
import { SIDEBAR_WIDTH } from './Sidebar';

interface TopBarProps {
  title: string;
  actions?: React.ReactNode;
}

export default function TopBar({ title, actions }: TopBarProps) {
  const { logout } = useAuth();

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
        ml: `${SIDEBAR_WIDTH}px`,
        bgcolor: 'background.default',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar>
        <Typography variant="h6" sx={{ flex: 1, fontWeight: 600 }}>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {actions}
          <IconButton onClick={logout} size="small" title="Logout">
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
