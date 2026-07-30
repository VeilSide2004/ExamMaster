'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/common/Logo';
import { User as UserIcon, Mail, Lock, ArrowRight, Quote, CheckCircle } from 'lucide-react';

export default function StudentRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await fetch('/api/seed');

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
      } else {
        // FR-01: Automatically logs user in and redirects to Course Selection screen
        router.push('/course-selection');
      }
    } catch (err) {
      setError('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 select-none">
      {/* Left Form Column */}
      <div className="lg:col-span-5 xl:col-span-5 p-6 sm:p-10 lg:p-12 flex flex-col justify-between border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div>
          {/* Top Logo */}
          <div className="pt-2">
            <Logo size={40} subtitle="ACADEMIC PRECISION" />
          </div>

          <div className="mt-8 sm:mt-10 w-full max-w-lg mx-auto space-y-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Create Account
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Create your account to lock your exam course and start practice sets.
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800 text-xs font-black">
              <Link
                href="/login"
                className="pb-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                Sign In
              </Link>
              <span className="pb-2 border-b-2 border-[#044B3B] dark:border-[#10B981] text-[#044B3B] dark:text-[#10B981]">
                Create Account
              </span>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs rounded-xl font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-[#044B3B] dark:focus:border-[#10B981] text-slate-900 dark:text-white font-medium placeholder-slate-400"
                    placeholder="e.g. S. Roy"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-[#044B3B] dark:focus:border-[#10B981] text-slate-900 dark:text-white font-medium placeholder-slate-400"
                    placeholder="student@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-[#044B3B] dark:focus:border-[#10B981] text-slate-900 dark:text-white font-medium placeholder-slate-400"
                    placeholder="Min 8 chars (letters & numbers)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-[#044B3B] dark:focus:border-[#10B981] text-slate-900 dark:text-white font-medium placeholder-slate-400"
                    placeholder="Re-enter password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#044B3B] hover:bg-[#065F46] dark:bg-[#10B981] dark:hover:bg-[#059669] text-white dark:text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {loading ? 'Creating Account...' : 'Complete Registration'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="text-center pt-2">
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Already registered?{' '}
                <Link href="/login" className="font-extrabold text-[#044B3B] dark:text-[#10B981] hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 text-[11px] text-slate-400 font-semibold flex items-center justify-between border-t border-slate-100 dark:border-slate-900 mt-6">
          <span>© 2026 ExamMaster. All rights reserved.</span>
          <div className="flex gap-3">
            <a href="#" className="hover:underline">Privacy</a>
            <span>•</span>
            <a href="#" className="hover:underline">Terms</a>
          </div>
        </div>
      </div>

      {/* Right Hero Image Column with Glassmorphic Quote */}
      <div className="hidden lg:block lg:col-span-7 relative overflow-hidden bg-slate-900">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-90 transition-transform duration-1000 scale-105"
          style={{
            backgroundImage: `url('/study_hero_bg.png')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/70 via-slate-900/40 to-slate-950/60" />

        {/* Center Glassmorphism Quote Card */}
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="bg-white/20 dark:bg-slate-900/50 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-3xl p-10 max-w-md shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 dark:bg-slate-800/40 backdrop-blur-md text-white flex items-center justify-center mx-auto border border-white/30">
              <Quote className="w-6 h-6 fill-white text-white" />
            </div>
            <p className="text-lg font-black text-white leading-relaxed tracking-tight drop-shadow-md">
              "Precision in preparation leads to excellence in performance."
            </p>
            <div className="w-12 h-1 bg-[#10B981] rounded-full mx-auto pt-0.5" />
          </div>
        </div>

        {/* Pagination Dots */}
        <div className="absolute bottom-8 right-8 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-white shadow-xs" />
          <span className="w-2 h-2 rounded-full bg-white/40" />
          <span className="w-2 h-2 rounded-full bg-white/40" />
        </div>
      </div>
    </div>
  );
}
