'use client';

/**
 * AnimatedStatCard — stat card with count-up animation, coloured icon badge,
 * and a top accent border that matches the icon colour.
 */

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  label: string;
  value: number;
  icon: string;
  highlight?: boolean;
  suffix?: string;
  index?: number;
  color?: 'slate' | 'blue' | 'red' | 'amber' | 'green';
}

const COLOR_MAP = {
  slate: {
    icon: 'bg-slate-100 text-slate-600',
    accent: '#64748b',
    value: 'text-slate-800',
  },
  blue: {
    icon: 'bg-blue-100 text-blue-600',
    accent: '#3b82f6',
    value: 'text-blue-700',
  },
  red: {
    icon: 'bg-red-100 text-red-600',
    accent: '#ef4444',
    value: 'text-red-600',
  },
  amber: {
    icon: 'bg-amber-100 text-amber-600',
    accent: '#f59e0b',
    value: 'text-amber-700',
  },
  green: {
    icon: 'bg-green-100 text-green-600',
    accent: '#22c55e',
    value: 'text-green-700',
  },
};

function useCountUp(target: number, duration = 1000) {
  const [count, setCount] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    }

    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);

  return count;
}

export function AnimatedStatCard({
  label,
  value,
  icon,
  highlight = false,
  suffix = '',
  index = 0,
  color = 'slate',
}: Props) {
  const count = useCountUp(value);
  const c = highlight ? COLOR_MAP.red : COLOR_MAP[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      className="rounded-xl bg-white border border-gray-100 p-5 cursor-default select-none shadow-sm hover:shadow-md transition-shadow overflow-hidden relative"
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: c.accent }}
      />

      {/* Icon badge */}
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-xl mb-3 ${c.icon}`}>
        {icon}
      </div>

      <p className={`text-3xl font-bold tabular-nums leading-none ${c.value}`}>
        {count}{suffix}
      </p>
      <p className="text-xs text-gray-500 mt-1.5 font-medium">{label}</p>
    </motion.div>
  );
}
