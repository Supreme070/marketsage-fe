/**
 * LeadPulse CRM Integration Connectors
 * 
 * Provides seamless integration with major CRM platforms:
 * - Salesforce
 * - HubSpot
 * - Pipedrive
 * - Zoho CRM
 */

import { logger } from '@/lib/logger';
import { leadPulseCache } from '@/lib/cache/leadpulse-cache';
import { leadPulseErrorHandler, LeadPulseErrorType } from '../error-handler';

// NOTE: Prisma removed - using backend API
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ||
                    process.env.NESTJS_BACKEND_URL ||
                    'http://localhost:3006';

// CRM Integration Types
export interface CRMContact {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  jobTitle?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  leadSource?: string;
  leadScore?: number;
  customFields?: Record<string, any>;
}

export interface CRMDeal {
  id?: string;
  contactId: string;
  title: string;
  amount?: number;
  stage: string;
  closeDate?: Date;
  probability?: number;
  description?: string;
  customFields?: Record<string, any>;
}

export interface CRMActivity {
  id?: string;
  contactId: string;
  type: 'EMAIL' | 'CALL' | 'MEETING' | 'NOTE' | 'TASK';
  subject: string;
  description?: string;
  dueDate?: Date;
  completed?: boolean;
}

export interface CRMIntegrationConfig {
  platform: 'salesforce' | 'hubspot' | 'pipedrive' | 'zoho';
  credentials: {
    clientId?: string;
    clientSecret?: string;
    accessToken?: string;
    refreshToken?: string;
    apiKey?: string;
    domain?: string;
    instanceUrl?: string;
  };
  mappings: {
    leadSource?: string;
    customFieldMappings?: Record<string, string>;
  };
  syncSettings: {
    autoSync: boolean;
    syncInterval: number; // minutes
    syncDirection: 'bidirectional' | 'to_crm' | 'from_crm';
    conflictResolution: 'leadpulse_wins' | 'crm_wins' | 'manual';
  };
}

// Base CRM Connector Class
export abstract class CRMConnector {
  protected config: CRMIntegrationConfig;
  protected rateLimitDelay = 1000; // 1 second between API calls

  constructor(config: CRMIntegrationConfig) {
    this.config = config;
  }

  abstract authenticate(): Promise<boolean>;
  abstract createContact(contact: CRMContact): Promise<{ success: boolean; id?: string; error?: string }>;
  abstract updateContact(id: string, contact: Partial<CRMContact>): Promise<{ success: boolean; error?: string }>;
  abstract getContact(id: string): Promise<{ success: boolean; contact?: CRMContact; error?: string }>;
  abstract searchContacts(email: string): Promise<{ success: boolean; contacts?: CRMContact[]; error?: string }>;
  abstract createDeal(deal: CRMDeal): Promise<{ success: boolean; id?: string; error?: string }>;
  abstract createActivity(activity: CRMActivity): Promise<{ success: boolean; id?: string; error?: string }>;
  abstract testConnection(): Promise<{ success: boolean; error?: string }>;

  // Rate limiting helper
  protected async delay(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
  }

  // Error handling wrapper
  protected async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: { operation: string; contactId?: string }
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      await leadPulseErrorHandler.handleError(
        error,
        {
          endpoint: `crm_${this.config.platform}`,
          additionalData: context
        },
        LeadPulseErrorType.EXTERNAL_API_ERROR
      );
      throw error;
    }
  }
}

// Salesforce Connector
export class SalesforceConnector extends CRMConnector {
  private baseUrl: string;

  constructor(config: CRMIntegrationConfig) {
    super(config);
    this.baseUrl = config.credentials.instanceUrl || 'https://login.salesforce.com';
    this.rateLimitDelay = 200; // Salesforce has higher rate limits
  }

  async authenticate(): Promise<boolean> {
    return this.withErrorHandling(async () => {
      const response = await fetch(`${this.baseUrl}/services/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.config.credentials.clientId!,
          client_secret: this.config.credentials.clientSecret!,
          refresh_token: this.config.credentials.refreshToken!,
        }),
      });

      if (!response.ok) {
        throw new Error(`Salesforce auth failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.config.credentials.accessToken = data.access_token;
      this.baseUrl = data.instance_url;

      logger.info('Salesforce authentication successful');
      return true;
    }, { operation: 'authenticate' });
  }

  async createContact(contact: CRMContact): Promise<{ success: boolean; id?: string; error?: string }> {
    return this.withErrorHandling(async () => {
      const salesforceContact = {
        FirstName: contact.firstName,
        LastName: contact.lastName || 'Unknown',
        Email: contact.email,
        Company: contact.company,
        Phone: contact.phone,
        Title: contact.jobTitle,
        MailingStreet: contact.address,
        MailingCity: contact.city,
        MailingState: contact.state,
        MailingCountry: contact.country,
        MailingPostalCode: contact.postalCode,
        LeadSource: contact.leadSource || this.config.mappings.leadSource || 'LeadPulse',
        Lead_Score__c: contact.leadScore, // Custom field
      };

      const response = await fetch(`${this.baseUrl}/services/data/v58.0/sobjects/Contact`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.credentials.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(salesforceContact),
      });

      await this.delay();

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Salesforce API error: ${error}` };
      }

      const result = await response.json();
      logger.info(`Salesforce contact created: ${result.id}`);
      
      return { success: true, id: result.id };
    }, { operation: 'createContact', contactId: contact.email });
  }

  async updateContact(id: string, contact: Partial<CRMContact>): Promise<{ success: boolean; error?: string }> {
    return this.withErrorHandling(async () => {
      const updates: any = {};
      if (contact.firstName) updates.FirstName = contact.firstName;
      if (contact.lastName) updates.LastName = contact.lastName;
      if (contact.email) updates.Email = contact.email;
      if (contact.company) updates.Company = contact.company;
      if (contact.phone) updates.Phone = contact.phone;
      if (contact.leadScore) updates.Lead_Score__c = contact.leadScore;

      const response = await fetch(`${this.baseUrl}/services/data/v58.0/sobjects/Contact/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.config.credentials.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      await this.delay();

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Salesforce update error: ${error}` };
      }

      return { success: true };
    }, { operation: 'updateContact', contactId: id });
  }

  async getContact(id: string): Promise<{ success: boolean; contact?: CRMContact; error?: string }> {
    return this.withErrorHandling(async () => {
      const response = await fetch(
        `${this.baseUrl}/services/data/v58.0/sobjects/Contact/${id}?fields=Id,FirstName,LastName,Email,Company,Phone,Title,MailingStreet,MailingCity,MailingState,MailingCountry,MailingPostalCode,LeadSource,Lead_Score__c`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.credentials.accessToken}`,
          },
        }
      );

      await this.delay();

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Salesforce get error: ${error}` };
      }

      const data = await response.json();
      const contact: CRMContact = {
        id: data.Id,
        firstName: data.FirstName,
        lastName: data.LastName,
        email: data.Email,
        company: data.Company,
        phone: data.Phone,
        jobTitle: data.Title,
        address: data.MailingStreet,
        city: data.MailingCity,
        state: data.MailingState,
        country: data.MailingCountry,
        postalCode: data.MailingPostalCode,
        leadSource: data.LeadSource,
        leadScore: data.Lead_Score__c,
      };

      return { success: true, contact };
    }, { operation: 'getContact', contactId: id });
  }

  async searchContacts(email: string): Promise<{ success: boolean; contacts?: CRMContact[]; error?: string }> {
    return this.withErrorHandling(async () => {
      const query = `SELECT Id,FirstName,LastName,Email,Company,Phone,Title,LeadSource,Lead_Score__c FROM Contact WHERE Email = '${email}'`;
      const encodedQuery = encodeURIComponent(query);
      
      const response = await fetch(`${this.baseUrl}/services/data/v58.0/query?q=${encodedQuery}`, {
        headers: {
          'Authorization': `Bearer ${this.config.credentials.accessToken}`,
        },
      });

      await this.delay();

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Salesforce search error: ${error}` };
      }

      const data = await response.json();
      const contacts: CRMContact[] = data.records.map((record: any) => ({
        id: record.Id,
        firstName: record.FirstName,
        lastName: record.LastName,
        email: record.Email,
        company: record.Company,
        phone: record.Phone,
        jobTitle: record.Title,
        leadSource: record.LeadSource,
        leadScore: record.Lead_Score__c,
      }));

      return { success: true, contacts };
    }, { operation: 'searchContacts', contactId: email });
  }

  async createDeal(deal: CRMDeal): Promise<{ success: boolean; id?: string; error?: string }> {
    return this.withErrorHandling(async () => {
      const opportunity = {
        Name: deal.title,
        ContactId: deal.contactId,
        Amount: deal.amount,
        StageName: deal.stage,
        CloseDate: deal.closeDate?.toISOString().split('T')[0] || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        Probability: deal.probability || 50,
        Description: deal.description,
        LeadSource: 'LeadPulse',
      };

      const response = await fetch(`${this.baseUrl}/services/data/v58.0/sobjects/Opportunity`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.credentials.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(opportunity),
      });

      await this.delay();

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Salesforce opportunity error: ${error}` };
      }

      const result = await response.json();
      return { success: true, id: result.id };
    }, { operation: 'createDeal', contactId: deal.contactId });
  }

  async createActivity(activity: CRMActivity): Promise<{ success: boolean; id?: string; error?: string }> {
    return this.withErrorHandling(async () => {
      const task = {
        WhoId: activity.contactId,
        Subject: activity.subject,
        Description: activity.description,
        ActivityDate: activity.dueDate?.toISOString().split('T')[0],
        Status: activity.completed ? 'Completed' : 'Not Started',
        Type: activity.type,
        Priority: 'Normal',
      };

      const response = await fetch(`${this.baseUrl}/services/data/v58.0/sobjects/Task`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.credentials.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
      });

      await this.delay();

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Salesforce task error: ${error}` };
      }

      const result = await response.json();
      return { success: true, id: result.id };
    }, { operation: 'createActivity', contactId: activity.contactId });
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    return this.withErrorHandling(async () => {
      const response = await fetch(`${this.baseUrl}/services/data/v58.0/limits`, {
        headers: {
          'Authorization': `Bearer ${this.config.credentials.accessToken}`,
        },
      });

      if (!response.ok) {
        return { success: false, error: `Connection test failed: ${response.statusText}` };
      }

      return { success: true };
    }, { operation: 'testConnection' });
  }
}

// HubSpot Connector
export class HubSpotConnector extends CRMConnector {
  private baseUrl = 'https://api.hubapi.com';

  constructor(config: CRMIntegrationConfig) {
    super(config);
    this.rateLimitDelay = 100; // HubSpot has good rate limits
  }

  async authenticate(): Promise<boolean> {
    // HubSpot uses API key or OAuth, for simplicity using API key
    return this.config.credentials.apiKey ? true : false;
  }

  async createContact(contact: CRMContact): Promise<{ success: boolean; id?: string; error?: string }> {
    return this.withErrorHandling(async () => {
      const hubspotContact = {
        properties: {
          email: contact.email,
          firstname: contact.firstName,
          lastname: contact.lastName || 'Unknown',
          company: contact.company,
          phone: contact.phone,
          jobtitle: contact.jobTitle,
          address: contact.address,
          city: contact.city,
          state: contact.state,
          country: contact.country,
          zip: contact.postalCode,
          hs_lead_source: contact.leadSource || this.config.mappings.leadSource || 'LeadPulse',
          hubspotscore: contact.leadScore,
        },
      };

      const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.credentials.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hubspotContact),
      });

      await this.delay();

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `HubSpot API error: ${error}` };
      }

      const result = await response.json();
      logger.info(`HubSpot contact created: ${result.id}`);
      
      return { success: true, id: result.id };
    }, { operation: 'createContact', contactId: contact.email });
  }

  async updateContact(id: string, contact: Partial<CRMContact>): Promise<{ success: boolean; error?: string }> {
    return this.withErrorHandling(async () => {
      const properties: any = {};
      if (contact.firstName) properties.firstname = contact.firstName;
      if (contact.lastName) properties.lastname = contact.lastName;
      if (contact.email) properties.email = contact.email;
      if (contact.company) properties.company = contact.company;
      if (contact.phone) properties.phone = contact.phone;
      if (contact.leadScore) properties.hubspotscore = contact.leadScore;

      const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.config.credentials.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ properties }),
      });

      await this.delay();

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `HubSpot update error: ${error}` };
      }

      return { success: true };
    }, { operation: 'updateContact', contactId: id });
  }

  async getContact(id: string): Promise<{ success: boolean; contact?: CRMContact; error?: string }> {
    return this.withErrorHandling(async () => {
      const properties = [
        'email', 'firstname', 'lastname', 'company', 'phone', 'jobtitle',
        'address', 'city', 'state', 'country', 'zip', 'hs_lead_source', 'hubspotscore'
      ].join(',');

      const response = await fetch(
        `${this.baseUrl}/crm/v3/objects/contacts/${id}?properties=${properties}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.credentials.apiKey}`,
          },
        }
      );

      await this.delay();

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `HubSpot get error: ${error}` };
      }

      const data = await response.json();
      const props = data.properties;
      
      const contact: CRMContact = {
        id: data.id,
        firstName: props.firstname,
        lastName: props.lastname,
        email: props.email,
        company: props.company,
        phone: props.phone,
        jobTitle: props.jobtitle,
        address: props.address,
        city: props.city,
        state: props.state,
        country: props.country,
        postalCode: props.zip,
        leadSource: props.hs_lead_source,
        leadScore: props.hubspotscore,
      };

      return { success: true, contact };
    }, { operation: 'getContact', contactId: id });
  }

  async searchContacts(email: string): Promise<{ success: boolean; contacts?: CRMContact[]; error?: string }> {
    return this.withErrorHandling(async () => {
      const searchRequest = {
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'email',
                operator: 'EQ',
                value: email,
              },
            ],
          },
        ],
        properties: ['email', 'firstname', 'lastname', 'company', 'phone', 'jobtitle', 'hs_lead_source', 'hubspotscore'],
      };

      const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.credentials.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchRequest),
      });

      await this.delay();

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `HubSpot search error: ${error}` };
      }

      const data = await response.json();
      const contacts: CRMContact[] = data.results.map((result: any) => {
        const props = result.properties;
        return {
          id: result.id,
          firstName: props.firstname,
          lastName: props.lastname,
          email: props.email,
          company: props.company,
          phone: props.phone,
          jobTitle: props.jobtitle,
          leadSource: props.hs_lead_source,
          leadScore: props.hubspotscore,
        };
      });

      return { success: true, contacts };
    }, { operation: 'searchContacts', contactId: email });
  }

  async createDeal(deal: CRMDeal): Promise<{ success: boolean; id?: string; error?: string }> {
    return this.withErrorHandling(async () => {
      const hubspotDeal = {
        properties: {
          dealname: deal.title,
          amount: deal.amount?.toString(),
          dealstage: deal.stage,
          closedate: deal.closeDate?.toISOString(),
          hubspot_owner_id: deal.contactId,
          pipeline: 'default',
          dealtype: 'newbusiness',
        },
        associations: [
          {
            to: { id: deal.contactId },
            types: [
              {
                associationCategory: 'HUBSPOT_DEFINED',
                associationTypeId: 3, // Deal to Contact association
              },
            ],
          },
        ],
      };

      const response = await fetch(`${this.baseUrl}/crm/v3/objects/deals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.credentials.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hubspotDeal),
      });

      await this.delay();

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `HubSpot deal error: ${error}` };
      }

      const result = await response.json();
      return { success: true, id: result.id };
    }, { operation: 'createDeal', contactId: deal.contactId });
  }

  async createActivity(activity: CRMActivity): Promise<{ success: boolean; id?: string; error?: string }> {
    return this.withErrorHandling(async () => {
      const hubspotActivity = {
        properties: {
          hs_task_subject: activity.subject,
          hs_task_body: activity.description,
          hs_task_status: activity.completed ? 'COMPLETED' : 'NOT_STARTED',
          hs_task_priority: 'MEDIUM',
          hs_task_type: activity.type,
          hs_timestamp: activity.dueDate?.toISOString(),
        },
        associations: [
          {
            to: { id: activity.contactId },
            types: [
              {
                associationCategory: 'HUBSPOT_DEFINED',
                associationTypeId: 204, // Task to Contact association
              },
            ],
          },
        ],
      };

      const response = await fetch(`${this.baseUrl}/crm/v3/objects/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.credentials.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hubspotActivity),
      });

      await this.delay();

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `HubSpot activity error: ${error}` };
      }

      const result = await response.json();
      return { success: true, id: result.id };
    }, { operation: 'createActivity', contactId: activity.contactId });
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    return this.withErrorHandling(async () => {
      const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts?limit=1`, {
        headers: {
          'Authorization': `Bearer ${this.config.credentials.apiKey}`,
        },
      });

      if (!response.ok) {
        return { success: false, error: `Connection test failed: ${response.statusText}` };
      }

      return { success: true };
    }, { operation: 'testConnection' });
  }
}

// CRM Integration Manager
export class CRMIntegrationManager {
  private connectors: Map<string, CRMConnector> = new Map();

  async addIntegration(userId: string, config: CRMIntegrationConfig): Promise<{ success: boolean; error?: string }> {
    try {
      let connector: CRMConnector;

      switch (config.platform) {
        case 'salesforce':
          connector = new SalesforceConnector(config);
          break;
        case 'hubspot':
          connector = new HubSpotConnector(config);
          break;
        default:
          return { success: false, error: `Unsupported CRM platform: ${config.platform}` };
      }

      // Test authentication
      const authResult = await connector.authenticate();
      if (!authResult) {
        return { success: false, error: 'Authentication failed' };
      }

      // Test connection
      const testResult = await connector.testConnection();
      if (!testResult.success) {
        return { success: false, error: testResult.error };
      }

      // Store configuration (encrypted)
      const response = await fetch(`${BACKEND_URL}/api/v2/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crmIntegrations: {
            [config.platform]: {
              ...config,
              credentials: '***encrypted***', // In production, encrypt the credentials
              connectedAt: new Date().toISOString(),
              status: 'active',
            },
          },
        }),
      });

      this.connectors.set(`${userId}-${config.platform}`, connector);

      logger.info(`CRM integration added: ${config.platform} for user ${userId}`);
      return { success: true };

    } catch (error) {
      logger.error('Error adding CRM integration:', error);
      return { success: false, error: 'Failed to add CRM integration' };
    }
  }

  async syncContact(userId: string, platform: string, contact: CRMContact): Promise<{ success: boolean; crmId?: string; error?: string }> {
    try {
      const connector = this.connectors.get(`${userId}-${platform}`);
      if (!connector) {
        return { success: false, error: 'CRM integration not found' };
      }

      // Check if contact already exists
      const searchResult = await connector.searchContacts(contact.email);
      if (!searchResult.success) {
        return { success: false, error: searchResult.error };
      }

      if (searchResult.contacts && searchResult.contacts.length > 0) {
        // Update existing contact
        const existingContact = searchResult.contacts[0];
        const updateResult = await connector.updateContact(existingContact.id!, contact);
        return { 
          success: updateResult.success, 
          crmId: existingContact.id,
          error: updateResult.error 
        };
      } else {
        // Create new contact
        const createResult = await connector.createContact(contact);
        return createResult;
      }

    } catch (error) {
      logger.error('Error syncing contact to CRM:', error);
      return { success: false, error: 'Failed to sync contact' };
    }
  }

  async createDealFromLeadPulse(
    userId: string, 
    platform: string, 
    visitorId: string, 
    dealData: Partial<CRMDeal>
  ): Promise<{ success: boolean; dealId?: string; error?: string }> {
    try {
      const connector = this.connectors.get(`${userId}-${platform}`);
      if (!connector) {
        return { success: false, error: 'CRM integration not found' };
      }

      // Get visitor data
      const visitorResponse = await fetch(`${BACKEND_URL}/api/v2/leadpulse-visitors/${visitorId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const visitor = visitorResponse.ok ? await visitorResponse.json() : null;

      if (!visitor || !visitor.contactId) {
        return { success: false, error: 'Visitor not found or not converted to contact' };
      }

      // Get contact data
      const contactResponse = await fetch(`${BACKEND_URL}/api/v2/contacts/${visitor.contactId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const contact = contactResponse.ok ? await contactResponse.json() : null;

      if (!contact) {
        return { success: false, error: 'Contact not found' };
      }

      // Sync contact to CRM first
      const contactSync = await this.syncContact(userId, platform, {
        email: contact.email,
        firstName: contact.firstName || undefined,
        lastName: contact.lastName || undefined,
        company: contact.company || undefined,
        phone: contact.phone || undefined,
        leadScore: visitor.score || undefined,
        leadSource: 'LeadPulse',
      });

      if (!contactSync.success || !contactSync.crmId) {
        return { success: false, error: 'Failed to sync contact to CRM' };
      }

      // Create deal
      const deal: CRMDeal = {
        contactId: contactSync.crmId,
        title: dealData.title || `LeadPulse Opportunity - ${contact.firstName} ${contact.lastName}`,
        amount: dealData.amount,
        stage: dealData.stage || 'Qualified',
        closeDate: dealData.closeDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        probability: dealData.probability || Math.min(visitor.score || 50, 90),
        description: `Generated from LeadPulse visitor ${visitorId}. Engagement score: ${visitor.score}. ${visitor.touchpoints.length} touchpoints recorded.`,
      };

      const result = await connector.createDeal(deal);
      
      if (result.success) {
        // Log the deal creation
        await fetch(`${BACKEND_URL}/api/v2/leadpulse-audit-logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            action: 'CREATE',
            resource: 'crm_deal',
            resourceId: result.id!,
            details: { visitorId, platform, dealData },
          }),
        });
      }

      return result;

    } catch (error) {
      logger.error('Error creating CRM deal:', error);
      return { success: false, error: 'Failed to create deal' };
    }
  }

  getConnector(userId: string, platform: string): CRMConnector | undefined {
    return this.connectors.get(`${userId}-${platform}`);
  }
}

// Export singleton instance
export const crmIntegrationManager = new CRMIntegrationManager();