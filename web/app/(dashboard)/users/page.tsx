/**
 * User management page — lists all company users and pending invitations.
 */

import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getUsers, getInvitations } from '@/lib/services/users.service';
import { RoleBadge } from '@/components/ui/badges';
import { formatDate, timeAgo } from '@/lib/utils';
import { InviteUserModal } from '@/components/users/InviteUserModal';

export const metadata: Metadata = { title: 'Users' };

export default async function UsersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user!.id)
    .single();

  const companyId = currentProfile?.company_id;
  if (!companyId) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 max-w-lg">
          <h2 className="font-semibold text-yellow-800 mb-1">No company linked</h2>
          <p className="text-yellow-700 text-sm">Your account is not associated with a company.</p>
        </div>
      </div>
    );
  }

  const canManage = ['company_admin', 'super_admin'].includes(currentProfile?.role ?? '');

  const [users, invitations] = await Promise.all([
    getUsers(companyId),
    canManage ? getInvitations(companyId) : Promise.resolve([]),
  ]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            User Management
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {users.length} member{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canManage && <InviteUserModal companyId={companyId} invitedBy={user!.id} />}
      </div>

      {/* Team members table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <span className="text-base">👥</span>
          <h2
            className="text-sm font-semibold text-gray-800"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            Team Members
          </h2>
          <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
            {users.length}
          </span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Role</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Job Title</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Last Active</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => {
              const initials = u.full_name
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              return (
                <tr key={u.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                        style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
                      >
                        {initials}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {u.full_name}
                          {u.id === user!.id && (
                            <span className="ml-2 text-xs text-gray-400 font-normal">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{u.email ?? ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-4 text-gray-500 text-sm hidden lg:table-cell">
                    {u.job_title ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-4 text-gray-400 text-xs hidden sm:table-cell">
                    {u.last_seen_at ? timeAgo(u.last_seen_at) : 'Never'}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                      u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pending invitations */}
      {canManage && invitations.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <span className="text-base">✉️</span>
            <h2
              className="text-sm font-semibold text-gray-800"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              Pending Invitations
            </h2>
            <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              {invitations.length}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invitations.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50/70">
                  <td className="px-5 py-3 text-gray-700 font-medium">{inv.email}</td>
                  <td className="px-4 py-3"><RoleBadge role={inv.role} /></td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">{formatDate(inv.expires_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
