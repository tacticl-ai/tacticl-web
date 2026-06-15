// src/pages/LinksPage.tsx
// Full-bleed "LINKS" HUD surface — consolidates the Connections experience into a
// single command-deck view. Integrations are grouped (Social · Media · Developer ·
// Productivity) as glass cards with connect/disconnect actions, wired to the real
// /v1/connections feed + OAuth flow. Rendered full-bleed (no AppLayout chrome),
// sharing the COMMAND / DASHBOARD / LINKS / SETTINGS top nav with the dashboard.
//
// Functional parity with src/pages/connections/*: same useConnections / useConnectPlatform
// / useDisconnectPlatform / useHandleOAuthCallback hooks, same OAuth popup + callback
// handling, same platformConfig source of truth. Only the chrome is HUD-ified.
import { cloneElement, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import type { Connection } from '../api/types';

// ── Category presentation (icon glyph + accent) — mirrors ConnectionsOverviewPage.
const CATEGORY_GLYPH: Record<ConnectionCategory, string> = {
  social: '◈',
  media: '◉',
  developer: '⌘',
  productivity: '⬡',
};

const CATEGORY_ACCENT: Record<ConnectionCategory, string> = {
  social: 'var(--accent)',
  media: 'var(--red)',
  developer: 'var(--cyan)',
  productivity: 'var(--amber)',
};

const CATEGORIES: ConnectionCategory[] = ['social', 'media', 'developer', 'productivity'];
// Productivity has no platforms / no backend yet — render as a "coming soon" deck.
const COMING_SOON: ReadonlySet<ConnectionCategory> = new Set(['productivity']);

export default function LinksPage() {
  const navigate = useNavigate();
  const { data: connections, isLoading, isError, refetch } = useConnections();
  const connectPlatform = useConnectPlatform();
  const disconnectPlatform = useDisconnectPlatform();
  const handleOAuthCallback = useHandleOAuthCallback();
  const [searchParams, setSearchParams] = useSearchParams();
  const [oauthError, setOauthError] = useState<string | null>(null);

  const list = useMemo(() => (connections ?? []) as Connection[], [connections]);

  // OAuth callback handling — identical contract to the connections pages, but the
  // redirectUri points back at /links so the popup → tab returns here.
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
      const redirectUri = window.location.origin + '/links';
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
    const redirectUri = window.location.origin + '/links';
    connectPlatform.mutate({ platform: platformKey, redirectUri });
  };

  const counts = useMemo(() => {
    let connected = 0;
    let total = 0;
    let needsAttention = 0;
    for (const cat of CATEGORIES) {
      if (COMING_SOON.has(cat)) continue;
      for (const p of getPlatformsByCategory(cat)) {
        total += 1;
        const c = getConnectionForPlatform(list, p.key);
        if (c) {
          connected += 1;
          if (c.tokenRefreshNeeded || c.disabled) needsAttention += 1;
        }
      }
    }
    return { connected, total, needsAttention };
  }, [list]);

  return (
    <div className="links-root">
      <style>{CSS}</style>
      <div className="grid-bg" />
      <div className="scan" />

      <div className="stage">
        <div className="top">
          <div className="brand"><span className="beacon" />TACTICL <span className="sep">//</span> LINKS</div>
          <div className="topright">
            <span className="muted">PRODUCT · TACTICL</span>
            <div className="nav">
              <a className="chip" onClick={() => navigate('/command')}>COMMAND</a>
              <a className="chip" onClick={() => navigate('/dashboard')}>DASHBOARD</a>
              <a className="chip active">LINKS</a>
              <a className="chip" onClick={() => navigate('/settings')}>SETTINGS</a>
            </div>
          </div>
        </div>

        <div className="head">
          <div>
            <h1 className="h1">CONNECTED <span className="b">CHANNELS</span></h1>
            <div className="sub">INTEGRATION GRID · {counts.total} CHANNEL{counts.total === 1 ? '' : 'S'}</div>
          </div>
          <div className="summary">
            <Stat color="var(--cyan)" n={counts.connected} l="LINKED" />
            <Stat color="rgba(238,240,246,.4)" n={Math.max(counts.total - counts.connected, 0)} l="AVAILABLE" />
            <Stat color="var(--amber)" n={counts.needsAttention} l="NEEDS YOU" />
          </div>
        </div>

        {oauthError && (
          <div className="banner">
            <span>⚠ {oauthError}</span>
            <a onClick={() => setOauthError(null)}>DISMISS</a>
          </div>
        )}

        {isLoading && (
          <div className="panel"><div className="empty">Loading channels…</div></div>
        )}

        {isError && !isLoading && (
          <div className="panel">
            <div className="empty err">
              Failed to load connections.
              <a className="retry" onClick={() => refetch()}>RETRY →</a>
            </div>
          </div>
        )}

        {!isLoading && !isError && CATEGORIES.map((category, ci) => {
          const accent = CATEGORY_ACCENT[category];
          const isSoon = COMING_SOON.has(category);
          const plats = getPlatformsByCategory(category);
          const connectedCount = plats.filter((p) => getConnectionForPlatform(list, p.key)).length;

          return (
            <div className="section" key={category} style={{ animationDelay: `${0.05 + ci * 0.08}s` }}>
              <div className="shead">
                <span className="glyph" style={{ color: accent, borderColor: accent }}>
                  {CATEGORY_GLYPH[category]}
                </span>
                <div className="stitle">
                  <div className="sname">{categoryLabels[category]}</div>
                  <div className="sdesc">{categoryDescriptions[category]}</div>
                </div>
                {isSoon ? (
                  <span className="badge soon">COMING SOON</span>
                ) : (
                  <span className="badge" style={{ borderColor: accent, color: accent }}>
                    {connectedCount} / {plats.length}
                  </span>
                )}
              </div>

              {isSoon || plats.length === 0 ? (
                <div className="soonbox">
                  Productivity integrations like Slack, Notion, and Google Drive are on the way.
                </div>
              ) : (
                <div className="cards">
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
            </div>
          );
        })}

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- MUI SvgIcon accepts sx; element type is ReactElement<any>
    sx: { fontSize: 18, color: '#fff' },
  } as Record<string, unknown>);

  return (
    <div className={`card${isConnected ? ' on' : ''}`} style={{ '--ca': accent } as React.CSSProperties}>
      <span className="stripe" />
      <div className="cardtop">
        <span className="logo" style={{ background: platform.color === '#000000' || platform.color === '#010101' || platform.color === '#181717' ? '#222' : platform.color }}>
          {connection?.profileImageUrl
            ? <img src={connection.profileImageUrl} alt="" />
            : glyph}
        </span>
        <div className="meta">
          <div className="pname">{platform.name}</div>
          <div className="phandle">
            {isConnected ? (connection?.platformUsername || 'connected') : 'not linked'}
          </div>
        </div>
      </div>

      <div className="statusrow">
        {isConnected ? (
          <span className="tag linked"><span className="tdot" />LINKED</span>
        ) : (
          <span className="tag idle"><span className="tdot" />AVAILABLE</span>
        )}
        {needsReconnect && <span className="tag warn">⚠ RECONNECT</span>}
        {connection?.disabled && <span className="tag warn">DISABLED</span>}
      </div>

      <div className="cardact">
        {isConnected ? (
          <button
            className="btn dis"
            disabled={disconnecting}
            onClick={() => connection && onDisconnect(connection.id)}
          >
            {disconnecting ? 'DISCONNECTING…' : 'DISCONNECT'}
          </button>
        ) : (
          <button
            className="btn con"
            disabled={connecting}
            onClick={onConnect}
          >
            {connecting ? 'OPENING…' : 'CONNECT →'}
          </button>
        )}
      </div>
    </div>
  );
}

const CSS = `
.links-root{position:fixed;inset:0;overflow-y:auto;color:#eef0f6;font-family:var(--mono);letter-spacing:.2px;
  --accent:#6C63FF;--magenta:#B25CFF;--cyan:#15E0C8;--red:#FF6B6B;--amber:#F5B544;
  --ink:#070a0c;--glass1:rgba(22,28,34,.66);--glass2:rgba(11,15,19,.66);
  --disp:"Chakra Petch",sans-serif;--mono:"JetBrains Mono",ui-monospace,monospace;--line:rgba(108,99,255,.14);
  background:radial-gradient(1300px 820px at 50% -8%,rgba(108,99,255,.16),transparent 58%),
    radial-gradient(1000px 760px at 92% 110%,rgba(178,92,255,.10),transparent 60%),
    radial-gradient(760px 620px at 4% 18%,rgba(21,224,200,.06),transparent 60%),var(--ink);}
.links-root .grid-bg{position:fixed;inset:0;pointer-events:none;opacity:.45;z-index:0;
  background-image:linear-gradient(rgba(108,99,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(108,99,255,.06) 1px,transparent 1px);
  background-size:54px 54px;-webkit-mask-image:radial-gradient(ellipse 80% 70% at 50% 32%,#000 35%,transparent 78%);}
.links-root .scan{position:fixed;left:0;right:0;height:160px;z-index:1;pointer-events:none;
  background:linear-gradient(rgba(108,99,255,.07),transparent);animation:lscan 8s linear infinite;}
@keyframes lscan{0%{transform:translateY(-160px)}100%{transform:translateY(100vh)}}
.links-root .stage{position:relative;z-index:2}
.links-root .top{display:flex;align-items:center;justify-content:space-between;padding:22px 34px 10px}
.links-root .brand{display:flex;align-items:center;gap:13px;font-family:var(--disp);font-size:18px;letter-spacing:7px;font-weight:600}
.links-root .beacon{width:11px;height:11px;border-radius:50%;background:var(--accent);position:relative;box-shadow:0 0 14px var(--accent)}
.links-root .beacon::after{content:"";position:absolute;inset:-6px;border-radius:50%;border:1.5px solid var(--accent);animation:lhalo 2.2s ease-out infinite}
@keyframes lhalo{0%{transform:scale(.5);opacity:.9}100%{transform:scale(2.1);opacity:0}}
.links-root .sep{color:var(--accent)}
.links-root .topright{display:flex;align-items:center;gap:18px}
.links-root .muted{color:rgba(238,240,246,.42);font-size:11px}
.links-root .nav{display:flex;gap:7px}
.links-root .chip{padding:6px 13px;border-radius:999px;border:1px solid rgba(108,99,255,.3);font-family:var(--disp);font-size:10.5px;letter-spacing:2px;color:rgba(170,165,255,.9);background:rgba(108,99,255,.05);cursor:pointer;transition:.18s}
.links-root .chip:hover{border-color:var(--accent);color:#fff;background:rgba(108,99,255,.16)}
.links-root .chip.active{color:#fff;border-color:var(--accent);background:rgba(108,99,255,.2);box-shadow:0 0 18px rgba(108,99,255,.25)}
.links-root .head{padding:14px 34px 2px;display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:14px}
.links-root .h1{font-family:var(--disp);font-size:30px;letter-spacing:9px;font-weight:600;margin:0;line-height:1}
.links-root .h1 .b{background:linear-gradient(90deg,var(--accent),var(--magenta));-webkit-background-clip:text;background-clip:text;color:transparent}
.links-root .sub{font-size:11px;color:rgba(238,240,246,.4);letter-spacing:3px;margin-top:8px}
.links-root .summary{display:flex;gap:9px;flex-wrap:wrap}
.links-root .stat{display:flex;align-items:center;gap:9px;padding:9px 15px;border-radius:12px;border:1px solid var(--line);background:linear-gradient(180deg,var(--glass1),var(--glass2));backdrop-filter:blur(16px)}
.links-root .stat .n{font-family:var(--disp);font-size:19px;font-weight:600}
.links-root .stat .l{font-size:9.5px;letter-spacing:1.6px;color:rgba(238,240,246,.42)}
.links-root .sdot{width:8px;height:8px;border-radius:50%}
.links-root .banner{margin:14px 34px 0;display:flex;align-items:center;justify-content:space-between;gap:14px;
  padding:11px 18px;border:1px solid var(--red);border-radius:12px;background:rgba(255,107,107,.1);color:#ffb0b0;font-size:12px}
.links-root .banner a{font-family:var(--disp);font-size:10px;letter-spacing:1.5px;color:#ffb0b0;cursor:pointer}
.links-root .banner a:hover{color:#fff}
.links-root .panel{margin:16px 34px 0;border:1px solid var(--line);border-radius:16px;overflow:hidden;
  background:linear-gradient(180deg,var(--glass1),var(--glass2));backdrop-filter:blur(18px);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.04),inset 0 0 60px rgba(108,99,255,.04),0 18px 60px rgba(0,0,0,.55);position:relative}
.links-root .empty{padding:34px 24px;text-align:center;font-size:12.5px;color:rgba(238,240,246,.5)}
.links-root .empty.err{color:#ffb0b0;display:flex;flex-direction:column;gap:12px;align-items:center}
.links-root .retry,.links-root .empty .retry{font-family:var(--disp);font-size:10.5px;letter-spacing:1.5px;color:var(--amber);cursor:pointer}
.links-root .retry:hover{text-shadow:0 0 12px rgba(245,181,68,.7)}
.links-root .section{margin:20px 34px 0;opacity:0;transform:translateY(10px);animation:lrise .55s cubic-bezier(.2,.7,.2,1) forwards}
@keyframes lrise{to{opacity:1;transform:none}}
.links-root .shead{display:flex;align-items:center;gap:14px;margin-bottom:13px}
.links-root .glyph{width:34px;height:34px;border-radius:10px;border:1px solid;display:flex;align-items:center;justify-content:center;font-size:16px;background:rgba(108,99,255,.05);flex-shrink:0}
.links-root .stitle{flex:1;min-width:0}
.links-root .sname{font-family:var(--disp);font-size:16px;letter-spacing:3px;font-weight:600;text-transform:uppercase}
.links-root .sdesc{font-size:10.5px;color:rgba(238,240,246,.4);margin-top:2px}
.links-root .badge{font-family:var(--disp);font-size:10px;letter-spacing:1.4px;padding:5px 12px;border-radius:999px;border:1px solid var(--line);color:rgba(238,240,246,.7);background:rgba(108,99,255,.05);white-space:nowrap}
.links-root .badge.soon{color:rgba(238,240,246,.45);border-color:rgba(238,240,246,.2)}
.links-root .soonbox{border:1px dashed rgba(238,240,246,.16);border-radius:14px;padding:26px 24px;text-align:center;
  font-size:12px;color:rgba(238,240,246,.42);background:linear-gradient(180deg,var(--glass1),var(--glass2));backdrop-filter:blur(14px)}
.links-root .cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(248px,1fr));gap:14px}
.links-root .card{position:relative;border:1px solid var(--line);border-radius:16px;overflow:hidden;padding:18px 18px 16px 22px;
  background:linear-gradient(180deg,var(--glass1),var(--glass2));backdrop-filter:blur(16px);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.04),0 12px 40px rgba(0,0,0,.45);transition:.2s}
.links-root .card:hover{border-color:var(--ca);box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 10px 34px color-mix(in srgb,var(--ca) 22%,transparent)}
.links-root .card.on{border-color:color-mix(in srgb,var(--ca) 45%,var(--line))}
.links-root .card .stripe{position:absolute;top:0;left:0;width:4px;height:100%;background:transparent;transition:.2s}
.links-root .card.on .stripe{background:var(--ca)}
.links-root .cardtop{display:flex;align-items:center;gap:12px;margin-bottom:14px}
.links-root .logo{width:40px;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,.4)}
.links-root .logo img{width:100%;height:100%;object-fit:cover}
.links-root .logo svg{width:18px;height:18px}
.links-root .meta{min-width:0;flex:1}
.links-root .pname{font-family:var(--disp);font-size:14px;font-weight:500;color:#eef0f6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.links-root .phandle{font-size:10.5px;color:rgba(238,240,246,.4);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.links-root .statusrow{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:15px}
.links-root .tag{font-family:var(--disp);font-size:9px;letter-spacing:1.2px;padding:4px 9px;border-radius:999px;display:inline-flex;align-items:center;gap:5px;white-space:nowrap}
.links-root .tag .tdot{width:5px;height:5px;border-radius:50%}
.links-root .tag.linked{color:#8ff0e4;border:1px solid var(--cyan);background:rgba(21,224,200,.1)}
.links-root .tag.linked .tdot{background:var(--cyan);box-shadow:0 0 7px var(--cyan)}
.links-root .tag.idle{color:rgba(238,240,246,.5);border:1px solid rgba(238,240,246,.2);background:rgba(255,255,255,.03)}
.links-root .tag.idle .tdot{background:rgba(238,240,246,.35)}
.links-root .tag.warn{color:#ffd99a;border:1px solid var(--amber);background:rgba(245,181,68,.12)}
.links-root .cardact{display:flex}
.links-root .btn{font-family:var(--disp);font-size:10.5px;letter-spacing:1.4px;padding:9px 16px;border-radius:10px;cursor:pointer;transition:.18s;width:100%;text-align:center}
.links-root .btn:disabled{opacity:.55;cursor:default}
.links-root .btn.con{color:#fff;border:1px solid var(--accent);background:rgba(108,99,255,.16)}
.links-root .btn.con:hover:not(:disabled){background:rgba(108,99,255,.28);box-shadow:0 0 18px rgba(108,99,255,.3)}
.links-root .btn.dis{color:#ffb0b0;border:1px solid rgba(255,107,107,.5);background:rgba(255,107,107,.08)}
.links-root .btn.dis:hover:not(:disabled){border-color:var(--red);background:rgba(255,107,107,.16)}
`;
