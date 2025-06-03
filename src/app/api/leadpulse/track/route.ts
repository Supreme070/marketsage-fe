import { type NextRequest, NextResponse } from 'next/server';
import { generateVisitorFingerprint, trackAnonymousVisitor, recordTouchpoint, updateVisitorEngagement } from '@/lib/leadpulse/visitorTracking';
import { logger } from '@/lib/logger';

// Force dynamic to avoid caching
export const dynamic = 'force-dynamic';

/**
 * Main tracking endpoint for LeadPulse
 * Receives events from the tracking pixel and processes them
 */
export async function POST(request: NextRequest) {
  try {
    // Get client IP address
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1';
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.pixelId || !body.eventType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get or create visitor fingerprint if not provided
    const fingerprint = body.fingerprint || await generateVisitorFingerprint(
      body.userAgent || request.headers.get('user-agent') || '',
      ip,
      { referrer: body.referrer, url: body.url }
    );
    
    // Extract visitor metadata
    const metadata: Record<string, any> = {
      userAgent: body.userAgent || request.headers.get('user-agent'),
      referrer: body.referrer,
      // Extract device info from user agent (simplified)
      device: detectDevice(body.userAgent || request.headers.get('user-agent') || ''),
      browser: detectBrowser(body.userAgent || request.headers.get('user-agent') || ''),
      os: detectOS(body.userAgent || request.headers.get('user-agent') || '')
    };
    
    // Add UTM parameters if present
    if (body.utm) {
      metadata.utmSource = body.utm.utm_source;
      metadata.utmMedium = body.utm.utm_medium;
      metadata.utmCampaign = body.utm.utm_campaign;
    }
    
    // Track visitor
    const visitor = await trackAnonymousVisitor(fingerprint, ip, metadata);
    
    // Process event based on type
    switch (body.eventType) {
      case 'pageview':
        // Record page view touchpoint
        await recordTouchpoint(visitor.id, body.url, {
          pageTitle: body.title
        });
        
        // Update engagement score
        await updateVisitorEngagement(visitor.id, 'PAGE_VIEW');
        break;
        
      case 'click':
        // Record click touchpoint with details
        await recordTouchpoint(visitor.id, body.url, {
          pageTitle: body.title,
          clickData: body.element
        });
        
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
        
        // Update engagement with CTA or regular click
        await updateVisitorEngagement(visitor.id, isCTA ? 'CTA_CLICK' : 'PAGE_VIEW', isCTA ? 3 : 1);
        break;
        
      case 'form_view':
        // Record form view touchpoint
        await recordTouchpoint(visitor.id, body.url, {
          pageTitle: body.title,
          formId: body.formId
        });
        
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
        });
        
        // Update engagement score
        await updateVisitorEngagement(visitor.id, 'FORM_START');
        break;
        
      case 'form_submit':
        // Record form submission touchpoint
        await recordTouchpoint(visitor.id, body.url, {
          pageTitle: body.title,
          formId: body.formId
        });
        
        // Update engagement score for form submission (high value)
        await updateVisitorEngagement(visitor.id, 'FORM_SUBMIT');
        break;
        
      case 'scroll_depth':
        // Record scroll depth touchpoint
        await recordTouchpoint(visitor.id, body.url, {
          pageTitle: body.title,
          scrollDepth: body.depth
        });
        
        // Update engagement based on scroll depth
        if (body.depth && typeof body.depth === 'number') {
          await updateVisitorEngagement(visitor.id, 'SCROLL_DEPTH', body.depth / 20);
        }
        break;
        
      case 'exit_intent':
        // Record exit intent touchpoint
        await recordTouchpoint(visitor.id, body.url, {
          pageTitle: body.title,
          exitIntent: true
        });
        break;
        
      case 'time_spent':
        // Record time spent touchpoint
        if (body.seconds && body.seconds > 10) {
          // Update engagement based on time spent (minutes)
          const minutes = body.seconds / 60;
          await updateVisitorEngagement(visitor.id, 'TIME_ON_PAGE', minutes);
        }
        break;
        
      case 'custom':
        // Record custom event touchpoint
        await recordTouchpoint(visitor.id, body.url, {
          pageTitle: body.title,
          event: body.event,
          ...body
        });
        break;
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
    logger.error('Error processing LeadPulse event', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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
    logger.error('Error in LeadPulse GET', error);
    
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