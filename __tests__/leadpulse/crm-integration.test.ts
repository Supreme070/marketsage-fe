/**
 * LeadPulse CRM Integration Tests
 * 
 * Tests for CRM connector functionality including:
 * - Salesforce integration
 * - HubSpot integration
 * - Contact synchronization
 * - Deal/opportunity creation
 * - Error handling and retry logic
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  SalesforceConnector, 
  HubSpotConnector, 
  CRMIntegrationManager,
  type CRMIntegrationConfig,
  type CRMContact,
  type CRMDeal 
} from '@/lib/leadpulse/integrations/crm-connectors';
import { leadPulseErrorHandler } from '@/lib/leadpulse/error-handler';
import prisma from '@/lib/db/prisma';

// Mock dependencies
jest.mock('@/lib/db/prisma', () => ({
  user: {
    update: jest.fn(),
    findUnique: jest.fn(),
  },
  leadPulseVisitor: {
    findUnique: jest.fn(),
  },
  contact: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
  leadPulseAuditLog: {
    create: jest.fn(),
  },
}));

jest.mock('@/lib/leadpulse/error-handler', () => ({
  leadPulseErrorHandler: {
    handleError: jest.fn(),
  },
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('LeadPulse CRM Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Salesforce Connector', () => {
    let salesforceConnector: SalesforceConnector;
    let mockConfig: CRMIntegrationConfig;

    beforeEach(() => {
      mockConfig = {
        platform: 'salesforce',
        credentials: {
          clientId: 'test_client_id',
          clientSecret: 'test_client_secret',
          refreshToken: 'test_refresh_token',
          instanceUrl: 'https://test.salesforce.com',
        },
        mappings: {
          leadSource: 'LeadPulse',
          customFieldMappings: {
            leadScore: 'Lead_Score__c',
          },
        },
        syncSettings: {
          autoSync: true,
          syncInterval: 60,
          syncDirection: 'to_crm',
          conflictResolution: 'leadpulse_wins',
        },
      };

      salesforceConnector = new SalesforceConnector(mockConfig);
    });

    test('should authenticate successfully', async () => {
      const mockAuthResponse = {
        access_token: 'new_access_token',
        instance_url: 'https://test.salesforce.com',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAuthResponse,
      });

      const result = await salesforceConnector.authenticate();

      expect(result).toBe(true);
      expect(mockConfig.credentials.accessToken).toBe('new_access_token');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.salesforce.com/services/oauth2/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: expect.stringContaining('grant_type=refresh_token'),
        })
      );
    });

    test('should handle authentication failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
      });

      await expect(salesforceConnector.authenticate()).rejects.toThrow(
        'Salesforce auth failed: Unauthorized'
      );

      expect(leadPulseErrorHandler.handleError).toHaveBeenCalled();
    });

    test('should create contact successfully', async () => {
      const testContact: CRMContact = {
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        company: 'Example Corp',
        phone: '+1234567890',
        jobTitle: 'Marketing Manager',
        leadScore: 85,
      };

      const mockCreateResponse = {
        id: 'contact_sf_123',
        success: true,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCreateResponse,
      });

      // Set access token
      mockConfig.credentials.accessToken = 'valid_token';

      const result = await salesforceConnector.createContact(testContact);

      expect(result.success).toBe(true);
      expect(result.id).toBe('contact_sf_123');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.salesforce.com/services/data/v58.0/sobjects/Contact',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer valid_token',
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"Email":"john.doe@example.com"'),
        })
      );
    });

    test('should update contact successfully', async () => {
      const contactId = 'contact_sf_123';
      const updateData: Partial<CRMContact> = {
        firstName: 'John Updated',
        leadScore: 95,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      mockConfig.credentials.accessToken = 'valid_token';

      const result = await salesforceConnector.updateContact(contactId, updateData);

      expect(result.success).toBe(true);

      expect(global.fetch).toHaveBeenCalledWith(
        `https://test.salesforce.com/services/data/v58.0/sobjects/Contact/${contactId}`,
        expect.objectContaining({
          method: 'PATCH',
          headers: {
            'Authorization': 'Bearer valid_token',
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"FirstName":"John Updated"'),
        })
      );
    });

    test('should search contacts by email', async () => {
      const searchEmail = 'john.doe@example.com';
      const mockSearchResponse = {
        records: [
          {
            Id: 'contact_sf_123',
            FirstName: 'John',
            LastName: 'Doe',
            Email: searchEmail,
            Company: 'Example Corp',
            Lead_Score__c: 85,
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResponse,
      });

      mockConfig.credentials.accessToken = 'valid_token';

      const result = await salesforceConnector.searchContacts(searchEmail);

      expect(result.success).toBe(true);
      expect(result.contacts).toHaveLength(1);
      expect(result.contacts![0].email).toBe(searchEmail);
      expect(result.contacts![0].leadScore).toBe(85);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/services/data/v58.0/query?q=`),
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer valid_token',
          },
        })
      );
    });

    test('should create deal/opportunity successfully', async () => {
      const testDeal: CRMDeal = {
        contactId: 'contact_sf_123',
        title: 'LeadPulse Integration Deal',
        amount: 5000,
        stage: 'Qualified',
        probability: 75,
        description: 'Opportunity from LeadPulse visitor conversion',
      };

      const mockDealResponse = {
        id: 'opportunity_sf_456',
        success: true,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDealResponse,
      });

      mockConfig.credentials.accessToken = 'valid_token';

      const result = await salesforceConnector.createDeal(testDeal);

      expect(result.success).toBe(true);
      expect(result.id).toBe('opportunity_sf_456');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.salesforce.com/services/data/v58.0/sobjects/Opportunity',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"Name":"LeadPulse Integration Deal"'),
        })
      );
    });

    test('should test connection successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ DailyApiRequests: { Max: 15000, Remaining: 14500 } }),
      });

      mockConfig.credentials.accessToken = 'valid_token';

      const result = await salesforceConnector.testConnection();

      expect(result.success).toBe(true);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.salesforce.com/services/data/v58.0/limits',
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer valid_token',
          },
        })
      );
    });

    test('should handle rate limiting with delays', async () => {
      const testContact: CRMContact = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'contact_123', success: true }),
      });

      mockConfig.credentials.accessToken = 'valid_token';

      const startTime = Date.now();
      await salesforceConnector.createContact(testContact);
      const endTime = Date.now();

      // Should have a delay of at least 200ms (Salesforce rate limit delay)
      expect(endTime - startTime).toBeGreaterThanOrEqual(200);
    });
  });

  describe('HubSpot Connector', () => {
    let hubspotConnector: HubSpotConnector;
    let mockConfig: CRMIntegrationConfig;

    beforeEach(() => {
      mockConfig = {
        platform: 'hubspot',
        credentials: {
          apiKey: 'test_hubspot_api_key',
        },
        mappings: {
          leadSource: 'LeadPulse',
        },
        syncSettings: {
          autoSync: true,
          syncInterval: 30,
          syncDirection: 'to_crm',
          conflictResolution: 'leadpulse_wins',
        },
      };

      hubspotConnector = new HubSpotConnector(mockConfig);
    });

    test('should authenticate with API key', async () => {
      const result = await hubspotConnector.authenticate();
      expect(result).toBe(true);
    });

    test('should fail authentication without API key', async () => {
      mockConfig.credentials.apiKey = undefined;
      const result = await hubspotConnector.authenticate();
      expect(result).toBe(false);
    });

    test('should create contact successfully', async () => {
      const testContact: CRMContact = {
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        company: 'Tech Corp',
        leadScore: 70,
      };

      const mockHubSpotResponse = {
        id: 'contact_hs_789',
        properties: {
          email: testContact.email,
          firstname: testContact.firstName,
          lastname: testContact.lastName,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHubSpotResponse,
      });

      const result = await hubspotConnector.createContact(testContact);

      expect(result.success).toBe(true);
      expect(result.id).toBe('contact_hs_789');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.hubapi.com/crm/v3/objects/contacts',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test_hubspot_api_key',
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"email":"jane.smith@example.com"'),
        })
      );
    });

    test('should search contacts with complex query', async () => {
      const searchEmail = 'jane.smith@example.com';
      const mockSearchResponse = {
        results: [
          {
            id: 'contact_hs_789',
            properties: {
              email: searchEmail,
              firstname: 'Jane',
              lastname: 'Smith',
              company: 'Tech Corp',
              hubspotscore: 70,
            },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResponse,
      });

      const result = await hubspotConnector.searchContacts(searchEmail);

      expect(result.success).toBe(true);
      expect(result.contacts).toHaveLength(1);
      expect(result.contacts![0].email).toBe(searchEmail);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.hubapi.com/crm/v3/objects/contacts/search',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"propertyName":"email"'),
        })
      );
    });

    test('should create deal with associations', async () => {
      const testDeal: CRMDeal = {
        contactId: 'contact_hs_789',
        title: 'HubSpot Integration Deal',
        amount: 7500,
        stage: 'appointmentscheduled',
      };

      const mockDealResponse = {
        id: 'deal_hs_101',
        properties: {
          dealname: testDeal.title,
          amount: testDeal.amount.toString(),
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDealResponse,
      });

      const result = await hubspotConnector.createDeal(testDeal);

      expect(result.success).toBe(true);
      expect(result.id).toBe('deal_hs_101');

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      
      expect(requestBody.associations).toEqual([
        {
          to: { id: testDeal.contactId },
          types: [
            {
              associationCategory: 'HUBSPOT_DEFINED',
              associationTypeId: 3,
            },
          ],
        },
      ]);
    });

    test('should handle API errors gracefully', async () => {
      const testContact: CRMContact = {
        email: 'error@example.com',
        firstName: 'Error',
        lastName: 'Test',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request: Invalid email format',
      });

      const result = await hubspotConnector.createContact(testContact);

      expect(result.success).toBe(false);
      expect(result.error).toContain('HubSpot API error');
    });

    test('should respect rate limits', async () => {
      const testContact: CRMContact = {
        email: 'ratelimit@example.com',
        firstName: 'Rate',
        lastName: 'Limit',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'contact_rl_123' }),
      });

      const startTime = Date.now();
      await hubspotConnector.createContact(testContact);
      const endTime = Date.now();

      // Should have a delay of at least 100ms (HubSpot rate limit delay)
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });
  });

  describe('CRM Integration Manager', () => {
    let crmManager: CRMIntegrationManager;

    beforeEach(() => {
      crmManager = new CRMIntegrationManager();
    });

    test('should add Salesforce integration successfully', async () => {
      const userId = 'user_test_123';
      const config: CRMIntegrationConfig = {
        platform: 'salesforce',
        credentials: {
          clientId: 'test_client_id',
          clientSecret: 'test_client_secret',
          refreshToken: 'test_refresh_token',
          instanceUrl: 'https://test.salesforce.com',
        },
        mappings: {
          leadSource: 'LeadPulse',
        },
        syncSettings: {
          autoSync: true,
          syncInterval: 60,
          syncDirection: 'to_crm',
          conflictResolution: 'leadpulse_wins',
        },
      };

      // Mock successful authentication and connection test
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test_token', instance_url: 'https://test.salesforce.com' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ DailyApiRequests: { Max: 15000, Remaining: 14500 } }),
        });

      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: userId,
        crmIntegrations: {
          salesforce: {
            ...config,
            connectedAt: expect.any(String),
            status: 'active',
          },
        },
      });

      const result = await crmManager.addIntegration(userId, config);

      expect(result.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          crmIntegrations: expect.objectContaining({
            salesforce: expect.objectContaining({
              platform: 'salesforce',
              status: 'active',
            }),
          }),
        },
      });
    });

    test('should add HubSpot integration successfully', async () => {
      const userId = 'user_test_456';
      const config: CRMIntegrationConfig = {
        platform: 'hubspot',
        credentials: {
          apiKey: 'test_hubspot_key',
        },
        mappings: {
          leadSource: 'LeadPulse',
        },
        syncSettings: {
          autoSync: false,
          syncInterval: 120,
          syncDirection: 'bidirectional',
          conflictResolution: 'manual',
        },
      };

      // Mock successful connection test
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      });

      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: userId,
        crmIntegrations: {
          hubspot: {
            ...config,
            connectedAt: expect.any(String),
            status: 'active',
          },
        },
      });

      const result = await crmManager.addIntegration(userId, config);

      expect(result.success).toBe(true);
    });

    test('should handle authentication failure', async () => {
      const userId = 'user_auth_fail';
      const config: CRMIntegrationConfig = {
        platform: 'salesforce',
        credentials: {
          clientId: 'invalid_client_id',
          clientSecret: 'invalid_secret',
          refreshToken: 'invalid_token',
        },
        mappings: {},
        syncSettings: {
          autoSync: false,
          syncInterval: 60,
          syncDirection: 'to_crm',
          conflictResolution: 'leadpulse_wins',
        },
      };

      // Mock authentication failure
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
      });

      const result = await crmManager.addIntegration(userId, config);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication failed');
    });

    test('should sync contact to CRM successfully', async () => {
      const userId = 'user_sync_test';
      const platform = 'salesforce';
      const contact: CRMContact = {
        email: 'sync@example.com',
        firstName: 'Sync',
        lastName: 'Test',
        company: 'Test Corp',
        leadScore: 80,
      };

      // Mock existing connector
      const mockConnector = {
        searchContacts: jest.fn().mockResolvedValue({
          success: true,
          contacts: [], // No existing contact
        }),
        createContact: jest.fn().mockResolvedValue({
          success: true,
          id: 'new_contact_123',
        }),
      };

      // Add connector to manager
      crmManager['connectors'].set(`${userId}-${platform}`, mockConnector as any);

      const result = await crmManager.syncContact(userId, platform, contact);

      expect(result.success).toBe(true);
      expect(result.crmId).toBe('new_contact_123');
      expect(mockConnector.searchContacts).toHaveBeenCalledWith(contact.email);
      expect(mockConnector.createContact).toHaveBeenCalledWith(contact);
    });

    test('should update existing contact during sync', async () => {
      const userId = 'user_update_test';
      const platform = 'hubspot';
      const contact: CRMContact = {
        email: 'existing@example.com',
        firstName: 'Updated',
        lastName: 'Contact',
        leadScore: 90,
      };

      const existingContact = {
        id: 'existing_contact_456',
        email: contact.email,
        firstName: 'Old',
        lastName: 'Name',
      };

      // Mock existing connector
      const mockConnector = {
        searchContacts: jest.fn().mockResolvedValue({
          success: true,
          contacts: [existingContact],
        }),
        updateContact: jest.fn().mockResolvedValue({
          success: true,
        }),
      };

      crmManager['connectors'].set(`${userId}-${platform}`, mockConnector as any);

      const result = await crmManager.syncContact(userId, platform, contact);

      expect(result.success).toBe(true);
      expect(result.crmId).toBe(existingContact.id);
      expect(mockConnector.updateContact).toHaveBeenCalledWith(
        existingContact.id,
        contact
      );
    });

    test('should create deal from LeadPulse visitor', async () => {
      const userId = 'user_deal_test';
      const platform = 'salesforce';
      const visitorId = 'visitor_deal_123';
      const dealData: Partial<CRMDeal> = {
        title: 'Custom Deal Title',
        amount: 10000,
        stage: 'Proposal',
      };

      // Mock database responses
      const mockVisitor = {
        id: visitorId,
        score: 85,
        contactId: 'contact_abc',
        touchpoints: [
          { type: 'pageview', url: '/pricing' },
          { type: 'form_submit', formId: 'contact_form' },
        ],
      };

      const mockContact = {
        id: 'contact_abc',
        email: 'deal@example.com',
        firstName: 'Deal',
        lastName: 'Creator',
        company: 'Deal Corp',
      };

      (prisma.leadPulseVisitor.findUnique as jest.Mock).mockResolvedValue(mockVisitor);
      (prisma.contact.findUnique as jest.Mock).mockResolvedValue(mockContact);
      (prisma.leadPulseAuditLog.create as jest.Mock).mockResolvedValue({});

      // Mock CRM connector
      const mockConnector = {
        searchContacts: jest.fn().mockResolvedValue({
          success: true,
          contacts: [],
        }),
        createContact: jest.fn().mockResolvedValue({
          success: true,
          crmId: 'crm_contact_789',
        }),
        createDeal: jest.fn().mockResolvedValue({
          success: true,
          id: 'deal_new_101',
        }),
      };

      crmManager['connectors'].set(`${userId}-${platform}`, mockConnector as any);

      // Mock the syncContact method
      jest.spyOn(crmManager, 'syncContact').mockResolvedValue({
        success: true,
        crmId: 'crm_contact_789',
      });

      const result = await crmManager.createDealFromLeadPulse(
        userId,
        platform,
        visitorId,
        dealData
      );

      expect(result.success).toBe(true);
      expect(result.dealId).toBe('deal_new_101');

      // Verify deal creation with correct data
      expect(mockConnector.createDeal).toHaveBeenCalledWith(
        expect.objectContaining({
          contactId: 'crm_contact_789',
          title: dealData.title,
          amount: dealData.amount,
          stage: dealData.stage,
          probability: 85, // Based on visitor score
          description: expect.stringContaining(visitorId),
        })
      );

      // Verify audit log creation
      expect(prisma.leadPulseAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          action: 'CREATE',
          resource: 'crm_deal',
          resourceId: 'deal_new_101',
        }),
      });
    });

    test('should handle missing visitor or contact', async () => {
      const userId = 'user_missing_test';
      const platform = 'salesforce';
      const visitorId = 'nonexistent_visitor';

      (prisma.leadPulseVisitor.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await crmManager.createDealFromLeadPulse(
        userId,
        platform,
        visitorId,
        {}
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Visitor not found or not converted to contact');
    });

    test('should handle unsupported CRM platforms', async () => {
      const userId = 'user_unsupported';
      const config: CRMIntegrationConfig = {
        platform: 'unsupported_crm' as any,
        credentials: {},
        mappings: {},
        syncSettings: {
          autoSync: false,
          syncInterval: 60,
          syncDirection: 'to_crm',
          conflictResolution: 'leadpulse_wins',
        },
      };

      const result = await crmManager.addIntegration(userId, config);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unsupported CRM platform: unsupported_crm');
    });
  });

  describe('Error Handling and Retry Logic', () => {
    test('should handle network errors with retry', async () => {
      const mockConfig: CRMIntegrationConfig = {
        platform: 'salesforce',
        credentials: {
          clientId: 'test_client',
          clientSecret: 'test_secret',
          refreshToken: 'test_token',
          accessToken: 'valid_token',
          instanceUrl: 'https://test.salesforce.com',
        },
        mappings: {},
        syncSettings: {
          autoSync: false,
          syncInterval: 60,
          syncDirection: 'to_crm',
          conflictResolution: 'leadpulse_wins',
        },
      };

      const connector = new SalesforceConnector(mockConfig);
      const testContact: CRMContact = {
        email: 'network@example.com',
        firstName: 'Network',
        lastName: 'Error',
      };

      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await connector.createContact(testContact);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
      expect(leadPulseErrorHandler.handleError).toHaveBeenCalled();
    });

    test('should handle rate limit responses', async () => {
      const mockConfig: CRMIntegrationConfig = {
        platform: 'hubspot',
        credentials: {
          apiKey: 'test_api_key',
        },
        mappings: {},
        syncSettings: {
          autoSync: false,
          syncInterval: 60,
          syncDirection: 'to_crm',
          conflictResolution: 'leadpulse_wins',
        },
      };

      const connector = new HubSpotConnector(mockConfig);
      const testContact: CRMContact = {
        email: 'ratelimit@example.com',
        firstName: 'Rate',
        lastName: 'Limit',
      };

      // Mock rate limit response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded',
      });

      const result = await connector.createContact(testContact);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit exceeded');
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});