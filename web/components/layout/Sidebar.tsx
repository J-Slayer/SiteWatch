'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Overview', icon: '📊', exact: true },
  { href: '/reports', label: 'Reports', icon: '📋' },
  { href: '/projects', label: 'Projects', icon: '🏗️' },
  { href: '/users', label: 'Users', icon: '👥' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export function Sidebar() {
  const pathname = usePathname();

  function isActive(item: NavItem) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  return (
    <aside className="w-64 min-h-screen bg-primary-800 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-primary-700">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🦺</span>
          <div>
            <p className="text-white font-bold text-lg leading-tight">SiteWatch</p>
            <p className="text-primary-300 text-xs">Admin Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive(item)
                ? 'bg-primary-600 text-white'
                : 'text-primary-200 hover:bg-primary-700 hover:text-white'
            )}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Version */}
      <div className="px-6 py-4 border-t border-primary-700">
        <p className="text-primary-400 text-xs">v1.0.0</p>
      </div>
    </aside>
  );
}
