'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/common/Logo';
import { BookOpen, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';

export default function CourseSelectionPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then((meData) => {
        if (!meData || !meData.authenticated) {
          router.push('/login');
          return;
        }
        if (meData.user?.lockedCourse) {
          router.push('/dashboard');
          return;
        }
        return fetch('/api/courses')
          .then((res) => res.json())
          .then((data) => {
            const active = (data.courses || []).filter((c: any) => c.is_active);
            setCourses(active);
            if (active.length > 0) setSelectedCourseId(active[0]._id);
          });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const handleConfirmLock = async () => {
    if (!selectedCourseId) return;
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/course/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: selectedCourseId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to lock course selection');
        setShowConfirmModal(false);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An error occurred');
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCourse = courses.find((c) => c._id === selectedCourseId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <Logo size={44} className="justify-center mb-4" subtitle="MANDATORY COURSE LOCKING" />
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Select Your Preparation Track</h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            FR-06 / RULE-01: You must choose exactly one target course. Once confirmed, this track will be permanently locked to your account.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-lg text-center font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Fetching available courses...</div>
        ) : courses.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl mb-8">
            <BookOpen className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Courses Available Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              No active courses have been created. Please log into the Admin Portal (Port 3001) to add a course!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {courses.map((course) => {
              const isSelected = selectedCourseId === course._id;
              return (
                <div
                  key={course._id}
                  onClick={() => setSelectedCourseId(course._id)}
                  className={`cursor-pointer rounded-xl p-5 border-2 transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-brand-800 bg-brand-50/50 dark:border-brand-500 dark:bg-brand-950/40 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-brand-800 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                        <BookOpen className="w-5 h-5" />
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-brand-800 dark:text-brand-400" />}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{course.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mb-4">{course.description}</p>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-800 pt-3 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Marking Scheme: +{course.marking_scheme?.marks_per_correct || 4} / -{course.marking_scheme?.penalty_per_incorrect || 1}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-col items-center gap-3 border-t border-slate-200 dark:border-slate-800 pt-6">
          <button
            disabled={!selectedCourseId || loading || courses.length === 0}
            onClick={() => setShowConfirmModal(true)}
            type="button"
            className="px-8 py-3 bg-brand-800 hover:bg-brand-900 text-white font-bold text-sm rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Lock className="w-4 h-4" /> Confirm & Permanently Lock Selected Course
          </button>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            Warning: Course selection cannot be edited from your profile after confirmation (RULE-01).
          </p>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedCourse && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-lg text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1">Confirm Permanent Lock</h3>
            <p className="text-xs text-slate-500 mb-4">
              You are selecting <strong className="text-slate-900 dark:text-white">{selectedCourse.name}</strong>. All your practice sets, mock tests, and leaderboard rankings will be permanently scoped to this course.
            </p>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-300 text-xs font-semibold mb-6">
              This choice is irreversible and cannot be changed later.
            </div>

            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmLock}
                className="px-5 py-2 bg-brand-800 hover:bg-brand-900 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Locking...' : 'Yes, Confirm & Lock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
