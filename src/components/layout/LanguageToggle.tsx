'use client';

import type { Language } from '@/types';

interface LanguageToggleProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  className?: string;
}

export function LanguageToggle({ language, onLanguageChange, className = '' }: LanguageToggleProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        onClick={() => onLanguageChange('en')}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
          language === 'en'
            ? 'bg-teal text-white'
            : 'bg-transparent text-muted border border-white/20 hover:border-white/40'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => onLanguageChange('hi')}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
          language === 'hi'
            ? 'bg-teal text-white'
            : 'bg-transparent text-muted border border-white/20 hover:border-white/40'
        }`}
      >
        हिन्दी
      </button>
    </div>
  );
}
