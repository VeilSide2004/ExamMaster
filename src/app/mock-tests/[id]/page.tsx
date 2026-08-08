'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Logo } from '@/components/common/Logo';
import { HindiTranslateButton } from '@/components/common/HindiTranslateButton';
import {
  Clock, Bookmark, ChevronLeft, ChevronRight, CheckCircle2, Award,
  AlertTriangle, ShieldCheck, ShieldAlert, RotateCcw
} from 'lucide-react';

export default function MockTestExecutionPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const routeParams = useParams();
  const testId = (params?.id || routeParams?.id) as string;

  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Question Response State
  const [userState, setUserState] = useState<Record<string, { selectedOption: number | null; isMFR: boolean; isVisited: boolean }>>({});

  // Timer State (in seconds)
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<any>(null);

  // Submission & Result State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Hindi Translation State
  const [hindiTranslations, setHindiTranslations] = useState<Record<string, { question: string; options: string[] } | null>>({});

  // ─── Back-Navigation Lock State ───
  const [backPressCount, setBackPressCount] = useState(0);
  const [showBackWarning, setShowBackWarning] = useState(false);
  const backPressCountRef = useRef(0); // ref for use inside event listener

  // ─── Landscape / Portrait State ───
  const [isPortrait, setIsPortrait] = useState(false);

  const handleMockTranslated = useCallback((qId: string, texts: string[]) => {
    setHindiTranslations((prev) => ({
      ...prev,
      [qId]: { question: texts[0] || '', options: texts.slice(1) },
    }));
  }, []);

  const handleMockResetTranslation = useCallback((qId: string) => {
    setHindiTranslations((prev) => ({ ...prev, [qId]: null }));
  }, []);

  useEffect(() => {
    if (!testId) return;

    fetch(`/api/mock-tests/${testId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          alert(data.error);
          router.push('/dashboard');
          return;
        }

        const rawQuestions = Array.isArray(data.test?.question_ids) ? data.test.question_ids : [];
        const normalizedQuestions = rawQuestions.map((q: any, idx: number) => {
          if (typeof q === 'string') {
            return {
              _id: q,
              question_text: `Question ${idx + 1}`,
              options: ['Option A', 'Option B', 'Option C', 'Option D'],
              correct_option: 0,
              topic_tag: 'General',
            };
          }
          return {
            ...q,
            _id: q._id || q.id || `q_${idx}`,
            question_text: q.question_text || `Question ${idx + 1}`,
            options: Array.isArray(q.options) && q.options.length > 0 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
            correct_option: typeof q.correct_option === 'number' ? q.correct_option : 0,
            topic_tag: q.topic_tag || 'General',
          };
        }).filter(Boolean);

        const testData = {
          ...data.test,
          question_ids: normalizedQuestions,
        };

        setTest(testData);

        // Initialize state for each question
        const initial: Record<string, any> = {};
        normalizedQuestions.forEach((q: any, i: number) => {
          if (q && q._id) {
            initial[q._id] = { selectedOption: null, isMFR: false, isVisited: i === 0 };
          }
        });
        setUserState(initial);

        // Set timer (duration in minutes * 60)
        setTimeLeft((data.test?.duration_minutes || 60) * 60);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [testId, router]);

  // Fullscreen Lockdown State
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [showLockWarning, setShowLockWarning] = useState(false);

  const enterFullscreen = () => {
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => {});
      } else if ((docEl as any).webkitRequestFullscreen) {
        try { (docEl as any).webkitRequestFullscreen(); } catch (e) {}
      } else if ((docEl as any).msRequestFullscreen) {
        try { (docEl as any).msRequestFullscreen(); } catch (e) {}
      }
    } catch (e) {
      console.error(e);
    }
  };

  const exitFullscreen = () => {
    try {
      if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if ((document as any).webkitExitFullscreen) {
          try { (document as any).webkitExitFullscreen(); } catch (e) {}
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ─── Force Landscape on Mobile ───
  useEffect(() => {
    const tryLockLandscape = async () => {
      try {
        if (screen?.orientation && typeof (screen.orientation as any).lock === 'function') {
          await (screen.orientation as any).lock('landscape');
        }
      } catch (e) {
        // Not supported or user denied — fall back to CSS overlay
      }
    };

    tryLockLandscape();

    const checkOrientation = () => {
      const isMobile = window.innerWidth <= 900 || ('ontouchstart' in window);
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(isMobile && portrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
      try {
        if (screen?.orientation && typeof (screen.orientation as any).unlock === 'function') {
          (screen.orientation as any).unlock();
        }
      } catch (e) {}
    };
  }, []);

  // ─── Back Navigation Lock ───
  useEffect(() => {
    if (!test || result) return;

    // Push a dummy state so there's always a "back entry" to intercept
    window.history.pushState({ mockTestLock: true }, '', window.location.href);

    const handlePopState = (e: PopStateEvent) => {
      // Re-push the dummy state so back is always intercepted
      window.history.pushState({ mockTestLock: true }, '', window.location.href);

      backPressCountRef.current += 1;
      const newCount = backPressCountRef.current;
      setBackPressCount(newCount);

      if (newCount >= 3) {
        // 3rd violation → auto-submit
        handleFinalSubmit('auto');
      } else {
        // Show warning modal (1st or 2nd)
        setShowBackWarning(true);
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [test, result]);

  // Fullscreen & Lockdown Security Listener
  useEffect(() => {
    if (!test || result) return;

    // Request Initial Fullscreen
    enterFullscreen();

    const handleFullscreenChange = () => {
      const fsEl = document.fullscreenElement || (document as any).webkitFullscreenElement;
      if (!fsEl && !result) {
        setIsFullscreen(false);
        setShowLockWarning(true);
      } else {
        setIsFullscreen(true);
        setShowLockWarning(false);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Mock examination is locked in progress. Exiting will discard your answers.';
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [test, result]);

  // Live Timer Countdown Effect
  useEffect(() => {
    if (!test || result) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleFinalSubmit('auto');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [test, result]);

  const questions: any[] = test?.question_ids || [];
  const currentQ = questions[currentIdx] || null;

  const courseSubjects: string[] = test?.course_id?.subjects || ['Physics', 'Chemistry', 'Mathematics', 'Biology'];

  const getQuestionSubjectAndTopic = (q: any) => {
    if (!q) return { subject: 'General', topic: '' };
    const tag = (q.topic_tag || '').trim();
    let subject = 'General';
    let topic = tag;

    for (const s of courseSubjects) {
      if (s && tag.toLowerCase().includes(s.toLowerCase())) {
        subject = s;
        try {
          const escapedS = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const rest = tag.replace(new RegExp(escapedS, 'i'), '').replace(/^[\s\-:]+/, '').trim();
          topic = rest || tag;
        } catch (e) {
          topic = tag;
        }
        break;
      }
    }

    if (subject === 'General' && tag.includes('-')) {
      const parts = tag.split('-');
      subject = parts[0].trim();
      topic = parts.slice(1).join('-').trim();
    }

    return { subject, topic: topic || 'General Topics' };
  };

  const subjectGroupedQuestions = React.useMemo(() => {
    const map: Record<string, { questions: { question: any; originalIdx: number }[] }> = {};

    questions.forEach((q, idx) => {
      const { subject } = getQuestionSubjectAndTopic(q);
      if (!map[subject]) {
        map[subject] = { questions: [] };
      }
      map[subject].questions.push({ question: q, originalIdx: idx });
    });

    return map;
  }, [questions, courseSubjects]);

  const testSubjects = Object.keys(subjectGroupedQuestions);
  const currentQInfo = currentQ ? getQuestionSubjectAndTopic(currentQ) : { subject: 'General', topic: '' };

  if (loading || !test) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-xs text-slate-500">Initializing mock test session...</div>;
  }

  // Helper function to update question state
  const updateQuestionState = (qId: string, updates: Partial<{ selectedOption: number | null; isMFR: boolean; isVisited: boolean }>) => {
    if (!qId) return;
    setUserState((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], ...updates, isVisited: true },
    }));
  };

  const handleSelectOption = (optIdx: number) => {
    if (result || !currentQ) return;
    updateQuestionState(currentQ._id, { selectedOption: optIdx });
  };

  const handleClearResponse = () => {
    if (result || !currentQ) return;
    updateQuestionState(currentQ._id, { selectedOption: null });
  };

  const handleToggleMFR = () => {
    if (result || !currentQ) return;
    const curr = userState[currentQ._id]?.isMFR || false;
    updateQuestionState(currentQ._id, { isMFR: !curr });
  };

  const navigateTo = (idx: number) => {
    if (idx >= 0 && idx < questions.length) {
      setCurrentIdx(idx);
      if (questions[idx]?._id) {
        updateQuestionState(questions[idx]._id, { isVisited: true });
      }
    }
  };

  // Compute Palette Stats
  let answeredCount = 0;
  let unansweredCount = 0;
  let mfrCount = 0;
  let unvisitedCount = 0;

  questions.forEach((q) => {
    const st = userState[q._id];
    if (!st || !st.isVisited) {
      unvisitedCount++;
    } else if (st.isMFR) {
      mfrCount++;
    } else if (st.selectedOption !== null && st.selectedOption !== undefined) {
      answeredCount++;
    } else {
      unansweredCount++;
    }
  });

  const handleFinalSubmit = async (submissionType: 'manual' | 'auto' = 'manual') => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/mock-tests/${test._id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAnswers: userState, submissionType }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data.result);
        setShowConfirmModal(false);
        setShowLockWarning(false);
        setShowBackWarning(false);
        exitFullscreen();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('xpUpdated'));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Format Timer MM:SS or HH:MM:SS
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const violationsRemaining = 3 - backPressCount;

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950">

      {/* ─── Portrait Mode Overlay (mobile only) ─── */}
      {isPortrait && !result && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center text-center p-8"
          style={{ background: 'linear-gradient(135deg, #0B192C 0%, #1a2d4a 100%)' }}
        >
          <div
            className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mb-6"
            style={{ animation: 'spin 3s linear infinite' }}
          >
            <RotateCcw className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-white text-xl font-black mb-2">Rotate Your Device</h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            Please rotate your device to <strong className="text-white">landscape mode</strong> to take the mock test.
          </p>
          <div className="mt-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white/30 animate-pulse" />
            <span className="text-white/40 text-xs">Waiting for rotation...</span>
          </div>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Test Top Header Bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 md:px-6 py-2 md:py-3 shrink-0 sticky top-0 z-20 shadow-md shadow-slate-200/50 dark:shadow-black/60">

        {/* ── Mobile: 3-column layout — logo | SUBMIT CENTER | timer ── */}
        <div className="flex md:hidden items-center w-full gap-2">
          {/* Left col */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Logo size={26} showText={false} />
            <h1 className="text-[11px] font-bold text-slate-900 dark:text-white truncate max-w-[80px]">{test.title}</h1>
          </div>

          {/* Center col: Submit */}
          {!result && (
            <button
              onClick={() => setShowConfirmModal(true)}
              type="button"
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-[11px] font-black rounded-lg shadow-md shadow-rose-500/30 transition-all shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Submit Test
            </button>
          )}

          {/* Right col: violation + timer */}
          <div className="flex items-center gap-1.5 flex-1 justify-end">
            {backPressCount > 0 && !result && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700">
                <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                <span className="text-[9px] font-black text-amber-700 dark:text-amber-300">{backPressCount}/3</span>
              </div>
            )}
            {!result && (
              <div className="flex items-center gap-1 bg-brand-50 dark:bg-slate-800 border border-brand-200 dark:border-slate-700 px-2 py-1 rounded-lg">
                <Clock className="w-3 h-3 text-brand-700 dark:text-brand-400" />
                <span className="font-mono text-[11px] font-bold text-brand-900 dark:text-brand-300">{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Desktop: standard flex row ── */}
        <div className="hidden md:flex items-center justify-between w-full">
          <div className="flex items-center gap-4 min-w-0">
            <Logo size={28} showText={false} />
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate">{test.title}</h1>
              <p className="text-[10px] text-slate-500">Course: {test.course_id?.name}</p>
            </div>
          </div>
          {backPressCount > 0 && !result && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700">
              <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span className="text-[10px] font-black text-amber-700 dark:text-amber-300">{backPressCount}/3 Violations</span>
            </div>
          )}
          {!result && (
            <div className="flex items-center gap-1.5 bg-brand-50 dark:bg-slate-800 border border-brand-200 dark:border-slate-700 px-4 py-1.5 rounded-xl text-brand-900 dark:text-brand-300">
              <Clock className="w-4 h-4 text-brand-700 dark:text-brand-400" />
              <span className="font-mono text-sm font-bold">{formatTime(timeLeft)}</span>
            </div>
          )}
          {!result && (
            <button
              onClick={() => setShowConfirmModal(true)}
              type="button"
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors shrink-0"
            >
              Submit Test
            </button>
          )}
        </div>
      </header>

      {/* Subject Section Navigation Bar */}
      {!result && (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 md:px-6 py-1.5 md:py-2 flex items-center justify-between shrink-0 z-20 shadow-xs">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[10px] md:text-[11px] font-black uppercase text-slate-400 tracking-wider mr-1 shrink-0">
              SECTIONS:
            </span>
            {testSubjects.map((subject) => {
              const isCurrentSubject = currentQInfo.subject === subject;
              const subjectQList = subjectGroupedQuestions[subject].questions;
              const firstQIdx = subjectQList[0]?.originalIdx ?? 0;

              let answeredInSub = 0;
              subjectQList.forEach(({ question }) => {
                const st = userState[question._id];
                if (st?.selectedOption !== null && st?.selectedOption !== undefined) {
                  answeredInSub++;
                }
              });

              return (
                <button
                  key={subject}
                  type="button"
                  onClick={() => navigateTo(firstQIdx)}
                  className={`px-2.5 md:px-4 py-1 md:py-1.5 rounded-xl text-[10px] md:text-xs font-extrabold flex items-center gap-1.5 md:gap-2 transition-all shrink-0 border ${
                    isCurrentSubject
                      ? 'bg-[#0B192C] text-white border-[#0B192C] dark:bg-brand-500 dark:border-brand-500 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{subject}</span>
                  <span
                    className={`text-[9px] md:text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isCurrentSubject
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {answeredInSub}/{subjectQList.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="flex-1 flex flex-row min-h-0">

        {/* Left Column: Question Screen */}
        <div className="flex-1 p-3 md:p-6 overflow-y-auto space-y-4 md:space-y-6">
          {result ? (
            /* Post-Test Result & Review Screen */
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Mock Test Performance Breakdown</h2>
                    <p className="text-xs text-slate-500">Submitted via {result.submissionType || 'manual'} action</p>
                  </div>
                  {result.cutoffBonusAwarded && (
                    <div className="px-4 py-2 bg-emerald-600 text-white font-black text-xs rounded-xl flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-300" /> +100 XP Cutoff Bonus Cleared!
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center mb-6">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Total Score</span>
                    <span className="text-2xl font-black text-brand-800 dark:text-brand-300">{result.score}</span>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Accuracy %</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white">{result.accuracyPercent}%</span>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Correct / Incorrect</span>
                    <span className="text-2xl font-black text-emerald-600">
                      {result.correctCount} <span className="text-slate-400 text-base">/</span> {result.incorrectCount}
                    </span>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">XP Earned</span>
                    <span className="text-2xl font-black text-emerald-500">+{result.xpEarned}</span>
                  </div>
                </div>

                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full py-2.5 bg-brand-800 hover:bg-brand-900 text-white font-bold text-xs rounded-xl transition-colors"
                >
                  Return to Student Dashboard
                </button>
              </div>

              {/* Post-Test Question Review */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Question-by-Question Solution Review</h3>
                {questions.map((q, idx) => {
                  const uSt = userState[q._id];
                  const userChoice = uSt?.selectedOption;

                  return (
                    <div key={q._id} className="border-b border-slate-200 dark:border-slate-800 pb-4 last:border-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white mb-2">
                        Q{idx + 1}. {q.question_text}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                        {(q.options || []).map((opt: string, optIdx: number) => {
                          const isCorrectKey = optIdx === q.correct_option;
                          const isUserSelection = userChoice === optIdx;

                          let style = 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300';
                          if (isCorrectKey) {
                            style = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-300';
                          } else if (isUserSelection && !isCorrectKey) {
                            style = 'bg-rose-50 border-rose-400 text-rose-900 font-bold dark:bg-rose-950 dark:border-rose-700 dark:text-rose-300';
                          }

                          return (
                            <div key={optIdx} className={`p-2.5 rounded-lg border text-xs flex justify-between items-center ${style}`}>
                              <span>
                                <strong className="mr-1">{String.fromCharCode(65 + optIdx)}.</strong> {opt}
                              </span>
                              {isCorrectKey && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <p className="text-[11px] text-slate-500 bg-slate-100/60 dark:bg-slate-800/40 p-2 rounded">
                          <strong>Solution:</strong> {q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Active Question Screen */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 md:p-6 shadow-sm flex flex-col justify-between h-full min-h-0">
              {currentQ ? (
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center mb-3 md:mb-4 pb-2 md:pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] md:text-[11px] font-black bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800 uppercase tracking-wider">
                        {currentQInfo.subject}
                      </span>
                      <span className="text-[10px] md:text-xs font-bold text-slate-400">
                        Q{currentIdx + 1}/{questions.length}
                      </span>
                    </div>
                    <button
                      onClick={handleToggleMFR}
                      type="button"
                      className={`px-2 md:px-3 py-1 rounded-lg text-[10px] md:text-xs font-bold flex items-center gap-1 md:gap-1.5 border transition-colors ${
                        userState[currentQ._id]?.isMFR
                          ? 'bg-amber-100 border-amber-400 text-amber-900 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-300'
                          : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Bookmark className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      <span className="hidden sm:inline">{userState[currentQ._id]?.isMFR ? 'Marked' : 'Mark'}</span>
                    </button>
                  </div>

                  <div className="flex items-start justify-between gap-2 md:gap-3 mb-4 md:mb-6">
                    <h2 className="text-sm md:text-base font-bold text-slate-900 dark:text-white leading-relaxed flex-1">
                      {hindiTranslations[currentQ._id]?.question ?? currentQ.question_text}
                    </h2>
                    <HindiTranslateButton
                      texts={[currentQ.question_text, ...(currentQ.options || [])]}
                      isTranslated={!!hindiTranslations[currentQ._id]}
                      onTranslated={(translated) => handleMockTranslated(currentQ._id, translated)}
                      onReset={() => handleMockResetTranslation(currentQ._id)}
                    />
                  </div>

                  <div className="space-y-2 md:space-y-3 flex-1">
                    {(currentQ.options || []).map((_opt: string, optIdx: number) => {
                      const opt = (hindiTranslations[currentQ._id]?.options || currentQ.options || [])[optIdx];
                      const isSelected = userState[currentQ._id]?.selectedOption === optIdx;
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(optIdx)}
                          className={`w-full p-2.5 md:p-3.5 rounded-xl border text-[11px] md:text-xs text-left font-medium transition-all flex items-center gap-2 md:gap-3 ${
                            isSelected
                              ? 'bg-brand-50 border-brand-800 text-brand-900 dark:bg-brand-950 dark:border-brand-500 dark:text-brand-300 font-bold shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 md:w-6 md:h-6 rounded-full text-[10px] md:text-[11px] flex items-center justify-center font-bold shrink-0 ${
                              isSelected
                                ? 'bg-brand-800 text-white'
                                : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Bottom Controls */}
                  <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-800 pt-3 md:pt-4 mt-3 md:mt-6">
                    <button
                      type="button"
                      onClick={handleClearResponse}
                      className="px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
                    >
                      Clear Answer
                    </button>

                    <div className="flex gap-1.5 md:gap-2">
                      <button
                        type="button"
                        disabled={currentIdx === 0}
                        onClick={() => navigateTo(currentIdx - 1)}
                        className="px-2.5 md:px-4 py-1.5 md:py-2 border border-slate-300 dark:border-slate-700 text-[10px] md:text-xs font-bold rounded-lg disabled:opacity-40 flex items-center gap-1 text-slate-700 dark:text-slate-300"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4" /> Prev
                      </button>

                      <button
                        type="button"
                        disabled={currentIdx === questions.length - 1}
                        onClick={() => navigateTo(currentIdx + 1)}
                        className="px-2.5 md:px-4 py-1.5 md:py-2 bg-brand-800 hover:bg-brand-900 text-white text-[10px] md:text-xs font-bold rounded-lg disabled:opacity-40 flex items-center gap-1 transition-colors"
                      >
                        Next <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">No active question available.</div>
              )}
            </div>
          )}
        </div>

        {/* Right Navigation Palette Column */}
        {!result && (
          <div className="w-36 md:w-72 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 md:p-5 shrink-0 space-y-3 md:space-y-5 overflow-y-auto">
            <div>
              <h3 className="text-[10px] md:text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 md:mb-3">
                Palette
              </h3>

              {/* 4 State Legend */}
              <div className="grid grid-cols-1 gap-1 md:gap-2 text-[9px] md:text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded bg-emerald-500 shrink-0" /> 
                  <span>Done ({answeredCount})</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded bg-rose-500 shrink-0" /> 
                  <span>Skip ({unansweredCount})</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded bg-amber-500 shrink-0" /> 
                  <span>MFR ({mfrCount})</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded bg-slate-200 dark:bg-slate-700 shrink-0" /> 
                  <span>New ({unvisitedCount})</span>
                </div>
              </div>
            </div>

            {/* Subject Section Grids */}
            {testSubjects.map((subject) => {
              const subQList = subjectGroupedQuestions[subject].questions;
              const isCurrentSubject = currentQInfo.subject === subject;

              return (
                <div key={subject} className="space-y-1.5 md:space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center text-[9px] md:text-xs font-black text-slate-900 dark:text-white">
                    <span className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isCurrentSubject ? 'bg-brand-600 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
                      <span className="truncate max-w-[60px] md:max-w-none">{subject}</span>
                    </span>
                    <span className="text-[8px] md:text-[10px] text-slate-400 font-medium shrink-0 ml-1">
                      ({subQList.length})
                    </span>
                  </div>

                  <div className="grid grid-cols-4 md:grid-cols-5 gap-1 md:gap-2">
                    {subQList.map(({ question: q, originalIdx: idx }) => {
                      const st = userState[q._id];
                      const isCurrent = idx === currentIdx;

                      let stateColor = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';

                      if (st?.isMFR) {
                        stateColor = 'bg-amber-500 text-white border-amber-600 font-bold';
                      } else if (st?.selectedOption !== null && st?.selectedOption !== undefined) {
                        stateColor = 'bg-emerald-500 text-white border-emerald-600 font-bold';
                      } else if (st?.isVisited) {
                        stateColor = 'bg-rose-500 text-white border-rose-600 font-bold';
                      }

                      return (
                        <button
                          key={q._id}
                          onClick={() => navigateTo(idx)}
                          className={`h-7 md:h-9 rounded-lg font-mono text-[9px] md:text-xs flex items-center justify-center border transition-all ${stateColor} ${
                            isCurrent ? 'ring-2 ring-brand-800 ring-offset-1' : ''
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Submission Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-lg text-center">
            <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1">Confirm Test Submission</h3>
            <p className="text-xs text-slate-500 mb-4">Please review your answer summary before finalizing your test submission.</p>

            <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold mb-6">
              <div>
                <span className="text-emerald-600 block text-lg font-black">{answeredCount}</span>
                <span className="text-[10px] text-slate-400 font-semibold">Answered</span>
              </div>
              <div>
                <span className="text-amber-500 block text-lg font-black">{mfrCount}</span>
                <span className="text-[10px] text-slate-400 font-semibold">Marked</span>
              </div>
              <div>
                <span className="text-rose-500 block text-lg font-black">{unansweredCount + unvisitedCount}</span>
                <span className="text-[10px] text-slate-400 font-semibold">Unanswered</span>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-slate-300 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300"
              >
                Resume Test
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleFinalSubmit('manual')}
                className="px-6 py-2 bg-brand-800 hover:bg-brand-900 text-white text-xs font-bold rounded-lg transition-colors"
              >
                {submitting ? 'Submitting...' : 'Yes, Submit Test'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Back Navigation Warning Modal ─── */}
      {showBackWarning && !result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center space-y-5">

            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>

            {/* Strike counter */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className={`w-8 h-2 rounded-full transition-colors ${
                    n <= backPressCount
                      ? 'bg-rose-500'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 tracking-wider">
                Violation {backPressCount} of 3
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-3">
                Back Navigation Detected!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                You attempted to navigate away from the examination.
                {violationsRemaining > 0 ? (
                  <>
                    {' '}You have <span className="font-black text-rose-600 dark:text-rose-400">{violationsRemaining} violation{violationsRemaining !== 1 ? 's' : ''}</span> remaining before your test is automatically submitted.
                  </>
                ) : (
                  <> Your test is being submitted now.</>
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowBackWarning(false)}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl shadow-lg transition-all"
            >
              Return to Examination
            </button>
          </div>
        </div>
      )}

      {/* SCREEN LOCK WARNING MODAL */}
      {!result && !isFullscreen && showLockWarning && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 tracking-wider">
                Exam Security Protocol
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-2">
                Examination Screen Locked
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Mock examinations must be completed in Full Screen Mode. You cannot leave or navigate away until the test is submitted or the timer expires.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                enterFullscreen();
                setShowLockWarning(false);
              }}
              className="w-full py-3 bg-brand-800 hover:bg-brand-900 text-white text-xs font-black rounded-xl shadow-lg transition-all"
            >
              Re-enter Full Screen Examination
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
