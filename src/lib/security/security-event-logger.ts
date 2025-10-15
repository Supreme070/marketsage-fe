/**
 * Security Event Logger for MarketSage
 * Creates and manages security events in the database
 */

// NOTE: Prisma removed - using backend API
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ||
                    process.env.NESTJS_BACKEND_URL ||
                    'http://localhost:3006';

import { getIPLocation } from './security-utils';

export interface SecurityEventData {
  eventType: 'LOGIN_ATTEMPT' | 'FAILED_LOGIN' | 'SUSPICIOUS_ACTIVITY' | 'RATE_LIMIT_EXCEEDED' | 
            'INVALID_INPUT' | 'UNAUTHORIZED_ACCESS' | 'DATA_BREACH_ATTEMPT' | 'LOGIN_FAILURE' |
            'PERMISSION_DENIED' | 'MALICIOUS_FILE_UPLOAD' | 'XSS_ATTEMPT' | 'SQL_INJECTION_ATTEMPT' |
            'PRIVILEGE_ESCALATION' | 'MALICIOUS_REQUEST' | 'PASSWORD_RESET' | 'ACCOUNT_LOCKED' | 'API_ABUSE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  metadata?: Record<string, any>;
  autoResolve?: boolean; // For low-severity events that don't need manual resolution
}

export interface SecurityEventLoggerOptions {
  maxEventsPerIP?: number; // Maximum events to log per IP per hour
  autoGeolocate?: boolean; // Automatically get geolocation for IP addresses
  rateLimitWindow?: number; // Time window for rate limiting in milliseconds
}

export class SecurityEventLogger {
  private static instance: SecurityEventLogger;
  private eventCache = new Map<string, { count: number; lastSeen: number }>();
  private options: SecurityEventLoggerOptions;

  constructor(options: SecurityEventLoggerOptions = {}) {
    this.options = {
      maxEventsPerIP: 100,
      autoGeolocate: true,
      rateLimitWindow: 60 * 60 * 1000, // 1 hour
      ...options
    };
  }

  static getInstance(options?: SecurityEventLoggerOptions): SecurityEventLogger {
    if (!SecurityEventLogger.instance) {
      SecurityEventLogger.instance = new SecurityEventLogger(options);
    }
    return SecurityEventLogger.instance;
  }

  /**
   * Log a security event
   */
  async logEvent(eventData: SecurityEventData): Promise<string | null> {
    try {
      // Rate limiting check
      if (eventData.ipAddress && !this.shouldLogEvent(eventData.ipAddress)) {
        console.warn(`Rate limiting security events for IP: ${eventData.ipAddress}`);
        return null;
      }

      // Get geolocation if enabled and not provided
      let location = eventData.location;
      if (!location && eventData.ipAddress && this.options.autoGeolocate) {
        location = await getIPLocation(eventData.ipAddress);
      }

      // Create the security event via backend API
      const response = await fetch(`${BACKEND_URL}/api/v2/security-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: eventData.eventType,
          severity: eventData.severity,
          title: eventData.title,
          description: eventData.description,
          userId: eventData.userId,
          ipAddress: eventData.ipAddress,
          userAgent: eventData.userAgent,
          location,
          resolved: eventData.autoResolve === true,
          resolvedAt: eventData.autoResolve === true ? new Date() : null,
          metadata: eventData.metadata || {}
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create security event: ${response.status}`);
      }

      const securityEvent = await response.json();

      // Update rate limiting cache
      if (eventData.ipAddress) {
        this.updateEventCache(eventData.ipAddress);
      }

      // Trigger automated responses for critical events
      if (eventData.severity === 'CRITICAL') {
        await this.handleCriticalEvent(securityEvent);
      }

      return securityEvent.id;

    } catch (error) {
      console.error('Failed to log security event:', error);
      return null;
    }
  }

  /**
   * Log failed login attempt
   */
  async logFailedLogin(userId?: string, ipAddress?: string, userAgent?: string, metadata?: Record<string, any>): Promise<string | null> {
    return this.logEvent({
      eventType: 'FAILED_LOGIN',
      severity: 'MEDIUM',
      title: 'Failed Login Attempt',
      description: `Failed login attempt ${userId ? `for user ${userId}` : 'with invalid credentials'}`,
      userId,
      ipAddress,
      userAgent,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        attemptType: 'login_failure'
      }
    });
  }

  /**
   * Log successful login
   */
  async logSuccessfulLogin(userId: string, ipAddress?: string, userAgent?: string, metadata?: Record<string, any>): Promise<string | null> {
    return this.logEvent({
      eventType: 'LOGIN_ATTEMPT',
      severity: 'LOW',
      title: 'Successful Login',
      description: `User ${userId} logged in successfully`,
      userId,
      ipAddress,
      userAgent,
      autoResolve: true,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        attemptType: 'successful_login'
      }
    });
  }

  /**
   * Log rate limit exceeded
   */
  async logRateLimitExceeded(ipAddress: string, endpoint?: string, userAgent?: string, metadata?: Record<string, any>): Promise<string | null> {
    return this.logEvent({
      eventType: 'RATE_LIMIT_EXCEEDED',
      severity: 'MEDIUM',
      title: 'Rate Limit Exceeded',
      description: `Rate limit exceeded from IP ${ipAddress}${endpoint ? ` on endpoint ${endpoint}` : ''}`,
      ipAddress,
      userAgent,
      metadata: {
        ...metadata,
        endpoint,
        timestamp: new Date().toISOString(),
        rateLimitType: 'api_rate_limit'
      }
    });
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(title: string, description: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', 
                             ipAddress?: string, userId?: string, metadata?: Record<string, any>): Promise<string | null> {
    return this.logEvent({
      eventType: 'SUSPICIOUS_ACTIVITY',
      severity,
      title,
      description,
      userId,
      ipAddress,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        detectionType: 'behavioral_analysis'
      }
    });
  }

  /**
   * Log SQL injection attempt
   */
  async logSQLInjectionAttempt(ipAddress: string, query: string, userAgent?: string, metadata?: Record<string, any>): Promise<string | null> {
    return this.logEvent({
      eventType: 'SQL_INJECTION_ATTEMPT',
      severity: 'HIGH',
      title: 'SQL Injection Attempt Detected',
      description: `SQL injection attempt detected from IP ${ipAddress}`,
      ipAddress,
      userAgent,
      metadata: {
        ...metadata,
        query: query.substring(0, 200), // Limit query length for storage
        timestamp: new Date().toISOString(),
        attackType: 'sql_injection'
      }
    });
  }

  /**
   * Log XSS attempt
   */
  async logXSSAttempt(ipAddress: string, payload: string, userAgent?: string, metadata?: Record<string, any>): Promise<string | null> {
    return this.logEvent({
      eventType: 'XSS_ATTEMPT',
      severity: 'HIGH',
      title: 'XSS Attack Attempt Detected',
      description: `Cross-site scripting attempt detected from IP ${ipAddress}`,
      ipAddress,
      userAgent,
      metadata: {
        ...metadata,
        payload: payload.substring(0, 200), // Limit payload length
        timestamp: new Date().toISOString(),
        attackType: 'xss'
      }
    });
  }

  /**
   * Log unauthorized access attempt
   */
  async logUnauthorizedAccess(resource: string, userId?: string, ipAddress?: string, userAgent?: string, metadata?: Record<string, any>): Promise<string | null> {
    return this.logEvent({
      eventType: 'UNAUTHORIZED_ACCESS',
      severity: 'HIGH',
      title: 'Unauthorized Access Attempt',
      description: `Unauthorized access attempt to ${resource}${userId ? ` by user ${userId}` : ''}`,
      userId,
      ipAddress,
      userAgent,
      metadata: {
        ...metadata,
        resource,
        timestamp: new Date().toISOString(),
        accessType: 'unauthorized'
      }
    });
  }

  /**
   * Log data breach attempt
   */
  async logDataBreachAttempt(description: string, ipAddress?: string, userId?: string, metadata?: Record<string, any>): Promise<string | null> {
    return this.logEvent({
      eventType: 'DATA_BREACH_ATTEMPT',
      severity: 'CRITICAL',
      title: 'Data Breach Attempt Detected',
      description,
      userId,
      ipAddress,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        incidentType: 'data_breach_attempt',
        requiresImmediateAction: true
      }
    });
  }

  /**
   * Log API abuse
   */
  async logAPIAbuse(ipAddress: string, endpoint: string, abusetype: string, userAgent?: string, metadata?: Record<string, any>): Promise<string | null> {
    return this.logEvent({
      eventType: 'API_ABUSE',
      severity: 'MEDIUM',
      title: 'API Abuse Detected',
      description: `API abuse detected from IP ${ipAddress} on endpoint ${endpoint}`,
      ipAddress,
      userAgent,
      metadata: {
        ...metadata,
        endpoint,
        abuseType: abusetype,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Check if we should log an event (rate limiting)
   */
  private shouldLogEvent(ipAddress: string): boolean {
    const now = Date.now();
    const cacheKey = `${ipAddress}`;
    const cached = this.eventCache.get(cacheKey);

    if (!cached) {
      return true;
    }

    // Reset count if outside time window
    if (now - cached.lastSeen > (this.options.rateLimitWindow || 60 * 60 * 1000)) {
      this.eventCache.delete(cacheKey);
      return true;
    }

    // Check if we've exceeded the limit
    return cached.count < (this.options.maxEventsPerIP || 100);
  }

  /**
   * Update event cache for rate limiting
   */
  private updateEventCache(ipAddress: string): void {
    const now = Date.now();
    const cacheKey = `${ipAddress}`;
    const cached = this.eventCache.get(cacheKey);

    if (cached) {
      cached.count += 1;
      cached.lastSeen = now;
    } else {
      this.eventCache.set(cacheKey, { count: 1, lastSeen: now });
    }
  }

  /**
   * Handle critical security events
   */
  private async handleCriticalEvent(securityEvent: any): Promise<void> {
    try {
      // For demonstration - in production you might:
      // 1. Send immediate alerts to security team
      // 2. Trigger automated incident response
      // 3. Update threat intelligence feeds
      // 4. Block IP addresses automatically
      
      console.warn(`CRITICAL SECURITY EVENT: ${securityEvent.title}`, {
        id: securityEvent.id,
        ipAddress: securityEvent.ipAddress,
        eventType: securityEvent.eventType
      });

      // You could integrate with external services here:
      // - Send to SIEM
      // - Alert security team via Slack/email
      // - Trigger automated response workflows
      
    } catch (error) {
      console.error('Failed to handle critical security event:', error);
    }
  }

  /**
   * Clean up old cache entries
   */
  cleanupCache(): void {
    const now = Date.now();
    const windowMs = this.options.rateLimitWindow || 60 * 60 * 1000;

    for (const [key, value] of this.eventCache.entries()) {
      if (now - value.lastSeen > windowMs) {
        this.eventCache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const securityEventLogger = SecurityEventLogger.getInstance();

// Utility functions for common security events
export const logFailedLogin = (userId?: string, ipAddress?: string, userAgent?: string, metadata?: Record<string, any>) =>
  securityEventLogger.logFailedLogin(userId, ipAddress, userAgent, metadata);

export const logSuccessfulLogin = (userId: string, ipAddress?: string, userAgent?: string, metadata?: Record<string, any>) =>
  securityEventLogger.logSuccessfulLogin(userId, ipAddress, userAgent, metadata);

export const logRateLimitExceeded = (ipAddress: string, endpoint?: string, userAgent?: string, metadata?: Record<string, any>) =>
  securityEventLogger.logRateLimitExceeded(ipAddress, endpoint, userAgent, metadata);

export const logSuspiciousActivity = (title: string, description: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', 
                                     ipAddress?: string, userId?: string, metadata?: Record<string, any>) =>
  securityEventLogger.logSuspiciousActivity(title, description, severity, ipAddress, userId, metadata);

export const logSQLInjectionAttempt = (ipAddress: string, query: string, userAgent?: string, metadata?: Record<string, any>) =>
  securityEventLogger.logSQLInjectionAttempt(ipAddress, query, userAgent, metadata);

export const logXSSAttempt = (ipAddress: string, payload: string, userAgent?: string, metadata?: Record<string, any>) =>
  securityEventLogger.logXSSAttempt(ipAddress, payload, userAgent, metadata);

export const logUnauthorizedAccess = (resource: string, userId?: string, ipAddress?: string, userAgent?: string, metadata?: Record<string, any>) =>
  securityEventLogger.logUnauthorizedAccess(resource, userId, ipAddress, userAgent, metadata);

export const logDataBreachAttempt = (description: string, ipAddress?: string, userId?: string, metadata?: Record<string, any>) =>
  securityEventLogger.logDataBreachAttempt(description, ipAddress, userId, metadata);

export const logAPIAbuse = (ipAddress: string, endpoint: string, abuseType: string, userAgent?: string, metadata?: Record<string, any>) =>
  securityEventLogger.logAPIAbuse(ipAddress, endpoint, abuseType, userAgent, metadata);