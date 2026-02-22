import { api } from './client';
import type {
  Spark,
  CreateSparkRequest,
  UpdateSparkRequest,
  Tactic,
  ExecutionLog,
} from './types';

export const sparksApi = {
  list: (params?: { status?: string; page?: number; size?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.page !== undefined) query.set('page', String(params.page));
    if (params?.size !== undefined) query.set('size', String(params.size));
    const qs = query.toString();
    return api.get<Spark[]>(`/api/sparks${qs ? `?${qs}` : ''}`);
  },

  get: (id: string) => api.get<Spark>(`/api/sparks/${id}`),

  create: (data: CreateSparkRequest) =>
    api.post<Spark>('/api/sparks', data),

  update: (id: string, data: UpdateSparkRequest) =>
    api.put<Spark>(`/api/sparks/${id}`, data),

  cancel: (id: string) => api.delete<void>(`/api/sparks/${id}`),

  run: (id: string) => api.post<Spark>(`/api/sparks/${id}/run`),

  tactics: (sparkId: string) =>
    api.get<Tactic[]>(`/api/sparks/${sparkId}/tactics`),

  logs: (sparkId: string) =>
    api.get<ExecutionLog[]>(`/api/sparks/${sparkId}/logs`),
};
