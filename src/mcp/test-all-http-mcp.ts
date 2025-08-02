/**
 * Test script for All HTTP MCP Servers
 * 
 * This script starts all 5 MCP servers on their respective ports
 * and tests their functionality.
 */

import { CustomerDataMCPServer } from './servers/customer-data-server';
import { CampaignAnalyticsMCPServer } from './servers/campaign-analytics-server';
import { LeadPulseMCPServer } from './servers/leadpulse-server';
import { ExternalServicesMCPServer } from './servers/external-services-server';
import { MonitoringMCPServer } from './servers/monitoring-server';

async function testAllHTTPMCPServers() {
  console.log('🔬 Testing All HTTP MCP Servers...');
  
  const servers: Array<{ name: string; server: any; port: number }> = [];
  
  try {
    // Create all server instances
    console.log('Creating MCP Server instances...');
    
    const customerServer = new CustomerDataMCPServer({ port: 3001, enabled: true });
    servers.push({ name: 'Customer Data', server: customerServer, port: 3001 });
    
    const campaignServer = new CampaignAnalyticsMCPServer({ port: 3002, enabled: true });
    servers.push({ name: 'Campaign Analytics', server: campaignServer, port: 3002 });
    
    const leadpulseServer = new LeadPulseMCPServer({ port: 3003, enabled: true });
    servers.push({ name: 'LeadPulse', server: leadpulseServer, port: 3003 });
    
    const servicesServer = new ExternalServicesMCPServer({ port: 3004, enabled: true });
    servers.push({ name: 'External Services', server: servicesServer, port: 3004 });
    
    const monitoringServer = new MonitoringMCPServer({ port: 3005, enabled: true });
    servers.push({ name: 'Monitoring', server: monitoringServer, port: 3005 });

    // Start all servers in parallel
    console.log('Starting all servers...');
    const startPromises = servers.map(async ({ name, server, port }) => {
      console.log(`Starting ${name} server on port ${port}...`);
      await server.start();
      console.log(`✅ ${name} server started on port ${port}`);
    });
    
    await Promise.all(startPromises);
    
    // Give servers a moment to fully start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test all health endpoints
    console.log('\n🏥 Testing health endpoints...');
    const healthPromises = servers.map(async ({ name, port }) => {
      try {
        const response = await fetch(`http://localhost:${port}/health`);
        if (response.ok) {
          const health = await response.json();
          console.log(`✅ ${name} (port ${port}): ${health.status}`);
          return { name, port, status: 'healthy', health };
        } else {
          console.log(`❌ ${name} (port ${port}): HTTP ${response.status}`);
          return { name, port, status: 'unhealthy', error: response.status };
        }
      } catch (error) {
        console.log(`❌ ${name} (port ${port}): ${error}`);
        return { name, port, status: 'error', error: error.message };
      }
    });
    
    const healthResults = await Promise.all(healthPromises);
    
    // Test all stats endpoints
    console.log('\n📊 Testing stats endpoints...');
    const statsPromises = servers.map(async ({ name, port }) => {
      try {
        const response = await fetch(`http://localhost:${port}/stats`);
        if (response.ok) {
          const stats = await response.json();
          console.log(`✅ ${name} stats: ${stats.transport.activeConnections} connections`);
          return { name, port, stats };
        } else {
          console.log(`❌ ${name} stats: HTTP ${response.status}`);
          return { name, port, error: response.status };
        }
      } catch (error) {
        console.log(`❌ ${name} stats: ${error}`);
        return { name, port, error: error.message };
      }
    });
    
    const statsResults = await Promise.all(statsPromises);
    
    // Test server status methods
    console.log('\n🔍 Testing server status methods...');
    servers.forEach(({ name, server, port }) => {
      try {
        const status = server.getStatus();
        console.log(`✅ ${name} status: started=${status.started}, connections=${status.connections}`);
      } catch (error) {
        console.log(`❌ ${name} status error: ${error}`);
      }
    });
    
    // Test health check methods
    console.log('\n🩺 Testing health check methods...');
    const healthCheckPromises = servers.map(async ({ name, server }) => {
      try {
        const health = await server.healthCheck();
        console.log(`✅ ${name} health check: ${health.status}`);
        return { name, health };
      } catch (error) {
        console.log(`❌ ${name} health check error: ${error}`);
        return { name, error: error.message };
      }
    });
    
    await Promise.all(healthCheckPromises);
    
    // Summary
    console.log('\n📋 Summary:');
    const healthyCount = healthResults.filter(r => r.status === 'healthy').length;
    console.log(`✅ ${healthyCount}/${servers.length} servers are healthy`);
    
    if (healthyCount === servers.length) {
      console.log('🎉 All MCP servers are running successfully!');
    } else {
      console.log('⚠️  Some servers have issues');
    }
    
    // Test port availability
    console.log('\n🔌 Testing port availability...');
    const portPromises = [3001, 3002, 3003, 3004, 3005].map(async (port) => {
      try {
        const response = await fetch(`http://localhost:${port}/health`, { 
          signal: AbortSignal.timeout(1000) 
        });
        console.log(`✅ Port ${port}: Available (${response.status})`);
        return { port, available: true };
      } catch (error) {
        console.log(`❌ Port ${port}: Not available`);
        return { port, available: false };
      }
    });
    
    const portResults = await Promise.all(portPromises);
    const availablePorts = portResults.filter(r => r.available).length;
    console.log(`📊 ${availablePorts}/5 ports are responding to HTTP requests`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Clean up - stop all servers
    console.log('\n🧹 Cleaning up servers...');
    const stopPromises = servers.map(async ({ name, server }) => {
      try {
        console.log(`Stopping ${name} server...`);
        await server.stop();
        console.log(`✅ ${name} server stopped`);
      } catch (error) {
        console.log(`❌ Error stopping ${name} server:`, error);
      }
    });
    
    await Promise.allSettled(stopPromises);
    console.log('🏁 All cleanup completed');
  }
}

// Run the test
testAllHTTPMCPServers().catch(console.error);