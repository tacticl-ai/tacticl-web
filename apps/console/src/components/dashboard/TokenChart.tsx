import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { RoleMetric } from '../../api/types.ts';

interface TokenChartProps {
  data: RoleMetric[];
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      backgroundColor: '#1a1a2e',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 6,
      padding: '8px 12px',
    }}>
      <p style={{ color: '#e0e0e0', margin: 0, fontSize: 12, fontWeight: 600 }}>{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color, margin: '4px 0 0', fontSize: 12 }}>
          {entry.name}: {entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

function formatTokenValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toString();
}

export default function TokenChart({ data }: TokenChartProps) {
  const chartData = data.map((d) => ({
    name: d.role.charAt(0).toUpperCase() + d.role.slice(1),
    input: d.inputTokens,
    output: d.outputTokens,
  }));

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Typography variant="subtitle2" sx={{ mb: 2, color: '#999', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Tokens by Role
        </Typography>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#666', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatTokenValue}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#999', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, color: '#999' }}
              formatter={(value: string) => <span style={{ color: '#999', fontSize: 11 }}>{value}</span>}
            />
            <Bar dataKey="input" name="Input" fill="#4ade80" radius={[0, 4, 4, 0]} maxBarSize={12} />
            <Bar dataKey="output" name="Output" fill="#38bdf8" radius={[0, 4, 4, 0]} maxBarSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
