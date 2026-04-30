'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, FileText, AlertOctagon, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { RiskMeter } from '@/components/ui/RiskMeter';
import { TrustScore } from '@/components/ui/TrustScore';
import type { AnalysisResult } from '@/types';

interface DocumentSummaryProps {
  result: AnalysisResult;
  className?: string;
}

export function DocumentSummary({ result, className = '' }: DocumentSummaryProps) {
  const highRiskCount = result.terms.filter((t) => t.riskLevel === 'high').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      <Card className="p-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                {result.documentType}
              </h2>
              <p className="text-muted">{result.summary}</p>
            </div>

            <RiskMeter riskLevel={result.overallRisk} />

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted" />
                <span className="text-sm text-muted">
                  <span className="text-foreground font-medium">{result.termCount}</span> terms found
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-danger" />
                <span className="text-sm text-muted">
                  <span className="text-danger font-medium">{result.predatoryCount}</span> predatory clauses
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warn" />
                <span className="text-sm text-muted">
                  <span className="text-warn font-medium">{highRiskCount}</span> high-risk items
                </span>
              </div>
            </div>

            {result.keyWarnings.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  Key Warnings
                </h3>
                {result.keyWarnings.map((warning, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-lg bg-warn/10 border border-warn/20"
                  >
                    <AlertTriangle className="w-5 h-5 text-warn flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-black">{warning}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-primary/50">
            <TrustScore score={result.trustScore} label={result.trustScoreLabel} />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
