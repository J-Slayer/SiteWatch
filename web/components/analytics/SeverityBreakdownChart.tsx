'use client';

/**
 * Horizontal bar chart — report count broken down by severity.
 * Each bar is colour-coded and animates in on mount.
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';

const SEVERITY_COLORS: Record<string, string> = {
  low:      '#16A34A',
  medium:   '#D97706',
  high:     '#EA580C',
  critical: '#DC2626',
};

interface Props {
  data: { severity: string; count: number }[];
}

export function SeverityBreakdownChart({ data }: Props) {
  if (data.length === 0 || data.every((d) => d.count === 0)) {
    return (
      <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
        No data for the last 30 days.
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    name: d.severity.charAt(0).toUpperCase() + d.severity.slice(1),
    fill: SEVERITY_COLORS[d.severity] ?? '#6b7280',
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={formatted}
          layout="vertical"
          margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: '#374151', fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
            formatter={(value: number) => [value, 'Reports']}
            cursor={{ fill: '#f9fafb' }}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={800}>
            {formatted.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
