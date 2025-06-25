/**
 * LeadPulse Form Submission API
 * 
 * Handles form submissions from embedded forms and public forms
 */

import { type NextRequest, NextResponse } from 'next/server';
import { formProcessor } from '@/lib/leadpulse/form-processor';
import { logger } from '@/lib/logger';
import { leadPulseErrorHandler } from '@/lib/leadpulse/error-handler';
import { leadPulseRealtimeService } from '@/lib/websocket/leadpulse-realtime';

// Force dynamic to avoid caching
export const dynamic = 'force-dynamic';

/**
 * POST: Submit form data
 * 
 * Expected payload:
 * {
 *   formId: string,
 *   visitorId?: string,
 *   data: Record<string, any>,
 *   context?: {
 *     utmSource?: string,
 *     utmMedium?: string,
 *     utmCampaign?: string,
 *     referrer?: string
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Get client IP and user agent
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.formId || !body.data) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: formId and data' 
        },
        { status: 400 }
      );
    }

    // Prepare submission data
    const submissionData = {
      formId: body.formId,
      visitorId: body.visitorId,
      submissionData: body.data,
      context: {
        ipAddress: ip,
        userAgent,
        referrer: body.context?.referrer || request.headers.get('referer'),
        utmSource: body.context?.utmSource,
        utmMedium: body.context?.utmMedium,
        utmCampaign: body.context?.utmCampaign,
        timestamp: new Date()
      }
    };

    // Process the submission
    const result = await formProcessor.processSubmission(submissionData);

    // Log the submission
    logger.info('Form submission received', {
      formId: body.formId,
      submissionId: result.id,
      status: result.status,
      score: result.score,
      quality: result.quality,
      contactId: result.contactId,
      visitorId: body.visitorId,
      ip
    });

    // Broadcast real-time updates for successful submissions
    if (result.status === 'PROCESSED' && result.contactId) {
      try {
        // Broadcast new lead/conversion event
        await leadPulseRealtimeService.broadcastAnalyticsUpdate();
        
        // You could also broadcast a specific "new_lead" event
        // await leadPulseRealtimeService.broadcastNewLead(result);
      } catch (realtimeError) {
        logger.warn('Failed to broadcast real-time updates:', realtimeError);
      }
    }

    // Return appropriate response based on submission status
    switch (result.status) {
      case 'PROCESSED':
        return NextResponse.json({
          success: true,
          submissionId: result.id,
          status: result.status,
          message: 'Form submitted successfully',
          lead: {
            score: result.score,
            quality: result.quality,
            contactId: result.contactId
          }
        });

      case 'SPAM':
        return NextResponse.json({
          success: false,
          status: result.status,
          message: 'Submission rejected'
        }, { status: 422 });

      case 'DUPLICATE':
        return NextResponse.json({
          success: false,
          status: result.status,
          message: 'Duplicate submission detected'
        }, { status: 409 });

      case 'FAILED':
        return NextResponse.json({
          success: false,
          status: result.status,
          message: 'Form submission failed',
          errors: result.errors
        }, { status: 422 });

      default:
        return NextResponse.json({
          success: false,
          message: 'Unknown submission status'
        }, { status: 500 });
    }

  } catch (error) {
    // Handle and log error
    await leadPulseErrorHandler.handleError(error, {
      endpoint: '/api/leadpulse/forms/submit',
      method: 'POST',
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });

    logger.error('Form submission processing failed:', error);

    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * OPTIONS: Handle CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}