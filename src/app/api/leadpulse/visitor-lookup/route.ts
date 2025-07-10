import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { validateVisitorLookup, createValidationErrorResponse } from '@/lib/leadpulse/validation';
import { logger } from '@/lib/logger';

/**
 * Visitor Lookup API
 * Attempts to find existing visitor by device fingerprint
 * Used for visitor identity recovery across sessions
 */

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      logger.warn('Invalid JSON in visitor lookup request', {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      });
      
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    // Comprehensive data validation
    const validation = validateVisitorLookup(body);
    if (!validation.success) {
      logger.warn('Invalid visitor lookup data', {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
        error: validation.error,
        field: validation.error?.field,
      });
      
      return NextResponse.json(
        createValidationErrorResponse(validation),
        { status: 400 }
      );
    }
    
    // Use validated data
    const { fingerprint, visitorId, email, phone, includeJourney, includeTouchpoints, limit, offset } = validation.data;
    
    // At least one lookup criteria must be provided
    if (!fingerprint && !visitorId && !email && !phone) {
      logger.warn('No lookup criteria provided', {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      });
      
      return NextResponse.json(
        { error: 'At least one lookup criteria (fingerprint, visitorId, email, or phone) is required' },
        { status: 400 }
      );
    }

    // Build search criteria based on validated inputs
    const searchCriteria: any[] = [];
    
    if (fingerprint) {
      searchCriteria.push(
        { fingerprint },
        {
          metadata: {
            path: ['deviceFingerprint'],
            equals: fingerprint
          }
        }
      );
    }
    
    if (visitorId) {
      searchCriteria.push({ id: visitorId });
    }
    
    if (email) {
      searchCriteria.push({
        metadata: {
          path: ['email'],
          equals: email
        }
      });
    }
    
    if (phone) {
      searchCriteria.push({
        metadata: {
          path: ['phone'],
          equals: phone
        }
      });
    }
    
    // Look for existing visitor with the search criteria
    const existingVisitor = await prisma.leadPulseVisitor.findFirst({
      where: {
        OR: searchCriteria
      },
      select: {
        id: true,
        fingerprint: true,
        firstVisit: true,
        lastVisit: true,
        totalVisits: true,
        engagementScore: true,
        city: true,
        country: true,
        metadata: true,
        ...(includeTouchpoints && {
          touchpoints: {
            take: limit || 50,
            skip: offset || 0,
            orderBy: { timestamp: 'desc' },
            select: {
              id: true,
              timestamp: true,
              type: true,
              url: true,
              metadata: true,
              value: true,
            }
          }
        })
      }
    });

    if (existingVisitor) {
      // Update last visit time
      await prisma.leadPulseVisitor.update({
        where: { id: existingVisitor.id },
        data: {
          lastVisit: new Date(),
          totalVisits: { increment: 1 },
          isActive: true
        }
      });
      
      // Prepare response data
      const responseData: any = {
        visitorId: existingVisitor.id,
        fingerprint: existingVisitor.fingerprint,
        isReturning: true,
        previousVisits: existingVisitor.totalVisits,
        engagementScore: existingVisitor.engagementScore,
        location: existingVisitor.city ? `${existingVisitor.city}, ${existingVisitor.country}` : null,
        firstVisit: existingVisitor.firstVisit,
        lastVisit: existingVisitor.lastVisit,
        metadata: existingVisitor.metadata,
      };
      
      // Include touchpoints if requested
      if (includeTouchpoints && existingVisitor.touchpoints) {
        responseData.touchpoints = existingVisitor.touchpoints;
      }
      
      // Include journey data if requested
      if (includeJourney) {
        // Get journey stages for this visitor
        const journeyStages = await prisma.contactJourney.findMany({
          where: {
            contact: {
              metadata: {
                path: ['leadPulseVisitorId'],
                equals: existingVisitor.id
              }
            }
          },
          include: {
            journey: {
              select: {
                id: true,
                name: true,
                description: true,
              }
            },
            stage: {
              select: {
                id: true,
                name: true,
                description: true,
              }
            }
          },
          orderBy: { enteredAt: 'desc' },
          take: 10
        });
        
        responseData.journey = journeyStages;
      }
      
      logger.info('Visitor lookup successful', {
        visitorId: existingVisitor.id,
        lookupCriteria: { fingerprint, visitorId, email, phone },
        includeJourney,
        includeTouchpoints,
      });

      return NextResponse.json(responseData);
    } else {
      logger.info('Visitor not found', {
        lookupCriteria: { fingerprint, visitorId, email, phone },
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      });
      
      // No existing visitor found
      return NextResponse.json({
        visitorId: null,
        isReturning: false,
        message: 'No visitor found matching the provided criteria'
      });
    }

  } catch (error) {
    logger.error('Error in visitor lookup', {
      error,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    });
    
    return NextResponse.json(
      { error: 'Failed to lookup visitor' },
      { status: 500 }
    );
  }
}