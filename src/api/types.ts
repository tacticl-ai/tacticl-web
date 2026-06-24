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

export type SparkType = 'code' | 'social' | 'research' | 'devops' | 'creative' | 'data';

export type CheckpointPolicy = 'AUTO' | 'CHECKPOINT_MAJOR' | 'CHECKPOINT_ALL';

export type TacticStatus = 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED';

export type DeviceType = 'MACOS' | 'WINDOWS' | 'LINUX' | 'IOS' | 'ANDROID' | 'WEB';

export type DeviceState = 'ONLINE' | 'OFFLINE' | 'BUSY';

export type RepoProvider = 'GITHUB' | 'GITLAB' | 'BITBUCKET';

export type RepoAccessLevel = 'READ' | 'WRITE' | 'ADMIN';

export type TokenProvider = 'ANTHROPIC' | 'GITHUB' | 'OPENAI';

// Mirrors the Java CheckpointDecision enum {APPROVED, REWORK, CANCEL} — the
// pipeline controller does CheckpointDecision.valueOf(decision), so any other
// literal 400s. APPROVED → merge; REWORK → GRANT_REWORK; CANCEL → REJECT.
export type CheckpointDecision = 'APPROVED' | 'REWORK' | 'CANCEL';

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

// ─── Device Pairing ─────────────────────────────────────

export interface PairingCodeResponse {
  code: string;
  expiresIn: number;
}

export interface PairingTokenResponseDto {
  token: string;
  expiresAt: string;
}

// ─── Paginated Response ──────────────────────────────────

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// ─── Connections ─────────────────────────────────────────

export interface Connection {
  id: string;
  platform: string;
  platformUsername: string;
  profileImageUrl?: string;
  disabled: boolean;
  tokenRefreshNeeded: boolean;
  tokenExpiresAt?: string;
  createdAt: string;
  // GitHub App org grant (single-org per user) — only present on the GITHUB
  // connection row once the user has installed the Tacticl GitHub App.
  orgLogin?: string | null;
  installationId?: number | null;
}

// ─── GitHub Org Grant · Repos in scope ───────────────────
// GET /v1/connections/github/repos — the repos visible to the user's linked
// GitHub org via the GitHub App installation grant. Empty when no app/install.

/** GET /v1/connections/github/repos item — matches backend GithubRepoDto. */
export interface GithubRepo {
  owner: string;
  name: string;
  fullName: string;
  repoUrl: string;
  /** GitHub's repo.language — may be null. */
  language: string | null;
  defaultBranch: string;
  /** True when repoUrl === the user's Product.defaultRepoUrl. */
  isDefault: boolean;
}

/** GET /v1/connections/github/install/url response. */
export interface GithubInstallUrlResponse {
  /** GitHub App install URL; null/empty when the app is unconfigured. */
  url: string | null;
}

/** POST /v1/connections/github/install/callback body. */
export interface GithubInstallCallbackRequest {
  installationId: number | string;
  setupAction: string;
  orgLogin?: string;
}

export type PostState = 'DRAFT' | 'QUEUED' | 'PUBLISHING' | 'PUBLISHED' | 'CANCELLED' | 'FAILED';

export interface SocialPost {
  id: string;
  content: string;
  mediaUrls: string[];
  targetConnectionIds: string[];
  state: PostState;
  publishDate?: string;
  publishedPostId?: string;
  publishedUrl?: string;
  createdAt: string;
}

export interface CreatePostRequest {
  content: string;
  mediaUrls?: string[];
  targetConnectionIds?: string[];
  publishDate?: string;
}

export interface OAuthAuthorizeResponse {
  authUrl: string;
  state: string;
}

export interface OAuthCallbackResponse {
  id: string;
  platform: string;
  platformUsername: string;
  profileImageUrl?: string;
  disabled: boolean;
  tokenRefreshNeeded: boolean;
  tokenExpiresAt?: string;
  createdAt: string;
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
  sparkType?: SparkType;
}

export interface AgentCommandResponse {
  responseText: string;
  toolsInvoked: string[];
  sparkId?: string;
  sparkStatus?: string;
  confirmationId?: string;
  success: boolean;
  model?: string;
  delegated?: boolean;
  deviceName?: string;
  actions?: AgentAction[];
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

// ─── Agent Actions (chat-driven setup) ──────────────────

export type AgentActionType = 'connect_account' | 'grant_repo' | 'add_token' | 'connect_device';

export interface AgentAction {
  type: AgentActionType;
  platform?: string;
  provider?: RepoProvider;
  tokenProvider?: TokenProvider;
  repoFullName?: string;
  accessLevel?: RepoAccessLevel;
  message?: string;
}

// ─── PDLC Pipeline ─────────────────────────────────────

export type PipelineTier = 'SIMPLE' | 'PLAYBOOK' | 'FULL_PDLC';

export type PipelineStatus =
  | 'PENDING' | 'RUNNING' | 'PAUSED_AT_CHECKPOINT'
  | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type PdlcRole =
  | 'PO' | 'RESEARCHER' | 'ARCHITECT' | 'DESIGNER' | 'PLANNER'
  | 'IMPLEMENTER' | 'REVIEWER' | 'TESTER' | 'SECURITY_ANALYST'
  | 'TECHNICAL_WRITER' | 'DEVOPS' | 'RETRO_ANALYST';

export type RoleStatus =
  | 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'REJECTED' | 'REWORKING'
  | 'FAILED' | 'ESCALATED' | 'SKIPPED' | 'AWAITING_APPROVAL';

export type PipelineEventType =
  | 'PIPELINE_STARTED' | 'PIPELINE_COMPLETED' | 'PIPELINE_FAILED'
  | 'PIPELINE_CANCELLED' | 'PIPELINE_RESUMED'
  | 'ROLE_STARTED' | 'ROLE_COMPLETED' | 'ROLE_REJECTED' | 'ROLE_SKIPPED'
  | 'REWORK_TRIGGERED' | 'REWORK_COMPLETED' | 'REWORK_ESCALATED'
  | 'ARTIFACT_PRODUCED'
  | 'CHECKPOINT_REQUESTED' | 'CHECKPOINT_RESOLVED' | 'CHECKPOINT_TIMEOUT_REMINDER'
  | 'PARALLEL_ROLES_STARTED'
  | 'COST_THRESHOLD_WARNING' | 'COST_CEILING_REACHED';

export interface RoleResultSummary {
  status: RoleStatus;
  iteration: number;
  cost: number;
  tokens?: number;
  durationMs?: number;
  model?: string;
  engine?: string | null;
  childSparkId?: string | null;
  artifactId?: string | null;
}

export interface PipelineRun {
  id: string;
  sparkId: string;
  playbook: string;
  status: PipelineStatus;
  totalCostUsd: number;
  currentCheckpointId: string | null;
  failureReason: string | null;
  activatedRoles: PdlcRole[];
  currentRole: PdlcRole | null;
  roleResults: Record<string, RoleResultSummary>;
  skippedRoles: string[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

/**
 * Lightweight, list-oriented projection of a pipeline run for the dashboard's
 * "one row per pipeline" view. Carries just enough to render a status chip, an
 * agent timeline strip with a blinking active light, cost, and the row click
 * target (sparkId → existing detail page).
 */
export interface PipelineRunSummary {
  id: string;
  sparkId: string;
  name: string;
  playbook: string;
  repoFullName: string | null;
  status: PipelineStatus;
  totalCostUsd: number;
  activatedRoles: PdlcRole[];
  currentRole: PdlcRole | null;
  currentCheckpointId: string | null;
  roleResults: Record<string, RoleResultSummary>;
  skippedRoles: string[];
  prNumber: number | null;
  prUrl: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface PipelineEvent {
  id: string;
  pipelineRunId: string;
  eventType: PipelineEventType;
  role: PdlcRole | null;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export interface RoleArtifact {
  id: string;
  role: PdlcRole;
  artifactType: string;
  content: Record<string, unknown>;
  artifactVersion: number;
  createdAt: string;
}

/** Per-artifact lifecycle status in the manifest. */
export type ArtifactStatus = 'done' | 'active' | 'pending';

/**
 * One entry in the pipeline's artifact manifest
 * (GET /v1/sparks/{sparkId}/pipeline/artifacts).
 *
 * The manifest is the UNION of the canonical PDLC role skeleton (so the rail can
 * render roles that have not committed yet — `present:false`) enriched/overridden
 * by the committed `.tacticl/pdlc/{runId}/manifest.json` entries. Matches the
 * backend `ArtifactManifestEntryDto` 10-field shape exactly.
 */
export interface ArtifactListItem {
  /** Artifact file stem, no `.md` — the key for the content endpoint (e.g. "product-brief"). */
  name: string;
  /** PdlcRole enum name (e.g. "PO"); null only for committed entries whose agent is not a known role. */
  role: PdlcRole | null;
  /** Human-readable rail label (e.g. "Product Brief"). */
  title: string;
  /** Repo path (e.g. ".tacticl/pdlc/{runId}/product-brief.md"); null until committed. */
  path: string | null;
  /** Lifecycle status driving the rail's status dot. */
  status: ArtifactStatus;
  /** Version label (e.g. "v1"/"v2"; v1 default, +1 per rework). */
  version: string;
  /** True when real markdown content exists / was committed to the manifest. */
  present: boolean;
  /** Manifest type hint (e.g. "markdown"); "" when not committed. */
  type: string;
  /** Manifest agent string as committed; "" when not committed. */
  agent: string;
  /** Manifest summary blurb; "" when not committed. */
  summary: string;
}

/** Rendered artifact body (GET .../pipeline/artifacts/{name}/content). */
export interface ArtifactContentResponse {
  /** File stem without `.md` (e.g. "product-brief"). */
  name: string;
  /** Decoded UTF-8 markdown body. May be empty when not yet committed. */
  markdown: string;
  /** GitHub blob SHA at the resolved ref. */
  sha: string;
}

/**
 * Canonical PDLC role → artifact file-stem map. Single source of truth on the
 * client for which stem each role's content lives under; mirrors the backend
 * `PdlcArtifactCatalog`. The manifest itself carries the authoritative `name`
 * per entry — this is only used for fallbacks / static grouping.
 */
export const ROLE_ARTIFACT_MAP: Record<PdlcRole, string> = {
  PO: 'product-brief',
  RESEARCHER: 'research',
  ARCHITECT: 'architecture',
  DESIGNER: 'design',
  PLANNER: 'plan',
  IMPLEMENTER: 'change-summary',
  TESTER: 'test-report',
  SECURITY_ANALYST: 'security-report',
  REVIEWER: 'review',
  TECHNICAL_WRITER: 'docs',
  DEVOPS: 'devops',
  RETRO_ANALYST: 'retro',
};

export interface CheckpointResolution {
  decision: CheckpointDecision;
  feedback: string | null;
}

export interface Playbook {
  name: string;
  displayName: string;
  description: string;
  tier: PipelineTier;
  stages: string[];
  isSystemPlaybook: boolean;
}

// ─── Conversation API ────────────────────────────────────────────────────────

export type ConversationStatus = 'GATHERING' | 'PROPOSING' | 'ACTIVE' | 'COMPLETED';

export interface ConversationMessageItem {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ConversationResponse {
  id: string;
  title: string;
  status: ConversationStatus;
  sparkId?: string;
  messages: ConversationMessageItem[];
  createdAt: string;
  updatedAt: string;
}

export interface MessageResponse {
  content: string;
  sessionStatus: ConversationStatus;
  sparkId?: string;
  pipelineRunId?: string;
}

// ─── Profile ────────────────────────────────────────────

export interface UserProfileResponse {
  displayName: string;
  email: string;
  avatarUrl: string | null;
}

/** P5 PUT /v1/users/me — both fields optional (partial update). */
export interface UpdateProfileRequest {
  displayName?: string;
  avatarUrl?: string | null;
}

// ─── Settings · Repos (P5) ───────────────────────────────
// Per-user repo memory surfaced in Settings → Connections → Developer.
// Distinct from the legacy provider-scoped RepoGrant (chat-driven grant flow).

export type RepoMemoryKind = 'USER' | 'ORG' | 'UNKNOWN';
export type RepoMemorySource = 'ATTACHED' | 'PROVISIONED' | 'USED';

/** GET /v1/repos item / POST /v1/repos response — matches backend RepoDto. */
export interface SettingsRepo {
  id: string;
  repoUrl: string;
  owner: string | null;
  name: string | null;
  source: RepoMemorySource | string | null;
  kind: RepoMemoryKind | string | null;
}

/** POST /v1/repos body. */
export interface AttachRepoRequest {
  repoUrl: string;
  accessLevel?: RepoAccessLevel;
}

// ─── Settings · API Tokens (P5) ──────────────────────────
// Personal API tokens for programmatic access. Distinct from the legacy
// BYOK provider AgentToken (Anthropic/OpenAI keys with usage limits).

/** GET /v1/tokens item — the plaintext is never returned here, only a mask. */
export interface ApiTokenSummary {
  id: string;
  name: string;
  maskedToken: string;
  createdAt: string;
  lastUsedAt?: string | null;
}

/** POST /v1/tokens body. */
export interface CreateApiTokenRequest {
  name: string;
}

/** POST /v1/tokens response — `token` (plaintext) is returned exactly once. */
export interface CreatedApiToken {
  id: string;
  name: string;
  token: string;
  createdAt: string;
}

// ─── Product (onboarding) ────────────────────────────────

export type ProductChannelType = 'DISCORD' | 'TELEGRAM' | 'WEB' | 'VOICE';

export interface ProductChannel {
  channelType: ProductChannelType;
  externalKey: string;
  label: string;
}

export interface Product {
  id: string;
  name: string;
  repos: string[];
  channels: ProductChannel[];
  createdAt: string;
}

export interface RepoSpec {
  url?: string;
  create?: boolean;
  owner?: string;
  repoName?: string;
  isPrivate?: boolean;
}

export interface ChannelSpec {
  channelType: string;
  externalKey: string;
  label: string;
}

export interface RegisterProductRequest {
  name: string;
  repos: RepoSpec[];
  channels: ChannelSpec[];
}
