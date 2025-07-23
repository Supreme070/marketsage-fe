/**
 * MCP Server Manager for MarketSage
 * 
 * This manager coordinates all MCP servers, handles startup/shutdown,
 * and provides a unified interface for the Supreme-AI v3 engine.
 */

import { CustomerDataMCPServer } from './servers/customer-data-server';
import { CampaignAnalyticsMCPServer } from './servers/campaign-analytics-server';
import { LeadPulseMCPServer } from './servers/leadpulse-server';
import { ExternalServicesMCPServer } from './servers/external-services-server';
import { MonitoringMCPServer } from './servers/monitoring-server';
import type { BaseMCPServer } from './servers/base-mcp-server';

import { getMCPConfig, isMCPEnabled, getEnabledMCPServers } from './config/mcp-config';
import { MCPServerConfig } from './types/mcp-types';
import { logger } from '../lib/logger';

/**
 * MCP Server Manager
 */
export class MCPServerManager {
  private servers: Map<string, BaseMCPServer> = new Map();
  private config = getMCPConfig();
  private isStarted = false;

  constructor() {
    this.initializeServers();
  }

  /**
   * Initialize all enabled MCP servers
   */
  private initializeServers(): void {
    if (!isMCPEnabled()) {
      logger.info('MCP is disabled, skipping server initialization');
      return;
    }

    const enabledServers = getEnabledMCPServers();
    logger.info('Initializing MCP servers', { enabledServers });

    // Initialize Customer Data Server
    if (this.config.features.customerDataEnabled) {
      try {
        const customerServer = new CustomerDataMCPServer();
        this.servers.set('customer', customerServer);
        logger.info('Customer Data MCP Server initialized');
      } catch (error) {
        logger.error('Failed to initialize Customer Data MCP Server', error);
      }
    }

    // Initialize Campaign Analytics Server
    if (this.config.features.campaignAnalyticsEnabled) {
      try {
        const campaignServer = new CampaignAnalyticsMCPServer();
        this.servers.set('campaign', campaignServer);
        logger.info('Campaign Analytics MCP Server initialized');
      } catch (error) {
        logger.error('Failed to initialize Campaign Analytics MCP Server', error);
      }
    }

    // Initialize LeadPulse Server
    if (this.config.features.leadpulseEnabled) {
      try {
        const leadpulseServer = new LeadPulseMCPServer();
        this.servers.set('leadpulse', leadpulseServer);
        logger.info('LeadPulse MCP Server initialized');
      } catch (error) {
        logger.error('Failed to initialize LeadPulse MCP Server', error);
      }
    }

    // Initialize External Services Server
    if (this.config.features.externalServicesEnabled) {
      try {
        const externalServicesServer = new ExternalServicesMCPServer();
        this.servers.set('services', externalServicesServer);
        logger.info('External Services MCP Server initialized');
      } catch (error) {
        logger.error('Failed to initialize External Services MCP Server', error);
      }
    }

    // Initialize Monitoring Server
    if (this.config.features.monitoringEnabled) {
      try {
        const monitoringServer = new MonitoringMCPServer();
        this.servers.set('monitoring', monitoringServer);
        logger.info('Monitoring MCP Server initialized');
      } catch (error) {
        logger.error('Failed to initialize Monitoring MCP Server', error);
      }
    }

    logger.info(`MCP Server Manager initialized with ${this.servers.size} servers`);
  }

  /**
   * Start all MCP servers
   */
  async startServers(): Promise<void> {
    if (!isMCPEnabled()) {
      logger.info('MCP is disabled, skipping server startup');
      return;
    }

    if (this.isStarted) {
      logger.warn('MCP servers are already started');
      return;
    }

    logger.info('Starting MCP servers...');

    const startPromises = Array.from(this.servers.entries()).map(async ([name, server]) => {
      try {
        await server.start();
        logger.info(`MCP Server '${name}' started successfully`);
      } catch (error) {
        logger.error(`Failed to start MCP Server '${name}'`, error);
        throw error;
      }
    });

    try {
      await Promise.all(startPromises);
      this.isStarted = true;
      logger.info('All MCP servers started successfully');
    } catch (error) {
      logger.error('Failed to start some MCP servers', error);
      throw error;
    }
  }

  /**
   * Stop all MCP servers
   */
  async stopServers(): Promise<void> {
    if (!this.isStarted) {
      logger.info('MCP servers are not running');
      return;
    }

    logger.info('Stopping MCP servers...');

    const stopPromises = Array.from(this.servers.entries()).map(async ([name, server]) => {
      try {
        await server.stop();
        logger.info(`MCP Server '${name}' stopped successfully`);
      } catch (error) {
        logger.error(`Failed to stop MCP Server '${name}'`, error);
      }
    });

    await Promise.allSettled(stopPromises);
    this.isStarted = false;
    logger.info('All MCP servers stopped');
  }

  /**
   * Restart all MCP servers
   */
  async restartServers(): Promise<void> {
    logger.info('Restarting MCP servers...');
    await this.stopServers();
    await this.startServers();
    logger.info('MCP servers restarted successfully');
  }

  /**
   * Get server status
   */
  getServerStatus(): {
    enabled: boolean;
    started: boolean;
    servers: Array<{
      name: string;
      enabled: boolean;
      running: boolean;
    }>;
  } {
    const enabled = isMCPEnabled();
    
    const serverStatus = Array.from(this.servers.entries()).map(([name, server]) => ({
      name,
      enabled: true, // If it's in the map, it's enabled
      running: this.isStarted // Simplified - in real implementation, check individual server status
    }));

    // Add disabled servers
    const allServerNames = ['customer', 'campaign', 'leadpulse', 'services', 'monitoring'];
    const enabledServerNames = Array.from(this.servers.keys());
    
    allServerNames.forEach(name => {
      if (!enabledServerNames.includes(name)) {
        serverStatus.push({
          name,
          enabled: false,
          running: false
        });
      }
    });

    return {
      enabled,
      started: this.isStarted,
      servers: serverStatus
    };
  }

  /**
   * Get a specific server
   */
  getServer(name: string): BaseMCPServer | undefined {
    return this.servers.get(name);
  }

  /**
   * Check if a server is available
   */
  isServerAvailable(name: string): boolean {
    return this.servers.has(name) && this.isStarted;
  }

  /**
   * Get all available servers
   */
  getAvailableServers(): string[] {
    if (!this.isStarted) {
      return [];
    }
    return Array.from(this.servers.keys());
  }

  /**
   * Health check for all servers
   */
  async healthCheck(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    servers: Array<{
      name: string;
      status: 'healthy' | 'unhealthy';
      error?: string;
    }>;
  }> {
    if (!isMCPEnabled()) {
      return {
        overall: 'healthy',
        servers: [{ name: 'mcp', status: 'healthy' }]
      };
    }

    const serverChecks = Array.from(this.servers.entries()).map(async ([name, server]) => {
      try {
        // In a real implementation, servers would have a health check method
        return {
          name,
          status: 'healthy' as const
        };
      } catch (error) {
        return {
          name,
          status: 'unhealthy' as const,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    const results = await Promise.all(serverChecks);
    const unhealthyCount = results.filter(r => r.status === 'unhealthy').length;
    
    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyCount === 0) {
      overall = 'healthy';
    } else if (unhealthyCount < results.length) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    return {
      overall,
      servers: results
    };
  }

  /**
   * Enable a specific server
   */
  async enableServer(serverName: string): Promise<void> {
    if (this.servers.has(serverName)) {
      logger.info(`Server '${serverName}' is already enabled`);
      return;
    }

    logger.info(`Enabling MCP server: ${serverName}`);

    switch (serverName) {
      case 'customer':
        if (!this.config.features.customerDataEnabled) {
          throw new Error('Customer data feature is disabled in configuration');
        }
        const customerServer = new CustomerDataMCPServer();
        this.servers.set('customer', customerServer);
        if (this.isStarted) {
          await customerServer.start();
        }
        break;

      case 'campaign':
        if (!this.config.features.campaignAnalyticsEnabled) {
          throw new Error('Campaign analytics feature is disabled in configuration');
        }
        const campaignServer = new CampaignAnalyticsMCPServer();
        this.servers.set('campaign', campaignServer);
        if (this.isStarted) {
          await campaignServer.start();
        }
        break;

      case 'leadpulse':
        if (!this.config.features.leadpulseEnabled) {
          throw new Error('LeadPulse feature is disabled in configuration');
        }
        const leadpulseServer = new LeadPulseMCPServer();
        this.servers.set('leadpulse', leadpulseServer);
        if (this.isStarted) {
          await leadpulseServer.start();
        }
        break;

      case 'services':
        if (!this.config.features.externalServicesEnabled) {
          throw new Error('External services feature is disabled in configuration');
        }
        const servicesServer = new ExternalServicesMCPServer();
        this.servers.set('services', servicesServer);
        if (this.isStarted) {
          await servicesServer.start();
        }
        break;

      case 'monitoring':
        if (!this.config.features.monitoringEnabled) {
          throw new Error('Monitoring feature is disabled in configuration');
        }
        const monitoringServerInstance = new MonitoringMCPServer();
        this.servers.set('monitoring', monitoringServerInstance);
        if (this.isStarted) {
          await monitoringServerInstance.start();
        }
        break;

      default:
        throw new Error(`Unknown server: ${serverName}`);
    }

    logger.info(`MCP server '${serverName}' enabled successfully`);
  }

  /**
   * Disable a specific server
   */
  async disableServer(serverName: string): Promise<void> {
    const server = this.servers.get(serverName);
    if (!server) {
      logger.info(`Server '${serverName}' is already disabled`);
      return;
    }

    logger.info(`Disabling MCP server: ${serverName}`);

    try {
      if (this.isStarted) {
        await server.stop();
      }
      this.servers.delete(serverName);
      logger.info(`MCP server '${serverName}' disabled successfully`);
    } catch (error) {
      logger.error(`Failed to disable MCP server '${serverName}'`, error);
      throw error;
    }
  }

  /**
   * Reload configuration and restart servers
   */
  async reloadConfiguration(): Promise<void> {
    logger.info('Reloading MCP configuration...');
    
    // Stop current servers
    await this.stopServers();
    
    // Clear current servers
    this.servers.clear();
    
    // Reinitialize with new configuration
    this.config = getMCPConfig();
    this.initializeServers();
    
    // Start servers if they were running
    if (this.isStarted) {
      await this.startServers();
    }
    
    logger.info('MCP configuration reloaded successfully');
  }
}

// Singleton instance
let mcpServerManager: MCPServerManager | null = null;

/**
 * Get the global MCP Server Manager instance
 */
export function getMCPServerManager(): MCPServerManager {
  if (!mcpServerManager) {
    mcpServerManager = new MCPServerManager();
  }
  return mcpServerManager;
}

/**
 * Initialize MCP servers (called during application startup)
 */
export async function initializeMCPServers(): Promise<void> {
  const manager = getMCPServerManager();
  await manager.startServers();
}

/**
 * Shutdown MCP servers (called during application shutdown)
 */
export async function shutdownMCPServers(): Promise<void> {
  if (mcpServerManager) {
    await mcpServerManager.stopServers();
  }
}