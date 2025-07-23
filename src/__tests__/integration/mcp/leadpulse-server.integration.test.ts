/**
 * LeadPulse MCP Server Integration Tests
 * 
 * These tests verify the LeadPulse MCP server works correctly with real visitor
 * session data, analytics, and real-time tracking capabilities.
 */

import { describe, beforeAll, afterAll, beforeEach, test, expect } from '@jest/jest';
import { LeadPulseMCPServer } from '../../../mcp/servers/leadpulse-server';
import { 
  TestDatabaseManager, 
  testPrisma, 
  PerformanceTracker,
  testConfig
} from './setup';
import { MCPAuthContext } from '../../../mcp/types/mcp-types';

describe('LeadPulse MCP Server Integration Tests', () => {
  let server: LeadPulseMCPServer;
  let dbManager: TestDatabaseManager;
  let performanceTracker: PerformanceTracker;
  let authContext: MCPAuthContext;

  beforeAll(async () => {
    dbManager = TestDatabaseManager.getInstance();
    await dbManager.setup();
    
    performanceTracker = new PerformanceTracker();
    
    server = new LeadPulseMCPServer({
      rateLimiting: {
        enabled: false
      }
    });
    
    authContext = {
      organizationId: 'test-org-1',
      userId: 'test-user-1',
      role: 'ADMIN',
      permissions: ['read:visitors', 'read:analytics']
    };
  }, testConfig.timeouts.database);

  afterAll(async () => {
    await dbManager.teardown();
  });

  beforeEach(() => {
    performanceTracker.reset();
  });

  describe('Visitor Sessions Data Integrity', () => {
    test('should verify visitor session data relationships and structure', async () => {
      const sessions = await testPrisma.mCPVisitorSessions.findMany({
        include: {
          organization: true
        }
      });

      expect(sessions.length).toBeGreaterThan(0);
      
      for (const session of sessions) {
        // Verify organization relationship
        expect(session.organization).toBeDefined();
        expect(session.organizationId).toBe(session.organization.id);
        
        // Verify session data integrity
        expect(session.sessionId).toBeDefined();
        expect(session.fingerprint).toBeDefined();
        expect(session.ipAddress).toBeDefined();
        expect(session.userAgent).toBeDefined();
        
        // Verify device information
        expect(['mobile', 'desktop', 'tablet']).toContain(session.device);
        expect(session.browser).toBeDefined();
        expect(session.os).toBeDefined();
        
        // Verify location data
        expect(session.city).toBeDefined();
        expect(session.country).toBeDefined();
        expect(session.region).toBeDefined();
        expect(session.timezone).toBeDefined();
        
        // Verify session metrics
        expect(session.duration).toBeGreaterThan(0);
        expect(session.pagesViewed).toBeGreaterThan(0);
        expect(session.interactions).toBeGreaterThanOrEqual(0);
        expect(session.engagementScore).toBeGreaterThanOrEqual(0);
        expect(session.engagementScore).toBeLessThanOrEqual(100);
        expect(session.conversionValue).toBeGreaterThanOrEqual(0);
        expect(session.bounceRate).toBeGreaterThanOrEqual(0);
        expect(session.bounceRate).toBeLessThanOrEqual(1);
        
        // Verify traffic source
        expect(session.trafficSource).toBeDefined();
        expect(session.trafficMedium).toBeDefined();
        
        // Verify page views structure
        if (session.pageViews) {
          const pageViews = JSON.parse(session.pageViews as string);
          expect(Array.isArray(pageViews)).toBe(true);
          expect(pageViews.length).toBe(session.pagesViewed);
          
          for (const pageView of pageViews) {
            expect(pageView).toHaveProperty('url');
            expect(pageView).toHaveProperty('title');
            expect(pageView).toHaveProperty('timestamp');
            expect(pageView).toHaveProperty('timeOnPage');
            expect(pageView).toHaveProperty('scrollDepth');
          }
        }
        
        // Verify journey pattern
        expect(session.journeyPattern).toBeDefined();
        const validPatterns = [
          'mobile_first_explorer', 'business_decision_maker', 'quick_browser',
          'returning_prospect', 'social_media_referral'
        ];
        expect(validPatterns).toContain(session.journeyPattern);
        
        // Verify characteristics
        if (session.characteristics) {
          const characteristics = JSON.parse(session.characteristics as string);
          expect(Array.isArray(characteristics)).toBe(true);
        }
      }
      
      console.log(`✅ Verified ${sessions.length} visitor sessions for data integrity`);
    });

    test('should validate African market visitor patterns', async () => {
      const sessions = await testPrisma.mCPVisitorSessions.findMany({
        where: { organizationId: 'test-org-1' }
      });

      let mobileCount = 0;
      let africanCountries = new Set();
      let whatsappTraffic = 0;
      
      for (const session of sessions) {
        // Count mobile usage (should be high for African market)
        if (session.device === 'mobile') {
          mobileCount++;
        }
        
        // Track African countries
        africanCountries.add(session.country);
        
        // Count WhatsApp traffic
        if (session.trafficSource === 'whatsapp') {
          whatsappTraffic++;
        }
      }
      
      const mobilePercentage = (mobileCount / sessions.length) * 100;
      
      // Verify African market characteristics
      expect(mobilePercentage).toBeGreaterThan(70); // High mobile usage
      expect(africanCountries.size).toBeGreaterThan(0);
      
      // Check for African countries in the data
      const expectedAfricanCountries = ['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Egypt'];
      const hasAfricanCountries = expectedAfricanCountries.some(country => 
        africanCountries.has(country)
      );
      expect(hasAfricanCountries).toBe(true);
      
      console.log(`✅ African market validation: ${mobilePercentage.toFixed(1)}% mobile, ${africanCountries.size} countries`);
    });
  });

  describe('Real-time Analytics Operations', () => {
    test('should retrieve real-time visitor analytics', async () => {
      performanceTracker.start();
      
      const result = await server.readResource(
        'leadpulse://analytics',
        {
          organizationId: 'test-org-1',
          timeRange: 'last_24_hours'
        },
        authContext
      );
      
      const duration = performanceTracker.measure('realtimeAnalytics');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const data = result.data;
      expect(data).toHaveProperty('summary');
      expect(data).toHaveProperty('sessions');
      expect(data).toHaveProperty('topPages');
      expect(data).toHaveProperty('deviceBreakdown');
      expect(data).toHaveProperty('trafficSources');
      expect(data).toHaveProperty('conversionFunnel');
      
      // Verify summary metrics
      expect(data.summary.totalSessions).toBeGreaterThan(0);
      expect(data.summary.totalPageViews).toBeGreaterThan(0);
      expect(data.summary.avgSessionDuration).toBeGreaterThan(0);
      expect(data.summary.bounceRate).toBeGreaterThanOrEqual(0);
      expect(data.summary.bounceRate).toBeLessThanOrEqual(100);
      
      // Verify device breakdown
      expect(data.deviceBreakdown).toHaveProperty('mobile');
      expect(data.deviceBreakdown).toHaveProperty('desktop');
      expect(data.deviceBreakdown).toHaveProperty('tablet');
      
      // Verify traffic sources
      expect(Array.isArray(data.trafficSources)).toBe(true);
      for (const source of data.trafficSources) {
        expect(source).toHaveProperty('source');
        expect(source).toHaveProperty('sessions');
        expect(source).toHaveProperty('percentage');
      }
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      console.log(`✅ Retrieved real-time analytics with ${data.sessions.length} sessions in ${duration}ms`);
    });

    test('should analyze visitor journey patterns', async () => {
      performanceTracker.start();
      
      const result = await server.readResource(
        'leadpulse://journey-analysis',
        {
          organizationId: 'test-org-1'
        },
        authContext
      );
      
      const duration = performanceTracker.measure('journeyAnalysis');
      
      expect(result.success).toBe(true);
      const data = result.data;
      
      expect(data).toHaveProperty('journeyPatterns');
      expect(data).toHaveProperty('commonPaths');
      expect(data).toHaveProperty('dropOffPoints');
      expect(data).toHaveProperty('conversionPaths');
      
      // Verify journey patterns
      expect(Array.isArray(data.journeyPatterns)).toBe(true);
      for (const pattern of data.journeyPatterns) {
        expect(pattern).toHaveProperty('type');
        expect(pattern).toHaveProperty('count');
        expect(pattern).toHaveProperty('avgEngagement');
        expect(pattern).toHaveProperty('conversionRate');
        expect(pattern.count).toBeGreaterThan(0);
      }
      
      // Verify common paths
      expect(Array.isArray(data.commonPaths)).toBe(true);
      for (const path of data.commonPaths) {
        expect(path).toHaveProperty('sequence');
        expect(path).toHaveProperty('frequency');
        expect(path).toHaveProperty('avgConversionRate');
        expect(Array.isArray(path.sequence)).toBe(true);
      }
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      console.log(`✅ Analyzed ${data.journeyPatterns.length} journey patterns in ${duration}ms`);
    });

    test('should track conversion funnel performance', async () => {
      performanceTracker.start();
      
      const result = await server.readResource(
        'leadpulse://conversion-funnel',
        {
          organizationId: 'test-org-1',
          funnelType: 'sales'
        },
        authContext
      );
      
      const duration = performanceTracker.measure('conversionFunnel');
      
      expect(result.success).toBe(true);
      const data = result.data;
      
      expect(data).toHaveProperty('stages');
      expect(data).toHaveProperty('overallConversionRate');
      expect(data).toHaveProperty('dropOffAnalysis');
      
      // Verify funnel stages
      expect(Array.isArray(data.stages)).toBe(true);
      expect(data.stages.length).toBeGreaterThan(0);
      
      let previousVisitors = null;
      for (const stage of data.stages) {
        expect(stage).toHaveProperty('name');
        expect(stage).toHaveProperty('visitors');
        expect(stage).toHaveProperty('conversionRate');
        expect(stage).toHaveProperty('dropOffRate');
        
        expect(stage.visitors).toBeGreaterThanOrEqual(0);
        expect(stage.conversionRate).toBeGreaterThanOrEqual(0);
        expect(stage.conversionRate).toBeLessThanOrEqual(100);
        
        // Verify funnel logic (each stage should have fewer or equal visitors)
        if (previousVisitors !== null) {
          expect(stage.visitors).toBeLessThanOrEqual(previousVisitors);
        }
        previousVisitors = stage.visitors;
      }
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      console.log(`✅ Analyzed conversion funnel with ${data.stages.length} stages in ${duration}ms`);
    });

    test('should provide visitor geo-analytics', async () => {
      performanceTracker.start();
      
      const result = await server.readResource(
        'leadpulse://geo-analytics',
        {
          organizationId: 'test-org-1'
        },
        authContext
      );
      
      const duration = performanceTracker.measure('geoAnalytics');
      
      expect(result.success).toBe(true);
      const data = result.data;
      
      expect(data).toHaveProperty('countries');
      expect(data).toHaveProperty('cities');
      expect(data).toHaveProperty('regions');
      expect(data).toHaveProperty('timezones');
      
      // Verify countries data
      expect(Array.isArray(data.countries)).toBe(true);
      for (const country of data.countries) {
        expect(country).toHaveProperty('name');
        expect(country).toHaveProperty('sessions');
        expect(country).toHaveProperty('percentage');
        expect(country).toHaveProperty('avgEngagement');
        expect(country.sessions).toBeGreaterThan(0);
      }
      
      // Verify cities data
      expect(Array.isArray(data.cities)).toBe(true);
      for (const city of data.cities) {
        expect(city).toHaveProperty('name');
        expect(city).toHaveProperty('country');
        expect(city).toHaveProperty('sessions');
        expect(city.sessions).toBeGreaterThan(0);
      }
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      console.log(`✅ Analyzed geo-analytics for ${data.countries.length} countries in ${duration}ms`);
    });
  });

  describe('Session Tracking and Engagement', () => {
    test('should track live visitor sessions', async () => {
      performanceTracker.start();
      
      const result = await server.readResource(
        'leadpulse://live-sessions',
        {
          organizationId: 'test-org-1'
        },
        authContext
      );
      
      const duration = performanceTracker.measure('liveSessions');
      
      expect(result.success).toBe(true);
      const data = result.data;
      
      expect(data).toHaveProperty('activeSessions');
      expect(data).toHaveProperty('totalActive');
      expect(data).toHaveProperty('recentActivity');
      
      // Verify active sessions structure
      expect(Array.isArray(data.activeSessions)).toBe(true);
      for (const session of data.activeSessions) {
        expect(session).toHaveProperty('sessionId');
        expect(session).toHaveProperty('startTime');
        expect(session).toHaveProperty('currentPage');
        expect(session).toHaveProperty('device');
        expect(session).toHaveProperty('location');
        expect(session).toHaveProperty('engagementScore');
      }
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      console.log(`✅ Tracked ${data.activeSessions.length} live sessions in ${duration}ms`);
    });

    test('should calculate engagement scoring metrics', async () => {
      performanceTracker.start();
      
      const result = await server.readResource(
        'leadpulse://engagement-scoring',
        {
          organizationId: 'test-org-1',
          timeRange: 'last_7_days'
        },
        authContext
      );
      
      const duration = performanceTracker.measure('engagementScoring');
      
      expect(result.success).toBe(true);
      const data = result.data;
      
      expect(data).toHaveProperty('scoringModel');
      expect(data).toHaveProperty('scoreDistribution');
      expect(data).toHaveProperty('topEngagedSessions');
      expect(data).toHaveProperty('engagementFactors');
      
      // Verify scoring model
      const model = data.scoringModel;
      expect(model).toHaveProperty('timeOnSiteWeight');
      expect(model).toHaveProperty('pageViewsWeight');
      expect(model).toHaveProperty('interactionsWeight');
      expect(model).toHaveProperty('scrollDepthWeight');
      
      // Verify score distribution
      expect(Array.isArray(data.scoreDistribution)).toBe(true);
      for (const bucket of data.scoreDistribution) {
        expect(bucket).toHaveProperty('range');
        expect(bucket).toHaveProperty('count');
        expect(bucket).toHaveProperty('percentage');
      }
      
      // Verify top engaged sessions
      expect(Array.isArray(data.topEngagedSessions)).toBe(true);
      for (const session of data.topEngagedSessions) {
        expect(session).toHaveProperty('sessionId');
        expect(session).toHaveProperty('engagementScore');
        expect(session).toHaveProperty('duration');
        expect(session).toHaveProperty('interactions');
        expect(session.engagementScore).toBeGreaterThan(70); // High engagement
      }
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      console.log(`✅ Calculated engagement scoring in ${duration}ms`);
    });
  });

  describe('Performance and Real-time Capabilities', () => {
    test('should handle high-frequency analytics queries', async () => {
      const queries = [
        'leadpulse://analytics',
        'leadpulse://live-sessions', 
        'leadpulse://geo-analytics',
        'leadpulse://engagement-scoring'
      ];
      
      performanceTracker.start();
      
      const promises = queries.map(query => 
        server.readResource(
          query,
          { organizationId: 'test-org-1' },
          authContext
        )
      );
      
      const results = await Promise.all(promises);
      const duration = performanceTracker.measure('highFrequencyQueries');
      
      // Verify all queries succeeded
      for (const result of results) {
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      }
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime * 2);
      console.log(`✅ Handled ${queries.length} high-frequency queries in ${duration}ms`);
    });

    test('should validate real-time data freshness', async () => {
      // Get current session data
      const result = await server.readResource(
        'leadpulse://analytics',
        {
          organizationId: 'test-org-1',
          timeRange: 'last_1_hour'
        },
        authContext
      );
      
      expect(result.success).toBe(true);
      const data = result.data;
      
      // Verify data freshness
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      for (const session of data.sessions) {
        const sessionTime = new Date(session.timestamp);
        expect(sessionTime.getTime()).toBeGreaterThanOrEqual(oneHourAgo.getTime());
        expect(sessionTime.getTime()).toBeLessThanOrEqual(now.getTime());
      }
      
      console.log(`✅ Validated real-time data freshness for ${data.sessions.length} sessions`);
    });

    test('should measure complex analytics query performance', async () => {
      const startTime = Date.now();
      
      // Complex query with multiple joins and aggregations
      const sessions = await testPrisma.mCPVisitorSessions.groupBy({
        by: ['journeyPattern', 'device', 'country'],
        _count: { sessionId: true },
        _avg: { 
          engagementScore: true,
          duration: true,
          conversionValue: true
        },
        where: {
          organizationId: 'test-org-1',
          sessionStart: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        orderBy: {
          _count: {
            sessionId: 'desc'
          }
        }
      });
      
      const queryDuration = Date.now() - startTime;
      
      expect(sessions.length).toBeGreaterThan(0);
      expect(queryDuration).toBeLessThan(testConfig.performance.maxQueryTime);
      
      console.log(`✅ Complex analytics query: ${sessions.length} groups in ${queryDuration}ms`);
    });
  });

  describe('Data Quality and Consistency', () => {
    test('should validate session data consistency across operations', async () => {
      // Get analytics summary
      const analyticsResult = await server.readResource(
        'leadpulse://analytics',
        { organizationId: 'test-org-1' },
        authContext
      );
      
      // Get live sessions
      const liveResult = await server.readResource(
        'leadpulse://live-sessions',
        { organizationId: 'test-org-1' },
        authContext
      );
      
      expect(analyticsResult.success).toBe(true);
      expect(liveResult.success).toBe(true);
      
      const analytics = analyticsResult.data;
      const live = liveResult.data;
      
      // Verify data consistency
      expect(analytics.summary.totalSessions).toBeGreaterThanOrEqual(live.totalActive);
      
      // Live sessions should be subset of all sessions
      for (const liveSession of live.activeSessions) {
        expect(liveSession.sessionId).toBeDefined();
        expect(liveSession.engagementScore).toBeGreaterThanOrEqual(0);
        expect(liveSession.engagementScore).toBeLessThanOrEqual(100);
      }
      
      console.log('✅ Data consistency validated across analytics and live sessions');
    });

    test('should ensure engagement score calculations are accurate', async () => {
      // Get sessions with engagement scores
      const sessions = await testPrisma.mCPVisitorSessions.findMany({
        where: { organizationId: 'test-org-1' },
        take: 10
      });

      for (const session of sessions) {
        // Verify engagement score logic
        let expectedScore = 0;
        
        // Base score from page views
        expectedScore += session.pagesViewed * 5;
        
        // Time on site bonus
        const avgTimePerPage = session.duration / session.pagesViewed;
        if (avgTimePerPage > 60) expectedScore += 20;
        else if (avgTimePerPage > 30) expectedScore += 10;
        
        // Interaction bonus
        expectedScore += session.interactions * 5;
        
        // Conversion bonus
        if (session.hasConverted) expectedScore += 30;
        
        // The actual score should be in reasonable range of expected
        const scoreDifference = Math.abs(session.engagementScore - Math.min(100, expectedScore));
        expect(scoreDifference).toBeLessThan(20); // Allow some variance for additional factors
      }
      
      console.log(`✅ Validated engagement score calculations for ${sessions.length} sessions`);
    });
  });

  afterAll(() => {
    const stats = performanceTracker.getAllStats();
    console.log('\n📊 LeadPulse Server Performance Summary:');
    for (const [operation, operationStats] of Object.entries(stats)) {
      console.log(`  ${operation}: avg ${operationStats.avg}ms, min ${operationStats.min}ms, max ${operationStats.max}ms`);
    }
  });
});
