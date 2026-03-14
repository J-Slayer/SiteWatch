'use client';

/**
 * Area chart — daily report volume with critical incidents highlighted.
 */

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

interface DataPoint {
  date: string;
  total: number;
  critical: number;
}

interface Props {
  data: DataPoint[];
}

export function SeverityTrendChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
        No data for the last 30 days.
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    label: format(new Date(d.date), 'MMM d'),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={formatted} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2864AA" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#2864AA" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#DC2626" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          labelStyle={{ color: '#374151', fontWeight: 600 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="total"
          name="All Reports"
          stroke="#2864AA"
          strokeWidth={2}
          fill="url(#colorTotal)"
        />
        <Area
          type="monotone"
          dataKey="critical"
          name="Critical"
          stroke="#DC2626"
          strokeWidth={2}
          fill="url(#colorCritical)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
