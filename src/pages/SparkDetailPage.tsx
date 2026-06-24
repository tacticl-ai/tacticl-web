// src/pages/SparkDetailPage.tsx
// Full-bleed "PIPELINE" HUD — the live re-skin of the spark detail surface, matching
// docs/mockups/spark-detail.html 1:1 (HUD chrome, role timeline w/ node states, KPI
// strip, live role log, event timeline, per-role artifact tabs, and the clickable
// per-persona TASK BREAKDOWN panel). Wired to real pipeline data:
//   • status / role-timeline / KPIs   ← GET /v1/sparks/{id}/pipeline (PipelineRun)
//   • event timeline                  ← GET /v1/sparks/{id}/pipeline/events/history
//   • artifacts                       ← GET /v1/sparks/{id}/pipeline/artifacts/{role} (+content)
// Descends from the DASHBOARD board, so the topbar shows DASHBOARD active and a
// DASHBOARD › PIPELINE breadcrumb back-links to it.
//
// TASK BREAKDOWN data binding: the Planner-produced per-role task checklist is NOT in
// the API yet (Slice 3). The panel reads an OPTIONAL `tasks` field off each role result
// (RoleTaskBreakdown) IF the backend ever populates it; until then every role renders a
// clearly-labeled "task breakdown pending" placeholder. No fabricated tasks.
import { useMemo, useRef, useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import HudTopbar from '../components/hud/HudTopbar';
import ArtifactMarkdown from '../components/sparks/pdlc/ArtifactMarkdown';
import { useSpark, useCancelSpark } from '../hooks/useSparks';
import {
  usePipelineRun,
  usePipelineEvents,
  useRoleArtifact,
} from '../hooks/usePipeline';
import { useSparkProgressStore } from '../hooks/useSparkProgress';
import type {
  PipelineRun,
  PdlcRole,
  RoleResultSummary,
  PipelineEvent,
  PipelineEventType,
  PipelineStatus,
} from '../api/types';

// ── Full pipeline sequences per playbook (so not-yet-run roles still show as `todo`).
const SEQUENCES: Record<string, PdlcRole[]> = {
  FULL_PDLC: ['PO', 'RESEARCHER', 'ARCHITECT', 'DESIGNER', 'PLANNER', 'IMPLEMENTER', 'REVIEWER', 'TESTER', 'SECURITY_ANALYST', 'TECHNICAL_WRITER', 'DEVOPS', 'RETRO_ANALYST'],
  SMALL_FEATURE: ['PO', 'PLANNER', 'IMPLEMENTER', 'REVIEWER', 'TESTER', 'RETRO_ANALYST'],
  BUG_FIX: ['RESEARCHER', 'IMPLEMENTER', 'REVIEWER', 'TESTER', 'RETRO_ANALYST'],
  REFACTOR: ['RESEARCHER', 'PLANNER', 'IMPLEMENTER', 'REVIEWER', 'TESTER'],
  UI_CHANGE: ['PO', 'DESIGNER', 'IMPLEMENTER', 'REVIEWER', 'TESTER'],
  DOCS_ONLY: ['RESEARCHER', 'TECHNICAL_WRITER', 'REVIEWER'],
  INFRA_CHANGE: ['ARCHITECT', 'PLANNER', 'IMPLEMENTER', 'SECURITY_ANALYST', 'DEVOPS'],
  SECURITY_PATCH: ['SECURITY_ANALYST', 'IMPLEMENTER', 'REVIEWER', 'TESTER'],
};

const ROLE_LABEL: Record<PdlcRole, string> = {
  PO: 'PO', RESEARCHER: 'Research', ARCHITECT: 'Architect', DESIGNER: 'Designer',
  PLANNER: 'Planner', IMPLEMENTER: 'Implementer', REVIEWER: 'Reviewer', TESTER: 'Tester',
  SECURITY_ANALYST: 'Security', TECHNICAL_WRITER: 'Docs', DEVOPS: 'DevOps', RETRO_ANALYST: 'Retro',
};

const ROLE_FULL: Record<PdlcRole, string> = {
  PO: 'PRODUCT OWNER', RESEARCHER: 'RESEARCHER', ARCHITECT: 'ARCHITECT', DESIGNER: 'DESIGNER',
  PLANNER: 'PLANNER', IMPLEMENTER: 'IMPLEMENTER', REVIEWER: 'REVIEWER', TESTER: 'TESTER',
  SECURITY_ANALYST: 'SECURITY ANALYST', TECHNICAL_WRITER: 'TECHNICAL WRITER', DEVOPS: 'DEVOPS',
  RETRO_ANALYST: 'RETRO ANALYST',
};

// ── Formatters ────────────────────────────────────────────
function fmtDuration(ms: number | undefined | null): string | null {
  if (ms == null || Number.isNaN(ms)) return null;
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function fmtElapsed(fromIso: string, toIso?: string | null): string {
  const from = new Date(fromIso).getTime();
  const to = toIso ? new Date(toIso).getTime() : Date.now();
  const ms = to - from;
  if (Number.isNaN(ms) || ms < 0) return '—';
  return fmtDuration(ms) ?? '—';
}

function relTime(iso?: string): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return '—';
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtTokens(tokens: number | undefined | null): string | null {
  if (tokens == null) return null;
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return String(tokens);
}

function shortModel(model: string | undefined | null): string | null {
  if (!model) return null;
  const parts = model.split('-');
  if (parts.length >= 3) return parts.slice(1, 3).join('-');
  return model.length > 12 ? model.slice(0, 12) : model;
}

function fmtClock(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour12: false });
}

// ── Node state derivation (mirrors DashboardPage + the mockup) ──
type NodeState = 'done' | 'cur' | 'block' | 'fail' | 'skip' | 'todo';

function sequenceFor(run: PipelineRun): PdlcRole[] {
  const base = SEQUENCES[run.playbook];
  if (base && base.length) {
    const extra = (run.activatedRoles ?? []).filter((r) => !base.includes(r));
    return [...base, ...extra];
  }
  return run.activatedRoles?.length ? run.activatedRoles : ['IMPLEMENTER'];
}

function nodeStateFor(role: PdlcRole, run: PipelineRun): NodeState {
  const result = run.roleResults?.[role];
  const blocked = run.status === 'PAUSED_AT_CHECKPOINT' || !!run.currentCheckpointId;
  if (result) {
    if (result.status === 'COMPLETED') return 'done';
    if (result.status === 'SKIPPED') return 'skip';
    if (result.status === 'FAILED' || result.status === 'REJECTED' || result.status === 'ESCALATED') return 'fail';
    if (result.status === 'EXECUTING' || result.status === 'REWORKING') return blocked ? 'block' : 'cur';
    if (result.status === 'AWAITING_APPROVAL') return 'block';
  }
  if (run.currentRole === role) {
    if (blocked) return 'block';
    if (run.status === 'FAILED') return 'fail';
    if (run.status === 'COMPLETED') return 'done';
    if (run.status === 'PENDING') return 'todo';
    return 'cur';
  }
  return 'todo';
}

const ND_CLS: Record<NodeState, string> = {
  done: 'n-done', cur: 'n-cur', block: 'n-block', fail: 'n-fail', skip: 'n-skip', todo: 'n-todo',
};
const SEG_CLS: Record<NodeState, string> = {
  done: 'fdone', cur: 'fcur', block: 'fblock', fail: 'ffail', skip: 'fskip', todo: 'ftodo',
};
const NL_CLS: Record<NodeState, string> = {
  done: 'cyan', cur: 'on', block: 'on', fail: 'on', skip: 'skip', todo: '',
};

// ── Status pill ───────────────────────────────────────────
type Kind = 'running' | 'blocked' | 'merged' | 'failed' | 'queued';
function kindOf(s: PipelineStatus, hasCheckpoint: boolean): Kind {
  if (s === 'PAUSED_AT_CHECKPOINT' || hasCheckpoint) return 'blocked';
  if (s === 'COMPLETED') return 'merged';
  if (s === 'FAILED' || s === 'CANCELLED') return 'failed';
  if (s === 'PENDING') return 'queued';
  return 'running';
}
const PILL: Record<Kind, { label: string; cls: string }> = {
  running: { label: 'RUNNING', cls: 'p-run' },
  blocked: { label: 'NEEDS YOU', cls: 'p-block' },
  merged: { label: 'MERGED', cls: 'p-done' },
  failed: { label: 'FAILED', cls: 'p-fail' },
  queued: { label: 'QUEUED', cls: 'p-queue' },
};

// ── Per-role task breakdown — Slice-3 binding (NOT in the API yet) ──
// The Planner-produced per-role task list has no DTO field today. We read an OPTIONAL
// `tasks` array off the role result so the panel binds the moment the backend ships it;
// until then `tasks` is always undefined and we render a labeled placeholder.
type TaskState = 'done' | 'running' | 'pending' | 'skip';
interface RoleTask { state: TaskState; label: string }
function tasksFor(result: RoleResultSummary | undefined): RoleTask[] | null {
  const maybe = (result as unknown as { tasks?: RoleTask[] } | undefined)?.tasks;
  return Array.isArray(maybe) && maybe.length > 0 ? maybe : null;
}
const TASK_ICON: Record<TaskState, string> = { done: '✓', running: '⟳', pending: '', skip: '⊘' };

// ── Event timeline rendering ──────────────────────────────
const EVENT_COLOR: Record<string, string> = {
  PIPELINE_STARTED: 'rgba(238,240,246,.4)',
  PIPELINE_COMPLETED: 'var(--cyan)',
  PIPELINE_FAILED: 'var(--red)',
  PIPELINE_CANCELLED: 'var(--red)',
  PIPELINE_RESUMED: 'var(--accent)',
  ROLE_STARTED: 'var(--accent)',
  ROLE_COMPLETED: 'var(--cyan)',
  ROLE_REJECTED: 'var(--amber)',
  ROLE_SKIPPED: 'var(--amber)',
  REWORK_TRIGGERED: 'var(--amber)',
  REWORK_COMPLETED: 'var(--cyan)',
  REWORK_ESCALATED: 'var(--amber)',
  ARTIFACT_PRODUCED: 'var(--cyan)',
  CHECKPOINT_REQUESTED: 'var(--amber)',
  CHECKPOINT_RESOLVED: 'var(--cyan)',
  CHECKPOINT_TIMEOUT_REMINDER: 'var(--amber)',
  PARALLEL_ROLES_STARTED: 'var(--accent)',
  COST_THRESHOLD_WARNING: 'var(--red)',
  COST_CEILING_REACHED: 'var(--red)',
};

function eventDesc(eventType: PipelineEventType, role: PdlcRole | null): string {
  const r = role ? (ROLE_LABEL[role] ?? role) : null;
  switch (eventType) {
    case 'PIPELINE_STARTED': return 'Pipeline started';
    case 'PIPELINE_COMPLETED': return 'Pipeline completed';
    case 'PIPELINE_FAILED': return 'Pipeline failed';
    case 'PIPELINE_CANCELLED': return 'Pipeline cancelled';
    case 'PIPELINE_RESUMED': return 'Pipeline resumed';
    case 'ROLE_STARTED': return r ? `${r} started` : 'Role started';
    case 'ROLE_COMPLETED': return r ? `${r} completed` : 'Role completed';
    case 'ROLE_REJECTED': return r ? `${r} rejected` : 'Role rejected';
    case 'ROLE_SKIPPED': return r ? `${r} skipped` : 'Role skipped';
    case 'REWORK_TRIGGERED': return r ? `Rework triggered for ${r}` : 'Rework triggered';
    case 'REWORK_COMPLETED': return r ? `${r} rework completed` : 'Rework completed';
    case 'REWORK_ESCALATED': return r ? `${r} rework escalated` : 'Rework escalated';
    case 'ARTIFACT_PRODUCED': return r ? `${r} produced artifact` : 'Artifact produced';
    case 'CHECKPOINT_REQUESTED': return r ? `Checkpoint requested by ${r}` : 'Checkpoint requested';
    case 'CHECKPOINT_RESOLVED': return 'Checkpoint resolved';
    case 'CHECKPOINT_TIMEOUT_REMINDER': return 'Checkpoint timeout reminder';
    case 'PARALLEL_ROLES_STARTED': return 'Parallel roles started';
    case 'COST_THRESHOLD_WARNING': return 'Cost threshold warning';
    case 'COST_CEILING_REACHED': return 'Cost ceiling reached';
    default: return eventType;
  }
}

// ── Live clock for the header "started Nm ago" + foot ──
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);
  return now;
}

// ── KPI strip ─────────────────────────────────────────────
function KpiStrip({ run, isActive }: { run: PipelineRun; isActive: boolean }) {
  useNow(isActive); // re-render elapsed every second while live
  const results = Object.values(run.roleResults ?? {});
  const done = results.filter((r) => r.status === 'COMPLETED').length;
  const reworks = results.reduce((sum, r) => sum + (r.iteration > 1 ? r.iteration - 1 : 0), 0);
  const total = (run.activatedRoles ?? []).length || sequenceFor(run).length;
  const elapsed = fmtElapsed(run.createdAt, isActive ? null : run.completedAt ?? run.updatedAt);
  return (
    <div className="summary">
      <div className="stat">
        <span className="sdot" style={{ background: 'var(--accent)', boxShadow: '0 0 9px var(--accent)' }} />
        <span className="n">{done}/{total}</span><span className="l">ROLES DONE</span>
      </div>
      <div className="stat">
        <span className="sdot" style={{ background: 'var(--cyan)', boxShadow: '0 0 9px var(--cyan)' }} />
        <span className="n cyan">${Number(run.totalCostUsd ?? 0).toFixed(2)}</span><span className="l">COST</span>
      </div>
      <div className="stat">
        <span className="sdot" style={{ background: 'var(--magenta)', boxShadow: '0 0 9px var(--magenta)' }} />
        <span className="n">{elapsed}</span><span className="l">ELAPSED</span>
      </div>
      <div className="stat">
        <span className="sdot" style={{ background: 'var(--amber)', boxShadow: '0 0 9px var(--amber)' }} />
        <span className={`n${reworks > 0 ? ' amber' : ''}`}>{reworks}</span><span className="l">REWORKS</span>
      </div>
    </div>
  );
}

// ── Role timeline strip ───────────────────────────────────
function RoleTimeline({
  run, sequence, selected, onSelect, isActive,
}: {
  run: PipelineRun;
  sequence: PdlcRole[];
  selected: PdlcRole;
  onSelect: (r: PdlcRole) => void;
  isActive: boolean;
}) {
  return (
    <div className="panel">
      <div className="phead">
        <div className="ptitle"><span className="tick" />ROLE TIMELINE</div>
        <span className={`ptag${isActive ? ' live' : ''}`}>{isActive ? 'LIVE' : 'RUN'}</span>
      </div>
      <div className="pbody">
        <div className="strip">
          {sequence.map((role, idx) => {
            const st = nodeStateFor(role, run);
            const result = run.roleResults?.[role];
            const rework = result && result.iteration > 1 ? result.iteration : null;
            const dur = fmtDuration(result?.durationMs);
            const model = shortModel(result?.model);
            const tok = fmtTokens(result?.tokens);
            const live = st === 'cur' || st === 'block';
            return (
              <div
                key={role + idx}
                className={`node${role === selected ? ' sel' : ''}`}
                data-role={role}
                onClick={() => onSelect(role)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(role); } }}
              >
                {idx > 0 && <span className={`seg ${SEG_CLS[st]}`} />}
                <span className={`nd ${ND_CLS[st]}`} />
                {rework && <span className="rew">×{rework - 1}</span>}
                <span className={`nl ${NL_CLS[st]}`}>{ROLE_LABEL[role] ?? role}</span>
                <div className="nmeta">
                  {st === 'skip' && <span className="mm">skipped</span>}
                  {live && <span className="mm live">{isActive ? 'active' : 'current'}</span>}
                  {dur && <span className="mm">{dur}</span>}
                  {model && <span className="mm">{model}</span>}
                  {tok && <span className="mm">{tok}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Per-persona task breakdown panel ──────────────────────
function TaskBreakdown({ role, result }: { role: PdlcRole; result: RoleResultSummary | undefined }) {
  const tasks = tasksFor(result);
  const done = tasks ? tasks.filter((t) => t.state === 'done').length : 0;
  const total = tasks ? tasks.filter((t) => t.state !== 'skip').length : 0;
  return (
    <div className="panel">
      <div className="phead">
        <div className="ptitle">
          <span className="tick" />TASK BREAKDOWN
          <span style={{ color: 'var(--accent)', marginLeft: 8, letterSpacing: 2 }}>{ROLE_FULL[role]}</span>
        </div>
        <span className="ptag">{tasks ? (total ? `${done} / ${total} DONE` : 'SKIPPED') : 'PENDING'}</span>
      </div>
      <div className="pbody">
        {tasks ? (
          <div className="tasks">
            {tasks.map((t, i) => (
              <div key={i} className={`task ${t.state}`}>
                <div className="tic">{TASK_ICON[t.state]}</div>
                <div className="tlabel">{t.label}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="tb-empty">
            <div className="tb-empty-h">TASK BREAKDOWN PENDING</div>
            <div className="tb-empty-p">
              Per-persona task checklists are produced by the PLANNER role and surface here once the
              pipeline projection ships them (Slice 3). This panel is wired and will populate
              automatically — no per-role task data is available for this run yet.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Live role log (left lower column) ─────────────────────
function RoleLog({ sparkId, run, isActive }: { sparkId: string; run: PipelineRun; isActive: boolean }) {
  const messages = useSparkProgressStore((s) => s.getProgress(sparkId));
  const logEndRef = useRef<HTMLDivElement>(null);
  const role = run.currentRole;
  const result = role ? run.roleResults?.[role] : undefined;

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages.length]);

  return (
    <div className="panel">
      <div className="phead">
        <div className="ahead">
          <span className="arole">{role ? ROLE_FULL[role] : 'PIPELINE'}</span>
          {result?.model && <span className="amodel">{result.model}</span>}
        </div>
        <span className={`ptag${isActive ? ' live' : ''}`}>{isActive ? 'STREAMING' : 'IDLE'}</span>
      </div>
      <div className="pbody">
        <div className="log">
          {messages.length === 0 && (
            <div className="ll"><span className="msg">{isActive ? '› Waiting for live progress…' : '› No live log for this run.'}</span></div>
          )}
          {messages.map((m, i) => {
            const cls = m.type === 'completed' ? 'ok'
              : m.type === 'failed' ? 'warn'
              : m.type === 'checkpoint' ? 'warn' : '';
            const ts = new Date(m.timestamp).toLocaleTimeString('en-US', { hour12: false });
            return (
              <div className="ll" key={m.id}>
                <span className="ts">{ts}</span>
                <span className={`msg ${cls}`}>
                  {m.message}
                  {isActive && i === messages.length - 1 && <span className="caret" />}
                </span>
              </div>
            );
          })}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
}

// ── Event timeline (right lower column) ───────────────────
function EventTimelinePanel({ events, isLoading }: { events: PipelineEvent[] | undefined; isLoading: boolean }) {
  const sorted = useMemo(
    () => (events ? [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) : []),
    [events],
  );
  return (
    <div className="panel">
      <div className="phead">
        <div className="ptitle"><span className="tick" />EVENT TIMELINE</div>
        <span className="ptag">RUN</span>
      </div>
      <div className="pbody">
        {isLoading && <div className="muted-small">Loading events…</div>}
        {!isLoading && sorted.length === 0 && <div className="muted-small">No events yet.</div>}
        {sorted.length > 0 && (
          <div className="tl">
            {sorted.map((ev) => {
              const meta = ev.metadata ?? {};
              const dur = typeof meta.durationMs === 'number' ? fmtDuration(meta.durationMs) : null;
              const tok = typeof meta.tokens === 'number' ? fmtTokens(meta.tokens) : null;
              const model = typeof meta.model === 'string' ? shortModel(meta.model) : null;
              const metaLine = [dur, model, tok ? `${tok} tok` : null].filter(Boolean).join(' · ');
              return (
                <div className="tle" key={ev.id}>
                  <div className="tld" style={{ background: EVENT_COLOR[ev.eventType] ?? 'var(--accent)' }} />
                  <div className="tldesc">{eventDesc(ev.eventType, ev.role)}</div>
                  <div className="tlts">{fmtClock(ev.timestamp)}</div>
                  {metaLine && <span className="tlmeta">{metaLine}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Role artifact tabs ────────────────────────────────────
function extractMarkdown(content: Record<string, unknown>): string | null {
  for (const key of ['markdown', 'body', 'content', 'text']) {
    const v = content[key];
    if (typeof v === 'string' && v.trim().length > 0) return v;
  }
  return null;
}

function ArtifactBody({ sparkId, role }: { sparkId: string; role: PdlcRole }) {
  const { data: artifact, isLoading, isError } = useRoleArtifact(sparkId, role);
  if (isLoading) return <div className="muted-small">Loading artifact…</div>;
  if (isError || !artifact) return <div className="muted-small">No artifact available for {ROLE_FULL[role]}.</div>;
  // Prefer the artifact's real markdown body. For legacy structured-only artifacts
  // (no markdown), render the JSON inside a fenced code block so it flows through the
  // shared ArtifactMarkdown renderer — the raw <pre> JSON-path dump is gone.
  const markdown = extractMarkdown(artifact.content ?? {});
  const body = markdown ?? '```json\n' + JSON.stringify(artifact.content ?? {}, null, 2) + '\n```';
  return (
    <div className="abody">
      <div className="ameta">
        {artifact.content?.model != null && <span className="chipsm model">{String(artifact.content.model)}</span>}
        <span className="chipsm">{artifact.artifactType} · v{artifact.artifactVersion}</span>
      </div>
      <ArtifactMarkdown markdown={body} tag={`${ROLE_FULL[role]} · v${artifact.artifactVersion}`} />
    </div>
  );
}

function ArtifactTabsPanel({ sparkId, run, sequence, onOpenViewer }: { sparkId: string; run: PipelineRun; sequence: PdlcRole[]; onOpenViewer: () => void }) {
  const enabledRoles = sequence.filter((r) => {
    const res = run.roleResults?.[r];
    return res && (res.status === 'COMPLETED' || res.artifactId != null);
  });
  const [tab, setTab] = useState<PdlcRole | null>(enabledRoles[enabledRoles.length - 1] ?? null);
  const active = tab && enabledRoles.includes(tab) ? tab : (enabledRoles[enabledRoles.length - 1] ?? null);
  return (
    <>
      <div className="eyebrow">
        ROLE ARTIFACTS
        <a className="viewer-link" onClick={onOpenViewer} role="button" tabIndex={0}
           onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenViewer(); } }}>
          OPEN ARTIFACTS VIEWER →
        </a>
      </div>
      <div className="panel">
        <div className="pbody">
          <div className="tabs">
            {sequence.map((role) => {
              const res = run.roleResults?.[role];
              const enabled = !!res && (res.status === 'COMPLETED' || res.artifactId != null);
              const tok = fmtTokens(res?.tokens);
              return (
                <button
                  key={role}
                  type="button"
                  className={`tab${role === active ? ' active' : ''}${enabled ? '' : ' disabled'}`}
                  disabled={!enabled}
                  onClick={() => enabled && setTab(role)}
                >
                  {ROLE_LABEL[role] ?? role}{tok && <span className="tok">{tok}</span>}
                </button>
              );
            })}
          </div>
          {active
            ? <ArtifactBody sparkId={sparkId} role={active} />
            : <div className="muted-small" style={{ marginTop: 16 }}>No role artifacts produced yet.</div>}
        </div>
      </div>
    </>
  );
}

// ── Header ────────────────────────────────────────────────
const TYPE_LABEL: Record<string, string> = {
  code: 'CODE', social: 'SOCIAL', research: 'RESEARCH', devops: 'DEVOPS', creative: 'CREATIVE', data: 'DATA',
};

function titleParts(title: string): { lead: string; tail: string } {
  const t = (title ?? '').trim();
  if (!t) return { lead: 'PIPELINE', tail: '' };
  const sp = t.lastIndexOf(' ');
  if (sp <= 0) return { lead: t.toUpperCase(), tail: '' };
  return { lead: t.slice(0, sp).toUpperCase(), tail: t.slice(sp + 1).toUpperCase() };
}

// ── Full-bleed HUD shell (chrome + breadcrumb + foot) ─────
function Shell({ children, runId, onBack }: { children: React.ReactNode; runId?: string; onBack: () => void }) {
  return (
    <div className="dash-root">
      <style>{CSS}</style>
      <div className="grid-bg" />
      <div className="scan" />
      <HudTopbar active="dashboard" />
      <div className="stage">
        <div className="crumbs">
          <a onClick={onBack}>DASHBOARD</a>
          <span className="arr">›</span>
          <span className="here">PIPELINE</span>
        </div>
        {children}
        <div style={{ height: 28 }} />
        <div className="foot">TACTICL HUD · PDLC PIPELINE ENGINE{runId ? ` · ${runId}` : ''}</div>
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────
export default function SparkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sparkId = id ?? '';

  const { data: spark, isLoading, isError, refetch } = useSpark(sparkId);
  const { data: run } = usePipelineRun(sparkId);
  const isActive = run != null && ['PENDING', 'RUNNING', 'PAUSED_AT_CHECKPOINT'].includes(run.status);
  const { data: events, isLoading: eventsLoading } = usePipelineEvents(sparkId, isActive);
  const cancelSpark = useCancelSpark();

  const sequence = useMemo(() => (run ? sequenceFor(run) : []), [run]);
  const [selectedRole, setSelectedRole] = useState<PdlcRole | null>(null);
  // Default selection follows the current role (or first node) until the user clicks.
  const effectiveSelected: PdlcRole | null = selectedRole && sequence.includes(selectedRole)
    ? selectedRole
    : (run?.currentRole ?? sequence[0] ?? null);

  if (!id) return <Navigate to="/dashboard" replace />;

  const goBack = () => navigate('/dashboard');

  if (isLoading) {
    return <Shell runId={run?.id} onBack={goBack}><div className="state-msg">Loading pipeline…</div></Shell>;
  }
  if (isError || !spark) {
    return (
      <Shell runId={run?.id} onBack={goBack}>
        <div className="state-msg err">
          Failed to load this spark.
          <button type="button" className="btn btn-ghost" style={{ marginLeft: 14 }} onClick={() => refetch()}>RETRY</button>
        </div>
      </Shell>
    );
  }

  const kind = run ? kindOf(run.status, !!run.currentCheckpointId) : null;
  const pill = kind ? PILL[kind] : null;
  const { lead, tail } = titleParts(spark.title);
  const canCancel = ['PENDING', 'ROUTING', 'EXECUTING', 'CHECKPOINT'].includes(spark.status);

  return (
    <Shell runId={run?.id} onBack={goBack}>
      {/* header: title + status/type/playbook/priority badges */}
      <div className="head">
        <div>
          {run && <div className="runid">{run.id}</div>}
          <h1 className="h1">{lead}{tail && <> <span className="b">{tail}</span></>}</h1>
          <div className="sub">
            <strong>{spark.deviceId ? 'device' : 'arbiter'}</strong>
            {run && <> · started {relTime(run.createdAt)}</>}
          </div>
        </div>
        <div className="badges">
          {pill && <span className={`pill ${pill.cls}`}><span className="pdot" />{pill.label}</span>}
          {spark.type && <span className="pill p-type">{TYPE_LABEL[spark.type] ?? spark.type.toUpperCase()}</span>}
          {run && <span className="pill p-book">{run.playbook.replace(/_/g, ' ')}</span>}
          <span className="pill p-prio">{spark.priority}</span>
        </div>
      </div>

      {!run ? (
        <div className="panel">
          <div className="pbody">
            <div className="state-msg">
              This spark has no PDLC pipeline run. It may be a simple cloud/device spark, or the pipeline projection is still being created.
            </div>
          </div>
        </div>
      ) : (
        <>
          <KpiStrip run={run} isActive={isActive} />

          <RoleTimeline
            run={run}
            sequence={sequence}
            selected={effectiveSelected ?? sequence[0]}
            onSelect={setSelectedRole}
            isActive={isActive}
          />

          {effectiveSelected && (
            <TaskBreakdown role={effectiveSelected} result={run.roleResults?.[effectiveSelected]} />
          )}

          <div className="twocol">
            <RoleLog sparkId={spark.id} run={run} isActive={isActive} />
            <EventTimelinePanel events={events} isLoading={eventsLoading} />
          </div>

          {/* controls */}
          <div className="panel">
            <div className="pbody controls">
              <div className="cleft">
                {isActive && <span className="crun"><span className="pdot" />{run.status === 'PAUSED_AT_CHECKPOINT' ? 'PAUSED' : 'RUNNING'}</span>}
                <span>
                  {run.currentRole ? `${ROLE_FULL[run.currentRole]} · ` : ''}
                  {run.currentCheckpointId ? 'merge gate pending' : run.failureReason ? run.failureReason : `${run.status.replace(/_/g, ' ').toLowerCase()}`}
                </span>
              </div>
              <div className="cright">
                {canCancel && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={cancelSpark.isPending}
                    onClick={() => cancelSpark.mutate(spark.id)}
                  >
                    {cancelSpark.isPending ? 'CANCELLING…' : 'CANCEL'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <ArtifactTabsPanel sparkId={spark.id} run={run} sequence={sequence} onOpenViewer={() => navigate(`/sparks/${spark.id}/artifacts`)} />
        </>
      )}
    </Shell>
  );
}

// ── HUD CSS — lifted from the spark-detail.html mockup (token block reused 1:1 with
// DashboardPage so the chrome cannot drift). ──
const CSS = `
.dash-root{position:fixed;inset:0;overflow-y:auto;color:#eef0f6;font-family:var(--mono);letter-spacing:.2px;
  --accent:#6C63FF;--magenta:#B25CFF;--cyan:#15E0C8;--red:#FF6B6B;--amber:#F5B544;
  --ink:#070a0c;--glass1:rgba(22,28,34,.66);--glass2:rgba(11,15,19,.66);
  --disp:"Chakra Petch",sans-serif;--mono:"JetBrains Mono",ui-monospace,monospace;--line:rgba(108,99,255,.14);
  background:radial-gradient(1300px 820px at 50% -8%,rgba(108,99,255,.16),transparent 58%),
    radial-gradient(1000px 760px at 92% 110%,rgba(178,92,255,.10),transparent 60%),
    radial-gradient(760px 620px at 4% 18%,rgba(21,224,200,.06),transparent 60%),var(--ink);}
.dash-root .grid-bg{position:fixed;inset:0;pointer-events:none;opacity:.45;z-index:0;
  background-image:linear-gradient(rgba(108,99,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(108,99,255,.06) 1px,transparent 1px);
  background-size:54px 54px;-webkit-mask-image:radial-gradient(ellipse 80% 70% at 50% 32%,#000 35%,transparent 78%);
  mask-image:radial-gradient(ellipse 80% 70% at 50% 32%,#000 35%,transparent 78%);}
.dash-root .scan{position:fixed;left:0;right:0;height:160px;z-index:1;pointer-events:none;
  background:linear-gradient(rgba(108,99,255,.07),transparent);animation:dscan 8s linear infinite;}
@keyframes dscan{0%{transform:translateY(-160px)}100%{transform:translateY(100vh)}}
@keyframes dhalo{0%{transform:scale(.5);opacity:.9}100%{transform:scale(2.1);opacity:0}}
@keyframes dblink{0%,100%{opacity:1}50%{opacity:.35}}
.dash-root .stage{position:relative;z-index:2}

.dash-root .crumbs{padding:8px 34px 0;display:flex;align-items:center;gap:10px;font-family:var(--disp);font-size:11.9px;letter-spacing:2px}
.dash-root .crumbs a{color:rgba(170,165,255,.9);text-decoration:none;transition:.18s;cursor:pointer}
.dash-root .crumbs a:hover{color:#fff;text-shadow:0 0 12px rgba(108,99,255,.5)}
.dash-root .crumbs .arr{color:var(--accent)}
.dash-root .crumbs .here{color:rgba(238,240,246,.5)}

.dash-root .head{padding:14px 34px 2px;display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:14px}
.dash-root .h1{font-family:var(--disp);font-size:33.9px;letter-spacing:6px;font-weight:600;margin:0;line-height:1}
.dash-root .h1 .b{background:linear-gradient(90deg,var(--accent),var(--magenta));-webkit-background-clip:text;background-clip:text;color:transparent}
.dash-root .runid{font-family:var(--mono);font-size:12.4px;color:rgba(238,240,246,.4);letter-spacing:2px;margin-bottom:9px;word-break:break-all}
.dash-root .sub{font-size:12.4px;color:rgba(238,240,246,.4);letter-spacing:3px;margin-top:9px;display:flex;gap:8px;align-items:center}
.dash-root .sub strong{color:#eef0f6;font-weight:600;letter-spacing:.4px}
.dash-root .badges{display:flex;gap:9px;flex-wrap:wrap;align-items:center}

.dash-root .pill{font-family:var(--disp);font-size:10.7px;letter-spacing:1.3px;padding:5px 11px;border-radius:999px;white-space:nowrap;display:inline-flex;align-items:center;gap:6px;text-transform:uppercase}
.dash-root .pdot{width:6px;height:6px;border-radius:50%}
.dash-root .p-run{color:#bdb8ff;border:1px solid var(--accent);background:rgba(108,99,255,.13)} .dash-root .p-run .pdot{background:var(--accent);box-shadow:0 0 8px var(--accent);animation:dblink 1.3s ease-in-out infinite}
.dash-root .p-block{color:#ffd99a;border:1px solid var(--amber);background:rgba(245,181,68,.12)} .dash-root .p-block .pdot{background:var(--amber);box-shadow:0 0 8px var(--amber);animation:dblink 1s ease-in-out infinite}
.dash-root .p-done{color:#8ff0e4;border:1px solid var(--cyan);background:rgba(21,224,200,.1)} .dash-root .p-done .pdot{background:var(--cyan);box-shadow:0 0 8px var(--cyan)}
.dash-root .p-fail{color:#ffb0b0;border:1px solid var(--red);background:rgba(255,107,107,.12)} .dash-root .p-fail .pdot{background:var(--red)}
.dash-root .p-queue{color:rgba(238,240,246,.5);border:1px solid rgba(238,240,246,.2);background:rgba(255,255,255,.03)} .dash-root .p-queue .pdot{background:rgba(238,240,246,.35)}
.dash-root .p-type{color:#d6b8ff;border:1px solid rgba(178,92,255,.5);background:rgba(178,92,255,.12)}
.dash-root .p-book{color:rgba(238,240,246,.66);border:1px solid var(--line);background:rgba(255,255,255,.03)}
.dash-root .p-prio{color:#ffd99a;border:1px solid var(--amber);background:rgba(245,181,68,.1)}

.dash-root .summary{display:flex;gap:12px;flex-wrap:wrap;margin:16px 34px 0}
.dash-root .stat{display:flex;align-items:center;gap:10px;padding:13px 18px;border-radius:12px;border:1px solid var(--line);background:linear-gradient(180deg,var(--glass1),var(--glass2));backdrop-filter:blur(16px);flex:1;min-width:140px;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.04),0 8px 28px rgba(0,0,0,.35);transition:border-color .18s,box-shadow .18s}
.dash-root .stat:hover{border-color:rgba(108,99,255,.32);box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 10px 32px rgba(0,0,0,.4)}
.dash-root .stat .n{font-family:var(--disp);font-size:23.7px;font-weight:600}
.dash-root .stat .n.cyan{color:var(--cyan);text-shadow:0 0 16px rgba(21,224,200,.35)}
.dash-root .stat .n.amber{color:var(--amber)}
.dash-root .stat .l{font-size:10.7px;letter-spacing:1.6px;color:rgba(238,240,246,.42)}
.dash-root .sdot{width:8px;height:8px;border-radius:50%}

.dash-root .panel{margin:16px 34px 0;border:1px solid var(--line);border-radius:16px;overflow:hidden;
  background:linear-gradient(180deg,var(--glass1),var(--glass2));backdrop-filter:blur(18px);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.04),inset 0 0 60px rgba(108,99,255,.04),0 18px 60px rgba(0,0,0,.55);position:relative}
.dash-root .panel::before,.dash-root .panel::after{content:"";position:absolute;width:18px;height:18px;border:0 solid rgba(108,99,255,.6);pointer-events:none;z-index:3}
.dash-root .panel::before{top:8px;left:8px;border-top-width:1.5px;border-left-width:1.5px}
.dash-root .panel::after{bottom:8px;right:8px;border-bottom-width:1.5px;border-right-width:1.5px}
.dash-root .phead{display:flex;align-items:center;justify-content:space-between;padding:14px 22px 13px;border-bottom:1px solid var(--line);
  background:linear-gradient(180deg,rgba(108,99,255,.05),transparent)}
.dash-root .ptitle{display:flex;align-items:center;gap:9px;font-family:var(--disp);font-size:12.4px;letter-spacing:2.5px;color:#eef0f6;font-weight:600}
.dash-root .ptitle .tick{width:3px;height:13px;border-radius:2px;background:var(--accent);box-shadow:0 0 8px var(--accent)}
.dash-root .ptag{font-family:var(--mono);font-size:10.7px;letter-spacing:1.5px;color:var(--accent);padding:2px 9px;border:1px solid rgba(108,99,255,.3);border-radius:999px;background:rgba(108,99,255,.06)}
.dash-root .ptag.live{color:#8ff0e4;border-color:rgba(21,224,200,.3);box-shadow:0 0 12px rgba(21,224,200,.12)}
.dash-root .ptag.live::before{content:"● "}
.dash-root .pbody{padding:20px 22px}

.dash-root .strip{display:flex;align-items:flex-start;position:relative;padding:8px 4px 4px;overflow-x:auto}
.dash-root .strip::-webkit-scrollbar{height:6px}
.dash-root .strip::-webkit-scrollbar-thumb{background:rgba(108,99,255,.25);border-radius:3px}
.dash-root .node{display:flex;flex-direction:column;align-items:center;gap:8px;flex:1;position:relative;min-width:74px;cursor:pointer;transition:.15s}
.dash-root .node:hover .nl{color:#fff}
.dash-root .node.sel .nl{color:#fff;text-shadow:0 0 10px rgba(108,99,255,.6)}
.dash-root .node.sel .nd{box-shadow:0 0 0 4px rgba(108,99,255,.22)}
.dash-root .seg{position:absolute;top:6px;left:-50%;width:100%;height:2px;z-index:0}
.dash-root .seg.fdone{background:var(--cyan)}
.dash-root .seg.fcur{background:linear-gradient(90deg,var(--cyan),var(--accent))}
.dash-root .seg.fblock{background:linear-gradient(90deg,var(--cyan),var(--amber))}
.dash-root .seg.ffail{background:linear-gradient(90deg,var(--cyan),var(--red))}
.dash-root .seg.ftodo{background:rgba(238,240,246,.12)}
.dash-root .seg.fskip{background:repeating-linear-gradient(90deg,rgba(245,181,68,.5) 0 5px,transparent 5px 10px)}
.dash-root .nd{width:13px;height:13px;border-radius:50%;position:relative;z-index:1}
.dash-root .n-done{background:var(--cyan);box-shadow:0 0 9px rgba(21,224,200,.7)}
.dash-root .n-cur{background:var(--accent);box-shadow:0 0 12px var(--accent);animation:dblink 1.25s ease-in-out infinite}
.dash-root .n-cur::after{content:"";position:absolute;inset:-6px;border-radius:50%;border:1.5px solid var(--accent);animation:dhalo 1.8s ease-out infinite}
.dash-root .n-block{background:var(--amber);box-shadow:0 0 12px var(--amber);animation:dblink 1s ease-in-out infinite}
.dash-root .n-block::after{content:"";position:absolute;inset:-6px;border-radius:50%;border:1.5px solid var(--amber);animation:dhalo 1.6s ease-out infinite}
.dash-root .n-fail{background:var(--red);box-shadow:0 0 9px var(--red)}
.dash-root .n-todo{background:rgba(238,240,246,.16);border:1px solid rgba(238,240,246,.2)}
.dash-root .n-skip{background:rgba(245,181,68,.22);border:1px solid var(--amber)}
.dash-root .rew{position:absolute;top:-8px;right:-10px;z-index:2;background:var(--amber);color:#1a1305;font-family:var(--mono);font-size:9px;font-weight:700;border-radius:7px;padding:1px 4px;line-height:1.2;box-shadow:0 0 8px rgba(245,181,68,.6)}
.dash-root .nl{font-size:10.2px;letter-spacing:.3px;color:rgba(238,240,246,.34);white-space:nowrap;text-align:center;font-family:var(--disp)}
.dash-root .nl.on{color:#eef0f6}
.dash-root .nl.cyan{color:#8ff0e4}
.dash-root .nl.skip{color:#ffd99a;text-decoration:line-through}
.dash-root .nmeta{display:flex;flex-direction:column;align-items:center;gap:1px;margin-top:2px}
.dash-root .nmeta .mm{font-size:9.6px;color:rgba(238,240,246,.34);line-height:1.35;white-space:nowrap}
.dash-root .nmeta .mm.live{color:var(--magenta)}

.dash-root .tasks{display:flex;flex-direction:column;gap:1px}
.dash-root .task{display:flex;align-items:flex-start;gap:13px;padding:11px 6px;border-bottom:1px solid rgba(108,99,255,.06)}
.dash-root .task:last-child{border-bottom:none}
.dash-root .task .tic{width:20px;height:20px;border-radius:6px;flex:none;display:grid;place-items:center;font-size:11.3px;margin-top:1px;border:1px solid rgba(238,240,246,.18);color:rgba(238,240,246,.4)}
.dash-root .task.done .tic{border-color:var(--cyan);color:var(--cyan);background:rgba(21,224,200,.1)}
.dash-root .task.running .tic{border-color:var(--amber);color:var(--amber);background:rgba(245,181,68,.13);animation:tspin 1.6s linear infinite}
.dash-root .task.skip .tic{opacity:.45}
@keyframes tspin{to{transform:rotate(360deg)}}
.dash-root .task .tlabel{font-family:var(--mono);font-size:13px;line-height:1.45;color:#eef0f6}
.dash-root .task.done .tlabel{color:rgba(238,240,246,.6)}
.dash-root .task.pending .tlabel{color:rgba(238,240,246,.5)}
.dash-root .task.skip .tlabel{color:rgba(238,240,246,.38);text-decoration:line-through}
.dash-root .tb-empty{padding:6px 2px}
.dash-root .tb-empty-h{font-family:var(--disp);font-size:11.3px;letter-spacing:2px;color:var(--amber);margin-bottom:8px}
.dash-root .tb-empty-p{font-family:var(--mono);font-size:12.4px;line-height:1.6;color:rgba(238,240,246,.5);max-width:760px}

.dash-root .twocol{display:grid;grid-template-columns:1.25fr .85fr;gap:0;margin:16px 34px 0}
.dash-root .twocol .panel{margin:0}
.dash-root .twocol .panel:first-child{border-top-right-radius:0;border-bottom-right-radius:0;border-right:none}
.dash-root .twocol .panel:last-child{border-top-left-radius:0;border-bottom-left-radius:0}
@media (max-width:900px){.dash-root .twocol{grid-template-columns:1fr}.dash-root .twocol .panel:first-child{border-right:1px solid var(--line);border-radius:16px 16px 0 0}.dash-root .twocol .panel:last-child{border-radius:0 0 16px 16px;border-top:none}}

.dash-root .ahead{display:flex;align-items:center;gap:10px;min-width:0}
.dash-root .arole{font-family:var(--disp);font-size:15.8px;letter-spacing:1px;color:#eef0f6;font-weight:600}
.dash-root .amodel{font-family:var(--mono);font-size:10.7px;color:#bdb8ff;background:rgba(108,99,255,.15);border:1px solid rgba(108,99,255,.3);border-radius:6px;padding:3px 9px;box-shadow:0 0 10px rgba(108,99,255,.1);white-space:nowrap}
.dash-root .log{font-family:var(--mono);font-size:13.6px;background:rgba(7,10,12,.7);border:1px solid var(--line);border-radius:10px;padding:15px 17px;max-height:236px;overflow-y:auto;line-height:1.8;
  box-shadow:inset 0 0 30px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.03)}
.dash-root .log::-webkit-scrollbar{width:6px}
.dash-root .log::-webkit-scrollbar-thumb{background:rgba(108,99,255,.25);border-radius:3px}
.dash-root .ll{display:flex;gap:9px}
.dash-root .ll .ts{color:rgba(238,240,246,.28);flex-shrink:0}
.dash-root .ll .msg{color:rgba(238,240,246,.62);white-space:pre-wrap;word-break:break-word}
.dash-root .ll .msg.ok{color:#8ff0e4}
.dash-root .ll .msg.tool{color:var(--cyan)}
.dash-root .ll .msg.warn{color:var(--amber)}
.dash-root .caret{display:inline-block;width:7px;height:1em;background:var(--accent);margin-left:3px;vertical-align:text-bottom;animation:dcaret 1s step-end infinite}
@keyframes dcaret{0%,100%{opacity:1}50%{opacity:0}}

.dash-root .tl{position:relative;padding-left:18px}
.dash-root .tl::before{content:"";position:absolute;left:3px;top:4px;bottom:4px;width:1px;background:linear-gradient(180deg,rgba(108,99,255,.22),rgba(238,240,246,.08) 60%,transparent)}
.dash-root .tle{position:relative;margin-bottom:16px;padding-left:14px}
.dash-root .tle:last-child{margin-bottom:0}
.dash-root .tld{position:absolute;left:-11px;top:5px;width:8px;height:8px;border-radius:50%;box-shadow:0 0 7px rgba(108,99,255,.45)}
.dash-root .tldesc{font-size:14.1px;line-height:1.4;color:#eef0f6}
.dash-root .tlts{font-size:11.3px;color:rgba(238,240,246,.34)}
.dash-root .tlmeta{font-size:11.3px;color:rgba(238,240,246,.34);display:block;margin-top:1px}

.dash-root .controls{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.dash-root .cleft{display:flex;align-items:center;gap:14px;font-size:13.6px;color:rgba(238,240,246,.5)}
.dash-root .cleft span{text-transform:capitalize}
.dash-root .crun{display:inline-flex;align-items:center;gap:8px;font-family:var(--disp);font-size:12.4px;letter-spacing:1.6px;color:#8ff0e4;text-transform:none}
.dash-root .crun .pdot{width:7px;height:7px;border-radius:50%;background:var(--cyan);box-shadow:0 0 10px var(--cyan);animation:dblink 1.5s ease-in-out infinite}
.dash-root .cright{display:flex;gap:10px}
.dash-root .btn{font-family:var(--disp);font-size:11.9px;letter-spacing:1.6px;border-radius:10px;padding:9px 17px;cursor:pointer;transition:.18s;border:1px solid transparent}
.dash-root .btn:disabled{opacity:.5;cursor:default}
.dash-root .btn-ghost{color:#eef0f6;border-color:var(--line);background:rgba(108,99,255,.06)}
.dash-root .btn-ghost:hover{background:rgba(108,99,255,.14);border-color:var(--accent)}
.dash-root .btn-primary{color:#fff;border-color:var(--accent);background:rgba(108,99,255,.2);box-shadow:0 0 18px rgba(108,99,255,.3)}
.dash-root .btn-primary:hover{background:rgba(108,99,255,.32)}

.dash-root .tabs{display:flex;gap:4px;overflow-x:auto;border-bottom:1px solid var(--line)}
.dash-root .tabs::-webkit-scrollbar{height:4px}
.dash-root .tabs::-webkit-scrollbar-thumb{background:rgba(108,99,255,.25)}
.dash-root .tab{display:inline-flex;align-items:center;gap:6px;font-family:var(--mono);font-size:13.6px;color:rgba(238,240,246,.5);padding:11px 15px;border-bottom:2px solid transparent;cursor:pointer;white-space:nowrap;transition:color .15s,background .15s;background:none;border-top:none;border-left:none;border-right:none}
.dash-root .tab:hover{color:#eef0f6;background:rgba(108,99,255,.05)}
.dash-root .tab.active{color:#fff;border-bottom-color:var(--accent);box-shadow:0 2px 12px -4px var(--accent)}
.dash-root .tab.disabled{opacity:.3;cursor:default}
.dash-root .tab .tok{font-size:11.3px;color:#8ff0e4}
.dash-root .abody{margin-top:16px}
.dash-root .ameta{display:flex;gap:7px;margin-bottom:14px;flex-wrap:wrap}
.dash-root .chipsm{font-size:11.3px;border-radius:6px;padding:3px 9px;border:1px solid var(--line);color:rgba(238,240,246,.5);background:rgba(255,255,255,.025)}
.dash-root .chipsm.model{color:#bdb8ff;background:rgba(108,99,255,.15);border-color:rgba(108,99,255,.3)}
.dash-root .md{background:rgba(7,10,12,.7);border:1px solid var(--line);border-radius:12px;overflow:hidden;box-shadow:inset 0 1px 0 rgba(255,255,255,.03),0 10px 30px rgba(0,0,0,.3)}
.dash-root .mdhead{display:flex;align-items:center;justify-content:space-between;padding:11px 16px;background:linear-gradient(180deg,rgba(108,99,255,.08),rgba(108,99,255,.04));border-bottom:1px solid var(--line)}
.dash-root .mdtag{font-family:var(--disp);font-size:11.3px;letter-spacing:1.6px;color:#8ff0e4}
.dash-root .mdmeta{font-size:11.3px;color:rgba(238,240,246,.34)}
.dash-root .mdbody{padding:18px 20px;font-size:14.7px;line-height:1.75;color:#eef0f6}
.dash-root .md-pre{font-family:var(--mono);font-size:13px;line-height:1.65;color:rgba(238,240,246,.86);white-space:pre-wrap;word-break:break-word;margin:0}

.dash-root .eyebrow{padding:18px 34px 0;font-family:var(--disp);font-size:11.3px;letter-spacing:2.5px;color:rgba(238,240,246,.4);display:flex;align-items:center;gap:9px}
.dash-root .eyebrow::before{content:"";width:7px;height:7px;background:var(--accent);box-shadow:0 0 10px var(--accent);clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)}
.dash-root .viewer-link{margin-left:auto;font-family:var(--disp);font-size:11.3px;letter-spacing:1.6px;color:#cfa0ff;cursor:pointer;text-decoration:none;border:1px solid rgba(108,99,255,.4);border-radius:8px;padding:6px 13px;background:rgba(108,99,255,.06);transition:.16s;outline:none}
.dash-root .viewer-link:hover{color:#fff;background:rgba(108,99,255,.16);border-color:var(--accent)}
.dash-root .viewer-link:focus-visible{box-shadow:0 0 0 2px var(--accent)}
.dash-root .foot{text-align:center;color:rgba(238,240,246,.3);font-size:11.3px;letter-spacing:2px;margin:34px 0 8px;font-family:var(--disp);word-break:break-all;padding:0 34px}

.dash-root .muted-small{font-size:12.5px;color:rgba(238,240,246,.5);font-family:var(--mono)}
.dash-root .state-msg{margin:24px 34px;padding:28px 22px;text-align:center;font-size:13.5px;color:rgba(238,240,246,.6);font-family:var(--mono);border:1px solid var(--line);border-radius:14px;background:linear-gradient(180deg,var(--glass1),var(--glass2));display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:6px}
.dash-root .state-msg.err{color:#ffb0b0}
`;
