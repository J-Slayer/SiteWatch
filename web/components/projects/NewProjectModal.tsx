'use client';

/**
 * NewProjectModal — form to create a new project/site.
 * Submits via Server Action.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Props {
  companyId: string;
  userId: string;
}

export function NewProjectModal({ companyId, userId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get('name') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();
    const location = String(formData.get('location') ?? '').trim();
    const start_date = String(formData.get('start_date') ?? '').trim() || null;

    if (!name) {
      setError('Project name is required.');
      return;
    }

    const supabase = createClient();
    const { error: insertError } = await supabase.from('projects').insert({
      company_id: companyId,
      created_by: userId,
      name,
      description: description || null,
      location: location || null,
      start_date: start_date || null,
      status: 'active',
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setOpen(false);
    startTransition(() => router.refresh());
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
      >
        + New Project
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">
              Create New Project
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Project / Site Name *">
                <input
                  name="name"
                  required
                  placeholder="e.g. Central Station Excavation"
                  className="input-field"
                />
              </Field>

              <Field label="Description">
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Brief overview of the project…"
                  className="input-field resize-none"
                />
              </Field>

              <Field label="Location">
                <input
                  name="location"
                  placeholder="e.g. 123 George St, Sydney"
                  className="input-field"
                />
              </Field>

              <Field label="Start Date">
                <input name="start_date" type="date" className="input-field" />
              </Field>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-primary-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {isPending ? 'Creating…' : 'Create Project'}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 border border-gray-200 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .input-field {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
          transition: box-shadow 0.15s;
        }
        .input-field:focus {
          box-shadow: 0 0 0 2px #2864aa33;
          border-color: #2864aa;
        }
      `}</style>
    </>
  );
}
