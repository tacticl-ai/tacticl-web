// src/theme/hud.ts
// Shared HUD design tokens — extracted from CommandCenter so the dashboard,
// pipeline detail, and artifact surfaces all read from one source of truth.

/** Brand violet — primary HUD accent everywhere. */
export const ACCENT = '#6C63FF';
/** Alias kept for legacy call sites that referenced VIOLET. */
export const VIOLET = '#6C63FF';
/** 'Thinking' shift — brighter violet → magenta (mirrors the orb). */
export const MAGENTA = '#B25CFF';
/** Secondary — sparing contrast highlight only (arbiter-link, "done"). */
export const CYAN = '#03DAC6';
/** Brighter cyan used for "done"/success nodes in the dashboard mockups. */
export const CYAN_BRIGHT = '#15E0C8';
/** Amber — "needs you" / checkpoint gates. */
export const AMBER = '#F5B544';
/** Red — failures. */
export const RED = '#FF6B6B';

/** Display font — headings, HUD labels. */
export const DISP = '"Chakra Petch", "Inter", sans-serif';
/** Monospace — body text, metrics, terminal-y surfaces. */
export const MONO = '"JetBrains Mono", ui-monospace, monospace';

/** The glass panel surface used by every HUD panel. Spread into an `sx`. */
export const hudGlass = {
  position: 'relative' as const,
  background: 'linear-gradient(180deg, rgba(20,26,30,0.72), rgba(12,16,20,0.72))',
  backdropFilter: 'blur(14px)',
  border: '1px solid rgba(108,99,255,0.18)',
  borderRadius: 2,
  boxShadow: 'inset 0 0 40px rgba(108,99,255,0.04), 0 8px 40px rgba(0,0,0,0.5)',
  overflow: 'hidden',
};

/** Ambient page background used by full-bleed HUD surfaces (dashboard). */
export const hudPageBackground =
  'radial-gradient(1200px 800px at 50% -8%, rgba(108,99,255,0.13), transparent 60%),' +
  'radial-gradient(900px 700px at 80% 110%, rgba(178,92,255,0.09), transparent 60%),' +
  'radial-gradient(700px 600px at 6% 18%, rgba(3,218,198,0.05), transparent 62%),' +
  '#080b0d';
