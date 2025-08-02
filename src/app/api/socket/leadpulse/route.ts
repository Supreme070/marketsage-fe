/**
 * LeadPulse WebSocket API Endpoint
 * 
 * Handles WebSocket connections for real-time visitor updates
 * with MCP integration and fallback mechanisms.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { Server as IOServer } from 'socket.io';
import { getMCPVisitorData, getMCPVisitorInsights, getMCPVisitorLocations } from '@/lib/leadpulse/mcp-data-provider';
import { logger } from '@/lib/logger';
import type { 
  NextApiResponseServerIO, 
  ServerToClientEvents, 
  ClientToServerEvents, 
  InterServerEvents, 
  SocketData 
} from '@/types/socket';

// Store active connections
const activeConnections = new Map<string, any>();
const subscriptions = new Map<string, Set<string>>();

/**
 * WebSocket connection handler
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const socketId = searchParams.get('socketId') || 'leadpulse';
    
    // For HTTP requests, return connection info
    return NextResponse.json({
      status: 'ready',
      socketId,
      endpoint: '/api/socket/leadpulse',
      activeConnections: activeConnections.size,
      availableEvents: [
        'visitor_update',
        'analytics_update', 
        'new_visitor',
        'visitor_offline',
        'touchpoint_added'
      ]
    });
  } catch (error) {
    logger.error('WebSocket GET error:', error);
    return NextResponse.json(
      { error: 'WebSocket initialization failed' },
      { status: 500 }
    );
  }
}

/**
 * WebSocket subscription handler
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, socketId, dataType, options } = body;
    
    switch (action) {
      case 'subscribe':
        return handleSubscription(socketId, dataType, options);
      case 'unsubscribe':
        return handleUnsubscription(socketId, dataType);
      case 'status':
        return getConnectionStatus(socketId);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('WebSocket POST error:', error);
    return NextResponse.json(
      { error: 'WebSocket operation failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle subscription requests
 */
async function handleSubscription(socketId: string, dataType: string, options: any) {
  try {
    if (!subscriptions.has(socketId)) {
      subscriptions.set(socketId, new Set());
    }
    
    const socketSubscriptions = subscriptions.get(socketId)!;
    socketSubscriptions.add(dataType);
    
    // Start data streaming for this subscription
    startDataStream(socketId, dataType, options);
    
    return NextResponse.json({
      success: true,
      message: `Subscribed to ${dataType}`,
      socketId,
      subscriptions: Array.from(socketSubscriptions)
    });
  } catch (error) {
    logger.error('Subscription error:', error);
    return NextResponse.json(
      { error: 'Subscription failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle unsubscription requests
 */
async function handleUnsubscription(socketId: string, dataType: string) {
  try {
    const socketSubscriptions = subscriptions.get(socketId);
    if (socketSubscriptions) {
      socketSubscriptions.delete(dataType);
      
      if (socketSubscriptions.size === 0) {
        subscriptions.delete(socketId);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Unsubscribed from ${dataType}`,
      socketId
    });
  } catch (error) {
    logger.error('Unsubscription error:', error);
    return NextResponse.json(
      { error: 'Unsubscription failed' },
      { status: 500 }
    );
  }
}

/**
 * Get connection status
 */
async function getConnectionStatus(socketId: string) {
  try {
    const socketSubscriptions = subscriptions.get(socketId);
    
    return NextResponse.json({
      socketId,
      isConnected: activeConnections.has(socketId),
      subscriptions: socketSubscriptions ? Array.from(socketSubscriptions) : [],
      totalConnections: activeConnections.size,
      lastActivity: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Status check failed' },
      { status: 500 }
    );
  }
}

/**
 * Start streaming data for a subscription
 */
function startDataStream(socketId: string, dataType: string, options: any) {
  const interval = options?.updateInterval || 30000; // 30 seconds default
  
  const streamId = `${socketId}-${dataType}`;
  
  // Clear existing stream if any
  if (activeConnections.has(streamId)) {
    clearInterval(activeConnections.get(streamId));
  }
  
  // Create new data stream
  const streamInterval = setInterval(async () => {
    try {
      // Check if subscription still exists
      const socketSubscriptions = subscriptions.get(socketId);
      if (!socketSubscriptions || !socketSubscriptions.has(dataType)) {
        clearInterval(streamInterval);
        activeConnections.delete(streamId);
        return;
      }
      
      // Fetch data based on subscription type
      let data: any = null;
      
      switch (dataType) {
        case 'visitor_locations':
          data = await getMCPVisitorLocations();
          break;
        case 'visitor_journeys':
          data = await getMCPVisitorData({
            limit: options?.maxVisitors || 50,
            includeLocation: options?.includeLocation !== false,
            includeDevice: options?.includeDevice !== false
          });
          break;
        case 'insights':
          data = await getMCPVisitorInsights();
          break;
        default:
          logger.warn(`Unknown data type: ${dataType}`);
          return;
      }
      
      // Emit data to client (this would be handled by Socket.IO in a real implementation)
      // For now, we'll simulate the data being available
      logger.info(`Streaming ${dataType} data for socket ${socketId}:`, {
        dataType,
        recordCount: Array.isArray(data) ? data.length : 1,
        timestamp: new Date().toISOString()
      });
      
      // In a real Socket.IO implementation, this would emit to the specific socket
      // io.to(socketId).emit('visitor_update', {
      //   type: dataType,
      //   data,
      //   timestamp: new Date().toISOString(),
      //   source: 'mcp'
      // });
      
    } catch (error) {
      logger.error(`Error streaming ${dataType} for socket ${socketId}:`, error);
    }
  }, interval);
  
  // Store the interval for cleanup
  activeConnections.set(streamId, streamInterval);
}

/**
 * Cleanup function for when connections close
 */
export function cleanupConnection(socketId: string) {
  try {
    // Remove all subscriptions for this socket
    subscriptions.delete(socketId);
    
    // Clear all active streams for this socket
    activeConnections.forEach((interval, streamId) => {
      if (streamId.startsWith(socketId)) {
        clearInterval(interval);
        activeConnections.delete(streamId);
      }
    });
    
    logger.info(`Cleaned up connection for socket ${socketId}`);
  } catch (error) {
    logger.error(`Error cleaning up connection for socket ${socketId}:`, error);
  }
}

/**
 * Broadcast data to all connected sockets
 */
export async function broadcastToAll(eventType: string, data: any) {
  try {
    const connectedSockets = Array.from(subscriptions.keys());
    
    logger.info(`Broadcasting ${eventType} to ${connectedSockets.length} sockets`, {
      eventType,
      connectedSockets: connectedSockets.length,
      timestamp: new Date().toISOString()
    });
    
    // In a real Socket.IO implementation, this would broadcast to all connected sockets
    // io.emit(eventType, {
    //   type: eventType,
    //   data,
    //   timestamp: new Date().toISOString(),
    //   source: 'broadcast'
    // });
    
  } catch (error) {
    logger.error(`Error broadcasting ${eventType}:`, error);
  }
}

/**
 * Get statistics about active connections
 */
export function getConnectionStats() {
  return {
    totalConnections: subscriptions.size,
    totalSubscriptions: Array.from(subscriptions.values()).reduce((acc, subs) => acc + subs.size, 0),
    activeStreams: activeConnections.size,
    subscriptionsByType: Array.from(subscriptions.values()).reduce((acc, subs) => {
      subs.forEach(sub => {
        acc[sub] = (acc[sub] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>)
  };
}