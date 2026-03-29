import { api } from './client';
import type { SparkTemplate, CreateTemplateRequest } from './types';

export const templatesApi = {
  list: () => api.get<SparkTemplate[]>('/v1/templates'),

  get: (id: string) => api.get<SparkTemplate>(`/v1/templates/${id}`),

  create: (data: CreateTemplateRequest) =>
    api.post<SparkTemplate>('/v1/templates', data),

  remove: (id: string) => api.delete<void>(`/v1/templates/${id}`),
};
