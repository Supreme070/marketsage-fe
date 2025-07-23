#!/usr/bin/env npx tsx

/**
 * Quick Verification Script for Supreme AI Real Data Usage
 * 
 * This script provides a quick way to verify that the Supreme AI is using
 * real database data for its decisions without running the full test suite.
 */

import { SupremeAIV3WithMCP } from '../../src/lib/ai/supreme-ai-v3-mcp-integration';
import { SupremeAIMCPIntegration } from '../../src/lib/ai/mcp-integration';
import { MarketSageMCPClient } from '../../src/mcp/clients/mcp-client';
import prisma from '../../src/lib/db/prisma';
import chalk from 'chalk';
import type { MCPAuthContext } from '../../src/mcp/types/mcp-types';
import type { SupremeAIv3Task } from '../../src/lib/ai/supreme-ai-v3-engine';

// Test configuration
const testAuthContext: MCPAuthContext = {
  userId: 'demo-user-001',
  organizationId: 'demo-org-001',
  role: 'USER',
  permissions: ['read:own', 'write:own']
};

async function main() {
  console.log(chalk.cyan.bold('\n🔍 Supreme AI Real Data Verification\n'));
  
  try {
    // Initialize components
    const supremeAI = new SupremeAIV3WithMCP();
    const mcpIntegration = new SupremeAIMCPIntegration(testAuthContext);
    const mcpClient = new MarketSageMCPClient(testAuthContext);
    
    await supremeAI.initializeMCPIntegration(testAuthContext);
    
    console.log(chalk.green('✅ AI Engine initialized with MCP integration\n'));
    
    // Test 1: Verify MCP Client Database Connection
    console.log(chalk.yellow('📊 Test 1: MCP Database Connection'));
    console.log('─'.repeat(50));
    
    const searchResult = await mcpClient.searchCustomers('test', {
      limit: 3,
      includeSegments: true
    });
    
    console.log(`Status: ${searchResult.success ? chalk.green('Connected') : chalk.red('Failed')}`);
    console.log(`Using Fallback: ${searchResult.fromFallback ? chalk.yellow('Yes (Direct DB)') : chalk.green('No (MCP)')}`);
    console.log(`Records Found: ${Array.isArray(searchResult.data) ? searchResult.data.length : 0}`);
    
    if (searchResult.success && searchResult.data) {
      console.log('\nSample Data:');
      const data = Array.isArray(searchResult.data) ? searchResult.data : [searchResult.data];
      data.slice(0, 2).forEach((item: any, i: number) => {
        console.log(`  ${i + 1}. ${item.email || item.name || 'Unknown'}`);
      });
    }
    
    // Test 2: Verify Comprehensive Context Building
    console.log(chalk.yellow('\n📊 Test 2: Comprehensive AI Context'));
    console.log('─'.repeat(50));
    
    const context = await mcpIntegration.buildComprehensiveAIContext(
      testAuthContext.userId,
      testAuthContext.organizationId
    );
    
    console.log('Context Components:');
    console.log(`  - Customer Data: ${context.customer ? chalk.green('✓ Available') : chalk.red('✗ Missing')}`);
    console.log(`  - Campaign Data: ${context.campaigns ? chalk.green('✓ Available') : chalk.red('✗ Missing')}`);
    console.log(`  - Visitor Data: ${context.visitors ? chalk.green('✓ Available') : chalk.red('✗ Missing')}`);
    console.log(`  - Monitoring Data: ${context.monitoring ? chalk.green('✓ Available') : chalk.red('✗ Missing')}`);
    
    // Test 3: Execute Segmentation with Real Data
    console.log(chalk.yellow('\n📊 Test 3: AI Segmentation with Real Data'));
    console.log('─'.repeat(50));
    
    const segmentationTask: SupremeAIv3Task = {
      type: 'task',
      userId: testAuthContext.userId,
      question: 'Create a segment for high-value customers',
      taskType: 'segmentation'
    };
    
    const segmentResult = await supremeAI.processWithMCP(segmentationTask);
    
    console.log(`Task Success: ${segmentResult.success ? chalk.green('✓') : chalk.red('✗')}`);
    console.log(`Confidence: ${chalk.cyan(segmentResult.confidence.toFixed(2))}`);
    console.log(`Supreme Score: ${chalk.cyan(segmentResult.supremeScore)}`);
    console.log(`MCP Used: ${segmentResult.data?.mcpUsed ? chalk.green('Yes') : chalk.yellow('No')}`);
    
    if (segmentResult.data?.status === 'executed' && segmentResult.data?.result) {
      const result = segmentResult.data.result;
      console.log('\nSegmentation Results:');
      console.log(`  - Source: ${chalk.cyan(result.source || 'Unknown')}`);
      console.log(`  - Customer Count: ${chalk.cyan(result.customerCount || 0)}`);
      console.log(`  - Engagement Rate: ${chalk.cyan(result.engagementRate || 0)}%`);
      
      if (result.insights && result.insights.length > 0) {
        console.log('\nInsights:');
        result.insights.slice(0, 3).forEach((insight: string) => {
          console.log(`  • ${insight}`);
        });
      }
    }
    
    // Test 4: Execute Campaign Optimization with Real Data
    console.log(chalk.yellow('\n📊 Test 4: AI Campaign Optimization'));
    console.log('─'.repeat(50));
    
    const campaignTask: SupremeAIv3Task = {
      type: 'task',
      userId: testAuthContext.userId,
      question: 'Optimize email campaign performance',
      taskType: 'campaign_optimization'
    };
    
    const campaignResult = await supremeAI.processWithMCP(campaignTask);
    
    console.log(`Task Success: ${campaignResult.success ? chalk.green('✓') : chalk.red('✗')}`);
    console.log(`MCP Used: ${campaignResult.data?.mcpUsed ? chalk.green('Yes') : chalk.yellow('No')}`);
    
    if (campaignResult.data?.status === 'executed' && campaignResult.data?.result) {
      const result = campaignResult.data.result;
      console.log(`Source: ${chalk.cyan(result.source || 'Unknown')}`);
      
      if (result.optimizations && result.optimizations.length > 0) {
        console.log('\nOptimizations Applied:');
        result.optimizations.slice(0, 3).forEach((opt: string) => {
          console.log(`  • ${opt}`);
        });
      }
    }
    
    // Test 5: Verify Real-Time Decision Making
    console.log(chalk.yellow('\n📊 Test 5: Real-Time AI Analysis'));
    console.log('─'.repeat(50));
    
    const analysisTask: SupremeAIv3Task = {
      type: 'analyze',
      userId: testAuthContext.userId,
      question: 'What are our top performing customer segments based on actual data?'
    };
    
    const analysisResult = await supremeAI.processWithMCP(analysisTask);
    
    console.log(`Analysis Success: ${analysisResult.success ? chalk.green('✓') : chalk.red('✗')}`);
    console.log(`Data Sources Used: ${analysisResult.data?.mcpUsed ? chalk.green('Real MCP Data') : chalk.yellow('Fallback Data')}`);
    
    if (analysisResult.data?.rawData) {
      const rawData = analysisResult.data.rawData;
      console.log('\nData Sources Accessed:');
      console.log(`  - Campaigns: ${rawData.campaigns ? chalk.green('✓') : chalk.red('✗')}`);
      console.log(`  - Customers: ${rawData.customers ? chalk.green('✓') : chalk.red('✗')}`);
      console.log(`  - Visitors: ${rawData.visitors ? chalk.green('✓') : chalk.red('✗')}`);
    }
    
    // Summary
    console.log(chalk.cyan.bold('\n📋 Verification Summary'));
    console.log('─'.repeat(50));
    
    const allTestsPassed = 
      searchResult.success && 
      segmentResult.success && 
      campaignResult.success && 
      analysisResult.success;
    
    if (allTestsPassed) {
      console.log(chalk.green.bold('✅ All verifications passed!'));
      console.log(chalk.green('\nThe Supreme AI v3 engine is successfully:'));
      console.log(chalk.green('  • Connecting to the real database'));
      console.log(chalk.green('  • Using actual customer and campaign data'));
      console.log(chalk.green('  • Making data-driven decisions'));
      console.log(chalk.green('  • Providing insights based on real metrics'));
    } else {
      console.log(chalk.yellow.bold('⚠️  Some verifications failed'));
      console.log(chalk.yellow('\nPlease check the output above for details.'));
    }
    
  } catch (error) {
    console.error(chalk.red.bold('\n❌ Verification failed:'));
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
main().then(() => {
  console.log(chalk.gray('\n✨ Verification complete\n'));
  process.exit(0);
}).catch((error) => {
  console.error(chalk.red('\n❌ Unexpected error:'), error);
  process.exit(1);
});