// ─── Enums ───────────────────────────────────────────────

export type SparkStatus =
  | 'PENDING'
  | 'ROUTING'
  | 'EXECUTING'
  | 'CHECKPOINT'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type SparkPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type SparkType = 'code' | 'social' | 'research' | 'devops';

export type CheckpointPolicy = 'AUTO' | 'CHECKPOINT_MAJOR' | 'CHECKPOINT_ALL';

export type TacticStatus = 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED';

export type DeviceType = 'PHONE' | 'TABLET' | 'COMPUTER' | 'WATCH';

export type DeviceState = 'ONLINE' | 'OFFLINE' | 'BUSY';

export type RepoProvider = 'GITHUB' | 'GITLAB' | 'BITBUCKET';

export type RepoAccessLevel = 'READ' | 'WRITE' | 'ADMIN';

export type TokenProvider = 'ANTHROPIC' | 'GITHUB' | 'OPENAI';

export type CheckpointDecision = 'APPROVED' | 'REJECTED' | 'MODIFIED';

export type FallbackPolicy = 'ANY_AVAILABLE' | 'QUEUE' | 'REJECT';

// ─── Spark ───────────────────────────────────────────────

export interface SparkResult {
  summary: string;
  findings: string[];
  prs: string[];
  issues: string[];
}

export interface Spark {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: SparkType | null;
  status: SparkStatus;
  priority: SparkPriority;
  deviceId: string | null;
  schedule: string | null;
  nextRunAt: string | null;
  checkpointPolicy: CheckpointPolicy;
  repoAccess: string[];
  result: SparkResult | null;
  parentSparkId: string | null;
  totalTokens: number;
  estimatedCost: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSparkRequest {
  title: string;
  description: string;
  priority?: SparkPriority;
  checkpointPolicy?: CheckpointPolicy;
  repoAccess?: string[];
  deviceId?: string;
  schedule?: string;
  templateId?: string;
}

export interface UpdateSparkRequest {
  title?: string;
  description?: string;
  priority?: SparkPriority;
  checkpointPolicy?: CheckpointPolicy;
  repoAccess?: string[];
}

// ─── Tactic ──────────────────────────────────────────────

export interface TacticResult {
  findings: string[];
  changes: string[];
  metrics: Record<string, unknown>;
}

export interface Tactic {
  id: string;
  sparkId: string;
  deviceId: string;
  description: string;
  status: TacticStatus;
  repos: string[];
  result: TacticResult | null;
  tokenUsage: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Device ──────────────────────────────────────────────

export interface DeviceSpecs {
  cpuCores: number;
  ramGb: number;
  diskFreeGb: number;
}

export interface Device {
  id: string;
  userId: string;
  name: string;
  deviceType: DeviceType;
  platform: string;
  specs: DeviceSpecs | null;
  state: DeviceState;
  lastSeenAt: string;
  capabilities: Record<string, unknown>;
  clonedRepos: string[];
  activeDaemons: number;
  daemonVersion: string | null;
  sparkPreferences: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

// ─── Checkpoint ──────────────────────────────────────────

export interface CheckpointFinding {
  type: string;
  severity: string;
  description: string;
  suggestedAction: string;
}

export interface Checkpoint {
  id: string;
  sparkId: string;
  tacticId: string | null;
  title: string;
  description: string;
  findings: CheckpointFinding[];
  options: string[];
  userDecision: CheckpointDecision | null;
  userFeedback: string | null;
  decidedAt: string | null;
  createdAt: string;
}

export interface CheckpointDecisionRequest {
  decision: CheckpointDecision;
  feedback?: string;
}

// ─── Repo Grant ──────────────────────────────────────────

export interface RepoGrant {
  id: string;
  userId: string;
  provider: RepoProvider;
  repoFullName: string;
  accessLevel: RepoAccessLevel;
  grantedAt: string;
}

export interface GrantRepoRequest {
  provider: RepoProvider;
  repoFullName: string;
  accessLevel: RepoAccessLevel;
}

// ─── Agent Token ─────────────────────────────────────────

export interface UsageLimits {
  dailyTokens: number;
  monthlyTokens: number;
  maxPerRequest: number;
}

export interface CurrentUsage {
  todayTokens: number;
  monthTokens: number;
}

export interface AgentToken {
  id: string;
  userId: string;
  provider: TokenProvider;
  label: string;
  usageLimits: UsageLimits;
  currentUsage: CurrentUsage;
  createdAt: string;
}

export interface CreateTokenRequest {
  provider: TokenProvider;
  label: string;
  token: string;
  usageLimits?: Partial<UsageLimits>;
}

// ─── Execution Log ───────────────────────────────────────

export interface ExecutionLog {
  id: string;
  sparkId: string;
  tacticId: string | null;
  toolName: string;
  toolInput: Record<string, unknown>;
  toolOutput: Record<string, unknown>;
  tokenUsage: { input: number; output: number };
  durationMs: number;
  timestamp: string;
}

// ─── Spark Template ──────────────────────────────────────

export interface SparkTemplate {
  id: string;
  userId: string;
  name: string;
  description: string;
  defaultRepos: string[];
  defaultSchedule: string | null;
  defaultCheckpointPolicy: CheckpointPolicy;
  tags: string[];
  createdAt: string;
}

export interface CreateTemplateRequest {
  name: string;
  description: string;
  defaultRepos?: string[];
  defaultSchedule?: string;
  defaultCheckpointPolicy?: CheckpointPolicy;
  tags?: string[];
}

// ─── Device Preferences ──────────────────────────────────

export interface DevicePreference {
  id: string;
  userId: string;
  sparkType: SparkType;
  preferredDeviceId: string;
  fallbackPolicy: FallbackPolicy;
}

// ─── Paginated Response ──────────────────────────────────

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// ─── Social ─────────────────────────────────────────────

export interface SocialIntegration {
  id: string;
  platform: string;
  platformUsername: string;
  profileImageUrl?: string;
  disabled: boolean;
  tokenRefreshNeeded: boolean;
  tokenExpiresAt?: string;
  createdAt: string;
}

export type PostState = 'DRAFT' | 'QUEUED' | 'PUBLISHING' | 'PUBLISHED' | 'CANCELLED' | 'FAILED';

export interface SocialPost {
  id: string;
  content: string;
  mediaUrls: string[];
  targetIntegrationIds: string[];
  state: PostState;
  publishDate?: string;
  publishedPostId?: string;
  publishedUrl?: string;
  createdAt: string;
}

export interface CreatePostRequest {
  content: string;
  mediaUrls?: string[];
  targetIntegrationIds?: string[];
  publishDate?: string;
}

export interface OAuthAuthorizeResponse {
  authUrl: string;
  codeVerifier: string;
}

export interface OAuthCallbackResponse {
  integrationId: string | null;
  platform: string;
  success: boolean;
}

// ─── Agent ──────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  commandText: string;
  responseText: string;
  toolsInvoked: string[];
  success: boolean;
  executionTimeMs: number;
  createdAt: string;
}

export interface ActivityResponse {
  activeAsks: Record<string, unknown>[];
  recentAsks: Record<string, unknown>[];
}

export interface TranscribeResponse {
  text: string;
}

export interface AgentCommandRequest {
  text: string;
  sessionId?: string;
  timezone?: string;
  model?: string;
}

export interface AgentCommandResponse {
  responseText: string;
  toolsInvoked: string[];
  sparkId?: string;
  sparkStatus?: string;
  confirmationId?: string;
  success: boolean;
  model?: string;
}

export interface AgentAsk {
  id: string;
  sparkId: string;
  question: string;
  options: string[];
  status: 'pending' | 'answered' | 'expired';
  answer?: string;
  createdAt: string;
}
