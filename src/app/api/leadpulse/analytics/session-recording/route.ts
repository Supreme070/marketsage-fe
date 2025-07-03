/**
 * Session Recording API
 * ====================
 * API endpoints for storing and retrieving session recordings
 * with privacy compliance and efficient data handling.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// Validation schemas
const sessionRecordingEventSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  timestamp: z.number(),
  type: z.enum(['dom_mutation', 'mouse_move', 'mouse_click', 'scroll', 'keyboard', 'viewport_change', 'page_load', 'form_interaction']),
  data: z.any(),
  privacy: z.object({
    masked: z.boolean(),
    reason: z.string().optional()
  }).optional()
});

const sessionRecordingSchema = z.object({
  sessionId: z.string(),
  visitorId: z.string(),
  events: z.array(sessionRecordingEventSchema)
});

// POST - Store session recording events
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = sessionRecordingSchema.parse(body);

    // Check if session recording exists
    let sessionRecording = await prisma.leadPulseAnalytics.findUnique({
      where: { sessionId: validatedData.sessionId }
    });

    if (!sessionRecording) {
      // Create new session recording
      sessionRecording = await prisma.leadPulseAnalytics.create({
        data: {
          sessionId: validatedData.sessionId,
          visitorId: validatedData.visitorId,
          page: 'unknown', // Will be updated with first page_load event
          startTime: new Date(),
          isNewVisitor: true,
          scrollAnalytics: {},
          clickHeatmap: {},
          behavioralInsights: {},
          engagementScore: 0,
          userIntent: 'browse',
          conversionProbability: 0,
          frustrationSignals: [],
          visitor: {
            connectOrCreate: {
              where: { fingerprint: validatedData.visitorId },
              create: {
                fingerprint: validatedData.visitorId,
                ipAddress: request.ip || 'unknown',
                userAgent: request.headers.get('user-agent') || 'unknown',
                country: 'unknown',
                city: 'unknown',
                coordinates: { lat: 0, lng: 0 },
                timezone: 'UTC',
                language: 'en',
                deviceType: 'desktop',
                operatingSystem: 'unknown',
                browser: 'unknown',
                referrer: 'direct',
                utmSource: null,
                utmMedium: null,
                utmCampaign: null,
                isBot: false,
                firstVisit: new Date(),
                lastVisit: new Date(),
                visitCount: 1,
                totalTimeSpent: 0,
                bounceRate: 0,
                avgSessionDuration: 0,
                conversionRate: 0,
                leadScore: 0,
                tags: [],
                metadata: {}
              }
            }
          }
        }
      });
    }

    // Process and store events
    const processedEvents = validatedData.events.map(event => {
      // Extract page info from page_load events
      if (event.type === 'page_load' && event.data.url) {
        // Update session with page info
        prisma.leadPulseAnalytics.update({
          where: { sessionId: validatedData.sessionId },
          data: {
            page: event.data.url,
            viewport: event.data.viewport || {}
          }
        }).catch(console.error);
      }

      return {
        eventId: event.id,
        timestamp: new Date(event.timestamp),
        type: event.type,
        data: event.data,
        privacy: event.privacy || null
      };
    });

    // Store events in session recording analytics
    const currentEvents = sessionRecording.scrollAnalytics as any;
    const updatedEvents = {
      ...currentEvents,
      sessionRecording: {
        events: [
          ...(currentEvents.sessionRecording?.events || []),
          ...processedEvents
        ],
        lastUpdated: new Date().toISOString()
      }
    };

    await prisma.leadPulseAnalytics.update({
      where: { sessionId: validatedData.sessionId },
      data: {
        scrollAnalytics: updatedEvents,
        updatedAt: new Date()
      }
    });

    // Update behavioral insights based on events
    await updateBehavioralInsights(validatedData.sessionId, validatedData.events);

    return NextResponse.json({
      success: true,
      eventsStored: validatedData.events.length,
      sessionId: validatedData.sessionId
    });

  } catch (error) {
    console.error('Error storing session recording:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data format', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to store session recording' },
      { status: 500 }
    );
  }
}

// GET - Retrieve session recordings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const visitorId = searchParams.get('visitorId');
    const limit = Math.min(Number.parseInt(searchParams.get('limit') || '50'), 100);
    const offset = Number.parseInt(searchParams.get('offset') || '0');

    if (sessionId) {
      // Get specific session recording
      const recording = await prisma.leadPulseAnalytics.findUnique({
        where: { sessionId },
        include: {
          visitor: {
            select: {
              fingerprint: true,
              country: true,
              city: true,
              deviceType: true,
              browser: true,
              operatingSystem: true,
              userAgent: true
            }
          }
        }
      });

      if (!recording) {
        return NextResponse.json(
          { error: 'Session recording not found' },
          { status: 404 }
        );
      }

      // Extract session recording events
      const events = (recording.scrollAnalytics as any)?.sessionRecording?.events || [];
      
      const sessionRecording = {
        sessionId: recording.sessionId,
        visitorId: recording.visitorId,
        startTime: recording.startTime.getTime(),
        endTime: recording.endTime?.getTime(),
        page: recording.page,
        viewport: recording.viewport || { width: 1920, height: 1080 },
        userAgent: recording.visitor?.userAgent || 'unknown',
        events: events.map((event: any) => ({
          id: event.eventId,
          sessionId: recording.sessionId,
          timestamp: new Date(event.timestamp).getTime(),
          type: event.type,
          data: event.data,
          privacy: event.privacy
        })),
        metadata: {
          totalEvents: events.length,
          duration: recording.endTime ? 
            recording.endTime.getTime() - recording.startTime.getTime() : 
            Date.now() - recording.startTime.getTime(),
          interactions: events.filter((e: any) => 
            ['mouse_click', 'keyboard', 'form_interaction'].includes(e.type)
          ).length,
          errors: events.filter((e: any) => e.type === 'error').length,
          formInteractions: events.filter((e: any) => e.type === 'form_interaction').length
        },
        privacy: {
          maskedFields: ['password', 'email', 'phone'],
          excludedElements: ['.sensitive', '[data-private]'],
          dataRetention: 30
        },
        visitor: recording.visitor
      };

      return NextResponse.json(sessionRecording);
    }

    // Get list of session recordings
    const recordings = await prisma.leadPulseAnalytics.findMany({
      where: visitorId ? { visitorId } : {},
      include: {
        visitor: {
          select: {
            fingerprint: true,
            country: true,
            city: true,
            deviceType: true,
            browser: true,
            operatingSystem: true
          }
        }
      },
      orderBy: { startTime: 'desc' },
      skip: offset,
      take: limit
    });

    const sessionRecordings = recordings.map(recording => {
      const events = (recording.scrollAnalytics as any)?.sessionRecording?.events || [];
      
      return {
        sessionId: recording.sessionId,
        visitorId: recording.visitorId,
        startTime: recording.startTime.getTime(),
        endTime: recording.endTime?.getTime(),
        page: recording.page,
        viewport: recording.viewport || { width: 1920, height: 1080 },
        metadata: {
          totalEvents: events.length,
          duration: recording.endTime ? 
            recording.endTime.getTime() - recording.startTime.getTime() : 
            Date.now() - recording.startTime.getTime(),
          interactions: events.filter((e: any) => 
            ['mouse_click', 'keyboard', 'form_interaction'].includes(e.type)
          ).length,
          errors: events.filter((e: any) => e.type === 'error').length,
          formInteractions: events.filter((e: any) => e.type === 'form_interaction').length
        },
        visitor: recording.visitor,
        engagementScore: recording.engagementScore,
        userIntent: recording.userIntent,
        conversionProbability: recording.conversionProbability,
        frustrationSignals: recording.frustrationSignals
      };
    });

    return NextResponse.json({
      recordings: sessionRecordings,
      total: recordings.length,
      offset,
      limit
    });

  } catch (error) {
    console.error('Error retrieving session recordings:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session recordings' },
      { status: 500 }
    );
  }
}

// Helper function to update behavioral insights
async function updateBehavioralInsights(sessionId: string, events: any[]) {
  try {
    // Calculate engagement score based on events
    const interactions = events.filter(e => 
      ['mouse_click', 'keyboard', 'form_interaction'].includes(e.type)
    ).length;
    
    const mouseMovements = events.filter(e => e.type === 'mouse_move').length;
    const scrollEvents = events.filter(e => e.type === 'scroll').length;
    const errors = events.filter(e => e.type === 'error').length;
    
    // Simple engagement scoring algorithm
    const engagementScore = Math.min(100, 
      (interactions * 10) + 
      (mouseMovements * 0.1) + 
      (scrollEvents * 2) - 
      (errors * 5)
    );
    
    // Determine user intent
    let userIntent = 'browse';
    if (interactions > 10) userIntent = 'engage';
    if (events.some(e => e.type === 'form_interaction')) userIntent = 'convert';
    
    // Calculate conversion probability
    const conversionProbability = Math.min(100, 
      (interactions * 2) + 
      (events.filter(e => e.type === 'form_interaction').length * 20)
    );
    
    // Detect frustration signals
    const frustrationSignals = [];
    if (errors > 0) frustrationSignals.push('JavaScript errors detected');
    if (events.filter(e => e.type === 'mouse_click' && e.data.rageCick).length > 0) {
      frustrationSignals.push('Rage clicks detected');
    }
    
    // Update analytics record
    await prisma.leadPulseAnalytics.update({
      where: { sessionId },
      data: {
        engagementScore: Math.round(engagementScore),
        userIntent,
        conversionProbability: Math.round(conversionProbability),
        frustrationSignals,
        behavioralInsights: {
          totalInteractions: interactions,
          mouseMovements,
          scrollEvents,
          errors,
          lastUpdated: new Date().toISOString()
        }
      }
    });
    
  } catch (error) {
    console.error('Error updating behavioral insights:', error);
  }
}

// DELETE - Remove session recording (for privacy compliance)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Delete session recording
    await prisma.leadPulseAnalytics.delete({
      where: { sessionId }
    });

    return NextResponse.json({
      success: true,
      message: 'Session recording deleted'
    });

  } catch (error) {
    console.error('Error deleting session recording:', error);
    return NextResponse.json(
      { error: 'Failed to delete session recording' },
      { status: 500 }
    );
  }
}