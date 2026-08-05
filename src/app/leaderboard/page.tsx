'use client';

import React, { useEffect, useState } from 'react';
import { StudentHeader } from '@/components/layout/StudentHeader';
import { Trophy, Star, Award, ShieldCheck, Crown } from 'lucide-react';

const getInitialLeaderboardCache = () => {
  if (typeof window !== 'undefined' && (window as any).__LEADERBOARD_CACHE__) {
    return (window as any).__LEADERBOARD_CACHE__;
  }
  return null;
};

export default function LeaderboardPage() {
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <StudentHeader />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8 flex-1 animate-page-in pb-24 lg:pb-0">
        
        {/* Page Banner Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-500">
                <Trophy className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Course Leaderboard & XP Standings
              </h1>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Ranks are calculated live based on total XP earned in practice sets and mock tests.
            </p>
          </div>
        </div>

        {/* Pinned Own Rank Header Banner (Deep Navy Gradient) */}
        {userRank && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-indigo-950 to-blue-900 p-6 text-white shadow-lg">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z" fill="white" />
              </svg>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-md">
                  #{userRank.rank}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-200/80 block">YOUR OFFICIAL RANKING</span>
                  <h3 className="text-lg font-black text-white">{userRank.name}</h3>
                </div>
              </div>

              <div className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl font-black text-xl flex items-center gap-2 border border-white/15">
                <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                {userRank.xp_total?.toLocaleString()} XP
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
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

      </main>
    </div>
  );
}
