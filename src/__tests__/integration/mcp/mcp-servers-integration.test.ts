/**
 * MCP Servers Integration Tests
 * 
 * Tests actual MCP server implementations against real seeded data
 * to verify end-to-end functionality and performance.
 */

import { describe, beforeAll, afterAll, beforeEach, test, expect } from '@jest/test';
import { TestDatabaseManager, testPrisma, PerformanceTracker, testConfig } from './setup';

// Import MCP server implementations
import { CampaignAnalyticsServer } from '../../../mcp/servers/campaign-analytics-server';
import { CustomerDataServer } from '../../../mcp/servers/customer-data-server';
import { LeadPulseServer } from '../../../mcp/servers/leadpulse-server';
import { MonitoringServer } from '../../../mcp/servers/monitoring-server';

describe('MCP Servers Integration Tests', () => {
  let dbManager: TestDatabaseManager;
  let performanceTracker: PerformanceTracker;
  
  // MCP Server instances
  let campaignServer: CampaignAnalyticsServer;
  let customerServer: CustomerDataServer;
  let leadpulseServer: LeadPulseServer;
  let monitoringServer: MonitoringServer;

  beforeAll(async () => {
    dbManager = TestDatabaseManager.getInstance();
    await dbManager.setup();
    performanceTracker = new PerformanceTracker();

    // Initialize MCP servers with test database
    campaignServer = new CampaignAnalyticsServer({ database: testPrisma });
    customerServer = new CustomerDataServer({ database: testPrisma });
    leadpulseServer = new LeadPulseServer({ database: testPrisma });
    monitoringServer = new MonitoringServer({ database: testPrisma });

    // Start all servers
    await Promise.all([
      campaignServer.start(),
      customerServer.start(),
      leadpulseServer.start(),
      monitoringServer.start()
    ]);
  }, testConfig.timeouts.integration);

  afterAll(async () => {
    // Stop all servers
    await Promise.all([
      campaignServer.stop(),
      customerServer.stop(),
      leadpulseServer.stop(),
      monitoringServer.stop()
    ]);
    
    await dbManager.teardown();
  }, testConfig.timeouts.database);

  beforeEach(async () => {
    performanceTracker.reset();
  });

  describe('Campaign Analytics Server', () => {
    test('should retrieve campaign metrics with real data', async () => {
      performanceTracker.start();
      
      const result = await campaignServer.handleRequest({
        method: 'tools/call',
        params: {
          name: 'get_campaign_metrics',
          arguments: {
            organizationId: 'test-org-1',
            campaignType: 'EMAIL',
            limit: 10
          }
        }
      });
      
      const duration = performanceTracker.measure('campaign_metrics_mcp');
      
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      
      // Verify data structure
      const metrics = result.content[0];
      expect(metrics).toHaveProperty('campaignId');
      expect(metrics).toHaveProperty('campaignName');
      expect(metrics).toHaveProperty('sent');
      expect(metrics).toHaveProperty('delivered');
      expect(metrics).toHaveProperty('openRate');
      expect(metrics).toHaveProperty('clickRate');
      expect(metrics).toHaveProperty('conversionRate');
      
      console.log(`📧 Campaign metrics MCP: ${duration}ms`);
    });

    test('should calculate campaign performance analytics', async () => {
      performanceTracker.start();
      
      const result = await campaignServer.handleRequest({
        method: 'tools/call',
        params: {
          name: 'calculate_campaign_performance',
          arguments: {
            organizationId: 'test-org-1',
            timeRange: '30d'
          }
        }
      });
      
      const duration = performanceTracker.measure('campaign_performance_analytics');
      
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content).toHaveProperty('totalCampaigns');
      expect(result.content).toHaveProperty('avgOpenRate');
      expect(result.content).toHaveProperty('avgClickRate');
      expect(result.content).toHaveProperty('avgConversionRate');
      expect(result.content).toHaveProperty('totalRevenue');
      expect(result.content).toHaveProperty('avgROI');
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      
      console.log(`📊 Campaign performance analytics: ${duration}ms`);
    });

    test('should retrieve A/B test results from real data', async () => {
      performanceTracker.start();
      
      const result = await campaignServer.handleRequest({
        method: 'tools/call',
        params: {
          name: 'get_ab_test_results',
          arguments: {
            organizationId: 'test-org-1'
          }
        }
      });
      
      const duration = performanceTracker.measure('ab_test_results');
      
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      
      // If A/B tests exist, verify structure
      if (result.content.length > 0) {
        const abTest = result.content[0];
        expect(abTest).toHaveProperty('testType');
        expect(abTest).toHaveProperty('variants');
        expect(abTest).toHaveProperty('winnerVariant');
        expect(Array.isArray(abTest.variants)).toBe(true);
      }
      
      console.log(`🧪 A/B test results: ${duration}ms`);
    });
  });

  describe('Customer Data Server', () => {
    test('should retrieve customer predictions with real data', async () => {
      performanceTracker.start();
      
      const result = await customerServer.handleRequest({
        method: 'tools/call',
        params: {
          name: 'get_customer_predictions',
          arguments: {
            organizationId: 'test-org-1',
            limit: 10
          }
        }
      });
      
      const duration = performanceTracker.measure('customer_predictions_mcp');
      
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      
      // Verify data structure
      const prediction = result.content[0];
      expect(prediction).toHaveProperty('contactId');
      expect(prediction).toHaveProperty('churnRisk');
      expect(prediction).toHaveProperty('lifetimeValue');
      expect(prediction).toHaveProperty('engagementScore');
      expect(prediction).toHaveProperty('segment');
      expect(prediction).toHaveProperty('preferredChannel');
      
      console.log(`🎯 Customer predictions MCP: ${duration}ms`);
    });

    test('should analyze customer segments', async () => {
      performanceTracker.start();
      
      const result = await customerServer.handleRequest({
        method: 'tools/call',
        params: {
          name: 'analyze_customer_segments',
          arguments: {
            organizationId: 'test-org-1'
          }
        }
      });
      
      const duration = performanceTracker.measure('customer_segments_analysis');
      
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content).toHaveProperty('segments');
      expect(Array.isArray(result.content.segments)).toBe(true);
      expect(result.content.segments.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      
      // Verify segment structure
      const segment = result.content.segments[0];
      expect(segment).toHaveProperty('name');
      expect(segment).toHaveProperty('count');
      expect(segment).toHaveProperty('avgChurnRisk');
      expect(segment).toHaveProperty('avgLifetimeValue');
      expect(segment).toHaveProperty('avgEngagementScore');
      
      console.log(`📊 Customer segments analysis: ${duration}ms`);
    });

    test('should identify high-risk customers', async () => {
      performanceTracker.start();
      
      const result = await customerServer.handleRequest({
        method: 'tools/call',
        params: {
          name: 'get_high_risk_customers',
          arguments: {
            organizationId: 'test-org-1',
            riskThreshold: 70,
            limit: 20
          }
        }
      });
      
      const duration = performanceTracker.measure('high_risk_customers');
      
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      
      // Verify high-risk customers have churn risk > threshold
      result.content.forEach((customer: any) => {
        expect(customer.churnRisk).toBeGreaterThan(70);
        expect(customer).toHaveProperty('contactId');
        expect(customer).toHaveProperty('nextBestAction');
      });
      
      console.log(`⚠️ High-risk customers: ${duration}ms, found ${result.content.length} customers`);
    });
  });

  describe('LeadPulse Server', () => {
    test('should retrieve visitor sessions with real data', async () => {
      performanceTracker.start();
      
      const result = await leadpulseServer.handleRequest({
        method: 'tools/call',
        params: {
          name: 'get_visitor_sessions',
          arguments: {
            organizationId: 'test-org-1',
            timeRange: '7d',
            limit: 50
          }
        }
      });
      
      const duration = performanceTracker.measure('visitor_sessions_mcp');
      
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      
      // Verify data structure
      const session = result.content[0];
      expect(session).toHaveProperty('sessionId');
      expect(session).toHaveProperty('visitorId');
      expect(session).toHaveProperty('pageViews');
      expect(session).toHaveProperty('sessionDuration');
      expect(session).toHaveProperty('country');
      expect(session).toHaveProperty('device');
      expect(session).toHaveProperty('browser');
      
      console.log(`👤 Visitor sessions MCP: ${duration}ms`);
    });

    test('should analyze visitor behavior patterns', async () => {
      performanceTracker.start();
      
      const result = await leadpulseServer.handleRequest({
        method: 'tools/call',
        params: {
          name: 'analyze_visitor_behavior',
          arguments: {
            organizationId: 'test-org-1',
            timeRange: '30d'
          }
        }
      });
      
      const duration = performanceTracker.measure('visitor_behavior_analysis');
      
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content).toHaveProperty('totalSessions');
      expect(result.content).toHaveProperty('uniqueVisitors');
      expect(result.content).toHaveProperty('avgSessionDuration');
      expect(result.content).toHaveProperty('avgPageViews');
      expect(result.content).toHaveProperty('topCountries');
      expect(result.content).toHaveProperty('deviceBreakdown');
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      
      console.log(`📈 Visitor behavior analysis: ${duration}ms`);
    });

    test('should track conversion funnels', async () => {
      performanceTracker.start();
      
      const result = await leadpulseServer.handleRequest({
        method: 'tools/call',
        params: {
          name: 'get_conversion_funnel',
          arguments: {
            organizationId: 'test-org-1',
            funnelType: 'signup'
          }
        }
      });
      
      const duration = performanceTracker.measure('conversion_funnel');
      
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content).toHaveProperty('steps');
      expect(Array.isArray(result.content.steps)).toBe(true);
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      
      console.log(`🎯 Conversion funnel: ${duration}ms`);
    });
  });

  describe('Monitoring Server', () => {
    test('should retrieve monitoring metrics with real data', async () => {
      performanceTracker.start();
      
      const result = await monitoringServer.handleRequest({
        method: 'tools/call',
        params: {
          name: 'get_monitoring_metrics',
          arguments: {
            organizationId: 'test-org-1',
            metricType: 'api_response_time',
            timeRange: '1h',
            limit: 100
          }
        }
      });
      
      const duration = performanceTracker.measure('monitoring_metrics_mcp');
      
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      
      // Verify data structure
      const metric = result.content[0];
      expect(metric).toHaveProperty('metricType');
      expect(metric).toHaveProperty('value');
      expect(metric).toHaveProperty('timestamp');
      
      console.log(`📊 Monitoring metrics MCP: ${duration}ms`);
    });

    test('should calculate system health metrics', async () => {
      performanceTracker.start();
      
      const result = await monitoringServer.handleRequest({
        method: 'tools/call',
        params: {
          name: 'calculate_system_health',
          arguments: {
            organizationId: 'test-org-1',
            timeRange: '1h'
          }
        }
      });
      
      const duration = performanceTracker.measure('system_health_calculation');
      
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content).toHaveProperty('overallHealth');
      expect(result.content).toHaveProperty('metrics');
      expect(typeof result.content.overallHealth).toBe('number');
      expect(result.content.overallHealth).toBeGreaterThanOrEqual(0);
      expect(result.content.overallHealth).toBeLessThanOrEqual(100);
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      
      console.log(`🏥 System health calculation: ${duration}ms`);
    });

    test('should detect performance anomalies', async () => {
      performanceTracker.start();
      
      const result = await monitoringServer.handleRequest({
        method: 'tools/call',
        params: {
          name: 'detect_anomalies',
          arguments: {
            organizationId: 'test-org-1',
            metricType: 'api_response_time',
            timeRange: '24h'
          }
        }
      });
      
      const duration = performanceTracker.measure('anomaly_detection');
      
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content).toHaveProperty('anomalies');
      expect(Array.isArray(result.content.anomalies)).toBe(true);
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      
      console.log(`🔍 Anomaly detection: ${duration}ms`);
    });
  });

  describe('Multi-Server Integration Tests', () => {
    test('should coordinate customer insights across servers', async () => {
      performanceTracker.start();
      
      // Get customer predictions from customer server
      const predictions = await customerServer.handleRequest({
        method: 'tools/call',
        params: {
          name: 'get_customer_predictions',
          arguments: {
            organizationId: 'test-org-1',
            limit: 5
          }
        }
      });
      
      // Get campaign metrics for these customers
      const campaignMetrics = await campaignServer.handleRequest({
        method: 'tools/call',
        params: {
          name: 'get_campaign_metrics',
          arguments: {
            organizationId: 'test-org-1',
            limit: 10
          }
        }
      });
      
      // Get visitor behavior for context
      const visitorBehavior = await leadpulseServer.handleRequest({
        method: 'tools/call',
        params: {
          name: 'analyze_visitor_behavior',
          arguments: {
            organizationId: 'test-org-1',
            timeRange: '7d'
          }
        }
      });
      
      const duration = performanceTracker.measure('multi_server_coordination');
      
      expect(predictions.content.length).toBeGreaterThan(0);
      expect(campaignMetrics.content.length).toBeGreaterThan(0);
      expect(visitorBehavior.content).toBeDefined();
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime * 2);
      
      console.log(`🔗 Multi-server coordination: ${duration}ms`);
    });

    test('should validate data consistency across servers', async () => {
      // Get organization data from different servers
      const campaignOrgData = await campaignServer.handleRequest({
        method: 'tools/call',
        params: {
          name: 'get_organization_summary',
          arguments: {
            organizationId: 'test-org-1'
          }
        }
      });
      
      const customerOrgData = await customerServer.handleRequest({
        method: 'tools/call',
        params: {
          name: 'get_organization_summary',
          arguments: {
            organizationId: 'test-org-1'
          }
        }
      });
      
      // Verify consistency
      expect(campaignOrgData.content.organizationId).toBe(customerOrgData.content.organizationId);
      expect(campaignOrgData.content.organizationName).toBe(customerOrgData.content.organizationName);
      
      console.log('✅ Data consistency verified across servers');
    });

    test('should handle concurrent requests across servers', async () => {
      const concurrentRequests = await Promise.all([
        campaignServer.handleRequest({
          method: 'tools/call',
          params: {
            name: 'get_campaign_metrics',
            arguments: { organizationId: 'test-org-1', limit: 5 }
          }
        }),
        customerServer.handleRequest({
          method: 'tools/call',
          params: {
            name: 'get_customer_predictions',
            arguments: { organizationId: 'test-org-1', limit: 5 }
          }
        }),
        leadpulseServer.handleRequest({
          method: 'tools/call',
          params: {
            name: 'get_visitor_sessions',
            arguments: { organizationId: 'test-org-1', limit: 5 }
          }
        }),
        monitoringServer.handleRequest({
          method: 'tools/call',
          params: {
            name: 'get_monitoring_metrics',
            arguments: { organizationId: 'test-org-1', metricType: 'api_response_time', limit: 5 }
          }
        })
      ]);
      
      concurrentRequests.forEach((result, index) => {
        expect(result).toBeDefined();
        expect(result.content).toBeDefined();
      });
      
      console.log('🚀 Concurrent requests across all servers successful');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid organization IDs gracefully', async () => {
      const result = await campaignServer.handleRequest({
        method: 'tools/call',
        params: {
          name: 'get_campaign_metrics',
          arguments: {
            organizationId: 'non-existent-org',
            limit: 10
          }
        }
      });
      
      expect(result).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content.length).toBe(0);
    });

    test('should handle large data requests efficiently', async () => {
      performanceTracker.start();
      
      const result = await leadpulseServer.handleRequest({
        method: 'tools/call',
        params: {
          name: 'get_visitor_sessions',
          arguments: {
            organizationId: 'test-org-1',
            timeRange: '30d',
            limit: 1000
          }
        }
      });
      
      const duration = performanceTracker.measure('large_data_request');
      
      expect(result).toBeDefined();
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime * 3); // Allow more time for large requests
      
      console.log(`📊 Large data request: ${duration}ms`);
    });

    test('should handle malformed requests gracefully', async () => {
      try {
        await campaignServer.handleRequest({
          method: 'tools/call',
          params: {
            name: 'get_campaign_metrics',
            arguments: {
              // Missing required organizationId
              limit: 10
            }
          }
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toContain('organizationId');
      }
    });
  });

  describe('Performance Benchmarks', () => {
    test('should meet performance benchmarks for all servers', async () => {
      const benchmarks = [
        {
          name: 'Campaign Analytics',
          server: campaignServer,
          request: {
            method: 'tools/call',
            params: {
              name: 'get_campaign_metrics',
              arguments: { organizationId: 'test-org-1', limit: 50 }
            }
          }
        },
        {
          name: 'Customer Data',
          server: customerServer,
          request: {
            method: 'tools/call',
            params: {
              name: 'get_customer_predictions',
              arguments: { organizationId: 'test-org-1', limit: 50 }
            }
          }
        },
        {
          name: 'LeadPulse',
          server: leadpulseServer,
          request: {
            method: 'tools/call',
            params: {
              name: 'get_visitor_sessions',
              arguments: { organizationId: 'test-org-1', timeRange: '7d', limit: 50 }
            }
          }
        },
        {
          name: 'Monitoring',
          server: monitoringServer,
          request: {
            method: 'tools/call',
            params: {
              name: 'get_monitoring_metrics',
              arguments: { organizationId: 'test-org-1', metricType: 'api_response_time', limit: 50 }
            }
          }
        }
      ];
      
      for (const benchmark of benchmarks) {
        performanceTracker.start();
        
        const result = await benchmark.server.handleRequest(benchmark.request);
        
        const duration = performanceTracker.measure(`${benchmark.name}_benchmark`);
        
        expect(result).toBeDefined();
        expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
        
        console.log(`⚡ ${benchmark.name} benchmark: ${duration}ms`);
      }
    });
  });

  describe('Final Performance Report', () => {
    test('should generate comprehensive performance report', async () => {
      const allStats = performanceTracker.getAllStats();
      
      console.log('\n📊 MCP Servers Integration Test Performance Report:');
      console.log('==================================================');
      
      Object.entries(allStats).forEach(([operation, stats]) => {
        console.log(`${operation}:`);
        console.log(`  Average: ${stats.avg.toFixed(2)}ms`);
        console.log(`  Min: ${stats.min}ms`);
        console.log(`  Max: ${stats.max}ms`);
        console.log(`  Count: ${stats.count}`);
        console.log('');
      });
      
      // Calculate overall metrics
      const allDurations = Object.values(allStats).flatMap(stat => 
        Array(stat.count).fill(stat.avg)
      );
      const overallAvg = allDurations.reduce((sum, val) => sum + val, 0) / allDurations.length;
      
      console.log(`📈 Overall Average Response Time: ${overallAvg.toFixed(2)}ms`);
      console.log(`🎯 Performance Target: ${testConfig.performance.maxResponseTime}ms`);
      console.log(`✅ Performance Status: ${overallAvg < testConfig.performance.maxResponseTime ? 'PASSED' : 'FAILED'}`);
      
      expect(overallAvg).toBeLessThan(testConfig.performance.maxResponseTime);
    });
  });
});