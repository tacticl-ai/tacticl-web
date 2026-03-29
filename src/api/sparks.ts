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
    return api.get<Spark[]>(`/v1/sparks${qs ? `?${qs}` : ''}`);
  },

  get: (id: string) => api.get<Spark>(`/v1/sparks/${id}`),

  create: (data: CreateSparkRequest) =>
    api.post<Spark>('/v1/sparks', data),

  update: (id: string, data: UpdateSparkRequest) =>
    api.put<Spark>(`/v1/sparks/${id}`, data),

  cancel: (id: string) => api.delete<void>(`/v1/sparks/${id}`),

  run: (id: string) => api.post<Spark>(`/v1/sparks/${id}/run`),

  tactics: (sparkId: string) =>
    api.get<Tactic[]>(`/v1/sparks/${sparkId}/tactics`),

  logs: (sparkId: string) =>
    api.get<ExecutionLog[]>(`/v1/sparks/${sparkId}/logs`),
};
