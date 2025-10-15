/**
 * LeadPulse Bot Detection System
 * 
 * Intelligent bot detection and filtering to ensure data accuracy
 * and prevent spam/automated traffic from polluting analytics.
 * Integrates safely with existing security infrastructure.
 */

import { logger } from '@/lib/logger';
// NOTE: Prisma removed - using backend API (LeadPulseVisitor, LeadPulseSecurityEvent exist in backend)

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';

// Bot detection confidence levels
export enum BotConfidence {
  HUMAN = 0,           // Definitely human
  SUSPICIOUS = 1,      // Some bot-like characteristics
  LIKELY_BOT = 2,      // High probability of being a bot
  CONFIRMED_BOT = 3    // Definitely a bot
}

// Bot detection result
export interface BotDetectionResult {
  confidence: BotConfidence;
  score: number;        // 0-100 confidence score
  reasons: string[];    // Why this was flagged
  action: 'allow' | 'flag' | 'block';
  metadata: Record<string, any>;
}

// Detection context
export interface DetectionContext {
  userAgent: string;
  ip: string;
  fingerprint?: string;
  requestHeaders: Record<string, string>;
  behaviorData?: {
    eventType: string;
    url: string;
    timing?: number;
    previousEvents?: any[];
  };
  visitorHistory?: {
    totalVisits: number;
    engagementScore: number;
    averageSessionDuration: number;
    lastVisit: Date;
  };
}

class BotDetectionEngine {
  // Known bot user agent patterns
  private readonly BOT_USER_AGENT_PATTERNS = [
    // Search engine bots
    /googlebot/i,
    /bingbot/i,
    /yahoo.*slurp/i,
    /duckduckbot/i,
    /baiduspider/i,
    
    // Social media crawlers
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i,
    /whatsapp/i,
    /telegrambot/i,
    
    // SEO and monitoring tools
    /ahrefs/i,
    /semrush/i,
    /\bmoz\b/i, // Only match "moz" as whole word, not in Mozilla
    /majestic/i,
    /screaming.*frog/i,
    
    // Generic bot patterns
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /nodejs/i,
    /phantom/i,
    /headless/i,
    /automation/i,
    /selenium/i,
    /webdriver/i,
    
    // Suspicious browsers/tools
    /postman/i,
    /insomnia/i,
    /httpie/i,
    /test/i,
  ];

  // Suspicious user agent characteristics
  private readonly SUSPICIOUS_UA_PATTERNS = [
    // Missing common browser characteristics
    /^mozilla\/5\.0$/i,
    /^$/, // Empty user agent
    
    // Overly generic patterns
    /^mozilla$/i,
    /^chrome$/i,
    /^safari$/i,
    
    // Unusual version patterns
    /mozilla\/\d+\.\d+.*rv:\d+\.\d+.*firefox\/\d+\.\d+/i, // Old Firefox pattern
    /chrome\/0\.0\.0\.0/i, // Invalid Chrome version
  ];

  // Suspicious IP ranges (common bot hosting)
  private readonly SUSPICIOUS_IP_RANGES = [
    // AWS ranges (simplified - in production use full AWS IP ranges)
    /^3\.\d+\.\d+\.\d+$/,
    /^13\.\d+\.\d+\.\d+$/,
    /^15\.\d+\.\d+\.\d+$/,
    /^18\.\d+\.\d+\.\d+$/,
    
    // Google Cloud
    /^34\.\d+\.\d+\.\d+$/,
    /^35\.\d+\.\d+\.\d+$/,
    
    // Azure
    /^20\.\d+\.\d+\.\d+$/,
    /^40\.\d+\.\d+\.\d+$/,
    
    // DigitalOcean
    /^159\.89\.\d+\.\d+$/,
    /^165\.227\.\d+\.\d+$/,
    
    // Tor exit nodes (common pattern)
    /^199\.87\.\d+\.\d+$/,
  ];

  /**
   * Detect if a request is likely from a bot
   */
  async detectBot(context: DetectionContext): Promise<BotDetectionResult> {
    const reasons: string[] = [];
    let score = 0;
    const metadata: Record<string, any> = {};

    try {
      // 1. User Agent Analysis (40% weight)
      const uaAnalysis = this.analyzeUserAgent(context.userAgent);
      score += uaAnalysis.score * 0.4;
      reasons.push(...uaAnalysis.reasons);
      metadata.userAgentAnalysis = uaAnalysis;

      // 2. IP Address Analysis (20% weight)
      const ipAnalysis = this.analyzeIPAddress(context.ip);
      score += ipAnalysis.score * 0.2;
      reasons.push(...ipAnalysis.reasons);
      metadata.ipAnalysis = ipAnalysis;

      // 3. Request Headers Analysis (15% weight)
      const headerAnalysis = this.analyzeRequestHeaders(context.requestHeaders);
      score += headerAnalysis.score * 0.15;
      reasons.push(...headerAnalysis.reasons);
      metadata.headerAnalysis = headerAnalysis;

      // 4. Behavioral Analysis (20% weight)
      if (context.behaviorData) {
        const behaviorAnalysis = this.analyzeBehaviorData(context.behaviorData);
        score += behaviorAnalysis.score * 0.2;
        reasons.push(...behaviorAnalysis.reasons);
        metadata.behaviorAnalysis = behaviorAnalysis;
      }

      // 5. Historical Analysis (5% weight)
      if (context.visitorHistory) {
        const historyAnalysis = this.analyzeVisitorHistory(context.visitorHistory);
        score += historyAnalysis.score * 0.05;
        reasons.push(...historyAnalysis.reasons);
        metadata.historyAnalysis = historyAnalysis;
      }

      // Determine confidence level and action
      const confidence = this.scoreToConfidence(score);
      const action = this.determineAction(confidence, score);

      const result: BotDetectionResult = {
        confidence,
        score: Math.round(score),
        reasons: reasons.filter(Boolean),
        action,
        metadata,
      };

      // Log significant bot detections
      if (confidence >= BotConfidence.LIKELY_BOT) {
        logger.warn('Bot detected', {
          ip: context.ip,
          userAgent: context.userAgent,
          confidence,
          score: result.score,
          reasons: result.reasons,
        });
      }

      return result;
    } catch (error) {
      logger.error('Bot detection error', { error, ip: context.ip });
      
      // On error, allow request but log issue
      return {
        confidence: BotConfidence.HUMAN,
        score: 0,
        reasons: ['Detection error - defaulting to allow'],
        action: 'allow',
        metadata: { error: error.message },
      };
    }
  }

  /**
   * Analyze user agent string for bot characteristics
   */
  private analyzeUserAgent(userAgent: string): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;

    if (!userAgent || userAgent.trim() === '') {
      score += 80;
      reasons.push('Empty user agent');
      return { score: Math.min(100, score), reasons };
    }

    // Check against known bot patterns
    for (const pattern of this.BOT_USER_AGENT_PATTERNS) {
      if (pattern.test(userAgent)) {
        score += 90;
        reasons.push(`Known bot pattern: ${pattern.source}`);
        break; // One match is enough
      }
    }

    // Check suspicious patterns
    for (const pattern of this.SUSPICIOUS_UA_PATTERNS) {
      if (pattern.test(userAgent)) {
        score += 60;
        reasons.push(`Suspicious user agent pattern: ${pattern.source}`);
      }
    }

    // Check for missing common browser components
    if (!userAgent.includes('Mozilla') && !userAgent.includes('Opera')) {
      score += 40;
      reasons.push('Missing Mozilla identifier');
    }

    // Check for overly long user agents (often bots)
    if (userAgent.length > 500) {
      score += 30;
      reasons.push('Unusually long user agent');
    }

    // Check for repeated patterns (bot-like)
    const parts = userAgent.split(/[\s\/;()]+/);
    const uniqueParts = new Set(parts);
    if (parts.length > 5 && uniqueParts.size / parts.length < 0.7) {
      score += 25;
      reasons.push('Repetitive user agent pattern');
    }

    return { score: Math.min(100, score), reasons };
  }

  /**
   * Analyze IP address for bot characteristics
   */
  private analyzeIPAddress(ip: string): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;

    // Check suspicious IP ranges
    for (const pattern of this.SUSPICIOUS_IP_RANGES) {
      if (pattern.test(ip)) {
        score += 30;
        reasons.push(`Suspicious IP range: ${ip}`);
        break;
      }
    }

    // Check for localhost/private IPs (could be tests)
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      score += 20;
      reasons.push('Local/private IP address');
    }

    // Check for invalid IP format
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipv4Pattern.test(ip) && !ip.includes(':')) {
      score += 50;
      reasons.push('Invalid IP format');
    }

    return { score: Math.min(100, score), reasons };
  }

  /**
   * Analyze request headers for bot characteristics
   */
  private analyzeRequestHeaders(headers: Record<string, string>): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;

    // Check for missing common headers
    const expectedHeaders = ['accept', 'accept-language', 'accept-encoding'];
    const missingHeaders = expectedHeaders.filter(h => !headers[h] && !headers[h.toUpperCase()]);
    
    if (missingHeaders.length > 0) {
      score += missingHeaders.length * 15;
      reasons.push(`Missing headers: ${missingHeaders.join(', ')}`);
    }

    // Check for suspicious header values
    const accept = headers.accept || headers.Accept || '';
    if (accept === '*/*' && Object.keys(headers).length < 5) {
      score += 25;
      reasons.push('Minimal headers with generic accept');
    }

    // Check for bot-specific headers
    const botHeaders = ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'];
    const hasProxyHeaders = botHeaders.some(h => headers[h]);
    if (hasProxyHeaders && !headers.referer && !headers.Referer) {
      score += 20;
      reasons.push('Proxy headers without referer');
    }

    // Check for unusual DNT (Do Not Track) patterns
    if (headers['dnt'] === '1' && !headers['accept-language']) {
      score += 15;
      reasons.push('DNT header without accept-language');
    }

    return { score: Math.min(100, score), reasons };
  }

  /**
   * Analyze behavioral data for bot patterns
   */
  private analyzeBehaviorData(behaviorData: any): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;

    // Check for superhuman speed
    if (behaviorData.timing && behaviorData.timing < 100) {
      score += 40;
      reasons.push('Superhuman interaction speed');
    }

    // Check for suspicious event patterns
    if (behaviorData.eventType === 'click' && behaviorData.timing && behaviorData.timing < 50) {
      score += 30;
      reasons.push('Impossibly fast click timing');
    }

    // Check for repetitive patterns in previous events
    if (behaviorData.previousEvents && behaviorData.previousEvents.length > 5) {
      const timings = behaviorData.previousEvents
        .map((e: any) => e.timing)
        .filter((t: number) => typeof t === 'number');
      
      if (timings.length > 3) {
        const avgTiming = timings.reduce((a: number, b: number) => a + b, 0) / timings.length;
        const variance = timings.reduce((acc: number, t: number) => acc + Math.pow(t - avgTiming, 2), 0) / timings.length;
        
        // Perfect timing patterns are suspicious
        if (variance < 10 && avgTiming < 200) {
          score += 35;
          reasons.push('Perfect timing pattern detected');
        }
      }
    }

    // Check for missing scroll events on long pages
    if (behaviorData.eventType === 'pageview' && !behaviorData.url.includes('api')) {
      // Humans typically scroll on content pages
      const hasScrollEvents = behaviorData.previousEvents?.some((e: any) => e.eventType === 'scroll_depth');
      if (!hasScrollEvents && behaviorData.previousEvents?.length > 2) {
        score += 20;
        reasons.push('No scroll events on content page');
      }
    }

    return { score: Math.min(100, score), reasons };
  }

  /**
   * Analyze visitor history for bot patterns
   */
  private analyzeVisitorHistory(history: any): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;

    // Check for zero engagement score with multiple visits
    if (history.engagementScore === 0 && history.totalVisits > 3) {
      score += 30;
      reasons.push('Zero engagement with multiple visits');
    }

    // Check for impossibly consistent session durations
    if (history.averageSessionDuration > 0 && history.totalVisits > 5) {
      // Humans have variable session durations
      if (history.averageSessionDuration < 10 || history.averageSessionDuration > 7200) {
        score += 25;
        reasons.push('Unusual session duration pattern');
      }
    }

    // Check for very recent account with high activity
    const daysSinceFirstVisit = history.lastVisit ? 
      (Date.now() - new Date(history.lastVisit).getTime()) / (24 * 60 * 60 * 1000) : 0;
    
    if (daysSinceFirstVisit < 1 && history.totalVisits > 20) {
      score += 40;
      reasons.push('High activity in short time period');
    }

    return { score: Math.min(100, score), reasons };
  }

  /**
   * Convert score to confidence level
   */
  private scoreToConfidence(score: number): BotConfidence {
    if (score >= 80) return BotConfidence.CONFIRMED_BOT;
    if (score >= 60) return BotConfidence.LIKELY_BOT;
    if (score >= 30) return BotConfidence.SUSPICIOUS;
    return BotConfidence.HUMAN;
  }

  /**
   * Determine action based on confidence and score
   */
  private determineAction(confidence: BotConfidence, score: number): 'allow' | 'flag' | 'block' {
    switch (confidence) {
      case BotConfidence.CONFIRMED_BOT:
        return score >= 90 ? 'block' : 'flag';
      case BotConfidence.LIKELY_BOT:
        return 'flag';
      case BotConfidence.SUSPICIOUS:
        return 'flag';
      default:
        return 'allow';
    }
  }

  /**
   * Store bot detection result in database
   */
  async storeDetectionResult(
    visitorId: string,
    result: BotDetectionResult,
    context: DetectionContext
  ): Promise<void> {
    try {
      // Update visitor record with bot score via backend API
      const updateResponse = await fetch(`${BACKEND_URL}/api/v2/visitors/${visitorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: {
            botDetection: {
              lastCheck: new Date().toISOString(),
              confidence: result.confidence,
              score: result.score,
              action: result.action,
            },
          },
        })
      });

      if (!updateResponse.ok) {
        throw new Error(`Failed to update visitor: ${updateResponse.status}`);
      }

      // Log security event for significant detections
      if (result.confidence >= BotConfidence.LIKELY_BOT) {
        const eventResponse = await fetch(`${BACKEND_URL}/api/v2/leadpulse-security-events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'BOT_DETECTED',
            severity: result.confidence === BotConfidence.CONFIRMED_BOT ? 'HIGH' : 'MEDIUM',
            description: `Bot detected: ${result.reasons.join(', ')}`,
            ipAddress: context.ip,
            userAgent: context.userAgent,
            metadata: JSON.stringify({
              botScore: result.score,
              confidence: result.confidence,
              reasons: result.reasons,
              action: result.action,
            }),
            resolvedAt: null,
          })
        });

        if (!eventResponse.ok) {
          throw new Error(`Failed to create security event: ${eventResponse.status}`);
        }
      }
    } catch (error) {
      logger.error('Failed to store bot detection result', {
        error,
        visitorId,
        confidence: result.confidence,
      });
    }
  }

  /**
   * Get bot detection statistics
   */
  async getStatistics(): Promise<{
    totalDetections: number;
    detectionsByConfidence: Record<string, number>;
    blockedRequests: number;
    flaggedRequests: number;
  }> {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const response = await fetch(
        `${BACKEND_URL}/api/v2/leadpulse-security-events?type=BOT_DETECTED&createdAt[gte]=${twentyFourHoursAgo}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch security events: ${response.status}`);
      }

      const securityEvents = await response.json();

      const detectionsByConfidence: Record<string, number> = {
        [BotConfidence.SUSPICIOUS]: 0,
        [BotConfidence.LIKELY_BOT]: 0,
        [BotConfidence.CONFIRMED_BOT]: 0,
      };

      let blockedRequests = 0;
      let flaggedRequests = 0;

      securityEvents.forEach((event: any) => {
        const metadata = JSON.parse(event.metadata || '{}');
        const confidence = metadata.confidence || BotConfidence.SUSPICIOUS;
        const action = metadata.action || 'flag';

        detectionsByConfidence[confidence]++;

        if (action === 'block') {
          blockedRequests++;
        } else if (action === 'flag') {
          flaggedRequests++;
        }
      });

      return {
        totalDetections: securityEvents.length,
        detectionsByConfidence,
        blockedRequests,
        flaggedRequests,
      };
    } catch (error) {
      logger.error('Failed to get bot detection statistics', { error });
      return {
        totalDetections: 0,
        detectionsByConfidence: {},
        blockedRequests: 0,
        flaggedRequests: 0,
      };
    }
  }
}

// Export singleton instance
export const botDetector = new BotDetectionEngine();

/**
 * Middleware helper for bot detection in API routes
 */
export async function detectBotInRequest(
  request: Request,
  visitorData?: any
): Promise<BotDetectionResult> {
  const userAgent = request.headers.get('user-agent') || '';
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             '127.0.0.1';

  // Convert headers to plain object
  const requestHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    requestHeaders[key] = value;
  });

  const context: DetectionContext = {
    userAgent,
    ip,
    requestHeaders,
    visitorHistory: visitorData ? {
      totalVisits: visitorData.totalVisits || 0,
      engagementScore: visitorData.engagementScore || 0,
      averageSessionDuration: visitorData.averageSessionDuration || 0,
      lastVisit: visitorData.lastVisit || new Date(),
    } : undefined,
  };

  return await botDetector.detectBot(context);
}