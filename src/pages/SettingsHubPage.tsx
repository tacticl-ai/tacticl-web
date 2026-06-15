// src/pages/SettingsHubPage.tsx
// Full-bleed "SETTINGS" HUD surface — consolidates General config + Repos + Tokens
// + Devices into ONE hub with a left in-page section nav and a glass panel on the
// right. Shares the exact DashboardPage HUD chrome (fixed full-bleed, scoped <style>
// under .set-root, TACTICL // SETTINGS brand + beacon, COMMAND/DASHBOARD/LINKS/SETTINGS
// top nav). Reuses the existing api/* + hooks/* (TanStack Query). Each section degrades
// gracefully to a HUD empty/error state — the repos/tokens/devices endpoints currently
// 404/500, so those panels never crash; General settings stays fully functional.
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api/settings';
import type { UserConfig } from '../api/settings';
import { useRepos, useRevokeRepo, useGrantRepo } from '../hooks/useRepos';
import { useTokens, useRemoveToken, useCreateToken } from '../hooks/useTokens';
import { useDevices, useRemoveDevice } from '../hooks/useDevices';
import { useCreatePairingCode } from '../hooks/useDevicePairing';
import type {
  RepoProvider,
  RepoAccessLevel,
  TokenProvider,
  Device,
  DeviceState,
} from '../api/types';

type SectionId = 'general' | 'repos' | 'tokens' | 'devices';

const SECTIONS: { id: SectionId; label: string; hint: string }[] = [
  { id: 'general', label: 'GENERAL', hint: 'Limits · domains · account' },
  { id: 'repos', label: 'REPOS', hint: 'Connected repositories' },
  { id: 'tokens', label: 'TOKENS', hint: 'Agent API keys' },
  { id: 'devices', label: 'DEVICES', hint: 'Paired workers' },
];

// ── small date helper (avoids pulling date-fns into a fresh file) ───────────────
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

export default function SettingsHubPage() {
  const navigate = useNavigate();
  const [section, setSection] = useState<SectionId>('general');

  return (
    <div className="set-root">
      <style>{CSS}</style>
      <div className="grid-bg" />
      <div className="scan" />

      <div className="stage">
        {/* ── top bar (shared HUD chrome) ─────────────────────────────────── */}
        <div className="top">
          <div className="brand"><span className="beacon" />TACTICL <span className="sep">//</span> SETTINGS</div>
          <div className="topright">
            <span className="muted">PRODUCT · TACTICL</span>
            <div className="nav">
              <a className="chip" onClick={() => navigate('/command')}>COMMAND</a>
              <a className="chip" onClick={() => navigate('/dashboard')}>DASHBOARD</a>
              <a className="chip" onClick={() => navigate('/links')}>LINKS</a>
              <a className="chip active">SETTINGS</a>
            </div>
          </div>
        </div>

        {/* ── head ────────────────────────────────────────────────────────── */}
        <div className="head">
          <div>
            <h1 className="h1">SYSTEM <span className="b">SETTINGS</span></h1>
            <div className="sub">AGENT CONFIG · ACCESS · WORKERS</div>
          </div>
        </div>

        {/* ── two-column hub: section nav + active panel ──────────────────── */}
        <div className="hub">
          <aside className="snav">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                className={`sitem ${section === s.id ? 'active' : ''}`}
                onClick={() => setSection(s.id)}
              >
                <span className="sdot" />
                <span className="stext">
                  <span className="slabel">{s.label}</span>
                  <span className="shint">{s.hint}</span>
                </span>
              </button>
            ))}
          </aside>

          <div className="pane">
            {section === 'general' && <GeneralSection />}
            {section === 'repos' && <ReposSection />}
            {section === 'tokens' && <TokensSection />}
            {section === 'devices' && <DevicesSection />}
          </div>
        </div>

        <div style={{ height: 46 }} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GENERAL — agent limits + domain controls + account (fully functional)
// ═══════════════════════════════════════════════════════════════════════════════
function GeneralSection() {
  const qc = useQueryClient();
  const { data: saved, isLoading, isError } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get(),
    staleTime: 30_000,
    retry: false,
  });

  const [local, setLocal] = useState<UserConfig | null>(null);
  useEffect(() => { if (saved) setLocal(saved); }, [saved]);

  const update = useMutation({
    mutationFn: (cfg: Partial<UserConfig>) => settingsApi.update(cfg),
    onSuccess: (updated) => {
      qc.setQueryData(['settings'], updated);
      setLocal(updated);
    },
  });

  const dirty = !!local && !!saved && JSON.stringify(local) !== JSON.stringify(saved);

  if (isLoading) {
    return <Panel title="GENERAL" tag="USER CONFIG"><div className="empty">Loading settings…</div></Panel>;
  }
  if (isError || !local) {
    return (
      <Panel title="GENERAL" tag="USER CONFIG">
        <div className="empty err">Settings could not be loaded. The settings endpoint may not be available yet.</div>
      </Panel>
    );
  }

  return (
    <Panel title="GENERAL" tag="USER CONFIG">
      {/* Agent limits */}
      <div className="block">
        <div className="bhead">AGENT LIMITS</div>
        <div className="fgrid">
          <Field label="MAX CONCURRENT SPARKS" hint="How many sparks can run at the same time">
            <input
              className="inp"
              type="number"
              min={1}
              max={20}
              value={local.maxConcurrentSparks}
              onChange={(e) => setLocal({ ...local, maxConcurrentSparks: Math.max(1, parseInt(e.target.value) || 1) })}
            />
          </Field>
          <Field label="MONTHLY SPENDING LIMIT" hint="Set to 0 to block all spending">
            <div className="inp-affix">
              <span className="affix">$</span>
              <input
                className="inp"
                type="number"
                min={0}
                step={5}
                value={local.spendingLimit}
                onChange={(e) => setLocal({ ...local, spendingLimit: Math.max(0, parseFloat(e.target.value) || 0) })}
              />
            </div>
          </Field>
        </div>
      </div>

      {/* Domain controls */}
      <div className="block">
        <div className="bhead">DOMAIN CONTROLS</div>
        <div className="bdesc">Control which websites the agent can access. Allowlist takes precedence.</div>
        <DomainEditor
          label="ALLOWLIST · agent can always access"
          tone="cyan"
          domains={local.domainAllowlist}
          onChange={(d) => setLocal({ ...local, domainAllowlist: d })}
        />
        <div style={{ height: 14 }} />
        <DomainEditor
          label="BLOCKLIST · agent cannot access"
          tone="red"
          domains={local.domainBlocklist}
          onChange={(d) => setLocal({ ...local, domainBlocklist: d })}
        />
      </div>

      {/* Account */}
      <div className="block">
        <div className="bhead">ACCOUNT</div>
        <div className="bdesc">Account management is handled through the auth portal at auth.tacticl.ai.</div>
      </div>

      {update.isError && <div className="banner err">Failed to save settings. Please try again.</div>}

      <div className="savebar">
        {dirty && (
          <button className="btn ghost" disabled={update.isPending} onClick={() => setLocal(saved!)}>
            DISCARD
          </button>
        )}
        <button
          className="btn primary"
          disabled={!dirty || update.isPending}
          onClick={() => update.mutate(local!)}
        >
          {update.isPending ? 'SAVING…' : 'SAVE CHANGES'}
        </button>
      </div>
    </Panel>
  );
}

function DomainEditor({
  label,
  tone,
  domains,
  onChange,
}: {
  label: string;
  tone: 'cyan' | 'red';
  domains: string[];
  onChange: (d: string[]) => void;
}) {
  const [input, setInput] = useState('');
  const add = () => {
    const t = input.trim().toLowerCase();
    if (t && !domains.includes(t)) {
      onChange([...domains, t]);
      setInput('');
    }
  };
  const remove = (d: string) => onChange(domains.filter((x) => x !== d));

  return (
    <div>
      <div className="flabel">{label}</div>
      <div className="row-inline">
        <input
          className="inp"
          placeholder="e.g. example.com"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button className="btn ghost sm" onClick={add} disabled={!input.trim()}>ADD</button>
      </div>
      <div className="chips">
        {domains.length === 0 && <span className="dim">None</span>}
        {domains.map((d) => (
          <span key={d} className={`tag ${tone}`}>
            {d}
            <button className="tagx" onClick={() => remove(d)} aria-label={`Remove ${d}`}>×</button>
          </span>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPOS — connected repositories (graceful on 404/500)
// ═══════════════════════════════════════════════════════════════════════════════
function ReposSection() {
  const { data: repos, isLoading, isError } = useRepos();
  const revokeRepo = useRevokeRepo();
  const grantRepo = useGrantRepo();

  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState<RepoProvider>('GITHUB');
  const [repoFullName, setRepoFullName] = useState('');
  const [accessLevel, setAccessLevel] = useState<RepoAccessLevel>('READ');

  const list = repos ?? [];

  const openDialog = () => {
    setProvider('GITHUB');
    setRepoFullName('');
    setAccessLevel('READ');
    setOpen(true);
  };
  const submit = () => {
    if (!repoFullName.trim()) return;
    grantRepo.mutate(
      { provider, repoFullName: repoFullName.trim(), accessLevel },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <Panel
      title="REPOS"
      tag="ACCESS GRANTS"
      action={<button className="btn primary sm" onClick={openDialog}>+ CONNECT REPO</button>}
    >
      {isLoading ? (
        <div className="empty">Loading repositories…</div>
      ) : isError ? (
        <NotConnected
          title="NO REPOS CONNECTED YET"
          desc="Repository access comes from onboarding. Connect a GitHub repo to grant Tacticl access for code analysis and PRs."
          cta="CONNECT REPO"
          onCta={openDialog}
        />
      ) : list.length === 0 ? (
        <NotConnected
          title="NO REPOS CONNECTED YET"
          desc="Connect a GitHub repository to grant Tacticl access for code analysis and PRs."
          cta="CONNECT REPO"
          onCta={openDialog}
        />
      ) : (
        <div className="rows">
          {list.map((repo) => (
            <div className="lrow" key={repo.id}>
              <span className="ldot violet" />
              <div className="lmain">
                <div className="lname">{repo.repoFullName}</div>
                <div className="lsub">{repo.provider} · granted {relTime(repo.grantedAt)}</div>
              </div>
              <span className={`tag ${repo.accessLevel === 'ADMIN' ? 'red' : repo.accessLevel === 'WRITE' ? 'amber' : 'violet'}`}>
                {repo.accessLevel}
              </span>
              <button className="btn ghost sm danger" onClick={() => revokeRepo.mutate(repo.id)}>REVOKE</button>
            </div>
          ))}
        </div>
      )}

      {open && (
        <Modal title="CONNECT REPOSITORY" onClose={() => setOpen(false)}>
          <Field label="PROVIDER">
            <select className="inp" value={provider} onChange={(e) => setProvider(e.target.value as RepoProvider)}>
              <option value="GITHUB">GitHub</option>
              <option value="GITLAB">GitLab</option>
              <option value="BITBUCKET">Bitbucket</option>
            </select>
          </Field>
          <Field label="REPOSITORY">
            <input className="inp" placeholder="owner/repo" autoFocus value={repoFullName} onChange={(e) => setRepoFullName(e.target.value)} />
          </Field>
          <Field label="ACCESS LEVEL">
            <select className="inp" value={accessLevel} onChange={(e) => setAccessLevel(e.target.value as RepoAccessLevel)}>
              <option value="READ">Read</option>
              <option value="WRITE">Write</option>
              <option value="ADMIN">Admin</option>
            </select>
          </Field>
          <div className="savebar">
            <button className="btn ghost" onClick={() => setOpen(false)}>CANCEL</button>
            <button className="btn primary" disabled={!repoFullName.trim() || grantRepo.isPending} onClick={submit}>
              {grantRepo.isPending ? 'CONNECTING…' : 'CONNECT'}
            </button>
          </div>
        </Modal>
      )}
    </Panel>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOKENS — agent API keys + usage meters (graceful on 404/500)
// ═══════════════════════════════════════════════════════════════════════════════
function TokensSection() {
  const { data: tokens, isLoading, isError } = useTokens();
  const removeToken = useRemoveToken();
  const createToken = useCreateToken();

  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState<TokenProvider>('ANTHROPIC');
  const [label, setLabel] = useState('');
  const [token, setToken] = useState('');

  const list = tokens ?? [];

  const openDialog = () => {
    setProvider('ANTHROPIC');
    setLabel('');
    setToken('');
    setOpen(true);
  };
  const submit = () => {
    if (!label.trim() || !token.trim()) return;
    createToken.mutate(
      { provider, label: label.trim(), token: token.trim() },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <Panel
      title="TOKENS"
      tag="AGENT KEYS"
      action={<button className="btn primary sm" onClick={openDialog}>+ ADD TOKEN</button>}
    >
      {isLoading ? (
        <div className="empty">Loading tokens…</div>
      ) : isError ? (
        <NotConnected
          title="NO TOKENS CONFIGURED YET"
          desc="API tokens come from onboarding. Add a key so Tacticl agents can interact with external services."
          cta="ADD TOKEN"
          onCta={openDialog}
        />
      ) : list.length === 0 ? (
        <NotConnected
          title="NO TOKENS CONFIGURED YET"
          desc="Add an API token so Tacticl agents can interact with external services."
          cta="ADD TOKEN"
          onCta={openDialog}
        />
      ) : (
        <div className="rows">
          {list.map((t) => {
            const dailyPct = t.usageLimits.dailyTokens > 0
              ? (t.currentUsage.todayTokens / t.usageLimits.dailyTokens) * 100 : 0;
            const monthPct = t.usageLimits.monthlyTokens > 0
              ? (t.currentUsage.monthTokens / t.usageLimits.monthlyTokens) * 100 : 0;
            return (
              <div className="card" key={t.id}>
                <div className="lrow flush">
                  <span className="ldot cyan" />
                  <div className="lmain"><div className="lname">{t.label}</div></div>
                  <span className="tag violet">{t.provider}</span>
                  <button className="btn ghost sm danger" onClick={() => removeToken.mutate(t.id)}>REMOVE</button>
                </div>
                {t.usageLimits.dailyTokens > 0 && (
                  <Meter
                    label="TODAY"
                    text={`${(t.currentUsage.todayTokens / 1000).toFixed(0)}k / ${(t.usageLimits.dailyTokens / 1000).toFixed(0)}k tokens`}
                    pct={dailyPct}
                  />
                )}
                {t.usageLimits.monthlyTokens > 0 && (
                  <Meter
                    label="THIS MONTH"
                    text={`${(t.currentUsage.monthTokens / 1_000_000).toFixed(1)}M / ${(t.usageLimits.monthlyTokens / 1_000_000).toFixed(0)}M tokens`}
                    pct={monthPct}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <Modal title="ADD TOKEN" onClose={() => setOpen(false)}>
          <Field label="PROVIDER">
            <select className="inp" value={provider} onChange={(e) => setProvider(e.target.value as TokenProvider)}>
              <option value="ANTHROPIC">Anthropic</option>
              <option value="GITHUB">GitHub</option>
              <option value="OPENAI">OpenAI</option>
            </select>
          </Field>
          <Field label="LABEL">
            <input className="inp" placeholder="e.g. Production key" autoFocus value={label} onChange={(e) => setLabel(e.target.value)} />
          </Field>
          <Field label="TOKEN">
            <input className="inp" type="password" placeholder="sk-…" value={token} onChange={(e) => setToken(e.target.value)} />
          </Field>
          <div className="savebar">
            <button className="btn ghost" onClick={() => setOpen(false)}>CANCEL</button>
            <button className="btn primary" disabled={!label.trim() || !token.trim() || createToken.isPending} onClick={submit}>
              {createToken.isPending ? 'ADDING…' : 'ADD'}
            </button>
          </div>
        </Modal>
      )}
    </Panel>
  );
}

function Meter({ label, text, pct }: { label: string; text: string; pct: number }) {
  const hot = pct > 80;
  return (
    <div className="meter">
      <div className="mtop">
        <span className="mlabel">{label}</span>
        <span className="mtext">{text}</span>
      </div>
      <div className="mtrack"><span className={`mfill ${hot ? 'hot' : ''}`} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEVICES — paired workers + pairing code (graceful on 404/500)
// ═══════════════════════════════════════════════════════════════════════════════
const STATE_TONE: Record<DeviceState, string> = { ONLINE: 'cyan', BUSY: 'amber', OFFLINE: 'dim' };

function DevicesSection() {
  const { data: devices, isLoading, isError } = useDevices();
  const removeDevice = useRemoveDevice();
  const [open, setOpen] = useState(false);

  const list = devices ?? [];

  return (
    <Panel
      title="DEVICES"
      tag="WORKERS"
      action={<button className="btn primary sm" onClick={() => setOpen(true)}>+ ADD DEVICE</button>}
    >
      {isLoading ? (
        <div className="empty">Loading devices…</div>
      ) : isError ? (
        <NotConnected
          title="NO DEVICES REGISTERED YET"
          desc="Devices are paired during onboarding. Pair your first device to start running sparks locally."
          cta="ADD DEVICE"
          onCta={() => setOpen(true)}
        />
      ) : list.length === 0 ? (
        <NotConnected
          title="NO DEVICES REGISTERED YET"
          desc="Pair your first device to start running sparks locally."
          cta="ADD DEVICE"
          onCta={() => setOpen(true)}
        />
      ) : (
        <div className="dgrid">
          {list.map((d) => (
            <DeviceTile key={d.id} device={d} onRemove={() => removeDevice.mutate(d.id)} />
          ))}
        </div>
      )}

      {open && <PairModal onClose={() => setOpen(false)} />}
    </Panel>
  );
}

function DeviceTile({ device, onRemove }: { device: Device; onRemove: () => void }) {
  const tone = STATE_TONE[device.state] ?? 'dim';
  const activePrefs = Object.entries(device.sparkPreferences)
    .filter(([, on]) => on)
    .map(([type]) => type);
  return (
    <div className="dtile">
      <div className="dhead">
        <span className={`ldot ${tone}`} />
        <div className="lmain">
          <div className="lname">{device.name}</div>
          <div className="lsub">{device.platform} · {device.deviceType.toLowerCase()}</div>
        </div>
        <button className="btn ghost sm danger" onClick={onRemove}>UNPAIR</button>
      </div>
      {device.specs && (
        <div className="dspec">{device.specs.cpuCores} cores · {device.specs.ramGb}GB RAM · {device.specs.diskFreeGb}GB free</div>
      )}
      {activePrefs.length > 0 && (
        <div className="chips">
          {activePrefs.map((p) => <span key={p} className="tag violet">{p}</span>)}
        </div>
      )}
      {device.activeDaemons > 0 && (
        <div className="ddaemon">{device.activeDaemons} active daemon{device.activeDaemons > 1 ? 's' : ''}</div>
      )}
      <div className="lsub">last seen {relTime(device.lastSeenAt)}</div>
    </div>
  );
}

function PairModal({ onClose }: { onClose: () => void }) {
  const { mutate: generate, data, isPending, isError } = useCreatePairingCode();
  const [copied, setCopied] = useState(false);

  useEffect(() => { generate(); }, [generate]);

  const code = data?.token ? `${data.token.slice(0, 3)} ${data.token.slice(3)}` : '';
  const copy = () => {
    if (data?.token) {
      navigator.clipboard.writeText(data.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal title="CONNECT A DEVICE" onClose={onClose}>
      <div className="bdesc">
        Download Tacticl Device, open it, then enter the pairing code below to link this worker.
      </div>
      <Field label="PAIRING CODE">
        {isPending ? (
          <div className="empty">Generating code…</div>
        ) : isError ? (
          <div>
            <div className="banner err">Couldn't generate a pairing code right now.</div>
            <button className="btn ghost sm" onClick={() => generate()}>TRY AGAIN</button>
          </div>
        ) : (
          <div className="codebox">
            <span className="code">{code}</span>
            <button className="btn ghost sm" onClick={copy}>{copied ? 'COPIED' : 'COPY'}</button>
          </div>
        )}
      </Field>
      {data && !isPending && !isError && (
        <div className="banner cyan">Waiting for your device to connect… (expires in 5 minutes)</div>
      )}
      <div className="savebar">
        <button className="btn ghost" onClick={onClose}>CLOSE</button>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Shared HUD primitives (panel / not-connected / modal / field)
// ═══════════════════════════════════════════════════════════════════════════════
function Panel({
  title,
  tag,
  action,
  children,
}: {
  title: string;
  tag?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
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

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="mhead">
          <div className="ptitle">{title}</div>
          <button className="mx" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="mbody">{children}</div>
      </div>
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
.set-root{position:fixed;inset:0;overflow-y:auto;color:#eef0f6;font-family:var(--mono);letter-spacing:.2px;
  --accent:#6C63FF;--magenta:#B25CFF;--cyan:#15E0C8;--red:#FF6B6B;--amber:#F5B544;
  --ink:#070a0c;--glass1:rgba(22,28,34,.66);--glass2:rgba(11,15,19,.66);
  --disp:"Chakra Petch",sans-serif;--mono:"JetBrains Mono",ui-monospace,monospace;--line:rgba(108,99,255,.14);
  background:radial-gradient(1300px 820px at 50% -8%,rgba(108,99,255,.16),transparent 58%),
    radial-gradient(1000px 760px at 92% 110%,rgba(178,92,255,.10),transparent 60%),
    radial-gradient(760px 620px at 4% 18%,rgba(21,224,200,.06),transparent 60%),var(--ink);}
.set-root .grid-bg{position:fixed;inset:0;pointer-events:none;opacity:.45;z-index:0;
  background-image:linear-gradient(rgba(108,99,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(108,99,255,.06) 1px,transparent 1px);
  background-size:54px 54px;-webkit-mask-image:radial-gradient(ellipse 80% 70% at 50% 32%,#000 35%,transparent 78%);}
.set-root .scan{position:fixed;left:0;right:0;height:160px;z-index:1;pointer-events:none;
  background:linear-gradient(rgba(108,99,255,.07),transparent);animation:sscan 8s linear infinite;}
@keyframes sscan{0%{transform:translateY(-160px)}100%{transform:translateY(100vh)}}
.set-root .stage{position:relative;z-index:2}
.set-root .top{display:flex;align-items:center;justify-content:space-between;padding:22px 34px 10px}
.set-root .brand{display:flex;align-items:center;gap:13px;font-family:var(--disp);font-size:18px;letter-spacing:7px;font-weight:600}
.set-root .beacon{width:11px;height:11px;border-radius:50%;background:var(--accent);position:relative;box-shadow:0 0 14px var(--accent)}
.set-root .beacon::after{content:"";position:absolute;inset:-6px;border-radius:50%;border:1.5px solid var(--accent);animation:shalo 2.2s ease-out infinite}
@keyframes shalo{0%{transform:scale(.5);opacity:.9}100%{transform:scale(2.1);opacity:0}}
.set-root .sep{color:var(--accent)}
.set-root .topright{display:flex;align-items:center;gap:18px}
.set-root .muted{color:rgba(238,240,246,.42);font-size:11px}
.set-root .nav{display:flex;gap:7px}
.set-root .chip{padding:6px 13px;border-radius:999px;border:1px solid rgba(108,99,255,.3);font-family:var(--disp);font-size:10.5px;letter-spacing:2px;color:rgba(170,165,255,.9);background:rgba(108,99,255,.05);cursor:pointer;transition:.18s}
.set-root .chip:hover{border-color:var(--accent);color:#fff;background:rgba(108,99,255,.16)}
.set-root .chip.active{color:#fff;border-color:var(--accent);background:rgba(108,99,255,.2);box-shadow:0 0 18px rgba(108,99,255,.25)}
.set-root .head{padding:14px 34px 2px;display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:14px}
.set-root .h1{font-family:var(--disp);font-size:30px;letter-spacing:9px;font-weight:600;margin:0;line-height:1}
.set-root .h1 .b{background:linear-gradient(90deg,var(--accent),var(--magenta));-webkit-background-clip:text;background-clip:text;color:transparent}
.set-root .sub{font-size:11px;color:rgba(238,240,246,.4);letter-spacing:3px;margin-top:8px}

/* ── hub: section nav + pane ─────────────────────────────────────────────── */
.set-root .hub{display:grid;grid-template-columns:248px 1fr;gap:18px;padding:18px 34px 0;align-items:start}
@media (max-width:820px){.set-root .hub{grid-template-columns:1fr}}
.set-root .snav{display:flex;flex-direction:column;gap:8px;position:sticky;top:18px}
@media (max-width:820px){.set-root .snav{flex-direction:row;flex-wrap:wrap;position:static}}
.set-root .sitem{display:flex;align-items:center;gap:11px;text-align:left;padding:13px 15px;border-radius:13px;cursor:pointer;
  border:1px solid var(--line);background:linear-gradient(180deg,var(--glass1),var(--glass2));backdrop-filter:blur(16px);
  color:#eef0f6;font-family:var(--mono);transition:.18s}
.set-root .sitem:hover{border-color:rgba(108,99,255,.4);background:rgba(108,99,255,.08)}
.set-root .sitem.active{border-color:var(--accent);background:rgba(108,99,255,.16);box-shadow:0 0 18px rgba(108,99,255,.18)}
.set-root .sitem .sdot{width:9px;height:9px;border-radius:50%;flex-shrink:0;background:rgba(238,240,246,.22)}
.set-root .sitem.active .sdot{background:var(--accent);box-shadow:0 0 9px var(--accent)}
.set-root .stext{display:flex;flex-direction:column;gap:3px;min-width:0}
.set-root .slabel{font-family:var(--disp);font-size:12px;letter-spacing:2.4px;font-weight:600}
.set-root .shint{font-size:9.5px;letter-spacing:.4px;color:rgba(238,240,246,.4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.set-root .sitem.active .shint{color:rgba(189,184,255,.7)}

/* ── panel ───────────────────────────────────────────────────────────────── */
.set-root .pane{min-width:0}
.set-root .panel{border:1px solid var(--line);border-radius:16px;overflow:hidden;
  background:linear-gradient(180deg,var(--glass1),var(--glass2));backdrop-filter:blur(18px);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.04),inset 0 0 60px rgba(108,99,255,.04),0 18px 60px rgba(0,0,0,.55);position:relative}
.set-root .panel::before,.set-root .panel::after{content:"";position:absolute;width:18px;height:18px;border:0 solid rgba(108,99,255,.6);pointer-events:none;z-index:2}
.set-root .panel::before{top:8px;left:8px;border-top-width:1.5px;border-left-width:1.5px}
.set-root .panel::after{bottom:8px;right:8px;border-bottom-width:1.5px;border-right-width:1.5px}
.set-root .phead{display:flex;align-items:center;gap:12px;padding:14px 22px;border-bottom:1px solid var(--line)}
.set-root .ptitle{font-family:var(--disp);font-size:13px;letter-spacing:3px;color:var(--accent);font-weight:600}
.set-root .ptag{font-size:10px;letter-spacing:1px;color:rgba(238,240,246,.4)}
.set-root .paction{margin-left:auto}
.set-root .pbody{padding:20px 22px}

/* ── blocks / fields ─────────────────────────────────────────────────────── */
.set-root .block{padding-bottom:20px;margin-bottom:20px;border-bottom:1px solid rgba(108,99,255,.08)}
.set-root .block:last-of-type{border-bottom:none;margin-bottom:6px;padding-bottom:6px}
.set-root .bhead{font-family:var(--disp);font-size:11px;letter-spacing:2.2px;color:#eef0f6;font-weight:600;margin-bottom:12px}
.set-root .bdesc{font-size:11.5px;color:rgba(238,240,246,.5);margin-bottom:14px;line-height:1.5}
.set-root .fgrid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media (max-width:620px){.set-root .fgrid{grid-template-columns:1fr}}
.set-root .field{display:flex;flex-direction:column;gap:6px}
.set-root .flabel{font-family:var(--disp);font-size:9.5px;letter-spacing:1.6px;color:rgba(238,240,246,.5)}
.set-root .fhint{font-size:10px;color:rgba(238,240,246,.36);line-height:1.4}
.set-root .inp{width:100%;box-sizing:border-box;background:rgba(7,10,12,.55);border:1px solid rgba(108,99,255,.22);border-radius:10px;
  color:#eef0f6;font-family:var(--mono);font-size:13px;padding:10px 12px;outline:none;transition:.16s}
.set-root .inp:focus{border-color:var(--accent);box-shadow:0 0 0 2px rgba(108,99,255,.18)}
.set-root select.inp{appearance:none;cursor:pointer}
.set-root .inp-affix{display:flex;align-items:center;background:rgba(7,10,12,.55);border:1px solid rgba(108,99,255,.22);border-radius:10px;overflow:hidden}
.set-root .inp-affix:focus-within{border-color:var(--accent);box-shadow:0 0 0 2px rgba(108,99,255,.18)}
.set-root .inp-affix .affix{padding:0 0 0 12px;color:rgba(238,240,246,.5);font-size:13px}
.set-root .inp-affix .inp{border:none;box-shadow:none;background:transparent}
.set-root .inp-affix .inp:focus{box-shadow:none}
.set-root .row-inline{display:flex;gap:8px;align-items:center;margin:8px 0}

/* ── buttons ─────────────────────────────────────────────────────────────── */
.set-root .btn{font-family:var(--disp);font-size:11px;letter-spacing:1.6px;font-weight:600;padding:9px 16px;border-radius:10px;cursor:pointer;transition:.16s;border:1px solid transparent;white-space:nowrap}
.set-root .btn.sm{padding:7px 12px;font-size:10px;letter-spacing:1.2px}
.set-root .btn:disabled{opacity:.4;cursor:not-allowed}
.set-root .btn.primary{color:#fff;border-color:var(--accent);background:rgba(108,99,255,.2)}
.set-root .btn.primary:not(:disabled):hover{background:rgba(108,99,255,.34);box-shadow:0 0 18px rgba(108,99,255,.3)}
.set-root .btn.ghost{color:rgba(189,184,255,.9);border-color:rgba(108,99,255,.3);background:rgba(108,99,255,.05)}
.set-root .btn.ghost:not(:disabled):hover{border-color:var(--accent);color:#fff;background:rgba(108,99,255,.14)}
.set-root .btn.ghost.danger{color:#ffb0b0;border-color:rgba(255,107,107,.32);background:rgba(255,107,107,.05)}
.set-root .btn.ghost.danger:hover{border-color:var(--red);color:#fff;background:rgba(255,107,107,.16)}
.set-root .savebar{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}

/* ── tags / chips ────────────────────────────────────────────────────────── */
.set-root .chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}
.set-root .dim{font-size:11px;color:rgba(238,240,246,.36)}
.set-root .tag{display:inline-flex;align-items:center;gap:6px;font-family:var(--disp);font-size:9.5px;letter-spacing:1.2px;padding:5px 10px;border-radius:999px;white-space:nowrap}
.set-root .tag.violet{color:#bdb8ff;border:1px solid var(--accent);background:rgba(108,99,255,.13)}
.set-root .tag.cyan{color:#8ff0e4;border:1px solid var(--cyan);background:rgba(21,224,200,.1)}
.set-root .tag.amber{color:#ffd99a;border:1px solid var(--amber);background:rgba(245,181,68,.12)}
.set-root .tag.red{color:#ffb0b0;border:1px solid var(--red);background:rgba(255,107,107,.12)}
.set-root .tagx{background:none;border:none;color:inherit;cursor:pointer;font-size:14px;line-height:1;padding:0;opacity:.7}
.set-root .tagx:hover{opacity:1}

/* ── list rows ───────────────────────────────────────────────────────────── */
.set-root .rows{display:flex;flex-direction:column;gap:10px}
.set-root .lrow{display:flex;align-items:center;gap:12px;padding:13px 15px;border-radius:12px;border:1px solid var(--line);background:rgba(108,99,255,.04);transition:.16s}
.set-root .lrow:hover{background:rgba(108,99,255,.08)}
.set-root .lrow.flush{border:none;background:none;padding:0;margin-bottom:12px}
.set-root .lrow.flush:hover{background:none}
.set-root .ldot{width:9px;height:9px;border-radius:50%;flex-shrink:0}
.set-root .ldot.violet{background:var(--accent);box-shadow:0 0 8px var(--accent)}
.set-root .ldot.cyan{background:var(--cyan);box-shadow:0 0 8px var(--cyan)}
.set-root .ldot.amber{background:var(--amber);box-shadow:0 0 8px var(--amber);animation:sblink 1.1s ease-in-out infinite}
.set-root .ldot.dim{background:rgba(238,240,246,.22)}
@keyframes sblink{0%,100%{opacity:1}50%{opacity:.4}}
.set-root .lmain{flex:1;min-width:0}
.set-root .lname{font-family:var(--disp);font-size:13px;font-weight:500;color:#eef0f6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.set-root .lsub{font-size:10.5px;color:rgba(238,240,246,.42);margin-top:2px}
.set-root .card{padding:15px;border-radius:13px;border:1px solid var(--line);background:rgba(108,99,255,.04)}

/* ── meters ──────────────────────────────────────────────────────────────── */
.set-root .meter{margin-top:10px}
.set-root .mtop{display:flex;justify-content:space-between;margin-bottom:5px}
.set-root .mlabel{font-family:var(--disp);font-size:9px;letter-spacing:1.4px;color:rgba(238,240,246,.5)}
.set-root .mtext{font-size:10px;color:rgba(238,240,246,.5)}
.set-root .mtrack{height:6px;border-radius:999px;background:rgba(238,240,246,.08);overflow:hidden}
.set-root .mfill{display:block;height:100%;border-radius:999px;background:var(--accent);box-shadow:0 0 8px rgba(108,99,255,.6);transition:width .3s}
.set-root .mfill.hot{background:var(--amber);box-shadow:0 0 8px rgba(245,181,68,.6)}

/* ── device grid ─────────────────────────────────────────────────────────── */
.set-root .dgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
.set-root .dtile{padding:15px;border-radius:13px;border:1px solid var(--line);background:rgba(108,99,255,.04);display:flex;flex-direction:column;gap:9px}
.set-root .dhead{display:flex;align-items:center;gap:11px}
.set-root .dspec{font-size:11px;color:rgba(238,240,246,.5)}
.set-root .ddaemon{font-size:11px;color:#bdb8ff}

/* ── not-connected / empty / banners ─────────────────────────────────────── */
.set-root .nc{display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px;padding:44px 24px}
.set-root .ncbeacon{width:13px;height:13px;border-radius:50%;background:rgba(108,99,255,.4);position:relative;box-shadow:0 0 14px rgba(108,99,255,.5)}
.set-root .ncbeacon::after{content:"";position:absolute;inset:-7px;border-radius:50%;border:1.5px solid rgba(108,99,255,.5);animation:shalo 2.4s ease-out infinite}
.set-root .nctitle{font-family:var(--disp);font-size:13px;letter-spacing:2.4px;color:#eef0f6;font-weight:600}
.set-root .ncdesc{font-size:12px;color:rgba(238,240,246,.5);max-width:420px;line-height:1.6}
.set-root .empty{padding:34px 24px;text-align:center;font-size:12.5px;color:rgba(238,240,246,.5)}
.set-root .empty.err{color:#ffb0b0}
.set-root .banner{padding:10px 14px;border-radius:10px;font-size:11.5px;margin:14px 0;letter-spacing:.3px}
.set-root .banner.err{color:#ffb0b0;border:1px solid rgba(255,107,107,.3);background:rgba(255,107,107,.08)}
.set-root .banner.cyan{color:#8ff0e4;border:1px solid rgba(21,224,200,.25);background:rgba(21,224,200,.06)}

/* ── modal ───────────────────────────────────────────────────────────────── */
.set-root .overlay{position:fixed;inset:0;z-index:20;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(4,6,8,.66);backdrop-filter:blur(6px)}
.set-root .modal{width:100%;max-width:420px;border:1px solid rgba(108,99,255,.3);border-radius:16px;overflow:hidden;
  background:linear-gradient(180deg,rgba(22,28,34,.94),rgba(11,15,19,.96));box-shadow:0 24px 80px rgba(0,0,0,.7),inset 0 0 60px rgba(108,99,255,.05)}
.set-root .mhead{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--line)}
.set-root .mx{background:none;border:none;color:rgba(238,240,246,.5);font-size:22px;line-height:1;cursor:pointer;padding:0;width:26px;height:26px}
.set-root .mx:hover{color:#fff}
.set-root .mbody{padding:20px;display:flex;flex-direction:column;gap:16px}
.set-root .codebox{display:flex;align-items:center;gap:12px;background:rgba(108,99,255,.1);border:1px solid rgba(108,99,255,.25);border-radius:12px;padding:14px 16px}
.set-root .code{font-family:var(--mono);font-size:26px;font-weight:700;letter-spacing:8px;color:#bdb8ff;flex:1}
`;
