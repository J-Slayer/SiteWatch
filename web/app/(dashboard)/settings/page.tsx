/**
 * Settings page — profile editing and company management.
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfileForm } from './ProfileForm';
import { CompanyForm } from './CompanyForm';

export const metadata: Metadata = { title: 'Settings' };

const ROLE_LABELS: Record<string, string> = {
  worker: 'Field Worker',
  supervisor: 'Supervisor',
  company_admin: 'Company Admin',
  super_admin: 'Platform Admin',
};

const ADMIN_ROLES = ['company_admin', 'super_admin'];

export default async function SettingsPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const isAdmin = ADMIN_ROLES.includes(profile?.role ?? '');

  const { data: company } = profile?.company_id
    ? await supabase
        .from('companies')
        .select('id, name, slug, industry, subscription_tier, created_at')
        .eq('id', profile.company_id)
        .single()
    : { data: null };

  const [memberCountResult, projectCountResult] = company
    ? await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', company.id).eq('is_active', true),
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
      ])
    : [{ count: 0 }, { count: 0 }];

  const memberCount = memberCountResult.count ?? 0;
  const projectCount = projectCountResult.count ?? 0;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold text-gray-900"
          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        >
          Settings
        </h1>
        <p className="text-sm text-gray-400 mt-1">Manage your profile and account preferences.</p>
      </div>

      {/* Profile section */}
      <SectionCard icon="👤" title="Profile" subtitle="Your personal information visible to your team.">
        <ProfileForm
          userId={user.id}
          initialValues={{
            full_name: profile?.full_name ?? '',
            job_title: profile?.job_title ?? '',
            phone: profile?.phone ?? '',
          }}
          email={user.email ?? ''}
          role={profile?.role ?? 'worker'}
          roleLabel={ROLE_LABELS[profile?.role ?? ''] ?? profile?.role ?? '—'}
        />
      </SectionCard>

      {/* Company section */}
      {company && (
        <SectionCard
          icon="🏢"
          title="Company"
          subtitle={isAdmin ? 'Manage your organisation settings and view usage.' : 'Your organisation details.'}
        >
          {isAdmin ? (
            <CompanyForm
              companyId={company.id}
              initialValues={{ name: company.name, industry: company.industry ?? '', slug: company.slug }}
              subscriptionTier={company.subscription_tier}
              memberCount={memberCount}
              projectCount={projectCount}
            />
          ) : (
            <div className="space-y-4">
              <InfoRow label="Company Name" value={company.name} />
              {company.industry && <InfoRow label="Industry" value={company.industry} />}
              <InfoRow
                label="Member Since"
                value={new Date(company.created_at).toLocaleDateString('en-AU', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              />
            </div>
          )}
        </SectionCard>
      )}

      {/* Account info */}
      <SectionCard icon="🔑" title="Account" subtitle="Your login and account details.">
        <div className="space-y-4">
          <InfoRow label="Email" value={user.email ?? '—'} />
          <InfoRow label="Account ID" value={user.id.slice(0, 8) + '…'} />
        </div>
      </SectionCard>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      {/* Top accent */}
      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #f59e0b, #ea580c)' }} />
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <h2
            className="font-semibold text-gray-900"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            {title}
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 font-medium">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{value}</span>
    </div>
  );
}
