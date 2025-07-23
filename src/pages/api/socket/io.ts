/**
 * Socket.IO API Route for Real-time Communication
 * 
 * This initializes the Socket.IO server for real-time LeadPulse features
 */

import type { NextApiRequest } from 'next';
import { Server as ServerIO } from 'socket.io';
import type { NextApiResponseServerIO } from '@/types/socket';
import { leadPulseRealtimeService } from '@/lib/websocket/leadpulse-realtime';
import { collaborationRealtimeService } from '@/lib/websocket/collaboration-realtime';
import { aiStreamingService } from '@/lib/websocket/ai-streaming-service';
import { adminRealtimeService } from '@/lib/websocket/admin-realtime-service';
import { logger } from '@/lib/logger';

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (res.socket.server.io) {
    // Socket is already running
    logger.info('Socket.IO server already initialized');
    res.end();
    return;
  }

  logger.info('Initializing Socket.IO server...');

  const io = new ServerIO(res.socket.server, {
    path: '/api/socket/io',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? [process.env.NEXTAUTH_URL!, process.env.FRONTEND_URL!].filter(Boolean)
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Initialize LeadPulse realtime service
  leadPulseRealtimeService.initialize(io);

  // Initialize Collaboration realtime service
  collaborationRealtimeService.initialize(io);

  // Initialize AI streaming service
  aiStreamingService.initialize(io);

  // Initialize Admin realtime service
  adminRealtimeService.initialize(io);

  // Store io instance
  res.socket.server.io = io;

  logger.info('Socket.IO server initialized successfully');

  // Handle server events
  io.engine.on('connection_error', (err) => {
    logger.error('Socket.IO connection error:', err);
  });

  res.end();
}

// Disable body parsing for this route
export const config = {
  api: {
    bodyParser: false,
  },
};