import { logger } from '@/lib/logger';
import { workflowRateLimiter } from '@/lib/rate-limiter';
import prisma from '@/lib/db/prisma';
import { v4 as uuidv4 } from 'uuid';

/**
 * API Integration Node Types for Workflow System
 * Provides external API integration capabilities including CRM, payment webhooks, and generic API calls
 */

export interface ApiConfiguration {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  authentication?: {
    type: 'none' | 'bearer' | 'api_key' | 'basic' | 'oauth2';
    credentials?: Record<string, string>;
  };
}

export interface CrmActionConfiguration extends ApiConfiguration {
  actionType: 'create_contact' | 'update_contact' | 'add_to_list' | 'remove_from_list' | 'add_tag' | 'remove_tag';
  provider: 'hubspot' | 'salesforce' | 'pipedrive' | 'zoho' | 'custom';
  fieldMapping?: Record<string, string>;
}

export interface PaymentWebhookConfiguration extends ApiConfiguration {
  provider: 'stripe' | 'paypal' | 'paystack' | 'flutterwave' | 'custom';
  webhookType: 'payment_success' | 'payment_failed' | 'subscription_created' | 'subscription_cancelled' | 'refund_processed';
  eventData?: Record<string, any>;
  secretKey?: string;
}

export interface GenericApiConfiguration extends ApiConfiguration {
  bodyTemplate?: string;
  responseMapping?: Record<string, string>;
  successCondition?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
    value: any;
  };
}

// Rate limiter for external API calls
const apiRateLimiter = workflowRateLimiter; // Reuse workflow rate limiter

/**
 * Execute generic API call node
 */
export async function executeGenericApiCall(
  config: GenericApiConfiguration,
  context: any
): Promise<any> {
  const { url, method, headers = {}, timeout = 30000, retryCount = 3, retryDelay = 1000 } = config;

  // Validate URL
  if (!url || !isValidUrl(url)) {
    throw new Error('Invalid API URL provided');
  }

  // Security check - only allow HTTPS URLs
  if (!url.startsWith('https://') && !url.startsWith('http://localhost')) {
    throw new Error('Only HTTPS URLs are allowed for external API calls');
  }

  // Check rate limits
  const rateLimitResult = await apiRateLimiter.check(`api_${context.contact?.id || 'system'}`);
  if (!rateLimitResult.allowed) {
    throw new Error(`API rate limit exceeded: ${rateLimitResult.error}`);
  }

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < retryCount) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Prepare request body
      let body: string | undefined;
      if (method !== 'GET' && config.bodyTemplate) {
        body = replaceVariables(config.bodyTemplate, context);
      }

      // Add authentication headers
      const authHeaders = getAuthenticationHeaders(config.authentication);
      const requestHeaders = {
        'Content-Type': 'application/json',
        'User-Agent': 'MarketSage-Workflow/1.0',
        ...authHeaders,
        ...headers,
      };

      logger.info(`Making API call`, {
        method,
        url: url.substring(0, 100),
        attempt: attempt + 1,
        contactId: context.contact?.id
      });

      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseData = await response.json().catch(() => ({}));

      // Check if request was successful
      const isSuccess = response.ok || evaluateSuccessCondition(responseData, config.successCondition);

      if (!isSuccess) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      // Map response data if mapping is provided
      const mappedData = config.responseMapping 
        ? mapResponseData(responseData, config.responseMapping)
        : responseData;

      return {
        success: true,
        status: response.status,
        statusText: response.statusText,
        data: mappedData,
        rawResponse: responseData,
        executedAt: new Date().toISOString(),
        attempt: attempt + 1,
      };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      attempt++;

      if (attempt < retryCount) {
        logger.warn(`API call failed, retrying in ${retryDelay}ms`, {
          error: lastError.message,
          attempt,
          url: url.substring(0, 50)
        });
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  // All attempts failed
  logger.error(`API call failed after ${retryCount} attempts`, {
    error: lastError?.message,
    url: url.substring(0, 50)
  });

  return {
    success: false,
    error: lastError?.message || 'Unknown error',
    executedAt: new Date().toISOString(),
    totalAttempts: retryCount,
  };
}

/**
 * Execute CRM action node
 */
export async function executeCrmAction(
  config: CrmActionConfiguration,
  context: any
): Promise<any> {
  const { actionType, provider, fieldMapping = {} } = config;

  logger.info(`Executing CRM action`, {
    actionType,
    provider,
    contactId: context.contact?.id
  });

  // Prepare CRM-specific payload
  const crmPayload = prepareCrmPayload(actionType, provider, context, fieldMapping);

  // Get provider-specific configuration
  const providerConfig = getCrmProviderConfig(provider, actionType);

  // Execute the API call
  const result = await executeGenericApiCall({
    ...config,
    ...providerConfig,
    bodyTemplate: JSON.stringify(crmPayload),
  }, context);

  // Handle CRM-specific response processing
  if (result.success) {
    await handleCrmSuccess(actionType, provider, result.data, context);
  }

  return {
    ...result,
    actionType,
    provider,
    crmPayload,
  };
}

/**
 * Execute payment webhook node
 */
export async function executePaymentWebhook(
  config: PaymentWebhookConfiguration,
  context: any
): Promise<any> {
  const { provider, webhookType, eventData = {} } = config;

  logger.info(`Executing payment webhook`, {
    provider,
    webhookType,
    contactId: context.contact?.id
  });

  // Prepare payment webhook payload
  const webhookPayload = preparePaymentWebhookPayload(provider, webhookType, eventData, context);

  // Get provider-specific webhook configuration
  const providerConfig = getPaymentProviderConfig(provider, webhookType);

  // Execute the webhook call
  const result = await executeGenericApiCall({
    ...config,
    ...providerConfig,
    bodyTemplate: JSON.stringify(webhookPayload),
  }, context);

  // Handle payment-specific response processing
  if (result.success) {
    await handlePaymentWebhookSuccess(provider, webhookType, result.data, context);
  }

  return {
    ...result,
    provider,
    webhookType,
    webhookPayload,
  };
}

/**
 * Helper functions
 */

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function replaceVariables(template: string, context: any): string {
  return template
    .replace(/\{\{contact\.([^}]+)\}\}/g, (match, field) => {
      return context.contact?.[field] || '';
    })
    .replace(/\{\{workflow\.([^}]+)\}\}/g, (match, field) => {
      return context.workflow?.[field] || '';
    })
    .replace(/\{\{variables\.([^}]+)\}\}/g, (match, field) => {
      return context.variables?.[field] || '';
    })
    .replace(/\{\{timestamp\}\}/g, new Date().toISOString())
    .replace(/\{\{uuid\}\}/g, uuidv4());
}

function getAuthenticationHeaders(auth?: ApiConfiguration['authentication']): Record<string, string> {
  if (!auth || auth.type === 'none') {
    return {};
  }

  const { type, credentials = {} } = auth;

  switch (type) {
    case 'bearer':
      return { Authorization: `Bearer ${credentials.token}` };
    case 'api_key':
      return { [credentials.headerName || 'X-API-Key']: credentials.apiKey };
    case 'basic':
      const encoded = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
      return { Authorization: `Basic ${encoded}` };
    case 'oauth2':
      return { Authorization: `Bearer ${credentials.accessToken}` };
    default:
      return {};
  }
}

function evaluateSuccessCondition(data: any, condition?: GenericApiConfiguration['successCondition']): boolean {
  if (!condition) return true;

  const { field, operator, value } = condition;
  const fieldValue = getNestedValue(data, field);

  switch (operator) {
    case 'equals':
      return fieldValue === value;
    case 'not_equals':
      return fieldValue !== value;
    case 'contains':
      return String(fieldValue).includes(String(value));
    case 'not_contains':
      return !String(fieldValue).includes(String(value));
    case 'greater_than':
      return Number(fieldValue) > Number(value);
    case 'less_than':
      return Number(fieldValue) < Number(value);
    default:
      return true;
  }
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function mapResponseData(data: any, mapping: Record<string, string>): any {
  const mapped: any = {};
  
  for (const [targetField, sourcePath] of Object.entries(mapping)) {
    mapped[targetField] = getNestedValue(data, sourcePath);
  }
  
  return mapped;
}

function prepareCrmPayload(actionType: string, provider: string, context: any, fieldMapping: Record<string, string>): any {
  const contact = context.contact || {};
  
  const basePayload = {
    email: contact.email,
    firstName: contact.firstName,
    lastName: contact.lastName,
    company: contact.company,
    phone: contact.phone,
    timestamp: new Date().toISOString(),
  };

  // Apply field mapping
  const mappedPayload: any = {};
  for (const [crmField, contactField] of Object.entries(fieldMapping)) {
    mappedPayload[crmField] = contact[contactField] || basePayload[contactField as keyof typeof basePayload];
  }

  // Provider-specific payload adjustments
  switch (provider) {
    case 'hubspot':
      return {
        properties: mappedPayload,
        // HubSpot-specific fields
      };
    case 'salesforce':
      return {
        ...mappedPayload,
        // Salesforce-specific fields
      };
    case 'pipedrive':
      return {
        ...mappedPayload,
        // Pipedrive-specific fields
      };
    default:
      return { ...basePayload, ...mappedPayload };
  }
}

function getCrmProviderConfig(provider: string, actionType: string): Partial<ApiConfiguration> {
  // This would typically come from environment variables or database configuration
  const configs: Record<string, Record<string, Partial<ApiConfiguration>>> = {
    hubspot: {
      create_contact: {
        method: 'POST',
        url: 'https://api.hubapi.com/crm/v3/objects/contacts',
        headers: { 'Content-Type': 'application/json' },
      },
      update_contact: {
        method: 'PATCH',
        url: 'https://api.hubapi.com/crm/v3/objects/contacts/{{contact.id}}',
        headers: { 'Content-Type': 'application/json' },
      },
    },
    salesforce: {
      create_contact: {
        method: 'POST',
        url: 'https://{{instance}}.salesforce.com/services/data/v59.0/sobjects/Contact/',
        headers: { 'Content-Type': 'application/json' },
      },
    },
    // Add more providers as needed
  };

  return configs[provider]?.[actionType] || {};
}

function preparePaymentWebhookPayload(provider: string, webhookType: string, eventData: any, context: any): any {
  const basePayload = {
    event_type: webhookType,
    timestamp: new Date().toISOString(),
    contact: {
      id: context.contact?.id,
      email: context.contact?.email,
    },
    workflow: {
      id: context.workflow?.id,
      name: context.workflow?.name,
    },
    ...eventData,
  };

  // Provider-specific payload adjustments
  switch (provider) {
    case 'stripe':
      return {
        type: webhookType,
        data: {
          object: basePayload,
        },
        created: Math.floor(Date.now() / 1000),
      };
    case 'paypal':
      return {
        event_type: webhookType.toUpperCase(),
        resource: basePayload,
      };
    case 'paystack':
      return {
        event: webhookType,
        data: basePayload,
      };
    case 'flutterwave':
      return {
        event: webhookType,
        data: basePayload,
      };
    default:
      return basePayload;
  }
}

function getPaymentProviderConfig(provider: string, webhookType: string): Partial<ApiConfiguration> {
  // This would typically come from environment variables or database configuration
  const configs: Record<string, Partial<ApiConfiguration>> = {
    stripe: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    paypal: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    paystack: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    flutterwave: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
  };

  return configs[provider] || {};
}

async function handleCrmSuccess(actionType: string, provider: string, data: any, context: any): Promise<void> {
  // Log CRM action success
  logger.info(`CRM action completed successfully`, {
    actionType,
    provider,
    contactId: context.contact?.id,
    responseData: data,
  });

  // Update contact record if necessary
  if (actionType === 'create_contact' && data.id) {
    try {
      await prisma.contact.update({
        where: { id: context.contact.id },
        data: {
          externalIds: {
            ...(context.contact.externalIds || {}),
            [provider]: data.id,
          },
        },
      });
    } catch (error) {
      logger.warn(`Failed to update contact with external ID`, { error, provider, contactId: context.contact.id });
    }
  }
}

async function handlePaymentWebhookSuccess(provider: string, webhookType: string, data: any, context: any): Promise<void> {
  // Log payment webhook success
  logger.info(`Payment webhook completed successfully`, {
    provider,
    webhookType,
    contactId: context.contact?.id,
    responseData: data,
  });

  // Create payment activity record
  try {
    await prisma.emailActivity.create({
      data: {
        id: `payment-${provider}-${Date.now()}`,
        contactId: context.contact.id,
        campaignId: `workflow-${context.workflow.id}`,
        type: 'PAYMENT_WEBHOOK',
        metadata: JSON.stringify({
          provider,
          webhookType,
          workflowId: context.workflow.id,
          responseData: data,
        }),
      },
    });
  } catch (error) {
    logger.warn(`Failed to create payment activity record`, { error, provider, webhookType });
  }
}

/**
 * Validation functions
 */

export function validateApiConfiguration(config: ApiConfiguration): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.url) {
    errors.push('URL is required');
  } else if (!isValidUrl(config.url)) {
    errors.push('Invalid URL format');
  } else if (!config.url.startsWith('https://') && !config.url.startsWith('http://localhost')) {
    errors.push('Only HTTPS URLs are allowed');
  }

  if (!config.method) {
    errors.push('HTTP method is required');
  } else if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method)) {
    errors.push('Invalid HTTP method');
  }

  if (config.timeout && (config.timeout < 1000 || config.timeout > 60000)) {
    errors.push('Timeout must be between 1000ms and 60000ms');
  }

  if (config.retryCount && (config.retryCount < 0 || config.retryCount > 10)) {
    errors.push('Retry count must be between 0 and 10');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateCrmConfiguration(config: CrmActionConfiguration): { isValid: boolean; errors: string[] } {
  const baseValidation = validateApiConfiguration(config);
  const errors = [...baseValidation.errors];

  if (!config.actionType) {
    errors.push('CRM action type is required');
  } else if (!['create_contact', 'update_contact', 'add_to_list', 'remove_from_list', 'add_tag', 'remove_tag'].includes(config.actionType)) {
    errors.push('Invalid CRM action type');
  }

  if (!config.provider) {
    errors.push('CRM provider is required');
  } else if (!['hubspot', 'salesforce', 'pipedrive', 'zoho', 'custom'].includes(config.provider)) {
    errors.push('Invalid CRM provider');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validatePaymentWebhookConfiguration(config: PaymentWebhookConfiguration): { isValid: boolean; errors: string[] } {
  const baseValidation = validateApiConfiguration(config);
  const errors = [...baseValidation.errors];

  if (!config.provider) {
    errors.push('Payment provider is required');
  } else if (!['stripe', 'paypal', 'paystack', 'flutterwave', 'custom'].includes(config.provider)) {
    errors.push('Invalid payment provider');
  }

  if (!config.webhookType) {
    errors.push('Webhook type is required');
  } else if (!['payment_success', 'payment_failed', 'subscription_created', 'subscription_cancelled', 'refund_processed'].includes(config.webhookType)) {
    errors.push('Invalid webhook type');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}