'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Logo } from '@/components/common/Logo';
import { Clock, Bookmark, ChevronLeft, ChevronRight, CheckCircle2, Award, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

export default function MockTestExecutionPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const routeParams = useParams();
  const testId = (params?.id || routeParams?.id) as string;

  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Question Response State
  // { [qId]: { selectedOption: number | null, isMFR: boolean, isVisited: boolean } }
  const [userState, setUserState] = useState<Record<string, { selectedOption: number | null; isMFR: boolean; isVisited: boolean }>>({});

  // Timer State (in seconds)
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<any>(null);

  // Submission & Result State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

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

  // Live Timer Countdown Effect (FR-15, FR-17, RULE-08)
  useEffect(() => {
    if (!test || result) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleFinalSubmit('auto'); // FR-17 Auto-submit on timer expiry
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

  // Compute Palette Stats (FR-15 / FR-18)
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Test Top Header Bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Logo size={32} showText={false} />
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white">{test.title}</h1>
            <p className="text-[10px] text-slate-500">Course: {test.course_id?.name}</p>
          </div>
        </div>

        {/* Live Timer matching FR-15 */}
        {!result && (
          <div className="flex items-center gap-2 bg-brand-50 dark:bg-slate-800 border border-brand-200 dark:border-slate-700 px-4 py-1.5 rounded-xl text-brand-900 dark:text-brand-300">
            <Clock className="w-4 h-4 text-brand-700 dark:text-brand-400" />
            <span className="font-mono text-sm font-bold">{formatTime(timeLeft)}</span>
          </div>
        )}

        {!result && (
          <button
            onClick={() => setShowConfirmModal(true)}
            type="button"
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Submit Test
          </button>
        )}
      </header>

      {/* Subject Section Navigation Bar */}
      {!result && (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-2 flex items-center justify-between sticky top-[57px] z-10 shadow-xs">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider mr-1 shrink-0">
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
                  className={`px-4 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shrink-0 border ${
                    isCurrentSubject
                      ? 'bg-[#0B192C] text-white border-[#0B192C] dark:bg-brand-500 dark:border-brand-500 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{subject}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
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

      {/* Main Content Grid: Question Area vs Navigation Palette */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Left Column: Question Screen */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {result ? (
            /* Post-Test Result & Review Screen (FR-19 & FR-20) */
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

              {/* FR-20 Post-Test Question Review */}
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
                        {q.options.map((opt: string, optIdx: number) => {
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
            /* Active Question Screen (FR-15) */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full min-h-[420px]">
              <div>
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800 uppercase tracking-wider">
                      Section: {currentQInfo.subject}
                    </span>
                    {currentQInfo.topic && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {currentQInfo.topic}
                      </span>
                    )}
                    <span className="text-xs font-bold text-slate-400 ml-1">
                      • Question {currentIdx + 1} of {questions.length}
                    </span>
                  </div>
                  <button
                    onClick={handleToggleMFR}
                    type="button"
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-colors ${
                      userState[currentQ._id]?.isMFR
                        ? 'bg-amber-100 border-amber-400 text-amber-900 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-300'
                        : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    {userState[currentQ._id]?.isMFR ? 'Marked for Review' : 'Mark for Review'}
                  </button>
                </div>

                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-6 leading-relaxed">
                  {currentQ.question_text}
                </h2>

                <div className="space-y-3">
                  {currentQ.options.map((opt: string, optIdx: number) => {
                    const isSelected = userState[currentQ._id]?.selectedOption === optIdx;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(optIdx)}
                        className={`w-full p-3.5 rounded-xl border text-xs text-left font-medium transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'bg-brand-50 border-brand-800 text-brand-900 dark:bg-brand-950 dark:border-brand-500 dark:text-brand-300 font-bold shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full text-[11px] flex items-center justify-center font-bold ${
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
              </div>

              {/* Bottom Controls */}
              <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-800 pt-4 mt-6">
                <button
                  type="button"
                  onClick={handleClearResponse}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
                >
                  Clear Answer
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={currentIdx === 0}
                    onClick={() => navigateTo(currentIdx - 1)}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-lg disabled:opacity-40 flex items-center gap-1 text-slate-700 dark:text-slate-300"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>

                  <button
                    type="button"
                    disabled={currentIdx === questions.length - 1}
                    onClick={() => navigateTo(currentIdx + 1)}
                    className="px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white text-xs font-bold rounded-lg disabled:opacity-40 flex items-center gap-1 transition-colors"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Navigation Palette Column (FR-15) */}
        {!result && (
          <div className="w-full md:w-72 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shrink-0 space-y-5 overflow-y-auto">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                Question Palette
              </h3>

              {/* 4 State Legend per FR-15 */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500" /> Answered ({answeredCount})
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-rose-500" /> Unanswered ({unansweredCount})
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-500" /> Marked ({mfrCount})
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700" /> Unvisited ({unvisitedCount})
                </div>
              </div>
            </div>

            {/* Subject Section Grids */}
            {testSubjects.map((subject) => {
              const subQList = subjectGroupedQuestions[subject].questions;
              const isCurrentSubject = currentQInfo.subject === subject;

              return (
                <div key={subject} className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center text-xs font-black text-slate-900 dark:text-white">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isCurrentSubject ? 'bg-brand-600 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
                      {subject}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      ({subQList.length} Questions)
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
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
                          className={`h-9 rounded-lg font-mono text-xs flex items-center justify-center border transition-all ${stateColor} ${
                            isCurrent ? 'ring-2 ring-brand-800 ring-offset-2' : ''
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

      {/* Manual Submission Modal (FR-18) */}
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
