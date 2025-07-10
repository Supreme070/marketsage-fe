import { type NextRequest, NextResponse } from 'next/server';
import { generateVisitorFingerprint, trackAnonymousVisitor, recordTouchpoint, updateVisitorEngagement } from '@/lib/leadpulse/visitorTracking';
import { logger } from '@/lib/logger';
import { leadPulseRealtimeService } from '@/lib/websocket/leadpulse-realtime';
import { leadPulseCache } from '@/lib/cache/leadpulse-cache';
import { createRateLimitMiddleware } from '@/lib/leadpulse/rate-limiter';
import { detectBotInRequest, BotConfidence } from '@/lib/leadpulse/bot-detector';
import { validateTrackingEvent, createValidationErrorResponse, validateIpAddress } from '@/lib/leadpulse/validation';
import { createErrorHandledRequest, handleTrackingError, withDatabaseErrorHandling, withCacheErrorHandling } from '@/lib/leadpulse/error-middleware';
import { ErrorCategory } from '@/lib/leadpulse/error-boundary';

// Force dynamic to avoid caching
export const dynamic = 'force-dynamic';

/**
 * Main tracking endpoint for LeadPulse
 * Receives events from the tracking pixel and processes them
 */
export async function POST(request: NextRequest) {
  const errorHandler = createErrorHandledRequest(request);
  
  try {
    // Apply rate limiting
    const rateLimitMiddleware = createRateLimitMiddleware('TRACKING');
    const rateLimitResult = await rateLimitMiddleware(request);
    
    if (rateLimitResult.blocked || !rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded for tracking endpoint', {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
        blocked: rateLimitResult.blocked,
      });
      
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: rateLimitResult.blocked 
            ? 'Too many requests from this IP address. Please try again later.'
            : 'Request rate exceeded. Please slow down.',
        },
        {
          status: rateLimitResult.status,
          headers: rateLimitResult.headers,
        }
      );
    }
    
    // Get and validate client IP address
    let ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             '127.0.0.1';
    
    // Handle multiple IPs in x-forwarded-for (take the first one)
    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
    
    // Validate IP address format
    if (!validateIpAddress(ip)) {
      logger.warn('Invalid IP address format', { ip, originalIp: ip });
      ip = '127.0.0.1'; // Fallback to localhost
    }
    
    // Parse and validate request body
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      logger.warn('Invalid JSON in tracking request', {
        ip,
        userAgent: request.headers.get('user-agent'),
      });
      
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    // Comprehensive data validation
    const validation = validateTrackingEvent(body);
    if (!validation.success) {
      logger.warn('Invalid tracking event data', {
        ip,
        userAgent: request.headers.get('user-agent'),
        error: validation.error,
        field: validation.error?.field,
      });
      
      return NextResponse.json(
        createValidationErrorResponse(validation),
        { status: 400 }
      );
    }
    
    // Use validated and sanitized data
    body = validation.data;

    // Bot detection - check before processing visitor data
    const botDetectionResult = await detectBotInRequest(request);
    
    // Handle bot detection result
    if (botDetectionResult.action === 'block') {
      logger.warn('Blocked bot request', {
        ip,
        userAgent: request.headers.get('user-agent'),
        confidence: botDetectionResult.confidence,
        score: botDetectionResult.score,
        reasons: botDetectionResult.reasons,
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Request blocked',
          message: 'Automated traffic detected'
        },
        { status: 403 }
      );
    }
    
    // Get or create visitor fingerprint if not provided
    const userAgent = body.userAgent || request.headers.get('user-agent') || '';
    
    // Validate URL format
    if (!body.url || !body.url.startsWith('http')) {
      logger.warn('Invalid URL in tracking event', {
        ip,
        userAgent,
        url: body.url,
      });
      
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }
    
    const fingerprint = body.fingerprint || await generateVisitorFingerprint(
      userAgent,
      ip,
      { referrer: body.referrer, url: body.url }
    );
    
    // Extract visitor metadata (using validated data)
    const metadata: Record<string, any> = {
      userAgent: userAgent,
      referrer: body.referrer,
      // Extract device info from user agent (simplified)
      device: detectDevice(userAgent),
      browser: detectBrowser(userAgent),
      os: detectOS(userAgent),
      // Add validation metadata
      validatedAt: new Date().toISOString(),
      ipValidated: validateIpAddress(ip),
    };
    
    // Add UTM parameters if present
    if (body.utm) {
      metadata.utmSource = body.utm.utm_source;
      metadata.utmMedium = body.utm.utm_medium;
      metadata.utmCampaign = body.utm.utm_campaign;
    }
    
    // Track visitor with error handling
    const visitor = await errorHandler.execute(
      () => trackAnonymousVisitor(fingerprint, ip, metadata),
      ErrorCategory.DATABASE,
      'trackVisitor'
    );
    
    // Update context with visitor information
    errorHandler.context.visitorId = visitor.id;
    errorHandler.context.pixelId = body.pixelId;
    
    // Store bot detection result if visitor was flagged or blocked
    if (botDetectionResult.confidence >= BotConfidence.SUSPICIOUS) {
      await errorHandler.execute(
        async () => {
          const { botDetector } = await import('@/lib/leadpulse/bot-detector');
          await botDetector.storeDetectionResult(visitor.id, botDetectionResult, {
            userAgent: body.userAgent || request.headers.get('user-agent') || '',
            ip,
            fingerprint,
            requestHeaders: Object.fromEntries(request.headers.entries()),
            behaviorData: {
              eventType: body.eventType,
              url: body.url,
            },
          });
        },
        ErrorCategory.DATABASE,
        'storeBotDetection'
      ).catch(error => {
        logger.warn('Failed to store bot detection result with error boundary', { error });
      });
    }
    
    // Check if this is a new visitor and broadcast
    if (visitor.firstVisit.getTime() === visitor.lastVisit.getTime()) {
      // New visitor - broadcast to real-time listeners with error handling
      await errorHandler.execute(
        () => leadPulseRealtimeService.broadcastNewVisitor(visitor),
        ErrorCategory.NETWORK,
        'broadcastNewVisitor'
      ).catch(error => {
        logger.warn('Failed to broadcast new visitor', { error, visitorId: visitor.id });
      });
    }
    
    // Process event based on type
    let touchpoint: any = null;
    switch (body.eventType) {
      case 'pageview':
        // Record page view touchpoint with error handling
        touchpoint = await errorHandler.execute(
          () => recordTouchpoint(visitor.id, body.url, {
            pageTitle: body.title
          }, 'PAGEVIEW'),
          ErrorCategory.DATABASE,
          'recordTouchpoint'
        );
        
        // Update engagement score with error handling
        await errorHandler.execute(
          () => updateVisitorEngagement(visitor.id, 'PAGE_VIEW'),
          ErrorCategory.DATABASE,
          'updateEngagement'
        ).catch(error => {
          logger.warn('Failed to update engagement for pageview', { error, visitorId: visitor.id });
        });
        break;
        
      case 'click':
        // Record click touchpoint with details and error handling
        touchpoint = await errorHandler.execute(
          () => recordTouchpoint(visitor.id, body.url, {
            pageTitle: body.title,
            clickData: body.element
          }, 'CLICK'),
          ErrorCategory.DATABASE,
          'recordTouchpoint'
        );
        
        // Check if this is a CTA click
        const isCTA = body.element && (
          (body.element.href && body.element.href.includes('contact')) ||
          (body.element.classes && body.element.classes.includes('cta')) ||
          (body.element.elementText && (
            body.element.elementText.toLowerCase().includes('sign up') ||
            body.element.elementText.toLowerCase().includes('contact') ||
            body.element.elementText.toLowerCase().includes('trial') ||
            body.element.elementText.toLowerCase().includes('demo')
          ))
        );
        
        // Update engagement with CTA or regular click and error handling
        await errorHandler.execute(
          () => updateVisitorEngagement(visitor.id, isCTA ? 'CTA_CLICK' : 'PAGE_VIEW', isCTA ? 3 : 1),
          ErrorCategory.DATABASE,
          'updateEngagement'
        ).catch(error => {
          logger.warn('Failed to update engagement for click', { error, visitorId: visitor.id, isCTA });
        });
        break;
        
      case 'form_view':
        // Record form view touchpoint
        await recordTouchpoint(visitor.id, body.url, {
          pageTitle: body.title,
          formId: body.formId
        }, 'FORM_VIEW');
        
        // Update engagement score
        await updateVisitorEngagement(visitor.id, 'FORM_VIEW');
        break;
        
      case 'form_start':
        // Record form interaction touchpoint
        await recordTouchpoint(visitor.id, body.url, {
          pageTitle: body.title,
          formId: body.formId,
          fieldName: body.fieldName,
          fieldType: body.fieldType
        }, 'FORM_START');
        
        // Update engagement score
        await updateVisitorEngagement(visitor.id, 'FORM_START');
        break;
        
      case 'form_submit':
        // Record form submission touchpoint
        await recordTouchpoint(visitor.id, body.url, {
          pageTitle: body.title,
          formId: body.formId
        }, 'FORM_SUBMIT');
        
        // Update engagement score for form submission (high value)
        await updateVisitorEngagement(visitor.id, 'FORM_SUBMIT');
        break;
        
      case 'scroll_depth':
        // Validate scroll depth value
        if (body.depth === undefined || body.depth === null) {
          logger.warn('Missing scroll depth value', {
            visitorId: visitor.id,
            url: body.url,
          });
          break;
        }
        
        // Record scroll depth touchpoint
        await recordTouchpoint(visitor.id, body.url, {
          pageTitle: body.title,
          scrollDepth: body.depth
        }, 'PAGEVIEW');
        
        // Update engagement based on scroll depth (depth is already validated as 0-100)
        await updateVisitorEngagement(visitor.id, 'SCROLL_DEPTH', body.depth / 20);
        break;
        
      case 'exit_intent':
        // Record exit intent touchpoint
        await recordTouchpoint(visitor.id, body.url, {
          pageTitle: body.title,
          exitIntent: true
        }, 'PAGEVIEW');
        break;
        
      case 'time_spent':
        // Validate time spent value
        if (!body.seconds || body.seconds <= 0) {
          logger.warn('Invalid time spent value', {
            visitorId: visitor.id,
            url: body.url,
            seconds: body.seconds,
          });
          break;
        }
        
        // Record time spent touchpoint (minimum 10 seconds for meaningful engagement)
        if (body.seconds >= 10) {
          // Update engagement based on time spent (minutes, capped at reasonable values)
          const minutes = Math.min(body.seconds / 60, 120); // Cap at 2 hours
          await updateVisitorEngagement(visitor.id, 'TIME_ON_PAGE', minutes);
        }
        break;
        
      case 'custom':
        // Validate custom event data
        if (!body.event) {
          logger.warn('Missing custom event name', {
            visitorId: visitor.id,
            url: body.url,
          });
          break;
        }
        
        // Record custom event touchpoint (only include safe validated data)
        await recordTouchpoint(visitor.id, body.url, {
          pageTitle: body.title,
          event: body.event,
          customData: body.customData || {},
          value: body.value,
        }, 'PAGEVIEW');
        break;
    }
    
    // Broadcast significant touchpoint activity with error handling
    if (touchpoint && ['CLICK', 'FORM_VIEW', 'FORM_START', 'FORM_SUBMIT'].includes(touchpoint.type)) {
      await errorHandler.execute(
        () => leadPulseRealtimeService.broadcastVisitorActivity(visitor.id, touchpoint),
        ErrorCategory.NETWORK,
        'broadcastActivity'
      ).catch(error => {
        logger.warn('Failed to broadcast visitor activity', { error, visitorId: visitor.id, touchpointType: touchpoint.type });
      });
    }
    
    // Update cache with new visitor/activity data using error handling
    if (touchpoint) {
      await errorHandler.execute(
        async () => {
          await leadPulseCache.addRecentActivity(touchpoint);
          await leadPulseCache.updateVisitorJourney(visitor.id, touchpoint);
          
          // Invalidate analytics cache to refresh metrics
          if (['FORM_SUBMIT', 'CONVERSION'].includes(body.eventType.toUpperCase())) {
            await leadPulseCache.invalidateAnalyticsOverview();
          }
        },
        ErrorCategory.CACHE,
        'updateCache'
      ).catch(error => {
        logger.warn('Cache update failed with error boundary', { error, visitorId: visitor.id });
      });
    }
    
    logger.info('Processed LeadPulse event', {
      pixelId: body.pixelId,
      visitorId: visitor.id,
      eventType: body.eventType,
      url: body.url
    });
    
    // Return a success response with the visitor ID
    return NextResponse.json(
      { success: true, visitorId: visitor.id },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error processing LeadPulse event', error as Error);
    
    // Use error boundary to handle the error gracefully
    return await handleTrackingError(request, error as Error, {
      visitorId: errorHandler.context.visitorId,
      pixelId: errorHandler.context.pixelId,
      eventType: errorHandler.context.eventType,
      url: errorHandler.context.url,
      metadata: errorHandler.context.metadata,
    });
  }
}

/**
 * Identify endpoint for LeadPulse
 * Handles visitor identification requests
 */
export async function GET(request: NextRequest) {
  try {
    // Implement a lightweight ping endpoint
    return NextResponse.json(
      { success: true, version: '1.0.0', service: 'LeadPulse' },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error in LeadPulse GET', error as Error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions for device detection (simplified)

function detectDevice(userAgent: string): string {
  if (/mobile/i.test(userAgent)) return 'Mobile';
  if (/tablet|ipad/i.test(userAgent)) return 'Tablet';
  return 'Desktop';
}

function detectBrowser(userAgent: string): string {
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/chrome/i.test(userAgent)) return 'Chrome';
  if (/safari/i.test(userAgent)) return 'Safari';
  if (/edge/i.test(userAgent)) return 'Edge';
  if (/msie|trident/i.test(userAgent)) return 'Internet Explorer';
  return 'Unknown';
}

function detectOS(userAgent: string): string {
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/macintosh|mac os x/i.test(userAgent)) return 'macOS';
  if (/linux/i.test(userAgent)) return 'Linux';
  if (/android/i.test(userAgent)) return 'Android';
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS';
  return 'Unknown';
} 