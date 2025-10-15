import { NextRequest, NextResponse } from 'next/server';

/**
 * API Call Analytics Endpoint
 * Receives and stores metrics for all API calls made from the frontend
 * Tracks performance, errors, and usage patterns
 */

interface ApiCallMetric {
  method: string;
  endpoint: string;
  url: string;
  statusCode: number;
  duration: number;
  success: boolean;
  responseSize: number;
  timestamp: number;
}

// In-memory storage (in production, send to database or time-series DB)
const apiCallsStore: (ApiCallMetric & { userAgent: string; ip: string; receivedAt: string })[] = [];
const MAX_STORED = 2000;

/**
 * POST /api/analytics/api-calls
 * Receive API call metrics from the ApiClient
 */
export async function POST(request: NextRequest) {
  try {
    const metric: ApiCallMetric = await request.json();

    // Validate metric
    if (!metric.method || !metric.endpoint || typeof metric.duration !== 'number') {
      return NextResponse.json(
        { error: 'Invalid metric data' },
        { status: 400 }
      );
    }

    // Enrich with request context
    const enrichedMetric = {
      ...metric,
      userAgent: request.headers.get('user-agent') || 'unknown',
      ip: getClientIP(request),
      receivedAt: new Date().toISOString(),
    };

    // Store in memory
    apiCallsStore.push(enrichedMetric);

    // Trim to MAX_STORED (keep most recent)
    if (apiCallsStore.length > MAX_STORED) {
      apiCallsStore.shift();
    }

    // Send to backend for permanent storage
    await sendToBackend(enrichedMetric);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Failed to process API call metric:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/api-calls
 * Retrieve API call metrics with summary statistics
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const endpoint = url.searchParams.get('endpoint');
    const method = url.searchParams.get('method');

    // Filter metrics
    let filteredMetrics = [...apiCallsStore];

    if (endpoint) {
      filteredMetrics = filteredMetrics.filter(m => m.endpoint.includes(endpoint));
    }

    if (method) {
      filteredMetrics = filteredMetrics.filter(m => m.method === method.toUpperCase());
    }

    // Calculate summary statistics
    const summary = calculateSummary(filteredMetrics);

    return NextResponse.json({
      count: filteredMetrics.length,
      metrics: filteredMetrics.slice(-100), // Last 100 calls
      summary,
    });
  } catch (error) {
    console.error('Failed to get API call metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate summary statistics for API calls
 */
function calculateSummary(metrics: ApiCallMetric[]) {
  if (metrics.length === 0) {
    return {
      totalCalls: 0,
      successRate: 0,
      avgDuration: 0,
      p50Duration: 0,
      p95Duration: 0,
      p99Duration: 0,
      errorRate: 0,
      slowCalls: 0,
    };
  }

  const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
  const successCount = metrics.filter(m => m.success).length;
  const slowCount = metrics.filter(m => m.duration > 1000).length;

  return {
    totalCalls: metrics.length,
    successRate: Math.round((successCount / metrics.length) * 100 * 100) / 100,
    avgDuration: Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length),
    p50Duration: Math.round(percentile(durations, 0.5)),
    p95Duration: Math.round(percentile(durations, 0.95)),
    p99Duration: Math.round(percentile(durations, 0.99)),
    errorRate: Math.round(((metrics.length - successCount) / metrics.length) * 100 * 100) / 100,
    slowCalls: slowCount,
    byEndpoint: groupByEndpoint(metrics),
    byStatus: groupByStatus(metrics),
  };
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
 * Group metrics by endpoint
 */
function groupByEndpoint(metrics: ApiCallMetric[]) {
  const groups: Record<string, { count: number; avgDuration: number; errorRate: number }> = {};

  metrics.forEach(metric => {
    if (!groups[metric.endpoint]) {
      groups[metric.endpoint] = { count: 0, avgDuration: 0, errorRate: 0 };
    }
    groups[metric.endpoint].count++;
  });

  // Calculate averages
  Object.keys(groups).forEach(endpoint => {
    const endpointMetrics = metrics.filter(m => m.endpoint === endpoint);
    const durations = endpointMetrics.map(m => m.duration);
    const errors = endpointMetrics.filter(m => !m.success).length;

    groups[endpoint].avgDuration = Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length);
    groups[endpoint].errorRate = Math.round((errors / endpointMetrics.length) * 100 * 100) / 100;
  });

  return groups;
}

/**
 * Group metrics by status code
 */
function groupByStatus(metrics: ApiCallMetric[]) {
  const groups: Record<number, number> = {};

  metrics.forEach(metric => {
    groups[metric.statusCode] = (groups[metric.statusCode] || 0) + 1;
  });

  return groups;
}

/**
 * Send metrics to backend for permanent storage
 */
async function sendToBackend(metric: any): Promise<void> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';

  try {
    const response = await fetch(`${backendUrl}/api/v2/api-metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric),
    });

    if (!response.ok) {
      console.error(`Failed to send to backend: ${response.status}`);
    }
  } catch (error) {
    // Silently fail - metrics are still stored in memory
    console.error('Failed to send API metrics to backend:', error);
  }
}

/**
 * Extract client IP from request
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
