/**
 * Cache Integration Layer for Workflow System
 * Provides seamless integration between workflow services and advanced caching
 */

import { AdvancedCacheManager } from './advanced-cache-manager';
import { OptimizedWorkflowService } from './optimized-workflow-service';
import { logger } from '@/lib/logger';

export class WorkflowCacheIntegration {
  private cacheManager: AdvancedCacheManager;
  
  constructor() {
    this.cacheManager = new AdvancedCacheManager({
      enabled: process.env.NODE_ENV === 'production',
      defaultTTL: 900, // 15 minutes
      maxMemoryUsage: 512, // 512MB for production
      compressionEnabled: true,
      preloadStrategies: [
        'POPULAR_WORKFLOWS',
        'RECENT_WORKFLOWS',
        'ACTIVE_EXECUTIONS',
        'USER_WORKFLOWS',
      ],
    });
  }

  /**
   * Get workflow with intelligent caching
   */
  async getWorkflow(workflowId: string, userId?: string) {
    try {
      return await this.cacheManager.getWorkflowDefinition(workflowId, userId);
    } catch (error) {
      logger.error('Cache integration error for workflow retrieval', { 
        error, 
        workflowId, 
        userId 
      });
      // Fallback to direct database access
      return await OptimizedWorkflowService.getWorkflowById(workflowId, true);
    }
  }

  /**
   * Get user workflows with caching
   */
  async getUserWorkflows(userId: string, options: any = {}) {
    try {
      return await this.cacheManager.getUserWorkflows(userId, options);
    } catch (error) {
      logger.error('Cache integration error for user workflows', { 
        error, 
        userId, 
        options 
      });
      // Fallback to direct database access
      return await OptimizedWorkflowService.getWorkflowsList({ userId, ...options });
    }
  }

  /**
   * Get execution context with caching
   */
  async getExecutionContext(executionId: string) {
    try {
      return await this.cacheManager.getExecutionContext(executionId);
    } catch (error) {
      logger.error('Cache integration error for execution context', { 
        error, 
        executionId 
      });
      // Fallback to direct database access
      return await OptimizedWorkflowService.getExecutionContext(executionId);
    }
  }

  /**
   * Get analytics with long-term caching
   */
  async getAnalytics(workflowId: string, dateRange: string) {
    try {
      return await this.cacheManager.getAnalyticsData(workflowId, dateRange);
    } catch (error) {
      logger.error('Cache integration error for analytics', { 
        error, 
        workflowId, 
        dateRange 
      });
      // Fallback to direct database access
      return await OptimizedWorkflowService.getWorkflowAnalytics(workflowId, dateRange as any);
    }
  }

  /**
   * Invalidate cache when workflows are modified
   */
  async invalidateWorkflowCache(workflowId: string, userId?: string) {
    try {
      const patterns = [
        `workflow_def_${workflowId}`,
        `workflow_def:${workflowId}`,
        `analytics_${workflowId}`,
        `analytics:${workflowId}`,
      ];

      if (userId) {
        patterns.push(`user_workflows_${userId}`);
        patterns.push(`user_workflows:${userId}`);
      }

      await this.cacheManager.invalidateCache(patterns);
      
      logger.info('Workflow cache invalidated', { workflowId, userId, patterns });
    } catch (error) {
      logger.error('Cache invalidation error', { error, workflowId, userId });
    }
  }

  /**
   * Warm cache for important workflows
   */
  async warmWorkflowCache(workflowIds?: string[], userId?: string) {
    try {
      if (workflowIds && workflowIds.length > 0) {
        // Warm specific workflows
        await Promise.all(
          workflowIds.map(id => this.getWorkflow(id, userId).catch(() => {}))
        );
      } else {
        // Use automatic cache warming
        await this.cacheManager.warmCache();
      }
      
      logger.info('Workflow cache warmed', { workflowIds, userId });
    } catch (error) {
      logger.error('Cache warming error', { error, workflowIds, userId });
    }
  }

  /**
   * Get comprehensive cache metrics
   */
  getCacheMetrics() {
    return this.cacheManager.getCacheMetrics();
  }

  /**
   * Health check for cache system
   */
  async healthCheck() {
    try {
      const metrics = this.getCacheMetrics();
      const isHealthy = metrics.totalRequests === 0 || metrics.hitRate > 0.3; // At least 30% hit rate
      
      return {
        healthy: isHealthy,
        metrics,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Cache health check failed', { error });
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }
}

// Export singleton instance
export const workflowCacheIntegration = new WorkflowCacheIntegration();