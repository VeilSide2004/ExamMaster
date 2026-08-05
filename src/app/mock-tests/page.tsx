'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { StudentHeader } from '@/components/layout/StudentHeader';
import { FileText, Clock, Award, PlayCircle, Filter, Sparkles, CheckCircle2 } from 'lucide-react';

let cachedMockTests: any[] | null = null;

export default function MockTestsListPage() {
  const [tests, setTests] = useState<any[]>(cachedMockTests || []);
  const [loading, setLoading] = useState(!cachedMockTests);
  const [filterType, setFilterType] = useState<'all' | 'full' | 'sectional'>('all');

  useEffect(() => {
    fetch('/api/mock-tests')
      .then((res) => res.json())
      .then((data) => {
        const list = data.tests || [];
        cachedMockTests = list;
        setTests(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredTests = tests.filter((t) => {
    if (filterType === 'all') return true;
    return (t.type || 'full') === filterType;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <StudentHeader />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8 flex-1 animate-page-in">
        
        {/* Page Banner Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <FileText className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Mock Examinations & Assessment Papers
              </h1>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Timed exam simulation with automated scoring, question palette, and XP cutoff bonuses.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All Tests ({tests.length})
            </button>
            <button
              onClick={() => setFilterType('full')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filterType === 'full'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Full-Length
            </button>
            <button
              onClick={() => setFilterType('sectional')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filterType === 'sectional'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Sectional
            </button>
          </div>
        </div>

        {/* Tests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <>
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 h-52 animate-pulse space-y-4 shadow-xs">
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl pt-4" />
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 h-52 animate-pulse space-y-4 shadow-xs">
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl pt-4" />
              </div>
            </>
          ) : filteredTests.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-500 flex items-center justify-center">
                <FileText className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">No Mock Tests Available</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                No mock tests match your current filter. Check back soon or visit the Admin Portal to publish papers!
              </p>
            </div>
          ) : (
            filteredTests.map((test) => (
              <div
                key={test._id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-800 transition-all space-y-5"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold uppercase tracking-wider">
                      {test.type === 'sectional' ? 'Sectional Paper' : 'Full Mock Exam'}
                    </span>
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> +50 XP
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">{test.title}</h3>

                  <div className="grid grid-cols-3 gap-3 text-center bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 mt-4">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Duration</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5 block">{test.duration_minutes} Mins</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Questions</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5 block">{test.question_ids?.length || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Cutoff</span>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">{test.cutoff_marks || 0} Marks</span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/mock-tests/${test._id}`}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  <PlayCircle className="w-4 h-4 fill-current stroke-[1]" /> Start Mock Exam
                </Link>
              </div>
            ))
          )}
        </div>

      </main>
    </div>
  );
}
