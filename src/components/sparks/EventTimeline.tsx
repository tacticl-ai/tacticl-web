import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { usePipelineEvents } from '../../hooks/usePipeline';
import type { PipelineEventType, PdlcRole } from '../../api/types';

interface EventTimelineProps {
  sparkId: string;
}

const EVENT_COLORS: Record<string, string> = {
  PIPELINE_STARTED: '#888',
  PIPELINE_COMPLETED: '#4CAF50',
  PIPELINE_FAILED: '#CF6679',
  PIPELINE_CANCELLED: '#CF6679',
  PIPELINE_RESUMED: '#888',
  ROLE_STARTED: '#6C63FF',
  ROLE_COMPLETED: '#4CAF50',
  ROLE_REJECTED: '#FF9800',
  ROLE_SKIPPED: '#FF9800',
  REWORK_TRIGGERED: '#FF9800',
  REWORK_COMPLETED: '#FF9800',
  REWORK_ESCALATED: '#FF9800',
  CHECKPOINT_REQUESTED: '#FF9800',
  CHECKPOINT_RESOLVED: '#FF9800',
  CHECKPOINT_TIMEOUT_REMINDER: '#FF9800',
  ARTIFACT_PRODUCED: '#03DAC6',
  PARALLEL_ROLES_STARTED: '#6C63FF',
  COST_THRESHOLD_WARNING: '#CF6679',
  COST_CEILING_REACHED: '#CF6679',
};

const ROLE_DISPLAY_NAMES: Record<PdlcRole, string> = {
  PM: 'PM',
  RESEARCHER: 'Researcher',
  ARCHITECT: 'Architect',
  DESIGNER: 'Designer',
  PLANNER: 'Planner',
  IMPLEMENTER: 'Implementer',
  REVIEWER: 'Reviewer',
  TESTER: 'Tester',
  SECURITY_ANALYST: 'Security Analyst',
  TECHNICAL_WRITER: 'Tech Writer',
  DEVOPS: 'DevOps',
  RETRO_ANALYST: 'Retro Analyst',
};

function formatEventDescription(eventType: PipelineEventType, role: PdlcRole | null): string {
  const roleName = role ? ROLE_DISPLAY_NAMES[role] ?? role : null;

  switch (eventType) {
    case 'PIPELINE_STARTED':
      return 'Pipeline started';
    case 'PIPELINE_COMPLETED':
      return 'Pipeline completed';
    case 'PIPELINE_FAILED':
      return 'Pipeline failed';
    case 'PIPELINE_CANCELLED':
      return 'Pipeline cancelled';
    case 'PIPELINE_RESUMED':
      return 'Pipeline resumed';
    case 'ROLE_STARTED':
      return roleName ? `${roleName} started` : 'Role started';
    case 'ROLE_COMPLETED':
      return roleName ? `${roleName} completed` : 'Role completed';
    case 'ROLE_REJECTED':
      return roleName ? `${roleName} rejected` : 'Role rejected';
    case 'ROLE_SKIPPED':
      return roleName ? `${roleName} skipped` : 'Role skipped';
    case 'REWORK_TRIGGERED':
      return roleName ? `Rework triggered for ${roleName}` : 'Rework triggered';
    case 'REWORK_COMPLETED':
      return roleName ? `${roleName} rework completed` : 'Rework completed';
    case 'REWORK_ESCALATED':
      return roleName ? `${roleName} rework escalated` : 'Rework escalated';
    case 'CHECKPOINT_REQUESTED':
      return roleName ? `Checkpoint requested by ${roleName}` : 'Checkpoint requested';
    case 'CHECKPOINT_RESOLVED':
      return 'Checkpoint resolved';
    case 'CHECKPOINT_TIMEOUT_REMINDER':
      return 'Checkpoint timeout reminder';
    case 'ARTIFACT_PRODUCED':
      return roleName ? `${roleName} produced artifact` : 'Artifact produced';
    case 'PARALLEL_ROLES_STARTED':
      return 'Parallel roles started';
    case 'COST_THRESHOLD_WARNING':
      return 'Cost threshold warning';
    case 'COST_CEILING_REACHED':
      return 'Cost ceiling reached';
    default:
      return eventType;
  }
}

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

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function EventTimeline({ sparkId }: EventTimelineProps) {
  const { data: events, isLoading } = usePipelineEvents(sparkId, true);

  if (isLoading) {
    return (
      <Typography variant="caption" color="text.secondary">
        Loading events...
      </Typography>
    );
  }

  // Reverse chronological
  const sorted = events ? [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) : [];

  return (
    <Box sx={{ position: 'relative', pl: 2 }}>
      {/* Vertical timeline line */}
      <Box
        sx={{
          position: 'absolute',
          left: 3,
          top: 0,
          bottom: 0,
          width: '1px',
          bgcolor: 'rgba(255, 255, 255, 0.08)',
        }}
      />

      {sorted.map((event) => {
        const color = EVENT_COLORS[event.eventType] ?? '#888';
        const metadata = event.metadata ?? {};
        const duration = typeof metadata.durationMs === 'number' ? metadata.durationMs : null;
        const tokens = typeof metadata.tokens === 'number' ? metadata.tokens : null;
        const model = typeof metadata.model === 'string' ? metadata.model : null;

        return (
          <Box key={event.id} sx={{ position: 'relative', mb: 1.5, pl: 1.5 }}>
            {/* Colored dot */}
            <Box
              sx={{
                position: 'absolute',
                left: -11,
                top: 5,
                width: 7,
                height: 7,
                borderRadius: '50%',
                bgcolor: color,
              }}
            />

            {/* Event content */}
            <Typography variant="body2" sx={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
              {formatEventDescription(event.eventType, event.role)}
            </Typography>

            {/* Timestamp */}
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
              {formatTimestamp(event.timestamp)}
            </Typography>

            {/* Metadata line */}
            {(duration !== null || tokens !== null || model !== null) && (
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', fontSize: '0.65rem', display: 'block' }}
              >
                {[
                  duration !== null ? formatDuration(duration) : null,
                  model,
                  tokens !== null ? formatTokens(tokens) : null,
                ]
                  .filter(Boolean)
                  .join(' \u00B7 ')}
              </Typography>
            )}
          </Box>
        );
      })}

      {sorted.length === 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
          No events yet
        </Typography>
      )}
    </Box>
  );
}
