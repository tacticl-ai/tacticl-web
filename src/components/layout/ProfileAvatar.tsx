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

  if (loading) {
    return <CircularProgress size={32} sx={{ color: 'text.secondary' }} />;
  }

  if (!profile) {
    return (
      <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.400' }} />
    );
  }

  const initial = profile.displayName.charAt(0).toUpperCase();

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small" sx={{ p: 0 }}>
        {profile.avatarUrl ? (
          <Avatar src={profile.avatarUrl} sx={{ width: 32, height: 32 }} />
        ) : (
          <Avatar
            sx={{
              width: 32,
              height: 32,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {initial}
          </Avatar>
        )}
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{ sx: { minWidth: 200, mt: 1 } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            {profile.displayName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {profile.email}
          </Typography>
        </Box>
        <Divider />
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
