/**
 * Customer Data MCP Server Integration Tests
 * 
 * These tests verify the Customer Data MCP server works correctly with real customer
 * prediction data, behavioral scoring, and segmentation.
 */

import { describe, beforeAll, afterAll, beforeEach, test, expect } from '@jest/jest';
import { CustomerDataMCPServer } from '../../../mcp/servers/customer-data-server';
import { 
  TestDatabaseManager, 
  testPrisma, 
  PerformanceTracker,
  testConfig
} from './setup';
import { MCPAuthContext } from '../../../mcp/types/mcp-types';

describe('Customer Data MCP Server Integration Tests', () => {
  let server: CustomerDataMCPServer;
  let dbManager: TestDatabaseManager;
  let performanceTracker: PerformanceTracker;
  let authContext: MCPAuthContext;

  beforeAll(async () => {
    dbManager = TestDatabaseManager.getInstance();
    await dbManager.setup();
    
    performanceTracker = new PerformanceTracker();
    
    server = new CustomerDataMCPServer({
      rateLimiting: {
        enabled: false
      }
    });
    
    authContext = {
      organizationId: 'test-org-1',
      userId: 'test-user-1',
      role: 'ADMIN',
      permissions: ['read:customers', 'read:predictions']
    };
  }, testConfig.timeouts.database);

  afterAll(async () => {
    await dbManager.teardown();
  });

  beforeEach(() => {
    performanceTracker.reset();
  });

  describe('Customer Predictions Data Integrity', () => {
    test('should verify customer prediction data relationships', async () => {
      const predictions = await testPrisma.mCPCustomerPredictions.findMany({
        include: {
          contact: true,
          organization: true
        }
      });

      expect(predictions.length).toBeGreaterThan(0);
      
      for (const prediction of predictions) {
        // Verify relationships
        expect(prediction.contact).toBeDefined();
        expect(prediction.organization).toBeDefined();
        expect(prediction.contactId).toBe(prediction.contact.id);
        expect(prediction.organizationId).toBe(prediction.organization.id);
        
        // Verify prediction scores are within valid ranges
        expect(prediction.churnRisk).toBeGreaterThanOrEqual(0);
        expect(prediction.churnRisk).toBeLessThanOrEqual(100);
        expect(prediction.lifetimeValue).toBeGreaterThanOrEqual(0);
        expect(prediction.engagementScore).toBeGreaterThanOrEqual(0);
        expect(prediction.engagementScore).toBeLessThanOrEqual(100);
        expect(prediction.confidenceScore).toBeGreaterThanOrEqual(0);
        expect(prediction.confidenceScore).toBeLessThanOrEqual(100);
        
        // Verify behavioral scores structure
        if (prediction.behavioralScores) {
          const scores = JSON.parse(prediction.behavioralScores as string);
          expect(scores).toHaveProperty('mobileUsage');
          expect(scores).toHaveProperty('priceSensitivity');
          expect(scores).toHaveProperty('whatsappPreference');
          expect(scores.mobileUsage).toBeGreaterThanOrEqual(0);
          expect(scores.mobileUsage).toBeLessThanOrEqual(100);
        }
        
        // Verify insights structure
        if (prediction.insights) {
          const insights = JSON.parse(prediction.insights as string);
          expect(Array.isArray(insights)).toBe(true);
        }
      }
      
      console.log(`✅ Verified ${predictions.length} customer predictions for data integrity`);
    });

    test('should validate customer segmentation distribution', async () => {
      const segmentCounts = await testPrisma.mCPCustomerPredictions.groupBy({
        by: ['segment'],
        _count: { segment: true },
        where: { organizationId: 'test-org-1' }
      });

      expect(segmentCounts.length).toBeGreaterThan(0);
      
      const validSegments = [
        'VIP Customers', 'Growth Potential', 'At Risk', 
        'New Customers', 'Loyal Base', 'Price Sensitive', 'Inactive'
      ];
      
      for (const segmentData of segmentCounts) {
        expect(validSegments).toContain(segmentData.segment);
        expect(segmentData._count.segment).toBeGreaterThan(0);
      }
      
      console.log('✅ Customer segment distribution:', segmentCounts);
    });
  });

  describe('MCP Server Operations', () => {
    test('should retrieve customer segments with real data', async () => {
      performanceTracker.start();
      
      const result = await server.readResource(
        'customer://segments',
        {
          organizationId: 'test-org-1'
        },
        authContext
      );
      
      const duration = performanceTracker.measure('getCustomerSegments');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const data = result.data;
      expect(data).toHaveProperty('segments');
      expect(data).toHaveProperty('summary');
      
      // Verify segment data structure
      for (const segment of data.segments) {
        expect(segment).toHaveProperty('name');
        expect(segment).toHaveProperty('count');
        expect(segment).toHaveProperty('avgLifetimeValue');
        expect(segment).toHaveProperty('avgChurnRisk');
        expect(segment).toHaveProperty('avgEngagementScore');
        
        expect(segment.count).toBeGreaterThan(0);
        expect(segment.avgLifetimeValue).toBeGreaterThanOrEqual(0);
        expect(segment.avgChurnRisk).toBeGreaterThanOrEqual(0);
        expect(segment.avgChurnRisk).toBeLessThanOrEqual(100);
      }
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      console.log(`✅ Retrieved ${data.segments.length} customer segments in ${duration}ms`);
    });

    test('should get high-risk customers for retention', async () => {
      performanceTracker.start();
      
      const result = await server.readResource(
        'customer://at-risk',
        {
          organizationId: 'test-org-1',
          riskThreshold: 70
        },
        authContext
      );
      
      const duration = performanceTracker.measure('getAtRiskCustomers');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const data = result.data;
      expect(data).toHaveProperty('customers');
      expect(data).toHaveProperty('totalAtRisk');
      expect(data).toHaveProperty('recommendations');
      
      // Verify all returned customers meet risk threshold
      for (const customer of data.customers) {
        expect(customer.churnRisk).toBeGreaterThanOrEqual(70);
        expect(customer).toHaveProperty('contactId');
        expect(customer).toHaveProperty('nextBestAction');
        expect(customer).toHaveProperty('urgencyLevel');
      }
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      console.log(`✅ Retrieved ${data.customers.length} at-risk customers in ${duration}ms`);
    });

    test('should analyze customer lifetime value distribution', async () => {
      performanceTracker.start();
      
      const result = await server.readResource(
        'customer://ltv-analysis',
        {
          organizationId: 'test-org-1'
        },
        authContext
      );
      
      const duration = performanceTracker.measure('ltvAnalysis');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const data = result.data;
      expect(data).toHaveProperty('distribution');
      expect(data).toHaveProperty('percentiles');
      expect(data).toHaveProperty('topCustomers');
      expect(data).toHaveProperty('summary');
      
      // Verify LTV distribution
      expect(data.distribution.length).toBeGreaterThan(0);
      for (const bucket of data.distribution) {
        expect(bucket).toHaveProperty('range');
        expect(bucket).toHaveProperty('count');
        expect(bucket).toHaveProperty('percentage');
        expect(bucket.count).toBeGreaterThanOrEqual(0);
      }
      
      // Verify percentiles
      expect(data.percentiles).toHaveProperty('p25');
      expect(data.percentiles).toHaveProperty('p50');
      expect(data.percentiles).toHaveProperty('p75');
      expect(data.percentiles).toHaveProperty('p90');
      expect(data.percentiles.p25).toBeLessThanOrEqual(data.percentiles.p50);
      expect(data.percentiles.p50).toBeLessThanOrEqual(data.percentiles.p75);
      expect(data.percentiles.p75).toBeLessThanOrEqual(data.percentiles.p90);
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      console.log(`✅ Analyzed LTV distribution in ${duration}ms`);
    });

    test('should provide behavioral insights and recommendations', async () => {
      performanceTracker.start();
      
      const result = await server.readResource(
        'customer://behavioral-insights',
        {
          organizationId: 'test-org-1',
          segmentFilter: 'Growth Potential'
        },
        authContext
      );
      
      const duration = performanceTracker.measure('behavioralInsights');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const data = result.data;
      expect(data).toHaveProperty('insights');
      expect(data).toHaveProperty('channelPreferences');
      expect(data).toHaveProperty('behaviorPatterns');
      expect(data).toHaveProperty('actionableRecommendations');
      
      // Verify channel preferences
      const channelPrefs = data.channelPreferences;
      expect(channelPrefs).toHaveProperty('whatsappPreference');
      expect(channelPrefs).toHaveProperty('smsEngagement');
      expect(channelPrefs).toHaveProperty('emailEffectiveness');
      
      // Verify behavior patterns
      const patterns = data.behaviorPatterns;
      expect(patterns).toHaveProperty('mobileUsage');
      expect(patterns).toHaveProperty('priceSensitivity');
      expect(patterns).toHaveProperty('socialInfluence');
      
      // Verify recommendations are actionable
      expect(Array.isArray(data.actionableRecommendations)).toBe(true);
      for (const recommendation of data.actionableRecommendations) {
        expect(recommendation).toHaveProperty('action');
        expect(recommendation).toHaveProperty('priority');
        expect(recommendation).toHaveProperty('expectedImpact');
      }
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      console.log(`✅ Generated behavioral insights in ${duration}ms`);
    });
  });

  describe('Advanced Analytics and Predictions', () => {
    test('should perform churn prediction analysis', async () => {
      performanceTracker.start();
      
      const result = await server.readResource(
        'customer://churn-prediction',
        {
          organizationId: 'test-org-1',
          timeHorizon: '30_days'
        },
        authContext
      );
      
      const duration = performanceTracker.measure('churnPrediction');
      
      expect(result.success).toBe(true);
      const data = result.data;
      
      expect(data).toHaveProperty('riskDistribution');
      expect(data).toHaveProperty('predictedChurners');
      expect(data).toHaveProperty('retentionStrategies');
      expect(data).toHaveProperty('potentialRevenueLoss');
      
      // Verify risk distribution
      const riskDist = data.riskDistribution;
      expect(riskDist).toHaveProperty('low');
      expect(riskDist).toHaveProperty('medium');
      expect(riskDist).toHaveProperty('high');
      expect(riskDist).toHaveProperty('critical');
      
      // Verify predicted churners have high risk scores
      for (const customer of data.predictedChurners) {
        expect(customer.churnRisk).toBeGreaterThan(60);
        expect(customer).toHaveProperty('retentionStrategy');
        expect(customer).toHaveProperty('interventionUrgency');
      }
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      console.log(`✅ Performed churn prediction analysis in ${duration}ms`);
    });

    test('should calculate customer engagement trends', async () => {
      performanceTracker.start();
      
      const result = await server.readResource(
        'customer://engagement-trends',
        {
          organizationId: 'test-org-1',
          period: 'last_90_days'
        },
        authContext
      );
      
      const duration = performanceTracker.measure('engagementTrends');
      
      expect(result.success).toBe(true);
      const data = result.data;
      
      expect(data).toHaveProperty('trends');
      expect(data).toHaveProperty('segmentComparison');
      expect(data).toHaveProperty('engagementDrivers');
      
      // Verify trends data
      expect(Array.isArray(data.trends)).toBe(true);
      for (const trend of data.trends) {
        expect(trend).toHaveProperty('period');
        expect(trend).toHaveProperty('avgEngagementScore');
        expect(trend).toHaveProperty('trend'); // 'increasing', 'decreasing', 'stable'
      }
      
      // Verify segment comparison
      expect(Array.isArray(data.segmentComparison)).toBe(true);
      for (const comparison of data.segmentComparison) {
        expect(comparison).toHaveProperty('segment');
        expect(comparison).toHaveProperty('currentScore');
        expect(comparison).toHaveProperty('previousScore');
        expect(comparison).toHaveProperty('change');
      }
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      console.log(`✅ Calculated engagement trends in ${duration}ms`);
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle complex customer analytics queries efficiently', async () => {
      const complexQueries = [
        { resource: 'customer://segments', params: { organizationId: 'test-org-1' } },
        { resource: 'customer://ltv-analysis', params: { organizationId: 'test-org-1' } },
        { resource: 'customer://at-risk', params: { organizationId: 'test-org-1', riskThreshold: 70 } },
        { resource: 'customer://behavioral-insights', params: { organizationId: 'test-org-1' } }
      ];
      
      performanceTracker.start();
      
      const promises = complexQueries.map(query => 
        server.readResource(query.resource, query.params, authContext)
      );
      
      const results = await Promise.all(promises);
      const duration = performanceTracker.measure('complexQueriesConcurrent');
      
      // Verify all queries succeeded
      for (const result of results) {
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      }
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime * 3);
      console.log(`✅ Executed ${complexQueries.length} complex queries concurrently in ${duration}ms`);
    });

    test('should validate database query optimization for customer data', async () => {
      const startTime = Date.now();
      
      // Test complex query with joins and aggregations
      const result = await testPrisma.mCPCustomerPredictions.findMany({
        where: {
          organizationId: 'test-org-1',
          churnRisk: { gte: 50 }
        },
        include: {
          contact: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              status: true
            }
          }
        },
        orderBy: [
          { churnRisk: 'desc' },
          { lifetimeValue: 'desc' }
        ]
      });
      
      const queryDuration = Date.now() - startTime;
      
      expect(result.length).toBeGreaterThan(0);
      expect(queryDuration).toBeLessThan(testConfig.performance.maxQueryTime);
      
      console.log(`✅ Complex customer query: ${result.length} records in ${queryDuration}ms`);
    });
  });

  describe('Data Quality and Validation', () => {
    test('should validate prediction model accuracy indicators', async () => {
      const predictions = await testPrisma.mCPCustomerPredictions.findMany({
        where: { organizationId: 'test-org-1' }
      });

      let totalConfidence = 0;
      let validPredictions = 0;
      
      for (const prediction of predictions) {
        // Verify confidence scores
        expect(prediction.confidenceScore).toBeGreaterThanOrEqual(80); // Should be high confidence
        totalConfidence += prediction.confidenceScore;
        
        // Verify logical consistency
        if (prediction.segment === 'At Risk') {
          expect(prediction.churnRisk).toBeGreaterThan(60);
        }
        if (prediction.segment === 'VIP Customers') {
          expect(prediction.lifetimeValue).toBeGreaterThan(150);
          expect(prediction.churnRisk).toBeLessThan(40);
        }
        
        validPredictions++;
      }
      
      const avgConfidence = totalConfidence / validPredictions;
      expect(avgConfidence).toBeGreaterThan(85); // Average confidence should be high
      
      console.log(`✅ Validated ${validPredictions} predictions, avg confidence: ${avgConfidence.toFixed(1)}%`);
    });

    test('should ensure behavioral scores are realistic for African market', async () => {
      const predictions = await testPrisma.mCPCustomerPredictions.findMany({
        where: { organizationId: 'test-org-1' }
      });

      for (const prediction of predictions) {
        if (prediction.behavioralScores) {
          const scores = JSON.parse(prediction.behavioralScores as string);
          
          // African market characteristics
          expect(scores.mobileUsage).toBeGreaterThan(70); // High mobile usage in Africa
          expect(scores.whatsappPreference).toBeGreaterThan(60); // WhatsApp dominant
          expect(scores.priceSensitivity).toBeGreaterThan(50); // Price sensitivity higher
          
          // Verify scores are within realistic ranges
          Object.values(scores).forEach(score => {
            expect(typeof score).toBe('number');
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(100);
          });
        }
      }
      
      console.log('✅ Validated behavioral scores for African market context');
    });
  });

  afterAll(() => {
    const stats = performanceTracker.getAllStats();
    console.log('\n📊 Customer Data Server Performance Summary:');
    for (const [operation, operationStats] of Object.entries(stats)) {
      console.log(`  ${operation}: avg ${operationStats.avg}ms, min ${operationStats.min}ms, max ${operationStats.max}ms`);
    }
  });
});
