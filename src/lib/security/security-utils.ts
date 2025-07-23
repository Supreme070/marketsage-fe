/**
 * Security Utilities for MarketSage Security Center
 */

import { prisma } from '@/lib/db/prisma';
import { SecurityThreat, IPBlocklistEntry, SecurityStats } from './security-types';

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
    const bruteForceAttempts = await prisma.securityEvent.groupBy({
      by: ['ipAddress'],
      _count: {
        ipAddress: true
      },
      where: {
        eventType: 'FAILED_LOGIN',
        timestamp: {
          gte: timeWindow
        },
        ipAddress: {
          not: null
        }
      },
      having: {
        ipAddress: {
          _count: {
            gte: 5 // 5 or more failed attempts
          }
        }
      }
    });

    for (const attempt of bruteForceAttempts) {
      if (!attempt.ipAddress) continue;

      const events = await prisma.securityEvent.findMany({
        where: {
          eventType: 'FAILED_LOGIN',
          ipAddress: attempt.ipAddress,
          timestamp: { gte: timeWindow }
        },
        orderBy: { timestamp: 'asc' },
        take: 1
      });

      const lastEvents = await prisma.securityEvent.findMany({
        where: {
          eventType: 'FAILED_LOGIN',
          ipAddress: attempt.ipAddress,
          timestamp: { gte: timeWindow }
        },
        orderBy: { timestamp: 'desc' },
        take: 1
      });

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
    const apiAbuseAttempts = await prisma.securityEvent.groupBy({
      by: ['ipAddress'],
      _count: {
        ipAddress: true
      },
      where: {
        eventType: 'RATE_LIMIT_EXCEEDED',
        timestamp: {
          gte: timeWindow
        },
        ipAddress: {
          not: null
        }
      },
      having: {
        ipAddress: {
          _count: {
            gte: 10 // 10 or more rate limit violations
          }
        }
      }
    });

    for (const abuse of apiAbuseAttempts) {
      if (!abuse.ipAddress) continue;

      const events = await prisma.securityEvent.findMany({
        where: {
          eventType: 'RATE_LIMIT_EXCEEDED',
          ipAddress: abuse.ipAddress,
          timestamp: { gte: timeWindow }
        },
        orderBy: { timestamp: 'asc' },
        take: 1
      });

      const lastEvents = await prisma.securityEvent.findMany({
        where: {
          eventType: 'RATE_LIMIT_EXCEEDED',
          ipAddress: abuse.ipAddress,
          timestamp: { gte: timeWindow }
        },
        orderBy: { timestamp: 'desc' },
        take: 1
      });

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
    const sqlInjectionAttempts = await prisma.securityEvent.findMany({
      where: {
        eventType: 'SQL_INJECTION_ATTEMPT',
        timestamp: {
          gte: timeWindow
        }
      },
      distinct: ['ipAddress'],
    });

    for (const attempt of sqlInjectionAttempts) {
      if (!attempt.ipAddress) continue;

      const eventCount = await prisma.securityEvent.count({
        where: {
          eventType: 'SQL_INJECTION_ATTEMPT',
          ipAddress: attempt.ipAddress,
          timestamp: { gte: timeWindow }
        }
      });

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
      totalEvents,
      criticalEvents,
      highEvents,
      unresolvedEvents,
      threats
    ] = await Promise.all([
      prisma.securityEvent.count({
        where: { timestamp: { gte: timeWindow } }
      }),
      prisma.securityEvent.count({
        where: { 
          severity: 'CRITICAL',
          timestamp: { gte: timeWindow }
        }
      }),
      prisma.securityEvent.count({
        where: { 
          severity: 'HIGH',
          timestamp: { gte: timeWindow }
        }
      }),
      prisma.securityEvent.count({
        where: { 
          resolved: false,
          timestamp: { gte: timeWindow }
        }
      }),
      detectThreats(timeWindow)
    ]);

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
    const recentBlocks = await prisma.securityEvent.findFirst({
      where: {
        ipAddress,
        eventType: 'UNAUTHORIZED_ACCESS',
        severity: 'CRITICAL',
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    return !!recentBlocks;
  } catch (error) {
    console.error('Error checking IP block status:', error);
    return false;
  }
}

/**
 * Get security trend data for analytics
 */
export async function getSecurityTrends(days: number = 7): Promise<Array<{date: string, events: number, threats: number, blocked: number}>> {
  try {
    const trends = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [events, threats, blocked] = await Promise.all([
        prisma.securityEvent.count({
          where: {
            timestamp: {
              gte: date,
              lt: nextDate
            }
          }
        }),
        prisma.securityEvent.count({
          where: {
            eventType: {
              in: ['SUSPICIOUS_ACTIVITY', 'SQL_INJECTION_ATTEMPT', 'MALICIOUS_REQUEST']
            },
            timestamp: {
              gte: date,
              lt: nextDate
            }
          }
        }),
        prisma.securityEvent.count({
          where: {
            eventType: 'UNAUTHORIZED_ACCESS',
            severity: 'CRITICAL',
            timestamp: {
              gte: date,
              lt: nextDate
            }
          }
        })
      ]);

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