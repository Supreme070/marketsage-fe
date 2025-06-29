import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';

const testSMSSchema = z.object({
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format'),
  provider: z.enum(['africastalking', 'twilio', 'termii', 'nexmo']),
});

// Mock SMS sending function - replace with actual provider integrations
async function sendTestSMS(
  provider: string, 
  credentials: Record<string, string>, 
  phoneNumber: string, 
  senderId?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  
  const testMessage = `Hello from MarketSage! This is a test message to verify your SMS configuration. Time: ${new Date().toLocaleString()}`;

  try {
    switch (provider) {
      case 'africastalking':
        // Africa's Talking integration
        return await sendAfricasTalkingSMS(credentials, phoneNumber, testMessage, senderId);
      
      case 'twilio':
        // Twilio integration
        return await sendTwilioSMS(credentials, phoneNumber, testMessage);
      
      case 'termii':
        // Termii integration
        return await sendTermiiSMS(credentials, phoneNumber, testMessage, senderId);
      
      case 'nexmo':
        // Vonage/Nexmo integration
        return await sendNexmoSMS(credentials, phoneNumber, testMessage, senderId);
      
      default:
        return { success: false, error: 'Unsupported provider' };
    }
  } catch (error) {
    logger.error('SMS test failed', { provider, error });
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Africa's Talking SMS implementation
async function sendAfricasTalkingSMS(
  credentials: Record<string, string>, 
  phoneNumber: string, 
  message: string, 
  senderId?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Mock implementation - replace with actual Africa's Talking API call
    // const AfricasTalking = require('africastalking')(credentials);
    // const sms = AfricasTalking.SMS;
    // const options = {
    //   to: [phoneNumber],
    //   message: message,
    //   from: senderId
    // };
    // const result = await sms.send(options);
    
    // For now, simulate success for demonstration
    logger.info('Mock Africa\'s Talking SMS sent', { phoneNumber, senderId });
    
    return {
      success: true,
      messageId: `AT_${Date.now()}`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Africa\'s Talking API error'
    };
  }
}

// Twilio SMS implementation
async function sendTwilioSMS(
  credentials: Record<string, string>, 
  phoneNumber: string, 
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Mock implementation - replace with actual Twilio API call
    // const twilio = require('twilio')(credentials.accountSid, credentials.authToken);
    // const result = await twilio.messages.create({
    //   body: message,
    //   from: credentials.phoneNumber,
    //   to: phoneNumber
    // });
    
    // For now, simulate success for demonstration
    logger.info('Mock Twilio SMS sent', { phoneNumber });
    
    return {
      success: true,
      messageId: `TW_${Date.now()}`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Twilio API error'
    };
  }
}

// Termii SMS implementation
async function sendTermiiSMS(
  credentials: Record<string, string>, 
  phoneNumber: string, 
  message: string, 
  senderId?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Mock implementation - replace with actual Termii API call
    // const response = await fetch('https://api.ng.termii.com/api/sms/send', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     to: phoneNumber,
    //     from: senderId,
    //     sms: message,
    //     type: 'plain',
    //     api_key: credentials.apiKey,
    //     channel: 'generic'
    //   })
    // });
    
    // For now, simulate success for demonstration
    logger.info('Mock Termii SMS sent', { phoneNumber, senderId });
    
    return {
      success: true,
      messageId: `TM_${Date.now()}`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Termii API error'
    };
  }
}

// Nexmo/Vonage SMS implementation
async function sendNexmoSMS(
  credentials: Record<string, string>, 
  phoneNumber: string, 
  message: string, 
  senderId?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Mock implementation - replace with actual Vonage API call
    // const { Vonage } = require('@vonage/server-sdk');
    // const vonage = new Vonage({
    //   apiKey: credentials.apiKey,
    //   apiSecret: credentials.apiSecret
    // });
    // const result = await vonage.sms.send({
    //   to: phoneNumber,
    //   from: senderId || 'MarketSage',
    //   text: message
    // });
    
    // For now, simulate success for demonstration
    logger.info('Mock Vonage SMS sent', { phoneNumber, senderId });
    
    return {
      success: true,
      messageId: `VG_${Date.now()}`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Vonage API error'
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { phoneNumber, provider } = testSMSSchema.parse(body);

    logger.info('Testing SMS configuration', { 
      phoneNumber: phoneNumber.slice(0, 8) + '****', // Mask phone number in logs
      provider,
      userId: session.user.id,
      organizationId: session.user.organizationId 
    });

    // Get SMS configuration from database
    const smsConfig = await prisma.sMSProvider.findUnique({
      where: {
        organizationId: session.user.organizationId
      }
    });

    if (!smsConfig || !smsConfig.isActive) {
      return NextResponse.json(
        { error: 'SMS provider not configured or inactive' },
        { status: 400 }
      );
    }

    if (smsConfig.provider !== provider) {
      return NextResponse.json(
        { error: 'Provider mismatch' },
        { status: 400 }
      );
    }

    // Send test SMS
    const result = await sendTestSMS(
      provider,
      smsConfig.credentials as Record<string, string>,
      phoneNumber,
      smsConfig.senderId || undefined
    );

    if (!result.success) {
      logger.warn('SMS test failed', {
        provider,
        error: result.error,
        userId: session.user.id
      });

      return NextResponse.json(
        { error: 'Failed to send test SMS', details: result.error },
        { status: 500 }
      );
    }

    // Update verification status to verified if test was successful
    await prisma.sMSProvider.update({
      where: {
        organizationId: session.user.organizationId
      },
      data: {
        verificationStatus: 'verified',
        updatedAt: new Date()
      }
    });

    logger.info('SMS test successful', {
      provider,
      messageId: result.messageId,
      userId: session.user.id,
      organizationId: session.user.organizationId
    });

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: 'Test SMS sent successfully'
    });

  } catch (error) {
    logger.error('SMS test failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'SMS test failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}