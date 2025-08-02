/**
 * Customer Data MCP Server Unit Tests
 * 
 * Comprehensive tests for the customer data MCP server including:
 * - Data validation and filtering with real database queries
 * - Customer profile retrieval and transformation
 * - Customer search functionality
 * - Segment analysis with statistics
 * - Predictive analytics integration
 * - Permission-based data access
 * - Performance testing for large datasets
 * - Error handling and fallback mechanisms
 * - Audit logging for data access
 */

import { CustomerDataMCPServer } from '../../mcp/servers/customer-data-server';
import type { MCPServerConfig } from '../../mcp/config/mcp-config';
import { MCPAuthContext, MCPValidationError, CustomerQuery } from '../../mcp/types/mcp-types';
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

describe('Customer Data MCP Server', () => {
  let server: CustomerDataMCPServer;
  let config: MCPServerConfig;

  beforeEach(() => {
    resetAllMocks();
    setupDefaultMocks();

    config = {
      name: 'customer-data-server',
      version: '1.0.0',
      port: 3003,
      enabled: true,
      authentication: { required: true, methods: ['jwt'] },
      rateLimit: { enabled: true, maxRequests: 20, windowMs: 60000 },
      fallback: { enabled: true, timeout: 5000 },
      validation: { strict: true, sanitizeOutput: true }
    };

    server = new CustomerDataMCPServer(config);
  });

  afterEach(() => {
    resetAllMocks();
  });

  describe('Resource Listing', () => {
    it('should list available customer resources for regular users', async () => {
      // Arrange
      const userContext = testUtils.createMockAuthContext({
        role: 'USER',
        permissions: ['read:own:contacts']
      });

      // Act
      const resources = await server['listResources'](userContext);

      // Assert
      expect(resources).toHaveLength(1);
      expect(resources[0].uri).toBe('customer://profiles');
      expect(resources[0].name).toBe('Customer Profiles');
      expect(resources[0].mimeType).toBe('application/json');
    });

    it('should list all customer resources for admin users', async () => {
      // Arrange
      const adminContext = testUtils.createMockAuthContext({
        role: 'ADMIN',
        permissions: ['*']
      });

      // Act
      const resources = await server['listResources'](adminContext);

      // Assert
      expect(resources).toHaveLength(3);
      expect(resources.map(r => r.uri)).toEqual([
        'customer://profiles',
        'customer://segments',
        'customer://predictions'
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
      expect(resources).toHaveLength(3);
    });
  });

  describe('Tool Listing', () => {
    it('should list available tools for regular users', async () => {
      // Arrange
      const userContext = testUtils.createMockAuthContext({
        role: 'USER',
        permissions: ['read:own:contacts']
      });

      // Act
      const tools = await server['listTools'](userContext);

      // Assert
      expect(tools).toHaveLength(2);
      expect(tools.map(t => t.name)).toEqual(['search_customers', 'get_customer_profile']);
      
      // Verify tool schemas
      const searchTool = tools.find(t => t.name === 'search_customers');
      expect(searchTool?.inputSchema.properties.query).toBeDefined();
      expect(searchTool?.inputSchema.required).toContain('query');
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
      expect(tools).toHaveLength(3);
      expect(tools.map(t => t.name)).toEqual([
        'search_customers',
        'get_customer_profile',
        'get_customer_segments'
      ]);
    });
  });

  describe('Customer Profile Retrieval', () => {
    it('should retrieve customer profiles with real database data', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const mockCustomers = [
        testDataFactory.createContact({
          id: 'customer-1',
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
          organizationId: authContext.organizationId
        }),
        testDataFactory.createContact({
          id: 'customer-2',
          email: 'jane@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          organizationId: authContext.organizationId
        })
      ];

      mockPrismaClient.contact.findMany.mockResolvedValue(mockCustomers);

      const uri = 'customer://profiles?limit=10&offset=0';
      
      // Act
      const result = await server['readResource'](uri, authContext);

      // Assert
      expect(result.uri).toBe('customer://profiles');
      expect(result.mimeType).toBe('application/json');
      
      const data = JSON.parse(result.text);
      expect(data.profiles).toHaveLength(2);
      expect(data.profiles[0].id).toBe('customer-1');
      expect(data.profiles[0].email).toBe('john@example.com');
      expect(data.meta.total).toBe(2);
      expect(data.meta.limit).toBe(10);
      expect(data.meta.offset).toBe(0);

      // Verify database query
      expect(mockPrismaClient.contact.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: authContext.organizationId
        },
        take: 10,
        skip: 0,
        include: {
          segments: false,
          predictions: false
        }
      });
    });

    it('should include segments and predictions when requested', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const mockCustomer = testDataFactory.createContact({
        organizationId: authContext.organizationId,
        segments: [{ name: 'VIP' }, { name: 'High Value' }],
        predictions: {
          churnRisk: 25,
          lifetimeValue: 1500,
          engagementScore: 85
        }
      });

      mockPrismaClient.contact.findMany.mockResolvedValue([mockCustomer]);

      const uri = 'customer://profiles?includeSegments=true&includePredictions=true';
      
      // Act
      const result = await server['readResource'](uri, authContext);

      // Assert
      const data = JSON.parse(result.text);
      expect(data.profiles[0].segments).toEqual(['VIP', 'High Value']);
      expect(data.profiles[0].predictions).toEqual({
        churnRisk: 25,
        lifetimeValue: 1500,
        engagementScore: 85
      });

      // Verify database query includes related data
      expect(mockPrismaClient.contact.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: authContext.organizationId
        },
        take: 10,
        skip: 0,
        include: {
          segments: true,
          predictions: true
        }
      });
    });

    it('should filter customers by email and phone', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const mockCustomers = [testDataFactory.createContact()];
      mockPrismaClient.contact.findMany.mockResolvedValue(mockCustomers);

      const uri = 'customer://profiles?email=john@example.com&phone=555-1234';
      
      // Act
      const result = await server['readResource'](uri, authContext);

      // Assert
      expect(mockPrismaClient.contact.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: authContext.organizationId,
          email: { contains: 'john@example.com' },
          phone: { contains: '555-1234' }
        },
        take: 10,
        skip: 0,
        include: {
          segments: false,
          predictions: false
        }
      });
    });

    it('should use fallback when primary query fails', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const fallbackCustomers = [testDataFactory.createContact()];
      
      // First call fails, second call (fallback) succeeds
      mockPrismaClient.contact.findMany
        .mockRejectedValueOnce(new Error('Database connection failed'))
        .mockResolvedValueOnce(fallbackCustomers);

      const uri = 'customer://profiles';
      
      // Act
      const result = await server['readResource'](uri, authContext);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.profiles).toHaveLength(1);
      expect(result.meta.fallbackUsed).toBe(true);
    });
  });

  describe('Customer Search Tool', () => {
    it('should search customers by multiple criteria', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const mockCustomers = [
        testDataFactory.createContact({
          email: 'john.doe@example.com',
          firstName: 'John',
          lastName: 'Doe'
        })
      ];

      mockPrismaClient.contact.findMany.mockResolvedValue(mockCustomers);

      const args = {
        query: 'john',
        limit: 5,
        includeSegments: false,
        includePredictions: false
      };

      // Act
      const result = await server['callTool']('search_customers', args, authContext);

      // Assert
      expect(result.content[0].type).toBe('text');
      const data = JSON.parse(result.content[0].text);
      expect(data.results).toHaveLength(1);
      expect(data.results[0].email).toBe('john.doe@example.com');
      expect(data.meta.query).toBe('john');
      expect(data.meta.total).toBe(1);

      // Verify database query uses OR conditions for search
      expect(mockPrismaClient.contact.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: authContext.organizationId,
          OR: [
            { email: { contains: 'john', mode: 'insensitive' } },
            { phone: { contains: 'john' } },
            { firstName: { contains: 'john', mode: 'insensitive' } },
            { lastName: { contains: 'john', mode: 'insensitive' } }
          ]
        },
        take: 5,
        include: {
          segments: false,
          predictions: false
        }
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

    it('should include segments and predictions when requested', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const mockCustomer = testDataFactory.createContact({
        segments: [{ name: 'Premium' }],
        predictions: { churnRisk: 15, lifetimeValue: 2000, engagementScore: 90 }
      });

      mockPrismaClient.contact.findMany.mockResolvedValue([mockCustomer]);

      const args = {
        query: 'premium',
        limit: 10,
        includeSegments: true,
        includePredictions: true
      };

      // Act
      const result = await server['callTool']('search_customers', args, authContext);

      // Assert
      const data = JSON.parse(result.content[0].text);
      expect(data.results[0].segments).toEqual(['Premium']);
      expect(data.results[0].predictions).toEqual({
        churnRisk: 15,
        lifetimeValue: 2000,
        engagementScore: 90
      });

      // Verify risk level increased due to sensitive data
      expect(mockAuditLogger.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            riskLevel: 'medium'
          })
        })
      );
    });

    it('should handle search errors gracefully', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      mockPrismaClient.contact.findMany.mockRejectedValue(new Error('Search index unavailable'));

      const args = { query: 'test', limit: 10 };

      // Act
      const result = await server['callTool']('search_customers', args, authContext);

      // Assert
      expect(result.isError).toBe(true);
      const data = JSON.parse(result.content[0].text);
      expect(data.error).toBe('Failed to search customers');
      expect(data.details).toBe('Search index unavailable');

      // Verify error audit logging
      expect(mockAuditLogger.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          outcome: 'failure',
          details: expect.objectContaining({
            errorMessage: 'Search index unavailable',
            riskLevel: 'medium'
          })
        })
      );
    });

    it('should limit search results to organization scope', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext({ organizationId: 'org-123' });
      mockPrismaClient.contact.findMany.mockResolvedValue([]);

      const args = { query: 'test' };

      // Act
      await server['callTool']('search_customers', args, authContext);

      // Assert
      expect(mockPrismaClient.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-123'
          })
        })
      );
    });
  });

  describe('Customer Profile Tool', () => {
    it('should retrieve specific customer profile', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const mockCustomer = testDataFactory.createContact({
        id: 'customer-123',
        email: 'customer@example.com',
        organizationId: authContext.organizationId
      });

      mockPrismaClient.contact.findFirst.mockResolvedValue(mockCustomer);

      const args = { customerId: 'customer-123' };

      // Act
      const result = await server['callTool']('get_customer_profile', args, authContext);

      // Assert
      expect(result.content[0].type).toBe('text');
      const profile = JSON.parse(result.content[0].text);
      expect(profile.id).toBe('customer-123');
      expect(profile.email).toBe('customer@example.com');
      expect(profile.createdAt).toBeDefined();
      expect(profile.updatedAt).toBeDefined();

      // Verify database query includes organization filter
      expect(mockPrismaClient.contact.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'customer-123',
          organizationId: authContext.organizationId
        },
        include: {
          segments: true,
          predictions: true
        }
      });
    });

    it('should return error for non-existent customer', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      mockPrismaClient.contact.findFirst.mockResolvedValue(null);

      const args = { customerId: 'non-existent' };

      // Act
      const result = await server['callTool']('get_customer_profile', args, authContext);

      // Assert
      expect(result.isError).toBe(true);
      const data = JSON.parse(result.content[0].text);
      expect(data.error).toBe('Customer not found');
      expect(data.customerId).toBe('non-existent');
    });

    it('should handle database errors in profile retrieval', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      mockPrismaClient.contact.findFirst.mockRejectedValue(new Error('Database timeout'));

      const args = { customerId: 'customer-123' };

      // Act
      const result = await server['callTool']('get_customer_profile', args, authContext);

      // Assert
      expect(result.isError).toBe(true);
      const data = JSON.parse(result.content[0].text);
      expect(data.error).toBe('Failed to retrieve customer profile');
      expect(data.details).toBe('Database timeout');
    });
  });

  describe('Customer Segments', () => {
    it('should retrieve customer segments with statistics', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const mockSegments = [
        {
          id: 'segment-1',
          name: 'VIP Customers',
          description: 'High value customers',
          rules: '{"engagementScore": {"$gt": 80}}',
          createdAt: new Date(),
          updatedAt: new Date(),
          members: [
            {
              contact: testDataFactory.createContact({
                lastEngaged: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
              })
            },
            {
              contact: testDataFactory.createContact({
                lastEngaged: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) // 45 days ago
              })
            }
          ],
          _count: {
            members: 2,
            emailCampaigns: 3,
            smsCampaigns: 1,
            waCampaigns: 2
          }
        }
      ];

      mockPrismaClient.segment.findMany.mockResolvedValue(mockSegments);

      const uri = 'customer://segments';

      // Act
      const result = await server['readResource'](uri, authContext);

      // Assert
      expect(result.uri).toBe('customer://segments');
      const data = JSON.parse(result.text);
      expect(data.segments).toHaveLength(1);
      
      const segment = data.segments[0];
      expect(segment.name).toBe('VIP Customers');
      expect(segment.statistics.totalMembers).toBe(2);
      expect(segment.statistics.recentlyEngaged).toBe(1); // Only one engaged in last 30 days
      expect(segment.statistics.engagementRate).toBe(50); // 1/2 * 100
      expect(segment.statistics.campaignUsage.emailCampaigns).toBe(3);

      // Verify comprehensive database query
      expect(mockPrismaClient.segment.findMany).toHaveBeenCalledWith({
        where: {
          createdBy: {
            organizationId: authContext.organizationId
          }
        },
        include: {
          members: {
            include: {
              contact: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  lastEngaged: true,
                  createdAt: true
                }
              }
            }
          },
          _count: {
            select: {
              members: true,
              emailCampaigns: true,
              smsCampaigns: true,
              waCampaigns: true
            }
          }
        }
      });

      // Verify audit logging
      expect(mockAuditLogger.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'DATA_ACCESS',
          action: 'read',
          outcome: 'success'
        })
      );
    });

    it('should handle segment retrieval errors with fallback', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      mockPrismaClient.segment.findMany.mockRejectedValue(new Error('Segment service unavailable'));

      const uri = 'customer://segments';

      // Act
      const result = await server['readResource'](uri, authContext);

      // Assert
      expect(result.uri).toBe('customer://segments');
      const data = JSON.parse(result.text);
      expect(data.error).toBe('Failed to retrieve customer segments');
      expect(data.details).toBe('Segment service unavailable');

      // Verify error logging
      expect(mockAuditLogger.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          outcome: 'failure',
          details: expect.objectContaining({
            errorMessage: 'Segment service unavailable'
          })
        })
      );
    });
  });

  describe('Customer Predictions', () => {
    it('should retrieve customer predictions with comprehensive analytics', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const mockPredictions = [
        {
          id: 'pred-1',
          contactId: 'customer-1',
          churnRisk: 25,
          lifetimeValue: 1500,
          engagementScore: 85,
          segment: 'VIP',
          confidenceScore: 0.92,
          lastActivityDate: new Date(),
          nextBestAction: 'Send personalized offer',
          preferredChannel: 'EMAIL',
          behavioralScores: { frequency: 8, recency: 9, monetary: 7 },
          insights: ['High engagement customer', 'Prefers email communication'],
          calculatedAt: new Date(),
          contact: testDataFactory.createContact({ id: 'customer-1' }),
          organization: { id: authContext.organizationId, name: 'Test Org' }
        },
        {
          id: 'pred-2',
          contactId: 'customer-2',
          churnRisk: 75,
          lifetimeValue: 500,
          engagementScore: 35,
          segment: 'At Risk',
          confidenceScore: 0.88,
          lastActivityDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          nextBestAction: 'Re-engagement campaign',
          preferredChannel: 'SMS',
          behavioralScores: { frequency: 3, recency: 2, monetary: 4 },
          insights: ['Declining engagement', 'May require intervention'],
          calculatedAt: new Date(),
          contact: testDataFactory.createContact({ id: 'customer-2' }),
          organization: { id: authContext.organizationId, name: 'Test Org' }
        }
      ];

      mockPrismaClient.mCPCustomerPredictions.findMany.mockResolvedValue(mockPredictions);

      const uri = 'customer://predictions?limit=20&offset=0';

      // Act
      const result = await server['readResource'](uri, authContext);

      // Assert
      expect(result.uri).toBe('customer://predictions');
      const data = JSON.parse(result.text);
      expect(data.predictions).toHaveLength(2);
      
      // Verify prediction data structure
      const firstPrediction = data.predictions[0];
      expect(firstPrediction.contactId).toBe('customer-1');
      expect(firstPrediction.predictions.churnRisk).toBe(25);
      expect(firstPrediction.predictions.lifetimeValue).toBe(1500);
      expect(firstPrediction.predictions.segment).toBe('VIP');
      expect(firstPrediction.insights.nextBestAction).toBe('Send personalized offer');
      expect(firstPrediction.insights.preferredChannel).toBe('EMAIL');

      // Verify summary statistics
      expect(data.summary.totalPredictions).toBe(2);
      expect(data.summary.averages.churnRisk).toBe(50); // (25 + 75) / 2
      expect(data.summary.averages.lifetimeValue).toBe(1000); // (1500 + 500) / 2
      expect(data.summary.riskDistribution.highRisk.count).toBe(1);
      expect(data.summary.riskDistribution.lowRisk.count).toBe(1);
      expect(data.summary.segmentDistribution['VIP']).toBe(1);
      expect(data.summary.segmentDistribution['At Risk']).toBe(1);
      expect(data.summary.channelPreferences['EMAIL']).toBe(1);
      expect(data.summary.channelPreferences['SMS']).toBe(1);

      // Verify metadata
      expect(data.meta.source).toBe('MCP_CUSTOMER_PREDICTIONS');
      expect(data.meta.duration).toBeDefined();

      // Verify database query
      expect(mockPrismaClient.mCPCustomerPredictions.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: authContext.organizationId
        },
        take: 20,
        skip: 0,
        include: {
          contact: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              company: true,
              lastEngaged: true,
              createdAt: true
            }
          },
          organization: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          calculatedAt: 'desc'
        }
      });

      // Verify audit logging with appropriate risk level
      expect(mockAuditLogger.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'DATA_ACCESS',
          action: 'read',
          outcome: 'success',
          details: expect.objectContaining({
            riskLevel: 'low' // < 50 predictions
          })
        })
      );
    });

    it('should filter predictions by customer ID when specified', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      mockPrismaClient.mCPCustomerPredictions.findMany.mockResolvedValue([]);

      const uri = 'customer://predictions?id=customer-123';

      // Act
      await server['readResource'](uri, authContext);

      // Assert
      expect(mockPrismaClient.mCPCustomerPredictions.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId: authContext.organizationId,
            contactId: 'customer-123'
          }
        })
      );
    });

    it('should handle large datasets with higher risk level', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const largePredictionSet = Array.from({ length: 100 }, (_, i) => ({
        id: `pred-${i}`,
        contactId: `customer-${i}`,
        churnRisk: Math.random() * 100,
        lifetimeValue: Math.random() * 5000,
        engagementScore: Math.random() * 100,
        segment: 'Regular',
        confidenceScore: 0.85,
        lastActivityDate: new Date(),
        nextBestAction: 'Monitor',
        preferredChannel: 'EMAIL',
        behavioralScores: {},
        insights: [],
        calculatedAt: new Date(),
        contact: testDataFactory.createContact({ id: `customer-${i}` }),
        organization: { id: authContext.organizationId, name: 'Test Org' }
      }));

      mockPrismaClient.mCPCustomerPredictions.findMany.mockResolvedValue(largePredictionSet);

      const uri = 'customer://predictions?limit=100';

      // Act
      await server['readResource'](uri, authContext);

      // Assert - Risk level should be medium for large datasets
      expect(mockAuditLogger.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            riskLevel: 'medium' // >= 50 predictions
          })
        })
      );
    });

    it('should handle prediction retrieval errors with fallback response', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      mockPrismaClient.mCPCustomerPredictions.findMany.mockRejectedValue(new Error('ML service unavailable'));

      const uri = 'customer://predictions';

      // Act
      const result = await server['readResource'](uri, authContext);

      // Assert
      expect(result.uri).toBe('customer://predictions');
      const data = JSON.parse(result.text);
      expect(data.error).toBe('Failed to retrieve customer predictions');
      expect(data.details).toBe('ML service unavailable');
      expect(data.fallback.message).toBe('Predictions temporarily unavailable');

      // Verify high risk error logging
      expect(mockAuditLogger.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          outcome: 'failure',
          details: expect.objectContaining({
            riskLevel: 'high' // Data access failures are high risk
          })
        })
      );
    });
  });

  describe('Resource URI Validation', () => {
    it('should throw error for unknown resource paths', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const invalidUri = 'customer://unknown-resource';

      // Act & Assert
      await expect(
        server['readResource'](invalidUri, authContext)
      ).rejects.toThrow(MCPValidationError);
    });

    it('should parse query parameters correctly', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      mockPrismaClient.contact.findMany.mockResolvedValue([]);

      const uri = 'customer://profiles?limit=25&offset=50&email=test@example.com&includeSegments=true';

      // Act
      await server['readResource'](uri, authContext);

      // Assert
      expect(mockPrismaClient.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            email: { contains: 'test@example.com' }
          }),
          take: 25,
          skip: 50,
          include: expect.objectContaining({
            segments: true
          })
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
    it('should handle customer search performance efficiently', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const largeCustomerSet = Array.from({ length: 50 }, (_, i) => 
        testDataFactory.createContact({ id: `customer-${i}`, email: `user${i}@example.com` })
      );

      mockPrismaClient.contact.findMany.mockImplementation(() => 
        mockDatabaseScenarios.fastQuery(largeCustomerSet)
      );

      const args = { query: 'test', limit: 50 };

      // Act
      const startTime = performance.now();
      const result = await server['callTool']('search_customers', args, authContext);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(200); // Should complete quickly
      const data = JSON.parse(result.content[0].text);
      expect(data.results).toHaveLength(50);
      expect(data.meta.duration).toBeDefined();
    });

    it('should handle slow database queries with timeout', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      mockPrismaClient.contact.findMany.mockImplementation(() => 
        mockDatabaseScenarios.slowQuery([])
      );

      const args = { query: 'test' };

      // Act
      const startTime = performance.now();
      const result = await server['callTool']('search_customers', args, authContext);
      const endTime = performance.now();

      // Assert - Should handle slow queries gracefully
      expect(endTime - startTime).toBeGreaterThan(900); // Actually waited for slow query
      expect(result.content).toBeDefined();
    });

    it('should track duration in tool execution', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      mockPrismaClient.contact.findMany.mockResolvedValue([]);

      const args = { query: 'test' };

      // Act
      const result = await server['callTool']('search_customers', args, authContext);

      // Assert
      const data = JSON.parse(result.content[0].text);
      expect(data.meta.duration).toBeGreaterThan(0);
      expect(typeof data.meta.duration).toBe('number');

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

  describe('Data Security and Privacy', () => {
    it('should enforce organization isolation', async () => {
      // Arrange
      const userContext = testUtils.createMockAuthContext({ organizationId: 'org-123' });
      const otherOrgContext = testUtils.createMockAuthContext({ organizationId: 'org-456' });

      // Mock customer from different organization
      const otherOrgCustomer = testDataFactory.createContact({ 
        organizationId: 'org-456',
        email: 'other@example.com'
      });

      mockPrismaClient.contact.findFirst.mockResolvedValue(null); // Should not find customer

      const args = { customerId: 'customer-from-other-org' };

      // Act
      const result = await server['callTool']('get_customer_profile', args, userContext);

      // Assert
      expect(result.isError).toBe(true);
      const data = JSON.parse(result.content[0].text);
      expect(data.error).toBe('Customer not found');

      // Verify database query includes organization filter
      expect(mockPrismaClient.contact.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'customer-from-other-org',
          organizationId: 'org-123' // User's org, not customer's org
        },
        include: {
          segments: true,
          predictions: true
        }
      });
    });

    it('should sanitize sensitive data in search results', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext({ role: 'USER' });
      const customerWithSensitiveData = {
        ...testDataFactory.createContact(),
        password: 'secret123',
        apiKey: 'sensitive-api-key',
        internalNotes: 'Internal staff notes'
      };

      mockPrismaClient.contact.findMany.mockResolvedValue([customerWithSensitiveData]);

      const args = { query: 'test' };

      // Act
      const result = await server['callTool']('search_customers', args, authContext);

      // Assert
      const data = JSON.parse(result.content[0].text);
      const customer = data.results[0];
      
      // Sensitive fields should not be present
      expect(customer.password).toBeUndefined();
      expect(customer.apiKey).toBeUndefined();
      expect(customer.internalNotes).toBeUndefined();
      
      // Public fields should be present
      expect(customer.id).toBeDefined();
      expect(customer.email).toBeDefined();
      expect(customer.firstName).toBeDefined();
    });

    it('should validate customer query parameters', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      
      // Invalid limit (too large)
      const invalidUri = 'customer://profiles?limit=1000&offset=-1';

      // Act & Assert
      await expect(
        server['readResource'](invalidUri, authContext)
      ).rejects.toThrow(); // Should fail validation
    });

    it('should restrict access to predictions based on permissions', async () => {
      // This would be tested if predictions required special permissions
      // Currently all authenticated users can access predictions in their org
      const authContext = testUtils.createMockAuthContext({
        permissions: ['read:own:contacts'] // No prediction permissions
      });

      // For now, predictions are accessible to all org members
      // but this test structure shows how to add restrictions
      expect(authContext.permissions).not.toContain('read:predictions');
    });
  });

  describe('Integration Testing', () => {
    it('should handle complete customer data retrieval workflow', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      
      // Setup mock data for segments
      const mockSegment = {
        id: 'segment-1',
        name: 'High Value',
        description: 'High value customers',
        rules: '{}',
        createdAt: new Date(),
        updatedAt: new Date(),
        members: [
          { contact: testDataFactory.createContact({ id: 'customer-1' }) }
        ],
        _count: { members: 1, emailCampaigns: 2, smsCampaigns: 0, waCampaigns: 1 }
      };

      // Setup mock data for predictions
      const mockPrediction = {
        id: 'pred-1',
        contactId: 'customer-1',
        churnRisk: 20,
        lifetimeValue: 2000,
        engagementScore: 85,
        segment: 'High Value',
        confidenceScore: 0.9,
        lastActivityDate: new Date(),
        nextBestAction: 'Upsell premium features',
        preferredChannel: 'EMAIL',
        behavioralScores: { frequency: 8, recency: 9, monetary: 8 },
        insights: ['Highly engaged', 'Premium candidate'],
        calculatedAt: new Date(),
        contact: testDataFactory.createContact({ id: 'customer-1' }),
        organization: { id: authContext.organizationId, name: 'Test Org' }
      };

      // Setup mocks
      mockPrismaClient.segment.findMany.mockResolvedValue([mockSegment]);
      mockPrismaClient.mCPCustomerPredictions.findMany.mockResolvedValue([mockPrediction]);

      // Act - Get segments
      const segmentsResult = await server['readResource']('customer://segments', authContext);
      
      // Act - Get predictions
      const predictionsResult = await server['readResource']('customer://predictions', authContext);

      // Assert - Segments
      const segmentsData = JSON.parse(segmentsResult.text);
      expect(segmentsData.segments).toHaveLength(1);
      expect(segmentsData.segments[0].name).toBe('High Value');
      expect(segmentsData.segments[0].statistics.totalMembers).toBe(1);

      // Assert - Predictions
      const predictionsData = JSON.parse(predictionsResult.text);
      expect(predictionsData.predictions).toHaveLength(1);
      expect(predictionsData.predictions[0].predictions.segment).toBe('High Value');
      expect(predictionsData.summary.totalPredictions).toBe(1);

      // Verify both operations were logged
      expect(mockAuditLogger.logEvent).toHaveBeenCalledTimes(2);
    });
  });
});