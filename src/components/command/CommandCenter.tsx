import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DataSphere from './DataSphere';
import { useVoice } from '../../voice/useVoice';
import { selectVoiceBackend } from '../../voice/selectVoiceBackend';
import { VOICE_CID_KEY } from '../../voice/createLiveVoiceBackend';
import type { CheckpointDecision } from '../../voice/protocol';
import HudPanel from '../hud/HudPanel';
import HudTopbar from '../hud/HudTopbar';
import { ACCENT, VIOLET, CYAN, CYAN_BRIGHT, DISP, MONO } from '../../theme/hud';

/* Jarvis command center — a glassy holographic HUD on near-black, the voice
   sphere as the hero. Violet (#6C63FF) is the brand HUD accent throughout;
   cyan (#03DAC6) is demoted to a sparing secondary highlight (the arbiter-link
   indicator). The existing chat + Sparks/PDLC views drop into the framed
   panels. HUD tokens + HudPanel now live in src/theme/hud.ts + src/components/hud. */


const LEFT_PANEL_KEY = 'tacticl.command.leftPanel';
const RIGHT_PANEL_KEY = 'tacticl.command.rightPanel';

/** Boolean panel-open state persisted to localStorage. Default: open (true). */
function usePersistentPanel(key: string): [boolean, () => void, (next: boolean) => void] {
  const [open, setOpenState] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(key) !== 'closed';
    } catch {
      return true;
    }
  });

  const setOpen = useCallback(
    (next: boolean) => {
      setOpenState(next);
      try {
        window.localStorage.setItem(key, next ? 'open' : 'closed');
      } catch {
        /* storage unavailable — keep in-memory state only */
      }
    },
    [key],
  );

  const toggle = useCallback(() => setOpen(!open), [open, setOpen]);

  return [open, toggle, setOpen];
}

/** Slim, always-visible re-open affordance shown in place of a collapsed panel.
 *  A thin vertical HUD rail with the panel label running vertically and a chevron
 *  tab — one click brings the panel back. The chevron points "inward" (toward the
 *  orb) to signal it will expand back into view. */
function ReopenRail({
  title,
  side,
  onExpand,
}: {
  title: string;
  side: 'left' | 'right';
  onExpand: () => void;
}) {
  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label={`Expand ${title} panel`}
      aria-expanded={false}
      onClick={onExpand}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onExpand();
        }
      }}
      sx={{
        position: 'relative',
        cursor: 'pointer',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        py: 2,
        background: 'linear-gradient(180deg, rgba(20,26,30,0.72), rgba(12,16,20,0.72))',
        backdropFilter: 'blur(14px)',
        border: '1px solid rgba(108,99,255,0.18)',
        borderRadius: 2,
        boxShadow: 'inset 0 0 40px rgba(108,99,255,0.04), 0 8px 40px rgba(0,0,0,0.5)',
        transition: 'all .15s',
        '&:hover': { borderColor: 'rgba(108,99,255,0.5)', background: 'linear-gradient(180deg, rgba(28,34,42,0.8), rgba(16,22,28,0.8))' },
        outline: 'none',
        '&:focus-visible': { boxShadow: `0 0 0 2px ${ACCENT}` },
      }}
    >
      {/* chevron tab — points inward, toward the stage */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 24,
          height: 24,
          borderRadius: 1,
          border: '1px solid rgba(108,99,255,0.32)',
          color: 'rgba(108,99,255,0.85)',
          background: 'rgba(108,99,255,0.05)',
        }}
      >
        {side === 'left' ? <ChevronRightIcon sx={{ fontSize: 18 }} /> : <ChevronLeftIcon sx={{ fontSize: 18 }} />}
      </Box>
      {/* vertical label */}
      <Typography
        sx={{
          fontFamily: DISP,
          fontSize: 11,
          letterSpacing: 3,
          color: ACCENT,
          fontWeight: 600,
          writingMode: 'vertical-rl',
          transform: side === 'left' ? 'rotate(180deg)' : 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </Typography>
    </Box>
  );
}

/** Left rail of the two-pane COMMS LOG (.conv-rail, ~200px): the CONVERSATIONS
 *  eyebrow + "+ NEW", then the scrollable conversation list. Driven by the voice
 *  store; selecting an item rehydrates the transcript and resumes that
 *  conversation's server-side memory for the next turn. Font sizes raised to the
 *  mockup (eyebrow 11.3px, + NEW 11.3px, conv-title 13.6px). */
function ConvRail() {
  const conversations = useVoice((s) => s.conversations);
  const conversationId = useVoice((s) => s.conversationId);
  const loadConversation = useVoice((s) => s.loadConversation);
  const newConversation = useVoice((s) => s.newConversation);

  return (
    <Box
      sx={{
        width: 200,
        flex: 'none',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        p: '14px 11px 14px 14px',
        borderRight: '1px solid rgba(108,99,255,0.14)',
        background: 'rgba(108,99,255,0.025)',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1, flex: 'none' }}>
        <Typography sx={{ fontFamily: DISP, fontSize: 11.3, letterSpacing: 2, color: 'rgba(255,255,255,0.4)' }}>
          CONVERSATIONS
        </Typography>
        <Box
          role="button"
          tabIndex={0}
          aria-label="New conversation"
          onClick={newConversation}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              newConversation();
            }
          }}
          sx={{
            cursor: 'pointer',
            userSelect: 'none',
            px: 1.2,
            py: 0.4,
            borderRadius: 999,
            border: '1px solid rgba(108,99,255,0.4)',
            color: ACCENT,
            fontFamily: DISP,
            fontSize: 11.3,
            letterSpacing: 1.5,
            background: 'rgba(108,99,255,0.06)',
            transition: 'all .15s',
            '&:hover': { background: 'rgba(108,99,255,0.16)' },
            outline: 'none',
            '&:focus-visible': { boxShadow: `0 0 0 2px ${ACCENT}` },
          }}
        >
          + NEW
        </Box>
      </Stack>
      {conversations.length === 0 ? (
        <Typography sx={{ fontFamily: MONO, fontSize: 11.9, color: 'rgba(255,255,255,0.3)', pt: 0.25 }}>
          // no saved conversations yet
        </Typography>
      ) : (
        <Stack spacing={0.9} sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pt: '2px', pr: 0.5 }}>
          {conversations.map((c) => {
            const active = c.id === conversationId;
            return (
              <Box
                key={c.id}
                role="button"
                tabIndex={0}
                aria-label={`Open conversation: ${c.title}`}
                onClick={() => loadConversation(c.id)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    loadConversation(c.id);
                  }
                }}
                sx={{
                  cursor: 'pointer',
                  userSelect: 'none',
                  px: 1.4,
                  py: 1.1,
                  borderRadius: '7px',
                  border: `1px solid ${active ? ACCENT : 'rgba(108,99,255,0.16)'}`,
                  background: active ? 'rgba(108,99,255,0.12)' : 'rgba(255,255,255,0.02)',
                  boxShadow: active ? `inset 2px 0 0 ${ACCENT}` : 'none',
                  transition: 'border-color .15s, background .15s',
                  '&:hover': { borderColor: 'rgba(108,99,255,0.5)', background: active ? undefined : 'rgba(108,99,255,0.05)' },
                  outline: 'none',
                  '&:focus-visible': { boxShadow: `0 0 0 2px ${ACCENT}` },
                }}
              >
                <Typography
                  noWrap
                  sx={{ fontFamily: MONO, fontSize: 13.6, color: active ? '#fff' : 'rgba(255,255,255,0.72)' }}
                >
                  {c.title || 'New conversation'}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}

/** Header of the chat column (.chat-head): the ACTIVE conversation's title + a
 *  status pill. The store carries no per-conversation status, so the pill is a
 *  neutral, honest reflection of the live voice state — LIVE while a turn is in
 *  flight, IDLE otherwise — never a fabricated pipeline status. */
function ChatHead() {
  const conversations = useVoice((s) => s.conversations);
  const conversationId = useVoice((s) => s.conversationId);
  const state = useVoice((s) => s.state);

  const active = conversations.find((c) => c.id === conversationId);
  const title = active?.title || 'New conversation';
  const live = state !== 'idle';

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.1}
      sx={{ flex: 'none', px: 2, py: '13px', borderBottom: '1px solid rgba(108,99,255,0.12)' }}
    >
      <Typography
        noWrap
        sx={{ fontFamily: DISP, fontSize: 13.6, letterSpacing: '.5px', color: '#fff', flex: 1, minWidth: 0 }}
      >
        {title}
      </Typography>
      <Typography
        sx={{
          flex: 'none',
          fontFamily: MONO,
          fontSize: 10.7,
          letterSpacing: 1,
          textTransform: 'uppercase',
          borderRadius: 999,
          px: 1.1,
          py: 0.25,
          color: live ? ACCENT : 'rgba(255,255,255,0.4)',
          border: `1px solid ${live ? 'rgba(108,99,255,0.3)' : 'rgba(255,255,255,0.15)'}`,
        }}
      >
        {live ? 'LIVE' : 'IDLE'}
      </Typography>
    </Stack>
  );
}

/** Comms-log transcript (drives off the voice store; ChatPage cards drop in later).
 *  Bubble sizing raised to the mockup (who 11.3px, bubble 15.3px). */
function TranscriptLog() {
  const transcript = useVoice((s) => s.transcript);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), [transcript]);
  return (
    <Stack spacing={1.75} sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 2 }}>
      {transcript.length === 0 && (
        <Typography sx={{ fontFamily: MONO, fontSize: 13.6, color: 'rgba(255,255,255,0.35)' }}>
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
                fontSize: 11.3,
                letterSpacing: 2,
                color: me ? 'rgba(255,255,255,0.4)' : ACCENT,
                textAlign: me ? 'right' : 'left',
                mb: 0.5,
              }}
            >
              {me ? 'OPERATOR' : 'TACTICL'}
            </Typography>
            <Box
              sx={{
                px: 2,
                py: 1.4,
                borderRadius: '12px',
                fontSize: 15.3,
                lineHeight: 1.5,
                color: 'rgba(255,255,255,0.92)',
                border: `1px solid ${me ? 'rgba(255,255,255,0.12)' : 'rgba(108,99,255,0.3)'}`,
                background: me ? 'rgba(255,255,255,0.04)' : 'rgba(108,99,255,0.07)',
                opacity: t.partial ? 0.7 : 1,
              }}
            >
              {t.text}
              {t.partial && <Box component="span" sx={{ color: ACCENT, animation: 'pulse 1s ease-in-out infinite' }}> ▋</Box>}
            </Box>
          </Box>
        );
      })}
      <div ref={endRef} />
    </Stack>
  );
}

/** The two-pane COMMS LOG body (.comms-split): left conversation rail + right
 *  chat column (head + transcript). Replaces the old single-column stack. */
function CommsLog() {
  return (
    <Box sx={{ display: 'flex', flex: 1, minHeight: 0, width: '100%' }}>
      <ConvRail />
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <ChatHead />
        <TranscriptLog />
      </Box>
    </Box>
  );
}

const PDLC_ROLES = ['Product Owner', 'Architect', 'Designer', 'Planner', 'Implementer', 'Reviewer', 'Test', 'DevOps'];

/** HUD-styled human-in-the-loop gate. Renders when a checkpoint frame arrives. */
function CheckpointGate() {
  const checkpoint = useVoice((s) => s.checkpoint);
  const decideCheckpoint = useVoice((s) => s.decideCheckpoint);
  const [feedback, setFeedback] = useState('');

  if (!checkpoint) return null;

  const decide = (decision: CheckpointDecision) => {
    decideCheckpoint(decision, feedback.trim() || undefined);
    setFeedback('');
  };

  const palette: Record<CheckpointDecision, string> = {
    APPROVE: CYAN, // positive confirm — the sparing cyan accent
    CHANGES: VIOLET,
    REJECT: '#FF6B6B',
  };

  return (
    <Box
      sx={{
        mt: 1,
        p: 1.6,
        borderRadius: 1.5,
        border: `1px solid ${VIOLET}`,
        background: 'rgba(108,99,255,0.08)',
        boxShadow: `0 0 24px rgba(108,99,255,0.18)`,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: VIOLET, boxShadow: `0 0 10px ${VIOLET}`, animation: 'pulse 1.2s ease-in-out infinite' }} />
        <Typography sx={{ fontFamily: DISP, fontSize: 12.4, letterSpacing: 2, color: VIOLET }}>
          HUMAN GATE
        </Typography>
      </Stack>
      <Typography sx={{ fontFamily: MONO, fontSize: 14.1, color: 'rgba(255,255,255,0.92)', mb: 1.5, lineHeight: 1.4 }}>
        {checkpoint.title}
      </Typography>
      <Box
        component="textarea"
        value={feedback}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFeedback(e.target.value)}
        placeholder="optional feedback…"
        rows={2}
        sx={{
          width: '100%',
          resize: 'vertical',
          mb: 1.4,
          p: 1,
          borderRadius: 1,
          border: '1px solid rgba(108,99,255,0.35)',
          background: 'rgba(8,11,13,0.6)',
          color: 'rgba(255,255,255,0.9)',
          fontFamily: MONO,
          fontSize: 13.6,
          outline: 'none',
          '&:focus': { borderColor: VIOLET },
          '&::placeholder': { color: 'rgba(255,255,255,0.3)' },
        }}
      />
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {checkpoint.options.map((option) => {
          const color = palette[option] ?? ACCENT;
          return (
            <Box
              key={option}
              role="button"
              tabIndex={0}
              aria-label={`${option} checkpoint`}
              onClick={() => decide(option)}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  decide(option);
                }
              }}
              sx={{
                cursor: 'pointer',
                userSelect: 'none',
                px: 2,
                py: 0.75,
                borderRadius: 999,
                border: `1px solid ${color}`,
                color,
                fontFamily: DISP,
                fontSize: 12.4,
                letterSpacing: 2,
                background: `${color}14`,
                transition: 'all .15s',
                '&:hover': { background: `${color}28` },
                outline: 'none',
                '&:focus-visible': { boxShadow: `0 0 0 2px ${color}` },
              }}
            >
              {option}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

/** Context eyebrow (.op-ctx) — ties the right panel to the selected conversation
 *  ("▸ <title>"). Honest: falls back to the new-conversation label. */
function OpContext() {
  const conversations = useVoice((s) => s.conversations);
  const conversationId = useVoice((s) => s.conversationId);
  const active = conversations.find((c) => c.id === conversationId);
  const title = active?.title || 'New conversation';
  return (
    <Typography
      noWrap
      sx={{
        fontFamily: MONO,
        fontSize: 11.3,
        letterSpacing: 1,
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.4)',
        mb: 1.75,
      }}
    >
      ▸ <Box component="b" sx={{ color: ACCENT, fontWeight: 600 }}>{title}</Box>
    </Typography>
  );
}

/** PDLC operation strip — driven purely by live HUD frames. No fabricated
 *  progress: with no live operation it shows an honest idle state, and the
 *  pipeline role strip only renders once a real role arrives. Always leads with
 *  the op-ctx eyebrow (selected conversation), and links to the full pipeline
 *  detail when a real runId exists. */
function ActiveOperation() {
  const operation = useVoice((s) => s.operation);
  const checkpoint = useVoice((s) => s.checkpoint);

  // The live HUD frame names the active role; map it onto the canonical strip.
  // -1 means "no live role yet" → we render no strip rather than guessing one.
  const activeIdx = operation?.role
    ? PDLC_ROLES.findIndex((r) => r.toLowerCase() === operation.role!.toLowerCase())
    : -1;

  const hasOperation = Boolean(operation?.role || operation?.phase || operation?.runId);

  // Idle: nothing running and no gate pending — say so honestly (.op-idle).
  if (!hasOperation && !checkpoint) {
    return (
      <>
        <OpContext />
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={1.4}
          sx={{ textAlign: 'center', py: 5.75, px: 2, color: 'rgba(255,255,255,0.4)' }}
        >
          <Box sx={{ fontSize: 29.4, opacity: 0.5, filter: `drop-shadow(0 0 10px ${ACCENT}80)` }}>◇</Box>
          <Typography sx={{ fontFamily: MONO, fontSize: 13.6, lineHeight: 1.55, maxWidth: 210 }}>
            No live pipeline in this conversation.
            <br />
            Ask Tacticl to build something to spin one up.
          </Typography>
        </Stack>
      </>
    );
  }

  const title = [operation?.runId, operation?.phase].filter(Boolean).join(' · ');
  const tag = operation?.runId ? 'PDLC-RUN' : 'PDLC';

  return (
    <>
      <OpContext />
      <Stack spacing={2}>
        {(title || tag) && (
          <Stack direction="row" justifyContent="space-between" alignItems="baseline">
            <Typography sx={{ fontFamily: DISP, fontSize: 14.7, color: '#fff', letterSpacing: 1 }}>
              {title || 'operation'}
            </Typography>
            <Typography sx={{ fontFamily: MONO, fontSize: 11.3, color: ACCENT }}>{tag}</Typography>
          </Stack>
        )}
        {activeIdx >= 0 && (
          <Stack spacing={1.4}>
            {PDLC_ROLES.map((r, i) => {
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
                      bgcolor: done ? CYAN : active ? VIOLET : 'rgba(255,255,255,0.15)',
                      boxShadow: active ? `0 0 10px ${VIOLET}` : done ? `0 0 8px ${CYAN}` : 'none',
                      ...(active && { animation: 'pulse 1.4s ease-in-out infinite' }),
                    }}
                  />
                  <Typography sx={{ fontFamily: MONO, fontSize: 13.6, color: done || active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)', flex: 1 }}>
                    {r}
                  </Typography>
                  <Typography sx={{ fontFamily: MONO, fontSize: 11.3, letterSpacing: 1, color: done ? CYAN : active ? VIOLET : 'rgba(255,255,255,0.25)' }}>
                    {done ? 'DONE' : active ? 'RUNNING' : 'QUEUED'}
                  </Typography>
                </Stack>
              );
            })}
          </Stack>
        )}
        {checkpoint ? (
          <CheckpointGate />
        ) : operation?.note ? (
          <Box sx={{ mt: 1, p: 1.4, border: '1px dashed rgba(108,99,255,0.4)', borderRadius: 1.5 }}>
            <Typography sx={{ fontFamily: MONO, fontSize: 11.9, color: 'rgba(255,255,255,0.55)' }}>
              {operation.note}
            </Typography>
          </Box>
        ) : null}
        {/* OPEN PIPELINE → — only when a real run exists to deep-link into (.op-open) */}
        {operation?.runId && (
          <Box
            component={RouterLink}
            to={`/sparks/${operation.runId}`}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              alignSelf: 'flex-start',
              mt: 1,
              cursor: 'pointer',
              fontFamily: DISP,
              fontSize: 11.3,
              letterSpacing: 1.5,
              color: CYAN_BRIGHT,
              textDecoration: 'none',
              border: '1px solid rgba(21,224,200,0.3)',
              borderRadius: '6px',
              px: 1.6,
              py: 1,
              background: 'rgba(21,224,200,0.05)',
              transition: 'border-color .15s, background .15s',
              '&:hover': { borderColor: CYAN_BRIGHT, background: 'rgba(21,224,200,0.12)' },
              outline: 'none',
              '&:focus-visible': { boxShadow: `0 0 0 2px ${CYAN_BRIGHT}` },
            }}
          >
            OPEN PIPELINE →
          </Box>
        )}
      </Stack>
    </>
  );
}

/**
 * HUD command bar — typed input pinned at the bottom-center. Coexists with
 * push-to-talk: both routes push an operator turn and drive the same response.
 */
function TextComposer() {
  const sendText = useVoice((s) => s.sendText);
  const state = useVoice((s) => s.state);
  const [value, setValue] = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);

  const canSend = value.trim().length > 0;

  const submit = () => {
    const text = value.trim();
    if (!text) return;
    sendText(text);
    setValue('');
    // keep focus for rapid commands
    requestAnimationFrame(() => taRef.current?.focus());
  };

  return (
    <Box
      sx={{
        position: 'relative',
        zIndex: 3,
        px: 4,
        pb: 3,
        pt: 1,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Stack
        direction="row"
        alignItems="flex-end"
        spacing={1.2}
        sx={{
          width: '100%',
          maxWidth: 880,
          p: 1,
          pl: 2,
          borderRadius: 3,
          border: `1px solid rgba(108,99,255,0.28)`,
          background: 'linear-gradient(180deg, rgba(20,26,30,0.78), rgba(12,16,20,0.78))',
          backdropFilter: 'blur(14px)',
          boxShadow: 'inset 0 0 30px rgba(108,99,255,0.05), 0 8px 40px rgba(0,0,0,0.5)',
        }}
      >
        <Typography sx={{ fontFamily: MONO, fontSize: 15.8, color: ACCENT, pb: 1.1, flexShrink: 0 }}>
          &gt;
        </Typography>
        <Box
          component="textarea"
          ref={taRef}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setValue(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="Speak or type a command — Enter to send, Shift+Enter for a new line"
          aria-label="Command input"
          sx={{
            flex: 1,
            resize: 'none',
            maxHeight: 120,
            py: 1,
            border: 'none',
            background: 'transparent',
            color: 'rgba(255,255,255,0.92)',
            fontFamily: MONO,
            fontSize: 15.3,
            lineHeight: 1.5,
            outline: 'none',
            '&::placeholder': { color: 'rgba(255,255,255,0.32)' },
          }}
        />
        <Box
          role="button"
          tabIndex={canSend ? 0 : -1}
          aria-label="Send command"
          aria-disabled={!canSend}
          onClick={() => canSend && submit()}
          onKeyDown={(e: React.KeyboardEvent) => {
            if ((e.key === 'Enter' || e.key === ' ') && canSend) {
              e.preventDefault();
              submit();
            }
          }}
          sx={{
            flexShrink: 0,
            cursor: canSend ? 'pointer' : 'default',
            userSelect: 'none',
            px: 2.5,
            py: 1.1,
            borderRadius: 2,
            border: `1px solid ${canSend ? ACCENT : 'rgba(108,99,255,0.2)'}`,
            fontFamily: DISP,
            fontSize: 13.6,
            letterSpacing: 2,
            color: canSend ? ACCENT : 'rgba(108,99,255,0.3)',
            background: canSend ? 'rgba(108,99,255,0.12)' : 'transparent',
            opacity: canSend ? 1 : 0.5,
            transition: 'all .15s',
            '&:hover': canSend ? { background: 'rgba(108,99,255,0.22)' } : {},
            outline: 'none',
            '&:focus-visible': { boxShadow: `0 0 0 2px ${ACCENT}` },
          }}
        >
          {state === 'thinking' ? 'SENDING…' : 'SEND'}
        </Box>
      </Stack>
    </Box>
  );
}

export default function CommandCenter() {
  const state = useVoice((s) => s.state);
  const setBackend = useVoice((s) => s.setBackend);
  const startListening = useVoice((s) => s.startListening);
  const stopListening = useVoice((s) => s.stopListening);

  const [leftOpen, toggleLeft] = usePersistentPanel(LEFT_PANEL_KEY);
  const [rightOpen, toggleRight] = usePersistentPanel(RIGHT_PANEL_KEY);

  useEffect(() => {
    const backend = selectVoiceBackend();
    setBackend(backend);
    const store = useVoice.getState();
    // Populate the picker, and resume the last conversation's transcript on load.
    void store.refreshConversations();
    let storedCid: string | null = null;
    try {
      storedCid = window.localStorage.getItem(VOICE_CID_KEY);
    } catch {
      /* storage unavailable — start fresh */
    }
    if (storedCid) {
      void store.loadConversation(storedCid);
    }
    return () => backend.dispose();
  }, [setBackend]);

  // Keyboard toggles — "[" flips the left panel, "]" flips the right. Ignore
  // when a text field/composer has focus so typing brackets still works.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || el?.isContentEditable) return;
      if (e.key === '[') {
        e.preventDefault();
        toggleLeft();
      } else if (e.key === ']') {
        e.preventDefault();
        toggleRight();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleLeft, toggleRight]);


  // The grid reflows on what's open: a collapsed side becomes a slim rail track,
  // an open side gets a full panel column. Both closed → orb owns the stage.
  // Mockup grid ratio is 1.6fr (comms) · 1.2fr (orb) · 1fr (operation). Keep the
  // collapse rails: a collapsed side drops to a slim fixed track.
  const RAIL = '52px';
  const gridTemplateColumns = {
    xs: '1fr',
    lg: `${leftOpen ? '1.6fr' : RAIL} 1.2fr ${rightOpen ? '1fr' : RAIL}`,
  };

  return (
    <Box
      sx={{
        position: 'relative',
        height: '100%',
        minHeight: '100vh',
        color: '#fff',
        overflow: 'hidden',
        background:
          // violet-dominant ambient glows; a faint cyan kiss in one corner
          // for occasional brand contrast, never the main hue.
          'radial-gradient(1200px 800px at 50% 38%, rgba(108,99,255,0.13), transparent 60%),' +
          'radial-gradient(900px 700px at 80% 90%, rgba(108,99,255,0.10), transparent 60%),' +
          'radial-gradient(700px 600px at 12% 6%, rgba(3,218,198,0.05), transparent 62%),' +
          '#080b0d',
        '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.35 } },
        '@keyframes scan': { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100vh)' } },
      }}
    >
      {/* faint grid + scanline atmosphere */}
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5, backgroundImage: 'linear-gradient(rgba(108,99,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(108,99,255,0.05) 1px, transparent 1px)', backgroundSize: '48px 48px', maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)' }} />
      <Box sx={{ position: 'absolute', left: 0, right: 0, height: 120, pointerEvents: 'none', background: 'linear-gradient(rgba(108,99,255,0.06), transparent)', animation: 'scan 7s linear infinite' }} />

      {/* top HUD bar */}
      <HudTopbar active="command" />

      {/* body column: main grid grows, command bar pinned at the bottom */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 84px)',
        }}
      >
      {/* main grid: transcript · sphere · operation — reflows on panel toggles */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns,
          gap: 3,
          px: 4,
          py: 2,
          transition: 'grid-template-columns .35s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {leftOpen ? (
          <HudPanel
            title="COMMS LOG"
            tag="LIVE"
            side="left"
            onCollapse={toggleLeft}
            sx={{ display: { xs: 'none', lg: 'flex' } }}
            contentSx={{ p: 0, overflow: 'hidden', display: 'flex' }}
          >
            <CommsLog />
          </HudPanel>
        ) : (
          <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
            <ReopenRail title="COMMS LOG" side="left" onExpand={toggleLeft} />
          </Box>
        )}

        {/* hero — the data-sphere orb IS the hero. Hold the orb itself to speak;
            its own colour/motion state conveys listening/thinking/speaking, so no
            label or status strip is needed. The bottom command bar stays for typing. */}
        <Stack alignItems="center" justifyContent="center" sx={{ minWidth: 0 }}>
          <Box
            role="button"
            tabIndex={0}
            aria-label="Hold to speak"
            title="Hold to speak"
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
              display: 'grid',
              placeItems: 'center',
              width: '100%',
              borderRadius: '50%',
              outline: 'none',
              '&:focus-visible': { boxShadow: `0 0 0 2px ${ACCENT}` },
            }}
          >
            <DataSphere state={state} />
          </Box>
        </Stack>

        {rightOpen ? (
          <HudPanel
            title="ACTIVE OPERATION"
            tag="PDLC"
            side="right"
            onCollapse={toggleRight}
            sx={{ display: { xs: 'none', lg: 'flex' } }}
          >
            <ActiveOperation />
          </HudPanel>
        ) : (
          <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
            <ReopenRail title="ACTIVE OPERATION" side="right" onExpand={toggleRight} />
          </Box>
        )}
      </Box>

        {/* command bar — typed commands, pinned bottom-center, coexists with voice */}
        <TextComposer />
      </Box>
    </Box>
  );
}
