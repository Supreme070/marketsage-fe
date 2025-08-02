/**
 * Test Supreme-AI v3 MCP Connectivity
 * 
 * This script tests if Supreme-AI v3 can successfully communicate with
 * the HTTP MCP servers running on ports 3001-3005.
 */

import { getSupremeAIV3WithMCP } from '../lib/ai/supreme-ai-v3-mcp-integration';
import { getMCPServerManager } from '../mcp/mcp-server-manager';
import { isMCPEnabled } from '../mcp/config/mcp-config';
import type { MCPAuthContext } from '../mcp/types/mcp-types';
import type { SupremeAIv3Task } from '../lib/ai/supreme-ai-v3-engine';

class SupremeAIMCPConnectivityTest {
  private supremeAI = getSupremeAIV3WithMCP();
  private testStartTime = Date.now();

  async runTests(): Promise<void> {
    console.log('🧪 Testing Supreme-AI v3 ↔ MCP Server Connectivity...\n');

    try {
      // Step 1: Check MCP Configuration
      await this.testMCPConfiguration();

      // Step 2: Check MCP Server Manager
      await this.testMCPServerManager();

      // Step 3: Test HTTP MCP Server Connectivity
      await this.testHTTPMCPServers();

      // Step 4: Test Supreme-AI v3 MCP Integration
      await this.testSupremeAIMCPIntegration();

      // Step 5: Test End-to-End AI Tasks with MCP
      await this.testEndToEndAITasks();

      console.log('\n🎉 All Supreme-AI v3 ↔ MCP connectivity tests completed successfully!');
      
    } catch (error) {
      console.error('\n❌ Supreme-AI v3 ↔ MCP connectivity tests failed:', error);
      throw error;
    } finally {
      const duration = Date.now() - this.testStartTime;
      console.log(`\n⏱️  Total test duration: ${duration}ms`);
    }
  }

  private async testMCPConfiguration(): Promise<void> {
    console.log('1️⃣ Testing MCP Configuration...');

    const mcpEnabled = isMCPEnabled();
    console.log(`   ✅ MCP Enabled: ${mcpEnabled}`);

    if (!mcpEnabled) {
      throw new Error('MCP is not enabled - check environment configuration');
    }
  }

  private async testMCPServerManager(): Promise<void> {
    console.log('\n2️⃣ Testing MCP Server Manager...');

    try {
      const mcpManager = getMCPServerManager();
      console.log('   ✅ MCP Server Manager instance created');

      const serverStatus = mcpManager.getServerStatus();
      console.log(`   📊 Server Status:`, {
        enabled: serverStatus.enabled,
        started: serverStatus.started,
        serverCount: serverStatus.servers.length
      });

      // List all available servers
      serverStatus.servers.forEach(server => {
        const status = server.enabled ? (server.running ? '🟢 Running' : '🟡 Enabled but not running') : '🔴 Disabled';
        console.log(`   ${status} ${server.name} server`);
      });

    } catch (error) {
      console.error('   ❌ MCP Server Manager test failed:', error);
      throw error;
    }
  }

  private async testHTTPMCPServers(): Promise<void> {
    console.log('\n3️⃣ Testing HTTP MCP Server Connectivity...');

    const servers = [
      { name: 'Customer Data', port: 3001 },
      { name: 'Campaign Analytics', port: 3002 },
      { name: 'LeadPulse', port: 3003 },
      { name: 'External Services', port: 3004 },
      { name: 'Monitoring', port: 3005 }
    ];

    const healthCheckPromises = servers.map(async ({ name, port }) => {
      try {
        const response = await fetch(`http://localhost:${port}/health`, {
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          const health = await response.json();
          console.log(`   ✅ ${name} (port ${port}): ${health.status}`);
          return { name, port, status: 'healthy', health };
        } else {
          console.log(`   ❌ ${name} (port ${port}): HTTP ${response.status}`);
          return { name, port, status: 'unhealthy', error: response.status };
        }
      } catch (error) {
        console.log(`   ❌ ${name} (port ${port}): ${error.message}`);
        return { name, port, status: 'error', error: error.message };
      }
    });

    const healthResults = await Promise.all(healthCheckPromises);
    const healthyCount = healthResults.filter(r => r.status === 'healthy').length;
    
    console.log(`   📊 Server Health Summary: ${healthyCount}/${servers.length} servers healthy`);

    if (healthyCount === 0) {
      throw new Error('No HTTP MCP servers are responding - start them first with npm run start:with-mcp or run src/mcp/test-all-http-mcp.ts');
    }

    if (healthyCount < servers.length) {
      console.log('   ⚠️  Some MCP servers are not responding, but continuing with available servers...');
    }
  }

  private async testSupremeAIMCPIntegration(): Promise<void> {
    console.log('\n4️⃣ Testing Supreme-AI v3 MCP Integration...');

    try {
      // Create mock auth context for testing
      const mockAuthContext: MCPAuthContext = {
        userId: 'test-user-123',
        organizationId: 'test-org-456',
        role: 'USER',
        permissions: ['read:own:contacts', 'read:own:campaigns'],
        sessionId: 'test-session-789'
      };

      // Initialize MCP integration
      await this.supremeAI.initializeMCPIntegration(mockAuthContext);
      console.log('   ✅ Supreme-AI v3 MCP integration initialized');

      // Test basic connectivity
      const testResponse = await this.supremeAI.processWithMCP({
        type: 'question',
        userId: mockAuthContext.userId,
        question: 'What is the status of MCP integration?'
      }, 'mock-session-token');

      console.log('   ✅ Supreme-AI v3 MCP processing successful');
      console.log(`   📊 Response confidence: ${testResponse.confidence}`);
      console.log(`   📊 Supreme score: ${testResponse.supremeScore}`);
      console.log(`   🔗 MCP used: ${testResponse.data.mcpUsed}`);

      if (testResponse.insights && testResponse.insights.length > 0) {
        console.log(`   💡 Insights: ${testResponse.insights.length} generated`);
      }

      if (testResponse.recommendations && testResponse.recommendations.length > 0) {
        console.log(`   🎯 Recommendations: ${testResponse.recommendations.length} generated`);
      }

    } catch (error) {
      console.error('   ❌ Supreme-AI v3 MCP integration test failed:', error);
      throw error;
    }
  }

  private async testEndToEndAITasks(): Promise<void> {
    console.log('\n5️⃣ Testing End-to-End AI Tasks with MCP...');

    const testTasks: SupremeAIv3Task[] = [
      {
        type: 'question',
        userId: 'test-user-123',
        question: 'How are my campaigns performing this month?'
      },
      {
        type: 'analyze',
        userId: 'test-user-123',
        question: 'Analyze customer engagement trends'
      },
      {
        type: 'customer',
        userId: 'test-user-123',
        customers: [
          { email: 'test@example.com', name: 'Test Customer' }
        ]
      },
      {
        type: 'leadpulse_insights',
        userId: 'test-user-123',
        timeRange: '30d',
        context: { source: 'connectivity_test' }
      }
    ];

    const taskResults = [];

    for (const task of testTasks) {
      try {
        console.log(`   🔍 Testing ${task.type} task...`);
        
        const startTime = Date.now();
        const result = await this.supremeAI.processWithMCP(task, 'mock-session-token');
        const duration = Date.now() - startTime;

        if (result.success) {
          console.log(`   ✅ ${task.type}: Success (${duration}ms)`);
          console.log(`      💎 Confidence: ${result.confidence}, Score: ${result.supremeScore}`);
          console.log(`      🔗 MCP Used: ${result.data.mcpUsed}`);
          
          taskResults.push({
            taskType: task.type,
            success: true,
            duration,
            confidence: result.confidence,
            mcpUsed: result.data.mcpUsed
          });
        } else {
          console.log(`   ⚠️  ${task.type}: Completed with limitations`);
          taskResults.push({
            taskType: task.type,
            success: false,
            duration,
            error: 'Limited functionality'
          });
        }
      } catch (error) {
        console.log(`   ❌ ${task.type}: Failed - ${error.message}`);
        taskResults.push({
          taskType: task.type,
          success: false,
          error: error.message
        });
      }
    }

    // Summary
    const successCount = taskResults.filter(r => r.success).length;
    const mcpUsedCount = taskResults.filter(r => r.mcpUsed).length;
    
    console.log(`\n   📊 Task Execution Summary:`);
    console.log(`      ✅ Successful: ${successCount}/${testTasks.length} tasks`);
    console.log(`      🔗 MCP Enhanced: ${mcpUsedCount}/${testTasks.length} tasks`);
    
    if (successCount === 0) {
      throw new Error('No AI tasks completed successfully');
    }

    const avgConfidence = taskResults
      .filter(r => r.confidence)
      .reduce((sum, r) => sum + r.confidence, 0) / successCount;
    
    if (avgConfidence > 0) {
      console.log(`      💎 Average Confidence: ${avgConfidence.toFixed(2)}`);
    }

    console.log(`\n   🎯 Supreme-AI v3 ↔ MCP connectivity is ${mcpUsedCount > 0 ? 'WORKING' : 'LIMITED'}`);
  }
}

// Run the connectivity test
async function main() {
  const tester = new SupremeAIMCPConnectivityTest();
  
  try {
    await tester.runTests();
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { SupremeAIMCPConnectivityTest };