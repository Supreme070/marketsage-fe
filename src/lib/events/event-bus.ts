/**
 * Real-time Event Bus System for MarketSage
 * ==========================================
 * 
 * Core event-driven architecture using Valkey (Redis) Pub/Sub
 * Enables real-time customer lifecycle events and AI decision triggers
 * 
 * Based on user's blueprint: Phase 1 - Real-time Event Bus System
 */

import { Redis } from 'ioredis';
import { logger } from '@/lib/logger';

// Event Types for Customer Lifecycle
export enum CustomerEventType {
  // Contact Events
  CONTACT_CREATED = 'contact.created',
  CONTACT_UPDATED = 'contact.updated',
  CONTACT_EMAIL_OPENED = 'contact.email.opened',
  CONTACT_EMAIL_CLICKED = 'contact.email.clicked',
  CONTACT_SMS_DELIVERED = 'contact.sms.delivered',
  CONTACT_SMS_REPLIED = 'contact.sms.replied',
  CONTACT_WHATSAPP_DELIVERED = 'contact.whatsapp.delivered',
  CONTACT_WHATSAPP_REPLIED = 'contact.whatsapp.replied',
  
  // Behavioral Events
  WEBSITE_VISIT = 'website.visit',
  PAGE_VIEW = 'page.view',
  FORM_SUBMISSION = 'form.submission',
  PRODUCT_VIEW = 'product.view',
  CART_ABANDONMENT = 'cart.abandonment',
  PURCHASE_COMPLETED = 'purchase.completed',
  
  // Engagement Events
  ENGAGEMENT_SCORE_UPDATED = 'engagement.score.updated',
  CHURN_RISK_DETECTED = 'churn.risk.detected',
  HIGH_VALUE_DETECTED = 'high_value.detected',
  BIRTHDAY_DETECTED = 'birthday.detected',
  ANNIVERSARY_DETECTED = 'anniversary.detected',
  
  // Campaign Events
  CAMPAIGN_SENT = 'campaign.sent',
  CAMPAIGN_OPENED = 'campaign.opened',
  CAMPAIGN_CLICKED = 'campaign.clicked',
  CAMPAIGN_CONVERTED = 'campaign.converted',
  CAMPAIGN_UNSUBSCRIBED = 'campaign.unsubscribed',
  
  // Workflow Events
  WORKFLOW_TRIGGERED = 'workflow.triggered',
  WORKFLOW_COMPLETED = 'workflow.completed',
  WORKFLOW_FAILED = 'workflow.failed',
  
  // AI Events
  AI_INSIGHT_GENERATED = 'ai.insight.generated',
  AI_ACTION_RECOMMENDED = 'ai.action.recommended',
  AI_TASK_CREATED = 'ai.task.created',
  AI_DECISION_MADE = 'ai.decision.made'
}

// Event Priority Levels
export enum EventPriority {
  LOW = 'low',
  NORMAL = 'normal', 
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Base Event Interface
export interface CustomerEvent {
  id: string;
  type: CustomerEventType;
  priority: EventPriority;
  timestamp: Date;
  organizationId: string;
  contactId?: string;
  userId?: string;
  data: Record<string, any>;
  metadata: {
    source: string;
    version: string;
    correlationId?: string;
    sessionId?: string;
  };
}

// Event Handler Function Type
export type EventHandler = (event: CustomerEvent) => Promise<void>;

// Event Bus Configuration
interface EventBusConfig {
  redisUrl: string;
  maxRetries: number;
  retryDelay: number;
  enableLogging: boolean;
}

/**
 * Real-time Event Bus using Valkey (Redis) Pub/Sub
 * 
 * Handles all customer lifecycle events and triggers AI decision making
 */
export class CustomerEventBus {
  private publisher: Redis;
  private subscriber: Redis;
  private handlers: Map<string, EventHandler[]> = new Map();
  private config: EventBusConfig;
  private isConnected = false;

  constructor(config: Partial<EventBusConfig> = {}) {
    this.config = {
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      maxRetries: 3,
      retryDelay: 1000,
      enableLogging: true,
      ...config
    };

    // Initialize Redis connections
    this.publisher = new Redis(this.config.redisUrl, {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: this.config.maxRetries,
    });

    this.subscriber = new Redis(this.config.redisUrl, {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: this.config.maxRetries,
    });

    this.setupEventHandlers();
  }

  /**
   * Initialize event bus connections
   */
  async connect(): Promise<void> {
    try {
      await Promise.all([
        this.publisher.ping(),
        this.subscriber.ping()
      ]);

      this.isConnected = true;
      
      if (this.config.enableLogging) {
        logger.info('Customer Event Bus connected to Valkey', {
          redisUrl: this.config.redisUrl.replace(/\/\/.*@/, '//***@'), // Mask credentials
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      logger.error('Failed to connect Customer Event Bus to Valkey', error);
      throw new Error(`Event Bus connection failed: ${error}`);
    }
  }

  /**
   * Disconnect from Valkey
   */
  async disconnect(): Promise<void> {
    await Promise.all([
      this.publisher.disconnect(),
      this.subscriber.disconnect()
    ]);
    this.isConnected = false;
    
    if (this.config.enableLogging) {
      logger.info('Customer Event Bus disconnected from Valkey');
    }
  }

  /**
   * Publish customer event to the event bus
   */
  async publish(event: CustomerEvent): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Event Bus not connected. Call connect() first.');
    }

    try {
      const channel = this.getEventChannel(event.type, event.priority);
      const eventData = JSON.stringify({
        ...event,
        timestamp: event.timestamp.toISOString()
      });

      await this.publisher.publish(channel, eventData);

      if (this.config.enableLogging) {
        logger.info('Customer event published', {
          eventType: event.type,
          eventId: event.id,
          priority: event.priority,
          contactId: event.contactId,
          organizationId: event.organizationId,
          channel
        });
      }
    } catch (error) {
      logger.error('Failed to publish customer event', {
        eventType: event.type,
        eventId: event.id,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Subscribe to specific event types
   */
  async subscribe(eventType: CustomerEventType, handler: EventHandler): Promise<void> {
    const eventTypeKey = eventType.toString();
    
    if (!this.handlers.has(eventTypeKey)) {
      this.handlers.set(eventTypeKey, []);
    }
    
    this.handlers.get(eventTypeKey)!.push(handler);

    // Subscribe to all priority channels for this event type
    const channels = [
      this.getEventChannel(eventType, EventPriority.CRITICAL),
      this.getEventChannel(eventType, EventPriority.HIGH),
      this.getEventChannel(eventType, EventPriority.NORMAL),
      this.getEventChannel(eventType, EventPriority.LOW)
    ];

    await Promise.all(
      channels.map(channel => this.subscriber.subscribe(channel))
    );

    if (this.config.enableLogging) {
      logger.info('Subscribed to customer event type', {
        eventType: eventType,
        channels,
        handlerCount: this.handlers.get(eventTypeKey)!.length
      });
    }
  }

  /**
   * Subscribe to multiple event types with pattern matching
   */
  async subscribePattern(pattern: string, handler: EventHandler): Promise<void> {
    await this.subscriber.psubscribe(pattern);
    
    // Store pattern handlers separately
    const patternKey = `pattern:${pattern}`;
    if (!this.handlers.has(patternKey)) {
      this.handlers.set(patternKey, []);
    }
    this.handlers.get(patternKey)!.push(handler);

    if (this.config.enableLogging) {
      logger.info('Subscribed to customer event pattern', {
        pattern,
        handlerCount: this.handlers.get(patternKey)!.length
      });
    }
  }

  /**
   * Publish customer lifecycle event with automatic metadata
   */
  async publishCustomerEvent(
    type: CustomerEventType,
    data: Record<string, any>,
    options: {
      contactId?: string;
      organizationId: string;
      userId?: string;
      priority?: EventPriority;
      source?: string;
      correlationId?: string;
      sessionId?: string;
    }
  ): Promise<string> {
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const event: CustomerEvent = {
      id: eventId,
      type,
      priority: options.priority || EventPriority.NORMAL,
      timestamp: new Date(),
      organizationId: options.organizationId,
      contactId: options.contactId,
      userId: options.userId,
      data,
      metadata: {
        source: options.source || 'marketsage-api',
        version: '1.0.0',
        correlationId: options.correlationId,
        sessionId: options.sessionId
      }
    };

    await this.publish(event);
    return eventId;
  }

  /**
   * Get event statistics
   */
  async getEventStats(): Promise<{
    subscribedChannels: number;
    patternSubscriptions: number;
    totalHandlers: number;
    connectionStatus: string;
  }> {
    return {
      subscribedChannels: await this.subscriber.pubsub('numsub').then(result => result.length / 2),
      patternSubscriptions: await this.subscriber.pubsub('numpat'),
      totalHandlers: Array.from(this.handlers.values()).reduce((sum, handlers) => sum + handlers.length, 0),
      connectionStatus: this.isConnected ? 'connected' : 'disconnected'
    };
  }

  /**
   * Setup internal event handlers for Redis pub/sub
   */
  private setupEventHandlers(): void {
    // Handle regular subscription messages
    this.subscriber.on('message', async (channel: string, message: string) => {
      try {
        const event: CustomerEvent = JSON.parse(message);
        event.timestamp = new Date(event.timestamp); // Parse timestamp back to Date
        
        await this.handleEvent(event);
      } catch (error) {
        logger.error('Failed to handle customer event message', {
          channel,
          error: error instanceof Error ? error.message : error
        });
      }
    });

    // Handle pattern subscription messages
    this.subscriber.on('pmessage', async (pattern: string, channel: string, message: string) => {
      try {
        const event: CustomerEvent = JSON.parse(message);
        event.timestamp = new Date(event.timestamp);
        
        const patternKey = `pattern:${pattern}`;
        const handlers = this.handlers.get(patternKey) || [];
        
        await Promise.all(
          handlers.map(handler => this.executeHandler(handler, event))
        );
      } catch (error) {
        logger.error('Failed to handle customer event pattern message', {
          pattern,
          channel,
          error: error instanceof Error ? error.message : error
        });
      }
    });

    // Handle connection events
    this.subscriber.on('connect', () => {
      if (this.config.enableLogging) {
        logger.info('Event Bus subscriber connected to Valkey');
      }
    });

    this.subscriber.on('error', (error) => {
      logger.error('Event Bus subscriber error', error);
    });

    this.publisher.on('error', (error) => {
      logger.error('Event Bus publisher error', error);
    });
  }

  /**
   * Handle incoming events by routing to registered handlers
   */
  private async handleEvent(event: CustomerEvent): Promise<void> {
    const eventTypeKey = event.type.toString();
    const handlers = this.handlers.get(eventTypeKey) || [];

    if (handlers.length === 0) {
      if (this.config.enableLogging) {
        logger.warn('No handlers registered for customer event type', {
          eventType: event.type,
          eventId: event.id
        });
      }
      return;
    }

    // Execute all handlers in parallel
    await Promise.all(
      handlers.map(handler => this.executeHandler(handler, event))
    );
  }

  /**
   * Execute individual event handler with error handling
   */
  private async executeHandler(handler: EventHandler, event: CustomerEvent): Promise<void> {
    try {
      await handler(event);
      
      if (this.config.enableLogging) {
        logger.debug('Customer event handler executed successfully', {
          eventType: event.type,
          eventId: event.id,
          handlerName: handler.name || 'anonymous'
        });
      }
    } catch (error) {
      logger.error('Customer event handler execution failed', {
        eventType: event.type,
        eventId: event.id,
        handlerName: handler.name || 'anonymous',
        error: error instanceof Error ? error.message : error
      });
      
      // Don't rethrow - we want other handlers to continue processing
    }
  }

  /**
   * Generate channel name based on event type and priority
   */
  private getEventChannel(eventType: CustomerEventType, priority: EventPriority): string {
    return `marketsage:events:${eventType}:${priority}`;
  }
}

// Singleton instance for application-wide use
let eventBusInstance: CustomerEventBus | null = null;

/**
 * Get the singleton Customer Event Bus instance
 */
export function getCustomerEventBus(): CustomerEventBus {
  if (!eventBusInstance) {
    eventBusInstance = new CustomerEventBus();
  }
  return eventBusInstance;
}

/**
 * Initialize the Customer Event Bus (call this at application startup)
 */
export async function initializeCustomerEventBus(): Promise<CustomerEventBus> {
  const eventBus = getCustomerEventBus();
  await eventBus.connect();
  return eventBus;
}

/**
 * Cleanup the Customer Event Bus (call this at application shutdown)
 */
export async function cleanupCustomerEventBus(): Promise<void> {
  if (eventBusInstance) {
    await eventBusInstance.disconnect();
    eventBusInstance = null;
  }
}