'use client';

/**
 * Login page — split-screen layout with Framer Motion form animations.
 * Left: animated brand panel. Right: staggered form fields.
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

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
type FormData = z.infer<typeof schema>;

// Stagger container for form fields
const formVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    setServerError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email.toLowerCase().trim(),
      password: data.password,
    });
    if (error) {
      setServerError(error.message);
      setIsLoading(false);
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-start items-center pt-8 pb-12 px-12"
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

        {/* Amber glow — bottom centre */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-64 rounded-full bg-amber-500/10 blur-3xl" />
        {/* Blue glow — top right */}
        <div className="absolute -top-32 right-0 w-96 h-96 rounded-full bg-blue-600/15 blur-3xl" />

        {/* ── Content (centred column) ── */}
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
              Keep your team{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(90deg, #fbbf24, #f97316)' }}
              >
                safe on every site.
              </span>
            </h2>
            <p className="text-slate-400 mt-4 text-sm leading-relaxed">
              Real-time incident reporting and safety management built for construction, warehousing, and field teams.
            </p>
          </motion.div>

          {/* Feature cards — 2×2 grid */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-2 gap-3 w-full"
          >
            {[
              { icon: '⚡', title: 'Instant Reports', desc: 'File from mobile in seconds' },
              { icon: '📊', title: 'Live Analytics', desc: 'Severity trends at a glance' },
              { icon: '🔔', title: 'Smart Alerts', desc: 'Notify the right people fast' },
              { icon: '🔒', title: 'Secure & Private', desc: 'Enterprise-grade data safety' },
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
        className="flex-1 flex items-center justify-center px-10 py-12 relative"
        style={{
          backgroundColor: '#f8fafc',
          backgroundImage: 'radial-gradient(circle, #dde3ec 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      >
        {/* Soft glow behind card */}
        <div className="absolute w-96 h-96 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
        <div className="w-full max-w-md relative z-10">
          {/* Mobile-only logo */}
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

          {/* Form card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="bg-white rounded-2xl shadow-2xl shadow-slate-200/80 border border-gray-100/80 border-t-2 border-t-amber-400 p-10 mt-8"
          >
            <div className="mb-7">
              <h2
                className="text-2xl font-bold text-gray-900"
                style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
              >
                Welcome back
              </h2>
              <p className="text-gray-500 text-sm mt-1">Sign in to your dashboard</p>
            </div>

            <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5"
                >
                  {serverError}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.form
              variants={formVariants}
              initial="hidden"
              animate="visible"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="space-y-5"
            >
              {/* Email */}
              <motion.div variants={fieldVariants}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base select-none">
                    ✉️
                  </span>
                  <input
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>
                )}
              </motion.div>

              {/* Password */}
              <motion.div variants={fieldVariants}>
                <div className="flex justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base select-none">
                    🔑
                  </span>
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-sm select-none"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>
                )}
              </motion.div>

              {/* Submit */}
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
                      Signing in…
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </motion.button>
              </motion.div>
            </motion.form>
          </motion.div>

          {/* Sign-up link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="text-center text-gray-500 text-sm mt-6"
          >
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
              Create account
            </Link>
          </motion.p>
        </div>
      </div>
    </div>
  );
}
