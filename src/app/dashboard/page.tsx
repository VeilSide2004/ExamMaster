'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StudentHeader } from '@/components/layout/StudentHeader';
import {
  Star,
  ClipboardList,
  Trophy,
  Target,
  Award,
  ArrowRight,
  TrendingUp,
  Play,
  Sparkles,
  BookOpen
} from 'lucide-react';

export default function StudentDashboardPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [mockTests, setMockTests] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => {
        if (res.status === 401) {
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.error === 'Unauthorized') {
          router.push('/login');
          return;
        }
        if (data.needsCourseSelection) {
          router.push('/course-selection');
          return;
        }
        if (data.user) setUserData(data.user);
        if (data.mockTests) setMockTests(data.mockTests);
        if (data.topLeaderboard) setLeaderboard(data.topLeaderboard);
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-xs font-bold text-slate-400">
        Loading ExamMaster Dashboard...
      </div>
    );
  }

  const courseName = userData?.lockedCourse?.name || 'Selected Course';
  const xpTotal = userData?.xp_total || 0;
  const studentRank = userData?.rank || 1;
  const displayName = userData?.name || 'Student';

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Header Navigation */}
      <StudentHeader userName={displayName} />

      {/* Main Page Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8 flex-1">
        
        {/* Top Welcome Header & XP Balance Card */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome back, <span className="text-blue-600 dark:text-blue-400">{displayName}!</span> 👋
            </h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              You&apos;re making steady progress in <strong className="text-blue-600 dark:text-blue-400 font-black">{courseName}</strong>.
            </p>
          </div>

          {/* XP Balance Badge Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 px-6 flex items-center gap-4 shadow-xs">
            <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Star className="w-5 h-5 fill-current stroke-[1]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">TOTAL XP BALANCE</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">{xpTotal.toLocaleString()} XP</span>
            </div>
          </div>
        </div>

        {/* Row 1: Available Mock Examinations & Course Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Row 1 Left: Available Mock Examinations */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ClipboardList className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Available Mock Examinations</h3>
              </div>

              <Link
                href="/mock-tests"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                View all tests <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Test Content / Empty State */}
            {mockTests.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center flex flex-col items-center justify-center my-auto min-h-[180px] space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">No mock examinations published yet</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Log into Admin Portal to create a paper!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 my-auto">
                {mockTests.slice(0, 2).map((test, idx) => (
                  <div
                    key={test._id || idx}
                    className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{test.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        Duration: {test.duration_minutes} mins | Cutoff: {test.cutoff_marks} Marks
                      </p>
                    </div>

                    <Link
                      href={`/mock-tests/${test._id}`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Start Test
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Row 1 Right: Course Leaderboard */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center">
                  <Trophy className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Course Leaderboard</h3>
              </div>

              <Link
                href="/leaderboard"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Full rank list <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Deep Navy Gradient Rank Banner Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-indigo-950 to-blue-900 p-5 text-white shadow-md">
              {/* Subtle wave SVG overlay background */}
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z" fill="white" />
                </svg>
              </div>

              <div className="relative z-10 flex justify-between items-end">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-200/70 block">
                    YOUR CURRENT RANK
                  </span>
                  <span className="text-4xl font-black tracking-tight text-white mt-1 block">
                    #{studentRank}
                  </span>
                </div>

                <div className="text-right max-w-[140px]">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-200/70 block">
                    TRACK
                  </span>
                  <span className="text-xs font-bold text-blue-100 truncate block mt-1">
                    {courseName}
                  </span>
                </div>
              </div>
            </div>

            {/* Leaderboard Entries / Empty Note */}
            <div className="mt-4 text-center">
              {leaderboard.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium py-2">No leaderboard records yet.</p>
              ) : (
                <div className="space-y-2 text-left">
                  {leaderboard.slice(0, 2).map((st, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-slate-800 dark:text-slate-200">{st.name}</span>
                      </div>
                      <span className="text-slate-400 font-extrabold">{st.xp_total || 0} XP</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Topic Practice Sets Banner */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <BookOpen className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Topic Practice Sets</h3>
            </div>

            <Link
              href="/practice"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Explore question bank <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Interactive Topic Practice Soft Blue/Purple Banner */}
          <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/80 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Target className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">Interactive Topic Practice</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                  Practice questions topic-by-topic and earn <strong className="text-blue-600 dark:text-blue-400 font-bold">+27 XP</strong> for every correct answer!
                </p>
              </div>
            </div>

            <Link
              href="/practice"
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all shrink-0"
            >
              Start Practice <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Row 3: Total Experience Bar with Sparkline Graphic */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">TOTAL EXPERIENCE</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">{xpTotal} XP</span>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Keep practicing to level up your skills!
            </p>
          </div>

          {/* Sparkline Graphic Visualization */}
          <div className="w-48 h-12 flex items-center justify-end">
            <svg className="w-full h-full text-blue-500" viewBox="0 0 100 30" fill="none">
              <path
                d="M 0 25 Q 20 22, 40 18 T 80 10 L 95 4"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="95" cy="4" r="3.5" fill="currentColor" />
            </svg>
          </div>
        </div>

      </main>
    </div>
  );
}
