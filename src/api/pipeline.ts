import { api } from './client';
import type {
  PipelineRun, PipelineEvent, RoleArtifact,
  CheckpointResolution, Playbook, PdlcRole,
  ArtifactListItem, ArtifactContentResponse,
} from './types';

export const pipelineApi = {
  getRun: (sparkId: string) =>
    api.get<PipelineRun>(`/v1/sparks/${sparkId}/pipeline`),

  getEvents: (sparkId: string, params?: { limit?: number; page?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page != null) qs.set('page', String(params.page));
    if (params?.limit != null) qs.set('size', String(params.limit));
    const query = qs.toString();
    return api.get<{ content: PipelineEvent[] }>(`/v1/sparks/${sparkId}/pipeline/events/history${query ? `?${query}` : ''}`);
  },

  getArtifact: (sparkId: string, role: PdlcRole) =>
    api.get<RoleArtifact>(`/v1/sparks/${sparkId}/pipeline/artifacts/${role}`),

  getArtifactList: (sparkId: string) =>
    api.get<ArtifactListItem[]>(`/v1/sparks/${sparkId}/pipeline/artifacts`),

  getArtifactContent: (sparkId: string, name: string) =>
    api.get<ArtifactContentResponse>(
      `/v1/sparks/${sparkId}/pipeline/artifacts/${encodeURIComponent(name)}/content`,
    ),

  resolveCheckpoint: (sparkId: string, checkpointId: string, data: CheckpointResolution) =>
    api.post(`/v1/sparks/${sparkId}/pipeline/checkpoint/${checkpointId}`, data),

  updateSkippedRoles: (sparkId: string, skipRoles: PdlcRole[]) =>
    api.put<PipelineRun>(`/v1/sparks/${sparkId}/pipeline/skip-roles`, skipRoles),

  getPlaybooks: () =>
    api.get<Playbook[]>('/v1/playbooks'),
};
