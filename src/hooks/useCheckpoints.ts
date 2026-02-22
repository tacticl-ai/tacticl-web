import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkpointsApi } from '../api/checkpoints';
import type { CheckpointDecisionRequest } from '../api/types';

export function useCheckpoints() {
  return useQuery({
    queryKey: ['checkpoints'],
    queryFn: () => checkpointsApi.list(),
    refetchInterval: 5_000,
  });
}

export function useCheckpoint(id: string) {
  return useQuery({
    queryKey: ['checkpoints', id],
    queryFn: () => checkpointsApi.get(id),
  });
}

export function useDecideCheckpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: CheckpointDecisionRequest;
    }) => checkpointsApi.decide(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checkpoints'] });
      qc.invalidateQueries({ queryKey: ['sparks'] });
    },
  });
}
