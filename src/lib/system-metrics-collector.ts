// NOTE: Prisma removed - using backend API (SystemMetrics table exists in backend)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';
import * as os from 'os';
import { performance } from 'perf_hooks';

/**
 * System Metrics Collector Service
 * Collects real-time system metrics and stores them in the database
 * This service can be called periodically to maintain system health data
 */

export class SystemMetricsCollector {
  private isCollecting = false;
  private collectionInterval: NodeJS.Timeout | null = null;
  private readonly hostname: string;

  constructor() {
    this.hostname = os.hostname();
  }

  /**
   * Start automatic metrics collection
   * @param intervalMs Collection interval in milliseconds (default: 60 seconds)
   */
  startCollection(intervalMs = 60000): void {
    if (this.isCollecting) {
      console.log('System metrics collection is already running');
      return;
    }

    console.log(`Starting system metrics collection every ${intervalMs}ms`);
    this.isCollecting = true;

    // Collect initial metrics immediately
    this.collectMetrics().catch(error => {
      console.error('Initial metrics collection failed:', error);
    });

    // Set up recurring collection
    this.collectionInterval = setInterval(async () => {
      try {
        await this.collectMetrics();
      } catch (error) {
        console.error('Scheduled metrics collection failed:', error);
      }
    }, intervalMs);
  }

  /**
   * Stop automatic metrics collection
   */
  stopCollection(): void {
    if (!this.isCollecting) {
      console.log('System metrics collection is not running');
      return;
    }

    console.log('Stopping system metrics collection');
    this.isCollecting = false;

    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
  }

  /**
   * Collect all system metrics once
   */
  async collectMetrics(): Promise<void> {
    const timestamp = new Date();
    const metrics: any[] = [];

    try {
      // Collect all metric types
      metrics.push(...await this.collectCPUMetrics(timestamp));
      metrics.push(...await this.collectMemoryMetrics(timestamp));
      metrics.push(...await this.collectProcessMetrics(timestamp));
      metrics.push(...await this.collectSystemMetrics(timestamp));
      metrics.push(...await this.collectNetworkMetrics(timestamp));
      metrics.push(...await this.collectDatabaseMetrics(timestamp));
      metrics.push(...await this.collectCacheMetrics(timestamp));

      // Store all metrics in batch
      if (metrics.length > 0) {
        const response = await fetch(`${BACKEND_URL}/api/v2/system-metrics/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metrics }),
        });

        if (!response.ok) {
          throw new Error(`Failed to store metrics: ${response.status}`);
        }

        console.log(`Collected and stored ${metrics.length} system metrics`);
      }

      // Clean up old metrics (keep last 7 days)
      await this.cleanupOldMetrics();

    } catch (error) {
      console.error('Failed to collect system metrics:', error);
      
      // Store error metric
      await this.storeErrorMetric('metrics_collection_error', error instanceof Error ? error.message : 'Unknown error', timestamp);
    }
  }

  /**
   * Collect CPU metrics
   */
  private async collectCPUMetrics(timestamp: Date): Promise<any[]> {
    const metrics: any[] = [];

    try {
      const cpus = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;

      cpus.forEach(cpu => {
        for (const type in cpu.times) {
          totalTick += cpu.times[type as keyof typeof cpu.times];
        }
        totalIdle += cpu.times.idle;
      });

      const cpuUsage = totalTick > 0 ? 100 - Math.round(100 * totalIdle / totalTick) : 0;
      const loadAvg = os.loadavg();

      metrics.push({
        metricType: 'cpu_usage',
        value: cpuUsage,
        unit: 'percentage',
        source: this.hostname,
        timestamp,
        metadata: {
          cores: cpus.length,
          model: cpus[0]?.model,
          speed: cpus[0]?.speed,
        },
      });

      metrics.push({
        metricType: 'system_load_1m',
        value: Math.round(loadAvg[0] * 100) / 100,
        unit: 'load',
        source: this.hostname,
        timestamp,
        metadata: {
          load1m: loadAvg[0],
          load5m: loadAvg[1],
          load15m: loadAvg[2],
        },
      });

    } catch (error) {
      console.error('Failed to collect CPU metrics:', error);
    }

    return metrics;
  }

  /**
   * Collect memory metrics
   */
  private async collectMemoryMetrics(timestamp: Date): Promise<any[]> {
    const metrics: any[] = [];

    try {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const memUsagePercent = totalMem > 0 ? Math.round((usedMem / totalMem) * 100) : 0;

      metrics.push({
        metricType: 'memory_usage',
        value: memUsagePercent,
        unit: 'percentage',
        source: this.hostname,
        timestamp,
        metadata: {
          totalMB: Math.round(totalMem / 1024 / 1024),
          usedMB: Math.round(usedMem / 1024 / 1024),
          freeMB: Math.round(freeMem / 1024 / 1024),
        },
      });

      metrics.push({
        metricType: 'memory_total',
        value: Math.round(totalMem / 1024 / 1024),
        unit: 'MB',
        source: this.hostname,
        timestamp,
        metadata: {
          totalBytes: totalMem,
        },
      });

    } catch (error) {
      console.error('Failed to collect memory metrics:', error);
    }

    return metrics;
  }

  /**
   * Collect process-specific metrics
   */
  private async collectProcessMetrics(timestamp: Date): Promise<any[]> {
    const metrics: any[] = [];

    try {
      const processMemUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      metrics.push({
        metricType: 'process_memory_heap',
        value: Math.round(processMemUsage.heapUsed / 1024 / 1024),
        unit: 'MB',
        source: this.hostname,
        timestamp,
        metadata: {
          heapTotal: Math.round(processMemUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(processMemUsage.heapUsed / 1024 / 1024),
          external: Math.round(processMemUsage.external / 1024 / 1024),
          rss: Math.round(processMemUsage.rss / 1024 / 1024),
        },
      });

      metrics.push({
        metricType: 'process_uptime',
        value: Math.round(process.uptime()),
        unit: 'seconds',
        source: this.hostname,
        timestamp,
        metadata: {
          version: process.version,
          pid: process.pid,
        },
      });

      // Event loop lag measurement
      const eventLoopStart = performance.now();
      await new Promise(resolve => setImmediate(resolve));
      const eventLoopLag = performance.now() - eventLoopStart;

      metrics.push({
        metricType: 'event_loop_lag',
        value: Math.round(eventLoopLag * 100) / 100,
        unit: 'milliseconds',
        source: this.hostname,
        timestamp,
        metadata: {
          cpuUser: cpuUsage.user,
          cpuSystem: cpuUsage.system,
        },
      });

    } catch (error) {
      console.error('Failed to collect process metrics:', error);
    }

    return metrics;
  }

  /**
   * Collect system-level metrics
   */
  private async collectSystemMetrics(timestamp: Date): Promise<any[]> {
    const metrics: any[] = [];

    try {
      metrics.push({
        metricType: 'system_uptime',
        value: Math.round(os.uptime()),
        unit: 'seconds',
        source: this.hostname,
        timestamp,
        metadata: {
          platform: os.platform(),
          arch: os.arch(),
          release: os.release(),
        },
      });

      // Try to get additional system info if available
      if (os.platform() === 'linux') {
        try {
          const { exec } = require('child_process');
          const { promisify } = require('util');
          const execAsync = promisify(exec);

          // Get disk usage
          const { stdout } = await execAsync('df -h / | tail -1');
          const diskParts = stdout.trim().split(/\s+/);
          
          if (diskParts.length >= 5) {
            const diskUsagePercent = Number.parseInt(diskParts[4].replace('%', '')) || 0;
            
            metrics.push({
              metricType: 'disk_usage',
              value: diskUsagePercent,
              unit: 'percentage',
              source: this.hostname,
              timestamp,
              metadata: {
                filesystem: diskParts[0],
                size: diskParts[1],
                used: diskParts[2],
                available: diskParts[3],
              },
            });
          }
        } catch (error) {
          // Disk info not available
        }
      }

    } catch (error) {
      console.error('Failed to collect system metrics:', error);
    }

    return metrics;
  }

  /**
   * Collect network metrics
   */
  private async collectNetworkMetrics(timestamp: Date): Promise<any[]> {
    const metrics: any[] = [];

    try {
      const networkInterfaces = os.networkInterfaces();
      const activeInterfaces = Object.keys(networkInterfaces).filter(name => {
        const interfaces = networkInterfaces[name];
        return interfaces && interfaces.some(iface => !iface.internal && iface.family === 'IPv4');
      });

      metrics.push({
        metricType: 'network_interfaces',
        value: activeInterfaces.length,
        unit: 'count',
        source: this.hostname,
        timestamp,
        metadata: {
          activeInterfaces,
          totalInterfaces: Object.keys(networkInterfaces).length,
        },
      });

    } catch (error) {
      console.error('Failed to collect network metrics:', error);
    }

    return metrics;
  }

  /**
   * Collect database metrics
   */
  private async collectDatabaseMetrics(timestamp: Date): Promise<any[]> {
    const metrics: any[] = [];

    try {
      // Test database connectivity and response time
      const dbStartTime = performance.now();
      const response = await fetch(`${BACKEND_URL}/api/v2/system-metrics/health`, {
        headers: { 'Content-Type': 'application/json' },
      });
      const dbResponseTime = Math.round(performance.now() - dbStartTime);

      metrics.push({
        metricType: 'database_response_time',
        value: dbResponseTime,
        unit: 'milliseconds',
        source: 'database',
        timestamp,
        metadata: {
          query: 'SELECT 1',
          healthy: dbResponseTime < 1000,
        },
      });

      // Get database connection metrics if available
      try {
        const metricsResponse = await fetch(`${BACKEND_URL}/api/v2/system-metrics/database-stats`, {
          headers: { 'Content-Type': 'application/json' },
        });

        if (metricsResponse.ok) {
          const dbMetrics = await metricsResponse.json();
          if (dbMetrics?.counters) {
            Object.entries(dbMetrics.counters).forEach(([key, value]: [string, any]) => {
              if (key.includes('prisma_client')) {
                metrics.push({
                  metricType: `database_${key}`,
                  value: value.value || 0,
                  unit: 'count',
                  source: 'database',
                  timestamp,
                  metadata: {
                    metricKey: key,
                    labels: value.labels,
                  },
                });
              }
            });
          }
        }
      } catch (error) {
        // Database metrics API not available
      }

    } catch (error) {
      console.error('Failed to collect database metrics:', error);
      
      // Store database error metric
      metrics.push({
        metricType: 'database_error',
        value: 1,
        unit: 'count',
        source: 'database',
        timestamp,
        metadata: {
          error: error instanceof Error ? error.message : 'Database connectivity failed',
        },
      });
    }

    return metrics;
  }

  /**
   * Collect cache (Redis) metrics
   */
  private async collectCacheMetrics(timestamp: Date): Promise<any[]> {
    const metrics: any[] = [];

    try {
      const { redis } = await import('@/lib/cache/redis');
      
      if (redis) {
        // Test Redis connectivity and response time
        const redisStartTime = performance.now();
        await redis.ping();
        const redisResponseTime = Math.round(performance.now() - redisStartTime);

        metrics.push({
          metricType: 'redis_response_time',
          value: redisResponseTime,
          unit: 'milliseconds',
          source: 'redis',
          timestamp,
          metadata: {
            healthy: redisResponseTime < 100,
          },
        });

        // Get Redis info
        try {
          const info = await redis.info('memory');
          const keyCount = await redis.dbsize();

          metrics.push({
            metricType: 'redis_keys',
            value: keyCount,
            unit: 'count',
            source: 'redis',
            timestamp,
            metadata: {},
          });

          // Parse memory info
          const memoryLines = info.split('\n').filter(line => line.includes('used_memory:') || line.includes('used_memory_peak:'));
          memoryLines.forEach(line => {
            const [key, value] = line.split(':');
            if (key && value) {
              const memoryBytes = Number.parseInt(value.trim());
              if (!isNaN(memoryBytes)) {
                metrics.push({
                  metricType: `redis_${key}`,
                  value: Math.round(memoryBytes / 1024 / 1024), // Convert to MB
                  unit: 'MB',
                  source: 'redis',
                  timestamp,
                  metadata: {
                    bytes: memoryBytes,
                  },
                });
              }
            }
          });

        } catch (error) {
          // Redis info not available
        }
      }

    } catch (error) {
      console.error('Failed to collect cache metrics:', error);
    }

    return metrics;
  }

  /**
   * Store error metric
   */
  private async storeErrorMetric(errorType: string, errorMessage: string, timestamp: Date): Promise<void> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/v2/system-metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metricType: 'system_error',
          value: 1,
          unit: 'count',
          source: this.hostname,
          timestamp,
          metadata: {
            errorType,
            errorMessage,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to store error metric: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to store error metric:', error);
    }
  }

  /**
   * Clean up old metrics (keep last 7 days)
   */
  private async cleanupOldMetrics(): Promise<void> {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const response = await fetch(
        `${BACKEND_URL}/api/v2/system-metrics/cleanup?before=${sevenDaysAgo.toISOString()}`,
        { method: 'DELETE', headers: { 'Content-Type': 'application/json' } }
      );

      if (!response.ok) {
        throw new Error(`Failed to cleanup old metrics: ${response.status}`);
      }

      const result = await response.json();
      if (result.deletedCount > 0) {
        console.log(`Cleaned up ${result.deletedCount} old system metrics`);
      }

    } catch (error) {
      console.error('Failed to cleanup old metrics:', error);
    }
  }

  /**
   * Get collection status
   */
  getStatus(): { isCollecting: boolean; hostname: string } {
    return {
      isCollecting: this.isCollecting,
      hostname: this.hostname,
    };
  }
}

// Global instance
export const systemMetricsCollector = new SystemMetricsCollector();

// Auto-start collection in production
if (process.env.NODE_ENV === 'production') {
  // Start metrics collection every 60 seconds
  systemMetricsCollector.startCollection(60000);
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Stopping system metrics collection...');
    systemMetricsCollector.stopCollection();
  });
  
  process.on('SIGINT', () => {
    console.log('Stopping system metrics collection...');
    systemMetricsCollector.stopCollection();
  });
}