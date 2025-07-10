/**
 * AI Delegation Manager
 * =====================
 * 
 * Manages AI delegation permissions, allowing users to grant specific 
 * permissions to AI for autonomous task execution with granular control.
 */

import { EventEmitter } from 'events';
import { logger } from '../logger';
import { aiAuditTrailSystem } from './ai-audit-trail-system';
import { aiStreamingService } from '../websocket/ai-streaming-service';

export interface DelegationPermission {
  id: string;
  name: string;
  description: string;
  category: 'data_access' | 'system_modification' | 'external_integration' | 'communication' | 'analysis' | 'automation';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  scope: {
    resources: string[];
    operations: string[];
    constraints: string[];
  };
  prerequisites: string[];
  examples: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DelegationGrant {
  id: string;
  userId: string;
  organizationId: string;
  permissionId: string;
  grantedAt: Date;
  expiresAt?: Date;
  conditions: {
    timeWindow?: {
      start: string;
      end: string;
      timezone: string;
    };
    usageLimit?: {
      maxOperations: number;
      currentUsage: number;
      resetPeriod: 'hourly' | 'daily' | 'weekly' | 'monthly';
    };
    approvalRequired?: boolean;
    notificationSettings?: {
      onUse: boolean;
      onExpiry: boolean;
      onLimit: boolean;
    };
  };
  restrictions: {
    ipWhitelist?: string[];
    userAgentPattern?: string;
    contextRequired?: string[];
  };
  metadata: {
    reason: string;
    grantedBy: string;
    lastUsed?: Date;
    usageHistory: DelegationUsage[];
  };
  status: 'active' | 'expired' | 'revoked' | 'suspended';
}

export interface DelegationUsage {
  id: string;
  grantId: string;
  taskId: string;
  operation: string;
  timestamp: Date;
  success: boolean;
  error?: string;
  metadata: Record<string, any>;
}

export interface DelegationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  permissions: string[];
  defaultConditions: any;
  recommendedFor: string[];
  createdBy: string;
  isPublic: boolean;
  usageCount: number;
}

export interface DelegationRequest {
  id: string;
  userId: string;
  organizationId: string;
  permissionIds: string[];
  requestedAt: Date;
  reason: string;
  conditions: any;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  autoApprovalEligible: boolean;
}

class AIDelegationManager extends EventEmitter {
  private permissions = new Map<string, DelegationPermission>();
  private grants = new Map<string, DelegationGrant>();
  private templates = new Map<string, DelegationTemplate>();
  private requests = new Map<string, DelegationRequest>();
  private usageHistory: DelegationUsage[] = [];

  constructor() {
    super();
    this.initializeDefaultPermissions();
  }

  /**
   * Initialize default permissions
   */
  private initializeDefaultPermissions(): void {
    const defaultPermissions: DelegationPermission[] = [
      {
        id: 'data_read_contacts',
        name: 'Read Contact Data',
        description: 'Access and read customer contact information',
        category: 'data_access',
        riskLevel: 'medium',
        scope: {
          resources: ['contacts', 'customer_profiles', 'interaction_history'],
          operations: ['read', 'search', 'filter'],
          constraints: ['no_pii_export', 'audit_required']
        },
        prerequisites: ['user_authentication', 'role_verification'],
        examples: [
          'Analyze customer segments for campaign targeting',
          'Generate personalized content recommendations',
          'Create customer behavior insights'
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'campaign_create',
        name: 'Create Marketing Campaigns',
        description: 'Create and configure marketing campaigns',
        category: 'automation',
        riskLevel: 'high',
        scope: {
          resources: ['campaigns', 'templates', 'segments'],
          operations: ['create', 'configure', 'schedule'],
          constraints: ['approval_required', 'budget_limits', 'content_review']
        },
        prerequisites: ['campaign_permissions', 'budget_approval'],
        examples: [
          'Create automated email campaigns',
          'Set up A/B testing campaigns',
          'Configure drip marketing sequences'
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'analytics_access',
        name: 'Access Analytics Data',
        description: 'View and analyze marketing performance data',
        category: 'analysis',
        riskLevel: 'low',
        scope: {
          resources: ['analytics', 'reports', 'metrics'],
          operations: ['read', 'analyze', 'export'],
          constraints: ['anonymized_data', 'aggregate_only']
        },
        prerequisites: ['analytics_role'],
        examples: [
          'Generate performance reports',
          'Analyze campaign effectiveness',
          'Create data visualizations'
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'system_optimize',
        name: 'System Optimization',
        description: 'Optimize system performance and configurations',
        category: 'system_modification',
        riskLevel: 'critical',
        scope: {
          resources: ['database', 'cache', 'queries', 'configurations'],
          operations: ['optimize', 'modify', 'tune'],
          constraints: ['backup_required', 'rollback_plan', 'maintenance_window']
        },
        prerequisites: ['admin_approval', 'system_access'],
        examples: [
          'Optimize database query performance',
          'Tune caching configurations',
          'Adjust system resource allocation'
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'external_api_access',
        name: 'External API Integration',
        description: 'Access external APIs and services',
        category: 'external_integration',
        riskLevel: 'high',
        scope: {
          resources: ['third_party_apis', 'webhooks', 'integrations'],
          operations: ['call', 'configure', 'monitor'],
          constraints: ['rate_limits', 'cost_limits', 'security_review']
        },
        prerequisites: ['api_credentials', 'security_clearance'],
        examples: [
          'Integrate with social media platforms',
          'Connect to payment processors',
          'Sync with CRM systems'
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'communication_send',
        name: 'Send Communications',
        description: 'Send emails, SMS, and other communications',
        category: 'communication',
        riskLevel: 'medium',
        scope: {
          resources: ['email', 'sms', 'whatsapp', 'notifications'],
          operations: ['send', 'schedule', 'personalize'],
          constraints: ['consent_required', 'frequency_limits', 'content_approval']
        },
        prerequisites: ['communication_permissions', 'compliance_check'],
        examples: [
          'Send personalized email campaigns',
          'Deliver SMS notifications',
          'Send WhatsApp messages'
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultPermissions.forEach(permission => {
      this.permissions.set(permission.id, permission);
    });

    logger.info('Default AI delegation permissions initialized', {
      component: 'AIDelegationManager',
      permissionCount: defaultPermissions.length
    });
  }

  /**
   * Get all available permissions
   */
  public getAvailablePermissions(category?: string): DelegationPermission[] {
    const permissions = Array.from(this.permissions.values());
    
    if (category) {
      return permissions.filter(p => p.category === category);
    }
    
    return permissions;
  }

  /**
   * Get permission by ID
   */
  public getPermission(permissionId: string): DelegationPermission | null {
    return this.permissions.get(permissionId) || null;
  }

  /**
   * Request delegation permissions
   */
  public async requestPermissions(
    userId: string,
    organizationId: string,
    permissionIds: string[],
    reason: string,
    conditions: any = {}
  ): Promise<DelegationRequest> {
    const request: DelegationRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      organizationId,
      permissionIds,
      requestedAt: new Date(),
      reason,
      conditions,
      status: 'pending',
      autoApprovalEligible: this.isAutoApprovalEligible(permissionIds)
    };

    this.requests.set(request.id, request);

    // Log the request
    await aiAuditTrailSystem.logAction({
      userId,
      userRole: 'user',
      action: 'delegation_request_created',
      resource: `delegation_request:${request.id}`,
      details: {
        requestId: request.id,
        permissionIds,
        reason,
        autoApprovalEligible: request.autoApprovalEligible
      },
      impact: 'medium',
      timestamp: new Date()
    });

    // Stream request notification
    await aiStreamingService.streamDelegationUpdate(organizationId, {
      type: 'request_created',
      request,
      timestamp: new Date()
    });

    // Auto-approve if eligible
    if (request.autoApprovalEligible) {
      await this.approveRequest(request.id, 'system', 'Auto-approved based on low risk assessment');
    }

    this.emit('requestCreated', request);
    return request;
  }

  /**
   * Check if request is eligible for auto-approval
   */
  private isAutoApprovalEligible(permissionIds: string[]): boolean {
    const permissions = permissionIds.map(id => this.permissions.get(id)).filter(Boolean);
    
    // Auto-approve only if all permissions are low risk
    return permissions.every(p => p!.riskLevel === 'low');
  }

  /**
   * Approve delegation request
   */
  public async approveRequest(
    requestId: string,
    reviewedBy: string,
    reviewNotes?: string
  ): Promise<DelegationGrant[]> {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Request is not pending');
    }

    request.status = 'approved';
    request.reviewedBy = reviewedBy;
    request.reviewedAt = new Date();
    request.reviewNotes = reviewNotes;

    // Create grants for each permission
    const grants: DelegationGrant[] = [];
    
    for (const permissionId of request.permissionIds) {
      const permission = this.permissions.get(permissionId);
      if (!permission) continue;

      const grant: DelegationGrant = {
        id: `grant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: request.userId,
        organizationId: request.organizationId,
        permissionId,
        grantedAt: new Date(),
        expiresAt: request.conditions.expiresAt ? new Date(request.conditions.expiresAt) : undefined,
        conditions: {
          timeWindow: request.conditions.timeWindow,
          usageLimit: request.conditions.usageLimit,
          approvalRequired: permission.riskLevel === 'critical',
          notificationSettings: request.conditions.notificationSettings || {
            onUse: true,
            onExpiry: true,
            onLimit: true
          }
        },
        restrictions: request.conditions.restrictions || {},
        metadata: {
          reason: request.reason,
          grantedBy: reviewedBy,
          usageHistory: []
        },
        status: 'active'
      };

      this.grants.set(grant.id, grant);
      grants.push(grant);
    }

    // Log the approval
    await aiAuditTrailSystem.logAction({
      userId: request.userId,
      userRole: 'user',
      action: 'delegation_request_approved',
      resource: `delegation_request:${requestId}`,
      details: {
        requestId,
        reviewedBy,
        reviewNotes,
        grantsCreated: grants.length
      },
      impact: 'high',
      timestamp: new Date()
    });

    // Stream approval notification
    await aiStreamingService.streamDelegationUpdate(request.organizationId, {
      type: 'request_approved',
      request,
      grants,
      timestamp: new Date()
    });

    this.emit('requestApproved', { request, grants });
    return grants;
  }

  /**
   * Reject delegation request
   */
  public async rejectRequest(
    requestId: string,
    reviewedBy: string,
    reviewNotes: string
  ): Promise<void> {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Request is not pending');
    }

    request.status = 'rejected';
    request.reviewedBy = reviewedBy;
    request.reviewedAt = new Date();
    request.reviewNotes = reviewNotes;

    // Log the rejection
    await aiAuditTrailSystem.logAction({
      userId: request.userId,
      userRole: 'user',
      action: 'delegation_request_rejected',
      resource: `delegation_request:${requestId}`,
      details: {
        requestId,
        reviewedBy,
        reviewNotes
      },
      impact: 'medium',
      timestamp: new Date()
    });

    // Stream rejection notification
    await aiStreamingService.streamDelegationUpdate(request.organizationId, {
      type: 'request_rejected',
      request,
      timestamp: new Date()
    });

    this.emit('requestRejected', request);
  }

  /**
   * Check if user has permission for specific operation
   */
  public hasPermission(
    userId: string,
    organizationId: string,
    permissionId: string,
    operation: string
  ): boolean {
    const userGrants = Array.from(this.grants.values()).filter(
      grant => grant.userId === userId && 
               grant.organizationId === organizationId && 
               grant.permissionId === permissionId &&
               grant.status === 'active'
    );

    if (userGrants.length === 0) return false;

    // Check if any grant covers this operation
    for (const grant of userGrants) {
      const permission = this.permissions.get(grant.permissionId);
      if (!permission) continue;

      // Check if operation is allowed
      if (!permission.scope.operations.includes(operation)) continue;

      // Check expiry
      if (grant.expiresAt && grant.expiresAt < new Date()) {
        grant.status = 'expired';
        continue;
      }

      // Check usage limits
      if (grant.conditions.usageLimit) {
        const { maxOperations, currentUsage } = grant.conditions.usageLimit;
        if (currentUsage >= maxOperations) continue;
      }

      // Check time window
      if (grant.conditions.timeWindow) {
        const now = new Date();
        const { start, end, timezone } = grant.conditions.timeWindow;
        // TODO: Implement timezone-aware time window checking
      }

      return true;
    }

    return false;
  }

  /**
   * Use delegation permission
   */
  public async usePermission(
    userId: string,
    organizationId: string,
    permissionId: string,
    operation: string,
    taskId: string,
    metadata: Record<string, any> = {}
  ): Promise<DelegationUsage> {
    if (!this.hasPermission(userId, organizationId, permissionId, operation)) {
      throw new Error('Permission denied');
    }

    // Find the appropriate grant
    const grant = Array.from(this.grants.values()).find(
      g => g.userId === userId && 
           g.organizationId === organizationId && 
           g.permissionId === permissionId &&
           g.status === 'active'
    );

    if (!grant) {
      throw new Error('No active grant found');
    }

    const usage: DelegationUsage = {
      id: `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      grantId: grant.id,
      taskId,
      operation,
      timestamp: new Date(),
      success: true,
      metadata
    };

    // Update grant usage
    grant.metadata.lastUsed = new Date();
    grant.metadata.usageHistory.push(usage);
    
    if (grant.conditions.usageLimit) {
      grant.conditions.usageLimit.currentUsage++;
    }

    this.usageHistory.push(usage);

    // Log the usage
    await aiAuditTrailSystem.logAction({
      userId,
      userRole: 'ai_agent',
      action: 'delegation_permission_used',
      resource: `delegation_grant:${grant.id}`,
      details: {
        grantId: grant.id,
        permissionId,
        operation,
        taskId,
        metadata
      },
      impact: 'medium',
      timestamp: new Date()
    });

    // Send notification if configured
    if (grant.conditions.notificationSettings?.onUse) {
      await aiStreamingService.streamDelegationUpdate(organizationId, {
        type: 'permission_used',
        grant,
        usage,
        timestamp: new Date()
      });
    }

    this.emit('permissionUsed', { grant, usage });
    return usage;
  }

  /**
   * Revoke delegation grant
   */
  public async revokeGrant(
    grantId: string,
    revokedBy: string,
    reason: string
  ): Promise<void> {
    const grant = this.grants.get(grantId);
    if (!grant) {
      throw new Error('Grant not found');
    }

    grant.status = 'revoked';
    grant.metadata.usageHistory.push({
      id: `revoke_${Date.now()}`,
      grantId,
      taskId: 'system',
      operation: 'revoke',
      timestamp: new Date(),
      success: true,
      metadata: { revokedBy, reason }
    });

    // Log the revocation
    await aiAuditTrailSystem.logAction({
      userId: grant.userId,
      userRole: 'user',
      action: 'delegation_grant_revoked',
      resource: `delegation_grant:${grantId}`,
      details: {
        grantId,
        revokedBy,
        reason
      },
      impact: 'high',
      timestamp: new Date()
    });

    // Stream revocation notification
    await aiStreamingService.streamDelegationUpdate(grant.organizationId, {
      type: 'grant_revoked',
      grant,
      revokedBy,
      reason,
      timestamp: new Date()
    });

    this.emit('grantRevoked', { grant, revokedBy, reason });
  }

  /**
   * Get user's delegation grants
   */
  public getUserGrants(userId: string, organizationId: string): DelegationGrant[] {
    return Array.from(this.grants.values()).filter(
      grant => grant.userId === userId && grant.organizationId === organizationId
    );
  }

  /**
   * Get user's delegation requests
   */
  public getUserRequests(userId: string, organizationId: string): DelegationRequest[] {
    return Array.from(this.requests.values()).filter(
      request => request.userId === userId && request.organizationId === organizationId
    );
  }

  /**
   * Get pending requests for review
   */
  public getPendingRequests(organizationId: string): DelegationRequest[] {
    return Array.from(this.requests.values()).filter(
      request => request.organizationId === organizationId && request.status === 'pending'
    );
  }

  /**
   * Get delegation templates
   */
  public getTemplates(category?: string): DelegationTemplate[] {
    const templates = Array.from(this.templates.values());
    
    if (category) {
      return templates.filter(t => t.category === category);
    }
    
    return templates;
  }

  /**
   * Create delegation template
   */
  public createTemplate(
    name: string,
    description: string,
    category: string,
    permissions: string[],
    defaultConditions: any,
    createdBy: string,
    isPublic: boolean = false
  ): DelegationTemplate {
    const template: DelegationTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      category,
      permissions,
      defaultConditions,
      recommendedFor: [],
      createdBy,
      isPublic,
      usageCount: 0
    };

    this.templates.set(template.id, template);
    this.emit('templateCreated', template);
    return template;
  }

  /**
   * Get delegation statistics
   */
  public getStatistics(organizationId: string): any {
    const grants = Array.from(this.grants.values()).filter(
      grant => grant.organizationId === organizationId
    );

    const requests = Array.from(this.requests.values()).filter(
      request => request.organizationId === organizationId
    );

    const usage = this.usageHistory.filter(
      usage => grants.some(grant => grant.id === usage.grantId)
    );

    return {
      grants: {
        total: grants.length,
        active: grants.filter(g => g.status === 'active').length,
        expired: grants.filter(g => g.status === 'expired').length,
        revoked: grants.filter(g => g.status === 'revoked').length
      },
      requests: {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length
      },
      usage: {
        total: usage.length,
        successful: usage.filter(u => u.success).length,
        failed: usage.filter(u => !u.success).length,
        lastUsed: usage.length > 0 ? usage[usage.length - 1].timestamp : null
      }
    };
  }
}

export const aiDelegationManager = new AIDelegationManager();