/**
 * LeadPulse Database Optimizer
 * 
 * Handles database performance optimization, indexing, and maintenance
 * for production-ready LeadPulse performance
 */

// NOTE: Prisma removed - using backend API
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ||
                    process.env.NESTJS_BACKEND_URL ||
                    'http://localhost:3006';

import { logger } from '@/lib/logger';
import fs from 'fs';
import path from 'path';

export class LeadPulseDbOptimizer {
  private static instance: LeadPulseDbOptimizer;
  
  static getInstance(): LeadPulseDbOptimizer {
    if (!LeadPulseDbOptimizer.instance) {
      LeadPulseDbOptimizer.instance = new LeadPulseDbOptimizer();
    }
    return LeadPulseDbOptimizer.instance;
  }

  // Apply all performance indexes
  async applyIndexes(): Promise<boolean> {
    try {
      logger.info('Applying LeadPulse database indexes...');
      
      // Read the SQL file with indexes
      const sqlFile = path.join(process.cwd(), 'src/lib/db/leadpulse-indexes.sql');
      const indexQueries = fs.readFileSync(sqlFile, 'utf8');
      
      // Split by statements and execute each
      const statements = indexQueries
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));
      
      for (const statement of statements) {
        try {
          if (statement.toLowerCase().includes('create index') ||
              statement.toLowerCase().includes('create or replace')) {
            const response = await fetch(`${BACKEND_URL}/api/v2/execute-raw`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: statement })
            });
            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.message || 'Failed to execute statement');
            }
            logger.info(`Executed: ${statement.substring(0, 50)}...`);
          }
        } catch (error: any) {
          // Log but don't fail on already existing indexes
          if (error.message?.includes('already exists')) {
            logger.info(`Index already exists: ${statement.substring(0, 50)}...`);
          } else {
            logger.warn(`Failed to execute statement: ${error.message}`);
          }
        }
      }
      
      logger.info('LeadPulse database indexes applied successfully');
      return true;
    } catch (error) {
      logger.error('Error applying database indexes:', error);
      return false;
    }
  }

  // Analyze table statistics for better query planning
  async analyzeStatistics(): Promise<void> {
    try {
      logger.info('Analyzing LeadPulse table statistics...');

      const tables = ['LeadPulseVisitor', 'LeadPulseTouchpoint', 'LeadPulseSegment', 'LeadPulseInsight'];
      for (const table of tables) {
        const response = await fetch(`${BACKEND_URL}/api/v2/execute-raw`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: `ANALYZE "${table}"` })
        });
        if (!response.ok) {
          logger.warn(`Failed to analyze ${table}`);
        }
      }

      logger.info('Table statistics analysis completed');
    } catch (error) {
      logger.error('Error analyzing table statistics:', error);
    }
  }

  // Clean up old data based on retention policy
  async cleanupOldData(retentionDays = 90): Promise<number> {
    try {
      logger.info(`Cleaning up LeadPulse data older than ${retentionDays} days...`);
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Delete old touchpoints first (foreign key dependency)
      const touchpointResponse = await fetch(`${BACKEND_URL}/api/v2/leadpulse-touchpoints/delete-many`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          where: {
            timestamp: {
              lt: cutoffDate.toISOString()
            }
          }
        })
      });
      const touchpointResult = touchpointResponse.ok ? await touchpointResponse.json() : { count: 0 };
      const touchpointCount = touchpointResult.count || 0;

      // Delete visitors with no touchpoints and old last visit
      const visitorResponse = await fetch(`${BACKEND_URL}/api/v2/leadpulse-visitors/delete-many`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          where: {
            lastVisit: {
              lt: cutoffDate.toISOString()
            },
            touchpoints: {
              none: {}
            }
          }
        })
      });
      const visitorResult = visitorResponse.ok ? await visitorResponse.json() : { count: 0 };
      const visitorCount = visitorResult.count || 0;

      logger.info(`Cleaned up ${touchpointCount} touchpoints and ${visitorCount} visitors`);
      return touchpointCount + visitorCount;
    } catch (error) {
      logger.error('Error cleaning up old data:', error);
      return 0;
    }
  }

  // Recompute engagement scores for all active visitors
  async recomputeEngagementScores(): Promise<void> {
    try {
      logger.info('Recomputing engagement scores...');

      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // Get all visitors with recent activity
      const visitorsResponse = await fetch(
        `${BACKEND_URL}/api/v2/leadpulse-visitors?where=${encodeURIComponent(JSON.stringify({
          lastVisit: { gte: last24Hours }
        }))}&include=${encodeURIComponent(JSON.stringify({
          touchpoints: {
            where: {
              timestamp: { gte: last24Hours }
            }
          }
        }))}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      const activeVisitors = visitorsResponse.ok ? await visitorsResponse.json() : [];

      // Update engagement scores in batches
      const batchSize = 100;
      for (let i = 0; i < activeVisitors.length; i += batchSize) {
        const batch = activeVisitors.slice(i, i + batchSize);

        const updatePromises = batch.map(async (visitor: any) => {
          const score = this.calculateEngagementScore(visitor.touchpoints);
          const response = await fetch(`${BACKEND_URL}/api/v2/leadpulse-visitors/${visitor.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ engagementScore: score })
          });
          return response.ok ? await response.json() : null;
        });

        await Promise.all(updatePromises);
      }

      logger.info(`Updated engagement scores for ${activeVisitors.length} visitors`);
    } catch (error) {
      logger.error('Error recomputing engagement scores:', error);
    }
  }

  // Calculate engagement score based on touchpoints
  private calculateEngagementScore(touchpoints: any[]): number {
    const now = Date.now();
    
    const score = touchpoints.reduce((total, touchpoint) => {
      const age = now - touchpoint.timestamp.getTime();
      const hours = age / (60 * 60 * 1000);
      
      // Recency factor: newer interactions have more weight
      const recencyFactor = Math.max(0.1, 1 - (hours / 24));
      
      // Base score from touchpoint type
      const baseScore = touchpoint.score || this.getTouchpointScore(touchpoint.type);
      
      return total + (baseScore * recencyFactor);
    }, 0);
    
    // Normalize to 0-100 range
    return Math.min(100, Math.round(score));
  }

  // Get base score for touchpoint types
  private getTouchpointScore(type: string): number {
    const scoreMap: Record<string, number> = {
      'PAGEVIEW': 1,
      'CLICK': 2,
      'FORM_VIEW': 3,
      'FORM_START': 4,
      'FORM_SUBMIT': 8,
      'CONVERSION': 10
    };
    
    return scoreMap[type] || 1;
  }

  // Get database performance metrics
  async getPerformanceMetrics(): Promise<any> {
    try {
      // Table sizes
      const tableSizesResponse = await fetch(`${BACKEND_URL}/api/v2/execute-raw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            SELECT
              tablename,
              pg_size_pretty(pg_total_relation_size('public."' || tablename || '"')) as size,
              pg_total_relation_size('public."' || tablename || '"') as size_bytes
            FROM pg_tables
            WHERE tablename LIKE 'LeadPulse%'
            ORDER BY size_bytes DESC
          `
        })
      });
      const tableSizes = tableSizesResponse.ok ? await tableSizesResponse.json() : [];

      // Index usage statistics
      const indexStatsResponse = await fetch(`${BACKEND_URL}/api/v2/execute-raw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            SELECT
              indexname,
              idx_tup_read,
              idx_tup_fetch,
              CASE
                WHEN idx_tup_fetch > 0
                THEN ROUND(idx_tup_read::numeric / idx_tup_fetch, 2)
                ELSE 0
              END as selectivity
            FROM pg_stat_user_indexes
            WHERE tablename LIKE 'LeadPulse%'
            ORDER BY idx_tup_read DESC
          `
        })
      });
      const indexStats = indexStatsResponse.ok ? await indexStatsResponse.json() : [];

      // Record counts
      const counts = await Promise.all([
        fetch(`${BACKEND_URL}/api/v2/leadpulse-visitors/count`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }).then(r => r.ok ? r.json().then(d => d.count || 0) : 0),
        fetch(`${BACKEND_URL}/api/v2/leadpulse-touchpoints/count`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }).then(r => r.ok ? r.json().then(d => d.count || 0) : 0),
        fetch(`${BACKEND_URL}/api/v2/leadpulse-segments/count`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }).then(r => r.ok ? r.json().then(d => d.count || 0) : 0),
        fetch(`${BACKEND_URL}/api/v2/leadpulse-insights/count`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }).then(r => r.ok ? r.json().then(d => d.count || 0) : 0)
      ]);

      return {
        tableSizes,
        indexStats,
        recordCounts: {
          visitors: counts[0],
          touchpoints: counts[1],
          segments: counts[2],
          insights: counts[3]
        },
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Error getting performance metrics:', error);
      return null;
    }
  }

  // Check if database needs optimization
  async needsOptimization(): Promise<boolean> {
    try {
      const metrics = await this.getPerformanceMetrics();
      if (!metrics) return true;
      
      // Check if we have a lot of data without proper indexing
      const totalRecords = metrics.recordCounts.visitors + metrics.recordCounts.touchpoints;
      
      // If we have more than 10k records, we should ensure optimization
      if (totalRecords > 10000) {
        logger.info(`Database has ${totalRecords} records, optimization recommended`);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Error checking optimization needs:', error);
      return true;
    }
  }

  // Run full optimization suite
  async optimize(): Promise<boolean> {
    try {
      logger.info('Starting LeadPulse database optimization...');
      
      const success = await this.applyIndexes();
      if (!success) return false;
      
      await this.analyzeStatistics();
      await this.recomputeEngagementScores();
      
      logger.info('LeadPulse database optimization completed');
      return true;
    } catch (error) {
      logger.error('Error during database optimization:', error);
      return false;
    }
  }

  // Schedule regular maintenance
  startMaintenanceSchedule(): void {
    // Analyze statistics every hour
    setInterval(async () => {
      await this.analyzeStatistics();
    }, 60 * 60 * 1000);
    
    // Recompute engagement scores every 6 hours
    setInterval(async () => {
      await this.recomputeEngagementScores();
    }, 6 * 60 * 60 * 1000);
    
    // Clean up old data daily (at 2 AM)
    const scheduleCleanup = () => {
      const now = new Date();
      const next2AM = new Date(now);
      next2AM.setHours(2, 0, 0, 0);
      
      if (next2AM <= now) {
        next2AM.setDate(next2AM.getDate() + 1);
      }
      
      const timeUntil2AM = next2AM.getTime() - now.getTime();
      
      setTimeout(async () => {
        await this.cleanupOldData();
        
        // Schedule for next day
        setInterval(async () => {
          await this.cleanupOldData();
        }, 24 * 60 * 60 * 1000);
      }, timeUntil2AM);
    };
    
    scheduleCleanup();
    
    logger.info('LeadPulse database maintenance scheduled');
  }

  // Health check
  async healthCheck(): Promise<{ healthy: boolean; metrics?: any; error?: string }> {
    try {
      const metrics = await this.getPerformanceMetrics();
      return {
        healthy: true,
        metrics
      };
    } catch (error: any) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const leadPulseDbOptimizer = LeadPulseDbOptimizer.getInstance();