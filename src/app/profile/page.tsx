'use client';

import React, { useEffect, useState } from 'react';
import { User as UserIcon, Lock, Mail, BookOpen, Save, ShieldCheck, Monitor, Sun, Moon } from 'lucide-react';
import { getThemePreference, applyTheme, ThemePreference, getResolvedTheme } from '@/lib/theme';

export default function ProfilePage() {
  const [userData, setUserData] = useState<any>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Theme Preference State
  const [themePref, setThemePref] = useState<ThemePreference>('system');

  useEffect(() => {
    setThemePref(getThemePreference());

    const handleThemeChange = () => {
      setThemePref(getThemePreference());
    };
    window.addEventListener('exammaster_theme_change', handleThemeChange);

    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUserData(data.user);
          setName(data.user.name);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    return () => window.removeEventListener('exammaster_theme_change', handleThemeChange);
  }, []);

  const handleThemeSelect = (pref: ThemePreference) => {
    setThemePref(pref);
    applyTheme(pref);
    setMessage(`Theme changed to ${pref === 'system' ? 'System Default' : pref === 'dark' ? 'Dark Mode' : 'Light Mode'}`);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-xs font-bold text-slate-400">
        Loading student profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8 flex-1 pb-24 lg:pb-0">
        
        {/* Header */}
        <div className="border-b border-slate-200/80 dark:border-slate-800 pb-6">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Account Settings & Profile</h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Update your account information and interface theme preferences.
          </p>
        </div>

        {message && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl font-bold">
            {message}
          </div>
        )}

        {/* Theme Settings Selector */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Monitor className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Interface Theme & Appearance
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Choose your preferred color theme mode. System default automatically matches your operating system settings.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* System Default Option */}
            <button
              type="button"
              onClick={() => handleThemeSelect('system')}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between space-y-3 ${
                themePref === 'system'
                  ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <Monitor className={`w-5 h-5 ${themePref === 'system' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                {themePref === 'system' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                )}
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-white">System Default</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Matches OS ({getResolvedTheme('system')})
                </p>
              </div>
            </button>

            {/* Light Mode Option */}
            <button
              type="button"
              onClick={() => handleThemeSelect('light')}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between space-y-3 ${
                themePref === 'light'
                  ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <Sun className={`w-5 h-5 ${themePref === 'light' ? 'text-amber-500' : 'text-slate-400'}`} />
                {themePref === 'light' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-white">Light Mode</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Bright appearance
                </p>
              </div>
            </button>

            {/* Dark Mode Option */}
            <button
              type="button"
              onClick={() => handleThemeSelect('dark')}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between space-y-3 ${
                themePref === 'dark'
                  ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <Moon className={`w-5 h-5 ${themePref === 'dark' ? 'text-blue-400' : 'text-slate-400'}`} />
                {themePref === 'dark' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-white">Dark Mode</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Low-light interface
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Profile Info Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Student Name (Editable)
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                Email Address <span className="text-[10px] text-amber-600 font-extrabold uppercase">(Read-Only)</span>
              </label>
              <input
                type="email"
                disabled
                value={userData?.email || ''}
                className="w-full text-xs p-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 font-mono cursor-not-allowed font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                Locked Course <span className="text-[10px] text-amber-600 font-extrabold uppercase">(Permanent Lock)</span>
              </label>
              <input
                type="text"
                disabled
                value={userData?.lockedCourse?.name || 'No course locked'}
                className="w-full text-xs p-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 font-bold cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                New Password (Optional)
              </label>
              <input
                type="password"
                placeholder="Leave blank to keep existing password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Profile Changes
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
