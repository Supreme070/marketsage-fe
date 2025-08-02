/**
 * Production Startup Script with MCP Servers
 * 
 * This script starts the Next.js application alongside all HTTP MCP servers
 * for production deployment in Docker, Railway, or any other environment.
 */

import { spawn, type ChildProcess } from 'child_process';
import { CustomerDataMCPServer } from '../mcp/servers/customer-data-server';
import { CampaignAnalyticsMCPServer } from '../mcp/servers/campaign-analytics-server';
import { LeadPulseMCPServer } from '../mcp/servers/leadpulse-server';
import { ExternalServicesMCPServer } from '../mcp/servers/external-services-server';
import { MonitoringMCPServer } from '../mcp/servers/monitoring-server';

interface MCPServerInfo {
  name: string;
  server: any;
  port: number;
}

class ProductionStartup {
  private mcpServers: MCPServerInfo[] = [];
  private nextjsProcess: ChildProcess | null = null;
  private isShuttingDown = false;

  constructor() {
    this.setupCleanupHandlers();
  }

  async start() {
    console.log('🚀 Starting MarketSage Production with MCP Servers...');

    try {
      // Start MCP servers first
      await this.startMCPServers();
      
      // Give MCP servers time to fully initialize
      await this.sleep(5000);
      
      // Health check MCP servers
      await this.healthCheckMCPServers();
      
      // Start Next.js application
      await this.startNextJS();
      
      console.log('✅ All services started successfully!');
      
      // Keep the process alive
      await this.keepAlive();
      
    } catch (error) {
      console.error('❌ Failed to start services:', error);
      await this.shutdown();
      process.exit(1);
    }
  }

  private async startMCPServers() {
    console.log('📡 Starting MCP Servers...');

    // Initialize all MCP servers
    const servers = [
      { name: 'Customer Data', ServerClass: CustomerDataMCPServer, port: 3001 },
      { name: 'Campaign Analytics', ServerClass: CampaignAnalyticsMCPServer, port: 3002 },
      { name: 'LeadPulse', ServerClass: LeadPulseMCPServer, port: 3003 },
      { name: 'External Services', ServerClass: ExternalServicesMCPServer, port: 3004 },
      { name: 'Monitoring', ServerClass: MonitoringMCPServer, port: 3005 }
    ];

    // Start all servers
    const startPromises = servers.map(async ({ name, ServerClass, port }) => {
      try {
        console.log(`Starting ${name} MCP Server on port ${port}...`);
        const server = new ServerClass({ port, enabled: true });
        await server.start();
        
        this.mcpServers.push({ name, server, port });
        console.log(`✅ ${name} MCP Server started on port ${port}`);
        
        return { name, status: 'started' };
      } catch (error) {
        console.error(`❌ Failed to start ${name} MCP Server:`, error);
        return { name, status: 'failed', error };
      }
    });

    const results = await Promise.allSettled(startPromises);
    
    // Check results
    const failed = results.filter(r => r.status === 'rejected' || 
      (r.status === 'fulfilled' && r.value.status === 'failed'));
    
    if (failed.length > 0) {
      console.error(`❌ ${failed.length} MCP servers failed to start`);
      throw new Error('Some MCP servers failed to start');
    }

    console.log(`✅ All ${this.mcpServers.length} MCP servers started successfully`);
  }

  private async healthCheckMCPServers() {
    console.log('🏥 Health checking MCP servers...');

    const healthPromises = this.mcpServers.map(async ({ name, port }) => {
      try {
        const response = await fetch(`http://localhost:${port}/health`, {
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          const health = await response.json();
          console.log(`✅ ${name} (port ${port}): ${health.status}`);
          return { name, port, healthy: true };
        } else {
          console.log(`⚠️ ${name} (port ${port}): HTTP ${response.status}`);
          return { name, port, healthy: false };
        }
      } catch (error) {
        console.log(`❌ ${name} (port ${port}): ${error.message}`);
        return { name, port, healthy: false, error: error.message };
      }
    });

    const healthResults = await Promise.all(healthPromises);
    const unhealthy = healthResults.filter(r => !r.healthy);
    
    if (unhealthy.length > 0) {
      console.warn(`⚠️ ${unhealthy.length} MCP servers are not responding to health checks`);
      // Don't fail startup, as servers might still be initializing
    } else {
      console.log('✅ All MCP servers passed health checks');
    }
  }

  private async startNextJS() {
    console.log('🌐 Starting Next.js application...');

    return new Promise<void>((resolve, reject) => {
      // Start Next.js server
      this.nextjsProcess = spawn('npm', ['run', 'start'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PORT: '3000',
          HOSTNAME: '0.0.0.0'
        }
      });

      let startupTimeout: NodeJS.Timeout;

      this.nextjsProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        console.log(`[Next.js] ${output.trim()}`);
        
        // Look for successful startup indicators
        if (output.includes('Ready') || output.includes('started server') || output.includes('Local:')) {
          if (startupTimeout) clearTimeout(startupTimeout);
          console.log('✅ Next.js application started successfully');
          resolve();
        }
      });

      this.nextjsProcess.stderr?.on('data', (data) => {
        const output = data.toString();
        console.error(`[Next.js Error] ${output.trim()}`);
      });

      this.nextjsProcess.on('error', (error) => {
        console.error('❌ Failed to start Next.js process:', error);
        reject(error);
      });

      this.nextjsProcess.on('exit', (code, signal) => {
        if (!this.isShuttingDown) {
          console.error(`❌ Next.js process exited unexpectedly with code ${code}, signal ${signal}`);
          reject(new Error(`Next.js process exited with code ${code}`));
        }
      });

      // Set startup timeout
      startupTimeout = setTimeout(() => {
        console.log('⏳ Next.js is taking longer than expected to start, but continuing...');
        resolve(); // Don't fail, just continue
      }, 30000);
    });
  }

  private async keepAlive() {
    console.log('🔄 Production services running. Press Ctrl+C to stop.');
    
    // Keep the process alive
    return new Promise<void>((resolve) => {
      process.on('SIGTERM', () => {
        console.log('📨 Received SIGTERM, shutting down gracefully...');
        this.shutdown().then(() => resolve());
      });

      process.on('SIGINT', () => {
        console.log('📨 Received SIGINT, shutting down gracefully...');
        this.shutdown().then(() => resolve());
      });
    });
  }

  private async shutdown() {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    console.log('🧹 Shutting down all services...');

    // Stop Next.js process
    if (this.nextjsProcess) {
      console.log('Stopping Next.js application...');
      this.nextjsProcess.kill('SIGTERM');
      
      // Give it time to shut down gracefully
      await this.sleep(5000);
      
      if (!this.nextjsProcess.killed) {
        console.log('Force killing Next.js process...');
        this.nextjsProcess.kill('SIGKILL');
      }
    }

    // Stop all MCP servers
    const stopPromises = this.mcpServers.map(async ({ name, server }) => {
      try {
        console.log(`Stopping ${name} MCP server...`);
        await server.stop();
        console.log(`✅ ${name} MCP server stopped`);
      } catch (error) {
        console.error(`❌ Error stopping ${name} MCP server:`, error);
      }
    });

    await Promise.allSettled(stopPromises);
    console.log('✅ All services shut down');
  }

  private setupCleanupHandlers() {
    // Handle unexpected exits
    process.on('uncaughtException', async (error) => {
      console.error('💥 Uncaught exception:', error);
      await this.shutdown();
      process.exit(1);
    });

    process.on('unhandledRejection', async (reason, promise) => {
      console.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
      await this.shutdown();
      process.exit(1);
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Start the production server
if (require.main === module) {
  const startup = new ProductionStartup();
  startup.start().catch((error) => {
    console.error('❌ Startup failed:', error);
    process.exit(1);
  });
}

export { ProductionStartup };