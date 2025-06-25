/**
 * LeadPulse Database Optimizer
 * 
 * Handles database performance optimization, indexing, and maintenance
 * for production-ready LeadPulse performance
 */

import prisma from './prisma';
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
            await prisma.$executeRawUnsafe(statement);
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
      
      await prisma.$executeRaw`ANALYZE "LeadPulseVisitor"`;
      await prisma.$executeRaw`ANALYZE "LeadPulseTouchpoint"`;
      await prisma.$executeRaw`ANALYZE "LeadPulseSegment"`;
      await prisma.$executeRaw`ANALYZE "LeadPulseInsight"`;
      
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
      const { count: touchpointCount } = await prisma.leadPulseTouchpoint.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      });
      
      // Delete visitors with no touchpoints and old last visit
      const { count: visitorCount } = await prisma.leadPulseVisitor.deleteMany({
        where: {
          lastVisit: {
            lt: cutoffDate
          },
          touchpoints: {
            none: {}
          }
        }
      });
      
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
      
      // Get all visitors with recent activity
      const activeVisitors = await prisma.leadPulseVisitor.findMany({
        where: {
          lastVisit: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        include: {
          touchpoints: {
            where: {
              timestamp: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
              }
            }
          }
        }
      });
      
      // Update engagement scores in batches
      const batchSize = 100;
      for (let i = 0; i < activeVisitors.length; i += batchSize) {
        const batch = activeVisitors.slice(i, i + batchSize);
        
        const updatePromises = batch.map(visitor => {
          const score = this.calculateEngagementScore(visitor.touchpoints);
          return prisma.leadPulseVisitor.update({
            where: { id: visitor.id },
            data: { engagementScore: score }
          });
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
      const tableSizes = await prisma.$queryRaw`
        SELECT 
          tablename,
          pg_size_pretty(pg_total_relation_size('public."' || tablename || '"')) as size,
          pg_total_relation_size('public."' || tablename || '"') as size_bytes
        FROM pg_tables 
        WHERE tablename LIKE 'LeadPulse%'
        ORDER BY size_bytes DESC
      `;
      
      // Index usage statistics
      const indexStats = await prisma.$queryRaw`
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
      `;
      
      // Record counts
      const counts = await Promise.all([
        prisma.leadPulseVisitor.count(),
        prisma.leadPulseTouchpoint.count(),
        prisma.leadPulseSegment.count(),
        prisma.leadPulseInsight.count()
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