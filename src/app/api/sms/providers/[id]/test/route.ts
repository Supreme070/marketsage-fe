import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { smsService } from '@/lib/sms-providers/sms-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { testPhoneNumber } = body;

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user?.organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if provider exists and belongs to the organization
    const provider = await prisma.sMSProvider.findFirst({
      where: {
        id,
        organizationId: user.organization.id
      }
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Use test phone number if not provided
    const phoneNumber = testPhoneNumber || '+2348012345678';

    // Test the SMS provider
    const testResult = await smsService.testOrganizationSMS(
      user.organization.id,
      phoneNumber
    );

    // Update provider test status
    await prisma.sMSProvider.update({
      where: { id },
      data: {
        testStatus: testResult.success ? 'SUCCESS' : 'FAILED',
        lastTested: new Date(),
        updatedAt: new Date()
      }
    });

    logger.info('SMS provider test completed', {
      providerId: id,
      organizationId: user.organization.id,
      userId: session.user.id,
      success: testResult.success,
      phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*') // Mask phone number
    });

    if (testResult.success) {
      return NextResponse.json({
        success: true,
        message: 'SMS provider test successful',
        messageId: testResult.messageId
      });
    } else {
      return NextResponse.json({
        success: false,
        error: testResult.error?.message || 'SMS provider test failed',
        code: testResult.error?.code || 'TEST_FAILED'
      }, { status: 400 });
    }

  } catch (error) {
    logger.error('Error testing SMS provider:', error);
    
    // Update provider test status to failed
    try {
      await prisma.sMSProvider.update({
        where: { id: params.id },
        data: {
          testStatus: 'FAILED',
          lastTested: new Date(),
          updatedAt: new Date()
        }
      });
    } catch (updateError) {
      logger.error('Error updating provider test status:', updateError);
    }

    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}