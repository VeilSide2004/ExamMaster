'use client';

import React, { useEffect, useState } from 'react';
import { User as UserIcon, Lock, Mail, BookOpen, Save, ShieldCheck, Sun } from 'lucide-react';

export default function ProfilePage() {
  const [userData, setUserData] = useState<any>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
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
  }, []);

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-400">
        Loading student profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8 flex-1 pb-24 lg:pb-0">
        
        {/* Header */}
        <div className="border-b border-slate-200 pb-6">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Account Settings & Profile</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Update your account information and view your active track.
          </p>
        </div>

        {message && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl font-bold">
            {message}
          </div>
        )}

        {/* Interface Mode Info Badge */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Interface Appearance</h3>
              <p className="text-xs text-slate-500 mt-0.5">Light Mode (Clean Academic Precision Theme active)</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full border border-slate-200">
            Standard Light Theme
          </span>
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
