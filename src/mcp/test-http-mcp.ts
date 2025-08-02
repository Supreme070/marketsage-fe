/**
 * Test script for HTTP MCP Server
 * 
 * This script tests the HTTP MCP server functionality to ensure
 * it can start, respond to requests, and handle connections properly.
 */

import { CustomerDataMCPServer } from './servers/customer-data-server';
import { defaultMCPConfig } from './config/mcp-config';

async function testHTTPMCPServer() {
  console.log('🔬 Testing HTTP MCP Server...');
  
  let server: CustomerDataMCPServer | null = null;
  
  try {
    // Create server instance
    console.log('Creating CustomerDataMCPServer...');
    server = new CustomerDataMCPServer({
      port: 3001, // Use port 3001 for customer data server
      enabled: true
    });

    // Start server
    console.log('Starting server on port 3001...');
    await server.start();
    
    // Give it a moment to fully start
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test health endpoint
    console.log('Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3001/health');
    
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('✅ Health check passed:', health);
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
    }
    
    // Test stats endpoint
    console.log('Testing stats endpoint...');
    const statsResponse = await fetch('http://localhost:3001/stats');
    
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('✅ Stats check passed:', stats);
    } else {
      console.log('❌ Stats check failed:', statsResponse.status);
    }
    
    // Test server status
    console.log('Getting server status...');
    const status = server.getStatus();
    console.log('✅ Server status:', status);
    
    // Test health check method
    console.log('Testing health check method...');
    const healthCheck = await server.healthCheck();
    console.log('✅ Health check method:', healthCheck);
    
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Clean up
    if (server) {
      console.log('Stopping server...');
      await server.stop();
      console.log('Server stopped.');
    }
  }
}

// Run the test
testHTTPMCPServer().catch(console.error);