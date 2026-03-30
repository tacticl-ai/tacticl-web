// src/components/sparks/SparkRow.tsx
import { useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Collapse from '@mui/material/Collapse';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { format, formatDistanceToNow, isValid } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import SparkStatusBadge from './SparkStatusBadge';
import RoleProgressBar from './RoleProgressBar';
import SparkExecutionSummary from './SparkExecutionSummary';

function safeTimeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (!isValid(d)) return '';
  return formatDistanceToNow(d, { addSuffix: true }).replace('about ', '');
}

function safeFormat(dateVal: string | number | null | undefined, fmt: string): string {
  if (dateVal == null) return '';
  const d = new Date(dateVal);
  if (!isValid(d)) return '';
  return format(d, fmt);
}
import TacticTimeline from './TacticTimeline';
import CheckpointApproval from './CheckpointApproval';
import { useSparkTactics, useCancelSpark } from '../../hooks/useSparks';
import { useCheckpoints } from '../../hooks/useCheckpoints';
import { useSparkProgressStore } from '../../hooks/useSparkProgress';
import { usePipelineRun } from '../../hooks/usePipeline';
import type { Spark, Device } from '../../api/types';

const EMPTY_PROGRESS: never[] = [];

interface SparkRowProps {
  spark: Spark;
  devices: Device[];
  isExpanded: boolean;
  onToggle: () => void;
}

export default function SparkRow({ spark, devices, isExpanded, onToggle }: SparkRowProps) {
  const navigate = useNavigate();
  const { data: tactics } = useSparkTactics(spark.id);
  const { data: allCheckpoints } = useCheckpoints();
  const cancelSpark = useCancelSpark();
  const progressMessages = useSparkProgressStore((s) => s.sparkProgress[spark.id] ?? EMPTY_PROGRESS);
  const activityEndRef = useRef<HTMLDivElement>(null);

  // Conditionally fetch pipeline data for code/devops sparks
  const isPipelineType = spark.type === 'code' || spark.type === 'devops';
  const isActive = spark.status === 'EXECUTING' || spark.status === 'ROUTING' || spark.status === 'CHECKPOINT';
  const { data: pipelineRun } = usePipelineRun(isPipelineType ? spark.id : undefined);

  const hasPipeline = pipelineRun != null && (pipelineRun.pipelineTier === 'PLAYBOOK' || pipelineRun.pipelineTier === 'FULL_PDLC');

  const displayTactics = tactics ?? [];
  const sparkCheckpoints = (allCheckpoints ?? []).filter((cp) => cp.sparkId === spark.id);
  const pendingCheckpoints = sparkCheckpoints.filter((cp) => !cp.userDecision);
  const device = devices.find((d) => d.id === spark.deviceId);
  const completedTactics = displayTactics.filter((t) => t.status === 'COMPLETED').length;
  const totalTactics = displayTactics.length;
  const showLiveActivity = isActive && progressMessages.length > 0;

  // Priority accent
  const priorityBorder = spark.priority === 'URGENT' ? '#F87171' : spark.priority === 'HIGH' ? '#FBBF24' : null;

  // Device state color
  const stateColors: Record<string, string> = { ONLINE: '#34D399', BUSY: '#FBBF24', OFFLINE: '#44444F' };
  const deviceColor = device ? stateColors[device.state] || stateColors.OFFLINE : '#34D399'; // cloud = always online
  const deviceName = device ? device.name : spark.deviceId ? 'Unknown' : 'Cloud';

  useEffect(() => {
    if (isExpanded) activityEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [progressMessages.length, isExpanded]);

  // Tactic progress
  const progressPercent = totalTactics > 0 ? (completedTactics / totalTactics) * 100 : 0;
  const progressColor = spark.status === 'FAILED' ? '#F87171' : spark.status === 'COMPLETED' ? '#34D399' : progressPercent > 0 ? 'linear-gradient(90deg, #34D399, #6C63FF)' : '#6C63FF';

  return (
    <Box sx={{
      borderBottom: '1px solid', borderBottomColor: 'divider',
      '&:last-child': { borderBottom: 'none' },
    }}>
      {/* Collapsed row */}
      <Box
        onClick={() => navigate(`/sparks/${spark.id}`)}
        sx={{
          display: 'grid',
          gridTemplateColumns: '90px 1fr 130px 120px 70px 80px 36px',
          gap: 0,
          px: 2,
          py: 1.75,
          alignItems: 'center',
          cursor: 'pointer',
          borderLeft: priorityBorder ? `3px solid ${priorityBorder}` : '3px solid transparent',
          transition: 'background 0.15s',
          '&:hover': { bgcolor: 'action.hover' },
          ...(isExpanded && { bgcolor: 'rgba(108, 99, 255, 0.04)' }),
        }}
      >
        <Box><SparkStatusBadge status={spark.status} size="small" /></Box>
        <Box>
          <Typography sx={{ fontSize: 13.5, fontWeight: 500, mb: 0.25 }}>{spark.title}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            {spark.type && (
              <Typography component="span" sx={{ fontSize: 10.5, px: 0.75, py: 0.125, bgcolor: 'rgba(255,255,255,0.04)', borderRadius: '3px', color: 'text.secondary', fontWeight: 500 }}>
                {spark.type}
              </Typography>
            )}
            {hasPipeline && (
              <Chip label={pipelineRun.playbook} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 500, bgcolor: 'rgba(108, 99, 255, 0.12)', color: '#6C63FF' }} />
            )}
            {spark.priority !== 'NORMAL' && (
              <Typography component="span" sx={{ fontSize: 11, fontWeight: 500, color: spark.priority === 'URGENT' ? '#F87171' : spark.priority === 'HIGH' ? '#FBBF24' : 'text.secondary' }}>
                {spark.priority}
              </Typography>
            )}
            {hasPipeline && pipelineRun.currentRole && isActive && (
              <Typography component="span" sx={{ fontSize: 10.5, fontWeight: 600, color: '#6C63FF' }}>
                {pipelineRun.currentRole}
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: deviceColor, flexShrink: 0 }} />
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{deviceName}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {hasPipeline ? (
            <RoleProgressBar
              activatedRoles={pipelineRun.activatedRoles}
              roleResults={pipelineRun.roleResults}
              currentRole={pipelineRun.currentRole}
            />
          ) : isPipelineType && pipelineRun?.pipelineTier === 'SIMPLE' ? (
            <SparkExecutionSummary totalTokens={spark.totalTokens} estimatedCost={spark.estimatedCost} />
          ) : (
            <>
              <Box sx={{ flex: 1, height: 4, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ height: '100%', width: `${progressPercent}%`, background: progressColor, borderRadius: 2, transition: 'width 0.5s ease' }} />
              </Box>
              <Typography sx={{ fontSize: 12, fontFamily: '"JetBrains Mono", monospace', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                {completedTactics}/{totalTactics}
              </Typography>
            </>
          )}
        </Box>
        <Typography sx={{ fontSize: 12.5, fontFamily: '"JetBrains Mono", monospace', color: 'text.secondary' }}>
          ${spark.estimatedCost.toFixed(2)}
        </Typography>
        <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>
          {safeTimeAgo(spark.updatedAt)}
        </Typography>
        <Box
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: isExpanded ? 'primary.light' : 'text.disabled', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none', '&:hover': { color: 'primary.main' } }}
        >
          <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
        </Box>
      </Box>

      {/* Expanded detail */}
      <Collapse in={isExpanded} unmountOnExit>
        <Box sx={{ px: 3, py: 2.5, borderTop: '1px solid', borderTopColor: 'rgba(108,99,255,0.08)', bgcolor: 'rgba(108, 99, 255, 0.02)' }}>
          {/* Tactic Timeline */}
          {displayTactics.length > 0 && (
            <TacticTimeline tactics={displayTactics} checkpoints={sparkCheckpoints} />
          )}

          {/* Pending Checkpoints */}
          {pendingCheckpoints.map((cp) => (
            <Box key={cp.id} sx={{ mt: 1.5 }}>
              <CheckpointApproval checkpoint={cp} />
            </Box>
          ))}

          {/* Live Activity */}
          {showLiveActivity && (
            <Paper sx={{ mt: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.75, py: 1, borderBottom: '1px solid', borderBottomColor: 'divider', bgcolor: 'rgba(0,0,0,0.2)' }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#34D399', animation: 'livePulse 2s ease-in-out infinite', '@keyframes livePulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.4 } } }} />
                <Typography sx={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, color: 'text.secondary' }}>Live Activity</Typography>
              </Box>
              <Box sx={{ maxHeight: 160, overflowY: 'auto', py: 1 }}>
                {progressMessages.map((msg) => (
                  <Box key={msg.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, px: 1.75, py: 0.5 }}>
                    <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'text.disabled', flexShrink: 0, pt: 0.125 }}>
                      {safeFormat(msg.timestamp, 'HH:mm:ss')}
                    </Typography>
                    <Typography sx={{
                      fontSize: 12.5,
                      color: msg.type === 'failed' ? 'error.main' : msg.type === 'completed' ? 'success.main' : 'text.secondary',
                    }}>
                      {msg.message}
                    </Typography>
                  </Box>
                ))}
                <div ref={activityEndRef} />
              </Box>
            </Paper>
          )}

          {/* Spark Result */}
          {spark.result && (
            <Paper sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography sx={{ fontSize: 13, mb: 1 }}>{spark.result.summary}</Typography>
              {spark.result.prs.length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                  {spark.result.prs.map((pr, i) => (
                    <Chip key={i} label={`PR: ${pr.split('/').pop()}`} component="a" href={pr} target="_blank" clickable size="small" sx={{ fontSize: '0.7rem' }} />
                  ))}
                </Box>
              )}
            </Paper>
          )}

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1, mt: 2, pt: 2, borderTop: '1px solid', borderTopColor: 'divider' }}>
            {isActive && (
              <>
                <Button size="small" variant="outlined" color="warning" sx={{ fontSize: 12, textTransform: 'none' }}>
                  Add Checkpoint
                </Button>
                <Button size="small" variant="outlined" color="error" sx={{ fontSize: 12, textTransform: 'none' }} onClick={() => cancelSpark.mutate(spark.id)}>
                  Cancel Spark
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}
