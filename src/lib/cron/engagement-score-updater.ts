/**
 * Engagement Score Updater Cron Job
 * 
 * Periodically updates engagement scores for active visitors
 * to ensure accuracy and freshness of scoring data.
 */

import { engagementScoringEngine } from '@/lib/leadpulse/engagement-scoring-engine';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

export interface EngagementScoreUpdateResult {
  totalVisitors: number;
  updated: number;
  failed: number;
  duration: number;
  timestamp: Date;
}

export class EngagementScoreUpdater {
  private isRunning = false;
  
  /**
   * Update engagement scores for all active visitors
   */
  async updateAllScores(): Promise<EngagementScoreUpdateResult> {
    if (this.isRunning) {
      logger.warn('Engagement score update already in progress');
      throw new Error('Update already in progress');
    }
    
    this.isRunning = true;
    const startTime = Date.now();
    const result: EngagementScoreUpdateResult = {
      totalVisitors: 0,
      updated: 0,
      failed: 0,
      duration: 0,
      timestamp: new Date()
    };
    
    try {
      // Get active visitors (visited in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const activeVisitors = await prisma.anonymousVisitor.findMany({
        where: {
          isActive: true,
          lastVisit: { gte: thirtyDaysAgo }
        },
        select: { id: true },
        orderBy: { lastVisit: 'desc' }
      });
      
      result.totalVisitors = activeVisitors.length;
      logger.info(`Starting engagement score update for ${result.totalVisitors} visitors`);
      
      // Process in batches of 50
      const batchSize = 50;
      for (let i = 0; i < activeVisitors.length; i += batchSize) {
        const batch = activeVisitors.slice(i, i + batchSize);
        const visitorIds = batch.map(v => v.id);
        
        try {
          const scores = await engagementScoringEngine.batchCalculateScores(visitorIds);
          
          // Update each visitor's score
          for (const [visitorId, score] of scores) {
            try {
              await prisma.anonymousVisitor.update({
                where: { id: visitorId },
                data: {
                  engagementScore: score.score,
                  score: score.score,
                  metadata: {
                    engagementCategory: score.category,
                    engagementBreakdown: score.breakdown,
                    engagementSignals: score.signals,
                    lastScoreUpdate: new Date().toISOString()
                  }
                }
              });
              result.updated++;
            } catch (error) {
              logger.error(`Failed to update score for visitor ${visitorId}:`, error);
              result.failed++;
            }
          }
        } catch (error) {
          logger.error(`Batch processing error:`, error);
          result.failed += batch.length;
        }
        
        // Log progress
        if ((i + batchSize) % 500 === 0 || i + batchSize >= activeVisitors.length) {
          logger.info(`Progress: ${Math.min(i + batchSize, activeVisitors.length)}/${result.totalVisitors} visitors processed`);
        }
      }
      
      result.duration = Date.now() - startTime;
      logger.info(`Engagement score update completed: ${result.updated} updated, ${result.failed} failed, took ${result.duration}ms`);
      
      // Store update result
      await this.storeUpdateResult(result);
      
      return result;
    } catch (error) {
      logger.error('Error in engagement score update:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }
  
  /**
   * Update scores for specific high-value visitors
   */
  async updateHighValueVisitorScores(): Promise<EngagementScoreUpdateResult> {
    const startTime = Date.now();
    const result: EngagementScoreUpdateResult = {
      totalVisitors: 0,
      updated: 0,
      failed: 0,
      duration: 0,
      timestamp: new Date()
    };
    
    try {
      // Get high-value visitors (score > 50 or recent high activity)
      const highValueVisitors = await prisma.anonymousVisitor.findMany({
        where: {
          OR: [
            { engagementScore: { gte: 50 } },
            { 
              lastVisit: { 
                gte: new Date(Date.now() - 60 * 60 * 1000) // Active in last hour
              }
            }
          ],
          isActive: true
        },
        select: { id: true }
      });
      
      result.totalVisitors = highValueVisitors.length;
      const visitorIds = highValueVisitors.map(v => v.id);
      
      // Update all high-value visitors
      const scores = await engagementScoringEngine.batchCalculateScores(visitorIds);
      
      for (const [visitorId, score] of scores) {
        try {
          await prisma.anonymousVisitor.update({
            where: { id: visitorId },
            data: {
              engagementScore: score.score,
              score: score.score,
              metadata: {
                engagementCategory: score.category,
                engagementBreakdown: score.breakdown,
                engagementSignals: score.signals,
                isHighValue: score.score >= 75,
                lastScoreUpdate: new Date().toISOString()
              }
            }
          });
          result.updated++;
        } catch (error) {
          logger.error(`Failed to update high-value visitor ${visitorId}:`, error);
          result.failed++;
        }
      }
      
      result.duration = Date.now() - startTime;
      logger.info(`High-value visitor update completed: ${result.updated}/${result.totalVisitors} updated in ${result.duration}ms`);
      
      return result;
    } catch (error) {
      logger.error('Error updating high-value visitor scores:', error);
      throw error;
    }
  }
  
  /**
   * Clean up old visitor data and reset stale scores
   */
  async cleanupStaleScores(): Promise<void> {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      // Reset scores for visitors inactive for 90+ days
      const result = await prisma.anonymousVisitor.updateMany({
        where: {
          lastVisit: { lt: ninetyDaysAgo },
          engagementScore: { gt: 0 }
        },
        data: {
          engagementScore: 0,
          score: 0
        }
      });
      
      logger.info(`Reset engagement scores for ${result.count} inactive visitors`);
    } catch (error) {
      logger.error('Error cleaning up stale scores:', error);
      throw error;
    }
  }
  
  /**
   * Store update result for monitoring
   */
  private async storeUpdateResult(result: EngagementScoreUpdateResult): Promise<void> {
    try {
      // Store in a monitoring table or metric system
      // For now, we'll just log it
      logger.info('Engagement score update result:', {
        ...result,
        successRate: result.totalVisitors > 0 
          ? ((result.updated / result.totalVisitors) * 100).toFixed(2) + '%' 
          : '0%'
      });
    } catch (error) {
      logger.error('Error storing update result:', error);
    }
  }
}

// Export singleton instance
export const engagementScoreUpdater = new EngagementScoreUpdater();