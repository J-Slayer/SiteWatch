/**
 * Company settings page — shell for Phase 3 implementation.
 */

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Company Settings</h1>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-10 text-center text-gray-400">
          <p className="text-3xl mb-2">⚙️</p>
          <p className="font-medium text-gray-500">Settings coming in Phase 3</p>
          <p className="text-sm mt-1">
            Company profile, notification preferences, and subscription management.
          </p>
        </div>
      </div>
    </div>
  );
}
