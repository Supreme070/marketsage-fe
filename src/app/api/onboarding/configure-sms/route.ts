import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';

const configureSMSSchema = z.object({
  provider: z.enum(['africastalking', 'twilio', 'termii', 'nexmo']),
  credentials: z.record(z.string()),
  senderId: z.string().optional(),
});

interface SMSProviderConfig {
  provider: string;
  credentials: Record<string, string>;
  senderId?: string;
  isActive: boolean;
  verificationStatus: 'pending' | 'verified' | 'failed';
}

// Validate provider-specific credentials
function validateCredentials(provider: string, credentials: Record<string, string>): { valid: boolean; missing: string[] } {
  const requirements = {
    africastalking: ['username', 'apiKey'],
    twilio: ['accountSid', 'authToken', 'phoneNumber'],
    termii: ['apiKey', 'senderId'],
    nexmo: ['apiKey', 'apiSecret']
  };

  const required = requirements[provider as keyof typeof requirements] || [];
  const missing = required.filter(field => !credentials[field]);

  return { valid: missing.length === 0, missing };
}

// Test SMS provider connection (basic validation)
async function testProviderConnection(provider: string, credentials: Record<string, string>): Promise<boolean> {
  try {
    switch (provider) {
      case 'africastalking':
        // Basic format validation for Africa's Talking
        return !!(credentials.username && credentials.apiKey && credentials.apiKey.length > 10);
      
      case 'twilio':
        // Basic format validation for Twilio
        return !!(
          credentials.accountSid?.startsWith('AC') &&
          credentials.authToken?.length > 20 &&
          credentials.phoneNumber?.startsWith('+')
        );
      
      case 'termii':
        // Basic format validation for Termii
        return !!(credentials.apiKey && credentials.senderId);
      
      case 'nexmo':
        // Basic format validation for Vonage/Nexmo
        return !!(credentials.apiKey && credentials.apiSecret);
      
      default:
        return false;
    }
  } catch (error) {
    logger.warn('Provider connection test failed', { provider, error });
    return false;
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
    const { provider, credentials, senderId } = configureSMSSchema.parse(body);

    logger.info('Configuring SMS provider', { 
      provider, 
      userId: session.user.id,
      organizationId: session.user.organizationId 
    });

    // Validate provider-specific credentials
    const validation = validateCredentials(provider, credentials);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Missing required credentials', 
          missing: validation.missing 
        },
        { status: 400 }
      );
    }

    // Test provider connection
    const connectionValid = await testProviderConnection(provider, credentials);
    const verificationStatus = connectionValid ? 'verified' : 'pending';

    // Encrypt credentials before storing (in production, use proper encryption)
    const encryptedCredentials = credentials; // TODO: Add encryption

    // Store configuration in database
    const smsConfig = await prisma.sMSProvider.upsert({
      where: {
        organizationId: session.user.organizationId
      },
      update: {
        provider,
        credentials: encryptedCredentials,
        senderId: senderId || null,
        isActive: true,
        verificationStatus,
        updatedAt: new Date()
      },
      create: {
        organizationId: session.user.organizationId,
        provider,
        credentials: encryptedCredentials,
        senderId: senderId || null,
        isActive: true,
        verificationStatus
      }
    });

    logger.info('SMS provider configured successfully', {
      provider,
      verificationStatus,
      userId: session.user.id,
      organizationId: session.user.organizationId
    });

    // Return configuration without sensitive credentials
    const responseConfig: SMSProviderConfig = {
      provider: smsConfig.provider,
      credentials: Object.keys(credentials).reduce((acc, key) => {
        acc[key] = credentials[key] ? '***' : '';
        return acc;
      }, {} as Record<string, string>),
      senderId: smsConfig.senderId || undefined,
      isActive: smsConfig.isActive,
      verificationStatus: smsConfig.verificationStatus as 'pending' | 'verified' | 'failed'
    };

    return NextResponse.json(responseConfig);

  } catch (error) {
    logger.error('SMS configuration failed', {
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
      { error: 'SMS configuration failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get current SMS configuration
    const smsConfig = await prisma.sMSProvider.findUnique({
      where: {
        organizationId: session.user.organizationId
      }
    });

    if (!smsConfig) {
      return NextResponse.json(
        { error: 'No SMS configuration found' },
        { status: 404 }
      );
    }

    // Return configuration without sensitive credentials
    const responseConfig: SMSProviderConfig = {
      provider: smsConfig.provider,
      credentials: Object.keys(smsConfig.credentials as Record<string, string>).reduce((acc, key) => {
        acc[key] = '***';
        return acc;
      }, {} as Record<string, string>),
      senderId: smsConfig.senderId || undefined,
      isActive: smsConfig.isActive,
      verificationStatus: smsConfig.verificationStatus as 'pending' | 'verified' | 'failed'
    };

    return NextResponse.json(responseConfig);

  } catch (error) {
    logger.error('Failed to get SMS configuration', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { error: 'Failed to get SMS configuration' },
      { status: 500 }
    );
  }
}