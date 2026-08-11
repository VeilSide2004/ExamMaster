import React from 'react';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  subtitle?: string;
  disableLink?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 36,
  showText = true,
  disableLink = false,
}) => {
  const content = (
    <div className={`flex items-center gap-2.5 cursor-pointer group ${className}`}>
      <div
        style={{ width: size, height: size }}
        className="rounded-xl bg-blue-600 group-hover:bg-blue-700 transition-colors flex items-center justify-center shadow-xs shrink-0 border border-blue-500/30 text-white"
      >
        <BookOpen className="w-5 h-5 text-white stroke-[2.5]" />
      </div>

      {showText && (
        <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white font-sans group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          Examizo
        </span>
      )}
    </div>
  );

  if (disableLink) {
    return content;
  }

  return <Link href="/">{content}</Link>;
};
