'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, RefreshCw, CheckCircle, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { DocumentSummary } from './DocumentSummary';
import { TermCard } from './TermCard';
import { InteractiveQA } from './InteractiveQA';
import { ResultsSkeleton } from './ResultsSkeleton';
import type { AnalysisResult, JargonTerm, Language } from '@/types';

type FilterType = 'all' | 'high-risk' | 'predatory' | string;

interface ResultsSectionProps {
  result: AnalysisResult;
  documentText: string;
  language: Language;
  onReset: () => void;
  className?: string;
}

export function ResultsSection({
  result,
  documentText,
  language,
  onReset,
  className = '',
}: ResultsSectionProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [copied, setCopied] = useState(false);

  const categories = Array.from(new Set(result.terms.map((t) => t.category)));

  const filteredTerms = result.terms.filter((term) => {
    if (filter === 'all') return true;
    if (filter === 'high-risk') return term.riskLevel === 'high';
    if (filter === 'predatory') return term.isPredatory;
    return term.category === filter;
  });

  const handleCopySummary = useCallback(async () => {
    const summary = `
${result.documentType}

Summary:
${result.summary}

Overall Risk: ${result.overallRisk}
Trust Score: ${result.trustScore}/100 - ${result.trustScoreLabel}

Key Warnings:
${result.keyWarnings.map((w, i) => `${i + 1}. ${w}`).join('\n')}

Terms Found: ${result.termCount}
Predatory Clauses: ${result.predatoryCount}
    `.trim();

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      toast.success('Summary copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy summary');
    }
  }, [result]);

  const handleFilterChange = useCallback((newFilter: FilterType) => {
    setFilter(newFilter);
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      <DocumentSummary result={result} />

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-display font-bold text-white">
          {result.termCount} Jargon Terms Found
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleCopySummary}
            aria-label="Copy summary to clipboard"
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 text-muted hover:border-white/40 hover:text-white transition-all text-sm"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 text-success" aria-hidden="true" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" aria-hidden="true" />
                Copy Summary
              </>
            )}
          </button>
          <button
            onClick={onReset}
            aria-label="Analyze a new document"
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 text-muted hover:border-white/40 hover:text-white transition-all text-sm"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Analyze New
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleFilterChange('all')}
          aria-label="Show all terms"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            filter === 'all'
              ? 'bg-teal text-white'
              : 'bg-transparent text-muted border border-white/20 hover:border-white/40'
          }`}
        >
          All
        </button>
        <button
          onClick={() => handleFilterChange('high-risk')}
          aria-label="Show high risk terms"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            filter === 'high-risk'
              ? 'bg-teal text-white'
              : 'bg-transparent text-muted border border-white/20 hover:border-white/40'
          }`}
        >
          High Risk
        </button>
        <button
          onClick={() => handleFilterChange('predatory')}
          aria-label="Show predatory clauses"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            filter === 'predatory'
              ? 'bg-teal text-white'
              : 'bg-transparent text-muted border border-white/20 hover:border-white/40'
          }`}
        >
          Predatory
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleFilterChange(cat)}
            aria-label={`Show ${cat} terms`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === cat
                ? 'bg-teal text-white'
                : 'bg-transparent text-muted border border-white/20 hover:border-white/40'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {filteredTerms.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
            <p className="text-muted">No terms match this filter</p>
          </motion.div>
        ) : (
          <motion.div
            key="terms"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid md:grid-cols-2 gap-4"
          >
            {filteredTerms.map((term, idx) => (
              <TermCard key={term.term} term={term} index={idx} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <InteractiveQA documentText={documentText} language={language} />
    </div>
  );
}

export { ResultsSkeleton };
