import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { DailyMetricEntry } from '../../api/types.ts';

interface DailyTrendProps {
  title: string;
  data: DailyMetricEntry[];
  lines: Array<{
    dataKey: keyof DailyMetricEntry;
    name: string;
    color: string;
    formatter?: (value: number) => string;
  }>;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string; dataKey: string }>; label?: string }) {
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
          {entry.name}: {entry.dataKey === 'costUsd' ? `$${entry.value.toFixed(2)}` : entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export default function DailyTrend({ title, data, lines }: DailyTrendProps) {
  const chartData = data.map((d) => ({
    ...d,
    dateLabel: format(parseISO(d.date), 'MMM d'),
  }));

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Typography variant="subtitle2" sx={{ mb: 2, color: '#999', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </Typography>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="dateLabel"
              tick={{ fill: '#666', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#666', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, color: '#999' }}
              formatter={(value: string) => <span style={{ color: '#999', fontSize: 11 }}>{value}</span>}
            />
            {lines.map((line) => (
              <Line
                key={String(line.dataKey)}
                type="monotone"
                dataKey={String(line.dataKey)}
                name={line.name}
                stroke={line.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: line.color }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
