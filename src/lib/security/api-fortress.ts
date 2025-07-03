/**
 * API Security Fortress
 * ====================
 * Advanced API protection with DDoS mitigation, input validation, and threat detection
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { logger } from '@/lib/logger';
import { redisCache } from '@/lib/cache/redis-client';

interface SecurityConfig {
  rateLimit: {
    global: { requests: number; window: number };
    perEndpoint: { requests: number; window: number };
    perUser: { requests: number; window: number };
  };
  inputValidation: {
    maxBodySize: number;
    maxQueryParams: number;
    allowedMethods: string[];
    requiredHeaders: string[];
  };
  threatDetection: {
    suspiciousPatterns: RegExp[];
    blockedUserAgents: RegExp[];
    geoBlocking: { enabled: boolean; blockedCountries: string[] };
  };
}

interface SecurityViolation {
  type: 'RATE_LIMIT' | 'INVALID_INPUT' | 'SUSPICIOUS_PATTERN' | 'BLOCKED_AGENT' | 'GEO_BLOCKED' | 'MALFORMED_REQUEST';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  metadata: Record<string, any>;
}

interface RequestFingerprint {
  ip: string;
  userAgent: string;
  headers: Record<string, string>;
  path: string;
  method: string;
  timestamp: number;
  hash: string;
}

export class APIFortress {
  private config: SecurityConfig;
  private suspiciousIPs: Set<string> = new Set();
  private blockedIPs: Set<string> = new Set();

  constructor() {
    this.config = {
      rateLimit: {
        global: { requests: 1000, window: 60000 }, // 1000 requests per minute globally
        perEndpoint: { requests: 100, window: 60000 }, // 100 requests per minute per endpoint
        perUser: { requests: 50, window: 60000 } // 50 requests per minute per user
      },
      inputValidation: {
        maxBodySize: 10 * 1024 * 1024, // 10MB
        maxQueryParams: 50,
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        requiredHeaders: ['user-agent', 'accept']
      },
      threatDetection: {
        suspiciousPatterns: [
          /(\<|\>|script|javascript|vbscript|onload|onerror)/i, // XSS patterns
          /(union|select|insert|delete|drop|update|exec)/i, // SQL injection patterns
          /(\.\.\/|\.\.\\|\/etc\/|\/proc\/)/i, // Path traversal patterns
          /(base64_decode|eval|exec|system|shell_exec)/i, // Code injection patterns
        ],
        blockedUserAgents: [
          /bot|crawler|spider|scraper/i,
          /curl|wget|python-requests|go-http-client/i,
          /nikto|sqlmap|nmap|masscan/i
        ],
        geoBlocking: {
          enabled: false, // Enable if needed
          blockedCountries: [] // Add country codes if needed
        }
      }
    };

    this.initializeThreatIntelligence();
  }

  /**
   * Main security middleware
   */
  async protectAPI(request: NextRequest): Promise<NextResponse | null> {
    const fingerprint = this.generateRequestFingerprint(request);
    
    try {
      // 1. IP Blocking Check
      if (this.isBlockedIP(fingerprint.ip)) {
        return this.createSecurityResponse('IP_BLOCKED', 403, 'IP address is blocked');
      }

      // 2. Rate Limiting
      const rateLimitViolation = await this.checkRateLimits(request, fingerprint);
      if (rateLimitViolation) {
        await this.recordViolation(fingerprint, rateLimitViolation);
        return this.createSecurityResponse('RATE_LIMITED', 429, 'Rate limit exceeded');
      }

      // 3. Input Validation
      const inputViolation = await this.validateInput(request);
      if (inputViolation) {
        await this.recordViolation(fingerprint, inputViolation);
        return this.createSecurityResponse('INVALID_INPUT', 400, inputViolation.description);
      }

      // 4. Threat Detection
      const threatViolation = await this.detectThreats(request, fingerprint);
      if (threatViolation) {
        await this.recordViolation(fingerprint, threatViolation);
        
        if (threatViolation.severity === 'CRITICAL') {
          await this.addSuspiciousIP(fingerprint.ip);
          return this.createSecurityResponse('THREAT_DETECTED', 403, 'Request blocked by security system');
        }
      }

      // 5. Advanced Anomaly Detection
      const anomalyScore = await this.calculateAnomalyScore(fingerprint);
      if (anomalyScore > 0.8) {
        await this.recordViolation(fingerprint, {
          type: 'SUSPICIOUS_PATTERN',
          severity: 'HIGH',
          description: 'High anomaly score detected',
          metadata: { score: anomalyScore }
        });
        
        await this.addSuspiciousIP(fingerprint.ip);
      }

      // Request passed all security checks
      await this.recordCleanRequest(fingerprint);
      return null; // Allow request to proceed

    } catch (error) {
      logger.error('API security check failed', {
        error: error instanceof Error ? error.message : String(error),
        fingerprint
      });
      
      return this.createSecurityResponse('SECURITY_ERROR', 500, 'Security system error');
    }
  }

  /**
   * Advanced input validation with schema checking
   */
  private async validateInput(request: NextRequest): Promise<SecurityViolation | null> {
    const url = new URL(request.url);
    
    // Check method
    if (!this.config.inputValidation.allowedMethods.includes(request.method)) {
      return {
        type: 'INVALID_INPUT',
        severity: 'MEDIUM',
        description: `Method ${request.method} not allowed`,
        metadata: { method: request.method }
      };
    }

    // Check query parameters count
    const queryParams = Array.from(url.searchParams.entries());
    if (queryParams.length > this.config.inputValidation.maxQueryParams) {
      return {
        type: 'INVALID_INPUT',
        severity: 'MEDIUM',
        description: 'Too many query parameters',
        metadata: { count: queryParams.length, max: this.config.inputValidation.maxQueryParams }
      };
    }

    // Check required headers
    for (const header of this.config.inputValidation.requiredHeaders) {
      if (!request.headers.get(header)) {
        return {
          type: 'INVALID_INPUT',
          severity: 'LOW',
          description: `Missing required header: ${header}`,
          metadata: { missingHeader: header }
        };
      }
    }

    // Validate body size for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentLength = request.headers.get('content-length');
      if (contentLength && Number.parseInt(contentLength) > this.config.inputValidation.maxBodySize) {
        return {
          type: 'INVALID_INPUT',
          severity: 'MEDIUM',
          description: 'Request body too large',
          metadata: { size: contentLength, max: this.config.inputValidation.maxBodySize }
        };
      }

      // Validate JSON body if present
      try {
        const contentType = request.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const body = await request.clone().json();
          const validation = this.validateJSONStructure(body, url.pathname);
          if (!validation.valid) {
            return {
              type: 'INVALID_INPUT',
              severity: 'MEDIUM',
              description: validation.error || 'Invalid JSON structure',
              metadata: { path: url.pathname }
            };
          }
        }
      } catch (error) {
        return {
          type: 'MALFORMED_REQUEST',
          severity: 'MEDIUM',
          description: 'Malformed JSON body',
          metadata: { error: error instanceof Error ? error.message : String(error) }
        };
      }
    }

    return null;
  }

  /**
   * Validate JSON structure against endpoint schemas
   */
  private validateJSONStructure(body: any, path: string): { valid: boolean; error?: string } {
    try {
      // Define schemas for different endpoints
      const schemas: Record<string, z.ZodSchema> = {
        '/api/contacts': z.object({
          firstName: z.string().max(100).optional(),
          lastName: z.string().max(100).optional(),
          email: z.string().email().max(254),
          phone: z.string().max(20).optional(),
          company: z.string().max(200).optional(),
          notes: z.string().max(1000).optional()
        }),
        '/api/campaigns': z.object({
          name: z.string().min(1).max(200),
          type: z.enum(['email', 'sms', 'whatsapp']),
          content: z.string().max(10000),
          audience: z.string().optional()
        }),
        '/api/ai/supreme-v3': z.object({
          task: z.object({
            type: z.enum(['question', 'task', 'analyze', 'predict']),
            userId: z.string().uuid(),
            question: z.string().max(5000)
          }),
          enableTaskExecution: z.boolean().optional()
        })
      };

      const schema = schemas[path];
      if (schema) {
        schema.parse(body);
      }

      // Additional security checks for all JSON bodies
      this.checkForMaliciousPatterns(JSON.stringify(body));

      return { valid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { 
          valid: false, 
          error: `Validation error: ${error.errors.map(e => e.message).join(', ')}` 
        };
      }
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Unknown validation error' 
      };
    }
  }

  /**
   * Advanced threat detection
   */
  private async detectThreats(request: NextRequest, fingerprint: RequestFingerprint): Promise<SecurityViolation | null> {
    const url = new URL(request.url);
    const fullUrl = request.url;
    const userAgent = request.headers.get('user-agent') || '';

    // Check for blocked user agents
    for (const pattern of this.config.threatDetection.blockedUserAgents) {
      if (pattern.test(userAgent)) {
        return {
          type: 'BLOCKED_AGENT',
          severity: 'HIGH',
          description: 'Blocked user agent detected',
          metadata: { userAgent }
        };
      }
    }

    // Check for suspicious patterns in URL and parameters
    for (const pattern of this.config.threatDetection.suspiciousPatterns) {
      if (pattern.test(fullUrl)) {
        return {
          type: 'SUSPICIOUS_PATTERN',
          severity: 'CRITICAL',
          description: 'Suspicious pattern detected in URL',
          metadata: { url: fullUrl, pattern: pattern.source }
        };
      }

      // Check query parameters
      for (const [key, value] of url.searchParams.entries()) {
        if (pattern.test(key) || pattern.test(value)) {
          return {
            type: 'SUSPICIOUS_PATTERN',
            severity: 'CRITICAL',
            description: 'Suspicious pattern detected in query parameters',
            metadata: { key, value, pattern: pattern.source }
          };
        }
      }
    }

    // Check headers for suspicious content
    for (const [name, value] of request.headers.entries()) {
      for (const pattern of this.config.threatDetection.suspiciousPatterns) {
        if (pattern.test(value)) {
          return {
            type: 'SUSPICIOUS_PATTERN',
            severity: 'HIGH',
            description: 'Suspicious pattern detected in headers',
            metadata: { header: name, pattern: pattern.source }
          };
        }
      }
    }

    return null;
  }

  /**
   * Advanced rate limiting with multiple tiers
   */
  private async checkRateLimits(request: NextRequest, fingerprint: RequestFingerprint): Promise<SecurityViolation | null> {
    const url = new URL(request.url);
    const now = Date.now();

    // Global rate limit
    const globalKey = `rate_limit:global:${Math.floor(now / this.config.rateLimit.global.window)}`;
    const globalCount = await this.incrementCounter(globalKey, this.config.rateLimit.global.window);
    if (globalCount > this.config.rateLimit.global.requests) {
      return {
        type: 'RATE_LIMIT',
        severity: 'HIGH',
        description: 'Global rate limit exceeded',
        metadata: { count: globalCount, limit: this.config.rateLimit.global.requests }
      };
    }

    // Per-endpoint rate limit
    const endpointKey = `rate_limit:endpoint:${url.pathname}:${Math.floor(now / this.config.rateLimit.perEndpoint.window)}`;
    const endpointCount = await this.incrementCounter(endpointKey, this.config.rateLimit.perEndpoint.window);
    if (endpointCount > this.config.rateLimit.perEndpoint.requests) {
      return {
        type: 'RATE_LIMIT',
        severity: 'MEDIUM',
        description: 'Endpoint rate limit exceeded',
        metadata: { endpoint: url.pathname, count: endpointCount, limit: this.config.rateLimit.perEndpoint.requests }
      };
    }

    // Per-IP rate limit
    const ipKey = `rate_limit:ip:${fingerprint.ip}:${Math.floor(now / this.config.rateLimit.perUser.window)}`;
    const ipCount = await this.incrementCounter(ipKey, this.config.rateLimit.perUser.window);
    if (ipCount > this.config.rateLimit.perUser.requests) {
      return {
        type: 'RATE_LIMIT',
        severity: 'MEDIUM',
        description: 'IP rate limit exceeded',
        metadata: { ip: fingerprint.ip, count: ipCount, limit: this.config.rateLimit.perUser.requests }
      };
    }

    return null;
  }

  /**
   * Calculate anomaly score based on request patterns
   */
  private async calculateAnomalyScore(fingerprint: RequestFingerprint): Promise<number> {
    let score = 0;

    // Check request frequency from same IP
    const recentRequests = await this.getRecentRequestCount(fingerprint.ip, 300000); // 5 minutes
    if (recentRequests > 100) score += 0.3;

    // Check for rapid-fire requests
    const lastRequestTime = await this.getLastRequestTime(fingerprint.ip);
    if (lastRequestTime && (fingerprint.timestamp - lastRequestTime) < 100) {
      score += 0.4;
    }

    // Check for suspicious user agent patterns
    if (!fingerprint.userAgent || fingerprint.userAgent.length < 10) {
      score += 0.2;
    }

    // Check for missing common headers
    const expectedHeaders = ['accept', 'accept-language', 'accept-encoding'];
    const missingHeaders = expectedHeaders.filter(h => !fingerprint.headers[h]);
    score += missingHeaders.length * 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Generate request fingerprint for tracking
   */
  private generateRequestFingerprint(request: NextRequest): RequestFingerprint {
    const ip = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    const url = new URL(request.url);
    
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const fingerprintData = `${ip}:${userAgent}:${url.pathname}:${request.method}`;
    const hash = crypto.createHash('sha256').update(fingerprintData).digest('hex');

    return {
      ip,
      userAgent,
      headers,
      path: url.pathname,
      method: request.method,
      timestamp: Date.now(),
      hash
    };
  }

  /**
   * Get real client IP address
   */
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const remoteAddr = request.headers.get('remote-addr');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    return realIP || remoteAddr || 'unknown';
  }

  /**
   * Check for malicious patterns in content
   */
  private checkForMaliciousPatterns(content: string): void {
    for (const pattern of this.config.threatDetection.suspiciousPatterns) {
      if (pattern.test(content)) {
        throw new Error(`Malicious pattern detected: ${pattern.source}`);
      }
    }
  }

  /**
   * Helper methods for tracking and caching
   */
  private async incrementCounter(key: string, ttl: number): Promise<number> {
    try {
      const count = await redisCache.incr(key);
      if (count === 1) {
        await redisCache.expire(key, Math.ceil(ttl / 1000));
      }
      return count;
    } catch (error) {
      logger.error('Redis counter error', { error: error instanceof Error ? error.message : String(error) });
      return 0;
    }
  }

  private async getRecentRequestCount(ip: string, window: number): Promise<number> {
    try {
      const key = `request_count:${ip}:${Math.floor(Date.now() / window)}`;
      return await redisCache.get(key) || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getLastRequestTime(ip: string): Promise<number | null> {
    try {
      const key = `last_request:${ip}`;
      return await redisCache.get(key);
    } catch (error) {
      return null;
    }
  }

  private isBlockedIP(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  private async addSuspiciousIP(ip: string): Promise<void> {
    this.suspiciousIPs.add(ip);
    
    // Auto-block IPs with multiple violations
    const violationCount = await this.getViolationCount(ip);
    if (violationCount > 5) {
      this.blockedIPs.add(ip);
      logger.warn('IP automatically blocked', { ip, violationCount });
    }
  }

  private async getViolationCount(ip: string): Promise<number> {
    try {
      const key = `violations:${ip}`;
      return await redisCache.get(key) || 0;
    } catch (error) {
      return 0;
    }
  }

  private async recordViolation(fingerprint: RequestFingerprint, violation: SecurityViolation): Promise<void> {
    // Record violation in logs
    logger.warn('Security violation detected', {
      type: violation.type,
      severity: violation.severity,
      description: violation.description,
      ip: fingerprint.ip,
      path: fingerprint.path,
      userAgent: fingerprint.userAgent,
      metadata: violation.metadata
    });

    // Increment violation count for IP
    try {
      const key = `violations:${fingerprint.ip}`;
      await this.incrementCounter(key, 24 * 60 * 60 * 1000); // 24 hour window
    } catch (error) {
      logger.error('Failed to record violation', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private async recordCleanRequest(fingerprint: RequestFingerprint): Promise<void> {
    try {
      const key = `last_request:${fingerprint.ip}`;
      await redisCache.setex(key, 300, fingerprint.timestamp); // 5 minute TTL
    } catch (error) {
      // Ignore cache errors for clean requests
    }
  }

  private createSecurityResponse(type: string, status: number, message: string): NextResponse {
    return NextResponse.json(
      {
        error: 'Security violation',
        type,
        message,
        timestamp: new Date().toISOString()
      },
      { status }
    );
  }

  private initializeThreatIntelligence(): void {
    // Initialize with known malicious IPs, patterns, etc.
    // This could be loaded from external threat intelligence feeds
    logger.info('API Fortress initialized', {
      rateLimits: this.config.rateLimit,
      threatPatterns: this.config.threatDetection.suspiciousPatterns.length
    });
  }
}

export const apiFortress = new APIFortress();