import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import AddIcon from '@mui/icons-material/Add';
import TopBar from '../components/layout/TopBar';
import SparkCard from '../components/sparks/SparkCard';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import CreateSparkDialog from '../components/sparks/CreateSparkDialog';
import { useSparks } from '../hooks/useSparks';

const statusFilters: { value: string; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'EXECUTING', label: 'Active' },
  { value: 'CHECKPOINT', label: 'Checkpoints' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
];

export default function SparkListPage() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const params =
    statusFilter === 'ALL' ? undefined : { status: statusFilter };
  const { data: sparks, isLoading, isError, refetch } = useSparks(params);

  const filteredSparks = sparks ?? [];

  return (
    <>
      <TopBar
        title="Sparks"
        actions={
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setShowCreateDialog(true)}
          >
            New Spark
          </Button>
        }
      />

      <Box sx={{ mb: 3 }}>
        <ToggleButtonGroup
          value={statusFilter}
          exclusive
          onChange={(_, v) => v && setStatusFilter(v)}
          size="small"
        >
          {statusFilters.map((f) => (
            <ToggleButton key={f.value} value={f.value}>
              {f.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {isLoading ? (
        <LoadingState message="Loading sparks..." />
      ) : isError ? (
        <ErrorState message="Failed to load sparks." onRetry={refetch} />
      ) : filteredSparks.length === 0 ? (
        <EmptyState
          variant="sparks"
          title="No sparks yet"
          description="Create a spark to tell your devices what to do."
          actionLabel="New Spark"
          onAction={() => setShowCreateDialog(true)}
        />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            },
            gap: 2,
          }}
        >
          {filteredSparks.map((spark) => (
            <SparkCard key={spark.id} spark={spark} />
          ))}
        </Box>
      )}

      <CreateSparkDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
    </>
  );
}
