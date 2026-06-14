// src/components/hud/HudPanel.tsx
// Reusable glassy HUD panel with corner brackets and an optional titled header.
// Extracted from CommandCenter so the dashboard + artifact surfaces share it.
import { Box, Stack, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { ACCENT, DISP, MONO, hudGlass } from '../../theme/hud';

export interface HudPanelProps {
  /** Optional HUD header title. Omit for a bare bracketed glass surface. */
  title?: string;
  /** Small right-aligned tag in the header (e.g. "LIVE", "PDLC-RUN"). */
  tag?: string;
  children: React.ReactNode;
  /** Extra styles merged into the panel surface. */
  sx?: SxProps<Theme>;
  /** Styles applied to the inner scroll/content box. */
  contentSx?: SxProps<Theme>;
  /** Which screen edge a collapse chevron points toward. */
  side?: 'left' | 'right';
  /** When provided, renders a collapse control in the header. */
  onCollapse?: () => void;
}

/** Four corner brackets that frame the panel like a targeting reticle. */
function CornerBrackets() {
  return (
    <>
      {[
        { top: 6, left: 6, b: 'borderTop borderLeft' },
        { top: 6, right: 6, b: 'borderTop borderRight' },
        { bottom: 6, left: 6, b: 'borderBottom borderLeft' },
        { bottom: 6, right: 6, b: 'borderBottom borderRight' },
      ].map((c, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: 14,
            height: 14,
            borderColor: 'rgba(108,99,255,0.55)',
            borderStyle: 'solid',
            borderWidth: 0,
            pointerEvents: 'none',
            zIndex: 2,
            ...(c.b.includes('borderTop') && { borderTopWidth: 1.5 }),
            ...(c.b.includes('borderBottom') && { borderBottomWidth: 1.5 }),
            ...(c.b.includes('borderLeft') && { borderLeftWidth: 1.5 }),
            ...(c.b.includes('borderRight') && { borderRightWidth: 1.5 }),
            top: c.top,
            bottom: c.bottom,
            left: c.left,
            right: c.right,
          }}
        />
      ))}
    </>
  );
}

/** Glassy HUD panel with corner brackets. Optionally renders a collapse control
 *  in the header — the chevron points "outward" (toward the screen edge) so the
 *  collapse direction reads at a glance. */
export default function HudPanel({
  title,
  tag,
  children,
  sx,
  contentSx,
  side,
  onCollapse,
}: HudPanelProps) {
  return (
    <Box
      sx={{
        ...hudGlass,
        display: 'flex',
        flexDirection: 'column',
        ...sx,
      }}
    >
      <CornerBrackets />
      {(title || tag || onCollapse) && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          sx={{ px: 2, py: 1.1, borderBottom: '1px solid rgba(108,99,255,0.12)' }}
        >
          <Typography
            sx={{ fontFamily: DISP, fontSize: 12, letterSpacing: 3, color: ACCENT, fontWeight: 600, flex: 1, minWidth: 0 }}
          >
            {title}
          </Typography>
          {tag && (
            <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: 1, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
              {tag}
            </Typography>
          )}
          {onCollapse && (
            <Box
              role="button"
              tabIndex={0}
              aria-label={`Collapse ${title ?? ''} panel`}
              aria-expanded={true}
              onClick={onCollapse}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onCollapse();
                }
              }}
              sx={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                userSelect: 'none',
                width: 24,
                height: 24,
                borderRadius: 1,
                border: '1px solid rgba(108,99,255,0.32)',
                color: 'rgba(108,99,255,0.85)',
                background: 'rgba(108,99,255,0.05)',
                transition: 'all .15s',
                '&:hover': { background: 'rgba(108,99,255,0.16)', color: ACCENT, borderColor: ACCENT },
                outline: 'none',
                '&:focus-visible': { boxShadow: `0 0 0 2px ${ACCENT}` },
              }}
            >
              {side === 'right' ? <ChevronRightIcon sx={{ fontSize: 18 }} /> : <ChevronLeftIcon sx={{ fontSize: 18 }} />}
            </Box>
          )}
        </Stack>
      )}
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 2, ...contentSx }}>{children}</Box>
    </Box>
  );
}
