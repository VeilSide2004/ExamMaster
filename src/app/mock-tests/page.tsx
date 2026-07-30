'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { StudentHeader } from '@/components/layout/StudentHeader';
import { FileText, Clock, Award, PlayCircle } from 'lucide-react';

export default function MockTestsListPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/mock-tests')
      .then((res) => res.json())
      .then((data) => setTests(data.tests || []))
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
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Full-Length & Sectional Mock Tests</h1>
            <p className="text-xs text-slate-500">
              FR-14: Course-specific timed assessments featuring negative marking, question palette, auto-submission, and cutoff XP bonuses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              <div className="col-span-full p-8 text-center text-xs text-slate-500">Loading available mock tests...</div>
            ) : tests.length === 0 ? (
              <div className="col-span-full p-8 text-center text-xs text-slate-500">No active mock tests configured for your locked course.</div>
            ) : (
              tests.map((test) => (
                <div
                  key={test._id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="p-2.5 bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-300 rounded-lg">
                        <FileText className="w-5 h-5" />
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {test.type === 'full' ? 'Full-Length Test' : 'Sectional Test'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{test.title}</h3>

                    <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800 mb-4">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Duration</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{test.duration_minutes} Mins</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Questions</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{test.question_ids?.length || 0}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">XP Cutoff</span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{test.cutoff_marks} Marks</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/mock-tests/${test._id}`}
                    className="w-full py-2.5 bg-brand-800 hover:bg-brand-900 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <PlayCircle className="w-4 h-4" /> Start Mock Test
                  </Link>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
