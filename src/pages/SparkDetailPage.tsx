import { useParams, Navigate } from 'react-router-dom';
import { useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LinkIcon from '@mui/icons-material/Link';
import { formatDistanceToNow, format } from 'date-fns';
import TopBar from '../components/layout/TopBar';
import SparkTimeline from '../components/sparks/SparkTimeline';
import SparkStatusBadge from '../components/sparks/SparkStatusBadge';
import CheckpointApproval from '../components/sparks/CheckpointApproval';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { useSpark, useSparkTactics, useSparkLogs, useCancelSpark } from '../hooks/useSparks';
import { useCheckpoints } from '../hooks/useCheckpoints';
import { useSparkProgressStore } from '../hooks/useSparkProgress';

export default function SparkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const sparkId = id ?? '';
  const { data: spark, isLoading, isError, refetch } = useSpark(sparkId);
  const { data: tactics } = useSparkTactics(sparkId);
  const { data: logs } = useSparkLogs(sparkId);
  const { data: allCheckpoints } = useCheckpoints();
  const cancelSpark = useCancelSpark();

  const progressMessages = useSparkProgressStore((s) => s.sparkProgress[sparkId] || []);

  if (!id) {
    return <Navigate to="/sparks" replace />;
  }
  const activityEndRef = useRef<HTMLDivElement>(null);

  const displayTactics = tactics ?? [];
  const displayCheckpoints = (allCheckpoints ?? []).filter(
    (cp) => cp.sparkId === id,
  );
  const displayLogs = logs ?? [];

  // Auto-scroll live activity to bottom when new messages arrive
  useEffect(() => {
    activityEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [progressMessages.length]);

  if (isLoading) {
    return (
      <>
        <TopBar title="Spark Detail" />
        <LoadingState />
      </>
    );
  }

  if (isError || !spark) {
    return (
      <>
        <TopBar title="Spark Detail" />
        <ErrorState
          message="Failed to load spark details."
          onRetry={refetch}
        />
      </>
    );
  }

  const isActive =
    spark.status === 'EXECUTING' ||
    spark.status === 'ROUTING' ||
    spark.status === 'CHECKPOINT';

  const showLiveActivity =
    (spark.status === 'EXECUTING' || spark.status === 'CHECKPOINT') &&
    progressMessages.length > 0;

  return (
    <>
      <TopBar
        title={spark.title}
        actions={
          isActive ? (
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => cancelSpark.mutate(spark.id)}
            >
              Cancel
            </Button>
          ) : undefined
        }
      />

      {/* Status Timeline */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <SparkTimeline status={spark.status} />
        </CardContent>
      </Card>

      {/* Spark Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <SparkStatusBadge status={spark.status} />
            {spark.type && <Chip label={spark.type} size="small" variant="outlined" />}
            <Chip label={spark.priority} size="small" variant="outlined" />
            <Chip label={spark.checkpointPolicy} size="small" variant="outlined" />
          </Box>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {spark.description}
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary">
              Tokens: {spark.totalTokens.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cost: ${spark.estimatedCost.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Created{' '}
              {formatDistanceToNow(new Date(spark.createdAt), {
                addSuffix: true,
              })}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Live Activity */}
      {showLiveActivity && (
        <Paper
          sx={{
            mb: 3,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 1.5,
              borderBottom: '1px solid',
              borderBottomColor: 'divider',
              bgcolor: 'background.default',
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: '#4caf50',
                animation: 'pulse 2s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.4 },
                },
              }}
            />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Live Activity
            </Typography>
          </Box>
          <Box
            sx={{
              maxHeight: 300,
              overflowY: 'auto',
              px: 2,
              py: 1,
            }}
          >
            {progressMessages.map((msg) => (
              <Box key={msg.id} sx={{ py: 0.75 }}>
                {msg.type === 'checkpoint' ? (
                  <Box sx={{ py: 0.5 }}>
                    <Chip
                      label="Checkpoint"
                      size="small"
                      sx={{
                        mb: 0.5,
                        bgcolor: 'rgba(255, 152, 0, 0.12)',
                        color: 'warning.main',
                        fontSize: '0.7rem',
                      }}
                    />
                    <Typography variant="body2">{msg.message}</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontFamily: 'monospace', flexShrink: 0, pt: 0.25 }}
                    >
                      {format(new Date(msg.timestamp), 'HH:mm:ss')}
                    </Typography>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        color={
                          msg.type === 'failed'
                            ? 'error.main'
                            : msg.type === 'completed'
                              ? 'success.main'
                              : 'text.primary'
                        }
                      >
                        {msg.message}
                      </Typography>
                      {msg.percent != null && (
                        <LinearProgress
                          variant="determinate"
                          value={msg.percent}
                          sx={{ mt: 0.5, borderRadius: 1, height: 4 }}
                        />
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            ))}
            <div ref={activityEndRef} />
          </Box>
        </Paper>
      )}

      {/* Tactics */}
      <Typography variant="h6" sx={{ mb: 1.5 }}>
        Tactics ({displayTactics.length})
      </Typography>
      {displayTactics.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          No tactics created yet.
        </Typography>
      ) : (
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
      )}

      {/* Checkpoints */}
      {displayCheckpoints.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Checkpoints
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
            {displayCheckpoints.map((cp) => (
              <CheckpointApproval key={cp.id} checkpoint={cp} />
            ))}
          </Box>
        </>
      )}

      {/* Results */}
      {spark.result && (
        <>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Results
          </Typography>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {spark.result.summary}
              </Typography>
              {spark.result.findings.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    Findings
                  </Typography>
                  {spark.result.findings.map((f, i) => (
                    <Typography key={i} variant="body2" color="text.secondary">
                      &bull; {f}
                    </Typography>
                  ))}
                </Box>
              )}
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {spark.result.prs.map((pr, i) => (
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
                {spark.result.issues.map((issue, i) => (
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
          {displayLogs.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No execution logs yet.
            </Typography>
          ) : (
            displayLogs.map((log) => (
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
            ))
          )}
        </AccordionDetails>
      </Accordion>
    </>
  );
}
