import { type NextRequest, NextResponse } from 'next/server';
import { smsService } from '@/lib/sms-providers/sms-service';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message, organizationId, provider } = await request.json();

    if (!phoneNumber || !message) {
      return NextResponse.json({
        success: false,
        error: 'Phone number and message are required'
      }, { status: 400 });
    }

    // Test SMS sending with optional provider selection
    const result = await smsService.sendSMS(phoneNumber, message, organizationId, provider);

    logger.info('SMS test result:', { 
      success: result.success, 
      provider: result.provider || 'unknown',
      phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*') // Mask phone number for logs
    });

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      provider: result.provider || 'unknown',
      error: result.error || null
    });

  } catch (error) {
    logger.error('SMS test API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get SMS service status
    const configuredProviders = smsService.getConfiguredProviders();
    const currentProvider = smsService.getCurrentProvider();
    const isConfigured = smsService.isConfigured();

    return NextResponse.json({
      success: true,
      configured: isConfigured,
      currentProvider,
      availableProviders: configuredProviders
    });

  } catch (error) {
    logger.error('SMS status API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}