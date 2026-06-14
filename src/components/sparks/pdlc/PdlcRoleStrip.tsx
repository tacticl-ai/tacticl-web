import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { PdlcRole, RoleResultSummary } from '../../../api/types';

interface PdlcRoleStripProps {
  activatedRoles: PdlcRole[];
  roleResults: Record<string, RoleResultSummary>;
  currentRole: PdlcRole | null;
  skippedRequiredRoles: string[];
  onRoleClick: (role: PdlcRole) => void;
}

const ROLE_ABBREVIATIONS: Record<PdlcRole, string> = {
  PO: 'PO',
  RESEARCHER: 'RSCH',
  ARCHITECT: 'ARCH',
  DESIGNER: 'DSGN',
  PLANNER: 'PLAN',
  IMPLEMENTER: 'IMPL',
  REVIEWER: 'REV',
  TESTER: 'TEST',
  SECURITY_ANALYST: 'SEC',
  TECHNICAL_WRITER: 'DOCS',
  DEVOPS: 'OPS',
  RETRO_ANALYST: 'RETRO',
};

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M tok`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K tok`;
  return `${tokens} tok`;
}

function shortModelName(model: string): string {
  // Extract last meaningful segment: "claude-sonnet-4-20250514" → "sonnet-4"
  const parts = model.split('-');
  if (parts.length >= 3) {
    return parts.slice(1, 3).join('-');
  }
  return model.length > 12 ? model.slice(0, 12) : model;
}

type NodeStatus = 'completed' | 'active' | 'failed' | 'skipped' | 'pending';

function getNodeStatus(
  role: PdlcRole,
  roleResults: Record<string, RoleResultSummary>,
  currentRole: PdlcRole | null,
): NodeStatus {
  const result = roleResults[role];
  if (result) {
    if (result.status === 'COMPLETED') return 'completed';
    if (result.status === 'FAILED' || result.status === 'REJECTED' || result.status === 'ESCALATED')
      return 'failed';
    if (result.status === 'SKIPPED') return 'skipped';
  }
  if (role === currentRole) return 'active';
  return 'pending';
}

function ElapsedTimer() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const display = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  return (
    <Typography variant="caption" sx={{ color: '#B39DDB', fontSize: '0.65rem' }}>
      {display}
    </Typography>
  );
}

export default function PdlcRoleStrip({
  activatedRoles,
  roleResults,
  currentRole,
  skippedRequiredRoles,
  onRoleClick,
}: PdlcRoleStripProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        overflowX: 'auto',
        py: 1,
        px: 0.5,
        '&::-webkit-scrollbar': { height: 4 },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
      }}
    >
      {activatedRoles.map((role, index) => {
        const status = getNodeStatus(role, roleResults, currentRole);
        const result = roleResults[role];
        const isSkippedRequired = skippedRequiredRoles.includes(role);

        return (
          <Box key={role} sx={{ display: 'flex', alignItems: 'flex-start' }}>
            {/* Connector before node (except first) */}
            {index > 0 && (
              <Box
                sx={{
                  width: 20,
                  height: '2px',
                  mt: '19px', // center vertically with 40px node
                  bgcolor: (() => {
                    // Connector color based on PREVIOUS node's completion
                    const prevRole = activatedRoles[index - 1];
                    const prevResult = roleResults[prevRole];
                    const prevDone = prevResult && (prevResult.status === 'COMPLETED' || prevResult.status === 'FAILED' || prevResult.status === 'SKIPPED');
                    return prevDone ? '#4CAF50' : '#555';
                  })(),
                  flexShrink: 0,
                }}
              />
            )}

            {/* Role node */}
            <Box
              onClick={() => onRoleClick(role)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                minWidth: 56,
                flexShrink: 0,
              }}
            >
              {/* Circle node */}
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  flexShrink: 0,
                  ...(status === 'completed' && {
                    background: 'linear-gradient(135deg, #4CAF50, #388E3C)',
                  }),
                  ...(status === 'active' && {
                    bgcolor: '#6C63FF',
                    animation: 'pdlc-pulse 2s ease-in-out infinite',
                    '@keyframes pdlc-pulse': {
                      '0%, 100%': { boxShadow: '0 0 0 0 rgba(108, 99, 255, 0.5)' },
                      '50%': { boxShadow: '0 0 0 8px rgba(108, 99, 255, 0)' },
                    },
                  }),
                  ...(status === 'failed' && {
                    bgcolor: '#CF6679',
                  }),
                  ...(status === 'skipped' && {
                    bgcolor: '#555',
                  }),
                  ...(status === 'pending' && {
                    bgcolor: 'transparent',
                    border: '2px dashed #555',
                  }),
                  transition: 'background-color 0.3s ease',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.6rem',
                    color: status === 'pending' ? '#888' : '#fff',
                    ...(status === 'skipped' && {
                      textDecoration: 'line-through',
                    }),
                    lineHeight: 1,
                  }}
                >
                  {ROLE_ABBREVIATIONS[role]}
                </Typography>

                {/* Rework badge */}
                {result && result.iteration > 1 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      bgcolor: '#FF9800',
                      borderRadius: '8px',
                      px: 0.5,
                      py: '1px',
                      minWidth: 16,
                      textAlign: 'center',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ fontSize: '0.55rem', fontWeight: 700, color: '#000', lineHeight: 1 }}
                    >
                      x{result.iteration}
                    </Typography>
                  </Box>
                )}

                {/* Skipped-required indicator (small warning dot) */}
                {isSkippedRequired && status === 'skipped' && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: '#FF9800',
                    }}
                  />
                )}
              </Box>

              {/* Metadata below node */}
              <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {status === 'completed' && result && (
                  <>
                    {result.durationMs != null && (
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary', fontSize: '0.6rem', lineHeight: 1.2 }}
                      >
                        {formatDuration(result.durationMs)}
                      </Typography>
                    )}
                    {result.model && (
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary', fontSize: '0.55rem', lineHeight: 1.2 }}
                      >
                        {shortModelName(result.model)}
                      </Typography>
                    )}
                    {result.tokens != null && (
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary', fontSize: '0.55rem', lineHeight: 1.2 }}
                      >
                        {formatTokens(result.tokens)}
                      </Typography>
                    )}
                  </>
                )}
                {status === 'active' && <ElapsedTimer />}
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
