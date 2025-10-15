/**
 * Security Utilities for MarketSage Security Center
 */

// NOTE: Prisma removed - using backend API
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ||
                    process.env.NESTJS_BACKEND_URL ||
                    'http://localhost:3006';

import { type SecurityThreat, IPBlocklistEntry, SecurityStats } from './security-types';

/**
 * Get geolocation data for IP address
 */
export async function getIPLocation(ip: string): Promise<string | null> {
  try {
    // Skip localhost and private IPs
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      return 'Local';
    }

    // Use ipapi.co for geolocation (free tier allows 1000 requests/day)
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: {
        'User-Agent': 'MarketSage-Security/1.0'
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.error) {
      return null;
    }

    return `${data.city || 'Unknown'}, ${data.region || ''} ${data.country_name || 'Unknown'}`.trim();
  } catch (error) {
    console.warn('Failed to get IP location:', error);
    return null;
  }
}

/**
 * Analyze security events to detect threats
 */
export async function detectThreats(timeWindow: Date = new Date(Date.now() - 24 * 60 * 60 * 1000)): Promise<SecurityThreat[]> {
  const threats: SecurityThreat[] = [];

  try {
    // Detect brute force attacks (multiple failed login attempts from same IP)
    const bruteForceResponse = await fetch(`${BACKEND_URL}/api/v2/security-events/group-by?by=ipAddress&eventType=FAILED_LOGIN&timestampGte=${timeWindow.toISOString()}&countGte=5`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const bruteForceAttempts = bruteForceResponse.ok ? await bruteForceResponse.json() : [];

    for (const attempt of bruteForceAttempts) {
      if (!attempt.ipAddress) continue;

      const eventsResponse = await fetch(`${BACKEND_URL}/api/v2/security-events?eventType=FAILED_LOGIN&ipAddress=${attempt.ipAddress}&timestampGte=${timeWindow.toISOString()}&orderBy=timestamp&order=asc&take=1`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const events = eventsResponse.ok ? await eventsResponse.json() : [];

      const lastEventsResponse = await fetch(`${BACKEND_URL}/api/v2/security-events?eventType=FAILED_LOGIN&ipAddress=${attempt.ipAddress}&timestampGte=${timeWindow.toISOString()}&orderBy=timestamp&order=desc&take=1`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const lastEvents = lastEventsResponse.ok ? await lastEventsResponse.json() : [];

      if (events.length > 0 && lastEvents.length > 0) {
        const location = await getIPLocation(attempt.ipAddress);
        
        threats.push({
          id: `brute_force_${attempt.ipAddress}`,
          type: 'BRUTE_FORCE',
          severity: attempt._count.ipAddress >= 20 ? 'CRITICAL' : 
                   attempt._count.ipAddress >= 10 ? 'HIGH' : 'MEDIUM',
          ipAddress: attempt.ipAddress,
          location: location || undefined,
          firstSeen: events[0].timestamp,
          lastSeen: lastEvents[0].timestamp,
          eventCount: attempt._count.ipAddress,
          blocked: false, // Check if IP is blocked
          riskScore: Math.min(attempt._count.ipAddress * 0.5, 10),
          description: `${attempt._count.ipAddress} failed login attempts from ${attempt.ipAddress}`,
          patterns: ['REPEATED_FAILED_LOGIN'],
          userAgent: events[0].userAgent || undefined
        });
      }
    }

    // Detect suspicious API abuse patterns
    const apiAbuseResponse = await fetch(`${BACKEND_URL}/api/v2/security-events/group-by?by=ipAddress&eventType=RATE_LIMIT_EXCEEDED&timestampGte=${timeWindow.toISOString()}&countGte=10`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const apiAbuseAttempts = apiAbuseResponse.ok ? await apiAbuseResponse.json() : [];

    for (const abuse of apiAbuseAttempts) {
      if (!abuse.ipAddress) continue;

      const eventsResponse = await fetch(`${BACKEND_URL}/api/v2/security-events?eventType=RATE_LIMIT_EXCEEDED&ipAddress=${abuse.ipAddress}&timestampGte=${timeWindow.toISOString()}&orderBy=timestamp&order=asc&take=1`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const events = eventsResponse.ok ? await eventsResponse.json() : [];

      const lastEventsResponse = await fetch(`${BACKEND_URL}/api/v2/security-events?eventType=RATE_LIMIT_EXCEEDED&ipAddress=${abuse.ipAddress}&timestampGte=${timeWindow.toISOString()}&orderBy=timestamp&order=desc&take=1`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const lastEvents = lastEventsResponse.ok ? await lastEventsResponse.json() : [];

      if (events.length > 0 && lastEvents.length > 0) {
        const location = await getIPLocation(abuse.ipAddress);
        
        threats.push({
          id: `api_abuse_${abuse.ipAddress}`,
          type: 'API_ABUSE',
          severity: abuse._count.ipAddress >= 50 ? 'HIGH' : 'MEDIUM',
          ipAddress: abuse.ipAddress,
          location: location || undefined,
          firstSeen: events[0].timestamp,
          lastSeen: lastEvents[0].timestamp,
          eventCount: abuse._count.ipAddress,
          blocked: false,
          riskScore: Math.min(abuse._count.ipAddress * 0.2, 8),
          description: `${abuse._count.ipAddress} rate limit violations from ${abuse.ipAddress}`,
          patterns: ['API_RATE_LIMIT_ABUSE'],
          userAgent: events[0].userAgent || undefined
        });
      }
    }

    // Detect SQL injection attempts
    const sqlInjectionResponse = await fetch(`${BACKEND_URL}/api/v2/security-events?eventType=SQL_INJECTION_ATTEMPT&timestampGte=${timeWindow.toISOString()}&distinct=ipAddress`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const sqlInjectionAttempts = sqlInjectionResponse.ok ? await sqlInjectionResponse.json() : [];

    for (const attempt of sqlInjectionAttempts) {
      if (!attempt.ipAddress) continue;

      const eventCountResponse = await fetch(`${BACKEND_URL}/api/v2/security-events/count?eventType=SQL_INJECTION_ATTEMPT&ipAddress=${attempt.ipAddress}&timestampGte=${timeWindow.toISOString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const eventCountData = eventCountResponse.ok ? await eventCountResponse.json() : { count: 0 };
      const eventCount = eventCountData.count || 0;

      const location = await getIPLocation(attempt.ipAddress);

      threats.push({
        id: `sql_injection_${attempt.ipAddress}`,
        type: 'SQL_INJECTION',
        severity: 'HIGH',
        ipAddress: attempt.ipAddress,
        location: location || undefined,
        firstSeen: attempt.timestamp,
        lastSeen: attempt.timestamp,
        eventCount,
        blocked: false,
        riskScore: 9,
        description: `SQL injection attempts detected from ${attempt.ipAddress}`,
        patterns: ['SQL_INJECTION_PATTERN'],
        userAgent: attempt.userAgent || undefined
      });
    }

  } catch (error) {
    console.error('Error detecting threats:', error);
  }

  return threats;
}

/**
 * Calculate security score based on recent activity
 */
export async function calculateSecurityScore(timeWindow: Date = new Date(Date.now() - 24 * 60 * 60 * 1000)): Promise<number> {
  try {
    const [
      totalEventsRes,
      criticalEventsRes,
      highEventsRes,
      unresolvedEventsRes,
      threats
    ] = await Promise.all([
      fetch(`${BACKEND_URL}/api/v2/security-events/count?timestampGte=${timeWindow.toISOString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }),
      fetch(`${BACKEND_URL}/api/v2/security-events/count?severity=CRITICAL&timestampGte=${timeWindow.toISOString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }),
      fetch(`${BACKEND_URL}/api/v2/security-events/count?severity=HIGH&timestampGte=${timeWindow.toISOString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }),
      fetch(`${BACKEND_URL}/api/v2/security-events/count?resolved=false&timestampGte=${timeWindow.toISOString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }),
      detectThreats(timeWindow)
    ]);

    const totalEventsData = totalEventsRes.ok ? await totalEventsRes.json() : { count: 0 };
    const criticalEventsData = criticalEventsRes.ok ? await criticalEventsRes.json() : { count: 0 };
    const highEventsData = highEventsRes.ok ? await highEventsRes.json() : { count: 0 };
    const unresolvedEventsData = unresolvedEventsRes.ok ? await unresolvedEventsRes.json() : { count: 0 };

    const totalEvents = totalEventsData.count || 0;
    const criticalEvents = criticalEventsData.count || 0;
    const highEvents = highEventsData.count || 0;
    const unresolvedEvents = unresolvedEventsData.count || 0;

    // Start with base score of 100
    let score = 100;

    // Deduct points for critical events (5 points each)
    score -= criticalEvents * 5;

    // Deduct points for high severity events (2 points each)
    score -= highEvents * 2;

    // Deduct points for unresolved events (1 point each)
    score -= unresolvedEvents * 1;

    // Deduct points for active threats (3 points each)
    score -= threats.length * 3;

    // Ensure score doesn't go below 0
    return Math.max(score, 0);

  } catch (error) {
    console.error('Error calculating security score:', error);
    return 50; // Default middle score if calculation fails
  }
}

/**
 * Check if an IP address is blocked
 */
export async function isIPBlocked(ipAddress: string): Promise<boolean> {
  try {
    // For now, we'll simulate with SecurityEvent data
    // In a real implementation, you might have a separate IP blocklist table
    const timeWindow = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const response = await fetch(`${BACKEND_URL}/api/v2/security-events/first?ipAddress=${ipAddress}&eventType=UNAUTHORIZED_ACCESS&severity=CRITICAL&timestampGte=${timeWindow.toISOString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const recentBlocks = response.ok ? await response.json() : null;

    return !!recentBlocks;
  } catch (error) {
    console.error('Error checking IP block status:', error);
    return false;
  }
}

/**
 * Get security trend data for analytics
 */
export async function getSecurityTrends(days = 7): Promise<Array<{date: string, events: number, threats: number, blocked: number}>> {
  try {
    const trends = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [eventsRes, threatsRes, blockedRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/v2/security-events/count?timestampGte=${date.toISOString()}&timestampLt=${nextDate.toISOString()}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }),
        fetch(`${BACKEND_URL}/api/v2/security-events/count?eventTypeIn=SUSPICIOUS_ACTIVITY,SQL_INJECTION_ATTEMPT,MALICIOUS_REQUEST&timestampGte=${date.toISOString()}&timestampLt=${nextDate.toISOString()}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }),
        fetch(`${BACKEND_URL}/api/v2/security-events/count?eventType=UNAUTHORIZED_ACCESS&severity=CRITICAL&timestampGte=${date.toISOString()}&timestampLt=${nextDate.toISOString()}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
      ]);

      const eventsData = eventsRes.ok ? await eventsRes.json() : { count: 0 };
      const threatsData = threatsRes.ok ? await threatsRes.json() : { count: 0 };
      const blockedData = blockedRes.ok ? await blockedRes.json() : { count: 0 };

      const events = eventsData.count || 0;
      const threats = threatsData.count || 0;
      const blocked = blockedData.count || 0;

      trends.push({
        date: date.toISOString().split('T')[0],
        events,
        threats,
        blocked
      });
    }

    return trends;
  } catch (error) {
    console.error('Error getting security trends:', error);
    return [];
  }
}