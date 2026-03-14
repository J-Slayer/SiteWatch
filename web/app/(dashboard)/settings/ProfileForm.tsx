'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ProfileFormProps {
  userId: string;
  initialValues: {
    full_name: string;
    job_title: string;
    phone: string;
  };
  email: string;
  role: string;
  roleLabel: string;
}

export function ProfileForm({
  userId,
  initialValues,
  email,
  roleLabel,
}: ProfileFormProps) {
  const supabase = createClient();

  const [fullName, setFullName] = useState(initialValues.full_name);
  const [jobTitle, setJobTitle] = useState(initialValues.job_title);
  const [phone, setPhone] = useState(initialValues.phone);

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        job_title: jobTitle.trim() || null,
        phone: phone.trim() || null,
      })
      .eq('id', userId);

    setIsSaving(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setSuccessMessage('Profile updated successfully.');
    }
  }

  const isDirty =
    fullName !== initialValues.full_name ||
    jobTitle !== initialValues.job_title ||
    phone !== initialValues.phone;

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {/* Avatar + role row */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
          {fullName?.trim().charAt(0).toUpperCase() ?? email.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-lg leading-tight">
            {fullName || email}
          </p>
          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-primary-100 text-primary-700">
            {roleLabel}
          </span>
        </div>
      </div>

      {/* Email — read only */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email address
        </label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
        />
        <p className="text-xs text-gray-400 mt-1">Email cannot be changed here.</p>
      </div>

      {/* Full name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          placeholder="Your full name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Job title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Job Title
        </label>
        <input
          type="text"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="e.g. Site Supervisor"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. +61 400 000 000"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Feedback */}
      {successMessage && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <span>✓</span>
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <span>✗</span>
          {errorMessage}
        </div>
      )}

      {/* Save button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSaving || !isDirty || !fullName.trim()}
          className="px-5 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
