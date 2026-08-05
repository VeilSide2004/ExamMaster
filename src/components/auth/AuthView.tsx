'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/common/Logo';
import { User as UserIcon, Mail, Lock, LogIn, ArrowRight, Quote, Eye, EyeOff } from 'lucide-react';

interface AuthViewProps {
  initialMode?: 'signin' | 'register';
}

export const AuthView: React.FC<AuthViewProps> = ({ initialMode = 'signin' }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>(initialMode);

  // Common Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);

  // Forgot Password Modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [showNewResetPassword, setShowNewResetPassword] = useState(false);
  const [showConfirmResetPassword, setShowConfirmResetPassword] = useState(false);
  const [resetStatus, setResetStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const handleTabSwitch = (mode: 'signin' | 'register') => {
    if (mode === activeTab) return;
    setError('');
    setActiveTab(mode);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', mode === 'signin' ? '/login' : '/register');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await fetch('/api/seed');
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid email or password');
      } else {
        if (!data.user.lockedCourseId) {
          router.push('/course-selection');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

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
        router.push('/course-selection');
      }
    } catch (err) {
      setError('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setGoogleAuthLoading(true);
    try {
      await fetch('/api/seed');
      let googleEmail = email;
      let googleName = name;
      if (!googleEmail) {
        const input = prompt('Enter your Google Account Email:', 'aarav@exammaster.com');
        if (!input) {
          setGoogleAuthLoading(false);
          return;
        }
        googleEmail = input;
      }
      if (!googleName) {
        googleName = googleEmail.split('@')[0];
      }

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: googleEmail, name: googleName }),
      });

      const data = await res.json();
      if (res.ok) {
        if (!data.user.lockedCourseId) {
          router.push('/course-selection');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(data.error || 'Google authentication failed');
      }
    } catch (err: any) {
      setError('Error signing in with Google');
    } finally {
      setGoogleAuthLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newResetPassword !== confirmResetPassword) {
      setResetStatus({ type: 'error', message: 'Passwords do not match' });
      return;
    }
    setResetLoading(true);
    setResetStatus(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, newPassword: newResetPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetStatus({ type: 'success', message: 'Password updated successfully! You can now log in.' });
        setTimeout(() => {
          setEmail(resetEmail);
          setShowForgotModal(false);
        }, 1500);
      } else {
        setResetStatus({ type: 'error', message: data.error || 'Password reset failed' });
      }
    } catch (err: any) {
      setResetStatus({ type: 'error', message: 'Network error resetting password' });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 select-none">
      {/* Left Form Column (Elevated) */}
      <div className="lg:col-span-5 xl:col-span-5 p-6 sm:p-10 lg:p-12 flex flex-col justify-between border-r border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-400/20 dark:shadow-black/80 z-10">
        <div>
          {/* Top Logo */}
          <div className="pt-2">
            <Logo size={40} subtitle="ACADEMIC PRECISION" />
          </div>

          <div className="mt-8 sm:mt-10 w-full max-w-lg mx-auto space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white transition-all duration-200">
                {activeTab === 'signin' ? 'Welcome Back' : 'Create Account'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                {activeTab === 'signin'
                  ? 'Access your dashboard and continue your academic journey.'
                  : 'Create your account to lock your exam course and start practice sets.'}
              </p>
            </div>

            {/* Sliding Pill Navigation Bar */}
            <div className="relative flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-inner max-w-xs select-none">
              <button
                type="button"
                onClick={() => handleTabSwitch('signin')}
                className={`flex-1 py-2 text-center text-xs font-black transition-colors z-10 cursor-pointer ${
                  activeTab === 'signin'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleTabSwitch('register')}
                className={`flex-1 py-2 text-center text-xs font-black transition-colors z-10 cursor-pointer ${
                  activeTab === 'register'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Create Account
              </button>
              {/* Sliding Pill Background Knob */}
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200/80 dark:border-slate-700 transition-all duration-300 ease-out transform-gpu ${
                  activeTab === 'signin' ? 'left-1' : 'left-[calc(50%)]'
                }`}
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs rounded-xl font-bold shadow-xs">
                {error}
              </div>
            )}

            {/* Dynamic Form Content */}
            <div className="transition-opacity duration-200 ease-in-out">
              {activeTab === 'signin' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 text-xs bg-slate-50/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs hover:shadow-sm focus:shadow-md focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15 text-slate-900 dark:text-white font-medium placeholder-slate-400 transition-all"
                        placeholder="name@institution.edu"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(email);
                          setResetStatus(null);
                          setShowForgotModal(true);
                        }}
                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 text-xs bg-slate-50/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs hover:shadow-sm focus:shadow-md focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15 text-slate-900 dark:text-white font-medium placeholder-slate-400 transition-all"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="rememberMe" className="text-xs text-slate-600 dark:text-slate-400 font-medium cursor-pointer">
                      Stay signed in for 30 days
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-xs rounded-xl shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
                  >
                    {loading ? 'Authenticating...' : 'Sign In'}
                    <LogIn className="w-4 h-4" />
                  </button>
                </form>
              ) : (
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
                        className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs hover:shadow-sm focus:shadow-md focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15 text-slate-900 dark:text-white font-medium placeholder-slate-400 transition-all"
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
                        className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs hover:shadow-sm focus:shadow-md focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15 text-slate-900 dark:text-white font-medium placeholder-slate-400 transition-all"
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
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs hover:shadow-sm focus:shadow-md focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15 text-slate-900 dark:text-white font-medium placeholder-slate-400 transition-all"
                        placeholder="At least 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs hover:shadow-sm focus:shadow-md focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15 text-slate-900 dark:text-white font-medium placeholder-slate-400 transition-all"
                        placeholder="Re-enter password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-xs rounded-xl shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
                  >
                    {loading ? 'Creating Account...' : 'Complete Registration'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-[10px] uppercase tracking-wider font-extrabold text-slate-400 shrink-0">
                Or continue with
              </span>
            </div>

            {/* Google Authentication Button */}
            <button
              type="button"
              disabled={googleAuthLoading}
              onClick={handleGoogleAuth}
              className="w-full py-3 px-4 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>
                {googleAuthLoading
                  ? 'Connecting to Google...'
                  : activeTab === 'signin'
                  ? 'Sign in with Google'
                  : 'Sign up with Google'}
              </span>
            </button>

            <div className="text-center pt-2">
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                {activeTab === 'signin' ? "Don't have an account? " : 'Already registered? '}
                <button
                  type="button"
                  onClick={() => handleTabSwitch(activeTab === 'signin' ? 'register' : 'signin')}
                  className="font-extrabold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {activeTab === 'signin' ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
              {activeTab === 'signin' && (
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 shadow-xs">
                  Demo Student: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">aarav@exammaster.com</span> / <span className="font-mono font-bold text-slate-800 dark:text-slate-200">Student@123</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FORGOT PASSWORD MODAL */}
        {showForgotModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Reset Account Password</h3>
                <p className="text-xs text-slate-500">
                  Enter your registered account email and set a new password.
                </p>
              </div>

              {resetStatus && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold ${
                    resetStatus.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                  }`}
                >
                  {resetStatus.message}
                </div>
              )}

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                    Registered Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-600 font-medium"
                    placeholder="student@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewResetPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newResetPassword}
                      onChange={(e) => setNewResetPassword(e.target.value)}
                      className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-600 font-medium"
                      placeholder="At least 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewResetPassword(!showNewResetPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                    >
                      {showNewResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmResetPassword ? 'text' : 'password'}
                      required
                      value={confirmResetPassword}
                      onChange={(e) => setConfirmResetPassword(e.target.value)}
                      className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-600 font-medium"
                      placeholder="Re-enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmResetPassword(!showConfirmResetPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-xs disabled:opacity-50"
                  >
                    {resetLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-8 text-[11px] text-slate-400 font-semibold flex items-center justify-between border-t border-slate-100 dark:border-slate-900 mt-8">
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
        <div
          className="absolute inset-0 bg-cover bg-center opacity-90 transition-transform duration-1000 scale-105"
          style={{
            backgroundImage: `url('/study_hero_bg.png')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/70 via-slate-900/40 to-slate-950/60" />

        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="bg-white/20 dark:bg-slate-900/50 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-3xl p-10 max-w-md shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 dark:bg-slate-800/40 backdrop-blur-md text-white flex items-center justify-center mx-auto border border-white/30">
              <Quote className="w-6 h-6 fill-white text-white" />
            </div>
            <p className="text-lg font-black text-white leading-relaxed tracking-tight drop-shadow-md">
              "Precision in preparation leads to excellence in performance."
            </p>
            <div className="w-12 h-1 bg-blue-500 rounded-full mx-auto pt-0.5" />
          </div>
        </div>

        <div className="absolute bottom-8 right-8 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-white shadow-xs" />
          <span className="w-2 h-2 rounded-full bg-white/40" />
          <span className="w-2 h-2 rounded-full bg-white/40" />
        </div>
      </div>
    </div>
  );
};
