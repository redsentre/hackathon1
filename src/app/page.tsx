'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { ChevronDown, Upload, Cpu, CheckCircle, Shield, Lock, Globe, Heart } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { DisclaimerBanner } from '@/components/layout/DisclaimerBanner';
import { InputSection } from '@/components/features/InputSection';
import { ResultsSkeleton } from '@/components/features/ResultsSection';
import { useAnalyze } from '@/hooks/useAnalyze';
import type { Language } from '@/types';

const ResultsSection = dynamic(
  () => import('@/components/features/ResultsSection').then(mod => ({ default: mod.ResultsSection })),
  { loading: () => <ResultsSkeleton /> }
);

export default function Home() {
  const resultsRef = useRef<HTMLDivElement>(null);
  const { isLoading, result, documentText, analyzeText, reset } = useAnalyze();
  const [language, setLanguage] = useState<Language>('en');

  const handleAnalyze = useCallback((text: string, lang: Language) => {
    setLanguage(lang);
    analyzeText(text, lang);
  }, [analyzeText]);

  const handleReset = useCallback(() => {
    reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [reset]);

  useEffect(() => {
    if (result && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  return (
    <div className="min-h-screen flex flex-col">
      <DisclaimerBanner />
      <Header />

      <main className="flex-1">
        {/* Section 1 — HERO */}
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />

          <div className="relative max-w-4xl mx-auto px-4 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-6 leading-tight"
            >
              Finance speaks a language designed to confuse you.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-lg md:text-xl text-muted mb-8"
            >
              ArthSaathi translates every term — instantly, privately, for free.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-wrap justify-center gap-4 mb-12"
            >
              <div className="px-4 py-2 rounded-full bg-secondary-1 border border-primary/10 text-sm">
                <span className="text-primary font-bold">27%</span> Financial Literacy in India
              </div>
              <div className="px-4 py-2 rounded-full bg-secondary-1 border border-primary/10 text-sm">
                <span className="text-danger font-bold">85%</span> abandon decisions due to jargon
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex justify-center"
            >
              <ChevronDown className="w-6 h-6 text-muted animate-bounce" />
            </motion.div>
          </div>
        </section>

        {/* Section 2 — INPUT */}
        <section className="max-w-4xl mx-auto px-4 pb-16">
          <InputSection
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
            language={language}
            onLanguageChange={setLanguage}
          />
        </section>

        {/* Section 3 — RESULTS */}
        {(result || isLoading) && (
          <section ref={resultsRef} className="max-w-4xl mx-auto px-4 pb-16">
            {isLoading ? (
              <ResultsSkeleton />
            ) : result ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <ResultsSection
                  result={result}
                  documentText={documentText}
                  language={language}
                  onReset={handleReset}
                />
              </motion.div>
            ) : null}
          </section>
        )}

        {/* Section 4 — HOW IT WORKS */}
        <section className="max-w-4xl mx-auto px-4 py-16 border-t border-primary/10">
          <h2 className="text-2xl font-display font-bold text-foreground text-center mb-12">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Paste or Upload</h3>
              <p className="text-sm text-muted">
                Your document, any format — loan agreements, insurance policies, T&Cs
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Cpu className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">AI Detects</h3>
              <p className="text-sm text-muted">
                Every jargon term, hidden clause, and risk factor — instantly
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">You Understand</h3>
              <p className="text-sm text-muted">
                Plain language explanations, risk flags, and trust scores
              </p>
            </div>
          </div>
        </section>

        {/* Section 5 — ETHICS STRIP */}
        <section className="bg-secondary-1/50 border-y border-primary/10 py-12">
          <div className="max-w-4xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm text-muted">Not financial advice</span>
              </div>
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm text-muted">Privacy-safe</span>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm text-muted">No data stored</span>
              </div>
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm text-muted">Open to all</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6 — FUTURE SCOPE */}
        <section className="max-w-4xl mx-auto px-4 py-16">
          <details className="group">
            <summary className="cursor-pointer text-sm text-muted hover:text-foreground transition-colors">
              Future Scope (for judges)
            </summary>
            <div className="mt-4 pt-4 border-t border-primary/10 space-y-2 text-sm text-muted">
              <p>• Browser extension for real-time translation on any financial webpage</p>
              <p>• Direct fintech platform integration (banking apps, payment flows)</p>
              <p>• Multilingual expansion (Tamil, Telugu, Bengali, Marathi)</p>
              <p>• Personalized financial assistant with memory</p>
            </div>
          </details>
        </section>
      </main>

      <Footer />
    </div>
  );
}
