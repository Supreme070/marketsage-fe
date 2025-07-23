/**
 * Database Integration Tests for MCP Servers
 * 
 * Tests real database operations, data integrity, and performance
 * with seeded data across all MCP tables and relationships.
 */

import { describe, beforeAll, afterAll, beforeEach, test, expect } from '@jest/test';
import { TestDatabaseManager, testPrisma, PerformanceTracker, testConfig } from './setup';

describe('MCP Database Integration Tests', () => {
  let dbManager: TestDatabaseManager;
  let performanceTracker: PerformanceTracker;

  beforeAll(async () => {
    dbManager = TestDatabaseManager.getInstance();
    await dbManager.setup();
    performanceTracker = new PerformanceTracker();
  }, testConfig.timeouts.integration);

  afterAll(async () => {
    await dbManager.teardown();
  }, testConfig.timeouts.database);

  beforeEach(async () => {
    performanceTracker.reset();
  });

  describe('Data Seeding Verification', () => {
    test('should have seeded all required MCP data', async () => {
      const counts = await dbManager.getDataCounts();

      // Verify base data exists
      expect(counts.organizations).toBeGreaterThan(0);
      expect(counts.users).toBeGreaterThan(0);
      expect(counts.contacts).toBeGreaterThan(0);
      expect(counts.emailCampaigns).toBeGreaterThan(0);

      // Verify MCP data exists
      expect(counts.mcpCampaignMetrics).toBeGreaterThan(0);
      expect(counts.mcpCustomerPredictions).toBeGreaterThan(0);
      expect(counts.mcpVisitorSessions).toBeGreaterThan(0);
      expect(counts.mcpMonitoringMetrics).toBeGreaterThan(0);

      console.log('📊 Data counts verified:', counts);
    });

    test('should have proper data relationships', async () => {
      // Test campaign metrics relationships
      const campaignMetrics = await testPrisma.mCPCampaignMetrics.findMany({
        include: {
          organization: true
        }
      });

      expect(campaignMetrics.length).toBeGreaterThan(0);
      campaignMetrics.forEach(metric => {
        expect(metric.organization).toBeDefined();
        expect(metric.organizationId).toBe(metric.organization.id);
        expect(metric.campaignType).toMatch(/^(EMAIL|SMS|WHATSAPP)$/);
        expect(metric.sent).toBeGreaterThan(0);
        expect(metric.delivered).toBeLessThanOrEqual(metric.sent);
        expect(metric.opened).toBeLessThanOrEqual(metric.delivered);
        expect(metric.clicked).toBeLessThanOrEqual(metric.opened);
        expect(metric.converted).toBeLessThanOrEqual(metric.clicked);
      });
    });

    test('should have valid customer predictions with contact relationships', async () => {
      const predictions = await testPrisma.mCPCustomerPredictions.findMany({
        include: {
          contact: true,
          organization: true
        }
      });

      expect(predictions.length).toBeGreaterThan(0);
      predictions.forEach(prediction => {
        expect(prediction.contact).toBeDefined();
        expect(prediction.organization).toBeDefined();
        expect(prediction.contactId).toBe(prediction.contact.id);
        expect(prediction.organizationId).toBe(prediction.organization.id);
        expect(prediction.churnRisk).toBeGreaterThanOrEqual(0);
        expect(prediction.churnRisk).toBeLessThanOrEqual(100);
        expect(prediction.lifetimeValue).toBeGreaterThan(0);
        expect(prediction.engagementScore).toBeGreaterThanOrEqual(0);
        expect(prediction.engagementScore).toBeLessThanOrEqual(100);
        expect(prediction.segment).toBeTruthy();
        expect(prediction.preferredChannel).toBeTruthy();
      });
    });

    test('should have visitor sessions with proper data structure', async () => {
      const sessions = await testPrisma.mCPVisitorSessions.findMany({
        include: {
          organization: true
        }
      });

      expect(sessions.length).toBeGreaterThan(0);
      sessions.forEach(session => {
        expect(session.organization).toBeDefined();
        expect(session.sessionId).toBeTruthy();
        expect(session.visitorId).toBeTruthy();
        expect(session.pageViews).toBeGreaterThan(0);
        expect(session.sessionDuration).toBeGreaterThan(0);
        expect(session.country).toBeTruthy();
        expect(session.device).toBeTruthy();
        expect(session.browser).toBeTruthy();
        
        // Validate JSON fields
        if (session.events) {
          expect(() => JSON.parse(session.events)).not.toThrow();
        }
        if (session.behaviorData) {
          expect(() => JSON.parse(session.behaviorData)).not.toThrow();
        }
      });
    });

    test('should have monitoring metrics with time series data', async () => {
      const metrics = await testPrisma.mCPMonitoringMetrics.findMany({
        include: {
          organization: true
        },
        orderBy: { timestamp: 'desc' }
      });

      expect(metrics.length).toBeGreaterThan(0);
      
      // Check for different metric types
      const metricTypes = [...new Set(metrics.map(m => m.metricType))];
      expect(metricTypes.length).toBeGreaterThan(1);
      
      metrics.forEach(metric => {
        expect(metric.organization).toBeDefined();
        expect(metric.metricType).toBeTruthy();
        expect(metric.value).toBeGreaterThanOrEqual(0);
        expect(metric.timestamp).toBeInstanceOf(Date);
        
        // Validate tags JSON
        if (metric.tags) {
          expect(() => JSON.parse(metric.tags)).not.toThrow();
        }
      });
    });
  });

  describe('Database Performance Tests', () => {
    test('should query campaign metrics within performance limits', async () => {
      performanceTracker.start();
      
      const campaignMetrics = await testPrisma.mCPCampaignMetrics.findMany({
        include: {
          organization: true
        },
        where: {
          campaignType: 'EMAIL'
        },
        orderBy: { calculatedAt: 'desc' },
        take: 50
      });
      
      const duration = performanceTracker.measure('campaign_metrics_query');
      
      expect(campaignMetrics.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(testConfig.performance.maxQueryTime);
      
      console.log(`📈 Campaign metrics query: ${duration}ms`);
    });

    test('should aggregate customer predictions efficiently', async () => {
      performanceTracker.start();
      
      const segmentStats = await testPrisma.mCPCustomerPredictions.groupBy({
        by: ['segment'],
        _count: { segment: true },
        _avg: { 
          churnRisk: true,
          lifetimeValue: true,
          engagementScore: true
        },
        orderBy: { _count: { segment: 'desc' } }
      });
      
      const duration = performanceTracker.measure('customer_predictions_aggregation');
      
      expect(segmentStats.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(testConfig.performance.maxQueryTime);
      
      console.log(`🧮 Customer predictions aggregation: ${duration}ms`);
      console.log('📊 Segment stats:', segmentStats);
    });

    test('should handle complex visitor analytics queries', async () => {
      performanceTracker.start();
      
      const visitorAnalytics = await testPrisma.mCPVisitorSessions.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        include: {
          organization: true
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      });
      
      const duration = performanceTracker.measure('visitor_analytics_query');
      
      expect(visitorAnalytics.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(testConfig.performance.maxQueryTime * 2); // Allow more time for complex query
      
      console.log(`📍 Visitor analytics query: ${duration}ms`);
    });

    test('should efficiently query monitoring metrics time series', async () => {
      performanceTracker.start();
      
      const timeSeriesMetrics = await testPrisma.mCPMonitoringMetrics.findMany({
        where: {
          metricType: 'api_response_time',
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        orderBy: { timestamp: 'desc' },
        take: 1000
      });
      
      const duration = performanceTracker.measure('monitoring_metrics_time_series');
      
      expect(duration).toBeLessThan(testConfig.performance.maxQueryTime);
      
      console.log(`⏱️ Monitoring metrics time series: ${duration}ms`);
    });
  });

  describe('Data Integrity Tests', () => {
    test('should maintain referential integrity across MCP tables', async () => {
      // Test campaign metrics -> organizations
      const orphanedCampaignMetrics = await testPrisma.mCPCampaignMetrics.findMany({
        where: {
          organization: null
        }
      });
      expect(orphanedCampaignMetrics.length).toBe(0);

      // Test customer predictions -> contacts and organizations
      const orphanedPredictions = await testPrisma.mCPCustomerPredictions.findMany({
        where: {
          OR: [
            { contact: null },
            { organization: null }
          ]
        }
      });
      expect(orphanedPredictions.length).toBe(0);

      // Test visitor sessions -> organizations
      const orphanedSessions = await testPrisma.mCPVisitorSessions.findMany({
        where: {
          organization: null
        }
      });
      expect(orphanedSessions.length).toBe(0);
    });

    test('should have valid data ranges and constraints', async () => {
      // Test campaign metrics data validity
      const invalidCampaignMetrics = await testPrisma.mCPCampaignMetrics.findMany({
        where: {
          OR: [
            { sent: { lt: 0 } },
            { delivered: { gt: testPrisma.mCPCampaignMetrics.fields.sent } },
            { openRate: { lt: 0 } },
            { openRate: { gt: 100 } },
            { clickRate: { lt: 0 } },
            { clickRate: { gt: 100 } },
            { conversionRate: { lt: 0 } },
            { conversionRate: { gt: 100 } }
          ]
        }
      });
      expect(invalidCampaignMetrics.length).toBe(0);

      // Test customer prediction data validity
      const invalidPredictions = await testPrisma.mCPCustomerPredictions.findMany({
        where: {
          OR: [
            { churnRisk: { lt: 0 } },
            { churnRisk: { gt: 100 } },
            { engagementScore: { lt: 0 } },
            { engagementScore: { gt: 100 } },
            { lifetimeValue: { lt: 0 } },
            { confidenceScore: { lt: 0 } },
            { confidenceScore: { gt: 100 } }
          ]
        }
      });
      expect(invalidPredictions.length).toBe(0);
    });

    test('should have properly formatted JSON fields', async () => {
      // Test campaign metrics A/B test data
      const campaignMetricsWithAB = await testPrisma.mCPCampaignMetrics.findMany({
        where: {
          abTestData: { not: null }
        }
      });

      campaignMetricsWithAB.forEach(metric => {
        expect(() => {
          const abTestData = JSON.parse(metric.abTestData!);
          expect(abTestData).toHaveProperty('testType');
          expect(abTestData).toHaveProperty('variants');
          expect(Array.isArray(abTestData.variants)).toBe(true);
        }).not.toThrow();
      });

      // Test customer predictions behavioral scores
      const predictionsWithScores = await testPrisma.mCPCustomerPredictions.findMany({
        where: {
          behavioralScores: { not: null }
        }
      });

      predictionsWithScores.forEach(prediction => {
        expect(() => {
          const scores = JSON.parse(prediction.behavioralScores!);
          expect(typeof scores).toBe('object');
          expect(scores).toHaveProperty('mobileUsage');
          expect(scores).toHaveProperty('priceSensitivity');
        }).not.toThrow();
      });
    });
  });

  describe('Concurrent Access Tests', () => {
    test('should handle concurrent read operations', async () => {
      const concurrentQueries = Array.from({ length: testConfig.performance.maxConcurrentOperations }, async (_, index) => {
        performanceTracker.start();
        
        const result = await testPrisma.mCPCampaignMetrics.findMany({
          where: {
            campaignType: index % 2 === 0 ? 'EMAIL' : 'SMS'
          },
          take: 10
        });
        
        const duration = performanceTracker.measure(`concurrent_read_${index}`);
        
        return { result, duration };
      });

      const results = await Promise.all(concurrentQueries);
      
      results.forEach(({ result, duration }, index) => {
        expect(result.length).toBeGreaterThanOrEqual(0);
        expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
        console.log(`🔄 Concurrent read ${index}: ${duration}ms`);
      });
    });

    test('should handle concurrent write operations', async () => {
      const testOrgId = 'test-org-1';
      
      const concurrentWrites = Array.from({ length: 5 }, async (_, index) => {
        performanceTracker.start();
        
        const metric = await testPrisma.mCPMonitoringMetrics.create({
          data: {
            organizationId: testOrgId,
            metricType: `concurrent_test_${index}`,
            value: Math.random() * 100,
            timestamp: new Date(),
            tags: JSON.stringify({ test: true, index })
          }
        });
        
        const duration = performanceTracker.measure(`concurrent_write_${index}`);
        
        return { metric, duration };
      });

      const results = await Promise.all(concurrentWrites);
      
      results.forEach(({ metric, duration }, index) => {
        expect(metric.id).toBeTruthy();
        expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
        console.log(`✍️ Concurrent write ${index}: ${duration}ms`);
      });

      // Clean up test data
      await testPrisma.mCPMonitoringMetrics.deleteMany({
        where: {
          metricType: { startsWith: 'concurrent_test_' }
        }
      });
    });
  });

  describe('Complex Query Tests', () => {
    test('should execute multi-table joins efficiently', async () => {
      performanceTracker.start();
      
      const complexQuery = await testPrisma.mCPCustomerPredictions.findMany({
        include: {
          contact: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              status: true,
              createdAt: true
            }
          },
          organization: {
            select: {
              name: true,
              plan: true
            }
          }
        },
        where: {
          churnRisk: { gt: 50 },
          lifetimeValue: { gt: 100 }
        },
        orderBy: [
          { churnRisk: 'desc' },
          { lifetimeValue: 'desc' }
        ],
        take: 20
      });
      
      const duration = performanceTracker.measure('complex_multi_table_join');
      
      expect(duration).toBeLessThan(testConfig.performance.maxQueryTime * 2);
      
      console.log(`🔗 Complex multi-table join: ${duration}ms`);
      console.log(`📊 Found ${complexQuery.length} high-risk, high-value customers`);
    });

    test('should perform analytics aggregations efficiently', async () => {
      performanceTracker.start();
      
      const campaignAnalytics = await testPrisma.$queryRaw`
        SELECT 
          "campaignType",
          COUNT(*) as campaign_count,
          AVG("openRate") as avg_open_rate,
          AVG("clickRate") as avg_click_rate,
          AVG("conversionRate") as avg_conversion_rate,
          SUM("revenue") as total_revenue,
          AVG("roi") as avg_roi
        FROM "MCPCampaignMetrics"
        GROUP BY "campaignType"
        ORDER BY total_revenue DESC
      `;
      
      const duration = performanceTracker.measure('analytics_aggregation');
      
      expect(duration).toBeLessThan(testConfig.performance.maxQueryTime);
      expect(Array.isArray(campaignAnalytics)).toBe(true);
      
      console.log(`📈 Analytics aggregation: ${duration}ms`);
      console.log('📊 Campaign analytics:', campaignAnalytics);
    });

    test('should execute time-based queries efficiently', async () => {
      performanceTracker.start();
      
      const timeBasedMetrics = await testPrisma.mCPMonitoringMetrics.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            lte: new Date()
          }
        },
        orderBy: { timestamp: 'desc' }
      });
      
      const duration = performanceTracker.measure('time_based_query');
      
      expect(duration).toBeLessThan(testConfig.performance.maxQueryTime);
      
      console.log(`⏰ Time-based query: ${duration}ms`);
      console.log(`📊 Found ${timeBasedMetrics.length} monitoring metrics from last 7 days`);
    });
  });

  describe('Performance Summary', () => {
    test('should report overall performance statistics', async () => {
      const allStats = performanceTracker.getAllStats();
      
      console.log('\n📊 Integration Test Performance Summary:');
      console.log('================================================');
      
      Object.entries(allStats).forEach(([operation, stats]) => {
        console.log(`${operation}:`);
        console.log(`  Average: ${stats.avg.toFixed(2)}ms`);
        console.log(`  Min: ${stats.min}ms`);
        console.log(`  Max: ${stats.max}ms`);
        console.log(`  Count: ${stats.count}`);
        console.log('');
      });
      
      // Verify no operation exceeded maximum allowed time
      Object.entries(allStats).forEach(([operation, stats]) => {
        expect(stats.avg).toBeLessThan(testConfig.performance.maxResponseTime);
      });
    });
  });
});