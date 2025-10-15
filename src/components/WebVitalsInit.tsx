'use client';

import { useEffect } from 'react';
import { initWebVitals } from '@/lib/monitoring/web-vitals-tracker';

/**
 * Web Vitals Initialization Component
 * Initializes Core Web Vitals tracking on mount
 */
export default function WebVitalsInit() {
  useEffect(() => {
    // Initialize web vitals tracking
    initWebVitals();
  }, []);

  // This component doesn't render anything
  return null;
}
