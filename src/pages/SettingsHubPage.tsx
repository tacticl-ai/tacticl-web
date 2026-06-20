// src/pages/SettingsHubPage.tsx
// Full-bleed "SETTINGS" HUD surface — the single account/config deck for the
// active product. Re-cut (2026-06) to absorb LINKS and match the settings.html
// mockup IA: a left in-page section rail (Profile · Preferences · Products ·
// Connections · Plan & Billing) + a glass panel on the right, with a SIGN OUT
// action pinned to the bottom of the rail.
//
// The shared HUD chrome (brand · product switcher · COMMAND/DASHBOARD/SETTINGS
// nav) is now the <HudTopbar active="settings" /> component, so this file no
// longer renders its own top bar.
//
// CONNECTIONS folds in the former LinksPage grid 1:1 — same useConnections /
// useConnectPlatform / useDisconnectPlatform / useHandleOAuthCallback hooks,
// same platformConfig source of truth, same OAuth popup + callback handling
// (the redirectUri now returns to /settings). Each section degrades gracefully
// to a HUD empty/error state.
import { cloneElement, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api/settings';
import type { UserConfig } from '../api/settings';
import { useProducts } from '../hooks/useProducts';
import { useProfile, useUpdateProfile } from '../hooks/useProfile';
import { useSettingsRepos, useAttachRepo, useRevokeSettingsRepo } from '../hooks/useRepos';
import { useApiTokens, useCreateApiToken, useRevokeApiToken } from '../hooks/useTokens';
import { useAuth } from '../hooks/useAuth';
import { useHydrateProductStore } from '../stores/productStore';
import {
  useConnections,
  useConnectPlatform,
  useDisconnectPlatform,
  useHandleOAuthCallback,
  validateOAuthState,
} from '../hooks/useConnections';
import {
  type ConnectionCategory,
  type PlatformInfo,
  categoryLabels,
  categoryDescriptions,
  getPlatformsByCategory,
  getConnectionForPlatform,
} from '../config/platformConfig';
import type { Connection, Product, SettingsRepo, CreatedApiToken } from '../api/types';
import HudTopbar from '../components/hud/HudTopbar';

type SectionId = 'profile' | 'preferences' | 'products' | 'connections' | 'tokens' | 'billing';

const SECTIONS: { id: SectionId; label: string; hint: string }[] = [
  { id: 'profile', label: 'PROFILE', hint: 'Name · email · avatar' },
  { id: 'preferences', label: 'PREFERENCES', hint: 'Limits · domains · sparks' },
  { id: 'products', label: 'PRODUCTS', hint: 'Your registered products' },
  { id: 'connections', label: 'CONNECTIONS', hint: 'Dev · social · media' },
  { id: 'tokens', label: 'API TOKENS', hint: 'Programmatic access keys' },
  { id: 'billing', label: 'PLAN & BILLING', hint: 'Tier · usage · invoices' },
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
  const [section, setSection] = useState<SectionId>('profile');
  const { logout } = useAuth();

  // Keep the topbar's ProductSwitcher fed with the live /v1/products list.
  useHydrateProductStore();

  return (
    <div className="set-root">
      <style>{CSS}</style>
      <div className="grid-bg" />
      <div className="scan" />

      <div className="stage">
        {/* ── shared HUD chrome ───────────────────────────────────────────── */}
        <HudTopbar active="settings" />

        {/* ── head ────────────────────────────────────────────────────────── */}
        <div className="head">
          <div>
            <h1 className="h1">SYSTEM <span className="b">SETTINGS</span></h1>
            <div className="sub">Connections &amp; configuration for this product.</div>
          </div>
        </div>

        {/* ── two-column hub: section rail + active panel ─────────────────── */}
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

            {/* danger: sign out, pinned at the bottom of the rail */}
            <div className="snav-div" />
            <button className="ssignout" type="button" onClick={() => logout()}>
              <span className="sopower">⏻</span>
              <span className="solabel">SIGN OUT</span>
            </button>
          </aside>

          <div className="pane">
            {section === 'profile' && <ProfileSection />}
            {section === 'preferences' && <PreferencesSection />}
            {section === 'products' && <ProductsSection />}
            {section === 'connections' && <ConnectionsSection />}
            {section === 'tokens' && <ApiTokensSection />}
            {section === 'billing' && <BillingSection />}
          </div>
        </div>

        <div style={{ height: 46 }} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE — editable displayName + avatarUrl, saved via PUT /v1/users/me.
// Email stays read-only (managed by the auth portal).
// ═══════════════════════════════════════════════════════════════════════════════
function ProfileSection() {
  const { profile, loading } = useProfile();
  const update = useUpdateProfile();

  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  /* eslint-disable react-hooks/set-state-in-effect -- snapshot the server profile into editable local state when it (re)loads */
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? '');
      setAvatarUrl(profile.avatarUrl ?? '');
    }
  }, [profile]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const dirty =
    !!profile &&
    (displayName !== (profile.displayName ?? '') || avatarUrl !== (profile.avatarUrl ?? ''));

  const save = () => {
    if (!dirty) return;
    update.mutate({
      displayName: displayName.trim(),
      avatarUrl: avatarUrl.trim() ? avatarUrl.trim() : null,
    });
  };

  const reset = () => {
    setDisplayName(profile?.displayName ?? '');
    setAvatarUrl(profile?.avatarUrl ?? '');
  };

  const previewInitial = (displayName?.[0] ?? '·').toUpperCase();

  return (
    <Panel title="PROFILE" tag="YOUR ACCOUNT">
      {loading ? (
        <div className="empty">Loading profile…</div>
      ) : (
        <>
          <div className="block">
            <div className="bhead">IDENTITY</div>
            <div className="lrow">
              <span className="lavatar">
                {avatarUrl ? <img src={avatarUrl} alt="" /> : previewInitial}
              </span>
              <div className="lmain">
                <div className="lname">{displayName || 'Your name'}</div>
                <div className="lsub">{profile?.email || 'No email on file'}</div>
              </div>
            </div>
          </div>

          <div className="block">
            <div className="bhead">DETAILS</div>
            <div className="fgrid">
              <Field label="DISPLAY NAME" hint="How your name appears across Tacticl">
                <input
                  className="inp"
                  type="text"
                  placeholder="Your name"
                  maxLength={120}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </Field>
              <Field label="EMAIL" hint="Managed by the auth portal — read-only here">
                <input className="inp" type="email" value={profile?.email ?? ''} readOnly disabled />
              </Field>
            </div>
            <div style={{ height: 16 }} />
            <Field label="AVATAR URL" hint="Link to an image; leave blank to use your initial">
              <input
                className="inp"
                type="url"
                placeholder="https://…/avatar.png"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
            </Field>
          </div>

          <div className="block">
            <div className="bhead">ACCOUNT</div>
            <div className="bdesc">
              Password and security are managed through the auth portal at auth.tacticl.ai.
            </div>
          </div>

          {update.isError && <div className="banner err">Failed to save profile. Please try again.</div>}

          <div className="savebar">
            {dirty && (
              <button className="btn ghost" disabled={update.isPending} onClick={reset}>
                DISCARD
              </button>
            )}
            <button className="btn primary" disabled={!dirty || update.isPending} onClick={save}>
              {update.isPending ? 'SAVING…' : 'SAVE CHANGES'}
            </button>
          </div>
        </>
      )}
    </Panel>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PREFERENCES — agent limits + domain controls (fully functional, /v1/settings)
// ═══════════════════════════════════════════════════════════════════════════════
function PreferencesSection() {
  const qc = useQueryClient();
  const { data: saved, isLoading, isError } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get(),
    staleTime: 30_000,
    retry: false,
  });

  const [local, setLocal] = useState<UserConfig | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- snapshot the server config into editable local state when it (re)loads
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
    return <Panel title="PREFERENCES" tag="AGENT CONFIG"><div className="empty">Loading settings…</div></Panel>;
  }
  if (isError || !local) {
    return (
      <Panel title="PREFERENCES" tag="AGENT CONFIG">
        <div className="empty err">Settings could not be loaded. The settings endpoint may not be available yet.</div>
      </Panel>
    );
  }

  return (
    <Panel title="PREFERENCES" tag="AGENT CONFIG">
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
// PRODUCTS — registered products from useProducts() + "+ New product" → /onboard
// ═══════════════════════════════════════════════════════════════════════════════
function ProductsSection() {
  const navigate = useNavigate();
  const { data: products, isLoading, isError } = useProducts();
  const list = (products ?? []) as Product[];

  return (
    <Panel
      title="PRODUCTS"
      tag="REGISTERED"
      action={<button className="btn primary sm" onClick={() => navigate('/onboard')}>+ NEW PRODUCT</button>}
    >
      <div className="bdesc">
        Each product scopes its own sparks, connections and team. Switch the active product from the topbar.
      </div>

      {isLoading ? (
        <div className="empty">Loading products…</div>
      ) : isError ? (
        <NotConnected
          title="NO PRODUCTS YET"
          desc="Create your first product to start running sparks. A product bundles its repos, channels and devices."
          cta="NEW PRODUCT"
          onCta={() => navigate('/onboard')}
        />
      ) : list.length === 0 ? (
        <NotConnected
          title="NO PRODUCTS YET"
          desc="Create your first product to start running sparks. A product bundles its repos, channels and devices."
          cta="NEW PRODUCT"
          onCta={() => navigate('/onboard')}
        />
      ) : (
        <div className="rows">
          {list.map((p, i) => (
            <div className="lrow" key={p.id}>
              <span className={`ldot ${i === 0 ? 'violet' : 'cyan'}`} />
              <div className="lmain">
                <div className="lname">{p.name}</div>
                <div className="lsub">
                  created {relTime(p.createdAt)} · {p.repos.length} repo{p.repos.length === 1 ? '' : 's'} · {p.channels.length} channel{p.channels.length === 1 ? '' : 's'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONNECTIONS — the former LinksPage grid, absorbed as a settings section.
// Same hooks + platformConfig + OAuth contract; redirectUri returns to /settings.
// ═══════════════════════════════════════════════════════════════════════════════
const CATEGORY_GLYPH: Record<ConnectionCategory, string> = {
  social: '◈',
  media: '◉',
  developer: '⌘',
  productivity: '⬡',
};

const CATEGORY_ACCENT: Record<ConnectionCategory, string> = {
  social: 'var(--magenta)',
  media: 'var(--red)',
  developer: 'var(--cyan)',
  productivity: 'var(--amber)',
};

const CATEGORIES: ConnectionCategory[] = ['developer', 'social', 'media', 'productivity'];
// Productivity has no platforms / no backend yet — render as a "coming soon" deck.
const COMING_SOON: ReadonlySet<ConnectionCategory> = new Set(['productivity']);

function ConnectionsSection() {
  const { data: connections, isLoading, isError, refetch } = useConnections();
  const connectPlatform = useConnectPlatform();
  const disconnectPlatform = useDisconnectPlatform();
  const handleOAuthCallback = useHandleOAuthCallback();
  const [searchParams, setSearchParams] = useSearchParams();
  const [oauthError, setOauthError] = useState<string | null>(null);

  const list = useMemo(() => (connections ?? []) as Connection[], [connections]);

  // OAuth callback handling — identical contract to LinksPage, but the
  // redirectUri now points back at /settings so the popup → tab returns here.
  useEffect(() => {
    const code = searchParams.get('code');
    const platform = searchParams.get('platform');
    const state = searchParams.get('state');
    const codeVerifier = searchParams.get('code_verifier') || undefined;

    if (code && platform) {
      if (!validateOAuthState(state)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- OAuth callback runs once on mount
        setOauthError('Invalid OAuth state. Please try again.');
        setSearchParams({});
        return;
      }
      const redirectUri = window.location.origin + '/settings';
      handleOAuthCallback.mutate(
        { platform, code, redirectUri, codeVerifier },
        {
          onSettled: () => setSearchParams({}),
          onError: () => setOauthError('Failed to connect. Please try again.'),
        },
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = (platformKey: string) => {
    const redirectUri = window.location.origin + '/settings';
    connectPlatform.mutate({ platform: platformKey, redirectUri });
  };

  return (
    <Panel title="CONNECTIONS" tag="CHANNELS & INTEGRATIONS">
      <div className="bdesc">
        Channels &amp; integrations Tacticl talks to, through, or runs on — for this product.
      </div>

      {oauthError && (
        <div className="banner err" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
          <span>⚠ {oauthError}</span>
          <button className="btn ghost sm" onClick={() => setOauthError(null)}>DISMISS</button>
        </div>
      )}

      {isLoading ? (
        <div className="empty">Loading channels…</div>
      ) : isError ? (
        <div className="empty err">
          Failed to load connections.{' '}
          <button className="btn ghost sm" onClick={() => refetch()}>RETRY →</button>
        </div>
      ) : (
        CATEGORIES.map((category) => {
          const accent = CATEGORY_ACCENT[category];
          const isSoon = COMING_SOON.has(category);
          const plats = getPlatformsByCategory(category);
          const connectedCount = plats.filter((p) => getConnectionForPlatform(list, p.key)).length;

          return (
            <div className="cgroup" key={category}>
              <div className="cshead">
                <span className="cglyph" style={{ color: accent, borderColor: accent }}>
                  {CATEGORY_GLYPH[category]}
                </span>
                <div className="cstitle">
                  <div className="csname">{categoryLabels[category]}</div>
                  <div className="csdesc">{categoryDescriptions[category]}</div>
                </div>
                {isSoon ? (
                  <span className="cbadge" style={{ borderColor: 'rgba(238,240,246,.2)', color: 'rgba(238,240,246,.45)' }}>
                    COMING SOON
                  </span>
                ) : (
                  <span className="cbadge" style={{ borderColor: accent, color: accent }}>
                    {connectedCount} / {plats.length}
                  </span>
                )}
              </div>

              {isSoon || plats.length === 0 ? (
                <div className="soonbox">
                  Productivity integrations like Slack, Notion, and Google Drive are on the way.
                </div>
              ) : (
                <div className="cgrid">
                  {plats.map((platform) => {
                    const connection = getConnectionForPlatform(list, platform.key);
                    return (
                      <ChannelCard
                        key={platform.key}
                        platform={platform}
                        accent={accent}
                        connection={connection}
                        connecting={connectPlatform.isPending}
                        disconnecting={disconnectPlatform.isPending}
                        onConnect={() => handleConnect(platform.key)}
                        onDisconnect={(id) => disconnectPlatform.mutate(id)}
                      />
                    );
                  })}
                </div>
              )}

              {/* Developer area also surfaces the user's remembered repos
                  (attach by URL → POST /v1/repos, revoke ✕ → DELETE /v1/repos/{id}). */}
              {category === 'developer' && <DeveloperRepos accent={accent} />}
            </div>
          );
        })
      )}
    </Panel>
  );
}

// ── Remembered repos (attach by URL / revoke) within the Developer group ─────
function DeveloperRepos({ accent }: { accent: string }) {
  const { data: repos, isLoading, isError } = useSettingsRepos();
  const attach = useAttachRepo();
  const revoke = useRevokeSettingsRepo();

  const [url, setUrl] = useState('');
  const list = (repos ?? []) as SettingsRepo[];

  const doAttach = () => {
    const repoUrl = url.trim();
    if (!repoUrl) return;
    attach.mutate(
      { repoUrl },
      {
        onSuccess: () => setUrl(''),
      },
    );
  };

  return (
    <div className="repos">
      <div className="reposhead" style={{ color: accent }}>REMEMBERED REPOS</div>
      <div className="bdesc">
        Repos Tacticl can work in for this account. Attach one by URL, or revoke access with ✕.
      </div>

      <div className="row-inline">
        <input
          className="inp"
          placeholder="https://github.com/owner/repo"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && doAttach()}
        />
        <button className="btn ghost sm" onClick={doAttach} disabled={!url.trim() || attach.isPending}>
          {attach.isPending ? 'ATTACHING…' : 'ATTACH'}
        </button>
      </div>

      {attach.isError && <div className="banner err">Couldn't attach that repo. Check the URL and try again.</div>}

      {isLoading ? (
        <div className="empty">Loading repos…</div>
      ) : isError ? (
        <div className="empty err">Repos could not be loaded.</div>
      ) : list.length === 0 ? (
        <div className="dim" style={{ marginTop: 12 }}>No repos attached yet.</div>
      ) : (
        <div className="rows" style={{ marginTop: 12 }}>
          {list.map((r) => {
            const title = r.owner && r.name ? `${r.owner}/${r.name}` : r.repoUrl;
            return (
              <div className="lrow" key={r.id}>
                <span className="ldot cyan" />
                <div className="lmain">
                  <div className="lname">{title}</div>
                  <div className="lsub">{r.repoUrl}</div>
                </div>
                {r.source && <span className="tag cyan">{String(r.source)}</span>}
                <button
                  className="repox"
                  aria-label={`Revoke ${title}`}
                  disabled={revoke.isPending}
                  onClick={() => revoke.mutate(r.id)}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface ChannelCardProps {
  platform: PlatformInfo;
  accent: string;
  connection?: Connection;
  connecting: boolean;
  disconnecting: boolean;
  onConnect: () => void;
  onDisconnect: (id: string) => void;
}

function ChannelCard({
  platform,
  accent,
  connection,
  connecting,
  disconnecting,
  onConnect,
  onDisconnect,
}: ChannelCardProps) {
  const isConnected = !!connection;
  const needsReconnect = connection?.tokenRefreshNeeded;
  // The platformConfig icons are MUI SVG elements — recolor them white for the HUD chip.
  const glyph = cloneElement(platform.icon, {
    sx: { fontSize: 18, color: '#fff' },
  } as Record<string, unknown>);

  return (
    <div className={`ccard${isConnected ? ' on' : ''}`} style={{ '--ca': accent } as React.CSSProperties}>
      <span className="cstripe" />
      <div className="ccardtop">
        <span
          className="clogo"
          style={{ background: platform.color === '#000000' || platform.color === '#010101' || platform.color === '#181717' ? '#222' : platform.color }}
        >
          {connection?.profileImageUrl ? <img src={connection.profileImageUrl} alt="" /> : glyph}
        </span>
        <div className="cmeta">
          <div className="cpname">{platform.name}</div>
          <div className="cphandle">
            {isConnected ? (connection?.platformUsername || 'connected') : 'not linked'}
          </div>
        </div>
      </div>

      <div className="cstatusrow">
        {isConnected ? (
          <span className="ctag linked"><span className="tdot" />LINKED</span>
        ) : (
          <span className="ctag idle"><span className="tdot" />AVAILABLE</span>
        )}
        {needsReconnect && <span className="ctag warn">⚠ RECONNECT</span>}
        {connection?.disabled && <span className="ctag warn">DISABLED</span>}
      </div>

      <div className="ccardact">
        {isConnected ? (
          <button
            className="cbtn dis"
            disabled={disconnecting}
            onClick={() => connection && onDisconnect(connection.id)}
          >
            {disconnecting ? 'DISCONNECTING…' : 'DISCONNECT'}
          </button>
        ) : (
          <button className="cbtn con" disabled={connecting} onClick={onConnect}>
            {connecting ? 'OPENING…' : 'CONNECT →'}
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// API TOKENS — personal programmatic-access keys.
//   list   GET    /v1/tokens  → [{ id, name, maskedToken, createdAt, lastUsedAt? }]
//   create POST   /v1/tokens  → { id, name, token, createdAt }  (plaintext ONCE)
//   revoke DELETE /v1/tokens/{id} → 204
// ═══════════════════════════════════════════════════════════════════════════════
function ApiTokensSection() {
  const { data: tokens, isLoading, isError } = useApiTokens();
  const create = useCreateApiToken();
  const revoke = useRevokeApiToken();

  const [name, setName] = useState('');
  // The plaintext token is shown exactly once, right after creation.
  const [created, setCreated] = useState<CreatedApiToken | null>(null);
  const [copied, setCopied] = useState(false);

  const list = tokens ?? [];

  const doCreate = () => {
    const tokenName = name.trim();
    if (!tokenName) return;
    create.mutate(
      { name: tokenName },
      {
        onSuccess: (res) => {
          setCreated(res);
          setCopied(false);
          setName('');
        },
      },
    );
  };

  const copy = () => {
    if (!created) return;
    navigator.clipboard?.writeText(created.token).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  };

  return (
    <Panel title="API TOKENS" tag="PROGRAMMATIC ACCESS">
      <div className="bdesc">
        Personal access tokens authenticate scripts and integrations against the Tacticl API.
        Treat them like passwords — anyone with a token can act as you.
      </div>

      {/* one-time plaintext reveal */}
      {created && (
        <div className="block">
          <div className="bhead">NEW TOKEN · {created.name}</div>
          <div className="banner amber">
            ⚠ Copy this token now — you won't be able to see it again. Store it somewhere safe.
          </div>
          <div className="row-inline">
            <input className="inp tokrev" type="text" value={created.token} readOnly onFocus={(e) => e.currentTarget.select()} />
            <button className="btn primary sm" onClick={copy}>{copied ? 'COPIED ✓' : 'COPY'}</button>
          </div>
          <div className="savebar">
            <button className="btn ghost sm" onClick={() => setCreated(null)}>DONE</button>
          </div>
        </div>
      )}

      {/* create */}
      <div className="block">
        <div className="bhead">CREATE TOKEN</div>
        <div className="row-inline">
          <input
            className="inp"
            placeholder="Token name, e.g. CI deploy bot"
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doCreate()}
          />
          <button className="btn primary sm" onClick={doCreate} disabled={!name.trim() || create.isPending}>
            {create.isPending ? 'CREATING…' : '+ CREATE'}
          </button>
        </div>
        {create.isError && <div className="banner err">Failed to create token. Please try again.</div>}
      </div>

      {/* list (masked) */}
      <div className="block">
        <div className="bhead">YOUR TOKENS</div>
        {isLoading ? (
          <div className="empty">Loading tokens…</div>
        ) : isError ? (
          <div className="empty err">Tokens could not be loaded.</div>
        ) : list.length === 0 ? (
          <div className="dim">No tokens yet. Create one above to get started.</div>
        ) : (
          <div className="rows">
            {list.map((t) => (
              <div className="lrow" key={t.id}>
                <span className="ldot violet" />
                <div className="lmain">
                  <div className="lname">{t.name}</div>
                  <div className="lsub">
                    <code className="mask">{t.maskedToken}</code> · created {relTime(t.createdAt)}
                    {t.lastUsedAt ? ` · last used ${relTime(t.lastUsedAt)}` : ' · never used'}
                  </div>
                </div>
                <button
                  className="repox"
                  aria-label={`Revoke ${t.name}`}
                  disabled={revoke.isPending}
                  onClick={() => revoke.mutate(t.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLAN & BILLING — static stub (no billing API yet), clearly marked.
// ═══════════════════════════════════════════════════════════════════════════════
function BillingSection() {
  return (
    <Panel title="PLAN & BILLING" tag="SUBSCRIPTION">
      <div className="banner cyan">
        Billing isn't wired up yet — the figures below are placeholders. Plan management is coming soon.
      </div>

      <div className="block">
        <div className="bhead">CURRENT PLAN</div>
        <div className="lrow">
          <span className="ldot violet" />
          <div className="lmain">
            <div className="lname">Free preview</div>
            <div className="lsub">No active subscription</div>
          </div>
          <span className="tag violet">PREVIEW</span>
          <button className="btn ghost sm" disabled>CHANGE PLAN</button>
        </div>
      </div>

      <div className="block">
        <div className="bhead">USAGE THIS CYCLE</div>
        <Meter label="AGENT CREDITS" text="— / — tokens" pct={0} />
        <Meter label="VIDEO GENERATIONS" text="— / — videos" pct={0} />
        <Meter label="SPEND" text="$— / $—" pct={0} />
        <div className="dim" style={{ marginTop: 12 }}>Usage metering is not yet available.</div>
      </div>

      <div className="block">
        <div className="bhead">PAYMENT METHOD</div>
        <div className="bdesc">No payment method on file. Add one when billing goes live.</div>
      </div>
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
// Shared HUD primitives (panel / not-connected / field)
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
.set-root .head{padding:14px 34px 2px;display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:14px}
.set-root .h1{font-family:var(--disp);font-size:30px;letter-spacing:9px;font-weight:600;margin:0;line-height:1}
.set-root .h1 .b{background:linear-gradient(90deg,var(--accent),var(--magenta));-webkit-background-clip:text;background-clip:text;color:transparent}
.set-root .sub{font-size:11px;color:rgba(238,240,246,.4);letter-spacing:3px;margin-top:8px}

/* ── hub: section rail + pane ────────────────────────────────────────────── */
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
.set-root .snav-div{height:1px;border-top:1px solid rgba(255,107,107,.16);margin:10px 4px 2px}
.set-root .ssignout{display:flex;align-items:center;gap:11px;text-align:left;padding:13px 15px;border-radius:13px;cursor:pointer;
  border:1px solid rgba(255,107,107,.28);background:rgba(255,107,107,.05);color:#ffb0b0;font-family:var(--mono);transition:.18s}
.set-root .ssignout:hover{border-color:var(--red);background:rgba(255,107,107,.14);color:#fff}
.set-root .ssignout .sopower{font-size:15px;line-height:1;flex-shrink:0;opacity:.85}
.set-root .ssignout .solabel{font-family:var(--disp);font-size:12px;letter-spacing:2.4px;font-weight:600}

/* ── panel ───────────────────────────────────────────────────────────────── */
.set-root .pane{min-width:0;display:flex;flex-direction:column;gap:18px}
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
.set-root .inp:disabled{opacity:.7;cursor:default}
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
.set-root .lavatar{width:44px;height:44px;border-radius:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;overflow:hidden;
  font-family:var(--disp);font-size:18px;font-weight:600;color:#fff;background:linear-gradient(135deg,var(--accent),var(--magenta));box-shadow:0 0 14px rgba(108,99,255,.4)}
.set-root .lavatar img{width:100%;height:100%;object-fit:cover}
.set-root .card{padding:15px;border-radius:13px;border:1px solid var(--line);background:rgba(108,99,255,.04)}

/* ── meters ──────────────────────────────────────────────────────────────── */
.set-root .meter{margin-top:10px}
.set-root .mtop{display:flex;justify-content:space-between;margin-bottom:5px}
.set-root .mlabel{font-family:var(--disp);font-size:9px;letter-spacing:1.4px;color:rgba(238,240,246,.5)}
.set-root .mtext{font-size:10px;color:rgba(238,240,246,.5)}
.set-root .mtrack{height:6px;border-radius:999px;background:rgba(238,240,246,.08);overflow:hidden}
.set-root .mfill{display:block;height:100%;border-radius:999px;background:var(--accent);box-shadow:0 0 8px rgba(108,99,255,.6);transition:width .3s}
.set-root .mfill.hot{background:var(--amber);box-shadow:0 0 8px rgba(245,181,68,.6)}

/* ── not-connected / empty / banners ─────────────────────────────────────── */
.set-root .nc{display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px;padding:44px 24px}
.set-root .ncbeacon{width:13px;height:13px;border-radius:50%;background:rgba(108,99,255,.4);position:relative;box-shadow:0 0 14px rgba(108,99,255,.5)}
.set-root .ncbeacon::after{content:"";position:absolute;inset:-7px;border-radius:50%;border:1.5px solid rgba(108,99,255,.5);animation:shalo 2.4s ease-out infinite}
@keyframes shalo{0%{transform:scale(.5);opacity:.9}100%{transform:scale(2.1);opacity:0}}
.set-root .nctitle{font-family:var(--disp);font-size:13px;letter-spacing:2.4px;color:#eef0f6;font-weight:600}
.set-root .ncdesc{font-size:12px;color:rgba(238,240,246,.5);max-width:420px;line-height:1.6}
.set-root .empty{padding:34px 24px;text-align:center;font-size:12.5px;color:rgba(238,240,246,.5)}
.set-root .empty.err{color:#ffb0b0}
.set-root .banner{padding:10px 14px;border-radius:10px;font-size:11.5px;margin:0 0 14px;letter-spacing:.3px}
.set-root .banner.err{color:#ffb0b0;border:1px solid rgba(255,107,107,.3);background:rgba(255,107,107,.08)}
.set-root .banner.cyan{color:#8ff0e4;border:1px solid rgba(21,224,200,.25);background:rgba(21,224,200,.06)}
.set-root .banner.amber{color:#ffd99a;border:1px solid rgba(245,181,68,.32);background:rgba(245,181,68,.08)}

/* ── remembered repos + token rows (revoke ✕, masked token, reveal) ──────── */
.set-root .repos{margin-top:18px;padding-top:16px;border-top:1px solid rgba(108,99,255,.1)}
.set-root .reposhead{font-family:var(--disp);font-size:11px;letter-spacing:2.2px;font-weight:600;margin-bottom:10px}
.set-root .repox{flex-shrink:0;background:none;border:1px solid rgba(255,107,107,.32);color:#ffb0b0;cursor:pointer;
  width:26px;height:26px;border-radius:8px;font-size:12px;line-height:1;transition:.16s}
.set-root .repox:hover:not(:disabled){border-color:var(--red);background:rgba(255,107,107,.16);color:#fff}
.set-root .repox:disabled{opacity:.4;cursor:not-allowed}
.set-root .tokrev{font-family:var(--mono);font-size:12.5px;letter-spacing:.4px}
.set-root .mask{font-family:var(--mono);font-size:10.5px;color:rgba(189,184,255,.85);background:rgba(108,99,255,.1);
  padding:1px 6px;border-radius:6px}
.set-root .soonbox{border:1px dashed rgba(238,240,246,.16);border-radius:14px;padding:26px 24px;text-align:center;
  font-size:12px;color:rgba(238,240,246,.42);background:rgba(108,99,255,.03)}

/* ── connections (merged from LinksPage, restyled to HUD panels) ─────────── */
.set-root .cgroup{padding-bottom:22px;margin-bottom:22px;border-bottom:1px solid rgba(108,99,255,.08)}
.set-root .cgroup:last-of-type{border-bottom:none;margin-bottom:4px;padding-bottom:4px}
.set-root .cshead{display:flex;align-items:center;gap:13px;margin-bottom:14px}
.set-root .cglyph{width:32px;height:32px;border-radius:9px;border:1px solid;display:flex;align-items:center;justify-content:center;font-size:16px;background:rgba(108,99,255,.05);flex-shrink:0}
.set-root .cstitle{flex:1;min-width:0}
.set-root .csname{font-family:var(--disp);font-size:14px;letter-spacing:2.6px;font-weight:600;text-transform:uppercase}
.set-root .csdesc{font-size:11px;color:rgba(238,240,246,.42);margin-top:3px;line-height:1.4}
.set-root .cbadge{font-family:var(--disp);font-size:10px;letter-spacing:1.4px;padding:5px 11px;border-radius:999px;border:1px solid var(--line);color:rgba(238,240,246,.7);background:rgba(108,99,255,.05);white-space:nowrap}
.set-root .cgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}
.set-root .ccard{position:relative;border:1px solid var(--line);border-radius:14px;overflow:hidden;padding:16px 16px 14px 20px;
  background:rgba(108,99,255,.04);transition:.18s}
.set-root .ccard:hover{border-color:color-mix(in srgb,var(--ca,var(--accent)) 40%,var(--line));background:rgba(108,99,255,.07)}
.set-root .ccard.on{border-color:color-mix(in srgb,var(--ca,var(--accent)) 42%,var(--line))}
.set-root .ccard .cstripe{position:absolute;top:0;left:0;width:4px;height:100%;background:transparent;transition:.18s}
.set-root .ccard.on .cstripe{background:var(--ca,var(--accent))}
.set-root .ccardtop{display:flex;align-items:center;gap:11px;margin-bottom:12px}
.set-root .clogo{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,.4);font-family:var(--disp);font-weight:700;font-size:16px;color:#fff}
.set-root .clogo img{width:100%;height:100%;object-fit:cover}
.set-root .clogo svg{width:18px;height:18px}
.set-root .cmeta{min-width:0;flex:1}
.set-root .cpname{font-family:var(--disp);font-size:15px;font-weight:500;color:#eef0f6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.set-root .cphandle{font-size:10.5px;color:rgba(238,240,246,.4);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.set-root .cstatusrow{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:13px}
.set-root .ctag{font-family:var(--disp);font-size:9px;letter-spacing:1.2px;padding:4px 9px;border-radius:999px;display:inline-flex;align-items:center;gap:5px;white-space:nowrap}
.set-root .ctag .tdot{width:5px;height:5px;border-radius:50%}
.set-root .ctag.linked{color:#8ff0e4;border:1px solid var(--cyan);background:rgba(21,224,200,.1)}
.set-root .ctag.linked .tdot{background:var(--cyan);box-shadow:0 0 7px var(--cyan)}
.set-root .ctag.idle{color:rgba(238,240,246,.5);border:1px solid rgba(238,240,246,.2);background:rgba(255,255,255,.03)}
.set-root .ctag.idle .tdot{background:rgba(238,240,246,.35)}
.set-root .ctag.warn{color:#ffd99a;border:1px solid var(--amber);background:rgba(245,181,68,.12)}
.set-root .ccardact{display:flex}
.set-root .cbtn{font-family:var(--disp);font-size:10.5px;letter-spacing:1.4px;padding:9px 14px;border-radius:10px;cursor:pointer;transition:.18s;width:100%;text-align:center}
.set-root .cbtn:disabled{opacity:.55;cursor:default}
.set-root .cbtn.con{color:#fff;border:1px solid var(--accent);background:rgba(108,99,255,.16)}
.set-root .cbtn.con:hover:not(:disabled){background:rgba(108,99,255,.28);box-shadow:0 0 18px rgba(108,99,255,.3)}
.set-root .cbtn.dis{color:#ffb0b0;border:1px solid rgba(255,107,107,.5);background:rgba(255,107,107,.08)}
.set-root .cbtn.dis:hover:not(:disabled){border-color:var(--red);background:rgba(255,107,107,.16)}
`;
