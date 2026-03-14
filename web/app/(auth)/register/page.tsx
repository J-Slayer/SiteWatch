'use client';

/**
 * Register page — split-screen layout matching login, with staggered form animations.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
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

const formVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
        data: { full_name: data.fullName, company_name: data.companyName },
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

  // ── Success state ────────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 p-10 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
            className="text-5xl mb-4"
          >
            ✉️
          </motion.div>
          <h2
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            Check your email
          </h2>
          <p className="text-gray-500 mt-3 leading-relaxed text-sm">
            We sent a confirmation link to your email address. Click it to activate your account
            and get started with SiteWatch.
          </p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Link
              href="/login"
              className="inline-block mt-6 bg-primary-600 text-white font-semibold rounded-xl px-6 py-3 text-sm hover:bg-primary-700 transition-colors"
            >
              Back to Sign In
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ── Register form ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel ─────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[420px] xl:w-1/2 relative overflow-hidden flex-col justify-start items-center pt-8 pb-12 px-12 shrink-0"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #0c1e3d 50%, #0f172a 100%)' }}
      >
        {/* Dot grid texture */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Amber glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-64 rounded-full bg-amber-500/10 blur-3xl" />
        {/* Blue glow */}
        <div className="absolute -top-32 right-0 w-96 h-96 rounded-full bg-blue-600/15 blur-3xl" />

        {/* ── Content ── */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full gap-5">

          {/* Logo + wordmark */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <Image src="/Logo2.png" alt="SiteWatch" width={320} height={320} className="drop-shadow-2xl" />
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
          >
            <h2
              className="text-4xl xl:text-5xl font-extrabold leading-tight text-white"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              Start protecting{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(90deg, #fbbf24, #f97316)' }}
              >
                your team today.
              </span>
            </h2>
            <p className="text-slate-400 mt-4 text-sm leading-relaxed">
              Set up your company, invite your field team, and have incident reporting running in minutes — no IT required.
            </p>
          </motion.div>

          {/* Feature cards */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-2 gap-3 w-full"
          >
            {[
              { icon: '✅', title: 'Free to Start', desc: 'No credit card required' },
              { icon: '📱', title: 'Mobile Ready', desc: 'iOS & Android apps included' },
              { icon: '🏗️', title: 'Field First', desc: 'Designed for on-site use' },
              { icon: '💬', title: 'Easy Onboarding', desc: 'Invite your team by email' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: 0.4 + i * 0.07 }}
                className="rounded-xl p-4 text-left"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <span className="text-xl">{item.icon}</span>
                <p className="text-white text-sm font-semibold mt-2" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
                  {item.title}
                </p>
                <p className="text-slate-500 text-xs mt-0.5 leading-snug">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75 }}
            className="flex items-center justify-center gap-8 pt-2 border-t w-full"
            style={{ borderColor: 'rgba(255,255,255,0.07)' }}
          >
            {[
              { value: '10K+', label: 'Reports filed' },
              { value: '500+', label: 'Active teams' },
              { value: '99.9%', label: 'Uptime' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p
                  className="text-lg font-bold text-white"
                  style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                >
                  {stat.value}
                </p>
                <p className="text-slate-500 text-xs">{stat.label}</p>
              </div>
            ))}
          </motion.div>

        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────── */}
      <div
        className="flex-1 flex items-start lg:items-center justify-center px-10 py-10 overflow-y-auto relative"
        style={{
          backgroundColor: '#f8fafc',
          backgroundImage: 'radial-gradient(circle, #dde3ec 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      >
        {/* Soft glow behind card */}
        <div className="absolute w-96 h-96 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:hidden text-center mb-8"
          >
            <Image src="/Logo2.png" alt="SiteWatch" width={80} height={80} className="mx-auto rounded-2xl" />
            <h1
              className="text-2xl font-extrabold text-gray-900 mt-2"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              SiteWatch
            </h1>
          </motion.div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="bg-white rounded-2xl shadow-2xl shadow-slate-200/80 border border-gray-100/80 border-t-2 border-t-amber-400 p-10 mt-8"
          >
            <div className="mb-6">
              <h2
                className="text-2xl font-bold text-gray-900"
                style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
              >
                Create your account
              </h2>
              <p className="text-gray-500 text-sm mt-1">Get your team reporting in minutes</p>
            </div>

            <motion.form
              variants={formVariants}
              initial="hidden"
              animate="visible"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="space-y-4"
            >
              <AnimatePresence>
                {serverError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm"
                  >
                    {serverError}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div variants={fieldVariants}>
                <InputField
                  label="Full Name"
                  icon="👤"
                  error={errors.fullName?.message}
                  inputProps={{
                    ...register('fullName'),
                    type: 'text',
                    autoComplete: 'name',
                    placeholder: 'Jane Smith',
                  }}
                />
              </motion.div>

              <motion.div variants={fieldVariants}>
                <InputField
                  label="Work Email"
                  icon="✉️"
                  error={errors.email?.message}
                  inputProps={{
                    ...register('email'),
                    type: 'email',
                    autoComplete: 'email',
                    placeholder: 'jane@company.com',
                  }}
                />
              </motion.div>

              <motion.div variants={fieldVariants}>
                <InputField
                  label="Company / Organization"
                  icon="🏗️"
                  error={errors.companyName?.message}
                  inputProps={{
                    ...register('companyName'),
                    type: 'text',
                    placeholder: 'Acme Construction Ltd.',
                  }}
                />
              </motion.div>

              <motion.div variants={fieldVariants}>
                <InputField
                  label="Password"
                  icon="🔑"
                  error={errors.password?.message}
                  showToggle
                  isVisible={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                  inputProps={{
                    ...register('password'),
                    type: showPassword ? 'text' : 'password',
                    autoComplete: 'new-password',
                    placeholder: 'Min. 8 characters',
                  }}
                />
              </motion.div>

              <motion.div variants={fieldVariants}>
                <InputField
                  label="Confirm Password"
                  icon="🔒"
                  error={errors.confirmPassword?.message}
                  showToggle
                  isVisible={showConfirm}
                  onToggle={() => setShowConfirm((v) => !v)}
                  inputProps={{
                    ...register('confirmPassword'),
                    type: showConfirm ? 'text' : 'password',
                    autoComplete: 'new-password',
                    placeholder: '••••••••',
                  }}
                />
              </motion.div>

              <motion.div variants={fieldVariants}>
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.015 }}
                  whileTap={{ scale: isLoading ? 1 : 0.985 }}
                  className="w-full text-white font-semibold rounded-xl py-3.5 text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-1 shadow-lg shadow-amber-200/50"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Creating account…
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </motion.button>
              </motion.div>
            </motion.form>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center text-gray-500 text-sm mt-6"
          >
            Already have an account?{' '}
            <Link href="/login" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
              Sign in
            </Link>
          </motion.p>
        </div>
      </div>
    </div>
  );
}

// ── Shared input component ───────────────────────────────────────────────────

function InputField({
  label,
  icon,
  error,
  inputProps,
  showToggle,
  isVisible,
  onToggle,
}: {
  label: string;
  icon: string;
  error?: string;
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
  showToggle?: boolean;
  isVisible?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base select-none">
          {icon}
        </span>
        <input
          {...inputProps}
          className={`w-full pl-9 ${showToggle ? 'pr-10' : 'pr-3'} py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder:text-gray-400`}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-sm select-none"
          >
            {isVisible ? '🙈' : '👁️'}
          </button>
        )}
      </div>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}
