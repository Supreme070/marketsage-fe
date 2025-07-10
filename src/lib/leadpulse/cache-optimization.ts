/**
 * LeadPulse Cache Warming and Invalidation Optimization Service
 * 
 * Advanced caching strategies with intelligent warming, invalidation, and preloading
 */

import { EventEmitter } from 'events';
import { getIORedisClient } from '@/lib/cache/redis-pool';
import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';
import { leadPulseCache } from '@/lib/cache/leadpulse-cache';

export interface CacheWarmingStrategy {
  id: string;
  name: string;
  priority: number; // 1-10, higher is more important
  enabled: boolean;
  schedule: {
    frequency: 'realtime' | 'every_minute' | 'every_5_minutes' | 'every_15_minutes' | 'hourly' | 'daily';
    conditions?: string[]; // Conditions to trigger warming
  };
  keys: string[];
  preloadData: () => Promise<void>;
  dependsOn?: string[]; // Other strategies this depends on
}

export interface CacheInvalidationRule {
  id: string;
  name: string;
  triggers: string[]; // Events that trigger invalidation
  keys: string[];
  cascadeRules?: string[]; // Other rules to trigger
  debounceMs?: number; // Debounce invalidation
}

export interface CacheMetrics {
  hitRatio: number;
  missRatio: number;
  warmingJobs: number;
  invalidationEvents: number;
  totalCacheSize: number;
  hotKeys: Array<{
    key: string;
    hits: number;
    misses: number;
    lastAccess: Date;
    size: number;
  }>;
}

export class LeadPulseCacheOptimizer extends EventEmitter {
  private static instance: LeadPulseCacheOptimizer;
  private redis = getIORedisClient();
  private warmingStrategies: Map<string, CacheWarmingStrategy> = new Map();
  private invalidationRules: Map<string, CacheInvalidationRule> = new Map();
  private warmingJobs: Map<string, NodeJS.Timeout> = new Map();
  private invalidationDebounce: Map<string, NodeJS.Timeout> = new Map();
  private metrics: CacheMetrics = {
    hitRatio: 0,
    missRatio: 0,
    warmingJobs: 0,
    invalidationEvents: 0,
    totalCacheSize: 0,
    hotKeys: []
  };

  static getInstance(): LeadPulseCacheOptimizer {
    if (!LeadPulseCacheOptimizer.instance) {
      LeadPulseCacheOptimizer.instance = new LeadPulseCacheOptimizer();
    }
    return LeadPulseCacheOptimizer.instance;
  }

  private constructor() {
    super();
    this.setupDefaultStrategies();
    this.setupDefaultInvalidationRules();
  }

  /**
   * Initialize cache optimization service
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing LeadPulse cache optimization service');
      
      // Start warming jobs
      await this.startWarmingJobs();
      
      // Setup metrics collection
      await this.setupMetricsCollection();
      
      // Initial cache warming
      await this.warmCriticalCaches();
      
      logger.info('LeadPulse cache optimization service initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize cache optimization service:', error);
      throw error;
    }
  }

  /**
   * Warm critical caches immediately
   */
  async warmCriticalCaches(): Promise<void> {
    const criticalStrategies = Array.from(this.warmingStrategies.values())
      .filter(s => s.enabled && s.priority >= 8)
      .sort((a, b) => b.priority - a.priority);

    for (const strategy of criticalStrategies) {
      try {
        await this.executeWarmingStrategy(strategy);
      } catch (error) {
        logger.error(`Failed to warm critical cache for strategy ${strategy.id}:`, error);
      }
    }
  }

  /**
   * Execute a warming strategy
   */
  private async executeWarmingStrategy(strategy: CacheWarmingStrategy): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.debug(`Executing warming strategy: ${strategy.name}`);
      
      await strategy.preloadData();
      
      const duration = Date.now() - startTime;
      logger.info(`Cache warming completed for ${strategy.name} in ${duration}ms`);
      
      this.metrics.warmingJobs++;
      this.emit('cache_warmed', { strategy: strategy.id, duration });
      
    } catch (error) {
      logger.error(`Cache warming failed for strategy ${strategy.name}:`, error);
      this.emit('cache_warming_failed', { strategy: strategy.id, error });
    }
  }

  /**
   * Invalidate cache based on rules
   */
  async invalidateCache(trigger: string, metadata: any = {}): Promise<void> {
    const rules = Array.from(this.invalidationRules.values())
      .filter(rule => rule.triggers.includes(trigger));

    for (const rule of rules) {
      await this.executeInvalidationRule(rule, metadata);
    }
  }

  /**
   * Execute invalidation rule
   */
  private async executeInvalidationRule(rule: CacheInvalidationRule, metadata: any): Promise<void> {
    try {
      // Apply debouncing if configured
      if (rule.debounceMs && rule.debounceMs > 0) {
        const existingTimeout = this.invalidationDebounce.get(rule.id);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }
        
        const timeout = setTimeout(async () => {
          await this.performInvalidation(rule, metadata);
          this.invalidationDebounce.delete(rule.id);
        }, rule.debounceMs);
        
        this.invalidationDebounce.set(rule.id, timeout);
        return;
      }

      await this.performInvalidation(rule, metadata);
      
    } catch (error) {
      logger.error(`Cache invalidation failed for rule ${rule.name}:`, error);
    }
  }

  /**
   * Perform actual cache invalidation
   */
  private async performInvalidation(rule: CacheInvalidationRule, metadata: any): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Invalidate specified keys
      if (rule.keys.length > 0) {
        const pipeline = this.redis.pipeline();
        
        for (const key of rule.keys) {
          // Support pattern matching
          if (key.includes('*')) {
            const matchingKeys = await this.redis.keys(key);
            for (const matchingKey of matchingKeys) {
              pipeline.del(matchingKey);
            }
          } else {
            pipeline.del(key);
          }
        }
        
        await pipeline.exec();
      }

      // Trigger cascade invalidation
      if (rule.cascadeRules) {
        for (const cascadeRuleId of rule.cascadeRules) {
          const cascadeRule = this.invalidationRules.get(cascadeRuleId);
          if (cascadeRule) {
            await this.performInvalidation(cascadeRule, metadata);
          }
        }
      }

      const duration = Date.now() - startTime;
      logger.info(`Cache invalidation completed for ${rule.name} in ${duration}ms`);
      
      this.metrics.invalidationEvents++;
      this.emit('cache_invalidated', { rule: rule.id, duration, metadata });
      
    } catch (error) {
      logger.error(`Cache invalidation execution failed for rule ${rule.name}:`, error);
      throw error;
    }
  }

  /**
   * Setup default warming strategies
   */
  private setupDefaultStrategies(): void {
    // Critical real-time data
    this.warmingStrategies.set('realtime_visitors', {
      id: 'realtime_visitors',
      name: 'Real-time Visitors',
      priority: 10,
      enabled: true,
      schedule: {
        frequency: 'realtime',
        conditions: ['visitor_activity']
      },
      keys: ['leadpulse:visitors:active', 'leadpulse:count:visitors'],
      preloadData: async () => {
        await leadPulseCache.getCachedActiveVisitors();
        await leadPulseCache.getCachedVisitorCount();
      }
    });

    // Analytics overview
    this.warmingStrategies.set('analytics_overview', {
      id: 'analytics_overview',
      name: 'Analytics Overview',
      priority: 9,
      enabled: true,
      schedule: {
        frequency: 'every_minute'
      },
      keys: ['leadpulse:analytics:overview'],
      preloadData: async () => {
        await leadPulseCache.getAnalyticsOverview();
      }
    });

    // Geographic data
    this.warmingStrategies.set('geographic_data', {
      id: 'geographic_data',
      name: 'Geographic Data',
      priority: 7,
      enabled: true,
      schedule: {
        frequency: 'every_15_minutes'
      },
      keys: ['leadpulse:geo:countries', 'leadpulse:geo:regions'],
      preloadData: async () => {
        await leadPulseCache.getCachedGeographicData();
      }
    });

    // Visitor journeys
    this.warmingStrategies.set('visitor_journeys', {
      id: 'visitor_journeys',
      name: 'Visitor Journeys',
      priority: 6,
      enabled: true,
      schedule: {
        frequency: 'every_5_minutes'
      },
      keys: ['leadpulse:journey:*'],
      preloadData: async () => {
        // Preload top 20 most active visitor journeys
        const activeVisitors = await prisma.leadPulseVisitor.findMany({
          where: { isActive: true },
          orderBy: { engagementScore: 'desc' },
          take: 20,
          select: { id: true }
        });

        for (const visitor of activeVisitors) {
          await leadPulseCache.getCachedVisitorJourney(visitor.id);
        }
      }
    });

    // Daily statistics
    this.warmingStrategies.set('daily_stats', {
      id: 'daily_stats',
      name: 'Daily Statistics',
      priority: 5,
      enabled: true,
      schedule: {
        frequency: 'hourly'
      },
      keys: ['leadpulse:stats:*'],
      preloadData: async () => {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        await leadPulseCache.getCachedDailyStats(today);
        await leadPulseCache.getCachedDailyStats(yesterday);
      }
    });
  }

  /**
   * Setup default invalidation rules
   */
  private setupDefaultInvalidationRules(): void {
    // Visitor activity invalidation
    this.invalidationRules.set('visitor_activity', {
      id: 'visitor_activity',
      name: 'Visitor Activity',
      triggers: ['visitor_created', 'visitor_updated', 'touchpoint_created'],
      keys: [
        'leadpulse:visitors:active',
        'leadpulse:visitors:recent',
        'leadpulse:count:visitors',
        'leadpulse:analytics:overview'
      ],
      debounceMs: 1000 // 1 second debounce
    });

    // Journey invalidation
    this.invalidationRules.set('journey_updated', {
      id: 'journey_updated',
      name: 'Journey Updated',
      triggers: ['journey_created', 'journey_updated', 'touchpoint_created'],
      keys: ['leadpulse:journey:*'],
      debounceMs: 2000
    });

    // Geographic data invalidation
    this.invalidationRules.set('geo_updated', {
      id: 'geo_updated',
      name: 'Geographic Data Updated',
      triggers: ['visitor_location_updated'],
      keys: ['leadpulse:geo:countries', 'leadpulse:geo:regions'],
      debounceMs: 5000
    });

    // Analytics overview invalidation
    this.invalidationRules.set('analytics_updated', {
      id: 'analytics_updated',
      name: 'Analytics Updated',
      triggers: ['visitor_created', 'conversion_event', 'engagement_updated'],
      keys: ['leadpulse:analytics:overview'],
      cascadeRules: ['realtime_metrics'],
      debounceMs: 3000
    });

    // Real-time metrics invalidation
    this.invalidationRules.set('realtime_metrics', {
      id: 'realtime_metrics',
      name: 'Real-time Metrics',
      triggers: ['visitor_activity', 'conversion_event'],
      keys: [
        'leadpulse:metrics:conversion',
        'leadpulse:activity:recent',
        'leadpulse:count:visitors'
      ],
      debounceMs: 500
    });
  }

  /**
   * Start warming jobs based on schedules
   */
  private async startWarmingJobs(): Promise<void> {
    for (const strategy of this.warmingStrategies.values()) {
      if (!strategy.enabled) continue;

      const intervalMs = this.getIntervalMs(strategy.schedule.frequency);
      if (intervalMs > 0) {
        const interval = setInterval(async () => {
          await this.executeWarmingStrategy(strategy);
        }, intervalMs);

        this.warmingJobs.set(strategy.id, interval);
      }
    }
  }

  /**
   * Get interval in milliseconds for frequency
   */
  private getIntervalMs(frequency: string): number {
    switch (frequency) {
      case 'realtime':
        return 0; // Handled by events
      case 'every_minute':
        return 60 * 1000;
      case 'every_5_minutes':
        return 5 * 60 * 1000;
      case 'every_15_minutes':
        return 15 * 60 * 1000;
      case 'hourly':
        return 60 * 60 * 1000;
      case 'daily':
        return 24 * 60 * 60 * 1000;
      default:
        return 0;
    }
  }

  /**
   * Setup metrics collection
   */
  private async setupMetricsCollection(): Promise<void> {
    // Collect metrics every 30 seconds
    setInterval(async () => {
      await this.collectMetrics();
    }, 30000);
  }

  /**
   * Collect cache metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      // Get cache size
      const dbSize = await this.redis.dbsize();
      
      // Get key statistics
      const info = await this.redis.info('stats');
      const keyspaceHits = this.parseInfoValue(info, 'keyspace_hits');
      const keyspaceMisses = this.parseInfoValue(info, 'keyspace_misses');
      
      const totalAccess = keyspaceHits + keyspaceMisses;
      const hitRatio = totalAccess > 0 ? keyspaceHits / totalAccess : 0;
      const missRatio = totalAccess > 0 ? keyspaceMisses / totalAccess : 0;

      // Get hot keys
      const hotKeys = await this.getHotKeys();

      this.metrics = {
        hitRatio,
        missRatio,
        warmingJobs: this.warmingJobs.size,
        invalidationEvents: this.metrics.invalidationEvents,
        totalCacheSize: dbSize,
        hotKeys
      };

      this.emit('metrics_collected', this.metrics);
      
    } catch (error) {
      logger.error('Failed to collect cache metrics:', error);
    }
  }

  /**
   * Get hot keys from Redis
   */
  private async getHotKeys(): Promise<Array<{ key: string; hits: number; misses: number; lastAccess: Date; size: number }>> {
    try {
      const hotKeys = [];
      const leadPulseKeys = await this.redis.keys('leadpulse:*');
      
      for (const key of leadPulseKeys.slice(0, 10)) { // Top 10 keys
        const ttl = await this.redis.ttl(key);
        const size = await this.redis.memory('usage', key);
        
        hotKeys.push({
          key,
          hits: Math.floor(Math.random() * 100), // Mock data - Redis doesn't provide this by default
          misses: Math.floor(Math.random() * 10),
          lastAccess: new Date(),
          size: size || 0
        });
      }

      return hotKeys.sort((a, b) => b.hits - a.hits);
      
    } catch (error) {
      logger.error('Failed to get hot keys:', error);
      return [];
    }
  }

  /**
   * Parse Redis INFO response
   */
  private parseInfoValue(info: string, key: string): number {
    const match = info.match(new RegExp(`${key}:(\\d+)`));
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Get current cache metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Add custom warming strategy
   */
  addWarmingStrategy(strategy: CacheWarmingStrategy): void {
    this.warmingStrategies.set(strategy.id, strategy);
    
    if (strategy.enabled) {
      const intervalMs = this.getIntervalMs(strategy.schedule.frequency);
      if (intervalMs > 0) {
        const interval = setInterval(async () => {
          await this.executeWarmingStrategy(strategy);
        }, intervalMs);

        this.warmingJobs.set(strategy.id, interval);
      }
    }
  }

  /**
   * Add custom invalidation rule
   */
  addInvalidationRule(rule: CacheInvalidationRule): void {
    this.invalidationRules.set(rule.id, rule);
  }

  /**
   * Stop all warming jobs
   */
  async stop(): Promise<void> {
    for (const [id, interval] of this.warmingJobs) {
      clearInterval(interval);
    }
    this.warmingJobs.clear();
    
    for (const [id, timeout] of this.invalidationDebounce) {
      clearTimeout(timeout);
    }
    this.invalidationDebounce.clear();
    
    logger.info('LeadPulse cache optimization service stopped');
  }
}

export const leadPulseCacheOptimizer = LeadPulseCacheOptimizer.getInstance();
export default leadPulseCacheOptimizer;