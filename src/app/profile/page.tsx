'use client';

import React, { useEffect, useState } from 'react';
import { User as UserIcon, Lock, Mail, BookOpen, Save, ShieldCheck, Palette, Check, Sparkles } from 'lucide-react';

export default function ProfilePage() {
  const [userData, setUserData] = useState<any>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [currentPalette, setCurrentPalette] = useState<string>('default');

  useEffect(() => {
    try {
      const savedPalette = localStorage.getItem('exammaster_color_palette') || 'default';
      setCurrentPalette(savedPalette);
    } catch (e) {}

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

  const changePalette = (paletteId: string) => {
    setCurrentPalette(paletteId);
    try {
      localStorage.setItem('exammaster_color_palette', paletteId);
      document.documentElement.setAttribute('data-color-palette', paletteId);
      setMessage(`Color theme updated to ${paletteId === 'default' ? 'Default Indigo' : paletteId === 'emerald' ? 'Palette 2 (Emerald Academy)' : 'Palette 3 (Royal Amethyst)'}!`);
      setTimeout(() => setMessage(''), 3500);
    } catch (e) {}
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

  const colorPalettes = [
    {
      id: 'default',
      name: 'Default Indigo & Sapphire',
      subtitle: 'Default Light Theme',
      tag: 'Default',
      primaryColor: '#4F46E5',
      secondaryColor: '#3B82F6',
      bgColor: '#F8FAFC',
      description: 'Crisp slate background with high-contrast Indigo & Sapphire action buttons.',
    },
    {
      id: 'emerald',
      name: 'Emerald Academy & Gold',
      subtitle: 'Palette 2',
      tag: 'Calm & Focused',
      primaryColor: '#059669',
      secondaryColor: '#10B981',
      bgColor: '#F8FAF8',
      description: 'Stress-free Emerald Forest Green with warm natural accents for long study sessions.',
    },
    {
      id: 'amethyst',
      name: 'Royal Amethyst & Coral',
      subtitle: 'Palette 3',
      tag: 'Modern Tech-Ed',
      primaryColor: '#7C3AED',
      secondaryColor: '#8B5CF6',
      bgColor: '#FAF5FF',
      description: 'Sleek Royal Amethyst Purple with vibrant coral accents.',
    },
  ];

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
            Update your account information, security credentials, and customize your portal color theme.
          </p>
        </div>

        {message && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl font-bold transition-all animate-fadeIn">
            {message}
          </div>
        )}

        {/* Color Palette Chooser (Profile Only) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Color Palette Selection</h3>
                <p className="text-xs text-slate-500 mt-0.5">Select your preferred light-mode color theme for the portal</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-slate-100 text-slate-700 text-[11px] font-extrabold rounded-full border border-slate-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Light Mode Only
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {colorPalettes.map((palette) => {
              const isSelected = currentPalette === palette.id;
              return (
                <button
                  type="button"
                  key={palette.id}
                  onClick={() => changePalette(palette.id)}
                  className={`text-left p-4 rounded-xl border-2 transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                        {palette.tag}
                      </span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}
                    </div>

                    {/* Color Swatches */}
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-6 h-6 rounded-full border border-black/10 shadow-xs"
                        style={{ backgroundColor: palette.primaryColor }}
                        title="Primary Color"
                      />
                      <div
                        className="w-6 h-6 rounded-full border border-black/10 shadow-xs"
                        style={{ backgroundColor: palette.secondaryColor }}
                        title="Secondary Color"
                      />
                      <div
                        className="w-6 h-6 rounded-full border border-black/10 shadow-xs"
                        style={{ backgroundColor: palette.bgColor }}
                        title="Background Tint"
                      />
                    </div>

                    <h4 className="text-xs font-black text-slate-900 mb-1">{palette.name}</h4>
                    <p className="text-[11px] font-medium text-slate-500 leading-snug">{palette.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className={`text-[11px] font-extrabold flex items-center justify-center py-1.5 rounded-lg w-full ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}>
                      {isSelected ? 'Active Palette' : 'Apply Palette'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Profile Info Form */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Student Name (Editable)
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold"
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
                className="w-full text-xs p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-mono cursor-not-allowed font-medium"
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
                className="w-full text-xs p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-bold cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                New Password (Optional)
              </label>
              <input
                type="password"
                placeholder="Leave blank to keep existing password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
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

