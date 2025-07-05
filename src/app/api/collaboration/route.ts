/**
 * Collaboration API Endpoints
 * ===========================
 * RESTful API for managing real-time collaboration features and multi-user AI assistance
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { collaborationRealtimeService } from '@/lib/websocket/collaboration-realtime';
import { logger } from '@/lib/logger';
import { trace } from '@opentelemetry/api';
import prisma from '@/lib/db/prisma';

/**
 * GET /api/collaboration - Get collaboration data
 */
export async function GET(request: NextRequest) {
  const tracer = trace.getTracer('collaboration-api');
  
  return tracer.startActiveSpan('get-collaboration-data', async (span) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        span.setStatus({ code: 2, message: 'Unauthorized' });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const url = new URL(request.url);
      const action = url.searchParams.get('action');
      const organizationId = url.searchParams.get('organizationId') || session.user.organizationId;

      span.setAttributes({
        'collaboration.action': action || 'overview',
        'collaboration.organization_id': organizationId || '',
        'collaboration.user_id': session.user.id,
        'collaboration.user_role': session.user.role || ''
      });

      if (!organizationId) {
        return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
      }

      switch (action) {
        case 'active_users':
          const activeUsers = collaborationRealtimeService.getActiveUsers(organizationId);
          
          span.setAttributes({
            'collaboration.active_users_count': activeUsers.length
          });
          
          return NextResponse.json({
            success: true,
            data: activeUsers
          });

        case 'session_status':
          const sessionId = url.searchParams.get('sessionId');
          if (!sessionId) {
            return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
          }

          // Get session status from service
          return NextResponse.json({
            success: true,
            data: {
              sessionId,
              isActive: true, // Would check actual session status
              participantCount: 0 // Would get real participant count
            }
          });

        case 'notifications':
          const limit = Number.parseInt(url.searchParams.get('limit') || '20');
          const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
          
          const notifications = await prisma.notification.findMany({
            where: {
              userId: session.user.id,
              ...(unreadOnly && { read: false })
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
              fromUser: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          });

          const unreadCount = await prisma.notification.count({
            where: {
              userId: session.user.id,
              read: false
            }
          });

          span.setAttributes({
            'collaboration.notifications_count': notifications.length,
            'collaboration.unread_count': unreadCount
          });

          return NextResponse.json({
            success: true,
            data: {
              notifications,
              unreadCount,
              total: notifications.length
            }
          });

        case 'workspace_activity':
          const workspaceId = url.searchParams.get('workspaceId');
          const activityLimit = Number.parseInt(url.searchParams.get('limit') || '50');
          
          // Get workspace activity from database
          const activities = await prisma.workspaceActivity.findMany({
            where: {
              ...(workspaceId && { workspaceId }),
              organizationId
            },
            orderBy: { timestamp: 'desc' },
            take: activityLimit,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          });

          return NextResponse.json({
            success: true,
            data: activities
          });

        case 'collaboration_stats':
          const stats = {
            activeUsers: collaborationRealtimeService.getActiveUsers(organizationId).length,
            activeSessions: collaborationRealtimeService.getActiveSessionCount(),
            activeWorkspaces: collaborationRealtimeService.getActiveWorkspaceCount(),
            totalConnections: collaborationRealtimeService.getConnectionCount(),
            unreadNotifications: await prisma.notification.count({
              where: {
                userId: session.user.id,
                read: false
              }
            })
          };

          span.setAttributes({
            'collaboration.stats_active_users': stats.activeUsers,
            'collaboration.stats_sessions': stats.activeSessions,
            'collaboration.stats_workspaces': stats.activeWorkspaces
          });

          return NextResponse.json({
            success: true,
            data: stats
          });

        default:
          // Return collaboration overview
          const overview = {
            activeUsers: collaborationRealtimeService.getActiveUsers(organizationId),
            connectionStatus: {
              isConnected: true, // Would check actual connection status
              connectionCount: collaborationRealtimeService.getConnectionCount()
            },
            sessionStats: {
              activeSessions: collaborationRealtimeService.getActiveSessionCount(),
              activeWorkspaces: collaborationRealtimeService.getActiveWorkspaceCount()
            },
            capabilities: {
              multiUserAI: true,
              realTimePresence: true,
              collaborativeWorkspaces: true,
              screenSharing: false, // Would implement if needed
              videoCalling: false, // Would implement if needed
              voiceChat: false // Would implement if needed
            }
          };
          
          span.setAttributes({
            'collaboration.overview_users': overview.activeUsers.length,
            'collaboration.overview_sessions': overview.sessionStats.activeSessions
          });
          
          return NextResponse.json({
            success: true,
            data: overview
          });
      }

    } catch (error) {
      span.setStatus({ code: 2, message: String(error) });
      logger.error('Collaboration API error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      return NextResponse.json(
        { error: 'Failed to retrieve collaboration data' },
        { status: 500 }
      );
    } finally {
      span.end();
    }
  });
}

/**
 * POST /api/collaboration - Create and manage collaboration features
 */
export async function POST(request: NextRequest) {
  const tracer = trace.getTracer('collaboration-api');
  
  return tracer.startActiveSpan('post-collaboration-action', async (span) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        span.setStatus({ code: 2, message: 'Unauthorized' });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const { action, data } = body;

      span.setAttributes({
        'collaboration.action': action,
        'collaboration.user_id': session.user.id,
        'collaboration.user_role': session.user.role || ''
      });

      switch (action) {
        case 'create_ai_session':
          const sessionId = `ai-session-${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Create AI session record
          await prisma.aISession.create({
            data: {
              id: sessionId,
              organizationId: session.user.organizationId || '',
              createdBy: session.user.id,
              participants: [session.user.id],
              isActive: true,
              metadata: data.metadata || {}
            }
          });

          span.setAttributes({
            'collaboration.session_id': sessionId,
            'collaboration.session_created': true
          });

          logger.info('AI collaboration session created', {
            sessionId,
            userId: session.user.id,
            organizationId: session.user.organizationId
          });

          return NextResponse.json({
            success: true,
            message: 'AI session created successfully',
            data: {
              sessionId,
              createdAt: new Date()
            }
          });

        case 'share_ai_response':
          const { aiResponse, toUserIds, sessionId: shareSessionId } = data;

          if (!toUserIds || !Array.isArray(toUserIds) || toUserIds.length === 0) {
            return NextResponse.json({ error: 'User IDs required for sharing' }, { status: 400 });
          }

          // Share via websocket service
          await collaborationRealtimeService.shareAIResponseToUsers(
            session.user.id,
            toUserIds,
            aiResponse,
            shareSessionId
          );

          // Log the sharing activity
          await prisma.workspaceActivity.create({
            data: {
              id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              userId: session.user.id,
              organizationId: session.user.organizationId || '',
              type: 'ai_response_shared',
              description: `Shared AI response with ${toUserIds.length} user(s)`,
              metadata: {
                aiResponseId: aiResponse.id,
                sharedWithUsers: toUserIds,
                sessionId: shareSessionId
              },
              timestamp: new Date()
            }
          });

          return NextResponse.json({
            success: true,
            message: 'AI response shared successfully',
            data: {
              sharedWithCount: toUserIds.length
            }
          });

        case 'create_workspace':
          const { name, description, workspaceType } = data;

          const workspace = await prisma.collaborativeWorkspace.create({
            data: {
              id: `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: name || 'New Workspace',
              description: description || '',
              type: workspaceType || 'general',
              organizationId: session.user.organizationId || '',
              createdBy: session.user.id,
              participants: [session.user.id],
              isActive: true,
              settings: {}
            }
          });

          return NextResponse.json({
            success: true,
            message: 'Workspace created successfully',
            data: workspace
          });

        case 'log_activity':
          const { activityType, activityDescription, workspaceId, metadata } = data;

          const activity = await prisma.workspaceActivity.create({
            data: {
              id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              userId: session.user.id,
              organizationId: session.user.organizationId || '',
              workspaceId: workspaceId || undefined,
              type: activityType,
              description: activityDescription,
              metadata: metadata || {},
              timestamp: new Date()
            }
          });

          return NextResponse.json({
            success: true,
            message: 'Activity logged successfully',
            data: activity
          });

        case 'update_presence':
          const { status, currentContext } = data;

          // Update user presence in database
          await prisma.userPresence.upsert({
            where: { userId: session.user.id },
            create: {
              userId: session.user.id,
              status,
              currentContext: currentContext || {},
              lastActivity: new Date()
            },
            update: {
              status,
              currentContext: currentContext || {},
              lastActivity: new Date()
            }
          });

          return NextResponse.json({
            success: true,
            message: 'Presence updated successfully'
          });

        case 'broadcast_ai_task_completion':
          const { taskResult, sessionId: taskSessionId } = data;

          // Broadcast via websocket service
          await collaborationRealtimeService.broadcastAITaskCompletion(
            taskSessionId,
            taskResult
          );

          return NextResponse.json({
            success: true,
            message: 'AI task completion broadcast successfully'
          });

        default:
          return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
      }

    } catch (error) {
      span.setStatus({ code: 2, message: String(error) });
      logger.error('Collaboration POST API error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      return NextResponse.json(
        { error: 'Failed to process collaboration request' },
        { status: 500 }
      );
    } finally {
      span.end();
    }
  });
}

/**
 * PUT /api/collaboration - Update collaboration settings
 */
export async function PUT(request: NextRequest) {
  const tracer = trace.getTracer('collaboration-api');
  
  return tracer.startActiveSpan('put-collaboration-settings', async (span) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        span.setStatus({ code: 2, message: 'Unauthorized' });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const { notificationId, settings } = body;

      span.setAttributes({
        'collaboration.user_id': session.user.id,
        'collaboration.update_type': notificationId ? 'notification' : 'settings'
      });

      if (notificationId) {
        // Mark notification as read
        await prisma.notification.update({
          where: {
            id: notificationId,
            userId: session.user.id
          },
          data: {
            read: true,
            readAt: new Date()
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Notification marked as read'
        });
      }

      if (settings) {
        // Update collaboration settings
        await prisma.userCollaborationSettings.upsert({
          where: { userId: session.user.id },
          create: {
            userId: session.user.id,
            settings: settings
          },
          update: {
            settings: settings
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Collaboration settings updated'
        });
      }

      return NextResponse.json({ error: 'No valid update data provided' }, { status: 400 });

    } catch (error) {
      span.setStatus({ code: 2, message: String(error) });
      logger.error('Collaboration PUT API error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      return NextResponse.json(
        { error: 'Failed to update collaboration data' },
        { status: 500 }
      );
    } finally {
      span.end();
    }
  });
}

/**
 * DELETE /api/collaboration - Delete collaboration items
 */
export async function DELETE(request: NextRequest) {
  const tracer = trace.getTracer('collaboration-api');
  
  return tracer.startActiveSpan('delete-collaboration-item', async (span) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        span.setStatus({ code: 2, message: 'Unauthorized' });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const url = new URL(request.url);
      const notificationId = url.searchParams.get('notificationId');
      const sessionId = url.searchParams.get('sessionId');
      const workspaceId = url.searchParams.get('workspaceId');

      span.setAttributes({
        'collaboration.user_id': session.user.id,
        'collaboration.delete_type': notificationId ? 'notification' : sessionId ? 'session' : 'workspace'
      });

      if (notificationId) {
        // Delete notification
        await prisma.notification.delete({
          where: {
            id: notificationId,
            userId: session.user.id
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Notification deleted successfully'
        });
      }

      if (sessionId) {
        // Deactivate AI session
        await prisma.aISession.update({
          where: { id: sessionId },
          data: { isActive: false }
        });

        return NextResponse.json({
          success: true,
          message: 'AI session ended successfully'
        });
      }

      if (workspaceId) {
        // Deactivate workspace
        await prisma.collaborativeWorkspace.update({
          where: { id: workspaceId },
          data: { isActive: false }
        });

        return NextResponse.json({
          success: true,
          message: 'Workspace deactivated successfully'
        });
      }

      return NextResponse.json({ error: 'No valid item to delete' }, { status: 400 });

    } catch (error) {
      span.setStatus({ code: 2, message: String(error) });
      logger.error('Collaboration DELETE API error', {
        error: error instanceof Error ? error.message : String(error)
      });

      return NextResponse.json(
        { error: 'Failed to delete collaboration item' },
        { status: 500 }
      );
    } finally {
      span.end();
    }
  });
}