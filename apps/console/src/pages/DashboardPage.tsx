import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { useDashboard } from '../api/analytics.ts';
import KpiCard from '../components/dashboard/KpiCard.tsx';
import RoleChart from '../components/dashboard/RoleChart.tsx';
import ReworkDonut from '../components/dashboard/ReworkDonut.tsx';
import PipelineFunnel from '../components/dashboard/PipelineFunnel.tsx';
import CostTable from '../components/dashboard/CostTable.tsx';
import TokenChart from '../components/dashboard/TokenChart.tsx';
import DailyTrend from '../components/dashboard/DailyTrend.tsx';
import LoadingSpinner from '../components/common/LoadingSpinner.tsx';

function formatBigNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)} Bil`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatCost(n: number): string {
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}k`;
  return `$${n.toFixed(2)}`;
}

function formatDuration(ms: number): string {
  if (ms >= 60_000) return `${(ms / 60_000).toFixed(1)}m`;
  if (ms >= 1_000) return `${(ms / 1_000).toFixed(1)}s`;
  return `${ms}ms`;
}

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) return <LoadingSpinner message="Loading dashboard analytics..." />;
  if (error) return <Alert severity="error" sx={{ mt: 2 }}>Failed to load analytics: {(error as Error).message}</Alert>;
  if (!data) return null;

  const { keyMetrics, roleAnalytics, reworkAnalytics, funnel, costAnalytics, dailyMetrics } = data;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#e0e0e0' }}>
          PDLC Pipeline Analytics
        </Typography>
        <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
          Real-time overview of pipeline execution, costs, and performance
        </Typography>
      </Box>

      {/* Row 1: Key Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 2 }}>
          <KpiCard
            label="Total Runs"
            value={formatBigNumber(keyMetrics.totalPipelineRuns)}
            trend={keyMetrics.totalPipelineRunsTrend}
            color="#4ade80"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <KpiCard
            label="Success Rate"
            value={`${keyMetrics.successRate.toFixed(1)}%`}
            trend={keyMetrics.successRateTrend}
            color={keyMetrics.successRate >= 90 ? '#4ade80' : keyMetrics.successRate >= 70 ? '#f59e0b' : '#f87171'}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <KpiCard
            label="Active Pipelines"
            value={keyMetrics.activePipelines.toLocaleString()}
            trend={keyMetrics.activePipelinesTrend}
            color="#38bdf8"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <KpiCard
            label="Backlog"
            value={keyMetrics.pipelineBacklog.toLocaleString()}
            trend={keyMetrics.pipelineBacklogTrend}
            color={keyMetrics.pipelineBacklog > 50 ? '#f87171' : '#f59e0b'}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <KpiCard
            label="Est. API Cost"
            value={formatCost(keyMetrics.estimatedCostUsd)}
            trend={keyMetrics.estimatedCostTrend}
            color="#818cf8"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <KpiCard
            label="Total Tokens"
            value={formatBigNumber(keyMetrics.totalTokens)}
            trend={keyMetrics.totalTokensTrend}
            color="#e0e0e0"
          />
        </Grid>
      </Grid>

      {/* Row 2: Role Analysis */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <RoleChart
            title="Runs by Role"
            data={roleAnalytics.roles}
            dataKey="runs"
            color="#4ade80"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <RoleChart
            title="Avg Duration by Role"
            data={roleAnalytics.roles}
            dataKey="avgDurationMs"
            color="#38bdf8"
            formatter={(v: number) => formatDuration(v)}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <TokenChart data={roleAnalytics.roles} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <ReworkDonut data={reworkAnalytics.exitStatusDistribution} />
        </Grid>
      </Grid>

      {/* Row 3: Rework & Pipeline Funnel */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 2 }}>
          <KpiCard
            label="First-Pass Rate"
            value={`${reworkAnalytics.firstPassRate.toFixed(1)}%`}
            color={reworkAnalytics.firstPassRate >= 80 ? '#4ade80' : '#f59e0b'}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <KpiCard
            label="Rework Rate"
            value={`${reworkAnalytics.reworkRate.toFixed(1)}%`}
            color={reworkAnalytics.reworkRate <= 15 ? '#4ade80' : '#f87171'}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <RoleChart
            title="Rework by Origin"
            data={reworkAnalytics.reworkByOrigin.map((r) => ({
              role: r.role,
              runs: r.reworkCount,
              avgDurationMs: 0,
              inputTokens: 0,
              outputTokens: 0,
              costUsd: 0,
            }))}
            dataKey="runs"
            color="#f87171"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <PipelineFunnel data={funnel.stages} />
        </Grid>
      </Grid>

      {/* Row 4: Cost & Economics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <RoleChart
            title="Cost by Role"
            data={roleAnalytics.roles}
            dataKey="costUsd"
            color="#818cf8"
            formatter={(v: number) => `$${v.toFixed(2)}`}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <CostTable data={costAnalytics.costByPlaybook} />
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <KpiCard
            label="Avg Cost / Pipeline"
            value={`$${costAnalytics.avgCostPerPipeline.toFixed(2)}`}
            color="#818cf8"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <KpiCard
            label="Cost Ceiling Hit"
            value={`${costAnalytics.costCeilingHitRate.toFixed(1)}%`}
            color={costAnalytics.costCeilingHitRate <= 5 ? '#4ade80' : '#f87171'}
          />
        </Grid>
      </Grid>

      {/* Row 5: Trends */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <DailyTrend
            title="Daily Pipeline Runs"
            data={dailyMetrics.days}
            lines={[
              { dataKey: 'runs', name: 'Runs', color: '#4ade80' },
              { dataKey: 'successRate', name: 'Success %', color: '#38bdf8' },
            ]}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DailyTrend
            title="Daily Cost Trend"
            data={dailyMetrics.days}
            lines={[
              { dataKey: 'costUsd', name: 'Cost (USD)', color: '#818cf8' },
            ]}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
