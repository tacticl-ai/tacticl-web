// src/pages/DashboardPage.tsx
// "One row per pipeline" dashboard — a live HUD list with an agent timeline
// strip + blinking active light per row. Row click → existing spark detail page.
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Stack, Typography, CircularProgress } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import HudPanel from '../components/hud/HudPanel';
import { ACCENT, CYAN, AMBER, RED, DISP, MONO } from '../theme/hud';
import { usePipelines } from '../hooks/usePipelines';
import type { PipelineRunSummary, PdlcRole, PipelineStatus, RoleResultSummary } from '../api/types';

const ROLE_ABBR: Record<PdlcRole, string> = {
  PO: 'PO',
  RESEARCHER: 'Research',
  ARCHITECT: 'Architect',
  DESIGNER: 'Designer',
  PLANNER: 'Planner',
  IMPLEMENTER: 'Implementer',
  REVIEWER: 'Reviewer',
  TESTER: 'Test',
  SECURITY_ANALYST: 'Security',
  TECHNICAL_WRITER: 'Docs',
  DEVOPS: 'DevOps',
  RETRO_ANALYST: 'Retro',
};

type StatusKind = 'running' | 'blocked' | 'done' | 'failed' | 'queued';

interface StatusMeta {
  kind: StatusKind;
  label: string;
  color: string;
  blink: boolean;
}

function statusMeta(status: PipelineStatus): StatusMeta {
  switch (status) {
    case 'RUNNING':
      return { kind: 'running', label: 'RUNNING', color: ACCENT, blink: true };
    case 'PAUSED_AT_CHECKPOINT':
      return { kind: 'blocked', label: 'NEEDS YOU', color: AMBER, blink: true };
    case 'COMPLETED':
      return { kind: 'done', label: 'COMPLETE', color: CYAN, blink: false };
    case 'FAILED':
      return { kind: 'failed', label: 'FAILED', color: RED, blink: false };
    case 'CANCELLED':
      return { kind: 'failed', label: 'CANCELLED', color: RED, blink: false };
    case 'PENDING':
    default:
      return { kind: 'queued', label: 'QUEUED', color: 'rgba(238,240,246,0.5)', blink: false };
  }
}

type NodeKind = 'done' | 'active' | 'blocked' | 'failed' | 'todo';

function nodeKind(
  role: PdlcRole,
  roleResults: Record<string, RoleResultSummary>,
  currentRole: PdlcRole | null,
  pipelineStatus: PipelineStatus,
): NodeKind {
  const r = roleResults[role];
  if (r) {
    if (r.status === 'COMPLETED' || r.status === 'SKIPPED') return 'done';
    if (r.status === 'FAILED' || r.status === 'REJECTED' || r.status === 'ESCALATED') return 'failed';
  }
  if (role === currentRole) {
    return pipelineStatus === 'PAUSED_AT_CHECKPOINT' ? 'blocked' : 'active';
  }
  return 'todo';
}

const NODE_COLOR: Record<NodeKind, string> = {
  done: CYAN,
  active: ACCENT,
  blocked: AMBER,
  failed: RED,
  todo: 'rgba(238,240,246,0.16)',
};

/** Compact agent timeline strip: a node per activated role with a blinking
 *  light on whichever role is currently active (or blocked on a gate). */
function AgentStrip({ run }: { run: PipelineRunSummary }) {
  const roles = run.activatedRoles ?? [];
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', minWidth: 0 }}>
      {roles.map((role, i) => {
        const kind = nodeKind(role, run.roleResults ?? {}, run.currentRole, run.status);
        const live = kind === 'active' || kind === 'blocked';
        const prev = i > 0 ? nodeKind(roles[i - 1], run.roleResults ?? {}, run.currentRole, run.status) : null;
        const segDone = prev === 'done' || prev === 'failed' || prev === 'blocked' || prev === 'active';
        return (
          <Box key={role} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 0, position: 'relative' }}>
            {/* connector segment */}
            {i > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 5,
                  left: '-50%',
                  width: '100%',
                  height: 2,
                  bgcolor: segDone ? CYAN : 'rgba(238,240,246,0.12)',
                }}
              />
            )}
            {/* node */}
            <Box
              sx={{
                position: 'relative',
                zIndex: 1,
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: NODE_COLOR[kind],
                border: kind === 'todo' ? '1px solid rgba(238,240,246,0.2)' : 'none',
                boxShadow: live
                  ? `0 0 10px ${NODE_COLOR[kind]}`
                  : kind === 'done'
                    ? `0 0 8px ${CYAN}99`
                    : 'none',
                ...(live && {
                  animation: 'dash-blink 1.25s ease-in-out infinite',
                  '@keyframes dash-blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.35 } },
                }),
              }}
            />
            {/* label */}
            <Typography
              sx={{
                mt: 0.75,
                fontFamily: MONO,
                fontSize: 8.5,
                letterSpacing: 0.2,
                whiteSpace: 'nowrap',
                textAlign: 'center',
                color:
                  kind === 'done'
                    ? '#8ff0e4'
                    : live
                      ? '#eef0f6'
                      : kind === 'failed'
                        ? '#ffb0b0'
                        : 'rgba(238,240,246,0.34)',
              }}
            >
              {ROLE_ABBR[role] ?? role}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function StatusPill({ meta }: { meta: StatusMeta }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.75}
      sx={{
        display: 'inline-flex',
        px: 1.25,
        py: 0.5,
        borderRadius: 999,
        border: `1px solid ${meta.color}`,
        background: `${meta.color}1f`,
      }}
    >
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          bgcolor: meta.color,
          boxShadow: meta.blink ? `0 0 8px ${meta.color}` : 'none',
          ...(meta.blink && {
            animation: 'pill-blink 1.2s ease-in-out infinite',
            '@keyframes pill-blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.35 } },
          }),
        }}
      />
      <Typography sx={{ fontFamily: DISP, fontSize: 9.5, letterSpacing: 1.3, color: meta.color, whiteSpace: 'nowrap' }}>
        {meta.label}
      </Typography>
    </Stack>
  );
}

const GRID_COLS = '120px minmax(180px, 260px) 1fr 64px 72px';

function PipelineRow({ run }: { run: PipelineRunSummary }) {
  const navigate = useNavigate();
  const meta = statusMeta(run.status);
  const cost = run.totalCostUsd > 0 ? `$${run.totalCostUsd.toFixed(2)}` : '—';
  const updated = run.updatedAt
    ? formatDistanceToNow(new Date(run.updatedAt), { addSuffix: false })
    : '—';

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/sparks/${run.sparkId}`)}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/sparks/${run.sparkId}`);
        }
      }}
      sx={{
        display: 'grid',
        gridTemplateColumns: GRID_COLS,
        gap: 2,
        alignItems: 'center',
        px: 2,
        py: 1.75,
        cursor: 'pointer',
        borderBottom: '1px solid rgba(108,99,255,0.06)',
        transition: 'background .18s',
        '&:hover': { background: 'rgba(108,99,255,0.06)' },
        '&:last-of-type': { borderBottom: 'none' },
        outline: 'none',
        '&:focus-visible': { boxShadow: `inset 0 0 0 1px ${ACCENT}` },
      }}
    >
      {/* status */}
      <Box sx={{ minWidth: 0 }}>
        <StatusPill meta={meta} />
      </Box>

      {/* name + repo */}
      <Box sx={{ minWidth: 0 }}>
        <Typography noWrap sx={{ fontFamily: DISP, fontSize: 14, color: '#eef0f6', fontWeight: 500 }}>
          {run.name || 'Untitled pipeline'}
        </Typography>
        <Typography noWrap sx={{ fontFamily: MONO, fontSize: 10.5, color: 'rgba(238,240,246,0.38)', mt: 0.25 }}>
          {run.repoFullName || run.playbook.replace(/_/g, ' ').toLowerCase()}
        </Typography>
        {meta.kind === 'blocked' && run.prNumber != null && (
          <Typography sx={{ fontFamily: MONO, fontSize: 10, color: AMBER, mt: 0.25 }}>
            ▲ PR #{run.prNumber} · awaiting your approval
          </Typography>
        )}
      </Box>

      {/* agent strip */}
      <Box sx={{ minWidth: 0, overflowX: 'auto' }}>
        <AgentStrip run={run} />
      </Box>

      {/* cost */}
      <Typography sx={{ fontFamily: MONO, fontSize: 11.5, color: 'rgba(238,240,246,0.6)' }}>{cost}</Typography>

      {/* updated */}
      <Typography sx={{ fontFamily: MONO, fontSize: 11.5, color: 'rgba(238,240,246,0.5)' }}>{updated}</Typography>
    </Box>
  );
}

export default function DashboardPage() {
  const { data: pipelines, isLoading, isError } = usePipelines();

  const rows = useMemo(() => pipelines ?? [], [pipelines]);

  const counts = useMemo(() => {
    let running = 0;
    let needsYou = 0;
    let complete = 0;
    let failed = 0;
    for (const r of rows) {
      const k = statusMeta(r.status).kind;
      if (k === 'running') running += 1;
      else if (k === 'blocked') needsYou += 1;
      else if (k === 'done') complete += 1;
      else if (k === 'failed') failed += 1;
    }
    return { running, needsYou, complete, failed };
  }, [rows]);

  const stats: { label: string; value: number; color: string }[] = [
    { label: 'RUNNING', value: counts.running, color: ACCENT },
    { label: 'NEEDS YOU', value: counts.needsYou, color: AMBER },
    { label: 'COMPLETE', value: counts.complete, color: CYAN },
    { label: 'FAILED', value: counts.failed, color: RED },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Page head */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
        justifyContent="space-between"
        spacing={2}
      >
        <Box>
          <Typography sx={{ fontFamily: DISP, fontSize: 26, letterSpacing: 6, fontWeight: 600, color: '#fff', lineHeight: 1 }}>
            DEVELOPMENT{' '}
            <Box
              component="span"
              sx={{
                background: `linear-gradient(90deg, ${ACCENT}, #B25CFF)`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              PIPELINE
            </Box>
          </Typography>
          <Typography sx={{ fontFamily: MONO, fontSize: 11, letterSpacing: 2, color: 'rgba(238,240,246,0.4)', mt: 1 }}>
            LIVE AGENT TRACKING · {rows.length} {rows.length === 1 ? 'BUILD' : 'BUILDS'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {stats.map((s) => (
            <Stack
              key={s.label}
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{
                px: 1.5,
                py: 1,
                borderRadius: 1.5,
                border: '1px solid rgba(108,99,255,0.14)',
                background: 'linear-gradient(180deg, rgba(22,28,34,0.66), rgba(11,15,19,0.66))',
                backdropFilter: 'blur(16px)',
              }}
            >
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color, boxShadow: `0 0 9px ${s.color}` }} />
              <Typography sx={{ fontFamily: DISP, fontSize: 19, fontWeight: 600, color: '#fff', lineHeight: 1 }}>
                {s.value}
              </Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: 1.4, color: 'rgba(238,240,246,0.42)' }}>
                {s.label}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>

      {/* Pipeline list panel */}
      <HudPanel title="PIPELINES" tag="LIVE · 5s" contentSx={{ p: 0 }}>
        {/* column header */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: GRID_COLS,
            gap: 2,
            px: 2,
            py: 1.25,
            borderBottom: '1px solid rgba(108,99,255,0.14)',
          }}
        >
          {['STATUS', 'BUILD', 'AGENTS  ·  done · live · queued', 'COST', 'UPDATED'].map((h) => (
            <Typography key={h} sx={{ fontFamily: DISP, fontSize: 9.5, letterSpacing: 1.4, color: 'rgba(238,240,246,0.4)' }}>
              {h}
            </Typography>
          ))}
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={26} sx={{ color: ACCENT }} />
          </Box>
        ) : isError ? (
          <Typography sx={{ fontFamily: MONO, fontSize: 12.5, color: RED, textAlign: 'center', py: 5 }}>
            Failed to load pipelines.
          </Typography>
        ) : rows.length === 0 ? (
          <Typography sx={{ fontFamily: MONO, fontSize: 12.5, color: 'rgba(238,240,246,0.45)', textAlign: 'center', py: 5 }}>
            // no pipelines yet — start a build in Command to see it here
          </Typography>
        ) : (
          rows.map((run) => <PipelineRow key={run.id} run={run} />)
        )}
      </HudPanel>
    </Box>
  );
}
