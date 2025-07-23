/**
 * Social Media Connections API
 * =============================
 * 
 * Manages OAuth connections for social media platforms
 * Per-organization connection management
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { socialMediaConnectionService } from '@/lib/social-media/social-media-connection-service';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.organizationId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const connections = await socialMediaConnectionService.getOrganizationConnections(
      session.user.organizationId
    );

    const stats = await socialMediaConnectionService.getConnectionStats(
      session.user.organizationId
    );

    return NextResponse.json({
      success: true,
      data: {
        connections: connections.map(conn => ({
          id: conn.id,
          platform: conn.platform,
          accountId: conn.accountId,
          accountName: conn.accountName,
          isActive: conn.isActive,
          expiresAt: conn.expiresAt,
          lastSync: conn.lastSync,
          scope: conn.scope
        })),
        stats
      }
    });

  } catch (error) {
    logger.error('Failed to get social media connections', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to load connections',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.organizationId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');

    if (!platform) {
      return NextResponse.json({ error: 'Platform parameter required' }, { status: 400 });
    }

    const success = await socialMediaConnectionService.removeConnection(
      session.user.organizationId,
      platform
    );

    if (success) {
      return NextResponse.json({
        success: true,
        message: `${platform} connection removed successfully`
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to remove connection'
      }, { status: 500 });
    }

  } catch (error) {
    logger.error('Failed to remove social media connection', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to remove connection',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}