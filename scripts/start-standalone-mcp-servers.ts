#!/usr/bin/env npx tsx

/**
 * Standalone MCP Servers Launcher
 * 
 * This script starts the 5 MarketSage MCP servers as standalone Node.js processes
 * that can be accessed by the backend AI service.
 */

import { spawn, ChildProcess } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';

// MCP Server configurations
const MCP_SERVERS = [
  {
    name: 'Customer Data Server',
    port: 3001,
    script: 'src/scripts/start-customer-data-mcp.ts'
  },
  {
    name: 'Campaign Analytics Server', 
    port: 3002,
    script: 'src/scripts/start-campaign-analytics-mcp.ts'
  },
  {
    name: 'LeadPulse Server',
    port: 3003,
    script: 'src/scripts/start-leadpulse-mcp.ts'
  },
  {
    name: 'External Services Server',
    port: 3004,
    script: 'src/scripts/start-external-services-mcp.ts'
  },
  {
    name: 'Monitoring Server',
    port: 3005,
    script: 'src/scripts/start-monitoring-mcp.ts'
  }
];

const processes: ChildProcess[] = [];

// Cleanup function
function cleanup() {
  console.log('\\n🛑 Shutting down MCP servers...');
  
  processes.forEach((proc, index) => {
    if (proc && !proc.killed) {
      console.log(`Stopping ${MCP_SERVERS[index].name}...`);
      proc.kill('SIGTERM');
    }
  });
  
  setTimeout(() => {
    processes.forEach((proc, index) => {
      if (proc && !proc.killed) {
        console.log(`Force killing ${MCP_SERVERS[index].name}...`);
        proc.kill('SIGKILL');
      }
    });
    process.exit(0);
  }, 5000);
}

// Handle process termination
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

async function startMCPServers() {
  console.log('🚀 Starting MarketSage MCP Servers...');
  console.log('');

  for (const server of MCP_SERVERS) {
    console.log(`📡 Starting ${server.name} on port ${server.port}...`);
    
    // Create individual server launcher script
    const serverScript = `
import { ${getServerClassName(server.name)} } from '../mcp/servers/${getServerFileName(server.name)}';

const server = new ${getServerClassName(server.name)}({
  name: '${server.name.toLowerCase().replace(/\\s+/g, '-')}',
  port: ${server.port},
  enabled: true
});

server.start().then(() => {
  console.log('✅ ${server.name} started on port ${server.port}');
}).catch((error) => {
  console.error('❌ ${server.name} failed to start:', error.message);
  process.exit(1);
});
`;

    // Write temporary script file
    const tempScriptPath = path.join(process.cwd(), `temp-${server.port}.mjs`);
    require('fs').writeFileSync(tempScriptPath, serverScript, 'utf8');

    // Start server process
    const proc = spawn('node', [tempScriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'production' }
    });

    proc.stdout?.on('data', (data) => {
      console.log(`[${server.name}] ${data.toString().trim()}`);
    });

    proc.stderr?.on('data', (data) => {
      console.error(`[${server.name}] ERROR: ${data.toString().trim()}`);
    });

    proc.on('exit', (code) => {
      console.log(`[${server.name}] Process exited with code ${code}`);
    });

    processes.push(proc);
    
    // Wait a bit between server starts
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('');
  console.log('⏳ Waiting for all servers to initialize...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Health check all servers
  console.log('🏥 Checking MCP server health...');
  for (const server of MCP_SERVERS) {
    try {
      const response = await fetch(`http://localhost:${server.port}/health`);
      if (response.ok) {
        console.log(`✅ ${server.name} (port ${server.port}): healthy`);
      } else {
        console.log(`⚠️ ${server.name} (port ${server.port}): unhealthy`);
      }
    } catch (error) {
      console.log(`❌ ${server.name} (port ${server.port}): unreachable`);
    }
  }

  console.log('');
  console.log('🎯 All MCP servers are running!');
  console.log('📍 Backend can now connect to MCP servers for AI context');
  console.log('📍 Press Ctrl+C to stop all servers');
  console.log('');

  // Keep process alive
  setInterval(() => {
    // Health check ping
  }, 30000);
}

function getServerClassName(serverName: string): string {
  return serverName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('') + 'MCPServer';
}

function getServerFileName(serverName: string): string {
  return serverName.toLowerCase().replace(/\\s+/g, '-') + '-server';
}

// Start the servers
startMCPServers().catch((error) => {
  console.error('❌ Failed to start MCP servers:', error);
  process.exit(1);
});