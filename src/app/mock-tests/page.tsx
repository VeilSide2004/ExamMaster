'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StudentHeader } from '@/components/layout/StudentHeader';
import { FileText, PlayCircle, Sparkles, AlertTriangle, ShieldAlert, RotateCcw, X } from 'lucide-react';

const getInitialMockTestsCache = () => {
  if (typeof window !== 'undefined' && (window as any).__MOCK_TESTS_CACHE__) {
    return (window as any).__MOCK_TESTS_CACHE__;
  }
  return null;
};

export default function MockTestsListPage() {
  const router = useRouter();
  const initialCache = getInitialMockTestsCache();
  const [tests, setTests] = useState<any[]>(initialCache || []);
  const [loading, setLoading] = useState(!initialCache);
  const [filterType, setFilterType] = useState<'all' | 'full' | 'sectional'>('all');

  // Pre-test warning modal state
  const [pendingTestId, setPendingTestId] = useState<string | null>(null);
  const [showPreTestModal, setShowPreTestModal] = useState(false);

  useEffect(() => {
    fetch('/api/mock-tests')
      .then((res) => res.json())
      .then((data) => {
        const list = data.tests || [];
        if (typeof window !== 'undefined') {
          (window as any).__MOCK_TESTS_CACHE__ = list;
        }
        setTests(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredTests = tests.filter((t) => {
    if (filterType === 'all') return true;
    return (t.type || 'full') === filterType;
  });

  const handleStartTest = (testId: string) => {
    setPendingTestId(testId);
    setShowPreTestModal(true);
  };

  const handleConfirmStartTest = () => {
    if (pendingTestId) {
      setShowPreTestModal(false);
      router.push(`/mock-tests/${pendingTestId}`);
    }
  };

  const handleCancelModal = () => {
    setShowPreTestModal(false);
    setPendingTestId(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8 flex-1 animate-page-in pb-24 lg:pb-0">
        
        {/* Page Banner Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <FileText className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Mock Examinations &amp; Assessment Papers
              </h1>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Timed exam simulation with automated scoring, question palette, and XP cutoff bonuses.
            </p>
          </div>

          {/* Filter Pills with Smooth Sliding Background Pill */}
          <div className="relative flex items-center bg-white p-1 rounded-xl border border-slate-200/80 shadow-xs select-none">
            {/* Animated Sliding Background Pill */}
            <div
              className="absolute top-1 bottom-1 rounded-lg bg-blue-600 shadow-xs transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{
                width: 'calc(33.333% - 3px)',
                left: filterType === 'all' ? '4px' : filterType === 'full' ? 'calc(33.333% + 1.5px)' : 'calc(66.666% - 1px)',
              }}
            />

            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`relative z-10 px-3 py-1.5 text-xs transition-colors duration-200 flex-1 text-center ${
                filterType === 'all'
                  ? 'text-white font-black'
                  : 'text-slate-600 hover:text-slate-900 font-bold'
              }`}
            >
              All Tests ({tests.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('full')}
              className={`relative z-10 px-3 py-1.5 text-xs transition-colors duration-200 flex-1 text-center ${
                filterType === 'full'
                  ? 'text-white font-black'
                  : 'text-slate-600 hover:text-slate-900 font-bold'
              }`}
            >
              Full-Length
            </button>
            <button
              type="button"
              onClick={() => setFilterType('sectional')}
              className={`relative z-10 px-3 py-1.5 text-xs transition-colors duration-200 flex-1 text-center ${
                filterType === 'sectional'
                  ? 'text-white font-black'
                  : 'text-slate-600 hover:text-slate-900 font-bold'
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

                <button
                  type="button"
                  onClick={() => handleStartTest(test._id)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  <PlayCircle className="w-4 h-4 fill-current stroke-[1]" /> Start Mock Exam
                </button>
              </div>
            ))
          )}
        </div>

      </main>

      {/* ─── Pre-Test Entry Warning Modal ─── */}
      {showPreTestModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" style={{ background: 'rgba(2,6,23,0.75)', backdropFilter: 'blur(8px)' }}>
          {/* On mobile: bottom sheet style. On sm+: centred card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl relative overflow-hidden flex flex-col"
            style={{ maxHeight: '90vh' }}>

            {/* Drag handle (mobile hint) */}
            <div className="flex justify-center pt-2.5 pb-1 sm:hidden shrink-0">
              <div className="w-8 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={handleCancelModal}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-5 pb-2 pt-3 sm:px-8 sm:pt-6 space-y-4 text-center">

              {/* Icon + title (compact on mobile) */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 tracking-wider">
                    Exam Security Notice
                  </span>
                  <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white mt-1.5 leading-tight">
                    Before You Begin
                  </h2>
                </div>
              </div>

              {/* Rules list — compact rows on mobile */}
              <div className="text-left space-y-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 sm:p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-3 h-3" />
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 leading-snug">
                    <span className="font-black text-slate-900 dark:text-white">No going back</span> once you start the test.
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-3 h-3" />
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 leading-snug">
                    <span className="font-black text-slate-900 dark:text-white">3-strike rule</span> — back presses auto-submit after <span className="text-rose-600 dark:text-rose-400 font-black">3 violations</span>.
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-3 h-3" />
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 leading-snug">
                    <span className="font-black text-slate-900 dark:text-white">Landscape required</span> on mobile — rotate before starting.
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons — always visible at bottom */}
            <div className="flex gap-2 px-5 sm:px-8 py-4 sm:pb-6 shrink-0 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleCancelModal}
                className="flex-1 py-2 sm:py-2.5 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStartTest}
                className="flex-1 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5"
              >
                <PlayCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                I Understand, Start
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
