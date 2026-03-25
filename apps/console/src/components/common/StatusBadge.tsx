import Chip from '@mui/material/Chip';
import type { PipelineStatus } from '../../api/types.ts';

const statusConfig: Record<PipelineStatus, { color: 'success' | 'error' | 'warning' | 'info' | 'default'; label: string }> = {
  COMPLETED: { color: 'success', label: 'Completed' },
  FAILED: { color: 'error', label: 'Failed' },
  CANCELLED: { color: 'default', label: 'Cancelled' },
  EXECUTING: { color: 'info', label: 'Executing' },
  PENDING: { color: 'warning', label: 'Pending' },
  ROUTING: { color: 'warning', label: 'Routing' },
  CHECKPOINT: { color: 'warning', label: 'Checkpoint' },
};

interface StatusBadgeProps {
  status: PipelineStatus;
  size?: 'small' | 'medium';
}

export default function StatusBadge({ status, size = 'small' }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { color: 'default' as const, label: status };
  return (
    <Chip
      label={config.label}
      color={config.color}
      size={size}
      variant="outlined"
      sx={{ fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.03em' }}
    />
  );
}
