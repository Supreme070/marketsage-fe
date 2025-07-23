import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

const updateConfigSchema = z.object({
  messagingModel: z.enum(['customer_managed', 'platform_managed']).optional(),
  autoTopUp: z.boolean().optional(),
  autoTopUpAmount: z.number().min(10).max(1000).optional(),
  autoTopUpThreshold: z.number().min(1).max(100).optional(),
  preferredProviders: z.object({
    sms: z.string().optional(),
    email: z.string().optional(),
    whatsapp: z.string().optional(),
  }).optional(),
  region: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organization.id },
      select: {
        messagingModel: true,
        creditBalance: true,
        autoTopUp: true,
        autoTopUpAmount: true,
        autoTopUpThreshold: true,
        preferredProviders: true,
        region: true,
      },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const config = {
      messagingModel: organization.messagingModel || 'customer_managed',
      creditBalance: organization.creditBalance || 0,
      autoTopUp: organization.autoTopUp || false,
      autoTopUpAmount: organization.autoTopUpAmount || 100,
      autoTopUpThreshold: organization.autoTopUpThreshold || 10,
      preferredProviders: organization.preferredProviders 
        ? JSON.parse(organization.preferredProviders) 
        : {},
      region: organization.region || 'us',
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching messaging config:', error);
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
    const validatedData = updateConfigSchema.parse(body);

    const updateData: any = {};

    if (validatedData.messagingModel) {
      updateData.messagingModel = validatedData.messagingModel;
    }

    if (validatedData.autoTopUp !== undefined) {
      updateData.autoTopUp = validatedData.autoTopUp;
    }

    if (validatedData.autoTopUpAmount) {
      updateData.autoTopUpAmount = validatedData.autoTopUpAmount;
    }

    if (validatedData.autoTopUpThreshold) {
      updateData.autoTopUpThreshold = validatedData.autoTopUpThreshold;
    }

    if (validatedData.preferredProviders) {
      updateData.preferredProviders = JSON.stringify(validatedData.preferredProviders);
    }

    if (validatedData.region) {
      updateData.region = validatedData.region;
    }

    const updatedOrg = await prisma.organization.update({
      where: { id: session.user.organization.id },
      data: updateData,
      select: {
        messagingModel: true,
        creditBalance: true,
        autoTopUp: true,
        autoTopUpAmount: true,
        autoTopUpThreshold: true,
        preferredProviders: true,
        region: true,
      },
    });

    const config = {
      messagingModel: updatedOrg.messagingModel || 'customer_managed',
      creditBalance: updatedOrg.creditBalance || 0,
      autoTopUp: updatedOrg.autoTopUp || false,
      autoTopUpAmount: updatedOrg.autoTopUpAmount || 100,
      autoTopUpThreshold: updatedOrg.autoTopUpThreshold || 10,
      preferredProviders: updatedOrg.preferredProviders 
        ? JSON.parse(updatedOrg.preferredProviders) 
        : {},
      region: updatedOrg.region || 'us',
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error updating messaging config:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}