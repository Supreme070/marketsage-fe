import { 
  executeGenericApiCall,
  executeCrmAction,
  executePaymentWebhook,
  validateApiConfiguration,
  validateCrmConfiguration,
  validatePaymentWebhookConfiguration,
  type GenericApiConfiguration,
  type CrmActionConfiguration,
  type PaymentWebhookConfiguration
} from '../src/lib/workflow/api-integration-nodes';

// Mock fetch globally
global.fetch = jest.fn();

// Mock prisma
jest.mock('../src/lib/db/prisma', () => ({
  contact: {
    update: jest.fn(),
  },
  emailActivity: {
    create: jest.fn(),
  },
}));

// Mock rate limiter
jest.mock('../src/lib/rate-limiter', () => ({
  workflowRateLimiter: {
    check: jest.fn().mockResolvedValue({ allowed: true, remaining: 100 }),
  },
}));

describe('API Integration Nodes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('executeGenericApiCall', () => {
    it('should execute a successful GET request', async () => {
      const mockResponse = { success: true, data: { id: 1, name: 'Test' } };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve(mockResponse),
      });

      const config: GenericApiConfiguration = {
        url: 'https://api.example.com/test',
        method: 'GET',
        timeout: 5000,
      };

      const context = {
        contact: { id: 'contact-1', email: 'test@example.com' },
        workflow: { id: 'workflow-1', name: 'Test Workflow' },
        variables: {},
      };

      const result = await executeGenericApiCall(config, context);

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle API call failures with retry', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve({ success: true }),
        });

      const config: GenericApiConfiguration = {
        url: 'https://api.example.com/test',
        method: 'POST',
        retryCount: 3,
        retryDelay: 100,
      };

      const context = {
        contact: { id: 'contact-1', email: 'test@example.com' },
        workflow: { id: 'workflow-1', name: 'Test Workflow' },
        variables: {},
      };

      const result = await executeGenericApiCall(config, context);

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should reject non-HTTPS URLs', async () => {
      const config: GenericApiConfiguration = {
        url: 'http://api.example.com/test',
        method: 'GET',
      };

      const context = {
        contact: { id: 'contact-1' },
        workflow: { id: 'workflow-1' },
        variables: {},
      };

      await expect(executeGenericApiCall(config, context)).rejects.toThrow(
        'Only HTTPS URLs are allowed'
      );
    });
  });

  describe('executeCrmAction', () => {
    it('should execute a CRM create contact action', async () => {
      const mockResponse = { id: 'crm-contact-123', properties: { email: 'test@example.com' } };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 201,
        statusText: 'Created',
        json: () => Promise.resolve(mockResponse),
      });

      const config: CrmActionConfiguration = {
        url: 'https://api.hubapi.com/crm/v3/objects/contacts',
        method: 'POST',
        actionType: 'create_contact',
        provider: 'hubspot',
        fieldMapping: {
          email: 'contact.email',
          firstname: 'contact.firstName',
        },
        authentication: {
          type: 'bearer',
          credentials: { token: 'test-token' },
        },
      };

      const context = {
        contact: { 
          id: 'contact-1', 
          email: 'test@example.com', 
          firstName: 'John',
          lastName: 'Doe'
        },
        workflow: { id: 'workflow-1', name: 'Test Workflow' },
        variables: {},
      };

      const result = await executeCrmAction(config, context);

      expect(result.success).toBe(true);
      expect(result.actionType).toBe('create_contact');
      expect(result.provider).toBe('hubspot');
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('executePaymentWebhook', () => {
    it('should execute a payment webhook', async () => {
      const mockResponse = { received: true, id: 'webhook-123' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve(mockResponse),
      });

      const config: PaymentWebhookConfiguration = {
        url: 'https://api.stripe.com/webhooks/payment',
        method: 'POST',
        provider: 'stripe',
        webhookType: 'payment_success',
        eventData: {
          amount: 1000,
          currency: 'USD',
        },
      };

      const context = {
        contact: { id: 'contact-1', email: 'test@example.com' },
        workflow: { id: 'workflow-1', name: 'Test Workflow' },
        variables: {},
      };

      const result = await executePaymentWebhook(config, context);

      expect(result.success).toBe(true);
      expect(result.provider).toBe('stripe');
      expect(result.webhookType).toBe('payment_success');
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('Validation Functions', () => {
    it('should validate API configuration correctly', () => {
      const validConfig: GenericApiConfiguration = {
        url: 'https://api.example.com/test',
        method: 'POST',
        timeout: 30000,
        retryCount: 3,
      };

      const result = validateApiConfiguration(validConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid API configuration', () => {
      const invalidConfig = {
        url: 'not-a-url',
        method: 'INVALID' as any,
        timeout: 100000, // Too high
        retryCount: 20, // Too high
      };

      const result = validateApiConfiguration(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate CRM configuration correctly', () => {
      const validConfig: CrmActionConfiguration = {
        url: 'https://api.hubapi.com/crm/v3/objects/contacts',
        method: 'POST',
        actionType: 'create_contact',
        provider: 'hubspot',
      };

      const result = validateCrmConfiguration(validConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate payment webhook configuration correctly', () => {
      const validConfig: PaymentWebhookConfiguration = {
        url: 'https://api.stripe.com/webhooks',
        method: 'POST',
        provider: 'stripe',
        webhookType: 'payment_success',
      };

      const result = validatePaymentWebhookConfiguration(validConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Variable Replacement', () => {
    it('should replace variables in templates correctly', async () => {
      const mockResponse = { success: true };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve(mockResponse),
      });

      const config: GenericApiConfiguration = {
        url: 'https://api.example.com/test',
        method: 'POST',
        bodyTemplate: '{"email": "{{contact.email}}", "name": "{{contact.firstName}} {{contact.lastName}}", "workflow": "{{workflow.name}}"}',
      };

      const context = {
        contact: { 
          id: 'contact-1', 
          email: 'john@example.com', 
          firstName: 'John',
          lastName: 'Doe'
        },
        workflow: { id: 'workflow-1', name: 'Welcome Flow' },
        variables: {},
      };

      await executeGenericApiCall(config, context);

      const expectedBody = '{"email": "john@example.com", "name": "John Doe", "workflow": "Welcome Flow"}';
      
      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          body: expectedBody,
        })
      );
    });
  });
});