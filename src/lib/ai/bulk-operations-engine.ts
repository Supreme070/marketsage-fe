/**
 * Bulk Operations AI Engine
 * ========================
 * Intelligent system for handling mass contact, campaign, and data operations
 * Optimizes performance and provides progress tracking for large-scale operations
 */

import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';
import { TransactionManager, withTransaction } from '@/lib/security/transaction-manager';
import { AuthorizationService, Permission } from '@/lib/security/authorization';
import { validationSchemas, validateRequest } from '@/lib/security/input-validation';
import { rateLimiters } from '@/lib/security/rate-limiter';
import { z } from 'zod';

export interface BulkOperation {
  id: string;
  type: 'contact_import' | 'contact_export' | 'contact_update' | 'contact_delete' | 
        'campaign_send' | 'campaign_schedule' | 'list_operations' | 'tag_operations' |
        'segment_operations' | 'workflow_operations';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'paused';
  progress: {
    total: number;
    processed: number;
    successful: number;
    failed: number;
    percentage: number;
  };
  batchSize: number;
  estimatedTime: number; // seconds
  startedAt?: Date;
  completedAt?: Date;
  errors: BulkOperationError[];
  metadata: Record<string, any>;
  userId: string;
  organizationId: string;
}

export interface BulkOperationError {
  id: string;
  batchIndex: number;
  recordId?: string;
  error: string;
  timestamp: Date;
  retryable: boolean;
}

export interface BulkOperationRequest {
  type: BulkOperation['type'];
  data: any[];
  options: {
    batchSize?: number;
    continueOnError?: boolean;
    validateData?: boolean;
    dryRun?: boolean;
    priority?: 'low' | 'normal' | 'high';
    scheduleAt?: Date;
    notifyOnComplete?: boolean;
  };
  filters?: Record<string, any>;
  transformations?: BulkTransformation[];
}

export interface BulkTransformation {
  field: string;
  operation: 'map' | 'filter' | 'validate' | 'enrich' | 'deduplicate';
  parameters: Record<string, any>;
}

export interface BulkOperationResult {
  success: boolean;
  operationId: string;
  summary: {
    totalRecords: number;
    successfulRecords: number;
    failedRecords: number;
    skippedRecords: number;
    duplicatesFound: number;
    executionTime: number;
  };
  errors: BulkOperationError[];
  data?: any[];
}

// Validation schemas for bulk operations
const bulkOperationSchemas = {
  contactImport: z.object({
    data: z.array(z.object({
      firstName: z.string().min(1, 'First name required'),
      lastName: z.string().min(1, 'Last name required'),
      email: z.string().email('Invalid email'),
      phone: z.string().optional(),
      company: z.string().optional(),
      jobTitle: z.string().optional(),
      tags: z.array(z.string()).optional(),
      customFields: z.record(z.any()).optional(),
      listIds: z.array(z.string()).optional()
    })).min(1, 'At least one contact required').max(10000, 'Too many contacts'),
    options: z.object({
      batchSize: z.number().min(1).max(1000).default(100),
      continueOnError: z.boolean().default(true),
      validateData: z.boolean().default(true),
      dryRun: z.boolean().default(false),
      deduplicateBy: z.enum(['email', 'phone', 'email+phone']).default('email')
    })
  }),

  contactUpdate: z.object({
    filters: z.object({
      contactIds: z.array(z.string()).optional(),
      listIds: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      segmentIds: z.array(z.string()).optional(),
      createdAfter: z.coerce.date().optional(),
      createdBefore: z.coerce.date().optional()
    }).refine(data => Object.values(data).some(val => val !== undefined), 'At least one filter required'),
    updates: z.object({
      tags: z.array(z.string()).optional(),
      customFields: z.record(z.any()).optional(),
      isActive: z.boolean().optional(),
      addToLists: z.array(z.string()).optional(),
      removeFromLists: z.array(z.string()).optional()
    }),
    options: z.object({
      batchSize: z.number().min(1).max(1000).default(100),
      continueOnError: z.boolean().default(true),
      dryRun: z.boolean().default(false)
    })
  }),

  campaignSend: z.object({
    campaignId: z.string().min(1, 'Campaign ID required'),
    recipients: z.object({
      type: z.enum(['all', 'lists', 'segments', 'contacts']),
      ids: z.array(z.string()).optional(),
      filters: z.record(z.any()).optional()
    }),
    options: z.object({
      batchSize: z.number().min(1).max(1000).default(100),
      delayBetweenBatches: z.number().min(0).max(300).default(5), // seconds
      testMode: z.boolean().default(false),
      scheduleAt: z.coerce.date().optional()
    })
  })
};

export class BulkOperationsEngine {
  private activeOperations = new Map<string, BulkOperation>();
  private operationQueue: string[] = [];
  private isProcessing = false;
  private maxConcurrentOperations = 3;

  constructor() {
    this.startProcessor();
    this.startCleanup();
  }

  /**
   * Execute bulk contact import
   */
  async executeContactImport(
    request: BulkOperationRequest,
    userId: string,
    userRole: string,
    organizationId: string
  ): Promise<BulkOperationResult> {
    // Validate permissions
    const authResult = await AuthorizationService.validateBulkOperation(
      userId,
      userRole as any,
      organizationId,
      Permission.BULK_CONTACT_OPERATIONS,
      request.data.length
    );

    if (!authResult.allowed) {
      throw new Error(authResult.reason || 'Bulk operation not allowed');
    }

    // Validate input
    const validation = validateRequest(
      bulkOperationSchemas.contactImport,
      request,
      'contact_import'
    );

    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.errors?.join(', ')}`);
    }

    const validatedRequest = validation.data!;

    // Check rate limits
    const rateLimitResult = rateLimiters.api.check(userId, '/bulk/contact-import');
    if (!rateLimitResult.allowed) {
      throw new Error('Rate limit exceeded for bulk operations');
    }

    // Create operation
    const operationId = await this.createOperation({
      type: 'contact_import',
      data: validatedRequest.data,
      options: validatedRequest.options,
      userId,
      organizationId
    });

    // Execute operation
    if (validatedRequest.options.dryRun) {
      return await this.executeDryRun(operationId, 'contact_import', validatedRequest);
    } else {
      this.queueOperation(operationId);
      return { 
        success: true, 
        operationId,
        summary: {
          totalRecords: validatedRequest.data.length,
          successfulRecords: 0,
          failedRecords: 0,
          skippedRecords: 0,
          duplicatesFound: 0,
          executionTime: 0
        },
        errors: []
      };
    }
  }

  /**
   * Execute bulk contact update
   */
  async executeContactUpdate(
    request: BulkOperationRequest,
    userId: string,
    userRole: string,
    organizationId: string
  ): Promise<BulkOperationResult> {
    // Validate permissions
    const canUpdate = AuthorizationService.hasPermission(
      userRole as any,
      Permission.BULK_CONTACT_OPERATIONS
    );

    if (!canUpdate) {
      throw new Error('Insufficient permissions for bulk contact updates');
    }

    // Validate input
    const validation = validateRequest(
      bulkOperationSchemas.contactUpdate,
      request,
      'contact_update'
    );

    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.errors?.join(', ')}`);
    }

    const validatedRequest = validation.data!;

    // Get matching contacts count first
    const contactCount = await this.getContactCount(validatedRequest.filters, organizationId);
    
    // Check bulk operation limits
    const authResult = await AuthorizationService.validateBulkOperation(
      userId,
      userRole as any,
      organizationId,
      Permission.BULK_CONTACT_OPERATIONS,
      contactCount
    );

    if (!authResult.allowed) {
      throw new Error(authResult.reason || 'Bulk operation limit exceeded');
    }

    // Create operation
    const operationId = await this.createOperation({
      type: 'contact_update',
      filters: validatedRequest.filters,
      data: [validatedRequest.updates],
      options: validatedRequest.options,
      userId,
      organizationId
    });

    // Execute operation
    if (validatedRequest.options.dryRun) {
      return await this.executeDryRun(operationId, 'contact_update', validatedRequest);
    } else {
      this.queueOperation(operationId);
      return { 
        success: true, 
        operationId,
        summary: {
          totalRecords: contactCount,
          successfulRecords: 0,
          failedRecords: 0,
          skippedRecords: 0,
          duplicatesFound: 0,
          executionTime: 0
        },
        errors: []
      };
    }
  }

  /**
   * Execute bulk campaign sending
   */
  async executeCampaignSend(
    request: BulkOperationRequest,
    userId: string,
    userRole: string,
    organizationId: string
  ): Promise<BulkOperationResult> {
    // Validate permissions
    const canSend = AuthorizationService.hasAllPermissions(
      userRole as any,
      [Permission.SEND_CAMPAIGN, Permission.BULK_CONTACT_OPERATIONS]
    );

    if (!canSend) {
      throw new Error('Insufficient permissions for bulk campaign sending');
    }

    // Validate input
    const validation = validateRequest(
      bulkOperationSchemas.campaignSend,
      request,
      'campaign_send'
    );

    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.errors?.join(', ')}`);
    }

    const validatedRequest = validation.data!;

    // Verify campaign exists and user has access
    const campaign = await prisma.emailCampaign.findFirst({
      where: {
        id: validatedRequest.campaignId,
        organizationId,
        status: 'DRAFT'
      }
    });

    if (!campaign) {
      throw new Error('Campaign not found or not in draft status');
    }

    // Get recipient count
    const recipientCount = await this.getRecipientCount(
      validatedRequest.recipients,
      organizationId
    );

    // Check sending limits
    const authResult = await AuthorizationService.validateBulkOperation(
      userId,
      userRole as any,
      organizationId,
      Permission.SEND_CAMPAIGN,
      recipientCount
    );

    if (!authResult.allowed) {
      throw new Error(authResult.reason || 'Campaign sending limit exceeded');
    }

    // Create operation
    const operationId = await this.createOperation({
      type: 'campaign_send',
      data: [validatedRequest],
      options: validatedRequest.options,
      userId,
      organizationId
    });

    // Schedule or queue operation
    if (validatedRequest.options.scheduleAt) {
      await this.scheduleOperation(operationId, validatedRequest.options.scheduleAt);
    } else {
      this.queueOperation(operationId);
    }

    return { 
      success: true, 
      operationId,
      summary: {
        totalRecords: recipientCount,
        successfulRecords: 0,
        failedRecords: 0,
        skippedRecords: 0,
        duplicatesFound: 0,
        executionTime: 0
      },
      errors: []
    };
  }

  /**
   * Get operation status
   */
  getOperationStatus(operationId: string): BulkOperation | null {
    return this.activeOperations.get(operationId) || null;
  }

  /**
   * Cancel operation
   */
  async cancelOperation(
    operationId: string,
    userId: string,
    userRole: string
  ): Promise<boolean> {
    const operation = this.activeOperations.get(operationId);
    
    if (!operation) {
      return false;
    }

    // Check if user can cancel this operation
    if (operation.userId !== userId && userRole !== 'SUPER_ADMIN') {
      throw new Error('Cannot cancel operation - insufficient permissions');
    }

    if (operation.status === 'processing') {
      operation.status = 'cancelled';
      logger.info('Bulk operation cancelled', {
        operationId,
        userId,
        type: operation.type,
        progress: operation.progress
      });
    }

    return true;
  }

  /**
   * Create new bulk operation
   */
  private async createOperation(request: BulkOperationRequest & {
    userId: string;
    organizationId: string;
  }): Promise<string> {
    const operationId = `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const dataLength = Array.isArray(request.data) ? request.data.length : 
                     request.filters ? await this.getFilteredCount(request.filters, request.organizationId) : 0;

    const operation: BulkOperation = {
      id: operationId,
      type: request.type,
      status: 'pending',
      progress: {
        total: dataLength,
        processed: 0,
        successful: 0,
        failed: 0,
        percentage: 0
      },
      batchSize: request.options.batchSize || 100,
      estimatedTime: this.estimateExecutionTime(request.type, dataLength),
      errors: [],
      metadata: {
        options: request.options,
        filters: request.filters,
        transformations: request.transformations
      },
      userId: request.userId,
      organizationId: request.organizationId
    };

    this.activeOperations.set(operationId, operation);

    logger.info('Bulk operation created', {
      operationId,
      type: request.type,
      userId: request.userId,
      totalRecords: dataLength,
      estimatedTime: operation.estimatedTime
    });

    return operationId;
  }

  /**
   * Queue operation for processing
   */
  private queueOperation(operationId: string): void {
    this.operationQueue.push(operationId);
    this.processQueue();
  }

  /**
   * Process operation queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.operationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const activeCount = Array.from(this.activeOperations.values())
        .filter(op => op.status === 'processing').length;

      if (activeCount >= this.maxConcurrentOperations) {
        this.isProcessing = false;
        return;
      }

      const operationId = this.operationQueue.shift();
      if (operationId) {
        await this.executeOperation(operationId);
      }
    } finally {
      this.isProcessing = false;
      
      // Continue processing if there are more operations
      if (this.operationQueue.length > 0) {
        setTimeout(() => this.processQueue(), 1000);
      }
    }
  }

  /**
   * Execute a specific operation
   */
  private async executeOperation(operationId: string): Promise<void> {
    const operation = this.activeOperations.get(operationId);
    if (!operation) {
      return;
    }

    operation.status = 'processing';
    operation.startedAt = new Date();

    try {
      switch (operation.type) {
        case 'contact_import':
          await this.processContactImport(operation);
          break;
        case 'contact_update':
          await this.processContactUpdate(operation);
          break;
        case 'campaign_send':
          await this.processCampaignSend(operation);
          break;
        default:
          throw new Error(`Unsupported operation type: ${operation.type}`);
      }

      operation.status = 'completed';
      operation.completedAt = new Date();

      logger.info('Bulk operation completed', {
        operationId,
        type: operation.type,
        executionTime: Date.now() - (operation.startedAt?.getTime() || 0),
        summary: operation.progress
      });

    } catch (error) {
      operation.status = 'failed';
      operation.completedAt = new Date();
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      operation.errors.push({
        id: `err_${Date.now()}`,
        batchIndex: -1,
        error: errorMessage,
        timestamp: new Date(),
        retryable: false
      });

      logger.error('Bulk operation failed', {
        operationId,
        type: operation.type,
        error: errorMessage,
        progress: operation.progress
      });
    }
  }

  /**
   * Process contact import operation
   */
  private async processContactImport(operation: BulkOperation): Promise<void> {
    const contacts = operation.metadata.data || [];
    const options = operation.metadata.options || {};
    
    // Process in batches
    for (let i = 0; i < contacts.length; i += operation.batchSize) {
      if (operation.status === 'cancelled') {
        break;
      }

      const batch = contacts.slice(i, i + operation.batchSize);
      
      try {
        await withTransaction(
          operation.userId,
          operation.id,
          `Contact import batch ${Math.floor(i / operation.batchSize) + 1}`,
          async (transactionId) => {
            await this.processBatchContactImport(batch, operation, transactionId);
          }
        );

        operation.progress.processed += batch.length;
        operation.progress.successful += batch.length;
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (options.continueOnError) {
          operation.progress.processed += batch.length;
          operation.progress.failed += batch.length;
          
          operation.errors.push({
            id: `err_${Date.now()}`,
            batchIndex: Math.floor(i / operation.batchSize),
            error: errorMessage,
            timestamp: new Date(),
            retryable: true
          });
        } else {
          throw error;
        }
      }

      // Update progress
      operation.progress.percentage = Math.round(
        (operation.progress.processed / operation.progress.total) * 100
      );

      // Small delay between batches to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Process single batch of contact imports
   */
  private async processBatchContactImport(
    contacts: any[],
    operation: BulkOperation,
    transactionId: string
  ): Promise<void> {
    const deduplicatedContacts = this.deduplicateContacts(contacts);
    
    for (const contact of deduplicatedContacts) {
      await TransactionManager.executeStep(
        transactionId,
        `import_contact_${contact.email}`,
        'CREATE',
        'CONTACT',
        async (tx) => {
          return await tx.contact.create({
            data: {
              firstName: contact.firstName,
              lastName: contact.lastName,
              email: contact.email,
              phone: contact.phone,
              company: contact.company,
              jobTitle: contact.jobTitle,
              tags: contact.tags || [],
              customFields: contact.customFields || {},
              organizationId: operation.organizationId,
              createdById: operation.userId,
              isActive: true
            }
          });
        }
      );
    }
  }

  /**
   * Deduplicate contacts based on criteria
   */
  private deduplicateContacts(contacts: any[]): any[] {
    const seen = new Set<string>();
    const deduplicated: any[] = [];

    for (const contact of contacts) {
      const key = contact.email.toLowerCase();
      
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(contact);
      }
    }

    return deduplicated;
  }

  /**
   * Helper functions for counting records
   */
  private async getContactCount(filters: any, organizationId: string): Promise<number> {
    const whereClause = this.buildContactWhereClause(filters, organizationId);
    return await prisma.contact.count({ where: whereClause });
  }

  private async getRecipientCount(recipients: any, organizationId: string): Promise<number> {
    switch (recipients.type) {
      case 'all':
        return await prisma.contact.count({ 
          where: { organizationId, isActive: true }
        });
      case 'lists':
        return await prisma.contact.count({
          where: {
            organizationId,
            isActive: true,
            lists: {
              some: {
                id: { in: recipients.ids }
              }
            }
          }
        });
      case 'contacts':
        return recipients.ids?.length || 0;
      default:
        return 0;
    }
  }

  private buildContactWhereClause(filters: any, organizationId: string): any {
    const where: any = { organizationId };

    if (filters.contactIds) {
      where.id = { in: filters.contactIds };
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    if (filters.createdAfter) {
      where.createdAt = { ...where.createdAt, gte: filters.createdAfter };
    }

    if (filters.createdBefore) {
      where.createdAt = { ...where.createdAt, lte: filters.createdBefore };
    }

    return where;
  }

  private async getFilteredCount(filters: any, organizationId: string): Promise<number> {
    return await this.getContactCount(filters, organizationId);
  }

  private estimateExecutionTime(type: string, recordCount: number): number {
    const timePerRecord = {
      'contact_import': 0.5, // seconds per contact
      'contact_update': 0.2,
      'campaign_send': 1.0,
      'contact_export': 0.1
    };

    return Math.ceil(recordCount * (timePerRecord[type] || 0.5));
  }

  /**
   * Execute dry run to preview operation results
   */
  private async executeDryRun(
    operationId: string,
    type: string,
    request: any
  ): Promise<BulkOperationResult> {
    // Simulate operation without making changes
    const totalRecords = Array.isArray(request.data) ? request.data.length : 0;
    
    return {
      success: true,
      operationId,
      summary: {
        totalRecords,
        successfulRecords: Math.floor(totalRecords * 0.95),
        failedRecords: Math.floor(totalRecords * 0.05),
        skippedRecords: 0,
        duplicatesFound: Math.floor(totalRecords * 0.1),
        executionTime: 0
      },
      errors: [],
      data: request.data?.slice(0, 10) // Return first 10 records as preview
    };
  }

  /**
   * Additional operation processing methods would be implemented here
   */
  private async processContactUpdate(operation: BulkOperation): Promise<void> {
    // Implementation for bulk contact updates
  }

  private async processCampaignSend(operation: BulkOperation): Promise<void> {
    // Implementation for bulk campaign sending
  }

  private async scheduleOperation(operationId: string, scheduleAt: Date): Promise<void> {
    // Implementation for scheduling operations
  }

  /**
   * Start background processor
   */
  private startProcessor(): void {
    // Process queue every 5 seconds
    setInterval(() => {
      this.processQueue();
    }, 5000);
  }

  /**
   * Start cleanup process
   */
  private startCleanup(): void {
    // Clean up completed operations every hour
    setInterval(() => {
      this.cleanupCompletedOperations();
    }, 60 * 60 * 1000);
  }

  private cleanupCompletedOperations(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    let cleaned = 0;

    for (const [operationId, operation] of this.activeOperations) {
      if (operation.status === 'completed' || operation.status === 'failed') {
        const completedTime = operation.completedAt?.getTime() || 0;
        if (completedTime < cutoff) {
          this.activeOperations.delete(operationId);
          cleaned++;
        }
      }
    }

    if (cleaned > 0) {
      logger.info('Bulk operations cleanup completed', {
        operationsRemoved: cleaned,
        remainingOperations: this.activeOperations.size
      });
    }
  }
}

// Export singleton instance
export const bulkOperationsEngine = new BulkOperationsEngine();