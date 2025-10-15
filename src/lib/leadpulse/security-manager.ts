/**
 * LeadPulse Security Manager
 * 
 * Comprehensive security layer for LeadPulse operations
 */

import { logger } from '@/lib/logger';
import { leadPulseCache } from '@/lib/cache/leadpulse-cache';
// NOTE: Prisma removed - using backend API (LeadPulseDataProcessingLog, LeadPulseSecurityEvent exist in backend)
import crypto from 'crypto';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';

interface SecurityEvent {
  type: 'SUSPICIOUS_ACTIVITY' | 'RATE_LIMIT_EXCEEDED' | 'INVALID_INPUT' | 'UNAUTHORIZED_ACCESS' | 'DATA_BREACH_ATTEMPT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: string;
  details: any;
  timestamp: Date;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  blockDurationMs: number;
}

interface SecurityConfig {
  rateLimits: {
    formSubmission: RateLimitConfig;
    apiCalls: RateLimitConfig;
    authentication: RateLimitConfig;
  };
  inputValidation: {
    maxFieldLength: number;
    allowedFileTypes: string[];
    maxFileSize: number;
    sanitizeHtml: boolean;
  };
  encryption: {
    algorithm: string;
    keyLength: number;
  };
}

export class LeadPulseSecurityManager {
  private config: SecurityConfig = {
    rateLimits: {
      formSubmission: { windowMs: 60000, maxRequests: 10, blockDurationMs: 300000 }, // 10 per minute, block 5 min
      apiCalls: { windowMs: 60000, maxRequests: 100, blockDurationMs: 60000 }, // 100 per minute, block 1 min
      authentication: { windowMs: 300000, maxRequests: 5, blockDurationMs: 900000 } // 5 per 5min, block 15 min
    },
    inputValidation: {
      maxFieldLength: 5000,
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt'],
      maxFileSize: 10 * 1024 * 1024, // 10MB
      sanitizeHtml: true
    },
    encryption: {
      algorithm: 'aes-256-gcm',
      keyLength: 32
    }
  };

  /**
   * Rate limiting implementation
   */
  async checkRateLimit(
    identifier: string, 
    type: keyof SecurityConfig['rateLimits'],
    request?: { ip?: string; userAgent?: string }
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const config = this.config.rateLimits[type];
    const key = `rate_limit:${type}:${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    try {
      // Get current request count
      const requestsData = await leadPulseCache.get(key) || { requests: [], blocked: false, blockedUntil: 0 };

      // Check if currently blocked
      if (requestsData.blocked && now < requestsData.blockedUntil) {
        await this.logSecurityEvent({
          type: 'RATE_LIMIT_EXCEEDED',
          severity: 'MEDIUM',
          source: `rate_limit_${type}`,
          details: { identifier, config, requestsData },
          timestamp: new Date(),
          ipAddress: request?.ip,
          userAgent: request?.userAgent
        });

        return {
          allowed: false,
          remaining: 0,
          resetTime: requestsData.blockedUntil
        };
      }

      // Clean old requests
      const recentRequests = requestsData.requests.filter((timestamp: number) => timestamp > windowStart);
      
      // Check if under limit
      if (recentRequests.length < config.maxRequests) {
        recentRequests.push(now);
        await leadPulseCache.set(key, { 
          requests: recentRequests, 
          blocked: false, 
          blockedUntil: 0 
        }, Math.ceil(config.windowMs / 1000));

        return {
          allowed: true,
          remaining: config.maxRequests - recentRequests.length,
          resetTime: now + config.windowMs
        };
      }

      // Rate limit exceeded - block the identifier
      const blockedUntil = now + config.blockDurationMs;
      await leadPulseCache.set(key, { 
        requests: recentRequests, 
        blocked: true, 
        blockedUntil 
      }, Math.ceil(config.blockDurationMs / 1000));

      await this.logSecurityEvent({
        type: 'RATE_LIMIT_EXCEEDED',
        severity: 'HIGH',
        source: `rate_limit_${type}`,
        details: { identifier, config, exceeded: true },
        timestamp: new Date(),
        ipAddress: request?.ip,
        userAgent: request?.userAgent
      });

      return {
        allowed: false,
        remaining: 0,
        resetTime: blockedUntil
      };

    } catch (error) {
      logger.error('Error in rate limiting:', error);
      // Fail open for availability, but log the issue
      return { allowed: true, remaining: 0, resetTime: now + config.windowMs };
    }
  }

  /**
   * Input validation and sanitization
   */
  async validateAndSanitizeInput(data: any, context: string): Promise<{ valid: boolean; sanitized: any; errors: string[] }> {
    const errors: string[] = [];
    const sanitized: any = {};

    try {
      for (const [key, value] of Object.entries(data)) {
        // Type validation
        if (typeof value === 'string') {
          // Length validation
          if (value.length > this.config.inputValidation.maxFieldLength) {
            errors.push(`Field '${key}' exceeds maximum length of ${this.config.inputValidation.maxFieldLength}`);
            continue;
          }

          // HTML sanitization
          let sanitizedValue = value;
          if (this.config.inputValidation.sanitizeHtml) {
            sanitizedValue = this.sanitizeHtml(value);
          }

          // SQL injection prevention
          if (this.detectSqlInjection(sanitizedValue)) {
            errors.push(`Field '${key}' contains potentially malicious content`);
            await this.logSecurityEvent({
              type: 'INVALID_INPUT',
              severity: 'HIGH',
              source: 'input_validation',
              details: { field: key, value: value.substring(0, 100), context },
              timestamp: new Date()
            });
            continue;
          }

          // XSS prevention
          if (this.detectXSS(sanitizedValue)) {
            errors.push(`Field '${key}' contains potentially malicious scripts`);
            await this.logSecurityEvent({
              type: 'INVALID_INPUT',
              severity: 'HIGH',
              source: 'xss_detection',
              details: { field: key, value: value.substring(0, 100), context },
              timestamp: new Date()
            });
            continue;
          }

          sanitized[key] = sanitizedValue;

        } else if (typeof value === 'number') {
          // Number validation
          if (!Number.isFinite(value)) {
            errors.push(`Field '${key}' is not a valid number`);
            continue;
          }
          sanitized[key] = value;

        } else if (typeof value === 'boolean') {
          sanitized[key] = Boolean(value);

        } else if (Array.isArray(value)) {
          // Array validation
          if (value.length > 100) {
            errors.push(`Array field '${key}' exceeds maximum length of 100 items`);
            continue;
          }
          
          const sanitizedArray = value.map(item => {
            if (typeof item === 'string') {
              return this.config.inputValidation.sanitizeHtml ? this.sanitizeHtml(item) : item;
            }
            return item;
          });
          
          sanitized[key] = sanitizedArray;

        } else if (value === null || value === undefined) {
          sanitized[key] = value;

        } else {
          errors.push(`Field '${key}' has unsupported data type`);
        }
      }

      return {
        valid: errors.length === 0,
        sanitized,
        errors
      };

    } catch (error) {
      logger.error('Error in input validation:', error);
      return {
        valid: false,
        sanitized: {},
        errors: ['Input validation failed due to internal error']
      };
    }
  }

  /**
   * File upload security validation
   */
  async validateFileUpload(
    file: { name: string; size: number; type: string; buffer?: Buffer },
    context: string
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // File size validation
      if (file.size > this.config.inputValidation.maxFileSize) {
        errors.push(`File size (${file.size} bytes) exceeds maximum allowed size (${this.config.inputValidation.maxFileSize} bytes)`);
      }

      // File type validation
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!fileExtension || !this.config.inputValidation.allowedFileTypes.includes(fileExtension)) {
        errors.push(`File type '${fileExtension}' is not allowed`);
        await this.logSecurityEvent({
          type: 'INVALID_INPUT',
          severity: 'MEDIUM',
          source: 'file_upload',
          details: { fileName: file.name, fileType: fileExtension, context },
          timestamp: new Date()
        });
      }

      // MIME type validation
      const allowedMimeTypes = [
        'image/jpeg', 'image/png', 'image/gif',
        'application/pdf', 'text/plain',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedMimeTypes.includes(file.type)) {
        errors.push(`MIME type '${file.type}' is not allowed`);
      }

      // File content validation (if buffer is provided)
      if (file.buffer) {
        if (this.detectMaliciousFileContent(file.buffer, fileExtension || '')) {
          errors.push('File contains potentially malicious content');
          await this.logSecurityEvent({
            type: 'INVALID_INPUT',
            severity: 'CRITICAL',
            source: 'malicious_file_detection',
            details: { fileName: file.name, fileType: fileExtension, context },
            timestamp: new Date()
          });
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };

    } catch (error) {
      logger.error('Error in file upload validation:', error);
      return {
        valid: false,
        errors: ['File validation failed due to internal error']
      };
    }
  }

  /**
   * Data encryption for sensitive information
   */
  encryptSensitiveData(data: string, purpose = 'general'): { encrypted: string; iv: string; tag: string } {
    try {
      const algorithm = this.config.encryption.algorithm;
      const key = this.getEncryptionKey(purpose);
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipher(algorithm, key);
      cipher.setAAD(Buffer.from(purpose, 'utf8'));
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
      };

    } catch (error) {
      logger.error('Error encrypting data:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Data decryption
   */
  decryptSensitiveData(
    encryptedData: { encrypted: string; iv: string; tag: string }, 
    purpose = 'general'
  ): string {
    try {
      const algorithm = this.config.encryption.algorithm;
      const key = this.getEncryptionKey(purpose);
      
      const decipher = crypto.createDecipher(algorithm, key);
      decipher.setAAD(Buffer.from(purpose, 'utf8'));
      decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;

    } catch (error) {
      logger.error('Error decrypting data:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * PII (Personally Identifiable Information) detection and handling
   */
  detectAndMaskPII(data: any): { masked: any; piiDetected: string[] } {
    const piiFields: string[] = [];
    const masked = { ...data };

    const piiPatterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
      ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
      creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
      ipAddress: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g
    };

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        let maskedValue = value;
        let foundPII = false;

        for (const [piiType, pattern] of Object.entries(piiPatterns)) {
          if (pattern.test(value)) {
            piiFields.push(`${key}:${piiType}`);
            
            // Mask the PII
            if (piiType === 'email') {
              maskedValue = value.replace(pattern, (match) => {
                const [user, domain] = match.split('@');
                return `${user.charAt(0)}***@${domain}`;
              });
            } else if (piiType === 'phone') {
              maskedValue = value.replace(pattern, '***-***-****');
            } else if (piiType === 'ssn') {
              maskedValue = value.replace(pattern, '***-**-****');
            } else if (piiType === 'creditCard') {
              maskedValue = value.replace(pattern, '**** **** **** ****');
            } else if (piiType === 'ipAddress') {
              maskedValue = value.replace(pattern, '***.***.***.**');
            }
            
            foundPII = true;
          }
        }

        if (foundPII) {
          masked[key] = maskedValue;
        }
      }
    }

    return { masked, piiDetected: piiFields };
  }

  /**
   * GDPR compliance helpers
   */
  async logDataProcessingActivity(
    activity: {
      type: 'COLLECTION' | 'PROCESSING' | 'SHARING' | 'DELETION';
      dataSubject: string;
      dataTypes: string[];
      purpose: string;
      legalBasis: string;
      processor?: string;
    }
  ) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/v2/leadpulse-data-processing-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activity.type,
          dataSubject: activity.dataSubject,
          dataTypes: activity.dataTypes,
          purpose: activity.purpose,
          legalBasis: activity.legalBasis,
          processor: activity.processor,
          timestamp: new Date()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to log data processing activity: ${response.status}`);
      }

      logger.info('Data processing activity logged', activity);

    } catch (error) {
      logger.error('Error logging data processing activity:', error);
    }
  }

  /**
   * Security event logging
   */
  private async logSecurityEvent(event: SecurityEvent) {
    try {
      // Store in cache for immediate access
      const eventKey = `security_event:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
      await leadPulseCache.set(eventKey, event, 86400); // Keep for 24 hours

      // Store in database for permanent record via backend API
      const response = await fetch(`${BACKEND_URL}/api/v2/leadpulse-security-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: event.type,
          severity: event.severity,
          source: event.source,
          details: event.details,
          timestamp: event.timestamp,
          userId: event.userId,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to log security event: ${response.status}`);
      }

      logger.warn('Security event logged', event);

      // Trigger alerts for high/critical severity events
      if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
        await this.triggerSecurityAlert(event);
      }

    } catch (error) {
      logger.error('Error logging security event:', error);
    }
  }

  /**
   * Security alert system
   */
  private async triggerSecurityAlert(event: SecurityEvent) {
    try {
      // In production, this would integrate with alerting systems
      // For now, we'll use enhanced logging and cache storage
      
      const alertKey = `security_alert:${event.type}:${Date.now()}`;
      await leadPulseCache.set(alertKey, {
        ...event,
        alertTriggered: true,
        alertTime: new Date()
      }, 3600); // Keep alerts for 1 hour

      logger.error('SECURITY ALERT TRIGGERED', {
        type: event.type,
        severity: event.severity,
        source: event.source,
        timestamp: event.timestamp,
        details: event.details
      });

      // TODO: Integrate with external alerting services
      // - Email notifications
      // - Slack/Teams notifications  
      // - PagerDuty integration
      // - SMS alerts for critical events

    } catch (error) {
      logger.error('Error triggering security alert:', error);
    }
  }

  // Helper methods
  private sanitizeHtml(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  private detectSqlInjection(input: string): boolean {
    const sqlPatterns = [
      /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bDELETE\b|\bUPDATE\b|\bDROP\b)/i,
      /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i,
      /[\'\"];\s*(\bDROP\b|\bDELETE\b|\bTRUNCATE\b)/i,
      /\bxp_cmdshell\b/i
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
  }

  private detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on(load|click|error|mouseover)\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /data:text\/html/gi
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  }

  private detectMaliciousFileContent(buffer: Buffer, extension: string): boolean {
    // Basic malicious content detection
    const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1024));
    
    const maliciousPatterns = [
      /<script/gi,
      /javascript:/gi,
      /\.exe\b/gi,
      /\.bat\b/gi,
      /\.cmd\b/gi,
      /payload/gi
    ];
    
    return maliciousPatterns.some(pattern => pattern.test(content));
  }

  private getEncryptionKey(purpose: string): string {
    // In production, use proper key management (Azure Key Vault, AWS KMS, etc.)
    const baseKey = process.env.LEADPULSE_ENCRYPTION_KEY || 'default-key-change-in-production';
    return crypto.createHash('sha256').update(baseKey + purpose).digest('hex').substring(0, 32);
  }
}

// Export singleton instance
export const leadPulseSecurityManager = new LeadPulseSecurityManager();