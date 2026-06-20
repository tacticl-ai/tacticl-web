# Spark Control Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the simple SparkListPage card grid and separate SparkDetailPage with a unified "Spark Control" dashboard — a mission-control-style interface with summary stats, device status strip, expandable spark rows showing tactic timelines, inline checkpoint management, and live activity feeds.

**Architecture:** Single-page dashboard that composes new sub-components. SparkListPage.tsx becomes SparkControlPage.tsx. SparkDetailPage.tsx route removed — all detail lives in expandable rows. Existing hooks (useSparks, useDevices, useCheckpoints, useSparkProgress) and API modules are reused without modification. New components are purely presentational or use existing hooks.

**Tech Stack:** React 19, TypeScript, MUI 7, Zustand (spark progress store), TanStack React Query 5, date-fns, existing WebSocket infrastructure.

**Design mockup:** see the current HUD set in `docs/mockups/` (open `docs/mockups/index.html`) — the dashboard surface supersedes the original Spark Control mockup.

---

## Task 1: Create SummaryBar Component

**Files:**
- Create: `src/components/sparks/SummaryBar.tsx`

**Context:** Horizontal row of clickable status chips showing live counts (Executing, Checkpoint, Completed, Failed). Clicking a chip sets a status filter. Clicking the active chip clears the filter.

**Step 1: Create the component**

```tsx
// src/components/sparks/SummaryBar.tsx
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import type { Spark } from '../../api/types';

interface SummaryBarProps {
  sparks: Spark[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const statusConfigs = [
  { key: 'EXECUTING', label: 'Executing', color: '#6C63FF', glow: true },
  { key: 'CHECKPOINT', label: 'Checkpoint', color: '#FBBF24', glow: true },
  { key: 'COMPLETED', label: 'Completed', color: '#34D399', glow: false },
  { key: 'FAILED', label: 'Failed', color: '#F87171', glow: false },
] as const;

export default function SummaryBar({ sparks, activeFilter, onFilterChange }: SummaryBarProps) {
  const counts = statusConfigs.map((cfg) => ({
    ...cfg,
    count: sparks.filter((s) => {
      if (cfg.key === 'EXECUTING') return s.status === 'EXECUTING' || s.status === 'ROUTING';
      return s.status === cfg.key;
    }).length,
  }));

  return (
    <Box sx={{ display: 'flex', gap: 1.25, mb: 2.5, flexWrap: 'wrap' }}>
      {counts.map((item) => {
        const isActive = activeFilter === item.key;
        return (
          <ButtonBase
            key={item.key}
            onClick={() => onFilterChange(isActive ? 'ALL' : item.key)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 1.25,
              bgcolor: isActive ? `${item.color}15` : 'background.paper',
              border: '1px solid',
              borderColor: isActive ? `${item.color}40` : 'divider',
              borderRadius: '10px',
              minWidth: 120,
              transition: 'all 0.2s',
              '&:hover': { borderColor: 'rgba(255,255,255,0.12)', bgcolor: isActive ? `${item.color}15` : 'action.hover' },
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: item.color,
                boxShadow: item.glow ? `0 0 8px ${item.color}` : 'none',
                ...(item.glow && {
                  animation: 'summaryPulse 2s ease-in-out infinite',
                  '@keyframes summaryPulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.4 },
                  },
                }),
              }}
            />
            <Box sx={{ textAlign: 'left' }}>
              <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 18, fontWeight: 600, lineHeight: 1, letterSpacing: -0.5, color: 'text.primary' }}>
                {item.count}
              </Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 450 }}>
                {item.label}
              </Typography>
            </Box>
          </ButtonBase>
        );
      })}
    </Box>
  );
}
```

**Step 2: Verify it renders**

Import into a temporary test in SparkListPage or Storybook to confirm layout. Check:
- Chips render with correct counts
- Click toggles filter
- Active state shows highlight border
- Pulse animation on Executing/Checkpoint dots

**Step 3: Commit**

```bash
git add src/components/sparks/SummaryBar.tsx
git commit -m "feat: add SummaryBar component for Spark Control Dashboard"
```

---

## Task 2: Create DeviceStrip Component

**Files:**
- Create: `src/components/sparks/DeviceStrip.tsx`

**Context:** Horizontal row of device cards showing device name, state (online/busy/offline), and count of active sparks assigned. Includes a virtual "Cloud" card for sparks with no deviceId. Clicking a device filters the spark table.

**Step 1: Create the component**

```tsx
// src/components/sparks/DeviceStrip.tsx
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import CloudIcon from '@mui/icons-material/Cloud';
import LaptopIcon from '@mui/icons-material/Laptop';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import TabletIcon from '@mui/icons-material/Tablet';
import WatchIcon from '@mui/icons-material/Watch';
import type { Device, Spark } from '../../api/types';

interface DeviceStripProps {
  devices: Device[];
  sparks: Spark[];
  activeDeviceId: string | null; // null = no filter, 'cloud' = no-device sparks
  onDeviceChange: (deviceId: string | null) => void;
}

const deviceIcons: Record<string, typeof LaptopIcon> = {
  COMPUTER: LaptopIcon,
  PHONE: PhoneIphoneIcon,
  TABLET: TabletIcon,
  WATCH: WatchIcon,
};

const stateColors: Record<string, string> = {
  ONLINE: '#34D399',
  BUSY: '#FBBF24',
  OFFLINE: '#44444F',
};

export default function DeviceStrip({ devices, sparks, activeDeviceId, onDeviceChange }: DeviceStripProps) {
  const activeSparks = sparks.filter((s) => s.status === 'EXECUTING' || s.status === 'ROUTING' || s.status === 'CHECKPOINT' || s.status === 'PENDING');

  const deviceEntries = devices.map((d) => ({
    id: d.id,
    name: d.name,
    icon: deviceIcons[d.deviceType] || LaptopIcon,
    stateColor: stateColors[d.state] || stateColors.OFFLINE,
    stateLabel: d.state.toLowerCase(),
    sparkCount: activeSparks.filter((s) => s.deviceId === d.id).length,
  }));

  const cloudSparkCount = activeSparks.filter((s) => !s.deviceId).length;

  const handleClick = (id: string) => {
    onDeviceChange(activeDeviceId === id ? null : id);
  };

  const cardSx = (id: string) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 1.25,
    px: 1.75,
    py: 1.25,
    bgcolor: activeDeviceId === id ? 'rgba(108,99,255,0.08)' : 'background.paper',
    border: '1px solid',
    borderColor: activeDeviceId === id ? 'rgba(108,99,255,0.3)' : 'divider',
    borderRadius: '10px',
    minWidth: 150,
    flexShrink: 0,
    transition: 'all 0.2s',
    '&:hover': { borderColor: 'rgba(255,255,255,0.12)', bgcolor: 'action.hover' },
  });

  return (
    <Box sx={{ display: 'flex', gap: 1.25, mb: 3, overflowX: 'auto', pb: 0.5 }}>
      {deviceEntries.map((d) => {
        const Icon = d.icon;
        return (
          <ButtonBase key={d.id} onClick={() => handleClick(d.id)} sx={cardSx(d.id)}>
            <Box sx={{ position: 'relative', width: 34, height: 34, borderRadius: '8px', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Box sx={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: '50%', bgcolor: d.stateColor, border: '2px solid', borderColor: 'background.paper' }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</Typography>
              <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                {d.sparkCount > 0 ? `${d.sparkCount} spark${d.sparkCount > 1 ? 's' : ''}` : ''}{d.sparkCount > 0 ? ' \u00B7 ' : ''}{d.stateLabel}
              </Typography>
            </Box>
          </ButtonBase>
        );
      })}

      {/* Cloud card */}
      <ButtonBase onClick={() => handleClick('cloud')} sx={cardSx('cloud')}>
        <Box sx={{ position: 'relative', width: 34, height: 34, borderRadius: '8px', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CloudIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Box sx={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: '50%', bgcolor: '#34D399', border: '2px solid', borderColor: 'background.paper' }} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 500 }}>Cloud</Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
            {cloudSparkCount > 0 ? `${cloudSparkCount} spark${cloudSparkCount > 1 ? 's' : ''}` : 'no sparks'}
          </Typography>
        </Box>
      </ButtonBase>
    </Box>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/sparks/DeviceStrip.tsx
git commit -m "feat: add DeviceStrip component for Spark Control Dashboard"
```

---

## Task 3: Create TacticTimeline Component

**Files:**
- Create: `src/components/sparks/TacticTimeline.tsx`

**Context:** Horizontal visual timeline showing tactic nodes connected by lines. Completed tactics are solid green, executing pulses purple, pending are dashed. Checkpoint markers sit on connector lines. Hovering a connector between pending tactics reveals a "+ checkpoint" insert zone.

**Step 1: Create the component**

```tsx
// src/components/sparks/TacticTimeline.tsx
import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import type { Tactic, Checkpoint } from '../../api/types';

interface TacticTimelineProps {
  tactics: Tactic[];
  checkpoints: Checkpoint[];
  onInsertCheckpoint?: (afterTacticId: string) => void;
}

const statusStyles = {
  COMPLETED: {
    bgcolor: 'rgba(52, 211, 153, 0.08)',
    borderColor: 'rgba(52, 211, 153, 0.25)',
    color: '#34D399',
    icon: '\u2713',
  },
  EXECUTING: {
    bgcolor: 'rgba(108, 99, 255, 0.08)',
    borderColor: 'rgba(108, 99, 255, 0.3)',
    color: '#9D97FF',
    icon: '\u26A1',
    glow: true,
  },
  PENDING: {
    bgcolor: 'transparent',
    borderColor: 'rgba(255,255,255,0.08)',
    color: '#44444F',
    borderStyle: 'dashed',
  },
  FAILED: {
    bgcolor: 'rgba(248, 113, 113, 0.08)',
    borderColor: 'rgba(248, 113, 113, 0.25)',
    color: '#F87171',
    icon: '\u2715',
  },
} as const;

export default function TacticTimeline({ tactics, checkpoints, onInsertCheckpoint }: TacticTimelineProps) {
  const [hoveredConnector, setHoveredConnector] = useState<string | null>(null);

  if (tactics.length === 0) return null;

  // Find checkpoints between tactics (checkpoint.tacticId = the tactic it's gating before)
  const getCheckpointBetween = (prevTacticId: string, _nextTacticId: string) => {
    return checkpoints.find((cp) => cp.tacticId === prevTacticId);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, py: 2, overflowX: 'auto' }}>
      {tactics.map((tactic, i) => {
        const style = statusStyles[tactic.status] || statusStyles.PENDING;
        const isLast = i === tactics.length - 1;
        const cp = i > 0 ? getCheckpointBetween(tactics[i - 1].id, tactic.id) : null;

        return (
          <Box key={tactic.id} sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Connector before this node (not for first) */}
            {i > 0 && (
              <Box
                sx={{ width: 40, height: 2, position: 'relative', flexShrink: 0, cursor: tactic.status === 'PENDING' ? 'pointer' : 'default' }}
                onMouseEnter={() => tactic.status === 'PENDING' && setHoveredConnector(tactic.id)}
                onMouseLeave={() => setHoveredConnector(null)}
              >
                {/* Line */}
                <Box sx={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 2, borderRadius: 1,
                  background: tactics[i - 1].status === 'COMPLETED' && tactic.status === 'EXECUTING'
                    ? 'linear-gradient(90deg, rgba(52,211,153,0.3), #6C63FF)'
                    : tactics[i - 1].status === 'COMPLETED'
                      ? 'rgba(52, 211, 153, 0.3)'
                      : 'rgba(255,255,255,0.06)',
                }} />

                {/* Checkpoint marker */}
                {cp && (
                  <Tooltip title={cp.title} arrow>
                    <Box sx={{
                      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                      width: 22, height: 22, borderRadius: '50%',
                      border: '2px solid',
                      borderColor: cp.userDecision === 'APPROVED' ? '#34D399' : cp.userDecision === 'REJECTED' ? '#F87171' : '#FBBF24',
                      bgcolor: 'background.paper',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 700, zIndex: 2, cursor: 'pointer',
                      color: cp.userDecision === 'APPROVED' ? '#34D399' : cp.userDecision === 'REJECTED' ? '#F87171' : '#FBBF24',
                      ...(!cp.userDecision && {
                        animation: 'cpPulse 2s ease-in-out infinite',
                        '@keyframes cpPulse': {
                          '0%, 100%': { boxShadow: '0 0 0px rgba(251, 191, 36, 0)' },
                          '50%': { boxShadow: '0 0 14px rgba(251, 191, 36, 0.25)' },
                        },
                      }),
                    }}>
                      {cp.userDecision === 'APPROVED' ? '\u2713' : cp.userDecision === 'REJECTED' ? '\u2715' : '\u23F8'}
                    </Box>
                  </Tooltip>
                )}

                {/* Insert checkpoint zone */}
                {!cp && tactic.status === 'PENDING' && onInsertCheckpoint && (
                  <Box
                    onClick={() => onInsertCheckpoint(tactics[i - 1].id)}
                    sx={{
                      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                      px: 0.75, py: 0.25, borderRadius: '3px', fontSize: 10,
                      color: hoveredConnector === tactic.id ? '#9D97FF' : 'text.disabled',
                      cursor: 'pointer', opacity: hoveredConnector === tactic.id ? 1 : 0,
                      transition: 'opacity 0.2s', whiteSpace: 'nowrap',
                      bgcolor: 'background.default', border: '1px dashed',
                      borderColor: hoveredConnector === tactic.id ? '#6C63FF' : 'text.disabled',
                    }}
                  >
                    + cp
                  </Box>
                )}
              </Box>
            )}

            {/* Tactic node */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75, minWidth: 100, flexShrink: 0 }}>
              <Box sx={{
                px: 1.75, py: 1.25, borderRadius: '6px', fontSize: 12, fontWeight: 500, textAlign: 'center',
                minWidth: 100, border: '1.5px solid', borderStyle: style.borderStyle || 'solid',
                bgcolor: style.bgcolor, borderColor: style.borderColor, color: style.color,
                transition: 'all 0.2s',
                ...(style.glow && {
                  boxShadow: '0 0 20px rgba(108, 99, 255, 0.1)',
                  animation: 'nodeGlow 3s ease-in-out infinite',
                  '@keyframes nodeGlow': {
                    '0%, 100%': { boxShadow: '0 0 15px rgba(108, 99, 255, 0.08)' },
                    '50%': { boxShadow: '0 0 25px rgba(108, 99, 255, 0.18)' },
                  },
                }),
              }}>
                {style.icon ? `${style.icon} ` : ''}{tactic.description.length > 20 ? tactic.description.slice(0, 20) + '...' : tactic.description}
              </Box>
              <Typography sx={{ fontSize: 10, color: 'text.disabled', fontWeight: 450 }}>
                {tactic.status === 'EXECUTING' ? 'running...' : tactic.status === 'COMPLETED' ? 'done' : tactic.status === 'FAILED' ? 'failed' : 'queued'}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/sparks/TacticTimeline.tsx
git commit -m "feat: add TacticTimeline component with checkpoint markers and insert zones"
```

---

## Task 4: Create SparkRow Component (Expandable Table Row)

**Files:**
- Create: `src/components/sparks/SparkRow.tsx`

**Context:** Each spark renders as a table-like row showing status, title, device, tactic progress bar, cost, and updated time. Clicking expands to reveal TacticTimeline, checkpoint approval, live activity, and action buttons. Replaces SparkCard and SparkDetailPage.

**Step 1: Create the component**

The SparkRow component is the core of the dashboard. It needs:
- Collapsed view: grid row with status badge, title+meta, device indicator, tactic progress bar, cost, time, chevron
- Expanded view: TacticTimeline, pending checkpoint banner (reuse CheckpointApproval), live activity feed, action buttons
- Priority accent: left border colored for HIGH (warning) and URGENT (error)

```tsx
// src/components/sparks/SparkRow.tsx
import { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Collapse from '@mui/material/Collapse';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { format, formatDistanceToNow } from 'date-fns';
import SparkStatusBadge from './SparkStatusBadge';
import TacticTimeline from './TacticTimeline';
import CheckpointApproval from './CheckpointApproval';
import { useSparkTactics, useSparkLogs, useCancelSpark } from '../../hooks/useSparks';
import { useCheckpoints } from '../../hooks/useCheckpoints';
import { useSparkProgressStore } from '../../hooks/useSparkProgress';
import type { Spark, Device } from '../../api/types';

interface SparkRowProps {
  spark: Spark;
  devices: Device[];
  isExpanded: boolean;
  onToggle: () => void;
}

export default function SparkRow({ spark, devices, isExpanded, onToggle }: SparkRowProps) {
  const { data: tactics } = useSparkTactics(spark.id);
  const { data: allCheckpoints } = useCheckpoints();
  const cancelSpark = useCancelSpark();
  const progressMessages = useSparkProgressStore((s) => s.sparkProgress[spark.id] || []);
  const activityEndRef = useRef<HTMLDivElement>(null);

  const displayTactics = tactics ?? [];
  const sparkCheckpoints = (allCheckpoints ?? []).filter((cp) => cp.sparkId === spark.id);
  const pendingCheckpoints = sparkCheckpoints.filter((cp) => !cp.userDecision);
  const device = devices.find((d) => d.id === spark.deviceId);
  const completedTactics = displayTactics.filter((t) => t.status === 'COMPLETED').length;
  const totalTactics = displayTactics.length;

  const isActive = spark.status === 'EXECUTING' || spark.status === 'ROUTING' || spark.status === 'CHECKPOINT';
  const showLiveActivity = isActive && progressMessages.length > 0;

  // Priority accent
  const priorityBorder = spark.priority === 'URGENT' ? '#F87171' : spark.priority === 'HIGH' ? '#FBBF24' : null;

  // Device state color
  const stateColors: Record<string, string> = { ONLINE: '#34D399', BUSY: '#FBBF24', OFFLINE: '#44444F' };
  const deviceColor = device ? stateColors[device.state] || stateColors.OFFLINE : '#34D399'; // cloud = always online
  const deviceName = device ? device.name : spark.deviceId ? 'Unknown' : 'Cloud';

  useEffect(() => {
    if (isExpanded) activityEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [progressMessages.length, isExpanded]);

  // Tactic progress
  const progressPercent = totalTactics > 0 ? (completedTactics / totalTactics) * 100 : 0;
  const progressColor = spark.status === 'FAILED' ? '#F87171' : spark.status === 'COMPLETED' ? '#34D399' : progressPercent > 0 ? 'linear-gradient(90deg, #34D399, #6C63FF)' : '#6C63FF';

  return (
    <Box sx={{
      borderBottom: '1px solid', borderBottomColor: 'divider',
      '&:last-child': { borderBottom: 'none' },
    }}>
      {/* Collapsed row */}
      <Box
        onClick={onToggle}
        sx={{
          display: 'grid',
          gridTemplateColumns: '90px 1fr 130px 120px 70px 80px 36px',
          gap: 0,
          px: 2,
          py: 1.75,
          alignItems: 'center',
          cursor: 'pointer',
          borderLeft: priorityBorder ? `3px solid ${priorityBorder}` : '3px solid transparent',
          transition: 'background 0.15s',
          '&:hover': { bgcolor: 'action.hover' },
          ...(isExpanded && { bgcolor: 'rgba(108, 99, 255, 0.04)' }),
        }}
      >
        <Box><SparkStatusBadge status={spark.status} size="small" /></Box>
        <Box>
          <Typography sx={{ fontSize: 13.5, fontWeight: 500, mb: 0.25 }}>{spark.title}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            {spark.type && (
              <Typography component="span" sx={{ fontSize: 10.5, px: 0.75, py: 0.125, bgcolor: 'rgba(255,255,255,0.04)', borderRadius: '3px', color: 'text.secondary', fontWeight: 500 }}>
                {spark.type}
              </Typography>
            )}
            {spark.priority !== 'NORMAL' && (
              <Typography component="span" sx={{ fontSize: 11, fontWeight: 500, color: spark.priority === 'URGENT' ? '#F87171' : spark.priority === 'HIGH' ? '#FBBF24' : 'text.secondary' }}>
                {spark.priority}
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: deviceColor, flexShrink: 0 }} />
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{deviceName}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ flex: 1, height: 4, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ height: '100%', width: `${progressPercent}%`, background: progressColor, borderRadius: 2, transition: 'width 0.5s ease' }} />
          </Box>
          <Typography sx={{ fontSize: 12, fontFamily: '"JetBrains Mono", monospace', color: 'text.secondary', whiteSpace: 'nowrap' }}>
            {completedTactics}/{totalTactics}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: 12.5, fontFamily: '"JetBrains Mono", monospace', color: 'text.secondary' }}>
          ${spark.estimatedCost.toFixed(2)}
        </Typography>
        <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>
          {formatDistanceToNow(new Date(spark.updatedAt), { addSuffix: true }).replace('about ', '')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: isExpanded ? 'primary.light' : 'text.disabled', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
          <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
        </Box>
      </Box>

      {/* Expanded detail */}
      <Collapse in={isExpanded} unmountOnExit>
        <Box sx={{ px: 3, py: 2.5, borderTop: '1px solid', borderTopColor: 'rgba(108,99,255,0.08)', bgcolor: 'rgba(108, 99, 255, 0.02)' }}>
          {/* Tactic Timeline */}
          {displayTactics.length > 0 && (
            <TacticTimeline tactics={displayTactics} checkpoints={sparkCheckpoints} />
          )}

          {/* Pending Checkpoints */}
          {pendingCheckpoints.map((cp) => (
            <Box key={cp.id} sx={{ mt: 1.5 }}>
              <CheckpointApproval checkpoint={cp} />
            </Box>
          ))}

          {/* Live Activity */}
          {showLiveActivity && (
            <Paper sx={{ mt: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.75, py: 1, borderBottom: '1px solid', borderBottomColor: 'divider', bgcolor: 'rgba(0,0,0,0.2)' }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#34D399', animation: 'livePulse 2s ease-in-out infinite', '@keyframes livePulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.4 } } }} />
                <Typography sx={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, color: 'text.secondary' }}>Live Activity</Typography>
              </Box>
              <Box sx={{ maxHeight: 160, overflowY: 'auto', py: 1 }}>
                {progressMessages.map((msg) => (
                  <Box key={msg.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, px: 1.75, py: 0.5 }}>
                    <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'text.disabled', flexShrink: 0, pt: 0.125 }}>
                      {format(new Date(msg.timestamp), 'HH:mm:ss')}
                    </Typography>
                    <Typography sx={{
                      fontSize: 12.5,
                      color: msg.type === 'failed' ? 'error.main' : msg.type === 'completed' ? 'success.main' : 'text.secondary',
                    }}>
                      {msg.message}
                    </Typography>
                  </Box>
                ))}
                <div ref={activityEndRef} />
              </Box>
            </Paper>
          )}

          {/* Spark Result */}
          {spark.result && (
            <Paper sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography sx={{ fontSize: 13, mb: 1 }}>{spark.result.summary}</Typography>
              {spark.result.prs.length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                  {spark.result.prs.map((pr, i) => (
                    <Chip key={i} label={`PR: ${pr.split('/').pop()}`} component="a" href={pr} target="_blank" clickable size="small" sx={{ fontSize: '0.7rem' }} />
                  ))}
                </Box>
              )}
            </Paper>
          )}

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1, mt: 2, pt: 2, borderTop: '1px solid', borderTopColor: 'divider' }}>
            {isActive && (
              <>
                <Button size="small" variant="outlined" color="warning" sx={{ fontSize: 12, textTransform: 'none' }}>
                  Add Checkpoint
                </Button>
                <Button size="small" variant="outlined" color="error" sx={{ fontSize: 12, textTransform: 'none' }} onClick={() => cancelSpark.mutate(spark.id)}>
                  Cancel Spark
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/sparks/SparkRow.tsx
git commit -m "feat: add SparkRow expandable component with tactic timeline, live activity, and checkpoint management"
```

---

## Task 5: Create SparkControlPage (Replaces SparkListPage)

**Files:**
- Modify: `src/pages/SparkListPage.tsx` (rewrite as SparkControlPage)
- Modify: `src/App.tsx` (remove /sparks/:id route, keep /sparks)

**Context:** Assemble the full dashboard: TopBar + SummaryBar + DeviceStrip + spark table (header + SparkRow for each spark). Apply status and device filters. Remove the SparkDetailPage route since all detail lives in expandable rows.

**Step 1: Rewrite SparkListPage.tsx**

```tsx
// src/pages/SparkListPage.tsx — renamed conceptually to SparkControlPage
import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TopBar from '../components/layout/TopBar';
import SummaryBar from '../components/sparks/SummaryBar';
import DeviceStrip from '../components/sparks/DeviceStrip';
import SparkRow from '../components/sparks/SparkRow';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { useSparks } from '../hooks/useSparks';
import { useDevices } from '../hooks/useDevices';

export default function SparkListPage() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deviceFilter, setDeviceFilter] = useState<string | null>(null);
  const [expandedSparkId, setExpandedSparkId] = useState<string | null>(null);

  // Fetch all sparks (we filter client-side for summary counts + device filter)
  const { data: allSparks, isLoading: sparksLoading, isError: sparksError, refetch } = useSparks();
  const { data: devices } = useDevices();

  const sparks = allSparks ?? [];
  const deviceList = devices ?? [];

  // Apply filters
  let filtered = sparks;
  if (statusFilter !== 'ALL') {
    if (statusFilter === 'EXECUTING') {
      filtered = filtered.filter((s) => s.status === 'EXECUTING' || s.status === 'ROUTING');
    } else {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }
  }
  if (deviceFilter) {
    if (deviceFilter === 'cloud') {
      filtered = filtered.filter((s) => !s.deviceId);
    } else {
      filtered = filtered.filter((s) => s.deviceId === deviceFilter);
    }
  }

  // Sort: active sparks first (EXECUTING, CHECKPOINT, ROUTING, PENDING), then by updatedAt desc
  const statusOrder: Record<string, number> = { EXECUTING: 0, CHECKPOINT: 1, ROUTING: 2, PENDING: 3, COMPLETED: 4, FAILED: 5, CANCELLED: 6 };
  filtered.sort((a, b) => {
    const oa = statusOrder[a.status] ?? 9;
    const ob = statusOrder[b.status] ?? 9;
    if (oa !== ob) return oa - ob;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <>
      <TopBar title="Spark Control" />

      {sparksLoading ? (
        <LoadingState message="Loading sparks..." />
      ) : sparksError ? (
        <ErrorState message="Failed to load sparks." onRetry={refetch} />
      ) : sparks.length === 0 ? (
        <EmptyState variant="sparks" title="No sparks yet" description="Start a conversation in Chat to create your first spark." />
      ) : (
        <>
          <SummaryBar sparks={sparks} activeFilter={statusFilter} onFilterChange={setStatusFilter} />
          <DeviceStrip devices={deviceList} sparks={sparks} activeDeviceId={deviceFilter} onDeviceChange={setDeviceFilter} />

          {/* Spark Table */}
          <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '10px', overflow: 'hidden' }}>
            {/* Header */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: '90px 1fr 130px 120px 70px 80px 36px',
              px: 2, py: 1.25,
              bgcolor: 'background.default',
              borderBottom: '1px solid', borderBottomColor: 'divider',
            }}>
              {['Status', 'Spark', 'Device', 'Tactics', 'Cost', 'Updated', ''].map((h) => (
                <Typography key={h} sx={{ fontSize: 11, fontWeight: 500, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {h}
                </Typography>
              ))}
            </Box>

            {/* Rows */}
            {filtered.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography color="text.secondary" sx={{ fontSize: 13 }}>No sparks match the current filters.</Typography>
              </Box>
            ) : (
              filtered.map((spark) => (
                <SparkRow
                  key={spark.id}
                  spark={spark}
                  devices={deviceList}
                  isExpanded={expandedSparkId === spark.id}
                  onToggle={() => setExpandedSparkId(expandedSparkId === spark.id ? null : spark.id)}
                />
              ))
            )}
          </Box>
        </>
      )}
    </>
  );
}
```

**Step 2: Update App.tsx — remove SparkDetailPage route**

In `src/App.tsx`, find the route for `/sparks/:id` and remove it. The `/sparks` route stays and now serves the full dashboard. Keep the SparkDetailPage.tsx file for now (it can be deleted later in cleanup) but remove its route import.

**Step 3: Verify the app builds**

Run: `npm run build`
Expected: No TypeScript errors, build succeeds.

**Step 4: Commit**

```bash
git add src/pages/SparkListPage.tsx src/App.tsx
git commit -m "feat: replace SparkListPage with Spark Control Dashboard, remove SparkDetailPage route"
```

---

## Task 6: Code Review and Visual QA

**Context:** Review all new components for correctness, consistency with the mockup, and adherence to existing codebase patterns.

**Step 1: Review checklist**

- [ ] SummaryBar: counts are correct, filter toggle works, pulse animation on active statuses
- [ ] DeviceStrip: devices show correct state colors, Cloud card appears, spark counts accurate
- [ ] TacticTimeline: completed/executing/pending nodes render correctly, checkpoint markers show, insert zones appear on hover
- [ ] SparkRow: grid alignment matches header, priority borders show, expand/collapse is smooth, live activity feeds, checkpoint approval inline
- [ ] SparkControlPage: filters chain correctly (status + device), sort order is active-first, empty state works
- [ ] No regressions: sidebar "Sparks" link still works, other pages unaffected
- [ ] TypeScript: no `any` types, all props properly typed
- [ ] Existing patterns: uses MUI theme tokens (not hardcoded colors where theme vars exist), follows hook patterns

**Step 2: Fix any issues found**

**Step 3: Final commit**

```bash
git add -A
git commit -m "fix: address code review feedback for Spark Control Dashboard"
```
