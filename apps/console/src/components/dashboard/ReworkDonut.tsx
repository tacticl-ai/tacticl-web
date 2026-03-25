import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import type { ExitStatusEntry } from '../../api/types.ts';

interface ReworkDonutProps {
  data: ExitStatusEntry[];
}

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: '#4ade80',
  FAILED: '#f87171',
  CANCELLED: '#666666',
  EXECUTING: '#38bdf8',
  PENDING: '#f59e0b',
  ROUTING: '#fbbf24',
  CHECKPOINT: '#fb923c',
};

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { fill: string } }> }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div style={{
      backgroundColor: '#1a1a2e',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 6,
      padding: '8px 12px',
    }}>
      <p style={{ color: entry.payload.fill, margin: 0, fontSize: 12, fontWeight: 600 }}>
        {entry.name}: {entry.value}
      </p>
    </div>
  );
}

export default function ReworkDonut({ data }: ReworkDonutProps) {
  const chartData = data.map((d) => ({
    name: d.status,
    value: d.count,
  }));

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Typography variant="subtitle2" sx={{ mb: 1, color: '#999', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Exit Status Distribution
        </Typography>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#666'} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, color: '#999' }}
              formatter={(value: string) => <span style={{ color: '#999', fontSize: 11 }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
