'use client';

/**
 * Web registration page.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';

const schema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Enter a valid email'),
    companyName: z.string().min(2, 'Company name must be at least 2 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    setServerError('');

    const { error } = await supabase.auth.signUp({
      email: data.email.toLowerCase().trim(),
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          company_name: data.companyName,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (error) {
      setServerError(error.message);
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setIsLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-screen bg-primary-600 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center shadow-xl">
          <span className="text-5xl">✉️</span>
          <h2 className="text-2xl font-bold text-gray-900 mt-4">Check your email</h2>
          <p className="text-gray-500 mt-3 leading-relaxed">
            We sent a confirmation link to your email address. Click it to activate your
            account and get started.
          </p>
          <Link
            href="/login"
            className="inline-block mt-6 bg-primary-600 text-white font-semibold rounded-lg px-6 py-3 text-sm hover:bg-primary-700 transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-600 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-5xl">🦺</span>
          <h1 className="text-3xl font-bold text-white mt-3 tracking-wide">SiteWatch</h1>
          <p className="text-primary-200 mt-1">Create your admin account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Account</h2>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {serverError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                {serverError}
              </div>
            )}

            <FormField label="Full Name" error={errors.fullName?.message}>
              <input
                {...register('fullName')}
                type="text"
                autoComplete="name"
                placeholder="Jane Smith"
                className="input-base"
              />
            </FormField>

            <FormField label="Work Email" error={errors.email?.message}>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="jane@company.com"
                className="input-base"
              />
            </FormField>

            <FormField label="Company / Organization Name" error={errors.companyName?.message}>
              <input
                {...register('companyName')}
                type="text"
                placeholder="Acme Construction Ltd."
                className="input-base"
              />
            </FormField>

            <FormField label="Password" error={errors.password?.message}>
              <input
                {...register('password')}
                type="password"
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                className="input-base"
              />
            </FormField>

            <FormField label="Confirm Password" error={errors.confirmPassword?.message}>
              <input
                {...register('confirmPassword')}
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className="input-base"
              />
            </FormField>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg py-3 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-primary-200 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-white font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {/* Apply base input styles via global CSS class */}
      <div className="[&_input]:w-full [&_input]:border [&_input]:border-gray-300 [&_input]:rounded-lg [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-sm [&_input]:focus:outline-none [&_input]:focus:ring-2 [&_input]:focus:ring-primary-500 [&_input]:focus:border-transparent">
        {children}
      </div>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}
