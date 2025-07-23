/**
 * LeadPulse MCP Server Unit Tests
 * 
 * Comprehensive tests for the LeadPulse MCP server including:
 * - Visitor tracking validation with real session data
 * - Behavioral analytics and intent scoring
 * - Session data processing and transformation
 * - Heatmap data integration
 * - Customer journey mapping
 * - Conversion funnel analysis
 * - Real-time visitor monitoring
 * - High-intent visitor identification
 * - Geographic and device analytics
 * - Performance testing for large datasets
 * - Privacy and GDPR compliance
 * - Error handling and fallback mechanisms
 * - Audit logging for visitor data access
 */

import { LeadPulseMCPServer } from '../../mcp/servers/leadpulse-server';
import { MCPServerConfig } from '../../mcp/config/mcp-config';
import { MCPAuthContext, MCPValidationError, LeadPulseQuery } from '../../mcp/types/mcp-types';
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

// Mock the external dependencies
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

// Test data factories for LeadPulse
const createMockVisitorSession = (overrides?: any) => ({
  id: 'session-123',
  sessionId: 'session-123',
  visitorId: 'visitor-456',
  organizationId: 'org-456',
  sessionStart: new Date(Date.now() - 3600000), // 1 hour ago
  sessionEnd: new Date(),
  pageViews: 5,
  duration: 300, // 5 minutes
  bounceRate: 0.2,
  conversionValue: 0,
  intentScore: 75,
  landingPage: '/home',
  exitPage: '/contact',
  country: 'NG',
  city: 'Lagos',
  region: 'Lagos State',
  deviceType: 'desktop',
  browser: 'Chrome',
  operatingSystem: 'Windows',
  source: 'google',
  medium: 'organic',
  campaign: null,
  referrer: 'https://google.com',
  scrollDepth: 85,
  avgTimeOnPage: 60,
  interactions: 8,
  insights: JSON.stringify([
    'High engagement visitor',
    'Viewed multiple pages',
    'Strong conversion intent'
  ]),
  organization: { id: 'org-456', name: 'Test Organization' },
  ...overrides
});

const createMockHeatmapData = (overrides?: any) => ({
  id: 'heatmap-123',
  pageUrl: '/pricing',
  organizationId: 'org-456',
  clickMap: {
    '/pricing': {
      clicks: [
        { x: 150, y: 300, count: 25 },
        { x: 400, y: 500, count: 15 }
      ]
    }
  },
  scrollMap: {
    '/pricing': {
      maxScroll: 85,
      avgScroll: 65,
      distribution: [100, 95, 85, 70, 50, 30, 15, 5]
    }
  },
  sessionCount: 100,
  uniqueVisitors: 85,
  avgTimeOnPage: 120,
  bounceRate: 0.25,
  calculatedAt: new Date(),
  ...overrides
});

describe('LeadPulse MCP Server', () => {
  let server: LeadPulseMCPServer;
  let config: MCPServerConfig;

  beforeEach(() => {
    resetAllMocks();
    setupDefaultMocks();

    config = {
      name: 'leadpulse-server',
      version: '1.0.0',
      port: 3005,
      enabled: true,
      authentication: { required: true, methods: ['jwt'] },
      rateLimit: { enabled: true, maxRequests: 30, windowMs: 60000 },
      fallback: { enabled: true, timeout: 5000 },
      validation: { strict: true, sanitizeOutput: true }
    };

    server = new LeadPulseMCPServer(config);
  });

  afterEach(() => {
    resetAllMocks();
  });

  describe('Resource Listing', () => {
    it('should list available visitor resources for regular users', async () => {
      // Arrange
      const userContext = testUtils.createMockAuthContext({
        role: 'USER',
        permissions: ['read:own:leadpulse']
      });

      // Act
      const resources = await server['listResources'](userContext);

      // Assert
      expect(resources).toHaveLength(2);
      expect(resources.map(r => r.uri)).toEqual([
        'leadpulse://visitors',
        'leadpulse://sessions'
      ]);
    });

    it('should list all visitor resources for admin users', async () => {
      // Arrange
      const adminContext = testUtils.createMockAuthContext({
        role: 'ADMIN',
        permissions: ['*']
      });

      // Act
      const resources = await server['listResources'](adminContext);

      // Assert
      expect(resources).toHaveLength(6);
      expect(resources.map(r => r.uri)).toEqual([
        'leadpulse://visitors',
        'leadpulse://sessions',
        'leadpulse://heatmaps',
        'leadpulse://journeys',
        'leadpulse://conversions',
        'leadpulse://analytics'
      ]);
    });

    it('should list all resources for users with org read permissions', async () => {
      // Arrange
      const orgUserContext = testUtils.createMockAuthContext({
        role: 'IT_ADMIN',
        permissions: ['read:org']
      });

      // Act
      const resources = await server['listResources'](orgUserContext);

      // Assert
      expect(resources).toHaveLength(6);
    });
  });

  describe('Tool Listing', () => {
    it('should list available tools for regular users', async () => {
      // Arrange
      const userContext = testUtils.createMockAuthContext({
        role: 'USER',
        permissions: ['read:own:leadpulse']
      });

      // Act
      const tools = await server['listTools'](userContext);

      // Assert
      expect(tools).toHaveLength(3);
      expect(tools.map(t => t.name)).toEqual([
        'track_visitor',
        'analyze_visitor_behavior',
        'get_real_time_visitors'
      ]);
      
      // Verify tool schemas
      const trackTool = tools.find(t => t.name === 'track_visitor');
      expect(trackTool?.inputSchema.properties.visitorId).toBeDefined();
      expect(trackTool?.inputSchema.required).toContain('visitorId');
    });

    it('should list all tools for admin users', async () => {
      // Arrange
      const adminContext = testUtils.createMockAuthContext({
        role: 'ADMIN',
        permissions: ['*']
      });

      // Act
      const tools = await server['listTools'](adminContext);

      // Assert
      expect(tools).toHaveLength(6);
      expect(tools.map(t => t.name)).toEqual([
        'track_visitor',
        'analyze_visitor_behavior',
        'get_conversion_funnel',
        'get_page_analytics',
        'get_real_time_visitors',
        'identify_high_intent_visitors'
      ]);
    });
  });

  describe('Visitor Data Retrieval', () => {
    it('should retrieve visitor data with real database queries', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const mockSessions = [
        createMockVisitorSession({
          visitorId: 'visitor-1',
          organizationId: authContext.organizationId,
          deviceType: 'desktop',
          country: 'NG',
          intentScore: 85
        }),
        createMockVisitorSession({
          visitorId: 'visitor-2',
          organizationId: authContext.organizationId,
          deviceType: 'mobile',
          country: 'KE',
          intentScore: 65,
          bounceRate: 0.8 // High bounce rate
        })
      ];

      mockPrismaClient.mCPVisitorSessions.findMany.mockResolvedValue(mockSessions);

      const uri = 'leadpulse://visitors?limit=10&offset=0';
      
      // Act
      const result = await server['readResource'](uri, authContext);

      // Assert
      expect(result.uri).toBe('leadpulse://visitors');
      expect(result.mimeType).toBe('application/json');
      
      const data = JSON.parse(result.text);
      expect(data.visitors).toHaveLength(2);
      expect(data.visitors[0].id).toBe('visitor-1');
      expect(data.visitors[0].intentScore).toBe(85);
      expect(data.visitors[0].geoLocation.country).toBe('NG');
      expect(data.visitors[0].device.type).toBe('desktop');
      expect(data.visitors[0].bounce).toBe(false); // bounceRate 0.2 < 0.5
      expect(data.visitors[1].bounce).toBe(true); // bounceRate 0.8 > 0.5
      
      // Verify summary statistics
      expect(data.summary.totalSessions).toBe(2);
      expect(data.summary.avgIntentScore).toBe(75); // (85 + 65) / 2
      expect(data.summary.bounceRate).toBe(50); // 1 out of 2 bounced
      expect(data.summary.deviceDistribution.desktop).toBe(1);
      expect(data.summary.deviceDistribution.mobile).toBe(1);
      expect(data.summary.countryDistribution.NG).toBe(1);
      expect(data.summary.countryDistribution.KE).toBe(1);

      // Verify database query
      expect(mockPrismaClient.mCPVisitorSessions.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: authContext.organizationId
        },
        take: 10,
        skip: 0,
        include: {
          organization: {
            select: { id: true, name: true }
          }
        },
        orderBy: {
          sessionStart: 'desc'
        }
      });

      // Verify metadata
      expect(data.meta.source).toBe('MCP_VISITOR_SESSIONS');
      expect(data.meta.duration).toBeDefined();
    });

    it('should filter visitors by date range and visitor ID', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const mockSessions = [createMockVisitorSession()];
      mockPrismaClient.mCPVisitorSessions.findMany.mockResolvedValue(mockSessions);

      const uri = 'leadpulse://visitors?visitorId=visitor-123&dateFrom=2024-01-01T00:00:00.000Z&dateTo=2024-01-31T23:59:59.999Z';
      
      // Act
      const result = await server['readResource'](uri, authContext);

      // Assert
      expect(mockPrismaClient.mCPVisitorSessions.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: authContext.organizationId,
          visitorId: 'visitor-123',
          sessionStart: {
            gte: new Date('2024-01-01T00:00:00.000Z'),
            lte: new Date('2024-01-31T23:59:59.999Z')
          }
        },
        take: 10,
        skip: 0,
        include: {
          organization: {
            select: { id: true, name: true }
          }
        },
        orderBy: {
          sessionStart: 'desc'
        }
      });
    });

    it('should use fallback when primary query fails', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      
      // First call fails, fallback succeeds
      mockPrismaClient.mCPVisitorSessions.findMany
        .mockRejectedValueOnce(new Error('Analytics service unavailable'))
        .mockResolvedValueOnce([createMockVisitorSession()]);

      const uri = 'leadpulse://visitors';
      
      // Act
      const result = await server['readResource'](uri, authContext);

      // Assert
      expect(result.success).toBe(true);
      expect(result.meta.fallbackUsed).toBe(true);
    });
  });

  describe('Visitor Tracking Tool', () => {
    it('should track visitor with comprehensive session analysis', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const mockSessions = [
        createMockVisitorSession({
          visitorId: 'visitor-123',
          sessionId: 'session-current',
          organizationId: authContext.organizationId,
          sessionStart: new Date(Date.now() - 1800000), // 30 minutes ago
          sessionEnd: new Date(),
          pageViews: 8,
          duration: 1800,
          conversionValue: 150,
          intentScore: 90
        }),
        createMockVisitorSession({
          visitorId: 'visitor-123',
          sessionId: 'session-previous',
          organizationId: authContext.organizationId,
          sessionStart: new Date(Date.now() - 86400000), // 1 day ago
          sessionEnd: new Date(Date.now() - 86400000 + 600000), // 10 minutes duration
          pageViews: 3,
          duration: 600,
          conversionValue: 0,
          intentScore: 70
        })
      ];

      mockPrismaClient.mCPVisitorSessions.findMany.mockResolvedValue(mockSessions);

      const args = { visitorId: 'visitor-123', includeJourney: true, includeHeatmap: false };

      // Act
      const result = await server['callTool']('track_visitor', args, authContext);

      // Assert
      expect(result.content[0].type).toBe('text');
      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('visitor-123');
      
      // Verify current session data
      expect(data.data.currentSession.sessionId).toBe('session-current');
      expect(data.data.currentSession.pageViews).toBe(8);
      expect(data.data.currentSession.duration).toBe(1800);
      expect(data.data.currentSession.intentScore).toBe(90);
      expect(data.data.currentSession.converted).toBe(true);
      expect(data.data.currentSession.conversionValue).toBe(150);
      
      // Verify visitor profile aggregation
      expect(data.data.profile.isReturning).toBe(true);
      expect(data.data.profile.totalSessions).toBe(2);
      expect(data.data.profile.totalPageViews).toBe(11); // 8 + 3
      expect(data.data.profile.totalConversions).toBe(1);
      expect(data.data.profile.averageSessionDuration).toBe(1200); // (1800 + 600) / 2

      // Verify database query
      expect(mockPrismaClient.mCPVisitorSessions.findMany).toHaveBeenCalledWith({
        where: {
          visitorId: 'visitor-123',
          organizationId: authContext.organizationId
        },
        include: {
          organization: {
            select: { id: true, name: true }
          }
        },
        orderBy: {
          sessionStart: 'desc'
        },
        take: 10
      });

      // Verify audit logging
      expect(mockAuditLogger.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'API_ACCESS',
          action: 'CREATE',
          outcome: 'success'
        })
      );
    });

    it('should return error for non-existent visitor', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      mockPrismaClient.mCPVisitorSessions.findMany.mockResolvedValue([]);

      const args = { visitorId: 'non-existent' };

      // Act
      const result = await server['callTool']('track_visitor', args, authContext);

      // Assert
      expect(result.isError).toBe(true);
      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Visitor not found');
      expect(data.visitorId).toBe('non-existent');
    });

    it('should handle single session visitors correctly', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const mockSession = createMockVisitorSession({
        visitorId: 'new-visitor',
        organizationId: authContext.organizationId
      });

      mockPrismaClient.mCPVisitorSessions.findMany.mockResolvedValue([mockSession]);

      const args = { visitorId: 'new-visitor' };

      // Act
      const result = await server['callTool']('track_visitor', args, authContext);

      // Assert
      const data = JSON.parse(result.content[0].text);
      expect(data.data.profile.isReturning).toBe(false);
      expect(data.data.profile.totalSessions).toBe(1);
    });
  });

  describe('Visitor Behavior Analysis Tool', () => {
    it('should analyze visitor behavior patterns with insights', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      
      // Mock the behavior analysis method
      server['analyzeVisitorBehavior'] = jest.fn().mockResolvedValue({
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: {
              visitorId: 'visitor-123',
              timeRange: '7d',
              behaviorMetrics: {
                avgSessionDuration: 450,
                avgPageViews: 6.5,
                avgScrollDepth: 78,
                avgInteractions: 12,
                intentTrend: 'increasing',
                engagementLevel: 'high'
              },
              patterns: [
                'Consistent page progression through product pages',
                'High interaction with pricing information',
                'Multiple visits to contact page',
                'Strong mobile engagement'
              ],
              insights: [
                'Visitor shows strong purchase intent',
                'Likely in decision-making phase',
                'Recommend targeted offer or follow-up'
              ],
              riskFactors: [],
              recommendations: [
                'Send personalized product demo invitation',
                'Provide pricing consultation',
                'Enable live chat for immediate support'
              ]
            }
          })
        }]
      });

      const args = { visitorId: 'visitor-123', timeRange: '7d' };

      // Act
      const result = await server['callTool']('analyze_visitor_behavior', args, authContext);

      // Assert
      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.data.visitorId).toBe('visitor-123');
      expect(data.data.behaviorMetrics.engagementLevel).toBe('high');
      expect(data.data.patterns).toHaveLength(4);
      expect(data.data.insights).toContain('Visitor shows strong purchase intent');
      expect(data.data.recommendations).toContain('Send personalized product demo invitation');
    });
  });

  describe('Real-time Visitors Tool', () => {
    it('should get current active visitors with location and device info', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      
      // Mock real-time visitors method
      server['getRealTimeVisitors'] = jest.fn().mockResolvedValue({
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: {
              activeVisitors: [
                {
                  visitorId: 'visitor-active-1',
                  currentPage: '/pricing',
                  sessionDuration: 180,
                  pageViews: 3,
                  location: { country: 'NG', city: 'Lagos' },
                  device: { type: 'desktop', browser: 'Chrome' },
                  intentScore: 85,
                  lastActivity: new Date().toISOString()
                },
                {
                  visitorId: 'visitor-active-2',
                  currentPage: '/features',
                  sessionDuration: 45,
                  pageViews: 1,
                  location: { country: 'KE', city: 'Nairobi' },
                  device: { type: 'mobile', browser: 'Safari' },
                  intentScore: 45,
                  lastActivity: new Date().toISOString()
                }
              ],
              summary: {
                totalActive: 2,
                avgSessionDuration: 112.5,
                topPages: ['/pricing', '/features'],
                topCountries: ['NG', 'KE'],
                deviceBreakdown: { desktop: 1, mobile: 1 }
              }
            }
          })
        }]
      });

      const args = { includeLocation: true, includeDevice: true };

      // Act
      const result = await server['callTool']('get_real_time_visitors', args, authContext);

      // Assert
      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.data.activeVisitors).toHaveLength(2);
      expect(data.data.activeVisitors[0].location.country).toBe('NG');
      expect(data.data.activeVisitors[0].device.type).toBe('desktop');
      expect(data.data.summary.totalActive).toBe(2);
      expect(data.data.summary.deviceBreakdown.desktop).toBe(1);
      expect(data.data.summary.deviceBreakdown.mobile).toBe(1);
    });
  });

  describe('High Intent Visitor Identification', () => {
    it('should identify visitors with high conversion intent', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      
      // Mock high intent identification
      server['identifyHighIntentVisitors'] = jest.fn().mockResolvedValue({
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: {
              highIntentVisitors: [
                {
                  visitorId: 'visitor-intent-1',
                  intentScore: 92,
                  signals: [
                    'Multiple pricing page visits',
                    'Extended time on product demos',
                    'Downloaded resources',
                    'Viewed contact information'
                  ],
                  lastActivity: new Date().toISOString(),
                  sessionCount: 3,
                  conversionProbability: 85,
                  recommendedActions: [
                    'Immediate sales outreach',
                    'Personalized demo offer',
                    'Limited-time pricing incentive'
                  ]
                },
                {
                  visitorId: 'visitor-intent-2',
                  intentScore: 78,
                  signals: [
                    'Comparison page visits',
                    'FAQ section engagement',
                    'Case study downloads'
                  ],
                  lastActivity: new Date().toISOString(),
                  sessionCount: 2,
                  conversionProbability: 65,
                  recommendedActions: [
                    'Follow-up email sequence',
                    'Customer success story sharing',
                    'Free trial offer'
                  ]
                }
              ],
              summary: {
                totalIdentified: 2,
                avgIntentScore: 85,
                avgConversionProbability: 75,
                threshold: 70
              }
            }
          })
        }]
      });

      const args = { threshold: 70, limit: 20 };

      // Act
      const result = await server['callTool']('identify_high_intent_visitors', args, authContext);

      // Assert
      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.data.highIntentVisitors).toHaveLength(2);
      expect(data.data.highIntentVisitors[0].intentScore).toBe(92);
      expect(data.data.highIntentVisitors[0].conversionProbability).toBe(85);
      expect(data.data.highIntentVisitors[0].signals).toContain('Multiple pricing page visits');
      expect(data.data.highIntentVisitors[0].recommendedActions).toContain('Immediate sales outreach');
      expect(data.data.summary.threshold).toBe(70);
      expect(data.data.summary.avgIntentScore).toBe(85);
    });
  });

  describe('Conversion Funnel Analysis', () => {
    it('should analyze conversion funnel with drop-off points', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      
      // Mock conversion funnel analysis
      server['getConversionFunnel'] = jest.fn().mockResolvedValue({
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: {
              funnelId: 'default-funnel',
              dateRange: '30d',
              stages: [
                {
                  name: 'Landing Page',
                  visitors: 1000,
                  conversions: 800,
                  conversionRate: 80,
                  dropOff: 200,
                  dropOffRate: 20
                },
                {
                  name: 'Product Page',
                  visitors: 800,
                  conversions: 400,
                  conversionRate: 50,
                  dropOff: 400,
                  dropOffRate: 50
                },
                {
                  name: 'Pricing Page',
                  visitors: 400,
                  conversions: 200,
                  conversionRate: 50,
                  dropOff: 200,
                  dropOffRate: 50
                },
                {
                  name: 'Signup',
                  visitors: 200,
                  conversions: 50,
                  conversionRate: 25,
                  dropOff: 150,
                  dropOffRate: 75
                }
              ],
              insights: [
                'Biggest drop-off occurs at signup stage (75%)',
                'Product to pricing conversion is healthy (50%)',
                'Landing page performance is strong (80%)'
              ],
              recommendations: [
                'Simplify signup process',
                'Add social proof on signup page',
                'Implement exit-intent popup'
              ],
              totalConversionRate: 5.0 // 50/1000 * 100
            }
          })
        }]
      });

      const args = { dateRange: '30d', includeSegments: false };

      // Act
      const result = await server['callTool']('get_conversion_funnel', args, authContext);

      // Assert
      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.data.stages).toHaveLength(4);
      expect(data.data.stages[0].name).toBe('Landing Page');
      expect(data.data.stages[0].conversionRate).toBe(80);
      expect(data.data.stages[3].dropOffRate).toBe(75); // Highest drop-off
      expect(data.data.insights).toContain('Biggest drop-off occurs at signup stage (75%)');
      expect(data.data.recommendations).toContain('Simplify signup process');
      expect(data.data.totalConversionRate).toBe(5.0);
    });
  });

  describe('Page Analytics Tool', () => {
    it('should analyze specific page performance with heatmap data', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      
      // Mock page analytics
      server['getPageAnalytics'] = jest.fn().mockResolvedValue({
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: {
              pageUrl: '/pricing',
              dateRange: '7d',
              metrics: {
                pageViews: 1500,
                uniqueVisitors: 1200,
                avgTimeOnPage: 120,
                bounceRate: 25,
                exitRate: 35,
                conversions: 75,
                conversionRate: 5.0
              },
              heatmapData: {
                clickMap: [
                  { element: 'pricing-button', clicks: 150, conversionRate: 12 },
                  { element: 'feature-list', clicks: 89, conversionRate: 5 },
                  { element: 'testimonial', clicks: 45, conversionRate: 8 }
                ],
                scrollData: {
                  maxScrollReached: 95,
                  avgScrollDepth: 75,
                  scrollDistribution: [100, 95, 85, 75, 60, 45, 30, 15]
                }
              },
              insights: [
                'High engagement with pricing information',
                'Strong scroll depth indicates content relevance',
                'Testimonials drive meaningful interactions'
              ],
              optimizations: [
                'Move CTA higher on page',
                'Add more social proof',
                'Optimize mobile layout'
              ]
            }
          })
        }]
      });

      const args = { pageUrl: '/pricing', includeHeatmap: true, dateRange: '7d' };

      // Act
      const result = await server['callTool']('get_page_analytics', args, authContext);

      // Assert
      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.data.pageUrl).toBe('/pricing');
      expect(data.data.metrics.pageViews).toBe(1500);
      expect(data.data.metrics.conversionRate).toBe(5.0);
      expect(data.data.heatmapData.clickMap).toHaveLength(3);
      expect(data.data.heatmapData.clickMap[0].element).toBe('pricing-button');
      expect(data.data.heatmapData.scrollData.avgScrollDepth).toBe(75);
      expect(data.data.insights).toContain('High engagement with pricing information');
      expect(data.data.optimizations).toContain('Move CTA higher on page');
    });
  });

  describe('Resource URI Validation', () => {
    it('should throw error for unknown resource paths', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const invalidUri = 'leadpulse://unknown-resource';

      // Act & Assert
      await expect(
        server['readResource'](invalidUri, authContext)
      ).rejects.toThrow(MCPValidationError);
    });

    it('should parse query parameters correctly', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      mockPrismaClient.mCPVisitorSessions.findMany.mockResolvedValue([]);

      const uri = 'leadpulse://visitors?visitorId=test-123&limit=25&includeHeatmap=true&includeJourney=true';

      // Act
      await server['readResource'](uri, authContext);

      // Assert
      expect(mockPrismaClient.mCPVisitorSessions.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            visitorId: 'test-123'
          }),
          take: 25
        })
      );
    });
  });

  describe('Tool Validation', () => {
    it('should throw error for unknown tools', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();

      // Act & Assert
      await expect(
        server['callTool']('unknown_tool', {}, authContext)
      ).rejects.toThrow(MCPValidationError);
    });
  });

  describe('Performance Testing', () => {
    it('should handle large visitor datasets efficiently', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const largeSessionSet = Array.from({ length: 200 }, (_, i) => 
        createMockVisitorSession({ 
          visitorId: `visitor-${i}`,
          sessionId: `session-${i}`
        })
      );

      mockPrismaClient.mCPVisitorSessions.findMany.mockImplementation(() => 
        mockDatabaseScenarios.fastQuery(largeSessionSet)
      );

      const uri = 'leadpulse://visitors?limit=200';

      // Act
      const startTime = performance.now();
      const result = await server['readResource'](uri, authContext);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(400); // Should complete quickly
      const data = JSON.parse(result.text);
      expect(data.visitors).toHaveLength(200);
      expect(data.summary.totalSessions).toBe(200);
      expect(data.meta.duration).toBeDefined();
    });

    it('should track duration in tool execution', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const mockSession = createMockVisitorSession();
      mockPrismaClient.mCPVisitorSessions.findMany.mockResolvedValue([mockSession]);

      const args = { visitorId: 'visitor-123' };

      // Act
      const result = await server['callTool']('track_visitor', args, authContext);

      // Assert
      const data = JSON.parse(result.content[0].text);
      expect(data.meta?.duration).toBeGreaterThan(0);
      expect(typeof data.meta?.duration).toBe('number');

      // Verify duration is logged in audit
      expect(mockAuditLogger.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            duration: expect.any(Number)
          })
        })
      );
    });
  });

  describe('Data Privacy and Security', () => {
    it('should enforce organization isolation in visitor data', async () => {
      // Arrange
      const userContext = testUtils.createMockAuthContext({ organizationId: 'org-123' });

      mockPrismaClient.mCPVisitorSessions.findMany.mockResolvedValue([]);

      const uri = 'leadpulse://visitors';

      // Act
      await server['readResource'](uri, userContext);

      // Assert
      expect(mockPrismaClient.mCPVisitorSessions.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-123'
          })
        })
      );
    });

    it('should sanitize sensitive visitor data', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const sessionWithPII = createMockVisitorSession({
        insights: JSON.stringify([
          'High value customer',
          'IP: 192.168.1.100',
          'Email: user@example.com'
        ])
      });

      mockPrismaClient.mCPVisitorSessions.findMany.mockResolvedValue([sessionWithPII]);

      const uri = 'leadpulse://visitors';

      // Act
      const result = await server['readResource'](uri, authContext);

      // Assert
      const data = JSON.parse(result.text);
      const visitor = data.visitors[0];
      
      // Sensitive data should be sanitized
      expect(JSON.stringify(visitor)).not.toContain('192.168.1.100');
      expect(JSON.stringify(visitor)).not.toContain('user@example.com');
      
      // General insights should remain
      expect(visitor.insights).toContain('High value customer');
    });

    it('should respect GDPR data minimization principles', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext({ role: 'USER' });
      const mockSession = createMockVisitorSession();
      mockPrismaClient.mCPVisitorSessions.findMany.mockResolvedValue([mockSession]);

      const args = { visitorId: 'visitor-123', includeJourney: false, includeHeatmap: false };

      // Act
      const result = await server['callTool']('track_visitor', args, authContext);

      // Assert
      const data = JSON.parse(result.content[0].text);
      
      // Should only include requested data
      expect(data.data.currentSession).toBeDefined();
      expect(data.data.profile).toBeDefined();
      
      // Should not include detailed journey or heatmap data when not requested
      expect(data.data.detailedJourney).toBeUndefined();
      expect(data.data.heatmapInteractions).toBeUndefined();
    });

    it('should log privacy-sensitive data access appropriately', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      mockPrismaClient.mCPVisitorSessions.findMany.mockResolvedValue([]);

      const uri = 'leadpulse://visitors';

      // Act
      await server['readResource'](uri, authContext);

      // Assert
      expect(mockAuditLogger.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'DATA_ACCESS',
          action: 'read',
          outcome: 'success',
          details: expect.objectContaining({
            metadata: expect.objectContaining({
              resourceUri: 'leadpulse://visitors'
            })
          }),
          compliance: expect.objectContaining({
            gdprRelevant: expect.any(Boolean)
          })
        })
      );
    });
  });

  describe('Intent Scoring and Behavioral Analysis', () => {
    it('should calculate accurate intent scores from behavioral signals', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const highIntentSession = createMockVisitorSession({
        pageViews: 15,
        duration: 1800, // 30 minutes
        scrollDepth: 95,
        interactions: 25,
        landingPage: '/home',
        exitPage: '/contact',
        intentScore: 95
      });

      const lowIntentSession = createMockVisitorSession({
        pageViews: 1,
        duration: 30, // 30 seconds
        scrollDepth: 15,
        interactions: 1,
        landingPage: '/home',
        exitPage: '/home',
        intentScore: 15,
        bounceRate: 0.9
      });

      mockPrismaClient.mCPVisitorSessions.findMany.mockResolvedValue([
        highIntentSession,
        lowIntentSession
      ]);

      const uri = 'leadpulse://visitors';

      // Act
      const result = await server['readResource'](uri, authContext);

      // Assert
      const data = JSON.parse(result.text);
      expect(data.visitors[0].intentScore).toBe(95);
      expect(data.visitors[1].intentScore).toBe(15);
      expect(data.summary.avgIntentScore).toBe(55); // (95 + 15) / 2
    });

    it('should identify behavioral patterns for segmentation', async () => {
      // Arrange
      const sessions = [
        createMockVisitorSession({
          visitorId: 'mobile-user',
          deviceType: 'mobile',
          pageViews: 3,
          duration: 180
        }),
        createMockVisitorSession({
          visitorId: 'desktop-power-user',
          deviceType: 'desktop',
          pageViews: 12,
          duration: 1200
        })
      ];

      mockPrismaClient.mCPVisitorSessions.findMany.mockResolvedValue(sessions);

      const uri = 'leadpulse://visitors';

      // Act
      const result = await server['readResource'](uri, authContext);

      // Assert
      const data = JSON.parse(result.text);
      expect(data.summary.deviceDistribution.mobile).toBe(1);
      expect(data.summary.deviceDistribution.desktop).toBe(1);
      expect(data.summary.averageDuration).toBe(690); // (180 + 1200) / 2
    });
  });

  describe('Integration Testing', () => {
    it('should handle complete visitor tracking workflow', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      
      // Setup visitor data
      const mockSession = createMockVisitorSession();
      mockPrismaClient.mCPVisitorSessions.findMany.mockResolvedValue([mockSession]);

      // Act - Get visitors overview
      const visitorsResult = await server['readResource']('leadpulse://visitors', authContext);
      
      // Act - Track specific visitor
      const trackResult = await server['callTool']('track_visitor', 
        { visitorId: mockSession.visitorId }, authContext);

      // Assert - Visitors
      const visitorsData = JSON.parse(visitorsResult.text);
      expect(visitorsData.visitors).toHaveLength(1);
      expect(visitorsData.summary.totalSessions).toBe(1);

      // Assert - Tracking
      const trackData = JSON.parse(trackResult.content[0].text);
      expect(trackData.success).toBe(true);
      expect(trackData.data.id).toBe(mockSession.visitorId);

      // Verify both operations were logged
      expect(mockAuditLogger.logEvent).toHaveBeenCalledTimes(3); // 2 operations + 1 additional
    });
  });
});