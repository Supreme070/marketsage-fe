import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';
import { unifiedMessagingService } from '@/lib/messaging/unified-messaging-service';
import { emailService } from '@/lib/email-providers/email-service';
import { smsService } from '@/lib/sms-providers/sms-service';
import { whatsappService } from '@/lib/whatsapp-service';

const messagingModelSchema = z.object({
  messagingModel: z.enum(['customer_managed', 'platform_managed']),
  notifyUsers: z.boolean().optional().default(true),
  reason: z.string().optional(),
});

const testConfigurationSchema = z.object({
  testPhone: z.string().min(1, 'Test phone number is required'),
  testEmail: z.string().email('Valid email is required'),
  channels: z.array(z.enum(['sms', 'email', 'whatsapp'])).min(1, 'At least one channel is required'),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organization.id;

    // Get current messaging configuration
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        messagingModel: true,
        creditBalance: true,
        autoTopUp: true,
        autoTopUpAmount: true,
        autoTopUpThreshold: true,
        preferredProviders: true,
        region: true,
      }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get provider configurations
    const [smsProviders, emailProviders, whatsappConfigs] = await Promise.all([
      prisma.sMSProvider.findMany({
        where: { organizationId, isActive: true },
        select: {
          id: true,
          providerType: true,
          fromNumber: true,
          isActive: true,
          createdAt: true,
        }
      }),
      prisma.emailProvider.findMany({
        where: { organizationId, isActive: true },
        select: {
          id: true,
          providerType: true,
          fromEmail: true,
          fromName: true,
          isActive: true,
          createdAt: true,
        }
      }),
      prisma.whatsAppBusinessConfig.findMany({
        where: { organizationId, isActive: true },
        select: {
          id: true,
          phoneNumber: true,
          displayName: true,
          verificationStatus: true,
          isActive: true,
          createdAt: true,
        }
      })
    ]);

    // Get recent usage analytics
    const recentUsage = await prisma.messagingUsage.findMany({
      where: {
        organizationId,
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    const usageSummary = recentUsage.reduce((acc, usage) => {
      if (!acc[usage.channel]) {
        acc[usage.channel] = { messages: 0, credits: 0 };
      }
      acc[usage.channel].messages += usage.messageCount;
      acc[usage.channel].credits += usage.credits;
      return acc;
    }, {} as Record<string, { messages: number; credits: number }>);

    return NextResponse.json({
      success: true,
      configuration: {
        messagingModel: organization.messagingModel || 'customer_managed',
        creditBalance: organization.creditBalance || 0,
        autoTopUp: organization.autoTopUp || false,
        autoTopUpAmount: organization.autoTopUpAmount || 100,
        autoTopUpThreshold: organization.autoTopUpThreshold || 10,
        preferredProviders: organization.preferredProviders ? JSON.parse(organization.preferredProviders) : {},
        region: organization.region || 'ng',
      },
      providers: {
        sms: smsProviders,
        email: emailProviders,
        whatsapp: whatsappConfigs,
      },
      usage: {
        summary: usageSummary,
        recent: recentUsage.slice(0, 10) // Last 10 transactions
      },
      capabilities: {
        canSwitchToCustomerManaged: smsProviders.length > 0 || emailProviders.length > 0 || whatsappConfigs.length > 0,
        canSwitchToPlatformManaged: true, // Always available
        configuredChannels: {
          sms: smsProviders.length > 0,
          email: emailProviders.length > 0,
          whatsapp: whatsappConfigs.length > 0,
        }
      }
    });
  } catch (error) {
    console.error('Error fetching messaging configuration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organization.id;
    const body = await request.json();
    const { messagingModel, notifyUsers, reason } = messagingModelSchema.parse(body);

    // Get current configuration
    const currentOrg = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { messagingModel: true, name: true }
    });

    if (!currentOrg) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if switching to customer_managed but no providers configured
    if (messagingModel === 'customer_managed') {
      const [smsCount, emailCount, whatsappCount] = await Promise.all([
        prisma.sMSProvider.count({ where: { organizationId, isActive: true } }),
        prisma.emailProvider.count({ where: { organizationId, isActive: true } }),
        prisma.whatsAppBusinessConfig.count({ where: { organizationId, isActive: true } })
      ]);

      if (smsCount === 0 && emailCount === 0 && whatsappCount === 0) {
        return NextResponse.json({
          error: 'No messaging providers configured. Please configure at least one provider before switching to customer-managed mode.',
          code: 'NO_PROVIDERS_CONFIGURED'
        }, { status: 400 });
      }
    }

    // Update messaging model
    const updatedOrg = await prisma.organization.update({
      where: { id: organizationId },
      data: { messagingModel },
      select: {
        id: true,
        name: true,
        messagingModel: true,
        creditBalance: true,
      }
    });

    // Clear provider caches to ensure fresh configuration loading
    smsService.clearOrganizationCache(organizationId);
    emailService.clearOrganizationCache(organizationId);
    whatsappService.clearOrganizationCache(organizationId);

    // Log the model switch for audit
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: session.user.id,
        action: 'MESSAGING_MODEL_SWITCH',
        resource: 'Organization',
        resourceId: organizationId,
        details: {
          from: currentOrg.messagingModel,
          to: messagingModel,
          reason,
          userEmail: session.user.email,
          timestamp: new Date().toISOString()
        }
      }
    }).catch(error => {
      // Don't fail the request if audit logging fails
      console.error('Failed to create audit log:', error);
    });

    // Send notification to organization admins if requested
    if (notifyUsers) {
      try {
        const adminUsers = await prisma.user.findMany({
          where: {
            organizationId,
            role: { in: ['ADMIN', 'SUPER_ADMIN'] }
          },
          select: { email: true, name: true }
        });

        const orgName = updatedOrg.name || 'Your Organization';
        const modelName = messagingModel === 'customer_managed' ? 'Customer-Managed' : 'Platform-Managed';

        // Send notification emails to admins
        for (const admin of adminUsers) {
          await unifiedMessagingService.sendMessage({
            to: admin.email,
            content: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #007bff;">Messaging Model Changed</h2>
                <p>Hello ${admin.name || 'Admin'},</p>
                <p>The messaging model for <strong>${orgName}</strong> has been changed to <strong>${modelName}</strong>.</p>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p><strong>Changed by:</strong> ${session.user.name || session.user.email}</p>
                  <p><strong>New Model:</strong> ${modelName}</p>
                  <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                  ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
                </div>
                <p>This change affects how your organization sends messages through MarketSage.</p>
                <ul>
                  <li><strong>Customer-Managed:</strong> Use your own provider API keys (no credits charged)</li>
                  <li><strong>Platform-Managed:</strong> Use MarketSage's providers (credits charged per message)</li>
                </ul>
                <p>If you have any questions, please contact our support team.</p>
                <hr style="margin: 30px 0; border: 1px solid #eee;">
                <p style="font-size: 12px; color: #666;">
                  This notification was sent from MarketSage.<br>
                  <a href="https://marketsage.africa">MarketSage - Smart Marketing Solutions</a>
                </p>
              </div>
            `,
            channel: 'email',
            organizationId: organizationId
          });
        }
      } catch (notificationError) {
        console.error('Failed to send notifications:', notificationError);
        // Don't fail the request if notifications fail
      }
    }

    return NextResponse.json({
      success: true,
      message: `Messaging model successfully changed to ${messagingModel}`,
      organization: updatedOrg,
      switchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating messaging model:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid input data', 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organization.id;
    const body = await request.json();
    
    if (body.action === 'test-configuration') {
      const { testPhone, testEmail, channels } = testConfigurationSchema.parse(body);

      const testResults = [];

      // Test each requested channel
      for (const channel of channels) {
        const testStart = Date.now();
        let result;

        try {
          switch (channel) {
            case 'sms':
              result = await smsService.sendSMS(
                testPhone, 
                `Test SMS from MarketSage - ${new Date().toISOString()}`,
                organizationId
              );
              break;

            case 'email':
              result = await emailService.sendEmail(organizationId, {
                to: testEmail,
                from: 'noreply@marketsage.africa',
                subject: 'MarketSage Configuration Test',
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #007bff;">Configuration Test Successful!</h2>
                    <p>This is a test email to verify your MarketSage email configuration.</p>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                      <p><strong>Organization ID:</strong> ${organizationId}</p>
                      <p><strong>Test Time:</strong> ${new Date().toISOString()}</p>
                      <p><strong>Channel:</strong> Email</p>
                    </div>
                    <p>If you received this email, your email configuration is working correctly!</p>
                  </div>
                `,
                text: `MarketSage Configuration Test - This test email was sent at ${new Date().toISOString()}`
              });
              break;

            case 'whatsapp':
              result = await whatsappService.testOrganizationWhatsApp(
                organizationId,
                testPhone,
                `Test WhatsApp from MarketSage - ${new Date().toISOString()}`
              );
              break;

            default:
              result = { success: false, error: { message: 'Unsupported channel' } };
          }

          testResults.push({
            channel,
            success: result.success,
            messageId: result.messageId,
            duration: Date.now() - testStart,
            error: result.error?.message,
            provider: (result as any).provider
          });
        } catch (error) {
          testResults.push({
            channel,
            success: false,
            duration: Date.now() - testStart,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return NextResponse.json({
        success: true,
        testResults,
        summary: {
          total: testResults.length,
          successful: testResults.filter(r => r.success).length,
          failed: testResults.filter(r => !r.success).length,
          testedAt: new Date().toISOString()
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error testing configuration:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid input data', 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}