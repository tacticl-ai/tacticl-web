import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useUpdateSkippedRoles } from '../../../hooks/usePipeline';
import type { PipelineRun, PdlcRole, RoleResultSummary } from '../../../api/types';

interface PdlcPipelineControlsProps {
  sparkId: string;
  pipelineRun: PipelineRun;
}

const ROLE_LABELS: Record<PdlcRole, string> = {
  PM: 'PM',
  RESEARCHER: 'Researcher',
  ARCHITECT: 'Architect',
  DESIGNER: 'Designer',
  PLANNER: 'Planner',
  IMPLEMENTER: 'Implementer',
  REVIEWER: 'Reviewer',
  TESTER: 'Tester',
  SECURITY_ANALYST: 'Security',
  TECHNICAL_WRITER: 'Docs',
  DEVOPS: 'DevOps',
  RETRO_ANALYST: 'Retro',
};

const DEFAULT_COST_CEILING = 50;

function isRoleSkippable(
  role: PdlcRole,
  roleResults: Record<string, RoleResultSummary>,
  currentRole: PdlcRole | null,
): boolean {
  const result = roleResults[role];
  // Skippable if no result at all, or status is PENDING
  if (!result) return role !== currentRole;
  return result.status === 'PENDING';
}

function getCostColor(percentage: number): string {
  if (percentage > 80) return '#CF6679';
  if (percentage > 50) return '#FF9800';
  return '#03DAC6';
}

export default function PdlcPipelineControls({ sparkId, pipelineRun }: PdlcPipelineControlsProps) {
  const [expanded, setExpanded] = useState(false);
  const [pendingSkips, setPendingSkips] = useState<Set<PdlcRole>>(new Set());
  const updateSkippedRoles = useUpdateSkippedRoles(sparkId);

  // Build the set of roles that are already marked as skipped in the pipeline
  const alreadySkipped = useMemo(() => {
    const set = new Set<PdlcRole>();
    for (const [role, result] of Object.entries(pipelineRun.roleResults)) {
      if (result.status === 'SKIPPED') {
        set.add(role as PdlcRole);
      }
    }
    return set;
  }, [pipelineRun.roleResults]);

  const handleToggleSkip = (role: PdlcRole) => {
    setPendingSkips((prev) => {
      const next = new Set(prev);
      if (next.has(role)) {
        next.delete(role);
      } else {
        next.add(role);
      }
      return next;
    });
  };

  const handleApplySkips = () => {
    const skipRoles = Array.from(pendingSkips);
    updateSkippedRoles.mutate(skipRoles, {
      onSuccess: () => setPendingSkips(new Set()),
    });
  };

  const hasPendingChanges = pendingSkips.size > 0;

  // Cost ceiling bar
  const totalCost = pipelineRun.totalCost;
  const costPercentage = Math.min((totalCost / DEFAULT_COST_CEILING) * 100, 100);
  const costColor = getCostColor(costPercentage);

  return (
    <Box
      sx={{
        bgcolor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      {/* Toggle header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          cursor: 'pointer',
        }}
        onClick={() => setExpanded((prev) => !prev)}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Pipeline Controls
        </Typography>
        <IconButton size="small" sx={{ color: 'text.secondary' }}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ px: 2, pb: 2 }}>
          {/* Role skip toggles */}
          <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
            Role Skipping
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
            {pipelineRun.activatedRoles.map((role) => {
              const skippable = isRoleSkippable(role, pipelineRun.roleResults, pipelineRun.currentRole);
              const isAlreadySkipped = alreadySkipped.has(role);
              const isPendingSkip = pendingSkips.has(role);
              const isToggled = isPendingSkip || isAlreadySkipped;

              return (
                <Chip
                  key={role}
                  label={ROLE_LABELS[role]}
                  size="small"
                  variant={isToggled ? 'filled' : 'outlined'}
                  disabled={!skippable || isAlreadySkipped}
                  onClick={skippable && !isAlreadySkipped ? () => handleToggleSkip(role) : undefined}
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    ...(isToggled && {
                      textDecoration: 'line-through',
                      opacity: 0.5,
                      bgcolor: 'rgba(255, 255, 255, 0.08)',
                    }),
                    ...(!skippable && !isAlreadySkipped && {
                      borderColor: 'rgba(255, 255, 255, 0.12)',
                    }),
                  }}
                />
              );
            })}
          </Box>

          {hasPendingChanges && (
            <Button
              size="small"
              variant="contained"
              onClick={handleApplySkips}
              disabled={updateSkippedRoles.isPending}
              sx={{
                mb: 2,
                bgcolor: '#6C63FF',
                '&:hover': { bgcolor: '#5A52D5' },
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              {updateSkippedRoles.isPending ? 'Applying...' : `Apply (skip ${pendingSkips.size} role${pendingSkips.size > 1 ? 's' : ''})`}
            </Button>
          )}

          {/* Cost ceiling bar */}
          <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block' }}>
            Cost Ceiling
          </Typography>
          <LinearProgress
            variant="determinate"
            value={costPercentage}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'rgba(255, 255, 255, 0.06)',
              '& .MuiLinearProgress-bar': {
                bgcolor: costColor,
                borderRadius: 3,
              },
            }}
          />
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}
          >
            ${totalCost.toFixed(2)} / ${DEFAULT_COST_CEILING.toFixed(2)}
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
}
