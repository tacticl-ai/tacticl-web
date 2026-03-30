import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useSparkLogs } from '../../hooks/useSparks';
import type { ExecutionLog as ExecutionLogEntry } from '../../api/types';

interface ExecutionLogProps {
  sparkId: string;
}

const MONO_FONT = "'SF Mono', 'Fira Code', monospace";

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return String(tokens);
}

function LogEntry({ entry, index }: { entry: ExecutionLogEntry; index: number }) {
  const totalTokens = entry.tokenUsage.input + entry.tokenUsage.output;
  const isOdd = index % 2 === 1;

  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        background: isOdd ? 'rgba(255,255,255,0.02)' : 'transparent',
        '&:before': { display: 'none' },
        '&.Mui-expanded': { margin: 0 },
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ fontSize: 18, color: '#888' }} />}
        sx={{
          minHeight: 44,
          px: 2,
          '& .MuiAccordionSummary-content': {
            my: 0.75,
            alignItems: 'center',
            gap: 2,
          },
        }}
      >
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: 13,
            fontFamily: MONO_FONT,
            color: '#9D97FF',
          }}
        >
          {entry.toolName}
        </Typography>
        <Typography variant="caption" sx={{ color: '#888', ml: 'auto', mr: 1 }}>
          {formatDuration(entry.durationMs)}
        </Typography>
        <Typography variant="caption" sx={{ color: '#888' }}>
          {formatTokenCount(totalTokens)} tokens
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 2, pt: 0, pb: 1.5 }}>
        <Typography
          variant="caption"
          sx={{ color: '#888', display: 'block', mb: 0.5, fontWeight: 500 }}
        >
          Input
        </Typography>
        <Box
          component="pre"
          sx={{
            fontFamily: MONO_FONT,
            fontSize: 11,
            lineHeight: 1.6,
            background: '#1a1a2e',
            borderRadius: 1,
            p: 1.5,
            mb: 1.5,
            overflow: 'auto',
            maxHeight: 300,
            color: '#ccc',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <code>{JSON.stringify(entry.toolInput, null, 2)}</code>
        </Box>
        <Typography
          variant="caption"
          sx={{ color: '#888', display: 'block', mb: 0.5, fontWeight: 500 }}
        >
          Output
        </Typography>
        <Box
          component="pre"
          sx={{
            fontFamily: MONO_FONT,
            fontSize: 11,
            lineHeight: 1.6,
            background: '#1a1a2e',
            borderRadius: 1,
            p: 1.5,
            overflow: 'auto',
            maxHeight: 300,
            color: '#ccc',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <code>{JSON.stringify(entry.toolOutput, null, 2)}</code>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
          <Typography variant="caption" sx={{ color: '#666' }}>
            In: {formatTokenCount(entry.tokenUsage.input)}
          </Typography>
          <Typography variant="caption" sx={{ color: '#666' }}>
            Out: {formatTokenCount(entry.tokenUsage.output)}
          </Typography>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

export default function ExecutionLog({ sparkId }: ExecutionLogProps) {
  const { data: logs, isLoading } = useSparkLogs(sparkId);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No execution logs yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography
        variant="subtitle2"
        sx={{ px: 2, py: 1.5, color: '#888', fontWeight: 500 }}
      >
        Execution Log ({logs.length} call{logs.length !== 1 ? 's' : ''})
      </Typography>
      {logs.map((entry, index) => (
        <LogEntry key={entry.id} entry={entry} index={index} />
      ))}
    </Box>
  );
}
