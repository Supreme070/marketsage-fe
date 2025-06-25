/**
 * LeadPulse CRM Integration API
 * 
 * Endpoints for managing CRM integrations
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { crmIntegrationManager, type CRMIntegrationConfig } from '@/lib/leadpulse/integrations/crm-connectors';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET: List CRM integrations
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');

    // Get user's CRM integrations
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { crmIntegrations: true },
    });

    let integrations = user?.crmIntegrations || {};

    if (platform) {
      integrations = integrations[platform] ? { [platform]: integrations[platform] } : {};
    }

    return NextResponse.json({
      success: true,
      integrations,
      availablePlatforms: ['salesforce', 'hubspot', 'pipedrive', 'zoho'],
    });

  } catch (error) {
    logger.error('Error listing CRM integrations:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to list CRM integrations',
    }, { status: 500 });
  }
}

/**
 * POST: Add new CRM integration
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { platform, credentials, mappings, syncSettings } = body;

    // Validate required fields
    if (!platform || !credentials) {
      return NextResponse.json({
        success: false,
        error: 'Platform and credentials are required',
      }, { status: 400 });
    }

    const config: CRMIntegrationConfig = {
      platform,
      credentials,
      mappings: mappings || {},
      syncSettings: syncSettings || {
        autoSync: false,
        syncInterval: 60,
        syncDirection: 'to_crm',
        conflictResolution: 'leadpulse_wins',
      },
    };

    const result = await crmIntegrationManager.addIntegration(session.user.id, config);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `${platform} integration added successfully`,
        platform,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 400 });
    }

  } catch (error) {
    logger.error('Error adding CRM integration:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add CRM integration',
    }, { status: 500 });
  }
}

/**
 * PUT: Update CRM integration
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { platform, settings } = body;

    if (!platform) {
      return NextResponse.json({
        success: false,
        error: 'Platform is required',
      }, { status: 400 });
    }

    // Update integration settings
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { crmIntegrations: true },
    });

    if (!user?.crmIntegrations?.[platform]) {
      return NextResponse.json({
        success: false,
        error: 'Integration not found',
      }, { status: 404 });
    }

    const updatedIntegrations = {
      ...user.crmIntegrations,
      [platform]: {
        ...user.crmIntegrations[platform],
        ...settings,
        updatedAt: new Date().toISOString(),
      },
    };

    await prisma.user.update({
      where: { id: session.user.id },
      data: { crmIntegrations: updatedIntegrations },
    });

    return NextResponse.json({
      success: true,
      message: `${platform} integration updated successfully`,
    });

  } catch (error) {
    logger.error('Error updating CRM integration:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update CRM integration',
    }, { status: 500 });
  }
}

/**
 * DELETE: Remove CRM integration
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');

    if (!platform) {
      return NextResponse.json({
        success: false,
        error: 'Platform is required',
      }, { status: 400 });
    }

    // Remove integration
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { crmIntegrations: true },
    });

    if (!user?.crmIntegrations?.[platform]) {
      return NextResponse.json({
        success: false,
        error: 'Integration not found',
      }, { status: 404 });
    }

    const updatedIntegrations = { ...user.crmIntegrations };
    delete updatedIntegrations[platform];

    await prisma.user.update({
      where: { id: session.user.id },
      data: { crmIntegrations: updatedIntegrations },
    });

    return NextResponse.json({
      success: true,
      message: `${platform} integration removed successfully`,
    });

  } catch (error) {
    logger.error('Error removing CRM integration:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to remove CRM integration',
    }, { status: 500 });
  }
}