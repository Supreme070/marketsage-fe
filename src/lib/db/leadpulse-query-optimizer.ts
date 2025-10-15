/**
 * LeadPulse Database Query Optimizer
 * 
 * Advanced query optimization for high-performance database operations
 */

// NOTE: Prisma removed - using backend API
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ||
                    process.env.NESTJS_BACKEND_URL ||
                    'http://localhost:3006';

import { logger } from '@/lib/logger';
import { leadPulseCache } from '@/lib/cache/leadpulse-cache';

interface QueryOptions {
  useCache?: boolean;
  cacheTTL?: number;
  enablePagination?: boolean;
  batchSize?: number;
  includes?: string[];
}

interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class LeadPulseQueryOptimizer {
  /**
   * Optimized visitor query with intelligent caching
   */
  async getVisitorsOptimized(
    userId: string,
    filters: {
      dateFrom?: Date;
      dateTo?: Date;
      status?: string;
      source?: string;
      search?: string;
    } = {},
    options: QueryOptions & { page?: number; limit?: number } = {}
  ): Promise<PaginationResult<any>> {
    const {
      useCache = true,
      cacheTTL = 300,
      page = 1,
      limit = 50,
      enablePagination = true
    } = options;

    // Generate cache key
    const cacheKey = `visitors:${userId}:${JSON.stringify(filters)}:${page}:${limit}`;

    if (useCache) {
      const cached = await leadPulseCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      // Build optimized where clause using correct schema fields
      const where: any = {
        ...(filters.dateFrom && { firstVisit: { gte: filters.dateFrom } }),
        ...(filters.dateTo && { firstVisit: { lte: filters.dateTo } }),
        ...(filters.status && { isActive: filters.status === 'active' })
      };

      // Add search functionality using available fields
      if (filters.search) {
        where.OR = [
          { fingerprint: { contains: filters.search, mode: 'insensitive' } },
          { city: { contains: filters.search, mode: 'insensitive' } },
          { country: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      // Execute optimized queries in parallel
      const [visitorsResponse, countResponse] = await Promise.all([
        // Optimized: First get visitors without includes to avoid N+1
        fetch(`${BACKEND_URL}/api/v2/leadpulse/visitors?${new URLSearchParams({
          where: JSON.stringify(where),
          orderBy: JSON.stringify([
            { lastVisit: 'desc' },
            { engagementScore: 'desc' }
          ]),
          ...(enablePagination && {
            skip: String((page - 1) * limit),
            take: String(limit)
          })
        })}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }),
        fetch(`${BACKEND_URL}/api/v2/leadpulse/visitors/count?${new URLSearchParams({
          where: JSON.stringify(where)
        })}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
      ]);

      const visitors = visitorsResponse.ok ? await visitorsResponse.json() : [];
      const totalCount = countResponse.ok ? (await countResponse.json()).count : 0;

      // Optimized: Fetch touchpoints separately to avoid N+1 queries
      const touchpointsMap = new Map();
      if (visitors.length > 0) {
        const visitorIds = visitors.map(v => v.id);
        const touchpointsResponse = await fetch(`${BACKEND_URL}/api/v2/leadpulse/touchpoints?${new URLSearchParams({
          where: JSON.stringify({
            visitorId: { in: visitorIds }
          }),
          select: JSON.stringify({
            id: true,
            visitorId: true,
            timestamp: true,
            type: true,
            url: true,
            value: true
          }),
          orderBy: JSON.stringify({ timestamp: 'desc' })
        })}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        const touchpoints = touchpointsResponse.ok ? await touchpointsResponse.json() : [];

        // Group touchpoints by visitor ID and limit to 5 per visitor
        touchpoints.forEach(tp => {
          if (!touchpointsMap.has(tp.visitorId)) {
            touchpointsMap.set(tp.visitorId, []);
          }
          const visitorTouchpoints = touchpointsMap.get(tp.visitorId);
          if (visitorTouchpoints.length < 5) {
            visitorTouchpoints.push(tp);
          }
        });
      }

      // Add touchpoints to visitors
      const visitorsWithTouchpoints = visitors.map(visitor => ({
        ...visitor,
        touchpoints: touchpointsMap.get(visitor.id) || []
      }));

      const result = {
        data: visitorsWithTouchpoints,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        }
      };

      // Cache the result
      if (useCache) {
        await leadPulseCache.set(cacheKey, result, cacheTTL);
      }

      return result;

    } catch (error) {
      logger.error('Error in getVisitorsOptimized:', error);
      throw error;
    }
  }

  /**
   * Optimized analytics aggregation with smart caching
   */
  async getAnalyticsAggregated(
    userId: string,
    timeRange: { from: Date; to: Date },
    groupBy: 'day' | 'week' | 'month' = 'day',
    options: QueryOptions = {}
  ) {
    const { useCache = true, cacheTTL = 600 } = options;
    
    const cacheKey = `analytics:${userId}:${timeRange.from.toISOString()}:${timeRange.to.toISOString()}:${groupBy}`;

    if (useCache) {
      const cached = await leadPulseCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      // Use raw SQL for complex aggregations (much faster than Prisma for large datasets)
      const analyticsQuery = `
        SELECT
          DATE_TRUNC('${groupBy}', timestamp) as period,
          COUNT(DISTINCT visitor_id) as unique_visitors,
          COUNT(*) as total_pageviews,
          COUNT(CASE WHEN action = 'conversion' THEN 1 END) as conversions,
          AVG(CASE WHEN action = 'page_view' THEN duration ELSE NULL END) as avg_session_duration
        FROM "LeadPulseTouchpoint"
        WHERE user_id = $1
          AND timestamp >= $2
          AND timestamp <= $3
        GROUP BY DATE_TRUNC('${groupBy}', timestamp)
        ORDER BY period ASC
      `;

      const analyticsResponse = await fetch(`${BACKEND_URL}/api/v2/database/query-raw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: analyticsQuery,
          params: [userId, timeRange.from, timeRange.to]
        })
      });
      const analytics = analyticsResponse.ok ? await analyticsResponse.json() : [];

      // Get conversion funnel data
      const funnelQuery = `
        SELECT
          action,
          COUNT(DISTINCT visitor_id) as unique_count,
          COUNT(*) as total_count
        FROM "LeadPulseTouchpoint"
        WHERE user_id = $1
          AND timestamp >= $2
          AND timestamp <= $3
          AND action IN ('page_view', 'form_start', 'form_submit', 'conversion')
        GROUP BY action
      `;

      const funnelResponse = await fetch(`${BACKEND_URL}/api/v2/database/query-raw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: funnelQuery,
          params: [userId, timeRange.from, timeRange.to]
        })
      });
      const funnel = funnelResponse.ok ? await funnelResponse.json() : [];

      // Get top sources
      const sourcesQuery = `
        SELECT
          acquisition_source as source,
          COUNT(DISTINCT id) as visitors,
          COUNT(DISTINCT CASE WHEN status = 'converted' THEN id END) as conversions
        FROM "LeadPulseVisitor"
        WHERE user_id = $1
          AND first_seen >= $2
          AND first_seen <= $3
        GROUP BY acquisition_source
        ORDER BY visitors DESC
        LIMIT 10
      `;

      const sourcesResponse = await fetch(`${BACKEND_URL}/api/v2/database/query-raw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: sourcesQuery,
          params: [userId, timeRange.from, timeRange.to]
        })
      });
      const sources = sourcesResponse.ok ? await sourcesResponse.json() : [];

      const result = {
        timeline: analytics,
        funnel,
        sources,
        period: groupBy,
        dateRange: timeRange
      };

      if (useCache) {
        await leadPulseCache.set(cacheKey, result, cacheTTL);
      }

      return result;

    } catch (error) {
      logger.error('Error in getAnalyticsAggregated:', error);
      throw error;
    }
  }

  /**
   * Batch operation for bulk data processing
   */
  async batchUpdateVisitorScores(
    userIds: string[],
    options: QueryOptions = {}
  ) {
    const { batchSize = 100 } = options;

    try {
      // Process in batches to avoid memory issues
      const batches = [];
      for (let i = 0; i < userIds.length; i += batchSize) {
        batches.push(userIds.slice(i, i + batchSize));
      }

      let processed = 0;
      for (const batch of batches) {
        // Use raw SQL for efficient bulk updates
        const updateQuery = `
          UPDATE "LeadPulseVisitor"
          SET score = (
            SELECT COALESCE(
              (touchpoint_count * 10) +
              (conversion_count * 50) +
              (CASE WHEN email IS NOT NULL THEN 25 ELSE 0 END) +
              (CASE WHEN company IS NOT NULL THEN 15 ELSE 0 END),
              0
            )
            FROM (
              SELECT
                visitor_id,
                COUNT(*) as touchpoint_count,
                COUNT(CASE WHEN action = 'conversion' THEN 1 END) as conversion_count
              FROM "LeadPulseTouchpoint"
              WHERE visitor_id = "LeadPulseVisitor".id
            ) AS stats
          )
          WHERE user_id = ANY($1)
        `;

        const updateResponse = await fetch(`${BACKEND_URL}/api/v2/database/execute-raw`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: updateQuery,
            params: [batch]
          })
        });

        if (updateResponse.ok) {
          processed += batch.length;
        }

        logger.info(`Batch score update completed: ${processed}/${userIds.length}`);
      }

      return { processed, total: userIds.length };

    } catch (error) {
      logger.error('Error in batchUpdateVisitorScores:', error);
      throw error;
    }
  }

  /**
   * Intelligent query plan analyzer
   */
  async analyzeQueryPerformance(
    query: string,
    params: any[] = []
  ) {
    try {
      // Get query execution plan
      const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
      const planResponse = await fetch(`${BACKEND_URL}/api/v2/database/query-raw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: explainQuery,
          params: params
        })
      });
      const plan = planResponse.ok ? await planResponse.json() : [];

      // Extract performance metrics
      const execution = (plan as any)[0]['Plan'];
      const metrics = {
        totalCost: execution['Total Cost'],
        actualTime: execution['Actual Total Time'],
        planningTime: (plan as any)[0]['Planning Time'],
        executionTime: (plan as any)[0]['Execution Time'],
        peakMemory: execution['Peak Memory Usage'],
        sharedHitBlocks: execution['Shared Hit Blocks'],
        sharedReadBlocks: execution['Shared Read Blocks']
      };

      // Performance recommendations
      const recommendations = [];
      
      if (metrics.actualTime > 1000) {
        recommendations.push('Query execution time is high - consider adding indexes');
      }
      
      if (metrics.sharedReadBlocks > metrics.sharedHitBlocks) {
        recommendations.push('Low cache hit ratio - query is not using indexes efficiently');
      }
      
      if (metrics.totalCost > 10000) {
        recommendations.push('Query cost is high - consider optimizing joins or adding WHERE clauses');
      }

      return {
        metrics,
        recommendations,
        rawPlan: plan
      };

    } catch (error) {
      logger.error('Error analyzing query performance:', error);
      throw error;
    }
  }

  /**
   * Connection pool monitoring
   */
  async getConnectionPoolStats() {
    try {
      const statsQuery = `
        SELECT
          state,
          COUNT(*) as count
        FROM pg_stat_activity
        WHERE datname = current_database()
        GROUP BY state
      `;

      const statsResponse = await fetch(`${BACKEND_URL}/api/v2/database/query-raw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: statsQuery,
          params: []
        })
      });
      const stats = statsResponse.ok ? await statsResponse.json() : [];

      const poolInfoQuery = `
        SELECT
          max_connections,
          current_setting('shared_buffers') as shared_buffers,
          current_setting('effective_cache_size') as effective_cache_size
        FROM pg_settings
        WHERE name = 'max_connections'
      `;

      const poolInfoResponse = await fetch(`${BACKEND_URL}/api/v2/database/query-raw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: poolInfoQuery,
          params: []
        })
      });
      const poolInfo = poolInfoResponse.ok ? await poolInfoResponse.json() : [];

      return {
        connectionsByState: stats,
        poolConfiguration: poolInfo,
        timestamp: new Date()
      };

    } catch (error) {
      logger.error('Error getting connection pool stats:', error);
      throw error;
    }
  }

  /**
   * Cache warming for frequently accessed data
   */
  async warmCache(userId: string) {
    try {
      logger.info(`Starting cache warm-up for user: ${userId}`);

      // Warm visitor overview
      await this.getVisitorsOptimized(userId, {}, { 
        useCache: true, 
        cacheTTL: 1800,
        page: 1,
        limit: 50
      });

      // Warm analytics for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      await this.getAnalyticsAggregated(
        userId,
        { from: thirtyDaysAgo, to: new Date() },
        'day',
        { useCache: true, cacheTTL: 1800 }
      );

      // Warm recent forms analytics
      const recentFormsResponse = await fetch(`${BACKEND_URL}/api/v2/leadpulse/forms?${new URLSearchParams({
        where: JSON.stringify({ createdBy: userId }),
        select: JSON.stringify({ id: true }),
        take: '5',
        orderBy: JSON.stringify({ updatedAt: 'desc' })
      })}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const recentForms = recentFormsResponse.ok ? await recentFormsResponse.json() : [];

      for (const form of recentForms) {
        const cacheKey = `form_analytics:${form.id}:30d`;
        // This would trigger the form analytics caching
        await leadPulseCache.set(`warm_${cacheKey}`, true, 300);
      }

      logger.info(`Cache warm-up completed for user: ${userId}`);
      return { success: true, itemsWarmed: 2 + recentForms.length };

    } catch (error) {
      logger.error('Error warming cache:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const leadPulseQueryOptimizer = new LeadPulseQueryOptimizer();