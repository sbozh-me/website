'use client';

import { useEffect } from 'react';
import { initPerformanceTracking } from '@/lib/analytics/performance';
import { configureDataRetention } from '@/lib/analytics/retention';

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize performance tracking
    initPerformanceTracking();

    // Configure data retention
    configureDataRetention();

    // Log initialization
    console.log('[Analytics] Performance tracking initialized');
  }, []);

  return <>{children}</>;
}