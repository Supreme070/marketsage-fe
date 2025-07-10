/**
 * Email Unsubscribe API Endpoint
 * 
 * Handles email unsubscribe requests from tracking links and direct user actions.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { ActivityType } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';
import { 
  handleApiError, 
  validationError 
} from '@/lib/errors';

// GET - Handle unsubscribe via email link
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const campaignId = searchParams.get('cid');
    const contactId = searchParams.get('contact');
    
    if (!email) {
      return NextResponse.redirect('/unsubscribe?error=missing_email');
    }

    // Find the contact by email
    const contact = await prisma.contact.findFirst({
      where: { email },
      select: { id: true, email: true, firstName: true, lastName: true }
    });

    if (!contact) {
      return NextResponse.redirect('/unsubscribe?error=contact_not_found');
    }

    // Update contact status to unsubscribed
    await prisma.contact.update({
      where: { id: contact.id },
      data: { 
        status: 'UNSUBSCRIBED',
        unsubscribedAt: new Date()
      }
    });

    // Record unsubscribe activity if campaign is provided
    if (campaignId) {
      try {
        await prisma.emailActivity.create({
          data: {
            id: randomUUID(),
            campaignId,
            contactId: contact.id,
            type: ActivityType.UNSUBSCRIBED,
            metadata: JSON.stringify({
              unsubscribeMethod: 'email_link',
              userAgent: request.headers.get('user-agent') || 'Unknown',
              timestamp: new Date().toISOString(),
            }),
          },
        });
      } catch (error) {
        // Don't fail the unsubscribe if activity recording fails
        logger.warn('Failed to record unsubscribe activity', { error, campaignId, contactId: contact.id });
      }
    }

    logger.info('Contact unsubscribed via email link', {
      contactId: contact.id,
      email: contact.email,
      campaignId
    });

    // Redirect to unsubscribe confirmation page
    return NextResponse.redirect(`/unsubscribe?success=true&email=${encodeURIComponent(email)}`);

  } catch (error) {
    logger.error('Error processing unsubscribe request', error);
    return NextResponse.redirect('/unsubscribe?error=server_error');
  }
}

// POST - Handle programmatic unsubscribe requests
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, campaignId, reason } = body;

    if (!email) {
      return validationError('Email is required');
    }

    // Find the contact by email
    const contact = await prisma.contact.findFirst({
      where: { email },
      select: { id: true, email: true, status: true }
    });

    if (!contact) {
      return NextResponse.json({
        success: false,
        error: 'Contact not found'
      }, { status: 404 });
    }

    if (contact.status === 'UNSUBSCRIBED') {
      return NextResponse.json({
        success: true,
        message: 'Contact already unsubscribed',
        alreadyUnsubscribed: true
      });
    }

    // Update contact status to unsubscribed
    await prisma.contact.update({
      where: { id: contact.id },
      data: { 
        status: 'UNSUBSCRIBED',
        unsubscribedAt: new Date()
      }
    });

    // Record unsubscribe activity if campaign is provided
    if (campaignId) {
      try {
        await prisma.emailActivity.create({
          data: {
            id: randomUUID(),
            campaignId,
            contactId: contact.id,
            type: ActivityType.UNSUBSCRIBED,
            metadata: JSON.stringify({
              unsubscribeMethod: 'api_request',
              reason: reason || 'No reason provided',
              userAgent: request.headers.get('user-agent') || 'Unknown',
              timestamp: new Date().toISOString(),
            }),
          },
        });
      } catch (error) {
        // Don't fail the unsubscribe if activity recording fails
        logger.warn('Failed to record unsubscribe activity', { error, campaignId, contactId: contact.id });
      }
    }

    logger.info('Contact unsubscribed via API', {
      contactId: contact.id,
      email: contact.email,
      campaignId,
      reason
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed',
      contactId: contact.id
    });

  } catch (error) {
    console.error('Error processing unsubscribe request:', error);
    return handleApiError(error, '/api/email/unsubscribe/route.ts');
  }
}