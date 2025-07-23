/**
 * MCP Configuration for MarketSage
 * 
 * This configuration provides centralized settings for all MCP servers
 * including authentication, rate limiting, and feature flags.
 */

export interface MCPServerConfig {
  name: string;
  version: string;
  port?: number;
  enabled: boolean;
  authentication: {
    required: boolean;
    methods: ('session' | 'api-key' | 'jwt')[];
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  fallback: {
    enabled: boolean;
    timeout: number;
  };
}

export interface MCPConfig {
  servers: {
    customer: MCPServerConfig;
    campaign: MCPServerConfig;
    leadpulse: MCPServerConfig;
    services: MCPServerConfig;
    monitoring: MCPServerConfig;
  };
  client: {
    timeout: number;
    retries: number;
    fallbackEnabled: boolean;
  };
  features: {
    customerDataEnabled: boolean;
    campaignAnalyticsEnabled: boolean;
    leadpulseEnabled: boolean;
    externalServicesEnabled: boolean;
    monitoringEnabled: boolean;
  };
}

/**
 * Default MCP configuration for MarketSage
 */
export const defaultMCPConfig: MCPConfig = {
  servers: {
    customer: {
      name: "marketsage-customer-server",
      version: "1.0.0",
      port: 3001,
      enabled: process.env.MCP_CUSTOMER_DATA_ENABLED === 'true',
      authentication: {
        required: true,
        methods: ['session', 'jwt']
      },
      rateLimit: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100
      },
      fallback: {
        enabled: true,
        timeout: 5000
      }
    },
    campaign: {
      name: "marketsage-campaign-server",
      version: "1.0.0",
      port: 3002,
      enabled: process.env.MCP_CAMPAIGN_ANALYTICS_ENABLED === 'true',
      authentication: {
        required: true,
        methods: ['session', 'jwt']
      },
      rateLimit: {
        windowMs: 60 * 1000,
        maxRequests: 100
      },
      fallback: {
        enabled: true,
        timeout: 5000
      }
    },
    leadpulse: {
      name: "marketsage-leadpulse-server",
      version: "1.0.0",
      port: 3003,
      enabled: process.env.MCP_LEADPULSE_ENABLED === 'true',
      authentication: {
        required: true,
        methods: ['session', 'jwt']
      },
      rateLimit: {
        windowMs: 60 * 1000,
        maxRequests: 150
      },
      fallback: {
        enabled: true,
        timeout: 5000
      }
    },
    services: {
      name: "marketsage-services-server",
      version: "1.0.0",
      port: 3004,
      enabled: process.env.MCP_EXTERNAL_SERVICES_ENABLED === 'true',
      authentication: {
        required: true,
        methods: ['session', 'api-key']
      },
      rateLimit: {
        windowMs: 60 * 1000,
        maxRequests: 50
      },
      fallback: {
        enabled: true,
        timeout: 10000
      }
    },
    monitoring: {
      name: "marketsage-monitoring-server",
      version: "1.0.0",
      port: 3005,
      enabled: process.env.MCP_MONITORING_ENABLED === 'true',
      authentication: {
        required: true,
        methods: ['session', 'jwt']
      },
      rateLimit: {
        windowMs: 60 * 1000,
        maxRequests: 200
      },
      fallback: {
        enabled: true,
        timeout: 5000
      }
    }
  },
  client: {
    timeout: 30000,
    retries: 3,
    fallbackEnabled: true
  },
  features: {
    customerDataEnabled: process.env.MCP_CUSTOMER_DATA_ENABLED === 'true',
    campaignAnalyticsEnabled: process.env.MCP_CAMPAIGN_ANALYTICS_ENABLED === 'true',
    leadpulseEnabled: process.env.MCP_LEADPULSE_ENABLED === 'true',
    externalServicesEnabled: process.env.MCP_EXTERNAL_SERVICES_ENABLED === 'true',
    monitoringEnabled: process.env.MCP_MONITORING_ENABLED === 'true'
  }
};

/**
 * Get MCP configuration with environment variable overrides
 */
export function getMCPConfig(): MCPConfig {
  return {
    ...defaultMCPConfig,
    // Environment-specific overrides can be added here
    servers: {
      ...defaultMCPConfig.servers,
      customer: {
        ...defaultMCPConfig.servers.customer,
        enabled: process.env.MCP_CUSTOMER_DATA_ENABLED === 'true'
      },
      campaign: {
        ...defaultMCPConfig.servers.campaign,
        enabled: process.env.MCP_CAMPAIGN_ANALYTICS_ENABLED === 'true'
      },
      leadpulse: {
        ...defaultMCPConfig.servers.leadpulse,
        enabled: process.env.MCP_LEADPULSE_ENABLED === 'true'
      },
      services: {
        ...defaultMCPConfig.servers.services,
        enabled: process.env.MCP_EXTERNAL_SERVICES_ENABLED === 'true'
      },
      monitoring: {
        ...defaultMCPConfig.servers.monitoring,
        enabled: process.env.MCP_MONITORING_ENABLED === 'true'
      }
    }
  };
}

/**
 * Check if MCP is enabled globally
 */
export function isMCPEnabled(): boolean {
  return process.env.MCP_ENABLED === 'true';
}

/**
 * Get enabled MCP servers
 */
export function getEnabledMCPServers(): string[] {
  const config = getMCPConfig();
  return Object.entries(config.servers)
    .filter(([_, serverConfig]) => serverConfig.enabled)
    .map(([name, _]) => name);
}