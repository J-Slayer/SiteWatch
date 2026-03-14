'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/',         label: 'Overview', icon: '📊', exact: true },
  { href: '/reports',  label: 'Reports',  icon: '📋' },
  { href: '/projects', label: 'Projects', icon: '🏗️' },
  { href: '/users',    label: 'Users',    icon: '👥' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

interface SidebarProps {
  user?: User | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  function isActive(item: NavItem) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  const initials =
    user?.user_metadata?.full_name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?';

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? '—';
  const email = user?.email ?? '';

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-64 min-h-screen flex flex-col shrink-0"
      style={{ background: 'linear-gradient(180deg, #0f172a 0%, #0c1e3d 100%)' }}
    >
      {/* Logo — centered, stacked */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex flex-col items-center py-6 px-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <Image
          src="/Logo2.png"
          alt="SiteWatch"
          width={96}
          height={96}
          className="drop-shadow-2xl"
        />
        <p className="text-slate-400 text-xs mt-2 tracking-wide">Admin Dashboard</p>
      </motion.div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item, i) => {
          const active = isActive(item);
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.25 }}
            >
              <Link
                href={item.href}
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                  active
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                {/* Active background pill — amber gradient */}
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 35 }}
                  />
                )}
                <span className="relative text-base">{item.icon}</span>
                <span className="relative">{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate leading-tight">{displayName}</p>
              <p className="text-slate-500 text-xs truncate">{email}</p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full mt-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <span className="text-base">🚪</span>
            Sign Out
          </button>
        </motion.div>
      </div>
    </motion.aside>
  );
}
