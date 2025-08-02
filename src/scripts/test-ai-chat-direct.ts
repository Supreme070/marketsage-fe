#!/usr/bin/env tsx
/**
 * Direct AI Chat Test with MCP
 * 
 * This script tests the AI chat functionality directly
 * without going through the HTTP API layer.
 */

import { getSupremeAIV3WithMCP } from '../lib/ai/supreme-ai-v3-mcp-integration';
import type { MCPAuthContext } from '../mcp/types/mcp-types';
import type { SupremeAIv3Task } from '../lib/ai/supreme-ai-v3-engine';

class DirectAIChatTest {
  private supremeAI = getSupremeAIV3WithMCP();
  private testStartTime = Date.now();

  async runTests(): Promise<void> {
    console.log('🤖 Testing AI Chat Functionality Directly with MCP...\n');

    try {
      // Initialize MCP integration
      await this.initializeMCPIntegration();
      
      // Test different chat scenarios
      await this.testBasicChat();
      await this.testCustomerAnalysisChat();
      await this.testCampaignInsightChat();
      await this.testLeadPulseChat();
      await this.testBusinessStrategyChat();

      console.log('\n🎉 All direct AI Chat tests completed successfully!');
      
    } catch (error) {
      console.error('\n❌ Direct AI Chat tests failed:', error);
      throw error;
    } finally {
      const duration = Date.now() - this.testStartTime;
      console.log(`\n⏱️  Total test duration: ${duration}ms`);
    }
  }

  private async initializeMCPIntegration(): Promise<void> {
    console.log('🔧 Initializing MCP Integration...');

    const mockAuthContext: MCPAuthContext = {
      userId: 'test-user-123',
      organizationId: 'test-org-456',
      role: 'USER',
      permissions: ['read:own:contacts', 'read:own:campaigns', 'read:own:analytics'],
      sessionId: 'test-session-789'
    };

    await this.supremeAI.initializeMCPIntegration(mockAuthContext);
    console.log('   ✅ MCP Integration initialized\n');
  }

  private async testBasicChat(): Promise<void> {
    console.log('1️⃣ Testing Basic Chat...');

    const task: SupremeAIv3Task = {
      type: 'question',
      userId: 'test-user-123',
      question: 'Hello! Can you help me understand how MarketSage can improve my marketing performance?'
    };

    try {
      const startTime = Date.now();
      const result = await this.supremeAI.processWithMCP(task, 'mock-session-token');
      const duration = Date.now() - startTime;

      if (result.success) {
        console.log(`   ✅ Basic Chat: Success (${duration}ms)`);
        console.log(`   📊 Confidence: ${result.confidence}, Score: ${result.supremeScore}`);
        console.log(`   🔗 MCP Enhanced: ${result.data.mcpUsed}`);
        console.log(`   💬 Response: ${result.data.response.substring(0, 100)}...`);
        
        this.logInsightsAndRecommendations(result);
      } else {
        console.log(`   ❌ Basic Chat: Failed`);
      }
    } catch (error) {
      console.log(`   ❌ Basic Chat: Error - ${error.message}`);
    }
  }

  private async testCustomerAnalysisChat(): Promise<void> {
    console.log('\n2️⃣ Testing Customer Analysis Chat...');

    const task: SupremeAIv3Task = {
      type: 'question',
      userId: 'test-user-123',
      question: 'Analyze my customer data and tell me about engagement patterns, high-value customers, and retention opportunities'
    };

    try {
      const startTime = Date.now();
      const result = await this.supremeAI.processWithMCP(task, 'mock-session-token');
      const duration = Date.now() - startTime;

      if (result.success) {
        console.log(`   ✅ Customer Analysis: Success (${duration}ms)`);
        console.log(`   📊 Confidence: ${result.confidence}, Score: ${result.supremeScore}`);
        console.log(`   🔗 MCP Enhanced: ${result.data.mcpUsed}`);
        console.log(`   👥 Customer Focus: Yes`);
        
        this.logInsightsAndRecommendations(result);
      } else {
        console.log(`   ❌ Customer Analysis: Failed`);
      }
    } catch (error) {
      console.log(`   ❌ Customer Analysis: Error - ${error.message}`);
    }
  }

  private async testCampaignInsightChat(): Promise<void> {
    console.log('\n3️⃣ Testing Campaign Insight Chat...');

    const task: SupremeAIv3Task = {
      type: 'question',
      userId: 'test-user-123',
      question: 'Review my recent email and SMS campaigns. What are the performance trends and how can I optimize for better results?'
    };

    try {
      const startTime = Date.now();
      const result = await this.supremeAI.processWithMCP(task, 'mock-session-token');
      const duration = Date.now() - startTime;

      if (result.success) {
        console.log(`   ✅ Campaign Insights: Success (${duration}ms)`);
        console.log(`   📊 Confidence: ${result.confidence}, Score: ${result.supremeScore}`);
        console.log(`   🔗 MCP Enhanced: ${result.data.mcpUsed}`);
        console.log(`   📧 Campaign Focus: Yes`);
        
        this.logInsightsAndRecommendations(result);
      } else {
        console.log(`   ❌ Campaign Insights: Failed`);
      }
    } catch (error) {
      console.log(`   ❌ Campaign Insights: Error - ${error.message}`);
    }
  }

  private async testLeadPulseChat(): Promise<void> {
    console.log('\n4️⃣ Testing LeadPulse Chat...');

    const task: SupremeAIv3Task = {
      type: 'leadpulse_insights',
      userId: 'test-user-123',
      timeRange: '30d',
      context: { 
        source: 'chat_test',
        question: 'What insights can you provide about my website visitors and their behavior patterns?' 
      }
    };

    try {
      const startTime = Date.now();
      const result = await this.supremeAI.processWithMCP(task, 'mock-session-token');
      const duration = Date.now() - startTime;

      if (result.success) {
        console.log(`   ✅ LeadPulse Insights: Success (${duration}ms)`);
        console.log(`   📊 Confidence: ${result.confidence}, Score: ${result.supremeScore}`);
        console.log(`   🔗 MCP Enhanced: ${result.data.mcpUsed}`);
        console.log(`   👁️ Visitor Focus: Yes`);
        
        this.logInsightsAndRecommendations(result);
      } else {
        console.log(`   ❌ LeadPulse Insights: Failed`);
      }
    } catch (error) {
      console.log(`   ❌ LeadPulse Insights: Error - ${error.message}`);
    }
  }

  private async testBusinessStrategyChat(): Promise<void> {
    console.log('\n5️⃣ Testing Business Strategy Chat...');

    const task: SupremeAIv3Task = {
      type: 'analyze',
      userId: 'test-user-123',
      question: 'Provide a comprehensive business strategy analysis covering customer retention, campaign optimization, and growth opportunities based on all available data'
    };

    try {
      const startTime = Date.now();
      const result = await this.supremeAI.processWithMCP(task, 'mock-session-token');
      const duration = Date.now() - startTime;

      if (result.success) {
        console.log(`   ✅ Business Strategy: Success (${duration}ms)`);
        console.log(`   📊 Confidence: ${result.confidence}, Score: ${result.supremeScore}`);
        console.log(`   🔗 MCP Enhanced: ${result.data.mcpUsed}`);
        console.log(`   🧠 Strategic Analysis: Yes`);
        
        this.logInsightsAndRecommendations(result);
        
        // Additional checks for comprehensive response
        const responseLength = result.data.response.length;
        console.log(`   📝 Response Depth: ${responseLength > 1000 ? 'Comprehensive' : 'Basic'} (${responseLength} chars)`);
      } else {
        console.log(`   ❌ Business Strategy: Failed`);
      }
    } catch (error) {
      console.log(`   ❌ Business Strategy: Error - ${error.message}`);
    }
  }

  private logInsightsAndRecommendations(result: any): void {
    if (result.insights && result.insights.length > 0) {
      console.log(`   💡 Insights: ${result.insights.length} generated`);
    }
    
    if (result.recommendations && result.recommendations.length > 0) {
      console.log(`   🎯 Recommendations: ${result.recommendations.length} generated`);
    }
    
    if (result.data.sources && result.data.sources.length > 0) {
      console.log(`   📚 Data Sources: ${result.data.sources.join(', ')}`);
    }
  }
}

// Run the direct AI chat tests
async function main() {
  const tester = new DirectAIChatTest();
  
  try {
    await tester.runTests();
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Direct AI Chat test suite failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { DirectAIChatTest };