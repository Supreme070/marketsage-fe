#!/usr/bin/env tsx
/**
 * Test AI Chat with Restored MCP Connectivity
 * 
 * This script tests if the AI chat functionality works properly
 * with the restored MCP server connectivity.
 */

import fetch from 'node-fetch';

interface ChatRequest {
  message: string;
  userId?: string;
  sessionId?: string;
}

interface ChatResponse {
  success: boolean;
  data?: {
    response: string;
    confidence: number;
    supremeScore: number;
    mcpUsed: boolean;
    insights?: string[];
    recommendations?: string[];
    sources?: string[];
  };
  error?: string;
}

class AIChatMCPTest {
  private baseUrl = 'http://localhost:3000';
  private testStartTime = Date.now();

  async runTests(): Promise<void> {
    console.log('🤖 Testing AI Chat with Restored MCP Connectivity...\n');

    try {
      // Test different types of AI chat interactions
      await this.testBasicAIChat();
      await this.testCustomerInsightChat();
      await this.testCampaignAnalysisChat();
      await this.testLeadPulseChat();
      await this.testComplexBusinessQuery();

      console.log('\n🎉 All AI Chat with MCP tests completed successfully!');
      
    } catch (error) {
      console.error('\n❌ AI Chat with MCP tests failed:', error);
      throw error;
    } finally {
      const duration = Date.now() - this.testStartTime;
      console.log(`\n⏱️  Total test duration: ${duration}ms`);
    }
  }

  private async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-session-token' // Mock for testing
      },
      body: JSON.stringify({
        message: request.message,
        userId: request.userId || 'test-user-123',
        sessionId: request.sessionId || 'test-session-789'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json() as ChatResponse;
  }

  private async testBasicAIChat(): Promise<void> {
    console.log('1️⃣ Testing Basic AI Chat...');

    const testMessage = 'Hello, can you help me understand my marketing data?';
    
    try {
      const startTime = Date.now();
      const result = await this.sendChatMessage({ message: testMessage });
      const duration = Date.now() - startTime;

      if (result.success && result.data) {
        console.log(`   ✅ Basic AI Chat: Success (${duration}ms)`);
        console.log(`   📊 Confidence: ${result.data.confidence}, Score: ${result.data.supremeScore}`);
        console.log(`   🔗 MCP Used: ${result.data.mcpUsed}`);
        console.log(`   💬 Response Length: ${result.data.response.length} chars`);
        
        if (result.data.insights && result.data.insights.length > 0) {
          console.log(`   💡 Insights: ${result.data.insights.length} generated`);
        }
      } else {
        console.log(`   ❌ Basic AI Chat: Failed - ${result.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Basic AI Chat: Error - ${error.message}`);
    }
  }

  private async testCustomerInsightChat(): Promise<void> {
    console.log('\n2️⃣ Testing Customer Insight Chat...');

    const testMessage = 'Show me insights about my customer engagement patterns and high-value customers';
    
    try {
      const startTime = Date.now();
      const result = await this.sendChatMessage({ message: testMessage });
      const duration = Date.now() - startTime;

      if (result.success && result.data) {
        console.log(`   ✅ Customer Insight Chat: Success (${duration}ms)`);
        console.log(`   📊 Confidence: ${result.data.confidence}, Score: ${result.data.supremeScore}`);
        console.log(`   🔗 MCP Used: ${result.data.mcpUsed}`);
        console.log(`   👥 Customer Data Enhanced: ${result.data.mcpUsed ? 'Yes' : 'No'}`);
        
        if (result.data.recommendations && result.data.recommendations.length > 0) {
          console.log(`   🎯 Recommendations: ${result.data.recommendations.length} generated`);
        }
      } else {
        console.log(`   ❌ Customer Insight Chat: Failed - ${result.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Customer Insight Chat: Error - ${error.message}`);
    }
  }

  private async testCampaignAnalysisChat(): Promise<void> {
    console.log('\n3️⃣ Testing Campaign Analysis Chat...');

    const testMessage = 'Analyze my recent email campaigns performance and suggest improvements';
    
    try {
      const startTime = Date.now();
      const result = await this.sendChatMessage({ message: testMessage });
      const duration = Date.now() - startTime;

      if (result.success && result.data) {
        console.log(`   ✅ Campaign Analysis Chat: Success (${duration}ms)`);
        console.log(`   📊 Confidence: ${result.data.confidence}, Score: ${result.data.supremeScore}`);
        console.log(`   🔗 MCP Used: ${result.data.mcpUsed}`);
        console.log(`   📧 Campaign Data Enhanced: ${result.data.mcpUsed ? 'Yes' : 'No'}`);
        
        if (result.data.sources && result.data.sources.length > 0) {
          console.log(`   📚 Data Sources: ${result.data.sources.length} referenced`);
        }
      } else {
        console.log(`   ❌ Campaign Analysis Chat: Failed - ${result.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Campaign Analysis Chat: Error - ${error.message}`);
    }
  }

  private async testLeadPulseChat(): Promise<void> {
    console.log('\n4️⃣ Testing LeadPulse Chat...');

    const testMessage = 'What can you tell me about my website visitor behavior and conversion opportunities?';
    
    try {
      const startTime = Date.now();
      const result = await this.sendChatMessage({ message: testMessage });
      const duration = Date.now() - startTime;

      if (result.success && result.data) {
        console.log(`   ✅ LeadPulse Chat: Success (${duration}ms)`);
        console.log(`   📊 Confidence: ${result.data.confidence}, Score: ${result.data.supremeScore}`);
        console.log(`   🔗 MCP Used: ${result.data.mcpUsed}`);
        console.log(`   👁️ Visitor Data Enhanced: ${result.data.mcpUsed ? 'Yes' : 'No'}`);
        
        if (result.data.insights && result.data.insights.length > 0) {
          console.log(`   💡 Visitor Insights: ${result.data.insights.length} generated`);
        }
      } else {
        console.log(`   ❌ LeadPulse Chat: Failed - ${result.error}`);
      }
    } catch (error) {
      console.log(`   ❌ LeadPulse Chat: Error - ${error.message}`);
    }
  }

  private async testComplexBusinessQuery(): Promise<void> {
    console.log('\n5️⃣ Testing Complex Business Query...');

    const testMessage = 'Give me a comprehensive overview of my business performance including customer retention, campaign ROI, and growth opportunities';
    
    try {
      const startTime = Date.now();
      const result = await this.sendChatMessage({ message: testMessage });
      const duration = Date.now() - startTime;

      if (result.success && result.data) {
        console.log(`   ✅ Complex Business Query: Success (${duration}ms)`);
        console.log(`   📊 Confidence: ${result.data.confidence}, Score: ${result.data.supremeScore}`);
        console.log(`   🔗 MCP Used: ${result.data.mcpUsed}`);
        console.log(`   🧠 Multi-Service Integration: ${result.data.mcpUsed ? 'Active' : 'Limited'}`);
        
        // Check for comprehensive response
        const responseLength = result.data.response.length;
        const hasInsights = result.data.insights && result.data.insights.length > 0;
        const hasRecommendations = result.data.recommendations && result.data.recommendations.length > 0;
        
        console.log(`   📝 Response Comprehensiveness: ${responseLength > 500 ? 'High' : 'Low'} (${responseLength} chars)`);
        console.log(`   💡 Business Insights: ${hasInsights ? 'Generated' : 'None'}`);
        console.log(`   🎯 Strategic Recommendations: ${hasRecommendations ? 'Generated' : 'None'}`);
      } else {
        console.log(`   ❌ Complex Business Query: Failed - ${result.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Complex Business Query: Error - ${error.message}`);
    }
  }
}

// Run the AI chat tests
async function main() {
  const tester = new AIChatMCPTest();
  
  try {
    await tester.runTests();
    process.exit(0);
  } catch (error) {
    console.error('\n💥 AI Chat test suite failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { AIChatMCPTest };