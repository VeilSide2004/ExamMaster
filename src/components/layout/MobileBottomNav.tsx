'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, HelpCircle, FileText, Trophy, User } from 'lucide-react';

const tabs = [
  { label: 'Home',     href: '/dashboard',  icon: Home },
  { label: 'Practice', href: '/practice',   icon: HelpCircle },
  { label: 'Tests',    href: '/mock-tests', icon: FileText,  isFab: true },
  { label: 'Ranks',    href: '/leaderboard',icon: Trophy },
  { label: 'Profile',  href: '/profile',    icon: User },
];

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();

  // Hide on auth / course-selection pages
  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/course-selection' ||
    pathname === '/'
  ) {
    return null;
  }

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50
        bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl
        border-t border-slate-200/80 dark:border-slate-800/80
        shadow-[0_-4px_24px_rgba(0,0,0,0.10)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.40)]
        flex items-end justify-around px-2 pb-safe"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
    >
      {tabs.map(({ label, href, icon: Icon, isFab }) => {
        const isActive =
          pathname === href ||
          (href !== '/dashboard' && pathname.startsWith(href));

        if (isFab) {
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center -top-4"
            >
              {/* Floating Action Button */}
              <span
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all duration-200
                  ${isActive
                    ? 'bg-blue-700 scale-105 shadow-blue-600/50'
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                  }`}
              >
                <Icon className="w-6 h-6 text-white" strokeWidth={2} />
              </span>
              <span className={`text-[10px] font-bold mt-1 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                {label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 py-2 px-3 min-w-[52px] transition-all duration-150 active:scale-90"
          >
            <span
              className={`w-10 h-8 rounded-xl flex items-center justify-center transition-all duration-200
                ${isActive
                  ? 'bg-blue-50 dark:bg-blue-950/60'
                  : 'bg-transparent'
                }`}
            >
              <Icon
                className={`w-5 h-5 transition-colors duration-200 ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
            </span>
            <span
              className={`text-[10px] font-bold leading-none transition-colors duration-200 ${
                isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
