import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import type { FunnelStage } from '../../api/types.ts';

interface PipelineFunnelProps {
  data: FunnelStage[];
}

const FUNNEL_COLORS = [
  '#4ade80',
  '#38bdf8',
  '#818cf8',
  '#f59e0b',
  '#fb923c',
  '#f87171',
];

export default function PipelineFunnel({ data }: PipelineFunnelProps) {
  const maxCount = data.length > 0 ? Math.max(...data.map((s) => s.count)) : 1;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Typography variant="subtitle2" sx={{ mb: 2, color: '#999', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Pipeline Stage Funnel
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {data.map((stage, i) => {
            const pct = (stage.count / maxCount) * 100;
            const color = FUNNEL_COLORS[i % FUNNEL_COLORS.length];
            return (
              <Box key={stage.stage} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography
                  variant="caption"
                  sx={{ color: '#999', fontSize: '0.7rem', minWidth: 80, textAlign: 'right' }}
                >
                  {stage.stage}
                </Typography>
                <Box sx={{ flex: 1, position: 'relative' }}>
                  <Box
                    sx={{
                      height: 24,
                      borderRadius: 1,
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        width: `${pct}%`,
                        backgroundColor: color,
                        borderRadius: 1,
                        transition: 'width 0.6s ease',
                        opacity: 0.8,
                      }}
                    />
                  </Box>
                </Box>
                <Typography
                  variant="caption"
                  sx={{ color: '#e0e0e0', fontWeight: 600, fontSize: '0.75rem', minWidth: 40 }}
                >
                  {stage.count.toLocaleString()}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}
