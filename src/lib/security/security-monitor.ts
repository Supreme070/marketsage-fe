import { logger } from '@/lib/logger';
import { redisCache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache/redis-client';

/**
 * Security event types for monitoring
 */
export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGIN_BLOCKED = 'LOGIN_BLOCKED',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  DATA_ACCESS = 'DATA_ACCESS',
  BULK_OPERATION = 'BULK_OPERATION',
  ADMIN_ACTION = 'ADMIN_ACTION',
  API_ABUSE = 'API_ABUSE',
  CORS_VIOLATION = 'CORS_VIOLATION'
}

/**
 * Security event severity levels
 */
export enum SecuritySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Security event interface
 */
export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  timestamp: Date;
  userId?: string;
  email?: string;
  ipAddress: string;
  userAgent?: string;
  organizationId?: string;
  resource?: string;
  action?: string;
  metadata?: Record<string, any>;
  description: string;
}

/**
 * Anomaly detection patterns
 */
interface AnomalyPattern {
  type: string;
  threshold: number;
  timeWindow: number; // in seconds
  severity: SecuritySeverity;
}

const ANOMALY_PATTERNS: AnomalyPattern[] = [
  {
    type: 'multiple_failed_logins',
    threshold: 5,
    timeWindow: 300, // 5 minutes
    severity: SecuritySeverity.HIGH
  },
  {
    type: 'rapid_api_calls',
    threshold: 100,
    timeWindow: 60, // 1 minute
    severity: SecuritySeverity.MEDIUM
  },
  {
    type: 'unusual_access_hours',
    threshold: 1,
    timeWindow: 3600, // 1 hour (between 2-6 AM)
    severity: SecuritySeverity.MEDIUM
  },
  {
    type: 'bulk_data_access',
    threshold: 1000,
    timeWindow: 300, // 5 minutes
    severity: SecuritySeverity.HIGH
  },
  {
    type: 'privilege_escalation',
    threshold: 3,
    timeWindow: 1800, // 30 minutes
    severity: SecuritySeverity.CRITICAL
  }
];

/**
 * Security monitoring and anomaly detection system
 */
class SecurityMonitor {
  private static instance: SecurityMonitor;
  private eventBuffer: SecurityEvent[] = [];
  private bufferSize = 1000;

  private constructor() {
    // Start periodic anomaly detection
    setInterval(() => this.detectAnomalies(), 60000); // Every minute
  }

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  /**
   * Log a security event
   */
  async logEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    const securityEvent: SecurityEvent = {
      ...event,
      id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    // Add to in-memory buffer
    this.eventBuffer.push(securityEvent);
    if (this.eventBuffer.length > this.bufferSize) {
      this.eventBuffer.shift(); // Remove oldest event
    }

    // Cache in Redis for quick access
    const cacheKey = `security_event:${securityEvent.id}`;
    await redisCache.set(cacheKey, securityEvent, CACHE_TTL.DAY);

    // Log to structured logger
    logger.warn(`Security Event: ${event.type}`, {
      eventId: securityEvent.id,
      type: event.type,
      severity: event.severity,
      userId: event.userId,
      email: event.email,
      ipAddress: event.ipAddress,
      organizationId: event.organizationId,
      resource: event.resource,
      action: event.action,
      description: event.description,
      metadata: event.metadata
    });

    // Check for immediate anomalies
    await this.checkImmediateThreats(securityEvent);
  }

  /**
   * Log authentication events
   */
  async logAuthEvent(
    type: SecurityEventType.LOGIN_SUCCESS | SecurityEventType.LOGIN_FAILURE | SecurityEventType.LOGIN_BLOCKED,
    request: {
      email: string;
      ipAddress: string;
      userAgent?: string;
      userId?: string;
      organizationId?: string;
    }
  ): Promise<void> {
    const severity = type === SecurityEventType.LOGIN_SUCCESS 
      ? SecuritySeverity.LOW 
      : type === SecurityEventType.LOGIN_BLOCKED 
        ? SecuritySeverity.HIGH 
        : SecuritySeverity.MEDIUM;

    await this.logEvent({
      type,
      severity,
      userId: request.userId,
      email: request.email,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      organizationId: request.organizationId,
      description: `Authentication attempt: ${type.toLowerCase().replace('_', ' ')}`
    });
  }

  /**
   * Log data access events
   */
  async logDataAccess(
    userId: string,
    email: string,
    ipAddress: string,
    resource: string,
    action: string,
    recordCount?: number,
    organizationId?: string
  ): Promise<void> {
    const severity = recordCount && recordCount > 100 
      ? SecuritySeverity.MEDIUM 
      : SecuritySeverity.LOW;

    await this.logEvent({
      type: SecurityEventType.DATA_ACCESS,
      severity,
      userId,
      email,
      ipAddress,
      organizationId,
      resource,
      action,
      description: `Data access: ${action} on ${resource}`,
      metadata: { recordCount }
    });
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(
    ipAddress: string,
    reason: string,
    metadata?: Record<string, any>,
    userId?: string,
    email?: string
  ): Promise<void> {
    await this.logEvent({
      type: SecurityEventType.SUSPICIOUS_ACTIVITY,
      severity: SecuritySeverity.HIGH,
      userId,
      email,
      ipAddress,
      description: `Suspicious activity detected: ${reason}`,
      metadata
    });
  }

  /**
   * Log admin actions
   */
  async logAdminAction(
    userId: string,
    email: string,
    ipAddress: string,
    action: string,
    resource: string,
    organizationId?: string
  ): Promise<void> {
    await this.logEvent({
      type: SecurityEventType.ADMIN_ACTION,
      severity: SecuritySeverity.MEDIUM,
      userId,
      email,
      ipAddress,
      organizationId,
      resource,
      action,
      description: `Admin action: ${action} on ${resource}`
    });
  }

  /**
   * Check for immediate security threats
   */
  private async checkImmediateThreats(event: SecurityEvent): Promise<void> {
    // Check for rapid failed login attempts
    if (event.type === SecurityEventType.LOGIN_FAILURE) {
      const recentFailures = await this.getRecentEvents(
        SecurityEventType.LOGIN_FAILURE,
        event.ipAddress,
        300 // 5 minutes
      );

      if (recentFailures.length >= 5) {
        await this.logEvent({
          type: SecurityEventType.LOGIN_BLOCKED,
          severity: SecuritySeverity.HIGH,
          ipAddress: event.ipAddress,
          email: event.email,
          description: 'IP blocked due to multiple failed login attempts',
          metadata: { failureCount: recentFailures.length }
        });
      }
    }

    // Check for unusual access patterns
    if (event.type === SecurityEventType.DATA_ACCESS && event.metadata?.recordCount > 1000) {
      await this.logSuspiciousActivity(
        event.ipAddress,
        'Bulk data access detected',
        { recordCount: event.metadata.recordCount },
        event.userId,
        event.email
      );
    }
  }

  /**
   * Detect anomalies based on patterns
   */
  private async detectAnomalies(): Promise<void> {
    try {
      for (const pattern of ANOMALY_PATTERNS) {
        await this.checkPattern(pattern);
      }
    } catch (error) {
      logger.error('Anomaly detection failed:', error);
    }
  }

  /**
   * Check specific anomaly pattern
   */
  private async checkPattern(pattern: AnomalyPattern): Promise<void> {
    const now = Date.now();
    const windowStart = now - (pattern.timeWindow * 1000);

    // Get events in time window
    const recentEvents = this.eventBuffer.filter(
      event => event.timestamp.getTime() >= windowStart
    );

    let anomalyDetected = false;
    let anomalyData: Record<string, any> = {};

    switch (pattern.type) {
      case 'multiple_failed_logins':
        const failedLogins = recentEvents.filter(e => e.type === SecurityEventType.LOGIN_FAILURE);
        const ipGroups = this.groupByIP(failedLogins);
        
        for (const [ip, events] of Object.entries(ipGroups)) {
          if (events.length >= pattern.threshold) {
            anomalyDetected = true;
            anomalyData = { ip, failureCount: events.length };
            break;
          }
        }
        break;

      case 'rapid_api_calls':
        const apiCalls = recentEvents.filter(e => e.type === SecurityEventType.DATA_ACCESS);
        const userGroups = this.groupByUser(apiCalls);
        
        for (const [userId, events] of Object.entries(userGroups)) {
          if (events.length >= pattern.threshold) {
            anomalyDetected = true;
            anomalyData = { userId, callCount: events.length };
            break;
          }
        }
        break;

      case 'unusual_access_hours':
        const currentHour = new Date().getHours();
        if (currentHour >= 2 && currentHour <= 6) {
          const accessEvents = recentEvents.filter(e => 
            e.type === SecurityEventType.DATA_ACCESS || 
            e.type === SecurityEventType.LOGIN_SUCCESS
          );
          if (accessEvents.length > 0) {
            anomalyDetected = true;
            anomalyData = { hour: currentHour, eventCount: accessEvents.length };
          }
        }
        break;
    }

    if (anomalyDetected) {
      await this.logEvent({
        type: SecurityEventType.SUSPICIOUS_ACTIVITY,
        severity: pattern.severity,
        ipAddress: anomalyData.ip || 'unknown',
        description: `Anomaly detected: ${pattern.type}`,
        metadata: { pattern: pattern.type, ...anomalyData }
      });
    }
  }

  /**
   * Get recent events by type and IP
   */
  private async getRecentEvents(
    type: SecurityEventType,
    ipAddress: string,
    timeWindowSeconds: number
  ): Promise<SecurityEvent[]> {
    const cutoff = new Date(Date.now() - (timeWindowSeconds * 1000));
    
    return this.eventBuffer.filter(event =>
      event.type === type &&
      event.ipAddress === ipAddress &&
      event.timestamp >= cutoff
    );
  }

  /**
   * Group events by IP address
   */
  private groupByIP(events: SecurityEvent[]): Record<string, SecurityEvent[]> {
    return events.reduce((groups, event) => {
      const ip = event.ipAddress;
      groups[ip] = groups[ip] || [];
      groups[ip].push(event);
      return groups;
    }, {} as Record<string, SecurityEvent[]>);
  }

  /**
   * Group events by user ID
   */
  private groupByUser(events: SecurityEvent[]): Record<string, SecurityEvent[]> {
    return events.reduce((groups, event) => {
      const userId = event.userId || 'anonymous';
      groups[userId] = groups[userId] || [];
      groups[userId].push(event);
      return groups;
    }, {} as Record<string, SecurityEvent[]>);
  }

  /**
   * Get security dashboard data
   */
  async getSecurityDashboard(timeRange = 86400): Promise<{
    totalEvents: number;
    criticalEvents: number;
    topThreats: Array<{ type: SecurityEventType; count: number }>;
    recentEvents: SecurityEvent[];
  }> {
    const cutoff = new Date(Date.now() - (timeRange * 1000));
    const recentEvents = this.eventBuffer.filter(event => event.timestamp >= cutoff);

    const criticalEvents = recentEvents.filter(event => 
      event.severity === SecuritySeverity.CRITICAL || 
      event.severity === SecuritySeverity.HIGH
    ).length;

    const threatCounts = recentEvents.reduce((counts, event) => {
      counts[event.type] = (counts[event.type] || 0) + 1;
      return counts;
    }, {} as Record<SecurityEventType, number>);

    const topThreats = Object.entries(threatCounts)
      .map(([type, count]) => ({ type: type as SecurityEventType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalEvents: recentEvents.length,
      criticalEvents,
      topThreats,
      recentEvents: recentEvents.slice(-10) // Last 10 events
    };
  }
}

// Export singleton instance
export const securityMonitor = SecurityMonitor.getInstance();

// Helper functions for easy use in API routes
export const logAuthSuccess = (request: { email: string; ipAddress: string; userAgent?: string; userId?: string; organizationId?: string }) =>
  securityMonitor.logAuthEvent(SecurityEventType.LOGIN_SUCCESS, request);

export const logAuthFailure = (request: { email: string; ipAddress: string; userAgent?: string }) =>
  securityMonitor.logAuthEvent(SecurityEventType.LOGIN_FAILURE, request);

export const logAuthBlocked = (request: { email: string; ipAddress: string; userAgent?: string }) =>
  securityMonitor.logAuthEvent(SecurityEventType.LOGIN_BLOCKED, request);

export const logDataAccess = (userId: string, email: string, ipAddress: string, resource: string, action: string, recordCount?: number, organizationId?: string) =>
  securityMonitor.logDataAccess(userId, email, ipAddress, resource, action, recordCount, organizationId);

export const logSuspiciousActivity = (ipAddress: string, reason: string, metadata?: Record<string, any>, userId?: string, email?: string) =>
  securityMonitor.logSuspiciousActivity(ipAddress, reason, metadata, userId, email);

export const logAdminAction = (userId: string, email: string, ipAddress: string, action: string, resource: string, organizationId?: string) =>
  securityMonitor.logAdminAction(userId, email, ipAddress, action, resource, organizationId);