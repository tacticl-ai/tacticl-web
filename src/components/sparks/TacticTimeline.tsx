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
  const getCheckpointBetween = (prevTacticId: string) => {
    return checkpoints.find((cp) => cp.tacticId === prevTacticId);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, py: 2, overflowX: 'auto' }}>
      {tactics.map((tactic, i) => {
        const style = statusStyles[tactic.status] || statusStyles.PENDING;
        const cp = i > 0 ? getCheckpointBetween(tactics[i - 1].id) : null;

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
                      borderColor: cp.userDecision === 'APPROVED' ? '#34D399' : cp.userDecision === 'CANCEL' ? '#F87171' : '#FBBF24',
                      bgcolor: 'background.paper',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 700, zIndex: 2, cursor: 'pointer',
                      color: cp.userDecision === 'APPROVED' ? '#34D399' : cp.userDecision === 'CANCEL' ? '#F87171' : '#FBBF24',
                      ...(!cp.userDecision && {
                        animation: 'cpPulse 2s ease-in-out infinite',
                        '@keyframes cpPulse': {
                          '0%, 100%': { boxShadow: '0 0 0px rgba(251, 191, 36, 0)' },
                          '50%': { boxShadow: '0 0 14px rgba(251, 191, 36, 0.25)' },
                        },
                      }),
                    }}>
                      {cp.userDecision === 'APPROVED' ? '\u2713' : cp.userDecision === 'CANCEL' ? '\u2715' : '\u23F8'}
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
                minWidth: 100, border: '1.5px solid', borderStyle: ('borderStyle' in style ? style.borderStyle : 'solid') || 'solid',
                bgcolor: style.bgcolor, borderColor: style.borderColor, color: style.color,
                transition: 'all 0.2s',
                ...('glow' in style && style.glow && {
                  boxShadow: '0 0 20px rgba(108, 99, 255, 0.1)',
                  animation: 'nodeGlow 3s ease-in-out infinite',
                  '@keyframes nodeGlow': {
                    '0%, 100%': { boxShadow: '0 0 15px rgba(108, 99, 255, 0.08)' },
                    '50%': { boxShadow: '0 0 25px rgba(108, 99, 255, 0.18)' },
                  },
                }),
              }}>
                {'icon' in style ? `${style.icon} ` : ''}{tactic.description.length > 20 ? tactic.description.slice(0, 20) + '...' : tactic.description}
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
