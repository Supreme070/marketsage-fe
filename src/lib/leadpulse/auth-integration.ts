/**
 * LeadPulse Authentication Integration Service
 * 
 * Provides end-to-end customer journey tracking by linking anonymous visitors
 * with authenticated users to create comprehensive customer profiles.
 */

// NOTE: Prisma removed - using backend API (Contact, AnonymousVisitor, LeadPulseVisitor, LeadPulseTouchpoint, CustomerProfile exist in backend)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { leadPulseRealtimeService } from '@/lib/websocket/leadpulse-realtime';
import { leadPulseCache } from '@/lib/cache/leadpulse-cache';

export interface AuthenticatedVisitor {
  id: string;
  fingerprint: string;
  userId: string;
  email: string;
  contactId: string;
  organizationId: string;
  isAuthenticated: true;
  authenticationDate: Date;
  authenticationMethod: 'signin' | 'signup' | 'sso' | 'token_refresh';
  sessionId: string;
  
  // Inherited from anonymous visitor
  firstVisit: Date;
  totalVisits: number;
  engagementScore: number;
  
  // Journey tracking
  journeyStages: string[];
  currentStage: string;
  conversionEvents: string[];
  
  // Profile enrichment
  profile: {
    firstName?: string;
    lastName?: string;
    company?: string;
    jobTitle?: string;
    industry?: string;
    customFields?: Record<string, any>;
  };
}

export interface AuthenticationEvent {
  type: 'authentication_successful' | 'authentication_failed' | 'session_created' | 'session_expired';
  visitorId: string;
  userId?: string;
  email?: string;
  timestamp: Date;
  metadata: {
    method: string;
    ip: string;
    userAgent: string;
    sessionId?: string;
    previouslyAnonymous: boolean;
  };
}

export interface VisitorJourneyMergeResult {
  success: boolean;
  authenticatedVisitor: AuthenticatedVisitor | null;
  mergedData: {
    touchpoints: number;
    formSubmissions: number;
    pageViews: number;
    engagementScore: number;
  };
  journeyPhases: {
    anonymous: {
      duration: number; // milliseconds
      touchpoints: number;
      pages: string[];
    };
    authenticated: {
      duration: number;
      touchpoints: number;
      actions: string[];
    };
  };
}

export class LeadPulseAuthIntegration {
  private static instance: LeadPulseAuthIntegration;
  
  static getInstance(): LeadPulseAuthIntegration {
    if (!LeadPulseAuthIntegration.instance) {
      LeadPulseAuthIntegration.instance = new LeadPulseAuthIntegration();
    }
    return LeadPulseAuthIntegration.instance;
  }

  /**
   * Process authentication event and link visitor to authenticated user
   */
  async processAuthenticationEvent(
    visitorFingerprint: string,
    sessionId: string,
    authMethod: 'signin' | 'signup' | 'sso' | 'token_refresh' = 'signin'
  ): Promise<VisitorJourneyMergeResult> {
    try {
      // Get current authenticated session
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        logger.warn('Authentication integration called without valid session');
        return this.createFailedResult();
      }

      // Find or create contact for the authenticated user
      const contactResponse = await fetch(`${BACKEND_URL}/api/v2/contacts?email=${encodeURIComponent(session.user.email!)}&organizationId=${session.user.organizationId}&limit=1`);
      if (!contactResponse.ok) {
        throw new Error(`Failed to check contact: ${contactResponse.status}`);
      }
      const existingContacts = await contactResponse.json();
      let contact = existingContacts[0];

      if (!contact) {
        // Create new contact for authenticated user
        const createResponse = await fetch(`${BACKEND_URL}/api/v2/contacts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: session.user.email!,
            firstName: session.user.name?.split(' ')[0],
            lastName: session.user.name?.split(' ').slice(1).join(' '),
            organizationId: session.user.organizationId,
            createdById: session.user.id,
            source: 'leadpulse_auth',
            status: 'ACTIVE'
          })
        });
        if (!createResponse.ok) {
          throw new Error(`Failed to create contact: ${createResponse.status}`);
        }
        contact = await createResponse.json();
      }

      // Find the anonymous visitor
      const anonResponse = await fetch(`${BACKEND_URL}/api/v2/anonymous-visitors?fingerprint=${visitorFingerprint}&limit=1`);
      if (!anonResponse.ok) {
        throw new Error(`Failed to fetch anonymous visitor: ${anonResponse.status}`);
      }
      const anonVisitors = await anonResponse.json();
      const anonymousVisitor = anonVisitors[0];

      if (!anonymousVisitor) {
        logger.warn('Anonymous visitor not found for authentication integration', {
          fingerprint: visitorFingerprint,
          userId: session.user.id
        });
        return this.createFailedResult();
      }

      // Fetch touchpoints for anonymous visitor
      const touchpointsResponse = await fetch(`${BACKEND_URL}/api/v2/touchpoints?anonymousVisitorId=${anonymousVisitor.id}`);
      const LeadPulseTouchpoint = touchpointsResponse.ok ? await touchpointsResponse.json() : [];

      // Create or update LeadPulse visitor with authentication data
      const upsertData = {
        fingerprint: visitorFingerprint,
        updateData: {
          metadata: {
            ...((anonymousVisitor.metadata as any) || {}),
            authenticatedUserId: session.user.id,
            contactId: contact.id,
            authenticationDate: new Date().toISOString(),
            authenticationMethod: authMethod,
            sessionId: sessionId,
            isAuthenticated: true
          },
          lastVisit: new Date(),
          engagementScore: Math.max(
            anonymousVisitor.engagementScore + 25, // Authentication bonus
            100
          )
        },
        createData: {
          fingerprint: visitorFingerprint,
          ipAddress: anonymousVisitor.ipAddress,
          userAgent: anonymousVisitor.userAgent,
          firstVisit: anonymousVisitor.firstVisit,
          lastVisit: new Date(),
          totalVisits: anonymousVisitor.totalVisits,
          engagementScore: Math.max(anonymousVisitor.engagementScore + 25, 100),
          city: anonymousVisitor.city,
          country: anonymousVisitor.country,
          region: anonymousVisitor.region,
          latitude: anonymousVisitor.latitude,
          longitude: anonymousVisitor.longitude,
          metadata: {
            authenticatedUserId: session.user.id,
            contactId: contact.id,
            authenticationDate: new Date().toISOString(),
            authenticationMethod: authMethod,
            sessionId: sessionId,
            isAuthenticated: true
          }
        }
      };

      const visitorUpsertResponse = await fetch(`${BACKEND_URL}/api/v2/visitors/upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(upsertData)
      });
      if (!visitorUpsertResponse.ok) {
        throw new Error(`Failed to upsert visitor: ${visitorUpsertResponse.status}`);
      }
      const leadPulseVisitor = await visitorUpsertResponse.json();

      // Link anonymous visitor to contact
      const linkResponse = await fetch(`${BACKEND_URL}/api/v2/anonymous-visitors/${anonymousVisitor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: contact.id })
      });
      if (!linkResponse.ok) {
        throw new Error(`Failed to link visitor to contact: ${linkResponse.status}`);
      }

      // Get existing customer profile if any
      const profileCheckResponse = await fetch(`${BACKEND_URL}/api/v2/customer-profiles?contactId=${contact.id}&limit=1`);
      const existingProfiles = profileCheckResponse.ok ? await profileCheckResponse.json() : [];
      const existingProfile = existingProfiles[0];

      const pageViewCount = LeadPulseTouchpoint.filter((t: any) => t.type === 'PAGEVIEW').length;

      // Create or update customer profile
      let customerProfile;
      if (existingProfile) {
        const updateProfileResponse = await fetch(`${BACKEND_URL}/api/v2/customer-profiles/${existingProfile.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lastSeenDate: new Date(),
            totalPageViews: existingProfile.totalPageViews + pageViewCount,
            engagementScore: Math.min(
              (existingProfile.engagementScore || 0) + Math.floor(anonymousVisitor.engagementScore / 10),
              100
            )
          })
        });
        if (!updateProfileResponse.ok) {
          throw new Error(`Failed to update customer profile: ${updateProfileResponse.status}`);
        }
        customerProfile = await updateProfileResponse.json();
      } else {
        const createProfileResponse = await fetch(`${BACKEND_URL}/api/v2/customer-profiles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contactId: contact.id,
            organizationId: session.user.organizationId,
            engagementScore: Math.floor(anonymousVisitor.engagementScore / 10),
            lastSeenDate: new Date(),
            totalPageViews: pageViewCount,
            totalEmailOpens: 0,
            totalEmailClicks: 0,
            totalSMSResponses: 0,
            preferredChannel: 'web'
          })
        });
        if (!createProfileResponse.ok) {
          throw new Error(`Failed to create customer profile: ${createProfileResponse.status}`);
        }
        customerProfile = await createProfileResponse.json();
      }

      // Create authentication touchpoint
      const touchpointCreateResponse = await fetch(`${BACKEND_URL}/api/v2/touchpoints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CONVERSION',
          visitorId: leadPulseVisitor.fingerprint,
          metadata: {
            event: 'user_authentication',
            method: authMethod,
            userId: session.user.id,
            contactId: contact.id,
            sessionId: sessionId
          },
          url: '/auth/signin',
          title: 'User Authentication',
          timestamp: new Date()
        })
      });
      if (!touchpointCreateResponse.ok) {
        throw new Error(`Failed to create authentication touchpoint: ${touchpointCreateResponse.status}`);
      }

      // Update journey stages
      const journeyStages = ['anonymous', 'authenticated'];
      const currentStage = 'authenticated';

      // Calculate journey phases
      const anonymousPhase = {
        duration: new Date().getTime() - anonymousVisitor.firstVisit.getTime(),
        touchpoints: LeadPulseTouchpoint.length,
        pages: [...new Set(LeadPulseTouchpoint
          .filter((t: any) => t.type === 'PAGEVIEW')
          .map((t: any) => t.url || '')
          .filter(Boolean))]
      };

      const authenticatedPhase = {
        duration: 0, // Just authenticated
        touchpoints: 1, // Authentication event
        actions: ['authentication']
      };

      // Create authentication event
      const authEvent: AuthenticationEvent = {
        type: 'authentication_successful',
        visitorId: leadPulseVisitor.fingerprint,
        userId: session.user.id,
        email: session.user.email!,
        timestamp: new Date(),
        metadata: {
          method: authMethod,
          ip: anonymousVisitor.ipAddress || 'unknown',
          userAgent: anonymousVisitor.userAgent || 'unknown',
          sessionId: sessionId,
          previouslyAnonymous: true
        }
      };

      // Broadcast authentication event
      await leadPulseRealtimeService.broadcast('authentication_event', authEvent);

      // Update cache
      await leadPulseCache.invalidateVisitorCache(visitorFingerprint);

      // Create result
      const authenticatedVisitor: AuthenticatedVisitor = {
        id: leadPulseVisitor.id,
        fingerprint: leadPulseVisitor.fingerprint,
        userId: session.user.id,
        email: session.user.email!,
        contactId: contact.id,
        organizationId: session.user.organizationId,
        isAuthenticated: true,
        authenticationDate: new Date(),
        authenticationMethod: authMethod,
        sessionId: sessionId,
        firstVisit: anonymousVisitor.firstVisit,
        totalVisits: anonymousVisitor.totalVisits,
        engagementScore: leadPulseVisitor.engagementScore,
        journeyStages: journeyStages,
        currentStage: currentStage,
        conversionEvents: ['authentication'],
        profile: {
          firstName: contact.firstName || undefined,
          lastName: contact.lastName || undefined,
          company: contact.company || undefined,
          jobTitle: contact.jobTitle || undefined,
          customFields: contact.customFields ? JSON.parse(contact.customFields) : undefined
        }
      };

      const result: VisitorJourneyMergeResult = {
        success: true,
        authenticatedVisitor,
        mergedData: {
          touchpoints: LeadPulseTouchpoint.length + 1,
          formSubmissions: 0, // TODO: Count form submissions
          pageViews: LeadPulseTouchpoint.filter((t: any) => t.type === 'PAGEVIEW').length,
          engagementScore: leadPulseVisitor.engagementScore
        },
        journeyPhases: {
          anonymous: anonymousPhase,
          authenticated: authenticatedPhase
        }
      };

      logger.info('Authentication integration successful', {
        visitorId: leadPulseVisitor.fingerprint,
        userId: session.user.id,
        contactId: contact.id,
        engagementScore: leadPulseVisitor.engagementScore
      });

      return result;

    } catch (error) {
      logger.error('Authentication integration failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fingerprint: visitorFingerprint,
        sessionId: sessionId
      });

      return this.createFailedResult();
    }
  }

  /**
   * Get authenticated visitor data
   */
  async getAuthenticatedVisitor(visitorFingerprint: string): Promise<AuthenticatedVisitor | null> {
    try {
      const visitorResponse = await fetch(`${BACKEND_URL}/api/v2/visitors?fingerprint=${visitorFingerprint}&limit=1`);
      if (!visitorResponse.ok) {
        return null;
      }
      const visitors = await visitorResponse.json();
      const visitor = visitors[0];

      if (!visitor || !visitor.metadata || !(visitor.metadata as any).isAuthenticated) {
        return null;
      }

      const metadata = visitor.metadata as any;
      const contactResponse = await fetch(`${BACKEND_URL}/api/v2/contacts/${metadata.contactId}`);
      if (!contactResponse.ok) {
        return null;
      }
      const contact = await contactResponse.json();

      if (!contact) {
        return null;
      }

      return {
        id: visitor.id,
        fingerprint: visitor.fingerprint,
        userId: metadata.authenticatedUserId,
        email: contact.email,
        contactId: contact.id,
        organizationId: contact.organizationId!,
        isAuthenticated: true,
        authenticationDate: new Date(metadata.authenticationDate),
        authenticationMethod: metadata.authenticationMethod,
        sessionId: metadata.sessionId,
        firstVisit: visitor.firstVisit,
        totalVisits: visitor.totalVisits,
        engagementScore: visitor.engagementScore,
        journeyStages: ['anonymous', 'authenticated'],
        currentStage: 'authenticated',
        conversionEvents: ['authentication'],
        profile: {
          firstName: contact.firstName || undefined,
          lastName: contact.lastName || undefined,
          company: contact.company || undefined,
          jobTitle: contact.jobTitle || undefined,
          customFields: contact.customFields ? JSON.parse(contact.customFields) : undefined
        }
      };

    } catch (error) {
      logger.error('Failed to get authenticated visitor', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fingerprint: visitorFingerprint
      });

      return null;
    }
  }

  /**
   * Track authenticated user action
   */
  async trackAuthenticatedAction(
    visitorFingerprint: string,
    action: string,
    metadata: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      const authenticatedVisitor = await this.getAuthenticatedVisitor(visitorFingerprint);
      if (!authenticatedVisitor) {
        return false;
      }

      // Create touchpoint for authenticated action
      const touchpointResponse = await fetch(`${BACKEND_URL}/api/v2/touchpoints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CLICK',
          visitorId: visitorFingerprint,
          metadata: {
            action: action,
            authenticated: true,
            userId: authenticatedVisitor.userId,
            contactId: authenticatedVisitor.contactId,
            ...metadata
          },
          url: metadata.url || '/dashboard',
          title: `Authenticated Action: ${action}`,
          timestamp: new Date()
        })
      });
      if (!touchpointResponse.ok) {
        throw new Error(`Failed to create touchpoint: ${touchpointResponse.status}`);
      }

      // Get current visitor data
      const currentVisitorResponse = await fetch(`${BACKEND_URL}/api/v2/visitors?fingerprint=${visitorFingerprint}&limit=1`);
      if (!currentVisitorResponse.ok) {
        throw new Error(`Failed to fetch visitor: ${currentVisitorResponse.status}`);
      }
      const currentVisitors = await currentVisitorResponse.json();
      const currentVisitor = currentVisitors[0];

      // Update engagement score
      const updateResponse = await fetch(`${BACKEND_URL}/api/v2/visitors/${currentVisitor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engagementScore: currentVisitor.engagementScore + 5, // Authenticated actions are more valuable
          lastVisit: new Date()
        })
      });
      if (!updateResponse.ok) {
        throw new Error(`Failed to update visitor: ${updateResponse.status}`);
      }

      return true;

    } catch (error) {
      logger.error('Failed to track authenticated action', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fingerprint: visitorFingerprint,
        action
      });

      return false;
    }
  }

  /**
   * Get customer journey timeline
   */
  async getCustomerJourneyTimeline(contactId: string): Promise<any[]> {
    try {
      const contactResponse = await fetch(`${BACKEND_URL}/api/v2/contacts/${contactId}`);
      if (!contactResponse.ok) {
        return [];
      }
      const contact = await contactResponse.json();

      if (!contact) {
        return [];
      }

      // Get anonymous visitor data
      const anonVisitorResponse = await fetch(`${BACKEND_URL}/api/v2/anonymous-visitors?contactId=${contactId}&limit=1`);
      const anonVisitors = anonVisitorResponse.ok ? await anonVisitorResponse.json() : [];
      const anonymousVisitor = anonVisitors[0];

      let LeadPulseTouchpoint: any[] = [];
      if (anonymousVisitor) {
        const touchpointsResponse = await fetch(`${BACKEND_URL}/api/v2/touchpoints?anonymousVisitorId=${anonymousVisitor.id}&sortBy=timestamp&order=asc`);
        if (touchpointsResponse.ok) {
          LeadPulseTouchpoint = await touchpointsResponse.json();
        }
      }

      // Get authenticated visitor data
      const authVisitorResponse = await fetch(`${BACKEND_URL}/api/v2/visitors?contactId=${contactId}&limit=1`);
      const authVisitors = authVisitorResponse.ok ? await authVisitorResponse.json() : [];
      const leadPulseVisitor = authVisitors[0];

      let touchpoints: any[] = [];
      if (leadPulseVisitor) {
        const touchpointsResponse = await fetch(`${BACKEND_URL}/api/v2/touchpoints?visitorId=${leadPulseVisitor.id}&sortBy=timestamp&order=asc`);
        if (touchpointsResponse.ok) {
          touchpoints = await touchpointsResponse.json();
        }
      }

      const timeline = [];

      // Add anonymous touchpoints
      if (anonymousVisitor) {
        timeline.push({
          phase: 'anonymous',
          startDate: anonymousVisitor.firstVisit,
          endDate: anonymousVisitor.lastVisit,
          touchpoints: LeadPulseTouchpoint.map((t: any) => ({
            type: t.type,
            timestamp: t.timestamp,
            url: t.url,
            title: t.title,
            metadata: t.metadata
          }))
        });
      }

      // Add authenticated touchpoints
      if (leadPulseVisitor) {
        timeline.push({
          phase: 'authenticated',
          startDate: leadPulseVisitor.firstVisit,
          endDate: leadPulseVisitor.lastVisit,
          touchpoints: touchpoints.map((t: any) => ({
            type: t.type,
            timestamp: t.timestamp,
            url: t.url,
            title: t.title,
            metadata: t.metadata
          }))
        });
      }

      return timeline;

    } catch (error) {
      logger.error('Failed to get customer journey timeline', {
        error: error instanceof Error ? error.message : 'Unknown error',
        contactId
      });

      return [];
    }
  }

  private createFailedResult(): VisitorJourneyMergeResult {
    return {
      success: false,
      authenticatedVisitor: null,
      mergedData: {
        touchpoints: 0,
        formSubmissions: 0,
        pageViews: 0,
        engagementScore: 0
      },
      journeyPhases: {
        anonymous: {
          duration: 0,
          touchpoints: 0,
          pages: []
        },
        authenticated: {
          duration: 0,
          touchpoints: 0,
          actions: []
        }
      }
    };
  }
}

export const leadPulseAuthIntegration = LeadPulseAuthIntegration.getInstance();
export default leadPulseAuthIntegration;