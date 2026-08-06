import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { HeaderProvider } from '@/context/HeaderContext';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ExamMaster - Competitive Exam Preparation Portal',
  description: 'Student application for topic-wise practice sets, full-length mock tests, progress tracking, and course leaderboards.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`light ${plusJakartaSans.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');localStorage.setItem('exammaster_theme','light');var palette=localStorage.getItem('exammaster_color_palette')||'default';document.documentElement.setAttribute('data-color-palette',palette);}catch(e){}})()`,
          }}
        />
      </head>
      <body className="bg-slate-50 text-slate-900 min-h-screen font-sans antialiased">
        <HeaderProvider>
          <GlobalHeader />
          {children}
          <MobileBottomNav />
        </HeaderProvider>
      </body>
    </html>
  );
}
