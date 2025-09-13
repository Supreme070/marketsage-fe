import { type NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api/client';
import { randomUUID } from 'crypto';

export async function GET() {
  try {
    // Create a test contact object
    const testContact = {
      id: randomUUID(),
      email: 'info@marketsage.africa', // Testing with the same email address
      firstName: 'Test',
      lastName: 'User'
    };

    // Create test campaign ID
    const testCampaignId = `test-${randomUUID()}`;

    // Create a test email template first
    const template = await apiClient.email.createTemplate({
      name: 'Test Email Template',
      description: 'Template for testing email functionality',
      subject: 'MarketSage Test Email - Backend Integration Working!',
      content: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; text-align: center;">🚀 MarketSage</h1>
                <p style="color: white; margin: 10px 0 0 0; text-align: center;">African Fintech Marketing Platform</p>
              </div>
              <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-top: 0;">✅ Backend Email System Successfully Configured!</h2>
                <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
                  <h3 style="margin: 0 0 10px 0; color: #2e7d32;">NestJS Backend Integration Active</h3>
                  <ul style="margin: 0; padding-left: 20px;">
                    <li><strong>Backend:</strong> NestJS EmailModule</li>
                    <li><strong>API:</strong> /api/v2/email/*</li>
                    <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
                    <li><strong>Campaign Tracking:</strong> Enabled</li>
                  </ul>
                </div>
                <p style="margin: 30px 0 20px 0;">Your MarketSage application is now ready to send professional emails for:</p>
                <div style="background: #f3e5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <ul style="margin: 0; padding-left: 20px;">
                    <li>📧 Email Marketing Campaigns</li>
                    <li>📊 Analytics & Tracking</li>
                    <li>🔄 Workflow Automation</li>
                    <li>👥 Contact Management</li>
                    <li>🎯 A/B Testing</li>
                  </ul>
                </div>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="font-size: 14px; color: #666; margin: 0;">
                  Best regards,<br>
                  <strong>MarketSage Development Team</strong><br>
                  🌍 African Fintech Marketing Excellence
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
      category: 'test'
    });

    // Create a test campaign
    const campaign = await apiClient.email.createCampaign({
      name: 'Test Email Campaign',
      description: 'Test campaign for email functionality',
      subject: 'MarketSage Test Email - Backend Integration Working!',
      templateId: template.id,
      status: 'DRAFT'
    });

    const result = {
      success: true,
      messageId: `test-${randomUUID()}`,
      provider: 'backend',
      campaign: campaign,
      template: template
    };

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Test email template and campaign created successfully via Backend!' : 'Failed to create test email',
      messageId: result.messageId,
      provider: result.provider,
      campaign: result.campaign,
      template: result.template,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        BACKEND_URL: process.env.NEXT_PUBLIC_API_URL,
      }
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        SMTP_HOST: process.env.SMTP_HOST,
        EMAIL_FROM: process.env.NEXT_PUBLIC_EMAIL_FROM,
        EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
      }
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { to, subject, message } = await req.json();

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, message' },
        { status: 400 }
      );
    }

    // Create a test contact object
    const testContact = {
      id: randomUUID(),
      email: to,
      firstName: 'Test',
      lastName: 'User'
    };

    // Create test campaign ID
    const testCampaignId = `test-${randomUUID()}`;

    // Create a custom email template
    const template = await apiClient.email.createTemplate({
      name: 'Custom Test Email Template',
      description: 'Custom template for testing email functionality',
      subject: subject,
      content: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; text-align: center;">MarketSage</h1>
                <p style="color: white; margin: 10px 0 0 0; text-align: center;">African Fintech Marketing Platform</p>
              </div>
              <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-top: 0;">Custom Test Email</h2>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  ${message}
                </div>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="font-size: 14px; color: #666; margin: 0;">
                  Sent from MarketSage via Backend API<br>
                  <strong>NestJS EmailModule</strong>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
      category: 'test'
    });

    // Create a custom campaign
    const campaign = await apiClient.email.createCampaign({
      name: 'Custom Test Email Campaign',
      description: 'Custom test campaign for email functionality',
      subject: subject,
      templateId: template.id,
      status: 'DRAFT'
    });

    const result = {
      success: true,
      messageId: `custom-test-${randomUUID()}`,
      provider: 'backend',
      campaign: campaign,
      template: template
    };

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Custom test email template and campaign created successfully!' : 'Failed to create test email',
      messageId: result.messageId,
      provider: result.provider,
      campaign: result.campaign,
      template: result.template
    });

  } catch (error) {
    console.error('Custom test email error:', error);
    return NextResponse.json(
      { error: 'Failed to send custom test email', details: (error as Error).message },
      { status: 500 }
    );
  }
} 