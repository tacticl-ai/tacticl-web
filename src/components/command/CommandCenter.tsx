import { useEffect, useMemo, useRef } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import VoiceSphere from './VoiceSphere';
import { useVoice, createMockVoiceBackend } from '../../voice/useVoice';

/* Jarvis command center — a glassy holographic HUD on near-black, the voice
   sphere as the hero. Cyan (#03DAC6) is the HUD accent, violet (#6C63FF) the
   depth. The existing chat + Sparks/PDLC views drop into the framed panels. */

const ACCENT = '#03DAC6';
const VIOLET = '#6C63FF';
const DISP = '"Chakra Petch", "Inter", sans-serif';
const MONO = '"JetBrains Mono", ui-monospace, monospace';

const STATE_COPY: Record<string, { label: string; hint: string }> = {
  idle: { label: 'STANDBY', hint: 'Hold to speak' },
  listening: { label: 'LISTENING', hint: 'Release to send' },
  thinking: { label: 'PROCESSING', hint: 'Routing to the agent…' },
  speaking: { label: 'RESPONDING', hint: 'Tacticl is speaking' },
};

/** Glassy HUD panel with corner brackets. */
function HudPanel({ title, tag, children, sx }: { title: string; tag?: string; children: React.ReactNode; sx?: object }) {
  return (
    <Box
      sx={{
        position: 'relative',
        background: 'linear-gradient(180deg, rgba(20,26,30,0.72), rgba(12,16,20,0.72))',
        backdropFilter: 'blur(14px)',
        border: '1px solid rgba(3,218,198,0.18)',
        borderRadius: 2,
        boxShadow: 'inset 0 0 40px rgba(3,218,198,0.04), 0 8px 40px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...sx,
      }}
    >
      {/* corner brackets */}
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
            borderColor: 'rgba(3,218,198,0.55)',
            borderStyle: 'solid',
            borderWidth: 0,
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
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2, py: 1.1, borderBottom: '1px solid rgba(3,218,198,0.12)' }}
      >
        <Typography sx={{ fontFamily: DISP, fontSize: 12, letterSpacing: 3, color: ACCENT, fontWeight: 600 }}>
          {title}
        </Typography>
        {tag && (
          <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: 1, color: 'rgba(255,255,255,0.4)' }}>
            {tag}
          </Typography>
        )}
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 2 }}>{children}</Box>
    </Box>
  );
}

/** Comms-log transcript (drives off the voice store; ChatPage cards drop in later). */
function TranscriptLog() {
  const transcript = useVoice((s) => s.transcript);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), [transcript]);
  return (
    <Stack spacing={1.5}>
      {transcript.length === 0 && (
        <Typography sx={{ fontFamily: MONO, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
          // awaiting input — hold the orb to speak
        </Typography>
      )}
      {transcript.map((t) => {
        const me = t.role === 'user';
        return (
          <Box key={t.id} sx={{ alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
            <Typography
              sx={{
                fontFamily: DISP,
                fontSize: 10,
                letterSpacing: 2,
                color: me ? 'rgba(255,255,255,0.4)' : ACCENT,
                textAlign: me ? 'right' : 'left',
                mb: 0.4,
              }}
            >
              {me ? 'OPERATOR' : 'TACTICL'}
            </Typography>
            <Box
              sx={{
                px: 1.6,
                py: 1.1,
                borderRadius: 1.5,
                fontSize: 13.5,
                lineHeight: 1.5,
                color: 'rgba(255,255,255,0.92)',
                border: `1px solid ${me ? 'rgba(255,255,255,0.12)' : 'rgba(3,218,198,0.3)'}`,
                background: me ? 'rgba(255,255,255,0.04)' : 'rgba(3,218,198,0.07)',
                opacity: t.partial ? 0.7 : 1,
              }}
            >
              {t.text}
              {t.partial && <Box component="span" sx={{ color: ACCENT }}> ▋</Box>}
            </Box>
          </Box>
        );
      })}
      <div ref={endRef} />
    </Stack>
  );
}

/** Representative PDLC operation strip — hosts the real PdlcPipelineView/RoleStrip when wired. */
function ActiveOperation() {
  const roles = ['Product Owner', 'Architect', 'Designer', 'Planner', 'Implementer', 'Reviewer', 'Test', 'DevOps'];
  const activeIdx = 4;
  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline">
        <Typography sx={{ fontFamily: DISP, fontSize: 13, color: '#fff', letterSpacing: 1 }}>
          strategiz · passkey sign-in fix
        </Typography>
        <Typography sx={{ fontFamily: MONO, fontSize: 10, color: ACCENT }}>PDLC-FIX</Typography>
      </Stack>
      <Stack spacing={1}>
        {roles.map((r, i) => {
          const done = i < activeIdx;
          const active = i === activeIdx;
          return (
            <Stack key={r} direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  flexShrink: 0,
                  bgcolor: done ? ACCENT : active ? VIOLET : 'rgba(255,255,255,0.15)',
                  boxShadow: active ? `0 0 10px ${VIOLET}` : done ? `0 0 8px ${ACCENT}` : 'none',
                  ...(active && { animation: 'pulse 1.4s ease-in-out infinite' }),
                }}
              />
              <Typography sx={{ fontFamily: MONO, fontSize: 12, color: done || active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)', flex: 1 }}>
                {r}
              </Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: 10, color: done ? ACCENT : active ? VIOLET : 'rgba(255,255,255,0.25)' }}>
                {done ? 'DONE' : active ? 'RUNNING' : 'QUEUED'}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
      <Box sx={{ mt: 1, p: 1.4, border: '1px dashed rgba(108,99,255,0.4)', borderRadius: 1.5 }}>
        <Typography sx={{ fontFamily: MONO, fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
          ⏸ awaiting human gate — PR #142 ready for review
        </Typography>
      </Box>
    </Stack>
  );
}

export default function CommandCenter() {
  const state = useVoice((s) => s.state);
  const level = useVoice((s) => s.level);
  const setBackend = useVoice((s) => s.setBackend);
  const startListening = useVoice((s) => s.startListening);
  const stopListening = useVoice((s) => s.stopListening);

  useEffect(() => {
    setBackend(createMockVoiceBackend());
  }, [setBackend]);

  const copy = STATE_COPY[state];
  const clock = useMemo(() => new Date().toLocaleTimeString('en-US', { hour12: false }), []);

  return (
    <Box
      sx={{
        position: 'relative',
        height: '100%',
        minHeight: '100vh',
        color: '#fff',
        overflow: 'hidden',
        background:
          'radial-gradient(1200px 800px at 50% 38%, rgba(3,218,198,0.08), transparent 60%),' +
          'radial-gradient(900px 700px at 80% 90%, rgba(108,99,255,0.10), transparent 60%),' +
          '#080b0d',
        '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.35 } },
        '@keyframes scan': { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100vh)' } },
      }}
    >
      {/* faint grid + scanline atmosphere */}
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5, backgroundImage: 'linear-gradient(rgba(3,218,198,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(3,218,198,0.05) 1px, transparent 1px)', backgroundSize: '48px 48px', maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)' }} />
      <Box sx={{ position: 'absolute', left: 0, right: 0, height: 120, pointerEvents: 'none', background: 'linear-gradient(rgba(3,218,198,0.06), transparent)', animation: 'scan 7s linear infinite' }} />

      {/* top HUD bar */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 4, pt: 3, pb: 1, position: 'relative', zIndex: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: ACCENT, boxShadow: `0 0 12px ${ACCENT}` }} />
          <Typography sx={{ fontFamily: DISP, fontSize: 18, letterSpacing: 6, fontWeight: 600 }}>
            TACTICL <Box component="span" sx={{ color: ACCENT }}>//</Box> COMMAND
          </Typography>
        </Stack>
        <Stack direction="row" spacing={3} alignItems="center">
          <Typography sx={{ fontFamily: MONO, fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>PRODUCT · STRATEGIZ</Typography>
          <Typography sx={{ fontFamily: MONO, fontSize: 11, color: ACCENT }}>◈ ARBITER LINK ACTIVE</Typography>
          <Typography sx={{ fontFamily: MONO, fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{clock}</Typography>
        </Stack>
      </Stack>

      {/* main grid: transcript · sphere · operation */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1.3fr 1fr' },
          gap: 3,
          px: 4,
          py: 2,
          height: 'calc(100vh - 84px)',
        }}
      >
        <HudPanel title="COMMS LOG" tag="LIVE" sx={{ display: { xs: 'none', lg: 'flex' } }}>
          <TranscriptLog />
        </HudPanel>

        {/* hero */}
        <Stack alignItems="center" justifyContent="center" spacing={2}>
          <VoiceSphere state={state} level={level} size={380} />
          <Typography sx={{ fontFamily: DISP, fontSize: 22, letterSpacing: 8, color: state === 'thinking' ? VIOLET : ACCENT, textShadow: `0 0 20px ${state === 'thinking' ? VIOLET : ACCENT}55` }}>
            {copy.label}
          </Typography>
          <Box
            role="button"
            tabIndex={0}
            aria-label="Push to talk"
            onMouseDown={startListening}
            onMouseUp={stopListening}
            onMouseLeave={() => state === 'listening' && stopListening()}
            onTouchStart={(e) => { e.preventDefault(); startListening(); }}
            onTouchEnd={(e) => { e.preventDefault(); stopListening(); }}
            onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') startListening(); }}
            onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') stopListening(); }}
            sx={{
              cursor: 'pointer',
              userSelect: 'none',
              px: 4,
              py: 1.3,
              borderRadius: 999,
              border: `1px solid ${ACCENT}`,
              fontFamily: DISP,
              fontSize: 13,
              letterSpacing: 3,
              color: ACCENT,
              background: state === 'listening' ? 'rgba(3,218,198,0.18)' : 'rgba(3,218,198,0.04)',
              boxShadow: state === 'listening' ? `0 0 24px ${ACCENT}66` : 'none',
              transition: 'all .15s',
              '&:hover': { background: 'rgba(3,218,198,0.12)' },
              outline: 'none',
              '&:focus-visible': { boxShadow: `0 0 0 2px ${ACCENT}` },
            }}
          >
            {copy.hint.toUpperCase()}
          </Box>
        </Stack>

        <HudPanel title="ACTIVE OPERATION" tag="PDLC" sx={{ display: { xs: 'none', lg: 'flex' } }}>
          <ActiveOperation />
        </HudPanel>
      </Box>
    </Box>
  );
}
