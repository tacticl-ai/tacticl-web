// src/components/sparks/pdlc/ArtifactMarkdown.tsx
// Renders an artifact's markdown body with MUI-styled elements on a HudPanel,
// plus a left section outline derived from the level-2 headings (per the mockups).
import { useMemo, useState, useCallback } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import HudPanel from '../../hud/HudPanel';
import { ACCENT, CYAN, DISP, MONO } from '../../../theme/hud';

const READ = '"Newsreader", Georgia, serif';

interface ArtifactMarkdownProps {
  /** The artifact's markdown body. */
  markdown: string;
  /** Optional document title shown above the body. */
  title?: string;
  /** Optional meta line under the title (e.g. "PRD · v1 · Product Owner"). */
  meta?: string;
  /** Optional HUD tag in the panel header. */
  tag?: string;
}

/** Stable slug for a heading's anchor id + outline target. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/** Flatten a React markdown heading child into its plain-text label. */
function childText(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(childText).join('');
  if (children && typeof children === 'object' && 'props' in children) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return childText((children as any).props?.children);
  }
  return '';
}

/** Extract level-2 headings for the on-this-page outline. */
function extractOutline(markdown: string): { id: string; label: string }[] {
  const lines = markdown.split('\n');
  const out: { id: string; label: string }[] = [];
  let inFence = false;
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^##\s+(.+?)\s*#*\s*$/.exec(line);
    if (m) {
      const label = m[1].trim();
      out.push({ id: slugify(label), label });
    }
  }
  return out;
}

export default function ArtifactMarkdown({ markdown, title, meta, tag }: ArtifactMarkdownProps) {
  const outline = useMemo(() => extractOutline(markdown), [markdown]);
  const [activeId, setActiveId] = useState<string | null>(outline[0]?.id ?? null);

  const scrollTo = useCallback((id: string) => {
    setActiveId(id);
    const el = document.getElementById(`md-${id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const components: Components = useMemo(
    () => ({
      h1: ({ children }) => (
        <Typography component="h1" sx={{ fontFamily: DISP, fontSize: 26, color: '#fff', mt: 0, mb: 0.75 }}>
          {children}
        </Typography>
      ),
      h2: ({ children }) => {
        const id = slugify(childText(children));
        return (
          <Typography
            component="h2"
            id={`md-${id}`}
            sx={{
              fontFamily: DISP,
              fontSize: 16,
              letterSpacing: 1,
              color: '#bdb8ff',
              mt: 4,
              mb: 1.5,
              pb: 0.9,
              scrollMarginTop: 16,
              borderBottom: '1px solid rgba(108,99,255,0.14)',
            }}
          >
            {children}
          </Typography>
        );
      },
      h3: ({ children }) => (
        <Typography component="h3" sx={{ fontFamily: DISP, fontSize: 13.5, color: CYAN, mt: 2.5, mb: 1, letterSpacing: 0.5 }}>
          {children}
        </Typography>
      ),
      p: ({ children }) => (
        <Typography component="p" sx={{ fontFamily: READ, fontSize: 16, lineHeight: 1.7, color: 'rgba(238,240,246,0.86)', my: 1.25 }}>
          {children}
        </Typography>
      ),
      ul: ({ children }) => (
        <Box component="ul" sx={{ my: 1, pl: 3, '& li': { fontFamily: READ, fontSize: 16, lineHeight: 1.7, color: 'rgba(238,240,246,0.86)', my: 0.5 } }}>
          {children}
        </Box>
      ),
      ol: ({ children }) => (
        <Box component="ol" sx={{ my: 1, pl: 3, '& li': { fontFamily: READ, fontSize: 16, lineHeight: 1.7, color: 'rgba(238,240,246,0.86)', my: 0.5 } }}>
          {children}
        </Box>
      ),
      li: ({ children }) => <li>{children}</li>,
      strong: ({ children }) => (
        <Box component="strong" sx={{ color: '#fff', fontWeight: 600 }}>
          {children}
        </Box>
      ),
      em: ({ children }) => (
        <Box component="em" sx={{ color: '#ffd99a', fontStyle: 'italic' }}>
          {children}
        </Box>
      ),
      a: ({ children, href }) => (
        <Box
          component="a"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ color: ACCENT, textDecoration: 'none', borderBottom: `1px solid ${ACCENT}55`, '&:hover': { borderBottomColor: ACCENT } }}
        >
          {children}
        </Box>
      ),
      blockquote: ({ children }) => (
        <Box
          component="blockquote"
          sx={{
            borderLeft: `3px solid ${CYAN}`,
            my: 1.5,
            px: 2,
            py: 0.75,
            background: 'rgba(3,218,198,0.05)',
            color: 'rgba(238,240,246,0.8)',
            fontFamily: READ,
            fontStyle: 'italic',
            '& p': { my: 0.5 },
          }}
        >
          {children}
        </Box>
      ),
      code: ({ className, children }) => {
        const isBlock = typeof className === 'string' && className.includes('language-');
        if (isBlock) {
          return (
            <Box
              component="code"
              sx={{
                display: 'block',
                fontFamily: MONO,
                fontSize: 12.5,
                lineHeight: 1.6,
                color: '#cfc9ff',
                whiteSpace: 'pre',
                overflowX: 'auto',
              }}
            >
              {children}
            </Box>
          );
        }
        return (
          <Box
            component="code"
            sx={{ fontFamily: MONO, fontSize: 13, background: 'rgba(108,99,255,0.12)', color: '#cfc9ff', px: 0.75, py: 0.25, borderRadius: 0.75 }}
          >
            {children}
          </Box>
        );
      },
      pre: ({ children }) => (
        <Box
          component="pre"
          sx={{
            my: 1.5,
            p: 1.75,
            borderRadius: 1.5,
            border: '1px solid rgba(108,99,255,0.18)',
            background: 'rgba(8,11,13,0.6)',
            overflowX: 'auto',
          }}
        >
          {children}
        </Box>
      ),
      table: ({ children }) => (
        <Box sx={{ overflowX: 'auto', my: 1.5 }}>
          <Box
            component="table"
            sx={{
              borderCollapse: 'collapse',
              width: '100%',
              fontFamily: MONO,
              fontSize: 12.5,
              '& th, & td': { border: '1px solid rgba(108,99,255,0.14)', px: 1.4, py: 1, textAlign: 'left' },
              '& th': { background: 'rgba(108,99,255,0.08)', color: '#bdb8ff', fontFamily: DISP, letterSpacing: 0.5, fontWeight: 600 },
              '& td': { color: 'rgba(238,240,246,0.8)' },
            }}
          >
            {children}
          </Box>
        </Box>
      ),
      hr: () => <Box component="hr" sx={{ border: 'none', borderTop: '1px solid rgba(108,99,255,0.14)', my: 2.5 }} />,
    }),
    [],
  );

  return (
    <HudPanel title={tag ? undefined : 'ARTIFACT'} tag={tag} contentSx={{ p: 0 }} sx={{ width: '100%' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ alignItems: 'stretch' }}>
        {/* On-this-page outline (left) */}
        {outline.length > 0 && (
          <Box
            sx={{
              flexShrink: 0,
              width: { xs: '100%', md: 210 },
              borderRight: { md: '1px solid rgba(108,99,255,0.14)' },
              borderBottom: { xs: '1px solid rgba(108,99,255,0.14)', md: 'none' },
              p: 2,
              position: { md: 'sticky' },
              top: 0,
              alignSelf: 'flex-start',
            }}
          >
            <Typography sx={{ fontFamily: DISP, fontSize: 9.5, letterSpacing: 2, color: 'rgba(170,165,255,0.6)', mb: 1.5 }}>
              ON THIS PAGE
            </Typography>
            <Stack spacing={0.25}>
              {outline.map((o) => {
                const on = o.id === activeId;
                return (
                  <Box
                    key={o.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => scrollTo(o.id)}
                    onKeyDown={(e: React.KeyboardEvent) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        scrollTo(o.id);
                      }
                    }}
                    sx={{
                      cursor: 'pointer',
                      userSelect: 'none',
                      fontFamily: MONO,
                      fontSize: 11.5,
                      color: on ? '#fff' : 'rgba(238,240,246,0.55)',
                      px: 1.1,
                      py: 0.75,
                      borderRadius: 1,
                      borderLeft: `2px solid ${on ? CYAN : 'transparent'}`,
                      background: on ? 'rgba(3,218,198,0.07)' : 'transparent',
                      transition: 'all .15s',
                      '&:hover': { color: '#eef0f6', background: 'rgba(108,99,255,0.06)' },
                    }}
                  >
                    {o.label}
                  </Box>
                );
              })}
            </Stack>
          </Box>
        )}

        {/* Rendered markdown body (right) */}
        <Box sx={{ flex: 1, minWidth: 0, p: { xs: 2.5, md: 4 }, maxWidth: 820 }}>
          {title && (
            <Typography sx={{ fontFamily: DISP, fontSize: 25, color: '#fff', mb: 0.5 }}>{title}</Typography>
          )}
          {meta && (
            <Typography sx={{ fontFamily: MONO, fontSize: 11, color: 'rgba(238,240,246,0.4)', mb: 2.5 }}>{meta}</Typography>
          )}
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {markdown}
          </ReactMarkdown>
        </Box>
      </Stack>
    </HudPanel>
  );
}
