'use client';

import { onCLS, onFCP, onFID, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

/**
 * Web Vitals Tracker
 * Tracks all 6 Core Web Vitals metrics and sends them to analytics endpoint
 *
 * Metrics tracked:
 * - LCP (Largest Contentful Paint): Loading performance
 * - FID (First Input Delay): Interactivity [deprecated in favor of INP]
 * - CLS (Cumulative Layout Shift): Visual stability
 * - FCP (First Contentful Paint): Initial rendering
 * - TTFB (Time to First Byte): Server response time
 * - INP (Interaction to Next Paint): Responsiveness
 */

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
  page: string;
  timestamp: number;
}

const ANALYTICS_ENDPOINT = '/api/analytics/web-vitals';

/**
 * Send metric to analytics endpoint
 */
function sendToAnalytics(metric: Metric): void {
  const page = window.location.pathname;
  const navigationType = (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming)?.type || 'navigate';

  const body: WebVitalMetric = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType,
    page,
    timestamp: Date.now(),
  };

  // Use sendBeacon if available (more reliable for page unload events)
  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
    navigator.sendBeacon(ANALYTICS_ENDPOINT, blob);
  } else {
    // Fallback to fetch
    fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true, // Ensure request completes even if page is unloading
    }).catch((error) => {
      // Silently fail - don't disrupt user experience
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to send web vital:', error);
      }
    });
  }

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      page,
    });
  }
}

/**
 * Send metric to Prometheus-compatible endpoint
 * This allows integration with existing Prometheus monitoring
 */
function sendToPrometheus(metric: Metric): void {
  const page = window.location.pathname;

  // Format as Prometheus metric
  const prometheusMetric = {
    metric_name: `marketsage_frontend_${metric.name.toLowerCase()}_${metric.rating}`,
    value: metric.value,
    labels: {
      page,
      rating: metric.rating,
      navigation_type: (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming)?.type || 'navigate',
    },
  };

  // Send to backend metrics endpoint
  fetch('/api/metrics/web-vitals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prometheusMetric),
    keepalive: true,
  }).catch(() => {
    // Silently fail
  });
}

/**
 * Initialize Web Vitals tracking
 * Call this once in your app's root component
 */
export function initWebVitals(): void {
  // Track all Core Web Vitals
  onLCP(sendToAnalytics);
  onFID(sendToAnalytics);
  onCLS(sendToAnalytics);
  onFCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
  onINP(sendToAnalytics);

  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals] Tracking initialized');
  }
}

/**
 * Get Web Vitals thresholds for rating
 * Based on Google's recommendations: https://web.dev/vitals/
 */
export const WEB_VITALS_THRESHOLDS = {
  LCP: {
    good: 2500, // milliseconds
    needsImprovement: 4000,
  },
  FID: {
    good: 100, // milliseconds
    needsImprovement: 300,
  },
  CLS: {
    good: 0.1, // score
    needsImprovement: 0.25,
  },
  FCP: {
    good: 1800, // milliseconds
    needsImprovement: 3000,
  },
  TTFB: {
    good: 800, // milliseconds
    needsImprovement: 1800,
  },
  INP: {
    good: 200, // milliseconds
    needsImprovement: 500,
  },
} as const;

/**
 * Calculate rating for a given metric value
 */
export function calculateRating(
  metricName: keyof typeof WEB_VITALS_THRESHOLDS,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = WEB_VITALS_THRESHOLDS[metricName];

  if (value <= thresholds.good) {
    return 'good';
  }
  if (value <= thresholds.needsImprovement) {
    return 'needs-improvement';
  }
  return 'poor';
}

/**
 * Report Web Vitals to console (for debugging)
 */
export function reportWebVitalsToConsole(metric: Metric): void {
  console.table({
    Name: metric.name,
    Value: metric.value.toFixed(2),
    Rating: metric.rating,
    Delta: metric.delta.toFixed(2),
    'Navigation Type': (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming)?.type,
    Page: window.location.pathname,
  });
}

/**
 * Export for Next.js reportWebVitals integration
 */
export function reportWebVitals(metric: Metric): void {
  sendToAnalytics(metric);

  if (process.env.NODE_ENV === 'development') {
    reportWebVitalsToConsole(metric);
  }
}
