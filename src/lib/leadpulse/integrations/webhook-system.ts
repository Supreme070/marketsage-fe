/**
 * LeadPulse Webhook System
 * 
 * Comprehensive webhook infrastructure for real-time integrations:
 * - Outgoing webhooks for events
 * - Incoming webhook processors
 * - Retry mechanisms with exponential backoff
 * - Webhook security (HMAC signatures)
 * - Rate limiting and throttling
 * - Event filtering and transformation
 */

import { logger } from '@/lib/logger';
import { leadPulseCache } from '@/lib/cache/leadpulse-cache';
import { leadPulseErrorHandler, LeadPulseErrorType } from '../error-handler';
import prisma from '@/lib/db/prisma';
import crypto from 'crypto';

// Webhook Types
export type WebhookEvent = 
  | 'visitor.created'
  | 'visitor.updated'
  | 'visitor.converted'
  | 'touchpoint.created'
  | 'form.submitted'
  | 'segment.updated'
  | 'alert.triggered'
  | 'error.occurred'
  | 'analytics.updated';

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: any;
  version: string;
  id: string;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: WebhookEvent[];
  active: boolean;
  secret?: string;
  headers?: Record<string, string>;
  timeout: number;
  retryConfig: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
    maxDelay: number;
  };
  filters?: {
    conditions: Array<{
      field: string;
      operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'exists';
      value: any;
    }>;
  };
  transformations?: {
    template: string; // JSONata expression for payload transformation
  };
  createdAt: Date;
  lastTriggered?: Date;
  successCount: number;
  failureCount: number;
  userId: string;
}

export interface WebhookDelivery {
  id: string;
  endpointId: string;
  event: WebhookEvent;
  payload: WebhookPayload;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  attempts: number;
  lastAttempt?: Date;
  nextRetry?: Date;
  response?: {
    status: number;
    headers: Record<string, string>;
    body: string;
  };
  error?: string;
  createdAt: Date;
}

export interface IncomingWebhook {
  id: string;
  name: string;
  url: string;
  processor: string; // Function name to process the webhook
  active: boolean;
  security: {
    validateSignature: boolean;
    signatureHeader?: string;
    secret?: string;
    allowedIPs?: string[];
  };
  mapping: {
    eventType: string;
    dataMapping: Record<string, string>;
  };
  userId: string;
}

export class WebhookSystem {
  private deliveryQueue: WebhookDelivery[] = [];
  private maxQueueSize = 10000;
  private processingInterval = 5000; // 5 seconds

  constructor() {
    this.startDeliveryProcessor();
    this.startCleanupJob();
  }

  // Register a new webhook endpoint
  async registerWebhook(userId: string, endpoint: Omit<WebhookEndpoint, 'id' | 'createdAt' | 'successCount' | 'failureCount' | 'userId'>): Promise<{ success: boolean; webhookId?: string; error?: string }> {
    try {
      // Validate URL
      try {
        new URL(endpoint.url);
      } catch {
        return { success: false, error: 'Invalid webhook URL' };
      }

      // Test the endpoint
      const testResult = await this.testWebhookEndpoint(endpoint.url, endpoint.secret, endpoint.timeout);
      if (!testResult.success) {
        return { success: false, error: `Webhook endpoint test failed: ${testResult.error}` };
      }

      const webhookId = this.generateWebhookId();
      const webhook: WebhookEndpoint = {
        ...endpoint,
        id: webhookId,
        createdAt: new Date(),
        successCount: 0,
        failureCount: 0,
        userId,
      };

      // Store in database
      await prisma.webhookEndpoint.create({
        data: {
          id: webhook.id,
          userId: webhook.userId,
          url: webhook.url,
          events: webhook.events,
          active: webhook.active,
          secret: webhook.secret,
          headers: webhook.headers,
          timeout: webhook.timeout,
          retryConfig: webhook.retryConfig,
          filters: webhook.filters,
          transformations: webhook.transformations,
          successCount: webhook.successCount,
          failureCount: webhook.failureCount,
        },
      });

      // Cache for quick access
      await leadPulseCache.set(`webhook:${webhookId}`, webhook, 24 * 60 * 60);

      logger.info(`Webhook registered: ${webhookId} for user ${userId}`);
      return { success: true, webhookId };

    } catch (error) {
      logger.error('Error registering webhook:', error);
      return { success: false, error: 'Failed to register webhook' };
    }
  }

  // Trigger webhook for an event
  async triggerWebhook(event: WebhookEvent, data: any, userId?: string): Promise<{ success: boolean; deliveries: number; error?: string }> {
    try {
      // Get all webhooks that should receive this event
      const webhooks = await this.getActiveWebhooks(event, userId);
      
      if (webhooks.length === 0) {
        return { success: true, deliveries: 0 };
      }

      const payload: WebhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        data,
        version: '1.0',
        id: this.generateWebhookId(),
      };

      let deliveryCount = 0;

      for (const webhook of webhooks) {
        // Apply filters
        if (webhook.filters && !this.applyFilters(data, webhook.filters)) {
          continue;
        }

        // Apply transformations
        let finalPayload = payload;
        if (webhook.transformations) {
          finalPayload = await this.applyTransformations(payload, webhook.transformations);
        }

        // Create delivery record
        const delivery: WebhookDelivery = {
          id: this.generateDeliveryId(),
          endpointId: webhook.id,
          event,
          payload: finalPayload,
          status: 'pending',
          attempts: 0,
          createdAt: new Date(),
        };

        // Add to delivery queue
        this.addToDeliveryQueue(delivery);
        deliveryCount++;
      }

      logger.info(`Webhook triggered: ${event}, ${deliveryCount} deliveries queued`);
      return { success: true, deliveries: deliveryCount };

    } catch (error) {
      logger.error('Error triggering webhook:', error);
      return { success: false, deliveries: 0, error: 'Failed to trigger webhook' };
    }
  }

  // Process incoming webhook
  async processIncomingWebhook(
    webhookId: string,
    headers: Record<string, string>,
    body: any,
    sourceIP?: string
  ): Promise<{ success: boolean; processed?: any; error?: string }> {
    try {
      // Get incoming webhook configuration
      const webhook = await this.getIncomingWebhook(webhookId);
      if (!webhook) {
        return { success: false, error: 'Webhook not found' };
      }

      if (!webhook.active) {
        return { success: false, error: 'Webhook is disabled' };
      }

      // Security checks
      if (webhook.security.allowedIPs?.length) {
        if (!sourceIP || !webhook.security.allowedIPs.includes(sourceIP)) {
          logger.warn(`Webhook access denied for IP: ${sourceIP}`);
          return { success: false, error: 'IP not allowed' };
        }
      }

      // Signature validation
      if (webhook.security.validateSignature) {
        const isValid = this.validateWebhookSignature(
          body,
          headers[webhook.security.signatureHeader || 'x-signature'],
          webhook.security.secret!
        );
        
        if (!isValid) {
          logger.warn(`Invalid webhook signature for ${webhookId}`);
          return { success: false, error: 'Invalid signature' };
        }
      }

      // Process the webhook based on its processor
      const result = await this.runWebhookProcessor(webhook, body);
      
      // Log successful processing
      await prisma.webhookDelivery.create({
        data: {
          id: this.generateDeliveryId(),
          webhookId: webhook.id,
          direction: 'incoming',
          payload: body,
          status: 'success',
          processedAt: new Date(),
        },
      });

      logger.info(`Incoming webhook processed: ${webhookId}`);
      return { success: true, processed: result };

    } catch (error) {
      logger.error('Error processing incoming webhook:', error);
      await leadPulseErrorHandler.handleError(
        error,
        { additionalData: { webhookId, sourceIP } },
        LeadPulseErrorType.EXTERNAL_API_ERROR
      );
      return { success: false, error: 'Failed to process webhook' };
    }
  }

  // Get active webhooks for an event
  private async getActiveWebhooks(event: WebhookEvent, userId?: string): Promise<WebhookEndpoint[]> {
    try {
      const whereClause: any = {
        active: true,
        events: { has: event },
      };
      
      if (userId) {
        whereClause.userId = userId;
      }

      const webhooks = await prisma.webhookEndpoint.findMany({
        where: whereClause,
      });

      return webhooks as WebhookEndpoint[];
    } catch (error) {
      logger.error('Error getting active webhooks:', error);
      return [];
    }
  }

  // Test webhook endpoint
  private async testWebhookEndpoint(url: string, secret?: string, timeout = 10000): Promise<{ success: boolean; error?: string }> {
    try {
      const testPayload = {
        event: 'test.ping' as WebhookEvent,
        timestamp: new Date().toISOString(),
        data: { message: 'Test webhook delivery' },
        version: '1.0',
        id: 'test-' + Date.now(),
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'LeadPulse-Webhooks/1.0',
        'X-LeadPulse-Event': testPayload.event,
        'X-LeadPulse-Delivery': testPayload.id,
      };

      if (secret) {
        const signature = this.generateWebhookSignature(JSON.stringify(testPayload), secret);
        headers['X-LeadPulse-Signature'] = signature;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(testPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }

    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Unknown error during webhook test' };
    }
  }

  // Deliver webhook with retry logic
  private async deliverWebhook(delivery: WebhookDelivery): Promise<boolean> {
    try {
      const webhook = await leadPulseCache.get<WebhookEndpoint>(`webhook:${delivery.endpointId}`);
      if (!webhook) {
        logger.error(`Webhook not found: ${delivery.endpointId}`);
        return false;
      }

      delivery.attempts++;
      delivery.lastAttempt = new Date();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'LeadPulse-Webhooks/1.0',
        'X-LeadPulse-Event': delivery.event,
        'X-LeadPulse-Delivery': delivery.id,
        'X-LeadPulse-Timestamp': delivery.payload.timestamp,
        ...webhook.headers,
      };

      if (webhook.secret) {
        const signature = this.generateWebhookSignature(JSON.stringify(delivery.payload), webhook.secret);
        headers['X-LeadPulse-Signature'] = signature;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), webhook.timeout);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(delivery.payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      delivery.response = {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: await response.text().catch(() => ''),
      };

      if (response.ok) {
        delivery.status = 'success';
        await this.updateWebhookStats(webhook.id, true);
        await this.saveDelivery(delivery);
        return true;
      } else {
        delivery.status = 'failed';
        delivery.error = `HTTP ${response.status}: ${response.statusText}`;
        await this.scheduleRetry(delivery, webhook);
        return false;
      }

    } catch (error) {
      delivery.status = 'failed';
      delivery.error = error instanceof Error ? error.message : 'Unknown error';
      
      const webhook = await leadPulseCache.get<WebhookEndpoint>(`webhook:${delivery.endpointId}`);
      if (webhook) {
        await this.scheduleRetry(delivery, webhook);
      }
      
      logger.error(`Webhook delivery failed: ${delivery.id}`, error);
      return false;
    }
  }

  // Schedule retry with exponential backoff
  private async scheduleRetry(delivery: WebhookDelivery, webhook: WebhookEndpoint): Promise<void> {
    if (delivery.attempts >= webhook.retryConfig.maxRetries) {
      delivery.status = 'failed';
      await this.updateWebhookStats(webhook.id, false);
      await this.saveDelivery(delivery);
      return;
    }

    const delay = Math.min(
      webhook.retryConfig.initialDelay * Math.pow(webhook.retryConfig.backoffMultiplier, delivery.attempts - 1),
      webhook.retryConfig.maxDelay
    );

    delivery.status = 'retrying';
    delivery.nextRetry = new Date(Date.now() + delay);
    
    // Re-add to queue for retry
    setTimeout(() => {
      this.addToDeliveryQueue(delivery);
    }, delay);

    await this.saveDelivery(delivery);
  }

  // Apply filters to determine if webhook should be triggered
  private applyFilters(data: any, filters: NonNullable<WebhookEndpoint['filters']>): boolean {
    return filters.conditions.every(condition => {
      const value = this.getNestedValue(data, condition.field);
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'contains':
          return String(value).includes(String(condition.value));
        case 'greater_than':
          return Number(value) > Number(condition.value);
        case 'less_than':
          return Number(value) < Number(condition.value);
        case 'exists':
          return value !== undefined && value !== null;
        default:
          return true;
      }
    });
  }

  // Apply payload transformations
  private async applyTransformations(payload: WebhookPayload, transformations: NonNullable<WebhookEndpoint['transformations']>): Promise<WebhookPayload> {
    try {
      // Simple template-based transformation
      // In production, you might use JSONata or similar
      let transformedPayload = JSON.parse(JSON.stringify(payload));
      
      if (transformations.template) {
        // Apply template transformations
        const template = transformations.template;
        // This is a simplified implementation - in production use a proper template engine
        transformedPayload = JSON.parse(
          template
            .replace(/\{\{event\}\}/g, payload.event)
            .replace(/\{\{timestamp\}\}/g, payload.timestamp)
            .replace(/\{\{id\}\}/g, payload.id)
        );
      }
      
      return transformedPayload;
    } catch (error) {
      logger.warn('Error applying webhook transformations:', error);
      return payload;
    }
  }

  // Get incoming webhook configuration
  private async getIncomingWebhook(webhookId: string): Promise<IncomingWebhook | null> {
    try {
      const cached = await leadPulseCache.get<IncomingWebhook>(`incoming_webhook:${webhookId}`);
      if (cached) return cached;

      const webhook = await prisma.incomingWebhook.findUnique({
        where: { id: webhookId },
      });

      if (webhook) {
        await leadPulseCache.set(`incoming_webhook:${webhookId}`, webhook, 60 * 60);
        return webhook as IncomingWebhook;
      }

      return null;
    } catch (error) {
      logger.error('Error getting incoming webhook:', error);
      return null;
    }
  }

  // Validate webhook signature
  private validateWebhookSignature(payload: any, signature: string, secret: string): boolean {
    if (!signature || !secret) return false;
    
    try {
      const expectedSignature = this.generateWebhookSignature(JSON.stringify(payload), secret);
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }

  // Generate webhook signature
  private generateWebhookSignature(payload: string, secret: string): string {
    return `sha256=${crypto.createHmac('sha256', secret).update(payload).digest('hex')}`;
  }

  // Run webhook processor
  private async runWebhookProcessor(webhook: IncomingWebhook, payload: any): Promise<any> {
    try {
      switch (webhook.processor) {
        case 'crm_contact_sync':
          return await this.processCRMContactSync(payload, webhook.mapping);
        case 'form_submission':
          return await this.processFormSubmission(payload, webhook.mapping);
        case 'visitor_update':
          return await this.processVisitorUpdate(payload, webhook.mapping);
        default:
          logger.warn(`Unknown webhook processor: ${webhook.processor}`);
          return null;
      }
    } catch (error) {
      logger.error(`Error in webhook processor ${webhook.processor}:`, error);
      throw error;
    }
  }

  // Webhook processors
  private async processCRMContactSync(payload: any, mapping: IncomingWebhook['mapping']): Promise<any> {
    // Extract contact data based on mapping
    const contactData: any = {};
    
    Object.entries(mapping.dataMapping).forEach(([leadPulseField, webhookField]) => {
      contactData[leadPulseField] = this.getNestedValue(payload, webhookField);
    });

    // Sync with LeadPulse contacts
    if (contactData.email) {
      const contact = await prisma.contact.upsert({
        where: { email: contactData.email },
        update: contactData,
        create: {
          ...contactData,
          source: 'Webhook',
          createdById: 'system',
        },
      });

      return { contactId: contact.id, action: 'synced' };
    }

    return null;
  }

  private async processFormSubmission(payload: any, mapping: IncomingWebhook['mapping']): Promise<any> {
    // Process form submission from external source
    const formData: any = {};
    
    Object.entries(mapping.dataMapping).forEach(([fieldName, webhookField]) => {
      formData[fieldName] = this.getNestedValue(payload, webhookField);
    });

    // Create a form submission record
    // Implementation depends on your form structure
    return { formSubmission: 'processed', data: formData };
  }

  private async processVisitorUpdate(payload: any, mapping: IncomingWebhook['mapping']): Promise<any> {
    // Update visitor data from external source
    const visitorData: any = {};
    
    Object.entries(mapping.dataMapping).forEach(([visitorField, webhookField]) => {
      visitorData[visitorField] = this.getNestedValue(payload, webhookField);
    });

    if (visitorData.visitorId) {
      await prisma.leadPulseVisitor.update({
        where: { id: visitorData.visitorId },
        data: visitorData,
      });

      return { visitorId: visitorData.visitorId, action: 'updated' };
    }

    return null;
  }

  // Utility methods
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private generateWebhookId(): string {
    return `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDeliveryId(): string {
    return `whd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addToDeliveryQueue(delivery: WebhookDelivery): void {
    if (this.deliveryQueue.length >= this.maxQueueSize) {
      this.deliveryQueue.shift();
    }
    this.deliveryQueue.push(delivery);
  }

  private async updateWebhookStats(webhookId: string, success: boolean): Promise<void> {
    try {
      const field = success ? 'successCount' : 'failureCount';
      await prisma.webhookEndpoint.update({
        where: { id: webhookId },
        data: {
          [field]: { increment: 1 },
          lastTriggered: new Date(),
        },
      });

      // Update cached version
      const cached = await leadPulseCache.get<WebhookEndpoint>(`webhook:${webhookId}`);
      if (cached) {
        cached[field]++;
        cached.lastTriggered = new Date();
        await leadPulseCache.set(`webhook:${webhookId}`, cached, 24 * 60 * 60);
      }
    } catch (error) {
      logger.error('Error updating webhook stats:', error);
    }
  }

  private async saveDelivery(delivery: WebhookDelivery): Promise<void> {
    try {
      await prisma.webhookDelivery.upsert({
        where: { id: delivery.id },
        update: {
          status: delivery.status,
          attempts: delivery.attempts,
          lastAttempt: delivery.lastAttempt,
          nextRetry: delivery.nextRetry,
          response: delivery.response,
          error: delivery.error,
        },
        create: {
          id: delivery.id,
          webhookId: delivery.endpointId,
          direction: 'outgoing',
          event: delivery.event,
          payload: delivery.payload,
          status: delivery.status,
          attempts: delivery.attempts,
          lastAttempt: delivery.lastAttempt,
          nextRetry: delivery.nextRetry,
          response: delivery.response,
          error: delivery.error,
          createdAt: delivery.createdAt,
        },
      });
    } catch (error) {
      logger.error('Error saving webhook delivery:', error);
    }
  }

  // Background processors
  private startDeliveryProcessor(): void {
    setInterval(async () => {
      await this.processDeliveryQueue();
    }, this.processingInterval);
  }

  private async processDeliveryQueue(): Promise<void> {
    const pendingDeliveries = this.deliveryQueue.filter(d => 
      d.status === 'pending' || (d.status === 'retrying' && d.nextRetry && d.nextRetry <= new Date())
    );

    for (const delivery of pendingDeliveries.slice(0, 10)) { // Process max 10 at a time
      await this.deliverWebhook(delivery);
      
      // Remove from queue if completed (success or final failure)
      if (delivery.status === 'success' || delivery.status === 'failed') {
        const index = this.deliveryQueue.indexOf(delivery);
        if (index > -1) {
          this.deliveryQueue.splice(index, 1);
        }
      }
    }
  }

  private startCleanupJob(): void {
    // Clean up old deliveries every hour
    setInterval(async () => {
      try {
        const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
        
        await prisma.webhookDelivery.deleteMany({
          where: {
            createdAt: { lt: cutoff },
            status: { in: ['success', 'failed'] },
          },
        });

        logger.info('Webhook delivery cleanup completed');
      } catch (error) {
        logger.error('Error during webhook cleanup:', error);
      }
    }, 60 * 60 * 1000); // Every hour
  }

  // Public methods for management
  async getWebhookStats(webhookId: string): Promise<any> {
    try {
      const webhook = await prisma.webhookEndpoint.findUnique({
        where: { id: webhookId },
      });

      if (!webhook) return null;

      const deliveries = await prisma.webhookDelivery.findMany({
        where: { webhookId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      const stats = {
        webhook,
        deliveries: deliveries.length,
        successRate: webhook.successCount / (webhook.successCount + webhook.failureCount) * 100 || 0,
        recentDeliveries: deliveries.slice(0, 10),
      };

      return stats;
    } catch (error) {
      logger.error('Error getting webhook stats:', error);
      return null;
    }
  }

  async disableWebhook(webhookId: string): Promise<boolean> {
    try {
      await prisma.webhookEndpoint.update({
        where: { id: webhookId },
        data: { active: false },
      });

      await leadPulseCache.del(`webhook:${webhookId}`);
      return true;
    } catch (error) {
      logger.error('Error disabling webhook:', error);
      return false;
    }
  }
}

// Export singleton instance
export const webhookSystem = new WebhookSystem();

// Helper functions for common webhook triggers
export const WebhookTriggers = {
  visitorCreated: (visitor: any) => 
    webhookSystem.triggerWebhook('visitor.created', visitor, visitor.userId),
  
  visitorConverted: (visitor: any, contact: any) =>
    webhookSystem.triggerWebhook('visitor.converted', { visitor, contact }, visitor.userId),
  
  formSubmitted: (submission: any) =>
    webhookSystem.triggerWebhook('form.submitted', submission, submission.userId),
  
  alertTriggered: (alert: any) =>
    webhookSystem.triggerWebhook('alert.triggered', alert),
  
  errorOccurred: (error: any) =>
    webhookSystem.triggerWebhook('error.occurred', error),
};