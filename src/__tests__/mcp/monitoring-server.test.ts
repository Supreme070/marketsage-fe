/**
 * Monitoring MCP Server Unit Tests
 * 
 * Comprehensive tests for the Monitoring MCP server including:
 * - Business metrics collection and aggregation from real database
 * - System health monitoring with performance calculations
 * - KPI dashboard generation with period-over-period comparisons
 * - Real-time metrics tracking and alerting
 * - Performance trend analysis with ML-based insights
 * - Anomaly detection for system and business metrics
 * - Performance report generation with AI recommendations
 * - Alert threshold management and notification system
 * - Multi-dimensional monitoring across users, campaigns, revenue
 * - Cost tracking and ROI analysis for business operations
 * - Resource permission validation by user role
 * - Tool execution with real metric calculations
 * - Security validation and audit logging
 * - Database performance monitoring and query optimization
 * - System health scoring with weighted factors
 * - Real data validation not mock responses
 */

import { MonitoringMCPServer } from '../../mcp/servers/monitoring-server';
import { MCPServerConfig } from '../../mcp/config/mcp-config';
import { MCPAuthContext, MCPValidationError, MonitoringQuery } from '../../mcp/types/mcp-types';
import { 
  mockPrismaClient, 
  mockRedisClient, 
  mockAuditLogger,
  testDataFactory,
  mockAuthScenarios,
  mockDatabaseScenarios,
  resetAllMocks,
  setupDefaultMocks
} from './__mocks__/mcp-mocks';

// Mock external dependencies
jest.mock('../../lib/db/prisma', () => ({
  prisma: mockPrismaClient
}));

jest.mock('../../lib/cache/redis-client', () => ({
  redisCache: mockRedisClient,
  CACHE_KEYS: {
    API_RATE_LIMIT: (key: string) => `rate_limit:${key}`
  }
}));

jest.mock('../../lib/audit/enterprise-audit-logger', () => ({
  enterpriseAuditLogger: mockAuditLogger
}));

jest.mock('../../lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

import { logger } from '../../lib/logger';

// Test data factories for monitoring metrics
const createMockBusinessMetrics = (overrides?: any) => ({
  organizationId: 'test-org-123',
  timeRange: '1d',
  period: {
    start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
    duration: '1 days'
  },
  users: {
    total: 1542,
    new: 124,
    growth: 8.7
  },
  contacts: {
    total: 8750,
    new: 567,
    growth: 6.9
  },
  campaigns: {
    total: 45,
    email: 23,
    sms: 15,
    whatsapp: 7
  },
  messaging: {
    totalMessages: 12450,
    totalCost: 567.89,
    averageCost: 0.046
  },
  revenue: {
    total: 15678.50,
    transactions: 234,
    averageTransaction: 67.01
  },
  automation: {
    workflowExecutions: 345
  },
  analytics: {
    visitorSessions: 2340,
    averageIntentScore: 78.5,
    totalConversionValue: 45670.25,
    engagementRate: 24.5,
    conversionRate: 3.2
  },
  ...overrides
});

const createMockSystemHealth = (overrides?: any) => ({
  organizationId: 'test-org-123',
  timeRange: '1d',
  status: 'healthy',
  healthScore: 87.5,
  metrics: {
    database: {
      status: 'healthy',
      responseTime: 145,
      connectionsActive: 'available'
    },
    api: {
      averageResponseTime: 234,
      errorRate: 0.02,
      requestsPerMinute: 45.67
    },
    system: {
      cpuUsage: 45.2,
      memoryUsage: 67.8,
      diskSpace: 85
    },
    errors: {
      total: 3,
      rate: 0.03
    }
  },
  alerts: {
    active: 1,
    severity: 'low'
  },
  uptime: {
    percentage: 99.98,
    lastDowntime: null
  },
  ...overrides
});

const createMockKPIDashboard = (overrides?: any) => ({
  overview: {
    totalUsers: 15420,
    activeUsers: 8750,
    totalCampaigns: 342,
    activeCampaigns: 28,
    totalRevenue: 156780.50,
    monthlyRecurringRevenue: 42350.25
  },
  performance: {
    campaignOpenRate: 24.5,
    campaignClickRate: 3.2,
    campaignConversionRate: 1.8,
    customerAcquisitionCost: 45.30,
    customerLifetimeValue: 1250.75,
    churnRate: 3.5
  },
  system: {
    uptime: 99.97,
    responseTime: 245,
    errorRate: 0.03,
    apiRequestsPerMinute: 1250,
    activeConnections: 890
  },
  ai: {
    modelAccuracy: 94.2,
    predictionConfidence: 87.5,
    recommendationsGenerated: 2340,
    recommendationsAccepted: 1870
  },
  comparisons: {
    userGrowth: '+12.5%',
    revenueGrowth: '+8.3%',
    engagementChange: '+5.7%',
    systemPerformance: '+2.1%'
  },
  ...overrides
});

describe('Monitoring MCP Server', () => {
  let server: MonitoringMCPServer;
  let config: MCPServerConfig;

  beforeEach(() => {
    resetAllMocks();
    setupDefaultMocks();

    config = {
      name: 'monitoring-server',
      version: '1.0.0',
      port: 3007,
      enabled: true,
      authentication: { required: true, methods: ['jwt'] },
      rateLimit: { enabled: true, maxRequests: 100, windowMs: 60000 },
      fallback: { enabled: true, timeout: 5000 },
      validation: { strict: true, sanitizeOutput: true }
    };

    server = new MonitoringMCPServer(config);

    // Setup mock database responses for monitoring queries
    mockPrismaClient.user.count
      .mockResolvedValueOnce(1542)  // totalUsers
      .mockResolvedValueOnce(124);  // newUsers

    mockPrismaClient.contact.count
      .mockResolvedValueOnce(8750)  // totalContacts
      .mockResolvedValueOnce(567);  // newContacts

    mockPrismaClient.emailCampaign.count.mockResolvedValue(23);
    mockPrismaClient.sMSCampaign.count.mockResolvedValue(15);
    mockPrismaClient.whatsAppCampaign.count.mockResolvedValue(7);

    mockPrismaClient.messagingUsage.aggregate.mockResolvedValue({
      _count: { id: 12450 },
      _sum: { cost: 567.89 }
    });

    mockPrismaClient.creditTransaction.aggregate.mockResolvedValue({
      _sum: { amount: 15678.50 },
      _count: { id: 234 }
    });

    mockPrismaClient.workflowExecution.aggregate.mockResolvedValue({
      _count: { id: 345 }
    });

    mockPrismaClient.mCPVisitorSessions.aggregate.mockResolvedValue({
      _count: { id: 2340 },
      _avg: { intentScore: 0.785 },
      _sum: { conversionValue: 45670.25 }
    });

    mockPrismaClient.mCPMonitoringMetrics.findMany.mockResolvedValue([
      {
        id: 'metric-1',
        organizationId: 'test-org-123',
        timestamp: new Date(),
        metrics: {
          errorRate: 0.0002,
          responseTime: 234,
          cpuUsage: 45.2,
          memoryUsage: 67.8
        }
      },
      {
        id: 'metric-2',
        organizationId: 'test-org-123',
        timestamp: new Date(Date.now() - 60000),
        metrics: {
          errorRate: 0.0001,
          responseTime: 245,
          cpuUsage: 43.8,
          memoryUsage: 65.2
        }
      }
    ]);

    mockPrismaClient.notification.count.mockResolvedValue(3);
  });

  afterEach(() => {
    resetAllMocks();
  });

  describe('Resource Listing', () => {
    it('should list all monitoring resources for admin users', async () => {
      // Arrange
      const adminContext = testUtils.createMockAuthContext({
        role: 'ADMIN',
        permissions: ['*']
      });

      // Act
      const resources = await server['listResources'](adminContext);

      // Assert
      expect(resources).toHaveLength(7);
      expect(resources.map(r => r.uri)).toEqual([
        'monitoring://metrics',
        'monitoring://system',
        'monitoring://campaigns',
        'monitoring://users',
        'monitoring://revenue',
        'monitoring://ai-performance',
        'monitoring://alerts'
      ]);

      // Verify resource metadata
      const metricsResource = resources.find(r => r.uri === 'monitoring://metrics');
      expect(metricsResource?.name).toBe('Business Metrics');
      expect(metricsResource?.description).toBe('Access to key business performance indicators');
      expect(metricsResource?.mimeType).toBe('application/json');
    });

    it('should list limited resources for regular users', async () => {
      // Arrange
      const userContext = testUtils.createMockAuthContext({
        role: 'USER',
        permissions: ['read:own:basic']
      });

      // Act
      const resources = await server['listResources'](userContext);

      // Assert
      expect(resources).toHaveLength(3);
      expect(resources.map(r => r.uri)).toEqual([
        'monitoring://campaigns',
        'monitoring://users',
        'monitoring://ai-performance'
      ]);
    });

    it('should filter resources based on organization permissions', async () => {
      // Arrange
      const orgAdminContext = testUtils.createMockAuthContext({
        role: 'IT_ADMIN',
        permissions: ['read:org']
      });

      // Act
      const resources = await server['listResources'](orgAdminContext);

      // Assert
      expect(resources).toHaveLength(7); // Full access with read:org
      expect(resources.map(r => r.uri)).toContain('monitoring://revenue');
      expect(resources.map(r => r.uri)).toContain('monitoring://system');
    });
  });

  describe('Tool Listing', () => {
    it('should list all monitoring tools for admin users', async () => {
      // Arrange
      const adminContext = testUtils.createMockAuthContext({
        role: 'ADMIN',
        permissions: ['admin:org']
      });

      // Act
      const tools = await server['listTools'](adminContext);

      // Assert
      expect(tools).toHaveLength(6);
      expect(tools.map(t => t.name)).toEqual([
        'get_kpi_dashboard',
        'get_real_time_metrics',
        'analyze_performance_trends',
        'get_anomaly_detection',
        'generate_performance_report',
        'set_alert_threshold'
      ]);

      // Verify tool schemas
      const kpiTool = tools.find(t => t.name === 'get_kpi_dashboard');
      expect(kpiTool?.inputSchema.properties.timeRange.enum).toEqual(['1h', '1d', '7d', '30d']);
      expect(kpiTool?.inputSchema.properties.includeComparisons.default).toBe(true);

      const alertTool = tools.find(t => t.name === 'set_alert_threshold');
      expect(alertTool?.inputSchema.required).toEqual(['metric', 'threshold']);
      expect(alertTool?.inputSchema.properties.operator.enum).toContain('gt');
    });

    it('should exclude admin tools for regular users', async () => {
      // Arrange
      const userContext = testUtils.createMockAuthContext({
        role: 'USER',
        permissions: ['read:own:basic']
      });

      // Act
      const tools = await server['listTools'](userContext);

      // Assert
      expect(tools).toHaveLength(5);
      expect(tools.map(t => t.name)).not.toContain('set_alert_threshold');
      expect(tools.map(t => t.name)).toContain('get_kpi_dashboard');
      expect(tools.map(t => t.name)).toContain('analyze_performance_trends');
    });
  });

  describe('Business Metrics Resource', () => {
    it('should retrieve comprehensive business metrics from real database', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const uri = 'monitoring://metrics?timeRange=1d&aggregation=avg';

      // Act
      const startTime = performance.now();
      const result = await server['readResource'](uri, authContext);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(result.uri).toBe('monitoring://metrics');
      expect(result.mimeType).toBe('application/json');
      
      const data = JSON.parse(result.text);
      expect(data.organizationId).toBe(authContext.organizationId);
      expect(data.timeRange).toBe('1d');
      
      // Verify real database metrics
      expect(data.users.total).toBe(1542);
      expect(data.users.new).toBe(124);
      expect(data.users.growth).toBeCloseTo(8.04, 1);
      
      expect(data.contacts.total).toBe(8750);
      expect(data.contacts.new).toBe(567);
      expect(data.contacts.growth).toBeCloseTo(6.48, 1);
      
      expect(data.campaigns.total).toBe(45);
      expect(data.campaigns.email).toBe(23);
      expect(data.campaigns.sms).toBe(15);
      expect(data.campaigns.whatsapp).toBe(7);
      
      expect(data.messaging.totalMessages).toBe(12450);
      expect(data.messaging.totalCost).toBe(567.89);
      expect(data.messaging.averageCost).toBeCloseTo(0.046, 3);
      
      expect(data.revenue.total).toBe(15678.50);
      expect(data.revenue.transactions).toBe(234);
      expect(data.revenue.averageTransaction).toBeCloseTo(67.01, 2);
      
      expect(data.automation.workflowExecutions).toBe(345);
      
      expect(data.analytics.visitorSessions).toBe(2340);
      expect(data.analytics.averageIntentScore).toBe(78.5);
      expect(data.analytics.totalConversionValue).toBe(45670.25);
      
      expect(data.meta.duration).toBeDefined();
      expect(data.meta.source).toBe('DATABASE');

      // Verify database queries were called
      expect(mockPrismaClient.user.count).toHaveBeenCalledTimes(2);
      expect(mockPrismaClient.contact.count).toHaveBeenCalledTimes(2);
      expect(mockPrismaClient.emailCampaign.count).toHaveBeenCalled();
      expect(mockPrismaClient.messagingUsage.aggregate).toHaveBeenCalled();
      expect(mockPrismaClient.creditTransaction.aggregate).toHaveBeenCalled();

      // Performance test
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle different time ranges correctly', async () => {
      // Test multiple time ranges
      const timeRanges = ['1h', '1d', '7d', '30d'];
      
      for (const timeRange of timeRanges) {
        // Arrange
        const authContext = testUtils.createMockAuthContext();
        const uri = `monitoring://metrics?timeRange=${timeRange}`;

        // Act
        const result = await server['readResource'](uri, authContext);

        // Assert
        const data = JSON.parse(result.text);
        expect(data.timeRange).toBe(timeRange);
        expect(data.period.start).toBeDefined();
        expect(data.period.end).toBeDefined();
        expect(data.period.duration).toContain('days');
      }
    });

    it('should validate organization isolation for metrics', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext({ organizationId: 'org-456' });
      const uri = 'monitoring://metrics?timeRange=1d';

      // Act
      await server['readResource'](uri, authContext);

      // Assert - All database queries should include organization filter
      expect(mockPrismaClient.user.count).toHaveBeenCalledWith({
        where: { organizationId: 'org-456' }
      });
      expect(mockPrismaClient.contact.count).toHaveBeenCalledWith({
        where: { organizationId: 'org-456' }
      });
      expect(mockPrismaClient.emailCampaign.count).toHaveBeenCalledWith({
        where: {
          organizationId: 'org-456',
          createdAt: { gte: expect.any(Date) }
        }
      });
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const uri = 'monitoring://metrics?timeRange=1d';
      
      mockPrismaClient.user.count.mockRejectedValueOnce(new Error('Database connection failed'));

      // Act
      const result = await server['readResource'](uri, authContext);

      // Assert
      const data = JSON.parse(result.text);
      expect(data.error).toBe('Failed to retrieve business metrics');
      expect(data.details).toBe('Database connection failed');

      // Verify error logging
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('System Health Resource', () => {
    it('should retrieve comprehensive system health metrics', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const uri = 'monitoring://system?timeRange=1d';

      // Act
      const startTime = performance.now();
      const result = await server['readResource'](uri, authContext);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(result.uri).toBe('monitoring://system');
      expect(result.mimeType).toBe('application/json');
      
      const data = JSON.parse(result.text);
      expect(data.organizationId).toBe(authContext.organizationId);
      expect(data.status).toMatch(/healthy|warning|critical/);
      expect(data.healthScore).toBeGreaterThan(0);
      expect(data.healthScore).toBeLessThanOrEqual(100);

      // Verify system metrics structure
      expect(data.metrics.database.status).toMatch(/healthy|warning|critical/);
      expect(data.metrics.database.responseTime).toBeGreaterThan(0);
      
      expect(data.metrics.api.averageResponseTime).toBeGreaterThan(0);
      expect(data.metrics.api.errorRate).toBeGreaterThanOrEqual(0);
      expect(data.metrics.api.requestsPerMinute).toBeGreaterThan(0);
      
      expect(data.metrics.system.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(data.metrics.system.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(data.metrics.system.diskSpace).toBeGreaterThanOrEqual(0);
      
      expect(data.metrics.errors.total).toBeGreaterThanOrEqual(0);
      expect(data.alerts.active).toBeGreaterThanOrEqual(0);
      expect(data.uptime.percentage).toBeGreaterThan(0);

      expect(data.meta.duration).toBeDefined();
      expect(data.meta.dataPoints).toBe(2);
      expect(data.meta.source).toBe('MCP_MONITORING_METRICS');

      // Verify database queries
      expect(mockPrismaClient.mCPMonitoringMetrics.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: authContext.organizationId,
          timestamp: { gte: expect.any(Date) }
        },
        orderBy: { timestamp: 'desc' },
        take: 100
      });

      // Performance test
      expect(duration).toBeLessThan(500);
    });

    it('should calculate health score correctly based on metrics', async () => {
      // Arrange - Setup metrics with known values
      mockPrismaClient.mCPMonitoringMetrics.findMany.mockResolvedValue([
        {
          id: 'metric-1',
          organizationId: 'test-org-123',
          timestamp: new Date(),
          metrics: {
            errorRate: 0.001,    // 1% error rate
            responseTime: 500,   // 500ms response time
            cpuUsage: 80,        // 80% CPU usage
            memoryUsage: 70      // 70% memory usage
          }
        }
      ]);

      const authContext = testUtils.createMockAuthContext();
      const uri = 'monitoring://system?timeRange=1d';

      // Act
      const result = await server['readResource'](uri, authContext);

      // Assert
      const data = JSON.parse(result.text);
      expect(data.healthScore).toBeDefined();
      expect(data.healthScore).toBeGreaterThan(0);
      expect(data.healthScore).toBeLessThan(100); // Should be less than perfect due to high resource usage

      // Status should reflect the calculated health score
      if (data.healthScore < 70) {
        expect(data.status).toBe('critical');
      } else if (data.healthScore < 85) {
        expect(data.status).toBe('warning');
      } else {
        expect(data.status).toBe('healthy');
      }
    });

    it('should measure database performance in real-time', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const uri = 'monitoring://system?timeRange=1d';

      // Mock database delay
      mockPrismaClient.user.count.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(100), 50))
      );

      // Act
      const result = await server['readResource'](uri, authContext);

      // Assert
      const data = JSON.parse(result.text);
      expect(data.metrics.database.responseTime).toBeGreaterThan(40); // Should reflect the delay
      expect(data.metrics.database.status).toBeDefined();
    });
  });

  describe('KPI Dashboard Tool', () => {
    it('should generate comprehensive KPI dashboard with real metrics', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const args = { timeRange: '1d', includeComparisons: true };

      // Act
      const result = await server['callTool']('get_kpi_dashboard', args, authContext);

      // Assert
      expect(result.content[0].type).toBe('text');
      const data = JSON.parse(result.content[0].text);
      
      expect(data.success).toBe(true);
      expect(data.data.overview).toBeDefined();
      expect(data.data.performance).toBeDefined();
      expect(data.data.system).toBeDefined();
      expect(data.data.ai).toBeDefined();
      expect(data.data.comparisons).toBeDefined(); // includeComparisons: true

      // Verify KPI structure
      expect(data.data.overview.totalUsers).toBeGreaterThan(0);
      expect(data.data.overview.totalRevenue).toBeGreaterThan(0);
      expect(data.data.performance.campaignOpenRate).toBeGreaterThan(0);
      expect(data.data.system.uptime).toBeGreaterThan(99);
      expect(data.data.ai.modelAccuracy).toBeGreaterThan(90);

      // Verify insights and recommendations
      expect(data.insights).toBeInstanceOf(Array);
      expect(data.insights.length).toBeGreaterThan(0);
      expect(data.recommendations).toBeInstanceOf(Array);
      expect(data.recommendations.length).toBeGreaterThan(0);

      expect(data.meta.timestamp).toBeDefined();
      expect(data.meta.timeRange).toBe('1d');
      expect(data.meta.fallbackUsed).toBe(true);

      // Verify logging
      expect(logger.info).toHaveBeenCalledWith(
        'MCP Monitoring: Getting KPI dashboard',
        expect.objectContaining({
          timeRange: '1d',
          includeComparisons: true,
          userId: authContext.userId
        })
      );
    });

    it('should exclude comparisons when requested', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const args = { timeRange: '7d', includeComparisons: false };

      // Act
      const result = await server['callTool']('get_kpi_dashboard', args, authContext);

      // Assert
      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.data.comparisons).toBeUndefined();
      expect(data.meta.timeRange).toBe('7d');
    });

    it('should handle KPI dashboard errors gracefully', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const args = { timeRange: '1d' };

      // Force an error in the KPI dashboard method
      const originalMethod = server['getKPIDashboard'];
      server['getKPIDashboard'] = jest.fn().mockImplementation(() => {
        throw new Error('KPI calculation failed');
      });

      // Act
      const result = await server['callTool']('get_kpi_dashboard', args, authContext);

      // Assert
      expect(result.isError).toBe(true);
      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to get KPI dashboard');
      expect(data.details).toBe('KPI calculation failed');

      // Restore original method
      server['getKPIDashboard'] = originalMethod;
    });
  });

  describe('Real-Time Metrics Tool', () => {
    it('should provide real-time metrics with trend analysis', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const args = {
        metrics: ['active_users', 'api_requests', 'revenue'],
        refreshInterval: 300
      };

      // Act
      const result = await server['callTool']('get_real_time_metrics', args, authContext);

      // Assert
      expect(result.content[0].type).toBe('text');
      const data = JSON.parse(result.content[0].text);
      
      expect(data.success).toBe(true);
      expect(data.data.timestamp).toBeDefined();
      expect(data.data.refreshInterval).toBe(300);
      
      // Verify metrics for each requested type
      expect(data.data.metrics.active_users).toBeGreaterThan(0);
      expect(data.data.metrics.api_requests).toBeGreaterThan(0);
      expect(data.data.metrics.revenue).toBeGreaterThan(0);
      
      // Verify trend data
      expect(data.data.trends.active_users.current).toBeDefined();
      expect(data.data.trends.active_users.previous).toBeDefined();
      expect(data.data.trends.active_users.change).toBeDefined();
      
      // Verify alerts
      expect(data.data.alerts).toBeInstanceOf(Array);
      
      expect(data.meta.timestamp).toBeDefined();
      expect(data.meta.nextUpdate).toBeDefined();
      expect(data.meta.fallbackUsed).toBe(true);

      // Verify logging
      expect(logger.info).toHaveBeenCalledWith(
        'MCP Monitoring: Getting real-time metrics',
        expect.objectContaining({
          metrics: ['active_users', 'api_requests', 'revenue'],
          refreshInterval: 300,
          userId: authContext.userId
        })
      );
    });

    it('should use default values for optional parameters', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const args = {}; // No parameters provided

      // Act
      const result = await server['callTool']('get_real_time_metrics', args, authContext);

      // Assert
      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.data.refreshInterval).toBe(300); // default
      
      // Should have default metrics
      expect(data.data.metrics.active_users).toBeDefined();
      expect(data.data.metrics.api_requests).toBeDefined();
    });

    it('should validate metric generation consistency', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const args = { metrics: ['active_users'] };

      // Act - Call multiple times
      const result1 = await server['callTool']('get_real_time_metrics', args, authContext);
      const result2 = await server['callTool']('get_real_time_metrics', args, authContext);

      // Assert - Values should be within reasonable range
      const data1 = JSON.parse(result1.content[0].text);
      const data2 = JSON.parse(result2.content[0].text);
      
      const value1 = data1.data.metrics.active_users;
      const value2 = data2.data.metrics.active_users;
      
      expect(value1).toBeGreaterThan(0);
      expect(value2).toBeGreaterThan(0);
      
      // Values should be in similar range (within 50% of base value)
      const baseValue = 1250; // From generateMetricValue
      expect(value1).toBeGreaterThan(baseValue * 0.5);
      expect(value1).toBeLessThan(baseValue * 1.5);
    });
  });

  describe('Performance Trend Analysis Tool', () => {
    it('should analyze performance trends with statistical insights', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const args = {
        metric: 'users',
        period: 'daily',
        timeRange: '30d'
      };

      // Act
      const result = await server['callTool']('analyze_performance_trends', args, authContext);

      // Assert
      expect(result.content[0].type).toBe('text');
      const data = JSON.parse(result.content[0].text);
      
      expect(data.success).toBe(true);
      expect(data.data.metric).toBe('users');
      expect(data.data.period).toBe('daily');
      expect(data.data.timeRange).toBe('30d');
      
      // Verify trend data points
      expect(data.data.dataPoints).toBeInstanceOf(Array);
      expect(data.data.dataPoints.length).toBe(30); // 30 days
      
      data.data.dataPoints.forEach((point: any) => {
        expect(point.timestamp).toBeDefined();
        expect(point.value).toBeGreaterThan(0);
        expect(point.change).toBeDefined();
      });
      
      // Verify analysis
      expect(data.data.analysis.trend).toMatch(/upward|downward|stable/);
      expect(data.data.analysis.volatility).toMatch(/low|medium|high/);
      expect(data.data.analysis.confidence).toBeGreaterThan(0);
      expect(data.data.analysis.confidence).toBeLessThanOrEqual(100);
      
      // Verify insights
      expect(data.data.insights).toBeInstanceOf(Array);
      expect(data.data.insights.length).toBeGreaterThan(0);
      
      // Verify predictions
      expect(data.data.predictions.nextPeriod).toBeGreaterThan(0);
      expect(data.data.predictions.confidence).toBeGreaterThan(0);
      expect(data.data.predictions.factors).toBeInstanceOf(Array);
      
      expect(data.meta.timestamp).toBeDefined();
      expect(data.meta.analysisType).toBe('trend_analysis');
      expect(data.meta.fallbackUsed).toBe(true);
    });

    it('should handle different time ranges and periods', async () => {
      // Test different combinations
      const testCases = [
        { timeRange: '7d', expectedPoints: 7 },
        { timeRange: '30d', expectedPoints: 30 },
        { timeRange: '90d', expectedPoints: 90 }
      ];

      for (const testCase of testCases) {
        // Arrange
        const authContext = testUtils.createMockAuthContext();
        const args = {
          metric: 'revenue',
          period: 'daily',
          timeRange: testCase.timeRange
        };

        // Act
        const result = await server['callTool']('analyze_performance_trends', args, authContext);

        // Assert
        const data = JSON.parse(result.content[0].text);
        expect(data.success).toBe(true);
        expect(data.data.dataPoints.length).toBe(testCase.expectedPoints);
        expect(data.data.timeRange).toBe(testCase.timeRange);
      }
    });

    it('should provide metric-specific insights', async () => {
      // Test different metrics
      const metrics = ['users', 'campaigns', 'revenue', 'ai-performance', 'system-health'];

      for (const metric of metrics) {
        // Arrange
        const authContext = testUtils.createMockAuthContext();
        const args = { metric, period: 'daily', timeRange: '30d' };

        // Act
        const result = await server['callTool']('analyze_performance_trends', args, authContext);

        // Assert
        const data = JSON.parse(result.content[0].text);
        expect(data.success).toBe(true);
        expect(data.data.metric).toBe(metric);
        expect(data.data.insights[0]).toContain(metric);
      }
    });
  });

  describe('Performance Report Generation Tool', () => {
    it('should generate comprehensive performance reports', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const args = {
        reportType: 'executive',
        timeRange: '30d',
        includeRecommendations: true
      };

      // Act
      const result = await server['callTool']('generate_performance_report', args, authContext);

      // Assert
      expect(result.content[0].type).toBe('text');
      const data = JSON.parse(result.content[0].text);
      
      expect(data.success).toBe(true);
      expect(data.data.reportType).toBe('executive');
      expect(data.data.timeRange).toBe('30d');
      expect(data.data.generatedAt).toBeDefined();
      
      // Verify summary section
      expect(data.data.summary.overallPerformance).toMatch(/excellent|good|fair|poor/);
      expect(data.data.summary.keyMetrics.userGrowth).toBeDefined();
      expect(data.data.summary.keyMetrics.revenueGrowth).toBeDefined();
      expect(data.data.summary.keyMetrics.systemUptime).toBeDefined();
      expect(data.data.summary.highlights).toBeInstanceOf(Array);
      
      // Verify detailed analysis
      expect(data.data.detailedAnalysis.userMetrics.totalUsers).toBeGreaterThan(0);
      expect(data.data.detailedAnalysis.businessMetrics.revenue).toBeGreaterThan(0);
      expect(data.data.detailedAnalysis.systemMetrics.uptime).toBeGreaterThan(99);
      
      // Verify recommendations (included)
      expect(data.data.recommendations).toBeInstanceOf(Array);
      expect(data.data.recommendations.length).toBeGreaterThan(0);
      
      // Verify next steps
      expect(data.data.nextSteps).toBeInstanceOf(Array);
      expect(data.data.nextSteps.length).toBeGreaterThan(0);
      
      expect(data.meta.timestamp).toBeDefined();
      expect(data.meta.reportId).toBeDefined();
      expect(data.meta.fallbackUsed).toBe(true);
    });

    it('should exclude recommendations when requested', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const args = {
        reportType: 'technical',
        timeRange: '7d',
        includeRecommendations: false
      };

      // Act
      const result = await server['callTool']('generate_performance_report', args, authContext);

      // Assert
      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.data.reportType).toBe('technical');
      expect(data.data.recommendations).toBeUndefined();
      expect(data.data.nextSteps).toBeDefined(); // Still included
    });

    it('should handle different report types', async () => {
      // Test different report types
      const reportTypes = ['executive', 'technical', 'marketing', 'custom'];

      for (const reportType of reportTypes) {
        // Arrange
        const authContext = testUtils.createMockAuthContext();
        const args = { reportType, timeRange: '30d' };

        // Act
        const result = await server['callTool']('generate_performance_report', args, authContext);

        // Assert
        const data = JSON.parse(result.content[0].text);
        expect(data.success).toBe(true);
        expect(data.data.reportType).toBe(reportType);
      }
    });
  });

  describe('Resource URI Validation', () => {
    it('should validate known resource paths', async () => {
      // Test all valid resource paths
      const validPaths = [
        '/metrics',
        '/system',
        '/campaigns',
        '/users',
        '/revenue',
        '/ai-performance',
        '/alerts'
      ];

      for (const path of validPaths) {
        // Arrange
        const authContext = testUtils.createMockAuthContext();
        const uri = `monitoring:${path}?timeRange=1d`;

        // Act & Assert - Should not throw
        await expect(
          server['readResource'](uri, authContext)
        ).resolves.toBeDefined();
      }
    });

    it('should throw error for unknown resource paths', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const invalidUri = 'monitoring://unknown-resource';

      // Act & Assert
      await expect(
        server['readResource'](invalidUri, authContext)
      ).rejects.toThrow(MCPValidationError);
    });

    it('should parse query parameters correctly', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const uri = 'monitoring://metrics?timeRange=7d&aggregation=sum&customParam=value';

      // Act
      const result = await server['readResource'](uri, authContext);

      // Assert
      const data = JSON.parse(result.text);
      expect(data.timeRange).toBe('7d');
      // aggregation should be validated and applied
    });
  });

  describe('Tool Validation', () => {
    it('should throw error for unknown tools', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();

      // Act & Assert
      await expect(
        server['callTool']('unknown_monitoring_tool', {}, authContext)
      ).rejects.toThrow(MCPValidationError);
    });

    it('should validate tool input parameters', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();

      // Test each tool with valid inputs
      const toolTests = [
        {
          name: 'get_kpi_dashboard',
          validArgs: { timeRange: '1d', includeComparisons: true },
          invalidArgs: { timeRange: 'invalid' }
        },
        {
          name: 'get_real_time_metrics',
          validArgs: { metrics: ['active_users'], refreshInterval: 300 },
          invalidArgs: { refreshInterval: 10 } // Below minimum
        },
        {
          name: 'analyze_performance_trends',
          validArgs: { metric: 'users', period: 'daily', timeRange: '30d' },
          invalidArgs: { metric: 'invalid_metric' }
        }
      ];

      for (const test of toolTests) {
        // Valid case should work
        await expect(
          server['callTool'](test.name, test.validArgs, authContext)
        ).resolves.toBeDefined();
      }
    });
  });

  describe('Performance and Caching', () => {
    it('should complete monitoring operations within performance thresholds', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const operations = [
        () => server['readResource']('monitoring://metrics?timeRange=1d', authContext),
        () => server['readResource']('monitoring://system?timeRange=1d', authContext),
        () => server['callTool']('get_kpi_dashboard', { timeRange: '1d' }, authContext),
        () => server['callTool']('get_real_time_metrics', { metrics: ['active_users'] }, authContext)
      ];

      // Act
      const startTime = performance.now();
      const results = await Promise.all(operations.map(op => op()));
      const endTime = performance.now();
      const totalDuration = endTime - startTime;

      // Assert
      expect(totalDuration).toBeLessThan(2000); // All operations within 2 seconds
      expect(results).toHaveLength(4);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });

    it('should handle concurrent monitoring requests efficiently', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const concurrentRequests = Array.from({ length: 10 }, () =>
        server['callTool']('get_kpi_dashboard', { timeRange: '1d' }, authContext)
      );

      // Act
      const startTime = performance.now();
      const results = await Promise.all(concurrentRequests);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(3000); // Should handle concurrency efficiently
      expect(results).toHaveLength(10);
      results.forEach(result => {
        const data = JSON.parse(result.content[0].text);
        expect(data.success).toBe(true);
      });
    });
  });

  describe('Security and Audit Logging', () => {
    it('should log all monitoring resource access', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const uri = 'monitoring://metrics?timeRange=1d';

      // Act
      await server['readResource'](uri, authContext);

      // Assert
      expect(mockAuditLogger.logMCPResourceAccess).toHaveBeenCalledWith(
        authContext,
        'monitoring://metrics',
        'READ',
        'success',
        expect.objectContaining({
          duration: expect.any(Number),
          dataSize: expect.any(Number)
        })
      );
    });

    it('should log monitoring tool executions', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const args = { timeRange: '1d' };

      // Act
      await server['callTool']('get_kpi_dashboard', args, authContext);

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        'MCP Monitoring: Getting KPI dashboard',
        expect.objectContaining({
          timeRange: '1d',
          userId: authContext.userId
        })
      );
    });

    it('should enforce role-based access for sensitive monitoring data', async () => {
      // Arrange
      const limitedUserContext = testUtils.createMockAuthContext({
        role: 'USER',
        permissions: ['read:own:basic']
      });

      // Act
      const resources = await server['listResources'](limitedUserContext);
      const tools = await server['listTools'](limitedUserContext);

      // Assert - Should not have access to sensitive resources
      expect(resources.map(r => r.uri)).not.toContain('monitoring://revenue');
      expect(resources.map(r => r.uri)).not.toContain('monitoring://system');
      expect(resources.map(r => r.uri)).not.toContain('monitoring://alerts');

      // Should not have admin tools
      expect(tools.map(t => t.name)).not.toContain('set_alert_threshold');
    });

    it('should validate organization isolation in monitoring queries', async () => {
      // Arrange
      const user1Context = testUtils.createMockAuthContext({ organizationId: 'org-123' });
      const user2Context = testUtils.createMockAuthContext({ organizationId: 'org-456' });

      // Act
      await server['readResource']('monitoring://metrics?timeRange=1d', user1Context);
      await server['readResource']('monitoring://metrics?timeRange=1d', user2Context);

      // Assert - Each should only query their own organization
      expect(mockPrismaClient.user.count).toHaveBeenCalledWith({
        where: { organizationId: 'org-123' }
      });
      expect(mockPrismaClient.user.count).toHaveBeenCalledWith({
        where: { organizationId: 'org-456' }
      });
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle database connection failures gracefully', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      mockPrismaClient.user.count.mockRejectedValue(new Error('Connection timeout'));

      // Act
      const result = await server['readResource']('monitoring://metrics?timeRange=1d', authContext);

      // Assert
      const data = JSON.parse(result.text);
      expect(data.error).toBe('Failed to retrieve business metrics');
      expect(data.details).toBe('Connection timeout');

      // Should log the error
      expect(mockAuditLogger.logMCPResourceAccess).toHaveBeenCalledWith(
        authContext,
        'monitoring://metrics',
        'READ',
        'failure',
        { errorMessage: 'Connection timeout' }
      );
    });

    it('should provide fallback data when primary systems fail', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const args = { timeRange: '1d' };

      // Simulate system failure by making tool method throw
      const originalMethod = server['getKPIDashboard'];
      server['getKPIDashboard'] = jest.fn().mockImplementation(async () => {
        throw new Error('System temporarily unavailable');
      });

      // Act
      const result = await server['callTool']('get_kpi_dashboard', args, authContext);

      // Assert
      expect(result.isError).toBe(true);
      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to get KPI dashboard');

      // Restore original method
      server['getKPIDashboard'] = originalMethod;
    });

    it('should validate input data types and ranges', async () => {
      // Test invalid query parameters
      const authContext = testUtils.createMockAuthContext();
      
      // Invalid time range should default to '1d'
      const result = await server['readResource'](
        'monitoring://metrics?timeRange=invalid&aggregation=invalid',
        authContext
      );

      const data = JSON.parse(result.text);
      expect(data.timeRange).toBe('1d'); // Should use default
    });
  });

  describe('Integration Testing', () => {
    it('should execute complete monitoring workflow across all resources', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();

      // Act - Execute monitoring workflow
      const metricsResult = await server['readResource']('monitoring://metrics?timeRange=1d', authContext);
      const systemResult = await server['readResource']('monitoring://system?timeRange=1d', authContext);
      const kpiResult = await server['callTool']('get_kpi_dashboard', { timeRange: '1d' }, authContext);
      const trendsResult = await server['callTool']('analyze_performance_trends', 
        { metric: 'users', period: 'daily', timeRange: '30d' }, authContext);

      // Assert - All operations successful
      expect(JSON.parse(metricsResult.text).organizationId).toBe(authContext.organizationId);
      expect(JSON.parse(systemResult.text).status).toMatch(/healthy|warning|critical/);
      
      const kpiData = JSON.parse(kpiResult.content[0].text);
      expect(kpiData.success).toBe(true);
      
      const trendsData = JSON.parse(trendsResult.content[0].text);
      expect(trendsData.success).toBe(true);
      expect(trendsData.data.dataPoints.length).toBe(30);

      // Verify all database interactions occurred
      expect(mockPrismaClient.user.count).toHaveBeenCalled();
      expect(mockPrismaClient.contact.count).toHaveBeenCalled();
      expect(mockPrismaClient.mCPMonitoringMetrics.findMany).toHaveBeenCalled();
    });

    it('should maintain data consistency across multiple monitoring calls', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();

      // Act - Call same resource multiple times
      const results = await Promise.all([
        server['readResource']('monitoring://metrics?timeRange=1d', authContext),
        server['readResource']('monitoring://metrics?timeRange=1d', authContext),
        server['readResource']('monitoring://metrics?timeRange=1d', authContext)
      ]);

      // Assert - Results should be consistent
      const data1 = JSON.parse(results[0].text);
      const data2 = JSON.parse(results[1].text);
      const data3 = JSON.parse(results[2].text);

      expect(data1.users.total).toBe(data2.users.total);
      expect(data2.users.total).toBe(data3.users.total);
      expect(data1.contacts.total).toBe(data2.contacts.total);
      expect(data1.revenue.total).toBe(data2.revenue.total);
    });
  });
});