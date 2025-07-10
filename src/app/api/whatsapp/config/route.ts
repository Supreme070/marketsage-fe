import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';
import crypto from 'crypto';

const whatsappConfigSchema = z.object({
  businessAccountId: z.string().min(1, 'Business Account ID is required'),
  phoneNumberId: z.string().min(1, 'Phone Number ID is required'),
  accessToken: z.string().min(1, 'Access Token is required'),
  phoneNumber: z.string().optional(),
  displayName: z.string().optional(),
  isActive: z.boolean().optional(),
});

const testMessageSchema = z.object({
  phoneNumber: z.string().min(1, 'Phone number is required'),
  message: z.string().min(1, 'Message is required'),
});

// Encrypt sensitive data
const encrypt = (text: string): string => {
  const key = process.env.ENCRYPTION_KEY || 'default-key-for-development';
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

// Decrypt sensitive data
const decrypt = (encryptedText: string): string => {
  try {
    const key = process.env.ENCRYPTION_KEY || 'default-key-for-development';
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedText; // Return as-is if decryption fails
  }
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await prisma.whatsAppBusinessConfig.findUnique({
      where: { organizationId: session.user.organization.id },
      select: {
        id: true,
        businessAccountId: true,
        phoneNumberId: true,
        phoneNumber: true,
        displayName: true,
        isActive: true,
        verificationStatus: true,
        webhookUrl: true,
        verifyToken: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!config) {
      // Generate default webhook configuration
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const webhookUrl = `${baseUrl}/api/webhooks/whatsapp`;
      const verifyToken = `verify_${Math.random().toString(36).substring(2, 15)}`;
      
      return NextResponse.json({
        isConfigured: false,
        webhookUrl,
        verifyToken,
      });
    }

    return NextResponse.json({
      isConfigured: true,
      config: {
        ...config,
        accessToken: undefined, // Never return access token
      },
    });
  } catch (error) {
    console.error('Error fetching WhatsApp config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = whatsappConfigSchema.parse(body);

    // Encrypt the access token
    const encryptedToken = encrypt(validatedData.accessToken);

    // Generate webhook configuration
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const webhookUrl = `${baseUrl}/api/webhooks/whatsapp`;
    const verifyToken = `verify_${Math.random().toString(36).substring(2, 15)}`;

    const config = await prisma.whatsAppBusinessConfig.upsert({
      where: { organizationId: session.user.organization.id },
      update: {
        businessAccountId: validatedData.businessAccountId,
        phoneNumberId: validatedData.phoneNumberId,
        accessToken: encryptedToken,
        phoneNumber: validatedData.phoneNumber,
        displayName: validatedData.displayName,
        isActive: validatedData.isActive ?? true,
        verificationStatus: 'pending',
        webhookUrl,
        verifyToken,
      },
      create: {
        organizationId: session.user.organization.id,
        businessAccountId: validatedData.businessAccountId,
        phoneNumberId: validatedData.phoneNumberId,
        accessToken: encryptedToken,
        phoneNumber: validatedData.phoneNumber,
        displayName: validatedData.displayName,
        isActive: validatedData.isActive ?? true,
        verificationStatus: 'pending',
        webhookUrl,
        verifyToken,
      },
      select: {
        id: true,
        businessAccountId: true,
        phoneNumberId: true,
        phoneNumber: true,
        displayName: true,
        isActive: true,
        verificationStatus: true,
        webhookUrl: true,
        verifyToken: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('Error saving WhatsApp config:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Check if this is a test message request
    if (body.action === 'test') {
      const { phoneNumber, message } = testMessageSchema.parse(body);
      
      // Get the configuration
      const config = await prisma.whatsAppBusinessConfig.findUnique({
        where: { organizationId: session.user.organization.id },
      });

      if (!config) {
        return NextResponse.json({ error: 'WhatsApp not configured' }, { status: 400 });
      }

      // Decrypt the access token
      const accessToken = decrypt(config.accessToken);

      // Send test message via WhatsApp Business API
      const testResult = await sendTestMessage(
        accessToken,
        config.phoneNumberId,
        phoneNumber,
        message
      );

      if (testResult.success) {
        // Update verification status
        await prisma.whatsAppBusinessConfig.update({
          where: { id: config.id },
          data: { verificationStatus: 'verified' },
        });
      }

      return NextResponse.json(testResult);
    }

    // Handle configuration updates
    const validatedData = whatsappConfigSchema.parse(body);
    
    const config = await prisma.whatsAppBusinessConfig.findUnique({
      where: { organizationId: session.user.organization.id },
    });

    if (!config) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    // Encrypt the access token if it's being updated
    const encryptedToken = validatedData.accessToken ? encrypt(validatedData.accessToken) : config.accessToken;

    const updatedConfig = await prisma.whatsAppBusinessConfig.update({
      where: { id: config.id },
      data: {
        businessAccountId: validatedData.businessAccountId,
        phoneNumberId: validatedData.phoneNumberId,
        accessToken: encryptedToken,
        phoneNumber: validatedData.phoneNumber,
        displayName: validatedData.displayName,
        isActive: validatedData.isActive ?? config.isActive,
        verificationStatus: validatedData.accessToken ? 'pending' : config.verificationStatus,
      },
      select: {
        id: true,
        businessAccountId: true,
        phoneNumberId: true,
        phoneNumber: true,
        displayName: true,
        isActive: true,
        verificationStatus: true,
        webhookUrl: true,
        verifyToken: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      config: updatedConfig,
    });
  } catch (error) {
    console.error('Error updating WhatsApp config:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function sendTestMessage(
  accessToken: string,
  phoneNumberId: string,
  to: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Format phone number for WhatsApp
    const cleanPhoneNumber = to.replace(/\D/g, '');
    const formattedPhoneNumber = cleanPhoneNumber.startsWith('234') 
      ? cleanPhoneNumber 
      : '234' + cleanPhoneNumber.replace(/^0/, '');

    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      to: formattedPhoneNumber,
      type: 'text',
      text: {
        body: message
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data.messages && data.messages.length > 0) {
      return {
        success: true,
        messageId: data.messages[0].id,
      };
    } else {
      return {
        success: false,
        error: data.error?.message || 'Failed to send test message',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.whatsAppBusinessConfig.delete({
      where: { organizationId: session.user.organization.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting WhatsApp config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}