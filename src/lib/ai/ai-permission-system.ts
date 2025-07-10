/**
 * AI Permission System
 * ===================
 * 
 * Role-based permission system specifically designed for AI operations
 * Supports delegation, temporal permissions, and risk-based authorization
 */

import { UserRole } from '@prisma/client';
import { AuthorizationService, Permission } from '@/lib/security/authorization';
import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';
import { redisCache } from '@/lib/cache/redis-client';

// AI-specific permissions
export enum AIPermission {
  // Basic AI operations
  USE_AI_CHAT = 'USE_AI_CHAT',
  USE_AI_ANALYSIS = 'USE_AI_ANALYSIS',
  USE_AI_PREDICTION = 'USE_AI_PREDICTION',
  USE_AI_CONTENT_GENERATION = 'USE_AI_CONTENT_GENERATION',
  
  // Task execution permissions
  EXECUTE_READ_TASKS = 'EXECUTE_READ_TASKS',
  EXECUTE_CREATE_TASKS = 'EXECUTE_CREATE_TASKS',
  EXECUTE_UPDATE_TASKS = 'EXECUTE_UPDATE_TASKS',
  EXECUTE_DELETE_TASKS = 'EXECUTE_DELETE_TASKS',
  EXECUTE_BULK_OPERATIONS = 'EXECUTE_BULK_OPERATIONS',
  
  // Data access permissions
  ACCESS_CONTACT_DATA = 'ACCESS_CONTACT_DATA',
  ACCESS_CAMPAIGN_DATA = 'ACCESS_CAMPAIGN_DATA',
  ACCESS_ANALYTICS_DATA = 'ACCESS_ANALYTICS_DATA',
  ACCESS_ORGANIZATION_DATA = 'ACCESS_ORGANIZATION_DATA',
  
  // Administrative AI permissions
  CONFIGURE_AI_SETTINGS = 'CONFIGURE_AI_SETTINGS',
  APPROVE_AI_OPERATIONS = 'APPROVE_AI_OPERATIONS',
  DELEGATE_AI_PERMISSIONS = 'DELEGATE_AI_PERMISSIONS',
  MANAGE_AI_WORKFLOWS = 'MANAGE_AI_WORKFLOWS',
  
  // Advanced AI capabilities
  AUTONOMOUS_TASK_EXECUTION = 'AUTONOMOUS_TASK_EXECUTION',
  CROSS_SYSTEM_INTEGRATION = 'CROSS_SYSTEM_INTEGRATION',
  PREDICTIVE_ACTIONS = 'PREDICTIVE_ACTIONS',
  LEARNING_FROM_DATA = 'LEARNING_FROM_DATA',
  
  // Emergency and override permissions
  EMERGENCY_OVERRIDE = 'EMERGENCY_OVERRIDE',
  SYSTEM_ADMINISTRATION = 'SYSTEM_ADMINISTRATION'
}

// Risk levels for AI operations
export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// AI operation types with risk mapping
export const AI_OPERATION_RISKS: Record<string, RiskLevel> = {
  'READ_contact': RiskLevel.LOW,
  'read_campaign': RiskLevel.LOW,
  'read_analytics': RiskLevel.LOW,
  'create_contact': RiskLevel.MEDIUM,
  'update_contact': RiskLevel.MEDIUM,
  'create_campaign': RiskLevel.HIGH,
  'send_campaign': RiskLevel.HIGH,
  'delete_contact': RiskLevel.HIGH,
  'delete_campaign': RiskLevel.CRITICAL,
  'bulk_delete': RiskLevel.CRITICAL,
  'system_configuration': RiskLevel.CRITICAL
};

// Base AI permissions for each role
const userAIPermissions = [
  AIPermission.USE_AI_CHAT,
  AIPermission.USE_AI_ANALYSIS,
  AIPermission.USE_AI_PREDICTION,
  AIPermission.USE_AI_CONTENT_GENERATION,
  AIPermission.EXECUTE_READ_TASKS,
  AIPermission.EXECUTE_CREATE_TASKS,
  AIPermission.EXECUTE_UPDATE_TASKS,
  AIPermission.ACCESS_CONTACT_DATA,
  AIPermission.ACCESS_CAMPAIGN_DATA,
  AIPermission.ACCESS_ANALYTICS_DATA
];

const adminAIPermissions = [
  ...userAIPermissions,
  AIPermission.EXECUTE_DELETE_TASKS,
  AIPermission.EXECUTE_BULK_OPERATIONS,
  AIPermission.ACCESS_ORGANIZATION_DATA,
  AIPermission.MANAGE_AI_WORKFLOWS,
  AIPermission.AUTONOMOUS_TASK_EXECUTION,
  AIPermission.DELEGATE_AI_PERMISSIONS
];

const itAdminAIPermissions = [
  ...adminAIPermissions,
  AIPermission.CONFIGURE_AI_SETTINGS,
  AIPermission.APPROVE_AI_OPERATIONS,
  AIPermission.CROSS_SYSTEM_INTEGRATION,
  AIPermission.PREDICTIVE_ACTIONS,
  AIPermission.LEARNING_FROM_DATA,
  AIPermission.EMERGENCY_OVERRIDE
];

const aiAgentAIPermissions = [
  // AI Agent gets full autonomy within safety boundaries
  AIPermission.USE_AI_CHAT,
  AIPermission.USE_AI_ANALYSIS,
  AIPermission.USE_AI_PREDICTION,
  AIPermission.USE_AI_CONTENT_GENERATION,
  AIPermission.EXECUTE_READ_TASKS,
  AIPermission.EXECUTE_CREATE_TASKS,
  AIPermission.EXECUTE_UPDATE_TASKS,
  AIPermission.EXECUTE_DELETE_TASKS,
  AIPermission.EXECUTE_BULK_OPERATIONS,
  AIPermission.ACCESS_CONTACT_DATA,
  AIPermission.ACCESS_CAMPAIGN_DATA,
  AIPermission.ACCESS_ANALYTICS_DATA,
  AIPermission.ACCESS_ORGANIZATION_DATA,
  AIPermission.MANAGE_AI_WORKFLOWS,
  AIPermission.AUTONOMOUS_TASK_EXECUTION,
  AIPermission.CROSS_SYSTEM_INTEGRATION,
  AIPermission.PREDICTIVE_ACTIONS,
  AIPermission.LEARNING_FROM_DATA,
  AIPermission.DELEGATE_AI_PERMISSIONS // AI Agent can delegate to other AI agents
];

// Role-based AI permission matrix
const aiRolePermissions: Record<UserRole, AIPermission[]> = {
  [UserRole.USER]: userAIPermissions,
  [UserRole.ADMIN]: adminAIPermissions,
  [UserRole.IT_ADMIN]: itAdminAIPermissions,
  [UserRole.SUPER_ADMIN]: Object.values(AIPermission),
  [UserRole.AI_AGENT]: aiAgentAIPermissions
};

// Temporal permission interface
export interface TemporalPermission {
  permission: AIPermission;
  grantedBy: string;
  grantedTo: string;
  expiresAt: Date;
  conditions?: string[];
  maxOperations?: number;
  operationsUsed: number;
}

// Delegation interface
export interface AIPermissionDelegation {
  id: string;
  delegatorId: string;
  delegateeId: string;
  permissions: AIPermission[];
  expiresAt: Date;
  maxUses?: number;
  usesRemaining: number;
  conditions: string[];
  riskLevel: RiskLevel;
  createdAt: Date;
  scope?: DelegationScope;
  autoRevoke?: boolean;
  notifyOnUse?: boolean;
  metadata?: Record<string, any>;
}

// Delegation scope interface
export interface DelegationScope {
  organizations?: string[];
  timeWindows?: TimeWindow[];
  operationLimits?: OperationLimit[];
  ipWhitelist?: string[];
  contextRequirements?: string[];
}

// Time window for delegation
export interface TimeWindow {
  start: string; // HH:MM format
  end: string;   // HH:MM format
  days: number[]; // 0-6 (Sunday-Saturday)
  timezone: string;
}

// Operation limit for delegation
export interface OperationLimit {
  operation: string;
  maxPerHour: number;
  maxPerDay: number;
  currentHour: number;
  currentDay: number;
  lastReset: Date;
}

// AI Agent context interface
export interface AIAgentContext {
  sessionId: string;
  organizationId: string;
  requestSource: string;
  userOnBehalf?: string;
  riskContext: {
    previousOperations: string[];
    timeWindow: string;
    resourceUsage: number;
    errorRate: number;
  };
  businessContext: {
    campaign?: string;
    workflow?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
}

export class AIPermissionService {
  
  /**
   * Check if user has specific AI permission
   */
  static hasAIPermission(userRole: UserRole, permission: AIPermission): boolean {
    const permissions = aiRolePermissions[userRole] || [];
    return permissions.includes(permission);
  }

  /**
   * Check if user can perform AI operation with risk assessment
   */
  static async canPerformAIOperation(
    userId: string,
    userRole: UserRole,
    organizationId: string,
    operation: string,
    riskLevel?: RiskLevel
  ): Promise<{ allowed: boolean; reason?: string; requiresApproval?: boolean }> {
    
    // Determine risk level if not provided
    const operationRisk = riskLevel || AI_OPERATION_RISKS[operation] || RiskLevel.MEDIUM;
    
    // Map operation to required permissions
    const requiredPermissions = this.getRequiredPermissions(operation);
    
    // Check base permissions
    for (const permission of requiredPermissions) {
      if (!this.hasAIPermission(userRole, permission)) {
        return {
          allowed: false,
          reason: `Missing required permission: ${permission}`
        };
      }
    }
    
    // Check temporal permissions
    const hasTemporalPermission = await this.checkTemporalPermissions(
      userId, 
      requiredPermissions
    );
    
    if (hasTemporalPermission.granted) {
      return { allowed: true };
    }
    
    // Risk-based approval requirements
    if (operationRisk === RiskLevel.CRITICAL) {
      if (userRole !== UserRole.SUPER_ADMIN) {
        return {
          allowed: false,
          requiresApproval: true,
          reason: 'Critical operations require SUPER_ADMIN approval'
        };
      }
    }
    
    if (operationRisk === RiskLevel.HIGH) {
      if (![UserRole.IT_ADMIN, UserRole.SUPER_ADMIN].includes(userRole)) {
        return {
          allowed: false,
          requiresApproval: true,
          reason: 'High-risk operations require IT_ADMIN approval'
        };
      }
    }
    
    // Check organization-specific restrictions
    const orgRestrictions = await this.getOrganizationAIRestrictions(organizationId);
    if (orgRestrictions.restricted.includes(operation)) {
      return {
        allowed: false,
        reason: 'Operation restricted by organization policy'
      };
    }
    
    return { allowed: true };
  }

  /**
   * Get required permissions for an operation
   */
  static getRequiredPermissions(operation: string): AIPermission[] {
    const permissionMap: Record<string, AIPermission[]> = {
      'read_contact': [AIPermission.EXECUTE_READ_TASKS, AIPermission.ACCESS_CONTACT_DATA],
      'create_contact': [AIPermission.EXECUTE_CREATE_TASKS, AIPermission.ACCESS_CONTACT_DATA],
      'update_contact': [AIPermission.EXECUTE_UPDATE_TASKS, AIPermission.ACCESS_CONTACT_DATA],
      'delete_contact': [AIPermission.EXECUTE_DELETE_TASKS, AIPermission.ACCESS_CONTACT_DATA],
      'create_campaign': [AIPermission.EXECUTE_CREATE_TASKS, AIPermission.ACCESS_CAMPAIGN_DATA],
      'send_campaign': [AIPermission.AUTONOMOUS_TASK_EXECUTION, AIPermission.ACCESS_CAMPAIGN_DATA],
      'bulk_operations': [AIPermission.EXECUTE_BULK_OPERATIONS],
      'system_config': [AIPermission.CONFIGURE_AI_SETTINGS, AIPermission.SYSTEM_ADMINISTRATION]
    };
    
    return permissionMap[operation] || [AIPermission.USE_AI_CHAT];
  }

  /**
   * Create permission delegation
   */
  static async createDelegation(
    delegatorId: string,
    delegateeId: string,
    permissions: AIPermission[],
    expiresAt: Date,
    conditions: string[] = [],
    maxUses?: number
  ): Promise<AIPermissionDelegation> {
    
    const delegation: AIPermissionDelegation = {
      id: `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      delegatorId,
      delegateeId,
      permissions,
      expiresAt,
      maxUses,
      usesRemaining: maxUses || 999999,
      conditions,
      riskLevel: this.calculateDelegationRisk(permissions),
      createdAt: new Date()
    };
    
    // Store in Redis with expiration
    await redisCache.set(
      `ai_delegation:${delegation.id}`,
      delegation,
      Math.floor((expiresAt.getTime() - Date.now()) / 1000)
    );
    
    // Log delegation creation
    logger.info('AI permission delegation created', {
      delegationId: delegation.id,
      delegatorId,
      delegateeId,
      permissions: permissions.length,
      riskLevel: delegation.riskLevel
    });
    
    return delegation;
  }

  /**
   * Check temporal permissions
   */
  static async checkTemporalPermissions(
    userId: string,
    requiredPermissions: AIPermission[]
  ): Promise<{ granted: boolean; delegation?: AIPermissionDelegation }> {
    
    // Get all active delegations for user
    const delegationKeys = await redisCache.keys(`ai_delegation:*`);
    
    for (const key of delegationKeys) {
      const delegation = await redisCache.get<AIPermissionDelegation>(key);
      
      if (!delegation || delegation.delegateeId !== userId) continue;
      if (delegation.expiresAt < new Date()) continue;
      if (delegation.usesRemaining <= 0) continue;
      
      // Check if delegation covers required permissions
      const hasAllPermissions = requiredPermissions.every(
        perm => delegation.permissions.includes(perm)
      );
      
      if (hasAllPermissions) {
        // Decrement uses
        delegation.usesRemaining--;
        await redisCache.set(key, delegation, Math.floor((delegation.expiresAt.getTime() - Date.now()) / 1000));
        
        return { granted: true, delegation };
      }
    }
    
    return { granted: false };
  }

  /**
   * Calculate risk level for delegation
   */
  static calculateDelegationRisk(permissions: AIPermission[]): RiskLevel {
    if (permissions.includes(AIPermission.SYSTEM_ADMINISTRATION) ||
        permissions.includes(AIPermission.EMERGENCY_OVERRIDE)) {
      return RiskLevel.CRITICAL;
    }
    
    if (permissions.includes(AIPermission.EXECUTE_DELETE_TASKS) ||
        permissions.includes(AIPermission.EXECUTE_BULK_OPERATIONS) ||
        permissions.includes(AIPermission.AUTONOMOUS_TASK_EXECUTION)) {
      return RiskLevel.HIGH;
    }
    
    if (permissions.includes(AIPermission.EXECUTE_CREATE_TASKS) ||
        permissions.includes(AIPermission.EXECUTE_UPDATE_TASKS)) {
      return RiskLevel.MEDIUM;
    }
    
    return RiskLevel.LOW;
  }

  /**
   * Get organization AI restrictions
   */
  static async getOrganizationAIRestrictions(organizationId: string): Promise<{
    restricted: string[];
    allowedHours: { start: number; end: number };
    maxOperationsPerHour: number;
  }> {
    
    try {
      // Try to get from cache first
      const cached = await redisCache.get<any>(`ai_restrictions:${organizationId}`);
      if (cached) return cached;
      
      // Get from database
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { 
          settings: true,
          subscription: true
        }
      });
      
      const restrictions = {
        restricted: [],
        allowedHours: { start: 0, end: 24 },
        maxOperationsPerHour: 1000
      };
      
      // Apply subscription-based limits
      if (org?.subscription) {
        // Implementation would depend on subscription tiers
        restrictions.maxOperationsPerHour = 500; // Example limit
      }
      
      // Cache for 1 hour
      await redisCache.set(`ai_restrictions:${organizationId}`, restrictions, 3600);
      
      return restrictions;
      
    } catch (error) {
      logger.error('Error getting AI restrictions', { organizationId, error });
      
      // Return default safe restrictions
      return {
        restricted: [],
        allowedHours: { start: 6, end: 22 }, // 6 AM to 10 PM
        maxOperationsPerHour: 100
      };
    }
  }

  /**
   * Log AI permission event
   */
  static async logPermissionEvent(
    userId: string,
    operation: string,
    granted: boolean,
    reason?: string,
    delegationId?: string
  ): Promise<void> {
    
    const event = {
      userId,
      operation,
      granted,
      reason,
      delegationId,
      timestamp: new Date().toISOString()
    };
    
    // Log to main logger
    logger.info('AI permission event', event);
    
    // Store in audit trail
    await redisCache.set(
      `ai_audit:${userId}:${Date.now()}`,
      event,
      86400 * 7 // 7 days
    );
    
    // Store in more detailed audit for AI agents
    if (event.operation.includes('ai_agent')) {
      await redisCache.set(
        `ai_agent_audit:${userId}:${Date.now()}`,
        {
          ...event,
          sessionId: Math.random().toString(36).substr(2, 9),
          userAgent: 'AI_AGENT_SYSTEM',
          ipAddress: 'INTERNAL',
          additionalContext: {
            riskLevel: getAIOperationRisk(event.operation),
            timeWindow: new Date().toISOString()
          }
        },
        86400 * 30 // 30 days for AI agent operations
      );
    }
  }

  /**
   * Get user's effective AI permissions
   */
  static async getEffectiveAIPermissions(
    userId: string,
    userRole: UserRole
  ): Promise<{
    base: AIPermission[];
    delegated: AIPermission[];
    effective: AIPermission[];
  }> {
    
    const basePermissions = aiRolePermissions[userRole] || [];
    const delegatedPermissions: AIPermission[] = [];
    
    // Get delegated permissions
    const delegationKeys = await redisCache.keys(`ai_delegation:*`);
    
    for (const key of delegationKeys) {
      const delegation = await redisCache.get<AIPermissionDelegation>(key);
      
      if (delegation?.delegateeId === userId && 
          delegation.expiresAt > new Date() &&
          delegation.usesRemaining > 0) {
        delegatedPermissions.push(...delegation.permissions);
      }
    }
    
    // Combine and deduplicate
    const effectivePermissions = [...new Set([...basePermissions, ...delegatedPermissions])];
    
    return {
      base: basePermissions,
      delegated: delegatedPermissions,
      effective: effectivePermissions
    };
  }

  /**
   * Revoke delegation
   */
  static async revokeDelegation(delegationId: string, revokedBy: string): Promise<boolean> {
    try {
      const delegation = await redisCache.get<AIPermissionDelegation>(`ai_delegation:${delegationId}`);
      
      if (!delegation) return false;
      
      // Only delegator or super admin can revoke
      if (delegation.delegatorId !== revokedBy) {
        // Check if revoker is super admin
        const user = await prisma.user.findUnique({
          where: { id: revokedBy },
          select: { role: true }
        });
        
        if (user?.role !== UserRole.SUPER_ADMIN) {
          return false;
        }
      }
      
      // Remove delegation
      await redisCache.delete(`ai_delegation:${delegationId}`);
      
      logger.info('AI delegation revoked', {
        delegationId,
        revokedBy,
        originalDelegator: delegation.delegatorId
      });
      
      return true;
      
    } catch (error) {
      logger.error('Error revoking delegation', { delegationId, error });
      return false;
    }
  }
}

// Helper functions
export function requireAIPermission(userRole: UserRole, permission: AIPermission): boolean {
  return AIPermissionService.hasAIPermission(userRole, permission);
}

export function getAIOperationRisk(operation: string): RiskLevel {
  return AI_OPERATION_RISKS[operation] || RiskLevel.MEDIUM;
}

export async function checkAIPermission(
  userId: string,
  userRole: UserRole,
  organizationId: string,
  operation: string,
  context?: AIAgentContext
): Promise<{ allowed: boolean; reason?: string; requiresApproval?: boolean }> {
  return AIPermissionService.canPerformAIOperation(
    userId,
    userRole,
    organizationId,
    operation,
    getAIOperationRisk(operation)
  );
}

// AI Agent specific permission checker
export async function checkAIAgentPermission(
  agentId: string,
  organizationId: string,
  operation: string,
  context: AIAgentContext
): Promise<{ allowed: boolean; reason?: string; requiresApproval?: boolean }> {
  
  try {
    // Check if this is a valid AI agent
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: { role: true, organizationId: true }
    });
    
    if (!agent || agent.role !== UserRole.AI_AGENT) {
      return { allowed: false, reason: 'Invalid AI agent' };
    }
    
    // Check organization access
    if (agent.organizationId !== organizationId) {
      return { allowed: false, reason: 'AI agent not authorized for this organization' };
    }
    
    // Check time window restrictions
    const timeAllowed = await checkTimeWindow(context);
    if (!timeAllowed) {
      return { allowed: false, reason: 'Operation not allowed during current time window' };
    }
    
    // Check rate limits
    const rateLimitOk = await checkAIAgentRateLimit(agentId, operation, context);
    if (!rateLimitOk) {
      return { allowed: false, reason: 'Rate limit exceeded' };
    }
    
    // Check risk context
    const riskAssessment = await assessAIAgentRisk(agentId, operation, context);
    if (riskAssessment.blocked) {
      return { 
        allowed: false, 
        reason: `Risk assessment failed: ${riskAssessment.reason}`,
        requiresApproval: riskAssessment.requiresApproval
      };
    }
    
    // Use standard permission check
    return AIPermissionService.canPerformAIOperation(
      agentId,
      UserRole.AI_AGENT,
      organizationId,
      operation,
      getAIOperationRisk(operation)
    );
    
  } catch (error) {
    logger.error('Error checking AI agent permission', { agentId, operation, error });
    return { allowed: false, reason: 'Permission check failed' };
  }
}

// Time window checker
export async function checkTimeWindow(context: AIAgentContext): Promise<boolean> {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  
  // Get organization time restrictions
  const restrictions = await AIPermissionService.getOrganizationAIRestrictions(context.organizationId);
  
  return hour >= restrictions.allowedHours.start && hour <= restrictions.allowedHours.end;
}

// Rate limit checker for AI agents
export async function checkAIAgentRateLimit(
  agentId: string,
  operation: string,
  context: AIAgentContext
): Promise<boolean> {
  
  const cacheKey = `ai_agent_rate_limit:${agentId}:${operation}:${Math.floor(Date.now() / 3600000)}`;
  
  try {
    const current = await redisCache.get<number>(cacheKey) || 0;
    const limit = getOperationRateLimit(operation);
    
    if (current >= limit) {
      return false;
    }
    
    // Increment counter
    await redisCache.set(cacheKey, current + 1, 3600); // 1 hour expiry
    
    return true;
    
  } catch (error) {
    logger.error('Error checking AI agent rate limit', { agentId, operation, error });
    return false;
  }
}

// Risk assessment for AI agents
export async function assessAIAgentRisk(
  agentId: string,
  operation: string,
  context: AIAgentContext
): Promise<{ blocked: boolean; reason?: string; requiresApproval?: boolean }> {
  
  const riskFactors = {
    errorRate: context.riskContext.errorRate,
    resourceUsage: context.riskContext.resourceUsage,
    operationFrequency: context.riskContext.previousOperations.length,
    operationRisk: getAIOperationRisk(operation)
  };
  
  // High error rate check
  if (riskFactors.errorRate > 0.1) { // 10% error rate
    return { 
      blocked: true, 
      reason: `High error rate: ${(riskFactors.errorRate * 100).toFixed(1)}%`,
      requiresApproval: true
    };
  }
  
  // Resource usage check
  if (riskFactors.resourceUsage > 0.8) { // 80% resource usage
    return { 
      blocked: true, 
      reason: `High resource usage: ${(riskFactors.resourceUsage * 100).toFixed(1)}%`,
      requiresApproval: true
    };
  }
  
  // Operation frequency check
  if (riskFactors.operationFrequency > 100) { // More than 100 operations recently
    return { 
      blocked: true, 
      reason: 'High operation frequency detected',
      requiresApproval: true
    };
  }
  
  // Critical operations always require approval
  if (riskFactors.operationRisk === RiskLevel.CRITICAL) {
    return { 
      blocked: false, 
      requiresApproval: true,
      reason: 'Critical operation requires approval'
    };
  }
  
  return { blocked: false };
}

// Get operation rate limit
function getOperationRateLimit(operation: string): number {
  const limits: Record<string, number> = {
    'read_contact': 1000,
    'create_contact': 100,
    'update_contact': 200,
    'delete_contact': 50,
    'create_campaign': 20,
    'send_campaign': 10,
    'bulk_operations': 5,
    'system_config': 2
  };
  
  return limits[operation] || 100;
}

// Create AI agent delegation with enhanced features
export async function createAIAgentDelegation(
  delegatorId: string,
  delegateeId: string,
  permissions: AIPermission[],
  expiresAt: Date,
  scope?: DelegationScope,
  conditions: string[] = [],
  maxUses?: number
): Promise<AIPermissionDelegation> {
  
  // Validate delegator has permission to delegate
  const delegator = await prisma.user.findUnique({
    where: { id: delegatorId },
    select: { role: true }
  });
  
  if (!delegator || !AIPermissionService.hasAIPermission(delegator.role, AIPermission.DELEGATE_AI_PERMISSIONS)) {
    throw new Error('Delegator does not have permission to delegate AI permissions');
  }
  
  // Create enhanced delegation
  const delegation: AIPermissionDelegation = {
    id: `ai_del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    delegatorId,
    delegateeId,
    permissions,
    expiresAt,
    maxUses,
    usesRemaining: maxUses || 999999,
    conditions,
    riskLevel: AIPermissionService.calculateDelegationRisk(permissions),
    createdAt: new Date(),
    scope,
    autoRevoke: permissions.some(p => 
      [AIPermission.EXECUTE_DELETE_TASKS, AIPermission.EXECUTE_BULK_OPERATIONS].includes(p)
    ),
    notifyOnUse: permissions.some(p => 
      [AIPermission.SYSTEM_ADMINISTRATION, AIPermission.EMERGENCY_OVERRIDE].includes(p)
    ),
    metadata: {
      createdBy: 'AI_AGENT_SYSTEM',
      purpose: 'AI_AGENT_DELEGATION',
      riskMitigation: 'ENHANCED_MONITORING'
    }
  };
  
  // Store in Redis with expiration
  await redisCache.set(
    `ai_agent_delegation:${delegation.id}`,
    delegation,
    Math.floor((expiresAt.getTime() - Date.now()) / 1000)
  );
  
  // Log delegation creation
  logger.info('AI agent delegation created', {
    delegationId: delegation.id,
    delegatorId,
    delegateeId,
    permissions: permissions.length,
    riskLevel: delegation.riskLevel,
    scope: scope ? Object.keys(scope).length : 0
  });
  
  return delegation;
}

// Get AI agent status and permissions
export async function getAIAgentStatus(
  agentId: string
): Promise<{
  valid: boolean;
  permissions: AIPermission[];
  delegations: AIPermissionDelegation[];
  riskLevel: RiskLevel;
  rateLimits: Record<string, number>;
  lastActivity: Date;
}> {
  
  try {
    // Check if agent exists and is valid
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: { role: true, createdAt: true }
    });
    
    if (!agent || agent.role !== UserRole.AI_AGENT) {
      return {
        valid: false,
        permissions: [],
        delegations: [],
        riskLevel: RiskLevel.CRITICAL,
        rateLimits: {},
        lastActivity: new Date()
      };
    }
    
    // Get effective permissions
    const permissions = await AIPermissionService.getEffectiveAIPermissions(agentId, UserRole.AI_AGENT);
    
    // Get active delegations
    const delegationKeys = await redisCache.keys(`ai_agent_delegation:*`);
    const delegations: AIPermissionDelegation[] = [];
    
    for (const key of delegationKeys) {
      const delegation = await redisCache.get<AIPermissionDelegation>(key);
      if (delegation?.delegateeId === agentId) {
        delegations.push(delegation);
      }
    }
    
    // Calculate current risk level
    const riskLevel = calculateAgentRiskLevel(permissions.effective, delegations);
    
    // Get rate limits
    const rateLimits = await getAgentRateLimits(agentId);
    
    return {
      valid: true,
      permissions: permissions.effective,
      delegations,
      riskLevel,
      rateLimits,
      lastActivity: new Date()
    };
    
  } catch (error) {
    logger.error('Error getting AI agent status', { agentId, error });
    return {
      valid: false,
      permissions: [],
      delegations: [],
      riskLevel: RiskLevel.CRITICAL,
      rateLimits: {},
      lastActivity: new Date()
    };
  }
}

// Calculate agent risk level
function calculateAgentRiskLevel(
  permissions: AIPermission[],
  delegations: AIPermissionDelegation[]
): RiskLevel {
  
  // Check for high-risk permissions
  const highRiskPermissions = [
    AIPermission.SYSTEM_ADMINISTRATION,
    AIPermission.EMERGENCY_OVERRIDE,
    AIPermission.EXECUTE_DELETE_TASKS,
    AIPermission.EXECUTE_BULK_OPERATIONS
  ];
  
  if (permissions.some(p => highRiskPermissions.includes(p))) {
    return RiskLevel.HIGH;
  }
  
  // Check delegation risk
  if (delegations.some(d => d.riskLevel === RiskLevel.CRITICAL)) {
    return RiskLevel.CRITICAL;
  }
  
  if (delegations.some(d => d.riskLevel === RiskLevel.HIGH)) {
    return RiskLevel.HIGH;
  }
  
  return RiskLevel.MEDIUM;
}

// Get agent rate limits
async function getAgentRateLimits(agentId: string): Promise<Record<string, number>> {
  const rateLimits: Record<string, number> = {};
  const currentHour = Math.floor(Date.now() / 3600000);
  
  const operations = [
    'read_contact', 'create_contact', 'update_contact', 'delete_contact',
    'create_campaign', 'send_campaign', 'bulk_operations', 'system_config'
  ];
  
  for (const operation of operations) {
    const cacheKey = `ai_agent_rate_limit:${agentId}:${operation}:${currentHour}`;
    const current = await redisCache.get<number>(cacheKey) || 0;
    rateLimits[operation] = current;
  }
  
  return rateLimits;
}

export async function validateAIAgentTokens(
  agentId: string,
  organizationId: string
): Promise<{ valid: boolean; expiresAt?: Date; permissions?: AIPermission[] }> {
  
  try {
    // Check if agent exists and is active
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: { 
        role: true, 
        organizationId: true,
        createdAt: true,
        metadata: true 
      }
    });
    
    if (!agent || agent.role !== UserRole.AI_AGENT) {
      return { valid: false };
    }
    
    if (agent.organizationId !== organizationId) {
      return { valid: false };
    }
    
    // Check if agent token is still valid (agents expire after 24 hours by default)
    const tokenExpiry = new Date(agent.createdAt.getTime() + 24 * 60 * 60 * 1000);
    if (tokenExpiry < new Date()) {
      return { valid: false };
    }
    
    // Get effective permissions
    const permissions = await AIPermissionService.getEffectiveAIPermissions(agentId, UserRole.AI_AGENT);
    
    return { 
      valid: true, 
      expiresAt: tokenExpiry,
      permissions: permissions.effective
    };
    
  } catch (error) {
    logger.error('Error validating AI agent tokens', { agentId, organizationId, error });
    return { valid: false };
  }
}

// Export singleton instance
export const aiPermissionSystem = new AIPermissionService();