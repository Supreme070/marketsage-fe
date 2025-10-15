/**
 * Visitor → Customer Conversion Bridge
 * Links anonymous visitor sessions to known customer records
 */

// NOTE: Prisma removed - using backend API (Contact, LeadPulseVisitor exist in backend)
import { visitorTracker } from './visitor-tracking';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';

export interface ConversionEvent {
  visitorId: string;
  sessionId: string;
  conversionType: 'form_submit' | 'signup' | 'contact' | 'demo_request' | 'purchase';
  formData: Record<string, any>;
  contactId?: string;
  leadScore?: number;
  metadata?: Record<string, any>;
}

export interface CustomerJourney {
  customerId: string;
  contactId: string;
  email: string;
  name?: string;
  company?: string;
  anonymousSessions: AnonymousSession[];
  conversionEvent: ConversionEvent;
  totalTouchpoints: number;
  journeyDuration: number; // milliseconds from first visit to conversion
  engagementScore: number;
  predictedValue?: number;
  stage: 'visitor' | 'lead' | 'customer' | 'churned';
}

export interface AnonymousSession {
  visitorId: string;
  sessionId: string;
  startTime: Date;
  endTime: Date;
  touchpoints: TouchpointSummary[];
  device: string;
  location: string;
  engagementScore: number;
}

export interface TouchpointSummary {
  type: string;
  url: string;
  timestamp: Date;
  value: number;
  duration?: number;
}

class ConversionBridge {
  /**
   * Convert anonymous visitor to known customer
   */
  async convertVisitorToCustomer(conversionData: {
    email: string;
    name?: string;
    company?: string;
    phone?: string;
    formData: Record<string, any>;
    conversionType: ConversionEvent['conversionType'];
    metadata?: Record<string, any>;
  }): Promise<CustomerJourney> {
    
    const visitorIdentity = visitorTracker.getVisitorIdentity();
    
    try {
      // 1. Find or create contact record via backend API
      let contactResponse = await fetch(`${BACKEND_URL}/api/v2/contacts?email=${encodeURIComponent(conversionData.email)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      let contact;

      if (contactResponse.ok) {
        const contacts = await contactResponse.json();
        contact = contacts[0]; // Get first match
      }

      if (!contact) {
        const createResponse = await fetch(`${BACKEND_URL}/api/v2/contacts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: conversionData.email,
            firstName: conversionData.name?.split(' ')[0] || '',
            lastName: conversionData.name?.split(' ').slice(1).join(' ') || '',
            company: conversionData.company,
            phone: conversionData.phone,
            status: 'ACTIVE',
            source: 'leadpulse_conversion',
            tags: ['leadpulse-generated'],
            metadata: {
              leadpulseConversion: true,
              conversionType: conversionData.conversionType,
              originalVisitorId: visitorIdentity.visitorId,
              conversionDate: new Date().toISOString()
            }
          })
        });

        if (!createResponse.ok) {
          throw new Error(`Failed to create contact: ${createResponse.status}`);
        }

        contact = await createResponse.json();
      }

      // 2. Get all anonymous sessions for this visitor
      const anonymousSessions = await this.getAnonymousVisitorHistory(visitorIdentity.visitorId);

      // 3. Create conversion event record
      const conversionEvent: ConversionEvent = {
        visitorId: visitorIdentity.visitorId,
        sessionId: visitorIdentity.sessionId,
        conversionType: conversionData.conversionType,
        formData: conversionData.formData,
        contactId: contact.id,
        metadata: {
          ...conversionData.metadata,
          convertedAt: new Date().toISOString(),
          trackingMethod: visitorIdentity.trackingMethod,
          consentLevel: visitorIdentity.consentLevel
        }
      };

      // 4. Update visitor record to link with contact via backend API
      const updateVisitorResponse = await fetch(`${BACKEND_URL}/api/v2/visitors/bulk-update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          where: {
            OR: [
              { fingerprint: visitorIdentity.visitorId },
              { fingerprint: visitorIdentity.fingerprint }
            ]
          },
          data: {
            contactId: contact.id,
            isConverted: true,
            conversionDate: new Date(),
            conversionType: conversionData.conversionType,
            metadata: {
              linkedToContact: true,
              contactEmail: contact.email,
              conversionEvent: conversionEvent
            }
          }
        })
      });

      if (!updateVisitorResponse.ok) {
        throw new Error(`Failed to update visitor records: ${updateVisitorResponse.status}`);
      }

      // 5. Create customer journey record
      const totalTouchpoints = anonymousSessions.reduce((sum, session) => sum + session.touchpoints.length, 0);
      const journeyDuration = this.calculateJourneyDuration(anonymousSessions);
      const engagementScore = this.calculateOverallEngagementScore(anonymousSessions);

      const customerJourney: CustomerJourney = {
        customerId: `customer_${contact.id}`,
        contactId: contact.id,
        email: contact.email,
        name: conversionData.name,
        company: conversionData.company,
        anonymousSessions,
        conversionEvent,
        totalTouchpoints,
        journeyDuration,
        engagementScore,
        predictedValue: this.predictCustomerValue(anonymousSessions, conversionData),
        stage: this.determineCustomerStage(conversionData.conversionType)
      };

      // 6. Store customer journey in database
      await this.storeCustomerJourney(customerJourney);

      // 7. Trigger follow-up actions (email sequences, notifications, etc.)
      await this.triggerPostConversionActions(customerJourney);

      return customerJourney;

    } catch (error) {
      console.error('Error converting visitor to customer:', error);
      throw new Error('Failed to convert visitor to customer');
    }
  }

  /**
   * Get all anonymous visitor history
   */
  private async getAnonymousVisitorHistory(visitorId: string): Promise<AnonymousSession[]> {
    const visitorFingerprint = visitorTracker.getVisitorIdentity().fingerprint;
    const response = await fetch(
      `${BACKEND_URL}/api/v2/visitors?fingerprint=${visitorId},${visitorFingerprint}&include=touchpoints&touchpointsOrderBy=timestamp:asc`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch visitor history: ${response.status}`);
    }

    const visitors = await response.json();

    return visitors.map(visitor => ({
      visitorId: visitor.fingerprint,
      sessionId: this.extractSessionId(visitor.metadata),
      startTime: visitor.firstVisit,
      endTime: visitor.lastVisit,
      device: `${visitor.device}, ${visitor.browser}`,
      location: visitor.city ? `${visitor.city}, ${visitor.country}` : 'Unknown',
      engagementScore: visitor.engagementScore || 0,
      touchpoints: visitor.touchpoints.map(tp => ({
        type: tp.type,
        url: tp.url,
        timestamp: tp.timestamp,
        value: tp.value || 1,
        duration: tp.duration
      }))
    }));
  }

  /**
   * Calculate total journey duration
   */
  private calculateJourneyDuration(sessions: AnonymousSession[]): number {
    if (sessions.length === 0) return 0;
    
    const firstVisit = Math.min(...sessions.map(s => s.startTime.getTime()));
    const lastVisit = Math.max(...sessions.map(s => s.endTime.getTime()));
    
    return lastVisit - firstVisit;
  }

  /**
   * Calculate overall engagement score
   */
  private calculateOverallEngagementScore(sessions: AnonymousSession[]): number {
    if (sessions.length === 0) return 0;
    
    const totalScore = sessions.reduce((sum, session) => sum + session.engagementScore, 0);
    const averageScore = totalScore / sessions.length;
    
    // Bonus for multiple sessions
    const sessionBonus = Math.min(sessions.length * 5, 25);
    
    return Math.min(100, Math.round(averageScore + sessionBonus));
  }

  /**
   * Predict customer value based on journey
   */
  private predictCustomerValue(sessions: AnonymousSession[], conversionData: any): number {
    let baseValue = 5000; // Base value in cents ($50)
    
    // Engagement factor
    const avgEngagement = sessions.reduce((sum, s) => sum + s.engagementScore, 0) / sessions.length;
    baseValue *= (avgEngagement / 50); // Scale by engagement
    
    // Session count factor
    baseValue *= Math.min(sessions.length * 0.3, 2.0);
    
    // Conversion type factor
    const conversionMultipliers = {
      'form_submit': 1.0,
      'contact': 1.2,
      'demo_request': 2.5,
      'signup': 1.5,
      'purchase': 5.0
    };
    baseValue *= conversionMultipliers[conversionData.conversionType] || 1.0;
    
    // Company factor
    if (conversionData.company) {
      baseValue *= 1.5; // Business customers worth more
    }
    
    return Math.round(baseValue);
  }

  /**
   * Determine customer stage
   */
  private determineCustomerStage(conversionType: ConversionEvent['conversionType']): CustomerJourney['stage'] {
    switch (conversionType) {
      case 'form_submit':
      case 'contact':
        return 'lead';
      case 'demo_request':
      case 'signup':
        return 'lead';
      case 'purchase':
        return 'customer';
      default:
        return 'visitor';
    }
  }

  /**
   * Store customer journey in database
   */
  private async storeCustomerJourney(journey: CustomerJourney): Promise<void> {
    // Store in a CustomerJourney table or in Contact metadata via backend API
    const response = await fetch(`${BACKEND_URL}/api/v2/contacts/${journey.contactId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metadata: {
          customerJourney: {
            totalTouchpoints: journey.totalTouchpoints,
            journeyDuration: journey.journeyDuration,
            engagementScore: journey.engagementScore,
            predictedValue: journey.predictedValue,
            stage: journey.stage,
            anonymousSessionCount: journey.anonymousSessions.length,
            conversionEvent: journey.conversionEvent,
            lastUpdated: new Date().toISOString()
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to store customer journey: ${response.status}`);
    }
  }

  /**
   * Trigger post-conversion actions
   */
  private async triggerPostConversionActions(journey: CustomerJourney): Promise<void> {
    try {
      // 1. Add to appropriate contact lists based on conversion type
      const listName = this.getListForConversionType(journey.conversionEvent.conversionType);
      if (listName) {
        // Find or create list and add contact
        // This would integrate with your existing contact list system
      }

      // 2. Trigger email sequences
      if (journey.stage === 'lead') {
        // Trigger nurture sequence
        console.log(`Triggering nurture sequence for ${journey.email}`);
      }

      // 3. Create tasks for sales team if high value
      if (journey.predictedValue && journey.predictedValue > 50000) { // $500+
        console.log(`Creating high-value lead task for ${journey.email}`);
        // Create task in your task management system
      }

      // 4. Send notifications
      console.log(`New customer journey created: ${journey.email} (${journey.conversionEvent.conversionType})`);

    } catch (error) {
      console.error('Error triggering post-conversion actions:', error);
    }
  }

  /**
   * Get list name for conversion type
   */
  private getListForConversionType(conversionType: ConversionEvent['conversionType']): string | null {
    const listMap = {
      'form_submit': 'Contact Form Leads',
      'contact': 'General Inquiries',
      'demo_request': 'Demo Requests',
      'signup': 'Trial Users',
      'purchase': 'Customers'
    };
    
    return listMap[conversionType] || null;
  }

  /**
   * Get customer journey for a contact
   */
  async getCustomerJourney(contactId: string): Promise<CustomerJourney | null> {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/v2/contacts/${contactId}?include=leadPulseVisitors.touchpoints&touchpointsOrderBy=timestamp:asc`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!response.ok) {
        return null;
      }

      const contact = await response.json();

      if (!contact || !contact.leadPulseVisitors.length) {
        return null;
      }

      // Reconstruct journey from stored data
      const journeyData = (contact.metadata as any)?.customerJourney;
      if (!journeyData) return null;

      const anonymousSessions = contact.leadPulseVisitors.map(visitor => ({
        visitorId: visitor.fingerprint,
        sessionId: this.extractSessionId(visitor.metadata),
        startTime: visitor.firstVisit,
        endTime: visitor.lastVisit,
        device: `${visitor.device}, ${visitor.browser}`,
        location: visitor.city ? `${visitor.city}, ${visitor.country}` : 'Unknown',
        engagementScore: visitor.engagementScore || 0,
        touchpoints: visitor.touchpoints.map(tp => ({
          type: tp.type,
          url: tp.url,
          timestamp: tp.timestamp,
          value: tp.value || 1,
          duration: tp.duration
        }))
      }));

      return {
        customerId: `customer_${contact.id}`,
        contactId: contact.id,
        email: contact.email,
        name: contact.firstName ? `${contact.firstName} ${contact.lastName}`.trim() : undefined,
        company: contact.company || undefined,
        anonymousSessions,
        conversionEvent: journeyData.conversionEvent,
        totalTouchpoints: journeyData.totalTouchpoints,
        journeyDuration: journeyData.journeyDuration,
        engagementScore: journeyData.engagementScore,
        predictedValue: journeyData.predictedValue,
        stage: journeyData.stage
      };

    } catch (error) {
      console.error('Error getting customer journey:', error);
      return null;
    }
  }

  /**
   * Extract session ID from metadata
   */
  private extractSessionId(metadata: any): string {
    return metadata?.sessionId || metadata?.originalSessionId || 'unknown-session';
  }

  /**
   * Get conversion analytics
   */
  async getConversionAnalytics(timeRange = '30d'): Promise<{
    totalConversions: number;
    conversionRate: number;
    averageJourneyDuration: number;
    topConversionTypes: Array<{ type: string; count: number; rate: number }>;
    averageEngagementScore: number;
    totalPredictedValue: number;
  }> {
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const [totalVisitorsResponse, convertedContactsResponse] = await Promise.all([
      fetch(
        `${BACKEND_URL}/api/v2/visitors/count?firstVisit[gte]=${startDate.toISOString()}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      ),
      fetch(
        `${BACKEND_URL}/api/v2/contacts?createdAt[gte]=${startDate.toISOString()}&source=leadpulse_conversion`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      )
    ]);

    if (!totalVisitorsResponse.ok || !convertedContactsResponse.ok) {
      throw new Error('Failed to fetch conversion analytics');
    }

    const { count: totalVisitors } = await totalVisitorsResponse.json();
    const convertedContacts = await convertedContactsResponse.json();

    const totalConversions = convertedContacts.length;
    const conversionRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0;

    // Calculate averages from stored journey data
    const journeyData = convertedContacts
      .map(c => (c.metadata as any)?.customerJourney)
      .filter(Boolean);

    const averageJourneyDuration = journeyData.length > 0
      ? journeyData.reduce((sum, j) => sum + (j.journeyDuration || 0), 0) / journeyData.length
      : 0;

    const averageEngagementScore = journeyData.length > 0
      ? journeyData.reduce((sum, j) => sum + (j.engagementScore || 0), 0) / journeyData.length
      : 0;

    const totalPredictedValue = journeyData.reduce((sum, j) => sum + (j.predictedValue || 0), 0);

    // Get conversion type breakdown
    const conversionTypes = journeyData.reduce((acc, j) => {
      const type = j.conversionEvent?.conversionType || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topConversionTypes = Object.entries(conversionTypes)
      .map(([type, count]) => ({
        type,
        count,
        rate: (count / totalConversions) * 100
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalConversions,
      conversionRate,
      averageJourneyDuration,
      topConversionTypes,
      averageEngagementScore,
      totalPredictedValue
    };
  }
}

export const conversionBridge = new ConversionBridge();
export default conversionBridge;