'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { LanguageToggle } from '@/components/layout/LanguageToggle';
import { TextInput } from './TextInput';
import { PdfUpload } from './PdfUpload';
import type { Language } from '@/types';

type InputTab = 'text' | 'pdf';

interface InputSectionProps {
  onAnalyze: (text: string, language: Language) => void;
  isLoading: boolean;
  className?: string;
  language?: Language;
  onLanguageChange?: (lang: Language) => void;
}

export function InputSection({ onAnalyze, isLoading, className = '', language: propLanguage, onLanguageChange }: InputSectionProps) {
  const [activeTab, setActiveTab] = useState<InputTab>('text');
  const [internalLanguage, setInternalLanguage] = useState<Language>('en');

  const language = propLanguage ?? internalLanguage;
  const isControlled = propLanguage !== undefined;

  const handleAnalyze = useCallback((text: string) => {
    onAnalyze(text, language);
  }, [onAnalyze, language]);

  const handleFileExtracted = useCallback((text: string) => {
    onAnalyze(text, language);
  }, [onAnalyze, language]);

  const handleTabChange = useCallback((tab: InputTab) => {
    setActiveTab(tab);
  }, []);

  const handleLanguageChange = useCallback((newLanguage: Language) => {
    if (!isControlled) {
      setInternalLanguage(newLanguage);
    }
    onLanguageChange?.(newLanguage);
  }, [isControlled, onLanguageChange]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1" role="tablist">
          <button
            onClick={() => handleTabChange('text')}
            role="tab"
            aria-selected={activeTab === 'text'}
            aria-controls="text-panel"
            className={`px-4 py-2 text-sm font-medium transition-all relative ${
              activeTab === 'text' ? 'text-white' : 'text-muted hover:text-white'
            }`}
          >
            Paste Text
            {activeTab === 'text' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal rounded-full" />
            )}
          </button>
          <button
            onClick={() => handleTabChange('pdf')}
            role="tab"
            aria-selected={activeTab === 'pdf'}
            aria-controls="pdf-panel"
            className={`px-4 py-2 text-sm font-medium transition-all relative ${
              activeTab === 'pdf' ? 'text-white' : 'text-muted hover:text-white'
            }`}
          >
            Upload PDF
            {activeTab === 'pdf' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal rounded-full" />
            )}
          </button>
        </div>
        <LanguageToggle language={language} onLanguageChange={handleLanguageChange} />
      </div>

      {activeTab === 'text' ? (
        <div id="text-panel" role="tabpanel" aria-labelledby="text-tab">
          <TextInput onAnalyze={handleAnalyze} isLoading={isLoading} />
        </div>
      ) : (
        <div id="pdf-panel" role="tabpanel" aria-labelledby="pdf-tab">
          <PdfUpload onFileExtracted={handleFileExtracted} isLoading={isLoading} />
        </div>
      )}
      </Card>
    </motion.div>
  );
}
