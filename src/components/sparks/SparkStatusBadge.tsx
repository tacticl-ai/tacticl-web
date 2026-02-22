import Chip from '@mui/material/Chip';
import type { SparkStatus } from '../../api/types';

const statusConfig: Record<
  SparkStatus,
  { label: string; color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' }
> = {
  PENDING: { label: 'Pending', color: 'default' },
  ROUTING: { label: 'Routing', color: 'info' },
  EXECUTING: { label: 'Executing', color: 'primary' },
  CHECKPOINT: { label: 'Checkpoint', color: 'warning' },
  COMPLETED: { label: 'Completed', color: 'success' },
  FAILED: { label: 'Failed', color: 'error' },
  CANCELLED: { label: 'Cancelled', color: 'default' },
};

interface SparkStatusBadgeProps {
  status: SparkStatus;
  size?: 'small' | 'medium';
}

export default function SparkStatusBadge({
  status,
  size = 'small',
}: SparkStatusBadgeProps) {
  const config = statusConfig[status];
  return <Chip label={config.label} color={config.color} size={size} />;
}
