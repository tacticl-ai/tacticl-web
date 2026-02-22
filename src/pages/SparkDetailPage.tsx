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
import ErrorState from '../components/common/ErrorState';
import { useSpark, useSparkTactics, useSparkLogs, useCancelSpark } from '../hooks/useSparks';
import { useCheckpoints, useDecideCheckpoint } from '../hooks/useCheckpoints';

export default function SparkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: spark, isLoading, isError, refetch } = useSpark(id!);
  const { data: tactics } = useSparkTactics(id!);
  const { data: logs } = useSparkLogs(id!);
  const { data: allCheckpoints } = useCheckpoints();
  const cancelSpark = useCancelSpark();
  const decideCheckpoint = useDecideCheckpoint();

  const displayTactics = tactics ?? [];
  const displayCheckpoints = (allCheckpoints ?? []).filter(
    (cp) => cp.sparkId === id,
  );
  const displayLogs = logs ?? [];

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
