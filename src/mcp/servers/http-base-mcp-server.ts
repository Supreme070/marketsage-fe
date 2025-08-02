/**
 * HTTP Base MCP Server for MarketSage
 * 
 * This class provides HTTP-based MCP server functionality using SSE transport
 * for web-compatible communication instead of stdio transport.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index';
import { 
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types';

import { 
  type MCPAuthContext, 
  type MCPAuthResult, 
  MCPError, 
  type MCPServerResponse,
  MCPAuthenticationError,
  MCPAuthorizationError,
  MCPRateLimitError,
  MCPValidationError
} from '../types/mcp-types';

import type { MCPServerConfig } from '../config/mcp-config';
import { SSEServerTransport } from '../transport/sse-server-transport';
import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { URL } from 'url';
import { BaseMCPServer } from './base-mcp-server';

export abstract class HTTPBaseMCPServer extends BaseMCPServer {
  private httpServer?: ReturnType<typeof createServer>;
  private transport?: SSEServerTransport;
  private isStarted = false;

  constructor(config: MCPServerConfig) {
    super(config);
  }

  /**
   * Start the HTTP MCP server with SSE transport
   */
  async start(): Promise<void> {
    if (!this.config.enabled) {
      console.log(`MCP Server ${this.config.name} is disabled`);
      return;
    }

    if (this.isStarted) {
      console.log(`MCP Server ${this.config.name} is already running`);
      return;
    }

    try {
      // Create SSE transport
      this.transport = new SSEServerTransport(this.config.port, '/mcp');
      
      // Create HTTP server
      this.httpServer = createServer((req, res) => {
        this.handleHttpRequest(req, res);
      });

      // Start listening
      await new Promise<void>((resolve, reject) => {
        this.httpServer!.listen(this.config.port, (error?: Error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      // Connect MCP server to transport first
      await this.server.connect(this.transport);

      // Then start transport
      await this.transport.start();

      this.isStarted = true;
      console.log(`HTTP MCP Server ${this.config.name} started on port ${this.config.port}`);

    } catch (error) {
      console.error(`Failed to start HTTP MCP Server ${this.config.name}:`, error);
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Stop the HTTP MCP server
   */
  async stop(): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    console.log(`Stopping HTTP MCP Server ${this.config.name}...`);
    this.isStarted = false;

    await this.cleanup();
    console.log(`HTTP MCP Server ${this.config.name} stopped`);
  }

  /**
   * Handle incoming HTTP requests
   */
  private handleHttpRequest(req: IncomingMessage, res: ServerResponse): void {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Connection-ID');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (!req.url) {
      res.writeHead(400);
      res.end('Bad Request: Missing URL');
      return;
    }

    try {
      const url = new URL(req.url, `http://localhost:${this.config.port}`);
      const path = url.pathname;

      switch (path) {
        case '/health':
          this.handleHealthCheck(req, res);
          break;
        
        case '/mcp':
          if (req.method === 'GET') {
            // SSE connection
            this.transport?.handleConnection(req, res);
          } else {
            res.writeHead(405);
            res.end('Method Not Allowed');
          }
          break;
        
        case '/mcp/message':
          if (req.method === 'POST') {
            // Message from client
            this.transport?.handleMessage(req, res);
          } else {
            res.writeHead(405);
            res.end('Method Not Allowed');
          }
          break;

        case '/stats':
          this.handleStatsRequest(req, res);
          break;

        default:
          res.writeHead(404);
          res.end('Not Found');
      }
    } catch (error) {
      console.error('Error handling HTTP request:', error);
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  }

  /**
   * Handle health check requests
   */
  private handleHealthCheck(req: IncomingMessage, res: ServerResponse): void {
    const health = {
      status: this.isStarted ? 'healthy' : 'unhealthy',
      server: this.config.name,
      version: this.config.version,
      port: this.config.port,
      timestamp: new Date().toISOString(),
      transport: 'SSE',
      connections: this.transport?.getStats().activeConnections || 0
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(health, null, 2));
  }

  /**
   * Handle stats requests
   */
  private handleStatsRequest(req: IncomingMessage, res: ServerResponse): void {
    if (!this.transport) {
      res.writeHead(503);
      res.end('Transport not available');
      return;
    }

    const stats = {
      server: {
        name: this.config.name,
        version: this.config.version,
        port: this.config.port,
        started: this.isStarted,
        uptime: this.isStarted ? Date.now() : 0
      },
      transport: this.transport.getStats(),
      config: {
        enabled: this.config.enabled,
        authRequired: this.config.authentication.required,
        rateLimit: this.config.rateLimit,
        fallbackEnabled: this.config.fallback.enabled
      }
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(stats, null, 2));
  }

  /**
   * Get server status
   */
  getStatus(): {
    started: boolean;
    port: number;
    connections: number;
    uptime: number;
  } {
    return {
      started: this.isStarted,
      port: this.config.port,
      connections: this.transport?.getStats().activeConnections || 0,
      uptime: this.isStarted ? Date.now() : 0
    };
  }

  /**
   * Check if server is healthy
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: {
      server: boolean;
      transport: boolean;
      port: number;
      connections: number;
    };
  }> {
    const serverHealthy = this.isStarted;
    const transportHealthy = !!this.transport && this.transport.getStats().activeConnections >= 0;
    
    return {
      status: serverHealthy && transportHealthy ? 'healthy' : 'unhealthy',
      details: {
        server: serverHealthy,
        transport: transportHealthy,
        port: this.config.port,
        connections: this.transport?.getStats().activeConnections || 0
      }
    };
  }

  /**
   * Clean up server resources
   */
  private async cleanup(): Promise<void> {
    const cleanupPromises: Promise<void>[] = [];

    // Close MCP server
    if (this.server) {
      cleanupPromises.push(
        this.server.close().catch(error => {
          console.error('Error closing MCP server:', error);
        })
      );
    }

    // Close transport
    if (this.transport) {
      cleanupPromises.push(
        this.transport.close().catch(error => {
          console.error('Error closing transport:', error);
        })
      );
    }

    // Close HTTP server
    if (this.httpServer) {
      cleanupPromises.push(
        new Promise<void>((resolve) => {
          this.httpServer!.close((error) => {
            if (error) {
              console.error('Error closing HTTP server:', error);
            }
            resolve();
          });
        })
      );
    }

    // Wait for all cleanup operations
    await Promise.allSettled(cleanupPromises);

    // Reset state
    this.httpServer = undefined;
    this.transport = undefined;
  }

  /**
   * Send a message to all connected clients
   */
  protected async broadcastMessage(message: any): Promise<void> {
    if (!this.transport) {
      throw new Error('Transport not available');
    }

    await this.transport.send({
      jsonrpc: '2.0',
      method: 'notification',
      params: message
    });
  }

  /**
   * Get connection count for monitoring
   */
  protected getConnectionCount(): number {
    return this.transport?.getStats().activeConnections || 0;
  }
}