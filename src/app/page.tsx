import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/common/Logo';
import { 
  BookOpen, 
  Trophy, 
  Target, 
  Zap, 
  BarChart3, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  Award,
  Users,
  Brain,
  ChevronRight,
  GraduationCap
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">
      
      {/* Background Decorative Glow Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px]" />
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] bg-indigo-600/15 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-[128px]" />
      </div>

      {/* 1. PUBLIC LANDING NAVBAR */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Logo size={40} />
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#features" className="hover:text-blue-400 transition-colors">Features</a>
            <a href="#exams" className="hover:text-blue-400 transition-colors">Exams Covered</a>
            <a href="#how-it-works" className="hover:text-blue-400 transition-colors">How It Works</a>
            <a href="#leaderboard-preview" className="hover:text-blue-400 transition-colors">Leaderboard</a>
          </nav>

          {/* Auth Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 text-sm font-bold text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all border border-slate-700/60"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="relative z-10 flex-1">
        
        {/* 2. HERO SECTION */}
        <section className="relative pt-16 pb-24 lg:pt-24 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            
            {/* Top Pill Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider backdrop-blur-md animate-fade-in">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Next-Gen Competitive Exam Portal</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1]">
              Master Competitive Exams with{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
                Precision & Confidence
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
              Examizo provides real-time mock tests, topic-wise practice DPPs, instant analytics, and national leaderboards engineered for top aspirants.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-base shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
              >
                <span>Start Free Practice Now</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 hover:text-white font-extrabold text-base border border-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <span>Sign In to Existing Account</span>
              </Link>
            </div>

            {/* Feature Trust Badges */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Full Pattern Mock Tests</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Instant Score & Rank Analytics</span>
              </div>
            </div>
          </div>

          {/* Hero Interactive UI Preview Mockup */}
          <div className="mt-16 relative max-w-5xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
            <div className="relative bg-slate-950/90 rounded-3xl border border-slate-800 p-4 sm:p-6 shadow-2xl overflow-hidden backdrop-blur-xl">
              {/* Fake Window Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-mono text-slate-500">examizo.com/practice/live-session</span>
                </div>
                <div className="flex items-center gap-2 bg-blue-950/50 border border-blue-800/50 px-3 py-1 rounded-full text-xs font-semibold text-blue-300">
                  <Clock className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                  <span>Time Left: 02:45:12</span>
                </div>
              </div>

              {/* Mock Test UI Card Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span className="text-blue-400">Question 14 of 90</span>
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">JEE Advanced • Physics</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-200 leading-relaxed">
                    A particle moves along the x-axis with velocity v(t) = 3t² - 6t. Calculate the total displacement of the particle from t = 0 to t = 4 seconds.
                  </p>
                  <div className="space-y-2 pt-2">
                    {['16 units', '32 units', '8 units', '24 units'].map((opt, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                          i === 0
                            ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span>{String.fromCharCode(65 + i)}. {opt}</span>
                        {i === 0 && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sidebar Metrics Mockup */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider mb-3">Live Session Stats</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                        <span className="text-xs text-slate-400">Answered</span>
                        <span className="text-xs font-bold text-emerald-400">12 / 15</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                        <span className="text-xs text-slate-400">Accuracy Rate</span>
                        <span className="text-xs font-bold text-blue-400">93.3%</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                        <span className="text-xs text-slate-400">Projected Rank</span>
                        <span className="text-xs font-bold text-amber-400">#4 (Top 1%)</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/register"
                    className="w-full py-2.5 text-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all block"
                  >
                    Try Live Demo →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. STATS STRIP */}
        <section className="border-y border-slate-800 bg-slate-950/60 py-12 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-white">50,000+</p>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Aspirants</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-blue-400">10,000+</p>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Curated Questions</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-indigo-400">500+</p>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Mock Exams</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-emerald-400">98.4%</p>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Student Success Rate</p>
            </div>
          </div>
        </section>

        {/* 4. KEY FEATURES SECTION */}
        <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <span>Why Choose Examizo</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Engineered for Academic Excellence
            </h2>
            <p className="text-slate-400 text-base">
              Everything you need to systematically prepare, test, and outperform in competitive examinations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-slate-950/70 border border-slate-800 hover:border-blue-500/50 transition-all duration-300 space-y-4 group">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Target className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white">Topic-Wise Practice</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Break down complex subjects into targeted daily practice sets (DPPs) with detailed step-by-step solutions.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 space-y-4 group">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white">Real Exam Simulator</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Experience exact test interfaces, countdown timers, negative marking logic, and section switching.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 space-y-4 group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Trophy className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white">Live Leaderboards</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Compete with thousands of students nationwide, earn XP, track ranks, and challenge your study peers.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-3xl bg-slate-950/70 border border-slate-800 hover:border-purple-500/50 transition-all duration-300 space-y-4 group">
              <div className="w-14 h-14 rounded-2xl bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white">In-Depth Analytics</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Identify weak chapters, time taken per question, accuracy breakdowns, and AI rank forecasts.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-3xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/50 transition-all duration-300 space-y-4 group">
              <div className="w-14 h-14 rounded-2xl bg-amber-600/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Brain className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white">Adaptive Learning</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Smart revision flags allow you to bookmark tricky questions and re-attempt them before final exams.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-3xl bg-slate-950/70 border border-slate-800 hover:border-rose-500/50 transition-all duration-300 space-y-4 group">
              <div className="w-14 h-14 rounded-2xl bg-rose-600/10 border border-rose-500/20 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white">Verified Content</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                All questions and solutions are created and peer-reviewed by expert faculties and top rankers.
              </p>
            </div>
          </div>
        </section>

        {/* 5. EXAMS COVERED SECTION */}
        <section id="exams" className="py-20 bg-slate-950/60 border-y border-slate-800 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-black text-white">Targeted Exam Preparation</h2>
              <p className="text-slate-400 text-sm">Comprehensive question banks aligned with current exam syllabi.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { name: 'JEE Main & Adv', icon: GraduationCap, count: '3,500+ Qs', color: 'from-blue-500/20 to-blue-600/10' },
                { name: 'NEET UG', icon: BookOpen, count: '4,200+ Qs', color: 'from-emerald-500/20 to-emerald-600/10' },
                { name: 'GATE', icon: Zap, count: '2,800+ Qs', color: 'from-purple-500/20 to-purple-600/10' },
                { name: 'UPSC CSE', icon: Award, count: '1,900+ Qs', color: 'from-amber-500/20 to-amber-600/10' },
                { name: 'SSC CGL', icon: Target, count: '3,100+ Qs', color: 'from-rose-500/20 to-rose-600/10' },
                { name: 'Banking (IBPS)', icon: Users, count: '2,500+ Qs', color: 'from-indigo-500/20 to-indigo-600/10' },
              ].map((exam, i) => (
                <div
                  key={i}
                  className={`p-5 rounded-2xl bg-gradient-to-b ${exam.color} border border-slate-800 text-center space-y-3 hover:-translate-y-1 transition-all`}
                >
                  <exam.icon className="w-8 h-8 mx-auto text-slate-200" />
                  <div>
                    <p className="text-sm font-extrabold text-white">{exam.name}</p>
                    <p className="text-[11px] font-semibold text-slate-400 mt-1">{exam.count}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. HOW IT WORKS SECTION */}
        <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black text-white">Three Steps to Rank 1</h2>
            <p className="text-slate-400 text-sm">Getting started takes less than two minutes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 relative">
              <span className="w-10 h-10 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center mx-auto">1</span>
              <h3 className="text-lg font-bold text-white">Create Your Free Account</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sign up with Google or Email and select your target examination course.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 relative">
              <span className="w-10 h-10 rounded-full bg-indigo-600 text-white font-black text-sm flex items-center justify-center mx-auto">2</span>
              <h3 className="text-lg font-bold text-white">Solve Daily Practice & Mocks</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Attempt timed tests and topic-wise DPPs with instant automated evaluation.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 relative">
              <span className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center mx-auto">3</span>
              <h3 className="text-lg font-bold text-white">Analyze & Rank Up</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Review detailed performance metrics, fix weak spots, and top the leaderboard.
              </p>
            </div>
          </div>
        </section>

        {/* 7. BOTTOM CTA BANNER */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="relative rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-10 sm:p-16 text-center space-y-8 overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)]" />
            <div className="relative z-10 max-w-3xl mx-auto space-y-4">
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Ready to Elevate Your Exam Preparation?
              </h2>
              <p className="text-blue-100 text-sm sm:text-base">
                Join Examizo today and experience precision testing designed to help you achieve your dream rank.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-slate-900 font-extrabold text-base hover:bg-slate-100 shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <span>Create Free Student Account</span>
                  <ArrowRight className="w-4 h-4 text-slate-900" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-900/60 hover:bg-blue-900/80 text-white font-extrabold text-base border border-blue-400/30 transition-all flex items-center justify-center gap-2"
                >
                  <span>Sign In</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* 8. PUBLIC FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 py-12 px-4 sm:px-6 lg:px-8 relative z-10 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Logo size={32} />
            <span className="text-slate-500 font-medium">| Academic Precision Portal</span>
          </div>

          <div className="flex items-center gap-6 font-semibold">
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-white transition-colors">Register</Link>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#exams" className="hover:text-white transition-colors">Exams</a>
          </div>

          <p className="text-slate-500">
            © 2026 Examizo. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
