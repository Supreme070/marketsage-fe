/**
 * Network Performance Tracker
 *
 * Tracks browser network performance using:
 * - Resource Timing API (for asset load times)
 * - Network Information API (for connection quality)
 *
 * Features:
 * - Track image, CSS, JS, font, and API request times
 * - Identify slow resources (>1s)
 * - Monitor connection type and quality
 * - Correlate performance with connection quality
 * - Send metrics to analytics endpoint
 */

import * as Sentry from '@sentry/nextjs';

// ============================================================================
// Types
// ============================================================================

export interface ResourceTiming {
  name: string;
  type: 'image' | 'css' | 'script' | 'font' | 'fetch' | 'xmlhttprequest' | 'other';
  duration: number;
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
  startTime: number;
  // Connection timing
  dnsTime: number;
  tcpTime: number;
  requestTime: number;
  responseTime: number;
  // Flags
  isSlow: boolean; // >1s
  cached: boolean;
}

export interface ConnectionQuality {
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';
  downlink: number; // Mbps
  rtt: number; // ms
  saveData: boolean;
  type?: 'bluetooth' | 'cellular' | 'ethernet' | 'wifi' | 'wimax' | 'none' | 'other' | 'unknown';
}

export interface NetworkPerformanceMetrics {
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

interface NetworkInformation extends EventTarget {
  readonly effectiveType: '4g' | '3g' | '2g' | 'slow-2g';
  readonly downlink: number;
  readonly rtt: number;
  readonly saveData: boolean;
  readonly type?: 'bluetooth' | 'cellular' | 'ethernet' | 'wifi' | 'wimax' | 'none' | 'other' | 'unknown';
}

declare global {
  interface Navigator {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  }
}

// ============================================================================
// Network Performance Tracker Class
// ============================================================================

class NetworkPerformanceTracker {
  private isTracking = false;
  private observer: PerformanceObserver | null = null;
  private metricsBuffer: NetworkPerformanceMetrics[] = [];
  private readonly MAX_BUFFER_SIZE = 100;
  private readonly SLOW_RESOURCE_THRESHOLD = 1000; // 1 second

  /**
   * Start tracking network performance
   */
  start(): void {
    if (this.isTracking) {
      console.warn('[NetworkPerformanceTracker] Already tracking');
      return;
    }

    if (typeof window === 'undefined') {
      return; // Server-side, skip
    }

    this.isTracking = true;

    // Track existing resources
    this.captureExistingResources();

    // Set up PerformanceObserver for new resources
    if ('PerformanceObserver' in window) {
      try {
        this.observer = new PerformanceObserver((list) => {
          this.handlePerformanceEntries(list.getEntries() as PerformanceResourceTiming[]);
        });

        this.observer.observe({
          entryTypes: ['resource', 'navigation']
        });
      } catch (error) {
        console.error('[NetworkPerformanceTracker] Failed to create PerformanceObserver:', error);
        Sentry.captureException(error);
      }
    }

    // Listen for connection changes
    const connection = this.getConnection();
    if (connection) {
      connection.addEventListener('change', this.handleConnectionChange);
    }

    console.log('[NetworkPerformanceTracker] Started tracking network performance');
  }

  /**
   * Stop tracking
   */
  stop(): void {
    if (!this.isTracking) {
      return;
    }

    this.isTracking = false;

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    const connection = this.getConnection();
    if (connection) {
      connection.removeEventListener('change', this.handleConnectionChange);
    }

    // Send remaining metrics
    if (this.metricsBuffer.length > 0) {
      this.sendMetrics();
    }

    console.log('[NetworkPerformanceTracker] Stopped tracking');
  }

  /**
   * Capture resources that were loaded before tracker started
   */
  private captureExistingResources(): void {
    if (!('performance' in window)) {
      return;
    }

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    this.handlePerformanceEntries(resources);
  }

  /**
   * Handle performance entries from PerformanceObserver
   */
  private handlePerformanceEntries(entries: PerformanceResourceTiming[]): void {
    if (entries.length === 0) {
      return;
    }

    const resources: ResourceTiming[] = entries.map(entry => this.parseResourceTiming(entry));
    const connection = this.getConnectionQuality();
    const slowResources = resources.filter(r => r.isSlow);

    // Calculate summary
    const summary = {
      totalResources: resources.length,
      totalTransferSize: resources.reduce((sum, r) => sum + r.transferSize, 0),
      slowResourceCount: slowResources.length,
      avgDuration: resources.reduce((sum, r) => sum + r.duration, 0) / resources.length,
      avgDnsTime: resources.reduce((sum, r) => sum + r.dnsTime, 0) / resources.length,
      avgTcpTime: resources.reduce((sum, r) => sum + r.tcpTime, 0) / resources.length,
      cachedResourceCount: resources.filter(r => r.cached).length,
    };

    const metrics: NetworkPerformanceMetrics = {
      timestamp: Date.now(),
      url: window.location.href,
      resources,
      connection,
      slowResources,
      summary,
    };

    this.metricsBuffer.push(metrics);

    // Send metrics if buffer is full
    if (this.metricsBuffer.length >= this.MAX_BUFFER_SIZE) {
      this.sendMetrics();
    }

    // Log slow resources to Sentry
    if (slowResources.length > 0) {
      Sentry.addBreadcrumb({
        category: 'network',
        message: `Detected ${slowResources.length} slow resources`,
        level: 'warning',
        data: {
          slowResources: slowResources.map(r => ({
            name: r.name,
            type: r.type,
            duration: r.duration,
          })),
          connection: connection.effectiveType,
        },
      });
    }
  }

  /**
   * Parse PerformanceResourceTiming entry
   */
  private parseResourceTiming(entry: PerformanceResourceTiming): ResourceTiming {
    const type = this.getResourceType(entry.name, entry.initiatorType);
    const duration = entry.duration;
    const transferSize = entry.transferSize || 0;
    const cached = transferSize === 0 && duration > 0;

    // Calculate timing phases
    const dnsTime = entry.domainLookupEnd - entry.domainLookupStart;
    const tcpTime = entry.connectEnd - entry.connectStart;
    const requestTime = entry.responseStart - entry.requestStart;
    const responseTime = entry.responseEnd - entry.responseStart;

    return {
      name: entry.name,
      type,
      duration,
      transferSize,
      encodedBodySize: entry.encodedBodySize || 0,
      decodedBodySize: entry.decodedBodySize || 0,
      startTime: entry.startTime,
      dnsTime,
      tcpTime,
      requestTime,
      responseTime,
      isSlow: duration > this.SLOW_RESOURCE_THRESHOLD,
      cached,
    };
  }

  /**
   * Determine resource type from URL and initiator
   */
  private getResourceType(
    url: string,
    initiatorType: string
  ): ResourceTiming['type'] {
    // Check by initiator type
    if (initiatorType === 'img' || initiatorType === 'image') return 'image';
    if (initiatorType === 'css' || initiatorType === 'link') return 'css';
    if (initiatorType === 'script') return 'script';
    if (initiatorType === 'fetch') return 'fetch';
    if (initiatorType === 'xmlhttprequest') return 'xmlhttprequest';

    // Check by URL extension
    const urlLower = url.toLowerCase();
    if (/\.(jpg|jpeg|png|gif|svg|webp|ico)/.test(urlLower)) return 'image';
    if (/\.css/.test(urlLower)) return 'css';
    if (/\.js/.test(urlLower)) return 'script';
    if (/\.(woff|woff2|ttf|otf|eot)/.test(urlLower)) return 'font';

    // Check if it's an API call (contains /api/)
    if (urlLower.includes('/api/')) return 'fetch';

    return 'other';
  }

  /**
   * Get connection object
   */
  private getConnection(): NetworkInformation | null {
    if (typeof navigator === 'undefined') {
      return null;
    }

    return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
  }

  /**
   * Get current connection quality
   */
  private getConnectionQuality(): ConnectionQuality {
    const connection = this.getConnection();

    if (!connection) {
      return {
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0,
        saveData: false,
        type: 'unknown',
      };
    }

    return {
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0,
      saveData: connection.saveData || false,
      type: connection.type || 'unknown',
    };
  }

  /**
   * Handle connection change event
   */
  private handleConnectionChange = (): void => {
    const connection = this.getConnectionQuality();

    console.log('[NetworkPerformanceTracker] Connection changed:', connection);

    Sentry.addBreadcrumb({
      category: 'network',
      message: 'Connection quality changed',
      level: 'info',
      data: connection,
    });

    // If connection degrades, send metrics immediately
    if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
      this.sendMetrics();
    }
  };

  /**
   * Send metrics to analytics endpoint
   */
  private sendMetrics(): void {
    if (this.metricsBuffer.length === 0) {
      return;
    }

    const metrics = [...this.metricsBuffer];
    this.metricsBuffer = [];

    // Send via sendBeacon for reliability
    if ('sendBeacon' in navigator) {
      const blob = new Blob([JSON.stringify(metrics)], { type: 'application/json' });
      const sent = navigator.sendBeacon('/api/analytics/network-performance', blob);

      if (!sent) {
        console.warn('[NetworkPerformanceTracker] sendBeacon failed, using fetch');
        this.sendViaFetch(metrics);
      }
    } else {
      this.sendViaFetch(metrics);
    }
  }

  /**
   * Fallback to fetch if sendBeacon not available
   */
  private async sendViaFetch(metrics: NetworkPerformanceMetrics[]): Promise<void> {
    try {
      await fetch('/api/analytics/network-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics),
        keepalive: true,
      });
    } catch (error) {
      console.error('[NetworkPerformanceTracker] Failed to send metrics:', error);
      Sentry.captureException(error);
    }
  }

  /**
   * Get current metrics (for debugging)
   */
  getMetrics(): NetworkPerformanceMetrics[] {
    return [...this.metricsBuffer];
  }

  /**
   * Force send metrics
   */
  flush(): void {
    this.sendMetrics();
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const networkPerformanceTracker = new NetworkPerformanceTracker();

// Auto-start tracking in browser (optional - can be manually started)
if (typeof window !== 'undefined') {
  // Auto-start after page load
  if (document.readyState === 'complete') {
    networkPerformanceTracker.start();
  } else {
    window.addEventListener('load', () => {
      networkPerformanceTracker.start();
    });
  }

  // Stop tracking before page unload
  window.addEventListener('beforeunload', () => {
    networkPerformanceTracker.stop();
  });
}
