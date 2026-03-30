import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pipelineApi } from '../api/pipeline';
import type { PdlcRole, CheckpointResolution, PipelineRun } from '../api/types';

const ACTIVE_STATUSES = ['CREATED', 'CLASSIFYING', 'AWAITING_CONFIRMATION', 'EXECUTING', 'CHECKPOINT'];

function isActive(run: PipelineRun | undefined): boolean {
  return run != null && ACTIVE_STATUSES.includes(run.status);
}

export function usePipelineRun(sparkId: string | undefined) {
  return useQuery({
    queryKey: ['pipeline-run', sparkId],
    queryFn: () => pipelineApi.getRun(sparkId!),
    enabled: !!sparkId,
    refetchInterval: (query) => isActive(query.state.data) ? 5_000 : false,
  });
}

export function usePipelineEvents(sparkId: string | undefined, active: boolean = false) {
  return useQuery({
    queryKey: ['pipeline-events', sparkId],
    queryFn: () => pipelineApi.getEvents(sparkId!, { limit: 100 }),
    enabled: !!sparkId,
    refetchInterval: active ? 5_000 : false,
  });
}

export function useRoleArtifact(sparkId: string | undefined, role: PdlcRole | null) {
  return useQuery({
    queryKey: ['role-artifact', sparkId, role],
    queryFn: () => pipelineApi.getArtifact(sparkId!, role!),
    enabled: !!sparkId && !!role,
  });
}

export function usePlaybooks() {
  return useQuery({
    queryKey: ['playbooks'],
    queryFn: () => pipelineApi.getPlaybooks(),
    staleTime: 60_000,
  });
}

export function useResolveCheckpoint(sparkId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ checkpointId, data }: { checkpointId: string; data: CheckpointResolution }) =>
      pipelineApi.resolveCheckpoint(sparkId, checkpointId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline-run', sparkId] });
      qc.invalidateQueries({ queryKey: ['pipeline-events', sparkId] });
      qc.invalidateQueries({ queryKey: ['checkpoints'] });
    },
  });
}

export function useUpdateSkippedRoles(sparkId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (skipRoles: PdlcRole[]) =>
      pipelineApi.updateSkippedRoles(sparkId, skipRoles),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline-run', sparkId] });
    },
  });
}
