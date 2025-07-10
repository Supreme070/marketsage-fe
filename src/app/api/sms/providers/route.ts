import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';

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

    // Get SMS providers for the organization
    const smsProviders = await prisma.sMSProvider.findMany({
      where: { organizationId: user.organization.id },
      orderBy: { createdAt: 'desc' }
    });

    // Transform providers to include configuration status
    const providers = smsProviders.map(provider => ({
      id: provider.id,
      providerType: provider.providerType,
      name: provider.name,
      fromNumber: provider.fromNumber,
      isActive: provider.isActive,
      isConfigured: !!(
        provider.providerType === 'TWILIO' 
          ? (provider.accountSid && provider.authToken)
          : (provider.apiKey && provider.username)
      ),
      lastTested: provider.lastTested,
      testStatus: provider.testStatus,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt
    }));

    return NextResponse.json({ 
      success: true, 
      providers 
    });

  } catch (error) {
    logger.error('Error fetching SMS providers:', error);
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
    const { providerType, name, accountSid, authToken, apiKey, username, fromNumber } = body;

    // Validate required fields
    if (!providerType || !name || !fromNumber) {
      return NextResponse.json({ 
        error: 'Provider type, name, and from number are required' 
      }, { status: 400 });
    }

    // Validate provider-specific fields
    if (providerType === 'TWILIO' && (!accountSid || !authToken)) {
      return NextResponse.json({ 
        error: 'Account SID and Auth Token are required for Twilio' 
      }, { status: 400 });
    }

    if (providerType === 'AFRICASTALKING' && (!apiKey || !username)) {
      return NextResponse.json({ 
        error: 'API Key and Username are required for Africa\'s Talking' 
      }, { status: 400 });
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user?.organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if provider name already exists for this organization
    const existingProvider = await prisma.sMSProvider.findFirst({
      where: {
        organizationId: user.organization.id,
        name: name
      }
    });

    if (existingProvider) {
      return NextResponse.json({ 
        error: 'Provider name already exists' 
      }, { status: 400 });
    }

    // Create the SMS provider
    const smsProvider = await prisma.sMSProvider.create({
      data: {
        id: randomUUID(),
        organizationId: user.organization.id,
        providerType,
        name,
        accountSid: providerType === 'TWILIO' ? accountSid : null,
        authToken: providerType === 'TWILIO' ? authToken : null,
        apiKey: providerType === 'AFRICASTALKING' ? apiKey : null,
        username: providerType === 'AFRICASTALKING' ? username : null,
        fromNumber,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    logger.info('SMS provider created', {
      providerId: smsProvider.id,
      providerType,
      organizationId: user.organization.id,
      userId: session.user.id
    });

    return NextResponse.json({
      success: true,
      provider: {
        id: smsProvider.id,
        providerType: smsProvider.providerType,
        name: smsProvider.name,
        fromNumber: smsProvider.fromNumber,
        isActive: smsProvider.isActive,
        isConfigured: true,
        createdAt: smsProvider.createdAt
      }
    });

  } catch (error) {
    logger.error('Error creating SMS provider:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}