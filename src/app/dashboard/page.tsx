'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { StudentHeader } from '@/components/layout/StudentHeader';
import { Star, Clock, Trophy, Play, ChevronRight, Lock, MessageSquare } from 'lucide-react';

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
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-xs text-slate-500">Loading student dashboard...</div>;
  }

  const courseName = userData?.lockedCourse?.name || 'Selected Course';
  const progressPercent = userData?.progressPercent || 0;
  const xpTotal = userData?.xp_total || 0;
  const studentRank = userData?.rank || 1;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <StudentSidebar courseName={courseName} progressPercent={progressPercent} xpTotal={xpTotal} />

      <div className="flex-1 flex flex-col min-w-0">
        <StudentHeader userName={userData?.name || 'Student'} />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto">
          {/* Welcome Banner */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Welcome back, {userData?.name || 'Student'}!
              </h1>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                You're making steady progress in <strong className="text-slate-900 dark:text-white font-extrabold">{courseName}</strong>.
              </p>
            </div>

            {/* Total XP Card */}
            <div className="bg-[#EFF6FF] dark:bg-[#0B1A30] border border-[#BFDBFE] dark:border-[#1E3A8A] rounded-2xl px-5 py-3.5 flex items-center gap-3.5 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#3B82F6] dark:bg-[#10B981] text-white dark:text-slate-950 flex items-center justify-center font-black shrink-0">
                <Star className="w-5 h-5 fill-white dark:fill-slate-950" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#2563EB] dark:text-[#60A5FA] block">TOTAL XP BALANCE</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">{xpTotal.toLocaleString()} XP</span>
              </div>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 Columns: Upcoming Mock Tests */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white dark:bg-[#0B131F] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Available Mock Examinations
                  </h3>
                  <Link href="/mock-tests" className="text-xs font-black text-[#2563EB] dark:text-[#60A5FA] uppercase tracking-wider hover:underline">
                    VIEW ALL TESTS
                  </Link>
                </div>

                <div className="space-y-3">
                  {mockTests.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      No mock examinations published under {courseName} yet. Log into Admin Portal to create a paper!
                    </div>
                  ) : (
                    mockTests.map((test, idx) => (
                      <div key={test._id || idx} className="flex items-center justify-between p-4 bg-slate-50/70 dark:bg-[#0F1D30] border border-slate-200/80 dark:border-slate-800 rounded-xl transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[#0F172A] dark:bg-[#1E293B] text-white font-black text-xs flex items-center justify-center">
                            {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-900 dark:text-white">{test.title}</h4>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                              Duration: {test.duration_minutes} Mins | Cutoff Score: {test.cutoff_marks}
                            </p>
                          </div>
                        </div>

                        <Link
                          href={`/mock-tests/${test._id}`}
                          className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white dark:text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" /> Start Test
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Practice Modules */}
              <div className="bg-white dark:bg-[#0B131F] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Topic Practice Sets</h3>
                  <Link href="/practice" className="text-xs font-black text-[#2563EB] dark:text-[#60A5FA] uppercase tracking-wider hover:underline">
                    EXPLORE QUESTION BANK
                  </Link>
                </div>

                <div className="p-5 bg-slate-50/70 dark:bg-[#0F1D30] border border-slate-200/80 dark:border-slate-800 rounded-xl flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white mb-1">Interactive Topic Practice</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Practice questions topic-by-topic and earn <strong className="text-emerald-600 dark:text-emerald-400">+27 XP</strong> for every correct answer!</p>
                  </div>
                  <Link
                    href="/practice"
                    className="px-4 py-2.5 bg-[#044B3B] dark:bg-[#10B981] hover:opacity-90 text-white dark:text-slate-950 font-black text-xs rounded-xl flex items-center gap-1 transition-all"
                  >
                    Start Practice <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Right 4 Columns: Leaderboard & Course Card */}
            <div className="lg:col-span-4 space-y-6">
              {/* Leaderboard Preview Card */}
              <div className="bg-white dark:bg-[#0B131F] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                {/* Header */}
                <div className="p-5 pb-3 flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                    <Trophy className="w-4 h-4 text-amber-500" /> COURSE LEADERBOARD
                  </h3>
                  <Link href="/leaderboard" className="text-[10px] font-black text-[#2563EB] dark:text-[#60A5FA] uppercase tracking-wider hover:underline">
                    FULL RANK LIST
                  </Link>
                </div>

                {/* Own Rank Pinned Banner */}
                <div className="p-4 bg-gradient-to-r from-[#1E1B4B] to-[#312E81] text-white m-3 rounded-xl flex justify-between items-center shadow-xs">
                  <div>
                    <span className="text-[9px] font-black uppercase opacity-75 block tracking-wider">YOUR CURRENT RANK</span>
                    <span className="text-2xl font-black">#{studentRank}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black uppercase opacity-75 block tracking-wider">TRACK</span>
                    <span className="text-xs font-black truncate max-w-[110px] block">{courseName}</span>
                  </div>
                </div>

                {/* Ranks list */}
                <div className="p-4 pt-1 space-y-2">
                  {leaderboard.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 italic">No leaderboard records yet.</div>
                  ) : (
                    leaderboard.slice(0, 3).map((st, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-3 rounded-xl bg-slate-50/80 dark:bg-[#0F1D30] text-xs font-bold"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center ${
                            idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-950' : 'bg-amber-700 text-white'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">{st.name}</span>
                        </div>
                        <span className="text-slate-500 dark:text-slate-400 font-black text-xs">{st.xp_total || 0} XP</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Floating Chat Assistant Button */}
      <button
        type="button"
        className="fixed bottom-6 right-6 w-12 h-12 rounded-2xl bg-[#044B3B] dark:bg-[#10B981] text-white dark:text-slate-950 flex items-center justify-center shadow-2xl hover:scale-105 transition-transform z-40"
        title="ExamMaster Support Chat"
      >
        <MessageSquare className="w-5 h-5 fill-current" />
      </button>
    </div>
  );
}
