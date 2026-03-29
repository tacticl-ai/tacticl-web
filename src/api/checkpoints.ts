import { api } from './client';
import type { Checkpoint, CheckpointDecisionRequest } from './types';

export const checkpointsApi = {
  list: () => api.get<Checkpoint[]>('/v1/checkpoints'),

  get: (id: string) => api.get<Checkpoint>(`/v1/checkpoints/${id}`),

  decide: (id: string, data: CheckpointDecisionRequest) =>
    api.post<Checkpoint>(`/v1/checkpoints/${id}/decide`, data),
};
