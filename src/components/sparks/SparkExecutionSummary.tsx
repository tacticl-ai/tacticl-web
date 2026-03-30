// src/components/sparks/SparkExecutionSummary.tsx
import Typography from '@mui/material/Typography';

interface SparkExecutionSummaryProps {
  totalTokens: number;
  estimatedCost: number;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return String(tokens);
}

export default function SparkExecutionSummary({ totalTokens, estimatedCost }: SparkExecutionSummaryProps) {
  return (
    <Typography variant="caption" color="text.secondary">
      {formatTokens(totalTokens)} tokens &middot; ${estimatedCost.toFixed(2)}
    </Typography>
  );
}
