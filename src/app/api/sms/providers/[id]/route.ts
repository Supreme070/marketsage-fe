import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user?.organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if provider exists and belongs to the organization
    const provider = await prisma.sMSProvider.findFirst({
      where: {
        id,
        organizationId: user.organization.id
      }
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Check if provider is being used in any active campaigns
    const activeCampaigns = await prisma.sMSCampaign.count({
      where: {
        organizationId: user.organization.id,
        status: {
          in: ['SCHEDULED', 'SENDING', 'PAUSED']
        }
      }
    });

    if (activeCampaigns > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete provider while active campaigns exist' 
      }, { status: 400 });
    }

    // Delete the provider
    await prisma.sMSProvider.delete({
      where: { id }
    });

    logger.info('SMS provider deleted', {
      providerId: id,
      organizationId: user.organization.id,
      userId: session.user.id
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Error deleting SMS provider:', error);
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

    const { id } = params;
    const body = await request.json();
    const { name, accountSid, authToken, apiKey, username, fromNumber, isActive } = body;

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user?.organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if provider exists and belongs to the organization
    const provider = await prisma.sMSProvider.findFirst({
      where: {
        id,
        organizationId: user.organization.id
      }
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Update the provider
    const updatedProvider = await prisma.sMSProvider.update({
      where: { id },
      data: {
        name: name || provider.name,
        accountSid: accountSid !== undefined ? accountSid : provider.accountSid,
        authToken: authToken !== undefined ? authToken : provider.authToken,
        apiKey: apiKey !== undefined ? apiKey : provider.apiKey,
        username: username !== undefined ? username : provider.username,
        fromNumber: fromNumber || provider.fromNumber,
        isActive: isActive !== undefined ? isActive : provider.isActive,
        updatedAt: new Date()
      }
    });

    logger.info('SMS provider updated', {
      providerId: id,
      organizationId: user.organization.id,
      userId: session.user.id
    });

    return NextResponse.json({
      success: true,
      provider: {
        id: updatedProvider.id,
        providerType: updatedProvider.providerType,
        name: updatedProvider.name,
        fromNumber: updatedProvider.fromNumber,
        isActive: updatedProvider.isActive,
        updatedAt: updatedProvider.updatedAt
      }
    });

  } catch (error) {
    logger.error('Error updating SMS provider:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}