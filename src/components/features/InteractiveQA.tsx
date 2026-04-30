'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { Language } from '@/types';

interface QAPair {
  question: string;
  answer: string;
}

interface InteractiveQAProps {
  documentText: string;
  language: Language;
  className?: string;
}

export function InteractiveQA({ documentText, language, className = '' }: InteractiveQAProps) {
  const [question, setQuestion] = useState('');
  const [qaPairs, setQaPairs] = useState<QAPair[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    const currentQuestion = question;
    setQuestion('');

    try {
      const response = await fetch('/api/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion,
          documentText,
          language,
        }),
      });

      const result = await response.json();

      if (result.success && result.answer) {
        setQaPairs((prev) => [
          { question: currentQuestion, answer: result.answer },
          ...prev,
        ].slice(0, 3));
      }
    } catch (error) {
      console.error('QA error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [question, isLoading, documentText, language]);

  const handleQuestionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuestion(e.target.value);
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="p-5">
        <h3 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Ask ArthSaathi
        </h3>

        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={question}
            onChange={handleQuestionChange}
            placeholder="Ask a question about this document..."
            aria-label="Question input"
            className="flex-1 px-4 py-2.5 bg-secondary-1 border border-primary/10 rounded-lg text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!question.trim() || isLoading}
            aria-label="Submit question"
            className="px-4 py-2.5 rounded-lg bg-primary text-background font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" aria-hidden="true" />
            ) : (
              <>
                <Send className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Ask</span>
              </>
            )}
          </button>
        </form>
      </Card>

      <AnimatePresence mode="popLayout">
        {qaPairs.map((pair, idx) => (
          <motion.div
            key={`${idx}-${pair.question.slice(0, 10)}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-primary">Q</span>
                  </div>
                  <p className="text-sm text-foreground font-medium">{pair.question}</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-secondary-1 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-muted">A</span>
                  </div>
                  <p className="text-sm text-black">{pair.answer}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
