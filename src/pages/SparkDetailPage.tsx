import { useParams, Navigate, Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import { formatDistanceToNow } from 'date-fns';
import TopBar from '../components/layout/TopBar';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import SparkStatusBadge from '../components/sparks/SparkStatusBadge';
import KpiStrip from '../components/sparks/KpiStrip';
import PdlcPipelineView from '../components/sparks/pdlc/PdlcPipelineView';
import SimpleSparkView from '../components/sparks/SimpleSparkView';
import { useSpark, useCancelSpark } from '../hooks/useSparks';
import { usePipelineRun } from '../hooks/usePipeline';
import { useDevices } from '../hooks/useDevices';
import type { Spark, PipelineRun } from '../api/types';

// ─── Helpers ──────────────────────────────────────────────

function formatElapsed(isoDate: string): string {
  return formatDistanceToNow(new Date(isoDate), { addSuffix: false });
}

function buildPdlcMetrics(run: PipelineRun) {
  const results = Object.values(run.roleResults ?? {});
  const completed = results.filter((r) => r.status === 'COMPLETED').length;
  const reworks = results.reduce((sum, r) => sum + (r.iteration > 1 ? r.iteration - 1 : 0), 0);
  return [
    { label: 'Roles Done', value: `${completed}/${(run.activatedRoles ?? []).length}` },
    { label: 'Cost', value: `$${Number(run.totalCostUsd).toFixed(2)}`, color: '#03DAC6' },
    { label: 'Elapsed', value: formatElapsed(run.updatedAt || run.createdAt) },
    {
      label: 'Reworks',
      value: String(reworks),
      color: reworks > 0 ? '#FF9800' : undefined,
    },
  ];
}

// ─── Spark Type Badge Colors ──────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  code: '#BB86FC',
  social: '#03DAC6',
  research: '#64B5F6',
  devops: '#FF9800',
  creative: '#F48FB1',
  data: '#81C784',
};

const PRIORITY_COLORS: Record<string, 'default' | 'warning' | 'error'> = {
  LOW: 'default',
  NORMAL: 'default',
  HIGH: 'warning',
  URGENT: 'error',
};

// ─── SparkDetailHeader ───────────────────────────────────

interface SparkDetailHeaderProps {
  spark: Spark;
  pipelineRun?: PipelineRun;
  deviceName: string | null;
  onCancel: () => void;
  isCancelling: boolean;
}

function SparkDetailHeader({
  spark,
  pipelineRun,
  deviceName,
  onCancel,
  isCancelling,
}: SparkDetailHeaderProps) {
  const isActive =
    spark.status === 'EXECUTING' ||
    spark.status === 'ROUTING' ||
    spark.status === 'CHECKPOINT' ||
    spark.status === 'PENDING';

  const executionTarget = spark.deviceId ? (deviceName || 'Device') : 'Cloud';

  return (
    <Box sx={{ mb: 3 }}>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 1.5 }}>
        <Link
          component={RouterLink}
          to="/sparks"
          underline="hover"
          color="text.secondary"
          sx={{ fontSize: '0.875rem' }}
        >
          Sparks
        </Link>
        <Typography
          color="text.primary"
          sx={{ fontSize: '0.875rem', fontFamily: 'monospace' }}
        >
          {spark.id.length > 12 ? `${spark.id.slice(0, 12)}...` : spark.id}
        </Typography>
      </Breadcrumbs>

      {/* Title row with cancel button */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          mb: 1.5,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600, flex: 1, minWidth: 0 }}>
          {spark.title}
        </Typography>
        {isActive && (
          <Button
            variant="outlined"
            color="error"
            size="small"
            disabled={isCancelling}
            onClick={onCancel}
            sx={{ flexShrink: 0 }}
          >
            {isCancelling ? 'Cancelling...' : 'Cancel'}
          </Button>
        )}
      </Box>

      {/* Badges row */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 1.5 }}>
        <SparkStatusBadge status={spark.status} />
        {spark.type && (
          <Chip
            label={spark.type}
            size="small"
            sx={{
              bgcolor: TYPE_COLORS[spark.type] ? `${TYPE_COLORS[spark.type]}20` : undefined,
              color: TYPE_COLORS[spark.type] || 'text.primary',
              borderColor: TYPE_COLORS[spark.type] || 'divider',
              fontSize: '0.75rem',
            }}
            variant="outlined"
          />
        )}
        {pipelineRun && (
          <Chip
            label={pipelineRun.playbook.replace(/_/g, ' ')}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.75rem', textTransform: 'capitalize' }}
          />
        )}
        <Chip
          label={spark.priority}
          size="small"
          color={PRIORITY_COLORS[spark.priority] || 'default'}
          variant="outlined"
          sx={{ fontSize: '0.75rem' }}
        />
      </Box>

      {/* Execution target + elapsed */}
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Target:{' '}
          <Typography component="span" variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
            {executionTarget}
          </Typography>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {formatDistanceToNow(new Date(spark.createdAt), { addSuffix: true })}
        </Typography>
      </Box>
    </Box>
  );
}

// ─── PipelineDetailView ──────────────────────────────────

function PipelineDetailView({
  sparkId,
  pipelineRun,
}: {
  sparkId: string;
  pipelineRun: PipelineRun;
}) {
  return (
    <>
      <KpiStrip metrics={buildPdlcMetrics(pipelineRun)} />
      <Box sx={{ mt: 2 }}>
        <PdlcPipelineView sparkId={sparkId} pipelineRun={pipelineRun} />
      </Box>
    </>
  );
}

// ─── SparkDetailPage ─────────────────────────────────────

export default function SparkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const sparkId = id ?? '';

  const { data: spark, isLoading, isError, refetch } = useSpark(sparkId);
  const { data: pipelineRun } = usePipelineRun(sparkId);
  const { data: devices } = useDevices();
  const cancelSpark = useCancelSpark();

  if (!id) {
    return <Navigate to="/sparks" replace />;
  }

  if (isLoading) {
    return (
      <>
        <TopBar title="Spark Detail" />
        <LoadingState />
      </>
    );
  }

  if (isError || !spark) {
    return (
      <>
        <TopBar title="Spark Detail" />
        <ErrorState
          message="Failed to load spark details."
          onRetry={refetch}
        />
      </>
    );
  }

  const hasPipeline = !!pipelineRun;

  // Resolve device name for execution target display
  const deviceName = spark.deviceId
    ? (devices?.find((d) => d.id === spark.deviceId)?.name ?? null)
    : null;

  const handleCancel = () => {
    cancelSpark.mutate(spark.id);
  };

  return (
    <>
      <TopBar
        title={spark.title}
        actions={undefined}
      />

      <Box>
        <SparkDetailHeader
          spark={spark}
          pipelineRun={pipelineRun}
          deviceName={deviceName}
          onCancel={handleCancel}
          isCancelling={cancelSpark.isPending}
        />

        {hasPipeline ? (
          <PipelineDetailView sparkId={spark.id} pipelineRun={pipelineRun!} />
        ) : (
          <SimpleSparkView sparkId={spark.id} />
        )}
      </Box>
    </>
  );
}
