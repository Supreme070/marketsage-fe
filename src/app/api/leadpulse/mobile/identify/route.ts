import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { generateVisitorFingerprint } from '@/lib/leadpulse/visitorTracking';
import { validateMobileIdentify, createValidationErrorResponse, validateTimestamp } from '@/lib/leadpulse/validation';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Mobile app visitor identification endpoint
 * This endpoint registers mobile app users alongside web visitors in the same system
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      logger.warn('Invalid JSON in mobile identify request', {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      });
      
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    // Comprehensive data validation
    const validation = validateMobileIdentify(body);
    if (!validation.success) {
      logger.warn('Invalid mobile identify data', {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
        error: validation.error,
        field: validation.error?.field,
        deviceId: body.deviceId,
      });
      
      return NextResponse.json(
        createValidationErrorResponse(validation),
        { status: 400 }
      );
    }
    
    // Use validated and sanitized data
    body = validation.data;

    const { 
      deviceId, 
      existingVisitorId, 
      deviceData, 
      sessionId, 
      appInstallTime, 
      lastLaunchTime 
    } = body;
    
    // Additional timestamp validations
    if (appInstallTime && !validateTimestamp(appInstallTime)) {
      logger.warn('Invalid app install time', {
        deviceId,
        appInstallTime,
      });
      
      return NextResponse.json(
        { error: 'Invalid app install time format' },
        { status: 400 }
      );
    }
    
    if (lastLaunchTime && !validateTimestamp(lastLaunchTime)) {
      logger.warn('Invalid last launch time', {
        deviceId,
        lastLaunchTime,
      });
      
      return NextResponse.json(
        { error: 'Invalid last launch time format' },
        { status: 400 }
      );
    }

    // Check if we have an existing visitor
    let visitor = null;
    
    if (existingVisitorId) {
      visitor = await prisma.leadPulseVisitor.findUnique({
        where: { id: existingVisitorId }
      });
    }

    // If no existing visitor, try to find by fingerprint that includes device ID
    if (!visitor) {
      const deviceFingerprint = await generateVisitorFingerprint(
        `${deviceData.deviceModel}-${deviceData.osVersion}-${deviceData.appVersion}`,
        deviceId,
        { platform: deviceData.platform, appId: deviceData.appId }
      );
      
      visitor = await prisma.leadPulseVisitor.findFirst({
        where: { 
          fingerprint: deviceFingerprint
        }
      });
    }

    // Create or update visitor
    if (!visitor) {
      // Generate a fingerprint for mobile device
      const fingerprint = await generateVisitorFingerprint(
        `${deviceData.deviceModel}-${deviceData.osVersion}-${deviceData.appVersion}`,
        deviceId,
        { platform: deviceData.platform, appId: deviceData.appId }
      );

      // Create new mobile visitor
      visitor = await prisma.leadPulseVisitor.create({
        data: {
          fingerprint,
          device: deviceData.deviceModel || 'Mobile Device',
          os: deviceData.osVersion || 'Unknown',
          firstVisit: new Date(),
          lastVisit: new Date(),
          totalVisits: 1,
          engagementScore: 0,
          isActive: true,
          metadata: {
            platform: deviceData.platform || 'mobile',
            appId: deviceData.appId,
            deviceId: deviceId,
            appVersion: deviceData.appVersion,
            deviceModel: deviceData.deviceModel,
            osVersion: deviceData.osVersion,
            locale: deviceData.locale,
            timezone: deviceData.timezone,
            screenSize: deviceData.screenSize,
            pushToken: deviceData.pushToken,
            advertisingId: deviceData.advertisingId,
            appInstallTime: appInstallTime ? new Date(appInstallTime).toISOString() : new Date().toISOString(),
            lastLaunchTime: new Date(lastLaunchTime || Date.now()).toISOString(),
            type: 'mobile'
          }
        }
      });

      logger.info('Created new mobile visitor', {
        visitorId: visitor.id,
        platform: deviceData.platform,
        appId: deviceData.appId,
        deviceModel: deviceData.deviceModel,
        validated: true,
      });
    } else {
      // Update existing visitor
      visitor = await prisma.leadPulseVisitor.update({
        where: { id: visitor.id },
        data: {
          lastVisit: new Date(),
          totalVisits: { increment: 1 },
          isActive: true,
          device: deviceData.deviceModel || visitor.device,
          os: deviceData.osVersion || visitor.os,
          metadata: {
            ...(visitor.metadata as any || {}),
            appVersion: deviceData.appVersion,
            pushToken: deviceData.pushToken,
            lastLaunchTime: new Date(lastLaunchTime || Date.now()).toISOString(),
            deviceModel: deviceData.deviceModel,
            osVersion: deviceData.osVersion,
            locale: deviceData.locale,
            timezone: deviceData.timezone
          }
        }
      });

      logger.info('Updated existing mobile visitor', {
        visitorId: visitor.id,
        platform: deviceData.platform,
        totalVisits: visitor.totalVisits,
        lastVisit: visitor.lastVisit,
        validated: true,
      });
    }

    // Note: Session tracking will be implemented when LeadPulseSession model is added

    return NextResponse.json({
      success: true,
      visitorId: visitor.id,
      sessionId,
      message: visitor.totalVisits === 1 ? 'New mobile visitor created' : 'Existing mobile visitor identified'
    });

  } catch (error) {
    logger.error('Error in mobile visitor identification', {
      error,
      deviceId: body?.deviceId,
      platform: body?.deviceData?.platform,
    });
    
    return NextResponse.json(
      { error: 'Failed to identify mobile visitor' },
      { status: 500 }
    );
  }
} 