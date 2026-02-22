import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LinkIcon from '@mui/icons-material/Link';
import { formatDistanceToNow, format } from 'date-fns';
import TopBar from '../components/layout/TopBar';
import SparkTimeline from '../components/sparks/SparkTimeline';
import SparkStatusBadge from '../components/sparks/SparkStatusBadge';
import LoadingState from '../components/common/LoadingState';
import { useSpark, useSparkTactics, useSparkLogs, useCancelSpark } from '../hooks/useSparks';
import { useDecideCheckpoint } from '../hooks/useCheckpoints';
import type { Tactic, Checkpoint, ExecutionLog } from '../api/types';

// Mock data for development
const MOCK_TACTICS: Tactic[] = [
  {
    id: 't1',
    sparkId: '1',
    deviceId: 'd1',
    description: 'Analyze Cloud Run memory/CPU configs in strategiz-core',
    status: 'COMPLETED',
    repos: ['strategiz-core'],
    result: {
      findings: ['API service over-provisioned: 2 CPU / 1GB, only uses 0.3 CPU avg'],
      changes: ['Reduced API service to 1 CPU / 512MB'],
      metrics: { estimatedSavings: '$12/mo' },
    },
    tokenUsage: 18400,
    createdAt: new Date(Date.now() - 1500000).toISOString(),
    updatedAt: new Date(Date.now() - 900000).toISOString(),
  },
  {
    id: 't2',
    sparkId: '1',
    deviceId: 'd1',
    description: 'Review idle scaling and min-instances settings',
    status: 'EXECUTING',
    repos: ['strategiz-core'],
    result: null,
    tokenUsage: 8200,
    createdAt: new Date(Date.now() - 1200000).toISOString(),
    updatedAt: new Date(Date.now() - 120000).toISOString(),
  },
  {
    id: 't3',
    sparkId: '1',
    deviceId: 'd1',
    description: 'Check GCP billing trends via gcloud CLI',
    status: 'PENDING',
    repos: [],
    result: null,
    tokenUsage: 0,
    createdAt: new Date(Date.now() - 1200000).toISOString(),
    updatedAt: new Date(Date.now() - 1200000).toISOString(),
  },
];

const MOCK_CHECKPOINTS: Checkpoint[] = [
  {
    id: 'cp1',
    sparkId: '1',
    tacticId: 't1',
    title: 'Found 3 cost-saving opportunities',
    description:
      'Analysis complete. Ready to create PRs with optimized Cloud Run configurations.',
    findings: [
      {
        type: 'optimization',
        severity: 'medium',
        description: 'API service over-provisioned: 2 CPU / 1GB, only uses 0.3 CPU avg',
        suggestedAction: 'Reduce to 1 CPU / 512MB',
      },
      {
        type: 'optimization',
        severity: 'low',
        description: 'Auth service min-instances=1 but only gets 2 req/min off-peak',
        suggestedAction: 'Set min-instances=0, use startup CPU boost',
      },
    ],
    options: ['approve_all', 'approve_partial', 'reject', 'modify'],
    userDecision: null,
    userFeedback: null,
    decidedAt: null,
    createdAt: new Date(Date.now() - 600000).toISOString(),
  },
];

const MOCK_LOGS: ExecutionLog[] = [
  {
    id: 'l1',
    sparkId: '1',
    tacticId: 't1',
    toolName: 'run_command',
    toolInput: { command: 'gcloud run services describe strategiz-api --region=us-east1 --format=json' },
    toolOutput: { exitCode: 0, stdout: '{ "spec": { "template": { ... } } }' },
    tokenUsage: { input: 1200, output: 450 },
    durationMs: 3200,
    timestamp: new Date(Date.now() - 1400000).toISOString(),
  },
  {
    id: 'l2',
    sparkId: '1',
    tacticId: 't1',
    toolName: 'read_file',
    toolInput: { path: 'deployment/cloudbuild/cloudbuild-qa.yaml' },
    toolOutput: { exitCode: 0, stdout: '...(file content)...' },
    tokenUsage: { input: 800, output: 2100 },
    durationMs: 120,
    timestamp: new Date(Date.now() - 1300000).toISOString(),
  },
];

export default function SparkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: spark, isLoading } = useSpark(id!);
  const { data: tactics } = useSparkTactics(id!);
  const { data: logs } = useSparkLogs(id!);
  const cancelSpark = useCancelSpark();
  const decideCheckpoint = useDecideCheckpoint();

  // Use mock data when API is not ready
  const displaySpark = spark;
  const displayTactics = tactics ?? MOCK_TACTICS;
  const displayCheckpoints = MOCK_CHECKPOINTS;
  const displayLogs = logs ?? MOCK_LOGS;

  if (isLoading && !displaySpark) {
    return (
      <>
        <TopBar title="Spark Detail" />
        <LoadingState />
      </>
    );
  }

  const sparkData = displaySpark ?? {
    id: id!,
    title: 'Reduce Cloud Run costs',
    description: 'Analyzing Cloud Run configurations...',
    status: 'EXECUTING' as const,
    priority: 'HIGH' as const,
    type: 'devops' as const,
    checkpointPolicy: 'CHECKPOINT_MAJOR' as const,
    totalTokens: 45200,
    estimatedCost: 0.32,
    repoAccess: ['strategiz-core'],
    deviceId: 'd1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schedule: null,
    nextRunAt: null,
    result: null,
    parentSparkId: null,
    userId: 'u1',
  };

  const isActive =
    sparkData.status === 'EXECUTING' ||
    sparkData.status === 'ROUTING' ||
    sparkData.status === 'CHECKPOINT';

  return (
    <>
      <TopBar
        title={sparkData.title}
        actions={
          isActive ? (
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => cancelSpark.mutate(sparkData.id)}
            >
              Cancel
            </Button>
          ) : undefined
        }
      />

      {/* Status Timeline */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <SparkTimeline status={sparkData.status} />
        </CardContent>
      </Card>

      {/* Spark Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <SparkStatusBadge status={sparkData.status} />
            {sparkData.type && <Chip label={sparkData.type} size="small" variant="outlined" />}
            <Chip label={sparkData.priority} size="small" variant="outlined" />
            <Chip label={sparkData.checkpointPolicy} size="small" variant="outlined" />
          </Box>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {sparkData.description}
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary">
              Tokens: {sparkData.totalTokens.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cost: ${sparkData.estimatedCost.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Created{' '}
              {formatDistanceToNow(new Date(sparkData.createdAt), {
                addSuffix: true,
              })}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Tactics */}
      <Typography variant="h6" sx={{ mb: 1.5 }}>
        Tactics
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
        {displayTactics.map((tactic) => (
          <Card key={tactic.id}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Chip
                  label={tactic.status}
                  size="small"
                  color={
                    tactic.status === 'COMPLETED'
                      ? 'success'
                      : tactic.status === 'EXECUTING'
                        ? 'primary'
                        : tactic.status === 'FAILED'
                          ? 'error'
                          : 'default'
                  }
                />
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {tactic.description}
                </Typography>
              </Box>
              {tactic.repos.length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                  {tactic.repos.map((repo) => (
                    <Chip
                      key={repo}
                      label={repo}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  ))}
                </Box>
              )}
              {tactic.result && (
                <Box sx={{ mt: 1 }}>
                  {tactic.result.findings.map((f, i) => (
                    <Typography key={i} variant="caption" color="text.secondary" display="block">
                      &bull; {f}
                    </Typography>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Checkpoints */}
      {displayCheckpoints.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Checkpoints
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
            {displayCheckpoints.map((cp) => (
              <Card
                key={cp.id}
                sx={{
                  borderLeft: cp.userDecision
                    ? undefined
                    : '3px solid',
                  borderLeftColor: cp.userDecision
                    ? undefined
                    : 'warning.main',
                }}
              >
                <CardContent>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {cp.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {cp.description}
                  </Typography>
                  {cp.findings.length > 0 && (
                    <List dense sx={{ mb: 1 }}>
                      {cp.findings.map((f, i) => (
                        <ListItem key={i} sx={{ px: 0 }}>
                          <ListItemText
                            primary={f.description}
                            secondary={f.suggestedAction}
                            primaryTypographyProps={{ variant: 'body2' }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                  {!cp.userDecision && (
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<CheckCircleIcon />}
                        onClick={() =>
                          decideCheckpoint.mutate({
                            id: cp.id,
                            data: { decision: 'APPROVED' },
                          })
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<CancelIcon />}
                        onClick={() =>
                          decideCheckpoint.mutate({
                            id: cp.id,
                            data: { decision: 'REJECTED' },
                          })
                        }
                      >
                        Reject
                      </Button>
                    </Box>
                  )}
                  {cp.userDecision && (
                    <Chip
                      label={cp.userDecision}
                      size="small"
                      color={cp.userDecision === 'APPROVED' ? 'success' : 'error'}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        </>
      )}

      {/* Results */}
      {sparkData.result && (
        <>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Results
          </Typography>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {sparkData.result.summary}
              </Typography>
              {sparkData.result.findings.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    Findings
                  </Typography>
                  {sparkData.result.findings.map((f, i) => (
                    <Typography key={i} variant="body2" color="text.secondary">
                      &bull; {f}
                    </Typography>
                  ))}
                </Box>
              )}
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {sparkData.result.prs.map((pr, i) => (
                  <Chip
                    key={i}
                    icon={<LinkIcon />}
                    label={`PR: ${pr.split('/').pop()}`}
                    component="a"
                    href={pr}
                    target="_blank"
                    clickable
                    size="small"
                  />
                ))}
                {sparkData.result.issues.map((issue, i) => (
                  <Chip
                    key={i}
                    icon={<LinkIcon />}
                    label={`Issue: ${issue.split('/').pop()}`}
                    component="a"
                    href={issue}
                    target="_blank"
                    clickable
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </>
      )}

      {/* Execution Logs */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            Execution Logs ({displayLogs.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {displayLogs.map((log) => (
            <Box
              key={log.id}
              sx={{
                mb: 1.5,
                p: 1.5,
                bgcolor: 'background.default',
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.8rem',
              }}
            >
              <Box sx={{ display: 'flex', gap: 2, mb: 0.5, color: 'text.secondary' }}>
                <span>{format(new Date(log.timestamp), 'HH:mm:ss')}</span>
                <Chip label={log.toolName} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                <span>{log.durationMs}ms</span>
              </Box>
              <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary' }}>
                {JSON.stringify(log.toolInput, null, 2)}
              </Typography>
            </Box>
          ))}
        </AccordionDetails>
      </Accordion>
    </>
  );
}
