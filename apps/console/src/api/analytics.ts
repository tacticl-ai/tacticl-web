import { useQuery } from '@tanstack/react-query';
import { api } from './client.ts';
import type {
  DashboardData,
  KeyMetrics,
  RoleAnalytics,
  ReworkAnalytics,
  PipelineFunnel,
  CostAnalytics,
  DailyMetrics,
  PipelineListResponse,
  PipelineDetail,
} from './types.ts';

// ─── Query Keys ─────────────────────────────────────────

const keys = {
  dashboard: ['analytics', 'dashboard'] as const,
  keyMetrics: ['analytics', 'key-metrics'] as const,
  roles: ['analytics', 'roles'] as const,
  rework: ['analytics', 'rework'] as const,
  funnel: ['analytics', 'funnel'] as const,
  cost: ['analytics', 'cost'] as const,
  daily: (days: number) => ['analytics', 'daily', days] as const,
  pipelines: ['analytics', 'pipelines'] as const,
  pipelineDetail: (id: string) => ['analytics', 'pipeline', id] as const,
};

// ─── Hooks ──────────────────────────────────────────────

export function useDashboard() {
  return useQuery({
    queryKey: keys.dashboard,
    queryFn: () => api.get<DashboardData>('/api/admin/analytics/dashboard'),
    staleTime: 30_000,
  });
}

export function useKeyMetrics() {
  return useQuery({
    queryKey: keys.keyMetrics,
    queryFn: () => api.get<KeyMetrics>('/api/admin/analytics/key-metrics'),
    staleTime: 15_000,
  });
}

export function useRoleAnalytics() {
  return useQuery({
    queryKey: keys.roles,
    queryFn: () => api.get<RoleAnalytics>('/api/admin/analytics/roles'),
    staleTime: 30_000,
  });
}

export function useReworkAnalytics() {
  return useQuery({
    queryKey: keys.rework,
    queryFn: () => api.get<ReworkAnalytics>('/api/admin/analytics/rework'),
    staleTime: 30_000,
  });
}

export function usePipelineFunnel() {
  return useQuery({
    queryKey: keys.funnel,
    queryFn: () => api.get<PipelineFunnel>('/api/admin/analytics/funnel'),
    staleTime: 30_000,
  });
}

export function useCostAnalytics() {
  return useQuery({
    queryKey: keys.cost,
    queryFn: () => api.get<CostAnalytics>('/api/admin/analytics/cost'),
    staleTime: 30_000,
  });
}

export function useDailyMetrics(days: number = 30) {
  return useQuery({
    queryKey: keys.daily(days),
    queryFn: () => api.get<DailyMetrics>(`/api/admin/analytics/daily?days=${days}`),
    staleTime: 60_000,
  });
}

export function usePipelineRuns() {
  return useQuery({
    queryKey: keys.pipelines,
    queryFn: () => api.get<PipelineListResponse>('/api/admin/analytics/pipelines'),
    staleTime: 15_000,
  });
}

export function usePipelineDetail(id: string) {
  return useQuery({
    queryKey: keys.pipelineDetail(id),
    queryFn: () => api.get<PipelineDetail>(`/api/admin/analytics/pipelines/${id}`),
    enabled: !!id,
    staleTime: 30_000,
  });
}
