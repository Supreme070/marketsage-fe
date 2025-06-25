/**
 * Socket.IO Types for Real-time Features
 */

import type { Server as NetServer, Socket } from 'net';
import type { NextApiResponse } from 'next';
import type { Server as SocketServer } from 'socket.io';

export type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io: SocketServer;
    };
  };
};

export interface ServerToClientEvents {
  // LeadPulse events
  visitor_update: (data: any) => void;
  visitor_activity: (data: any) => void;
  visitor_offline: (data: any) => void;
  analytics_update: (data: any) => void;
  new_visitor: (data: any) => void;
  recent_visitors: (data: any) => void;
  active_visitors: (data: any) => void;
  touchpoint_added: (data: any) => void;
  analytics_data: (data: any) => void;
  
  // Connection events
  pong: (data: { timestamp: string }) => void;
}

export interface ClientToServerEvents {
  // Subscription events
  subscribe: (dataType: string) => void;
  unsubscribe: (dataType: string) => void;
  
  // Connection events
  ping: () => void;
}

export interface InterServerEvents {
  // For scaling across multiple servers
  broadcast_visitor_update: (data: any) => void;
  broadcast_analytics_update: (data: any) => void;
}

export interface SocketData {
  userId?: string;
  subscriptions?: string[];
}