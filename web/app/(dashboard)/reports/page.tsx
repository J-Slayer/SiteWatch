/**
 * Reports list page.
 * Full implementation in Phase 3 — this is the shell.
 */

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Reports' };

export default function ReportsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Incident Reports</h1>
        {/* Filters — Phase 3 */}
      </div>

      {/* Reports table — Phase 3 */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-10 text-center text-gray-400">
          <p className="text-3xl mb-2">📋</p>
          <p className="font-medium text-gray-500">Reports table coming in Phase 3</p>
          <p className="text-sm mt-1">
            Full filtering, sorting, search, and PDF export will be added.
          </p>
        </div>
      </div>
    </div>
  );
}
