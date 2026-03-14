'use client';

/**
 * Pie chart — incidents broken down by type for the last 30 days.
 */

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { snakeToTitle } from '@/lib/utils';

const COLORS = [
  '#1E3A5F', '#2864AA', '#5383BB', '#7EA2CC', '#FF8C00', '#E67300', '#DC2626',
];

interface Props {
  data: { name: string; value: number }[];
}

export function ReportsByTypeChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
        No data for the last 30 days.
      </div>
    );
  }

  const formatted = data.map((d) => ({ ...d, name: snakeToTitle(d.name) }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={formatted}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
        >
          {formatted.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          formatter={(value) => (
            <span style={{ color: '#374151' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
