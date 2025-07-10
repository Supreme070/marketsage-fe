import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user?.organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get organization settings or create default ones
    let orgSettings = await prisma.organizationSettings.findUnique({
      where: { organizationId: user.organization.id }
    });

    if (!orgSettings) {
      // Create default settings
      orgSettings = await prisma.organizationSettings.create({
        data: {
          organizationId: user.organization.id,
          settings: {
            sms: {
              messagingModel: 'customer_managed',
              defaultProvider: 'TWILIO',
              enableInternationalSMS: false,
              enableDeliveryReports: true,
              rateLimitPerMinute: 60,
              budgetAlert: {
                enabled: true,
                monthlyLimit: 1000,
                alertThreshold: 80
              }
            }
          }
        }
      });
    }

    const smsSettings = (orgSettings.settings as any)?.sms || {
      messagingModel: 'customer_managed',
      defaultProvider: 'TWILIO',
      enableInternationalSMS: false,
      enableDeliveryReports: true,
      rateLimitPerMinute: 60,
      budgetAlert: {
        enabled: true,
        monthlyLimit: 1000,
        alertThreshold: 80
      }
    };

    return NextResponse.json({
      success: true,
      settings: smsSettings
    });

  } catch (error) {
    logger.error('Error fetching SMS settings:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      messagingModel, 
      defaultProvider, 
      enableInternationalSMS, 
      enableDeliveryReports, 
      rateLimitPerMinute, 
      budgetAlert 
    } = body;

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user?.organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get existing settings
    const existingSettings = await prisma.organizationSettings.findUnique({
      where: { organizationId: user.organization.id }
    });

    const currentSettings = existingSettings?.settings || {};
    
    // Update SMS settings
    const updatedSettings = {
      ...currentSettings,
      sms: {
        messagingModel: messagingModel || 'customer_managed',
        defaultProvider: defaultProvider || 'TWILIO',
        enableInternationalSMS: enableInternationalSMS !== undefined ? enableInternationalSMS : false,
        enableDeliveryReports: enableDeliveryReports !== undefined ? enableDeliveryReports : true,
        rateLimitPerMinute: rateLimitPerMinute || 60,
        budgetAlert: {
          enabled: budgetAlert?.enabled !== undefined ? budgetAlert.enabled : true,
          monthlyLimit: budgetAlert?.monthlyLimit || 1000,
          alertThreshold: budgetAlert?.alertThreshold || 80
        }
      }
    };

    // Upsert organization settings
    await prisma.organizationSettings.upsert({
      where: { organizationId: user.organization.id },
      create: {
        organizationId: user.organization.id,
        settings: updatedSettings
      },
      update: {
        settings: updatedSettings,
        updatedAt: new Date()
      }
    });

    logger.info('SMS settings updated', {
      organizationId: user.organization.id,
      userId: session.user.id,
      messagingModel
    });

    return NextResponse.json({
      success: true,
      settings: updatedSettings.sms
    });

  } catch (error) {
    logger.error('Error updating SMS settings:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}