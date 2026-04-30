'use client';

import { useState, useCallback } from 'react';
import { ArrowRight, FileText } from 'lucide-react';
import { SAMPLE_TEXT, MAX_TEXT_LENGTH } from '@/lib/constants';

interface TextInputProps {
  onAnalyze: (text: string) => void;
  isLoading: boolean;
  className?: string;
}

export function TextInput({ onAnalyze, isLoading, className = '' }: TextInputProps) {
  const [text, setText] = useState('');

  const charCount = text.length;
  const isNearLimit = charCount >= 3500;
  const isAtLimit = charCount >= MAX_TEXT_LENGTH;

  const handleLoadSample = useCallback(() => {
    setText(SAMPLE_TEXT);
  }, []);

  const handleAnalyze = useCallback(() => {
    if (text.trim() && !isLoading) {
      onAnalyze(text.trim());
    }
  }, [text, isLoading, onAnalyze]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  }, []);

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="relative">
        <textarea
          value={text}
          onChange={handleTextChange}
          placeholder="Paste your loan agreement, insurance policy, or financial T&C here..."
          aria-label="Document text input"
          aria-describedby="char-count"
          className={`w-full min-h-[200px] p-4 bg-secondary-1 border border-primary/10 rounded-xl text-foreground placeholder-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all ${
            isAtLimit ? 'ring-2 ring-danger/50 border-danger' : ''
          }`}
          disabled={isLoading}
        />
        <div id="char-count" className="absolute bottom-3 right-3 text-xs">
          <span
            className={`${
              isAtLimit
                ? 'text-danger'
                : isNearLimit
                ? 'text-warn'
                : 'text-muted'
            }`}
          >
            {charCount.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleLoadSample}
          disabled={isLoading}
          aria-label="Load sample text"
          className="px-4 py-2.5 rounded-lg border border-primary/20 text-muted hover:border-primary/40 hover:text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          Load Sample Text
        </button>
        <button
          onClick={handleAnalyze}
          disabled={!text.trim() || isLoading || isAtLimit}
          aria-label="Analyze document"
          className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-background font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary shadow-lg shadow-primary/20"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" aria-hidden="true" />
              Analyzing...
            </>
          ) : (
            <>
              Analyze Document
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
