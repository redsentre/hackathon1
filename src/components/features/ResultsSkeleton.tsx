'use client';

import { motion } from 'framer-motion';

export function ResultsSkeleton() {
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

      <div className="text-center py-8">
        <motion.span
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="text-muted"
        >
          Analyzing your document
        </motion.span>
        <motion.span
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
          className="text-muted"
        >
          .
        </motion.span>
        <motion.span
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          className="text-muted"
        >
          .
        </motion.span>
        <motion.span
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
          className="text-muted"
        >
          .
        </motion.span>
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
