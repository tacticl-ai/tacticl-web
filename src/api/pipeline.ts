import { api } from './client';
import type {
  PipelineRun, PipelineEvent, RoleArtifact,
  CheckpointResolution, Playbook, PdlcRole,
} from './types';

export const pipelineApi = {
  getRun: (sparkId: string) =>
    api.get<PipelineRun>(`/v1/sparks/${sparkId}/pipeline`),

  getEvents: (sparkId: string, params?: { limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    const query = qs.toString();
    return api.get<PipelineEvent[]>(`/v1/sparks/${sparkId}/pipeline/events${query ? `?${query}` : ''}`);
  },

  getArtifact: (sparkId: string, role: PdlcRole) =>
    api.get<RoleArtifact>(`/v1/sparks/${sparkId}/pipeline/artifacts/${role}`),

  resolveCheckpoint: (sparkId: string, checkpointId: string, data: CheckpointResolution) =>
    api.post(`/v1/sparks/${sparkId}/pipeline/checkpoint/${checkpointId}`, data),

  updateSkippedRoles: (sparkId: string, skipRoles: PdlcRole[]) =>
    api.put<PipelineRun>(`/v1/sparks/${sparkId}/pipeline/skip-roles`, skipRoles),

  getPlaybooks: () =>
    api.get<Playbook[]>('/v1/playbooks'),
};
