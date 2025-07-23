/**
 * LeadPulse Caching Layer
 * 
 * High-performance caching for LeadPulse analytics and visitor data
 */

import { redisService } from './redis';
import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';

export class LeadPulseCacheService {
  // Get Redis client from service
  private get redis() {
    return redisService.getClient();
  }

  private readonly TTL = {
    ANALYTICS_OVERVIEW: 60, // 1 minute
    VISITOR_DATA: 300, // 5 minutes
    GEOGRAPHIC_DATA: 600, // 10 minutes
    REAL_TIME_METRICS: 30, // 30 seconds
    VISITOR_JOURNEY: 1800, // 30 minutes
    DAILY_AGGREGATES: 3600, // 1 hour
  };

  private readonly KEYS = {
    ANALYTICS_OVERVIEW: 'leadpulse:analytics:overview',
    ACTIVE_VISITORS: 'leadpulse:visitors:active',
    RECENT_VISITORS: 'leadpulse:visitors:recent',
    VISITOR_COUNT: 'leadpulse:count:visitors',
    CONVERSION_RATE: 'leadpulse:metrics:conversion',
    GEOGRAPHIC_DATA: 'leadpulse:geo:countries',
    RECENT_ACTIVITY: 'leadpulse:activity:recent',
    VISITOR_JOURNEY: (id: string) => `leadpulse:journey:${id}`,
    VISITOR_PROFILE: (id: string) => `leadpulse:visitor:${id}`,
    DAILY_STATS: (date: string) => `leadpulse:stats:${date}`,
  };

  // Analytics Overview Caching
  async getAnalyticsOverview() {
    try {
      const redisClient = this.redis;
      if (!redisClient) {
        return this.fetchAnalyticsOverview(); // Fallback to direct DB
      }

      const cached = await redisClient.get(this.KEYS.ANALYTICS_OVERVIEW);
      if (cached) {
        return JSON.parse(cached);
      }

      // Fetch from database
      const overview = await this.fetchAnalyticsOverview();
      await redisClient.set(this.KEYS.ANALYTICS_OVERVIEW, JSON.stringify(overview), 'EX', this.TTL.ANALYTICS_OVERVIEW);
      
      return overview;
    } catch (error) {
      logger.error('Error getting analytics overview from cache:', error);
      return this.fetchAnalyticsOverview(); // Fallback to direct DB
    }
  }

  async invalidateAnalyticsOverview() {
    await this.redis.del(this.KEYS.ANALYTICS_OVERVIEW);
  }

  private async fetchAnalyticsOverview() {
    const [totalVisitors, activeVisitors, conversionRate, topCountries, recentActivity] = await Promise.all([
      this.getCachedVisitorCount(),
      this.getCachedActiveVisitors(),
      this.getCachedConversionRate(),
      this.getCachedGeographicData(),
      this.getCachedRecentActivity()
    ]);

    return {
      totalVisitors,
      activeVisitors: activeVisitors.length,
      conversionRate,
      topCountries,
      recentActivity
    };
  }

  // Visitor Count Caching
  async getCachedVisitorCount(): Promise<number> {
    try {
      const cached = await this.redis.get(this.KEYS.VISITOR_COUNT);
      if (cached) {
        return Number.parseInt(cached);
      }

      const count = await prisma.leadPulseVisitor.count();
      await this.redis.set(this.KEYS.VISITOR_COUNT, count, 'EX', this.TTL.REAL_TIME_METRICS);
      
      return count;
    } catch (error) {
      logger.error('Error getting visitor count from cache:', error);
      return await prisma.leadPulseVisitor.count();
    }
  }

  async updateVisitorCount(increment = 1) {
    try {
      await this.redis.incr(this.KEYS.VISITOR_COUNT);
    } catch (error) {
      logger.error('Error updating visitor count in cache:', error);
    }
  }

  // Active Visitors Caching
  async getCachedActiveVisitors() {
    try {
      const cached = await this.redis.get(this.KEYS.ACTIVE_VISITORS);
      if (cached) {
        return JSON.parse(cached);
      }

      const activeVisitors = await prisma.leadPulseVisitor.findMany({
        where: { isActive: true },
        include: {
          touchpoints: {
            orderBy: { timestamp: 'desc' },
            take: 3
          }
        },
        orderBy: { lastVisit: 'desc' }
      });

      await this.redis.set(this.KEYS.ACTIVE_VISITORS, JSON.stringify(activeVisitors), 'EX', this.TTL.REAL_TIME_METRICS);
      return activeVisitors;
    } catch (error) {
      logger.error('Error getting active visitors from cache:', error);
      return [];
    }
  }

  async updateActiveVisitors(visitor: any) {
    try {
      // Add to active visitors list
      await this.redis.lpush(this.KEYS.ACTIVE_VISITORS, JSON.stringify(visitor));
      await this.redis.ltrim(this.KEYS.ACTIVE_VISITORS, 0, 49); // Keep last 50
      
      // Set TTL for active visitors list if it's new
      await this.redis.expire(this.KEYS.ACTIVE_VISITORS, this.TTL.REAL_TIME_METRICS);
      
      // Add to active visitors set for quick lookup
      await this.redis.sadd('leadpulse:active:set', visitor.id);
      
      // Set TTL for active visitors set
      await this.redis.expire('leadpulse:active:set', this.TTL.REAL_TIME_METRICS);
    } catch (error) {
      logger.error('Error updating active visitors in cache:', error);
    }
  }

  async removeActiveVisitor(visitorId: string) {
    try {
      // Remove from active visitors set
      await this.redis.srem('leadpulse:active:set', visitorId);
      
      // Invalidate active visitors list
      await this.redis.del(this.KEYS.ACTIVE_VISITORS);
    } catch (error) {
      logger.error('Error removing active visitor from cache:', error);
    }
  }

  // Recent Visitors Caching
  async getCachedRecentVisitors() {
    try {
      const cached = await this.redis.get(this.KEYS.RECENT_VISITORS);
      if (cached) {
        return JSON.parse(cached);
      }

      const recentVisitors = await prisma.leadPulseVisitor.findMany({
        orderBy: { lastVisit: 'desc' },
        take: 20,
        include: {
          touchpoints: {
            orderBy: { timestamp: 'desc' },
            take: 3
          }
        }
      });

      await this.redis.set(this.KEYS.RECENT_VISITORS, JSON.stringify(recentVisitors), 'EX', this.TTL.VISITOR_DATA);
      return recentVisitors;
    } catch (error) {
      logger.error('Error getting recent visitors from cache:', error);
      return [];
    }
  }

  async addRecentVisitor(visitor: any) {
    try {
      await this.redis.lpush(this.KEYS.RECENT_VISITORS, JSON.stringify(visitor));
      await this.redis.ltrim(this.KEYS.RECENT_VISITORS, 0, 19); // Keep last 20
      
      // Set TTL for recent visitors list
      await this.redis.expire(this.KEYS.RECENT_VISITORS, this.TTL.VISITOR_DATA);
    } catch (error) {
      logger.error('Error adding recent visitor to cache:', error);
    }
  }

  // Conversion Rate Caching
  async getCachedConversionRate(): Promise<number> {
    try {
      const cached = await this.redis.get(this.KEYS.CONVERSION_RATE);
      if (cached) {
        return Number.parseFloat(cached);
      }

      const [totalVisitors, conversions] = await Promise.all([
        prisma.leadPulseVisitor.count(),
        prisma.leadPulseTouchpoint.count({
          where: {
            type: 'CONVERSION',
            timestamp: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        })
      ]);

      const rate = totalVisitors > 0 ? (conversions / totalVisitors) * 100 : 0;
      const rounded = Math.round(rate * 100) / 100;

      await this.redis.set(this.KEYS.CONVERSION_RATE, rounded, 'EX', this.TTL.ANALYTICS_OVERVIEW);
      return rounded;
    } catch (error) {
      logger.error('Error getting conversion rate from cache:', error);
      return 0;
    }
  }

  // Geographic Data Caching
  async getCachedGeographicData() {
    try {
      const cached = await this.redis.get(this.KEYS.GEOGRAPHIC_DATA);
      if (cached) {
        return JSON.parse(cached);
      }

      const countryData = await prisma.leadPulseVisitor.groupBy({
        by: ['country'],
        _count: { country: true },
        orderBy: { _count: { country: 'desc' } },
        take: 10
      });

      const topCountries = countryData.map(item => ({
        country: item.country || 'Unknown',
        count: item._count.country
      }));

      await this.redis.set(this.KEYS.GEOGRAPHIC_DATA, JSON.stringify(topCountries), 'EX', this.TTL.GEOGRAPHIC_DATA);
      return topCountries;
    } catch (error) {
      logger.error('Error getting geographic data from cache:', error);
      return [];
    }
  }

  // Recent Activity Caching
  async getCachedRecentActivity() {
    try {
      const cached = await this.redis.lrange(this.KEYS.RECENT_ACTIVITY, 0, 9); // Last 10
      if (cached.length > 0) {
        return cached.map(item => JSON.parse(item));
      }

      const recentTouchpoints = await prisma.leadPulseTouchpoint.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        include: { visitor: true },
        orderBy: { timestamp: 'desc' },
        take: 10
      });

      // Store in Redis list
      for (const touchpoint of recentTouchpoints.reverse()) {
        await this.redis.lpush(this.KEYS.RECENT_ACTIVITY, JSON.stringify(touchpoint));
        await this.redis.ltrim(this.KEYS.RECENT_ACTIVITY, 0, 49);
      }
      
      // Set TTL for recent activity list
      await this.redis.expire(this.KEYS.RECENT_ACTIVITY, this.TTL.REAL_TIME_METRICS);

      return recentTouchpoints;
    } catch (error) {
      logger.error('Error getting recent activity from cache:', error);
      return [];
    }
  }

  async addRecentActivity(touchpoint: any) {
    try {
      await this.redis.lpush(this.KEYS.RECENT_ACTIVITY, JSON.stringify(touchpoint));
      await this.redis.ltrim(this.KEYS.RECENT_ACTIVITY, 0, 49); // Keep last 50
      
      // Set TTL for recent activity list
      await this.redis.expire(this.KEYS.RECENT_ACTIVITY, this.TTL.REAL_TIME_METRICS);
    } catch (error) {
      logger.error('Error adding recent activity to cache:', error);
    }
  }

  // Visitor Journey Caching
  async getCachedVisitorJourney(visitorId: string) {
    try {
      const cached = await this.redis.get(this.KEYS.VISITOR_JOURNEY(visitorId));
      if (cached) {
        return JSON.parse(cached);
      }

      const journey = await prisma.leadPulseTouchpoint.findMany({
        where: { visitorId },
        orderBy: { timestamp: 'asc' },
        include: { visitor: true }
      });

      await this.redis.set(this.KEYS.VISITOR_JOURNEY(visitorId), JSON.stringify(journey), 'EX', this.TTL.VISITOR_JOURNEY);
      return journey;
    } catch (error) {
      logger.error(`Error getting visitor journey from cache for ${visitorId}:`, error);
      return [];
    }
  }

  async updateVisitorJourney(visitorId: string, touchpoint: any) {
    try {
      // Invalidate cached journey to force refresh
      await this.redis.del(this.KEYS.VISITOR_JOURNEY(visitorId));
      
      // Add to recent activity
      await this.addRecentActivity(touchpoint);
    } catch (error) {
      logger.error(`Error updating visitor journey cache for ${visitorId}:`, error);
    }
  }

  // Visitor Profile Caching
  async getCachedVisitorProfile(visitorId: string) {
    try {
      const cached = await this.redis.get(this.KEYS.VISITOR_PROFILE(visitorId));
      if (cached) {
        return JSON.parse(cached);
      }

      const visitor = await prisma.leadPulseVisitor.findUnique({
        where: { id: visitorId },
        include: {
          touchpoints: {
            orderBy: { timestamp: 'desc' }
          }
        }
      });

      if (visitor) {
        await this.redis.set(this.KEYS.VISITOR_PROFILE(visitorId), JSON.stringify(visitor), 'EX', this.TTL.VISITOR_DATA);
      }

      return visitor;
    } catch (error) {
      logger.error(`Error getting visitor profile from cache for ${visitorId}:`, error);
      return null;
    }
  }

  // Daily Stats Caching
  async getCachedDailyStats(date: string) {
    try {
      const cached = await this.redis.get(this.KEYS.DAILY_STATS(date));
      if (cached) {
        return JSON.parse(cached);
      }

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const [visitors, touchpoints, conversions] = await Promise.all([
        prisma.leadPulseVisitor.count({
          where: {
            firstVisit: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        }),
        prisma.leadPulseTouchpoint.count({
          where: {
            timestamp: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        }),
        prisma.leadPulseTouchpoint.count({
          where: {
            type: 'CONVERSION',
            timestamp: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        })
      ]);

      const stats = {
        date,
        visitors,
        touchpoints,
        conversions,
        conversionRate: visitors > 0 ? (conversions / visitors) * 100 : 0
      };

      await this.redis.set(this.KEYS.DAILY_STATS(date), JSON.stringify(stats), 'EX', this.TTL.DAILY_AGGREGATES);
      return stats;
    } catch (error) {
      logger.error(`Error getting daily stats from cache for ${date}:`, error);
      return null;
    }
  }

  // Cache invalidation
  async invalidateAll() {
    try {
      // Use key pattern deletion for LeadPulse keys
      const keys = await this.redis.keys('leadpulse:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      logger.info('Invalidated all LeadPulse cache');
    } catch (error) {
      logger.error('Error invalidating LeadPulse cache:', error);
    }
  }

  async invalidateVisitorData() {
    try {
      await Promise.all([
        this.redis.del(this.KEYS.ACTIVE_VISITORS),
        this.redis.del(this.KEYS.RECENT_VISITORS),
        this.redis.del(this.KEYS.VISITOR_COUNT),
        this.redis.keys('leadpulse:visitor:*').then(keys => keys.length > 0 ? this.redis.del(...keys) : Promise.resolve())
      ]);
    } catch (error) {
      logger.error('Error invalidating visitor data cache:', error);
    }
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const leadPulseCache = new LeadPulseCacheService();