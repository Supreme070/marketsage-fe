/**
 * Multi-Tenant Architecture Manager
 * =================================
 * Enhanced tenant isolation and management for enterprise clients
 * with improved security, configuration management, and data isolation
 */

import { logger } from '@/lib/logger';
import { EnterpriseErrorHandler, EnterpriseErrorType } from '@/lib/errors/enterprise-error-handling';

export interface TenantConfiguration {
  id: string;
  name: string;
  domain: string;
  subdomain?: string;
  tier: 'starter' | 'professional' | 'enterprise' | 'enterprise_plus';
  status: 'active' | 'suspended' | 'maintenance' | 'terminated';
  
  // Feature flags and limits
  features: {
    aiIntelligence: boolean;
    advancedAnalytics: boolean;
    customBranding: boolean;
    whiteLabeling: boolean;
    apiAccess: boolean;
    singleSignOn: boolean;
    advancedReporting: boolean;
    multiChannel: boolean;
    realTimeMonitoring: boolean;
    enterpriseSupport: boolean;
  };
  
  limits: {
    maxUsers: number;
    maxContacts: number;
    maxCampaigns: number;
    maxAPICallsPerDay: number;
    maxStorageGB: number;
    maxDataRetentionDays: number;
  };
  
  // Security and compliance
  security: {
    encryptionLevel: 'standard' | 'enhanced' | 'enterprise';
    dataResidency: 'global' | 'africa' | 'nigeria' | 'kenya' | 'south_africa';
    complianceFrameworks: string[];
    ssoProvider?: string;
    mfaRequired: boolean;
    ipWhitelist: string[];
    sessionTimeoutMinutes: number;
  };
  
  // Billing and subscription
  billing: {
    plan: string;
    currency: 'USD' | 'NGN' | 'KES' | 'GHS' | 'ZAR' | 'EGP';
    billingCycle: 'monthly' | 'quarterly' | 'annually';
    nextBillingDate: Date;
    paymentStatus: 'active' | 'overdue' | 'suspended';
  };
  
  // Custom configurations
  branding: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    favicon?: string;
    customDomain?: string;
  };
  
  integrations: {
    emailProvider?: string;
    smsProvider?: string;
    crmProvider?: string;
    analyticsProvider?: string;
    paymentGateway?: string;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  contactEmail: string;
  contactPhone?: string;
  timezone: string;
  locale: string;
}

export interface TenantContext {
  tenantId: string;
  userId: string;
  userRole: string;
  permissions: string[];
  featureFlags: Record<string, boolean>;
  dbSchema: string;
  cachePrefix: string;
  storagePrefix: string;
}

export interface TenantIsolationPolicy {
  databaseIsolation: 'shared' | 'schema' | 'dedicated';
  storageIsolation: 'shared' | 'prefix' | 'dedicated';
  cacheIsolation: 'shared' | 'prefix' | 'dedicated';
  networkIsolation: boolean;
  encryptionKeys: 'shared' | 'tenant_specific';
}

export interface TenantResource {
  id: string;
  tenantId: string;
  type: 'database' | 'storage' | 'cache' | 'queue' | 'search';
  endpoint: string;
  credentials?: Record<string, string>;
  configuration: Record<string, any>;
  status: 'healthy' | 'degraded' | 'failed';
  lastHealthCheck: Date;
}

class MultiTenantManager {
  private static instance: MultiTenantManager;
  private tenantConfigs: Map<string, TenantConfiguration> = new Map();
  private tenantResources: Map<string, TenantResource[]> = new Map();
  
  // African fintech specific tenant defaults
  private readonly defaultConfigurations: Record<string, Partial<TenantConfiguration>> = {
    nigeria: {
      security: {
        dataResidency: 'nigeria',
        complianceFrameworks: ['CBN_Guidelines', 'NDPR', 'PCI_DSS']
      },
      billing: { currency: 'NGN' },
      timezone: 'Africa/Lagos'
    },
    kenya: {
      security: {
        dataResidency: 'kenya',
        complianceFrameworks: ['CBK_Guidelines', 'Data_Protection_Act', 'PCI_DSS']
      },
      billing: { currency: 'KES' },
      timezone: 'Africa/Nairobi'
    },
    ghana: {
      security: {
        dataResidency: 'africa',
        complianceFrameworks: ['BOG_Guidelines', 'Data_Protection_Act', 'PCI_DSS']
      },
      billing: { currency: 'GHS' },
      timezone: 'Africa/Accra'
    },
    south_africa: {
      security: {
        dataResidency: 'south_africa',
        complianceFrameworks: ['SARB_Guidelines', 'POPIA', 'PCI_DSS']
      },
      billing: { currency: 'ZAR' },
      timezone: 'Africa/Johannesburg'
    }
  };

  static getInstance(): MultiTenantManager {
    if (!this.instance) {
      this.instance = new MultiTenantManager();
    }
    return this.instance;
  }

  async createTenant(
    tenantData: Partial<TenantConfiguration>,
    country: string = 'nigeria'
  ): Promise<TenantConfiguration> {
    try {
      const tenantId = this.generateTenantId();
      const countryDefaults = this.defaultConfigurations[country] || this.defaultConfigurations.nigeria;
      
      const tenant: TenantConfiguration = {
        id: tenantId,
        name: tenantData.name || 'New Tenant',
        domain: tenantData.domain || `${tenantId}.marketsage.com`,
        tier: tenantData.tier || 'professional',
        status: 'active',
        
        features: {
          aiIntelligence: true,
          advancedAnalytics: true,
          customBranding: tenantData.tier === 'enterprise' || tenantData.tier === 'enterprise_plus',
          whiteLabeling: tenantData.tier === 'enterprise_plus',
          apiAccess: true,
          singleSignOn: tenantData.tier === 'enterprise' || tenantData.tier === 'enterprise_plus',
          advancedReporting: true,
          multiChannel: true,
          realTimeMonitoring: tenantData.tier !== 'starter',
          enterpriseSupport: tenantData.tier === 'enterprise' || tenantData.tier === 'enterprise_plus',
          ...tenantData.features
        },
        
        limits: this.getTierLimits(tenantData.tier || 'professional'),
        
        security: {
          encryptionLevel: tenantData.tier === 'enterprise_plus' ? 'enterprise' : 'enhanced',
          dataResidency: countryDefaults.security?.dataResidency || 'africa',
          complianceFrameworks: countryDefaults.security?.complianceFrameworks || ['PCI_DSS'],
          mfaRequired: tenantData.tier === 'enterprise' || tenantData.tier === 'enterprise_plus',
          ipWhitelist: [],
          sessionTimeoutMinutes: 480,
          ...countryDefaults.security,
          ...tenantData.security
        },
        
        billing: {
          plan: tenantData.tier || 'professional',
          currency: countryDefaults.billing?.currency || 'USD',
          billingCycle: 'monthly',
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          paymentStatus: 'active',
          ...countryDefaults.billing,
          ...tenantData.billing
        },
        
        branding: tenantData.branding || {},
        integrations: tenantData.integrations || {},
        
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        contactEmail: tenantData.contactEmail || 'admin@example.com',
        timezone: countryDefaults.timezone || 'UTC',
        locale: this.getCountryLocale(country),
        
        ...tenantData
      };

      // Initialize tenant resources
      await this.initializeTenantResources(tenant);
      
      // Store tenant configuration
      this.tenantConfigs.set(tenantId, tenant);
      
      logger.info('Tenant created successfully', {
        tenantId,
        name: tenant.name,
        tier: tenant.tier,
        country,
        dataResidency: tenant.security.dataResidency
      });

      return tenant;
    } catch (error) {
      logger.error('Failed to create tenant', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantData
      });
      throw error;
    }
  }

  async getTenant(tenantId: string): Promise<TenantConfiguration | null> {
    try {
      // In production, fetch from database
      let tenant = this.tenantConfigs.get(tenantId);
      
      if (!tenant) {
        // Try loading from database
        tenant = await this.loadTenantFromDatabase(tenantId);
        if (tenant) {
          this.tenantConfigs.set(tenantId, tenant);
        }
      }
      
      return tenant || null;
    } catch (error) {
      logger.error('Failed to get tenant', {
        tenantId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  async createTenantContext(
    tenantId: string,
    userId: string,
    userRole: string
  ): Promise<TenantContext> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) {
      throw EnterpriseErrorHandler.getInstance().createEnterpriseError(
        EnterpriseErrorType.TENANT_CONFIGURATION_ERROR,
        { tenantId }
      );
    }

    const permissions = this.getUserPermissions(userRole, tenant.tier);
    const featureFlags = this.getFeatureFlags(tenant);
    
    return {
      tenantId,
      userId,
      userRole,
      permissions,
      featureFlags,
      dbSchema: this.getTenantDBSchema(tenantId),
      cachePrefix: `tenant:${tenantId}:`,
      storagePrefix: `tenant/${tenantId}/`
    };
  }

  async validateTenantAccess(
    tenantId: string,
    resource: string,
    action: string,
    userRole: string
  ): Promise<boolean> {
    try {
      const tenant = await this.getTenant(tenantId);
      if (!tenant) return false;

      if (tenant.status !== 'active') {
        logger.warn('Access denied to inactive tenant', {
          tenantId,
          status: tenant.status,
          resource,
          action
        });
        return false;
      }

      // Check feature access
      if (!this.hasFeatureAccess(tenant, resource)) {
        return false;
      }

      // Check role permissions
      const permissions = this.getUserPermissions(userRole, tenant.tier);
      const requiredPermission = `${resource}:${action}`;
      
      return permissions.includes(requiredPermission) || permissions.includes(`${resource}:*`);
    } catch (error) {
      logger.error('Tenant access validation failed', {
        tenantId,
        resource,
        action,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  async enforceDataIsolation(tenantId: string, query: any): Promise<any> {
    // Add tenant isolation to database queries
    const isolationPolicy = this.getTenantIsolationPolicy(tenantId);
    
    switch (isolationPolicy.databaseIsolation) {
      case 'schema':
        query.schema = this.getTenantDBSchema(tenantId);
        break;
      case 'dedicated':
        query.database = `tenant_${tenantId}`;
        break;
      default:
        query.where = { ...query.where, tenantId };
    }
    
    return query;
  }

  async checkResourceLimits(tenantId: string, resource: string, currentUsage: number): Promise<boolean> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) return false;

    const limits = tenant.limits;
    
    switch (resource) {
      case 'users':
        return currentUsage < limits.maxUsers;
      case 'contacts':
        return currentUsage < limits.maxContacts;
      case 'campaigns':
        return currentUsage < limits.maxCampaigns;
      case 'api_calls':
        return currentUsage < limits.maxAPICallsPerDay;
      case 'storage':
        return currentUsage < limits.maxStorageGB * 1024 * 1024 * 1024; // Convert to bytes
      default:
        return true;
    }
  }

  private async initializeTenantResources(tenant: TenantConfiguration): Promise<void> {
    const resources: TenantResource[] = [];
    
    // Database resource
    if (tenant.tier === 'enterprise_plus') {
      resources.push({
        id: `db_${tenant.id}`,
        tenantId: tenant.id,
        type: 'database',
        endpoint: `postgresql://tenant-${tenant.id}.db.marketsage.com:5432/tenant_${tenant.id}`,
        configuration: {
          isolation: 'dedicated',
          encryption: 'enabled',
          backup: 'hourly'
        },
        status: 'healthy',
        lastHealthCheck: new Date()
      });
    }
    
    // Storage resource
    resources.push({
      id: `storage_${tenant.id}`,
      tenantId: tenant.id,
      type: 'storage',
      endpoint: `s3://marketsage-tenant-${tenant.id}`,
      configuration: {
        encryption: 'AES256',
        versioning: 'enabled',
        lifecycle: 'enabled'
      },
      status: 'healthy',
      lastHealthCheck: new Date()
    });
    
    // Cache resource
    resources.push({
      id: `cache_${tenant.id}`,
      tenantId: tenant.id,
      type: 'cache',
      endpoint: `redis://tenant-${tenant.id}.cache.marketsage.com:6379/0`,
      configuration: {
        ttl: 3600,
        eviction: 'allkeys-lru'
      },
      status: 'healthy',
      lastHealthCheck: new Date()
    });
    
    this.tenantResources.set(tenant.id, resources);
  }

  private getTierLimits(tier: string) {
    const limits = {
      starter: {
        maxUsers: 5,
        maxContacts: 10000,
        maxCampaigns: 50,
        maxAPICallsPerDay: 10000,
        maxStorageGB: 5,
        maxDataRetentionDays: 365
      },
      professional: {
        maxUsers: 25,
        maxContacts: 100000,
        maxCampaigns: 500,
        maxAPICallsPerDay: 100000,
        maxStorageGB: 50,
        maxDataRetentionDays: 1095
      },
      enterprise: {
        maxUsers: 100,
        maxContacts: 1000000,
        maxCampaigns: 2000,
        maxAPICallsPerDay: 1000000,
        maxStorageGB: 500,
        maxDataRetentionDays: 2555
      },
      enterprise_plus: {
        maxUsers: -1, // unlimited
        maxContacts: -1,
        maxCampaigns: -1,
        maxAPICallsPerDay: -1,
        maxStorageGB: -1,
        maxDataRetentionDays: -1
      }
    };
    
    return limits[tier as keyof typeof limits] || limits.professional;
  }

  private getUserPermissions(userRole: string, tenantTier: string): string[] {
    const basePermissions = {
      admin: [
        'users:*', 'campaigns:*', 'contacts:*', 'analytics:*', 
        'settings:*', 'billing:read', 'integrations:*'
      ],
      manager: [
        'campaigns:*', 'contacts:*', 'analytics:read', 
        'settings:read', 'users:read'
      ],
      analyst: [
        'analytics:*', 'contacts:read', 'campaigns:read'
      ],
      user: [
        'campaigns:read', 'contacts:read', 'analytics:read'
      ]
    };

    let permissions = basePermissions[userRole as keyof typeof basePermissions] || basePermissions.user;
    
    // Add enterprise-specific permissions
    if (tenantTier === 'enterprise' || tenantTier === 'enterprise_plus') {
      permissions = [...permissions, 'compliance:*', 'audit:read', 'exports:*'];
    }
    
    return permissions;
  }

  private getFeatureFlags(tenant: TenantConfiguration): Record<string, boolean> {
    return {
      ...tenant.features,
      // Add dynamic feature flags based on tenant status, billing, etc.
      exportEnabled: tenant.billing.paymentStatus === 'active',
      advancedFilters: tenant.tier !== 'starter',
      realTimeUpdates: tenant.status === 'active',
      apiDocumentation: tenant.features.apiAccess
    };
  }

  private hasFeatureAccess(tenant: TenantConfiguration, resource: string): boolean {
    const featureMapping = {
      'ai-intelligence': tenant.features.aiIntelligence,
      'advanced-analytics': tenant.features.advancedAnalytics,
      'api': tenant.features.apiAccess,
      'sso': tenant.features.singleSignOn,
      'monitoring': tenant.features.realTimeMonitoring,
      'exports': tenant.features.advancedReporting
    };
    
    return featureMapping[resource as keyof typeof featureMapping] !== false;
  }

  private getTenantDBSchema(tenantId: string): string {
    return `tenant_${tenantId}`;
  }

  private getTenantIsolationPolicy(tenantId: string): TenantIsolationPolicy {
    // In production, this would be configurable per tenant
    return {
      databaseIsolation: 'schema',
      storageIsolation: 'prefix',
      cacheIsolation: 'prefix',
      networkIsolation: true,
      encryptionKeys: 'tenant_specific'
    };
  }

  private getCountryLocale(country: string): string {
    const locales = {
      nigeria: 'en-NG',
      kenya: 'en-KE',
      ghana: 'en-GH',
      south_africa: 'en-ZA',
      egypt: 'ar-EG'
    };
    return locales[country as keyof typeof locales] || 'en-US';
  }

  private generateTenantId(): string {
    return `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async loadTenantFromDatabase(tenantId: string): Promise<TenantConfiguration | null> {
    // In production, load from actual database
    // For now, return null to simulate not found
    return null;
  }

  // Public utility methods
  async updateTenantConfiguration(
    tenantId: string, 
    updates: Partial<TenantConfiguration>
  ): Promise<TenantConfiguration | null> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) return null;

    const updatedTenant = {
      ...tenant,
      ...updates,
      updatedAt: new Date()
    };

    this.tenantConfigs.set(tenantId, updatedTenant);
    
    logger.info('Tenant configuration updated', {
      tenantId,
      updates: Object.keys(updates)
    });

    return updatedTenant;
  }

  async suspendTenant(tenantId: string, reason: string): Promise<boolean> {
    const tenant = await this.updateTenantConfiguration(tenantId, { 
      status: 'suspended' 
    });
    
    if (tenant) {
      logger.warn('Tenant suspended', { tenantId, reason });
      return true;
    }
    
    return false;
  }

  async getTenantResourceHealth(tenantId: string): Promise<TenantResource[]> {
    return this.tenantResources.get(tenantId) || [];
  }
}

// Convenience functions
export function createTenant(
  tenantData: Partial<TenantConfiguration>,
  country?: string
): Promise<TenantConfiguration> {
  return MultiTenantManager.getInstance().createTenant(tenantData, country);
}

export function getTenant(tenantId: string): Promise<TenantConfiguration | null> {
  return MultiTenantManager.getInstance().getTenant(tenantId);
}

export function createTenantContext(
  tenantId: string,
  userId: string,
  userRole: string
): Promise<TenantContext> {
  return MultiTenantManager.getInstance().createTenantContext(tenantId, userId, userRole);
}

export function validateTenantAccess(
  tenantId: string,
  resource: string,
  action: string,
  userRole: string
): Promise<boolean> {
  return MultiTenantManager.getInstance().validateTenantAccess(tenantId, resource, action, userRole);
}

export { MultiTenantManager }; 