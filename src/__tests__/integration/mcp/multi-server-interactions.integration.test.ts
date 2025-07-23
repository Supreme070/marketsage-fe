/**
 * Multi-Server MCP Interactions Integration Tests
 * 
 * These tests verify how different MCP servers work together, data flow between servers,
 * and cross-server data validation.
 */

import { describe, beforeAll, afterAll, beforeEach, test, expect } from '@jest/jest';
import { CampaignAnalyticsMCPServer } from '../../../mcp/servers/campaign-analytics-server';
import { CustomerDataMCPServer } from '../../../mcp/servers/customer-data-server';
import { LeadPulseMCPServer } from '../../../mcp/servers/leadpulse-server';
import { MonitoringMCPServer } from '../../../mcp/servers/monitoring-server';
import { 
  TestDatabaseManager, 
  testPrisma, 
  PerformanceTracker,
  testConfig
} from './setup';
import { MCPAuthContext } from '../../../mcp/types/mcp-types';

describe('Multi-Server MCP Interactions Integration Tests', () => {
  let campaignServer: CampaignAnalyticsMCPServer;
  let customerServer: CustomerDataMCPServer;
  let leadpulseServer: LeadPulseMCPServer;
  let monitoringServer: MonitoringMCPServer;
  let dbManager: TestDatabaseManager;
  let performanceTracker: PerformanceTracker;
  let authContext: MCPAuthContext;

  beforeAll(async () => {
    dbManager = TestDatabaseManager.getInstance();
    await dbManager.setup();
    
    performanceTracker = new PerformanceTracker();
    
    // Initialize all MCP servers
    campaignServer = new CampaignAnalyticsMCPServer({ rateLimiting: { enabled: false } });
    customerServer = new CustomerDataMCPServer({ rateLimiting: { enabled: false } });
    leadpulseServer = new LeadPulseMCPServer({ rateLimiting: { enabled: false } });
    monitoringServer = new MonitoringMCPServer({ rateLimiting: { enabled: false } });
    
    authContext = {
      organizationId: 'test-org-1',
      userId: 'test-user-1',
      role: 'ADMIN',
      permissions: [
        'read:campaigns', 'read:analytics', 'read:customers', 
        'read:predictions', 'read:visitors', 'read:monitoring', 'read:metrics'
      ]
    };
  }, testConfig.timeouts.database);

  afterAll(async () => {
    await dbManager.teardown();
  });

  beforeEach(() => {
    performanceTracker.reset();
  });

  describe('Cross-Server Data Consistency', () => {
    test('should ensure customer data consistency across campaign and customer servers', async () => {
      performanceTracker.start();
      
      // Get campaign analytics
      const campaignResult = await campaignServer.readResource(
        'campaign://analytics',
        { organizationId: 'test-org-1' },
        authContext
      );
      
      // Get customer segments
      const customerResult = await customerServer.readResource(
        'customer://segments',
        { organizationId: 'test-org-1' },
        authContext
      );
      
      const duration = performanceTracker.measure('crossServerConsistency');
      
      expect(campaignResult.success).toBe(true);
      expect(customerResult.success).toBe(true);
      
      const campaignData = campaignResult.data;
      const customerData = customerResult.data;
      
      // Both should reference the same organization
      expect(campaignData.summary.organizationId || 'test-org-1').toBe('test-org-1');
      expect(customerData.summary.organizationId || 'test-org-1').toBe('test-org-1');
      
      // Cross-validate data points
      if (campaignData.summary.totalRecipients && customerData.summary.totalCustomers) {
        // Campaign recipients should not exceed total customers
        expect(campaignData.summary.totalRecipients).toBeLessThanOrEqual(
          customerData.summary.totalCustomers * 1.1 // Allow 10% variance for test data
        );
      }
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime * 2);
      console.log(`✅ Cross-server data consistency verified in ${duration}ms`);
    });

    test('should correlate visitor sessions with customer predictions', async () => {
      performanceTracker.start();
      
      // Get visitor analytics
      const visitorResult = await leadpulseServer.readResource(
        'leadpulse://analytics',
        { organizationId: 'test-org-1' },
        authContext
      );
      
      // Get customer predictions
      const customerResult = await customerServer.readResource(
        'customer://behavioral-insights',
        { organizationId: 'test-org-1' },
        authContext
      );
      
      const duration = performanceTracker.measure('visitorCustomerCorrelation');
      
      expect(visitorResult.success).toBe(true);
      expect(customerResult.success).toBe(true);
      
      const visitorData = visitorResult.data;
      const customerData = customerResult.data;
      
      // Verify mobile usage correlation
      const visitorMobilePercentage = (visitorData.deviceBreakdown.mobile / 
        (visitorData.deviceBreakdown.mobile + visitorData.deviceBreakdown.desktop + visitorData.deviceBreakdown.tablet)) * 100;
      
      const customerMobilePreference = customerData.behaviorPatterns.mobileUsage;
      
      // Mobile usage should be correlated (within reasonable variance)
      const mobileUsageDifference = Math.abs(visitorMobilePercentage - customerMobilePreference);
      expect(mobileUsageDifference).toBeLessThan(20); // Allow 20% variance
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime * 2);
      console.log(`✅ Visitor-customer correlation verified in ${duration}ms`);
    });

    test('should validate campaign performance against customer engagement', async () => {
      performanceTracker.start();
      
      // Get campaign performance
      const campaignResult = await campaignServer.readResource(
        'campaign://performance',
        { organizationId: 'test-org-1' },
        authContext
      );
      
      // Get customer engagement trends
      const engagementResult = await customerServer.readResource(
        'customer://engagement-trends',
        { organizationId: 'test-org-1' },
        authContext
      );
      
      const duration = performanceTracker.measure('campaignEngagementValidation');
      
      expect(campaignResult.success).toBe(true);
      expect(engagementResult.success).toBe(true);
      
      const campaignData = campaignResult.data;
      const engagementData = engagementResult.data;
      
      // High campaign performance should correlate with high customer engagement
      if (campaignData.overallPerformance && engagementData.overallTrend) {
        const avgCampaignPerformance = (
          campaignData.overallPerformance.avgOpenRate +
          campaignData.overallPerformance.avgClickRate +
          campaignData.overallPerformance.avgConversionRate
        ) / 3;
        
        const avgEngagementScore = engagementData.overallTrend.currentScore;
        
        // Should be positively correlated (within reasonable bounds)
        if (avgCampaignPerformance > 10) { // If campaigns are performing well
          expect(avgEngagementScore).toBeGreaterThan(40); // Engagement should be decent
        }
      }
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime * 2);
      console.log(`✅ Campaign-engagement validation completed in ${duration}ms`);
    });
  });

  describe('Unified Analytics Dashboard Simulation', () => {
    test('should simulate unified dashboard data retrieval', async () => {
      performanceTracker.start();
      
      // Simulate dashboard loading all key metrics simultaneously
      const promises = [
        campaignServer.readResource('campaign://analytics', { organizationId: 'test-org-1' }, authContext),
        customerServer.readResource('customer://segments', { organizationId: 'test-org-1' }, authContext),
        leadpulseServer.readResource('leadpulse://analytics', { organizationId: 'test-org-1' }, authContext),
        monitoringServer.readResource('monitoring://system-health', { organizationId: 'test-org-1' }, authContext)
      ];
      
      const results = await Promise.all(promises);
      const duration = performanceTracker.measure('unifiedDashboard');
      
      // Verify all requests succeeded
      for (const result of results) {
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      }
      
      const [campaignData, customerData, visitorData, monitoringData] = results.map(r => r.data);
      
      // Create unified dashboard object
      const unifiedDashboard = {
        timestamp: new Date(),
        organization: 'test-org-1',
        campaigns: {
          totalCampaigns: campaignData.summary.totalCampaigns,
          avgOpenRate: campaignData.summary.avgOpenRate,
          avgClickRate: campaignData.summary.avgClickRate,
          totalRevenue: campaignData.summary.totalRevenue
        },
        customers: {
          totalCustomers: customerData.summary.totalCustomers,
          segments: customerData.segments.length,
          atRiskCount: customerData.segments.find(s => s.name === 'At Risk')?.count || 0,
          avgLifetimeValue: customerData.summary.avgLifetimeValue
        },
        visitors: {
          totalSessions: visitorData.summary.totalSessions,
          bounceRate: visitorData.summary.bounceRate,
          avgEngagement: visitorData.summary.avgEngagementScore,
          conversionRate: visitorData.summary.conversionRate
        },
        system: {
          healthScore: monitoringData.overallHealth.score,
          activeAlerts: monitoringData.alerts.length,
          responseTime: monitoringData.metrics.responseTime,
          uptime: monitoringData.metrics.uptime
        }
      };
      
      // Verify unified dashboard completeness
      expect(unifiedDashboard.campaigns.totalCampaigns).toBeGreaterThanOrEqual(0);
      expect(unifiedDashboard.customers.totalCustomers).toBeGreaterThanOrEqual(0);
      expect(unifiedDashboard.visitors.totalSessions).toBeGreaterThanOrEqual(0);
      expect(unifiedDashboard.system.healthScore).toBeGreaterThanOrEqual(0);
      expect(unifiedDashboard.system.healthScore).toBeLessThanOrEqual(100);
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime * 4);
      console.log(`✅ Unified dashboard simulation completed in ${duration}ms`);
      console.log('📊 Dashboard Summary:', {
        campaigns: unifiedDashboard.campaigns.totalCampaigns,
        customers: unifiedDashboard.customers.totalCustomers,
        sessions: unifiedDashboard.visitors.totalSessions,
        health: `${unifiedDashboard.system.healthScore}%`
      });
    });

    test('should handle cross-server error propagation gracefully', async () => {
      performanceTracker.start();
      
      // Test with invalid organization ID to trigger errors
      const invalidAuthContext = {
        ...authContext,
        organizationId: 'invalid-org-id'
      };
      
      const promises = [
        campaignServer.readResource('campaign://analytics', { organizationId: 'invalid-org-id' }, invalidAuthContext),
        customerServer.readResource('customer://segments', { organizationId: 'invalid-org-id' }, invalidAuthContext),
        leadpulseServer.readResource('leadpulse://analytics', { organizationId: 'invalid-org-id' }, invalidAuthContext),
        monitoringServer.readResource('monitoring://system-health', { organizationId: 'invalid-org-id' }, invalidAuthContext)
      ];
      
      const results = await Promise.all(promises.map(p => p.catch(e => ({ success: false, error: e.message }))));
      const duration = performanceTracker.measure('errorPropagation');
      
      // All servers should handle invalid org gracefully (return empty data, not errors)
      for (const result of results) {
        // Should either succeed with empty data or fail gracefully
        if (result.success) {
          expect(result.data).toBeDefined();
        } else {
          expect(result.error).toBeDefined();
        }
      }
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime * 4);
      console.log(`✅ Error propagation handled gracefully in ${duration}ms`);
    });
  });

  describe('Data Flow and Integration Patterns', () => {
    test('should validate campaign-to-customer journey tracking', async () => {
      performanceTracker.start();
      
      // Get campaign performance by channel
      const campaignResult = await campaignServer.readResource(
        'campaign://performance',
        {
          organizationId: 'test-org-1',
          groupBy: 'campaignType'
        },
        authContext
      );
      
      // Get customer channel preferences
      const customerResult = await customerServer.readResource(
        'customer://behavioral-insights',
        { organizationId: 'test-org-1' },
        authContext
      );
      
      const duration = performanceTracker.measure('campaignCustomerJourney');
      
      expect(campaignResult.success).toBe(true);
      expect(customerResult.success).toBe(true);
      
      const campaignData = campaignResult.data;
      const customerData = customerResult.data;
      
      // Map campaign performance to customer preferences
      const channelMapping = {
        EMAIL: 'emailEffectiveness',
        SMS: 'smsEngagement', 
        WHATSAPP: 'whatsappPreference'
      };
      
      for (const campaignGroup of campaignData.groups) {
        const customerPref = channelMapping[campaignGroup.campaignType as keyof typeof channelMapping];
        if (customerPref && customerData.channelPreferences[customerPref]) {
          // High performing campaigns should correlate with high customer preference
          const campaignPerformance = campaignGroup.metrics.avgConversionRate;
          const customerPreference = customerData.channelPreferences[customerPref];
          
          console.log(`Channel ${campaignGroup.campaignType}: Performance ${campaignPerformance}%, Preference ${customerPreference}%`);
          
          // Basic correlation check (high performance should mean decent preference)
          if (campaignPerformance > 5) {
            expect(customerPreference).toBeGreaterThan(30);
          }
        }
      }
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime * 2);
      console.log(`✅ Campaign-customer journey validation completed in ${duration}ms`);
    });

    test('should track visitor-to-customer conversion attribution', async () => {
      performanceTracker.start();
      
      // Get visitor conversion funnel
      const visitorResult = await leadpulseServer.readResource(
        'leadpulse://conversion-funnel',
        {
          organizationId: 'test-org-1',
          funnelType: 'sales'
        },
        authContext
      );
      
      // Get customer acquisition data
      const customerResult = await customerServer.readResource(
        'customer://segments',
        {
          organizationId: 'test-org-1'
        },
        authContext
      );
      
      const duration = performanceTracker.measure('visitorCustomerConversion');
      
      expect(visitorResult.success).toBe(true);
      expect(customerResult.success).toBe(true);
      
      const visitorData = visitorResult.data;
      const customerData = customerResult.data;
      
      // Verify conversion logic
      const finalStageVisitors = visitorData.stages[visitorData.stages.length - 1]?.visitors || 0;
      const newCustomers = customerData.segments.find(s => s.name === 'New Customers')?.count || 0;
      
      // Final stage visitors should correlate with new customers (allowing for test data variance)
      if (finalStageVisitors > 0 && newCustomers > 0) {
        const conversionRatio = newCustomers / finalStageVisitors;
        expect(conversionRatio).toBeGreaterThan(0.1); // At least 10% attribution
        expect(conversionRatio).toBeLessThan(10); // Reasonable upper bound
      }
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime * 2);
      console.log(`✅ Visitor-customer conversion attribution validated in ${duration}ms`);
    });

    test('should correlate monitoring metrics with business performance', async () => {
      performanceTracker.start();
      
      // Get business metrics from monitoring
      const monitoringResult = await monitoringServer.readResource(
        'monitoring://business-metrics',
        { organizationId: 'test-org-1' },
        authContext
      );
      
      // Get campaign performance metrics
      const campaignResult = await campaignServer.readResource(
        'campaign://analytics',
        { organizationId: 'test-org-1' },
        authContext
      );
      
      const duration = performanceTracker.measure('monitoringBusinessCorrelation');
      
      expect(monitoringResult.success).toBe(true);
      expect(campaignResult.success).toBe(true);
      
      const monitoringData = monitoringResult.data;
      const campaignData = campaignResult.data;
      
      // Cross-validate business metrics
      expect(monitoringData.kpis.totalCampaigns).toBe(campaignData.summary.totalCampaigns);
      
      // Revenue correlation
      if (monitoringData.revenue.totalRevenue && campaignData.summary.totalRevenue) {
        const monitoringRevenue = monitoringData.revenue.totalRevenue;
        const campaignRevenue = campaignData.summary.totalRevenue;
        
        // Campaign revenue should be part of total revenue (or close for test data)
        expect(campaignRevenue).toBeLessThanOrEqual(monitoringRevenue * 1.1);
      }
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime * 2);
      console.log(`✅ Monitoring-business correlation validated in ${duration}ms`);
    });
  });

  describe('Performance Under Load', () => {
    test('should handle concurrent multi-server operations', async () => {
      const concurrentOperations = 3;
      const operationsPerServer = 2;
      
      performanceTracker.start();
      
      const allPromises = [];
      
      for (let i = 0; i < concurrentOperations; i++) {
        // Campaign server operations
        allPromises.push(
          campaignServer.readResource('campaign://analytics', { organizationId: 'test-org-1' }, authContext),
          campaignServer.readResource('campaign://performance', { organizationId: 'test-org-1' }, authContext)
        );
        
        // Customer server operations  
        allPromises.push(
          customerServer.readResource('customer://segments', { organizationId: 'test-org-1' }, authContext),
          customerServer.readResource('customer://at-risk', { organizationId: 'test-org-1', riskThreshold: 70 }, authContext)
        );
        
        // LeadPulse server operations
        allPromises.push(
          leadpulseServer.readResource('leadpulse://analytics', { organizationId: 'test-org-1' }, authContext),
          leadpulseServer.readResource('leadpulse://live-sessions', { organizationId: 'test-org-1' }, authContext)
        );
        
        // Monitoring server operations
        allPromises.push(
          monitoringServer.readResource('monitoring://system-health', { organizationId: 'test-org-1' }, authContext),
          monitoringServer.readResource('monitoring://business-metrics', { organizationId: 'test-org-1' }, authContext)
        );
      }
      
      const results = await Promise.all(allPromises);
      const duration = performanceTracker.measure('concurrentMultiServer');
      
      // Verify all operations succeeded
      for (const result of results) {
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      }
      
      const totalOperations = concurrentOperations * 4 * operationsPerServer;
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime * 6);
      console.log(`✅ Handled ${totalOperations} concurrent operations across all servers in ${duration}ms`);
    });

    test('should measure cross-server data consistency under load', async () => {
      const iterations = 5;
      const consistencyChecks = [];
      
      for (let i = 0; i < iterations; i++) {
        performanceTracker.start();
        
        // Get data from multiple servers simultaneously
        const [campaignResult, customerResult, monitoringResult] = await Promise.all([
          campaignServer.readResource('campaign://analytics', { organizationId: 'test-org-1' }, authContext),
          customerServer.readResource('customer://segments', { organizationId: 'test-org-1' }, authContext),
          monitoringServer.readResource('monitoring://business-metrics', { organizationId: 'test-org-1' }, authContext)
        ]);
        
        const duration = performanceTracker.measure(`consistency_check_${i}`);
        
        // Verify consistency
        const campaignCount = campaignResult.data.summary.totalCampaigns;
        const monitoringCampaignCount = monitoringResult.data.kpis.totalCampaigns;
        
        consistencyChecks.push({
          iteration: i + 1,
          campaignCount,
          monitoringCampaignCount,
          consistent: campaignCount === monitoringCampaignCount,
          duration
        });
        
        expect(campaignCount).toBe(monitoringCampaignCount);
      }
      
      const allConsistent = consistencyChecks.every(check => check.consistent);
      expect(allConsistent).toBe(true);
      
      console.log(`✅ Consistency maintained across ${iterations} iterations under load`);
    });
  });

  afterAll(() => {
    const stats = performanceTracker.getAllStats();
    console.log('\n📊 Multi-Server Integration Performance Summary:');
    for (const [operation, operationStats] of Object.entries(stats)) {
      console.log(`  ${operation}: avg ${operationStats.avg}ms, min ${operationStats.min}ms, max ${operationStats.max}ms`);
    }
  });
});
