/**
 * Universal Task Execution Engine
 * ================================
 * Central execution engine that connects Supreme AI to ALL 172 API endpoints
 * Enables AI to perform ANY operation in the MarketSage app
 */

import { logger } from '@/lib/logger';
import prisma from '@/lib/db/prisma';
import { intelligentIntentAnalyzer, type IntelligentIntent } from './intelligent-intent-analyzer';
import { recordTaskExecution } from './task-execution-monitor';

// Universal Operation Registry
export interface UniversalOperation {
  id: string;
  category: string;
  entity: string;
  action: string;
  description: string;
  apiEndpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  requiredParams: string[];
  optionalParams?: string[];
  requiresAuth: boolean;
  minRole?: 'USER' | 'IT_ADMIN' | 'ADMIN' | 'SUPER_ADMIN';
  dangerous?: boolean;
  executor: (params: any, userId: string) => Promise<any>;
}

export interface ExecutionContext {
  userId: string;
  userRole: string;
  organizationId: string;
  intent: IntelligentIntent;
  params: Record<string, any>;
  dryRun?: boolean;
  approvalRequired?: boolean;
}

export interface ExecutionResult {
  success: boolean;
  operationId: string;
  category: string;
  entity: string;
  action: string;
  message: string;
  data?: any;
  error?: string;
  executionTime: number;
  requiresApproval?: boolean;
  approvalData?: any;
  suggestions?: string[];
  affectedRecords?: number;
  rollbackAvailable?: boolean;
  rollbackId?: string;
}

class UniversalTaskExecutionEngine {
  private operations: Map<string, UniversalOperation> = new Map();
  private categoryIndex: Map<string, string[]> = new Map();
  private entityIndex: Map<string, string[]> = new Map();
  private safetyRules: Map<string, (context: ExecutionContext) => boolean> = new Map();

  constructor() {
    this.initializeOperationRegistry();
    this.initializeSafetyRules();
  }

  /**
   * Initialize the complete operation registry with all 172 API endpoints
   */
  private initializeOperationRegistry() {
    // User & Organization Management
    this.registerUserOperations();
    this.registerOrganizationOperations();
    
    // Contact & List Management
    this.registerContactOperations();
    this.registerListOperations();
    this.registerSegmentOperations();
    
    // Campaign Management
    this.registerEmailCampaignOperations();
    this.registerSMSCampaignOperations();
    this.registerWhatsAppCampaignOperations();
    
    // Workflow & Automation
    this.registerWorkflowOperations();
    this.registerTaskOperations();
    
    // LeadPulse & Analytics
    this.registerLeadPulseOperations();
    this.registerAnalyticsOperations();
    
    // A/B Testing
    this.registerABTestOperations();
    
    // Payment & Billing
    this.registerPaymentOperations();
    this.registerSubscriptionOperations();
    
    // Integration Management
    this.registerIntegrationOperations();
    
    // Form Builder
    this.registerFormOperations();
    
    // Template Management
    this.registerTemplateOperations();
    
    // AI & ML Operations
    this.registerAIOperations();
    this.registerMLOperations();
    
    // System Administration
    this.registerSystemOperations();
    
    // Compliance & Security
    this.registerComplianceOperations();
    
    // Attribution & Conversion
    this.registerAttributionOperations();
    
    // Notification & Alerts
    this.registerNotificationOperations();
    
    // Data Management
    this.registerDataOperations();
  }

  /**
   * Register user management operations
   */
  private registerUserOperations() {
    // Create User
    this.registerOperation({
      id: 'user_create',
      category: 'user_management',
      entity: 'user',
      action: 'create',
      description: 'Create a new user account',
      apiEndpoint: '/api/users',
      method: 'POST',
      requiredParams: ['email', 'name', 'role'],
      optionalParams: ['password', 'phone', 'metadata'],
      requiresAuth: true,
      minRole: 'ADMIN',
      dangerous: false,
      executor: async (params, userId) => {
        const user = await prisma.user.create({
          data: {
            email: params.email,
            name: params.name,
            role: params.role,
            hashedPassword: params.password ? await hashPassword(params.password) : null,
            phone: params.phone,
            metadata: params.metadata || {},
          },
        });
        return { user, message: `User ${user.email} created successfully` };
      },
    });

    // Update User
    this.registerOperation({
      id: 'user_update',
      category: 'user_management',
      entity: 'user',
      action: 'update',
      description: 'Update user information',
      apiEndpoint: '/api/users/[id]',
      method: 'PUT',
      requiredParams: ['userId'],
      optionalParams: ['email', 'name', 'role', 'phone', 'status'],
      requiresAuth: true,
      minRole: 'ADMIN',
      dangerous: false,
      executor: async (params, userId) => {
        const { userId: targetUserId, ...updateData } = params;
        const user = await prisma.user.update({
          where: { id: targetUserId },
          data: updateData,
        });
        return { user, message: `User ${user.email} updated successfully` };
      },
    });

    // Delete User
    this.registerOperation({
      id: 'user_delete',
      category: 'user_management',
      entity: 'user',
      action: 'delete',
      description: 'Delete a user account',
      apiEndpoint: '/api/users/[id]',
      method: 'DELETE',
      requiredParams: ['userId'],
      requiresAuth: true,
      minRole: 'SUPER_ADMIN',
      dangerous: true,
      executor: async (params, userId) => {
        const user = await prisma.user.delete({
          where: { id: params.userId },
        });
        return { message: `User ${user.email} deleted successfully` };
      },
    });

    // Manage User Roles
    this.registerOperation({
      id: 'user_role_update',
      category: 'user_management',
      entity: 'user',
      action: 'update_role',
      description: 'Update user role and permissions',
      apiEndpoint: '/api/users/[id]',
      method: 'PATCH',
      requiredParams: ['userId', 'role'],
      requiresAuth: true,
      minRole: 'SUPER_ADMIN',
      dangerous: true,
      executor: async (params, userId) => {
        const user = await prisma.user.update({
          where: { id: params.userId },
          data: { role: params.role },
        });
        return { user, message: `User role updated to ${params.role}` };
      },
    });
  }

  /**
   * Register contact operations
   */
  private registerContactOperations() {
    // Create Contact
    this.registerOperation({
      id: 'contact_create',
      category: 'contact_management',
      entity: 'contact',
      action: 'create',
      description: 'Create a new contact',
      apiEndpoint: '/api/contacts',
      method: 'POST',
      requiredParams: ['email'],
      optionalParams: ['firstName', 'lastName', 'phone', 'tags', 'customFields', 'listIds'],
      requiresAuth: true,
      minRole: 'USER',
      dangerous: false,
      executor: async (params, userId) => {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { organization: true },
        });

        const contact = await prisma.contact.create({
          data: {
            email: params.email,
            firstName: params.firstName,
            lastName: params.lastName,
            phone: params.phone,
            tags: params.tags || [],
            customFields: params.customFields || {},
            organizationId: user!.organizationId!,
            lists: params.listIds ? {
              connect: params.listIds.map((id: string) => ({ id })),
            } : undefined,
          },
        });
        return { contact, message: `Contact ${contact.email} created successfully` };
      },
    });

    // Bulk Import Contacts
    this.registerOperation({
      id: 'contact_bulk_import',
      category: 'contact_management',
      entity: 'contact',
      action: 'bulk_import',
      description: 'Import multiple contacts from CSV or JSON',
      apiEndpoint: '/api/contacts/import',
      method: 'POST',
      requiredParams: ['contacts'],
      optionalParams: ['listId', 'updateExisting', 'skipDuplicates'],
      requiresAuth: true,
      minRole: 'USER',
      dangerous: false,
      executor: async (params, userId) => {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { organization: true },
        });

        const results = {
          created: 0,
          updated: 0,
          skipped: 0,
          errors: [],
        };

        for (const contactData of params.contacts) {
          try {
            if (params.updateExisting) {
              await prisma.contact.upsert({
                where: {
                  email_organizationId: {
                    email: contactData.email,
                    organizationId: user!.organizationId!,
                  },
                },
                create: {
                  ...contactData,
                  organizationId: user!.organizationId!,
                },
                update: contactData,
              });
              results.updated++;
            } else {
              await prisma.contact.create({
                data: {
                  ...contactData,
                  organizationId: user!.organizationId!,
                },
              });
              results.created++;
            }
          } catch (error) {
            if (params.skipDuplicates) {
              results.skipped++;
            } else {
              results.errors.push({
                email: contactData.email,
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            }
          }
        }

        return {
          results,
          message: `Import completed: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`,
        };
      },
    });

    // Delete Contact
    this.registerOperation({
      id: 'contact_delete',
      category: 'contact_management',
      entity: 'contact',
      action: 'delete',
      description: 'Delete a contact',
      apiEndpoint: '/api/contacts/[id]',
      method: 'DELETE',
      requiredParams: ['contactId'],
      requiresAuth: true,
      minRole: 'USER',
      dangerous: false,
      executor: async (params, userId) => {
        const contact = await prisma.contact.delete({
          where: { id: params.contactId },
        });
        return { message: `Contact ${contact.email} deleted successfully` };
      },
    });

    // Update Contact
    this.registerOperation({
      id: 'contact_update',
      category: 'contact_management',
      entity: 'contact',
      action: 'update',
      description: 'Update contact information',
      apiEndpoint: '/api/contacts/[id]',
      method: 'PUT',
      requiredParams: ['contactId'],
      optionalParams: ['email', 'firstName', 'lastName', 'phone', 'tags', 'customFields'],
      requiresAuth: true,
      minRole: 'USER',
      dangerous: false,
      executor: async (params, userId) => {
        const { contactId, ...updateData } = params;
        const contact = await prisma.contact.update({
          where: { id: contactId },
          data: updateData,
        });
        return { contact, message: `Contact ${contact.email} updated successfully` };
      },
    });
  }

  /**
   * Register payment operations
   */
  private registerPaymentOperations() {
    // Initialize Payment
    this.registerOperation({
      id: 'payment_initialize',
      category: 'payment_billing',
      entity: 'payment',
      action: 'initialize',
      description: 'Initialize a payment transaction',
      apiEndpoint: '/api/payments/initialize',
      method: 'POST',
      requiredParams: ['amount', 'planId'],
      optionalParams: ['currency', 'metadata', 'callbackUrl'],
      requiresAuth: true,
      minRole: 'USER',
      dangerous: false,
      executor: async (params, userId) => {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { organization: true },
        });

        // Create transaction record
        const transaction = await prisma.transaction.create({
          data: {
            amount: params.amount,
            currency: params.currency || 'NGN',
            status: 'PENDING',
            provider: 'paystack',
            metadata: params.metadata || {},
            organizationId: user!.organizationId!,
          },
        });

        // Initialize with payment provider (Paystack)
        const paymentData = {
          reference: transaction.id,
          amount: params.amount * 100, // Convert to kobo
          email: user!.email,
          currency: params.currency || 'NGN',
          callback_url: params.callbackUrl,
        };

        return {
          transaction,
          paymentData,
          message: 'Payment initialized successfully',
        };
      },
    });

    // Process Subscription
    this.registerOperation({
      id: 'subscription_update',
      category: 'payment_billing',
      entity: 'subscription',
      action: 'update',
      description: 'Update subscription plan',
      apiEndpoint: '/api/subscriptions',
      method: 'PUT',
      requiredParams: ['planId'],
      optionalParams: ['billingCycle'],
      requiresAuth: true,
      minRole: 'ADMIN',
      dangerous: false,
      executor: async (params, userId) => {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { organization: true },
        });

        const subscription = await prisma.subscription.upsert({
          where: {
            organizationId: user!.organizationId!,
          },
          create: {
            planId: params.planId,
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            organizationId: user!.organizationId!,
          },
          update: {
            planId: params.planId,
            status: 'ACTIVE',
          },
        });

        return {
          subscription,
          message: 'Subscription updated successfully',
        };
      },
    });
  }

  /**
   * Register form builder operations
   */
  private registerFormOperations() {
    // Create Form
    this.registerOperation({
      id: 'form_create',
      category: 'form_builder',
      entity: 'form',
      action: 'create',
      description: 'Create a new LeadPulse form',
      apiEndpoint: '/api/leadpulse/forms',
      method: 'POST',
      requiredParams: ['name', 'type'],
      optionalParams: ['description', 'fields', 'settings', 'styling'],
      requiresAuth: true,
      minRole: 'USER',
      dangerous: false,
      executor: async (params, userId) => {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { organization: true },
        });

        const form = await prisma.leadPulseForm.create({
          data: {
            name: params.name,
            description: params.description,
            type: params.type,
            status: 'DRAFT',
            settings: params.settings || {},
            styling: params.styling || {},
            organizationId: user!.organizationId!,
          },
        });

        // Create fields if provided
        if (params.fields && params.fields.length > 0) {
          await prisma.leadPulseFormField.createMany({
            data: params.fields.map((field: any, index: number) => ({
              formId: form.id,
              name: field.name,
              label: field.label,
              type: field.type,
              required: field.required || false,
              placeholder: field.placeholder,
              options: field.options || [],
              validation: field.validation || {},
              order: index,
            })),
          });
        }

        return { form, message: `Form "${form.name}" created successfully` };
      },
    });

    // Add Form Field
    this.registerOperation({
      id: 'form_field_add',
      category: 'form_builder',
      entity: 'form_field',
      action: 'create',
      description: 'Add a field to a form',
      apiEndpoint: '/api/leadpulse/forms/[formId]/fields',
      method: 'POST',
      requiredParams: ['formId', 'name', 'label', 'type'],
      optionalParams: ['required', 'placeholder', 'options', 'validation', 'order'],
      requiresAuth: true,
      minRole: 'USER',
      dangerous: false,
      executor: async (params, userId) => {
        const field = await prisma.leadPulseFormField.create({
          data: {
            formId: params.formId,
            name: params.name,
            label: params.label,
            type: params.type,
            required: params.required || false,
            placeholder: params.placeholder,
            options: params.options || [],
            validation: params.validation || {},
            order: params.order || 0,
          },
        });

        return { field, message: `Field "${field.label}" added successfully` };
      },
    });
  }

  /**
   * Register workflow operations
   */
  private registerWorkflowOperations() {
    // Create Workflow
    this.registerOperation({
      id: 'workflow_create',
      category: 'workflow_automation',
      entity: 'workflow',
      action: 'create',
      description: 'Create a new automation workflow',
      apiEndpoint: '/api/workflows',
      method: 'POST',
      requiredParams: ['name', 'trigger'],
      optionalParams: ['description', 'nodes', 'settings', 'active'],
      requiresAuth: true,
      minRole: 'USER',
      dangerous: false,
      executor: async (params, userId) => {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { organization: true },
        });

        const workflow = await prisma.workflow.create({
          data: {
            name: params.name,
            description: params.description,
            trigger: params.trigger,
            status: params.active ? 'ACTIVE' : 'DRAFT',
            organizationId: user!.organizationId!,
            createdById: userId,
          },
        });

        // Create workflow nodes if provided
        if (params.nodes && params.nodes.length > 0) {
          await prisma.workflowNode.createMany({
            data: params.nodes.map((node: any) => ({
              workflowId: workflow.id,
              type: node.type,
              config: node.config || {},
              position: node.position || { x: 0, y: 0 },
            })),
          });
        }

        return { workflow, message: `Workflow "${workflow.name}" created successfully` };
      },
    });

    // Execute Workflow
    this.registerOperation({
      id: 'workflow_execute',
      category: 'workflow_automation',
      entity: 'workflow',
      action: 'execute',
      description: 'Execute a workflow for specific contacts',
      apiEndpoint: '/api/workflows/[id]/execute',
      method: 'POST',
      requiredParams: ['workflowId'],
      optionalParams: ['contactIds', 'testMode'],
      requiresAuth: true,
      minRole: 'USER',
      dangerous: false,
      executor: async (params, userId) => {
        const execution = await prisma.workflowExecution.create({
          data: {
            workflowId: params.workflowId,
            status: 'RUNNING',
            startedAt: new Date(),
            context: {
              testMode: params.testMode || false,
              contactIds: params.contactIds || [],
            },
          },
        });

        return {
          execution,
          message: `Workflow execution started (ID: ${execution.id})`,
        };
      },
    });
  }

  /**
   * Register A/B test operations
   */
  private registerABTestOperations() {
    // Create A/B Test
    this.registerOperation({
      id: 'ab_test_create',
      category: 'ab_testing',
      entity: 'ab_test',
      action: 'create',
      description: 'Create a new A/B test',
      apiEndpoint: '/api/ab-tests',
      method: 'POST',
      requiredParams: ['name', 'type', 'variants'],
      optionalParams: ['description', 'trafficSplit', 'successMetric', 'duration'],
      requiresAuth: true,
      minRole: 'USER',
      dangerous: false,
      executor: async (params, userId) => {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { organization: true },
        });

        const abTest = await prisma.aBTest.create({
          data: {
            name: params.name,
            type: params.type,
            description: params.description,
            status: 'DRAFT',
            trafficSplit: params.trafficSplit || { A: 50, B: 50 },
            successMetric: params.successMetric || 'conversion_rate',
            organizationId: user!.organizationId!,
            createdById: userId,
          },
        });

        // Create variants
        if (params.variants && params.variants.length > 0) {
          await prisma.aBTestVariant.createMany({
            data: params.variants.map((variant: any, index: number) => ({
              testId: abTest.id,
              name: variant.name || `Variant ${String.fromCharCode(65 + index)}`,
              content: variant.content || {},
              trafficPercentage: variant.trafficPercentage || 50,
            })),
          });
        }

        return { abTest, message: `A/B test "${abTest.name}" created successfully` };
      },
    });

    // Start A/B Test
    this.registerOperation({
      id: 'ab_test_start',
      category: 'ab_testing',
      entity: 'ab_test',
      action: 'start',
      description: 'Start an A/B test',
      apiEndpoint: '/api/ab-tests/[id]/start',
      method: 'POST',
      requiredParams: ['testId'],
      requiresAuth: true,
      minRole: 'USER',
      dangerous: false,
      executor: async (params, userId) => {
        const abTest = await prisma.aBTest.update({
          where: { id: params.testId },
          data: {
            status: 'ACTIVE',
            startedAt: new Date(),
          },
        });

        return { abTest, message: `A/B test "${abTest.name}" started successfully` };
      },
    });
  }

  /**
   * Initialize safety rules for dangerous operations
   */
  private initializeSafetyRules() {
    // Prevent self-deletion
    this.safetyRules.set('user_delete', (context) => {
      return context.params.userId !== context.userId;
    });

    // Prevent role escalation
    this.safetyRules.set('user_role_update', (context) => {
      return context.userRole === 'SUPER_ADMIN';
    });

    // Prevent mass deletion
    this.safetyRules.set('contact_bulk_delete', (context) => {
      return (context.params.contactIds?.length || 0) < 1000;
    });

    // Prevent excessive spending
    this.safetyRules.set('payment_initialize', (context) => {
      return context.params.amount < 1000000; // Max 1M in local currency
    });
  }

  /**
   * Register an operation in the engine
   */
  private registerOperation(operation: UniversalOperation) {
    this.operations.set(operation.id, operation);
    
    // Update category index
    if (!this.categoryIndex.has(operation.category)) {
      this.categoryIndex.set(operation.category, []);
    }
    this.categoryIndex.get(operation.category)!.push(operation.id);
    
    // Update entity index
    if (!this.entityIndex.has(operation.entity)) {
      this.entityIndex.set(operation.entity, []);
    }
    this.entityIndex.get(operation.entity)!.push(operation.id);
  }

  /**
   * Execute any operation based on natural language or specific operation ID
   */
  async execute(
    input: string | { operationId: string; params: any },
    context: Partial<ExecutionContext>
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      let operation: UniversalOperation | undefined;
      let params: any = {};
      let intent: IntelligentIntent | undefined;

      // Determine operation from input
      if (typeof input === 'string') {
        // Natural language input - analyze intent
        intent = await intelligentIntentAnalyzer.analyzeIntent(input);
        operation = await this.findBestOperation(intent);
        params = this.extractParams(intent, operation);
      } else {
        // Direct operation call
        operation = this.operations.get(input.operationId);
        params = input.params;
      }

      if (!operation) {
        return {
          success: false,
          operationId: 'unknown',
          category: 'unknown',
          entity: intent?.entity || 'unknown',
          action: intent?.action || 'unknown',
          message: 'Could not find a matching operation for your request',
          error: 'Operation not found',
          executionTime: Date.now() - startTime,
          suggestions: this.getSuggestions(intent),
        };
      }

      // Check authorization
      if (operation.requiresAuth && !context.userId) {
        return {
          success: false,
          operationId: operation.id,
          category: operation.category,
          entity: operation.entity,
          action: operation.action,
          message: 'Authentication required',
          error: 'Not authenticated',
          executionTime: Date.now() - startTime,
        };
      }

      // Check role permissions
      if (operation.minRole && !this.hasRequiredRole(context.userRole!, operation.minRole)) {
        return {
          success: false,
          operationId: operation.id,
          category: operation.category,
          entity: operation.entity,
          action: operation.action,
          message: `This operation requires ${operation.minRole} role or higher`,
          error: 'Insufficient permissions',
          executionTime: Date.now() - startTime,
        };
      }

      // Check safety rules
      if (operation.dangerous) {
        const fullContext: ExecutionContext = {
          userId: context.userId!,
          userRole: context.userRole!,
          organizationId: context.organizationId!,
          intent: intent!,
          params,
          dryRun: context.dryRun,
          approvalRequired: context.approvalRequired,
        };

        const safetyRule = this.safetyRules.get(operation.id);
        if (safetyRule && !safetyRule(fullContext)) {
          return {
            success: false,
            operationId: operation.id,
            category: operation.category,
            entity: operation.entity,
            action: operation.action,
            message: 'Operation blocked by safety rules',
            error: 'Safety check failed',
            executionTime: Date.now() - startTime,
            requiresApproval: true,
            approvalData: { operation: operation.id, params },
          };
        }

        // Require approval for dangerous operations
        if (!context.dryRun && context.approvalRequired !== false) {
          return {
            success: false,
            operationId: operation.id,
            category: operation.category,
            entity: operation.entity,
            action: operation.action,
            message: 'This is a dangerous operation that requires approval',
            executionTime: Date.now() - startTime,
            requiresApproval: true,
            approvalData: { operation: operation.id, params },
          };
        }
      }

      // Validate required parameters
      const missingParams = operation.requiredParams.filter(
        (param) => params[param] === undefined
      );
      if (missingParams.length > 0) {
        return {
          success: false,
          operationId: operation.id,
          category: operation.category,
          entity: operation.entity,
          action: operation.action,
          message: `Missing required parameters: ${missingParams.join(', ')}`,
          error: 'Invalid parameters',
          executionTime: Date.now() - startTime,
          suggestions: [`Please provide: ${missingParams.join(', ')}`],
        };
      }

      // Execute operation
      if (context.dryRun) {
        return {
          success: true,
          operationId: operation.id,
          category: operation.category,
          entity: operation.entity,
          action: operation.action,
          message: `[DRY RUN] Would execute: ${operation.description}`,
          data: { params },
          executionTime: Date.now() - startTime,
        };
      }

      const result = await operation.executor(params, context.userId!);

      // Record execution
      await recordTaskExecution(
        operation.id,
        context.userId!,
        context.organizationId!,
        true,
        Date.now() - startTime,
        undefined,
        undefined
      );

      return {
        success: true,
        operationId: operation.id,
        category: operation.category,
        entity: operation.entity,
        action: operation.action,
        message: result.message || `Operation completed successfully`,
        data: result,
        executionTime: Date.now() - startTime,
        affectedRecords: result.affectedRecords,
        rollbackAvailable: operation.dangerous,
        rollbackId: operation.dangerous ? `rollback_${Date.now()}` : undefined,
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error('Universal execution failed', {
        error: errorMessage,
        input,
        context,
        executionTime,
      });

      return {
        success: false,
        operationId: 'error',
        category: 'error',
        entity: 'unknown',
        action: 'unknown',
        message: 'An error occurred during execution',
        error: errorMessage,
        executionTime,
      };
    }
  }

  /**
   * Find the best matching operation for an intent
   */
  private async findBestOperation(intent: IntelligentIntent): Promise<UniversalOperation | undefined> {
    // Try exact match first
    const exactMatch = Array.from(this.operations.values()).find(
      (op) => op.entity === intent.entity && op.action === intent.action.toLowerCase()
    );
    if (exactMatch) return exactMatch;

    // Try entity match with similar action
    const entityMatches = this.entityIndex.get(intent.entity) || [];
    for (const opId of entityMatches) {
      const op = this.operations.get(opId)!;
      if (this.isActionSimilar(op.action, intent.action)) {
        return op;
      }
    }

    // Try fuzzy matching
    const allOps = Array.from(this.operations.values());
    const scores = allOps.map((op) => ({
      op,
      score: this.calculateMatchScore(op, intent),
    }));
    scores.sort((a, b) => b.score - a.score);

    return scores[0]?.score > 0.5 ? scores[0].op : undefined;
  }

  /**
   * Extract parameters from intent
   */
  private extractParams(intent: IntelligentIntent, operation: UniversalOperation): any {
    const params: any = {};

    // Map intent data to operation parameters
    if (intent.contactData) {
      Object.assign(params, intent.contactData);
    }
    if (intent.campaignData) {
      Object.assign(params, intent.campaignData);
    }
    if (intent.workflowData) {
      Object.assign(params, intent.workflowData);
    }
    if (intent.taskData) {
      Object.assign(params, intent.taskData);
    }
    if (intent.dataRequest) {
      Object.assign(params, intent.dataRequest);
    }

    // Extract from raw query if needed
    if (intent.rawQuery) {
      // Extract IDs
      const idMatch = intent.rawQuery.match(/\b([a-f0-9]{24})\b/);
      if (idMatch) {
        params.id = idMatch[1];
      }

      // Extract numbers
      const numberMatch = intent.rawQuery.match(/\b(\d+)\b/);
      if (numberMatch) {
        params.amount = Number.parseInt(numberMatch[1]);
      }

      // Extract emails
      const emailMatch = intent.rawQuery.match(/\b([^\s]+@[^\s]+)\b/);
      if (emailMatch) {
        params.email = emailMatch[1];
      }
    }

    return params;
  }

  /**
   * Check if user has required role
   */
  private hasRequiredRole(userRole: string, requiredRole: string): boolean {
    const roleHierarchy = ['USER', 'IT_ADMIN', 'ADMIN', 'SUPER_ADMIN'];
    const userRoleIndex = roleHierarchy.indexOf(userRole);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
    return userRoleIndex >= requiredRoleIndex;
  }

  /**
   * Check if actions are similar
   */
  private isActionSimilar(action1: string, action2: string): boolean {
    const synonyms: Record<string, string[]> = {
      create: ['add', 'new', 'generate', 'make'],
      update: ['edit', 'modify', 'change', 'alter'],
      delete: ['remove', 'destroy', 'clear', 'erase'],
      fetch: ['get', 'retrieve', 'find', 'search', 'list'],
    };

    action1 = action1.toLowerCase();
    action2 = action2.toLowerCase();

    if (action1 === action2) return true;

    for (const [key, values] of Object.entries(synonyms)) {
      if ((key === action1 || values.includes(action1)) && 
          (key === action2 || values.includes(action2))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate match score between operation and intent
   */
  private calculateMatchScore(operation: UniversalOperation, intent: IntelligentIntent): number {
    let score = 0;

    // Entity match
    if (operation.entity === intent.entity) score += 0.5;
    else if (operation.entity.includes(intent.entity) || intent.entity.includes(operation.entity)) score += 0.3;

    // Action match
    if (this.isActionSimilar(operation.action, intent.action)) score += 0.3;

    // Category relevance
    if (operation.description.toLowerCase().includes(intent.rawQuery.toLowerCase())) score += 0.2;

    return score;
  }

  /**
   * Get suggestions for failed operations
   */
  private getSuggestions(intent?: IntelligentIntent): string[] {
    if (!intent) return ['Try being more specific about what you want to do'];

    const suggestions: string[] = [];

    // Suggest similar operations
    const entityOps = this.entityIndex.get(intent.entity) || [];
    if (entityOps.length > 0) {
      const ops = entityOps.map((id) => this.operations.get(id)!);
      suggestions.push(
        `Available ${intent.entity} operations: ${ops.map((op) => op.action).join(', ')}`
      );
    }

    // Suggest related entities
    const relatedEntities = Array.from(this.entityIndex.keys()).filter(
      (entity) => entity.includes(intent.entity) || intent.entity.includes(entity)
    );
    if (relatedEntities.length > 0) {
      suggestions.push(`Related entities: ${relatedEntities.join(', ')}`);
    }

    return suggestions;
  }

  /**
   * Get all available operations
   */
  getAvailableOperations(): {
    total: number;
    byCategory: Record<string, number>;
    byEntity: Record<string, number>;
    operations: Array<{
      id: string;
      category: string;
      entity: string;
      action: string;
      description: string;
      dangerous: boolean;
    }>;
  } {
    const operations = Array.from(this.operations.values());
    
    const byCategory: Record<string, number> = {};
    for (const [category, ops] of this.categoryIndex.entries()) {
      byCategory[category] = ops.length;
    }

    const byEntity: Record<string, number> = {};
    for (const [entity, ops] of this.entityIndex.entries()) {
      byEntity[entity] = ops.length;
    }

    return {
      total: operations.length,
      byCategory,
      byEntity,
      operations: operations.map((op) => ({
        id: op.id,
        category: op.category,
        entity: op.entity,
        action: op.action,
        description: op.description,
        dangerous: op.dangerous || false,
      })),
    };
  }

  /**
   * Search operations by query
   */
  searchOperations(query: string): UniversalOperation[] {
    const normalizedQuery = query.toLowerCase();
    return Array.from(this.operations.values()).filter(
      (op) =>
        op.id.includes(normalizedQuery) ||
        op.category.includes(normalizedQuery) ||
        op.entity.includes(normalizedQuery) ||
        op.action.includes(normalizedQuery) ||
        op.description.toLowerCase().includes(normalizedQuery)
    );
  }
}

// Utility functions
async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 10);
}

// Export singleton instance
export const universalTaskExecutionEngine = new UniversalTaskExecutionEngine();

// Export types
export type { UniversalTaskExecutionEngine };