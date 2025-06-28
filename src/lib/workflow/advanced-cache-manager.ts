/**
 * Advanced Multi-Layer Caching System for Workflows
 * Implements intelligent caching with Redis, LRU, and database-level optimization
 */

import Redis from 'ioredis';
import { SimpleCache } from '@/lib/utils/simple-cache';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { OptimizedWorkflowService } from './optimized-workflow-service';

// Cache configuration interfaces
interface CacheConfig {
  enabled: boolean;
  defaultTTL: number;
  maxMemoryUsage: number; // MB
  compressionEnabled: boolean;
  preloadStrategies: PreloadStrategy[];
}

interface CacheMetrics {
  hitRate: number;
  missRate: number;
  memoryUsage: number;
  totalRequests: number;
  avgResponseTime: number;
  compressionRatio: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  compressed: boolean;
  size: number;
}

enum PreloadStrategy {
  POPULAR_WORKFLOWS = 'POPULAR_WORKFLOWS',
  RECENT_WORKFLOWS = 'RECENT_WORKFLOWS',
  USER_WORKFLOWS = 'USER_WORKFLOWS',
  ACTIVE_EXECUTIONS = 'ACTIVE_EXECUTIONS',
}

enum CacheLevel {
  L1_MEMORY = 'L1_MEMORY',
  L2_REDIS = 'L2_REDIS',
  L3_DATABASE = 'L3_DATABASE',
}

// Multi-level cache implementation
export class AdvancedCacheManager {
  private redis: Redis;
  private config: CacheConfig;
  private metrics: CacheMetrics;
  
  // L1 Cache: In-memory simple caches
  private workflowDefinitionCache: SimpleCache<CacheEntry<any>>;
  private executionContextCache: SimpleCache<CacheEntry<any>>;
  private userWorkflowsCache: SimpleCache<CacheEntry<any>>;
  private analyticsCache: SimpleCache<CacheEntry<any>>;
  
  // Cache warming queues
  private preloadQueue: Array<{ key: string; strategy: PreloadStrategy; priority: number }>;
  private isWarming = false;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      enabled: true,
      defaultTTL: 900, // 15 minutes
      maxMemoryUsage: 256, // 256MB
      compressionEnabled: true,
      preloadStrategies: [
        PreloadStrategy.POPULAR_WORKFLOWS,
        PreloadStrategy.RECENT_WORKFLOWS,
        PreloadStrategy.ACTIVE_EXECUTIONS,
      ],
      ...config,
    };

    this.metrics = {
      hitRate: 0,
      missRate: 0,
      memoryUsage: 0,
      totalRequests: 0,
      avgResponseTime: 0,
      compressionRatio: 0,
    };

    this.preloadQueue = [];
    this.initializeCaches();
    this.initializeRedis();
  }

  /**
   * Initialize multi-level cache architecture
   */
  private initializeCaches(): void {
    const cacheSize = Math.floor(this.config.maxMemoryUsage / 4); // Divide among cache types
    
    // Workflow definitions cache (most frequently accessed)
    this.workflowDefinitionCache = new SimpleCache({
      max: 500,
      ttl: this.config.defaultTTL * 1000,
    });

    // Execution context cache (dynamic data)
    this.executionContextCache = new SimpleCache({
      max: 1000,
      ttl: 300 * 1000, // 5 minutes for execution data
    });

    // User workflows cache (personalized data)
    this.userWorkflowsCache = new SimpleCache({
      max: 200,
      ttl: this.config.defaultTTL * 1000,
    });

    // Analytics cache (aggregated data)
    this.analyticsCache = new SimpleCache({
      max: 100,
      ttl: 1800 * 1000, // 30 minutes for analytics
    });

    logger.info('Multi-level caches initialized', {
      maxMemoryUsage: this.config.maxMemoryUsage,
      cacheSize: cacheSize,
      compressionEnabled: this.config.compressionEnabled,
    });
  }

  /**
   * Initialize Redis connection with advanced configuration
   */
  private initializeRedis(): void {
    this.redis = new Redis(process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      compression: this.config.compressionEnabled ? 'gzip' : undefined,
      keyPrefix: 'workflow_cache:',
    });

    this.redis.on('connect', () => {
      logger.info('Redis cache connection established');
    });

    this.redis.on('error', (error) => {
      logger.error('Redis cache connection error', { error });
    });
  }

  /**
   * Get workflow definition with intelligent multi-level caching
   */
  async getWorkflowDefinition(workflowId: string, userId?: string): Promise<any> {
    const startTime = performance.now();
    let cacheLevel: CacheLevel;
    let data: any;

    try {
      // L1 Cache: Check memory cache first
      const l1Key = `workflow_def_${workflowId}`;
      const l1Entry = this.workflowDefinitionCache.get(l1Key);
      
      if (l1Entry) {
        data = await this.decompressIfNeeded(l1Entry);
        cacheLevel = CacheLevel.L1_MEMORY;
        this.recordCacheHit(CacheLevel.L1_MEMORY, performance.now() - startTime);
        
        logger.debug('Workflow definition cache hit (L1)', { workflowId });
        return data;
      }

      // L2 Cache: Check Redis cache
      const l2Key = `workflow_def:${workflowId}`;
      const l2Data = await this.redis.get(l2Key);
      
      if (l2Data) {
        data = JSON.parse(l2Data);
        cacheLevel = CacheLevel.L2_REDIS;
        
        // Promote to L1 cache
        await this.setL1Cache(l1Key, data, this.workflowDefinitionCache);
        
        this.recordCacheHit(CacheLevel.L2_REDIS, performance.now() - startTime);
        logger.debug('Workflow definition cache hit (L2)', { workflowId });
        return data;
      }

      // L3 Cache: Database with optimized query
      data = await OptimizedWorkflowService.getWorkflowById(workflowId, false);
      
      if (data) {
        cacheLevel = CacheLevel.L3_DATABASE;
        
        // Populate both L1 and L2 caches
        await Promise.all([
          this.setL1Cache(l1Key, data, this.workflowDefinitionCache),
          this.setL2Cache(l2Key, data, this.config.defaultTTL),
        ]);
        
        // Add to preload queue for related data
        this.addToPreloadQueue(`user_workflows_${userId}`, PreloadStrategy.USER_WORKFLOWS, 3);
        
        this.recordCacheMiss(performance.now() - startTime);
        logger.debug('Workflow definition loaded from database', { workflowId });
        return data;
      }

      throw new Error(`Workflow not found: ${workflowId}`);
    } catch (error) {
      this.recordCacheMiss(performance.now() - startTime);
      logger.error('Failed to get workflow definition', { error, workflowId });
      throw error;
    }
  }

  /**
   * Get user workflows with personalized caching
   */
  async getUserWorkflows(userId: string, options: any = {}): Promise<any> {
    const startTime = performance.now();
    const cacheKey = `user_workflows_${userId}_${JSON.stringify(options)}`;

    try {
      // Check L1 cache
      const l1Entry = this.userWorkflowsCache.get(cacheKey);
      if (l1Entry) {
        const data = await this.decompressIfNeeded(l1Entry);
        this.recordCacheHit(CacheLevel.L1_MEMORY, performance.now() - startTime);
        return data;
      }

      // Check L2 cache
      const l2Key = `user_workflows:${userId}:${this.hashOptions(options)}`;
      const l2Data = await this.redis.get(l2Key);
      
      if (l2Data) {
        const data = JSON.parse(l2Data);
        await this.setL1Cache(cacheKey, data, this.userWorkflowsCache);
        this.recordCacheHit(CacheLevel.L2_REDIS, performance.now() - startTime);
        return data;
      }

      // Load from database
      const data = await OptimizedWorkflowService.getWorkflowsList({
        userId,
        ...options,
      });

      // Cache the results
      await Promise.all([
        this.setL1Cache(cacheKey, data, this.userWorkflowsCache),
        this.setL2Cache(l2Key, data, this.config.defaultTTL),
      ]);

      this.recordCacheMiss(performance.now() - startTime);
      return data;
    } catch (error) {
      this.recordCacheMiss(performance.now() - startTime);
      logger.error('Failed to get user workflows', { error, userId });
      throw error;
    }
  }

  /**
   * Get execution context with short-term caching
   */
  async getExecutionContext(executionId: string): Promise<any> {
    const startTime = performance.now();
    const cacheKey = `execution_ctx_${executionId}`;

    try {
      // Check L1 cache only (execution data is short-lived)
      const l1Entry = this.executionContextCache.get(cacheKey);
      if (l1Entry) {
        const data = await this.decompressIfNeeded(l1Entry);
        this.recordCacheHit(CacheLevel.L1_MEMORY, performance.now() - startTime);
        return data;
      }

      // Load from database
      const execution = await prisma.workflowExecution.findUnique({
        where: { id: executionId },
        include: {
          workflow: { select: { id: true, name: true } },
          contact: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });

      if (execution) {
        const data = {
          ...execution,
          context: execution.context || {},
        };

        // Cache with shorter TTL
        await this.setL1Cache(cacheKey, data, this.executionContextCache, 300);
        
        this.recordCacheMiss(performance.now() - startTime);
        return data;
      }

      return null;
    } catch (error) {
      this.recordCacheMiss(performance.now() - startTime);
      logger.error('Failed to get execution context', { error, executionId });
      throw error;
    }
  }

  /**
   * Get analytics data with long-term caching
   */
  async getAnalyticsData(workflowId: string, dateRange: string): Promise<any> {
    const startTime = performance.now();
    const cacheKey = `analytics_${workflowId}_${dateRange}`;

    try {
      // Check L1 cache
      const l1Entry = this.analyticsCache.get(cacheKey);
      if (l1Entry) {
        const data = await this.decompressIfNeeded(l1Entry);
        this.recordCacheHit(CacheLevel.L1_MEMORY, performance.now() - startTime);
        return data;
      }

      // Check L2 cache with longer key
      const l2Key = `analytics:${workflowId}:${dateRange}`;
      const l2Data = await this.redis.get(l2Key);
      
      if (l2Data) {
        const data = JSON.parse(l2Data);
        await this.setL1Cache(cacheKey, data, this.analyticsCache, 1800); // 30 minutes
        this.recordCacheHit(CacheLevel.L2_REDIS, performance.now() - startTime);
        return data;
      }

      // Load from database
      const data = await OptimizedWorkflowService.getWorkflowAnalytics(workflowId, dateRange as any);

      // Cache with longer TTL
      await Promise.all([
        this.setL1Cache(cacheKey, data, this.analyticsCache, 1800),
        this.setL2Cache(l2Key, data, 3600), // 1 hour in Redis
      ]);

      this.recordCacheMiss(performance.now() - startTime);
      return data;
    } catch (error) {
      this.recordCacheMiss(performance.now() - startTime);
      logger.error('Failed to get analytics data', { error, workflowId, dateRange });
      throw error;
    }
  }

  /**
   * Intelligent cache warming based on usage patterns
   */
  async warmCache(): Promise<void> {
    if (this.isWarming) {
      logger.debug('Cache warming already in progress');
      return;
    }

    this.isWarming = true;
    logger.info('Starting intelligent cache warming');

    try {
      // Process preload strategies
      await Promise.all(this.config.preloadStrategies.map(strategy => 
        this.executePreloadStrategy(strategy)
      ));

      // Process manual preload queue
      await this.processPreloadQueue();

      logger.info('Cache warming completed', {
        preloadStrategies: this.config.preloadStrategies.length,
        queueItems: this.preloadQueue.length,
      });
    } catch (error) {
      logger.error('Cache warming failed', { error });
    } finally {
      this.isWarming = false;
    }
  }

  /**
   * Execute specific preload strategy
   */
  private async executePreloadStrategy(strategy: PreloadStrategy): Promise<void> {
    try {
      switch (strategy) {
        case PreloadStrategy.POPULAR_WORKFLOWS:
          await this.preloadPopularWorkflows();
          break;
        case PreloadStrategy.RECENT_WORKFLOWS:
          await this.preloadRecentWorkflows();
          break;
        case PreloadStrategy.ACTIVE_EXECUTIONS:
          await this.preloadActiveExecutions();
          break;
        case PreloadStrategy.USER_WORKFLOWS:
          await this.preloadUserWorkflows();
          break;
      }
    } catch (error) {
      logger.warn('Preload strategy failed', { strategy, error });
    }
  }

  /**
   * Preload popular workflows based on execution frequency
   */
  private async preloadPopularWorkflows(): Promise<void> {
    const popularWorkflows = await prisma.workflow.findMany({
      where: {
        status: 'ACTIVE',
        totalExecutions: { gt: 10 },
      },
      orderBy: { totalExecutions: 'desc' },
      take: 20,
      select: { id: true },
    });

    await Promise.all(
      popularWorkflows.map(workflow => 
        this.getWorkflowDefinition(workflow.id).catch(() => {}) // Ignore errors
      )
    );

    logger.debug('Preloaded popular workflows', { count: popularWorkflows.length });
  }

  /**
   * Preload recently accessed workflows
   */
  private async preloadRecentWorkflows(): Promise<void> {
    const recentExecutions = await prisma.workflowExecution.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      },
      distinct: ['workflowId'],
      orderBy: { createdAt: 'desc' },
      take: 15,
      select: { workflowId: true },
    });

    await Promise.all(
      recentExecutions.map(execution => 
        this.getWorkflowDefinition(execution.workflowId).catch(() => {})
      )
    );

    logger.debug('Preloaded recent workflows', { count: recentExecutions.length });
  }

  /**
   * Preload data for active executions
   */
  private async preloadActiveExecutions(): Promise<void> {
    const activeExecutions = await prisma.workflowExecution.findMany({
      where: { status: 'RUNNING' },
      take: 50,
      select: { id: true, workflowId: true },
    });

    await Promise.all([
      // Preload workflow definitions
      ...activeExecutions.map(execution => 
        this.getWorkflowDefinition(execution.workflowId).catch(() => {})
      ),
      // Preload execution contexts
      ...activeExecutions.map(execution => 
        this.getExecutionContext(execution.id).catch(() => {})
      ),
    ]);

    logger.debug('Preloaded active executions', { count: activeExecutions.length });
  }

  /**
   * Preload workflows for active users
   */
  private async preloadUserWorkflows(): Promise<void> {
    // Get users who have accessed workflows recently
    const activeUsers = await prisma.workflowExecution.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // Last 2 hours
      },
      distinct: ['workflow'],
      include: {
        workflow: { select: { createdById: true } },
      },
      take: 10,
    });

    await Promise.all(
      activeUsers.map(execution => 
        this.getUserWorkflows(execution.workflow.createdById).catch(() => {})
      )
    );

    logger.debug('Preloaded user workflows', { count: activeUsers.length });
  }

  /**
   * Process manual preload queue
   */
  private async processPreloadQueue(): Promise<void> {
    // Sort by priority
    this.preloadQueue.sort((a, b) => b.priority - a.priority);

    for (const item of this.preloadQueue.splice(0, 10)) { // Process top 10 items
      try {
        await this.executePreloadStrategy(item.strategy);
      } catch (error) {
        logger.warn('Preload queue item failed', { item, error });
      }
    }
  }

  /**
   * Invalidate cache entries
   */
  async invalidateCache(patterns: string[]): Promise<void> {
    try {
      // Invalidate L1 caches
      patterns.forEach(pattern => {
        [
          this.workflowDefinitionCache,
          this.executionContextCache,
          this.userWorkflowsCache,
          this.analyticsCache,
        ].forEach(cache => {
          const keys = Array.from(cache.keys()).filter(key => 
            key.includes(pattern) || new RegExp(pattern).test(key)
          );
          keys.forEach(key => cache.delete(key));
        });
      });

      // Invalidate L2 cache (Redis)
      for (const pattern of patterns) {
        const keys = await this.redis.keys(`*${pattern}*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }

      logger.info('Cache invalidated', { patterns });
    } catch (error) {
      logger.error('Cache invalidation failed', { error, patterns });
    }
  }

  /**
   * Get comprehensive cache metrics
   */
  getCacheMetrics(): CacheMetrics & {
    l1Stats: any;
    l2Stats: any;
    preloadQueue: number;
  } {
    return {
      ...this.metrics,
      l1Stats: {
        workflowDefinitions: {
          size: this.workflowDefinitionCache.size,
          calculatedSize: this.workflowDefinitionCache.calculatedSize,
          maxSize: this.workflowDefinitionCache.maxSize,
        },
        executionContexts: {
          size: this.executionContextCache.size,
          calculatedSize: this.executionContextCache.calculatedSize,
        },
        userWorkflows: {
          size: this.userWorkflowsCache.size,
          calculatedSize: this.userWorkflowsCache.calculatedSize,
        },
        analytics: {
          size: this.analyticsCache.size,
          calculatedSize: this.analyticsCache.calculatedSize,
        },
      },
      l2Stats: {
        connected: this.redis.status === 'ready',
        keyCount: 0, // Would need Redis INFO command
      },
      preloadQueue: this.preloadQueue.length,
    };
  }

  // Helper methods
  private async setL1Cache<T>(
    key: string, 
    data: T, 
    cache: LRUCache<string, CacheEntry<T>>,
    ttl?: number
  ): Promise<void> {
    const compressed = this.config.compressionEnabled ? await this.compress(data) : null;
    const entry: CacheEntry<T> = {
      data: compressed || data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      accessCount: 1,
      lastAccessed: Date.now(),
      compressed: !!compressed,
      size: JSON.stringify(data).length,
    };

    cache.set(key, entry);
  }

  private async setL2Cache(key: string, data: any, ttl: number): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      logger.warn('Failed to set L2 cache', { error, key });
    }
  }

  private async compress(data: any): Promise<any> {
    if (!this.config.compressionEnabled) return null;
    
    try {
      const zlib = require('zlib');
      const compressed = zlib.gzipSync(JSON.stringify(data));
      return {
        __compressed: true,
        data: compressed.toString('base64'),
      };
    } catch (error) {
      logger.warn('Compression failed', { error });
      return null;
    }
  }

  private async decompressIfNeeded(entry: CacheEntry<any>): Promise<any> {
    if (!entry.compressed) return entry.data;

    try {
      const zlib = require('zlib');
      const buffer = Buffer.from(entry.data.data, 'base64');
      const decompressed = zlib.gunzipSync(buffer);
      return JSON.parse(decompressed.toString());
    } catch (error) {
      logger.warn('Decompression failed', { error });
      return entry.data;
    }
  }

  private hashOptions(options: any): string {
    return Buffer.from(JSON.stringify(options)).toString('base64').substring(0, 16);
  }

  private addToPreloadQueue(key: string, strategy: PreloadStrategy, priority: number): void {
    this.preloadQueue.push({ key, strategy, priority });
    
    // Limit queue size
    if (this.preloadQueue.length > 100) {
      this.preloadQueue = this.preloadQueue.slice(0, 50);
    }
  }

  private recordCacheHit(level: CacheLevel, responseTime: number): void {
    this.metrics.totalRequests++;
    this.metrics.hitRate = (this.metrics.hitRate * (this.metrics.totalRequests - 1) + 1) / this.metrics.totalRequests;
    this.metrics.avgResponseTime = (this.metrics.avgResponseTime * (this.metrics.totalRequests - 1) + responseTime) / this.metrics.totalRequests;
  }

  private recordCacheMiss(responseTime: number): void {
    this.metrics.totalRequests++;
    this.metrics.missRate = (this.metrics.missRate * (this.metrics.totalRequests - 1) + 1) / this.metrics.totalRequests;
    this.metrics.avgResponseTime = (this.metrics.avgResponseTime * (this.metrics.totalRequests - 1) + responseTime) / this.metrics.totalRequests;
  }
}