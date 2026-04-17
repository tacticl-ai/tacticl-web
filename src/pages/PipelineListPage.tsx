import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import ButtonBase from '@mui/material/ButtonBase';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TopBar from '../components/layout/TopBar';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import { useSparks } from '../hooks/useSparks';
import type { Spark } from '../api/types';

const SPARK_STATUS_COLOR: Record<string, string> = {
  EXECUTING: '#6C63FF',
  CHECKPOINT: '#f59e0b',
  ROUTING: '#3b82f6',
  PENDING: '#6b7280',
  COMPLETED: '#10b981',
  FAILED: '#ef4444',
  CANCELLED: '#6b7280',
};

type TabValue = 'active' | 'completed' | 'all';

function PipelineRow({ spark }: { spark: Spark }) {
  const navigate = useNavigate();
  const statusColor = SPARK_STATUS_COLOR[spark.status] ?? '#6b7280';
  const isActive = spark.status === 'EXECUTING' || spark.status === 'CHECKPOINT' || spark.status === 'ROUTING';

  return (
    <ButtonBase
      onClick={() => navigate(`/sparks/${spark.id}`)}
      sx={{
        display: 'grid',
        gridTemplateColumns: '110px 1fr 110px 130px 90px 80px',
        alignItems: 'center',
        width: '100%',
        px: 2,
        py: 1.5,
        textAlign: 'left',
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:last-child': { borderBottom: 'none' },
        '&:hover': { bgcolor: 'rgba(108, 99, 255, 0.04)' },
        transition: 'background-color 150ms',
      }}
    >
      {/* Status */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Box
          sx={{
            width: 8, height: 8, borderRadius: '50%',
            bgcolor: statusColor,
            boxShadow: isActive ? `0 0 6px ${statusColor}` : 'none',
          }}
        />
        <Typography sx={{ fontSize: 11, fontWeight: 500, color: statusColor, textTransform: 'uppercase', letterSpacing: 0.3 }}>
          {spark.status}
        </Typography>
      </Box>

      {/* Title */}
      <Box sx={{ minWidth: 0, pr: 2 }}>
        <Typography
          sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {spark.title || spark.description || 'Untitled spark'}
        </Typography>
        {spark.description && spark.title && (
          <Typography sx={{ fontSize: 11, color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mt: 0.25 }}>
            {spark.description}
          </Typography>
        )}
      </Box>

      {/* Type */}
      <Chip
        label={spark.type ?? 'auto'}
        size="small"
        sx={{ fontSize: 11, height: 20, textTransform: 'capitalize', bgcolor: 'rgba(108,99,255,0.1)', color: 'primary.main' }}
      />

      {/* Cost */}
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
        {spark.estimatedCost > 0 ? `$${spark.estimatedCost.toFixed(4)}` : '—'}
      </Typography>

      {/* Tokens */}
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
        {spark.totalTokens > 0 ? `${(spark.totalTokens / 1000).toFixed(1)}k` : '—'}
      </Typography>

      {/* Updated */}
      <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>
        {new Date(spark.updatedAt).toLocaleDateString()}
      </Typography>
    </ButtonBase>
  );
}

export default function PipelineListPage() {
  const [tab, setTab] = useState<TabValue>('active');
  const { data: allSparks, isLoading, isError, refetch } = useSparks();

  const sparks = allSparks ?? [];

  // Pipelines = code or devops type sparks
  const pipelineSparks = sparks.filter(
    (s) => s.type === 'code' || s.type === 'devops',
  );

  const filtered = pipelineSparks.filter((s: Spark) => {
    if (tab === 'active') return ['EXECUTING', 'CHECKPOINT', 'ROUTING', 'PENDING', 'AWAITING_CONFIRMATION'].includes(s.status);
    if (tab === 'completed') return ['COMPLETED', 'FAILED', 'CANCELLED'].includes(s.status);
    return true;
  });

  const statusOrder: Record<string, number> = {
    CHECKPOINT: 0, EXECUTING: 1, ROUTING: 2, PENDING: 3, COMPLETED: 4, FAILED: 5, CANCELLED: 6,
  };
  filtered.sort((a, b) => {
    const oa = statusOrder[a.status] ?? 9;
    const ob = statusOrder[b.status] ?? 9;
    if (oa !== ob) return oa - ob;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const activeCnt = pipelineSparks.filter((s) =>
    ['EXECUTING', 'CHECKPOINT', 'ROUTING', 'PENDING'].includes(s.status),
  ).length;

  return (
    <>
      <TopBar title="Pipelines" />

      {isLoading ? (
        <LoadingState message="Loading pipelines..." />
      ) : isError ? (
        <ErrorState message="Failed to load pipelines." onRetry={refetch} />
      ) : (
        <>
          {/* Summary strip */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            {[
              { label: 'Total', value: pipelineSparks.length },
              { label: 'Active', value: activeCnt, color: '#6C63FF' },
              { label: 'Completed', value: pipelineSparks.filter((s) => s.status === 'COMPLETED').length, color: '#10b981' },
              { label: 'Failed', value: pipelineSparks.filter((s) => s.status === 'FAILED').length, color: '#ef4444' },
            ].map(({ label, value, color }) => (
              <Box
                key={label}
                sx={{
                  flex: 1, px: 2, py: 1.5,
                  bgcolor: 'background.paper',
                  border: '1px solid', borderColor: 'divider',
                  borderRadius: '10px',
                }}
              >
                <Typography sx={{ fontSize: 11, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.25 }}>
                  {label}
                </Typography>
                <Typography sx={{ fontSize: 22, fontWeight: 700, color: color ?? 'text.primary' }}>
                  {value}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Tabs */}
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v as TabValue)}
            sx={{ mb: 1.5, minHeight: 36, '& .MuiTab-root': { minHeight: 36, fontSize: 13, textTransform: 'none', py: 0 } }}
          >
            <Tab label="Active" value="active" />
            <Tab label="Completed" value="completed" />
            <Tab label="All" value="all" />
          </Tabs>

          {pipelineSparks.length === 0 ? (
            <EmptyState
              variant="sparks"
              title="No pipelines yet"
              description="Send a code or devops task in Chat to trigger the PDLC pipeline."
            />
          ) : filtered.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography color="text.secondary" sx={{ fontSize: 13 }}>No pipelines in this category.</Typography>
            </Box>
          ) : (
            <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '10px', overflow: 'hidden' }}>
              {/* Header */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: '110px 1fr 110px 130px 90px 80px',
                px: 2, py: 1.25,
                bgcolor: 'background.default',
                borderBottom: '1px solid', borderBottomColor: 'divider',
              }}>
                {['Status', 'Pipeline', 'Type', 'Cost', 'Tokens', 'Updated'].map((h) => (
                  <Typography key={h} sx={{ fontSize: 11, fontWeight: 500, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {h}
                  </Typography>
                ))}
              </Box>

              {filtered.map((spark) => (
                <PipelineRow key={spark.id} spark={spark} />
              ))}
            </Box>
          )}
        </>
      )}
    </>
  );
}
