'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '../common/Logo';
import { ThemeToggle } from '../common/ThemeToggle';
import {
  Home,
  FileText,
  HelpCircle,
  Folder,
  Trophy,
  ChevronDown,
  Menu,
  LogOut,
  User,
  BookOpen,
  ArrowLeft
} from 'lucide-react';

interface StudentHeaderProps {
  userName?: string;
  onBack?: () => void;
  hideNav?: boolean;
}

export const StudentHeader: React.FC<StudentHeaderProps> = ({ userName: propsUserName, onBack, hideNav }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState<string>(propsUserName || '');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [textSize, setTextSize] = useState<number>(100);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('exammaster_text_scale');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (parsed >= 80 && parsed <= 130) {
          setTextSize(parsed);
          document.documentElement.style.fontSize = `${(parsed / 100) * 16}px`;
        }
      }
    } catch (e) {}
  }, []);

  const changeTextSize = (delta: number) => {
    setTextSize((prev) => {
      const next = Math.min(130, Math.max(80, prev + delta));
      try {
        localStorage.setItem('exammaster_text_scale', String(next));
        document.documentElement.style.fontSize = `${(next / 100) * 16}px`;
      } catch (e) {}
      return next;
    });
  };

  useEffect(() => {
    if (propsUserName) {
      setUserName(propsUserName);
      return;
    }

    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.name) {
          setUserName(data.user.name);
        } else if (data?.user?.email) {
          setUserName(data.user.email.split('@')[0]);
        } else {
          return fetch('/api/dashboard')
            .then((res) => (res.ok ? res.json() : null))
            .then((d) => {
              if (d?.user?.name) setUserName(d.user.name);
            });
        }
      })
      .catch(console.error);
  }, [propsUserName]);

  const displayName = userName || 'Student';

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    router.push('/login');
  };

  const navLinks = [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Mock Tests', href: '/mock-tests', icon: FileText },
    { label: 'Daily Practice', href: '/practice', icon: HelpCircle },
    { label: 'Resources', href: '/resources', icon: Folder },
    { label: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  ];

  useEffect(() => {
    // Prefetch all key student portal routes for instant navigation speed
    navLinks.forEach((link) => {
      try {
        router.prefetch(link.href);
      } catch (e) {}
    });
  }, [router]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/92 dark:bg-slate-900/92 backdrop-blur-md px-4 sm:px-10 shadow-xs transition-all w-full h-16 flex items-center">
        <div className="w-full flex items-center justify-between h-16 relative">
          
          {/* Far Left: Brand Logo + Back Button */}
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="w-9 h-9 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center shadow-xs group"
                title="Back"
                aria-label="Go Back"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white group-hover:-translate-x-0.5 transition-transform" />
              </button>
            )}

            <Link href="/dashboard" prefetch={true} className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5 fill-current stroke-[1.5]" />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                ExamMaster
              </span>
            </Link>
          </div>

          {/* Center: Centered Navigation Bar (Hidden when hideNav is true) */}
          {!hideNav && (
            <nav className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2 h-full">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
                
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch={true}
                    onMouseEnter={() => {
                      try { router.prefetch(link.href); } catch (e) {}
                    }}
                    className={`px-4 h-full text-xs font-bold flex items-center gap-2 transition-all relative border-b-2 ${
                      isActive
                        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-extrabold'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Far Right Actions */}
          <div className="flex items-center gap-2.5">
            {/* Text Size Increase / Decrease Controller — hidden on mobile */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
              <button
                type="button"
                onClick={() => changeTextSize(-5)}
                disabled={textSize <= 80}
                className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center text-[11px] font-black border border-slate-200/60 dark:border-slate-700 shadow-2xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                title="Decrease Text Size (A-)"
              >
                A-
              </button>
              <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-300 px-1 font-mono min-w-[32px] text-center select-none">
                {textSize}%
              </span>
              <button
                type="button"
                onClick={() => changeTextSize(5)}
                disabled={textSize >= 130}
                className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center text-[11px] font-black border border-slate-200/60 dark:border-slate-700 shadow-2xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                title="Increase Text Size (A+)"
              >
                A+
              </button>
            </div>

            <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-0.5 hidden sm:block" />

            {/* Profile User Dropdown Pill */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-1.5 sm:gap-2 p-1 pr-1.5 sm:pr-2.5 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 transition-all border border-slate-200/80 dark:border-slate-800 shadow-xs"
              >
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-xs shadow-xs shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline-block text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                  {displayName}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown — always mounted, animated via CSS */}
              <div
                className={`absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] py-1.5 z-50
                  transition-all duration-200 ease-out origin-top-right
                  ${
                    showProfileMenu
                      ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                      : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                  }`}
              >
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-black text-slate-900 truncate">{displayName}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">Student Account</p>
                </div>

                <Link
                  href="/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User className="w-4 h-4 text-blue-500" /> Profile Settings
                </Link>

                {/* Color Palette Selector in Profile Menu */}
                <div className="px-4 py-2 border-t border-b border-slate-100 bg-slate-50/60">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      Color Palette
                    </span>
                    <Link
                      href="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="text-[10px] text-blue-600 font-extrabold hover:underline"
                    >
                      View All
                    </Link>
                  </div>
                  <div className="flex items-center justify-between gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          localStorage.setItem('exammaster_color_palette', 'default');
                          document.documentElement.setAttribute('data-color-palette', 'default');
                        } catch (e) {}
                      }}
                      className="flex-1 py-1 px-1.5 rounded-lg border border-slate-200 bg-white hover:border-blue-400 flex items-center justify-center gap-1 text-[10px] font-extrabold text-slate-700 transition-all shadow-xs"
                      title="Default Indigo"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]" />
                      Indigo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          localStorage.setItem('exammaster_color_palette', 'emerald');
                          document.documentElement.setAttribute('data-color-palette', 'emerald');
                        } catch (e) {}
                      }}
                      className="flex-1 py-1 px-1.5 rounded-lg border border-slate-200 bg-white hover:border-emerald-400 flex items-center justify-center gap-1 text-[10px] font-extrabold text-slate-700 transition-all shadow-xs"
                      title="Palette 2: Emerald Academy"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
                      Emerald
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          localStorage.setItem('exammaster_color_palette', 'amethyst');
                          document.documentElement.setAttribute('data-color-palette', 'amethyst');
                        } catch (e) {}
                      }}
                      className="flex-1 py-1 px-1.5 rounded-lg border border-slate-200 bg-white hover:border-purple-400 flex items-center justify-center gap-1 text-[10px] font-extrabold text-slate-700 transition-all shadow-xs"
                      title="Palette 3: Royal Amethyst"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
                      Violet
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Persistent Top Height Spacer */}
      <div className="h-16 w-full shrink-0" aria-hidden="true" />
    </>
  );
};
