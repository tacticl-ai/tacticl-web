import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TokenIcon from '@mui/icons-material/DataUsage';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { format, parseISO } from 'date-fns';
import { usePipelineDetail } from '../api/analytics.ts';
import StatusBadge from '../components/common/StatusBadge.tsx';
import LoadingSpinner from '../components/common/LoadingSpinner.tsx';

function formatDuration(ms: number): string {
  if (ms >= 60_000) return `${(ms / 60_000).toFixed(1)}m`;
  if (ms >= 1_000) return `${(ms / 1_000).toFixed(1)}s`;
  return `${ms}ms`;
}

export default function PipelineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = usePipelineDetail(id ?? '');

  if (isLoading) return <LoadingSpinner message="Loading pipeline details..." />;
  if (error) return <Alert severity="error" sx={{ mt: 2 }}>Failed to load pipeline: {(error as Error).message}</Alert>;
  if (!data) return null;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/pipelines')}
          sx={{ color: '#999', textTransform: 'none' }}
        >
          Back
        </Button>
      </Box>

      {/* Pipeline Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#e0e0e0', mb: 0.5 }}>
                {data.title}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                {data.description}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1.5, alignItems: 'center' }}>
                <StatusBadge status={data.status} size="medium" />
                {data.type && (
                  <Chip label={data.type} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                )}
                <Typography variant="caption" sx={{ color: '#666' }}>
                  ID: {data.id.slice(0, 12)}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#999' }}>
                  <AccessTimeIcon sx={{ fontSize: 16 }} />
                  <Typography variant="caption" sx={{ color: '#999' }}>Duration</Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#38bdf8' }}>
                  {formatDuration(data.durationMs)}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#999' }}>
                  <TokenIcon sx={{ fontSize: 16 }} />
                  <Typography variant="caption" sx={{ color: '#999' }}>Tokens</Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#e0e0e0' }}>
                  {data.totalTokens.toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#999' }}>
                  <AttachMoneyIcon sx={{ fontSize: 16 }} />
                  <Typography variant="caption" sx={{ color: '#999' }}>Cost</Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#4ade80' }}>
                  ${data.costUsd.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid size={{ xs: 6, md: 3 }}>
              <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', fontSize: '0.6rem' }}>Created</Typography>
              <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                {format(parseISO(data.createdAt), 'MMM d, yyyy HH:mm:ss')}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', fontSize: '0.6rem' }}>Completed</Typography>
              <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                {data.completedAt ? format(parseISO(data.completedAt), 'MMM d, yyyy HH:mm:ss') : '--'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', fontSize: '0.6rem' }}>Spark ID</Typography>
              <Typography variant="body2" sx={{ color: '#e0e0e0', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                {data.sparkId}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', fontSize: '0.6rem' }}>Roles</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                {data.roles.map((r) => (
                  <Chip key={r} label={r} size="small" sx={{ fontSize: '0.65rem', height: 20, backgroundColor: 'rgba(74,222,128,0.08)', color: '#4ade80' }} />
                ))}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Execution Timeline */}
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#e0e0e0', mb: 2 }}>
        Execution Timeline
      </Typography>

      {data.steps.length === 0 ? (
        <Card>
          <CardContent sx={{ py: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">No execution steps recorded</Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ position: 'relative', pl: 3 }}>
          {/* Timeline line */}
          <Box
            sx={{
              position: 'absolute',
              left: 11,
              top: 0,
              bottom: 0,
              width: 2,
              backgroundColor: 'rgba(255,255,255,0.06)',
            }}
          />

          {data.steps.map((step, idx) => (
            <Box key={step.id} sx={{ position: 'relative', mb: 2 }}>
              {/* Timeline dot */}
              <Box
                sx={{
                  position: 'absolute',
                  left: -21,
                  top: 20,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: step.status === 'success' ? '#4ade80' : '#f87171',
                  border: '2px solid #0d0d15',
                  zIndex: 1,
                }}
              />

              <Card sx={{ ml: 1 }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#666', fontSize: '0.65rem' }}>
                          Step {idx + 1}
                        </Typography>
                        <Chip
                          label={step.role}
                          size="small"
                          sx={{ fontSize: '0.6rem', height: 18, backgroundColor: 'rgba(74,222,128,0.08)', color: '#4ade80' }}
                        />
                        <Chip
                          label={step.status}
                          size="small"
                          color={step.status === 'success' ? 'success' : 'error'}
                          variant="outlined"
                          sx={{ fontSize: '0.6rem', height: 18 }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#e0e0e0', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {step.toolName}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" sx={{ color: '#666', fontSize: '0.65rem' }}>
                        {format(parseISO(step.timestamp), 'HH:mm:ss')}
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ color: '#999', fontSize: '0.65rem' }}>
                        {formatDuration(step.durationMs)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <Typography variant="caption" sx={{ color: '#38bdf8' }}>
                      In: {step.inputTokens.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#818cf8' }}>
                      Out: {step.outputTokens.toLocaleString()}
                    </Typography>
                  </Box>

                  {step.toolOutput && (
                    <Box
                      sx={{
                        mt: 1.5,
                        p: 1.5,
                        borderRadius: 1,
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        maxHeight: 120,
                        overflow: 'auto',
                      }}
                    >
                      <Typography
                        variant="caption"
                        component="pre"
                        sx={{
                          color: '#999',
                          fontFamily: 'monospace',
                          fontSize: '0.7rem',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                          m: 0,
                        }}
                      >
                        {typeof step.toolOutput === 'string' ? step.toolOutput : JSON.stringify(step.toolOutput, null, 2)}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
