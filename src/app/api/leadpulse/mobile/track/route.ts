import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { createRateLimitMiddleware } from '@/lib/leadpulse/rate-limiter';
import { logger } from '@/lib/logger';
import { validateMobileTracking, createValidationErrorResponse, validateTimestamp } from '@/lib/leadpulse/validation';

export const dynamic = 'force-dynamic';

interface MobileEventData {
  visitorId: string;
  deviceId: string;
  sessionId: string;
  appId: string;
  eventType: string;
  screenName?: string;
  elementId?: string;
  formId?: string;
  eventName?: string;
  properties?: Record<string, any>;
  timestamp: string;
  coordinates?: { x: number; y: number };
  value?: number;
}

/**
 * Mobile app event tracking endpoint
 * Receives tracking events from mobile apps and stores them as touchpoints
 */
export async function POST(request: NextRequest) {
  try {
    // Apply mobile-specific rate limiting (higher limits for mobile apps)
    const rateLimitMiddleware = createRateLimitMiddleware('MOBILE_TRACKING');
    const rateLimitResult = await rateLimitMiddleware(request);
    
    if (rateLimitResult.blocked || !rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded for mobile tracking', {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
        blocked: rateLimitResult.blocked,
      });
      
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: rateLimitResult.blocked 
            ? 'Too many requests from this device. Please try again later.'
            : 'Mobile tracking rate exceeded. Please slow down.',
        },
        {
          status: rateLimitResult.status,
          headers: rateLimitResult.headers,
        }
      );
    }
    
    // Parse and validate request body
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      logger.warn('Invalid JSON in mobile tracking request', {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      });
      
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    // Comprehensive data validation
    const validation = validateMobileTracking(body);
    if (!validation.success) {
      logger.warn('Invalid mobile tracking data', {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
        error: validation.error,
        field: validation.error?.field,
        visitorId: body.visitorId,
        eventType: body.eventType,
      });
      
      return NextResponse.json(
        createValidationErrorResponse(validation),
        { status: 400 }
      );
    }
    
    // Use validated and sanitized data
    const validatedBody: MobileEventData = validation.data;

    const { 
      visitorId, 
      deviceId, 
      sessionId, 
      appId, 
      eventType, 
      screenName, 
      elementId, 
      formId,
      eventName,
      properties = {}, 
      timestamp,
      coordinates,
      value
    } = validatedBody;
    
    // Additional timestamp validation
    if (!validateTimestamp(timestamp)) {
      logger.warn('Invalid timestamp in mobile tracking', {
        visitorId,
        eventType,
        timestamp,
      });
      
      return NextResponse.json(
        { error: 'Invalid timestamp format or value' },
        { status: 400 }
      );
    }

    // Verify visitor exists
    const visitor = await prisma.leadPulseVisitor.findUnique({
      where: { id: visitorId }
    });

    if (!visitor) {
      logger.warn('Visitor not found for mobile tracking', {
        visitorId,
        eventType,
        appId,
        deviceId,
      });
      
      return NextResponse.json(
        { error: 'Visitor not found' },
        { status: 404 }
      );
    }

    // Map mobile event types to LeadPulse touchpoint types
    let touchpointType: string;
    let touchpointUrl: string;
    let touchpointTitle: string | null = null;
    let touchpointValue: number;

    switch (eventType) {
      case 'screen_view':
        touchpointType = 'PAGEVIEW';
        touchpointUrl = `app://${appId}/${screenName || 'unknown'}`;
        touchpointTitle = screenName || 'App Screen';
        touchpointValue = 1;
        break;
        
      case 'button_tap':
      case 'interaction':
        touchpointType = 'CLICK';
        touchpointUrl = `app://${appId}/${screenName || 'unknown'}`;
        touchpointTitle = `${elementId || 'Button'} Tap`;
        touchpointValue = 2;
        break;
        
      case 'form_interaction':
        if (properties.action === 'view') {
          touchpointType = 'FORM_VIEW';
          touchpointValue = 3;
        } else if (properties.action === 'start') {
          touchpointType = 'FORM_START';
          touchpointValue = 4;
        } else if (properties.action === 'submit') {
          touchpointType = 'FORM_SUBMIT';
          touchpointValue = 8;
        } else {
          touchpointType = 'FORM_VIEW';
          touchpointValue = 3;
        }
        touchpointUrl = `app://${appId}/form/${formId || 'unknown'}`;
        touchpointTitle = `Form ${properties.action || 'interaction'}`;
        break;
        
      case 'conversion':
        touchpointType = 'CONVERSION';
        touchpointUrl = `app://${appId}/conversion/${eventName || 'unknown'}`;
        touchpointTitle = `${eventName || 'Conversion'} (Mobile)`;
        touchpointValue = value || 10;
        break;
        
      case 'app_open':
        touchpointType = 'PAGEVIEW';
        touchpointUrl = `app://${appId}/launch`;
        touchpointTitle = 'App Launch';
        touchpointValue = 1;
        break;
        
      case 'app_background':
        touchpointType = 'CLICK';
        touchpointUrl = `app://${appId}/background`;
        touchpointTitle = 'App Background';
        touchpointValue = 1;
        break;
        
      default:
        touchpointType = 'CLICK';
        touchpointUrl = `app://${appId}/${eventType}`;
        touchpointTitle = eventType;
        touchpointValue = 1;
    }

    // Prepare touchpoint metadata with validated data only
    const metadata = {
      platform: 'mobile',
      appId,
      deviceId,
      sessionId,
      eventType,
      screenName,
      elementId,
      formId,
      eventName,
      coordinates,
      value,
      properties: properties || {},
      validatedAt: new Date().toISOString(),
    };

    // Create touchpoint record
    const touchpoint = await prisma.leadPulseTouchpoint.create({
      data: {
        visitorId,
        timestamp: new Date(timestamp),
        type: touchpointType as any, // Cast to enum type
        url: touchpointUrl,
        metadata: JSON.stringify({
          ...metadata,
          title: touchpointTitle // Store title in metadata
        }),
        value: touchpointValue
      }
    });

    // Update visitor's last activity and engagement score
    await prisma.leadPulseVisitor.update({
      where: { id: visitorId },
      data: {
        lastVisit: new Date(timestamp),
        isActive: true,
        engagementScore: {
          increment: Math.min(touchpointValue, 5) // Cap individual event contribution
        },
        // Update metadata to indicate validation
        metadata: {
          ...(visitor.metadata as any || {}),
          lastMobileEvent: {
            eventType,
            timestamp,
            validatedAt: new Date().toISOString(),
          }
        }
      }
    });

    // Note: Session tracking will be implemented when LeadPulseSession model is added to schema

    console.log('Mobile event tracked:', {
      visitorId,
      eventType,
      touchpointType,
      appId,
      screenName: screenName || elementId || eventName,
      value: touchpointValue
    });

    return NextResponse.json({
      success: true,
      touchpointId: touchpoint.id,
      message: `Mobile ${eventType} event tracked successfully`
    });

  } catch (error) {
    console.error('Error tracking mobile event:', error);
    
    return NextResponse.json(
      { error: 'Failed to track mobile event' },
      { status: 500 }
    );
  }
}

// GET: Health check for mobile tracking
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'LeadPulse Mobile Tracking API is running',
    supportedEvents: [
      'screen_view',
      'button_tap', 
      'interaction',
      'form_interaction',
      'conversion',
      'app_open',
      'app_background'
    ]
  });
} 