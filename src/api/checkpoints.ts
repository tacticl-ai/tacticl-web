import { api } from './client';
import type { Checkpoint, CheckpointDecisionRequest } from './types';

export const checkpointsApi = {
  list: () => api.get<Checkpoint[]>('/api/checkpoints'),

  get: (id: string) => api.get<Checkpoint>(`/api/checkpoints/${id}`),

  decide: (id: string, data: CheckpointDecisionRequest) =>
    api.post<Checkpoint>(`/api/checkpoints/${id}/decide`, data),
};
