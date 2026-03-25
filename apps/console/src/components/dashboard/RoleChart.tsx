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
  type TooltipProps,
} from 'recharts';
import type { RoleMetric } from '../../api/types.ts';

interface RoleChartProps {
  title: string;
  data: RoleMetric[];
  dataKey: keyof RoleMetric;
  color?: string;
  formatter?: (value: number) => string;
}

function CustomTooltip({ active, payload, label, formatter }: TooltipProps<number, string> & { formatter?: (v: number) => string }) {
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
          {formatter ? formatter(entry.value as number) : entry.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export default function RoleChart({ title, data, dataKey, color = '#4ade80', formatter }: RoleChartProps) {
  const chartData = data.map((d) => ({
    name: d.role.charAt(0).toUpperCase() + d.role.slice(1),
    value: d[dataKey] as number,
  }));

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Typography variant="subtitle2" sx={{ mb: 2, color: '#999', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </Typography>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#999', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
            <Tooltip content={<CustomTooltip formatter={formatter} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
