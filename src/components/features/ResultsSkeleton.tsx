'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';

const STAGES = [
  { label: 'Reading document', target: 12, duration: 1200 },
  { label: 'Identifying clauses', target: 30, duration: 3000 },
  { label: 'Analysing risks', target: 55, duration: 5000 },
  { label: 'Calculating trust score', target: 72, duration: 4000 },
  { label: 'Building report', target: 88, duration: 4000 },
  { label: 'Finalising analysis', target: 99, duration: 8000 },
];

export function ResultsSkeleton() {
  const [progress, setProgress] = useState(0);
  const [stageLabel, setStageLabel] = useState(STAGES[0].label);

  useEffect(() => {
    let cancelled = false;
    let current = 0;

    const runStages = async () => {
      for (const stage of STAGES) {
        if (cancelled) return;
        setStageLabel(stage.label);

        const steps = stage.target - current;
        const stepDuration = stage.duration / steps;

        for (let i = 0; i < steps; i++) {
          if (cancelled) return;
          await new Promise(r => setTimeout(r, stepDuration));
          current += 1;
          setProgress(current);
        }
      }
    };

    runStages();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="p-6 bg-secondary-1 border border-primary/10 rounded-xl"
      >
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="h-8 bg-primary/10 rounded-lg w-3/4" />
            <div className="space-y-2">
              <div className="h-4 bg-primary/10 rounded w-full" />
              <div className="h-4 bg-primary/10 rounded w-5/6" />
            </div>
            <div className="h-2 bg-primary/10 rounded-full w-full" />
            <div className="flex gap-4">
              <div className="h-4 bg-primary/10 rounded w-24" />
              <div className="h-4 bg-primary/10 rounded w-28" />
              <div className="h-4 bg-primary/10 rounded w-24" />
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-primary/10" />
          </div>
        </div>
      </motion.div>

      {/* Progress section */}
      <div className="px-2 space-y-3">
        <div className="flex items-center justify-between">
          <motion.span
            key={stageLabel}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-sm text-muted"
          >
            {stageLabel}
          </motion.span>
          <span className="text-sm font-medium tabular-nums" style={{ color: 'var(--color-primary, inherit)' }}>
            {progress}%
          </span>
        </div>

        {/* Track */}
        <div className="h-1.5 w-full rounded-full bg-primary/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.1,
            }}
            className="p-5 bg-secondary-1 border border-primary/10 rounded-xl space-y-3"
          >
            <div className="h-6 bg-primary/10 rounded w-1/2" />
            <div className="h-4 bg-primary/10 rounded w-full" />
            <div className="h-4 bg-primary/10 rounded w-3/4" />
            <div className="h-12 bg-primary/10 rounded" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
