'use client';

import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, AlertTriangle, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import type { JargonTerm } from '@/types';

interface TermCardProps {
  term: JargonTerm;
  index: number;
  className?: string;
}

function TermCardComponent({ term, index, className = '' }: TermCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getGlowColor = () => {
    switch (term.riskLevel) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warn';
      case 'low':
        return 'success';
      default:
        return 'teal';
    }
  };

  const getBottomLineColor = () => {
    switch (term.riskLevel) {
      case 'high':
        return 'bg-danger/10 border-danger/30 text-danger';
      case 'medium':
        return 'bg-warn/10 border-warn/30 text-warn';
      case 'low':
        return 'bg-success/10 border-success/30 text-success';
      default:
        return 'bg-teal/10 border-teal/30 text-teal';
    }
  };

  const getBottomLineIcon = () => {
    return term.riskLevel === 'high' ? AlertTriangle : Zap;
  };

  const BottomLineIcon = getBottomLineIcon();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
      className={className}
    >
      <Card
        glowColor={getGlowColor() as any}
        className="overflow-hidden hover:shadow-xl transition-shadow"
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left"
          aria-expanded={isExpanded}
          aria-label={`Toggle details for ${term.term}`}
        >
          <div className="p-5">
            {term.isPredatory && (
              <div className="mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-danger/20 text-danger border border-danger/30">
                  <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                  Predatory Clause
                </span>
              </div>
            )}

            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-lg font-display font-bold text-white">
                {term.term}
              </h3>
              <div className="flex items-center gap-2 flex-shrink-0" aria-hidden="true">
                <Badge variant={term.riskLevel} />
                <Badge variant="category" category={term.category} />
              </div>
            </div>

            <div className="text-base text-muted-light mb-4">
              {term.explanation}
            </div>

            <div
              className={`p-3 rounded-lg border ${getBottomLineColor()}`}
            >
              <div className="flex items-start gap-2">
                <BottomLineIcon className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <div className="text-xs uppercase tracking-wider mb-1 opacity-70">
                    Bottom Line
                  </div>
                  <p className="font-semibold text-sm">
                    {term.bottomLine}
                  </p>
                </div>
              </div>
            </div>

            {term.predatoryReason && (
              <div className="mt-3 p-3 rounded-lg bg-danger/10 border border-danger/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-sm text-danger/90">{term.predatoryReason}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center px-5 py-2 border-t border-white/5 bg-white/5">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted" aria-hidden="true" />
            )}
          </div>
        </button>
      </Card>
    </motion.div>
  );
}

export const TermCard = memo(TermCardComponent);
