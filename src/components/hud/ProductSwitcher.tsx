// src/components/hud/ProductSwitcher.tsx
// HUD-styled product switcher for the shared topbar. Shows the active product
// (gradient dot + name + ▾), and on click drops a menu listing every product
// plus a "+ New product" item that routes to /onboard. Wired to productStore
// (display-only scope). Matches the .prodsw mockup styling.
import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useProductStore } from '../../stores/productStore';
import { ACCENT, MAGENTA, CYAN, DISP, MONO } from '../../theme/hud';

const DOT_GRADIENT = `linear-gradient(135deg, ${ACCENT}, ${MAGENTA})`;

function Dot() {
  return (
    <Box
      sx={{
        width: 7,
        height: 7,
        borderRadius: '50%',
        flex: 'none',
        background: DOT_GRADIENT,
        boxShadow: '0 0 8px rgba(108,99,255,0.7)',
      }}
    />
  );
}

export default function ProductSwitcher() {
  const products = useProductStore((s) => s.products);
  const activeProductId = useProductStore((s) => s.activeProductId);
  const setActiveProduct = useProductStore((s) => s.setActiveProduct);

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const active = products.find((p) => p.id === activeProductId) ?? null;
  const label = active?.name ?? 'No product';

  // Close on outside click + Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const select = (id: string) => {
    setActiveProduct(id);
    setOpen(false);
  };

  return (
    <Box ref={rootRef} sx={{ position: 'relative' }}>
      <Box
        component="button"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Switch product"
        onClick={() => setOpen((v) => !v)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          cursor: 'pointer',
          background: 'rgba(108,99,255,0.06)',
          border: '1px solid rgba(108,99,255,0.22)',
          borderRadius: 1,
          px: 1.4,
          py: 0.75,
          color: '#E6E3F5',
          fontFamily: MONO,
          fontSize: 13.6,
          transition: 'border-color .15s',
          '&:hover': { borderColor: 'rgba(108,99,255,0.5)' },
          outline: 'none',
          '&:focus-visible': { boxShadow: `0 0 0 2px ${ACCENT}` },
        }}
      >
        <Dot />
        <Box component="span" sx={{ whiteSpace: 'nowrap' }}>{label}</Box>
        <Box component="span" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 11.3 }}>▾</Box>
      </Box>

      {open && (
        <Box
          role="menu"
          sx={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            minWidth: 208,
            zIndex: 60,
            background: 'rgba(14,16,26,0.97)',
            border: '1px solid rgba(108,99,255,0.28)',
            borderRadius: 1.25,
            p: 1,
            boxShadow: '0 18px 50px rgba(0,0,0,0.6)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <Box
            sx={{
              fontFamily: DISP,
              fontSize: 10.2,
              letterSpacing: 2,
              color: 'rgba(255,255,255,0.35)',
              px: 1,
              pt: 0.5,
              pb: 1,
            }}
          >
            PRODUCT
          </Box>

          {products.map((p) => {
            const isActive = p.id === activeProductId;
            return (
              <Box
                key={p.id}
                role="menuitemradio"
                aria-checked={isActive}
                tabIndex={0}
                onClick={() => select(p.id)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    select(p.id);
                  }
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.1,
                  p: 1,
                  borderRadius: 0.875,
                  cursor: 'pointer',
                  fontFamily: MONO,
                  fontSize: 14.1,
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.72)',
                  background: isActive ? 'rgba(108,99,255,0.14)' : 'transparent',
                  '&:hover': { background: 'rgba(108,99,255,0.1)' },
                  outline: 'none',
                  '&:focus-visible': { boxShadow: `0 0 0 2px ${ACCENT}` },
                }}
              >
                <Dot />
                <Box component="span" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.name}
                </Box>
              </Box>
            );
          })}

          <Box
            component={RouterLink}
            to="/onboard"
            role="menuitem"
            onClick={() => setOpen(false)}
            sx={{
              display: 'block',
              mt: 0.75,
              p: 1,
              borderTop: '1px solid rgba(108,99,255,0.14)',
              color: CYAN,
              fontFamily: DISP,
              fontSize: 12.4,
              letterSpacing: 1,
              textDecoration: 'none',
              cursor: 'pointer',
              '&:hover': { color: '#5ff0e0' },
              outline: 'none',
              '&:focus-visible': { boxShadow: `0 0 0 2px ${CYAN}` },
            }}
          >
            + New product
          </Box>
        </Box>
      )}
    </Box>
  );
}
