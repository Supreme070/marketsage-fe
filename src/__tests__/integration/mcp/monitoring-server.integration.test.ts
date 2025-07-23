/**
 * Monitoring MCP Server Integration Tests
 * 
 * These tests verify the Monitoring MCP server works correctly with real monitoring
 * metrics, system health data, and business KPI tracking.
 */

import { describe, beforeAll, afterAll, beforeEach, test, expect } from '@jest/jest';
import { MonitoringMCPServer } from '../../../mcp/servers/monitoring-server';
import { 
  TestDatabaseManager, 
  testPrisma, 
  PerformanceTracker,
  testConfig
} from './setup';
import { MCPAuthContext } from '../../../mcp/types/mcp-types';

describe('Monitoring MCP Server Integration Tests', () => {
  let server: MonitoringMCPServer;
  let dbManager: TestDatabaseManager;
  let performanceTracker: PerformanceTracker;
  let authContext: MCPAuthContext;

  beforeAll(async () => {
    dbManager = TestDatabaseManager.getInstance();
    await dbManager.setup();
    
    performanceTracker = new PerformanceTracker();
    
    server = new MonitoringMCPServer({
      rateLimiting: {
        enabled: false
      }
    });
    
    authContext = {
      organizationId: 'test-org-1',
      userId: 'test-user-1',
      role: 'ADMIN',
      permissions: ['read:monitoring', 'read:metrics']
    };
  }, testConfig.timeouts.database);

  afterAll(async () => {
    await dbManager.teardown();
  });

  beforeEach(() => {
    performanceTracker.reset();
  });

  describe('Monitoring Metrics Data Integrity', () => {
    test('should verify monitoring metrics data structure and relationships', async () => {
      const metrics = await testPrisma.mCPMonitoringMetrics.findMany({
        include: {
          organization: true
        }
      });

      expect(metrics.length).toBeGreaterThan(0);
      
      let globalMetrics = 0;
      let orgSpecificMetrics = 0;
      
      for (const metric of metrics) {
        // Verify basic structure
        expect(metric.id).toBeDefined();
        expect(metric.category).toBeDefined();
        expect(metric.metricName).toBeDefined();
        expect(typeof metric.metricValue).toBe('number');
        expect(metric.unit).toBeDefined();
        expect(metric.timestamp).toBeInstanceOf(Date);
        
        // Verify categories
        const validCategories = ['business', 'system', 'security', 'infrastructure', 'system_overview'];
        expect(validCategories).toContain(metric.category);
        
        // Verify alert levels
        const validAlertLevels = ['info', 'warning', 'critical'];
        expect(validAlertLevels).toContain(metric.alertLevel);
        
        // Count global vs org-specific metrics
        if (metric.organizationId) {
          orgSpecificMetrics++;
          expect(metric.organization).toBeDefined();
        } else {
          globalMetrics++;
        }
        
        // Verify metadata structure
        if (metric.metadata) {
          const metadata = JSON.parse(metric.metadata as string);
          expect(typeof metadata).toBe('object');
        }
        
        // Verify tags structure
        if (metric.tags) {
          const tags = JSON.parse(metric.tags as string);
          expect(Array.isArray(tags)).toBe(true);
        }
      }
      
      expect(globalMetrics).toBeGreaterThan(0); // Should have global system metrics
      console.log(`✅ Verified ${metrics.length} monitoring metrics (${globalMetrics} global, ${orgSpecificMetrics} org-specific)`);
    });

    test('should validate comprehensive monitoring snapshot structure', async () => {
      // Find the comprehensive monitoring snapshot
      const snapshot = await testPrisma.mCPMonitoringMetrics.findFirst({
        where: {
          metricName: 'comprehensive_monitoring',
          category: 'system_overview'
        }
      });

      expect(snapshot).toBeDefined();
      expect(snapshot!.metadata).toBeDefined();
      
      const monitoringData = JSON.parse(snapshot!.metadata as string);
      
      // Verify main sections
      expect(monitoringData).toHaveProperty('business_metrics');
      expect(monitoringData).toHaveProperty('system_metrics');
      expect(monitoringData).toHaveProperty('security_metrics');
      expect(monitoringData).toHaveProperty('infrastructure_health');
      expect(monitoringData).toHaveProperty('alerts');
      expect(monitoringData).toHaveProperty('overall_health_score');
      
      // Verify business metrics
      const businessMetrics = monitoringData.business_metrics;
      expect(businessMetrics).toHaveProperty('total_users');
      expect(businessMetrics).toHaveProperty('total_organizations');
      expect(businessMetrics).toHaveProperty('total_contacts');
      expect(businessMetrics).toHaveProperty('total_campaigns');
      expect(businessMetrics).toHaveProperty('monthly_recurring_revenue');
      expect(businessMetrics).toHaveProperty('conversion_rate');
      
      // Verify system metrics
      const systemMetrics = monitoringData.system_metrics;
      expect(systemMetrics).toHaveProperty('avg_response_time');
      expect(systemMetrics).toHaveProperty('error_rate_percentage');
      expect(systemMetrics).toHaveProperty('cpu_usage_percentage');
      expect(systemMetrics).toHaveProperty('memory_usage_percentage');
      expect(systemMetrics).toHaveProperty('uptime_percentage');
      
      // Verify security metrics
      const securityMetrics = monitoringData.security_metrics;
      expect(securityMetrics).toHaveProperty('security_score');
      expect(securityMetrics).toHaveProperty('compliance_score');
      expect(securityMetrics).toHaveProperty('failed_login_attempts_today');
      
      // Verify infrastructure health
      const infraHealth = monitoringData.infrastructure_health;
      expect(Array.isArray(infraHealth)).toBe(true);
      for (const component of infraHealth) {
        expect(component).toHaveProperty('name');
        expect(component).toHaveProperty('type');
        expect(component).toHaveProperty('status');
        expect(component).toHaveProperty('health_score');
        expect(component).toHaveProperty('response_time_ms');
      }
      
      // Verify alerts
      const alerts = monitoringData.alerts;
      expect(Array.isArray(alerts)).toBe(true);
      for (const alert of alerts) {
        expect(alert).toHaveProperty('name');
        expect(alert).toHaveProperty('condition');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('threshold');
        expect(alert).toHaveProperty('current_value');
        expect(alert).toHaveProperty('is_triggered');
      }
      
      // Verify African market insights
      expect(monitoringData).toHaveProperty('market_insights');
      const marketInsights = monitoringData.market_insights;
      expect(marketInsights).toHaveProperty('mobile_vs_desktop_ratio');
      expect(marketInsights).toHaveProperty('whatsapp_adoption_rate');
      expect(marketInsights).toHaveProperty('currency_distribution');
      
      console.log('✅ Comprehensive monitoring snapshot structure validated');
    });
  });

  describe('System Health Monitoring', () => {
    test('should retrieve system health overview', async () => {
      performanceTracker.start();
      
      const result = await server.readResource(
        'monitoring://system-health',
        {
          organizationId: 'test-org-1'
        },
        authContext
      );
      
      const duration = performanceTracker.measure('systemHealth');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const data = result.data;
      expect(data).toHaveProperty('overallHealth');
      expect(data).toHaveProperty('components');
      expect(data).toHaveProperty('metrics');
      expect(data).toHaveProperty('alerts');
      
      // Verify overall health score
      expect(data.overallHealth.score).toBeGreaterThanOrEqual(0);
      expect(data.overallHealth.score).toBeLessThanOrEqual(100);
      expect(data.overallHealth.status).toBeDefined();
      
      // Verify components
      expect(Array.isArray(data.components)).toBe(true);
      for (const component of data.components) {
        expect(component).toHaveProperty('name');
        expect(component).toHaveProperty('status');
        expect(component).toHaveProperty('healthScore');
        expect(component).toHaveProperty('responseTime');
        expect(['healthy', 'degraded', 'unhealthy']).toContain(component.status);
      }
      
      // Verify metrics
      expect(data.metrics).toHaveProperty('responseTime');
      expect(data.metrics).toHaveProperty('errorRate');
      expect(data.metrics).toHaveProperty('throughput');
      expect(data.metrics).toHaveProperty('uptime');
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      console.log(`✅ Retrieved system health with ${data.components.length} components in ${duration}ms`);
    });

    test('should monitor business KPIs and metrics', async () => {
      performanceTracker.start();
      
      const result = await server.readResource(
        'monitoring://business-metrics',
        {
          organizationId: 'test-org-1',
          timeRange: 'last_30_days'
        },
        authContext
      );
      
      const duration = performanceTracker.measure('businessMetrics');
      
      expect(result.success).toBe(true);
      const data = result.data;
      
      expect(data).toHaveProperty('kpis');
      expect(data).toHaveProperty('growth');
      expect(data).toHaveProperty('conversion');
      expect(data).toHaveProperty('revenue');
      
      // Verify KPIs
      const kpis = data.kpis;
      expect(kpis).toHaveProperty('totalUsers');
      expect(kpis).toHaveProperty('activeUsers');
      expect(kpis).toHaveProperty('totalOrganizations');
      expect(kpis).toHaveProperty('totalCampaigns');
      expect(kpis.totalUsers).toBeGreaterThanOrEqual(0);
      expect(kpis.totalOrganizations).toBeGreaterThanOrEqual(0);
      
      // Verify growth metrics
      const growth = data.growth;
      expect(growth).toHaveProperty('userGrowthRate');
      expect(growth).toHaveProperty('revenueGrowthRate');
      expect(growth).toHaveProperty('churnRate');
      
      // Verify conversion metrics
      const conversion = data.conversion;
      expect(conversion).toHaveProperty('overallConversionRate');
      expect(conversion).toHaveProperty('emailConversionRate');
      expect(conversion).toHaveProperty('smsConversionRate');
      expect(conversion).toHaveProperty('whatsappConversionRate');
      
      // Verify revenue metrics
      const revenue = data.revenue;
      expect(revenue).toHaveProperty('monthlyRecurringRevenue');
      expect(revenue).toHaveProperty('revenuePerUser');
      expect(revenue).toHaveProperty('totalRevenue');
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      console.log(`✅ Retrieved business metrics in ${duration}ms`);
    });

    test('should track infrastructure component health', async () => {
      performanceTracker.start();
      
      const result = await server.readResource(
        'monitoring://infrastructure',
        {
          organizationId: 'test-org-1'
        },
        authContext
      );
      
      const duration = performanceTracker.measure('infrastructure');
      
      expect(result.success).toBe(true);
      const data = result.data;
      
      expect(data).toHaveProperty('components');
      expect(data).toHaveProperty('summary');
      expect(data).toHaveProperty('criticalServices');
      
      // Verify components
      expect(Array.isArray(data.components)).toBe(true);
      expect(data.components.length).toBeGreaterThan(0);
      
      for (const component of data.components) {
        expect(component).toHaveProperty('name');
        expect(component).toHaveProperty('type');
        expect(component).toHaveProperty('status');
        expect(component).toHaveProperty('healthScore');
        expect(component).toHaveProperty('responseTime');
        expect(component).toHaveProperty('criticality');
        
        // Verify valid statuses
        expect(['healthy', 'degraded', 'unhealthy']).toContain(component.status);
        
        // Verify health score range
        expect(component.healthScore).toBeGreaterThanOrEqual(0);
        expect(component.healthScore).toBeLessThanOrEqual(100);
        
        // Verify criticality levels
        expect(['critical', 'high', 'medium', 'low']).toContain(component.criticality);
      }
      
      // Verify summary
      expect(data.summary).toHaveProperty('totalComponents');
      expect(data.summary).toHaveProperty('healthyComponents');
      expect(data.summary).toHaveProperty('degradedComponents');
      expect(data.summary).toHaveProperty('unhealthyComponents');
      expect(data.summary).toHaveProperty('overallHealthPercentage');
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      console.log(`✅ Tracked ${data.components.length} infrastructure components in ${duration}ms`);
    });

    test('should provide security and compliance monitoring', async () => {
      performanceTracker.start();
      
      const result = await server.readResource(
        'monitoring://security',
        {
          organizationId: 'test-org-1'
        },
        authContext
      );
      
      const duration = performanceTracker.measure('security');
      
      expect(result.success).toBe(true);
      const data = result.data;
      
      expect(data).toHaveProperty('securityScore');
      expect(data).toHaveProperty('complianceScore');
      expect(data).toHaveProperty('threats');
      expect(data).toHaveProperty('vulnerabilities');
      expect(data).toHaveProperty('auditEvents');
      expect(data).toHaveProperty('gdprCompliance');
      
      // Verify security score
      expect(data.securityScore).toBeGreaterThanOrEqual(0);
      expect(data.securityScore).toBeLessThanOrEqual(100);
      
      // Verify compliance score
      expect(data.complianceScore).toBeGreaterThanOrEqual(0);
      expect(data.complianceScore).toBeLessThanOrEqual(100);
      
      // Verify threats
      expect(data.threats).toHaveProperty('failedLogins');
      expect(data.threats).toHaveProperty('suspiciousActivity');
      expect(data.threats).toHaveProperty('criticalEvents');
      
      // Verify vulnerabilities
      expect(data.vulnerabilities).toHaveProperty('critical');
      expect(data.vulnerabilities).toHaveProperty('high');
      expect(data.vulnerabilities).toHaveProperty('medium');
      expect(data.vulnerabilities).toHaveProperty('low');
      
      // Verify GDPR compliance
      expect(data.gdprCompliance).toHaveProperty('consentRate');
      expect(data.gdprCompliance).toHaveProperty('dataRequests');
      expect(data.gdprCompliance).toHaveProperty('deletionRequests');
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      console.log(`✅ Retrieved security monitoring in ${duration}ms`);
    });
  });

  describe('Alerting and Notifications', () => {
    test('should retrieve active alerts and warnings', async () => {
      performanceTracker.start();
      
      const result = await server.readResource(
        'monitoring://alerts',
        {
          organizationId: 'test-org-1',
          severity: 'all'
        },
        authContext
      );
      
      const duration = performanceTracker.measure('alerts');
      
      expect(result.success).toBe(true);
      const data = result.data;
      
      expect(data).toHaveProperty('activeAlerts');
      expect(data).toHaveProperty('alertSummary');
      expect(data).toHaveProperty('recentAlerts');
      
      // Verify active alerts structure
      expect(Array.isArray(data.activeAlerts)).toBe(true);
      for (const alert of data.activeAlerts) {
        expect(alert).toHaveProperty('id');
        expect(alert).toHaveProperty('name');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('condition');
        expect(alert).toHaveProperty('threshold');
        expect(alert).toHaveProperty('currentValue');
        expect(alert).toHaveProperty('isTriggered');
        expect(alert).toHaveProperty('description');
        
        // Verify severity levels
        expect(['info', 'warning', 'critical']).toContain(alert.severity);
      }
      
      // Verify alert summary
      expect(data.alertSummary).toHaveProperty('total');
      expect(data.alertSummary).toHaveProperty('critical');
      expect(data.alertSummary).toHaveProperty('warning');
      expect(data.alertSummary).toHaveProperty('info');
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      console.log(`✅ Retrieved ${data.activeAlerts.length} alerts in ${duration}ms`);
    });

    test('should filter alerts by severity level', async () => {
      const severityLevels = ['critical', 'warning', 'info'];
      
      for (const severity of severityLevels) {
        performanceTracker.start();
        
        const result = await server.readResource(
          'monitoring://alerts',
          {
            organizationId: 'test-org-1',
            severity: severity
          },
          authContext
        );
        
        const duration = performanceTracker.measure(`alerts_${severity}`);
        
        expect(result.success).toBe(true);
        const data = result.data;
        
        // Verify all returned alerts match the requested severity
        for (const alert of data.activeAlerts) {
          expect(alert.severity).toBe(severity);
        }
        
        expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      }
      
      console.log('✅ Validated alert filtering by severity levels');
    });
  });

  describe('Performance Metrics and Trends', () => {
    test('should provide performance trend analysis', async () => {
      performanceTracker.start();
      
      const result = await server.readResource(
        'monitoring://performance-trends',
        {
          organizationId: 'test-org-1',
          timeRange: 'last_24_hours'
        },
        authContext
      );
      
      const duration = performanceTracker.measure('performanceTrends');
      
      expect(result.success).toBe(true);
      const data = result.data;
      
      expect(data).toHaveProperty('responseTime');
      expect(data).toHaveProperty('errorRate');
      expect(data).toHaveProperty('throughput');
      expect(data).toHaveProperty('userActivity');
      expect(data).toHaveProperty('revenue');
      
      // Verify response time trend
      const responseTimeTrend = data.responseTime;
      expect(responseTimeTrend).toHaveProperty('current');
      expect(responseTimeTrend).toHaveProperty('trend');
      expect(responseTimeTrend).toHaveProperty('timeSeries');
      expect(Array.isArray(responseTimeTrend.timeSeries)).toBe(true);
      
      // Verify time series data points
      for (const point of responseTimeTrend.timeSeries) {
        expect(point).toHaveProperty('timestamp');
        expect(point).toHaveProperty('value');
        expect(typeof point.value).toBe('number');
      }
      
      // Verify error rate trend
      const errorRateTrend = data.errorRate;
      expect(errorRateTrend).toHaveProperty('current');
      expect(errorRateTrend).toHaveProperty('trend');
      expect(errorRateTrend.current).toBeGreaterThanOrEqual(0);
      expect(errorRateTrend.current).toBeLessThanOrEqual(100);
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      console.log(`✅ Analyzed performance trends in ${duration}ms`);
    });

    test('should calculate system capacity and utilization', async () => {
      performanceTracker.start();
      
      const result = await server.readResource(
        'monitoring://capacity',
        {
          organizationId: 'test-org-1'
        },
        authContext
      );
      
      const duration = performanceTracker.measure('capacity');
      
      expect(result.success).toBe(true);
      const data = result.data;
      
      expect(data).toHaveProperty('cpu');
      expect(data).toHaveProperty('memory');
      expect(data).toHaveProperty('storage');
      expect(data).toHaveProperty('database');
      expect(data).toHaveProperty('recommendations');
      
      // Verify CPU utilization
      expect(data.cpu).toHaveProperty('current');
      expect(data.cpu).toHaveProperty('average');
      expect(data.cpu).toHaveProperty('peak');
      expect(data.cpu.current).toBeGreaterThanOrEqual(0);
      expect(data.cpu.current).toBeLessThanOrEqual(100);
      
      // Verify memory utilization
      expect(data.memory).toHaveProperty('current');
      expect(data.memory).toHaveProperty('available');
      expect(data.memory).toHaveProperty('utilized');
      
      // Verify database metrics
      expect(data.database).toHaveProperty('connections');
      expect(data.database).toHaveProperty('queryTime');
      expect(data.database).toHaveProperty('cacheHitRate');
      
      // Verify recommendations
      expect(Array.isArray(data.recommendations)).toBe(true);
      for (const recommendation of data.recommendations) {
        expect(recommendation).toHaveProperty('type');
        expect(recommendation).toHaveProperty('priority');
        expect(recommendation).toHaveProperty('description');
        expect(recommendation).toHaveProperty('impact');
      }
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      console.log(`✅ Calculated system capacity in ${duration}ms`);
    });
  });

  describe('African Market Specific Monitoring', () => {
    test('should track African market-specific metrics', async () => {
      performanceTracker.start();
      
      const result = await server.readResource(
        'monitoring://african-market-insights',
        {
          organizationId: 'test-org-1'
        },
        authContext
      );
      
      const duration = performanceTracker.measure('africanMarketInsights');
      
      expect(result.success).toBe(true);
      const data = result.data;
      
      expect(data).toHaveProperty('mobileUsage');
      expect(data).toHaveProperty('whatsappPenetration');
      expect(data).toHaveProperty('smsReliability');
      expect(data).toHaveProperty('countriesServed');
      expect(data).toHaveProperty('peakUsageHours');
      expect(data).toHaveProperty('currencyDistribution');
      
      // Verify mobile usage (should be high for African market)
      expect(data.mobileUsage).toHaveProperty('percentage');
      expect(data.mobileUsage.percentage).toBeGreaterThan(70);
      
      // Verify WhatsApp penetration
      expect(data.whatsappPenetration).toHaveProperty('percentage');
      expect(data.whatsappPenetration.percentage).toBeGreaterThan(60);
      
      // Verify SMS reliability
      expect(data.smsReliability).toHaveProperty('percentage');
      expect(data.smsReliability.percentage).toBeGreaterThan(80);
      
      // Verify countries served
      expect(Array.isArray(data.countriesServed)).toBe(true);
      const expectedCountries = ['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Egypt'];
      const hasAfricanCountries = expectedCountries.some(country => 
        data.countriesServed.includes(country)
      );
      expect(hasAfricanCountries).toBe(true);
      
      // Verify peak usage hours (African time zones)
      expect(Array.isArray(data.peakUsageHours)).toBe(true);
      expect(data.peakUsageHours.length).toBeGreaterThan(0);
      
      // Verify currency distribution
      expect(data.currencyDistribution).toHaveProperty('NGN'); // Nigerian Naira
      expect(data.currencyDistribution).toHaveProperty('GHS'); // Ghanaian Cedi
      expect(data.currencyDistribution).toHaveProperty('KES'); // Kenyan Shilling
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime);
      console.log(`✅ Retrieved African market insights in ${duration}ms`);
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle monitoring dashboard queries efficiently', async () => {
      const dashboardQueries = [
        'monitoring://system-health',
        'monitoring://business-metrics',
        'monitoring://infrastructure',
        'monitoring://security',
        'monitoring://alerts'
      ];
      
      performanceTracker.start();
      
      const promises = dashboardQueries.map(query => 
        server.readResource(
          query,
          { organizationId: 'test-org-1' },
          authContext
        )
      );
      
      const results = await Promise.all(promises);
      const duration = performanceTracker.measure('dashboardQueries');
      
      // Verify all queries succeeded
      for (const result of results) {
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      }
      
      expect(duration).toBeLessThan(testConfig.performance.maxResponseTime * 3);
      console.log(`✅ Executed ${dashboardQueries.length} dashboard queries in ${duration}ms`);
    });

    test('should validate monitoring query performance', async () => {
      const startTime = Date.now();
      
      // Complex monitoring query with aggregations
      const metrics = await testPrisma.mCPMonitoringMetrics.groupBy({
        by: ['category', 'alertLevel'],
        _count: { id: true },
        _avg: { metricValue: true },
        where: {
          isActive: true,
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      });
      
      const queryDuration = Date.now() - startTime;
      
      expect(metrics.length).toBeGreaterThan(0);
      expect(queryDuration).toBeLessThan(testConfig.performance.maxQueryTime);
      
      console.log(`✅ Complex monitoring query: ${metrics.length} metric groups in ${queryDuration}ms`);
    });
  });

  describe('Data Accuracy and Validation', () => {
    test('should validate calculated business metrics against database', async () => {
      // Get MCP server calculations
      const serverResult = await server.readResource(
        'monitoring://business-metrics',
        { organizationId: 'test-org-1' },
        authContext
      );
      
      // Get actual database counts
      const dbCounts = await dbManager.getDataCounts();
      
      expect(serverResult.success).toBe(true);
      const serverData = serverResult.data;
      
      // Verify user counts match
      expect(serverData.kpis.totalUsers).toBe(dbCounts.users);
      expect(serverData.kpis.totalOrganizations).toBe(dbCounts.organizations);
      
      // Verify campaign counts
      const totalCampaigns = dbCounts.emailCampaigns + dbCounts.smsCampaigns + dbCounts.whatsappCampaigns;
      expect(serverData.kpis.totalCampaigns).toBe(totalCampaigns);
      
      console.log('✅ Business metrics validated against database');
    });

    test('should ensure health scores are within valid ranges', async () => {
      const result = await server.readResource(
        'monitoring://system-health',
        { organizationId: 'test-org-1' },
        authContext
      );
      
      expect(result.success).toBe(true);
      const data = result.data;
      
      // Verify overall health score
      expect(data.overallHealth.score).toBeGreaterThanOrEqual(0);
      expect(data.overallHealth.score).toBeLessThanOrEqual(100);
      
      // Verify component health scores
      for (const component of data.components) {
        expect(component.healthScore).toBeGreaterThanOrEqual(0);
        expect(component.healthScore).toBeLessThanOrEqual(100);
        
        // Response time should be positive
        expect(component.responseTime).toBeGreaterThan(0);
      }
      
      console.log('✅ Health scores validated within proper ranges');
    });
  });

  afterAll(() => {
    const stats = performanceTracker.getAllStats();
    console.log('\n📊 Monitoring Server Performance Summary:');
    for (const [operation, operationStats] of Object.entries(stats)) {
      console.log(`  ${operation}: avg ${operationStats.avg}ms, min ${operationStats.min}ms, max ${operationStats.max}ms`);
    }
  });
});
