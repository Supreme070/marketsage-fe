/**
 * LeadPulse Database Performance Monitor
 * 
 * Real-time monitoring and alerting for database performance
 */

// NOTE: Prisma removed - using backend API
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ||
                    process.env.NESTJS_BACKEND_URL ||
                    'http://localhost:3006';

import { logger } from '@/lib/logger';
import { leadPulseCache } from '@/lib/cache/leadpulse-cache';

interface PerformanceMetrics {
  timestamp: Date;
  queryCount: number;
  avgQueryTime: number;
  slowQueries: number;
  activeConnections: number;
  bufferHitRatio: number;
  tableScans: number;
  indexScans: number;
  diskReads: number;
  memoryUsage: number;
  lockWaits: number;
}

interface SlowQuery {
  query: string;
  duration: number;
  timestamp: Date;
  calls: number;
  meanTime: number;
  totalTime: number;
}

interface TableStats {
  tableName: string;
  totalSize: string;
  indexSize: string;
  rowCount: number;
  seqScans: number;
  seqTupRead: number;
  idxScans: number;
  idxTupFetch: number;
  insertions: number;
  updates: number;
  deletions: number;
}

export class LeadPulseDBMonitor {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private alertThresholds = {
    avgQueryTime: 1000, // ms
    slowQueryThreshold: 5000, // ms
    connectionLimit: 80, // percentage
    bufferHitRatio: 95, // percentage
    lockWaitLimit: 10 // number of waits
  };

  /**
   * Start continuous monitoring
   */
  startMonitoring(intervalMs = 60000) {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    logger.info('Starting database monitoring');
    
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectMetrics();
      } catch (error) {
        logger.error('Error in database monitoring:', error);
      }
    }, intervalMs);

    // Initial collection
    this.collectMetrics();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('Database monitoring stopped');
    }
  }

  /**
   * Collect comprehensive performance metrics
   */
  async collectMetrics(): Promise<PerformanceMetrics> {
    try {
      // Get database statistics
      const [
        activityStats,
        bufferStats,
        tableStats,
        lockStats
      ] = await Promise.all([
        this.getActivityStats(),
        this.getBufferStats(),
        this.getTableStats(),
        this.getLockStats()
      ]);

      const metrics: PerformanceMetrics = {
        timestamp: new Date(),
        queryCount: activityStats.queryCount,
        avgQueryTime: activityStats.avgQueryTime,
        slowQueries: activityStats.slowQueries,
        activeConnections: activityStats.activeConnections,
        bufferHitRatio: bufferStats.hitRatio,
        tableScans: tableStats.seqScans,
        indexScans: tableStats.idxScans,
        diskReads: bufferStats.diskReads,
        memoryUsage: bufferStats.memoryUsage,
        lockWaits: lockStats.waitingLocks
      };

      // Store metrics in cache for dashboard
      await leadPulseCache.set(
        `db_metrics:${Math.floor(Date.now() / 60000)}`, // minute precision
        metrics,
        3600 // Keep for 1 hour
      );

      // Check for alerts
      await this.checkAlerts(metrics);

      return metrics;

    } catch (error) {
      logger.error('Error collecting database metrics:', error);
      throw error;
    }
  }

  /**
   * Get database activity statistics
   */
  private async getActivityStats() {
    const response = await fetch(`${BACKEND_URL}/api/v2/database/query-raw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          SELECT
            COUNT(*) as query_count,
            AVG(EXTRACT(EPOCH FROM (now() - query_start)) * 1000) as avg_query_time,
            COUNT(CASE WHEN EXTRACT(EPOCH FROM (now() - query_start)) * 1000 > $1 THEN 1 END) as slow_queries,
            COUNT(CASE WHEN state = 'active' THEN 1 END) as active_connections
          FROM pg_stat_activity
          WHERE datname = current_database()
            AND state IS NOT NULL
        `,
        parameters: [this.alertThresholds.slowQueryThreshold]
      })
    });
    const stats = response.ok ? await response.json() : [];

    return {
      queryCount: Number(stats[0]?.query_count) || 0,
      avgQueryTime: Number(stats[0]?.avg_query_time) || 0,
      slowQueries: Number(stats[0]?.slow_queries) || 0,
      activeConnections: Number(stats[0]?.active_connections) || 0
    };
  }

  /**
   * Get buffer cache statistics
   */
  private async getBufferStats() {
    const statsResponse = await fetch(`${BACKEND_URL}/api/v2/database/query-raw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          SELECT
            ROUND(
              (blks_hit::float / (blks_hit + blks_read)) * 100, 2
            ) as hit_ratio,
            blks_read as disk_reads,
            pg_size_pretty(
              pg_database_size(current_database())
            ) as database_size
          FROM pg_stat_database
          WHERE datname = current_database()
        `
      })
    });
    const stats = statsResponse.ok ? await statsResponse.json() : [];

    // Get shared buffer usage
    const bufferUsageResponse = await fetch(`${BACKEND_URL}/api/v2/database/query-raw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          SELECT
            setting as shared_buffers,
            ROUND(
              (current_setting('shared_buffers')::numeric /
               current_setting('max_connections')::numeric) * 100, 2
            ) as memory_usage_pct
          FROM pg_settings
          WHERE name = 'shared_buffers'
        `
      })
    });
    const bufferUsage = bufferUsageResponse.ok ? await bufferUsageResponse.json() : [];

    return {
      hitRatio: Number(stats[0]?.hit_ratio) || 0,
      diskReads: Number(stats[0]?.disk_reads) || 0,
      memoryUsage: Number(bufferUsage[0]?.memory_usage_pct) || 0
    };
  }

  /**
   * Get table scan statistics
   */
  private async getTableStats() {
    const response = await fetch(`${BACKEND_URL}/api/v2/database/query-raw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          SELECT
            SUM(seq_scan) as seq_scans,
            SUM(idx_scan) as idx_scans,
            SUM(n_tup_ins) as insertions,
            SUM(n_tup_upd) as updates,
            SUM(n_tup_del) as deletions
          FROM pg_stat_user_tables
          WHERE schemaname = 'public'
        `
      })
    });
    const stats = response.ok ? await response.json() : [];

    return {
      seqScans: Number(stats[0]?.seq_scans) || 0,
      idxScans: Number(stats[0]?.idx_scans) || 0,
      insertions: Number(stats[0]?.insertions) || 0,
      updates: Number(stats[0]?.updates) || 0,
      deletions: Number(stats[0]?.deletions) || 0
    };
  }

  /**
   * Get lock statistics
   */
  private async getLockStats() {
    const response = await fetch(`${BACKEND_URL}/api/v2/database/query-raw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          SELECT
            COUNT(CASE WHEN NOT granted THEN 1 END) as waiting_locks,
            COUNT(*) as total_locks
          FROM pg_locks
        `
      })
    });
    const stats = response.ok ? await response.json() : [];

    return {
      waitingLocks: Number(stats[0]?.waiting_locks) || 0,
      totalLocks: Number(stats[0]?.total_locks) || 0
    };
  }

  /**
   * Get slow queries report
   */
  async getSlowQueries(limit = 10): Promise<SlowQuery[]> {
    try {
      // Note: This requires pg_stat_statements extension
      const response = await fetch(`${BACKEND_URL}/api/v2/database/query-raw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            SELECT
              query,
              calls,
              total_time,
              mean_time,
              min_time,
              max_time
            FROM pg_stat_statements
            WHERE query NOT LIKE '%pg_stat_statements%'
            ORDER BY mean_time DESC
            LIMIT $1
          `,
          parameters: [limit]
        })
      });
      const slowQueries = response.ok ? await response.json() : [];

      return slowQueries.map((q: any) => ({
        query: q.query.substring(0, 200) + (q.query.length > 200 ? '...' : ''),
        duration: Number(q.max_time),
        timestamp: new Date(),
        calls: Number(q.calls),
        meanTime: Number(q.mean_time),
        totalTime: Number(q.total_time)
      }));

    } catch (error) {
      // Fallback if pg_stat_statements is not available
      logger.warn('pg_stat_statements extension not available, using fallback slow query detection');
      return [];
    }
  }

  /**
   * Get detailed table statistics
   */
  async getDetailedTableStats(): Promise<TableStats[]> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/v2/database/query-raw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            SELECT
              t.tablename,
              pg_size_pretty(pg_total_relation_size(t.tablename::regclass)) as total_size,
              pg_size_pretty(pg_indexes_size(t.tablename::regclass)) as index_size,
              s.n_tup_ins as insertions,
              s.n_tup_upd as updates,
              s.n_tup_del as deletions,
              s.seq_scan as seq_scans,
              s.seq_tup_read as seq_tup_read,
              s.idx_scan as idx_scans,
              s.idx_tup_fetch as idx_tup_fetch,
              c.reltuples::bigint as row_count
            FROM pg_tables t
            LEFT JOIN pg_stat_user_tables s ON t.tablename = s.relname
            LEFT JOIN pg_class c ON t.tablename = c.relname
            WHERE t.schemaname = 'public'
              AND t.tablename LIKE 'LeadPulse%'
            ORDER BY pg_total_relation_size(t.tablename::regclass) DESC
          `
        })
      });
      const tableStats = response.ok ? await response.json() : [];

      return tableStats.map((t: any) => ({
        tableName: t.tablename,
        totalSize: t.total_size,
        indexSize: t.index_size,
        rowCount: Number(t.row_count) || 0,
        seqScans: Number(t.seq_scans) || 0,
        seqTupRead: Number(t.seq_tup_read) || 0,
        idxScans: Number(t.idx_scans) || 0,
        idxTupFetch: Number(t.idx_tup_fetch) || 0,
        insertions: Number(t.insertions) || 0,
        updates: Number(t.updates) || 0,
        deletions: Number(t.deletions) || 0
      }));

    } catch (error) {
      logger.error('Error getting table statistics:', error);
      throw error;
    }
  }

  /**
   * Check performance alerts
   */
  private async checkAlerts(metrics: PerformanceMetrics) {
    const alerts = [];

    // Check average query time
    if (metrics.avgQueryTime > this.alertThresholds.avgQueryTime) {
      alerts.push({
        type: 'HIGH_QUERY_TIME',
        message: `Average query time (${metrics.avgQueryTime}ms) exceeds threshold (${this.alertThresholds.avgQueryTime}ms)`,
        severity: 'warning',
        value: metrics.avgQueryTime,
        threshold: this.alertThresholds.avgQueryTime
      });
    }

    // Check buffer hit ratio
    if (metrics.bufferHitRatio < this.alertThresholds.bufferHitRatio) {
      alerts.push({
        type: 'LOW_BUFFER_HIT_RATIO',
        message: `Buffer hit ratio (${metrics.bufferHitRatio}%) is below threshold (${this.alertThresholds.bufferHitRatio}%)`,
        severity: 'error',
        value: metrics.bufferHitRatio,
        threshold: this.alertThresholds.bufferHitRatio
      });
    }

    // Check slow queries
    if (metrics.slowQueries > 0) {
      alerts.push({
        type: 'SLOW_QUERIES_DETECTED',
        message: `${metrics.slowQueries} slow queries detected`,
        severity: 'warning',
        value: metrics.slowQueries,
        threshold: 0
      });
    }

    // Check lock waits
    if (metrics.lockWaits > this.alertThresholds.lockWaitLimit) {
      alerts.push({
        type: 'HIGH_LOCK_WAITS',
        message: `High number of lock waits (${metrics.lockWaits})`,
        severity: 'error',
        value: metrics.lockWaits,
        threshold: this.alertThresholds.lockWaitLimit
      });
    }

    // Log alerts
    if (alerts.length > 0) {
      logger.warn('Database performance alerts:', { alerts, metrics });
      
      // Store alerts in cache for dashboard
      await leadPulseCache.set(
        'db_alerts:latest',
        { alerts, timestamp: new Date() },
        600 // Keep for 10 minutes
      );
    }

    return alerts;
  }

  /**
   * Get performance summary for dashboard
   */
  async getPerformanceSummary(hours = 24) {
    try {
      const endTime = Math.floor(Date.now() / 60000);
      const startTime = endTime - (hours * 60);

      // Get cached metrics for the time period
      const metricsPromises = [];
      for (let time = startTime; time <= endTime; time += 5) { // Every 5 minutes
        metricsPromises.push(
          leadPulseCache.get(`db_metrics:${time}`)
        );
      }

      const allMetrics = (await Promise.all(metricsPromises))
        .filter(m => m !== null) as PerformanceMetrics[];

      if (allMetrics.length === 0) {
        return null;
      }

      // Calculate summary statistics
      const summary = {
        timeRange: { hours, dataPoints: allMetrics.length },
        avgQueryTime: {
          current: allMetrics[allMetrics.length - 1]?.avgQueryTime || 0,
          average: allMetrics.reduce((sum, m) => sum + m.avgQueryTime, 0) / allMetrics.length,
          max: Math.max(...allMetrics.map(m => m.avgQueryTime))
        },
        bufferHitRatio: {
          current: allMetrics[allMetrics.length - 1]?.bufferHitRatio || 0,
          average: allMetrics.reduce((sum, m) => sum + m.bufferHitRatio, 0) / allMetrics.length,
          min: Math.min(...allMetrics.map(m => m.bufferHitRatio))
        },
        activeConnections: {
          current: allMetrics[allMetrics.length - 1]?.activeConnections || 0,
          average: allMetrics.reduce((sum, m) => sum + m.activeConnections, 0) / allMetrics.length,
          max: Math.max(...allMetrics.map(m => m.activeConnections))
        },
        slowQueries: {
          total: allMetrics.reduce((sum, m) => sum + m.slowQueries, 0),
          average: allMetrics.reduce((sum, m) => sum + m.slowQueries, 0) / allMetrics.length
        },
        trends: this.calculateTrends(allMetrics)
      };

      return summary;

    } catch (error) {
      logger.error('Error getting performance summary:', error);
      throw error;
    }
  }

  /**
   * Calculate performance trends
   */
  private calculateTrends(metrics: PerformanceMetrics[]) {
    if (metrics.length < 2) return null;

    const firstHalf = metrics.slice(0, Math.floor(metrics.length / 2));
    const secondHalf = metrics.slice(Math.floor(metrics.length / 2));

    const firstAvgQueryTime = firstHalf.reduce((sum, m) => sum + m.avgQueryTime, 0) / firstHalf.length;
    const secondAvgQueryTime = secondHalf.reduce((sum, m) => sum + m.avgQueryTime, 0) / secondHalf.length;

    const firstBufferHitRatio = firstHalf.reduce((sum, m) => sum + m.bufferHitRatio, 0) / firstHalf.length;
    const secondBufferHitRatio = secondHalf.reduce((sum, m) => sum + m.bufferHitRatio, 0) / secondHalf.length;

    return {
      queryTimeTrend: secondAvgQueryTime > firstAvgQueryTime ? 'increasing' : 'decreasing',
      bufferHitRatioTrend: secondBufferHitRatio > firstBufferHitRatio ? 'improving' : 'declining',
      queryTimeChange: ((secondAvgQueryTime - firstAvgQueryTime) / firstAvgQueryTime) * 100,
      bufferHitRatioChange: ((secondBufferHitRatio - firstBufferHitRatio) / firstBufferHitRatio) * 100
    };
  }

  /**
   * Run database maintenance tasks
   */
  async runMaintenance() {
    try {
      logger.info('Starting database maintenance tasks');

      // Update table statistics
      const analyzeResponse = await fetch(`${BACKEND_URL}/api/v2/database/query-raw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'ANALYZE'
        })
      });

      // Reindex if needed (check for bloated indexes)
      const indexStatsResponse = await fetch(`${BACKEND_URL}/api/v2/database/query-raw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            SELECT
              schemaname,
              tablename,
              indexname,
              pg_size_pretty(pg_relation_size(indexrelid)) as size
            FROM pg_stat_user_indexes
            WHERE schemaname = 'public'
              AND idx_scan < 10
            ORDER BY pg_relation_size(indexrelid) DESC
          `
        })
      });
      const indexStats = indexStatsResponse.ok ? await indexStatsResponse.json() : [];

      // Log unused indexes for manual review
      if (indexStats.length > 0) {
        logger.warn('Found potentially unused indexes:', indexStats);
      }

      logger.info('Database maintenance completed');
      return { success: true, unusedIndexes: indexStats.length };

    } catch (error) {
      logger.error('Error during database maintenance:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const leadPulseDBMonitor = new LeadPulseDBMonitor();