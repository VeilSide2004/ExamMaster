'use client';

import React, { useEffect, useState, useRef } from 'react';
import { StudentHeader } from '@/components/layout/StudentHeader';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Award,
  ArrowRight,
  RefreshCw,
  BookOpen,
  ChevronRight,
  Folder,
  Layers,
  ArrowLeft,
  FileText,
  Clock,
  Zap,
  Brain,
  ShieldCheck,
  ChevronLeft,
  PlayCircle,
  Calendar,
} from 'lucide-react';

export default function PracticeSetsPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [topicCounts, setTopicCounts] = useState<Record<string, number>>({});
  const [courseName, setCourseName] = useState<string>('');
  const [courseSubjects, setCourseSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Hierarchy Navigation State
  const [currentLevel, setCurrentLevel] = useState<'subjects' | 'topics' | 'questions'>('subjects');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [viewMode, setViewMode] = useState<'hierarchy' | 'all'>('hierarchy');
  const [isWeeklySession, setIsWeeklySession] = useState(false);

  // Mode Selection Modal State
  const [showModeModal, setShowModeModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'practice' | 'quiz'>('practice');

  // Active Mock-Test Style Session State
  const [activeSession, setActiveSession] = useState<'practice' | 'quiz' | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number | null>>({});
  const [userTextAnswers, setUserTextAnswers] = useState<Record<string, string>>({});
  const [checkedQuestions, setCheckedQuestions] = useState<Record<string, boolean>>({});

  // Timer State (Stopwatch for Practice, Countdown for Quiz)
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Submission Result & Confirmation State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const [completedTopics, setCompletedTopics] = useState<string[]>([]);
  const [publishedWeeklyDpp, setPublishedWeeklyDpp] = useState<any | null>(null);
  const [userAttempts, setUserAttempts] = useState<any[]>([]);
  const [sessionQuestions, setSessionQuestions] = useState<any[]>([]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const [res, dppRes] = await Promise.all([
        fetch('/api/practice'),
        fetch('/api/weekly-dpp'),
      ]);
      const data = await res.json();
      const dppData = await dppRes.json();

      setQuestions(data.questions || []);
      setTopicCounts(data.topicCounts || {});
      if (data.completedTopics) setCompletedTopics(data.completedTopics);
      if (data.userAttempts) setUserAttempts(data.userAttempts);
      if (data.courseName) setCourseName(data.courseName);
      if (data.courseSubjects && data.courseSubjects.length > 0) {
        setCourseSubjects(data.courseSubjects);
      }

      if (dppData.weeklyDpps && dppData.weeklyDpps.length > 0) {
        setPublishedWeeklyDpp(dppData.weeklyDpps[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Timer Effect
  useEffect(() => {
    if (!activeSession || submittedResult) return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (activeSession === 'quiz') {
          if (prev <= 1) {
            clearInterval(interval);
            handleFinalSubmit('auto');
            return 0;
          }
          return prev - 1;
        } else {
          return prev + 1; // Practice Mode forward stopwatch
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession, submittedResult]);

  // Weekly Shuffling Helpers
  const getWeekNumber = () => {
    const d = new Date();
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  };

  const getCurrentWeekLabel = () => {
    const d = new Date();
    return `Week ${getWeekNumber()}, ${d.getFullYear()}`;
  };

  const shuffleArrayWithSeed = (array: any[], seed: number) => {
    const arr = [...array];
    let m = arr.length, t, i;
    let currentSeed = seed;
    while (m) {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      i = Math.floor((currentSeed / 233280) * m--);
      t = arr[m];
      arr[m] = arr[i];
      arr[i] = t;
    }
    return arr;
  };

  const getWeeklyQuestions = () => {
    // 1. If admin published an explicit Weekly DPP with selected questions
    if (publishedWeeklyDpp) {
      if (publishedWeeklyDpp.questions && publishedWeeklyDpp.questions.length > 0) {
        return publishedWeeklyDpp.questions;
      }
      if (publishedWeeklyDpp.question_ids && publishedWeeklyDpp.question_ids.length > 0) {
        const qList = questions.filter((q) =>
          publishedWeeklyDpp.question_ids.some((id: any) => String(id) === String(q._id))
        );
        if (qList.length > 0) return qList;
      }
    }

    // 2. Auto-generate candidate pool from completed topics or course questions
    let candidatePool = questions;
    if (completedTopics.length > 0) {
      const completedQs = questions.filter((q) =>
        completedTopics.some(
          (t) => (q.topic_tag || '').toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes((q.topic_tag || '').toLowerCase())
        )
      );
      if (completedQs.length > 0) {
        candidatePool = completedQs;
      }
    }

    return candidatePool.length > 0 ? candidatePool : questions;
  };

  // Smart 10-Question Selection Algorithm
  // 1. Capped at 10 questions at max per session
  // 2. Prioritizes questions the user answered INCORRECTLY in earlier sets
  // 3. Fills remaining slots with fresh UNATTEMPTED questions (shuffled randomly)
  // 4. Applies across every course, subject, and topic
  const getSmartPracticeSet = (rawCandidateQs: any[]): any[] => {
    if (!rawCandidateQs || rawCandidateQs.length === 0) return [];

    const questionAttemptMap: Record<string, boolean> = {};

    const sortedAttempts = [...userAttempts].sort(
      (a, b) => new Date(a.created_at || a.started_at || 0).getTime() - new Date(b.created_at || b.started_at || 0).getTime()
    );

    sortedAttempts.forEach((att) => {
      if (Array.isArray(att.responses)) {
        att.responses.forEach((resp: any) => {
          if (resp.question_id) {
            questionAttemptMap[String(resp.question_id)] = Boolean(resp.is_correct);
          }
        });
      }
    });

    const wrongQs = rawCandidateQs.filter(
      (q) => questionAttemptMap[String(q._id)] === false
    );

    const unattemptedQs = rawCandidateQs.filter(
      (q) => questionAttemptMap[String(q._id)] === undefined
    );

    const correctQs = rawCandidateQs.filter(
      (q) => questionAttemptMap[String(q._id)] === true
    );

    const randomShuffle = (arr: any[]) => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const orderedPool = [
      ...randomShuffle(wrongQs),
      ...randomShuffle(unattemptedQs),
      ...randomShuffle(correctQs),
    ];

    const result: any[] = [];
    const seenIds = new Set<string>();
    for (const q of orderedPool) {
      const qId = String(q._id);
      if (!seenIds.has(qId)) {
        seenIds.add(qId);
        result.push(q);
      }
    }

    return result.slice(0, 10);
  };

  const handleOpenWeeklyChallenge = () => {
    const rawWeeklyQs = getWeeklyQuestions();
    if (rawWeeklyQs.length === 0) {
      alert('No questions uploaded for Weekly DPP Test yet.');
      return;
    }

    const smartSet = getSmartPracticeSet(rawWeeklyQs);
    setSessionQuestions(smartSet);

    const testTitle = publishedWeeklyDpp?.title || `${getCurrentWeekLabel()} - Weekly Test Paper`;
    const testDurationSecs = publishedWeeklyDpp?.duration_minutes
      ? publishedWeeklyDpp.duration_minutes * 60
      : Math.max(300, smartSet.length * 60);

    setIsWeeklySession(true);
    setSelectedSubject('Weekly DPP');
    setSelectedTopic(testTitle);
    setSelectedMode('quiz');
    setShowModeModal(false);
    setActiveSession('quiz');
    setCurrentLevel('questions');
    setCurrentIdx(0);
    setUserAnswers({});
    setCheckedQuestions({});
    setSubmittedResult(null);

    setTimerSeconds(testDurationSecs);
  };

  const handleOpenTopic = (tName: string) => {
    setIsWeeklySession(false);
    setSelectedTopic(tName);
    setShowModeModal(true);
  };

  const handleStartSession = (mode: 'practice' | 'quiz') => {
    setSelectedMode(mode);
    setShowModeModal(false);

    let rawList: any[] = [];
    if (isWeeklySession) {
      rawList = getWeeklyQuestions();
    } else if (selectedTopic) {
      rawList = questions.filter((q) => (q.topic_tag || '').toLowerCase().includes(selectedTopic.toLowerCase()));
    } else if (selectedSubject) {
      rawList = questions.filter((q) => (q.topic_tag || '').toLowerCase().includes(selectedSubject.toLowerCase()));
    } else {
      rawList = questions;
    }

    const smartSet = getSmartPracticeSet(rawList);
    setSessionQuestions(smartSet);

    setActiveSession(mode);
    setCurrentLevel('questions');
    setCurrentIdx(0);
    setUserAnswers({});
    setCheckedQuestions({});
    setSubmittedResult(null);

    if (mode === 'quiz') {
      const totalSecs = Math.max(300, smartSet.length * 60);
      setTimerSeconds(totalSecs);
    } else {
      setTimerSeconds(0);
    }
  };

  const handleSelectOption = (qId: string, optIdx: number) => {
    if (submittedResult) return;
    setUserAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  const handleCheckSingleQuestion = (qId: string) => {
    if (userAnswers[qId] === undefined || userAnswers[qId] === null) return;
    setCheckedQuestions((prev) => ({ ...prev, [qId]: true }));
  };

  const handleFinalSubmit = async (submissionType: 'manual' | 'auto' = 'manual') => {
    const answersArray = Object.entries(userAnswers)
      .filter(([_, opt]) => opt !== null)
      .map(([qId, optIdx]) => ({
        questionId: qId,
        selectedOption: optIdx,
      }));

    setSubmitting(true);
    try {
      const res = await fetch('/api/practice/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: answersArray,
          topicTag: selectedTopic ? `${selectedSubject} - ${selectedTopic}` : selectedSubject || 'All Topics',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmittedResult({ ...data, mode: activeSession, timeSpent: timerSeconds });
        setShowConfirmModal(false);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('xpUpdated'));
        }
        fetchQuestions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Protect active session from accidental page unload
  useEffect(() => {
    if (!activeSession || submittedResult) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You have an active test session in progress. Leaving will discard all your answers.';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeSession, submittedResult]);

  const handleResetSession = () => {
    setIsWeeklySession(false);
    setActiveSession(null);
    setSessionQuestions([]);
    setUserAnswers({});
    setCheckedQuestions({});
    setSubmittedResult(null);
    setCurrentLevel('topics');
    fetchQuestions();
  };

  const handleHeaderBack = () => {
    if (activeSession && !submittedResult) {
      setShowLeaveModal(true);
    } else if (activeSession) {
      handleResetSession();
    } else if (currentLevel === 'questions') {
      setCurrentLevel('topics');
      setSelectedTopic('');
    } else if (currentLevel === 'topics') {
      setCurrentLevel('subjects');
      setSelectedSubject('');
    }
  };

  // Derive Subject & Topic questions
  const subjectQuestionMap: Record<string, any[]> = {};
  courseSubjects.forEach((s) => {
    subjectQuestionMap[s] = questions.filter(
      (q) => (q.topic_tag || '').toLowerCase().includes(s.toLowerCase())
    );
  });

  const activeSubjectQuestions = selectedSubject
    ? questions.filter((q) => (q.topic_tag || '').toLowerCase().includes(selectedSubject.toLowerCase()))
    : [];

  const topicModulesMap: Record<string, any[]> = {};
  activeSubjectQuestions.forEach((q) => {
    let tName = 'General Module';
    if (q.topic_tag) {
      const parts = q.topic_tag.split('-').map((p: string) => p.trim());
      if (parts.length > 1) {
        tName = parts.slice(1).join(' - ');
      } else {
        tName = parts[0];
      }
    }
    if (!topicModulesMap[tName]) topicModulesMap[tName] = [];
    topicModulesMap[tName].push(q);
  });

  const filteredQuestions = activeSession && sessionQuestions.length > 0
    ? sessionQuestions
    : isWeeklySession
    ? getWeeklyQuestions()
    : selectedTopic
    ? activeSubjectQuestions.filter((q) => (q.topic_tag || '').toLowerCase().includes(selectedTopic.toLowerCase()))
    : selectedSubject
    ? activeSubjectQuestions
    : questions;

  const currentQ = filteredQuestions[currentIdx];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <StudentHeader
        hideNav={Boolean(activeSession)}
        onBack={currentLevel !== 'subjects' || activeSession ? handleHeaderBack : undefined}
      />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8 flex-1">
          {/* Header Title Bar (when not in active session) */}
          {!activeSession && (
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Subject & Topic Daily Practice Papers
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Practice question sets categorized by Subject and Topic modules for {courseName}. Earn +27 XP per correct answer!
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 flex items-center gap-1.5 shadow-xs">
                  <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Subject Hierarchy
                </span>
              </div>
            </div>
          )}

          {/* ACTIVE MOCK TEST STYLE SESSION VIEW */}
          {activeSession && currentQ && (
            <div className="space-y-6">
              {/* Session Top Header Sub-Bar */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-lg text-xs font-black bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    {selectedSubject || 'General'} ➔ {selectedTopic || 'Practice Set'}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    Mode: {activeSession === 'quiz' ? 'Quiz Assessment (Timed)' : 'Self-Paced Practice'}
                  </span>
                </div>

                {/* Timer Badge */}
                {!submittedResult && (
                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-1.5 rounded-xl text-slate-900 dark:text-slate-100">
                    <Clock className={`w-4 h-4 ${activeSession === 'quiz' ? 'text-amber-500 animate-pulse' : 'text-blue-500'}`} />
                    <span className="font-mono text-sm font-bold">{formatTime(timerSeconds)}</span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">
                      {activeSession === 'quiz' ? 'Remaining' : 'Elapsed'}
                    </span>
                  </div>
                )}

                {!submittedResult && (
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    type="button"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                  >
                    {activeSession === 'quiz' ? 'Submit Quiz' : 'Finish Practice Set'}
                  </button>
                )}
              </div>

              {/* Result Screen or Active Question Interface */}
              {submittedResult ? (
                /* Performance Summary Screen */
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs text-center space-y-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
                      <Award className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white">
                        {activeSession === 'quiz' ? 'Quiz Completed!' : 'Practice Set Finished!'}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {selectedSubject} • {selectedTopic || 'Practice Set'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Correct Answers</span>
                        <span className="text-2xl font-black text-emerald-600">
                          {submittedResult.correctCount} / {submittedResult.totalQuestions}
                        </span>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Accuracy</span>
                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                          {submittedResult.accuracyPercent}%
                        </span>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Time Taken</span>
                        <span className="text-2xl font-black text-brand-800 dark:text-brand-300">
                          {formatTime(submittedResult.timeSpent || timerSeconds)}
                        </span>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">XP Earned</span>
                        <span className="text-2xl font-black text-emerald-500">+{submittedResult.xpEarned} XP</span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleResetSession}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl"
                      >
                        Back to Topic Modules
                      </button>
                      <button
                        onClick={() => handleStartSession(activeSession)}
                        className="flex-1 py-2.5 bg-brand-800 hover:bg-brand-900 text-white font-bold text-xs rounded-xl"
                      >
                        Retry Session
                      </button>
                    </div>
                  </div>

                  {/* Solution Breakdown */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Question Solutions</h3>
                    {filteredQuestions.map((q: any, idx: number) => {
                      const userChoice = userAnswers[q._id];
                      return (
                        <div key={q._id} className="border-b border-slate-200 dark:border-slate-800 pb-4 last:border-0 space-y-3">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            Q{idx + 1}. {q.question_text}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt: string, optIdx: number) => {
                              const isCorrectKey = optIdx === q.correct_option;
                              const isUserSelection = userChoice === optIdx;

                              let style = 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
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
                                  {isUserSelection && !isCorrectKey && <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                                </div>
                              );
                            })}
                          </div>
                          {q.explanation && (
                            <p className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
                              <strong>Solution:</strong> {q.explanation}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Active Question & Palette Grid */
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Active Question Box */}
                  <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between min-h-[420px]">
                    <div>
                      <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500">
                            Question {currentIdx + 1} of {filteredQuestions.length}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            currentQ.question_type === 'Long Answer'
                              ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
                              : currentQ.question_type === 'Short Answer'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                              : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                          }`}>
                            {currentQ.question_type === 'Long Answer' ? '📄 Long Answer' : currentQ.question_type === 'Short Answer' ? '📝 Short Answer' : '🔘 MCQ'}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-extrabold text-[10px]">
                            {currentQ.marks || (currentQ.question_type === 'Long Answer' ? 5 : currentQ.question_type === 'Short Answer' ? 2 : 1)} Mark(s)
                          </span>
                        </div>

                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {selectedTopic || selectedSubject}
                        </span>
                      </div>

                      <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-6 leading-relaxed">
                        {currentQ.question_text}
                      </h2>

                      {(!currentQ.question_type || currentQ.question_type === 'MCQ') && currentQ.options && currentQ.options.length > 0 ? (
                        /* MCQ Options Grid */
                        <div className="space-y-3">
                          {currentQ.options.map((opt: string, optIdx: number) => {
                            const isSelected = userAnswers[currentQ._id] === optIdx;
                            const isChecked = activeSession === 'practice' && checkedQuestions[currentQ._id];
                            const isCorrect = optIdx === currentQ.correct_option;

                            let style = 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-slate-300';

                            if (isChecked) {
                              if (isCorrect) {
                                style = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-300';
                              } else if (isSelected && !isCorrect) {
                                style = 'bg-rose-50 border-rose-500 text-rose-950 font-bold dark:bg-rose-950 dark:border-rose-700 dark:text-rose-300';
                              }
                            } else if (isSelected) {
                              style = 'bg-brand-50 border-brand-800 text-brand-900 dark:bg-brand-950 dark:border-brand-500 dark:text-brand-300 font-bold shadow-xs';
                            }

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => handleSelectOption(currentQ._id, optIdx)}
                                className={`w-full p-3.5 rounded-xl border text-xs text-left font-medium transition-all flex items-center justify-between gap-3 ${style}`}
                              >
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`w-6 h-6 rounded-full text-[11px] flex items-center justify-center font-bold shrink-0 ${
                                      isSelected
                                        ? 'bg-brand-800 text-white'
                                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  <span>{opt}</span>
                                </div>

                                {isChecked && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                                {isChecked && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        /* Short / Long Answer Text Response Field */
                        <div className="space-y-3">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Draft Your Response / Key Answer Steps:
                          </label>
                          <textarea
                            rows={currentQ.question_type === 'Long Answer' ? 6 : 3}
                            value={userTextAnswers[currentQ._id] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setUserTextAnswers((prev) => ({ ...prev, [currentQ._id]: val }));
                              // Mark as answered
                              if (val.trim()) {
                                setUserAnswers((prev) => ({ ...prev, [currentQ._id]: 1 }));
                              }
                            }}
                            placeholder="Write your answer, key steps, or formulas here..."
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                          />
                        </div>
                      )}

                      {/* Solution / Model Answer Reveal */}
                      {activeSession === 'practice' && checkedQuestions[currentQ._id] && (
                        <div className="mt-5 p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl space-y-1 text-xs">
                          <span className="font-extrabold text-emerald-950 dark:text-emerald-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Model Answer & Official Key
                          </span>
                          <p className="text-emerald-900 dark:text-emerald-200 leading-relaxed whitespace-pre-line font-medium">
                            {currentQ.sample_answer || currentQ.explanation || (currentQ.correct_option !== undefined ? `Correct option is ${String.fromCharCode(65 + currentQ.correct_option)}.` : 'Refer to textbook model answer.')}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Controls */}
                    <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-800 pt-4 mt-6">
                      {activeSession === 'practice' ? (
                        <button
                          type="button"
                          disabled={
                            (!currentQ.question_type || currentQ.question_type === 'MCQ')
                              ? userAnswers[currentQ._id] === undefined || userAnswers[currentQ._id] === null
                              : false
                          }
                          onClick={() => handleCheckSingleQuestion(currentQ._id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-40 flex items-center gap-1.5 shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {checkedQuestions[currentQ._id] ? 'Re-check / View Model Answer' : 'Check / Reveal Model Answer'}
                        </button>
                      ) : (
                        <div />
                      )}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={currentIdx === 0}
                          onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                          className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-lg disabled:opacity-40 flex items-center gap-1 text-slate-700 dark:text-slate-300"
                        >
                          <ChevronLeft className="w-4 h-4" /> Previous
                        </button>

                        <button
                          type="button"
                          disabled={currentIdx === filteredQuestions.length - 1}
                          onClick={() => setCurrentIdx((prev) => Math.min(filteredQuestions.length - 1, prev + 1))}
                          className="px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white text-xs font-bold rounded-lg disabled:opacity-40 flex items-center gap-1 transition-colors"
                        >
                          Next <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Question Palette Sidebar */}
                  <div className="w-full md:w-64 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 rounded-2xl shrink-0 h-fit space-y-4 shadow-xs">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Question Palette
                    </h3>

                    <div className="grid grid-cols-5 gap-2">
                      {filteredQuestions.map((q: any, idx: number) => {
                        const isCurrent = idx === currentIdx;
                        const isAnswered = userAnswers[q._id] !== undefined && userAnswers[q._id] !== null;
                        const isChecked = activeSession === 'practice' && checkedQuestions[q._id];
                        const isCorrect = isChecked && userAnswers[q._id] === q.correct_option;

                        let color = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';

                        if (isChecked) {
                          color = isCorrect
                            ? 'bg-emerald-500 text-white border-emerald-600 font-bold'
                            : 'bg-rose-500 text-white border-rose-600 font-bold';
                        } else if (isAnswered) {
                          color = 'bg-brand-800 text-white border-brand-900 font-bold';
                        }

                        return (
                          <button
                            key={q._id}
                            type="button"
                            onClick={() => setCurrentIdx(idx)}
                            className={`h-9 rounded-lg font-mono text-xs flex items-center justify-center border transition-all ${color} ${
                              isCurrent ? 'ring-2 ring-brand-800 ring-offset-2' : ''
                            }`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active Session Safe Fallback */}
          {activeSession && !currentQ && (
            <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-xs">
              <HelpCircle className="w-10 h-10 mx-auto text-slate-400" />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">No questions available for this paper yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active questions were found matching your current course track for this Weekly DPP paper.
              </p>
              <button
                type="button"
                onClick={handleResetSession}
                className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          )}

          {/* HIERARCHICAL MODE (when not in active session) */}
          {!activeSession && viewMode === 'hierarchy' && (
            <div className="space-y-6">
              {/* Breadcrumb Navigation Trail */}
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <button
                  onClick={() => {
                    setCurrentLevel('subjects');
                    setSelectedSubject('');
                    setSelectedTopic('');
                  }}
                  className={`hover:underline flex items-center gap-1.5 ${
                    currentLevel === 'subjects' ? 'text-blue-600 dark:text-blue-400 font-extrabold' : ''
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" /> {courseName}
                </button>

                {selectedSubject && (
                  <>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                    <button
                      onClick={() => {
                        setCurrentLevel('topics');
                        setSelectedTopic('');
                      }}
                      className={`hover:underline flex items-center gap-1 ${
                        currentLevel === 'topics' ? 'text-blue-600 dark:text-blue-400 font-extrabold' : ''
                      }`}
                    >
                      <Folder className="w-4 h-4 text-slate-700 dark:text-slate-300" /> {selectedSubject}
                    </button>
                  </>
                )}

                {selectedTopic && (
                  <>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                    <span className="text-blue-600 dark:text-blue-400 font-extrabold flex items-center gap-1">
                      <FileText className="w-4 h-4 text-slate-700 dark:text-slate-300" /> {selectedTopic}
                    </span>
                  </>
                )}
              </div>

              {/* LEVEL 1: SUBJECT WISE SELECTION */}
              {currentLevel === 'subjects' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Subject-wise Practice</h3>
                    <p className="text-xs text-slate-500">Select a subject to explore its specific topic practice modules.</p>
                  </div>

                  {courseSubjects.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 stroke-[1.5]" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">No practice questions available for this course yet</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Please check back later or log into Admin Portal to add questions!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {courseSubjects.map((sName) => {
                        const qList = subjectQuestionMap[sName] || [];
                        return (
                          <div
                            key={sName}
                            onClick={() => {
                              setSelectedSubject(sName);
                              setCurrentLevel('topics');
                            }}
                            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                          >
                            <div>
                              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center mb-4">
                                <BookOpen className="w-5 h-5" />
                              </div>
                              <h4 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1">
                                {sName}
                              </h4>
                              <p className="text-xs text-slate-500 font-semibold">{Math.min(10, qList.length)} Questions per Set (Smart Reshuffled)</p>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600">
                              <span>Browse Topics</span>
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-slate-400 group-hover:text-blue-600" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* WEEKLY MEGA DPP CHALLENGE SECTION (Royal Blue & Deep Indigo Theme) */}
                  {(() => {
                    const weeklyQs = getWeeklyQuestions();
                    const totalWeeklyCount = Math.min(10, weeklyQs.length);
                    return (
                      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-indigo-950 to-blue-900 text-white p-7 shadow-md space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-white/10 pb-5">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-900/60 text-blue-300 flex items-center justify-center shrink-0 border border-blue-500/30">
                              <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-800/60 text-blue-200 tracking-wider border border-blue-400/30">
                                  {getCurrentWeekLabel()}
                                </span>
                                <span className="text-xs font-bold text-blue-200/80">
                                  Completed Topics Revision Test
                                </span>
                              </div>
                              <h3 className="text-xl font-black tracking-tight text-white">
                                {publishedWeeklyDpp?.title || 'Weekly DPP Test'}
                              </h3>
                              <p className="text-xs text-blue-100/90 leading-relaxed mt-1 max-w-xl">
                                A timed revision test configured for your course track. Duration: {publishedWeeklyDpp?.duration_minutes || 30} Mins.
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleOpenWeeklyChallenge}
                            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 hover:scale-[1.02] transition-all flex items-center gap-2 shrink-0"
                          >
                            <Zap className="w-4 h-4 fill-current" /> Start Weekly Test
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="p-4 bg-blue-900/40 rounded-xl border border-blue-500/20">
                            <span className="text-[10px] text-blue-200/80 font-black block uppercase tracking-wider mb-1">TEST DURATION</span>
                            <span className="text-base font-black text-white">{publishedWeeklyDpp?.duration_minutes || 30} Mins</span>
                          </div>
                          <div className="p-4 bg-blue-900/40 rounded-xl border border-blue-500/20">
                            <span className="text-[10px] text-blue-200/80 font-black block uppercase tracking-wider mb-1">CONFIGURED QUESTIONS</span>
                            <span className="text-base font-black text-blue-400">{totalWeeklyCount} Questions</span>
                          </div>
                          <div className="p-4 bg-blue-900/40 rounded-xl border border-blue-500/20">
                            <span className="text-[10px] text-blue-200/80 font-black block uppercase tracking-wider mb-1">WEEKLY TOTAL QS</span>
                            <span className="text-base font-black text-white">{totalWeeklyCount} Questions</span>
                          </div>
                          <div className="p-4 bg-blue-900/40 rounded-xl border border-blue-500/20">
                            <span className="text-[10px] text-blue-200/80 font-black block uppercase tracking-wider mb-1">MAX XP BONUS</span>
                            <span className="text-base font-black text-blue-400">+{totalWeeklyCount * 27} XP</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* LEVEL 2: TOPIC WISE SELECTION */}
              {currentLevel === 'topics' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        Topic Modules under <span className="text-[#0B192C] dark:text-blue-400">{selectedSubject}</span>
                      </h3>
                      <p className="text-xs text-slate-500">Select a topic module to start practicing question sets.</p>
                    </div>

                    <button
                      onClick={() => setCurrentLevel('subjects')}
                      className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-lg flex items-center gap-1"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back to Subjects
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {Object.keys(topicModulesMap).length === 0 ? (
                      <div className="col-span-full p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900">
                        No active practice questions uploaded for {selectedSubject} yet. Check back soon!
                      </div>
                    ) : (
                      Object.keys(topicModulesMap).map((tName) => {
                        const tQList = topicModulesMap[tName] || [];
                        return (
                          <div
                            key={tName}
                            onClick={() => handleOpenTopic(tName)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-400 rounded-lg p-5 shadow-xs hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
                          >
                            <div>
                              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 flex items-center justify-center mb-3">
                                <Folder className="w-5 h-5" />
                              </div>
                              <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">{tName}</h4>
                              <p className="text-xs text-slate-500">{Math.min(10, tQList.length)} Questions per Set</p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-bold text-[#0B192C] dark:text-blue-400">
                              <span>Start Practice</span>
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ALL QUESTIONS MODE */}
          {!activeSession && viewMode === 'all' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">All Practice Questions</h3>
                  <p className="text-xs text-slate-500">Pick any question set to begin interactive practice.</p>
                </div>
                <button
                  onClick={() => handleOpenTopic('All Topics')}
                  className="px-4 py-2 bg-brand-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
                >
                  <PlayCircle className="w-4 h-4" /> Start All Practice
                </button>
              </div>
            </div>
          )}
        </main>

      {/* MODE SELECTION MODAL */}
      {showModeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Choose Practice Mode</h3>
              <p className="text-xs text-slate-500">
                Select your preferred mode for <strong className="text-slate-800 dark:text-slate-200">{selectedTopic || 'Practice Set'}</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Practice Mode Option */}
              <div
                onClick={() => setSelectedMode('practice')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-3 ${
                  selectedMode === 'practice'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">Practice Mode</h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    • Forward Stopwatch Timer<br />
                    • Per-question answer check<br />
                    • Instant solution reveal
                  </p>
                </div>
              </div>

              {/* Quiz Mode Option */}
              <div
                onClick={() => setSelectedMode('quiz')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-3 ${
                  selectedMode === 'quiz'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">Quiz Mode</h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    • Backwards Countdown Timer<br />
                    • Timed assessment simulation<br />
                    • Final submission evaluation
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModeModal(false)}
                className="px-4 py-2 border border-slate-300 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleStartSession(selectedMode)}
                className="px-6 py-2 bg-[#0B192C] hover:bg-[#060E18] text-white text-xs font-extrabold rounded-lg transition-colors shadow-xs"
              >
                Start {selectedMode === 'practice' ? 'Practice' : 'Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FINAL SUBMIT CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-lg text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Submit {activeSession === 'quiz' ? 'Quiz' : 'Practice Set'}?
              </h3>
              <p className="text-xs text-slate-500">
                You have answered {Object.keys(userAnswers).length} of {filteredQuestions.length} questions.
              </p>
            </div>

            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-slate-300 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300"
              >
                Resume
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleFinalSubmit('manual')}
                className="px-6 py-2 bg-brand-800 hover:bg-brand-900 text-white text-xs font-bold rounded-lg transition-colors"
              >
                {submitting ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEAVE SESSION CONFIRMATION MODAL */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Leave Test Session?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                If you choose to leave now, all your current progress in this session will be lost and you will have to start over again.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors"
              >
                Continue Session
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLeaveModal(false);
                  handleResetSession();
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl transition-colors shadow-sm"
              >
                Leave Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
