'use client';

import React, { useState, useCallback } from 'react';

interface HindiTranslateButtonProps {
  texts: string[];
  onTranslated: (translatedTexts: string[]) => void;
  onReset: () => void;
  isTranslated: boolean;
}

export async function translateToHindi(texts: string[]): Promise<string[]> {
  const results: string[] = [];
  for (const text of texts) {
    if (!text || !text.trim()) {
      results.push(text);
      continue;
    }
    try {
      const encoded = encodeURIComponent(text);
      const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=' + encoded;
      const res = await fetch(url);
      const data = await res.json();
      const translated = (data[0] as any[])?.map((chunk: any[]) => chunk[0]).join('') || text;
      results.push(translated);
    } catch {
      results.push(text);
    }
  }
  return results;
}

export function HindiTranslateButton({ texts, onTranslated, onReset, isTranslated }: HindiTranslateButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    if (isTranslated) {
      onReset();
      return;
    }
    setLoading(true);
    try {
      const translated = await translateToHindi(texts);
      onTranslated(translated);
    } finally {
      setLoading(false);
    }
  }, [texts, isTranslated, onTranslated, onReset]);

  const activeClass = isTranslated
    ? 'bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100 dark:bg-orange-950/60 dark:border-orange-700 dark:text-orange-300'
    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-blue-950 dark:hover:border-blue-700 dark:hover:text-blue-300';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      title={isTranslated ? 'Switch back to English' : 'Translate to Hindi'}
      className={'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-200 select-none shrink-0 disabled:opacity-60 disabled:cursor-wait ' + activeClass}
    >
      {loading ? (
        <>
          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <span>अनुवाद...</span>
        </>
      ) : isTranslated ? (
        <>
          <span>🔤</span>
          <span>English</span>
        </>
      ) : (
        <>
          <span>🇮🇳</span>
          <span>हिंदी</span>
        </>
      )}
    </button>
  );
}