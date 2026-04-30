'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DISCLAIMER } from '@/lib/constants';

export function DisclaimerBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('disclaimer-dismissed');
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('disclaimer-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-auto z-50 bg-warn/95 backdrop-blur-sm border-t md:border-b border-warn/20">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <AlertTriangle className="w-5 h-5 text-navy flex-shrink-0 mt-0.5" />
          <p className="text-sm text-navy font-medium">{DISCLAIMER}</p>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 hover:bg-warn/80 rounded transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5 text-navy" />
        </button>
      </div>
    </div>
  );
}
