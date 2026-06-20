// src/components/hud/HudTopbar.tsx
// Shared HUD topbar used by every surface (Command, Dashboard, Settings).
// Renders: brand (TACTICL // <surface> with a pulsing beacon) · ProductSwitcher
// · nav chips (COMMAND primary/first with a glowing orb dot, then DASHBOARD,
// SETTINGS) · "ARBITER LINK ACTIVE" indicator · live clock.
//
// No Sign Out chip (that moves into Settings) and no "PRODUCT · TACTICL" string
// — the ProductSwitcher carries product identity now. Matches the command.html
// / settings.html mockups + the live CommandCenter HUD palette.
import { useEffect, useState } from 'react';
import { Box, Stack } from '@mui/material';
import { NavLink } from 'react-router-dom';
import ProductSwitcher from './ProductSwitcher';
import { ACCENT, MAGENTA, CYAN, DISP, MONO } from '../../theme/hud';

export type HudSurface = 'command' | 'dashboard' | 'settings';

interface NavChip {
  key: HudSurface;
  label: string;
  to: string;
  /** COMMAND is the primary, central-first hub chip with a glowing orb dot. */
  primary?: boolean;
}

// Order matters: COMMAND is first (central-first primary hub).
const NAV_CHIPS: NavChip[] = [
  { key: 'command', label: 'COMMAND', to: '/command', primary: true },
  { key: 'dashboard', label: 'DASHBOARD', to: '/dashboard' },
  { key: 'settings', label: 'SETTINGS', to: '/settings' },
];

const SURFACE_LABEL: Record<HudSurface, string> = {
  command: 'COMMAND',
  dashboard: 'DASHBOARD',
  settings: 'SETTINGS',
};

/** Live HH:MM:SS (24h) clock, ticking once per second. */
function useClock(): string {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now.toLocaleTimeString('en-US', { hour12: false });
}

const baseChipSx = {
  cursor: 'pointer',
  userSelect: 'none' as const,
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  px: 1.75,
  py: 0.625,
  borderRadius: 999,
  border: '1px solid rgba(108,99,255,0.32)',
  fontFamily: DISP,
  fontSize: 11.9,
  letterSpacing: 2,
  lineHeight: 1.6,
  color: 'rgba(108,99,255,0.85)',
  background: 'rgba(108,99,255,0.04)',
  transition: 'all .15s',
  whiteSpace: 'nowrap' as const,
  '&:hover': { background: 'rgba(108,99,255,0.14)', color: ACCENT, borderColor: ACCENT },
  outline: 'none',
  '&:focus-visible': { boxShadow: `0 0 0 2px ${ACCENT}` },
};

const primaryChipSx = {
  ...baseChipSx,
  gap: 1,
  px: 2.125,
  color: '#fff',
  borderColor: ACCENT,
  background: 'rgba(108,99,255,0.16)',
  boxShadow: '0 0 14px rgba(108,99,255,0.22), inset 0 0 16px rgba(108,99,255,0.08)',
  '&:hover': { color: '#fff', background: 'rgba(108,99,255,0.24)', borderColor: ACCENT },
};

const activeChipSx = {
  color: '#fff',
  borderColor: ACCENT,
  background: 'rgba(108,99,255,0.2)',
  boxShadow: '0 0 18px rgba(108,99,255,0.25)',
};

const activePrimaryChipSx = {
  color: '#fff',
  background: 'rgba(108,99,255,0.22)',
  boxShadow: '0 0 18px rgba(108,99,255,0.34), inset 0 0 18px rgba(108,99,255,0.12)',
};

/** The glowing orb dot that marks COMMAND as the primary hub. */
function ChipOrb() {
  return (
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        flex: 'none',
        background: `radial-gradient(circle at 35% 30%, #d8b6ff, ${ACCENT} 42%, ${MAGENTA} 70%, ${CYAN} 100%)`,
        boxShadow: '0 0 10px rgba(108,99,255,0.9), 0 0 16px rgba(178,92,255,0.5)',
      }}
    />
  );
}

interface HudTopbarProps {
  /** Which surface is currently active — highlights its nav chip + the brand label. */
  active?: HudSurface;
}

export default function HudTopbar({ active }: HudTopbarProps) {
  const clock = useClock();
  const surfaceLabel = active ? SURFACE_LABEL[active] : '';

  return (
    <Stack
      component="header"
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      flexWrap="wrap"
      useFlexGap
      sx={{
        gap: 2,
        px: 4,
        pt: 3,
        pb: 1,
        position: 'relative',
        zIndex: 10,
        '@keyframes hudHalo': {
          '0%': { transform: 'scale(0.5)', opacity: 0.9 },
          '100%': { transform: 'scale(2.1)', opacity: 0 },
        },
      }}
    >
      {/* brand: pulsing beacon + TACTICL // <surface> */}
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box
          sx={{
            position: 'relative',
            width: 10,
            height: 10,
            borderRadius: '50%',
            bgcolor: ACCENT,
            boxShadow: `0 0 12px ${ACCENT}`,
            flex: 'none',
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: '-6px',
              borderRadius: '50%',
              border: `1.5px solid ${ACCENT}`,
              animation: 'hudHalo 2.2s ease-out infinite',
            },
          }}
        />
        <Box
          component="span"
          sx={{
            fontFamily: DISP,
            fontSize: 18,
            letterSpacing: 6,
            fontWeight: 600,
            textTransform: 'uppercase',
            color: '#fff',
            whiteSpace: 'nowrap',
          }}
        >
          TACTICL
          {surfaceLabel && (
            <>
              {' '}
              <Box component="span" sx={{ color: ACCENT }}>//</Box>
              {' '}
              {surfaceLabel}
            </>
          )}
        </Box>
      </Stack>

      {/* product switcher */}
      <ProductSwitcher />

      {/* right cluster: arbiter link · clock · nav chips */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={2.5}
        flexWrap="wrap"
        useFlexGap
        justifyContent="flex-end"
        sx={{ flex: 1, minWidth: 0 }}
      >
        <Box
          component="span"
          sx={{
            fontFamily: MONO,
            fontSize: 11.5,
            color: CYAN,
            textShadow: `0 0 10px ${CYAN}55`,
            display: { xs: 'none', md: 'block' },
            whiteSpace: 'nowrap',
          }}
        >
          ◈ ARBITER LINK ACTIVE
        </Box>
        <Box
          component="span"
          sx={{
            fontFamily: MONO,
            fontSize: 11.5,
            color: 'rgba(255,255,255,0.45)',
            display: { xs: 'none', sm: 'block' },
            whiteSpace: 'nowrap',
          }}
        >
          {clock}
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          {NAV_CHIPS.map((chip) => {
            const isActive = active === chip.key;
            const sx = {
              ...(chip.primary ? primaryChipSx : baseChipSx),
              ...(isActive ? (chip.primary ? activePrimaryChipSx : activeChipSx) : {}),
            };
            return (
              <Box key={chip.key} component={NavLink} to={chip.to} sx={sx}>
                {chip.primary && <ChipOrb />}
                {chip.label}
              </Box>
            );
          })}
        </Stack>
      </Stack>
    </Stack>
  );
}
