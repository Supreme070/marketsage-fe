import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import crypto from 'crypto';

// Validation schemas
const emailProviderSchema = z.object({
  providerType: z.enum(['mailgun', 'sendgrid', 'smtp', 'postmark', 'ses']),
  name: z.string().min(1, 'Name is required'),
  fromEmail: z.string().email('Valid email is required'),
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

    // Get email providers for the organization
    const emailProviders = await prisma.emailProvider.findMany({
      where: { organizationId: user.organization.id },
      orderBy: { createdAt: 'desc' }
    });

    // Transform providers to hide sensitive data and include configuration status
    const providers = emailProviders.map(provider => ({
      id: provider.id,
      providerType: provider.providerType,
      name: provider.name,
      fromEmail: provider.fromEmail,
      fromName: provider.fromName,
      replyToEmail: provider.replyToEmail,
      domain: provider.domain,
      trackingDomain: provider.trackingDomain,
      enableTracking: provider.enableTracking,
      isActive: provider.isActive,
      verificationStatus: provider.verificationStatus,
      lastTested: provider.lastTested,
      testStatus: provider.testStatus,
      isConfigured: !!(
        provider.providerType === 'smtp' 
          ? (provider.smtpHost && provider.smtpUsername && provider.smtpPassword)
          : provider.apiKey
      ),
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt
    }));

    return NextResponse.json({ 
      success: true, 
      providers 
    });

  } catch (error) {
    logger.error('Error fetching email providers:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = emailProviderSchema.safeParse(body);
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

    // Check if organization already has an email provider (unique constraint)
    const existingProvider = await prisma.emailProvider.findUnique({
      where: { organizationId: user.organization.id }
    });

    if (existingProvider) {
      return NextResponse.json({ 
        error: 'Organization already has an email provider. Use PUT to update.' 
      }, { status: 400 });
    }

    // Validate provider-specific required fields
    if (data.providerType === 'smtp') {
      if (!data.smtpHost || !data.smtpUsername || !data.smtpPassword) {
        return NextResponse.json({ 
          error: 'SMTP host, username, and password are required for SMTP provider' 
        }, { status: 400 });
      }
    } else {
      if (!data.apiKey) {
        return NextResponse.json({ 
          error: 'API Key is required for API-based providers' 
        }, { status: 400 });
      }
    }

    // Create the email provider with encrypted sensitive fields
    const emailProvider = await prisma.emailProvider.create({
      data: {
        id: randomUUID(),
        organizationId: user.organization.id,
        providerType: data.providerType,
        name: data.name,
        fromEmail: data.fromEmail,
        fromName: data.fromName,
        replyToEmail: data.replyToEmail,
        
        // Encrypt sensitive fields
        apiKey: data.apiKey ? encrypt(data.apiKey) : null,
        apiSecret: data.apiSecret ? encrypt(data.apiSecret) : null,
        domain: data.domain,
        
        // SMTP config
        smtpHost: data.smtpHost,
        smtpPort: data.smtpPort,
        smtpUsername: data.smtpUsername,
        smtpPassword: data.smtpPassword ? encrypt(data.smtpPassword) : null,
        smtpSecure: data.smtpSecure ?? true,
        
        // Tracking config
        trackingDomain: data.trackingDomain,
        enableTracking: data.enableTracking ?? true,
        
        isActive: true,
        verificationStatus: 'pending'
      }
    });

    logger.info('Email provider created', {
      providerId: emailProvider.id,
      providerType: data.providerType,
      organizationId: user.organization.id,
      userId: session.user.id
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
        isConfigured: true,
        createdAt: emailProvider.createdAt
      }
    });

  } catch (error) {
    logger.error('Error creating email provider:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}