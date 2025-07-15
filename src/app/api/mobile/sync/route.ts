/**
 * Mobile Offline Sync API
 * =======================
 * Handle offline task synchronization for mobile devices
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { mobileTaskNotificationSystem } from '@/lib/mobile/task-notification-system';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, device_id, client_sync_data } = body;

    switch (action) {
      case 'sync_tasks':
        if (!device_id) {
          return NextResponse.json({
            error: 'Device ID required for sync'
          }, { status: 400 });
        }

        const syncResult = await mobileTaskNotificationSystem.syncTasksForOfflineAccess(
          session.user.id,
          device_id,
          client_sync_data
        );

        return NextResponse.json({
          success: true,
          message: 'Task sync completed successfully',
          ...syncResult
        });

      case 'upload_offline_changes':
        if (!device_id || !client_sync_data) {
          return NextResponse.json({
            error: 'Device ID and sync data required'
          }, { status: 400 });
        }

        // Handle offline changes upload
        const uploadResult = await mobileTaskNotificationSystem.syncTasksForOfflineAccess(
          session.user.id,
          device_id,
          client_sync_data
        );

        return NextResponse.json({
          success: true,
          message: 'Offline changes uploaded successfully',
          conflicts_resolved: uploadResult.conflicts_resolved,
          bandwidth_saved: uploadResult.bandwidth_saved
        });

      default:
        return NextResponse.json({
          error: 'Invalid sync action'
        }, { status: 400 });
    }

  } catch (error) {
    logger.error('Mobile sync API error', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process sync request'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('device_id');
    const syncType = searchParams.get('type') || 'full';

    if (!deviceId) {
      return NextResponse.json({
        error: 'Device ID required'
      }, { status: 400 });
    }

    // Get latest sync data for device
    const syncResult = await mobileTaskNotificationSystem.syncTasksForOfflineAccess(
      session.user.id,
      deviceId
    );

    return NextResponse.json({
      success: true,
      sync_type: syncType,
      ...syncResult
    });

  } catch (error) {
    logger.error('Mobile sync GET API error', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve sync data'
    }, { status: 500 });
  }
}