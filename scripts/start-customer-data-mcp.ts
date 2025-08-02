#!/usr/bin/env npx tsx

/**
 * Customer Data MCP Server Standalone Launcher
 */

import { CustomerDataMCPServer } from '../src/mcp/servers/customer-data-server';

async function startServer() {
  console.log('🚀 Starting Customer Data MCP Server...');
  
  const server = new CustomerDataMCPServer({
    name: 'customer-data-server',
    port: 3001,
    enabled: true,
    description: 'Customer profiles, segments, and predictions'
  });

  try {
    await server.start();
    console.log('✅ Customer Data MCP Server started on port 3001');
    console.log('📡 Available endpoints:');
    console.log('   - GET /health');
    console.log('   - POST /api/customers/insights');
    console.log('   - GET /api/customers/segments');
    console.log('');
  } catch (error) {
    console.error('❌ Failed to start Customer Data MCP Server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n🛑 Shutting down Customer Data MCP Server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\\n🛑 Shutting down Customer Data MCP Server...');
  process.exit(0);
});

startServer();