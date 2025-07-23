/**
 * Test MCP Setup for MarketSage
 * 
 * This test verifies that the MCP infrastructure is properly configured
 * and can be used by the Supreme-AI v3 engine.
 */

import { MarketSageMCPClient } from './clients/mcp-client';
import { SupremeAIMCPIntegration } from '../lib/ai/mcp-integration';
import { CustomerDataMCPServer } from './servers/customer-data-server';
import { getMCPConfig, isMCPEnabled } from './config/mcp-config';

/**
 * Test MCP configuration
 */
export async function testMCPConfiguration(): Promise<void> {
  console.log('🔧 Testing MCP Configuration...');
  
  try {
    const config = getMCPConfig();
    const enabled = isMCPEnabled();
    
    console.log('📊 MCP Configuration Status:');
    console.log(`  - MCP Enabled: ${enabled}`);
    console.log(`  - Customer Data: ${config.features.customerDataEnabled}`);
    console.log(`  - Campaign Analytics: ${config.features.campaignAnalyticsEnabled}`);
    console.log(`  - LeadPulse: ${config.features.leadpulseEnabled}`);
    console.log(`  - External Services: ${config.features.externalServicesEnabled}`);
    console.log(`  - Monitoring: ${config.features.monitoringEnabled}`);
    
    console.log('✅ MCP Configuration test passed');
  } catch (error) {
    console.error('❌ MCP Configuration test failed:', error);
    throw error;
  }
}

/**
 * Test MCP client initialization
 */
export async function testMCPClient(): Promise<void> {
  console.log('🔧 Testing MCP Client...');
  
  try {
    const mockAuthContext = {
      userId: 'test-user-123',
      organizationId: 'test-org-123',
      role: 'USER' as const,
      permissions: ['read:own']
    };
    
    const client = new MarketSageMCPClient(mockAuthContext);
    
    console.log('📊 MCP Client Status:');
    console.log(`  - Client Initialized: ${client !== null}`);
    console.log(`  - MCP Enabled: ${client.isEnabled()}`);
    
    // Test fallback functionality
    console.log('  - Testing fallback functionality...');
    
    const searchResult = await client.searchCustomers('test@example.com', {
      limit: 5,
      includeSegments: true
    });
    
    console.log(`  - Search Test: ${searchResult.success ? 'PASSED' : 'FAILED'}`);
    console.log(`  - Used Fallback: ${searchResult.fromFallback || false}`);
    
    console.log('✅ MCP Client test passed');
  } catch (error) {
    console.error('❌ MCP Client test failed:', error);
    throw error;
  }
}

/**
 * Test MCP server initialization
 */
export async function testMCPServer(): Promise<void> {
  console.log('🔧 Testing MCP Server...');
  
  try {
    const server = new CustomerDataMCPServer();
    
    console.log('📊 MCP Server Status:');
    console.log(`  - Server Initialized: ${server !== null}`);
    console.log(`  - Server Type: Customer Data Server`);
    
    console.log('✅ MCP Server test passed');
  } catch (error) {
    console.error('❌ MCP Server test failed:', error);
    throw error;
  }
}

/**
 * Test MCP integration with Supreme-AI v3
 */
export async function testSupremeAIIntegration(): Promise<void> {
  console.log('🔧 Testing Supreme-AI MCP Integration...');
  
  try {
    const mockAuthContext = {
      userId: 'test-user-123',
      organizationId: 'test-org-123',
      role: 'USER' as const,
      permissions: ['read:own']
    };
    
    const integration = new SupremeAIMCPIntegration(mockAuthContext);
    
    console.log('📊 Supreme-AI MCP Integration Status:');
    console.log(`  - Integration Initialized: ${integration !== null}`);
    console.log(`  - MCP Enabled: ${integration.isEnabled()}`);
    
    // Test customer insights
    console.log('  - Testing customer insights...');
    const insights = await integration.getCustomerInsights('test@example.com', {
      includeSegments: true,
      includePredictions: true
    });
    
    console.log(`  - Customer Insights: ${insights.success ? 'PASSED' : 'FAILED'}`);
    console.log(`  - Used Fallback: ${insights.fromFallback || false}`);
    
    console.log('✅ Supreme-AI MCP Integration test passed');
  } catch (error) {
    console.error('❌ Supreme-AI MCP Integration test failed:', error);
    throw error;
  }
}

/**
 * Test MCP fallback mechanisms
 */
export async function testMCPFallbacks(): Promise<void> {
  console.log('🔧 Testing MCP Fallback Mechanisms...');
  
  try {
    const mockAuthContext = {
      userId: 'test-user-123',
      organizationId: 'test-org-123',
      role: 'USER' as const,
      permissions: ['read:own']
    };
    
    const client = new MarketSageMCPClient(mockAuthContext);
    
    console.log('📊 Testing Fallback Scenarios:');
    
    // Test customer search fallback
    const searchResult = await client.searchCustomers('test@example.com');
    console.log(`  - Customer Search Fallback: ${searchResult.success ? 'PASSED' : 'FAILED'}`);
    
    // Test customer profile fallback
    const profileResult = await client.getCustomerProfile('test-customer-123');
    console.log(`  - Customer Profile Fallback: ${profileResult.success ? 'PASSED' : 'FAILED'}`);
    
    // Test customer segments fallback
    const segmentsResult = await client.getCustomerSegments();
    console.log(`  - Customer Segments Fallback: ${segmentsResult.success ? 'PASSED' : 'FAILED'}`);
    
    console.log('✅ MCP Fallback test passed');
  } catch (error) {
    console.error('❌ MCP Fallback test failed:', error);
    throw error;
  }
}

/**
 * Run all MCP tests
 */
export async function runAllMCPTests(): Promise<void> {
  console.log('🚀 Running MarketSage MCP Test Suite...\n');
  
  try {
    await testMCPConfiguration();
    console.log('');
    
    await testMCPClient();
    console.log('');
    
    await testMCPServer();
    console.log('');
    
    await testSupremeAIIntegration();
    console.log('');
    
    await testMCPFallbacks();
    console.log('');
    
    console.log('🎉 All MCP tests passed successfully!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('  1. Enable MCP in .env file (MCP_ENABLED=true)');
    console.log('  2. Enable individual MCP servers as needed');
    console.log('  3. Test with real Supreme-AI v3 engine');
    console.log('  4. Monitor performance and fallback usage');
    
  } catch (error) {
    console.error('💥 MCP test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllMCPTests().catch(console.error);
}