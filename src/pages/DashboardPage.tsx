// src/pages/DashboardPage.tsx
// Full-bleed "DEVELOPMENT PIPELINE" HUD dashboard — matches the design mockup.
// One row per pipeline run with a live agent-timeline strip, blinking active/blocked
// nodes, status pills, cost + relative time, and a contextual action. Wired to the
// real /v1/pipelines feed (polls every 5s). Rendered full-bleed (no AppLayout chrome),
// sharing the COMMAND / DASHBOARD / LINKS / CONFIG top nav with the command center.
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePipelines } from '../hooks/usePipelines';
import HudTopbar from '../components/hud/HudTopbar';
import type { PipelineRunSummary, PdlcRole, PipelineStatus } from '../api/types';

// ── Role sequences per playbook (the full pipeline so not-yet-run roles show as todo).
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
  PLANNER: 'Planner', IMPLEMENTER: 'Implementer', REVIEWER: 'Reviewer', TESTER: 'Test',
  SECURITY_ANALYST: 'Security', TECHNICAL_WRITER: 'Docs', DEVOPS: 'DevOps', RETRO_ANALYST: 'Retro',
};

type Kind = 'running' | 'blocked' | 'merged' | 'failed' | 'queued';
type NodeState = 'done' | 'cur' | 'block' | 'fail' | 'todo';

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

function relTime(iso?: string): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return '—';
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function sequenceFor(run: PipelineRunSummary): PdlcRole[] {
  const base = SEQUENCES[run.playbook];
  if (base && base.length) {
    const extra = (run.activatedRoles ?? []).filter((r) => !base.includes(r));
    return [...base, ...extra];
  }
  return run.activatedRoles?.length ? run.activatedRoles : ['IMPLEMENTER'];
}

function nodeStateFor(role: PdlcRole, run: PipelineRunSummary, kind: Kind): NodeState {
  const activated = new Set(run.activatedRoles ?? []);
  const isCur = run.currentRole === role;
  if (kind === 'merged') return 'done';
  if (isCur) {
    if (kind === 'blocked') return 'block';
    if (kind === 'failed') return 'fail';
    if (kind === 'queued') return 'todo';
    return 'cur';
  }
  if (activated.has(role)) return 'done';
  if (kind === 'failed' && !run.currentRole) {
    const last = run.activatedRoles?.[run.activatedRoles.length - 1];
    if (last === role) return 'fail';
  }
  return 'todo';
}

function actionFor(kind: Kind): { text: string; cls: string } {
  if (kind === 'blocked') return { text: 'REVIEW →', cls: 'review' };
  if (kind === 'failed') return { text: 'LOG →', cls: '' };
  return { text: 'OPEN →', cls: '' };
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: runs, isLoading, isError } = usePipelines();

  const list = useMemo(() => runs ?? [], [runs]);
  const counts = useMemo(() => {
    const c = { running: 0, blocked: 0, merged: 0, failed: 0 };
    for (const r of list) {
      const k = kindOf(r.status, !!r.currentCheckpointId);
      if (k === 'running' || k === 'queued') c.running += 1;
      else if (k === 'blocked') c.blocked += 1;
      else if (k === 'merged') c.merged += 1;
      else if (k === 'failed') c.failed += 1;
    }
    return c;
  }, [list]);

  return (
    <div className="dash-root">
      <style>{CSS}</style>
      <div className="grid-bg" />
      <div className="scan" />

      <HudTopbar active="dashboard" />

      <div className="stage">
        <div className="head">
          <div>
            <h1 className="h1">DEVELOPMENT <span className="b">PIPELINE</span></h1>
            <div className="sub">LIVE AGENT TRACKING · {list.length} BUILD{list.length === 1 ? '' : 'S'}</div>
          </div>
          <div className="summary">
            <Stat color="var(--accent)" n={counts.running} l="RUNNING" />
            <Stat color="var(--amber)" n={counts.blocked} l="NEEDS YOU" />
            <Stat color="var(--cyan)" n={counts.merged} l="MERGED" />
            <Stat color="var(--red)" n={counts.failed} l="FAILED" />
          </div>
        </div>

        <div className="panel">
          <div className="lhead">
            <div>STATUS</div><div>BUILD</div>
            <div>AGENTS&nbsp;·&nbsp; done&nbsp; ◉ live&nbsp; ○ queued</div>
            <div>COST</div><div>UPDATED</div><div />
          </div>

          {isLoading && <div className="empty">Loading pipelines…</div>}
          {isError && <div className="empty err">Failed to load pipelines.</div>}
          {!isLoading && !isError && list.length === 0 && (
            <div className="empty">No pipelines yet. Start a build from Command to see it tracked here.</div>
          )}

          {list.map((run, i) => {
            const kind = kindOf(run.status, !!run.currentCheckpointId);
            const pill = PILL[kind];
            const seq = sequenceFor(run);
            const act = actionFor(kind);
            return (
              <div className="row" key={run.id} style={{ animationDelay: `${0.05 + i * 0.07}s` }}
                   onClick={() => navigate(`/sparks/${run.sparkId}`)}>
                <div><span className={`pill ${pill.cls}`}><span className="pdot" />{pill.label}</span></div>
                <div>
                  <div className="bname">{run.name ?? run.playbook ?? 'Pipeline'}</div>
                  <div className="brepo">{run.name ? run.playbook : run.sparkId}</div>
                  {kind === 'blocked' && <div className="prtag">▲ awaiting your approval</div>}
                </div>
                <div className="strip">
                  {seq.map((role, idx) => {
                    const st = nodeStateFor(role, run, kind);
                    const segCls = idx === 0 ? '' : st === 'done' ? 'fdone'
                      : st === 'cur' ? 'fcur' : st === 'fail' ? 'ffail'
                      : st === 'block' ? 'fblock' : 'ftodo';
                    const ndCls = st === 'done' ? 'n-done' : st === 'cur' ? 'n-cur'
                      : st === 'block' ? 'n-block' : st === 'fail' ? 'n-fail' : 'n-todo';
                    const nlCls = st === 'done' ? 'cyan' : (st === 'cur' || st === 'block' || st === 'fail') ? 'on' : '';
                    return (
                      <div className="node" key={role + idx}>
                        {idx > 0 && <span className={`seg ${segCls}`} />}
                        <span className={`nd ${ndCls}`} />
                        <span className={`nl ${nlCls}`}>{ROLE_LABEL[role] ?? role}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="small">{run.totalCostUsd ? `$${run.totalCostUsd.toFixed(2)}` : '—'}</div>
                <div className="small">{relTime(run.updatedAt)}</div>
                <div className="act"><span className={act.cls}>{act.text}</span></div>
              </div>
            );
          })}

          <div className="legend">
            <span><span className="lz" style={{ background: 'var(--cyan)', boxShadow: '0 0 7px var(--cyan)' }} />done</span>
            <span><span className="lz blink" style={{ background: 'var(--accent)', boxShadow: '0 0 9px var(--accent)' }} />working now</span>
            <span><span className="lz blink" style={{ background: 'var(--amber)', boxShadow: '0 0 9px var(--amber)' }} />waiting on you</span>
            <span><span className="lz" style={{ background: 'var(--red)' }} />failed</span>
            <span><span className="lz" style={{ background: 'rgba(238,240,246,.18)', border: '1px solid rgba(238,240,246,.25)' }} />queued</span>
          </div>
        </div>
        <div style={{ height: 46 }} />
      </div>
    </div>
  );
}

function Stat({ color, n, l }: { color: string; n: number; l: string }) {
  return (
    <div className="stat">
      <span className="sdot" style={{ background: color, boxShadow: `0 0 9px ${color}` }} />
      <span className="n">{n}</span><span className="l">{l}</span>
    </div>
  );
}

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
  background-size:54px 54px;-webkit-mask-image:radial-gradient(ellipse 80% 70% at 50% 32%,#000 35%,transparent 78%);}
.dash-root .scan{position:fixed;left:0;right:0;height:160px;z-index:1;pointer-events:none;
  background:linear-gradient(rgba(108,99,255,.07),transparent);animation:dscan 8s linear infinite;}
@keyframes dscan{0%{transform:translateY(-160px)}100%{transform:translateY(100vh)}}
.dash-root .stage{position:relative;z-index:2}
/* node-strip halo (also reused by .n-cur/.n-block below) */
@keyframes dhalo{0%{transform:scale(.5);opacity:.9}100%{transform:scale(2.1);opacity:0}}
.dash-root .head{padding:14px 34px 2px;display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:14px}
.dash-root .h1{font-family:var(--disp);font-size:30px;letter-spacing:9px;font-weight:600;margin:0;line-height:1}
.dash-root .h1 .b{background:linear-gradient(90deg,var(--accent),var(--magenta));-webkit-background-clip:text;background-clip:text;color:transparent}
.dash-root .sub{font-size:11px;color:rgba(238,240,246,.4);letter-spacing:3px;margin-top:8px}
.dash-root .summary{display:flex;gap:9px;flex-wrap:wrap}
.dash-root .stat{display:flex;align-items:center;gap:9px;padding:9px 15px;border-radius:12px;border:1px solid var(--line);background:linear-gradient(180deg,var(--glass1),var(--glass2));backdrop-filter:blur(16px)}
.dash-root .stat .n{font-family:var(--disp);font-size:19px;font-weight:600}
.dash-root .stat .l{font-size:9.5px;letter-spacing:1.6px;color:rgba(238,240,246,.42)}
.dash-root .sdot{width:8px;height:8px;border-radius:50%}
.dash-root .panel{margin:16px 34px 0;border:1px solid var(--line);border-radius:16px;overflow:hidden;
  background:linear-gradient(180deg,var(--glass1),var(--glass2));backdrop-filter:blur(18px);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.04),inset 0 0 60px rgba(108,99,255,.04),0 18px 60px rgba(0,0,0,.55);position:relative}
.dash-root .panel::before,.dash-root .panel::after{content:"";position:absolute;width:18px;height:18px;border:0 solid rgba(108,99,255,.6);pointer-events:none}
.dash-root .panel::before{top:8px;left:8px;border-top-width:1.5px;border-left-width:1.5px}
.dash-root .panel::after{bottom:8px;right:8px;border-bottom-width:1.5px;border-right-width:1.5px}
.dash-root .lhead{display:grid;grid-template-columns:118px 250px 1fr 60px 70px 104px;gap:16px;align-items:center;padding:13px 22px;border-bottom:1px solid var(--line);font-family:var(--disp);font-size:9.5px;letter-spacing:1.8px;color:rgba(238,240,246,.4)}
.dash-root .row{display:grid;grid-template-columns:118px 250px 1fr 60px 70px 104px;gap:16px;align-items:center;padding:16px 22px;border-bottom:1px solid rgba(108,99,255,.06);cursor:pointer;transition:.2s;opacity:0;transform:translateY(10px);animation:drise .55s cubic-bezier(.2,.7,.2,1) forwards}
.dash-root .row:hover{background:rgba(108,99,255,.06)}
.dash-root .row:hover .bname{color:#fff}
@keyframes drise{to{opacity:1;transform:none}}
.dash-root .bname{font-family:var(--disp);font-size:14px;color:#eef0f6;transition:.2s;font-weight:500}
.dash-root .brepo{font-size:10.5px;color:rgba(238,240,246,.38);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:230px}
.dash-root .pill{font-family:var(--disp);font-size:9.5px;letter-spacing:1.3px;padding:5px 11px;border-radius:999px;white-space:nowrap;display:inline-flex;align-items:center;gap:6px}
.dash-root .pdot{width:6px;height:6px;border-radius:50%}
.dash-root .p-run{color:#bdb8ff;border:1px solid var(--accent);background:rgba(108,99,255,.13)} .dash-root .p-run .pdot{background:var(--accent);box-shadow:0 0 8px var(--accent);animation:dblink 1.3s ease-in-out infinite}
.dash-root .p-block{color:#ffd99a;border:1px solid var(--amber);background:rgba(245,181,68,.12)} .dash-root .p-block .pdot{background:var(--amber);box-shadow:0 0 8px var(--amber);animation:dblink 1s ease-in-out infinite}
.dash-root .p-done{color:#8ff0e4;border:1px solid var(--cyan);background:rgba(21,224,200,.1)} .dash-root .p-done .pdot{background:var(--cyan);box-shadow:0 0 8px var(--cyan)}
.dash-root .p-fail{color:#ffb0b0;border:1px solid var(--red);background:rgba(255,107,107,.12)} .dash-root .p-fail .pdot{background:var(--red)}
.dash-root .p-queue{color:rgba(238,240,246,.5);border:1px solid rgba(238,240,246,.2);background:rgba(255,255,255,.03)} .dash-root .p-queue .pdot{background:rgba(238,240,246,.35)}
.dash-root .strip{display:flex;align-items:flex-start;position:relative}
.dash-root .node{display:flex;flex-direction:column;align-items:center;gap:7px;flex:1;position:relative;min-width:0}
.dash-root .seg{position:absolute;top:6px;left:-50%;width:100%;height:2px;z-index:0}
.dash-root .seg.fdone{background:var(--cyan)}
.dash-root .seg.fcur{background:linear-gradient(90deg,var(--cyan),var(--accent))}
.dash-root .seg.fblock{background:linear-gradient(90deg,var(--cyan),var(--amber))}
.dash-root .seg.ftodo{background:rgba(238,240,246,.12)}
.dash-root .seg.ffail{background:linear-gradient(90deg,var(--cyan),var(--red))}
.dash-root .nd{width:13px;height:13px;border-radius:50%;position:relative;z-index:1}
.dash-root .n-done{background:var(--cyan);box-shadow:0 0 9px rgba(21,224,200,.7)}
.dash-root .n-cur{background:var(--accent);box-shadow:0 0 12px var(--accent);animation:dblink 1.25s ease-in-out infinite}
.dash-root .n-cur::after{content:"";position:absolute;inset:-6px;border-radius:50%;border:1.5px solid var(--accent);animation:dhalo 1.8s ease-out infinite}
.dash-root .n-block{background:var(--amber);box-shadow:0 0 12px var(--amber);animation:dblink 1s ease-in-out infinite}
.dash-root .n-block::after{content:"";position:absolute;inset:-6px;border-radius:50%;border:1.5px solid var(--amber);animation:dhalo 1.6s ease-out infinite}
.dash-root .n-fail{background:var(--red);box-shadow:0 0 9px var(--red)}
.dash-root .n-todo{background:rgba(238,240,246,.16);border:1px solid rgba(238,240,246,.2)}
.dash-root .nl{font-size:8.5px;letter-spacing:.3px;color:rgba(238,240,246,.34);white-space:nowrap;text-align:center}
.dash-root .nl.on{color:#eef0f6}
.dash-root .nl.cyan{color:#8ff0e4}
@keyframes dblink{0%,100%{opacity:1}50%{opacity:.35}}
.dash-root .small{font-size:11px;color:rgba(238,240,246,.5)}
.dash-root .act{font-family:var(--disp);font-size:10px;letter-spacing:1px;color:rgba(170,165,255,.9);text-align:right;white-space:nowrap}
.dash-root .review{color:var(--amber);font-weight:600;animation:dtextglow 1.6s ease-in-out infinite}
@keyframes dtextglow{0%,100%{text-shadow:0 0 0 rgba(245,181,68,0)}50%{text-shadow:0 0 12px rgba(245,181,68,.85)}}
.dash-root .prtag{font-size:10px;color:var(--amber);margin-top:3px;letter-spacing:.3px;opacity:.9}
.dash-root .legend{display:flex;gap:18px;padding:12px 24px;font-size:10px;color:rgba(238,240,246,.45);border-top:1px solid var(--line);flex-wrap:wrap}
.dash-root .legend span{display:inline-flex;align-items:center;gap:7px}
.dash-root .lz{width:9px;height:9px;border-radius:50%}
.dash-root .lz.blink{animation:dblink 1.2s ease-in-out infinite}
.dash-root .empty{padding:34px 24px;text-align:center;font-size:12.5px;color:rgba(238,240,246,.5)}
.dash-root .empty.err{color:#ffb0b0}
`;
