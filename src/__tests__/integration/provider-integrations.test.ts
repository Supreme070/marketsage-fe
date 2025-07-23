/**
 * Provider Integration Tests
 * Tests all BYOP implementations and platform fallbacks
 */

import { emailService } from '@/lib/email-providers/email-service';
import { smsService } from '@/lib/sms-providers/sms-service';
import { whatsappService } from '@/lib/whatsapp-service';
import { unifiedMessagingService } from '@/lib/messaging/unified-messaging-service';
import prisma from '@/lib/db/prisma';

// Mock environment variables for testing
const mockEnv = {
  SMS_PROVIDER: 'mock',
  WHATSAPP_ACCESS_TOKEN: 'mock_token',
  WHATSAPP_PHONE_NUMBER_ID: 'mock_phone_id',
  EMAIL_PROVIDER: 'mock',
  ENCRYPTION_KEY: 'test-encryption-key-for-testing'
};

// Mock prisma for testing
jest.mock('@/lib/db/prisma', () => ({
  sMSProvider: {
    findFirst: jest.fn(),
  },
  emailProvider: {
    findFirst: jest.fn(),
  },
  whatsAppBusinessConfig: {
    findFirst: jest.fn(),
  },
  organization: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  messagingUsage: {
    create: jest.fn(),
  },
  creditTransaction: {
    create: jest.fn(),
  }
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }
}));

describe('Provider Integration Tests', () => {
  const testOrganizationId = 'test-org-123';
  const testPhoneNumber = '+2348012345678';
  const testEmail = 'test@example.com';
  const testMessage = 'Test message from MarketSage';

  beforeAll(() => {
    // Set mock environment variables
    Object.assign(process.env, mockEnv);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SMS Provider Integration', () => {
    test('should use organization-specific SMS provider when configured', async () => {
      // Mock organization SMS provider
      (prisma.sMSProvider.findFirst as jest.Mock).mockResolvedValue({
        id: 'sms-provider-1',
        organizationId: testOrganizationId,
        providerType: 'TWILIO',
        accountSid: 'encrypted_account_sid',
        authToken: 'encrypted_auth_token',
        fromNumber: '+1234567890',
        isActive: true
      });

      const result = await smsService.sendSMS(testPhoneNumber, testMessage, testOrganizationId);

      expect(prisma.sMSProvider.findFirst).toHaveBeenCalledWith({
        where: {
          organizationId: testOrganizationId,
          isActive: true
        }
      });

      // Should succeed (mock provider)
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    test('should fallback to platform default when no organization provider', async () => {
      // Mock no organization SMS provider
      (prisma.sMSProvider.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await smsService.sendSMS(testPhoneNumber, testMessage, testOrganizationId);

      expect(prisma.sMSProvider.findFirst).toHaveBeenCalled();
      expect(result.success).toBe(true); // Mock provider should succeed
      expect(result.provider).toBeDefined();
    });

    test('should test organization SMS configuration', async () => {
      (prisma.sMSProvider.findFirst as jest.Mock).mockResolvedValue({
        organizationId: testOrganizationId,
        providerType: 'TWILIO',
        accountSid: 'test_sid',
        authToken: 'test_token',
        fromNumber: '+1234567890',
        isActive: true
      });

      const result = await smsService.testOrganizationSMS(testOrganizationId, testPhoneNumber);

      expect(result.success).toBe(true);
    });
  });

  describe('Email Provider Integration', () => {
    test('should use organization-specific email provider when configured', async () => {
      // Mock organization email provider
      (prisma.emailProvider.findFirst as jest.Mock).mockResolvedValue({
        id: 'email-provider-1',
        organizationId: testOrganizationId,
        providerType: 'sendgrid',
        apiKey: 'encrypted_api_key',
        fromEmail: 'test@organization.com',
        isActive: true
      });

      const result = await emailService.sendEmail(testOrganizationId, {
        to: testEmail,
        from: 'test@organization.com',
        subject: 'Test Email',
        html: '<p>Test message</p>',
        text: 'Test message'
      });

      expect(prisma.emailProvider.findFirst).toHaveBeenCalledWith({
        where: {
          organizationId: testOrganizationId,
          isActive: true
        }
      });

      expect(result.success).toBe(true);
    });

    test('should fallback to platform default when no organization provider', async () => {
      // Mock no organization email provider
      (prisma.emailProvider.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await emailService.sendEmail(testOrganizationId, {
        to: testEmail,
        from: 'noreply@marketsage.africa',
        subject: 'Test Email',
        html: '<p>Test message</p>',
        text: 'Test message'
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe('platform-default');
    });

    test('should test organization email configuration', async () => {
      (prisma.emailProvider.findFirst as jest.Mock).mockResolvedValue({
        organizationId: testOrganizationId,
        providerType: 'sendgrid',
        apiKey: 'test_key',
        fromEmail: 'test@organization.com',
        isActive: true
      });

      (prisma.organization.findUnique as jest.Mock).mockResolvedValue({
        name: 'Test Organization'
      });

      const result = await emailService.testOrganizationEmail(
        testOrganizationId,
        testEmail,
        'Test Subject',
        'Test message'
      );

      expect(result.success).toBe(true);
    });
  });

  describe('WhatsApp Provider Integration', () => {
    test('should use organization-specific WhatsApp provider when configured', async () => {
      // Mock organization WhatsApp provider
      (prisma.whatsAppBusinessConfig.findFirst as jest.Mock).mockResolvedValue({
        id: 'whatsapp-config-1',
        organizationId: testOrganizationId,
        accessToken: 'encrypted_access_token',
        phoneNumberId: 'org_phone_number_id',
        isActive: true
      });

      const result = await whatsappService.sendTextMessage(testPhoneNumber, testMessage, testOrganizationId);

      expect(prisma.whatsAppBusinessConfig.findFirst).toHaveBeenCalledWith({
        where: {
          organizationId: testOrganizationId,
          isActive: true
        }
      });

      expect(result.success).toBe(true);
    });

    test('should fallback to platform default when no organization provider', async () => {
      // Mock no organization WhatsApp provider
      (prisma.whatsAppBusinessConfig.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await whatsappService.sendTextMessage(testPhoneNumber, testMessage, testOrganizationId);

      expect(result.success).toBe(true); // Mock should succeed
    });

    test('should test organization WhatsApp configuration', async () => {
      (prisma.whatsAppBusinessConfig.findFirst as jest.Mock).mockResolvedValue({
        organizationId: testOrganizationId,
        accessToken: 'test_token',
        phoneNumberId: 'test_phone_id',
        isActive: true
      });

      (prisma.organization.findUnique as jest.Mock).mockResolvedValue({
        name: 'Test Organization'
      });

      const result = await whatsappService.testOrganizationWhatsApp(testOrganizationId, testPhoneNumber);

      expect(result.success).toBe(true);
    });
  });

  describe('Unified Messaging Service Integration', () => {
    beforeEach(() => {
      // Mock organization configuration
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue({
        id: testOrganizationId,
        messagingModel: 'customer_managed',
        creditBalance: 100,
        autoTopUp: false,
        autoTopUpAmount: 50,
        autoTopUpThreshold: 10,
        preferredProviders: '{}',
        region: 'ng'
      });
    });

    test('should send SMS via unified service with customer-managed model', async () => {
      (prisma.sMSProvider.findFirst as jest.Mock).mockResolvedValue({
        organizationId: testOrganizationId,
        providerType: 'TWILIO',
        accountSid: 'test_sid',
        authToken: 'test_token',
        fromNumber: '+1234567890',
        isActive: true
      });

      const result = await unifiedMessagingService.sendMessage({
        to: testPhoneNumber,
        content: testMessage,
        channel: 'sms',
        organizationId: testOrganizationId
      });

      expect(result.success).toBe(true);
      expect(result.cost).toBe(0); // Customer pays directly
      expect(result.provider).toBeDefined();
    });

    test('should send email via unified service with customer-managed model', async () => {
      (prisma.emailProvider.findFirst as jest.Mock).mockResolvedValue({
        organizationId: testOrganizationId,
        providerType: 'sendgrid',
        apiKey: 'test_key',
        fromEmail: 'test@organization.com',
        isActive: true
      });

      const result = await unifiedMessagingService.sendMessage({
        to: testEmail,
        content: testMessage,
        channel: 'email',
        organizationId: testOrganizationId
      });

      expect(result.success).toBe(true);
      expect(result.cost).toBe(0); // Customer pays directly
    });

    test('should send WhatsApp via unified service with customer-managed model', async () => {
      (prisma.whatsAppBusinessConfig.findFirst as jest.Mock).mockResolvedValue({
        organizationId: testOrganizationId,
        accessToken: 'test_token',
        phoneNumberId: 'test_phone_id',
        isActive: true
      });

      const result = await unifiedMessagingService.sendMessage({
        to: testPhoneNumber,
        content: testMessage,
        channel: 'whatsapp',
        organizationId: testOrganizationId
      });

      expect(result.success).toBe(true);
      expect(result.cost).toBe(0); // Customer pays directly
    });

    test('should handle platform-managed messaging model', async () => {
      // Mock platform-managed organization
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue({
        id: testOrganizationId,
        messagingModel: 'platform_managed',
        creditBalance: 100,
        autoTopUp: false,
        region: 'ng'
      });

      // Mock no organization providers (should use platform defaults)
      (prisma.sMSProvider.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await unifiedMessagingService.sendMessage({
        to: testPhoneNumber,
        content: testMessage,
        channel: 'sms',
        organizationId: testOrganizationId
      });

      expect(result.success).toBe(true);
      expect(result.cost).toBeGreaterThan(0); // Platform charges credits
    });

    test('should get organization credit balance', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue({
        creditBalance: 150
      });

      const balance = await unifiedMessagingService.getCreditBalance(testOrganizationId);

      expect(balance).toBe(150);
    });
  });

  describe('Provider Configuration Validation', () => {
    test('should validate SMS provider configurations', () => {
      expect(smsService.validatePhoneNumber('+2348012345678')).toBe(true);
      expect(smsService.validatePhoneNumber('08012345678')).toBe(true);
      expect(smsService.validatePhoneNumber('invalid')).toBe(false);
    });

    test('should validate email provider configurations', () => {
      expect(emailService.validateProviderConfig('sendgrid', { apiKey: 'test' })).toBe(true);
      expect(emailService.validateProviderConfig('mailgun', { apiKey: 'test', domain: 'test.com' })).toBe(true);
      expect(emailService.validateProviderConfig('smtp', { 
        smtpHost: 'smtp.test.com', 
        smtpUsername: 'user', 
        smtpPassword: 'pass' 
      })).toBe(true);
      expect(emailService.validateProviderConfig('sendgrid', {})).toBe(false);
    });

    test('should validate WhatsApp phone numbers', () => {
      expect(whatsappService.validatePhoneNumber('+2348012345678')).toBe(true);
      expect(whatsappService.validatePhoneNumber('08012345678')).toBe(true);
      expect(whatsappService.validatePhoneNumber('+254701234567')).toBe(true); // Kenya
      expect(whatsappService.validatePhoneNumber('invalid')).toBe(false);
    });
  });

  describe('Cache Management', () => {
    test('should clear SMS provider cache', () => {
      expect(() => smsService.clearOrganizationCache(testOrganizationId)).not.toThrow();
    });

    test('should clear email provider cache', () => {
      expect(() => emailService.clearOrganizationCache(testOrganizationId)).not.toThrow();
    });

    test('should clear WhatsApp provider cache', () => {
      expect(() => whatsappService.clearOrganizationCache(testOrganizationId)).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors gracefully', async () => {
      (prisma.sMSProvider.findFirst as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const result = await smsService.sendSMS(testPhoneNumber, testMessage, testOrganizationId);

      // Should fallback to platform default
      expect(result.success).toBe(true);
    });

    test('should handle invalid encryption keys gracefully', async () => {
      process.env.ENCRYPTION_KEY = 'invalid-key';

      (prisma.emailProvider.findFirst as jest.Mock).mockResolvedValue({
        organizationId: testOrganizationId,
        providerType: 'sendgrid',
        apiKey: 'invalid_encrypted_data',
        isActive: true
      });

      const result = await emailService.sendEmail(testOrganizationId, {
        to: testEmail,
        from: 'test@example.com',
        subject: 'Test',
        html: 'Test'
      });

      // Should still attempt to send (with fallback behavior)
      expect(result).toBeDefined();
    });
  });
});