import { api } from './client';
import type {
  Spark,
  CreateSparkRequest,
  UpdateSparkRequest,
  Tactic,
  ExecutionLog,
} from './types';

export const sparksApi = {
  list: async (params?: { status?: string; page?: number; size?: number }): Promise<Spark[]> => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.page !== undefined) query.set('page', String(params.page));
    if (params?.size !== undefined) query.set('size', String(params.size));
    const qs = query.toString();
    // Backend returns a paginated envelope { content, page, size, totalElements } of lean
    // SparkSummaryDto rows (sparkId/status/type/route/timestamps). Unwrap it and normalize
    // sparkId -> id so the list/rows render. Tolerate a bare array too (defensive).
    const res = await api.get<Spark[] | { content?: unknown[] }>(`/v1/sparks${qs ? `?${qs}` : ''}`);
    const rows = Array.isArray(res) ? res : (res?.content ?? []);
    // Lean summary rows omit most Spark fields — backfill safe defaults so the row
    // renderer never reads `.toFixed`/nested props off undefined.
    return (rows as Array<Record<string, unknown>>).map((s) => ({
      title: '',
      priority: 'NORMAL',
      estimatedCost: 0,
      totalTokens: 0,
      result: null,
      deviceId: null,
      ...s,
      id: (s.id ?? s.sparkId) as string,
      updatedAt: (s.updatedAt ?? s.createdAt) as string,
    })) as Spark[];
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
