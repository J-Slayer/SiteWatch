'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface HeaderProps {
  user: User | null;
  pageTitle?: string;
}

export function Header({ user, pageTitle }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const initials =
    user?.user_metadata?.full_name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <header className="h-16 bg-white border-b border-gray-100 shadow-sm flex items-center justify-between px-6 shrink-0">
      {pageTitle ? (
        <h1
          className="text-lg font-semibold text-gray-900"
          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        >
          {pageTitle}
        </h1>
      ) : <div />}

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
          🔔
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200" />

        {/* User info + avatar */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-800 leading-tight">
              {user?.user_metadata?.full_name ?? user?.email ?? '—'}
            </p>
            <p className="text-xs text-gray-400">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
          >
            {initials}
          </button>
        </div>
      </div>
    </header>
  );
}
