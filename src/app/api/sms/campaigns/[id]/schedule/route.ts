/**
 * SMS Campaign Scheduling API Endpoint
 * 
 * Allows scheduling SMS campaigns for future sending with timezone support.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { smsSchedulerService } from '@/lib/sms-scheduler-service';
import { smsLogger } from '@/lib/sms-campaign-logger';
import { 
  handleApiError, 
  unauthorized, 
  forbidden,
  notFound,
  validationError 
} from '@/lib/errors';

// POST - Schedule a campaign for future sending
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return unauthorized();
  }

  const { id: campaignId } = await params;

  try {
    const body = await request.json();
    const { scheduledAt, timezone = 'UTC', metadata = {} } = body;

    // Validate required fields
    if (!scheduledAt) {
      return validationError('scheduledAt is required');
    }

    // Parse and validate scheduled time
    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return validationError('Invalid scheduledAt date format');
    }

    // Check if campaign exists and user has access
    const campaign = await prisma.sMSCampaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        name: true,
        status: true,
        createdById: true,
        content: true,
        templateId: true
      }
    });

    if (!campaign) {
      return notFound('Campaign not found');
    }

    // Check permissions
    const isAdmin = session.user.role === 'SUPER_ADMIN' || session.user.role === 'ADMIN' || session.user.role === 'IT_ADMIN';
    if (!isAdmin && campaign.createdById !== session.user.id) {
      await smsLogger.logAuthorizationError(session.user.id, 'schedule', `campaign/${campaignId}`, {
        campaignId,
        userId: session.user.id,
        userRole: session.user.role,
        campaignOwnerId: campaign.createdById
      });
      return forbidden("You don't have permission to schedule this campaign");
    }

    // Validate campaign can be scheduled
    if (campaign.status !== 'DRAFT') {
      await smsLogger.logValidationError(campaignId, 
        `Cannot schedule campaign with status: ${campaign.status}`,
        { currentStatus: campaign.status, allowedStatus: 'DRAFT' },
        { userId: session.user.id }
      );
      return validationError(`Campaign must be in DRAFT status to schedule. Current status: ${campaign.status}`);
    }

    // Validate campaign has content
    if (!campaign.content && !campaign.templateId) {
      return validationError('Campaign must have content or a template to schedule');
    }

    // Validate scheduled time is in future
    const now = new Date();
    const minFutureTime = new Date(now.getTime() + 5 * 60 * 1000); // At least 5 minutes in future
    
    if (scheduledDate <= minFutureTime) {
      return validationError('Campaign must be scheduled at least 5 minutes in the future');
    }

    // Check for scheduling conflicts (optional business rule)
    const maxFutureTime = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // Max 1 year
    if (scheduledDate > maxFutureTime) {
      return validationError('Campaign cannot be scheduled more than 1 year in the future');
    }

    // Schedule the campaign
    const success = await smsSchedulerService.scheduleCampaign({
      campaignId,
      scheduledAt: scheduledDate,
      timezone,
      userId: session.user.id,
      metadata: {
        ...metadata,
        scheduledBy: session.user.id,
        scheduledByName: session.user.name || session.user.email,
        originalRequestTime: now.toISOString()
      }
    });

    if (!success) {
      await smsLogger.logValidationError(campaignId,
        'Failed to schedule SMS campaign',
        { scheduledAt: scheduledDate.toISOString(), timezone },
        { userId: session.user.id }
      );
      return NextResponse.json(
        { error: 'Failed to schedule campaign. Please check if campaign is already scheduled.' },
        { status: 400 }
      );
    }

    // Get updated campaign info
    const updatedCampaign = await prisma.sMSCampaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        name: true,
        status: true,
        scheduledFor: true
      }
    });

    return NextResponse.json({
      message: 'SMS campaign scheduled successfully',
      campaign: {
        id: updatedCampaign?.id,
        name: updatedCampaign?.name,
        status: updatedCampaign?.status,
        scheduledFor: updatedCampaign?.scheduledFor?.toISOString(),
        timezone
      },
      scheduling: {
        scheduledFor: scheduledDate.toISOString(),
        timezone,
        scheduledBy: session.user.id,
        timeUntilExecution: Math.round((scheduledDate.getTime() - now.getTime()) / 1000 / 60), // minutes
      }
    });

  } catch (error) {
    console.error('Error scheduling SMS campaign:', error);
    
    await smsLogger.logCampaignFailed(campaignId, session.user.id, {
      operation: 'schedule',
      error: error instanceof Error ? error.message : 'Unknown error',
      errorDetails: error,
      userId: session.user.id
    });
    
    return handleApiError(error, '/api/sms/campaigns/[id]/schedule/route.ts');
  }
}

// DELETE - Cancel a scheduled campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return unauthorized();
  }

  const { id: campaignId } = await params;

  try {
    // Check if campaign exists and user has access
    const campaign = await prisma.sMSCampaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        name: true,
        status: true,
        createdById: true,
        scheduledFor: true
      }
    });

    if (!campaign) {
      return notFound('Campaign not found');
    }

    // Check permissions
    const isAdmin = session.user.role === 'SUPER_ADMIN' || session.user.role === 'ADMIN' || session.user.role === 'IT_ADMIN';
    if (!isAdmin && campaign.createdById !== session.user.id) {
      return forbidden("You don't have permission to cancel this campaign's schedule");
    }

    // Validate campaign is scheduled
    if (campaign.status !== 'SCHEDULED') {
      return validationError(`Campaign is not scheduled. Current status: ${campaign.status}`);
    }

    // Cancel the schedule
    const success = await smsSchedulerService.cancelScheduledCampaign(campaignId, session.user.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to cancel campaign schedule. Schedule may not exist or already be processing.' },
        { status: 400 }
      );
    }

    // Get updated campaign info
    const updatedCampaign = await prisma.sMSCampaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        name: true,
        status: true,
        scheduledFor: true
      }
    });

    return NextResponse.json({
      message: 'SMS campaign schedule cancelled successfully',
      campaign: {
        id: updatedCampaign?.id,
        name: updatedCampaign?.name,
        status: updatedCampaign?.status,
        scheduledFor: updatedCampaign?.scheduledFor?.toISOString() || null
      },
      cancellation: {
        cancelledAt: new Date().toISOString(),
        cancelledBy: session.user.id
      }
    });

  } catch (error) {
    console.error('Error cancelling SMS campaign schedule:', error);
    
    await smsLogger.logCampaignFailed(campaignId, session.user.id, {
      operation: 'cancel_schedule',
      error: error instanceof Error ? error.message : 'Unknown error',
      errorDetails: error,
      userId: session.user.id
    });
    
    return handleApiError(error, '/api/sms/campaigns/[id]/schedule/route.ts');
  }
}

// GET - Get schedule information for a campaign
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return unauthorized();
  }

  const { id: campaignId } = await params;

  try {
    // Check if campaign exists and user has access
    const campaign = await prisma.sMSCampaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        name: true,
        status: true,
        createdById: true,
        scheduledFor: true
      }
    });

    if (!campaign) {
      return notFound('Campaign not found');
    }

    // Check permissions
    const isAdmin = session.user.role === 'SUPER_ADMIN' || session.user.role === 'ADMIN' || session.user.role === 'IT_ADMIN';
    if (!isAdmin && campaign.createdById !== session.user.id) {
      return forbidden("You don't have permission to view this campaign's schedule");
    }

    // Simple response based on campaign data

    const response = {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        scheduledFor: campaign.scheduledFor?.toISOString() || null
      },
      scheduling: {
        isScheduled: campaign.status === 'SCHEDULED',
        scheduledFor: campaign.scheduledFor?.toISOString() || null,
        timeUntilExecution: campaign.scheduledFor ? 
          Math.round((campaign.scheduledFor.getTime() - new Date().getTime()) / 1000 / 60) : null, // minutes
        isPastDue: campaign.scheduledFor ? campaign.scheduledFor <= new Date() : false
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error getting SMS campaign schedule:', error);
    return handleApiError(error, '/api/sms/campaigns/[id]/schedule/route.ts');
  }
}