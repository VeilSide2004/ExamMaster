import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ExamMaster - Competitive Exam Preparation Portal',
  description: 'Student application for topic-wise practice sets, full-length mock tests, progress tracking, and course leaderboards.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
