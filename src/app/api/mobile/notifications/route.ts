/**
 * Mobile Task Notifications API
 * =============================
 * Handle mobile push notifications and device registration
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
    const { action } = body;

    switch (action) {
      case 'register_device':
        const {
          device_token,
          platform,
          preferences = {}
        } = body;

        if (!device_token || !platform) {
          return NextResponse.json({
            error: 'Device token and platform required'
          }, { status: 400 });
        }

        const registrationResult = await mobileTaskNotificationSystem.registerMobileDevice(
          session.user.id,
          device_token,
          platform,
          preferences
        );

        return NextResponse.json({
          success: true,
          message: 'Mobile device registered successfully',
          ...registrationResult
        });

      case 'send_notification':
        const {
          task_id,
          notification_type,
          recipient_user_ids,
          custom_message
        } = body;

        if (!task_id || !notification_type || !recipient_user_ids) {
          return NextResponse.json({
            error: 'Task ID, notification type, and recipients required'
          }, { status: 400 });
        }

        const notificationResult = await mobileTaskNotificationSystem.sendTaskNotification(
          task_id,
          notification_type,
          recipient_user_ids,
          custom_message
        );

        return NextResponse.json({
          success: true,
          message: 'Mobile notifications sent successfully',
          ...notificationResult
        });

      case 'process_scheduled':
        // Process pending scheduled notifications
        const processResult = await mobileTaskNotificationSystem.processScheduledNotifications();

        return NextResponse.json({
          success: true,
          message: 'Scheduled notifications processed',
          ...processResult
        });

      default:
        return NextResponse.json({
          error: 'Invalid action'
        }, { status: 400 });
    }

  } catch (error) {
    logger.error('Mobile notifications API error', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process mobile notification request'
    }, { status: 500 });
  }
}