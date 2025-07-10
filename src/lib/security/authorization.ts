/**
 * Role-Based Access Control (RBAC) System
 * =======================================
 * Comprehensive authorization system with fine-grained permissions
 */

import { UserRole } from '@prisma/client';
import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';

// Permission definitions
export enum Permission {
  // User management
  CREATE_USER = 'CREATE_USER',
  UPDATE_USER = 'UPDATE_USER',
  DELETE_USER = 'DELETE_USER',
  VIEW_USER = 'VIEW_USER',
  MANAGE_USER_ROLES = 'MANAGE_USER_ROLES',
  
  // Organization management
  CREATE_ORGANIZATION = 'CREATE_ORGANIZATION',
  UPDATE_ORGANIZATION = 'UPDATE_ORGANIZATION',
  DELETE_ORGANIZATION = 'DELETE_ORGANIZATION',
  VIEW_ORGANIZATION = 'VIEW_ORGANIZATION',
  MANAGE_ORGANIZATION_SETTINGS = 'MANAGE_ORGANIZATION_SETTINGS',
  
  // Contact management
  CREATE_CONTACT = 'CREATE_CONTACT',
  UPDATE_CONTACT = 'UPDATE_CONTACT',
  DELETE_CONTACT = 'DELETE_CONTACT',
  VIEW_CONTACT = 'VIEW_CONTACT',
  BULK_CONTACT_OPERATIONS = 'BULK_CONTACT_OPERATIONS',
  EXPORT_CONTACTS = 'EXPORT_CONTACTS',
  
  // Campaign management
  CREATE_CAMPAIGN = 'CREATE_CAMPAIGN',
  UPDATE_CAMPAIGN = 'UPDATE_CAMPAIGN',
  DELETE_CAMPAIGN = 'DELETE_CAMPAIGN',
  VIEW_CAMPAIGN = 'VIEW_CAMPAIGN',
  SEND_CAMPAIGN = 'SEND_CAMPAIGN',
  SCHEDULE_CAMPAIGN = 'SCHEDULE_CAMPAIGN',
  
  // Task management
  CREATE_TASK = 'CREATE_TASK',
  UPDATE_TASK = 'UPDATE_TASK',
  DELETE_TASK = 'DELETE_TASK',
  VIEW_TASK = 'VIEW_TASK',
  ASSIGN_TASK = 'ASSIGN_TASK',
  
  // Workflow management
  CREATE_WORKFLOW = 'CREATE_WORKFLOW',
  UPDATE_WORKFLOW = 'UPDATE_WORKFLOW',
  DELETE_WORKFLOW = 'DELETE_WORKFLOW',
  VIEW_WORKFLOW = 'VIEW_WORKFLOW',
  EXECUTE_WORKFLOW = 'EXECUTE_WORKFLOW',
  
  // AI operations
  USE_AI_FEATURES = 'USE_AI_FEATURES',
  EXECUTE_AI_TASKS = 'EXECUTE_AI_TASKS',
  APPROVE_AI_OPERATIONS = 'APPROVE_AI_OPERATIONS',
  CONFIGURE_AI_SETTINGS = 'CONFIGURE_AI_SETTINGS',
  
  // Data operations
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  EXPORT_DATA = 'EXPORT_DATA',
  IMPORT_DATA = 'IMPORT_DATA',
  DELETE_DATA = 'DELETE_DATA',
  
  // System administration
  MANAGE_INTEGRATIONS = 'MANAGE_INTEGRATIONS',
  MANAGE_BILLING = 'MANAGE_BILLING',
  VIEW_SYSTEM_LOGS = 'VIEW_SYSTEM_LOGS',
  MANAGE_SYSTEM_SETTINGS = 'MANAGE_SYSTEM_SETTINGS',
  
  // Security operations
  MANAGE_SECURITY_SETTINGS = 'MANAGE_SECURITY_SETTINGS',
  VIEW_SECURITY_LOGS = 'VIEW_SECURITY_LOGS',
  MANAGE_API_KEYS = 'MANAGE_API_KEYS'
}

// Base permissions for each role
const userPermissions = [
  Permission.VIEW_USER,
  Permission.UPDATE_USER, // Own profile only
  Permission.CREATE_CONTACT,
  Permission.UPDATE_CONTACT,
  Permission.VIEW_CONTACT,
  Permission.CREATE_CAMPAIGN,
  Permission.UPDATE_CAMPAIGN,
  Permission.VIEW_CAMPAIGN,
  Permission.SEND_CAMPAIGN,
  Permission.SCHEDULE_CAMPAIGN,
  Permission.CREATE_TASK,
  Permission.UPDATE_TASK,
  Permission.VIEW_TASK,
  Permission.CREATE_WORKFLOW,
  Permission.UPDATE_WORKFLOW,
  Permission.VIEW_WORKFLOW,
  Permission.EXECUTE_WORKFLOW,
  Permission.USE_AI_FEATURES,
  Permission.VIEW_ANALYTICS,
  Permission.EXPORT_DATA,
  Permission.IMPORT_DATA
];

const adminPermissions = [
  ...userPermissions,
  Permission.DELETE_CONTACT,
  Permission.BULK_CONTACT_OPERATIONS,
  Permission.EXPORT_CONTACTS,
  Permission.DELETE_CAMPAIGN,
  Permission.DELETE_TASK,
  Permission.ASSIGN_TASK,
  Permission.DELETE_WORKFLOW,
  Permission.EXECUTE_AI_TASKS,
  Permission.DELETE_DATA,
  Permission.MANAGE_INTEGRATIONS,
  Permission.MANAGE_BILLING,
  Permission.UPDATE_ORGANIZATION,
  Permission.VIEW_ORGANIZATION,
  Permission.MANAGE_ORGANIZATION_SETTINGS
];

const itAdminPermissions = [
  ...adminPermissions,
  Permission.CREATE_USER,
  Permission.UPDATE_USER,
  Permission.DELETE_USER,
  Permission.VIEW_SYSTEM_LOGS,
  Permission.MANAGE_SYSTEM_SETTINGS,
  Permission.MANAGE_SECURITY_SETTINGS,
  Permission.VIEW_SECURITY_LOGS,
  Permission.MANAGE_API_KEYS,
  Permission.CONFIGURE_AI_SETTINGS,
  Permission.APPROVE_AI_OPERATIONS
];

const aiAgentPermissions = [
  // AI Agent gets carefully selected permissions for autonomous operation
  Permission.VIEW_USER,
  Permission.CREATE_CONTACT,
  Permission.UPDATE_CONTACT,
  Permission.VIEW_CONTACT,
  Permission.BULK_CONTACT_OPERATIONS,
  Permission.CREATE_CAMPAIGN,
  Permission.UPDATE_CAMPAIGN,
  Permission.VIEW_CAMPAIGN,
  Permission.SEND_CAMPAIGN,
  Permission.SCHEDULE_CAMPAIGN,
  Permission.CREATE_TASK,
  Permission.UPDATE_TASK,
  Permission.VIEW_TASK,
  Permission.ASSIGN_TASK,
  Permission.CREATE_WORKFLOW,
  Permission.UPDATE_WORKFLOW,
  Permission.VIEW_WORKFLOW,
  Permission.EXECUTE_WORKFLOW,
  Permission.USE_AI_FEATURES,
  Permission.EXECUTE_AI_TASKS,
  Permission.VIEW_ANALYTICS,
  Permission.EXPORT_DATA,
  Permission.IMPORT_DATA
];

// Role-based permission matrix
const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.USER]: userPermissions,
  [UserRole.ADMIN]: adminPermissions,
  [UserRole.IT_ADMIN]: itAdminPermissions,
  [UserRole.SUPER_ADMIN]: Object.values(Permission),
  [UserRole.AI_AGENT]: aiAgentPermissions
};

// Resource ownership validation
export interface ResourceOwnership {
  userId?: string;
  organizationId?: string;
  createdById?: string;
  assignedUserId?: string;
}

export class AuthorizationService {
  
  /**
   * Check if user has specific permission
   */
  static hasPermission(userRole: UserRole, permission: Permission): boolean {
    const permissions = rolePermissions[userRole] || [];
    return permissions.includes(permission);
  }
  
  /**
   * Check multiple permissions (user must have ALL)
   */
  static hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(userRole, permission));
  }
  
  /**
   * Check multiple permissions (user must have ANY)
   */
  static hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(userRole, permission));
  }
  
  /**
   * Validate resource access based on ownership
   */
  static async validateResourceAccess(
    userId: string,
    userRole: UserRole,
    organizationId: string,
    permission: Permission,
    resourceOwnership: ResourceOwnership
  ): Promise<{ allowed: boolean; reason?: string }> {
    
    // Super admin can access everything
    if (userRole === UserRole.SUPER_ADMIN) {
      return { allowed: true };
    }
    
    // Check base permission
    if (!this.hasPermission(userRole, permission)) {
      return { 
        allowed: false, 
        reason: 'Insufficient permissions' 
      };
    }
    
    // Check organization access
    if (resourceOwnership.organizationId && resourceOwnership.organizationId !== organizationId) {
      return { 
        allowed: false, 
        reason: 'Resource belongs to different organization' 
      };
    }
    
    // Check user-specific access rules
    switch (permission) {
      case Permission.UPDATE_USER:
      case Permission.VIEW_USER:
        // Users can only view/update their own profile (unless admin+)
        if (userRole === UserRole.USER && resourceOwnership.userId !== userId) {
          return { 
            allowed: false, 
            reason: 'Can only access own profile' 
          };
        }
        break;
        
      case Permission.DELETE_USER:
        // Prevent self-deletion
        if (resourceOwnership.userId === userId) {
          return { 
            allowed: false, 
            reason: 'Cannot delete own account' 
          };
        }
        break;
        
      case Permission.ASSIGN_TASK:
        // Check if user can assign tasks to the target user
        if (userRole === UserRole.USER && resourceOwnership.assignedUserId !== userId) {
          return { 
            allowed: false, 
            reason: 'Can only assign tasks to self' 
          };
        }
        break;
        
      case Permission.APPROVE_AI_OPERATIONS:
        // Only IT_ADMIN and SUPER_ADMIN can approve AI operations
        if (userRole !== UserRole.IT_ADMIN && userRole !== UserRole.SUPER_ADMIN) {
          return { 
            allowed: false, 
            reason: 'AI operation approval requires IT Admin privileges' 
          };
        }
        break;
    }
    
    return { allowed: true };
  }
  
  /**
   * Validate bulk operation permissions
   */
  static async validateBulkOperation(
    userId: string,
    userRole: UserRole,
    organizationId: string,
    permission: Permission,
    resourceCount: number
  ): Promise<{ allowed: boolean; reason?: string; maxAllowed?: number }> {
    
    // Check base permission
    if (!this.hasPermission(userRole, permission)) {
      return { 
        allowed: false, 
        reason: 'Insufficient permissions' 
      };
    }
    
    // Define bulk operation limits by role
    const bulkLimits: Record<UserRole, number> = {
      [UserRole.USER]: 100,
      [UserRole.ADMIN]: 1000,
      [UserRole.IT_ADMIN]: 5000,
      [UserRole.SUPER_ADMIN]: 10000
    };
    
    const maxAllowed = bulkLimits[userRole];
    
    if (resourceCount > maxAllowed) {
      return {
        allowed: false,
        reason: `Bulk operation exceeds limit for your role`,
        maxAllowed
      };
    }
    
    // Additional validation for sensitive operations
    if (permission === Permission.DELETE_DATA && resourceCount > 10) {
      // Require higher privileges for bulk delete
      if (userRole === UserRole.USER) {
        return {
          allowed: false,
          reason: 'Bulk delete requires admin privileges',
          maxAllowed: 10
        };
      }
    }
    
    return { allowed: true };
  }
  
  /**
   * Get user's effective permissions
   */
  static getUserPermissions(userRole: UserRole): Permission[] {
    return rolePermissions[userRole] || [];
  }
  
  /**
   * Check if user can perform action on specific entity
   */
  static async canPerformAction(
    userId: string,
    userRole: UserRole,
    organizationId: string,
    action: string,
    entityType: string,
    entityId?: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    
    // Map action + entity to permission
    const permissionMap: Record<string, Permission> = {
      'CREATE_USER': Permission.CREATE_USER,
      'UPDATE_USER': Permission.UPDATE_USER,
      'DELETE_USER': Permission.DELETE_USER,
      'VIEW_USER': Permission.VIEW_USER,
      'CREATE_CONTACT': Permission.CREATE_CONTACT,
      'UPDATE_CONTACT': Permission.UPDATE_CONTACT,
      'DELETE_CONTACT': Permission.DELETE_CONTACT,
      'VIEW_CONTACT': Permission.VIEW_CONTACT,
      'CREATE_CAMPAIGN': Permission.CREATE_CAMPAIGN,
      'UPDATE_CAMPAIGN': Permission.UPDATE_CAMPAIGN,
      'DELETE_CAMPAIGN': Permission.DELETE_CAMPAIGN,
      'VIEW_CAMPAIGN': Permission.VIEW_CAMPAIGN,
      'CREATE_TASK': Permission.CREATE_TASK,
      'UPDATE_TASK': Permission.UPDATE_TASK,
      'DELETE_TASK': Permission.DELETE_TASK,
      'VIEW_TASK': Permission.VIEW_TASK,
      'EXECUTE_AI_TASKS': Permission.EXECUTE_AI_TASKS,
      'APPROVE_AI_OPERATIONS': Permission.APPROVE_AI_OPERATIONS
    };
    
    const permissionKey = `${action}_${entityType}`;
    const permission = permissionMap[permissionKey];
    
    if (!permission) {
      return { 
        allowed: false, 
        reason: `Unknown action: ${action} on ${entityType}` 
      };
    }
    
    // Check base permission
    if (!this.hasPermission(userRole, permission)) {
      return { 
        allowed: false, 
        reason: 'Insufficient permissions' 
      };
    }
    
    // If entity ID provided, check resource-specific access
    if (entityId) {
      try {
        let resourceOwnership: ResourceOwnership = {};
        
        // Fetch resource ownership info based on entity type
        switch (entityType) {
          case 'USER':
            const user = await prisma.user.findUnique({
              where: { id: entityId },
              select: { id: true, organizationId: true }
            });
            resourceOwnership = {
              userId: user?.id,
              organizationId: user?.organizationId || undefined
            };
            break;
            
          case 'CONTACT':
            const contact = await prisma.contact.findUnique({
              where: { id: entityId },
              select: { organizationId: true, createdById: true }
            });
            resourceOwnership = {
              organizationId: contact?.organizationId,
              createdById: contact?.createdById
            };
            break;
            
          case 'CAMPAIGN':
            const campaign = await prisma.emailCampaign.findUnique({
              where: { id: entityId },
              select: { organizationId: true, createdById: true }
            });
            resourceOwnership = {
              organizationId: campaign?.organizationId,
              createdById: campaign?.createdById
            };
            break;
            
          case 'TASK':
            const task = await prisma.task.findUnique({
              where: { id: entityId },
              select: { organizationId: true, createdById: true, assigneeId: true }
            });
            resourceOwnership = {
              organizationId: task?.organizationId,
              createdById: task?.createdById,
              assignedUserId: task?.assigneeId || undefined
            };
            break;
        }
        
        return await this.validateResourceAccess(
          userId,
          userRole,
          organizationId,
          permission,
          resourceOwnership
        );
        
      } catch (error) {
        logger.error('Authorization resource check failed', {
          userId,
          entityType,
          entityId,
          error: error instanceof Error ? error.message : String(error)
        });
        
        return { 
          allowed: false, 
          reason: 'Failed to validate resource access' 
        };
      }
    }
    
    return { allowed: true };
  }
  
  /**
   * Log authorization events
   */
  static logAuthorizationEvent(
    userId: string,
    action: string,
    resource: string,
    allowed: boolean,
    reason?: string
  ): void {
    logger.info('Authorization event', {
      userId,
      action,
      resource,
      allowed,
      reason,
      timestamp: new Date().toISOString()
    });
  }
}

// Export helper functions
export function requirePermission(userRole: UserRole, permission: Permission): boolean {
  return AuthorizationService.hasPermission(userRole, permission);
}

export function requireAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return AuthorizationService.hasAnyPermission(userRole, permissions);
}

export function requireAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return AuthorizationService.hasAllPermissions(userRole, permissions);
}