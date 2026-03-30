import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface KpiStripProps {
  metrics: Array<{
    label: string;
    value: string;
    color?: string;
  }>;
}

export default function KpiStrip({ metrics }: KpiStripProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        background: 'rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {metrics.map((metric, index) => (
        <Box
          key={metric.label}
          sx={{
            flex: 1,
            textAlign: 'center',
            padding: '12px 16px',
            borderRight:
              index < metrics.length - 1
                ? '1px solid rgba(255,255,255,0.06)'
                : 'none',
          }}
        >
          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 600,
              color: metric.color || '#fff',
              lineHeight: 1.3,
            }}
          >
            {metric.value}
          </Typography>
          <Typography
            sx={{
              fontSize: 9,
              color: '#888',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              lineHeight: 1.5,
            }}
          >
            {metric.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
