'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface CompanyFormProps {
  companyId: string;
  initialValues: {
    name: string;
    industry: string;
    slug: string;
  };
  subscriptionTier: string;
  memberCount: number;
  projectCount: number;
}

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  free:       { label: 'Free',       color: 'bg-gray-100 text-gray-600' },
  pro:        { label: 'Pro',        color: 'bg-blue-100 text-blue-700' },
  enterprise: { label: 'Enterprise', color: 'bg-purple-100 text-purple-700' },
};

const TIER_LIMITS: Record<string, { users: number; projects: number }> = {
  free:       { users: 10,  projects: 5 },
  pro:        { users: 50,  projects: 25 },
  enterprise: { users: 999, projects: 999 },
};

export function CompanyForm({
  companyId,
  initialValues,
  subscriptionTier,
  memberCount,
  projectCount,
}: CompanyFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(initialValues.name);
  const [industry, setIndustry] = useState(initialValues.industry);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const isDirty = name !== initialValues.name || industry !== initialValues.industry;

  const tier = TIER_LABELS[subscriptionTier] ?? TIER_LABELS.free;
  const limits = TIER_LIMITS[subscriptionTier] ?? TIER_LIMITS.free;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    const { error } = await supabase
      .from('companies')
      .update({
        name: name.trim(),
        industry: industry.trim() || null,
      })
      .eq('id', companyId);

    setIsSaving(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setSuccessMessage('Company details updated.');
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {/* Subscription banner */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <p className="text-sm font-medium text-gray-900">Current Plan</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {memberCount} / {limits.users === 999 ? 'Unlimited' : limits.users} users ·{' '}
            {projectCount} / {limits.projects === 999 ? 'Unlimited' : limits.projects} projects
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${tier.color}`}>
          {tier.label}
        </span>
      </div>

      {/* Usage bars */}
      <div className="space-y-3">
        <UsageBar
          label="Team Members"
          used={memberCount}
          max={limits.users}
        />
        <UsageBar
          label="Projects"
          used={projectCount}
          max={limits.projects}
        />
      </div>

      {/* Company details form */}
      <form onSubmit={handleSave} className="space-y-4 pt-2 border-t border-gray-100">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Your company name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Industry
          </label>
          <input
            type="text"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="e.g. Construction, Warehousing, Manufacturing"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Slug
          </label>
          <input
            type="text"
            value={initialValues.slug}
            disabled
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-1">Slug cannot be changed after creation.</p>
        </div>

        {successMessage && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <span>✓</span> {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <span>✗</span> {errorMessage}
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isSaving || !isDirty || !name.trim()}
            className="px-5 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

function UsageBar({ label, used, max }: { label: string; used: number; max: number }) {
  const pct = max === 999 ? 0 : Math.min((used / max) * 100, 100);
  const isNearLimit = pct >= 80;

  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span>
        <span className={isNearLimit ? 'text-orange-600 font-medium' : ''}>
          {used} / {max === 999 ? '∞' : max}
        </span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        {max !== 999 && (
          <div
            className={`h-full rounded-full transition-all ${
              isNearLimit ? 'bg-orange-500' : 'bg-primary-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
    </div>
  );
}
