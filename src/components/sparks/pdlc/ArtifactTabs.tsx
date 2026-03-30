import { useState } from 'react';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import { useRoleArtifact } from '../../../hooks/usePipeline';
import type { PdlcRole, RoleResultSummary } from '../../../api/types';

interface ArtifactTabsProps {
  sparkId: string;
  activatedRoles: PdlcRole[];
  roleResults: Record<string, RoleResultSummary>;
}

const ROLE_SHORT_NAMES: Record<PdlcRole, string> = {
  PM: 'PM',
  RESEARCHER: 'Research',
  ARCHITECT: 'Arch',
  DESIGNER: 'Design',
  PLANNER: 'Plan',
  IMPLEMENTER: 'Impl',
  REVIEWER: 'Review',
  TESTER: 'Test',
  SECURITY_ANALYST: 'Security',
  TECHNICAL_WRITER: 'Docs',
  DEVOPS: 'DevOps',
  RETRO_ANALYST: 'Retro',
};

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return String(tokens);
}

function ArtifactContent({ sparkId, role }: { sparkId: string; role: PdlcRole }) {
  const { data: artifact, isLoading, isError } = useRoleArtifact(sparkId, role);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (isError || !artifact) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
        No artifact available
      </Typography>
    );
  }

  return (
    <Box>
      {/* Metadata chips */}
      <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
        {artifact.artifactType && (
          <Chip
            label={artifact.artifactType}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.65rem' }}
          />
        )}
        <Chip
          label={`v${artifact.artifactVersion}`}
          size="small"
          variant="outlined"
          sx={{ fontSize: '0.65rem' }}
        />
      </Box>

      {/* Artifact content */}
      <Box
        sx={{
          fontFamily: "'SF Mono', 'Fira Code', monospace",
          fontSize: '0.75rem',
          bgcolor: '#1a1a2e',
          borderRadius: '8px',
          p: 1.5,
          maxHeight: 400,
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          color: 'text.secondary',
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
        }}
      >
        {JSON.stringify(artifact.content, null, 2)}
      </Box>
    </Box>
  );
}

export default function ArtifactTabs({
  sparkId,
  activatedRoles,
  roleResults,
}: ArtifactTabsProps) {
  const [selectedTab, setSelectedTab] = useState(0);

  const selectedRole = activatedRoles[selectedTab] ?? null;
  const selectedResult = selectedRole ? roleResults[selectedRole] : undefined;
  const isCompleted = selectedResult?.status === 'COMPLETED';
  const isExecuting =
    selectedResult?.status === 'EXECUTING' || selectedResult?.status === 'REWORKING';

  return (
    <Box>
      <Tabs
        value={selectedTab}
        onChange={(_, newValue: number) => setSelectedTab(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: 36,
          '& .MuiTab-root': { minHeight: 36, py: 0.5, textTransform: 'none', fontSize: '0.75rem' },
        }}
      >
        {activatedRoles.map((role) => {
          const result = roleResults[role];
          const completed = result?.status === 'COMPLETED';
          const pending = !result || result.status === 'PENDING';

          return (
            <Tab
              key={role}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <span>{ROLE_SHORT_NAMES[role]}</span>
                  {result && (
                    <Typography
                      component="span"
                      sx={{
                        fontSize: '0.6rem',
                        color: completed ? '#4CAF50' : 'text.secondary',
                      }}
                    >
                      {formatTokens(result.tokens)}
                    </Typography>
                  )}
                </Box>
              }
              disabled={pending}
              sx={{
                opacity: pending ? 0.3 : 1,
              }}
            />
          );
        })}
      </Tabs>

      {/* Tab content */}
      <Box sx={{ mt: 1.5 }}>
        {isExecuting && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
            <CircularProgress size={16} />
            <Typography variant="body2" color="text.secondary">
              In progress...
            </Typography>
          </Box>
        )}

        {isCompleted && selectedRole && (
          <Box>
            {/* Role metadata summary */}
            {selectedResult && (
              <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={selectedResult.model}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(108, 99, 255, 0.15)',
                    color: '#B39DDB',
                    fontSize: '0.65rem',
                  }}
                />
                <Chip
                  label={`${formatTokens(selectedResult.tokens)} tokens`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.65rem' }}
                />
                {selectedResult.iteration > 1 && (
                  <Chip
                    label={`iteration ${selectedResult.iteration}`}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255, 152, 0, 0.15)',
                      color: '#FF9800',
                      fontSize: '0.65rem',
                    }}
                  />
                )}
              </Box>
            )}
            <ArtifactContent sparkId={sparkId} role={selectedRole} />
          </Box>
        )}

        {!isCompleted && !isExecuting && selectedRole && (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            {roleResults[selectedRole]?.status === 'SKIPPED'
              ? 'Role was skipped'
              : roleResults[selectedRole]?.status === 'FAILED'
                ? 'Role failed'
                : 'No content available'}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
