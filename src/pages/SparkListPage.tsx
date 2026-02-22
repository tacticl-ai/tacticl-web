import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TopBar from '../components/layout/TopBar';
import SparkCard from '../components/sparks/SparkCard';
import CreateSparkDialog from '../components/sparks/CreateSparkDialog';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import { useSparks, useCreateSpark } from '../hooks/useSparks';

const statusFilters: { value: string; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'EXECUTING', label: 'Active' },
  { value: 'CHECKPOINT', label: 'Checkpoints' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
];

export default function SparkListPage() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const params =
    statusFilter === 'ALL' ? undefined : { status: statusFilter };
  const { data: sparks, isLoading } = useSparks(params);
  const createSpark = useCreateSpark();

  const filteredSparks = sparks ?? [];

  return (
    <>
      <TopBar
        title="Sparks"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            size="small"
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
      ) : filteredSparks.length === 0 ? (
        <EmptyState
          icon={AutoAwesomeIcon}
          title="No sparks yet"
          description="Drop your first spark to get started. Describe what you want done in natural language."
          actionLabel="Create Spark"
          onAction={() => setDialogOpen(true)}
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
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={(data) => {
          createSpark.mutate(data, {
            onSuccess: () => setDialogOpen(false),
          });
        }}
        loading={createSpark.isPending}
      />
    </>
  );
}

// Mock data for development — remove when backend is ready
export const MOCK_SPARKS = [
  {
    id: '1',
    userId: 'u1',
    title: 'Reduce Cloud Run costs',
    description:
      'Analyze all Cloud Run services for over-provisioned CPU/memory and idle scaling configs. Create PRs with optimized settings.',
    type: 'devops' as const,
    status: 'EXECUTING' as const,
    priority: 'HIGH' as const,
    deviceId: 'd1',
    schedule: null,
    nextRunAt: null,
    checkpointPolicy: 'CHECKPOINT_MAJOR' as const,
    repoAccess: ['strategiz-core', 'strategiz-ui'],
    result: null,
    parentSparkId: null,
    totalTokens: 45200,
    estimatedCost: 0.32,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: '2',
    userId: 'u1',
    title: 'Clean up dead code in strategiz-ui',
    description:
      'Find unused components, hooks, and utilities. Remove them and verify the build still passes.',
    type: 'code' as const,
    status: 'CHECKPOINT' as const,
    priority: 'NORMAL' as const,
    deviceId: 'd1',
    schedule: null,
    nextRunAt: null,
    checkpointPolicy: 'CHECKPOINT_ALL' as const,
    repoAccess: ['strategiz-ui'],
    result: null,
    parentSparkId: null,
    totalTokens: 128400,
    estimatedCost: 0.89,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 600000).toISOString(),
  },
  {
    id: '3',
    userId: 'u1',
    title: 'Research next.js app router migration path',
    description:
      'Evaluate effort to migrate strategiz-ui from Vite to Next.js App Router. Pros, cons, LOE estimate.',
    type: 'research' as const,
    status: 'COMPLETED' as const,
    priority: 'LOW' as const,
    deviceId: 'd2',
    schedule: null,
    nextRunAt: null,
    checkpointPolicy: 'AUTO' as const,
    repoAccess: ['strategiz-ui'],
    result: {
      summary: 'Migration feasible but high effort (~3 weeks). Recommend staying with Vite.',
      findings: ['120+ route components need migration', 'MUI SSR requires careful setup'],
      prs: [],
      issues: ['https://github.com/user/strategiz-ui/issues/42'],
    },
    parentSparkId: null,
    totalTokens: 234000,
    estimatedCost: 1.62,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: '4',
    userId: 'u1',
    title: 'Weekly dependency audit',
    description: 'Check for outdated and vulnerable dependencies across all repos.',
    type: 'devops' as const,
    status: 'PENDING' as const,
    priority: 'NORMAL' as const,
    deviceId: null,
    schedule: '0 9 * * 1',
    nextRunAt: new Date(Date.now() + 259200000).toISOString(),
    checkpointPolicy: 'CHECKPOINT_MAJOR' as const,
    repoAccess: ['strategiz-core', 'strategiz-ui', 'tacticl-core'],
    result: null,
    parentSparkId: null,
    totalTokens: 0,
    estimatedCost: 0,
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    updatedAt: new Date(Date.now() - 604800000).toISOString(),
  },
];
