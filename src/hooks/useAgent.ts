import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentApi } from '../api/agent';

export function useAgentHistory() {
  return useQuery({
    queryKey: ['agent-history'],
    queryFn: () => agentApi.getHistory(),
    refetchInterval: 10_000,
  });
}

export function useAgentActivity() {
  return useQuery({
    queryKey: ['agent-activity'],
    queryFn: () => agentApi.getActivity(),
    refetchInterval: 5_000,
  });
}

export function useAgentModels() {
  return useQuery({
    queryKey: ['agent-models'],
    queryFn: () => agentApi.getModels(),
    staleTime: 60_000,
  });
}

export function useConfirmAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ confirmationId, approved }: { confirmationId: string; approved: boolean }) =>
      agentApi.confirmAction(confirmationId, approved),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-activity'] });
      qc.invalidateQueries({ queryKey: ['agent-pending-asks'] });
    },
  });
}

export function useCancelAsk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (askId: string) => agentApi.cancelAsk(askId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-activity'] });
      qc.invalidateQueries({ queryKey: ['agent-pending-asks'] });
    },
  });
}

export function usePendingAsks() {
  return useQuery({
    queryKey: ['agent-pending-asks'],
    queryFn: () => agentApi.getPendingAsks(),
    refetchInterval: 10_000,
  });
}
