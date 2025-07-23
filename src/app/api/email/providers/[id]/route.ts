import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import crypto from 'crypto';

// Validation schema for updates
const updateEmailProviderSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  fromEmail: z.string().email('Valid email is required').optional(),
  fromName: z.string().optional(),
  replyToEmail: z.string().email().optional(),
  
  // API-based provider fields
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  domain: z.string().optional(),
  
  // SMTP fields
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  smtpUsername: z.string().optional(),
  smtpPassword: z.string().optional(),
  smtpSecure: z.boolean().optional(),
  
  // Tracking
  trackingDomain: z.string().optional(),
  enableTracking: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// Encryption utilities
const encrypt = (text: string): string => {
  const key = process.env.ENCRYPTION_KEY || 'default-key-for-development';
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const decrypt = (encryptedText: string): string => {
  try {
    const key = process.env.ENCRYPTION_KEY || 'default-key-for-development';
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    logger.error('Decryption failed:', error);
    return encryptedText;
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providerId = params.id;

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user?.organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get the email provider
    const emailProvider = await prisma.emailProvider.findFirst({
      where: {
        id: providerId,
        organizationId: user.organization.id
      }
    });

    if (!emailProvider) {
      return NextResponse.json({ error: 'Email provider not found' }, { status: 404 });
    }

    // Return provider without sensitive data
    return NextResponse.json({
      success: true,
      provider: {
        id: emailProvider.id,
        providerType: emailProvider.providerType,
        name: emailProvider.name,
        fromEmail: emailProvider.fromEmail,
        fromName: emailProvider.fromName,
        replyToEmail: emailProvider.replyToEmail,
        domain: emailProvider.domain,
        smtpHost: emailProvider.smtpHost,
        smtpPort: emailProvider.smtpPort,
        smtpUsername: emailProvider.smtpUsername,
        smtpSecure: emailProvider.smtpSecure,
        trackingDomain: emailProvider.trackingDomain,
        enableTracking: emailProvider.enableTracking,
        isActive: emailProvider.isActive,
        verificationStatus: emailProvider.verificationStatus,
        lastTested: emailProvider.lastTested,
        testStatus: emailProvider.testStatus,
        isConfigured: !!(
          emailProvider.providerType === 'smtp' 
            ? (emailProvider.smtpHost && emailProvider.smtpUsername && emailProvider.smtpPassword)
            : emailProvider.apiKey
        ),
        createdAt: emailProvider.createdAt,
        updatedAt: emailProvider.updatedAt
      }
    });

  } catch (error) {
    logger.error('Error fetching email provider:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providerId = params.id;
    const body = await request.json();
    
    // Validate input
    const validationResult = updateEmailProviderSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationResult.error.issues 
      }, { status: 400 });
    }

    const data = validationResult.data;

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user?.organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get the email provider
    const existingProvider = await prisma.emailProvider.findFirst({
      where: {
        id: providerId,
        organizationId: user.organization.id
      }
    });

    if (!existingProvider) {
      return NextResponse.json({ error: 'Email provider not found' }, { status: 404 });
    }

    // Prepare update data with encryption for sensitive fields
    const updateData: any = {};
    
    // Only update provided fields
    if (data.name !== undefined) updateData.name = data.name;
    if (data.fromEmail !== undefined) updateData.fromEmail = data.fromEmail;
    if (data.fromName !== undefined) updateData.fromName = data.fromName;
    if (data.replyToEmail !== undefined) updateData.replyToEmail = data.replyToEmail;
    if (data.domain !== undefined) updateData.domain = data.domain;
    if (data.trackingDomain !== undefined) updateData.trackingDomain = data.trackingDomain;
    if (data.enableTracking !== undefined) updateData.enableTracking = data.enableTracking;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    // Handle encrypted fields
    if (data.apiKey !== undefined) updateData.apiKey = data.apiKey ? encrypt(data.apiKey) : null;
    if (data.apiSecret !== undefined) updateData.apiSecret = data.apiSecret ? encrypt(data.apiSecret) : null;
    if (data.smtpPassword !== undefined) updateData.smtpPassword = data.smtpPassword ? encrypt(data.smtpPassword) : null;

    // Handle SMTP fields
    if (data.smtpHost !== undefined) updateData.smtpHost = data.smtpHost;
    if (data.smtpPort !== undefined) updateData.smtpPort = data.smtpPort;
    if (data.smtpUsername !== undefined) updateData.smtpUsername = data.smtpUsername;
    if (data.smtpSecure !== undefined) updateData.smtpSecure = data.smtpSecure;

    // Update the email provider
    const emailProvider = await prisma.emailProvider.update({
      where: { id: providerId },
      data: updateData
    });

    logger.info('Email provider updated', {
      providerId: emailProvider.id,
      organizationId: user.organization.id,
      userId: session.user.id,
      updatedFields: Object.keys(updateData)
    });

    // Return provider without sensitive data
    return NextResponse.json({
      success: true,
      provider: {
        id: emailProvider.id,
        providerType: emailProvider.providerType,
        name: emailProvider.name,
        fromEmail: emailProvider.fromEmail,
        fromName: emailProvider.fromName,
        replyToEmail: emailProvider.replyToEmail,
        domain: emailProvider.domain,
        trackingDomain: emailProvider.trackingDomain,
        enableTracking: emailProvider.enableTracking,
        isActive: emailProvider.isActive,
        verificationStatus: emailProvider.verificationStatus,
        lastTested: emailProvider.lastTested,
        testStatus: emailProvider.testStatus,
        isConfigured: !!(
          emailProvider.providerType === 'smtp' 
            ? (emailProvider.smtpHost && emailProvider.smtpUsername && emailProvider.smtpPassword)
            : emailProvider.apiKey
        ),
        createdAt: emailProvider.createdAt,
        updatedAt: emailProvider.updatedAt
      }
    });

  } catch (error) {
    logger.error('Error updating email provider:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providerId = params.id;

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user?.organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if provider exists and belongs to organization
    const existingProvider = await prisma.emailProvider.findFirst({
      where: {
        id: providerId,
        organizationId: user.organization.id
      }
    });

    if (!existingProvider) {
      return NextResponse.json({ error: 'Email provider not found' }, { status: 404 });
    }

    // Delete the email provider
    await prisma.emailProvider.delete({
      where: { id: providerId }
    });

    logger.info('Email provider deleted', {
      providerId,
      organizationId: user.organization.id,
      userId: session.user.id
    });

    return NextResponse.json({
      success: true,
      message: 'Email provider deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting email provider:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}