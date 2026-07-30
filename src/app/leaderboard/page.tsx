'use client';

import React, { useEffect, useState } from 'react';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { StudentHeader } from '@/components/layout/StudentHeader';
import { Trophy, Medal, Star, Award, ShieldCheck } from 'lucide-react';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((res) => res.json())
      .then((data) => {
        setLeaderboard(data.leaderboard || []);
        setUserRank(data.userRank || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <StudentSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <StudentHeader />

        <main className="p-8 space-y-6 flex-1 overflow-y-auto">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Course Leaderboard & XP Standings</h1>
            <p className="text-xs text-slate-500">
              FR-26 / RULE-04: Ranks are strictly scoped to students within your locked target course.
            </p>
          </div>

          {/* Pinned Own Rank Header Banner (FR-27) */}
          {userRank && (
            <div className="bg-brand-800 text-white rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-400 text-slate-950 font-black text-lg flex items-center justify-center shadow-sm">
                  #{userRank.rank}
                </div>
                <div>
                  <h3 className="text-base font-bold">Your Official Ranking</h3>
                  <p className="text-xs text-slate-200">{userRank.name} — Lifetime Accumulated XP</p>
                </div>
              </div>

              <div className="px-5 py-2.5 bg-brand-950/80 rounded-xl font-black text-lg flex items-center gap-2 border border-brand-700">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                {userRank.xp_total?.toLocaleString()} XP
              </div>
            </div>
          )}

          {/* Leaderboard Ranking Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading course leaderboard...</div>
            ) : leaderboard.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No student rankings recorded yet.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4 w-16 text-center">Rank</th>
                    <th className="p-4">Student Name</th>
                    <th className="p-4 text-right">Total XP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {leaderboard.map((student) => {
                    const isTop3 = student.rank <= 3;
                    return (
                      <tr
                        key={student.rank}
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors ${
                          student.isSelf ? 'bg-brand-50/60 dark:bg-brand-950/30 font-bold' : ''
                        }`}
                      >
                        <td className="p-4 text-center font-bold">
                          {student.rank === 1 ? (
                            <span className="w-7 h-7 mx-auto rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                              1
                            </span>
                          ) : student.rank === 2 ? (
                            <span className="w-7 h-7 mx-auto rounded-full bg-slate-300 text-slate-950 flex items-center justify-center font-black">
                              2
                            </span>
                          ) : student.rank === 3 ? (
                            <span className="w-7 h-7 mx-auto rounded-full bg-amber-700 text-white flex items-center justify-center font-black">
                              3
                            </span>
                          ) : (
                            `#${student.rank}`
                          )}
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center">
                              {student.name?.charAt(0)}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white">{student.name}</span>
                              {student.isSelf && (
                                <span className="ml-2 px-2 py-0.5 text-[9px] bg-brand-800 text-white rounded font-bold uppercase">
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-4 text-right font-black text-brand-800 dark:text-brand-300 text-sm">
                          {student.xp_total?.toLocaleString()} XP
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
    </div>
  );
}
