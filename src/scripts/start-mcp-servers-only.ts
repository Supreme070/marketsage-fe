#!/usr/bin/env tsx
/**
 * Start MCP Servers Only (for testing)
 * 
 * This script starts only the MCP servers without Next.js
 * for testing Supreme-AI v3 connectivity.
 */

import { CustomerDataMCPServer } from '../mcp/servers/customer-data-server';
import { CampaignAnalyticsMCPServer } from '../mcp/servers/campaign-analytics-server';
import { LeadPulseMCPServer } from '../mcp/servers/leadpulse-server';
import { ExternalServicesMCPServer } from '../mcp/servers/external-services-server';
import { MonitoringMCPServer } from '../mcp/servers/monitoring-server';

class MCPServersOnly {
  private servers: Array<{ name: string; instance: any; port: number }> = [];
  private isShuttingDown = false;

  async startServers(): Promise<void> {
    console.log('🚀 Starting MCP Servers for Testing...\n');

    // Create server instances
    const serverConfigs = [
      { name: 'Customer Data', ServerClass: CustomerDataMCPServer, port: 3001 },
      { name: 'Campaign Analytics', ServerClass: CampaignAnalyticsMCPServer, port: 3002 },
      { name: 'LeadPulse', ServerClass: LeadPulseMCPServer, port: 3003 },
      { name: 'External Services', ServerClass: ExternalServicesMCPServer, port: 3004 },
      { name: 'Monitoring', ServerClass: MonitoringMCPServer, port: 3005 }
    ];

    // Start all servers
    for (const { name, ServerClass, port } of serverConfigs) {
      try {
        console.log(`Starting ${name} MCP Server on port ${port}...`);
        const server = new ServerClass({ port });
        await server.start();
        this.servers.push({ name, instance: server, port });
        console.log(`✅ ${name} MCP Server started on port ${port}`);
      } catch (error) {
        console.error(`❌ Failed to start ${name} server:`, error);
        throw error;
      }
    }

    console.log(`\n✅ All ${this.servers.length} MCP servers started successfully`);

    // Health check all servers
    await this.healthCheckServers();

    // Set up graceful shutdown
    this.setupGracefulShutdown();

    console.log('\n🎯 MCP servers are ready for Supreme-AI v3 connectivity testing');
    console.log('📍 Press Ctrl+C to stop all servers');
    console.log('🔗 Test connectivity with: npx tsx src/scripts/test-supreme-ai-mcp-connectivity.ts\n');

    // Keep the process alive
    await this.keepAlive();
  }

  private async healthCheckServers(): Promise<void> {
    console.log('\n🏥 Health checking MCP servers...');

    const healthPromises = this.servers.map(async ({ name, port }) => {
      try {
        const response = await fetch(`http://localhost:${port}/health`, {
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          const health = await response.json();
          console.log(`✅ ${name} (port ${port}): ${health.status}`);
          return true;
        } else {
          console.log(`❌ ${name} (port ${port}): HTTP ${response.status}`);
          return false;
        }
      } catch (error) {
        console.log(`❌ ${name} (port ${port}): ${error.message}`);
        return false;
      }
    });

    const healthResults = await Promise.all(healthPromises);
    const healthyCount = healthResults.filter(Boolean).length;
    
    if (healthyCount === this.servers.length) {
      console.log(`✅ All MCP servers passed health checks`);
    } else {
      console.log(`⚠️ ${healthyCount}/${this.servers.length} servers are healthy`);
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;

      console.log(`\n🧹 Received ${signal}, shutting down MCP servers...`);

      for (const { name, instance } of this.servers) {
        try {
          console.log(`Stopping ${name} MCP server...`);
          await instance.stop();
          console.log(`✅ ${name} MCP server stopped`);
        } catch (error) {
          console.error(`❌ Error stopping ${name} server:`, error);
        }
      }

      console.log('✅ All MCP servers stopped');
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }

  private async keepAlive(): Promise<void> {
    // Keep the process alive until shutdown
    return new Promise(() => {
      // Never resolves, keeps process alive until shutdown
    });
  }
}

// Start the servers
async function main() {
  const mcpServers = new MCPServersOnly();
  
  try {
    await mcpServers.startServers();
  } catch (error) {
    console.error('\n💥 Failed to start MCP servers:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { MCPServersOnly };