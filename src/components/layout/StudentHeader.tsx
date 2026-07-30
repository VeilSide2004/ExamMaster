'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '../common/Logo';
import { ThemeToggle } from '../common/ThemeToggle';
import { Bell, HelpCircle, ArrowLeft, Menu, FileText, HelpCircle as HelpIcon, Trophy, LayoutDashboard } from 'lucide-react';

interface StudentHeaderProps {
  userName?: string;
  onBack?: () => void;
}

export const StudentHeader: React.FC<StudentHeaderProps> = ({ userName: propsUserName, onBack }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState<string>(propsUserName || '');

  useEffect(() => {
    if (propsUserName) {
      setUserName(propsUserName);
      return;
    }

    fetch('/api/dashboard')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.name) {
          setUserName(data.user.name);
        } else if (data?.user?.email) {
          const emailPrefix = data.user.email.split('@')[0];
          setUserName(emailPrefix);
        }
      })
      .catch(console.error);
  }, [propsUserName]);

  const displayName = userName || 'Student Account';

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/dashboard');
    }
  };

  const handleToggleSidebar = () => {
    window.dispatchEvent(new Event('toggleStudentSidebar'));
  };

  const navLinks = [
    { label: 'Mock Tests', href: '/mock-tests' },
    { label: 'Resources', href: '#' },
  ];

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-2.5 sm:gap-6">
        {/* Mobile Hamburger Menu Button */}
        <button
          onClick={handleToggleSidebar}
          type="button"
          className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors shadow-xs shrink-0"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Company Logo in Header - ATTACHED ON MOBILE / SMALL SCREENS (< lg) */}
        <div className="lg:hidden flex items-center shrink-0">
          <Logo size={30} />
        </div>

        <button
          onClick={handleBackClick}
          type="button"
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors group shadow-xs shrink-0 flex items-center gap-1 text-xs font-bold"
          title="Go Back to Dashboard"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="hidden sm:inline">Back</span>
        </button>

        {/* Top Navbar Section with Mock Tests & Resources */}
        <nav className="hidden md:flex items-center gap-2 text-xs font-bold">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-[#0B192C] text-white dark:bg-brand-500 dark:text-slate-950 font-extrabold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <ThemeToggle />

        <button
          type="button"
          className="hidden sm:block p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800"
          title="Help & Support"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        {/* User Profile Badge with Real Name */}
        <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/60 p-1.5 pr-3 rounded-full border border-slate-200 dark:border-slate-700">
          <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs shadow-xs">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-extrabold text-slate-900 dark:text-white capitalize">{displayName}</span>
        </div>
      </div>
    </header>
  );
};
