'use client';

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import type { AnalysisResult, Language } from '@/types';

interface UseAnalyzeReturn {
  inputText: string;
  isLoading: boolean;
  result: AnalysisResult | null;
  error: string | null;
  analyzedFileName: string | null;
  documentText: string;
  analyzeText: (text: string, language: Language) => Promise<void>;
  analyzePDF: (file: File, language: Language) => Promise<void>;
  askQuestion: (question: string, language: Language) => Promise<string | null>;
  reset: () => void;
}

export function useAnalyze(): UseAnalyzeReturn {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyzedFileName, setAnalyzedFileName] = useState<string | null>(null);
  const [documentText, setDocumentText] = useState('');

  const handleError = (err: unknown, defaultMessage: string) => {
    if (err instanceof Error) {
      if (err.name === 'AbortError' || err.message.includes('timeout')) {
        setError('Request timed out. Try with shorter text.');
        toast.error('Request timed out. Try with shorter text.');
        return;
      }
      if (err.message.includes('fetch') || err.message.includes('network')) {
        setError('Connection failed. Check your internet.');
        toast.error('Connection failed. Check your internet.');
        return;
      }
    }
    setError(defaultMessage);
    toast.error(defaultMessage);
  };

  const analyzeText = useCallback(async (text: string, language: Language) => {
    console.log('analyzeText called with text length:', text.length, 'language:', language);
    setIsLoading(true);
    setError(null);
    setInputText(text);
    setDocumentText(text);
    setAnalyzedFileName(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    const startTime = Date.now();

    try {
      console.log('Sending request to /api/analyze');
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('Response received, status:', response.status);

      const data = await response.json();
      console.log('Response data:', data);

      if (response.status === 400) {
        handleError(data.error || 'Invalid input', data.error || 'Invalid input');
        return;
      }

      if (!response.ok) {
        handleError(null, 'Analysis failed. Please try again.');
        return;
      }

      if (data.success && data.data) {
        const elapsed = Date.now() - startTime;
        const remainingDelay = Math.max(0, 300 - elapsed);
        await new Promise(resolve => setTimeout(resolve, remainingDelay));

        setResult(data.data);
        toast.success(`Analysis complete — ${data.data.termCount} terms found (${data.data.predatoryCount} predatory clauses)`);
      } else {
        handleError(data.error || 'Failed to analyze', data.error || 'Failed to analyze');
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Fetch error in analyzeText:', err);
      handleError(err, 'Analysis failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const analyzePDF = useCallback(async (file: File, language: Language) => {
    console.log('analyzePDF called with file:', file.name, 'language:', language);
    setIsLoading(true);
    setError(null);
    setAnalyzedFileName(file.name);
    setInputText('');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    const startTime = Date.now();

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', language);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.status === 400) {
        handleError(data.error || 'Invalid file', data.error || 'Invalid file');
        return;
      }

      if (!response.ok) {
        handleError(null, 'Analysis failed. Please try again.');
        return;
      }

      if (data.success && data.data) {
        const elapsed = Date.now() - startTime;
        const remainingDelay = Math.max(0, 300 - elapsed);
        await new Promise(resolve => setTimeout(resolve, remainingDelay));

        setResult(data.data);
        setDocumentText(data.data.summary || '');
        toast.success(`PDF analyzed — ${data.data.termCount} terms found (${data.data.predatoryCount} predatory clauses)`);
      } else {
        handleError(data.error || 'Failed to analyze PDF', data.error || 'Failed to analyze PDF');
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Fetch error in analyzePDF:', err);
      handleError(err, 'Analysis failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const askQuestion = useCallback(async (question: string, language: Language): Promise<string | null> => {
    if (!documentText) {
      toast.error('No document to ask about');
      return null;
    }

    try {
      const response = await fetch('/api/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, documentText, language }),
      });

      const data = await response.json();

      if (data.success && data.answer) {
        toast.success('ArthSaathi answered your question');
        return data.answer;
      }

      toast.error(data.error || 'Failed to get answer');
      return null;
    } catch (err) {
      handleError(err, 'Failed to get answer');
      return null;
    }
  }, [documentText]);

  const reset = useCallback(() => {
    setInputText('');
    setIsLoading(false);
    setResult(null);
    setError(null);
    setAnalyzedFileName(null);
    setDocumentText('');
  }, []);

  return {
    inputText,
    isLoading,
    result,
    error,
    analyzedFileName,
    documentText,
    analyzeText,
    analyzePDF,
    askQuestion,
    reset,
  };
}
