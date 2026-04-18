import { useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';

export default function ProfileAvatar() {
  const { logout } = useAuth();
  const { profile, loading } = useProfile();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const initial = profile
    ? (profile.displayName || profile.email || '?').charAt(0).toUpperCase()
    : '?';

  const avatarContent = loading ? (
    <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.700' }}>
      <CircularProgress size={18} sx={{ color: 'grey.400' }} />
    </Avatar>
  ) : profile?.avatarUrl ? (
    <Avatar src={profile.avatarUrl} alt={profile.displayName} sx={{ width: 32, height: 32 }} />
  ) : (
    <Avatar
      sx={(theme) => ({
        width: 32,
        height: 32,
        background: profile
          ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`
          : theme.palette.grey[600],
        fontSize: 14,
        fontWeight: 700,
      })}
    >
      {initial}
    </Avatar>
  );

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small" sx={{ p: 0 }}>
        {avatarContent}
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{ sx: { minWidth: 200, mt: 1 } }}
      >
        {profile && (
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              {profile.displayName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {profile.email}
            </Typography>
          </Box>
        )}
        {profile && <Divider />}
        <MenuItem
          onClick={() => { setAnchorEl(null); logout(); }}
          sx={{ color: 'error.main', py: 1.5 }}
        >
          Sign out
        </MenuItem>
      </Menu>
    </>
  );
}
