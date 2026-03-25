import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

interface KpiCardProps {
  label: string;
  value: string;
  trend?: number;
  trendLabel?: string;
  color?: string;
}

export default function KpiCard({
  label,
  value,
  trend,
  trendLabel = 'vs last period',
  color = '#4ade80',
}: KpiCardProps) {
  const trendColor = trend === undefined || trend === 0
    ? '#999'
    : trend > 0
      ? '#4ade80'
      : '#f87171';

  const TrendIcon = trend === undefined || trend === 0
    ? TrendingFlatIcon
    : trend > 0
      ? TrendingUpIcon
      : TrendingDownIcon;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Typography
          variant="caption"
          sx={{
            color: '#999',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontSize: '0.65rem',
            fontWeight: 600,
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="h4"
          sx={{
            mt: 0.5,
            fontWeight: 700,
            color,
            fontSize: { xs: '1.5rem', md: '2rem' },
            lineHeight: 1.1,
          }}
        >
          {value}
        </Typography>
        {trend !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
            <TrendIcon sx={{ fontSize: 16, color: trendColor }} />
            <Typography variant="caption" sx={{ color: trendColor, fontWeight: 600 }}>
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            </Typography>
            <Typography variant="caption" sx={{ color: '#666', ml: 0.5 }}>
              {trendLabel}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
