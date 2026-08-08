'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StudentHeader } from '@/components/layout/StudentHeader';
import { Trophy, Star, Crown, Lock, Zap, ArrowRight } from 'lucide-react';

const getInitialLeaderboardCache = () => {
  if (typeof window !== 'undefined' && (window as any).__LEADERBOARD_CACHE__) {
    return (window as any).__LEADERBOARD_CACHE__;
  }
  return null;
};

export default function LeaderboardPage() {
  const router = useRouter();
  const initialCache = getInitialLeaderboardCache();
  const [leaderboard, setLeaderboard] = useState<any[]>(initialCache?.leaderboard || []);
  const [userRank, setUserRank] = useState<any>(initialCache?.userRank || null);
  const [loading, setLoading] = useState(!initialCache);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          const cacheObj = {
            leaderboard: data.leaderboard || [],
            userRank: data.userRank || null,
          };
          if (typeof window !== 'undefined') {
            (window as any).__LEADERBOARD_CACHE__ = cacheObj;
          }
          setLeaderboard(data.leaderboard || []);
          setUserRank(data.userRank || null);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Leaderboard is locked when the current user has 0 XP
  const isLocked = !loading && userRank !== null && (userRank.xp_total === 0 || !userRank.xp_total);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8 flex-1 animate-page-in pb-24 lg:pb-0">

        {/* Page Banner Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-500">
                <Trophy className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Course Leaderboard &amp; XP Standings
              </h1>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Ranks are calculated live based on total XP earned in practice sets and mock tests.
            </p>
          </div>
        </div>

        {/* Pinned Own Rank Header Banner */}
        {userRank && (
          <div className="relative overflow-hidden rounded-2xl bg-white border-2 border-blue-100 p-6 text-slate-900 shadow-xs">
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-md">
                  #{userRank.rank}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block">YOUR OFFICIAL RANKING</span>
                  <h3 className="text-lg font-black text-slate-900">{userRank.name}</h3>
                </div>
              </div>

              <div className="px-6 py-3 bg-blue-50 text-blue-700 rounded-2xl font-black text-xl flex items-center gap-2 border border-blue-200/80">
                <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                {userRank.xp_total?.toLocaleString() || 0} XP
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table Card — with blur lock for 0-XP users */}
        <div className="relative">
          {/* ── The actual table (always rendered, blurred when locked) ── */}
          <div
            className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs transition-all duration-500 ${
              isLocked ? 'blur-sm pointer-events-none select-none' : ''
            }`}
            aria-hidden={isLocked}
          >
            {loading ? (
              <div className="py-16 text-center text-xs font-bold text-slate-400">Loading course leaderboard...</div>
            ) : leaderboard.length === 0 ? (
              <div className="py-16 text-center text-xs font-bold text-slate-400">No student rankings recorded yet.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4 pl-6 w-20 text-center">Rank</th>
                    <th className="p-4">Student Name</th>
                    <th className="p-4 pr-6 text-right">Total XP Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
                  {leaderboard.map((student) => {
                    const isTop3 = student.rank <= 3;
                    return (
                      <tr
                        key={student.rank}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          student.isSelf ? 'bg-blue-50/60 dark:bg-blue-950/30 font-bold' : ''
                        }`}
                      >
                        <td className="p-4 pl-6 text-center font-bold">
                          {student.rank === 1 ? (
                            <span className="w-7 h-7 mx-auto rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-xs">
                              <Crown className="w-4 h-4 fill-current" />
                            </span>
                          ) : student.rank === 2 ? (
                            <span className="w-7 h-7 mx-auto rounded-full bg-slate-300 text-slate-950 flex items-center justify-center font-black shadow-xs">
                              2
                            </span>
                          ) : student.rank === 3 ? (
                            <span className="w-7 h-7 mx-auto rounded-full bg-amber-700 text-white flex items-center justify-center font-black shadow-xs">
                              3
                            </span>
                          ) : (
                            <span className="font-extrabold text-slate-400">#{student.rank}</span>
                          )}
                        </td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {student.name}
                          {student.isSelf && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                              YOU
                            </span>
                          )}
                        </td>
                        <td className="p-4 pr-6 text-right font-black text-slate-900 dark:text-white text-sm">
                          {student.xp_total?.toLocaleString() || 0} XP
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Locked overlay — shown only for 0-XP students ── */}
          {isLocked && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl"
              style={{ background: 'rgba(248,250,252,0.55)', backdropFilter: 'blur(2px)' }}>

              {/* Lock card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center space-y-5">

                {/* Animated lock icon */}
                <div className="relative w-20 h-20 mx-auto">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-400/30">
                    <Lock className="w-9 h-9 text-white" strokeWidth={2.5} />
                  </div>
                  {/* Pulse ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-amber-400/40 animate-ping" />
                </div>

                <div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 tracking-wider">
                    Leaderboard Locked
                  </span>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white mt-3 leading-tight">
                    Earn your first XP<br />to unlock rankings
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    The leaderboard is only visible to students who have earned at least <span className="font-black text-amber-600">1 XP</span>. Start practising to claim your spot!
                  </p>
                </div>

                {/* XP progress hint */}
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] font-black text-slate-900 dark:text-white">Your XP: 0</p>
                    <p className="text-[10px] text-slate-500">Answer 1 question to unlock</p>
                  </div>
                  <div className="ml-auto w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full w-0 bg-amber-400 rounded-full" />
                  </div>
                </div>

                {/* Unlock button → redirects to practice */}
                <button
                  type="button"
                  onClick={() => router.push('/practice')}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm rounded-xl shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Zap className="w-4 h-4" />
                  Go Practice &amp; Earn XP
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  Each correct answer earns XP · Rankings update instantly
                </p>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
