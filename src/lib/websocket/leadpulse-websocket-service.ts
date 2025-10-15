/**
 * LeadPulse WebSocket Service
 * 
 * Provides real-time visitor updates through WebSocket connections
 * with MCP integration and connection resilience.
 */

import { EventEmitter } from 'events';
import { logger } from '@/lib/logger';
import { getMCPVisitorData, getMCPVisitorInsights, getMCPVisitorLocations } from '@/lib/leadpulse/mcp-data-provider';
import type { VisitorLocation, VisitorJourney, InsightItem } from '@/lib/leadpulse/dataProvider';

// Minimal type definition (backend has full implementation)
interface MCPAuthContext {
  userId: string;
  organizationId: string;
  permissions: string[];
  role: string;
}

interface WebSocketConnectionConfig {
  autoReconnect: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  connectionTimeout: number;
}

interface LeadPulseWebSocketData {
  type: 'visitor_update' | 'analytics_update' | 'new_visitor' | 'visitor_offline' | 'touchpoint_added';
  data: any;
  timestamp: string;
  source: 'mcp' | 'fallback' | 'websocket';
}

interface SubscriptionOptions {
  timeRange?: string;
  includeLocation?: boolean;
  includeDevice?: boolean;
  maxVisitors?: number;
  updateInterval?: number;
}

/**
 * LeadPulse WebSocket Service Class
 */
export class LeadPulseWebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private updateTimer: NodeJS.Timeout | null = null;
  private subscriptions = new Set<string>();
  private authContext: MCPAuthContext | null = null;
  private lastUpdateTime = Date.now();

  private config: WebSocketConnectionConfig = {
    autoReconnect: true,
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000,
    connectionTimeout: 10000
  };

  constructor(config?: Partial<WebSocketConnectionConfig>) {
    super();
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Set authentication context for MCP integration
   */
  setAuthContext(authContext: MCPAuthContext): void {
    this.authContext = authContext;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.isConnected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${typeof window !== 'undefined' ? window.location.host : 'localhost:3000'}/api/socket/leadpulse`;

      this.ws = new WebSocket(wsUrl);

      // Set connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.close();
          this.handleConnectionError(new Error('Connection timeout'));
        }
      }, this.config.connectionTimeout);

      this.ws.onopen = () => {
        clearTimeout(connectionTimeout);
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        logger.info('LeadPulse WebSocket connected');
        this.emit('connected');
        
        this.startHeartbeat();
        this.resubscribe();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event);
      };

      this.ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        this.handleConnectionError(error);
      };

      this.ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        this.handleConnectionClose(event);
      };

    } catch (error) {
      this.isConnecting = false;
      this.handleConnectionError(error);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.isConnected = false;
    this.isConnecting = false;
    this.subscriptions.clear();
    
    this.stopHeartbeat();
    this.stopReconnect();
    this.stopUpdates();
    
    this.emit('disconnected');
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(dataType: string, options: SubscriptionOptions = {}): void {
    if (!this.isConnected) {
      // Store subscription for when connection is established
      this.subscriptions.add(dataType);
      if (!this.isConnecting) {
        this.connect();
      }
      return;
    }

    const subscriptionData = {
      type: 'subscribe',
      dataType,
      options: {
        timeRange: options.timeRange || '24h',
        includeLocation: options.includeLocation !== false,
        includeDevice: options.includeDevice !== false,
        maxVisitors: options.maxVisitors || 50,
        updateInterval: options.updateInterval || 30000
      }
    };

    this.send(subscriptionData);
    this.subscriptions.add(dataType);

    // Start MCP-based updates as fallback
    this.startMCPUpdates(dataType, options);
  }

  /**
   * Unsubscribe from updates
   */
  unsubscribe(dataType: string): void {
    if (this.isConnected) {
      this.send({
        type: 'unsubscribe',
        dataType
      });
    }
    
    this.subscriptions.delete(dataType);
  }

  /**
   * Send message to WebSocket server
   */
  private send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'pong':
          // Heartbeat response
          break;
          
        case 'visitor_update':
        case 'analytics_update':
        case 'new_visitor':
        case 'visitor_offline':
        case 'touchpoint_added':
          this.emit('data', {
            type: message.type,
            data: message.data,
            timestamp: message.timestamp || new Date().toISOString(),
            source: 'websocket'
          } as LeadPulseWebSocketData);
          break;
          
        case 'error':
          logger.error('WebSocket server error:', message.error);
          this.emit('error', new Error(message.error));
          break;
          
        default:
          logger.warn('Unknown WebSocket message type:', message.type);
      }
    } catch (error) {
      logger.error('Error parsing WebSocket message:', error);
    }
  }

  /**
   * Handle connection errors
   */
  private handleConnectionError(error: any): void {
    this.isConnected = false;
    this.isConnecting = false;
    
    logger.error('WebSocket connection error:', error);
    this.emit('error', error);
    
    if (this.config.autoReconnect) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle connection close
   */
  private handleConnectionClose(event: CloseEvent): void {
    this.isConnected = false;
    this.isConnecting = false;
    
    logger.info('WebSocket connection closed:', event.code, event.reason);
    this.emit('disconnected');
    
    this.stopHeartbeat();
    
    if (this.config.autoReconnect && !event.wasClean) {
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      this.emit('max_reconnect_attempts_reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    logger.info(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Stop reconnection attempts
   */
  private stopReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping' });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Resubscribe to all active subscriptions
   */
  private resubscribe(): void {
    this.subscriptions.forEach(dataType => {
      this.send({
        type: 'subscribe',
        dataType
      });
    });
  }

  /**
   * Start MCP-based updates as fallback
   */
  private startMCPUpdates(dataType: string, options: SubscriptionOptions): void {
    const interval = options.updateInterval || 30000;
    
    this.updateTimer = setInterval(async () => {
      try {
        let data: any = null;
        
        switch (dataType) {
          case 'visitor_locations':
            data = await getMCPVisitorLocations(this.authContext || undefined);
            break;
          case 'visitor_journeys':
            data = await getMCPVisitorData({
              limit: options.maxVisitors || 50,
              includeLocation: options.includeLocation !== false,
              includeDevice: options.includeDevice !== false,
              authContext: this.authContext || undefined
            });
            break;
          case 'insights':
            data = await getMCPVisitorInsights(this.authContext || undefined);
            break;
        }
        
        if (data) {
          this.emit('data', {
            type: 'visitor_update',
            data,
            timestamp: new Date().toISOString(),
            source: 'mcp'
          } as LeadPulseWebSocketData);
        }
      } catch (error) {
        logger.error('Error fetching MCP data:', error);
      }
    }, interval);
  }

  /**
   * Stop MCP updates
   */
  private stopUpdates(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  /**
   * Get connection status
   */
  getStatus(): {
    isConnected: boolean;
    isConnecting: boolean;
    reconnectAttempts: number;
    subscriptions: string[];
    lastUpdateTime: number;
  } {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      subscriptions: Array.from(this.subscriptions),
      lastUpdateTime: this.lastUpdateTime
    };
  }
}

/**
 * Singleton instance for global use
 */
export const leadPulseWebSocketService = new LeadPulseWebSocketService();

export default leadPulseWebSocketService;