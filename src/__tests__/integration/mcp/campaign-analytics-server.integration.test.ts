/**
 * Campaign Analytics MCP Server Integration Tests
 * 
 * These tests verify the Campaign Analytics MCP server works correctly with real database data.
 * Tests cover actual database queries, data relationships, and performance.
 */

import { describe, beforeAll, afterAll, beforeEach, test, expect } from '@jest/jest';
import { CampaignAnalyticsMCPServer } from '../../../mcp/servers/campaign-analytics-server';
import { 
  TestDatabaseManager, 
  testPrisma, 
  PerformanceTracker,
  testConfig
} from './setup';
import type { MCPAuthContext } from '../../../mcp/types/mcp-types';

describe('Campaign Analytics MCP Server Integration Tests', () => {
  let server: CampaignAnalyticsMCPServer;
  let dbManager: TestDatabaseManager;
  let performanceTracker: PerformanceTracker;
  let authContext: MCPAuthContext;

  beforeAll(async () => {
    // Setup test database with seeded data
    dbManager = TestDatabaseManager.getInstance();
    await dbManager.setup();
    
    // Initialize performance tracker
    performanceTracker = new PerformanceTracker();
    
    // Create MCP server instance
    server = new CampaignAnalyticsMCPServer({
      rateLimiting: {
        enabled: false // Disable for testing
      }
    });
    
    // Setup auth context for testing
    authContext = {
      organizationId: 'test-org-1',
      userId: 'test-user-1',
      role: 'ADMIN',
      permissions: ['read:campaigns', 'read:analytics']
    };
  }, testConfig.timeouts.database);

  afterAll(async () => {
    await dbManager.teardown();
  });

  beforeEach(async () => {
    performanceTracker.reset();
  });

  describe('Database Integration', () => {
    test('should connect to test database and verify seeded data', async () => {
      const counts = await dbManager.getDataCounts();
      
      expect(counts.organizations).toBeGreaterThan(0);
      expect(counts.emailCampaigns).toBeGreaterThan(0);
      expect(counts.smsCampaigns).toBeGreaterThan(0);
      expect(counts.whatsappCampaigns).toBeGreaterThan(0);
      expect(counts.mcpCampaignMetrics).toBeGreaterThan(0);
      
      console.log('✅ Verified seeded data counts:', counts);
    });

    test('should verify campaign metrics data integrity', async () => {
      // Test data relationships and foreign key constraints
      const campaignMetrics = await testPrisma.mCPCampaignMetrics.findMany({
        include: {
          organization: true
        }
      });

      expect(campaignMetrics.length).toBeGreaterThan(0);
      
      for (const metric of campaignMetrics) {
        // Verify organization relationship
        expect(metric.organization).toBeDefined();
        expect(metric.organizationId).toBe(metric.organization.id);
        
        // Verify data integrity
        expect(metric.sent).toBeGreaterThanOrEqual(0);
        expect(metric.delivered).toBeLessThanOrEqual(metric.sent);
        expect(metric.opened).toBeLessThanOrEqual(metric.delivered);
        expect(metric.clicked).toBeLessThanOrEqual(metric.opened);
        expect(metric.converted).toBeLessThanOrEqual(metric.clicked);
        
        // Verify rate calculations
        if (metric.delivered > 0) {
          const expectedOpenRate = (metric.opened / metric.delivered) * 100;
          expect(Math.abs(metric.openRate - expectedOpenRate)).toBeLessThan(0.1);
        }
        
        // Verify A/B test data if present
        if (metric.abTestData) {
          const abTestData = JSON.parse(metric.abTestData as string);
          expect(abTestData).toHaveProperty('testType');
          expect(abTestData).toHaveProperty('variants');
          expect(abTestData.variants).toBeInstanceOf(Array);
        }
      }
      
      console.log(`✅ Verified ${campaignMetrics.length} campaign metrics for data integrity`);
    });
  });

  describe('MCP Server Operations', () => {
    test('should list campaign analytics resources', async () => {
      performanceTracker.start();
      
      const resources = await server.listResources(authContext);
      const duration = performanceTracker.measure('listResources');
      
      expect(resources).toBeInstanceOf(Array);
      expect(resources.length).toBeGreaterThan(0);
      
      // Verify resource structure
      for (const resource of resources) {
        expect(resource).toHaveProperty('uri');
        expect(resource).toHaveProperty('name');
        expect(resource).toHaveProperty('description');
        expect(resource).toHaveProperty('mimeType');
      }
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      console.log(`✅ Listed ${resources.length} resources in ${duration}ms`);
    });

    test('should read campaign analytics with real data', async () => {
      performanceTracker.start();
      
      const result = await server.readResource(
        'campaign://analytics',
        {
          organizationId: 'test-org-1',
          dateRange: {
            start: '2024-01-01',
            end: '2024-12-31'
          }
        },
        authContext
      );
      
      const duration = performanceTracker.measure('readCampaignAnalytics');
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const data = result.data;
      expect(data).toHaveProperty('summary');
      expect(data).toHaveProperty('campaigns');
      expect(data).toHaveProperty('performance');
      
      // Verify summary metrics
      expect(data.summary.totalCampaigns).toBeGreaterThan(0);
      expect(data.summary.totalSent).toBeGreaterThan(0);
      expect(data.summary.avgOpenRate).toBeGreaterThanOrEqual(0);
      expect(data.summary.avgClickRate).toBeGreaterThanOrEqual(0);
      
      // Verify campaign data matches database
      const dbCampaigns = await testPrisma.mCPCampaignMetrics.count({
        where: { organizationId: 'test-org-1' }
      });
      expect(data.campaigns.length).toBe(dbCampaigns);
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      console.log(`✅ Read campaign analytics with ${data.campaigns.length} campaigns in ${duration}ms`);
    });

    test('should handle complex queries with joins and aggregations', async () => {
      performanceTracker.start();
      
      const result = await server.readResource(
        'campaign://performance',
        {
          organizationId: 'test-org-1',
          groupBy: 'campaignType',
          metrics: ['openRate', 'clickRate', 'conversionRate'],
          aggregation: 'avg'
        },
        authContext
      );
      
      const duration = performanceTracker.measure('complexQuery');
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const data = result.data;
      expect(data).toHaveProperty('groups');
      
      // Verify grouped data
      for (const group of data.groups) {
        expect(group).toHaveProperty('campaignType');
        expect(group).toHaveProperty('metrics');
        expect(['EMAIL', 'SMS', 'WHATSAPP']).toContain(group.campaignType);
        
        // Verify aggregated metrics
        expect(group.metrics.avgOpenRate).toBeGreaterThanOrEqual(0);
        expect(group.metrics.avgClickRate).toBeGreaterThanOrEqual(0);
        expect(group.metrics.avgConversionRate).toBeGreaterThanOrEqual(0);
      }
      
      expect(duration).toBeLessThan(testConfig.performance.maxQueryTime);
      console.log(`✅ Executed complex query with aggregations in ${duration}ms`);
    });

    test('should validate A/B test data analysis', async () => {
      performanceTracker.start();
      
      const result = await server.readResource(
        'campaign://ab-tests',
        {
          organizationId: 'test-org-1'
        },
        authContext
      );
      
      const duration = performanceTracker.measure('abTestAnalysis');
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      
      const data = result.data;
      expect(data).toHaveProperty('abTests');
      
      // Verify A/B test data structure
      for (const test of data.abTests) {
        expect(test).toHaveProperty('campaignId');
        expect(test).toHaveProperty('testType');
        expect(test).toHaveProperty('variants');
        expect(test).toHaveProperty('winnerVariant');
        expect(test).toHaveProperty('improvementPercent');
        
        // Verify statistical significance
        expect(test.variants.length).toBeGreaterThan(1);
        const winners = test.variants.filter(v => v.isWinner);
        expect(winners.length).toBe(1);
      }
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      console.log(`✅ Analyzed ${data.abTests.length} A/B tests in ${duration}ms`);
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 5;
      const promises = [];
      
      performanceTracker.start();
      
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          server.readResource(
            'campaign://analytics',
            { organizationId: 'test-org-1' },
            authContext
          )
        );
      }
      
      const results = await Promise.all(promises);
      const duration = performanceTracker.measure('concurrentRequests');
      
      // Verify all requests succeeded
      for (const result of results) {
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      }
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime * 2);
      console.log(`✅ Handled ${concurrentRequests} concurrent requests in ${duration}ms`);
    });

    test('should validate database query optimization', async () => {
      // Test query performance with realistic data volumes
      const startTime = Date.now();
      
      const result = await testPrisma.mCPCampaignMetrics.findMany({
        where: {
          organizationId: 'test-org-1'
        },
        include: {
          organization: {
            select: {
              name: true,
              plan: true
            }
          }
        },
        orderBy: {
          calculatedAt: 'desc'
        }
      });
      
      const queryDuration = Date.now() - startTime;
      
      expect(result.length).toBeGreaterThan(0);
      expect(queryDuration).toBeLessThan(testConfig.performance.maxQueryTime);
      
      console.log(`✅ Query performance: ${result.length} records in ${queryDuration}ms`);
    });

    test('should measure end-to-end response times', async () => {
      const operations = [
        'campaign://analytics',
        'campaign://performance',
        'campaign://ab-tests'
      ];
      
      const measurements = [];
      
      for (const operation of operations) {
        performanceTracker.start();
        
        const result = await server.readResource(
          operation,
          { organizationId: 'test-org-1' },
          authContext
        );
        
        const duration = performanceTracker.measure(operation);
        measurements.push({ operation, duration, success: result.success });
        
        expect(result.success).toBe(true);
        expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      }
      
      console.log('✅ End-to-end performance measurements:', measurements);
    });
  });

  describe('Data Consistency and Validation', () => {
    test('should ensure data consistency across operations', async () => {
      // Get analytics summary
      const analyticsResult = await server.readResource(
        'campaign://analytics',
        { organizationId: 'test-org-1' },
        authContext
      );
      
      // Get performance data
      const performanceResult = await server.readResource(
        'campaign://performance',
        { organizationId: 'test-org-1' },
        authContext
      );
      
      expect(analyticsResult.success).toBe(true);
      expect(performanceResult.success).toBe(true);
      
      const analytics = analyticsResult.data;
      const performance = performanceResult.data;
      
      // Verify data consistency
      expect(analytics.summary.totalCampaigns).toBe(analytics.campaigns.length);
      
      // Calculate expected totals from individual campaigns
      const expectedTotalSent = analytics.campaigns.reduce(
        (sum, campaign) => sum + campaign.sent, 0
      );
      expect(analytics.summary.totalSent).toBe(expectedTotalSent);
      
      console.log('✅ Data consistency verified across operations');
    });

    test('should validate metric calculations against database', async () => {
      // Get MCP server calculations
      const serverResult = await server.readResource(
        'campaign://analytics',
        { organizationId: 'test-org-1' },
        authContext
      );
      
      // Get raw database data
      const dbMetrics = await testPrisma.mCPCampaignMetrics.findMany({
        where: { organizationId: 'test-org-1' }
      });
      
      expect(serverResult.success).toBe(true);
      const serverData = serverResult.data;
      
      // Verify calculations match database
      const dbTotalSent = dbMetrics.reduce((sum, metric) => sum + metric.sent, 0);
      const dbTotalDelivered = dbMetrics.reduce((sum, metric) => sum + metric.delivered, 0);
      const dbTotalOpened = dbMetrics.reduce((sum, metric) => sum + metric.opened, 0);
      
      expect(serverData.summary.totalSent).toBe(dbTotalSent);
      expect(serverData.summary.totalDelivered).toBe(dbTotalDelivered);
      expect(serverData.summary.totalOpened).toBe(dbTotalOpened);
      
      // Verify rate calculations
      const expectedAvgOpenRate = dbTotalDelivered > 0 ? 
        (dbTotalOpened / dbTotalDelivered) * 100 : 0;
      expect(Math.abs(serverData.summary.avgOpenRate - expectedAvgOpenRate)).toBeLessThan(0.1);
      
      console.log('✅ Metric calculations validated against database');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid organization ID gracefully', async () => {
      const result = await server.readResource(
        'campaign://analytics',
        { organizationId: 'invalid-org-id' },
        authContext
      );
      
      expect(result.success).toBe(true);
      expect(result.data.campaigns).toHaveLength(0);
      expect(result.data.summary.totalCampaigns).toBe(0);
      
      console.log('✅ Handled invalid organization ID gracefully');
    });

    test('should handle empty date ranges appropriately', async () => {
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      
      const result = await server.readResource(
        'campaign://analytics',
        {
          organizationId: 'test-org-1',
          dateRange: {
            start: futureDate.toISOString(),
            end: futureDate.toISOString()
          }
        },
        authContext
      );
      
      expect(result.success).toBe(true);
      expect(result.data.campaigns).toHaveLength(0);
      
      console.log('✅ Handled empty date range appropriately');
    });

    test('should validate authentication and authorization', async () => {
      const unauthorizedContext = {
        ...authContext,
        permissions: ['read:contacts'] // Wrong permissions
      };
      
      try {
        await server.readResource(
          'campaign://analytics',
          { organizationId: 'test-org-1' },
          unauthorizedContext
        );
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error.name).toBe('MCPAuthorizationError');
        console.log('✅ Correctly rejected unauthorized access');
      }
    });
  });

  afterAll(() => {
    // Display performance summary
    const stats = performanceTracker.getAllStats();
    console.log('\n📊 Performance Summary:');
    for (const [operation, operationStats] of Object.entries(stats)) {
      console.log(`  ${operation}: avg ${operationStats.avg}ms, min ${operationStats.min}ms, max ${operationStats.max}ms (${operationStats.count} calls)`);
    }
  });
});
