'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Language } from '@/types';

interface UseLanguageReturn {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

export function useLanguage(onLanguageChange?: (lang: Language) => void): UseLanguageReturn {
  const [language, setLanguageState] = useState<Language>('en');

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    onLanguageChange?.(lang);
  }, [onLanguageChange]);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === 'en' ? 'hi' : 'en'));
  }, []);

  return {
    language,
    setLanguage,
    toggleLanguage,
  };
}
