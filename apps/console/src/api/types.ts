// ─── Pipeline / Spark Analytics Types ──────────────────

export type PipelineStatus = 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXECUTING' | 'PENDING' | 'ROUTING' | 'CHECKPOINT';

export type SparkType = 'code' | 'social' | 'research' | 'devops' | 'creative' | 'data';

export type RoleName = 'architect' | 'implementer' | 'reviewer' | 'tester' | 'deployer' | 'researcher' | 'writer' | 'analyst';

// ─── Key Metrics ────────────────────────────────────────

export interface KeyMetrics {
  totalPipelineRuns: number;
  successRate: number;
  activePipelines: number;
  pipelineBacklog: number;
  estimatedCostUsd: number;
  totalTokens: number;
  totalPipelineRunsTrend: number;
  successRateTrend: number;
  activePipelinesTrend: number;
  pipelineBacklogTrend: number;
  estimatedCostTrend: number;
  totalTokensTrend: number;
}

// ─── Role Analytics ─────────────────────────────────────

export interface RoleMetric {
  role: RoleName;
  runs: number;
  avgDurationMs: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface RoleAnalytics {
  roles: RoleMetric[];
}

// ─── Rework / Exit Status ───────────────────────────────

export interface ExitStatusEntry {
  status: PipelineStatus;
  count: number;
}

export interface ReworkOrigin {
  role: RoleName;
  reworkCount: number;
}

export interface ReworkAnalytics {
  firstPassRate: number;
  reworkRate: number;
  exitStatusDistribution: ExitStatusEntry[];
  reworkByOrigin: ReworkOrigin[];
}

// ─── Funnel ─────────────────────────────────────────────

export interface FunnelStage {
  stage: string;
  count: number;
}

export interface PipelineFunnel {
  stages: FunnelStage[];
}

// ─── Cost ───────────────────────────────────────────────

export interface CostByRole {
  role: RoleName;
  costUsd: number;
}

export interface CostByPlaybook {
  playbook: string;
  costUsd: number;
  runs: number;
}

export interface CostAnalytics {
  costByRole: CostByRole[];
  costByPlaybook: CostByPlaybook[];
  avgCostPerPipeline: number;
  costCeilingHitRate: number;
}

// ─── Daily Metrics ──────────────────────────────────────

export interface DailyMetricEntry {
  date: string;
  runs: number;
  costUsd: number;
  tokens: number;
  successRate: number;
}

export interface DailyMetrics {
  days: DailyMetricEntry[];
}

// ─── Pipeline List ──────────────────────────────────────

export interface PipelineRun {
  id: string;
  sparkId: string;
  title: string;
  type: SparkType | null;
  status: PipelineStatus;
  roles: RoleName[];
  totalTokens: number;
  costUsd: number;
  durationMs: number;
  createdAt: string;
  completedAt: string | null;
}

export interface PipelineListResponse {
  pipelines: PipelineRun[];
  total: number;
}

// ─── Pipeline Detail ────────────────────────────────────

export interface PipelineStepLog {
  id: string;
  role: RoleName;
  toolName: string;
  toolInput: Record<string, unknown>;
  toolOutput: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  status: 'success' | 'error';
  timestamp: string;
}

export interface PipelineDetail {
  id: string;
  sparkId: string;
  title: string;
  description: string;
  type: SparkType | null;
  status: PipelineStatus;
  roles: RoleName[];
  totalTokens: number;
  costUsd: number;
  durationMs: number;
  createdAt: string;
  completedAt: string | null;
  steps: PipelineStepLog[];
}

// ─── Dashboard Aggregate ────────────────────────────────

export interface DashboardData {
  keyMetrics: KeyMetrics;
  roleAnalytics: RoleAnalytics;
  reworkAnalytics: ReworkAnalytics;
  funnel: PipelineFunnel;
  costAnalytics: CostAnalytics;
  dailyMetrics: DailyMetrics;
}
