/**
 * LeadPulse Authentication Integration Service
 * 
 * Provides end-to-end customer journey tracking by linking anonymous visitors
 * with authenticated users to create comprehensive customer profiles.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
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
      let contact = await prisma.contact.findFirst({
        where: {
          email: session.user.email!,
          organizationId: session.user.organizationId
        },
        include: {
          customerProfile: true
        }
      });

      if (!contact) {
        // Create new contact for authenticated user
        contact = await prisma.contact.create({
          data: {
            email: session.user.email!,
            firstName: session.user.name?.split(' ')[0],
            lastName: session.user.name?.split(' ').slice(1).join(' '),
            organizationId: session.user.organizationId,
            createdById: session.user.id,
            source: 'leadpulse_auth',
            status: 'ACTIVE'
          },
          include: {
            customerProfile: true
          }
        });
      }

      // Find the anonymous visitor
      const anonymousVisitor = await prisma.anonymousVisitor.findFirst({
        where: { fingerprint: visitorFingerprint },
        include: {
          LeadPulseTouchpoint: true,
          LeadPulseJourney: true
        }
      });

      if (!anonymousVisitor) {
        logger.warn('Anonymous visitor not found for authentication integration', {
          fingerprint: visitorFingerprint,
          userId: session.user.id
        });
        return this.createFailedResult();
      }

      // Create or update LeadPulse visitor with authentication data
      const leadPulseVisitor = await prisma.leadPulseVisitor.upsert({
        where: { fingerprint: visitorFingerprint },
        update: {
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
        create: {
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
      });

      // Link anonymous visitor to contact
      await prisma.anonymousVisitor.update({
        where: { id: anonymousVisitor.id },
        data: { contactId: contact.id }
      });

      // Create or update customer profile
      const customerProfile = await prisma.customerProfile.upsert({
        where: { contactId: contact.id },
        update: {
          lastSeenDate: new Date(),
          totalPageViews: {
            increment: anonymousVisitor.LeadPulseTouchpoint.filter(t => t.type === 'PAGEVIEW').length
          },
          engagementScore: Math.min(
            (contact.customerProfile?.engagementScore || 0) + 
            Math.floor(anonymousVisitor.engagementScore / 10),
            100
          )
        },
        create: {
          contactId: contact.id,
          organizationId: session.user.organizationId,
          engagementScore: Math.floor(anonymousVisitor.engagementScore / 10),
          lastSeenDate: new Date(),
          totalPageViews: anonymousVisitor.LeadPulseTouchpoint.filter(t => t.type === 'PAGEVIEW').length,
          totalEmailOpens: 0,
          totalEmailClicks: 0,
          totalSMSResponses: 0,
          preferredChannel: 'web'
        }
      });

      // Create authentication touchpoint
      await prisma.leadPulseTouchpoint.create({
        data: {
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
        }
      });

      // Update journey stages
      const journeyStages = ['anonymous', 'authenticated'];
      const currentStage = 'authenticated';

      // Calculate journey phases
      const anonymousPhase = {
        duration: new Date().getTime() - anonymousVisitor.firstVisit.getTime(),
        touchpoints: anonymousVisitor.LeadPulseTouchpoint.length,
        pages: [...new Set(anonymousVisitor.LeadPulseTouchpoint
          .filter(t => t.type === 'PAGEVIEW')
          .map(t => t.url || '')
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
          touchpoints: anonymousVisitor.LeadPulseTouchpoint.length + 1,
          formSubmissions: 0, // TODO: Count form submissions
          pageViews: anonymousVisitor.LeadPulseTouchpoint.filter(t => t.type === 'PAGEVIEW').length,
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
      const visitor = await prisma.leadPulseVisitor.findUnique({
        where: { fingerprint: visitorFingerprint },
        include: {
          touchpoints: {
            orderBy: { timestamp: 'desc' },
            take: 50
          }
        }
      });

      if (!visitor || !visitor.metadata || !(visitor.metadata as any).isAuthenticated) {
        return null;
      }

      const metadata = visitor.metadata as any;
      const contact = await prisma.contact.findUnique({
        where: { id: metadata.contactId },
        include: {
          customerProfile: true
        }
      });

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
      await prisma.leadPulseTouchpoint.create({
        data: {
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
        }
      });

      // Update engagement score
      await prisma.leadPulseVisitor.update({
        where: { fingerprint: visitorFingerprint },
        data: {
          engagementScore: {
            increment: 5 // Authenticated actions are more valuable
          },
          lastVisit: new Date()
        }
      });

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
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
        include: {
          formSubmissions: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      if (!contact) {
        return [];
      }

      // Get anonymous visitor data
      const anonymousVisitor = await prisma.anonymousVisitor.findFirst({
        where: { contactId: contactId },
        include: {
          LeadPulseTouchpoint: {
            orderBy: { timestamp: 'asc' }
          }
        }
      });

      // Get authenticated visitor data
      const leadPulseVisitor = await prisma.leadPulseVisitor.findFirst({
        where: {
          metadata: {
            path: ['contactId'],
            equals: contactId
          }
        },
        include: {
          touchpoints: {
            orderBy: { timestamp: 'asc' }
          }
        }
      });

      const timeline = [];

      // Add anonymous touchpoints
      if (anonymousVisitor) {
        timeline.push({
          phase: 'anonymous',
          startDate: anonymousVisitor.firstVisit,
          endDate: anonymousVisitor.lastVisit,
          touchpoints: anonymousVisitor.LeadPulseTouchpoint.map(t => ({
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
          touchpoints: leadPulseVisitor.touchpoints.map(t => ({
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