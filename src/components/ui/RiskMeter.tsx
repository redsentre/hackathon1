'use client';

import { motion } from 'framer-motion';
import type { RiskLevel } from '@/types';

interface RiskMeterProps {
  riskLevel: RiskLevel;
  className?: string;
}

export function RiskMeter({ riskLevel, className = '' }: RiskMeterProps) {
  const getActiveSegment = () => {
    switch (riskLevel) {
      case 'low':
        return 1;
      case 'medium':
        return 2;
      case 'high':
        return 3;
      default:
        return 1;
    }
  };

  const activeSegment = getActiveSegment();

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <span className="text-xs text-muted uppercase tracking-wider">Overall Document Risk</span>
      <div className="flex h-2 rounded-full overflow-hidden bg-white/10">
        <motion.div
          className="h-full bg-success"
          initial={{ opacity: 0.2 }}
          animate={{ opacity: activeSegment >= 1 ? 1 : 0.2 }}
          transition={{ duration: 0.5 }}
          style={{ width: '33.33%' }}
        />
        <motion.div
          className="h-full bg-warn"
          initial={{ opacity: 0.2 }}
          animate={{ opacity: activeSegment >= 2 ? 1 : 0.2 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ width: '33.33%' }}
        />
        <motion.div
          className="h-full bg-danger"
          initial={{ opacity: 0.2 }}
          animate={{ opacity: activeSegment >= 3 ? 1 : 0.2 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ width: '33.34%' }}
        />
      </div>
    </div>
  );
}
