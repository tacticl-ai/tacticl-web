import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import PendingIcon from '@mui/icons-material/Pending';
import ErrorIcon from '@mui/icons-material/Error';
import type { SparkStatus } from '../../api/types';

const stages: { key: SparkStatus; label: string }[] = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'ROUTING', label: 'Routing' },
  { key: 'EXECUTING', label: 'Executing' },
  { key: 'COMPLETED', label: 'Completed' },
];

const statusOrder: Record<string, number> = {
  PENDING: 0,
  ROUTING: 1,
  EXECUTING: 2,
  CHECKPOINT: 2,
  COMPLETED: 3,
  FAILED: -1,
  CANCELLED: -1,
};

interface SparkTimelineProps {
  status: SparkStatus;
}

export default function SparkTimeline({ status }: SparkTimelineProps) {
  const currentIndex = statusOrder[status] ?? -1;
  const isFailed = status === 'FAILED' || status === 'CANCELLED';

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, width: '100%' }}>
      {stages.map((stage, index) => {
        const isCompleted = currentIndex > index;
        const isCurrent = currentIndex === index && !isFailed;
        const isFailedCurrent = isFailed && index === 2;

        let icon;
        if (isFailedCurrent) {
          icon = <ErrorIcon sx={{ color: 'error.main', fontSize: 24 }} />;
        } else if (isCompleted) {
          icon = <CheckCircleIcon sx={{ color: 'success.main', fontSize: 24 }} />;
        } else if (isCurrent) {
          icon = <PendingIcon sx={{ color: 'primary.main', fontSize: 24 }} />;
        } else {
          icon = (
            <RadioButtonUncheckedIcon
              sx={{ color: 'text.secondary', opacity: 0.3, fontSize: 24 }}
            />
          );
        }

        return (
          <Box key={stage.key} sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 64 }}>
              {icon}
              <Typography
                variant="caption"
                sx={{
                  mt: 0.5,
                  color: isCompleted || isCurrent ? 'text.primary' : 'text.secondary',
                  fontWeight: isCurrent ? 600 : 400,
                }}
              >
                {isFailedCurrent ? status : stage.label}
              </Typography>
            </Box>
            {index < stages.length - 1 && (
              <Box
                sx={{
                  flex: 1,
                  height: 2,
                  bgcolor: isCompleted ? 'success.main' : 'divider',
                  mx: 1,
                  mb: 2.5,
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}
