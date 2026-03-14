/**
 * Projects & Sites management page.
 */

import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getProjects } from '@/lib/services/projects.service';
import { formatDate } from '@/lib/utils';
import { NewProjectModal } from '@/components/projects/NewProjectModal';

export const metadata: Metadata = { title: 'Projects' };

const STATUS_STYLES: Record<string, { pill: string; dot: string }> = {
  active:    { pill: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  completed: { pill: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400' },
  on_hold:   { pill: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-400' },
  archived:  { pill: 'bg-gray-100 text-gray-400',    dot: 'bg-gray-300' },
};

export default async function ProjectsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user!.id)
    .single();

  const companyId = profile?.company_id;
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

  const projects = await getProjects(companyId);
  const canManage = ['company_admin', 'super_admin', 'supervisor'].includes(profile?.role ?? '');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            Projects & Sites
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canManage && <NewProjectModal companyId={companyId} userId={user!.id} />}
      </div>

      {/* Grid or empty state */}
      {projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-16 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-50 text-3xl mb-3">🏗️</div>
          <p className="font-semibold text-gray-500" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
            No projects yet
          </p>
          {canManage && (
            <p className="text-sm text-gray-400 mt-1">Create your first project to start tracking incidents.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const s = STATUS_STYLES[project.status] ?? STATUS_STYLES.completed;
            return (
              <div
                key={project.id}
                className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
              >
                {/* Top accent */}
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, #f59e0b, #ea580c)' }} />

                <div className="flex items-start justify-between mb-3">
                  <h3
                    className="font-semibold text-gray-900 leading-tight flex-1 pr-3 group-hover:text-amber-600 transition-colors"
                    style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                  >
                    {project.name}
                  </h3>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${s.pill}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    {project.status.replace('_', ' ')}
                  </span>
                </div>

                {project.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{project.description}</p>
                )}

                {project.location && (
                  <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                    📍 {project.location}
                  </p>
                )}

                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                  <Stat label="Members" value={project.member_count} />
                  <Stat label="Reports" value={project.open_reports_count} highlight={project.open_reports_count > 0} />
                  <Stat label="Started" value={project.start_date ? formatDate(project.start_date) : '—'} small />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  small = false,
  highlight = false,
}: {
  label: string;
  value: number | string;
  small?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="text-center">
      <p className={`font-semibold ${small ? 'text-xs' : 'text-sm'} ${highlight ? 'text-amber-600' : 'text-gray-900'}`}>
        {value}
      </p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}
