import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import LinkIcon from '@mui/icons-material/Link';
import { formatDistanceToNow } from 'date-fns';
import { useSpark } from '../../hooks/useSparks';
import { useSparkProgressStore } from '../../hooks/useSparkProgress';
import type { SparkResult, SparkStatus } from '../../api/types';
import KpiStrip from './KpiStrip';
import ExecutionLog from './ExecutionLog';

interface SimpleSparkViewProps {
  sparkId: string;
}

const MONO_FONT = "'SF Mono', 'Fira Code', monospace";

const ACTIVE_STATUSES: SparkStatus[] = ['PENDING', 'ROUTING', 'EXECUTING', 'CHECKPOINT'];

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return String(tokens);
}

function formatCost(cost: number): string {
  return `$${cost.toFixed(2)}`;
}

function formatElapsed(createdAt: string): string {
  return formatDistanceToNow(new Date(createdAt), { addSuffix: false });
}

function SparkResultCard({ result }: { result: SparkResult }) {
  const hasPrs = result.prs && result.prs.length > 0;
  const hasIssues = result.issues && result.issues.length > 0;
  const hasFindings = result.findings && result.findings.length > 0;

  return (
    <Card
      sx={{
        borderLeft: '3px solid',
        borderLeftColor: 'success.main',
        backgroundImage: 'none',
      }}
    >
      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Result
        </Typography>
        {result.summary && (
          <Typography variant="body2" sx={{ mb: 1.5, lineHeight: 1.6 }}>
            {result.summary}
          </Typography>
        )}
        {hasFindings && (
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" sx={{ color: '#888', fontWeight: 500, display: 'block', mb: 0.5 }}>
              Findings
            </Typography>
            {result.findings.map((finding, i) => (
              <Typography
                key={i}
                variant="body2"
                sx={{ color: 'text.secondary', pl: 1.5, position: 'relative', mb: 0.25, '&::before': { content: '"\\2022"', position: 'absolute', left: 0 } }}
              >
                {finding}
              </Typography>
            ))}
          </Box>
        )}
        {hasPrs && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
            {result.prs.map((pr, i) => (
              <Chip
                key={i}
                icon={<LinkIcon sx={{ fontSize: 14 }} />}
                label={pr}
                size="small"
                variant="outlined"
                sx={{ fontSize: 11, height: 24 }}
                component="a"
                href={pr.startsWith('http') ? pr : undefined}
                target="_blank"
                rel="noopener noreferrer"
                clickable={pr.startsWith('http')}
              />
            ))}
          </Box>
        )}
        {hasIssues && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {result.issues.map((issue, i) => (
              <Chip
                key={i}
                icon={<LinkIcon sx={{ fontSize: 14 }} />}
                label={issue}
                size="small"
                variant="outlined"
                color="warning"
                sx={{ fontSize: 11, height: 24 }}
                component="a"
                href={issue.startsWith('http') ? issue : undefined}
                target="_blank"
                rel="noopener noreferrer"
                clickable={issue.startsWith('http')}
              />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function LiveActivityPanel({ sparkId }: { sparkId: string }) {
  const messages = useSparkProgressStore((s) => s.getProgress(sparkId));

  if (messages.length === 0) return null;

  return (
    <Box sx={{ px: 2, py: 1.5 }}>
      <Typography
        variant="subtitle2"
        sx={{ color: '#888', fontWeight: 500, mb: 1 }}
      >
        Live Activity
      </Typography>
      <Box
        sx={{
          background: '#1a1a2e',
          borderRadius: 1,
          border: '1px solid rgba(255,255,255,0.06)',
          p: 1.5,
          maxHeight: 200,
          overflow: 'auto',
          fontFamily: MONO_FONT,
          fontSize: 12,
          lineHeight: 1.7,
        }}
      >
        {messages.map((msg) => (
          <Box
            key={msg.id}
            sx={{
              color:
                msg.type === 'failed'
                  ? '#CF6679'
                  : msg.type === 'completed'
                    ? '#4CAF50'
                    : msg.type === 'checkpoint'
                      ? '#FF9800'
                      : '#ccc',
            }}
          >
            <Typography
              component="span"
              sx={{
                fontFamily: MONO_FONT,
                fontSize: 10,
                color: '#666',
                mr: 1,
              }}
            >
              {new Date(msg.timestamp).toLocaleTimeString()}
            </Typography>
            {msg.message}
            {msg.percent != null && (
              <Typography
                component="span"
                sx={{ fontFamily: MONO_FONT, fontSize: 11, color: '#888', ml: 1 }}
              >
                ({msg.percent}%)
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default function SimpleSparkView({ sparkId }: SimpleSparkViewProps) {
  const { data: spark, isLoading } = useSpark(sparkId);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!spark) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">Spark not found.</Typography>
      </Box>
    );
  }

  const isActive = ACTIVE_STATUSES.includes(spark.status);

  const kpiMetrics = [
    { label: 'Cost', value: formatCost(spark.estimatedCost), color: '#03DAC6' },
    { label: 'Tokens', value: formatTokens(spark.totalTokens) },
    { label: 'Elapsed', value: formatElapsed(spark.createdAt) },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* KPI Strip */}
      <KpiStrip metrics={kpiMetrics} />

      {/* Live Activity (shown only when spark is active) */}
      {isActive && <LiveActivityPanel sparkId={sparkId} />}

      {/* Execution Log */}
      <ExecutionLog sparkId={sparkId} />

      {/* Result Card (shown when completed with result) */}
      {spark.status === 'COMPLETED' && spark.result && (
        <Box sx={{ p: 2 }}>
          <SparkResultCard result={spark.result} />
        </Box>
      )}
    </Box>
  );
}
