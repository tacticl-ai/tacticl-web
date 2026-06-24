// src/pages/ArtifactsPage.tsx
// Standalone PDLC ARTIFACT VIEWER — the live re-skin of docs/mockups/artifacts.html.
// Two-pane HUD: a LEFT RAIL grouped into three sections —
//   • "Discovery & Design"  (PO, Researcher, Architect, Designer, Planner)
//   • a FOLDED "MERGE REVIEW" bundle (Implementer / Tester / Security Analyst)
//   • "Review & Release"    (Reviewer, Tech-Writer, DevOps, Retro)
// — each row carrying an icon, name, file-path sub-label and status dot driven by
// the manifest. The MAIN PANE renders the selected artifact as rich markdown via
// the reused <ArtifactMarkdown> (which also produces the "ON THIS PAGE" outline).
// The merge bundle renders an approve / request-changes banner (wired to the real
// checkpoint resolve, read-only unless a checkpoint is pending) + three sub-tabs.
//
// Wired to real pipeline data:
//   • manifest / rail            ← GET /v1/sparks/{id}/pipeline/artifacts (ArtifactListItem[])
//   • selected artifact content  ← GET /v1/sparks/{id}/pipeline/artifacts/{name}/content
//   • header meta + checkpoint   ← GET /v1/sparks/{id}/pipeline (PipelineRun)
//   • merge banner approve/req   ← POST /v1/sparks/{id}/pipeline/checkpoint/{checkpointId}
//
// Honest states only: loading, error, and an explicit "artifact pending — this role
// hasn't produced output yet" placeholder when present=false / empty content. No
// fabricated artifact bodies.
import { useMemo, useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import HudTopbar from '../components/hud/HudTopbar';
import ArtifactMarkdown from '../components/sparks/pdlc/ArtifactMarkdown';
import { useSpark } from '../hooks/useSparks';
import {
  usePipelineRun,
  useArtifactList,
  useArtifactContent,
  useResolveCheckpoint,
} from '../hooks/usePipeline';
import { ApiError } from '../api/client';
import type {
  ArtifactListItem,
  ArtifactStatus,
  PdlcRole,
  PipelineRun,
} from '../api/types';

// ── Role display metadata (icon glyph + accent colour) lifted 1:1 from the mockup ──
interface RoleMeta {
  icon: string;
  color: string;
  /** Full human label used in the role pill / fallbacks. */
  label: string;
}
const ROLE_META: Record<PdlcRole, RoleMeta> = {
  PO: { icon: 'PO', color: '#6C63FF', label: 'Product Owner' },
  RESEARCHER: { icon: 'RSCH', color: '#15E0C8', label: 'Researcher' },
  ARCHITECT: { icon: 'ARCH', color: '#B25CFF', label: 'Architect' },
  DESIGNER: { icon: 'DSGN', color: '#F48FB1', label: 'Designer' },
  PLANNER: { icon: 'PLAN', color: '#64B5F6', label: 'Planner' },
  IMPLEMENTER: { icon: 'IMPL', color: '#15E0C8', label: 'Implementer' },
  REVIEWER: { icon: 'REV', color: '#81C784', label: 'Reviewer' },
  TESTER: { icon: 'TEST', color: '#4FC3F7', label: 'Tester' },
  SECURITY_ANALYST: { icon: 'SEC', color: '#FF6B6B', label: 'Security Analyst' },
  TECHNICAL_WRITER: { icon: 'DOCS', color: '#FFB74D', label: 'Technical Writer' },
  DEVOPS: { icon: 'OPS', color: '#F5B544', label: 'DevOps' },
  RETRO_ANALYST: { icon: 'RETRO', color: '#A39FC4', label: 'Retro Analyst' },
};
// Fallback for manifest entries whose agent maps to no known PDLC role (role:null).
const UNKNOWN_META: RoleMeta = { icon: 'DOC', color: '#A39FC4', label: 'Artifact' };

function metaFor(role: PdlcRole | null): RoleMeta {
  return role ? ROLE_META[role] : UNKNOWN_META;
}

// ── Rail grouping (mirrors the mockup's three sections + folded bundle) ──
const DISCOVERY_ROLES: PdlcRole[] = ['PO', 'RESEARCHER', 'ARCHITECT', 'DESIGNER', 'PLANNER'];
const BUNDLE_ROLES: PdlcRole[] = ['IMPLEMENTER', 'TESTER', 'SECURITY_ANALYST'];
const RELEASE_ROLES: PdlcRole[] = ['REVIEWER', 'TECHNICAL_WRITER', 'DEVOPS', 'RETRO_ANALYST'];

const STATUS_CLS: Record<ArtifactStatus, string> = { done: 'done', active: 'active', pending: 'pend' };

/** The sub-label under a rail row: prefer the committed repo path's basename, else the file stem. */
function subLabel(e: ArtifactListItem): string {
  if (e.path) {
    const base = e.path.split('/').pop();
    if (base) return base;
  }
  return `${e.name}.md`;
}

// ── Page ──────────────────────────────────────────────────
export default function ArtifactsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sparkId = id ?? '';

  const { data: spark } = useSpark(sparkId);
  const { data: run } = usePipelineRun(sparkId);
  const { data: manifest, isLoading, isError, refetch } = useArtifactList(sparkId);

  // Index manifest entries by role (for the canonical rail grouping) and collect
  // any committed-but-unmapped entries so emitted work is never dropped.
  const byRole = useMemo(() => {
    const m = new Map<PdlcRole, ArtifactListItem>();
    const extras: ArtifactListItem[] = [];
    for (const e of manifest ?? []) {
      if (e.role && !m.has(e.role)) m.set(e.role, e);
      else if (!e.role) extras.push(e);
    }
    return { m, extras };
  }, [manifest]);

  // Stable rail order, used to resolve the default selection.
  const orderedRoles = useMemo<PdlcRole[]>(
    () => [...DISCOVERY_ROLES, ...BUNDLE_ROLES, ...RELEASE_ROLES],
    [],
  );

  // Derived default selection: first present artifact in rail order, else PO, else the
  // first manifest entry. Pure derivation (no effect/setState churn) so the rail shows a
  // sensible artifact immediately; an explicit user click overrides it.
  const defaultName = useMemo<string | null>(() => {
    if (!manifest || manifest.length === 0) return null;
    const firstPresent = orderedRoles.map((r) => byRole.m.get(r)).find((e) => e && e.present);
    const pick = firstPresent ?? byRole.m.get('PO') ?? manifest[0];
    return pick?.name ?? null;
  }, [manifest, byRole, orderedRoles]);

  // null until the user clicks; the effective selection falls back to the derived default.
  const [clickedName, setClickedName] = useState<string | null>(null);
  const allEntries: ArtifactListItem[] = manifest ?? [];
  const effectiveName =
    clickedName != null && allEntries.some((e) => e.name === clickedName)
      ? clickedName
      : defaultName;
  const setSelectedName = setClickedName;

  if (!id) return <Navigate to="/dashboard" replace />;

  const goPipeline = () => navigate(`/sparks/${sparkId}`);
  const goDashboard = () => navigate('/dashboard');

  // Resolve the selected manifest entry (may be a bundle role or a solo role/extra).
  const selectedName = effectiveName;
  const selectedEntry = allEntries.find((e) => e.name === selectedName) ?? null;
  const isBundleSelected =
    selectedEntry?.role != null && BUNDLE_ROLES.includes(selectedEntry.role);

  return (
    <div className="art-root">
      <style>{CSS}</style>
      <div className="grid-bg" />
      <div className="scan" />
      <HudTopbar active="dashboard" />

      <div className="stage">
        {/* breadcrumb */}
        <div className="crumbs">
          <a onClick={goDashboard}>DASHBOARD</a>
          <span className="arr">›</span>
          <a onClick={goPipeline}>PIPELINE</a>
          <span className="arr">›</span>
          <span className="here">ARTIFACTS</span>
        </div>

        {/* head */}
        <div className="head">
          <div>
            <h1 className="h1">
              ARTIFACT <span className="b">VIEWER</span>
            </h1>
            <div className="sub">PDLC PIPELINE OUTPUT · FOLDED MERGE GATE</div>
          </div>
          <button type="button" className="btn btn-ghost" onClick={goPipeline}>
            ← BACK TO PIPELINE
          </button>
        </div>

        {/* spark meta strip */}
        {spark && (
          <div className="sparkhead">
            <div className="sparktitle">{spark.title}</div>
            <div className="metarow">
              {run && <span>RUN <b>{run.id}</b></span>}
              {run && <span>PLAYBOOK <b>{run.playbook.replace(/_/g, ' ')}</b></span>}
              {run && <span>STATUS <b>{run.status.replace(/_/g, ' ')}</b></span>}
              {run && <span>COST <b>${Number(run.totalCostUsd ?? 0).toFixed(2)}</b></span>}
            </div>
          </div>
        )}

        {/* two-pane viewer */}
        <div className="viewer">
          {/* ── LEFT RAIL ── */}
          <div className="panel">
            <div className="phead">
              <span className="t">ARTIFACTS</span>
              <span className="tag">{allEntries.length} ENTRIES</span>
            </div>
            <div className="rail-body">
              {isLoading && <div className="rail-state">Loading artifacts…</div>}
              {isError && (
                <div className="rail-state err">
                  Failed to load the artifact manifest.
                  <button type="button" className="btn btn-ghost mini" onClick={() => refetch()}>
                    RETRY
                  </button>
                </div>
              )}
              {!isLoading && !isError && (
                <Rail
                  byRole={byRole.m}
                  extras={byRole.extras}
                  selectedName={selectedName}
                  onSelect={setSelectedName}
                />
              )}
            </div>
          </div>

          {/* ── MAIN PANE ── */}
          <div className="docpane">
            {!selectedEntry ? (
              <div className="panel">
                <div className="phead">
                  <span className="t">ARTIFACT</span>
                </div>
                <div className="empty-pane">
                  {isLoading ? 'Loading…' : 'Select an artifact from the rail.'}
                </div>
              </div>
            ) : isBundleSelected ? (
              <MergeBundle
                sparkId={sparkId}
                run={run}
                byRole={byRole.m}
                selectedRole={selectedEntry.role as PdlcRole}
                onSelectRole={(role) => {
                  const e = byRole.m.get(role);
                  if (e) setSelectedName(e.name);
                }}
              />
            ) : (
              <SoloArtifact sparkId={sparkId} entry={selectedEntry} />
            )}
          </div>
        </div>

        <div style={{ height: 24 }} />
        <div className="foot">TACTICL HUD · PDLC ARTIFACT VIEWER{run ? ` · ${run.id}` : ''}</div>
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}

// ── Left rail ─────────────────────────────────────────────
function Rail({
  byRole,
  extras,
  selectedName,
  onSelect,
}: {
  byRole: Map<PdlcRole, ArtifactListItem>;
  extras: ArtifactListItem[];
  selectedName: string | null;
  onSelect: (name: string) => void;
}) {
  return (
    <>
      <div className="group-label first">Discovery &amp; Design</div>
      {DISCOVERY_ROLES.map((role) => (
        <RailRow key={role} role={role} entry={byRole.get(role)} selectedName={selectedName} onSelect={onSelect} />
      ))}

      {/* folded MERGE REVIEW bundle */}
      <div className="bundle">
        <div className="bundle-h">
          <div className="bt">
            <span className="gico" />
            MERGE REVIEW
          </div>
          <div className="gate">GATE · 1 BUNDLE</div>
        </div>
        {BUNDLE_ROLES.map((role) => (
          <RailRow
            key={role}
            role={role}
            entry={byRole.get(role)}
            selectedName={selectedName}
            onSelect={onSelect}
            inBundle
          />
        ))}
      </div>

      <div className="group-label">Review &amp; Release</div>
      {RELEASE_ROLES.map((role) => (
        <RailRow key={role} role={role} entry={byRole.get(role)} selectedName={selectedName} onSelect={onSelect} />
      ))}

      {/* committed-but-unmapped entries (never drop emitted work) */}
      {extras.length > 0 && (
        <>
          <div className="group-label">Other Output</div>
          {extras.map((entry) => (
            <RailRow key={entry.name} role={null} entry={entry} selectedName={selectedName} onSelect={onSelect} />
          ))}
        </>
      )}
    </>
  );
}

/** One artifact rail row: icon · name · file-path sub-label · status dot. */
function RailRow({
  role,
  entry,
  selectedName,
  onSelect,
  inBundle,
}: {
  role: PdlcRole | null;
  entry: ArtifactListItem | undefined;
  selectedName: string | null;
  onSelect: (name: string) => void;
  inBundle?: boolean;
}) {
  const meta = metaFor(role);
  // No manifest entry for a canonical role → render a pending skeleton row that is
  // NOT clickable (nothing to show). This only happens if the backend skeleton omits
  // a role; normally every catalog role is present (status:pending, present:false).
  const status: ArtifactStatus = entry?.status ?? 'pending';
  const name = entry?.name ?? null;
  const title = entry?.title ?? meta.label;
  const sub = entry ? subLabel(entry) : `${(role ? role : 'artifact').toLowerCase()}.md`;
  const selectable = !!name;
  const active = selectable && name === selectedName;

  return (
    <div
      className={`art${active ? ' active' : ''}${selectable ? '' : ' disabled'}${inBundle ? ' in-bundle' : ''}`}
      style={{ ['--rc' as string]: meta.color }}
      role={selectable ? 'button' : undefined}
      tabIndex={selectable ? 0 : undefined}
      onClick={() => selectable && name && onSelect(name)}
      onKeyDown={(e) => {
        if (selectable && name && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect(name);
        }
      }}
    >
      <div className="ico">{meta.icon}</div>
      <div className="abody">
        <div className="nm">{title}</div>
        <div className="asub">{sub}</div>
      </div>
      <div className={`st ${STATUS_CLS[status]}`} />
    </div>
  );
}

// ── Per-artifact metadata header (role pill · version · status) ──
function MetaHeader({ role, entry }: { role: PdlcRole | null; entry: ArtifactListItem }) {
  const meta = metaFor(role);
  return (
    <div className="topmeta">
      <span className="role-pill" style={{ ['--rc' as string]: meta.color }}>
        {meta.icon} · {meta.label}
      </span>
      {entry.agent && <span className="metachip">{entry.agent}</span>}
      <span className="metachip">{entry.version}</span>
      <span className={`metachip status ${STATUS_CLS[entry.status]}`}>{entry.status}</span>
    </div>
  );
}

/** "Artifact pending" honest empty-state — used when present=false or content is empty. */
function PendingState({ entry, role }: { entry: ArtifactListItem; role: PdlcRole | null }) {
  const label = metaFor(role).label;
  return (
    <div className="pending-state">
      <div className="ps-h">ARTIFACT PENDING</div>
      <div className="ps-p">
        {label} has not produced output yet. This row is wired to the live pipeline manifest and
        will render real markdown the moment the artifact is committed — no content is fabricated.
        {entry.summary ? ` · ${entry.summary}` : ''}
      </div>
    </div>
  );
}

// ── Solo artifact (one role, full markdown body) ──
function SoloArtifact({ sparkId, entry }: { sparkId: string; entry: ArtifactListItem }) {
  const role = entry.role;
  const meta = metaFor(role);
  // Only fetch content when the manifest says it's actually committed.
  const { data: content, isLoading, isError, error } = useArtifactContent(
    sparkId,
    entry.present ? entry.name : null,
  );
  const notCommitted = !entry.present || (error instanceof ApiError && error.status === 404);
  const markdown = content?.markdown?.trim() ?? '';

  return (
    <div className="panel">
      <div className="phead">
        <span className="t">ARTIFACT</span>
        <span className="tag" style={{ color: meta.color }}>
          {(role ?? entry.title).toString().toUpperCase()} · {entry.version}
        </span>
      </div>
      <div className="docbody-wrap">
        <MetaHeader role={role} entry={entry} />
        {notCommitted ? (
          <PendingState entry={entry} role={role} />
        ) : isLoading ? (
          <div className="empty-pane">Loading artifact…</div>
        ) : isError ? (
          <div className="empty-pane err">Failed to load this artifact's content.</div>
        ) : markdown.length === 0 ? (
          <PendingState entry={entry} role={role} />
        ) : (
          <ArtifactMarkdown markdown={markdown} tag={`${entry.title} · ${entry.version}`} />
        )}
      </div>
    </div>
  );
}

// ── Merge-review bundle (approve/request-changes banner + 3 sub-tabs) ──
function MergeBundle({
  sparkId,
  run,
  byRole,
  selectedRole,
  onSelectRole,
}: {
  sparkId: string;
  run: PipelineRun | undefined;
  byRole: Map<PdlcRole, ArtifactListItem>;
  selectedRole: PdlcRole;
  onSelectRole: (role: PdlcRole) => void;
}) {
  const resolve = useResolveCheckpoint(sparkId);
  const [actionError, setActionError] = useState<string | null>(null);

  // The merge gate is actionable only when the run is paused with a live checkpoint.
  const checkpointId = run?.currentCheckpointId ?? null;
  const gatePending =
    !!checkpointId && (run?.status === 'PAUSED_AT_CHECKPOINT' || run?.status === 'RUNNING');

  const handleDecision = (decision: 'APPROVED' | 'REWORK') => {
    if (!checkpointId) return;
    setActionError(null);
    resolve.mutate(
      { checkpointId, data: { decision, feedback: null } },
      {
        onError: (err: unknown) => {
          if (err instanceof ApiError) {
            if (err.status === 409) setActionError('Merge gate already resolved.');
            else if (err.status === 403) setActionError('Not authorized to resolve this gate.');
            else setActionError(err.message || 'Failed to resolve the merge gate.');
          } else {
            setActionError('An unexpected error occurred.');
          }
        },
      },
    );
  };

  const activeEntry = byRole.get(selectedRole);
  const activeMeta = metaFor(selectedRole);

  return (
    <div className="panel">
      <div className="phead">
        <span className="t">MERGE REVIEW</span>
        <span className="tag">GATE · CHANGE + TEST + SECURITY</span>
      </div>
      <div className="docbody-wrap">
        {/* approve / request-changes banner */}
        <div className={`merge-banner${gatePending ? '' : ' inert'}`}>
          <div className="mg-ico">⚷</div>
          <div className="mg-text">
            <div className="mg-t">Merge Review — one reviewable bundle</div>
            <div className="mg-s">
              {gatePending
                ? 'Change Summary · Test Report · Security Report · approve to merge or request changes.'
                : 'Change Summary · Test Report · Security Report · read-only (no merge gate pending).'}
            </div>
          </div>
          <div className="mg-act">
            <button
              type="button"
              className="btn btn-ghost"
              disabled={!gatePending || resolve.isPending}
              onClick={() => handleDecision('REWORK')}
            >
              {resolve.isPending ? 'WORKING…' : 'REQUEST CHANGES'}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!gatePending || resolve.isPending}
              onClick={() => handleDecision('APPROVED')}
            >
              {resolve.isPending ? 'WORKING…' : 'APPROVE & MERGE'}
            </button>
          </div>
        </div>
        {actionError && <div className="merge-err">{actionError}</div>}

        {/* sub-tabs */}
        <div className="subtabs">
          {BUNDLE_ROLES.map((role) => {
            const meta = metaFor(role);
            const entry = byRole.get(role);
            const on = role === selectedRole;
            return (
              <button
                key={role}
                type="button"
                className={`subtab${on ? ' on' : ''}`}
                style={{ ['--sc' as string]: meta.color }}
                onClick={() => onSelectRole(role)}
              >
                <span className="dot" />
                {entry?.title ?? meta.label}
              </button>
            );
          })}
        </div>

        {/* active sub-tab body */}
        {activeEntry ? (
          <BundleSubBody sparkId={sparkId} entry={activeEntry} role={selectedRole} />
        ) : (
          <div className="pending-state">
            <div className="ps-h">ARTIFACT PENDING</div>
            <div className="ps-p">{activeMeta.label} has not produced output yet.</div>
          </div>
        )}
      </div>
    </div>
  );
}

/** One merge sub-tab's content body — same honest states as a solo artifact. */
function BundleSubBody({
  sparkId,
  entry,
  role,
}: {
  sparkId: string;
  entry: ArtifactListItem;
  role: PdlcRole;
}) {
  const { data: content, isLoading, isError, error } = useArtifactContent(
    sparkId,
    entry.present ? entry.name : null,
  );
  const notCommitted = !entry.present || (error instanceof ApiError && error.status === 404);
  const markdown = content?.markdown?.trim() ?? '';

  return (
    <div>
      <MetaHeader role={role} entry={entry} />
      {notCommitted ? (
        <PendingState entry={entry} role={role} />
      ) : isLoading ? (
        <div className="empty-pane">Loading artifact…</div>
      ) : isError ? (
        <div className="empty-pane err">Failed to load this artifact's content.</div>
      ) : markdown.length === 0 ? (
        <PendingState entry={entry} role={role} />
      ) : (
        <ArtifactMarkdown markdown={markdown} tag={`${entry.title} · ${entry.version}`} />
      )}
    </div>
  );
}

// ── HUD CSS — rail / bundle / banner / sub-tabs lifted from the artifacts.html mockup.
// The doc body itself is rendered by <ArtifactMarkdown> (MUI), so only the chrome,
// rail, merge banner and sub-tabs live here. Token block reused 1:1 with the other
// HUD surfaces so the chrome cannot drift. ──
const CSS = `
.art-root{position:fixed;inset:0;overflow-y:auto;color:#eef0f6;font-family:var(--mono);letter-spacing:.2px;
  --accent:#6C63FF;--magenta:#B25CFF;--cyan:#15E0C8;--red:#FF6B6B;--amber:#F5B544;--idle:#6E6A8F;
  --ink:#070a0c;--glass1:rgba(22,28,34,.66);--glass2:rgba(11,15,19,.66);
  --disp:"Chakra Petch",sans-serif;--mono:"JetBrains Mono",ui-monospace,monospace;--line:rgba(108,99,255,.14);
  background:radial-gradient(1300px 820px at 50% -8%,rgba(108,99,255,.16),transparent 58%),
    radial-gradient(1000px 760px at 92% 110%,rgba(178,92,255,.10),transparent 60%),
    radial-gradient(760px 620px at 4% 18%,rgba(21,224,200,.06),transparent 60%),var(--ink);}
.art-root .grid-bg{position:fixed;inset:0;pointer-events:none;opacity:.45;z-index:0;
  background-image:linear-gradient(rgba(108,99,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(108,99,255,.06) 1px,transparent 1px);
  background-size:54px 54px;-webkit-mask-image:radial-gradient(ellipse 80% 70% at 50% 32%,#000 35%,transparent 78%);
  mask-image:radial-gradient(ellipse 80% 70% at 50% 32%,#000 35%,transparent 78%);}
.art-root .scan{position:fixed;left:0;right:0;height:160px;z-index:1;pointer-events:none;
  background:linear-gradient(rgba(108,99,255,.07),transparent);animation:ascan 8s linear infinite;}
@keyframes ascan{0%{transform:translateY(-160px)}100%{transform:translateY(100vh)}}
@keyframes ablink{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes anodepulse{0%,100%{box-shadow:0 0 0 0 rgba(108,99,255,.55)}50%{box-shadow:0 0 0 6px rgba(108,99,255,0)}}
.art-root .stage{position:relative;z-index:2}

.art-root .crumbs{padding:8px 34px 0;display:flex;align-items:center;gap:10px;font-family:var(--disp);font-size:11.9px;letter-spacing:2px}
.art-root .crumbs a{color:rgba(170,165,255,.9);text-decoration:none;transition:.18s;cursor:pointer}
.art-root .crumbs a:hover{color:#fff;text-shadow:0 0 12px rgba(108,99,255,.5)}
.art-root .crumbs .arr{color:var(--accent)}
.art-root .crumbs .here{color:rgba(238,240,246,.5)}

.art-root .head{padding:14px 34px 2px;display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:14px}
.art-root .h1{font-family:var(--disp);font-size:33.9px;letter-spacing:8px;font-weight:600;margin:0;line-height:1}
.art-root .h1 .b{background:linear-gradient(90deg,var(--accent),var(--magenta));-webkit-background-clip:text;background-clip:text;color:transparent}
.art-root .sub{font-size:12.4px;color:rgba(238,240,246,.4);letter-spacing:3px;margin-top:8px}

.art-root .sparkhead{margin:16px 34px 0}
.art-root .sparktitle{font-family:var(--disp);font-size:21px;color:#fff;line-height:1.25;font-weight:600;max-width:880px}
.art-root .metarow{display:flex;gap:24px;flex-wrap:wrap;margin-top:11px;font-family:var(--mono);font-size:12.4px;color:rgba(238,240,246,.42)}
.art-root .metarow b{color:#eef0f6;font-weight:500}

.art-root .viewer{display:grid;grid-template-columns:316px 1fr;gap:18px;align-items:start;margin:16px 34px 0}

.art-root .panel{border:1px solid var(--line);border-radius:16px;overflow:hidden;
  background:linear-gradient(180deg,var(--glass1),var(--glass2));backdrop-filter:blur(18px);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.04),inset 0 0 60px rgba(108,99,255,.04),0 18px 60px rgba(0,0,0,.55);position:relative}
.art-root .panel::before,.art-root .panel::after{content:"";position:absolute;width:18px;height:18px;border:0 solid rgba(108,99,255,.6);pointer-events:none;z-index:3}
.art-root .panel::before{top:8px;left:8px;border-top-width:1.5px;border-left-width:1.5px}
.art-root .panel::after{bottom:8px;right:8px;border-bottom-width:1.5px;border-right-width:1.5px}
.art-root .phead{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:13px 22px;border-bottom:1px solid var(--line)}
.art-root .phead .t{font-family:var(--disp);font-size:11.9px;letter-spacing:2.4px;color:var(--accent);font-weight:600}
.art-root .phead .tag{font-family:var(--mono);font-size:10.7px;letter-spacing:1.3px;color:rgba(238,240,246,.4)}

/* ── Left rail ── */
.art-root .rail-body{padding:11px 11px 15px}
.art-root .rail-state{padding:18px 9px;font-family:var(--mono);font-size:12.4px;color:rgba(238,240,246,.55);display:flex;flex-direction:column;gap:12px;align-items:flex-start}
.art-root .rail-state.err{color:#ffb0b0}
.art-root .group-label{font-family:var(--disp);font-size:10.2px;letter-spacing:2.6px;text-transform:uppercase;color:rgba(170,165,255,.55);padding:14px 9px 9px;display:flex;align-items:center;gap:8px}
.art-root .group-label::before{content:"";width:4px;height:4px;border-radius:1px;background:var(--accent);box-shadow:0 0 6px var(--accent)}
.art-root .group-label.first{padding-top:6px}
.art-root .art{display:flex;align-items:center;gap:11px;padding:9px 10px;border-radius:10px;cursor:pointer;border:1px solid transparent;transition:.14s;position:relative;margin-bottom:3px}
.art-root .art:hover{background:rgba(108,99,255,0.06)}
.art-root .art.active{background:rgba(108,99,255,0.10);border-color:rgba(108,99,255,0.3)}
.art-root .art.active::before{content:"";position:absolute;left:-1px;top:9px;bottom:9px;width:2.5px;border-radius:2px;background:var(--rc,var(--accent));box-shadow:0 0 9px var(--rc,var(--accent))}
.art-root .art.disabled{cursor:default;opacity:.55}
.art-root .art.disabled:hover{background:transparent}
.art-root .art .ico{width:31px;height:31px;flex-shrink:0;border-radius:9px;display:flex;align-items:center;justify-content:center;font-family:var(--disp);font-weight:700;font-size:10.2px;letter-spacing:.4px;color:var(--rc);background:color-mix(in srgb,var(--rc) 15%,transparent);border:1px solid color-mix(in srgb,var(--rc) 45%,transparent)}
.art-root .art .abody{flex:1;min-width:0}
.art-root .art .nm{font-family:var(--disp);font-weight:600;font-size:13.6px;color:#eef0f6;letter-spacing:.4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.art-root .art .asub{font-family:var(--mono);font-size:10.7px;color:rgba(238,240,246,.4);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.art-root .art .st{flex-shrink:0;width:9px;height:9px;border-radius:50%}
.art-root .st.done{background:var(--cyan);box-shadow:0 0 8px rgba(21,224,200,.8)}
.art-root .st.active{background:var(--accent);animation:anodepulse 2s ease-in-out infinite}
.art-root .st.pend{background:transparent;border:1.5px dashed var(--idle)}

/* ── Folded merge-gate bundle ── */
.art-root .bundle{margin:5px 4px;padding:7px;border-radius:11px;border:1px dashed rgba(245,181,68,0.34);background:rgba(245,181,68,0.035)}
.art-root .bundle-h{display:flex;align-items:center;justify-content:space-between;padding:4px 6px 9px}
.art-root .bundle-h .bt{font-family:var(--disp);font-weight:700;font-size:11.9px;letter-spacing:1.4px;color:var(--amber);display:flex;align-items:center;gap:7px}
.art-root .bundle-h .bt .gico{width:8px;height:8px;border-radius:2px;background:var(--amber);box-shadow:0 0 8px var(--amber)}
.art-root .bundle-h .gate{font-family:var(--mono);font-size:9.6px;letter-spacing:1.1px;color:rgba(245,181,68,.8);border:1px solid rgba(245,181,68,.4);border-radius:6px;padding:2px 7px;text-transform:uppercase}
.art-root .bundle .art.active::before{left:-7px}

/* ── Right doc pane ── */
.art-root .docpane{min-width:0}
.art-root .docpane .panel{height:100%}
.art-root .docbody-wrap{padding:24px 28px 36px;min-width:0}
.art-root .empty-pane{padding:42px 28px;text-align:center;font-family:var(--mono);font-size:13px;color:rgba(238,240,246,.5)}
.art-root .empty-pane.err{color:#ffb0b0}

.art-root .topmeta{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-bottom:18px}
.art-root .role-pill{font-family:var(--disp);font-weight:700;font-size:11.3px;letter-spacing:.6px;padding:5px 11px;border-radius:8px;color:var(--rc);background:color-mix(in srgb,var(--rc) 14%,transparent);border:1px solid color-mix(in srgb,var(--rc) 45%,transparent)}
.art-root .metachip{font-family:var(--mono);font-size:11.3px;color:rgba(238,240,246,.5);padding:4px 9px;border-radius:7px;border:1px solid var(--line)}
.art-root .metachip.status{text-transform:uppercase;letter-spacing:.8px}
.art-root .metachip.status.done{color:#8ff0e4;border-color:rgba(21,224,200,.4);background:rgba(21,224,200,.08)}
.art-root .metachip.status.active{color:#bdb8ff;border-color:rgba(108,99,255,.4);background:rgba(108,99,255,.1)}
.art-root .metachip.status.pend{color:rgba(238,240,246,.5);border-color:rgba(110,106,143,.5);border-style:dashed}

/* ── Pending honest state ── */
.art-root .pending-state{padding:6px 2px 4px;border:1px dashed rgba(108,99,255,.22);border-radius:12px;padding:18px 20px;background:rgba(108,99,255,.03)}
.art-root .ps-h{font-family:var(--disp);font-size:11.3px;letter-spacing:2px;color:var(--amber);margin-bottom:9px}
.art-root .ps-p{font-family:var(--mono);font-size:12.6px;line-height:1.65;color:rgba(238,240,246,.55);max-width:720px}

/* ── Merge banner + sub-tabs ── */
.art-root .merge-banner{display:flex;align-items:center;gap:14px;padding:14px 18px;border-radius:12px;margin-bottom:18px;border:1px solid rgba(245,181,68,0.32);background:linear-gradient(135deg,rgba(245,181,68,0.08),rgba(178,92,255,0.05))}
.art-root .merge-banner.inert{opacity:.78;border-color:rgba(108,99,255,.22);background:linear-gradient(135deg,rgba(108,99,255,0.05),rgba(178,92,255,0.04))}
.art-root .merge-banner .mg-ico{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:rgba(245,181,68,0.14);border:1px solid rgba(245,181,68,0.42);color:var(--amber);font-family:var(--disp);font-weight:700;font-size:16.9px}
.art-root .merge-banner.inert .mg-ico{background:rgba(108,99,255,.12);border-color:rgba(108,99,255,.32);color:#bdb8ff}
.art-root .merge-banner .mg-t{font-family:var(--disp);font-weight:700;font-size:14.7px;letter-spacing:.6px;color:#fff}
.art-root .merge-banner .mg-s{font-family:var(--mono);font-size:11.9px;color:rgba(238,240,246,.5);margin-top:3px}
.art-root .merge-banner .mg-act{margin-left:auto;display:flex;gap:8px;flex-shrink:0}
.art-root .merge-err{font-family:var(--mono);font-size:12px;color:#ffb0b0;margin:-8px 0 16px}
.art-root .subtabs{display:flex;gap:6px;margin-bottom:20px;flex-wrap:wrap}
.art-root .subtab{font-family:var(--disp);font-weight:600;font-size:11.9px;letter-spacing:.7px;padding:7px 13px;border-radius:9px;cursor:pointer;border:1px solid var(--line);color:rgba(238,240,246,.55);background:rgba(255,255,255,0.02);transition:.14s;display:flex;align-items:center;gap:8px}
.art-root .subtab .dot{width:7px;height:7px;border-radius:50%;background:var(--sc)}
.art-root .subtab:hover{color:#eef0f6}
.art-root .subtab.on{color:#fff;border-color:color-mix(in srgb,var(--sc) 55%,transparent);background:color-mix(in srgb,var(--sc) 12%,transparent)}

/* ── Buttons ── */
.art-root .btn{font-family:var(--disp);font-weight:600;font-size:11.9px;letter-spacing:1.6px;text-transform:uppercase;padding:8px 16px;border-radius:9px;cursor:pointer;border:1px solid transparent;transition:.16s}
.art-root .btn:disabled{opacity:.45;cursor:default}
.art-root .btn.mini{padding:6px 12px;font-size:10.7px}
.art-root .btn-ghost{background:rgba(108,99,255,.05);border-color:rgba(108,99,255,.4);color:#cfa0ff}
.art-root .btn-ghost:hover:not(:disabled){background:rgba(108,99,255,.16);border-color:var(--accent);color:#fff}
.art-root .btn-primary{background:linear-gradient(135deg,#6C63FF,#B25CFF 55%,#15E0C8);color:#0a0a14;box-shadow:0 6px 22px rgba(108,99,255,.35)}
.art-root .btn-primary:hover:not(:disabled){filter:brightness(1.08)}

.art-root .foot{text-align:center;color:rgba(238,240,246,.3);font-size:11.3px;letter-spacing:2px;margin:30px 0 8px;font-family:var(--disp);word-break:break-all;padding:0 34px}

@media (max-width:1100px){.art-root .viewer{grid-template-columns:1fr}}
`;
