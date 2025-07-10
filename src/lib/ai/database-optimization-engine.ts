/**
 * Database Optimization Engine for AI Operations
 * =============================================
 * 
 * Optimizes database queries and indexing specifically for AI operations
 * including intelligent query planning, caching strategies, and performance monitoring.
 * 
 * Features:
 * - Query performance analysis and optimization
 * - Dynamic indexing recommendations
 * - Connection pooling optimization
 * - Query caching with Redis
 * - Performance monitoring and alerts
 * - AI-specific query patterns optimization
 * - Batch processing optimizations
 * - Real-time query analysis
 */

import { logger } from '@/lib/logger';
import { trace } from '@opentelemetry/api';
import { redisCache } from '@/lib/cache/redis-client';
import { aiAuditTrailSystem } from '@/lib/ai/ai-audit-trail-system';
import { aiStreamingService } from '@/lib/websocket/ai-streaming-service';
import { UserRole } from '@prisma/client';
import prisma from '@/lib/db/prisma';

// Query types and performance metrics
export enum QueryType {
  SELECT = 'select',
  INSERT = 'insert',
  UPDATE = 'update',
  DELETE = 'delete',
  AGGREGATE = 'aggregate',
  JOIN = 'join',
  COMPLEX = 'complex'
}

export enum OptimizationLevel {
  BASIC = 'basic',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  AGGRESSIVE = 'aggressive'
}

export interface QueryMetrics {
  queryId: string;
  query: string;
  executionTime: number;
  rowsAffected: number;
  tables: string[];
  queryType: QueryType;
  timestamp: Date;
  userId?: string;
  organizationId?: string;
  context: string;
  cached: boolean;
  optimized: boolean;
  indexesUsed: string[];
  performance: {
    cpuUsage: number;
    memoryUsage: number;
    ioOperations: number;
    networkLatency: number;
    connectionPoolUsage: number;
  };
}

export interface QueryOptimization {
  queryId: string;
  originalQuery: string;
  optimizedQuery: string;
  optimizationType: string;
  performanceGain: number;
  estimatedImpact: string;
  recommendations: OptimizationRecommendation[];
  indexRecommendations: IndexRecommendation[];
  confidence: number;
  metadata: Record<string, any>;
}

export interface OptimizationRecommendation {
  type: 'query_rewrite' | 'index_creation' | 'caching' | 'partitioning' | 'denormalization';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  implementation: string;
  effort: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
  expectedGain: number;
  sqlCode?: string;
}

export interface IndexRecommendation {
  tableName: string;
  columnNames: string[];
  indexType: 'btree' | 'hash' | 'gin' | 'gist' | 'brin' | 'spgist';
  unique: boolean;
  concurrent: boolean;
  reasoning: string;
  impact: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedSize: number;
  maintenanceCost: number;
  sqlCode: string;
}

export interface CachingStrategy {
  type: 'redis' | 'memory' | 'query_result' | 'materialized_view';
  key: string;
  ttl: number;
  invalidationRules: string[];
  dependencies: string[];
  hitRate: number;
  memoryUsage: number;
  lastUpdated: Date;
}

export interface PerformanceAlert {
  id: string;
  type: 'slow_query' | 'high_cpu' | 'memory_leak' | 'connection_pool_exhaustion' | 'deadlock';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  query?: string;
  metrics: Record<string, any>;
  timestamp: Date;
  resolved: boolean;
  resolution?: string;
  impact: string;
  recommendations: string[];
}

export interface DatabaseHealth {
  overall: number;
  queryPerformance: number;
  indexEfficiency: number;
  cacheHitRate: number;
  connectionPoolHealth: number;
  diskUsage: number;
  activeConnections: number;
  slowQueries: number;
  alerts: PerformanceAlert[];
  recommendations: OptimizationRecommendation[];
}

class DatabaseOptimizationEngine {
  private tracer = trace.getTracer('database-optimization-engine');
  private queryMetrics: Map<string, QueryMetrics> = new Map();
  private optimizationCache: Map<string, QueryOptimization> = new Map();
  private performanceBaseline: Map<string, number> = new Map();
  private activeAlerts: Map<string, PerformanceAlert> = new Map();

  // Performance thresholds
  private readonly SLOW_QUERY_THRESHOLD = 1000; // ms
  private readonly HIGH_CPU_THRESHOLD = 80; // %
  private readonly HIGH_MEMORY_THRESHOLD = 85; // %
  private readonly CONNECTION_POOL_WARNING = 80; // %
  private readonly CACHE_HIT_RATE_WARNING = 70; // %

  constructor() {
    this.initializePerformanceMonitoring();
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    // Set up periodic performance checks
    setInterval(() => {
      this.checkDatabaseHealth();
    }, 30000); // Every 30 seconds

    // Clean up old metrics
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 300000); // Every 5 minutes

    logger.info('Database optimization engine initialized');
  }

  /**
   * Analyze and optimize a query
   */
  async optimizeQuery(
    query: string,
    context: string,
    userId?: string,
    organizationId?: string,
    optimizationLevel: OptimizationLevel = OptimizationLevel.INTERMEDIATE
  ): Promise<QueryOptimization> {
    const span = this.tracer.startSpan('optimize-query');
    const queryId = this.generateQueryId(query);
    
    try {
      span.setAttributes({
        queryId,
        context,
        userId: userId || 'system',
        organizationId: organizationId || 'system',
        optimizationLevel
      });

      // Check cache first
      const cached = await this.getCachedOptimization(queryId);
      if (cached) {
        logger.info('Query optimization retrieved from cache', { queryId });
        return cached;
      }

      // Analyze query structure
      const queryAnalysis = this.analyzeQueryStructure(query);
      
      // Generate optimization recommendations
      const recommendations = await this.generateOptimizationRecommendations(
        query,
        queryAnalysis,
        optimizationLevel
      );

      // Generate index recommendations
      const indexRecommendations = await this.generateIndexRecommendations(
        query,
        queryAnalysis
      );

      // Create optimized query
      const optimizedQuery = this.createOptimizedQuery(query, recommendations);

      // Estimate performance gain
      const performanceGain = this.estimatePerformanceGain(
        query,
        optimizedQuery,
        recommendations
      );

      const optimization: QueryOptimization = {
        queryId,
        originalQuery: query,
        optimizedQuery,
        optimizationType: this.getOptimizationType(recommendations),
        performanceGain,
        estimatedImpact: this.calculateEstimatedImpact(performanceGain),
        recommendations,
        indexRecommendations,
        confidence: this.calculateOptimizationConfidence(recommendations),
        metadata: {
          context,
          optimizationLevel,
          timestamp: new Date(),
          userId,
          organizationId,
          queryAnalysis
        }
      };

      // Cache the optimization
      await this.cacheOptimization(queryId, optimization);

      // Record in audit trail
      await aiAuditTrailSystem.recordOperation(
        userId || 'system',
        'SYSTEM' as UserRole,
        'database_optimization',
        'optimization_session',
        queryId,
        queryId,
        'optimization',
        'database',
        'query_optimization',
        { query, context, optimizationLevel },
        optimization,
        optimization.confidence,
        'success'
      );

      logger.info('Query optimization completed', {
        queryId,
        performanceGain,
        recommendationsCount: recommendations.length,
        indexRecommendationsCount: indexRecommendations.length
      });

      return optimization;

    } catch (error) {
      span.recordException(error as Error);
      logger.error('Query optimization failed:', error);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Monitor query performance and collect metrics
   */
  async monitorQueryPerformance(
    query: string,
    executionTime: number,
    context: string,
    userId?: string,
    organizationId?: string,
    additionalMetrics?: Partial<QueryMetrics>
  ): Promise<void> {
    const span = this.tracer.startSpan('monitor-query-performance');
    const queryId = this.generateQueryId(query);
    
    try {
      span.setAttributes({
        queryId,
        executionTime,
        context,
        userId: userId || 'system',
        organizationId: organizationId || 'system'
      });

      const metrics: QueryMetrics = {
        queryId,
        query,
        executionTime,
        rowsAffected: additionalMetrics?.rowsAffected || 0,
        tables: this.extractTables(query),
        queryType: this.determineQueryType(query),
        timestamp: new Date(),
        userId,
        organizationId,
        context,
        cached: additionalMetrics?.cached || false,
        optimized: additionalMetrics?.optimized || false,
        indexesUsed: additionalMetrics?.indexesUsed || [],
        performance: {
          cpuUsage: additionalMetrics?.performance?.cpuUsage || 0,
          memoryUsage: additionalMetrics?.performance?.memoryUsage || 0,
          ioOperations: additionalMetrics?.performance?.ioOperations || 0,
          networkLatency: additionalMetrics?.performance?.networkLatency || 0,
          connectionPoolUsage: additionalMetrics?.performance?.connectionPoolUsage || 0
        }
      };

      // Store metrics
      this.queryMetrics.set(queryId, metrics);

      // Check for performance issues
      await this.checkPerformanceThresholds(metrics);

      // Cache metrics in Redis
      await redisCache.setex(
        `query_metrics:${queryId}`,
        3600,
        JSON.stringify(metrics)
      );

      // Update performance baseline
      this.updatePerformanceBaseline(queryId, executionTime);

      logger.debug('Query performance monitored', {
        queryId,
        executionTime,
        queryType: metrics.queryType,
        tablesCount: metrics.tables.length
      });

    } catch (error) {
      span.recordException(error as Error);
      logger.error('Query performance monitoring failed:', error);
    } finally {
      span.end();
    }
  }

  /**
   * Generate intelligent caching strategy
   */
  async generateCachingStrategy(
    query: string,
    context: string,
    accessPattern: 'frequent' | 'occasional' | 'rare' = 'frequent'
  ): Promise<CachingStrategy> {
    const span = this.tracer.startSpan('generate-caching-strategy');
    
    try {
      span.setAttributes({
        query: query.substring(0, 100) + '...',
        context,
        accessPattern
      });

      const queryAnalysis = this.analyzeQueryStructure(query);
      const tables = this.extractTables(query);
      
      // Determine optimal caching type
      const cacheType = this.determineCacheType(queryAnalysis, accessPattern);
      
      // Generate cache key
      const cacheKey = this.generateCacheKey(query, context);
      
      // Calculate TTL based on data volatility
      const ttl = this.calculateOptimalTTL(queryAnalysis, tables, accessPattern);
      
      // Determine invalidation rules
      const invalidationRules = this.generateInvalidationRules(tables, queryAnalysis);
      
      // Identify dependencies
      const dependencies = this.identifyQueryDependencies(query, tables);

      const strategy: CachingStrategy = {
        type: cacheType,
        key: cacheKey,
        ttl,
        invalidationRules,
        dependencies,
        hitRate: 0, // Will be populated with actual usage
        memoryUsage: this.estimateCacheMemoryUsage(queryAnalysis),
        lastUpdated: new Date()
      };

      // Cache the strategy
      await redisCache.setex(
        `cache_strategy:${cacheKey}`,
        86400, // 24 hours
        JSON.stringify(strategy)
      );

      logger.info('Caching strategy generated', {
        cacheKey,
        type: cacheType,
        ttl,
        invalidationRulesCount: invalidationRules.length
      });

      return strategy;

    } catch (error) {
      span.recordException(error as Error);
      logger.error('Caching strategy generation failed:', error);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Optimize batch operations for AI workflows
   */
  async optimizeBatchOperations(
    operations: Array<{
      query: string;
      params: any[];
      context: string;
    }>,
    batchSize: number = 100
  ): Promise<{
    optimizedOperations: Array<{
      query: string;
      params: any[];
      batchIndex: number;
    }>;
    estimatedPerformanceGain: number;
    recommendations: string[];
  }> {
    const span = this.tracer.startSpan('optimize-batch-operations');
    
    try {
      span.setAttributes({
        operationsCount: operations.length,
        batchSize
      });

      // Group similar operations
      const groupedOperations = this.groupSimilarOperations(operations);
      
      // Optimize each group
      const optimizedGroups = await Promise.all(
        groupedOperations.map(group => this.optimizeOperationGroup(group))
      );

      // Create batches
      const batches = this.createOptimalBatches(optimizedGroups, batchSize);

      // Calculate performance gains
      const estimatedPerformanceGain = this.calculateBatchPerformanceGain(
        operations.length,
        batches.length
      );

      // Generate recommendations
      const recommendations = this.generateBatchRecommendations(
        operations,
        batches,
        estimatedPerformanceGain
      );

      logger.info('Batch operations optimized', {
        originalOperations: operations.length,
        optimizedBatches: batches.length,
        estimatedPerformanceGain
      });

      return {
        optimizedOperations: batches,
        estimatedPerformanceGain,
        recommendations
      };

    } catch (error) {
      span.recordException(error as Error);
      logger.error('Batch operations optimization failed:', error);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Get real-time database health metrics
   */
  async getDatabaseHealth(): Promise<DatabaseHealth> {
    const span = this.tracer.startSpan('get-database-health');
    
    try {
      // Collect various health metrics
      const [
        queryPerformance,
        indexEfficiency,
        cacheHitRate,
        connectionPoolHealth,
        diskUsage,
        activeConnections,
        slowQueries
      ] = await Promise.all([
        this.getQueryPerformanceScore(),
        this.getIndexEfficiencyScore(),
        this.getCacheHitRateScore(),
        this.getConnectionPoolHealth(),
        this.getDiskUsageScore(),
        this.getActiveConnectionsCount(),
        this.getSlowQueriesCount()
      ]);

      // Calculate overall health score
      const overall = this.calculateOverallHealth({
        queryPerformance,
        indexEfficiency,
        cacheHitRate,
        connectionPoolHealth,
        diskUsage
      });

      // Get active alerts
      const alerts = Array.from(this.activeAlerts.values());

      // Generate health recommendations
      const recommendations = this.generateHealthRecommendations({
        queryPerformance,
        indexEfficiency,
        cacheHitRate,
        connectionPoolHealth,
        diskUsage,
        slowQueries
      });

      const health: DatabaseHealth = {
        overall,
        queryPerformance,
        indexEfficiency,
        cacheHitRate,
        connectionPoolHealth,
        diskUsage,
        activeConnections,
        slowQueries,
        alerts,
        recommendations
      };

      // Cache health data
      await redisCache.setex(
        'database_health',
        60, // 1 minute
        JSON.stringify(health)
      );

      logger.info('Database health assessed', {
        overall,
        queryPerformance,
        slowQueries,
        alertsCount: alerts.length
      });

      return health;

    } catch (error) {
      span.recordException(error as Error);
      logger.error('Database health assessment failed:', error);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Apply AI-specific database optimizations
   */
  async applyAIOptimizations(
    organizationId: string,
    aiContexts: string[],
    dryRun: boolean = true
  ): Promise<{
    applied: OptimizationRecommendation[];
    pending: OptimizationRecommendation[];
    failed: Array<{ recommendation: OptimizationRecommendation; error: string }>;
  }> {
    const span = this.tracer.startSpan('apply-ai-optimizations');
    
    try {
      span.setAttributes({
        organizationId,
        aiContextsCount: aiContexts.length,
        dryRun
      });

      // Get AI-specific optimization recommendations
      const recommendations = await this.getAIOptimizationRecommendations(
        organizationId,
        aiContexts
      );

      const applied: OptimizationRecommendation[] = [];
      const pending: OptimizationRecommendation[] = [];
      const failed: Array<{ recommendation: OptimizationRecommendation; error: string }> = [];

      // Apply optimizations based on priority and risk
      for (const recommendation of recommendations) {
        try {
          if (recommendation.priority === 'critical' && recommendation.riskLevel === 'low') {
            if (!dryRun) {
              await this.applyOptimization(recommendation);
            }
            applied.push(recommendation);
          } else if (recommendation.priority === 'high' && recommendation.riskLevel !== 'high') {
            if (!dryRun) {
              await this.applyOptimization(recommendation);
            }
            applied.push(recommendation);
          } else {
            pending.push(recommendation);
          }
        } catch (error) {
          failed.push({
            recommendation,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      logger.info('AI optimizations processed', {
        organizationId,
        totalRecommendations: recommendations.length,
        applied: applied.length,
        pending: pending.length,
        failed: failed.length,
        dryRun
      });

      return { applied, pending, failed };

    } catch (error) {
      span.recordException(error as Error);
      logger.error('AI optimizations application failed:', error);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Stream real-time optimization updates
   */
  async streamOptimizationUpdates(
    userId: string,
    sessionId: string,
    requestId: string,
    organizationId: string
  ): Promise<void> {
    const span = this.tracer.startSpan('stream-optimization-updates');
    
    try {
      span.setAttributes({
        userId,
        sessionId,
        requestId,
        organizationId
      });

      // Stream initial health status
      const health = await this.getDatabaseHealth();
      
      await aiStreamingService.streamTaskProgress(
        userId,
        sessionId,
        requestId,
        'db_optimization',
        {
          taskId: 'db_optimization',
          operationId: 'health_check',
          operation: 'database_health_check',
          stage: 'assessment',
          progress: 100,
          message: `Database health: ${health.overall.toFixed(1)}%`,
          estimatedTimeRemaining: 0,
          performance: {
            executionTime: Date.now(),
            memoryUsage: 0,
            processingRate: 1
          }
        }
      );

      // Stream optimization recommendations
      if (health.recommendations.length > 0) {
        await aiStreamingService.streamDecisionProgress(
          userId,
          sessionId,
          requestId,
          'db_optimization',
          {
            decisionId: 'optimization_recommendations',
            type: 'database_optimization',
            stage: 'recommendations',
            progress: 100,
            message: `Generated ${health.recommendations.length} optimization recommendations`,
            reasoning: {
              currentStep: 'recommendation_generation',
              completedSteps: ['health_assessment', 'query_analysis'],
              remainingSteps: [],
              evidence: health.recommendations.map(r => ({
                type: r.type,
                description: r.description,
                impact: r.impact
              })),
              confidence: 0.9
            },
            alternatives: health.recommendations.map(r => ({
              id: r.type,
              description: r.description,
              probability: r.expectedGain / 100,
              confidence: r.expectedGain / 100
            }))
          }
        );
      }

      logger.info('Optimization updates streamed', {
        userId,
        organizationId,
        healthScore: health.overall,
        recommendationsCount: health.recommendations.length
      });

    } catch (error) {
      span.recordException(error as Error);
      logger.error('Optimization updates streaming failed:', error);
      throw error;
    } finally {
      span.end();
    }
  }

  // Private helper methods

  private generateQueryId(query: string): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(query.trim()).digest('hex');
  }

  private analyzeQueryStructure(query: string): any {
    const analysis = {
      hasJoins: /\bJOIN\b/i.test(query),
      hasSubqueries: /\bSELECT\b.*\bSELECT\b/i.test(query),
      hasAggregates: /\b(COUNT|SUM|AVG|MIN|MAX|GROUP BY)\b/i.test(query),
      hasOrderBy: /\bORDER BY\b/i.test(query),
      hasLimit: /\bLIMIT\b/i.test(query),
      hasWhere: /\bWHERE\b/i.test(query),
      complexity: 'medium',
      estimatedRows: 1000,
      tables: this.extractTables(query)
    };

    // Calculate complexity
    let complexityScore = 0;
    if (analysis.hasJoins) complexityScore += 2;
    if (analysis.hasSubqueries) complexityScore += 3;
    if (analysis.hasAggregates) complexityScore += 1;
    if (analysis.tables.length > 2) complexityScore += 1;

    analysis.complexity = complexityScore <= 2 ? 'low' : 
                         complexityScore <= 4 ? 'medium' : 'high';

    return analysis;
  }

  private extractTables(query: string): string[] {
    const tables: string[] = [];
    const fromMatches = query.match(/\bFROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi);
    const joinMatches = query.match(/\bJOIN\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi);
    
    if (fromMatches) {
      fromMatches.forEach(match => {
        const table = match.replace(/\bFROM\s+/i, '').trim();
        if (table) tables.push(table);
      });
    }
    
    if (joinMatches) {
      joinMatches.forEach(match => {
        const table = match.replace(/\bJOIN\s+/i, '').trim();
        if (table) tables.push(table);
      });
    }
    
    return [...new Set(tables)];
  }

  private determineQueryType(query: string): QueryType {
    const trimmed = query.trim().toUpperCase();
    
    if (trimmed.startsWith('SELECT')) {
      if (trimmed.includes('JOIN')) return QueryType.JOIN;
      if (trimmed.includes('GROUP BY') || trimmed.includes('COUNT') || 
          trimmed.includes('SUM') || trimmed.includes('AVG')) return QueryType.AGGREGATE;
      return QueryType.SELECT;
    }
    
    if (trimmed.startsWith('INSERT')) return QueryType.INSERT;
    if (trimmed.startsWith('UPDATE')) return QueryType.UPDATE;
    if (trimmed.startsWith('DELETE')) return QueryType.DELETE;
    
    return QueryType.COMPLEX;
  }

  private async generateOptimizationRecommendations(
    query: string,
    analysis: any,
    level: OptimizationLevel
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Query rewrite recommendations
    if (analysis.hasSubqueries && level !== OptimizationLevel.BASIC) {
      recommendations.push({
        type: 'query_rewrite',
        description: 'Convert correlated subqueries to JOINs for better performance',
        priority: 'high',
        impact: 'Can reduce execution time by 30-60%',
        implementation: 'Rewrite subqueries as LEFT JOINs or EXISTS clauses',
        effort: 'medium',
        riskLevel: 'low',
        expectedGain: 45,
        sqlCode: this.generateSubqueryOptimization(query)
      });
    }

    // Index recommendations
    if (analysis.hasWhere && !analysis.hasLimit) {
      recommendations.push({
        type: 'index_creation',
        description: 'Create indexes on WHERE clause columns',
        priority: 'high',
        impact: 'Significantly improve query performance',
        implementation: 'Add B-tree indexes on frequently queried columns',
        effort: 'low',
        riskLevel: 'low',
        expectedGain: 70
      });
    }

    // Caching recommendations
    if (analysis.complexity === 'high' && level === OptimizationLevel.ADVANCED) {
      recommendations.push({
        type: 'caching',
        description: 'Implement query result caching for complex queries',
        priority: 'medium',
        impact: 'Reduce load on database for repeated queries',
        implementation: 'Use Redis caching with appropriate TTL',
        effort: 'medium',
        riskLevel: 'low',
        expectedGain: 85
      });
    }

    return recommendations;
  }

  private async generateIndexRecommendations(
    query: string,
    analysis: any
  ): Promise<IndexRecommendation[]> {
    const recommendations: IndexRecommendation[] = [];

    // Extract WHERE clause columns
    const whereColumns = this.extractWhereColumns(query);
    
    if (whereColumns.length > 0) {
      analysis.tables.forEach(table => {
        const relevantColumns = whereColumns.filter(col => 
          query.includes(`${table}.${col}`) || 
          (!col.includes('.') && query.includes(`FROM ${table}`))
        );

        if (relevantColumns.length > 0) {
          recommendations.push({
            tableName: table,
            columnNames: relevantColumns,
            indexType: 'btree',
            unique: false,
            concurrent: true,
            reasoning: `Frequently queried columns in WHERE clause`,
            impact: 85,
            priority: 'high',
            estimatedSize: relevantColumns.length * 10, // MB
            maintenanceCost: 15,
            sqlCode: `CREATE INDEX CONCURRENTLY idx_${table}_${relevantColumns.join('_')} ON ${table} (${relevantColumns.join(', ')});`
          });
        }
      });
    }

    return recommendations;
  }

  private extractWhereColumns(query: string): string[] {
    const columns: string[] = [];
    const whereMatch = query.match(/\bWHERE\s+(.+?)(?:\s+(?:GROUP|ORDER|LIMIT|$))/i);
    
    if (whereMatch) {
      const whereClause = whereMatch[1];
      const columnMatches = whereClause.match(/\b([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?)\s*[=<>!]/g);
      
      if (columnMatches) {
        columnMatches.forEach(match => {
          const column = match.replace(/\s*[=<>!].*$/, '').trim();
          if (column) columns.push(column);
        });
      }
    }
    
    return [...new Set(columns)];
  }

  private createOptimizedQuery(query: string, recommendations: OptimizationRecommendation[]): string {
    let optimized = query;
    
    recommendations.forEach(rec => {
      if (rec.type === 'query_rewrite' && rec.sqlCode) {
        optimized = rec.sqlCode;
      }
    });
    
    return optimized;
  }

  private estimatePerformanceGain(
    originalQuery: string,
    optimizedQuery: string,
    recommendations: OptimizationRecommendation[]
  ): number {
    return recommendations.reduce((total, rec) => total + rec.expectedGain, 0) / recommendations.length;
  }

  private calculateEstimatedImpact(gain: number): string {
    if (gain >= 70) return 'High - Significant performance improvement expected';
    if (gain >= 40) return 'Medium - Moderate performance improvement expected';
    if (gain >= 20) return 'Low - Minor performance improvement expected';
    return 'Minimal - Small performance improvement expected';
  }

  private getOptimizationType(recommendations: OptimizationRecommendation[]): string {
    const types = recommendations.map(r => r.type);
    if (types.includes('query_rewrite')) return 'Query Rewrite';
    if (types.includes('index_creation')) return 'Index Optimization';
    if (types.includes('caching')) return 'Caching Strategy';
    return 'General Optimization';
  }

  private calculateOptimizationConfidence(recommendations: OptimizationRecommendation[]): number {
    if (recommendations.length === 0) return 0;
    
    const avgGain = recommendations.reduce((sum, rec) => sum + rec.expectedGain, 0) / recommendations.length;
    const lowRiskCount = recommendations.filter(rec => rec.riskLevel === 'low').length;
    const riskFactor = lowRiskCount / recommendations.length;
    
    return Math.min(0.95, (avgGain / 100) * 0.7 + riskFactor * 0.3);
  }

  private async getCachedOptimization(queryId: string): Promise<QueryOptimization | null> {
    try {
      const cached = await redisCache.get(`query_optimization:${queryId}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      return null;
    }
  }

  private async cacheOptimization(queryId: string, optimization: QueryOptimization): Promise<void> {
    try {
      await redisCache.setex(
        `query_optimization:${queryId}`,
        3600, // 1 hour
        JSON.stringify(optimization)
      );
    } catch (error) {
      logger.error('Failed to cache optimization:', error);
    }
  }

  private async checkPerformanceThresholds(metrics: QueryMetrics): Promise<void> {
    const alerts: PerformanceAlert[] = [];

    // Check for slow queries
    if (metrics.executionTime > this.SLOW_QUERY_THRESHOLD) {
      alerts.push({
        id: `slow_query_${metrics.queryId}`,
        type: 'slow_query',
        severity: metrics.executionTime > 5000 ? 'critical' : 'high',
        title: 'Slow Query Detected',
        description: `Query execution time: ${metrics.executionTime}ms`,
        query: metrics.query,
        metrics: { executionTime: metrics.executionTime },
        timestamp: new Date(),
        resolved: false,
        impact: 'Performance degradation affecting user experience',
        recommendations: [
          'Consider adding indexes on queried columns',
          'Optimize query structure',
          'Implement query result caching'
        ]
      });
    }

    // Check for high resource usage
    if (metrics.performance.cpuUsage > this.HIGH_CPU_THRESHOLD) {
      alerts.push({
        id: `high_cpu_${metrics.queryId}`,
        type: 'high_cpu',
        severity: 'high',
        title: 'High CPU Usage',
        description: `Query CPU usage: ${metrics.performance.cpuUsage}%`,
        query: metrics.query,
        metrics: { cpuUsage: metrics.performance.cpuUsage },
        timestamp: new Date(),
        resolved: false,
        impact: 'High CPU usage affecting system performance',
        recommendations: [
          'Optimize query complexity',
          'Consider query result caching',
          'Review query execution plan'
        ]
      });
    }

    // Store alerts
    alerts.forEach(alert => {
      this.activeAlerts.set(alert.id, alert);
    });
  }

  private updatePerformanceBaseline(queryId: string, executionTime: number): void {
    const existing = this.performanceBaseline.get(queryId);
    if (!existing || executionTime < existing) {
      this.performanceBaseline.set(queryId, executionTime);
    }
  }

  private generateSubqueryOptimization(query: string): string {
    // This is a simplified example - real implementation would be more sophisticated
    return query.replace(
      /WHERE\s+\w+\s+IN\s*\(\s*SELECT\s+[^)]+\)/gi,
      'INNER JOIN (SELECT DISTINCT column FROM table) subq ON condition'
    );
  }

  private determineCacheType(analysis: any, accessPattern: string): CachingStrategy['type'] {
    if (analysis.complexity === 'high' && accessPattern === 'frequent') {
      return 'redis';
    }
    if (analysis.hasAggregates && accessPattern === 'frequent') {
      return 'materialized_view';
    }
    if (accessPattern === 'frequent') {
      return 'query_result';
    }
    return 'memory';
  }

  private generateCacheKey(query: string, context: string): string {
    const crypto = require('crypto');
    return `query:${context}:${crypto.createHash('md5').update(query).digest('hex')}`;
  }

  private calculateOptimalTTL(analysis: any, tables: string[], accessPattern: string): number {
    let baseTTL = 300; // 5 minutes
    
    if (accessPattern === 'frequent') baseTTL = 1800; // 30 minutes
    if (accessPattern === 'rare') baseTTL = 60; // 1 minute
    
    // Adjust based on data volatility
    if (tables.some(t => ['users', 'sessions'].includes(t))) {
      baseTTL = Math.min(baseTTL, 300); // Max 5 minutes for user data
    }
    
    if (analysis.hasAggregates) {
      baseTTL *= 2; // Aggregates can be cached longer
    }
    
    return baseTTL;
  }

  private generateInvalidationRules(tables: string[], analysis: any): string[] {
    const rules: string[] = [];
    
    tables.forEach(table => {
      rules.push(`on_${table}_update`);
      rules.push(`on_${table}_delete`);
      
      if (analysis.hasAggregates) {
        rules.push(`on_${table}_insert`);
      }
    });
    
    return rules;
  }

  private identifyQueryDependencies(query: string, tables: string[]): string[] {
    const dependencies: string[] = [];
    
    tables.forEach(table => {
      dependencies.push(`table:${table}`);
    });
    
    // Add function dependencies
    if (query.includes('NOW()')) {
      dependencies.push('function:now');
    }
    
    if (query.includes('RANDOM()')) {
      dependencies.push('function:random');
    }
    
    return dependencies;
  }

  private estimateCacheMemoryUsage(analysis: any): number {
    let baseSize = 1024; // 1KB base
    
    if (analysis.hasAggregates) baseSize *= 2;
    if (analysis.hasJoins) baseSize *= 3;
    if (analysis.complexity === 'high') baseSize *= 2;
    
    return baseSize;
  }

  private groupSimilarOperations(operations: Array<any>): Array<Array<any>> {
    const groups: Map<string, Array<any>> = new Map();
    
    operations.forEach(op => {
      const pattern = this.extractQueryPattern(op.query);
      if (!groups.has(pattern)) {
        groups.set(pattern, []);
      }
      groups.get(pattern)!.push(op);
    });
    
    return Array.from(groups.values());
  }

  private extractQueryPattern(query: string): string {
    // Extract the basic pattern by removing values
    return query
      .replace(/\$\d+/g, '?') // Replace parameter placeholders
      .replace(/\d+/g, '?') // Replace numbers
      .replace(/'[^']*'/g, '?') // Replace string literals
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private async optimizeOperationGroup(group: Array<any>): Promise<Array<any>> {
    if (group.length === 1) return group;
    
    // For groups with multiple similar operations, we can:
    // 1. Batch INSERT operations
    // 2. Combine similar SELECT operations
    // 3. Optimize UPDATE operations
    
    const optimized = [...group];
    
    // Simple batching logic
    if (group.length > 10 && group[0].query.toUpperCase().startsWith('INSERT')) {
      // Convert individual INSERTs to batch INSERT
      const batchQuery = this.createBatchInsert(group);
      return [{ query: batchQuery, params: [], context: 'batch_insert' }];
    }
    
    return optimized;
  }

  private createBatchInsert(operations: Array<any>): string {
    const firstOp = operations[0];
    const baseQuery = firstOp.query.split('VALUES')[0];
    const valueClauses = operations.map(op => 
      op.query.split('VALUES')[1].trim().replace(/;$/, '')
    );
    
    return `${baseQuery}VALUES ${valueClauses.join(', ')};`;
  }

  private createOptimalBatches(groups: Array<Array<any>>, batchSize: number): Array<any> {
    const batches: Array<any> = [];
    let batchIndex = 0;
    
    groups.forEach(group => {
      for (let i = 0; i < group.length; i += batchSize) {
        const batch = group.slice(i, i + batchSize);
        batch.forEach(op => {
          batches.push({
            query: op.query,
            params: op.params,
            batchIndex: batchIndex
          });
        });
        batchIndex++;
      }
    });
    
    return batches;
  }

  private calculateBatchPerformanceGain(originalCount: number, batchCount: number): number {
    // Estimate performance gain from batching
    const reductionRatio = 1 - (batchCount / originalCount);
    return Math.min(0.8, reductionRatio) * 100; // Cap at 80% improvement
  }

  private generateBatchRecommendations(
    original: Array<any>,
    batches: Array<any>,
    gain: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (gain > 50) {
      recommendations.push('Consider implementing prepared statements for repeated queries');
    }
    
    if (batches.length < original.length / 2) {
      recommendations.push('Batch operations show significant performance improvement');
    }
    
    recommendations.push('Monitor batch size to balance performance and memory usage');
    
    return recommendations;
  }

  private async checkDatabaseHealth(): Promise<void> {
    try {
      const health = await this.getDatabaseHealth();
      
      // Check for critical issues
      if (health.overall < 50) {
        logger.error('Critical database health issue detected', { health });
      } else if (health.overall < 70) {
        logger.warn('Database health warning', { health });
      }
    } catch (error) {
      logger.error('Database health check failed:', error);
    }
  }

  private cleanupOldMetrics(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    this.queryMetrics.forEach((metrics, queryId) => {
      if (metrics.timestamp < cutoff) {
        this.queryMetrics.delete(queryId);
      }
    });
    
    this.activeAlerts.forEach((alert, id) => {
      if (alert.timestamp < cutoff && alert.resolved) {
        this.activeAlerts.delete(id);
      }
    });
  }

  // Health metric calculation methods
  private async getQueryPerformanceScore(): Promise<number> {
    const recentMetrics = Array.from(this.queryMetrics.values())
      .filter(m => m.timestamp > new Date(Date.now() - 60 * 60 * 1000)); // Last hour
    
    if (recentMetrics.length === 0) return 100;
    
    const avgExecutionTime = recentMetrics.reduce((sum, m) => sum + m.executionTime, 0) / recentMetrics.length;
    const slowQueries = recentMetrics.filter(m => m.executionTime > this.SLOW_QUERY_THRESHOLD).length;
    
    const slowQueryRate = slowQueries / recentMetrics.length;
    const timeScore = Math.max(0, 100 - (avgExecutionTime / 100));
    
    return Math.max(0, timeScore * (1 - slowQueryRate));
  }

  private async getIndexEfficiencyScore(): Promise<number> {
    // This would analyze actual index usage statistics
    // For now, return a simulated score
    return 85;
  }

  private async getCacheHitRateScore(): Promise<number> {
    // This would check actual cache hit rates
    // For now, return a simulated score
    return 75;
  }

  private async getConnectionPoolHealth(): Promise<number> {
    // This would check actual connection pool metrics
    // For now, return a simulated score
    return 90;
  }

  private async getDiskUsageScore(): Promise<number> {
    // This would check actual disk usage
    // For now, return a simulated score
    return 80;
  }

  private async getActiveConnectionsCount(): Promise<number> {
    // This would check actual active connections
    // For now, return a simulated count
    return 15;
  }

  private async getSlowQueriesCount(): Promise<number> {
    return Array.from(this.queryMetrics.values())
      .filter(m => m.executionTime > this.SLOW_QUERY_THRESHOLD).length;
  }

  private calculateOverallHealth(metrics: {
    queryPerformance: number;
    indexEfficiency: number;
    cacheHitRate: number;
    connectionPoolHealth: number;
    diskUsage: number;
  }): number {
    const weights = {
      queryPerformance: 0.3,
      indexEfficiency: 0.2,
      cacheHitRate: 0.2,
      connectionPoolHealth: 0.15,
      diskUsage: 0.15
    };
    
    return Object.entries(metrics).reduce((sum, [key, value]) => {
      return sum + value * weights[key as keyof typeof weights];
    }, 0);
  }

  private generateHealthRecommendations(metrics: any): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    
    if (metrics.queryPerformance < 70) {
      recommendations.push({
        type: 'query_rewrite',
        description: 'Optimize slow queries affecting system performance',
        priority: 'high',
        impact: 'Significant performance improvement',
        implementation: 'Analyze and optimize slow queries',
        effort: 'medium',
        riskLevel: 'low',
        expectedGain: 40
      });
    }
    
    if (metrics.cacheHitRate < 70) {
      recommendations.push({
        type: 'caching',
        description: 'Improve caching strategy to reduce database load',
        priority: 'medium',
        impact: 'Reduced database load and improved response times',
        implementation: 'Implement intelligent query result caching',
        effort: 'medium',
        riskLevel: 'low',
        expectedGain: 30
      });
    }
    
    return recommendations;
  }

  private async getAIOptimizationRecommendations(
    organizationId: string,
    aiContexts: string[]
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    
    // AI-specific optimizations
    recommendations.push({
      type: 'index_creation',
      description: 'Create indexes for AI query patterns',
      priority: 'high',
      impact: 'Optimize AI operations performance',
      implementation: 'Add specialized indexes for AI workloads',
      effort: 'low',
      riskLevel: 'low',
      expectedGain: 60
    });
    
    if (aiContexts.includes('machine_learning')) {
      recommendations.push({
        type: 'partitioning',
        description: 'Partition large tables for ML training queries',
        priority: 'medium',
        impact: 'Improve ML training performance',
        implementation: 'Implement table partitioning strategy',
        effort: 'high',
        riskLevel: 'medium',
        expectedGain: 45
      });
    }
    
    return recommendations;
  }

  private async applyOptimization(recommendation: OptimizationRecommendation): Promise<void> {
    // This would apply the actual optimization
    // For now, simulate the application
    logger.info('Applying optimization', {
      type: recommendation.type,
      description: recommendation.description
    });
    
    // In real implementation, this would:
    // 1. Create indexes
    // 2. Modify queries
    // 3. Update caching configurations
    // 4. Apply other optimizations
  }
}

// Export singleton instance
export const databaseOptimizationEngine = new DatabaseOptimizationEngine();

// Export types for external use
export type {
  QueryMetrics,
  QueryOptimization,
  OptimizationRecommendation,
  IndexRecommendation,
  CachingStrategy,
  PerformanceAlert,
  DatabaseHealth
};