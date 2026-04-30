'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface TrustScoreProps {
  score: number;
  label: string;
  className?: string;
}

export function TrustScore({ score, label, className = '' }: TrustScoreProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(score);
  }, [score]);

  const getColor = () => {
    if (score >= 70) return '#10B981';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="45"
            stroke="#BAB6AA"
            strokeWidth="6"
            fill="none"
          />
          <motion.circle
            cx="48"
            cy="48"
            r="45"
            stroke={getColor()}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{score}</span>
        </div>
      </div>
      <span className="mt-2 text-xs text-muted text-center max-w-32">{label}</span>
    </div>
  );
}
