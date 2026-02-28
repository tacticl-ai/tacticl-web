// src/pages/SparkListPage.tsx — renamed conceptually to SparkControlPage
import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TopBar from '../components/layout/TopBar';
import SummaryBar from '../components/sparks/SummaryBar';
import DeviceStrip from '../components/sparks/DeviceStrip';
import SparkRow from '../components/sparks/SparkRow';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { useSparks } from '../hooks/useSparks';
import { useDevices } from '../hooks/useDevices';

export default function SparkListPage() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deviceFilter, setDeviceFilter] = useState<string | null>(null);
  const [expandedSparkId, setExpandedSparkId] = useState<string | null>(null);

  // Fetch all sparks (we filter client-side for summary counts + device filter)
  const { data: allSparks, isLoading: sparksLoading, isError: sparksError, refetch } = useSparks();
  const { data: devices } = useDevices();

  const sparks = allSparks ?? [];
  const deviceList = devices ?? [];

  // Apply filters (copy to avoid mutating React Query cache)
  let filtered = [...sparks];
  if (statusFilter !== 'ALL') {
    if (statusFilter === 'EXECUTING') {
      filtered = filtered.filter((s) => s.status === 'EXECUTING' || s.status === 'ROUTING');
    } else {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }
  }
  if (deviceFilter) {
    if (deviceFilter === 'cloud') {
      filtered = filtered.filter((s) => !s.deviceId);
    } else {
      filtered = filtered.filter((s) => s.deviceId === deviceFilter);
    }
  }

  // Sort: active sparks first (EXECUTING, CHECKPOINT, ROUTING, PENDING), then by updatedAt desc
  const statusOrder: Record<string, number> = { EXECUTING: 0, CHECKPOINT: 1, ROUTING: 2, PENDING: 3, COMPLETED: 4, FAILED: 5, CANCELLED: 6 };
  filtered.sort((a, b) => {
    const oa = statusOrder[a.status] ?? 9;
    const ob = statusOrder[b.status] ?? 9;
    if (oa !== ob) return oa - ob;
    return (new Date(b.updatedAt).getTime() || 0) - (new Date(a.updatedAt).getTime() || 0);
  });

  return (
    <>
      <TopBar title="Spark Control" />

      {sparksLoading ? (
        <LoadingState message="Loading sparks..." />
      ) : sparksError ? (
        <ErrorState message="Failed to load sparks." onRetry={refetch} />
      ) : sparks.length === 0 ? (
        <EmptyState variant="sparks" title="No sparks yet" description="Start a conversation in Chat to create your first spark." />
      ) : (
        <>
          <SummaryBar sparks={sparks} activeFilter={statusFilter} onFilterChange={setStatusFilter} />
          <DeviceStrip devices={deviceList} sparks={sparks} activeDeviceId={deviceFilter} onDeviceChange={setDeviceFilter} />

          {/* Spark Table */}
          <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '10px', overflow: 'hidden' }}>
            {/* Header */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: '90px 1fr 130px 120px 70px 80px 36px',
              px: 2, py: 1.25,
              bgcolor: 'background.default',
              borderBottom: '1px solid', borderBottomColor: 'divider',
            }}>
              {['Status', 'Spark', 'Device', 'Tactics', 'Cost', 'Updated', ''].map((h) => (
                <Typography key={h} sx={{ fontSize: 11, fontWeight: 500, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {h}
                </Typography>
              ))}
            </Box>

            {/* Rows */}
            {filtered.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography color="text.secondary" sx={{ fontSize: 13 }}>No sparks match the current filters.</Typography>
              </Box>
            ) : (
              filtered.map((spark) => (
                <SparkRow
                  key={spark.id}
                  spark={spark}
                  devices={deviceList}
                  isExpanded={expandedSparkId === spark.id}
                  onToggle={() => setExpandedSparkId(expandedSparkId === spark.id ? null : spark.id)}
                />
              ))
            )}
          </Box>
        </>
      )}
    </>
  );
}
