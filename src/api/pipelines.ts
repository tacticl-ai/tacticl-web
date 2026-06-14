// src/api/pipelines.ts
// Dashboard-level "list all pipelines" API. Distinct from pipeline.ts which is
// scoped to a single spark's run/events/artifacts.
import { api } from './client';
import type { PipelineRunSummary } from './types';

export const pipelinesApi = {
  /** One summary row per pipeline run, newest activity first (server-ordered). */
  list: () => api.get<PipelineRunSummary[]>('/v1/pipelines'),
};
