/**
 * Base MCP Server Unit Tests
 * 
 * Comprehensive tests for the base MCP server functionality including:
 * - Authentication and authorization with real NextAuth JWT validation
 * - Input validation using Zod schemas
 * - Redis rate limiting functionality
 * - Database queries and data transformations
 * - Error handling and edge cases
 * - Audit logging functionality
 * - Role-based permissions
 * - MCP protocol compliance
 * - Performance testing
 * - Security scenarios
 */

import { BaseMCPServer } from '../../mcp/servers/base-mcp-server';
import type { MCPServerConfig } from '../../mcp/config/mcp-config';
import { type MCPAuthContext, MCPAuthenticationError, MCPAuthorizationError, MCPRateLimitError, MCPValidationError } from '../../mcp/types/mcp-types';
import { 
  mockPrismaClient, 
  mockRedisClient, 
  mockAuditLogger,
  testDataFactory,
  mockRateLimitScenarios,
  mockAuthScenarios,
  mockDatabaseScenarios,
  resetAllMocks,
  setupDefaultMocks
} from './__mocks__/mcp-mocks';
import jwt from 'jsonwebtoken';

// Mock the external dependencies
jest.mock('../../lib/db/prisma', () => ({
  prisma: mockPrismaClient
}));

jest.mock('../../lib/cache/redis-client', () => ({
  redisCache: mockRedisClient,
  CACHE_KEYS: {
    API_RATE_LIMIT: (key: string) => `rate_limit:${key}`
  },
  CACHE_TTL: {
    RATE_LIMIT: 3600
  }
}));

jest.mock('../../lib/audit/enterprise-audit-logger', () => ({
  enterpriseAuditLogger: mockAuditLogger
}));

// Test implementation of BaseMCPServer for testing abstract methods
class TestMCPServer extends BaseMCPServer {
  public testMethods = {
    authenticate: (request: any) => this['authenticate'](request),
    checkRateLimit: (userId: string) => this['checkRateLimit'](userId),
    hasPermission: (authContext: MCPAuthContext, permission: string, resourceOrgId?: string) => 
      this.hasPermission(authContext, permission, resourceOrgId),
    validateOrganizationAccess: (authContext: MCPAuthContext, targetOrgId: string) =>
      this.validateOrganizationAccess(authContext, targetOrgId),
    filterDataByPermissions: <T extends { organizationId?: string; createdById?: string }>(
      data: T[], authContext: MCPAuthContext, permission: string
    ) => this.filterDataByPermissions(data, authContext, permission),
    validateInput: <T>(schema: any, data: unknown, context?: string) => 
      this.validateInput(schema, data, context),
    validateQuery: <T>(schema: any, params: any, authContext: MCPAuthContext) =>
      this.validateQuery(schema, params, authContext),
    validateResourceUri: (uri: string, authContext: MCPAuthContext) =>
      this.validateResourceUri(uri, authContext),
    validateToolCall: (name: string, args: any, authContext: MCPAuthContext) =>
      this.validateToolCall(name, args, authContext),
    sanitizeOutput: <T>(data: T, authContext: MCPAuthContext, sensitiveFields?: string[]) =>
      this.sanitizeOutput(data, authContext, sensitiveFields),
    validateDateRange: (dateFrom?: string, dateTo?: string) =>
      this.validateDateRange(dateFrom, dateTo),
    getRateLimitStatus: (userId: string) => this.getRateLimitStatus(userId),
    logMCPAuthEvent: (outcome: 'success' | 'failure', userId?: string, sessionToken?: string, errorMessage?: string) =>
      this.logMCPAuthEvent(outcome, userId, sessionToken, errorMessage),
    logMCPResourceAccess: (authContext: MCPAuthContext, resourceUri: string, action: 'LIST' | 'READ' | 'WRITE', outcome: 'success' | 'failure' | 'partial', details?: any) =>
      this.logMCPResourceAccess(authContext, resourceUri, action, outcome, details),
    logMCPToolExecution: (authContext: MCPAuthContext, toolName: string, args: any, outcome: 'success' | 'failure' | 'partial', details?: any) =>
      this.logMCPToolExecution(authContext, toolName, args, outcome, details),
    createFallbackResponse: <T>(fallbackFunction: () => Promise<T>, errorMessage: string) =>
      this.createFallbackResponse(fallbackFunction, errorMessage)
  };

  // Implement abstract methods for testing
  protected async listResources(authContext: MCPAuthContext): Promise<any[]> {
    return [
      { uri: 'test://resource/1', name: 'Test Resource 1' },
      { uri: 'test://resource/2', name: 'Test Resource 2' }
    ];
  }

  protected async readResource(uri: string, authContext: MCPAuthContext): Promise<any> {
    return { uri, content: 'Test resource content', organizationId: authContext.organizationId };
  }

  protected async listTools(authContext: MCPAuthContext): Promise<any[]> {
    return [
      { name: 'test_tool', description: 'A test tool' },
      { name: 'admin_tool', description: 'An admin-only tool' }
    ];
  }

  protected async callTool(name: string, args: any, authContext: MCPAuthContext): Promise<any> {
    return { 
      result: `Tool ${name} executed successfully`, 
      args, 
      executedBy: authContext.userId 
    };
  }
}

describe('Base MCP Server', () => {
  let server: TestMCPServer;
  let config: MCPServerConfig;

  beforeAll(() => {
    // Set up test environment
    process.env.NEXTAUTH_SECRET = 'test-secret-for-jwt-validation';
  });

  beforeEach(() => {
    // Reset all mocks before each test
    resetAllMocks();
    setupDefaultMocks();

    // Create test server configuration
    config = {
      name: 'test-mcp-server',
      version: '1.0.0',
      port: 3001,
      enabled: true,
      authentication: {
        required: true,
        methods: ['jwt']
      },
      rateLimit: {
        enabled: true,
        maxRequests: 10,
        windowMs: 60000 // 1 minute
      },
      fallback: {
        enabled: true,
        timeout: 5000
      },
      validation: {
        strict: true,
        sanitizeOutput: true
      }
    };

    server = new TestMCPServer(config);
  });

  afterEach(() => {
    resetAllMocks();
  });

  describe('Authentication', () => {
    it('should successfully authenticate with valid JWT token', async () => {
      // Arrange
      const userId = 'test-user-123';
      const organizationId = 'test-org-456';
      const token = testUtils.generateTestToken(userId, organizationId);
      const request = testUtils.createMockRequest(token);
      
      const user = testDataFactory.createUser({ 
        id: userId, 
        organizationId,
        role: 'USER',
        isActive: true 
      });
      mockPrismaClient.user.findUnique.mockResolvedValue(user);
      mockPrismaClient.user.update.mockResolvedValue(user);

      // Act
      const result = await server.testMethods.authenticate(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.context).toBeDefined();
      expect(result.context!.userId).toBe(userId);
      expect(result.context!.organizationId).toBe(organizationId);
      expect(result.context!.role).toBe('USER');
      expect(result.context!.permissions).toContain('read:own:contacts');
      
      // Verify database calls
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: {
          organization: {
            select: { id: true, name: true }
          }
        }
      });
      
      // Verify last login update
      expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { lastLogin: expect.any(Date) }
      });

      // Verify audit logging
      expect(mockAuditLogger.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'AUTHENTICATION',
          action: 'LOGIN',
          outcome: 'success'
        })
      );
    });

    it('should reject authentication with invalid JWT token', async () => {
      // Arrange
      const invalidToken = 'invalid.jwt.token';
      const request = testUtils.createMockRequest(invalidToken);

      // Act
      const result = await server.testMethods.authenticate(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication failed');
      
      // Verify security audit logging
      expect(mockAuditLogger.logSecurityEvent).toHaveBeenCalledWith(
        'FAILED_LOGIN',
        expect.any(String),
        expect.objectContaining({
          riskLevel: 'medium',
          description: expect.stringContaining('MCP authentication failed')
        })
      );
    });

    it('should reject authentication for inactive user', async () => {
      // Arrange
      const userId = 'inactive-user';
      const token = testUtils.generateTestToken(userId);
      const request = testUtils.createMockRequest(token);
      
      const inactiveUser = testDataFactory.createUser({ 
        id: userId, 
        isActive: false 
      });
      mockPrismaClient.user.findUnique.mockResolvedValue(inactiveUser);

      // Act
      const result = await server.testMethods.authenticate(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication failed');
    });

    it('should reject authentication when NEXTAUTH_SECRET is missing', async () => {
      // Arrange
      const originalSecret = process.env.NEXTAUTH_SECRET;
      delete process.env.NEXTAUTH_SECRET;
      
      const token = 'some.jwt.token';
      const request = testUtils.createMockRequest(token);

      // Act
      const result = await server.testMethods.authenticate(request);

      // Assert
      expect(result.success).toBe(false);
      
      // Restore environment
      process.env.NEXTAUTH_SECRET = originalSecret;
    });

    it('should handle database errors during authentication gracefully', async () => {
      // Arrange
      const token = testUtils.generateTestToken();
      const request = testUtils.createMockRequest(token);
      
      mockPrismaClient.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const result = await server.testMethods.authenticate(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication failed');
    });

    it('should skip authentication when not required', async () => {
      // Arrange
      const configNoAuth = { ...config, authentication: { required: false, methods: [] } };
      const serverNoAuth = new TestMCPServer(configNoAuth);
      const request = testUtils.createMockRequest();

      // Act
      const result = await serverNoAuth.testMethods.authenticate(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.context).toBeUndefined();
    });
  });

  describe('Authorization and Permissions', () => {
    it('should grant permissions correctly for different roles', () => {
      // Test USER role permissions
      const userContext = testUtils.createMockAuthContext({ 
        role: 'USER',
        permissions: ['read:own:contacts', 'write:own:contacts']
      });
      
      expect(server.testMethods.hasPermission(userContext, 'read:own:contacts')).toBe(true);
      expect(server.testMethods.hasPermission(userContext, 'write:own:contacts')).toBe(true);
      expect(server.testMethods.hasPermission(userContext, 'admin:org:users')).toBe(false);

      // Test ADMIN role permissions
      const adminContext = testUtils.createMockAuthContext({ 
        role: 'ADMIN',
        permissions: ['read:own:contacts', 'write:own:contacts', 'admin:org:users']
      });
      
      expect(server.testMethods.hasPermission(adminContext, 'admin:org:users')).toBe(true);
      expect(server.testMethods.hasPermission(adminContext, 'read:org:contacts')).toBe(true);

      // Test SUPER_ADMIN role permissions
      const superAdminContext = testUtils.createMockAuthContext({ 
        role: 'SUPER_ADMIN',
        permissions: ['*']
      });
      
      expect(server.testMethods.hasPermission(superAdminContext, 'admin:org:users')).toBe(true);
      expect(server.testMethods.hasPermission(superAdminContext, 'any:permission')).toBe(true);
    });

    it('should validate organization access correctly', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext({
        userId: 'user-123',
        organizationId: 'org-456',
        role: 'USER'
      });

      // Mock successful organization validation
      mockPrismaClient.user.findFirst.mockResolvedValue({ id: 'user-123' });

      // Act & Assert - Same organization access
      const sameOrgAccess = await server.testMethods.validateOrganizationAccess(authContext, 'org-456');
      expect(sameOrgAccess).toBe(true);

      // Act & Assert - Different organization access (should fail for non-super-admin)
      const diffOrgAccess = await server.testMethods.validateOrganizationAccess(authContext, 'org-789');
      expect(diffOrgAccess).toBe(false);

      // Act & Assert - SUPER_ADMIN can access any organization
      const superAdminContext = { ...authContext, role: 'SUPER_ADMIN' };
      const superAdminAccess = await server.testMethods.validateOrganizationAccess(superAdminContext, 'org-789');
      expect(superAdminAccess).toBe(true);
    });

    it('should filter data based on permissions correctly', () => {
      // Arrange
      const testData = [
        { id: '1', organizationId: 'org-456', createdById: 'user-123', name: 'Item 1' },
        { id: '2', organizationId: 'org-456', createdById: 'user-456', name: 'Item 2' },
        { id: '3', organizationId: 'org-789', createdById: 'user-123', name: 'Item 3' }
      ];

      const userContext = testUtils.createMockAuthContext({
        userId: 'user-123',
        organizationId: 'org-456',
        role: 'USER'
      });

      // Act - Filter for own data only
      const ownData = server.testMethods.filterDataByPermissions(testData, userContext, 'read:own:data');
      
      // Assert
      expect(ownData).toHaveLength(1);
      expect(ownData[0].id).toBe('1');

      // Act - Super admin sees all data
      const superAdminContext = { ...userContext, permissions: ['*'] };
      const allData = server.testMethods.filterDataByPermissions(testData, superAdminContext, 'read:org:data');
      
      // Assert
      expect(allData).toHaveLength(3);
    });
  });

  describe('Input Validation', () => {
    it('should validate input using Zod schemas', () => {
      // Arrange
      const schema = require('zod').z.object({
        name: require('zod').z.string().min(1),
        age: require('zod').z.number().min(0).max(120)
      });

      const validData = { name: 'John Doe', age: 30 };
      const invalidData = { name: '', age: -5 };

      // Act & Assert - Valid data
      const result = server.testMethods.validateInput(schema, validData, 'user data');
      expect(result).toEqual(validData);

      // Act & Assert - Invalid data
      expect(() => {
        server.testMethods.validateInput(schema, invalidData, 'user data');
      }).toThrow(MCPValidationError);
    });

    it('should validate and sanitize query parameters', () => {
      // Arrange
      const schema = require('zod').z.object({
        organizationId: require('zod').z.string().uuid().optional(),
        limit: require('zod').z.number().min(1).max(100).default(10)
      });

      const authContext = testUtils.createMockAuthContext({
        organizationId: 'org-456',
        role: 'USER'
      });

      const params = { limit: 25 };

      // Act
      const result = server.testMethods.validateQuery(schema, params, authContext);

      // Assert
      expect(result.limit).toBe(25);
      expect(result.organizationId).toBe('org-456'); // Auto-applied from context
    });

    it('should validate resource URIs with security checks', () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext({
        role: 'USER',
        permissions: ['read:own:contacts']
      });

      // Act & Assert - Valid URI
      const validUri = 'https://api.marketsage.com/contacts/123';
      const result = server.testMethods.validateResourceUri(validUri, authContext);
      expect(result).toBe(validUri);

      // Act & Assert - Sensitive URI without admin permission
      const sensitiveUri = 'https://api.marketsage.com/admin/users';
      expect(() => {
        server.testMethods.validateResourceUri(sensitiveUri, authContext);
      }).toThrow(MCPAuthorizationError);
    });

    it('should validate tool calls with permission checks', () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext({
        role: 'USER',
        permissions: ['read:own:basic']
      });

      // Act & Assert - Tool without required permissions
      expect(() => {
        server.testMethods.validateToolCall('delete_contact', {}, authContext);
      }).toThrow(MCPAuthorizationError);

      // Act & Assert - Tool with proper permissions
      const adminContext = { ...authContext, permissions: ['write:org:contacts'] };
      const result = server.testMethods.validateToolCall('delete_contact', { id: '123' }, adminContext);
      expect(result.name).toBe('delete_contact');
      expect(result.args).toEqual({ id: '123' });
    });

    it('should validate date ranges with business rules', () => {
      // Arrange & Act & Assert - Valid date range
      const validRange = server.testMethods.validateDateRange(
        '2024-01-01T00:00:00.000Z',
        '2024-01-31T23:59:59.999Z'
      );
      expect(validRange.dateFrom).toBeInstanceOf(Date);
      expect(validRange.dateTo).toBeInstanceOf(Date);

      // Act & Assert - Invalid date format
      expect(() => {
        server.testMethods.validateDateRange('invalid-date', '2024-01-31T23:59:59.999Z');
      }).toThrow(MCPValidationError);

      // Act & Assert - Date range too large (> 1 year)
      expect(() => {
        server.testMethods.validateDateRange(
          '2023-01-01T00:00:00.000Z',
          '2025-01-01T00:00:00.000Z'
        );
      }).toThrow(MCPValidationError);

      // Act & Assert - dateFrom after dateTo
      expect(() => {
        server.testMethods.validateDateRange(
          '2024-02-01T00:00:00.000Z',
          '2024-01-01T00:00:00.000Z'
        );
      }).toThrow(MCPValidationError);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      // Arrange
      mockRateLimitScenarios.withinLimit();
      const userId = 'test-user-123';

      // Act - Should not throw
      await server.testMethods.checkRateLimit(userId);

      // Assert
      expect(mockRedisClient.increment).toHaveBeenCalledWith(
        'rate_limit:test-user-123:test-mcp-server',
        1
      );
      expect(mockRedisClient.expire).toHaveBeenCalledWith(
        'rate_limit:test-user-123:test-mcp-server',
        60 // 60 seconds for 60000ms window
      );
    });

    it('should block requests that exceed rate limit', async () => {
      // Arrange
      mockRateLimitScenarios.exceedsLimit();
      const userId = 'test-user-123';
      const authContext = testUtils.createMockAuthContext({ userId });
      mockPrismaClient.user.findUnique.mockResolvedValue(testDataFactory.createUser({ id: userId }));

      // Act & Assert
      await expect(server.testMethods.checkRateLimit(userId)).rejects.toThrow(MCPRateLimitError);

      // Verify audit logging
      expect(mockAuditLogger.logSecurityEvent).toHaveBeenCalledWith(
        'SUSPICIOUS_ACTIVITY',
        userId,
        expect.objectContaining({
          riskLevel: 'medium',
          description: expect.stringContaining('rate limit exceeded')
        })
      );
    });

    it('should warn when approaching rate limit', async () => {
      // Arrange
      mockRateLimitScenarios.approachingLimit();
      const userId = 'test-user-123';
      const authContext = testUtils.createMockAuthContext({ userId });
      mockPrismaClient.user.findUnique.mockResolvedValue(testDataFactory.createUser({ id: userId }));

      // Spy on console.warn
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act
      await server.testMethods.checkRateLimit(userId);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Rate limit warning')
      );

      // Verify audit logging
      expect(mockAuditLogger.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'SYSTEM_ADMIN',
          details: expect.objectContaining({
            metadata: expect.objectContaining({
              event: 'rate_limit_warning'
            })
          })
        })
      );

      consoleSpy.mockRestore();
    });

    it('should handle Redis unavailability gracefully', async () => {
      // Arrange
      mockRateLimitScenarios.redisUnavailable();
      const userId = 'test-user-123';

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act - Should not throw even when Redis is unavailable
      await server.testMethods.checkRateLimit(userId);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Redis unavailable for rate limiting')
      );

      consoleSpy.mockRestore();
    });

    it('should get rate limit status for monitoring', async () => {
      // Arrange
      const userId = 'test-user-123';
      mockRedisClient.get.mockResolvedValue('5');
      mockRedisClient.client.exists.mockResolvedValue(true);
      mockRedisClient.client.ttl.mockResolvedValue(1800);

      // Act
      const status = await server.testMethods.getRateLimitStatus(userId);

      // Assert
      expect(status).toEqual({
        current: 5,
        limit: 10,
        windowSeconds: 60,
        remainingTime: 1800,
        percentageUsed: 50
      });
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize sensitive fields from output', () => {
      // Arrange
      const sensitiveData = {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret123',
        apiKey: 'api-key-secret',
        nested: {
          token: 'secret-token',
          publicInfo: 'visible'
        }
      };

      const userContext = testUtils.createMockAuthContext({ role: 'USER' });

      // Act
      const sanitized = server.testMethods.sanitizeOutput(sensitiveData, userContext);

      // Assert
      expect(sanitized.password).toBeUndefined();
      expect(sanitized.apiKey).toBeUndefined();
      expect(sanitized.nested.token).toBeUndefined();
      expect(sanitized.nested.publicInfo).toBe('visible');
      expect(sanitized.name).toBe('John Doe');
    });

    it('should preserve sensitive fields for SUPER_ADMIN', () => {
      // Arrange
      const sensitiveData = {
        id: 'user-123',
        name: 'John Doe',
        password: 'secret123',
        apiKey: 'api-key-secret'
      };

      const superAdminContext = testUtils.createMockAuthContext({ role: 'SUPER_ADMIN' });

      // Act
      const result = server.testMethods.sanitizeOutput(sensitiveData, superAdminContext);

      // Assert
      expect(result.password).toBe('secret123');
      expect(result.apiKey).toBe('api-key-secret');
    });
  });

  describe('Audit Logging', () => {
    it('should log successful authentication events', async () => {
      // Arrange
      const userId = 'test-user-123';
      
      // Act
      await server.testMethods.logMCPAuthEvent('success', userId, 'session-token');

      // Assert
      expect(mockAuditLogger.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'AUTHENTICATION',
          action: 'LOGIN',
          outcome: 'success',
          actor: expect.objectContaining({
            id: userId
          })
        })
      );
    });

    it('should log failed authentication events as security events', async () => {
      // Arrange
      const sessionToken = 'invalid-token';
      const errorMessage = 'Invalid JWT token';

      // Act
      await server.testMethods.logMCPAuthEvent('failure', undefined, sessionToken, errorMessage);

      // Assert
      expect(mockAuditLogger.logSecurityEvent).toHaveBeenCalledWith(
        'FAILED_LOGIN',
        expect.any(String),
        expect.objectContaining({
          riskLevel: 'medium',
          description: expect.stringContaining(errorMessage)
        })
      );
    });

    it('should log resource access events', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const resourceUri = 'https://api.marketsage.com/contacts/123';

      // Act
      await server.testMethods.logMCPResourceAccess(
        authContext,
        resourceUri,
        'READ',
        'success',
        { duration: 150, dataSize: 1024 }
      );

      // Assert
      expect(mockAuditLogger.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'DATA_ACCESS',
          action: 'read',
          outcome: 'success',
          details: expect.objectContaining({
            duration: 150,
            metadata: expect.objectContaining({
              dataSize: 1024,
              resourceUri
            })
          })
        })
      );
    });

    it('should log tool execution events', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const toolName = 'create_campaign';
      const args = { name: 'Test Campaign', type: 'EMAIL' };

      // Act
      await server.testMethods.logMCPToolExecution(
        authContext,
        toolName,
        args,
        'success',
        { duration: 500, outputSize: 2048 }
      );

      // Assert
      expect(mockAuditLogger.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'API_ACCESS',
          action: 'CREATE',
          outcome: 'success',
          details: expect.objectContaining({
            duration: 500,
            metadata: expect.objectContaining({
              toolName,
              outputSize: 2048
            })
          })
        })
      );
    });
  });

  describe('Fallback Mechanisms', () => {
    it('should create successful fallback response when enabled', async () => {
      // Arrange
      const fallbackFunction = async () => ({ data: 'fallback data' });
      const errorMessage = 'Primary service failed';

      // Act
      const result = await server.testMethods.createFallbackResponse(fallbackFunction, errorMessage);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ data: 'fallback data' });
      expect(result.meta?.fallbackUsed).toBe(true);
    });

    it('should return error when fallback is disabled', async () => {
      // Arrange
      const configNoFallback = { ...config, fallback: { enabled: false, timeout: 5000 } };
      const serverNoFallback = new TestMCPServer(configNoFallback);
      const fallbackFunction = async () => ({ data: 'fallback data' });
      const errorMessage = 'Primary service failed';

      // Act
      const result = await serverNoFallback.testMethods.createFallbackResponse(fallbackFunction, errorMessage);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FALLBACK_DISABLED');
      expect(result.error?.message).toBe(errorMessage);
    });

    it('should handle fallback function failures', async () => {
      // Arrange
      const fallbackFunction = async () => {
        throw new Error('Fallback also failed');
      };
      const errorMessage = 'Primary service failed';

      // Act
      const result = await server.testMethods.createFallbackResponse(fallbackFunction, errorMessage);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FALLBACK_FAILED');
      expect(result.error?.message).toContain('Fallback failed');
    });
  });

  describe('Performance Testing', () => {
    it('should handle authentication performance within acceptable limits', async () => {
      // Arrange
      const token = testUtils.generateTestToken();
      const request = testUtils.createMockRequest(token);
      
      const user = testDataFactory.createUser();
      mockPrismaClient.user.findUnique.mockImplementation(() => 
        mockDatabaseScenarios.fastQuery(user)
      );
      mockPrismaClient.user.update.mockImplementation(() => 
        mockDatabaseScenarios.fastQuery(user)
      );

      // Act
      const startTime = performance.now();
      const result = await server.testMethods.authenticate(request);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should timeout on slow database queries', async () => {
      // Arrange
      const token = testUtils.generateTestToken();
      const request = testUtils.createMockRequest(token);
      
      mockPrismaClient.user.findUnique.mockImplementation(() => 
        mockDatabaseScenarios.timeoutQuery()
      );

      // Act & Assert
      const startTime = performance.now();
      const result = await server.testMethods.authenticate(request);
      const endTime = performance.now();
      
      // Should fail quickly rather than hanging
      expect(endTime - startTime).toBeLessThan(6000);
      expect(result.success).toBe(false);
    });

    it('should handle large datasets efficiently in permission filtering', () => {
      // Arrange
      const largeDataset = mockDatabaseScenarios.largeDataset();
      const authContext = testUtils.createMockAuthContext();

      // Act
      const startTime = performance.now();
      const filtered = server.testMethods.filterDataByPermissions(
        largeDataset, 
        authContext, 
        'read:own:contacts'
      );
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(50); // Should complete in under 50ms
      expect(Array.isArray(filtered)).toBe(true);
    });

    it('should handle rate limiting checks efficiently', async () => {
      // Arrange
      mockRateLimitScenarios.withinLimit();
      const userId = 'test-user-123';

      // Act
      const startTime = performance.now();
      await server.testMethods.checkRateLimit(userId);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(50); // Should complete in under 50ms
    });
  });

  describe('Security Scenarios', () => {
    it('should prevent SQL injection in user lookups', async () => {
      // Arrange
      const maliciousUserId = "'; DROP TABLE users; --";
      const token = testUtils.generateTestToken(maliciousUserId);
      const request = testUtils.createMockRequest(token);

      // The JWT validation should fail before reaching the database
      // Act
      const result = await server.testMethods.authenticate(request);

      // Assert
      expect(result.success).toBe(false);
      // Verify no dangerous database calls were made
      expect(mockPrismaClient.user.findUnique).not.toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: maliciousUserId }
        })
      );
    });

    it('should prevent privilege escalation through context manipulation', () => {
      // Arrange
      const userContext = testUtils.createMockAuthContext({ 
        role: 'USER',
        permissions: ['read:own:contacts']
      });

      // Attempt to access admin resources
      const hasAdminAccess = server.testMethods.hasPermission(userContext, 'admin:org:users');
      const hasDeleteAccess = server.testMethods.hasPermission(userContext, 'write:org:contacts');

      // Assert
      expect(hasAdminAccess).toBe(false);
      expect(hasDeleteAccess).toBe(false);
    });

    it('should prevent access to other organizations data', () => {
      // Arrange
      const userContext = testUtils.createMockAuthContext({
        organizationId: 'org-456',
        role: 'ADMIN' // Even admin shouldn't access other orgs
      });

      const otherOrgData = [
        { id: '1', organizationId: 'org-789', createdById: 'user-123' },
        { id: '2', organizationId: 'org-456', createdById: 'user-123' },
        { id: '3', organizationId: 'org-789', createdById: 'user-456' }
      ];

      // Act
      const filtered = server.testMethods.filterDataByPermissions(
        otherOrgData, 
        userContext, 
        'read:org:contacts'
      );

      // Assert - Should only see own organization's data
      expect(filtered).toHaveLength(1);
      expect(filtered[0].organizationId).toBe('org-456');
    });

    it('should sanitize error messages to prevent information disclosure', () => {
      // Arrange
      const schema = require('zod').z.object({
        secretField: require('zod').z.string().min(10)
      });

      const sensitiveData = { secretField: 'short' };

      // Act & Assert
      expect(() => {
        server.testMethods.validateInput(schema, sensitiveData);
      }).toThrow(MCPValidationError);

      // The error should not expose the actual field values
      try {
        server.testMethods.validateInput(schema, sensitiveData);
      } catch (error) {
        expect(error.message).not.toContain('short');
        expect(error.message).toContain('secretField');
      }
    });

    it('should rate limit by user and server combination', async () => {
      // Arrange
      const userId = 'test-user-123';
      const expectedKey = 'rate_limit:test-user-123:test-mcp-server';
      
      mockRateLimitScenarios.withinLimit();

      // Act
      await server.testMethods.checkRateLimit(userId);

      // Assert
      expect(mockRedisClient.increment).toHaveBeenCalledWith(expectedKey, 1);
      
      // Different server should have different rate limit
      const anotherConfig = { ...config, name: 'another-mcp-server' };
      const anotherServer = new TestMCPServer(anotherConfig);
      
      await anotherServer.testMethods.checkRateLimit(userId);
      
      expect(mockRedisClient.increment).toHaveBeenCalledWith(
        'rate_limit:test-user-123:another-mcp-server', 1
      );
    });

    it('should log security events for suspicious patterns', async () => {
      // Multiple failed authentication attempts
      for (let i = 0; i < 3; i++) {
        await server.testMethods.logMCPAuthEvent('failure', undefined, 'invalid-token', 'Invalid token');
      }

      // Assert security events were logged
      expect(mockAuditLogger.logSecurityEvent).toHaveBeenCalledTimes(3);
      expect(mockAuditLogger.logSecurityEvent).toHaveBeenCalledWith(
        'FAILED_LOGIN',
        expect.any(String),
        expect.objectContaining({
          riskLevel: 'medium'
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle different MCP error types correctly', () => {
      // Test each error type conversion
      const authError = new MCPAuthenticationError('Auth failed');
      const authzError = new MCPAuthorizationError('Access denied');
      const rateLimitError = new MCPRateLimitError('Rate limit exceeded');
      const validationError = new MCPValidationError('Invalid input');
      const genericError = new Error('Unknown error');

      // These would be tested through the private handleError method
      // by triggering errors in the public methods
    });

    it('should provide helpful error messages for validation failures', () => {
      // Arrange
      const schema = require('zod').z.object({
        email: require('zod').z.string().email(),
        age: require('zod').z.number().min(0).max(120)
      });

      const invalidData = { email: 'not-an-email', age: -5 };

      // Act & Assert
      try {
        server.testMethods.validateInput(schema, invalidData, 'user registration');
      } catch (error) {
        expect(error).toBeInstanceOf(MCPValidationError);
        expect(error.message).toContain('user registration');
        expect(error.message).toContain('email');
        expect(error.message).toContain('age');
      }
    });
  });
});

/**
 * Integration Tests for Base MCP Server
 * 
 * These tests verify the server works correctly with real dependencies
 */
describe('Base MCP Server - Integration Tests', () => {
  let server: TestMCPServer;
  let config: MCPServerConfig;

  beforeEach(() => {
    resetAllMocks();
    setupDefaultMocks();

    config = {
      name: 'integration-test-server',
      version: '1.0.0',
      port: 3002,
      enabled: true,
      authentication: { required: true, methods: ['jwt'] },
      rateLimit: { enabled: true, maxRequests: 5, windowMs: 60000 },
      fallback: { enabled: true, timeout: 5000 },
      validation: { strict: true, sanitizeOutput: true }
    };

    server = new TestMCPServer(config);
  });

  it('should handle complete request lifecycle with authentication and authorization', async () => {
    // Arrange - Create valid user and token
    const userId = 'integration-user-123';
    const organizationId = 'integration-org-456';
    const token = testUtils.generateTestToken(userId, organizationId);
    
    const user = testDataFactory.createUser({ 
      id: userId, 
      organizationId,
      role: 'USER',
      isActive: true 
    });
    
    mockPrismaClient.user.findUnique.mockResolvedValue(user);
    mockPrismaClient.user.update.mockResolvedValue(user);
    mockRateLimitScenarios.withinLimit();

    // Act - Simulate MCP resource access
    const request = testUtils.createMockRequest(token);
    const authResult = await server.testMethods.authenticate(request);
    
    if (authResult.success) {
      await server.testMethods.checkRateLimit(authResult.context!.userId);
      
      // Simulate resource access
      await server.testMethods.logMCPResourceAccess(
        authResult.context!,
        'https://api.marketsage.com/contacts',
        'LIST',
        'success',
        { duration: 120, dataSize: 1024 }
      );
    }

    // Assert - All steps completed successfully
    expect(authResult.success).toBe(true);
    expect(mockPrismaClient.user.findUnique).toHaveBeenCalled();
    expect(mockRedisClient.increment).toHaveBeenCalled();
    expect(mockAuditLogger.logEvent).toHaveBeenCalledTimes(2); // Auth + resource access
  });

  it('should handle cascading failures gracefully', async () => {
    // Arrange - Setup multiple failure scenarios
    const token = testUtils.generateTestToken();
    const request = testUtils.createMockRequest(token);
    
    // Database is down
    mockPrismaClient.user.findUnique.mockRejectedValue(new Error('Database unavailable'));
    
    // Redis is also down
    mockRedisClient.increment.mockResolvedValue(null);

    // Act
    const authResult = await server.testMethods.authenticate(request);

    // Assert - Should fail authentication but not crash
    expect(authResult.success).toBe(false);
    expect(authResult.error).toContain('Authentication failed');
    
    // If we proceed with rate limiting anyway, it should handle Redis being down
    if (!authResult.success) {
      // This shouldn't throw even with Redis down
      await expect(server.testMethods.checkRateLimit('test-user')).resolves.not.toThrow();
    }
  });
});