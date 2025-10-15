/**
 * Network Performance Analytics API
 *
 * Receives network performance metrics from the frontend network-performance-tracker.
 * Aggregates and stores metrics for analysis.
 *
 * Metrics include:
 * - Resource timing (images, CSS, JS, fonts, API requests)
 * - Connection quality (4G, WiFi, downlink, RTT)
 * - Slow resource detection (>1s)
 * - Resource caching stats
 */

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

// ============================================================================
// Types
// ============================================================================

interface ResourceTiming {
  name: string;
  type: 'image' | 'css' | 'script' | 'font' | 'fetch' | 'xmlhttprequest' | 'other';
  duration: number;
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
  startTime: number;
  dnsTime: number;
  tcpTime: number;
  requestTime: number;
  responseTime: number;
  isSlow: boolean;
  cached: boolean;
}

interface ConnectionQuality {
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';
  downlink: number;
  rtt: number;
  saveData: boolean;
  type?: string;
}

interface NetworkPerformanceMetrics {
  timestamp: number;
  url: string;
  resources: ResourceTiming[];
  connection: ConnectionQuality;
  slowResources: ResourceTiming[];
  summary: {
    totalResources: number;
    totalTransferSize: number;
    slowResourceCount: number;
    avgDuration: number;
    avgDnsTime: number;
    avgTcpTime: number;
    cachedResourceCount: number;
  };
}

// ============================================================================
// In-Memory Storage
// ============================================================================

const metricsStore: NetworkPerformanceMetrics[] = [];
const MAX_STORE_SIZE = 2000;

// Aggregated statistics
let aggregatedStats = {
  totalSamples: 0,
  resourceTypeBreakdown: {} as Record<string, { count: number; avgDuration: number; avgSize: number }>,
  connectionQuality: {} as Record<string, number>, // count by effectiveType
  slowResourcesByType: {} as Record<string, number>,
  cacheHitRate: 0,
  avgPageLoadSize: 0,
  avgResourceCount: 0,
  topSlowResources: [] as Array<{ name: string; type: string; avgDuration: number; count: number }>,
  lastUpdated: Date.now(),
};

// ============================================================================
// POST Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const metrics: NetworkPerformanceMetrics[] = await request.json();

    if (!Array.isArray(metrics)) {
      return NextResponse.json(
        { error: 'Invalid payload: expected array of metrics' },
        { status: 400 }
      );
    }

    // Store metrics
    metricsStore.push(...metrics);

    // Keep only recent metrics
    if (metricsStore.length > MAX_STORE_SIZE) {
      metricsStore.splice(0, metricsStore.length - MAX_STORE_SIZE);
    }

    // Update aggregated stats
    updateAggregatedStats(metrics);

    // Log to Sentry for high-impact issues
    for (const metric of metrics) {
      // Alert if many slow resources
      if (metric.slowResources.length >= 5) {
        Sentry.captureMessage(`High number of slow resources detected: ${metric.slowResources.length}`, {
          level: 'warning',
          tags: {
            url: metric.url,
            connection: metric.connection.effectiveType,
            slow_resource_count: metric.slowResources.length,
          },
          extra: {
            slowResources: metric.slowResources.slice(0, 10), // Top 10
            connection: metric.connection,
          },
        });
      }

      // Alert if poor connection with high transfer
      if (
        (metric.connection.effectiveType === '2g' || metric.connection.effectiveType === 'slow-2g') &&
        metric.summary.totalTransferSize > 1000000 // >1MB
      ) {
        Sentry.captureMessage('Large page size on slow connection', {
          level: 'warning',
          tags: {
            url: metric.url,
            connection: metric.connection.effectiveType,
            transfer_size: metric.summary.totalTransferSize,
          },
          extra: {
            summary: metric.summary,
            connection: metric.connection,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      received: metrics.length,
      stored: metricsStore.length,
    });
  } catch (error) {
    console.error('[NetworkPerformance API] Error processing metrics:', error);
    Sentry.captureException(error);

    return NextResponse.json(
      { error: 'Failed to process network performance metrics' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET Handler - Retrieve Aggregated Stats
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'summary';

    if (format === 'raw') {
      // Return raw metrics (last 100)
      return NextResponse.json({
        metrics: metricsStore.slice(-100),
        total: metricsStore.length,
      });
    }

    if (format === 'prometheus') {
      // Return Prometheus-formatted metrics
      const prometheusMetrics = generatePrometheusMetrics();
      return new NextResponse(prometheusMetrics, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // Return aggregated summary
    return NextResponse.json({
      stats: aggregatedStats,
      recentMetrics: metricsStore.slice(-10),
    });
  } catch (error) {
    console.error('[NetworkPerformance API] Error retrieving metrics:', error);
    Sentry.captureException(error);

    return NextResponse.json(
      { error: 'Failed to retrieve network performance metrics' },
      { status: 500 }
    );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function updateAggregatedStats(newMetrics: NetworkPerformanceMetrics[]): void {
  aggregatedStats.totalSamples += newMetrics.length;

  for (const metric of newMetrics) {
    // Connection quality distribution
    const connType = metric.connection.effectiveType;
    aggregatedStats.connectionQuality[connType] =
      (aggregatedStats.connectionQuality[connType] || 0) + 1;

    // Resource type breakdown
    for (const resource of metric.resources) {
      if (!aggregatedStats.resourceTypeBreakdown[resource.type]) {
        aggregatedStats.resourceTypeBreakdown[resource.type] = {
          count: 0,
          avgDuration: 0,
          avgSize: 0,
        };
      }

      const typeStats = aggregatedStats.resourceTypeBreakdown[resource.type];
      const prevCount = typeStats.count;

      // Update running averages
      typeStats.avgDuration =
        (typeStats.avgDuration * prevCount + resource.duration) / (prevCount + 1);
      typeStats.avgSize =
        (typeStats.avgSize * prevCount + resource.transferSize) / (prevCount + 1);
      typeStats.count += 1;

      // Track slow resources by type
      if (resource.isSlow) {
        aggregatedStats.slowResourcesByType[resource.type] =
          (aggregatedStats.slowResourcesByType[resource.type] || 0) + 1;
      }
    }

    // Cache hit rate
    const totalResources = aggregatedStats.totalSamples * metric.summary.totalResources || 1;
    const cachedResources = metric.summary.cachedResourceCount;
    aggregatedStats.cacheHitRate =
      (aggregatedStats.cacheHitRate * (aggregatedStats.totalSamples - 1) +
       (cachedResources / (metric.summary.totalResources || 1))) / aggregatedStats.totalSamples;

    // Average page metrics
    aggregatedStats.avgPageLoadSize =
      (aggregatedStats.avgPageLoadSize * (aggregatedStats.totalSamples - 1) +
       metric.summary.totalTransferSize) / aggregatedStats.totalSamples;

    aggregatedStats.avgResourceCount =
      (aggregatedStats.avgResourceCount * (aggregatedStats.totalSamples - 1) +
       metric.summary.totalResources) / aggregatedStats.totalSamples;
  }

  // Update top slow resources
  updateTopSlowResources();

  aggregatedStats.lastUpdated = Date.now();
}

function updateTopSlowResources(): void {
  const slowResourceMap = new Map<
    string,
    { name: string; type: string; totalDuration: number; count: number }
  >();

  // Aggregate slow resources
  for (const metric of metricsStore.slice(-500)) {
    // Last 500 samples
    for (const resource of metric.slowResources) {
      const key = `${resource.type}:${resource.name}`;

      if (!slowResourceMap.has(key)) {
        slowResourceMap.set(key, {
          name: resource.name,
          type: resource.type,
          totalDuration: 0,
          count: 0,
        });
      }

      const entry = slowResourceMap.get(key)!;
      entry.totalDuration += resource.duration;
      entry.count += 1;
    }
  }

  // Calculate averages and sort
  const topSlow = Array.from(slowResourceMap.values())
    .map(entry => ({
      name: entry.name,
      type: entry.type,
      avgDuration: entry.totalDuration / entry.count,
      count: entry.count,
    }))
    .sort((a, b) => b.avgDuration - a.avgDuration)
    .slice(0, 10);

  aggregatedStats.topSlowResources = topSlow;
}

function generatePrometheusMetrics(): string {
  let output = '# HELP marketsage_network_resources_total Total number of resources loaded\n';
  output += '# TYPE marketsage_network_resources_total counter\n';

  for (const [type, stats] of Object.entries(aggregatedStats.resourceTypeBreakdown)) {
    output += `marketsage_network_resources_total{type="${type}"} ${stats.count}\n`;
  }

  output += '\n# HELP marketsage_network_resource_duration_avg Average resource load duration in ms\n';
  output += '# TYPE marketsage_network_resource_duration_avg gauge\n';

  for (const [type, stats] of Object.entries(aggregatedStats.resourceTypeBreakdown)) {
    output += `marketsage_network_resource_duration_avg{type="${type}"} ${stats.avgDuration.toFixed(2)}\n`;
  }

  output += '\n# HELP marketsage_network_resource_size_avg Average resource transfer size in bytes\n';
  output += '# TYPE marketsage_network_resource_size_avg gauge\n';

  for (const [type, stats] of Object.entries(aggregatedStats.resourceTypeBreakdown)) {
    output += `marketsage_network_resource_size_avg{type="${type}"} ${stats.avgSize.toFixed(0)}\n`;
  }

  output += '\n# HELP marketsage_network_slow_resources_total Number of slow resources (>1s)\n';
  output += '# TYPE marketsage_network_slow_resources_total counter\n';

  for (const [type, count] of Object.entries(aggregatedStats.slowResourcesByType)) {
    output += `marketsage_network_slow_resources_total{type="${type}"} ${count}\n`;
  }

  output += '\n# HELP marketsage_network_connection_samples_total Connection quality samples\n';
  output += '# TYPE marketsage_network_connection_samples_total counter\n';

  for (const [type, count] of Object.entries(aggregatedStats.connectionQuality)) {
    output += `marketsage_network_connection_samples_total{effective_type="${type}"} ${count}\n`;
  }

  output += '\n# HELP marketsage_network_cache_hit_rate Cache hit rate (0-1)\n';
  output += '# TYPE marketsage_network_cache_hit_rate gauge\n';
  output += `marketsage_network_cache_hit_rate ${aggregatedStats.cacheHitRate.toFixed(4)}\n`;

  output += '\n# HELP marketsage_network_page_size_avg Average page size in bytes\n';
  output += '# TYPE marketsage_network_page_size_avg gauge\n';
  output += `marketsage_network_page_size_avg ${aggregatedStats.avgPageLoadSize.toFixed(0)}\n`;

  return output;
}
