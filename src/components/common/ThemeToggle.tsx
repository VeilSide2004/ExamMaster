'use client';

import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { getThemePreference, getResolvedTheme, applyTheme, ThemePreference } from '@/lib/theme';

export const ThemeToggle: React.FC = () => {
  const [pref, setPref] = useState<ThemePreference>('system');
  const [resolved, setResolved] = useState<'light' | 'dark'>('light');

  const updateThemeState = () => {
    const currentPref = getThemePreference();
    const currentResolved = applyTheme(currentPref);
    setPref(currentPref);
    setResolved(currentResolved);
  };

  useEffect(() => {
    updateThemeState();

    const handleThemeChange = () => {
      setPref(getThemePreference());
      setResolved(getResolvedTheme());
    };

    window.addEventListener('exammaster_theme_change', handleThemeChange);

    // Listen for OS system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (getThemePreference() === 'system') {
        updateThemeState();
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
    } else {
      mediaQuery.addListener(handleSystemChange);
    }

    return () => {
      window.removeEventListener('exammaster_theme_change', handleThemeChange);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemChange);
      } else {
        mediaQuery.removeListener(handleSystemChange);
      }
    };
  }, []);

  const toggleTheme = () => {
    const nextPref: ThemePreference = resolved === 'light' ? 'dark' : 'light';
    const nextResolved = applyTheme(nextPref);
    setPref(nextPref);
    setResolved(nextResolved);
  };

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="relative w-14 h-7 bg-slate-200/90 dark:bg-slate-800/90 rounded-full p-0.5 transition-all duration-300 flex items-center justify-between border border-slate-300/80 dark:border-slate-700/80 shadow-inner focus:outline-none select-none group shrink-0"
      title={`Current Theme: ${pref === 'system' ? `System (${resolved})` : pref}. Click to switch to ${resolved === 'light' ? 'Dark' : 'Light'} mode.`}
      aria-label="Toggle theme mode"
    >
      {/* Sun Icon (Left Side - Light) */}
      <span className={`w-6 h-6 flex items-center justify-center transition-colors duration-300 z-10 pl-0.5 ${
        resolved === 'light' ? 'text-amber-500 font-bold' : 'text-slate-400'
      }`}>
        <Sun className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-45" />
      </span>

      {/* Moon Icon (Right Side - Dark) */}
      <span className={`w-6 h-6 flex items-center justify-center transition-colors duration-300 z-10 pr-0.5 ${
        resolved === 'dark' ? 'text-blue-400 font-bold' : 'text-slate-400'
      }`}>
        <Moon className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-rotate-12" />
      </span>

      {/* Sliding Knob Bar - positioned correctly based on resolved theme */}
      <div
        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white dark:bg-slate-900 shadow-md transform transition-transform duration-300 ease-out border border-slate-200/80 dark:border-slate-700/80 ${
          resolved === 'dark' ? 'translate-x-[28px]' : 'translate-x-0'
        }`}
      />
    </button>
  );
};
