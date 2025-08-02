/**
 * SSE (Server-Sent Events) Transport for MCP Servers
 * 
 * Provides HTTP-based communication for MCP servers using Server-Sent Events
 * for real-time bidirectional communication between clients and servers.
 */

import { EventEmitter } from 'events';
import type { IncomingMessage, ServerResponse } from 'http';
import type { Transport } from '@modelcontextprotocol/sdk/types';
import { type JSONRPCMessage, JSONRPCRequest, JSONRPCResponse } from '@modelcontextprotocol/sdk/types';

export interface SSEConnection {
  id: string;
  request: IncomingMessage;
  response: ServerResponse;
  lastActivity: Date;
}

export class SSEServerTransport extends EventEmitter implements Transport {
  private connections = new Map<string, SSEConnection>();
  private isStarted = false;
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(
    private port: number,
    private path = '/mcp',
    private heartbeatMs = 30000
  ) {
    super();
    this.setupCleanup();
  }

  async start(): Promise<void> {
    if (this.isStarted) {
      console.log(`SSE transport on port ${this.port} is already started`);
      return;
    }

    this.isStarted = true;
    this.startHeartbeat();
    
    console.log(`SSE MCP Server started on port ${this.port}${this.path}`);
  }

  async close(): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    this.isStarted = false;
    
    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Close all connections
    for (const [id, connection] of this.connections) {
      try {
        connection.response.end();
      } catch (error) {
        console.error(`Error closing SSE connection ${id}:`, error);
      }
    }
    
    this.connections.clear();
    console.log(`SSE MCP Server on port ${this.port} closed`);
  }

  send(message: JSONRPCMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const data = JSON.stringify(message);
        const sseMessage = `data: ${data}\n\n`;
        
        // Send to all active connections
        const activeConnections = Array.from(this.connections.values());
        if (activeConnections.length === 0) {
          console.warn('No active SSE connections to send message to');
          resolve();
          return;
        }

        let sentCount = 0;
        for (const connection of activeConnections) {
          try {
            if (!connection.response.destroyed) {
              connection.response.write(sseMessage);
              sentCount++;
            }
          } catch (error) {
            console.error(`Error sending SSE message to connection ${connection.id}:`, error);
            this.removeConnection(connection.id);
          }
        }

        console.log(`Sent SSE message to ${sentCount} connections`);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle incoming SSE connection
   */
  handleConnection(request: IncomingMessage, response: ServerResponse): void {
    if (!this.isStarted) {
      response.writeHead(503);
      response.end('Server not started');
      return;
    }

    // Set SSE headers
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    const connectionId = this.generateConnectionId();
    const connection: SSEConnection = {
      id: connectionId,
      request,
      response,
      lastActivity: new Date(),
    };

    this.connections.set(connectionId, connection);
    console.log(`New SSE connection established: ${connectionId}`);

    // Send initial connection message
    const welcomeMessage = {
      jsonrpc: '2.0',
      method: 'connection/established',
      params: { connectionId, timestamp: new Date().toISOString() }
    };
    
    response.write(`data: ${JSON.stringify(welcomeMessage)}\n\n`);

    // Handle connection close
    response.on('close', () => {
      this.removeConnection(connectionId);
    });

    request.on('close', () => {
      this.removeConnection(connectionId);
    });

    response.on('error', (error) => {
      console.error(`SSE connection error for ${connectionId}:`, error);
      this.removeConnection(connectionId);
    });

    this.emit('connection', connection);
  }

  /**
   * Handle incoming message from client (via POST to message endpoint)
   */
  handleMessage(request: IncomingMessage, response: ServerResponse): void {
    if (!this.isStarted) {
      response.writeHead(503);
      response.end('Server not started');
      return;
    }

    let body = '';
    request.on('data', (chunk) => {
      body += chunk.toString();
    });

    request.on('end', () => {
      try {
        const message = JSON.parse(body) as JSONRPCMessage;
        
        // Update connection activity
        const connectionId = request.headers['x-connection-id'] as string;
        if (connectionId && this.connections.has(connectionId)) {
          const connection = this.connections.get(connectionId)!;
          connection.lastActivity = new Date();
        }

        this.emit('message', message);
        
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ status: 'received' }));
      } catch (error) {
        console.error('Error parsing SSE message:', error);
        response.writeHead(400, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });

    request.on('error', (error) => {
      console.error('Error receiving SSE message:', error);
      response.writeHead(500);
      response.end('Internal server error');
    });
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    activeConnections: number;
    totalConnections: number;
    uptime: number;
  } {
    return {
      activeConnections: this.connections.size,
      totalConnections: this.connections.size, // Could track total over time
      uptime: this.isStarted ? Date.now() : 0,
    };
  }

  private generateConnectionId(): string {
    return `sse_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      try {
        if (!connection.response.destroyed) {
          connection.response.end();
        }
      } catch (error) {
        console.error(`Error ending connection ${connectionId}:`, error);
      }
      
      this.connections.delete(connectionId);
      console.log(`SSE connection removed: ${connectionId}`);
      this.emit('disconnection', connectionId);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      const staleConnections: string[] = [];

      for (const [id, connection] of this.connections) {
        const timeSinceActivity = now.getTime() - connection.lastActivity.getTime();
        
        if (timeSinceActivity > this.heartbeatMs * 2) {
          // Connection is stale
          staleConnections.push(id);
        } else {
          // Send heartbeat
          try {
            if (!connection.response.destroyed) {
              const heartbeat = {
                jsonrpc: '2.0',
                method: 'heartbeat',
                params: { timestamp: now.toISOString() }
              };
              connection.response.write(`data: ${JSON.stringify(heartbeat)}\n\n`);
            }
          } catch (error) {
            console.error(`Error sending heartbeat to ${id}:`, error);
            staleConnections.push(id);
          }
        }
      }

      // Remove stale connections
      for (const id of staleConnections) {
        this.removeConnection(id);
      }
    }, this.heartbeatMs);
  }

  private setupCleanup(): void {
    const cleanup = () => {
      if (this.isStarted) {
        this.close().catch(console.error);
      }
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);
  }
}