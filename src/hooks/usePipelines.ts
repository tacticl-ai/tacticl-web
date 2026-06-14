// src/hooks/usePipelines.ts
import { useQuery } from '@tanstack/react-query';
import { pipelinesApi } from '../api/pipelines';

/**
 * Dashboard list of every pipeline run. Polls every 5s so the agent timeline
 * strips + blinking active lights stay live without a manual refresh.
 */
export function usePipelines() {
  return useQuery({
    queryKey: ['pipelines'],
    queryFn: () => pipelinesApi.list(),
    refetchInterval: 5_000,
  });
}
