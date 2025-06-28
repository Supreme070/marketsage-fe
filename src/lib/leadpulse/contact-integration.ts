/**
 * Contact-LeadPulse Integration
 * Links LeadPulse visitor data with Contact management system
 */

import prisma from '@/lib/db/prisma';
import { conversionBridge, type CustomerJourney } from './conversion-bridge';

export interface ContactLeadPulseData {
  contactId: string;
  totalVisitorSessions: number;
  totalTouchpoints: number;
  engagementScore: number;
  firstVisit: Date;
  lastVisit: Date;
  conversionType?: string;
  conversionDate?: Date;
  predictedValue?: number;
  journeyStage: 'visitor' | 'lead' | 'customer' | 'churned';
  deviceInfo: {
    primaryDevice: string;
    browsers: string[];
    locations: string[];
  };
  behaviorPattern: {
    avgSessionDuration: number;
    mostVisitedPages: string[];
    conversionPath?: string[];
  };
  aiInsights: {
    conversionProbability: number;
    churnRisk: number;
    nextBestAction: string;
    segmentPrediction: string;
  };
}

class ContactLeadPulseIntegration {
  /**
   * Get LeadPulse data for a specific contact
   */
  async getContactLeadPulseData(contactId: string): Promise<ContactLeadPulseData | null> {
    try {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
        include: {
          leadPulseVisitors: {
            include: {
              touchpoints: {
                orderBy: { timestamp: 'desc' }
              }
            }
          }
        }
      });

      if (!contact || !contact.leadPulseVisitors.length) {
        return null;
      }

      const visitors = contact.leadPulseVisitors;
      const allTouchpoints = visitors.flatMap(v => v.touchpoints);

      // Calculate aggregate metrics
      const totalVisitorSessions = visitors.length;
      const totalTouchpoints = allTouchpoints.length;
      const engagementScore = this.calculateAggregateEngagementScore(visitors);
      const firstVisit = new Date(Math.min(...visitors.map(v => v.firstVisit.getTime())));
      const lastVisit = new Date(Math.max(...visitors.map(v => v.lastVisit.getTime())));

      // Extract conversion info from contact metadata
      const journeyMetadata = (contact.metadata as any)?.customerJourney;
      const conversionType = journeyMetadata?.conversionEvent?.conversionType;
      const conversionDate = journeyMetadata?.conversionEvent ? new Date() : undefined;
      const predictedValue = journeyMetadata?.predictedValue;
      const journeyStage = journeyMetadata?.stage || this.inferJourneyStage(contact, allTouchpoints);

      // Analyze device and behavior patterns
      const deviceInfo = this.analyzeDeviceInfo(visitors);
      const behaviorPattern = this.analyzeBehaviorPattern(allTouchpoints);
      const aiInsights = await this.generateAIInsights(contact, visitors, allTouchpoints);

      return {
        contactId,
        totalVisitorSessions,
        totalTouchpoints,
        engagementScore,
        firstVisit,
        lastVisit,
        conversionType,
        conversionDate,
        predictedValue,
        journeyStage,
        deviceInfo,
        behaviorPattern,
        aiInsights
      };

    } catch (error) {
      console.error('Error getting contact LeadPulse data:', error);
      return null;
    }
  }

  /**
   * Get all contacts with LeadPulse data
   */
  async getContactsWithLeadPulseData(limit = 50, offset = 0): Promise<{
    contacts: Array<ContactLeadPulseData & { 
      email: string; 
      name: string; 
      company?: string;
      tags: string[];
    }>;
    total: number;
  }> {
    try {
      const [contacts, total] = await Promise.all([
        prisma.contact.findMany({
          where: {
            leadPulseVisitors: {
              some: {}
            }
          },
          include: {
            leadPulseVisitors: {
              include: {
                touchpoints: true
              }
            }
          },
          skip: offset,
          take: limit,
          orderBy: {
            updatedAt: 'desc'
          }
        }),
        prisma.contact.count({
          where: {
            leadPulseVisitors: {
              some: {}
            }
          }
        })
      ]);

      const contactsWithData = await Promise.all(
        contacts.map(async (contact) => {
          const leadPulseData = await this.getContactLeadPulseData(contact.id);
          
          return {
            ...leadPulseData!,
            email: contact.email,
            name: `${contact.firstName} ${contact.lastName}`.trim(),
            company: contact.company || undefined,
            tags: contact.tags || []
          };
        })
      );

      return {
        contacts: contactsWithData.filter(Boolean),
        total
      };

    } catch (error) {
      console.error('Error getting contacts with LeadPulse data:', error);
      return { contacts: [], total: 0 };
    }
  }

  /**
   * Update contact with LeadPulse insights
   */
  async updateContactWithLeadPulseInsights(contactId: string): Promise<void> {
    try {
      const leadPulseData = await this.getContactLeadPulseData(contactId);
      if (!leadPulseData) return;

      // Update contact with enriched data
      await prisma.contact.update({
        where: { id: contactId },
        data: {
          leadScore: Math.round(leadPulseData.engagementScore),
          metadata: {
            leadPulse: {
              totalSessions: leadPulseData.totalVisitorSessions,
              totalTouchpoints: leadPulseData.totalTouchpoints,
              engagementScore: leadPulseData.engagementScore,
              firstVisit: leadPulseData.firstVisit.toISOString(),
              lastVisit: leadPulseData.lastVisit.toISOString(),
              journeyStage: leadPulseData.journeyStage,
              predictedValue: leadPulseData.predictedValue,
              aiInsights: leadPulseData.aiInsights,
              lastUpdated: new Date().toISOString()
            }
          }
        }
      });

      // Auto-tag based on insights
      await this.autoTagContact(contactId, leadPulseData);

    } catch (error) {
      console.error('Error updating contact with LeadPulse insights:', error);
    }
  }

  /**
   * Auto-tag contacts based on LeadPulse data
   */
  private async autoTagContact(contactId: string, data: ContactLeadPulseData): Promise<void> {
    const newTags: string[] = [];

    // Engagement-based tags
    if (data.engagementScore > 80) newTags.push('high-engagement');
    else if (data.engagementScore > 50) newTags.push('medium-engagement');
    else newTags.push('low-engagement');

    // Behavior-based tags
    if (data.totalVisitorSessions > 5) newTags.push('repeat-visitor');
    if (data.totalTouchpoints > 20) newTags.push('highly-active');
    
    // Device-based tags
    if (data.deviceInfo.primaryDevice === 'Mobile') newTags.push('mobile-user');
    
    // Journey stage tags
    newTags.push(`journey-${data.journeyStage}`);

    // AI insight tags
    if (data.aiInsights.conversionProbability > 0.7) newTags.push('high-conversion-probability');
    if (data.aiInsights.churnRisk > 0.7) newTags.push('churn-risk');

    // Add tags to contact
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      select: { tags: true }
    });

    if (contact) {
      const existingTags = contact.tags || [];
      const updatedTags = [...new Set([...existingTags, ...newTags])];

      await prisma.contact.update({
        where: { id: contactId },
        data: { tags: updatedTags }
      });
    }
  }

  /**
   * Calculate aggregate engagement score across all visitor sessions
   */
  private calculateAggregateEngagementScore(visitors: any[]): number {
    if (visitors.length === 0) return 0;

    const totalScore = visitors.reduce((sum, visitor) => sum + (visitor.engagementScore || 0), 0);
    const averageScore = totalScore / visitors.length;
    
    // Bonus for multiple sessions
    const sessionBonus = Math.min(visitors.length * 3, 20);
    
    return Math.min(100, Math.round(averageScore + sessionBonus));
  }

  /**
   * Infer journey stage from contact and touchpoint data
   */
  private inferJourneyStage(contact: any, touchpoints: any[]): ContactLeadPulseData['journeyStage'] {
    // Check for purchase/conversion touchpoints
    const hasConversion = touchpoints.some(tp => tp.type === 'CONVERSION' || tp.type === 'FORM_SUBMIT');
    if (hasConversion) return 'customer';

    // Check contact source
    if (contact.source === 'leadpulse_conversion') return 'lead';

    // Check for engagement patterns
    const hasFormInteraction = touchpoints.some(tp => tp.type.includes('FORM'));
    if (hasFormInteraction) return 'lead';

    // Check recency
    const lastTouchpoint = touchpoints[0]?.timestamp;
    if (lastTouchpoint) {
      const daysSinceLastActivity = (Date.now() - new Date(lastTouchpoint).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastActivity > 30) return 'churned';
    }

    return 'visitor';
  }

  /**
   * Analyze device and location patterns
   */
  private analyzeDeviceInfo(visitors: any[]) {
    const devices = visitors.map(v => v.device).filter(Boolean);
    const browsers = visitors.map(v => v.browser).filter(Boolean);
    const locations = visitors.map(v => v.city ? `${v.city}, ${v.country}` : null).filter(Boolean);

    // Find most common device
    const deviceCounts = devices.reduce((acc, device) => {
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const primaryDevice = Object.entries(deviceCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';

    return {
      primaryDevice,
      browsers: [...new Set(browsers)],
      locations: [...new Set(locations)]
    };
  }

  /**
   * Analyze behavior patterns
   */
  private analyzeBehaviorPattern(touchpoints: any[]) {
    if (touchpoints.length === 0) {
      return {
        avgSessionDuration: 0,
        mostVisitedPages: [],
        conversionPath: []
      };
    }

    // Calculate average session duration
    const sessionDurations = touchpoints
      .filter(tp => tp.duration)
      .map(tp => tp.duration);
    const avgSessionDuration = sessionDurations.length > 0
      ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length
      : 0;

    // Find most visited pages
    const pageCounts = touchpoints.reduce((acc, tp) => {
      if (tp.url) {
        acc[tp.url] = (acc[tp.url] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const mostVisitedPages = Object.entries(pageCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([url]) => url);

    // Build conversion path (sequence leading to conversion)
    const conversionTouchpoint = touchpoints.find(tp => 
      tp.type === 'CONVERSION' || tp.type === 'FORM_SUBMIT'
    );

    let conversionPath: string[] = [];
    if (conversionTouchpoint) {
      const conversionTime = new Date(conversionTouchpoint.timestamp).getTime();
      const preConversionTouchpoints = touchpoints
        .filter(tp => new Date(tp.timestamp).getTime() < conversionTime)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(-5); // Last 5 touchpoints before conversion

      conversionPath = preConversionTouchpoints.map(tp => tp.url || tp.type);
    }

    return {
      avgSessionDuration,
      mostVisitedPages,
      conversionPath
    };
  }

  /**
   * Generate AI insights for contact
   */
  private async generateAIInsights(contact: any, visitors: any[], touchpoints: any[]): Promise<ContactLeadPulseData['aiInsights']> {
    // Calculate conversion probability based on engagement and behavior
    let conversionProbability = 0.1; // Base 10%

    // Engagement factor
    const avgEngagement = visitors.reduce((sum, v) => sum + (v.engagementScore || 0), 0) / visitors.length;
    conversionProbability += (avgEngagement / 100) * 0.4;

    // Session frequency factor
    conversionProbability += Math.min(visitors.length * 0.05, 0.3);

    // Form interaction factor
    const hasFormInteraction = touchpoints.some(tp => tp.type.includes('FORM'));
    if (hasFormInteraction) conversionProbability += 0.25;

    // Time factor (recent activity)
    const latestActivity = Math.max(...touchpoints.map(tp => new Date(tp.timestamp).getTime()));
    const daysSinceLastActivity = (Date.now() - latestActivity) / (1000 * 60 * 60 * 24);
    if (daysSinceLastActivity < 7) conversionProbability += 0.1;

    conversionProbability = Math.min(0.95, conversionProbability);

    // Calculate churn risk
    let churnRisk = 0.1; // Base 10%
    if (daysSinceLastActivity > 30) churnRisk += 0.4;
    if (daysSinceLastActivity > 60) churnRisk += 0.3;
    if (avgEngagement < 30) churnRisk += 0.2;
    churnRisk = Math.min(0.9, churnRisk);

    // Determine next best action
    let nextBestAction = 'Monitor activity';
    if (conversionProbability > 0.7) {
      nextBestAction = 'Immediate sales outreach';
    } else if (conversionProbability > 0.4) {
      nextBestAction = 'Send targeted email campaign';
    } else if (churnRisk > 0.6) {
      nextBestAction = 'Re-engagement campaign';
    }

    // Segment prediction
    let segmentPrediction = 'individual';
    if (contact.company) segmentPrediction = 'startup';
    if (avgEngagement > 70 && contact.company) segmentPrediction = 'enterprise';

    return {
      conversionProbability: Math.round(conversionProbability * 100) / 100,
      churnRisk: Math.round(churnRisk * 100) / 100,
      nextBestAction,
      segmentPrediction
    };
  }

  /**
   * Sync all contacts with LeadPulse insights
   */
  async syncAllContactsWithLeadPulse(): Promise<{
    processed: number;
    updated: number;
    errors: number;
  }> {
    let processed = 0;
    let updated = 0;
    let errors = 0;

    try {
      const contacts = await prisma.contact.findMany({
        where: {
          leadPulseVisitors: {
            some: {}
          }
        },
        select: { id: true }
      });

      for (const contact of contacts) {
        try {
          await this.updateContactWithLeadPulseInsights(contact.id);
          updated++;
        } catch (error) {
          console.error(`Error updating contact ${contact.id}:`, error);
          errors++;
        }
        processed++;
      }

      console.log(`Contact-LeadPulse sync complete: ${processed} processed, ${updated} updated, ${errors} errors`);

    } catch (error) {
      console.error('Error in sync process:', error);
      errors++;
    }

    return { processed, updated, errors };
  }
}

export const contactLeadPulseIntegration = new ContactLeadPulseIntegration();
export default contactLeadPulseIntegration;