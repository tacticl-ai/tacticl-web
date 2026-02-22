import { api } from './client';
import type { SparkTemplate, CreateTemplateRequest } from './types';

export const templatesApi = {
  list: () => api.get<SparkTemplate[]>('/api/templates'),

  get: (id: string) => api.get<SparkTemplate>(`/api/templates/${id}`),

  create: (data: CreateTemplateRequest) =>
    api.post<SparkTemplate>('/api/templates', data),

  remove: (id: string) => api.delete<void>(`/api/templates/${id}`),
};
