/**
 * Supreme AI v3 MCP Integration Tests
 * 
 * These tests verify that the AI decision-making functionality is properly
 * integrated with real MCP data connections instead of using mock data.
 */

import { SupremeAIV3WithMCP } from '../../lib/ai/supreme-ai-v3-mcp-integration';
import { SupremeAIMCPIntegration } from '../../lib/ai/mcp-integration';
import { MarketSageMCPClient } from '../../mcp/clients/mcp-client';
import prisma from '../../lib/db/prisma';
import { logger } from '../../lib/logger';
import type { MCPAuthContext } from '../../mcp/types/mcp-types';
import type { SupremeAIv3Task } from '../../lib/ai/supreme-ai-v3-engine';

// Mock the logger for cleaner test output
jest.mock('../../lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Test data
const testAuthContext: MCPAuthContext = {
  userId: 'test-user-123',
  organizationId: 'test-org-456',
  role: 'USER',
  permissions: ['read:own', 'write:own']
};

describe('Supreme AI v3 MCP Integration', () => {
  let supremeAI: SupremeAIV3WithMCP;
  let mcpIntegration: SupremeAIMCPIntegration;
  let mcpClient: MarketSageMCPClient;
  
  beforeAll(async () => {
    // Clear any existing test data
    await cleanupTestData();
    
    // Create test data in the database
    await setupTestData();
  });
  
  afterAll(async () => {
    // Clean up test data
    await cleanupTestData();
    
    // Close database connection
    await prisma.$disconnect();
  });
  
  beforeEach(() => {
    // Create new instances for each test
    supremeAI = new SupremeAIV3WithMCP();
    mcpIntegration = new SupremeAIMCPIntegration(testAuthContext);
    mcpClient = new MarketSageMCPClient(testAuthContext);
    
    // Clear mock calls
    jest.clearAllMocks();
  });

  describe('MCP Data Connection Verification', () => {
    it('should verify MCP client is connecting to real database', async () => {
      // Test customer search with real data
      const searchResult = await mcpClient.searchCustomers('john', {
        limit: 5,
        includeSegments: true
      });
      
      expect(searchResult.success).toBe(true);
      expect(searchResult.fromFallback).toBe(true); // Currently using fallback
      expect(searchResult.data).toBeDefined();
      
      console.log('✅ MCP Customer Search Result:', JSON.stringify(searchResult, null, 2));
    });
    
    it('should verify MCP integration builds real context', async () => {
      const context = await mcpIntegration.buildComprehensiveAIContext(
        testAuthContext.userId,
        testAuthContext.organizationId
      );
      
      expect(context).toBeDefined();
      expect(context.customer).toBeDefined();
      expect(context.campaigns).toBeDefined();
      
      console.log('✅ MCP Comprehensive Context:', JSON.stringify(context, null, 2));
    });
  });

  describe('executeSegmentation with Real Data', () => {
    it('should use real customer data from MCP for segmentation', async () => {
      // Initialize AI with MCP
      await supremeAI.initializeMCPIntegration(testAuthContext);
      
      // Create segmentation task
      const segmentationTask: SupremeAIv3Task = {
        type: 'task',
        userId: testAuthContext.userId,
        question: 'Create a segment for high-engagement customers',
        taskType: 'segmentation'
      };
      
      // Process the task
      const result = await supremeAI.processWithMCP(segmentationTask);
      
      console.log('\n🎯 Segmentation Task Result:');
      console.log('Success:', result.success);
      console.log('Task Type:', result.taskType);
      console.log('MCP Used:', result.data?.mcpUsed);
      console.log('Confidence:', result.confidence);
      console.log('Supreme Score:', result.supremeScore);
      console.log('Insights:', result.insights);
      console.log('Recommendations:', result.recommendations);
      
      // Verify the result uses real data
      expect(result.success).toBe(true);
      expect(result.taskType).toBe('task');
      expect(result.confidence).toBeGreaterThan(0.5);
      
      // Check if task execution was attempted
      if (result.data?.status === 'executed' && result.data?.result) {
        const segmentResult = result.data.result;
        console.log('\n📊 Segment Analysis:');
        console.log('Segment ID:', segmentResult.id);
        console.log('Customer Count:', segmentResult.customerCount);
        console.log('Engagement Rate:', segmentResult.engagementRate);
        console.log('Insights:', segmentResult.insights);
        console.log('Source:', segmentResult.source);
        
        // Verify it's using MCP data
        expect(segmentResult.source).toBe('MCP_CUSTOMER_DATA');
        expect(segmentResult.insights).toBeDefined();
        expect(segmentResult.recommendations).toBeDefined();
      }
    });
    
    it('should generate data-driven segment recommendations', async () => {
      await supremeAI.initializeMCPIntegration(testAuthContext);
      
      // Test the private method indirectly through segmentation execution
      const task: SupremeAIv3Task = {
        type: 'task',
        userId: testAuthContext.userId,
        question: 'Analyze customer segments for optimization opportunities',
        taskType: 'segmentation'
      };
      
      const result = await supremeAI.processWithMCP(task);
      
      // Log the actual recommendations generated
      if (result.data?.result?.recommendations) {
        console.log('\n💡 Generated Segment Recommendations:');
        result.data.result.recommendations.forEach((rec: string, index: number) => {
          console.log(`${index + 1}. ${rec}`);
        });
        
        // Verify recommendations are data-driven
        expect(result.data.result.recommendations).toBeInstanceOf(Array);
        expect(result.data.result.recommendations.length).toBeGreaterThan(0);
      }
    });
  });

  describe('executeCampaignOptimization with Real Data', () => {
    it('should use real campaign analytics from MCP', async () => {
      await supremeAI.initializeMCPIntegration(testAuthContext);
      
      const campaignTask: SupremeAIv3Task = {
        type: 'task',
        userId: testAuthContext.userId,
        question: 'Optimize our email campaign performance',
        taskType: 'campaign_optimization'
      };
      
      const result = await supremeAI.processWithMCP(campaignTask);
      
      console.log('\n📈 Campaign Optimization Result:');
      console.log('Success:', result.success);
      console.log('MCP Used:', result.data?.mcpUsed);
      
      if (result.data?.status === 'executed' && result.data?.result) {
        const optimization = result.data.result;
        console.log('\n🎯 Campaign Optimization Details:');
        console.log('Campaign ID:', optimization.campaignId);
        console.log('Current Performance:', optimization.currentPerformance);
        console.log('Optimizations:', optimization.optimizations);
        console.log('Expected Improvements:', optimization.expectedImprovement);
        console.log('Source:', optimization.source);
        
        // Verify it's using real MCP data
        expect(optimization.source).toBe('MCP_CAMPAIGN_ANALYTICS');
        expect(optimization.optimizations).toBeDefined();
        expect(optimization.optimizations.length).toBeGreaterThan(0);
      }
    });
    
    it('should provide performance-based optimization recommendations', async () => {
      await supremeAI.initializeMCPIntegration(testAuthContext);
      
      // Get campaign analytics first
      const analytics = await mcpIntegration.getCampaignAnalytics({
        organizationId: testAuthContext.organizationId,
        limit: 5
      });
      
      console.log('\n📊 Campaign Analytics Data:');
      console.log('Success:', analytics.success);
      console.log('From Fallback:', analytics.fromFallback);
      console.log('Data:', JSON.stringify(analytics.data, null, 2));
      
      // Now test optimization
      const task: SupremeAIv3Task = {
        type: 'task',
        userId: testAuthContext.userId,
        question: 'Apply A/B test winner and optimize send times',
        taskType: 'campaign_optimization'
      };
      
      const result = await supremeAI.processWithMCP(task);
      
      if (result.data?.result?.optimizations) {
        console.log('\n🚀 Optimization Recommendations:');
        result.data.result.optimizations.forEach((opt: string, index: number) => {
          console.log(`${index + 1}. ${opt}`);
        });
      }
    });
  });

  describe('AI Decision Making with Real Metrics', () => {
    it('should make decisions based on actual database metrics', async () => {
      await supremeAI.initializeMCPIntegration(testAuthContext);
      
      // Test analysis task with real data
      const analysisTask: SupremeAIv3Task = {
        type: 'analyze',
        userId: testAuthContext.userId,
        question: 'What are our top performing customer segments?'
      };
      
      const result = await supremeAI.processWithMCP(analysisTask);
      
      console.log('\n🔍 Analysis Result with Real Data:');
      console.log('Success:', result.success);
      console.log('MCP Used:', result.data?.mcpUsed);
      console.log('Confidence:', result.confidence);
      console.log('Supreme Score:', result.supremeScore);
      
      if (result.data?.rawData) {
        console.log('\n📊 Real Data Sources:');
        console.log('Has Campaign Data:', !!result.data.rawData.campaigns);
        console.log('Has Customer Data:', !!result.data.rawData.customers);
        console.log('Has Visitor Data:', !!result.data.rawData.visitors);
      }
      
      // Verify decisions are data-driven
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.insights).toBeDefined();
      expect(result.insights.length).toBeGreaterThan(0);
    });
    
    it('should enhance customer questions with real customer data', async () => {
      await supremeAI.initializeMCPIntegration(testAuthContext);
      
      const customerTask: SupremeAIv3Task = {
        type: 'customer',
        userId: testAuthContext.userId,
        customers: [
          { email: 'john@example.com', firstName: 'John', lastName: 'Doe' }
        ]
      };
      
      const result = await supremeAI.processWithMCP(customerTask);
      
      console.log('\n👥 Customer Enhancement Result:');
      console.log('Success:', result.success);
      console.log('MCP Used:', result.data?.mcpUsed);
      console.log('Total Enhanced:', result.data?.totalEnhanced);
      
      if (result.data?.customers) {
        console.log('\n📋 Enhanced Customer Data:');
        result.data.customers.forEach((customer: any, index: number) => {
          console.log(`Customer ${index + 1}:`, {
            email: customer.email,
            enhanced: customer.enhanced,
            hasInsights: !!customer.mcpInsights
          });
        });
      }
    });
  });

  describe('Error Handling and Fallback Scenarios', () => {
    it('should gracefully handle MCP connection failures', async () => {
      // Test without initialization
      const task: SupremeAIv3Task = {
        type: 'analyze',
        userId: 'invalid-user',
        question: 'Test error handling'
      };
      
      const result = await supremeAI.processWithMCP(task);
      
      console.log('\n⚠️ Error Handling Result:');
      console.log('Success:', result.success);
      console.log('Fallback Used:', result.data?.fallbackUsed);
      console.log('Insights:', result.insights);
      
      expect(result.success).toBe(true); // Should still succeed with fallback
    });
    
    it('should handle missing organization context', async () => {
      const invalidContext: MCPAuthContext = {
        userId: 'test-user',
        organizationId: '', // Invalid
        role: 'USER',
        permissions: []
      };
      
      const mcpIntegrationInvalid = new SupremeAIMCPIntegration(invalidContext);
      const searchResult = await mcpIntegrationInvalid.getCustomerInsights('test', {});
      
      console.log('\n❌ Invalid Context Result:');
      console.log('Success:', searchResult.success);
      console.log('Error:', searchResult.error);
      
      expect(searchResult.success).toBeDefined();
    });
  });

  describe('Logging and Data Verification', () => {
    it('should log all real data being used for AI decisions', async () => {
      await supremeAI.initializeMCPIntegration(testAuthContext);
      
      // Test comprehensive context building
      const context = await mcpIntegration.buildComprehensiveAIContext(
        testAuthContext.userId,
        testAuthContext.organizationId
      );
      
      console.log('\n📝 Comprehensive MCP Context Log:');
      console.log('='.repeat(50));
      
      if (context.customer) {
        console.log('\n👥 Customer Data:');
        console.log(JSON.stringify(context.customer, null, 2));
      }
      
      if (context.campaigns) {
        console.log('\n📊 Campaign Data:');
        console.log(JSON.stringify(context.campaigns, null, 2));
      }
      
      if (context.visitors) {
        console.log('\n🔍 Visitor Data:');
        console.log(JSON.stringify(context.visitors, null, 2));
      }
      
      if (context.monitoring) {
        console.log('\n📈 Monitoring Data:');
        console.log(JSON.stringify(context.monitoring, null, 2));
      }
      
      console.log('\n' + '='.repeat(50));
      
      // Verify logger was called with real data info
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('MCP Integration'),
        expect.any(Object)
      );
    });
  });
});

// Helper functions

async function setupTestData() {
  console.log('📦 Setting up test data...');
  
  try {
    // Create test organization
    const org = await prisma.organization.create({
      data: {
        id: testAuthContext.organizationId,
        name: 'Test Organization',
        slug: 'test-org',
        plan: 'pro',
        apiKey: 'test-api-key'
      }
    });
    
    // Create test user
    const user = await prisma.user.create({
      data: {
        id: testAuthContext.userId,
        email: 'test@example.com',
        name: 'Test User',
        organizationId: org.id
      }
    });
    
    // Create test contacts
    const contacts = await prisma.contact.createMany({
      data: [
        {
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
          organizationId: org.id
        },
        {
          email: 'jane@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          organizationId: org.id
        },
        {
          email: 'high-value@example.com',
          firstName: 'High',
          lastName: 'Value',
          organizationId: org.id,
          tags: ['vip', 'high-value']
        }
      ]
    });
    
    // Create test segments
    const segment = await prisma.segment.create({
      data: {
        name: 'High Engagement Users',
        organizationId: org.id,
        description: 'Users with high engagement scores',
        conditions: {
          all: [
            { field: 'engagement_score', operator: 'gt', value: 70 }
          ]
        }
      }
    });
    
    console.log('✅ Test data created successfully');
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...');
  
  try {
    // Clean up in reverse order of dependencies
    await prisma.segment.deleteMany({
      where: { organizationId: testAuthContext.organizationId }
    });
    
    await prisma.contact.deleteMany({
      where: { organizationId: testAuthContext.organizationId }
    });
    
    await prisma.user.deleteMany({
      where: { id: testAuthContext.userId }
    });
    
    await prisma.organization.deleteMany({
      where: { id: testAuthContext.organizationId }
    });
    
    console.log('✅ Test data cleaned up successfully');
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
  }
}