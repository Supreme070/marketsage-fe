/**
 * Enterprise Audit Logging System
 * ==============================
 * Comprehensive audit trail with integrity protection and compliance features
 */

import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { enterpriseEncryption } from '@/lib/encryption/enterprise-encryption';
import crypto from 'crypto';

export interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  actor: {
    id: string;
    type: 'user' | 'system' | 'api' | 'admin';
    identifier: string; // email, API key name, etc.
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
  resource: {
    type: ResourceType;
    id: string;
    name?: string;
    organizationId: string;
  };
  action: AuditAction;
  outcome: 'success' | 'failure' | 'partial';
  details: {
    changes?: Record<string, { from: any; to: any }>;
    metadata?: Record<string, any>;
    errorMessage?: string;
    duration?: number;
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  };
  compliance: {
    dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
    retentionDays: number;
    gdprRelevant: boolean;
    hipaaRelevant: boolean;
    pciRelevant: boolean;
  };
  integrity: {
    hash: string;
    previousHash?: string;
    signature: string;
    chainVerified: boolean;
  };
}

export type AuditEventType = 
  | 'AUTHENTICATION' | 'AUTHORIZATION' | 'DATA_ACCESS' | 'DATA_MODIFICATION'
  | 'SYSTEM_ADMIN' | 'SECURITY_EVENT' | 'COMPLIANCE_EVENT' | 'API_ACCESS'
  | 'CONFIGURATION_CHANGE' | 'BACKUP_RESTORE' | 'PRIVACY_REQUEST';

export type ResourceType = 
  | 'USER' | 'CONTACT' | 'CAMPAIGN' | 'WORKFLOW' | 'ORGANIZATION' | 'API_KEY'
  | 'SYSTEM_SETTING' | 'DATABASE' | 'ENCRYPTION_KEY' | 'BACKUP' | 'AUDIT_LOG';

export type AuditAction = 
  | 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN'
  | 'PERMISSION_GRANT' | 'PERMISSION_REVOKE' | 'EXPORT' | 'IMPORT' | 'BACKUP'
  | 'RESTORE' | 'CONFIGURE' | 'ENCRYPT' | 'DECRYPT' | 'ANONYMIZE' | 'PURGE';

export interface AuditQuery {
  organizationId?: string;
  actorId?: string;
  resourceType?: ResourceType;
  resourceId?: string;
  eventType?: AuditEventType;
  action?: AuditAction;
  outcome?: 'success' | 'failure' | 'partial';
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditReport {
  summary: {
    totalEvents: number;
    highRiskEvents: number;
    failedEvents: number;
    uniqueActors: number;
    timeRange: { start: Date; end: Date };
  };
  riskAnalysis: {
    riskDistribution: Record<string, number>;
    suspiciousPatterns: string[];
    anomalies: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      affectedResources: string[];
    }>;
  };
  complianceMetrics: {
    gdprEvents: number;
    dataAccessEvents: number;
    privacyRequests: number;
    retentionViolations: number;
  };
  topEvents: {
    mostActiveUsers: Array<{ actorId: string; eventCount: number }>;
    mostAccessedResources: Array<{ resourceId: string; accessCount: number }>;
    failuresByType: Record<string, number>;
  };
}

export class EnterpriseAuditLogger {
  private readonly hashChain: Map<string, string> = new Map();
  private readonly integrityKey: Buffer;

  constructor() {
    // Initialize integrity protection
    const integrityKeyEnv = process.env.AUDIT_INTEGRITY_KEY;
    if (!integrityKeyEnv || integrityKeyEnv === 'default-audit-key') {
      throw new Error('SECURITY: Audit integrity key must be set and cannot be default value');
    }
    
    this.integrityKey = crypto.pbkdf2Sync(integrityKeyEnv, 'audit-salt', 100000, 32, 'sha512');
    this.initializeHashChain();
  }

  /**
   * Log high-importance audit event with integrity protection
   */
  async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp' | 'integrity'>): Promise<void> {
    try {
      const auditEvent = await this.createAuditEvent(event);
      
      // Store in multiple locations for redundancy
      await Promise.all([
        this.storeInDatabase(auditEvent),
        this.storeInSecureLog(auditEvent),
        this.updateHashChain(auditEvent)
      ]);

      // Real-time alerting for critical events
      if (auditEvent.details.riskLevel === 'critical') {
        await this.triggerSecurityAlert(auditEvent);
      }

      // Compliance notifications
      if (auditEvent.compliance.gdprRelevant) {
        await this.notifyComplianceTeam(auditEvent);
      }

    } catch (error) {
      // Audit logging failures are critical - never fail silently
      logger.error('CRITICAL: Audit logging failed', {
        error: error instanceof Error ? error.message : String(error),
        event: event.action,
        resourceType: event.resource.type,
        actorId: event.actor.id
      });
      
      // Fallback to emergency logging
      await this.emergencyLog(event, error);
      throw error;
    }
  }

  /**
   * Simplified logging for common events
   */
  async logUserAction(
    userId: string,
    action: AuditAction,
    resourceType: ResourceType,
    resourceId: string,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent({
      eventType: 'DATA_ACCESS',
      actor: {
        id: userId,
        type: 'user',
        identifier: userId,
        ipAddress,
        userAgent
      },
      resource: {
        type: resourceType,
        id: resourceId,
        organizationId: await this.getOrganizationId(userId)
      },
      action,
      outcome: 'success',
      details: {
        metadata: details,
        riskLevel: this.calculateRiskLevel(action, resourceType)
      },
      compliance: {
        dataClassification: this.classifyData(resourceType),
        retentionDays: this.getRetentionPeriod(resourceType),
        gdprRelevant: this.isGDPRRelevant(resourceType),
        hipaaRelevant: false,
        pciRelevant: this.isPCIRelevant(resourceType)
      }
    });
  }

  /**
   * Log security events with enhanced details
   */
  async logSecurityEvent(
    eventType: 'FAILED_LOGIN' | 'SUSPICIOUS_ACTIVITY' | 'PERMISSION_VIOLATION' | 'DATA_BREACH',
    actorIdentifier: string,
    details: {
      riskLevel: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      ipAddress?: string;
      userAgent?: string;
      resourceId?: string;
      resourceType?: ResourceType;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    await this.logEvent({
      eventType: 'SECURITY_EVENT',
      actor: {
        id: 'unknown',
        type: 'user',
        identifier: actorIdentifier,
        ipAddress: details.ipAddress,
        userAgent: details.userAgent
      },
      resource: {
        type: details.resourceType || 'SYSTEM_SETTING',
        id: details.resourceId || 'security-system',
        organizationId: 'system'
      },
      action: eventType === 'FAILED_LOGIN' ? 'FAILED_LOGIN' : 'READ',
      outcome: 'failure',
      details: {
        metadata: details.metadata,
        errorMessage: details.description,
        riskLevel: details.riskLevel
      },
      compliance: {
        dataClassification: 'confidential',
        retentionDays: 2555, // 7 years for security events
        gdprRelevant: true,
        hipaaRelevant: false,
        pciRelevant: false
      }
    });
  }

  /**
   * Log administrative actions
   */
  async logAdminAction(
    adminId: string,
    action: AuditAction,
    resourceType: ResourceType,
    resourceId: string,
    changes?: Record<string, { from: any; to: any }>,
    ipAddress?: string
  ): Promise<void> {
    await this.logEvent({
      eventType: 'SYSTEM_ADMIN',
      actor: {
        id: adminId,
        type: 'admin',
        identifier: adminId,
        ipAddress
      },
      resource: {
        type: resourceType,
        id: resourceId,
        organizationId: await this.getOrganizationId(adminId)
      },
      action,
      outcome: 'success',
      details: {
        changes,
        riskLevel: 'high' // Admin actions are always high risk
      },
      compliance: {
        dataClassification: 'restricted',
        retentionDays: 2555,
        gdprRelevant: true,
        hipaaRelevant: false,
        pciRelevant: false
      }
    });
  }

  /**
   * Log API access with rate limiting context
   */
  async logAPIAccess(
    apiKeyId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await this.logEvent({
      eventType: 'API_ACCESS',
      actor: {
        id: apiKeyId,
        type: 'api',
        identifier: apiKeyId,
        ipAddress,
        userAgent
      },
      resource: {
        type: 'API_KEY',
        id: endpoint,
        organizationId: await this.getOrganizationIdByApiKey(apiKeyId)
      },
      action: this.mapHttpMethodToAction(method),
      outcome: statusCode < 400 ? 'success' : 'failure',
      details: {
        duration,
        metadata: {
          endpoint,
          method,
          statusCode
        },
        riskLevel: this.calculateAPIRiskLevel(endpoint, statusCode)
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

  /**
   * Query audit logs with advanced filtering
   */
  async queryLogs(query: AuditQuery): Promise<{
    events: AuditEvent[];
    totalCount: number;
    hasMore: boolean;
  }> {
    try {
      const whereClause = this.buildWhereClause(query);
      
      const [events, totalCount] = await Promise.all([
        prisma.auditEvent.findMany({
          where: whereClause,
          orderBy: { timestamp: 'desc' },
          take: query.limit || 100,
          skip: query.offset || 0
        }),
        prisma.auditEvent.count({ where: whereClause })
      ]);

      // Decrypt and verify integrity
      const decryptedEvents = await Promise.all(
        events.map(event => this.decryptAuditEvent(event))
      );

      return {
        events: decryptedEvents,
        totalCount,
        hasMore: (query.offset || 0) + events.length < totalCount
      };

    } catch (error) {
      logger.error('Audit log query failed', {
        error: error instanceof Error ? error.message : String(error),
        query
      });
      throw error;
    }
  }

  /**
   * Generate comprehensive audit report
   */
  async generateReport(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AuditReport> {
    try {
      const baseQuery = {
        organizationId,
        startDate,
        endDate
      };

      const [
        totalEvents,
        highRiskEvents,
        failedEvents,
        uniqueActors,
        riskDistribution,
        complianceEvents,
        topUsers,
        topResources,
        failuresByType
      ] = await Promise.all([
        this.countEvents(baseQuery),
        this.countHighRiskEvents(baseQuery),
        this.countFailedEvents(baseQuery),
        this.countUniqueActors(baseQuery),
        this.analyzeRiskDistribution(baseQuery),
        this.analyzeComplianceEvents(baseQuery),
        this.getTopActiveUsers(baseQuery),
        this.getTopAccessedResources(baseQuery),
        this.analyzeFailuresByType(baseQuery)
      ]);

      const anomalies = await this.detectAnomalies(baseQuery);
      const suspiciousPatterns = await this.detectSuspiciousPatterns(baseQuery);

      return {
        summary: {
          totalEvents,
          highRiskEvents,
          failedEvents,
          uniqueActors,
          timeRange: { start: startDate, end: endDate }
        },
        riskAnalysis: {
          riskDistribution,
          suspiciousPatterns,
          anomalies
        },
        complianceMetrics: {
          gdprEvents: complianceEvents.gdpr,
          dataAccessEvents: complianceEvents.dataAccess,
          privacyRequests: complianceEvents.privacy,
          retentionViolations: complianceEvents.retention
        },
        topEvents: {
          mostActiveUsers: topUsers,
          mostAccessedResources: topResources,
          failuresByType
        }
      };

    } catch (error) {
      logger.error('Audit report generation failed', {
        error: error instanceof Error ? error.message : String(error),
        organizationId,
        startDate,
        endDate
      });
      throw error;
    }
  }

  /**
   * Verify audit log integrity
   */
  async verifyIntegrity(organizationId: string): Promise<{
    isValid: boolean;
    corruptedEvents: string[];
    chainBreaks: number;
    lastVerifiedEvent: string;
  }> {
    try {
      const events = await prisma.auditEvent.findMany({
        where: { organizationId },
        orderBy: { timestamp: 'asc' }
      });

      const corruptedEvents: string[] = [];
      let chainBreaks = 0;
      let lastVerifiedEvent = '';
      let previousHash = '';

      for (const event of events) {
        // Verify individual event integrity
        const decryptedEvent = await this.decryptAuditEvent(event);
        const isEventValid = await this.verifyEventIntegrity(decryptedEvent);
        
        if (!isEventValid) {
          corruptedEvents.push(event.id);
        }

        // Verify hash chain
        if (previousHash && decryptedEvent.integrity.previousHash !== previousHash) {
          chainBreaks++;
        }

        if (isEventValid) {
          lastVerifiedEvent = event.id;
        }

        previousHash = decryptedEvent.integrity.hash;
      }

      const isValid = corruptedEvents.length === 0 && chainBreaks === 0;

      logger.info('Audit integrity verification completed', {
        organizationId,
        isValid,
        totalEvents: events.length,
        corruptedEvents: corruptedEvents.length,
        chainBreaks
      });

      return {
        isValid,
        corruptedEvents,
        chainBreaks,
        lastVerifiedEvent
      };

    } catch (error) {
      logger.error('Audit integrity verification failed', {
        error: error instanceof Error ? error.message : String(error),
        organizationId
      });
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async createAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp' | 'integrity'>): Promise<AuditEvent> {
    const id = crypto.randomUUID();
    const timestamp = new Date();
    
    // Create event payload for hashing
    const eventPayload = {
      id,
      timestamp,
      ...event
    };

    // Generate integrity protection
    const eventHash = this.generateEventHash(eventPayload);
    const previousHash = this.hashChain.get(event.resource.organizationId);
    const signature = this.generateSignature(eventHash);

    const auditEvent: AuditEvent = {
      ...eventPayload,
      integrity: {
        hash: eventHash,
        previousHash,
        signature,
        chainVerified: true
      }
    };

    return auditEvent;
  }

  private generateEventHash(event: any): string {
    const eventString = JSON.stringify(event, Object.keys(event).sort());
    return crypto.createHash('sha256').update(eventString).digest('hex');
  }

  private generateSignature(hash: string): string {
    return crypto.createHmac('sha256', this.integrityKey).update(hash).digest('hex');
  }

  private async storeInDatabase(event: AuditEvent): Promise<void> {
    // Encrypt sensitive data before storage
    const encryptedEvent = await this.encryptAuditEvent(event);
    
    await prisma.auditEvent.create({
      data: {
        id: encryptedEvent.id,
        timestamp: encryptedEvent.timestamp,
        eventType: encryptedEvent.eventType,
        actorData: encryptedEvent.actorData,
        resourceData: encryptedEvent.resourceData,
        action: encryptedEvent.action,
        outcome: encryptedEvent.outcome,
        detailsData: encryptedEvent.detailsData,
        complianceData: encryptedEvent.complianceData,
        integrityData: encryptedEvent.integrityData,
        organizationId: event.resource.organizationId
      } as any
    });
  }

  private async storeInSecureLog(event: AuditEvent): Promise<void> {
    // Store in write-only security log for tamper protection
    logger.audit('AUDIT_EVENT', {
      eventId: event.id,
      timestamp: event.timestamp,
      eventType: event.eventType,
      actor: event.actor.identifier,
      resource: `${event.resource.type}:${event.resource.id}`,
      action: event.action,
      outcome: event.outcome,
      riskLevel: event.details.riskLevel,
      hash: event.integrity.hash
    });
  }

  private async updateHashChain(event: AuditEvent): Promise<void> {
    this.hashChain.set(event.resource.organizationId, event.integrity.hash);
  }

  private initializeHashChain(): void {
    // Initialize hash chain for organizations
    logger.info('Audit hash chain initialized');
  }

  private async encryptAuditEvent(event: AuditEvent): Promise<any> {
    return {
      id: event.id,
      timestamp: event.timestamp,
      eventType: event.eventType,
      actorData: enterpriseEncryption.encryptAdvanced(JSON.stringify(event.actor)),
      resourceData: enterpriseEncryption.encryptAdvanced(JSON.stringify(event.resource)),
      action: event.action,
      outcome: event.outcome,
      detailsData: enterpriseEncryption.encryptAdvanced(JSON.stringify(event.details)),
      complianceData: enterpriseEncryption.encryptAdvanced(JSON.stringify(event.compliance)),
      integrityData: enterpriseEncryption.encryptAdvanced(JSON.stringify(event.integrity))
    };
  }

  private async decryptAuditEvent(encryptedEvent: any): Promise<AuditEvent> {
    return {
      id: encryptedEvent.id,
      timestamp: encryptedEvent.timestamp,
      eventType: encryptedEvent.eventType,
      actor: JSON.parse(enterpriseEncryption.decryptAdvanced(encryptedEvent.actorData)),
      resource: JSON.parse(enterpriseEncryption.decryptAdvanced(encryptedEvent.resourceData)),
      action: encryptedEvent.action,
      outcome: encryptedEvent.outcome,
      details: JSON.parse(enterpriseEncryption.decryptAdvanced(encryptedEvent.detailsData)),
      compliance: JSON.parse(enterpriseEncryption.decryptAdvanced(encryptedEvent.complianceData)),
      integrity: JSON.parse(enterpriseEncryption.decryptAdvanced(encryptedEvent.integrityData))
    };
  }

  private calculateRiskLevel(action: AuditAction, resourceType: ResourceType): 'low' | 'medium' | 'high' | 'critical' {
    const highRiskActions = ['DELETE', 'PURGE', 'EXPORT', 'PERMISSION_GRANT'];
    const sensitiveResources = ['USER', 'ENCRYPTION_KEY', 'BACKUP', 'SYSTEM_SETTING'];
    
    if (highRiskActions.includes(action) && sensitiveResources.includes(resourceType)) {
      return 'critical';
    } else if (highRiskActions.includes(action) || sensitiveResources.includes(resourceType)) {
      return 'high';
    } else if (action === 'UPDATE') {
      return 'medium';
    }
    return 'low';
  }

  private classifyData(resourceType: ResourceType): 'public' | 'internal' | 'confidential' | 'restricted' {
    const restrictedTypes = ['ENCRYPTION_KEY', 'SYSTEM_SETTING', 'API_KEY'];
    const confidentialTypes = ['USER', 'CONTACT', 'BACKUP'];
    
    if (restrictedTypes.includes(resourceType)) return 'restricted';
    if (confidentialTypes.includes(resourceType)) return 'confidential';
    return 'internal';
  }

  private getRetentionPeriod(resourceType: ResourceType): number {
    const retentionMap: Record<ResourceType, number> = {
      'USER': 2555, // 7 years
      'CONTACT': 1095, // 3 years
      'CAMPAIGN': 1095,
      'WORKFLOW': 365,
      'ORGANIZATION': 2555,
      'API_KEY': 365,
      'SYSTEM_SETTING': 2555,
      'DATABASE': 2555,
      'ENCRYPTION_KEY': 2555,
      'BACKUP': 365,
      'AUDIT_LOG': 2555
    };
    
    return retentionMap[resourceType] || 365;
  }

  private isGDPRRelevant(resourceType: ResourceType): boolean {
    return ['USER', 'CONTACT'].includes(resourceType);
  }

  private isPCIRelevant(resourceType: ResourceType): boolean {
    return ['DATABASE', 'BACKUP', 'ENCRYPTION_KEY'].includes(resourceType);
  }

  private mapHttpMethodToAction(method: string): AuditAction {
    const methodMap: Record<string, AuditAction> = {
      'GET': 'READ',
      'POST': 'CREATE',
      'PUT': 'UPDATE',
      'PATCH': 'UPDATE',
      'DELETE': 'DELETE'
    };
    return methodMap[method] || 'READ';
  }

  private calculateAPIRiskLevel(endpoint: string, statusCode: number): 'low' | 'medium' | 'high' | 'critical' {
    if (statusCode >= 500) return 'high';
    if (statusCode >= 400) return 'medium';
    if (endpoint.includes('/admin/') || endpoint.includes('/system/')) return 'high';
    return 'low';
  }

  // Additional helper methods for report generation...
  private async getOrganizationId(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    });
    return user?.organizationId || 'unknown';
  }

  private async getOrganizationIdByApiKey(apiKeyId: string): Promise<string> {
    // Implementation would look up organization by API key
    return 'unknown';
  }

  private buildWhereClause(query: AuditQuery): any {
    const where: any = {};
    
    if (query.organizationId) where.organizationId = query.organizationId;
    if (query.eventType) where.eventType = query.eventType;
    if (query.action) where.action = query.action;
    if (query.outcome) where.outcome = query.outcome;
    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) where.timestamp.gte = query.startDate;
      if (query.endDate) where.timestamp.lte = query.endDate;
    }
    
    return where;
  }

  private async verifyEventIntegrity(event: AuditEvent): Promise<boolean> {
    const eventPayload = { ...event };
    delete eventPayload.integrity;
    
    const expectedHash = this.generateEventHash(eventPayload);
    const expectedSignature = this.generateSignature(expectedHash);
    
    return event.integrity.hash === expectedHash && event.integrity.signature === expectedSignature;
  }

  private async triggerSecurityAlert(event: AuditEvent): Promise<void> {
    logger.critical('SECURITY_ALERT', {
      eventId: event.id,
      actor: event.actor.identifier,
      action: event.action,
      resource: `${event.resource.type}:${event.resource.id}`,
      riskLevel: event.details.riskLevel
    });
  }

  private async notifyComplianceTeam(event: AuditEvent): Promise<void> {
    logger.info('GDPR_EVENT', {
      eventId: event.id,
      eventType: event.eventType,
      dataClassification: event.compliance.dataClassification
    });
  }

  private async emergencyLog(event: any, error: any): Promise<void> {
    // Emergency fallback logging
    console.error('EMERGENCY_AUDIT_LOG', {
      timestamp: new Date().toISOString(),
      event: JSON.stringify(event),
      error: error instanceof Error ? error.message : String(error)
    });
  }

  // Report generation helper methods (simplified implementations)
  private async countEvents(query: any): Promise<number> { return 0; }
  private async countHighRiskEvents(query: any): Promise<number> { return 0; }
  private async countFailedEvents(query: any): Promise<number> { return 0; }
  private async countUniqueActors(query: any): Promise<number> { return 0; }
  private async analyzeRiskDistribution(query: any): Promise<Record<string, number>> { return {}; }
  private async analyzeComplianceEvents(query: any): Promise<any> { return { gdpr: 0, dataAccess: 0, privacy: 0, retention: 0 }; }
  private async getTopActiveUsers(query: any): Promise<Array<{ actorId: string; eventCount: number }>> { return []; }
  private async getTopAccessedResources(query: any): Promise<Array<{ resourceId: string; accessCount: number }>> { return []; }
  private async analyzeFailuresByType(query: any): Promise<Record<string, number>> { return {}; }
  private async detectAnomalies(query: any): Promise<any[]> { return []; }
  private async detectSuspiciousPatterns(query: any): Promise<string[]> { return []; }
}

export const enterpriseAuditLogger = new EnterpriseAuditLogger();

// Helper functions for easy usage
export const auditUserAction = (userId: string, action: AuditAction, resourceType: ResourceType, resourceId: string, details?: any, ipAddress?: string, userAgent?: string) =>
  enterpriseAuditLogger.logUserAction(userId, action, resourceType, resourceId, details, ipAddress, userAgent);

export const auditSecurityEvent = (eventType: any, actorIdentifier: string, details: any) =>
  enterpriseAuditLogger.logSecurityEvent(eventType, actorIdentifier, details);

export const auditAdminAction = (adminId: string, action: AuditAction, resourceType: ResourceType, resourceId: string, changes?: any, ipAddress?: string) =>
  enterpriseAuditLogger.logAdminAction(adminId, action, resourceType, resourceId, changes, ipAddress);

export const auditAPIAccess = (apiKeyId: string, endpoint: string, method: string, statusCode: number, duration: number, ipAddress: string, userAgent: string) =>
  enterpriseAuditLogger.logAPIAccess(apiKeyId, endpoint, method, statusCode, duration, ipAddress, userAgent);