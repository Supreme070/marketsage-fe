/**
 * Base MCP Server for MarketSage
 * 
 * This class provides the foundation for all MCP servers with common functionality
 * including authentication, rate limiting, error handling, and fallback mechanisms.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import { 
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types';

import { 
  type MCPAuthContext, 
  type MCPAuthResult, 
  MCPError, 
  type MCPServerResponse,
  MCPAuthenticationError,
  MCPAuthorizationError,
  MCPRateLimitError,
  MCPValidationError
} from '../types/mcp-types';

import { type MCPServerConfig } from '../config/mcp-config';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../lib/auth';
import { prisma } from '../../lib/db/prisma';
import { redisCache, CACHE_KEYS, CACHE_TTL } from '../../lib/cache/redis-client';
import { enterpriseAuditLogger, type AuditAction, type ResourceType } from '../../lib/audit/enterprise-audit-logger';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

export abstract class BaseMCPServer {
  protected server: Server;
  protected config: MCPServerConfig;

  // Common validation schemas for MCP operations
  protected static readonly BaseQuerySchema = z.object({
    organizationId: z.string().uuid().optional(),
    limit: z.number().min(1).max(100).default(10),
    offset: z.number().min(0).default(0),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    search: z.string().max(100).optional()
  });

  protected static readonly ResourceUriSchema = z.object({
    uri: z.string().url('Invalid resource URI format')
  });

  protected static readonly ToolCallSchema = z.object({
    name: z.string().min(1, 'Tool name is required'),
    arguments: z.record(z.any()).optional()
  });

  constructor(config: MCPServerConfig) {
    this.config = config;
    this.server = new Server(
      {
        name: config.name,
        version: config.version,
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.setupBaseHandlers();
  }

  /**
   * Setup base handlers for all MCP servers
   */
  private setupBaseHandlers(): void {
    // List resources handler
    this.server.setRequestHandler(ListResourcesRequestSchema, async (request) => {
      try {
        const authResult = await this.authenticate(request);
        if (!authResult.success) {
          throw new MCPAuthenticationError(authResult.error || 'Authentication failed');
        }

        await this.checkRateLimit(authResult.context!.userId);
        
        const resources = await this.listResources(authResult.context!);
        return { resources };
      } catch (error) {
        throw this.handleError(error);
      }
    });

    // Read resource handler
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      try {
        const authResult = await this.authenticate(request);
        if (!authResult.success) {
          throw new MCPAuthenticationError(authResult.error || 'Authentication failed');
        }

        await this.checkRateLimit(authResult.context!.userId);
        
        const resourceContent = await this.readResource(request.params.uri, authResult.context!);
        return { contents: [resourceContent] };
      } catch (error) {
        throw this.handleError(error);
      }
    });

    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async (request) => {
      try {
        const authResult = await this.authenticate(request);
        if (!authResult.success) {
          throw new MCPAuthenticationError(authResult.error || 'Authentication failed');
        }

        await this.checkRateLimit(authResult.context!.userId);
        
        const tools = await this.listTools(authResult.context!);
        return { tools };
      } catch (error) {
        throw this.handleError(error);
      }
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const authResult = await this.authenticate(request);
        if (!authResult.success) {
          throw new MCPAuthenticationError(authResult.error || 'Authentication failed');
        }

        await this.checkRateLimit(authResult.context!.userId);
        
        const result = await this.callTool(
          request.params.name,
          request.params.arguments || {},
          authResult.context!
        );
        
        return result;
      } catch (error) {
        throw this.handleError(error);
      }
    });
  }

  /**
   * Authenticate the request
   */
  private async authenticate(request: any): Promise<MCPAuthResult> {
    if (!this.config.authentication.required) {
      return { success: true };
    }

    try {
      // Extract session from request headers or context
      const sessionToken = request.meta?.sessionToken || request.headers?.authorization;
      
      if (!sessionToken) {
        return { success: false, error: 'No authentication token provided' };
      }

      // Validate session using NextAuth
      const session = await this.validateSession(sessionToken);
      
      if (!session || !session.user) {
        return { success: false, error: 'Invalid session' };
      }

      // Create auth context
      const authContext: MCPAuthContext = {
        userId: session.user.id,
        organizationId: session.user.organizationId,
        role: session.user.role,
        permissions: this.getRolePermissions(session.user.role),
        sessionId: session.user.sessionId
      };

      // Log successful authentication
      await this.logMCPAuthEvent('success', session.user.id, sessionToken);
      
      return { success: true, context: authContext };
    } catch (error) {
      // Log failed authentication
      await this.logMCPAuthEvent('failure', undefined, sessionToken, error instanceof Error ? error.message : 'Unknown error');
      
      return { success: false, error: 'Authentication failed' };
    }
  }

  /**
   * Validate session token using NextAuth
   */
  private async validateSession(token: string): Promise<any> {
    try {
      // Handle different token formats
      let actualToken = token;
      
      // Remove 'Bearer ' prefix if present
      if (token.startsWith('Bearer ')) {
        actualToken = token.substring(7);
      }
      
      // For NextAuth JWT, we need to verify the token and extract user info
      // Since MCP servers run outside HTTP context, we need to manually verify JWT
      const nextAuthSecret = process.env.NEXTAUTH_SECRET;
      
      if (!nextAuthSecret) {
        console.error('NEXTAUTH_SECRET not configured for MCP session validation');
        return null;
      }

      // Verify and decode the JWT token
      const decoded = jwt.verify(actualToken, nextAuthSecret) as any;
      
      if (!decoded || !decoded.id) {
        return null;
      }

      // Get user details from database to ensure they still exist and get latest info
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          organization: {
            select: { id: true, name: true }
          }
        }
      });

      if (!user || !user.isActive) {
        return null;
      }

      // Update last login timestamp
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          organization: user.organization,
          sessionId: decoded.jti || `session_${Date.now()}`, // Use JWT ID or generate one
          isActive: user.isActive,
          lastLogin: new Date()
        }
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  /**
   * Get comprehensive role-based permissions aligned with existing User model
   */
  private getRolePermissions(role: string): string[] {
    const permissions: Record<string, string[]> = {
      USER: [
        'read:own:contacts',
        'read:own:campaigns', 
        'read:own:analytics',
        'read:own:workflows',
        'read:own:leadpulse',
        'write:own:contacts',
        'write:own:campaigns'
      ],
      ADMIN: [
        'read:own:contacts',
        'read:own:campaigns', 
        'read:own:analytics',
        'read:own:workflows',
        'read:own:leadpulse',
        'write:own:contacts',
        'write:own:campaigns',
        'write:own:workflows',
        'read:org:contacts',
        'read:org:campaigns',
        'read:org:analytics',
        'read:org:leadpulse',
        'write:org:contacts',
        'write:org:campaigns',
        'admin:org:users',
        'admin:org:settings'
      ],
      IT_ADMIN: [
        'read:own:contacts',
        'read:own:campaigns', 
        'read:own:analytics',
        'read:own:workflows',
        'read:own:leadpulse',
        'write:own:contacts',
        'write:own:campaigns',
        'write:own:workflows',
        'read:org:contacts',
        'read:org:campaigns',
        'read:org:analytics',
        'read:org:leadpulse',
        'read:org:workflows',
        'write:org:contacts',
        'write:org:campaigns',
        'write:org:workflows',
        'admin:org:users',
        'admin:org:settings',
        'admin:org:integrations',
        'admin:org:security',
        'read:org:monitoring',
        'write:org:monitoring'
      ],
      SUPER_ADMIN: ['*'], // All permissions
      AI_AGENT: [
        'read:org:contacts',
        'read:org:campaigns',
        'read:org:analytics',
        'read:org:leadpulse',
        'read:org:workflows',
        'write:org:analytics', // AI can update analytics
        'write:org:predictions', // AI can write predictions
        'admin:ai:tasks' // AI-specific permissions
      ]
    };

    return permissions[role] || ['read:own:basic'];
  }

  /**
   * Check if user has specific permission for a resource
   */
  protected hasPermission(authContext: MCPAuthContext, permission: string, resourceOrganizationId?: string): boolean {
    // SUPER_ADMIN has all permissions
    if (authContext.permissions.includes('*')) {
      return true;
    }

    // Check exact permission match
    if (authContext.permissions.includes(permission)) {
      return true;
    }

    // Handle organization-scoped permissions
    if (permission.includes(':org:') && resourceOrganizationId) {
      // User must be in the same organization to access org-scoped resources
      return authContext.organizationId === resourceOrganizationId;
    }

    // Handle own-scoped permissions
    if (permission.includes(':own:')) {
      return true; // If user has :own: permission, they can access their own resources
    }

    return false;
  }

  /**
   * Validate user can access organization data
   */
  protected async validateOrganizationAccess(authContext: MCPAuthContext, targetOrganizationId: string): Promise<boolean> {
    // SUPER_ADMIN can access any organization
    if (authContext.role === 'SUPER_ADMIN') {
      return true;
    }

    // Users can only access their own organization
    if (authContext.organizationId !== targetOrganizationId) {
      return false;
    }

    // Verify organization still exists and user is still a member
    try {
      const orgUser = await prisma.user.findFirst({
        where: {
          id: authContext.userId,
          organizationId: targetOrganizationId,
          isActive: true
        },
        select: { id: true }
      });

      return !!orgUser;
    } catch (error) {
      console.error('Organization access validation error:', error);
      return false;
    }
  }

  /**
   * Filter data based on user permissions and organization access
   */
  protected filterDataByPermissions<T extends { organizationId?: string; createdById?: string }>(
    data: T[], 
    authContext: MCPAuthContext,
    permission: string
  ): T[] {
    // SUPER_ADMIN sees everything
    if (authContext.permissions.includes('*')) {
      return data;
    }

    return data.filter(item => {
      // Check organization access
      if (item.organizationId) {
        if (permission.includes(':org:')) {
          return this.hasPermission(authContext, permission, item.organizationId);
        }
        if (permission.includes(':own:')) {
          return item.createdById === authContext.userId && 
                 item.organizationId === authContext.organizationId;
        }
      }

      // Default to own data only
      return item.createdById === authContext.userId;
    });
  }

  /**
   * Validate input data using Zod schema with comprehensive error handling
   */
  protected validateInput<T>(schema: z.ZodSchema<T>, data: unknown, context: string = 'input'): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        throw new MCPValidationError(
          `Invalid ${context}: ${formattedErrors.map(e => `${e.path}: ${e.message}`).join(', ')}`,
          formattedErrors
        );
      }
      throw new MCPValidationError(`Validation failed for ${context}: ${error}`);
    }
  }

  /**
   * Validate and sanitize query parameters with defaults
   */
  protected validateQuery<T extends Record<string, any>>(
    schema: z.ZodSchema<T>,
    params: Record<string, any>,
    authContext: MCPAuthContext
  ): T {
    // Apply organization context if not provided and user is not SUPER_ADMIN
    if (!params.organizationId && authContext.role !== 'SUPER_ADMIN') {
      params.organizationId = authContext.organizationId;
    }

    // Validate required permissions for organization access
    if (params.organizationId && params.organizationId !== authContext.organizationId) {
      if (!this.hasPermission(authContext, 'read:org:*', params.organizationId)) {
        throw new MCPAuthorizationError(
          `Insufficient permissions to access organization ${params.organizationId}`
        );
      }
    }

    return this.validateInput(schema, params, 'query parameters');
  }

  /**
   * Validate resource URI with security checks
   */
  protected validateResourceUri(uri: string, authContext: MCPAuthContext): string {
    const validated = this.validateInput(BaseMCPServer.ResourceUriSchema, { uri }, 'resource URI');
    
    // Extract organization from URI path if present
    const orgMatch = uri.match(/\/organizations\/([^\/]+)/);
    if (orgMatch) {
      const orgId = orgMatch[1];
      if (!this.hasPermission(authContext, 'read:org:*', orgId)) {
        throw new MCPAuthorizationError(
          `Insufficient permissions to access organization resources for ${orgId}`
        );
      }
    }

    // Additional security checks for sensitive resources
    const sensitivePatterns = [
      '/admin/',
      '/system/',
      '/internal/',
      '/secret/',
      '/config/',
      '/env'
    ];

    if (sensitivePatterns.some(pattern => uri.includes(pattern))) {
      if (!this.hasPermission(authContext, 'admin:org:*')) {
        throw new MCPAuthorizationError(
          'Insufficient permissions to access sensitive resources'
        );
      }
    }

    return validated.uri;
  }

  /**
   * Validate tool call arguments with permission checks
   */
  protected validateToolCall(name: string, args: any, authContext: MCPAuthContext): { name: string; args: any } {
    const validated = this.validateInput(BaseMCPServer.ToolCallSchema, { name, arguments: args }, 'tool call');
    
    // Check tool-specific permissions
    const toolPermissions: Record<string, string[]> = {
      'create_campaign': ['write:org:campaigns'],
      'delete_contact': ['write:org:contacts'],
      'export_data': ['admin:org:data'],
      'send_message': ['write:org:messaging'],
      'update_settings': ['admin:org:settings'],
      'view_analytics': ['read:org:analytics'],
      'manage_users': ['admin:org:users']
    };

    const requiredPermissions = toolPermissions[name] || ['read:own:basic'];
    
    for (const permission of requiredPermissions) {
      if (!this.hasPermission(authContext, permission)) {
        throw new MCPAuthorizationError(
          `Insufficient permissions to execute tool '${name}'. Required: ${requiredPermissions.join(', ')}`
        );
      }
    }

    return { name: validated.name, args: validated.arguments || {} };
  }

  /**
   * Sanitize data for output to prevent information leakage
   */
  protected sanitizeOutput<T extends Record<string, any>>(
    data: T, 
    authContext: MCPAuthContext,
    sensitiveFields: string[] = ['password', 'secret', 'token', 'key', 'hash']
  ): T {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...data };

    // Remove sensitive fields for non-admin users
    if (authContext.role !== 'SUPER_ADMIN') {
      for (const field of sensitiveFields) {
        if (field in sanitized) {
          delete sanitized[field];
        }
      }
    }

    // Recursively sanitize nested objects
    for (const key in sanitized) {
      if (sanitized[key] && typeof sanitized[key] === 'object') {
        if (Array.isArray(sanitized[key])) {
          sanitized[key] = sanitized[key].map((item: any) => 
            typeof item === 'object' ? this.sanitizeOutput(item, authContext, sensitiveFields) : item
          );
        } else {
          sanitized[key] = this.sanitizeOutput(sanitized[key], authContext, sensitiveFields);
        }
      }
    }

    return sanitized;
  }

  /**
   * Validate date range with business rules
   */
  protected validateDateRange(dateFrom?: string, dateTo?: string): { dateFrom?: Date; dateTo?: Date } {
    const result: { dateFrom?: Date; dateTo?: Date } = {};

    if (dateFrom) {
      result.dateFrom = new Date(dateFrom);
      if (isNaN(result.dateFrom.getTime())) {
        throw new MCPValidationError('Invalid dateFrom format. Use ISO 8601 format.');
      }
    }

    if (dateTo) {
      result.dateTo = new Date(dateTo);
      if (isNaN(result.dateTo.getTime())) {
        throw new MCPValidationError('Invalid dateTo format. Use ISO 8601 format.');
      }
    }

    // Validate date range logic
    if (result.dateFrom && result.dateTo) {
      if (result.dateFrom > result.dateTo) {
        throw new MCPValidationError('dateFrom cannot be later than dateTo');
      }

      // Limit date range to prevent excessive queries (max 1 year)
      const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
      if (result.dateTo.getTime() - result.dateFrom.getTime() > maxRange) {
        throw new MCPValidationError('Date range cannot exceed 1 year');
      }
    }

    // Prevent queries too far in the future
    const now = new Date();
    const maxFuture = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    if (result.dateFrom && result.dateFrom > maxFuture) {
      throw new MCPValidationError('dateFrom cannot be more than 30 days in the future');
    }

    if (result.dateTo && result.dateTo > maxFuture) {
      throw new MCPValidationError('dateTo cannot be more than 30 days in the future');
    }

    return result;
  }

  /**
   * Check rate limits using Redis for persistent, scalable rate limiting
   */
  private async checkRateLimit(userId: string): Promise<void> {
    try {
      const rateLimitKey = CACHE_KEYS.API_RATE_LIMIT(`${userId}:${this.config.name}`);
      const windowSeconds = Math.ceil(this.config.rateLimit.windowMs / 1000);
      
      // Use Redis to increment counter and set expiration atomically
      const currentCount = await redisCache.increment(rateLimitKey, 1);
      
      if (currentCount === null) {
        // Redis not available, fall back to allowing the request
        console.warn('Redis unavailable for rate limiting - allowing request');
        return;
      }

      // If this is the first request in the window, set the expiration
      if (currentCount === 1) {
        await redisCache.expire(rateLimitKey, windowSeconds);
      }

      // Check if rate limit exceeded
      if (currentCount > this.config.rateLimit.maxRequests) {
        // Get remaining time in the window
        const ttlKey = `${rateLimitKey}:ttl`;
        let remainingTime = windowSeconds;
        
        try {
          // Try to get more accurate remaining time
          const redisClient = (redisCache as any).client;
          if (redisClient && await redisClient.exists(rateLimitKey)) {
            remainingTime = await redisClient.ttl(rateLimitKey) || windowSeconds;
          }
        } catch (ttlError) {
          // Use default window time if TTL check fails
          console.warn('Could not get TTL for rate limit key:', ttlError);
        }

        // Audit log rate limit violation
        try {
          const authContext = await this.getAuthContextForUserId(userId);
          if (authContext) {
            await this.logMCPRateLimitEvent(authContext, currentCount, this.config.rateLimit.maxRequests, 'blocked');
          }
        } catch (auditError) {
          console.error('Failed to audit rate limit violation:', auditError);
        }

        throw new MCPRateLimitError(
          `Rate limit exceeded. Maximum ${this.config.rateLimit.maxRequests} requests per ${windowSeconds}s. Try again in ${remainingTime} seconds.`
        );
      }

      // Log rate limiting activity for monitoring
      if (currentCount > this.config.rateLimit.maxRequests * 0.8) {
        console.warn(`Rate limit warning for user ${userId} on ${this.config.name}: ${currentCount}/${this.config.rateLimit.maxRequests} requests`);
        
        // Audit log warning when approaching rate limit
        try {
          const authContext = await this.getAuthContextForUserId(userId);
          if (authContext) {
            await this.logMCPRateLimitEvent(authContext, currentCount, this.config.rateLimit.maxRequests, 'warning');
          }
        } catch (auditError) {
          console.error('Failed to audit rate limit warning:', auditError);
        }
      }

    } catch (error) {
      if (error instanceof MCPRateLimitError) {
        throw error; // Re-throw rate limit errors
      }
      
      // For other errors (Redis connection issues), log and allow the request
      console.error('Rate limiting error - allowing request:', error);
    }
  }

  /**
   * Get current rate limiting status for a user (for monitoring/debugging)
   */
  protected async getRateLimitStatus(userId: string): Promise<{
    current: number;
    limit: number;
    windowSeconds: number;
    remainingTime: number;
    percentageUsed: number;
  } | null> {
    try {
      const rateLimitKey = CACHE_KEYS.API_RATE_LIMIT(`${userId}:${this.config.name}`);
      const windowSeconds = Math.ceil(this.config.rateLimit.windowMs / 1000);
      
      // Get current count
      const currentCountStr = await redisCache.get<string>(rateLimitKey);
      const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;
      
      // Get remaining time
      let remainingTime = 0;
      try {
        const redisClient = (redisCache as any).client;
        if (redisClient && await redisClient.exists(rateLimitKey)) {
          remainingTime = await redisClient.ttl(rateLimitKey) || 0;
        }
      } catch (ttlError) {
        console.warn('Could not get TTL for rate limit status:', ttlError);
      }

      return {
        current: currentCount,
        limit: this.config.rateLimit.maxRequests,
        windowSeconds,
        remainingTime,
        percentageUsed: (currentCount / this.config.rateLimit.maxRequests) * 100
      };
    } catch (error) {
      console.error('Error getting rate limit status:', error);
      return null;
    }
  }

  /**
   * Log MCP authentication events for security monitoring
   */
  protected async logMCPAuthEvent(
    outcome: 'success' | 'failure',
    userId?: string,
    sessionToken?: string,
    errorMessage?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const actorIdentifier = userId || sessionToken?.substring(0, 10) || 'unknown';
      
      if (outcome === 'failure') {
        await enterpriseAuditLogger.logSecurityEvent(
          'FAILED_LOGIN',
          actorIdentifier,
          {
            riskLevel: 'medium',
            description: `MCP authentication failed: ${errorMessage || 'Invalid credentials'}`,
            ipAddress,
            userAgent,
            resourceType: 'API_KEY',
            metadata: {
              serverName: this.config.name,
              authMethod: 'session',
              timestamp: new Date().toISOString()
            }
          }
        );
      } else {
        // Log successful authentication
        await enterpriseAuditLogger.logEvent({
          eventType: 'AUTHENTICATION',
          actor: {
            id: userId || 'mcp-user',
            type: 'user',
            identifier: actorIdentifier,
            ipAddress,
            userAgent
          },
          resource: {
            type: 'API_KEY',
            id: this.config.name,
            organizationId: await this.getOrganizationIdFromUser(userId)
          },
          action: 'LOGIN',
          outcome: 'success',
          details: {
            metadata: {
              serverName: this.config.name,
              authMethod: 'session'
            },
            riskLevel: 'low'
          },
          compliance: {
            dataClassification: 'internal',
            retentionDays: 365,
            gdprRelevant: false,
            hipaaRelevant: false,
            pciRelevant: false
          }
        });
      }
    } catch (error) {
      console.error('Failed to log MCP auth event:', error);
    }
  }

  /**
   * Log MCP resource access for compliance and monitoring
   */
  protected async logMCPResourceAccess(
    authContext: MCPAuthContext,
    resourceUri: string,
    action: 'LIST' | 'READ' | 'WRITE',
    outcome: 'success' | 'failure' | 'partial',
    details?: {
      duration?: number;
      errorMessage?: string;
      dataSize?: number;
      riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    }
  ): Promise<void> {
    try {
      const resourceType = this.mapResourceUriToType(resourceUri);
      const auditAction = this.mapMCPActionToAuditAction(action);
      
      await enterpriseAuditLogger.logEvent({
        eventType: 'DATA_ACCESS',
        actor: {
          id: authContext.userId,
          type: 'user',
          identifier: authContext.userId,
          sessionId: authContext.sessionId
        },
        resource: {
          type: resourceType,
          id: resourceUri,
          organizationId: authContext.organizationId
        },
        action: auditAction,
        outcome,
        details: {
          duration: details?.duration,
          errorMessage: details?.errorMessage,
          metadata: {
            serverName: this.config.name,
            resourceUri,
            dataSize: details?.dataSize,
            mcpAction: action
          },
          riskLevel: details?.riskLevel || this.calculateResourceRiskLevel(resourceType, action)
        },
        compliance: {
          dataClassification: this.classifyMCPResource(resourceType),
          retentionDays: this.getMCPRetentionPeriod(resourceType),
          gdprRelevant: this.isGDPRRelevantResource(resourceType),
          hipaaRelevant: false,
          pciRelevant: false
        }
      });
    } catch (error) {
      console.error('Failed to log MCP resource access:', error);
    }
  }

  /**
   * Log MCP tool execution for security and performance monitoring
   */
  protected async logMCPToolExecution(
    authContext: MCPAuthContext,
    toolName: string,
    args: any,
    outcome: 'success' | 'failure' | 'partial',
    details?: {
      duration?: number;
      errorMessage?: string;
      outputSize?: number;
      riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    }
  ): Promise<void> {
    try {
      const riskLevel = details?.riskLevel || this.calculateToolRiskLevel(toolName, args);
      
      await enterpriseAuditLogger.logEvent({
        eventType: 'API_ACCESS',
        actor: {
          id: authContext.userId,
          type: 'user',
          identifier: authContext.userId,
          sessionId: authContext.sessionId
        },
        resource: {
          type: 'API_KEY',
          id: `mcp-tool-${toolName}`,
          organizationId: authContext.organizationId
        },
        action: 'CREATE', // Tool execution is creating/processing
        outcome,
        details: {
          duration: details?.duration,
          errorMessage: details?.errorMessage,
          metadata: {
            serverName: this.config.name,
            toolName,
            argumentsHash: this.hashArguments(args),
            outputSize: details?.outputSize,
            userRole: authContext.role
          },
          riskLevel
        },
        compliance: {
          dataClassification: riskLevel === 'critical' ? 'restricted' : 'internal',
          retentionDays: 365,
          gdprRelevant: this.toolProcessesPersonalData(toolName),
          hipaaRelevant: false,
          pciRelevant: false
        }
      });
    } catch (error) {
      console.error('Failed to log MCP tool execution:', error);
    }
  }

  /**
   * Log MCP rate limiting events for security monitoring
   */
  protected async logMCPRateLimitEvent(
    authContext: MCPAuthContext,
    currentCount: number,
    limit: number,
    action: 'warning' | 'blocked'
  ): Promise<void> {
    try {
      if (action === 'blocked') {
        await enterpriseAuditLogger.logSecurityEvent(
          'SUSPICIOUS_ACTIVITY',
          authContext.userId,
          {
            riskLevel: 'medium',
            description: `MCP rate limit exceeded: ${currentCount}/${limit} requests`,
            resourceType: 'API_KEY',
            resourceId: this.config.name,
            metadata: {
              serverName: this.config.name,
              currentCount,
              limit,
              userRole: authContext.role,
              organizationId: authContext.organizationId
            }
          }
        );
      } else {
        // Warning: approaching rate limit
        await enterpriseAuditLogger.logEvent({
          eventType: 'SYSTEM_ADMIN',
          actor: {
            id: authContext.userId,
            type: 'user',
            identifier: authContext.userId
          },
          resource: {
            type: 'API_KEY',
            id: this.config.name,
            organizationId: authContext.organizationId
          },
          action: 'READ',
          outcome: 'success',
          details: {
            metadata: {
              event: 'rate_limit_warning',
              currentCount,
              limit,
              percentageUsed: (currentCount / limit) * 100
            },
            riskLevel: 'low'
          },
          compliance: {
            dataClassification: 'internal',
            retentionDays: 90,
            gdprRelevant: false,
            hipaaRelevant: false,
            pciRelevant: false
          }
        });
      }
    } catch (error) {
      console.error('Failed to log MCP rate limit event:', error);
    }
  }

  /**
   * Helper method to get organization ID from user ID
   */
  private async getOrganizationIdFromUser(userId?: string): Promise<string> {
    if (!userId) return 'unknown';
    
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { organizationId: true }
      });
      return user?.organizationId || 'unknown';
    } catch (error) {
      console.error('Failed to get organization ID from user:', error);
      return 'unknown';
    }
  }

  /**
   * Helper method to get auth context for a user ID (for audit logging)
   */
  private async getAuthContextForUserId(userId: string): Promise<MCPAuthContext | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          role: true,
          organizationId: true
        }
      });

      if (!user) return null;

      return {
        userId: user.id,
        organizationId: user.organizationId,
        role: user.role as any,
        permissions: this.getRolePermissions(user.role),
        sessionId: `audit_${Date.now()}`
      };
    } catch (error) {
      console.error('Failed to get auth context for user:', error);
      return null;
    }
  }

  /**
   * Map MCP resource URI to audit resource type
   */
  private mapResourceUriToType(resourceUri: string): ResourceType {
    if (resourceUri.includes('/customers/') || resourceUri.includes('/contacts/')) {
      return 'CONTACT';
    }
    if (resourceUri.includes('/campaigns/')) {
      return 'CAMPAIGN';
    }
    if (resourceUri.includes('/workflows/')) {
      return 'WORKFLOW';
    }
    if (resourceUri.includes('/organizations/')) {
      return 'ORGANIZATION';
    }
    if (resourceUri.includes('/monitoring/') || resourceUri.includes('/metrics/')) {
      return 'SYSTEM_SETTING';
    }
    return 'API_KEY'; // Default for unclassified resources
  }

  /**
   * Map MCP action to audit action
   */
  private mapMCPActionToAuditAction(mcpAction: 'LIST' | 'READ' | 'WRITE'): AuditAction {
    switch (mcpAction) {
      case 'LIST':
      case 'READ':
        return 'READ';
      case 'WRITE':
        return 'UPDATE';
      default:
        return 'READ';
    }
  }

  /**
   * Calculate risk level for resource access
   */
  private calculateResourceRiskLevel(
    resourceType: ResourceType,
    action: 'LIST' | 'READ' | 'WRITE'
  ): 'low' | 'medium' | 'high' | 'critical' {
    const sensitiveResources = ['USER', 'CONTACT', 'ORGANIZATION'];
    const highRiskActions = ['WRITE'];
    
    if (sensitiveResources.includes(resourceType) && highRiskActions.includes(action)) {
      return 'high';
    }
    if (sensitiveResources.includes(resourceType)) {
      return 'medium';
    }
    if (highRiskActions.includes(action)) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Calculate risk level for tool execution
   */
  private calculateToolRiskLevel(toolName: string, args: any): 'low' | 'medium' | 'high' | 'critical' {
    const criticalTools = ['delete_contact', 'delete_campaign', 'export_all_data'];
    const highRiskTools = ['send_message', 'create_campaign', 'update_settings'];
    
    if (criticalTools.includes(toolName)) {
      return 'critical';
    }
    if (highRiskTools.includes(toolName)) {
      return 'high';
    }
    if (toolName.includes('export') || toolName.includes('bulk')) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Classify MCP resource for compliance
   */
  private classifyMCPResource(resourceType: ResourceType): 'public' | 'internal' | 'confidential' | 'restricted' {
    const restrictedTypes = ['USER', 'SYSTEM_SETTING', 'API_KEY'];
    const confidentialTypes = ['CONTACT', 'ORGANIZATION'];
    
    if (restrictedTypes.includes(resourceType)) {
      return 'restricted';
    }
    if (confidentialTypes.includes(resourceType)) {
      return 'confidential';
    }
    return 'internal';
  }

  /**
   * Get retention period for MCP resources
   */
  private getMCPRetentionPeriod(resourceType: ResourceType): number {
    // MCP audit events generally have shorter retention than core business data
    switch (resourceType) {
      case 'USER':
      case 'ORGANIZATION':
        return 1095; // 3 years
      case 'CONTACT':
        return 730; // 2 years
      case 'CAMPAIGN':
      case 'WORKFLOW':
        return 365; // 1 year
      default:
        return 365; // Default 1 year
    }
  }

  /**
   * Check if resource type is GDPR relevant
   */
  private isGDPRRelevantResource(resourceType: ResourceType): boolean {
    return ['USER', 'CONTACT'].includes(resourceType);
  }

  /**
   * Check if tool processes personal data
   */
  private toolProcessesPersonalData(toolName: string): boolean {
    const personalDataTools = [
      'get_customer_profile',
      'update_contact',
      'export_contacts',
      'segment_customers'
    ];
    return personalDataTools.includes(toolName);
  }

  /**
   * Hash arguments for logging without exposing sensitive data
   */
  private hashArguments(args: any): string {
    try {
      const argsString = JSON.stringify(args, Object.keys(args).sort());
      const crypto = require('crypto');
      return crypto.createHash('sha256').update(argsString).digest('hex').substring(0, 16);
    } catch (error) {
      return 'hash_error';
    }
  }

  /**
   * Handle errors consistently
   */
  private handleError(error: unknown): McpError {
    if (error instanceof MCPAuthenticationError) {
      return new McpError(ErrorCode.InvalidRequest, error.message);
    }
    
    if (error instanceof MCPAuthorizationError) {
      return new McpError(ErrorCode.InvalidRequest, error.message);
    }
    
    if (error instanceof MCPRateLimitError) {
      return new McpError(ErrorCode.InvalidRequest, error.message);
    }
    
    if (error instanceof MCPValidationError) {
      return new McpError(ErrorCode.InvalidParams, error.message);
    }

    // Log unexpected errors
    console.error(`MCP Server Error in ${this.config.name}:`, error);
    
    return new McpError(
      ErrorCode.InternalError,
      'An internal server error occurred'
    );
  }

  /**
   * Create a fallback response when MCP fails
   */
  protected async createFallbackResponse<T>(
    fallbackFunction: () => Promise<T>,
    errorMessage: string
  ): Promise<MCPServerResponse<T>> {
    if (!this.config.fallback.enabled) {
      return {
        success: false,
        error: {
          code: 'FALLBACK_DISABLED',
          message: errorMessage,
          timestamp: new Date().toISOString()
        }
      };
    }

    try {
      const data = await fallbackFunction();
      return {
        success: true,
        data,
        meta: { fallbackUsed: true }
      };
    } catch (fallbackError) {
      return {
        success: false,
        error: {
          code: 'FALLBACK_FAILED',
          message: `Fallback failed: ${fallbackError}`,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    if (!this.config.enabled) {
      console.log(`MCP Server ${this.config.name} is disabled`);
      return;
    }

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.log(`MCP Server ${this.config.name} started on port ${this.config.port}`);
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    await this.server.close();
    console.log(`MCP Server ${this.config.name} stopped`);
  }

  // Abstract methods that must be implemented by subclasses
  protected abstract listResources(authContext: MCPAuthContext): Promise<any[]>;
  protected abstract readResource(uri: string, authContext: MCPAuthContext): Promise<any>;
  protected abstract listTools(authContext: MCPAuthContext): Promise<any[]>;
  protected abstract callTool(name: string, args: any, authContext: MCPAuthContext): Promise<any>;
}