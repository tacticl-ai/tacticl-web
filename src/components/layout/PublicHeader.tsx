import { useCallback, useEffect, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import TacticlLogo from '../TacticlLogo';

const SIGN_IN_URL = 'https://auth.tacticl.ai/signin';
const SIGN_UP_URL = 'https://auth.tacticl.ai/signup';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
];

export default function PublicHeader() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 50);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: 1100,
          background: scrolled ? 'rgba(13, 13, 26, 0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          transition: 'background 0.3s ease',
        }}
      >
        <Toolbar
          sx={{
            maxWidth: 1200,
            width: '100%',
            mx: 'auto',
            height: 64,
            px: { xs: 2, md: 3 },
          }}
        >
          {/* Left: Logo + Name */}
          <Box
            component="a"
            href="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <TacticlLogo size={32} />
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, letterSpacing: -0.5, color: '#fff' }}
            >
              Tacticl
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Right: Desktop nav */}
          {isDesktop ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {NAV_LINKS.map((link) => (
                <Typography
                  key={link.href}
                  component="a"
                  href={link.href}
                  sx={{
                    color: 'rgba(255,255,255,0.7)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    '&:hover': { color: '#fff' },
                    transition: 'color 0.2s ease',
                  }}
                >
                  {link.label}
                </Typography>
              ))}
              <Button
                variant="outlined"
                href={SIGN_IN_URL}
                sx={{
                  color: '#fff',
                  borderColor: 'rgba(255,255,255,0.3)',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: '#fff',
                    bgcolor: 'rgba(255,255,255,0.05)',
                  },
                }}
              >
                Sign In
              </Button>
              <Button
                variant="contained"
                href={SIGN_UP_URL}
                sx={{
                  bgcolor: '#6C63FF',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { bgcolor: '#5a52e0' },
                }}
              >
                Sign Up
              </Button>
            </Box>
          ) : (
            /* Right: Mobile hamburger */
            <IconButton
              edge="end"
              color="inherit"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 260,
            bgcolor: '#0d0d1a',
            color: '#fff',
          },
        }}
      >
        <Box sx={{ pt: 2 }}>
          <List>
            {NAV_LINKS.map((link) => (
              <ListItemButton
                key={link.href}
                component="a"
                href={link.href}
                onClick={() => setDrawerOpen(false)}
              >
                <ListItemText
                  primary={link.label}
                  primaryTypographyProps={{
                    sx: { color: 'rgba(255,255,255,0.7)' },
                  }}
                />
              </ListItemButton>
            ))}
          </List>
          <Box sx={{ px: 2, pt: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Button
              variant="outlined"
              fullWidth
              href={SIGN_IN_URL}
              sx={{
                color: '#fff',
                borderColor: 'rgba(255,255,255,0.3)',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#fff',
                  bgcolor: 'rgba(255,255,255,0.05)',
                },
              }}
            >
              Sign In
            </Button>
            <Button
              variant="contained"
              fullWidth
              href={SIGN_UP_URL}
              sx={{
                bgcolor: '#6C63FF',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { bgcolor: '#5a52e0' },
              }}
            >
              Sign Up
            </Button>
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
