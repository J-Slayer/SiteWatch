'use client';

import { motion } from 'framer-motion';

/**
 * PageTransition — wraps page content with a subtle fade + slide-up entrance.
 * Drop this around any page's main content to get consistent transitions.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}
