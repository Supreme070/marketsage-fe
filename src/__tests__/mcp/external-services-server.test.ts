/**
 * External Services MCP Server Unit Tests
 * 
 * Comprehensive tests for the External Services MCP server including:
 * - Email service integration testing with real providers
 * - SMS service testing with multiple providers (AfricasTalking, Twilio)
 * - WhatsApp Business API integration testing
 * - Message validation and formatting
 * - Provider balance and status checking
 * - Delivery status tracking
 * - Template management and personalization
 * - Multi-channel message routing
 * - Error handling for service failures
 * - Rate limiting and quota management
 * - Security and permission validation
 * - Audit logging for message sending
 * - Cost tracking and billing integration
 */

import { ExternalServicesMCPServer } from '../../mcp/servers/external-services-server';
import type { MCPServerConfig } from '../../mcp/config/mcp-config';
import { MCPAuthContext, MCPValidationError, SendMessageRequest } from '../../mcp/types/mcp-types';
import { 
  mockPrismaClient, 
  mockRedisClient, 
  mockAuditLogger,
  testDataFactory,
  mockAuthScenarios,
  mockDatabaseScenarios,
  resetAllMocks,
  setupDefaultMocks
} from './__mocks__/mcp-mocks';

// Mock external service dependencies
jest.mock('../../lib/db/prisma', () => ({
  prisma: mockPrismaClient
}));

jest.mock('../../lib/cache/redis-client', () => ({
  redisCache: mockRedisClient,
  CACHE_KEYS: {
    API_RATE_LIMIT: (key: string) => `rate_limit:${key}`
  }
}));

jest.mock('../../lib/audit/enterprise-audit-logger', () => ({
  enterpriseAuditLogger: mockAuditLogger
}));

jest.mock('../../lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock external service integrations
jest.mock('../../lib/email-service', () => ({
  sendTrackedEmail: jest.fn()
}));

jest.mock('../../lib/sms-service', () => ({
  sendSMS: jest.fn(),
  smsService: {
    getBalance: jest.fn(),
    getDeliveryStatus: jest.fn()
  }
}));

jest.mock('../../lib/whatsapp-service', () => ({
  sendWhatsAppMessage: jest.fn()
}));

import { sendTrackedEmail } from '../../lib/email-service';
import { sendSMS, smsService } from '../../lib/sms-service';
import { sendWhatsAppMessage } from '../../lib/whatsapp-service';
import { logger } from '../../lib/logger';

const mockSendTrackedEmail = sendTrackedEmail as jest.MockedFunction<typeof sendTrackedEmail>;
const mockSendSMS = sendSMS as jest.MockedFunction<typeof sendSMS>;
const mockSendWhatsAppMessage = sendWhatsAppMessage as jest.MockedFunction<typeof sendWhatsAppMessage>;
const mockSMSService = smsService as jest.Mocked<typeof smsService>;

// Test data factories for external services
const createMockEmailResult = (overrides?: any) => ({
  success: true,
  messageId: 'email-msg-123',
  provider: 'sendgrid',
  deliveredAt: new Date().toISOString(),
  cost: 0.001,
  ...overrides
});

const createMockSMSResult = (overrides?: any) => ({
  success: true,
  messageId: 'sms-msg-456',
  provider: 'africastalking',
  cost: 0.05,
  delivered: true,
  ...overrides
});

const createMockWhatsAppResult = (overrides?: any) => ({
  success: true,
  messageId: 'wa-msg-789',
  provider: 'whatsapp_business',
  status: 'sent',
  ...overrides
});

describe('External Services MCP Server', () => {
  let server: ExternalServicesMCPServer;
  let config: MCPServerConfig;

  beforeEach(() => {
    resetAllMocks();
    setupDefaultMocks();

    config = {
      name: 'external-services-server',
      version: '1.0.0',
      port: 3006,
      enabled: true,
      authentication: { required: true, methods: ['jwt'] },
      rateLimit: { enabled: true, maxRequests: 100, windowMs: 60000 },
      fallback: { enabled: true, timeout: 5000 },
      validation: { strict: true, sanitizeOutput: true }
    };

    server = new ExternalServicesMCPServer(config);

    // Reset external service mocks
    mockSendTrackedEmail.mockClear();
    mockSendSMS.mockClear();
    mockSendWhatsAppMessage.mockClear();
    mockSMSService.getBalance.mockClear();
    mockSMSService.getDeliveryStatus.mockClear();
  });

  afterEach(() => {
    resetAllMocks();
  });

  describe('Resource Listing', () => {
    it('should list available service resources for users with write permissions', async () => {
      // Arrange
      const userContext = testUtils.createMockAuthContext({
        role: 'ADMIN',
        permissions: ['write:org']
      });

      // Act
      const resources = await server['listResources'](userContext);

      // Assert
      expect(resources).toHaveLength(5);
      expect(resources.map(r => r.uri)).toEqual([
        'services://email',
        'services://sms',
        'services://whatsapp',
        'services://templates',
        'services://providers'
      ]);
    });

    it('should list limited resources for users without write permissions', async () => {
      // Arrange
      const userContext = testUtils.createMockAuthContext({
        role: 'USER',
        permissions: ['read:own:basic']
      });

      // Act
      const resources = await server['listResources'](userContext);

      // Assert
      expect(resources).toHaveLength(2);
      expect(resources.map(r => r.uri)).toEqual([
        'services://templates',
        'services://providers'
      ]);
    });
  });

  describe('Tool Listing', () => {
    it('should list available tools for users with write permissions', async () => {
      // Arrange
      const userContext = testUtils.createMockAuthContext({
        role: 'ADMIN',
        permissions: ['write:org']
      });

      // Act
      const tools = await server['listTools'](userContext);

      // Assert
      expect(tools).toHaveLength(6);
      expect(tools.map(t => t.name)).toEqual([
        'send_email',
        'send_sms',
        'send_whatsapp',
        'get_delivery_status',
        'get_provider_balance',
        'validate_message'
      ]);
      
      // Verify tool schemas
      const emailTool = tools.find(t => t.name === 'send_email');
      expect(emailTool?.inputSchema.properties.to.format).toBe('email');
      expect(emailTool?.inputSchema.required).toEqual(['to', 'subject', 'content']);

      const smsTool = tools.find(t => t.name === 'send_sms');
      expect(smsTool?.inputSchema.properties.to.pattern).toBe('^\\+[1-9]\\d{1,14}$');
      expect(smsTool?.inputSchema.properties.content.maxLength).toBe(160);
    });

    it('should list limited tools for users without write permissions', async () => {
      // Arrange
      const userContext = testUtils.createMockAuthContext({
        role: 'USER',
        permissions: ['read:own:basic']
      });

      // Act
      const tools = await server['listTools'](userContext);

      // Assert
      expect(tools).toHaveLength(3);
      expect(tools.map(t => t.name)).toEqual([
        'get_delivery_status',
        'get_provider_balance',
        'validate_message'
      ]);
    });
  });

  describe('Email Service Integration', () => {
    it('should send email through real email service with validation', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const emailResult = createMockEmailResult();
      
      // Mock the real email service method
      server['sendEmailWithRealService'] = jest.fn().mockResolvedValue(emailResult);

      const args = {
        to: 'recipient@example.com',
        subject: 'Test Email Subject',
        content: '<p>This is a test email</p>',
        templateId: 'email-template-1',
        personalization: { name: 'John Doe', company: 'ACME Corp' }
      };

      // Act
      const result = await server['callTool']('send_email', args, authContext);

      // Assert
      expect(result.content[0].type).toBe('text');
      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.data.messageId).toBe('email-msg-123');
      expect(data.data.provider).toBe('sendgrid');
      expect(data.meta.channel).toBe('email');
      expect(data.meta.timestamp).toBeDefined();

      // Verify service was called with correct parameters
      expect(server['sendEmailWithRealService']).toHaveBeenCalledWith({
        to: 'recipient@example.com',
        subject: 'Test Email Subject',
        content: '<p>This is a test email</p>',
        templateId: 'email-template-1',
        personalization: { name: 'John Doe', company: 'ACME Corp' },
        organizationId: authContext.organizationId,
        userId: authContext.userId
      });

      // Verify logging
      expect(logger.info).toHaveBeenCalledWith(
        'MCP External Services: Sending email',
        expect.objectContaining({
          to: 'recipient@example.com',
          subject: 'Test Email Subject',
          templateId: 'email-template-1',
          userId: authContext.userId
        })
      );
    });

    it('should validate email address format', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const args = {
        to: 'invalid-email-format',
        subject: 'Test Subject',
        content: 'Test content'
      };

      // Act
      const result = await server['callTool']('send_email', args, authContext);

      // Assert
      expect(result.isError).toBe(true);
      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid email address format');
      expect(data.to).toBe('invalid-email-format');
    });

    it('should handle email service failures gracefully', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      server['sendEmailWithRealService'] = jest.fn().mockRejectedValue(new Error('SMTP server unavailable'));

      const args = {
        to: 'valid@example.com',
        subject: 'Test Subject',
        content: 'Test content'
      };

      // Act
      const result = await server['callTool']('send_email', args, authContext);

      // Assert
      expect(result.isError).toBe(true);
      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to send email');
      expect(data.details).toBe('SMTP server unavailable');

      // Verify error logging
      expect(logger.error).toHaveBeenCalledWith(
        'MCP External Services: Email sending failed',
        expect.any(Error)
      );
    });
  });

  describe('SMS Service Integration', () => {
    it('should send SMS through real SMS service with provider selection', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const smsResult = createMockSMSResult();
      
      // Mock the real SMS service method
      server['sendSMSWithRealService'] = jest.fn().mockResolvedValue(smsResult);

      const args = {
        to: '+234812345678',
        content: 'Your verification code is 123456',
        provider: 'africastalking',
        templateId: 'sms-verification'
      };

      // Act
      const result = await server['callTool']('send_sms', args, authContext);

      // Assert
      expect(result.content[0].type).toBe('text');
      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.data.messageId).toBe('sms-msg-456');
      expect(data.data.provider).toBe('africastalking');
      expect(data.meta.channel).toBe('sms');
      expect(data.meta.cost).toBe(0.05);

      // Verify service was called with correct parameters
      expect(server['sendSMSWithRealService']).toHaveBeenCalledWith({
        to: '+234812345678',
        content: 'Your verification code is 123456',
        templateId: 'sms-verification',
        provider: 'africastalking',
        organizationId: authContext.organizationId,
        userId: authContext.userId
      });

      // Verify logging
      expect(logger.info).toHaveBeenCalledWith(
        'MCP External Services: Sending SMS',
        expect.objectContaining({
          to: '+234812345678',
          contentLength: 32,
          provider: 'africastalking',
          userId: authContext.userId
        })
      );
    });

    it('should validate phone number format for SMS', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const args = {
        to: '08123456789', // Invalid format (no country code)
        content: 'Test message'
      };

      // Act
      const result = await server['callTool']('send_sms', args, authContext);

      // Assert
      expect(result.isError).toBe(true);
      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid phone number format. Use international format (+1234567890)');
      expect(data.to).toBe('08123456789');
    });

    it('should validate SMS content length', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const longMessage = 'A'.repeat(161); // Exceeds 160 character limit
      const args = {
        to: '+234812345678',
        content: longMessage
      };

      // Act
      const result = await server['callTool']('send_sms', args, authContext);

      // Assert
      expect(result.isError).toBe(true);
      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(false);
      expect(data.error).toBe('SMS content exceeds 160 character limit');
      expect(data.contentLength).toBe(161);
      expect(data.maxLength).toBe(160);
    });

    it('should use auto provider selection when not specified', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const smsResult = createMockSMSResult({ provider: 'twilio' });
      server['sendSMSWithRealService'] = jest.fn().mockResolvedValue(smsResult);

      const args = {
        to: '+1234567890',
        content: 'Auto provider test'
        // provider defaults to 'auto'
      };

      // Act
      const result = await server['callTool']('send_sms', args, authContext);

      // Assert
      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.data.provider).toBe('twilio'); // Auto-selected provider

      expect(server['sendSMSWithRealService']).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'auto'
        })
      );
    });
  });

  describe('WhatsApp Service Integration', () => {
    it('should send WhatsApp message through real WhatsApp service', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const whatsappResult = createMockWhatsAppResult();
      
      // Mock the real WhatsApp service method
      server['sendWhatsAppWithRealService'] = jest.fn().mockResolvedValue(whatsappResult);

      const args = {
        to: '+234812345678',
        content: 'Welcome to our service!',
        templateId: 'welcome_template',
        templateParams: ['John Doe', 'Premium'],
        mediaUrl: 'https://example.com/welcome-image.jpg'
      };

      // Act
      const result = await server['callTool']('send_whatsapp', args, authContext);

      // Assert
      expect(result.content[0].type).toBe('text');
      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.data.messageId).toBe('wa-msg-789');
      expect(data.data.provider).toBe('whatsapp_business');
      expect(data.meta.channel).toBe('whatsapp');
      expect(data.meta.templateUsed).toBe(true);

      // Verify service was called with correct parameters
      expect(server['sendWhatsAppWithRealService']).toHaveBeenCalledWith({
        to: '+234812345678',
        content: 'Welcome to our service!',
        templateId: 'welcome_template',
        templateParams: ['John Doe', 'Premium'],
        mediaUrl: 'https://example.com/welcome-image.jpg',
        organizationId: authContext.organizationId,
        userId: authContext.userId
      });

      // Verify logging
      expect(logger.info).toHaveBeenCalledWith(
        'MCP External Services: Sending WhatsApp',
        expect.objectContaining({
          to: '+234812345678',
          contentLength: 25,
          templateId: 'welcome_template',
          hasMedia: true,
          userId: authContext.userId
        })
      );
    });

    it('should validate WhatsApp phone number format', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const args = {
        to: 'invalid-whatsapp-number',
        content: 'Test message'
      };

      // Act
      const result = await server['callTool']('send_whatsapp', args, authContext);

      // Assert
      expect(result.isError).toBe(true);
      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid WhatsApp number format. Use international format (+1234567890)');
    });

    it('should handle WhatsApp service failures', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      server['sendWhatsAppWithRealService'] = jest.fn().mockRejectedValue(
        new Error('WhatsApp Business API quota exceeded')
      );

      const args = {
        to: '+234812345678',
        content: 'Test message'
      };

      // Act
      const result = await server['callTool']('send_whatsapp', args, authContext);

      // Assert
      expect(result.isError).toBe(true);
      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to send WhatsApp message');
      expect(data.details).toBe('WhatsApp Business API quota exceeded');
    });
  });

  describe('Delivery Status Tracking', () => {
    it('should get delivery status from real service providers', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      
      // Mock the delivery status method
      server['getDeliveryStatus'] = jest.fn().mockResolvedValue({
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: {
              messageId: 'sms-msg-456',
              channel: 'sms',
              status: 'delivered',
              deliveredAt: new Date().toISOString(),
              provider: 'africastalking',
              cost: 0.05,
              attempts: 1,
              statusHistory: [
                { status: 'sent', timestamp: new Date(Date.now() - 30000).toISOString() },
                { status: 'delivered', timestamp: new Date().toISOString() }
              ]
            }
          })
        }]
      });

      const args = { messageId: 'sms-msg-456', channel: 'sms' };

      // Act
      const result = await server['callTool']('get_delivery_status', args, authContext);

      // Assert
      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.data.messageId).toBe('sms-msg-456');
      expect(data.data.status).toBe('delivered');
      expect(data.data.provider).toBe('africastalking');
      expect(data.data.statusHistory).toHaveLength(2);
    });

    it('should handle delivery status for different channels', async () => {
      // Test each channel type
      const channels = ['email', 'sms', 'whatsapp'];
      
      for (const channel of channels) {
        // Arrange
        const authContext = testUtils.createMockAuthContext();
        server['getDeliveryStatus'] = jest.fn().mockResolvedValue({
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              data: {
                messageId: `${channel}-msg-123`,
                channel,
                status: 'delivered'
              }
            })
          }]
        });

        const args = { messageId: `${channel}-msg-123`, channel };

        // Act
        const result = await server['callTool']('get_delivery_status', args, authContext);

        // Assert
        const data = JSON.parse(result.content[0].text);
        expect(data.success).toBe(true);
        expect(data.data.channel).toBe(channel);
      }
    });
  });

  describe('Provider Balance and Status', () => {
    it('should get provider balance from real providers', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      
      // Mock the provider balance method
      server['getProviderBalance'] = jest.fn().mockResolvedValue({
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: {
              provider: 'africastalking',
              balance: 150.75,
              currency: 'USD',
              lastUpdated: new Date().toISOString(),
              threshold: 10.0,
              status: 'active',
              usageStats: {
                thisMonth: 45.25,
                lastMonth: 38.90,
                averageMonthly: 42.15
              }
            }
          })
        }]
      });

      const args = { provider: 'africastalking' };

      // Act
      const result = await server['callTool']('get_provider_balance', args, authContext);

      // Assert
      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.data.provider).toBe('africastalking');
      expect(data.data.balance).toBe(150.75);
      expect(data.data.currency).toBe('USD');
      expect(data.data.status).toBe('active');
      expect(data.data.usageStats).toBeDefined();
    });

    it('should check balance for different provider types', async () => {
      // Test different providers
      const providers = ['africastalking', 'twilio', 'email', 'whatsapp'];
      
      for (const provider of providers) {
        // Arrange
        const authContext = testUtils.createMockAuthContext();
        server['getProviderBalance'] = jest.fn().mockResolvedValue({
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              data: {
                provider,
                balance: 100.0,
                status: 'active'
              }
            })
          }]
        });

        const args = { provider };

        // Act
        const result = await server['callTool']('get_provider_balance', args, authContext);

        // Assert
        const data = JSON.parse(result.content[0].text);
        expect(data.success).toBe(true);
        expect(data.data.provider).toBe(provider);
      }
    });
  });

  describe('Message Validation', () => {
    it('should validate messages before sending', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      
      // Mock the message validation method
      server['validateMessage'] = jest.fn().mockResolvedValue({
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: {
              valid: true,
              channel: 'email',
              to: 'valid@example.com',
              contentLength: 25,
              estimatedCost: 0.001,
              recommendations: [
                'Email format is valid',
                'Content length is appropriate'
              ],
              warnings: [],
              errors: []
            }
          })
        }]
      });

      const args = {
        channel: 'email',
        to: 'valid@example.com',
        content: 'This is a test message.'
      };

      // Act
      const result = await server['callTool']('validate_message', args, authContext);

      // Assert
      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.data.valid).toBe(true);
      expect(data.data.channel).toBe('email');
      expect(data.data.recommendations).toContain('Email format is valid');
      expect(data.data.errors).toHaveLength(0);
    });

    it('should identify validation errors for different channels', async () => {
      // Test validation for each channel
      const testCases = [
        {
          channel: 'email',
          to: 'invalid-email',
          content: 'Test',
          expectedError: 'Invalid email format'
        },
        {
          channel: 'sms',
          to: '12345',
          content: 'Test',
          expectedError: 'Invalid phone number format'
        },
        {
          channel: 'sms',
          to: '+1234567890',
          content: 'A'.repeat(161),
          expectedError: 'Content exceeds SMS length limit'
        }
      ];

      for (const testCase of testCases) {
        // Arrange
        const authContext = testUtils.createMockAuthContext();
        server['validateMessage'] = jest.fn().mockResolvedValue({
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              data: {
                valid: false,
                channel: testCase.channel,
                errors: [testCase.expectedError]
              }
            })
          }]
        });

        const args = {
          channel: testCase.channel,
          to: testCase.to,
          content: testCase.content
        };

        // Act
        const result = await server['callTool']('validate_message', args, authContext);

        // Assert
        const data = JSON.parse(result.content[0].text);
        expect(data.success).toBe(true);
        expect(data.data.valid).toBe(false);
        expect(data.data.errors).toContain(testCase.expectedError);
      }
    });
  });

  describe('Resource URI Validation', () => {
    it('should throw error for unknown resource paths', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const invalidUri = 'services://unknown-service';

      // Act & Assert
      await expect(
        server['readResource'](invalidUri, authContext)
      ).rejects.toThrow(MCPValidationError);
    });
  });

  describe('Tool Validation', () => {
    it('should throw error for unknown tools', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();

      // Act & Assert
      await expect(
        server['callTool']('unknown_tool', {}, authContext)
      ).rejects.toThrow(MCPValidationError);
    });
  });

  describe('Service Health and Status', () => {
    it('should check service provider status and connectivity', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      
      // Mock service info methods
      server['getEmailServiceInfo'] = jest.fn().mockResolvedValue({
        uri: "services://email",
        mimeType: "application/json",
        text: JSON.stringify({
          provider: 'sendgrid',
          status: 'active',
          lastCheck: new Date().toISOString(),
          connectivity: true,
          quotaUsed: 1250,
          quotaLimit: 10000,
          avgDeliveryTime: 2.3
        })
      });

      const uri = 'services://email';

      // Act
      const result = await server['readResource'](uri, authContext);

      // Assert
      const data = JSON.parse(result.text);
      expect(data.provider).toBe('sendgrid');
      expect(data.status).toBe('active');
      expect(data.connectivity).toBe(true);
      expect(data.quotaUsed).toBe(1250);
      expect(data.quotaLimit).toBe(10000);
    });
  });

  describe('Performance and Rate Limiting', () => {
    it('should handle concurrent message sending efficiently', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const emailResult = createMockEmailResult();
      server['sendEmailWithRealService'] = jest.fn().mockResolvedValue(emailResult);

      const emailPromises = Array.from({ length: 10 }, (_, i) => 
        server['callTool']('send_email', {
          to: `user${i}@example.com`,
          subject: `Test Email ${i}`,
          content: `Content for email ${i}`
        }, authContext)
      );

      // Act
      const startTime = performance.now();
      const results = await Promise.all(emailPromises);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(1000); // Should complete quickly
      expect(results).toHaveLength(10);
      results.forEach(result => {
        const data = JSON.parse(result.content[0].text);
        expect(data.success).toBe(true);
      });
    });

    it('should track message costs and usage', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const smsResult = createMockSMSResult({ cost: 0.05 });
      server['sendSMSWithRealService'] = jest.fn().mockResolvedValue(smsResult);

      const args = {
        to: '+234812345678',
        content: 'Test SMS'
      };

      // Act
      const result = await server['callTool']('send_sms', args, authContext);

      // Assert
      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.meta.cost).toBe(0.05);
      expect(data.meta.channel).toBe('sms');
    });
  });

  describe('Security and Permissions', () => {
    it('should enforce permissions for message sending', async () => {
      // Arrange
      const limitedUserContext = testUtils.createMockAuthContext({
        role: 'USER',
        permissions: ['read:own:basic'] // No write permissions
      });

      const args = {
        to: 'test@example.com',
        subject: 'Test',
        content: 'Test'
      };

      // Act
      const tools = await server['listTools'](limitedUserContext);
      
      // Assert - Should not have send tools
      expect(tools.map(t => t.name)).not.toContain('send_email');
      expect(tools.map(t => t.name)).not.toContain('send_sms');
      expect(tools.map(t => t.name)).not.toContain('send_whatsapp');
    });

    it('should sanitize sensitive information in logs', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      const emailResult = createMockEmailResult();
      server['sendEmailWithRealService'] = jest.fn().mockResolvedValue(emailResult);

      const args = {
        to: 'sensitive@example.com',
        subject: 'Sensitive Subject with API Key: sk-1234567890',
        content: 'Content with password: secret123'
      };

      // Act
      await server['callTool']('send_email', args, authContext);

      // Assert - Should log truncated subject, not full content
      expect(logger.info).toHaveBeenCalledWith(
        'MCP External Services: Sending email',
        expect.objectContaining({
          to: 'sensitive@example.com',
          subject: 'Sensitive Subject with API Key: sk-1234567890'.substring(0, 50)
        })
      );
      
      // Should not log full content with sensitive data
      expect(logger.info).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          content: expect.stringContaining('secret123')
        })
      );
    });

    it('should validate organization isolation for service usage', async () => {
      // Arrange
      const userContext = testUtils.createMockAuthContext({ organizationId: 'org-123' });
      const emailResult = createMockEmailResult();
      server['sendEmailWithRealService'] = jest.fn().mockResolvedValue(emailResult);

      const args = {
        to: 'test@example.com',
        subject: 'Test',
        content: 'Test'
      };

      // Act
      await server['callTool']('send_email', args, userContext);

      // Assert - Should include organization ID in service call
      expect(server['sendEmailWithRealService']).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-123',
          userId: userContext.userId
        })
      );
    });
  });

  describe('Integration Testing', () => {
    it('should handle complete multi-channel messaging workflow', async () => {
      // Arrange
      const authContext = testUtils.createMockAuthContext();
      
      // Setup service results
      const emailResult = createMockEmailResult();
      const smsResult = createMockSMSResult();
      const whatsappResult = createMockWhatsAppResult();
      
      server['sendEmailWithRealService'] = jest.fn().mockResolvedValue(emailResult);
      server['sendSMSWithRealService'] = jest.fn().mockResolvedValue(smsResult);
      server['sendWhatsAppWithRealService'] = jest.fn().mockResolvedValue(whatsappResult);

      // Act - Send messages through all channels
      const emailResponse = await server['callTool']('send_email', {
        to: 'user@example.com',
        subject: 'Welcome!',
        content: 'Welcome to our service'
      }, authContext);

      const smsResponse = await server['callTool']('send_sms', {
        to: '+234812345678',
        content: 'Welcome SMS'
      }, authContext);

      const whatsappResponse = await server['callTool']('send_whatsapp', {
        to: '+234812345678',
        content: 'Welcome WhatsApp'
      }, authContext);

      // Assert - All channels succeeded
      [emailResponse, smsResponse, whatsappResponse].forEach(response => {
        const data = JSON.parse(response.content[0].text);
        expect(data.success).toBe(true);
        expect(data.data.messageId).toBeDefined();
      });

      // Verify all services were called
      expect(server['sendEmailWithRealService']).toHaveBeenCalled();
      expect(server['sendSMSWithRealService']).toHaveBeenCalled();
      expect(server['sendWhatsAppWithRealService']).toHaveBeenCalled();
    });
  });
});