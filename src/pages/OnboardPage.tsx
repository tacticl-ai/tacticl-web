// src/pages/OnboardPage.tsx
// Full-bleed "ONBOARD" HUD sign-up WIZARD — registers the user's first Product
// (name + repos + channels). Shares the exact DashboardPage/SettingsHubPage HUD chrome
// (fixed full-bleed, scoped <style> under .onb-root, TACTICL // ONBOARD brand + beacon,
// palette --accent #6C63FF / --cyan #15E0C8 / --amber / --red, Chakra Petch + JetBrains
// Mono). A left step-rail (Product · Repositories · Channels · Review) replaces the top
// nav-active; Back/Next walk the steps with per-step validation. The final REGISTER step
// calls useCreateProduct() and, on success, navigates to /dashboard. This is the first-run
// surface — App's LandingOrDashboard redirects authenticated users with zero products here.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateProduct } from '../hooks/useProducts';
import type { ChannelSpec, RegisterProductRequest, RepoSpec } from '../api/types';

// ── Step model ─────────────────────────────────────────────────────────────────
type StepId = 'product' | 'repos' | 'channels' | 'review';

const STEPS: { id: StepId; label: string; hint: string }[] = [
  { id: 'product', label: 'PRODUCT', hint: 'Name your product' },
  { id: 'repos', label: 'REPOSITORIES', hint: 'Connect or create repos' },
  { id: 'channels', label: 'CHANNELS', hint: 'Trigger surfaces' },
  { id: 'review', label: 'REVIEW', hint: 'Confirm & register' },
];

// ── Editable row models (UI-side; flattened to RepoSpec/ChannelSpec on submit) ──
type RepoMode = 'connect' | 'create';
interface RepoRow {
  id: string;
  mode: RepoMode;
  url: string;
  repoName: string;
  isPrivate: boolean;
}

type ChannelKind = 'DISCORD' | 'TELEGRAM';
interface ChannelRow {
  id: string;
  channelType: ChannelKind;
  label: string;
  // DISCORD
  guildId: string;
  channelId: string;
  // TELEGRAM
  chatId: string;
}

const DEFAULT_OWNER = 'tacticl-ai';

let _rid = 0;
const rid = () => `r${++_rid}`;

function newRepoRow(): RepoRow {
  return { id: rid(), mode: 'connect', url: '', repoName: '', isPrivate: true };
}
function newChannelRow(kind: ChannelKind): ChannelRow {
  return { id: rid(), channelType: kind, label: '', guildId: '', channelId: '', chatId: '' };
}

// ── Validation helpers ──────────────────────────────────────────────────────────
const GH_URL = /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+\/?$/i;

function repoRowValid(r: RepoRow): boolean {
  if (r.mode === 'connect') return GH_URL.test(r.url.trim());
  return r.repoName.trim().length > 0;
}
function channelRowValid(c: ChannelRow): boolean {
  if (!c.label.trim()) return false;
  if (c.channelType === 'DISCORD') return !!c.guildId.trim() && !!c.channelId.trim();
  return !!c.chatId.trim();
}

function repoLabel(r: RepoRow): string {
  if (r.mode === 'connect') return r.url.trim() || '(empty)';
  return `${DEFAULT_OWNER}/${r.repoName.trim() || '(name)'} · NEW${r.isPrivate ? ' · private' : ''}`;
}
function channelExternalKey(c: ChannelRow): string {
  return c.channelType === 'DISCORD' ? `${c.guildId.trim()}:${c.channelId.trim()}` : c.chatId.trim();
}

// ════════════════════════════════════════════════════════════════════════════════
export default function OnboardPage() {
  const navigate = useNavigate();
  const create = useCreateProduct();

  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];

  const [name, setName] = useState('');
  const [repos, setRepos] = useState<RepoRow[]>([newRepoRow()]);
  const [channels, setChannels] = useState<ChannelRow[]>([]);

  // ── per-step validity ──────────────────────────────────────────────────────
  const reposValid = repos.every(repoRowValid); // empty array is valid (skippable)
  const channelsValid = channels.every(channelRowValid);
  const canNext =
    step.id === 'product'
      ? name.trim().length > 0
      : step.id === 'repos'
      ? reposValid
      : step.id === 'channels'
      ? channelsValid
      : true;

  const goNext = () => { if (canNext && stepIdx < STEPS.length - 1) setStepIdx((i) => i + 1); };
  const goBack = () => setStepIdx((i) => Math.max(0, i - 1));

  // ── repo row ops ───────────────────────────────────────────────────────────
  const addRepo = () => setRepos((rs) => [...rs, newRepoRow()]);
  const removeRepo = (id: string) => setRepos((rs) => rs.filter((r) => r.id !== id));
  const patchRepo = (id: string, patch: Partial<RepoRow>) =>
    setRepos((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  // ── channel row ops ────────────────────────────────────────────────────────
  const addChannel = (kind: ChannelKind) => setChannels((cs) => [...cs, newChannelRow(kind)]);
  const removeChannel = (id: string) => setChannels((cs) => cs.filter((c) => c.id !== id));
  const patchChannel = (id: string, patch: Partial<ChannelRow>) =>
    setChannels((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  // ── submit ─────────────────────────────────────────────────────────────────
  const submit = () => {
    const repoSpecs: RepoSpec[] = repos.filter(repoRowValid).map((r) =>
      // Backend RepoSpecDto uses primitive booleans (create/isPrivate) — always send them
      // so the connect-existing path doesn't fail JSON binding.
      r.mode === 'connect'
        ? { url: r.url.trim(), create: false, owner: '', repoName: '', isPrivate: false }
        : { create: true, owner: DEFAULT_OWNER, repoName: r.repoName.trim(), isPrivate: r.isPrivate },
    );
    const channelSpecs: ChannelSpec[] = channels.filter(channelRowValid).map((c) => ({
      channelType: c.channelType,
      externalKey: channelExternalKey(c),
      label: c.label.trim(),
    }));
    const body: RegisterProductRequest = { name: name.trim(), repos: repoSpecs, channels: channelSpecs };
    create.mutate(body, { onSuccess: () => navigate('/dashboard') });
  };

  const validRepoCount = repos.filter(repoRowValid).length;
  const validChannelCount = channels.filter(channelRowValid).length;

  return (
    <div className="onb-root">
      <style>{CSS}</style>
      <div className="grid-bg" />
      <div className="scan" />

      <div className="stage">
        {/* ── top bar (shared HUD chrome) ─────────────────────────────────── */}
        <div className="top">
          <div className="brand"><span className="beacon" />TACTICL <span className="sep">//</span> ONBOARD</div>
          <div className="topright">
            <span className="muted">FIRST RUN · PRODUCT SETUP</span>
          </div>
        </div>

        {/* ── head ────────────────────────────────────────────────────────── */}
        <div className="head">
          <div>
            <h1 className="h1">REGISTER <span className="b">PRODUCT</span></h1>
            <div className="sub">STEP {stepIdx + 1} / {STEPS.length} · {step.label}</div>
          </div>
          <div className="progress">
            {STEPS.map((s, i) => (
              <span
                key={s.id}
                className={`pseg ${i < stepIdx ? 'done' : i === stepIdx ? 'cur' : ''}`}
              />
            ))}
          </div>
        </div>

        {/* ── two-column: step rail + active panel ────────────────────────── */}
        <div className="hub">
          <aside className="snav">
            {STEPS.map((s, i) => {
              const state = i < stepIdx ? 'done' : i === stepIdx ? 'active' : 'todo';
              return (
                <button
                  key={s.id}
                  className={`sitem ${state}`}
                  disabled={i > stepIdx}
                  onClick={() => { if (i < stepIdx) setStepIdx(i); }}
                >
                  <span className="sdot">{i < stepIdx ? '✓' : i + 1}</span>
                  <span className="stext">
                    <span className="slabel">{s.label}</span>
                    <span className="shint">{s.hint}</span>
                  </span>
                </button>
              );
            })}
          </aside>

          <div className="pane">
            {step.id === 'product' && (
              <Panel title="PRODUCT" tag="STEP 1">
                <div className="bdesc">
                  A <b>Product</b> is the thing Tacticl builds and operates for you — it bundles the repositories
                  it works in and the channels you can talk to it through. Let's start with a name.
                </div>
                <Field label="PRODUCT NAME" hint="e.g. Tacticl, Marketiz, Internal Tools">
                  <input
                    className="inp"
                    autoFocus
                    placeholder="My Product"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && canNext && goNext()}
                  />
                </Field>
              </Panel>
            )}

            {step.id === 'repos' && (
              <Panel
                title="REPOSITORIES"
                tag="STEP 2"
                action={<button className="btn ghost sm" onClick={addRepo}>+ ADD REPO</button>}
              >
                <div className="bdesc">
                  Connect the GitHub repositories Tacticl works in. <b>Connect existing</b> (paste a github.com URL)
                  or <b>create new</b> (we'll make a fresh repo under <span className="kbd">{DEFAULT_OWNER}</span>).
                  You can skip this and add repos later, but at least one lets builds land code.
                </div>

                {repos.length === 0 ? (
                  <NotConnected
                    title="NO REPOSITORIES"
                    desc="Add a repo so Tacticl has somewhere to land code, or continue and connect one later."
                    cta="ADD REPO"
                    onCta={addRepo}
                  />
                ) : (
                  <div className="rows">
                    {repos.map((r, idx) => {
                      const invalid = !repoRowValid(r);
                      return (
                        <div className={`erow ${invalid ? 'bad' : ''}`} key={r.id}>
                          <div className="erow-head">
                            <span className="erow-n">REPO {idx + 1}</span>
                            <div className="seg-toggle">
                              <button
                                className={`segbtn ${r.mode === 'connect' ? 'on' : ''}`}
                                onClick={() => patchRepo(r.id, { mode: 'connect' })}
                              >CONNECT EXISTING</button>
                              <button
                                className={`segbtn ${r.mode === 'create' ? 'on' : ''}`}
                                onClick={() => patchRepo(r.id, { mode: 'create' })}
                              >CREATE NEW</button>
                            </div>
                            <button className="btn ghost sm danger" onClick={() => removeRepo(r.id)}>REMOVE</button>
                          </div>

                          {r.mode === 'connect' ? (
                            <Field label="GITHUB URL" hint="https://github.com/owner/repo">
                              <input
                                className="inp"
                                placeholder="https://github.com/owner/repo"
                                value={r.url}
                                onChange={(e) => patchRepo(r.id, { url: e.target.value })}
                              />
                            </Field>
                          ) : (
                            <div className="fgrid">
                              <Field label="REPO NAME" hint={`owner: ${DEFAULT_OWNER}`}>
                                <input
                                  className="inp"
                                  placeholder="my-new-repo"
                                  value={r.repoName}
                                  onChange={(e) => patchRepo(r.id, { repoName: e.target.value })}
                                />
                              </Field>
                              <Field label="VISIBILITY">
                                <button
                                  className={`toggle ${r.isPrivate ? 'on' : ''}`}
                                  onClick={() => patchRepo(r.id, { isPrivate: !r.isPrivate })}
                                >
                                  <span className="tknob" />
                                  <span className="tlabel">{r.isPrivate ? 'PRIVATE' : 'PUBLIC'}</span>
                                </button>
                              </Field>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Panel>
            )}

            {step.id === 'channels' && (
              <Panel
                title="CHANNELS"
                tag="STEP 3 · OPTIONAL"
                action={
                  <div className="add-pair">
                    <button className="btn ghost sm" onClick={() => addChannel('DISCORD')}>+ DISCORD</button>
                    <button className="btn ghost sm" onClick={() => addChannel('TELEGRAM')}>+ TELEGRAM</button>
                  </div>
                }
              >
                <div className="bdesc">
                  Connect channels your product runs through. Once linked, you can <b>trigger builds by messaging
                  Tacticl</b> in that Discord channel or Telegram chat — no dashboard needed. This step is optional.
                </div>

                {channels.length === 0 ? (
                  <NotConnected
                    title="NO CHANNELS"
                    desc="Skip this for now, or wire up a Discord channel / Telegram chat to message Tacticl directly."
                  />
                ) : (
                  <div className="rows">
                    {channels.map((c) => {
                      const invalid = !channelRowValid(c);
                      return (
                        <div className={`erow ${invalid ? 'bad' : ''}`} key={c.id}>
                          <div className="erow-head">
                            <span className={`tag ${c.channelType === 'DISCORD' ? 'violet' : 'cyan'}`}>
                              {c.channelType}
                            </span>
                            <span className="erow-spacer" />
                            <button className="btn ghost sm danger" onClick={() => removeChannel(c.id)}>REMOVE</button>
                          </div>

                          <Field label="LABEL" hint="How this channel shows up in your dashboard">
                            <input
                              className="inp"
                              placeholder={c.channelType === 'DISCORD' ? '#builds' : 'Ops chat'}
                              value={c.label}
                              onChange={(e) => patchChannel(c.id, { label: e.target.value })}
                            />
                          </Field>

                          {c.channelType === 'DISCORD' ? (
                            <div className="fgrid">
                              <Field label="GUILD ID" hint="Server ID">
                                <input
                                  className="inp"
                                  placeholder="123456789012345678"
                                  value={c.guildId}
                                  onChange={(e) => patchChannel(c.id, { guildId: e.target.value })}
                                />
                              </Field>
                              <Field label="CHANNEL ID" hint="Text channel ID">
                                <input
                                  className="inp"
                                  placeholder="987654321098765432"
                                  value={c.channelId}
                                  onChange={(e) => patchChannel(c.id, { channelId: e.target.value })}
                                />
                              </Field>
                            </div>
                          ) : (
                            <Field label="CHAT ID" hint="Telegram chat or group ID">
                              <input
                                className="inp"
                                placeholder="-1001234567890"
                                value={c.chatId}
                                onChange={(e) => patchChannel(c.id, { chatId: e.target.value })}
                              />
                            </Field>
                          )}

                          {!invalid && (
                            <div className="keypeek">externalKey → <span className="kbd">{channelExternalKey(c)}</span></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Panel>
            )}

            {step.id === 'review' && (
              <Panel title="REVIEW" tag="STEP 4">
                <div className="bdesc">Confirm the details below, then register your product.</div>

                <div className="block">
                  <div className="bhead">PRODUCT</div>
                  <div className="rev-line"><span className="rev-k">NAME</span><span className="rev-v">{name.trim() || '—'}</span></div>
                </div>

                <div className="block">
                  <div className="bhead">REPOSITORIES · {validRepoCount}</div>
                  {validRepoCount === 0 ? (
                    <div className="dim">None — you can connect repos later from Settings › Repos.</div>
                  ) : (
                    <div className="rows tight">
                      {repos.filter(repoRowValid).map((r) => (
                        <div className="lrow" key={r.id}>
                          <span className={`ldot ${r.mode === 'create' ? 'cyan' : 'violet'}`} />
                          <div className="lmain"><div className="lname">{repoLabel(r)}</div></div>
                          <span className={`tag ${r.mode === 'create' ? 'cyan' : 'violet'}`}>
                            {r.mode === 'create' ? 'CREATE' : 'CONNECT'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="block">
                  <div className="bhead">CHANNELS · {validChannelCount}</div>
                  {validChannelCount === 0 ? (
                    <div className="dim">None — your product will only run from the dashboard for now.</div>
                  ) : (
                    <div className="rows tight">
                      {channels.filter(channelRowValid).map((c) => (
                        <div className="lrow" key={c.id}>
                          <span className={`ldot ${c.channelType === 'DISCORD' ? 'violet' : 'cyan'}`} />
                          <div className="lmain">
                            <div className="lname">{c.label.trim()}</div>
                            <div className="lsub">{c.channelType} · {channelExternalKey(c)}</div>
                          </div>
                          <span className={`tag ${c.channelType === 'DISCORD' ? 'violet' : 'cyan'}`}>{c.channelType}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {create.isError && (
                  <div className="banner err">
                    {(create.error as Error)?.message
                      ? `Registration failed: ${(create.error as Error).message}`
                      : 'Registration failed. Please try again.'}
                  </div>
                )}
              </Panel>
            )}

            {/* ── wizard nav ─────────────────────────────────────────────── */}
            <div className="wiznav">
              <button className="btn ghost" disabled={stepIdx === 0 || create.isPending} onClick={goBack}>
                ← BACK
              </button>
              {step.id !== 'review' ? (
                <button className="btn primary" disabled={!canNext} onClick={goNext}>
                  NEXT →
                </button>
              ) : (
                <button className="btn primary" disabled={!name.trim() || create.isPending} onClick={submit}>
                  {create.isPending ? 'REGISTERING…' : 'REGISTER →'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={{ height: 46 }} />
      </div>
    </div>
  );
}

// ── Shared HUD primitives (panel / not-connected / field) ───────────────────────
function Panel({
  title, tag, action, children,
}: { title: string; tag?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="panel">
      <div className="phead">
        <div className="ptitle">{title}</div>
        {tag && <div className="ptag">{tag}</div>}
        {action && <div className="paction">{action}</div>}
      </div>
      <div className="pbody">{children}</div>
    </div>
  );
}

function NotConnected({ title, desc, cta, onCta }: { title: string; desc: string; cta?: string; onCta?: () => void }) {
  return (
    <div className="nc">
      <div className="ncbeacon" />
      <div className="nctitle">{title}</div>
      <div className="ncdesc">{desc}</div>
      {cta && onCta && <button className="btn primary sm" onClick={onCta}>+ {cta}</button>}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span className="flabel">{label}</span>
      {children}
      {hint && <span className="fhint">{hint}</span>}
    </label>
  );
}

const CSS = `
.onb-root{position:fixed;inset:0;overflow-y:auto;color:#eef0f6;font-family:var(--mono);letter-spacing:.2px;
  --accent:#6C63FF;--magenta:#B25CFF;--cyan:#15E0C8;--red:#FF6B6B;--amber:#F5B544;
  --ink:#070a0c;--glass1:rgba(22,28,34,.66);--glass2:rgba(11,15,19,.66);
  --disp:"Chakra Petch",sans-serif;--mono:"JetBrains Mono",ui-monospace,monospace;--line:rgba(108,99,255,.14);
  background:radial-gradient(1300px 820px at 50% -8%,rgba(108,99,255,.16),transparent 58%),
    radial-gradient(1000px 760px at 92% 110%,rgba(178,92,255,.10),transparent 60%),
    radial-gradient(760px 620px at 4% 18%,rgba(21,224,200,.06),transparent 60%),var(--ink);}
.onb-root .grid-bg{position:fixed;inset:0;pointer-events:none;opacity:.45;z-index:0;
  background-image:linear-gradient(rgba(108,99,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(108,99,255,.06) 1px,transparent 1px);
  background-size:54px 54px;-webkit-mask-image:radial-gradient(ellipse 80% 70% at 50% 32%,#000 35%,transparent 78%);}
.onb-root .scan{position:fixed;left:0;right:0;height:160px;z-index:1;pointer-events:none;
  background:linear-gradient(rgba(108,99,255,.07),transparent);animation:oscan 8s linear infinite;}
@keyframes oscan{0%{transform:translateY(-160px)}100%{transform:translateY(100vh)}}
.onb-root .stage{position:relative;z-index:2}
.onb-root .top{display:flex;align-items:center;justify-content:space-between;padding:22px 34px 10px}
.onb-root .brand{display:flex;align-items:center;gap:13px;font-family:var(--disp);font-size:18px;letter-spacing:7px;font-weight:600}
.onb-root .beacon{width:11px;height:11px;border-radius:50%;background:var(--accent);position:relative;box-shadow:0 0 14px var(--accent)}
.onb-root .beacon::after{content:"";position:absolute;inset:-6px;border-radius:50%;border:1.5px solid var(--accent);animation:ohalo 2.2s ease-out infinite}
@keyframes ohalo{0%{transform:scale(.5);opacity:.9}100%{transform:scale(2.1);opacity:0}}
.onb-root .sep{color:var(--accent)}
.onb-root .topright{display:flex;align-items:center;gap:18px}
.onb-root .muted{color:rgba(238,240,246,.42);font-size:11px;letter-spacing:1px}
.onb-root .head{padding:14px 34px 2px;display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:14px}
.onb-root .h1{font-family:var(--disp);font-size:30px;letter-spacing:9px;font-weight:600;margin:0;line-height:1}
.onb-root .h1 .b{background:linear-gradient(90deg,var(--accent),var(--magenta));-webkit-background-clip:text;background-clip:text;color:transparent}
.onb-root .sub{font-size:11px;color:rgba(238,240,246,.4);letter-spacing:3px;margin-top:8px}
.onb-root .progress{display:flex;gap:8px;align-items:center}
.onb-root .pseg{width:46px;height:5px;border-radius:999px;background:rgba(238,240,246,.12);transition:.25s}
.onb-root .pseg.done{background:var(--cyan);box-shadow:0 0 8px rgba(21,224,200,.5)}
.onb-root .pseg.cur{background:var(--accent);box-shadow:0 0 10px var(--accent)}

/* ── hub: step rail + pane ──────────────────────────────────────────────── */
.onb-root .hub{display:grid;grid-template-columns:248px 1fr;gap:18px;padding:18px 34px 0;align-items:start}
@media (max-width:820px){.onb-root .hub{grid-template-columns:1fr}}
.onb-root .snav{display:flex;flex-direction:column;gap:8px;position:sticky;top:18px}
@media (max-width:820px){.onb-root .snav{flex-direction:row;flex-wrap:wrap;position:static}}
.onb-root .sitem{display:flex;align-items:center;gap:11px;text-align:left;padding:13px 15px;border-radius:13px;cursor:pointer;
  border:1px solid var(--line);background:linear-gradient(180deg,var(--glass1),var(--glass2));backdrop-filter:blur(16px);
  color:#eef0f6;font-family:var(--mono);transition:.18s}
.onb-root .sitem:not(:disabled):hover{border-color:rgba(108,99,255,.4);background:rgba(108,99,255,.08)}
.onb-root .sitem.active{border-color:var(--accent);background:rgba(108,99,255,.16);box-shadow:0 0 18px rgba(108,99,255,.18)}
.onb-root .sitem.todo{opacity:.55}
.onb-root .sitem:disabled{cursor:default}
.onb-root .sitem .sdot{width:22px;height:22px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;
  font-family:var(--disp);font-size:11px;font-weight:600;background:rgba(238,240,246,.1);color:rgba(238,240,246,.6);border:1px solid rgba(238,240,246,.14)}
.onb-root .sitem.active .sdot{background:var(--accent);color:#fff;border-color:var(--accent);box-shadow:0 0 10px var(--accent)}
.onb-root .sitem.done .sdot{background:rgba(21,224,200,.16);color:var(--cyan);border-color:var(--cyan)}
.onb-root .stext{display:flex;flex-direction:column;gap:3px;min-width:0}
.onb-root .slabel{font-family:var(--disp);font-size:12px;letter-spacing:2.4px;font-weight:600}
.onb-root .shint{font-size:9.5px;letter-spacing:.4px;color:rgba(238,240,246,.4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.onb-root .sitem.active .shint{color:rgba(189,184,255,.7)}

/* ── panel ──────────────────────────────────────────────────────────────── */
.onb-root .pane{min-width:0;display:flex;flex-direction:column;gap:16px}
.onb-root .panel{border:1px solid var(--line);border-radius:16px;overflow:hidden;
  background:linear-gradient(180deg,var(--glass1),var(--glass2));backdrop-filter:blur(18px);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.04),inset 0 0 60px rgba(108,99,255,.04),0 18px 60px rgba(0,0,0,.55);position:relative}
.onb-root .panel::before,.onb-root .panel::after{content:"";position:absolute;width:18px;height:18px;border:0 solid rgba(108,99,255,.6);pointer-events:none;z-index:2}
.onb-root .panel::before{top:8px;left:8px;border-top-width:1.5px;border-left-width:1.5px}
.onb-root .panel::after{bottom:8px;right:8px;border-bottom-width:1.5px;border-right-width:1.5px}
.onb-root .phead{display:flex;align-items:center;gap:12px;padding:14px 22px;border-bottom:1px solid var(--line)}
.onb-root .ptitle{font-family:var(--disp);font-size:13px;letter-spacing:3px;color:var(--accent);font-weight:600}
.onb-root .ptag{font-size:10px;letter-spacing:1px;color:rgba(238,240,246,.4)}
.onb-root .paction{margin-left:auto}
.onb-root .add-pair{display:flex;gap:7px}
.onb-root .pbody{padding:20px 22px}

/* ── blocks / fields ────────────────────────────────────────────────────── */
.onb-root .block{padding-bottom:18px;margin-bottom:18px;border-bottom:1px solid rgba(108,99,255,.08)}
.onb-root .block:last-of-type{border-bottom:none;margin-bottom:0;padding-bottom:2px}
.onb-root .bhead{font-family:var(--disp);font-size:11px;letter-spacing:2.2px;color:#eef0f6;font-weight:600;margin-bottom:12px}
.onb-root .bdesc{font-size:12px;color:rgba(238,240,246,.55);margin-bottom:18px;line-height:1.6}
.onb-root .bdesc b{color:#cfd2e0;font-weight:600}
.onb-root .kbd{font-family:var(--mono);font-size:11px;color:#bdb8ff;background:rgba(108,99,255,.12);border:1px solid rgba(108,99,255,.22);border-radius:6px;padding:1px 6px}
.onb-root .fgrid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media (max-width:620px){.onb-root .fgrid{grid-template-columns:1fr}}
.onb-root .field{display:flex;flex-direction:column;gap:6px}
.onb-root .flabel{font-family:var(--disp);font-size:9.5px;letter-spacing:1.6px;color:rgba(238,240,246,.5)}
.onb-root .fhint{font-size:10px;color:rgba(238,240,246,.36);line-height:1.4}
.onb-root .inp{width:100%;box-sizing:border-box;background:rgba(7,10,12,.55);border:1px solid rgba(108,99,255,.22);border-radius:10px;
  color:#eef0f6;font-family:var(--mono);font-size:13px;padding:10px 12px;outline:none;transition:.16s}
.onb-root .inp:focus{border-color:var(--accent);box-shadow:0 0 0 2px rgba(108,99,255,.18)}

/* ── editable rows (repo/channel) ───────────────────────────────────────── */
.onb-root .rows{display:flex;flex-direction:column;gap:12px}
.onb-root .rows.tight{gap:8px}
.onb-root .erow{padding:15px;border-radius:13px;border:1px solid var(--line);background:rgba(108,99,255,.04);display:flex;flex-direction:column;gap:14px;transition:.16s}
.onb-root .erow.bad{border-color:rgba(245,181,68,.34);background:rgba(245,181,68,.05)}
.onb-root .erow-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.onb-root .erow-n{font-family:var(--disp);font-size:10px;letter-spacing:2px;color:rgba(238,240,246,.5)}
.onb-root .erow-spacer{flex:1}
.onb-root .seg-toggle{display:flex;border:1px solid rgba(108,99,255,.24);border-radius:9px;overflow:hidden}
.onb-root .segbtn{font-family:var(--disp);font-size:9.5px;letter-spacing:1.2px;padding:7px 11px;cursor:pointer;background:transparent;border:none;color:rgba(189,184,255,.75);transition:.16s}
.onb-root .segbtn:hover{background:rgba(108,99,255,.1);color:#fff}
.onb-root .segbtn.on{background:rgba(108,99,255,.22);color:#fff;box-shadow:inset 0 0 14px rgba(108,99,255,.2)}
.onb-root .keypeek{font-size:10.5px;color:rgba(238,240,246,.45)}

/* ── visibility toggle ──────────────────────────────────────────────────── */
.onb-root .toggle{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;cursor:pointer;
  border:1px solid rgba(108,99,255,.22);background:rgba(7,10,12,.55);transition:.16s;height:40px;box-sizing:border-box}
.onb-root .toggle .tknob{width:34px;height:18px;border-radius:999px;background:rgba(238,240,246,.14);position:relative;transition:.18s;flex-shrink:0}
.onb-root .toggle .tknob::after{content:"";position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#cfd2e0;transition:.18s}
.onb-root .toggle.on .tknob{background:rgba(108,99,255,.5)}
.onb-root .toggle.on .tknob::after{left:18px;background:#fff;box-shadow:0 0 8px var(--accent)}
.onb-root .toggle .tlabel{font-family:var(--disp);font-size:10px;letter-spacing:1.6px;color:#eef0f6}

/* ── review rows ────────────────────────────────────────────────────────── */
.onb-root .rev-line{display:flex;gap:14px;align-items:baseline}
.onb-root .rev-k{font-family:var(--disp);font-size:10px;letter-spacing:1.6px;color:rgba(238,240,246,.45);min-width:64px}
.onb-root .rev-v{font-size:14px;color:#eef0f6}
.onb-root .lrow{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:12px;border:1px solid var(--line);background:rgba(108,99,255,.04)}
.onb-root .ldot{width:9px;height:9px;border-radius:50%;flex-shrink:0}
.onb-root .ldot.violet{background:var(--accent);box-shadow:0 0 8px var(--accent)}
.onb-root .ldot.cyan{background:var(--cyan);box-shadow:0 0 8px var(--cyan)}
.onb-root .lmain{flex:1;min-width:0}
.onb-root .lname{font-family:var(--disp);font-size:13px;font-weight:500;color:#eef0f6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.onb-root .lsub{font-size:10.5px;color:rgba(238,240,246,.42);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.onb-root .dim{font-size:12px;color:rgba(238,240,246,.42)}

/* ── tags ───────────────────────────────────────────────────────────────── */
.onb-root .tag{display:inline-flex;align-items:center;gap:6px;font-family:var(--disp);font-size:9.5px;letter-spacing:1.2px;padding:5px 10px;border-radius:999px;white-space:nowrap}
.onb-root .tag.violet{color:#bdb8ff;border:1px solid var(--accent);background:rgba(108,99,255,.13)}
.onb-root .tag.cyan{color:#8ff0e4;border:1px solid var(--cyan);background:rgba(21,224,200,.1)}

/* ── buttons ────────────────────────────────────────────────────────────── */
.onb-root .btn{font-family:var(--disp);font-size:11px;letter-spacing:1.6px;font-weight:600;padding:9px 16px;border-radius:10px;cursor:pointer;transition:.16s;border:1px solid transparent;white-space:nowrap}
.onb-root .btn.sm{padding:7px 12px;font-size:10px;letter-spacing:1.2px}
.onb-root .btn:disabled{opacity:.4;cursor:not-allowed}
.onb-root .btn.primary{color:#fff;border-color:var(--accent);background:rgba(108,99,255,.2)}
.onb-root .btn.primary:not(:disabled):hover{background:rgba(108,99,255,.34);box-shadow:0 0 18px rgba(108,99,255,.3)}
.onb-root .btn.ghost{color:rgba(189,184,255,.9);border-color:rgba(108,99,255,.3);background:rgba(108,99,255,.05)}
.onb-root .btn.ghost:not(:disabled):hover{border-color:var(--accent);color:#fff;background:rgba(108,99,255,.14)}
.onb-root .btn.ghost.danger{color:#ffb0b0;border-color:rgba(255,107,107,.32);background:rgba(255,107,107,.05)}
.onb-root .btn.ghost.danger:hover{border-color:var(--red);color:#fff;background:rgba(255,107,107,.16)}

/* ── wizard nav ─────────────────────────────────────────────────────────── */
.onb-root .wiznav{display:flex;justify-content:space-between;gap:10px;padding:2px}

/* ── not-connected / banners ────────────────────────────────────────────── */
.onb-root .nc{display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px;padding:40px 24px}
.onb-root .ncbeacon{width:13px;height:13px;border-radius:50%;background:rgba(108,99,255,.4);position:relative;box-shadow:0 0 14px rgba(108,99,255,.5)}
.onb-root .ncbeacon::after{content:"";position:absolute;inset:-7px;border-radius:50%;border:1.5px solid rgba(108,99,255,.5);animation:ohalo 2.4s ease-out infinite}
.onb-root .nctitle{font-family:var(--disp);font-size:13px;letter-spacing:2.4px;color:#eef0f6;font-weight:600}
.onb-root .ncdesc{font-size:12px;color:rgba(238,240,246,.5);max-width:420px;line-height:1.6}
.onb-root .banner{padding:10px 14px;border-radius:10px;font-size:11.5px;margin-top:14px;letter-spacing:.3px;word-break:break-word}
.onb-root .banner.err{color:#ffb0b0;border:1px solid rgba(255,107,107,.3);background:rgba(255,107,107,.08)}
`;
