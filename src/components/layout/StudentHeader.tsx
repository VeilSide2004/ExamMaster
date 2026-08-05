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
    { label: 'Resources', href: '/practice?tab=resources', icon: Folder },
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
    <header className="border-b border-slate-200/90 dark:border-slate-800/90 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md backdrop-saturate-150 px-6 sm:px-10 sticky top-0 z-40 shadow-xl shadow-slate-300/60 dark:shadow-black/90 transition-all w-full">
      <div className="w-full flex items-center justify-between h-16 relative">
        
        {/* Far Left: Brand Logo + Back Button */}
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center shadow-xs group"
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

          <div className="hidden sm:block"><ThemeToggle /></div>

          <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-0.5 hidden sm:block" />

          {/* Profile User Dropdown Pill */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1 pr-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800"
            >
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-xs shadow-xs">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                {displayName}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown — always mounted, animated via CSS */}
            <div
              className={`absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-50
                transform-gpu transition-all duration-200 ease-out origin-top-right
                ${
                  showProfileMenu
                    ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                }`}
            >
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-black text-slate-900 dark:text-white truncate">{displayName}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">Student Account</p>
              </div>
              <Link
                href="/profile"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <User className="w-4 h-4 text-blue-500" /> Profile Settings
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-t border-slate-100 dark:border-slate-800 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

    </header>
  );
};
