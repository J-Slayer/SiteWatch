/**
 * User management page — shell for Phase 3 implementation.
 */

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Users' };

export default function UsersPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-10 text-center text-gray-400">
          <p className="text-3xl mb-2">👥</p>
          <p className="font-medium text-gray-500">User management coming in Phase 3</p>
          <p className="text-sm mt-1">
            Invite workers and supervisors, assign roles, and manage team access.
          </p>
        </div>
      </div>
    </div>
  );
}
