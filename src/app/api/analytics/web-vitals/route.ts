import { NextRequest, NextResponse } from 'next/server';

/**
 * Web Vitals Collection API
 * Receives Core Web Vitals metrics from the frontend and stores them
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

// In-memory storage for recent metrics (last 1000 entries)
// In production, you'd want to send these to a database or backend service
const metricsStore: WebVitalMetric[] = [];
const MAX_METRICS = 1000;

/**
 * POST /api/analytics/web-vitals
 * Receives a web vital metric from the client
 */
export async function POST(request: NextRequest) {
  try {
    const metric: WebVitalMetric = await request.json();

    // Validate metric
    if (!metric.name || typeof metric.value !== 'number') {
      return NextResponse.json(
        { error: 'Invalid metric data' },
        { status: 400 }
      );
    }

    // Add user context if available (from headers/cookies)
    const enrichedMetric = {
      ...metric,
      userAgent: request.headers.get('user-agent') || 'unknown',
      ip: getClientIP(request),
      receivedAt: new Date().toISOString(),
    };

    // Store in memory
    metricsStore.push(enrichedMetric);

    // Trim to MAX_METRICS (keep most recent)
    if (metricsStore.length > MAX_METRICS) {
      metricsStore.shift();
    }

    // Send to backend for permanent storage
    await sendToBackend(enrichedMetric);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Failed to process web vital:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/web-vitals
 * Returns collected web vitals with summary statistics
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = url.searchParams.get('page');
    const metricName = url.searchParams.get('metric');

    // Filter metrics
    let filteredMetrics = [...metricsStore];

    if (page) {
      filteredMetrics = filteredMetrics.filter(m => m.page === page);
    }

    if (metricName) {
      filteredMetrics = filteredMetrics.filter(m => m.name === metricName);
    }

    // Calculate summary statistics
    const summary = calculateSummary(filteredMetrics);

    return NextResponse.json({
      count: filteredMetrics.length,
      metrics: filteredMetrics.slice(-100), // Return last 100 metrics
      summary,
    });
  } catch (error) {
    console.error('Failed to get web vitals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate summary statistics for metrics
 */
function calculateSummary(metrics: WebVitalMetric[]) {
  const metricsByName = metrics.reduce((acc, metric) => {
    if (!acc[metric.name]) {
      acc[metric.name] = [];
    }
    acc[metric.name].push(metric.value);
    return acc;
  }, {} as Record<string, number[]>);

  const summary: Record<string, any> = {};

  for (const [name, values] of Object.entries(metricsByName)) {
    if (values.length === 0) continue;

    const sorted = values.sort((a, b) => a - b);
    summary[name] = {
      count: values.length,
      min: Math.round(sorted[0] * 100) / 100,
      max: Math.round(sorted[sorted.length - 1] * 100) / 100,
      mean: Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 100) / 100,
      p50: Math.round(percentile(sorted, 0.5) * 100) / 100,
      p75: Math.round(percentile(sorted, 0.75) * 100) / 100,
      p95: Math.round(percentile(sorted, 0.95) * 100) / 100,
      p99: Math.round(percentile(sorted, 0.99) * 100) / 100,
    };
  }

  return summary;
}

/**
 * Calculate percentile from sorted array
 */
function percentile(sortedArray: number[], p: number): number {
  if (sortedArray.length === 0) return 0;
  const index = Math.ceil(sortedArray.length * p) - 1;
  return sortedArray[Math.max(0, index)];
}

/**
 * Send metric to backend for permanent storage
 */
async function sendToBackend(metric: any): Promise<void> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';

  try {
    const response = await fetch(`${backendUrl}/api/v2/web-vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric),
    });

    if (!response.ok) {
      // Log but don't throw - we don't want to fail the request
      console.error(`Failed to send to backend: ${response.status}`);
    }
  } catch (error) {
    // Silently fail - metrics are still stored in memory
    console.error('Failed to send metric to backend:', error);
  }
}

/**
 * Extract client IP address from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  return request.headers.get('x-vercel-forwarded-for') ||
         request.headers.get('cf-connecting-ip') ||
         'unknown';
}
