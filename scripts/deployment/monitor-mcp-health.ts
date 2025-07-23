#!/usr/bin/env npx tsx

/**
 * MCP Production Health Monitoring Script
 * 
 * Continuously monitors MCP servers and AI performance in production
 * Provides real-time alerts and automatic rollback triggers
 */

import { getMCPServerManager } from '../src/mcp/mcp-server-manager.js';
import { MarketSageMCPClient } from '../src/mcp/clients/mcp-client.js';
import { supremeAIV3Enhanced } from '../src/lib/ai/supreme-ai-v3-mcp-integration.js';

interface HealthMetrics {
  timestamp: string;
  mcpEnabled: boolean;
  serversRunning: number;
  totalServers: number;
  responseTime: number;
  errorRate: number;
  fallbackUsage: number;
  aiAccuracy: number;
}

interface AlertThresholds {
  maxResponseTime: number;      // milliseconds
  maxErrorRate: number;         // percentage
  maxFallbackUsage: number;     // percentage
  minAiAccuracy: number;        // percentage
}

class MCPHealthMonitor {
  private metrics: HealthMetrics[] = [];
  private alertThresholds: AlertThresholds = {
    maxResponseTime: 2000,     // 2 seconds
    maxErrorRate: 1,           // 1%
    maxFallbackUsage: 50,      // 50%
    minAiAccuracy: 80          // 80%
  };
  
  private mockAuthContext = {
    userId: 'health-monitor',
    organizationId: 'production',
    role: 'ADMIN' as const,
    permissions: ['*']
  };

  async runHealthCheck(): Promise<HealthMetrics> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    try {
      // Check MCP Server Manager
      const mcpManager = getMCPServerManager();
      const serverStatus = mcpManager.getServerStatus();
      const healthCheck = await mcpManager.healthCheck();
      
      // Check MCP Client performance
      const mcpClient = new MarketSageMCPClient(this.mockAuthContext);
      const testStart = Date.now();
      
      // Test various MCP operations
      const [customerResult, campaignResult, leadpulseResult] = await Promise.all([
        mcpClient.searchCustomers('health@test.com', { limit: 1 }),
        mcpClient.getCampaignPerformance('health-test-campaign'),
        mcpClient.getVisitorAnalytics({ timeRange: '1h' })
      ]);
      
      const responseTime = Date.now() - testStart;
      
      // Calculate metrics
      const totalOperations = 3;
      const successfulOperations = [customerResult, campaignResult, leadpulseResult]
        .filter(r => r.success).length;
      
      const errorRate = ((totalOperations - successfulOperations) / totalOperations) * 100;
      
      const fallbackOperations = [customerResult, campaignResult, leadpulseResult]
        .filter(r => r.fromFallback).length;
      
      const fallbackUsage = (fallbackOperations / totalOperations) * 100;
      
      // Test AI performance
      const aiStart = Date.now();
      const aiResult = await supremeAIV3Enhanced.processWithMCP({
        type: 'question',
        userId: 'health-monitor',
        question: 'Health check: What is the status of my campaigns?'
      });
      
      const aiResponseTime = Date.now() - aiStart;
      const aiAccuracy = aiResult.confidence || 0;
      
      const metrics: HealthMetrics = {
        timestamp,
        mcpEnabled: serverStatus.enabled,
        serversRunning: serverStatus.servers.filter(s => s.running).length,
        totalServers: serverStatus.servers.length,
        responseTime: Math.max(responseTime, aiResponseTime),
        errorRate,
        fallbackUsage,
        aiAccuracy
      };
      
      return metrics;
      
    } catch (error) {
      console.error('Health check failed:', error);
      
      return {
        timestamp,
        mcpEnabled: false,
        serversRunning: 0,
        totalServers: 0,
        responseTime: Date.now() - startTime,
        errorRate: 100,
        fallbackUsage: 100,
        aiAccuracy: 0
      };
    }
  }

  checkAlerts(metrics: HealthMetrics): string[] {
    const alerts: string[] = [];
    
    if (metrics.responseTime > this.alertThresholds.maxResponseTime) {
      alerts.push(`🚨 HIGH RESPONSE TIME: ${metrics.responseTime}ms (threshold: ${this.alertThresholds.maxResponseTime}ms)`);
    }
    
    if (metrics.errorRate > this.alertThresholds.maxErrorRate) {
      alerts.push(`🚨 HIGH ERROR RATE: ${metrics.errorRate}% (threshold: ${this.alertThresholds.maxErrorRate}%)`);
    }
    
    if (metrics.fallbackUsage > this.alertThresholds.maxFallbackUsage) {
      alerts.push(`⚠️  HIGH FALLBACK USAGE: ${metrics.fallbackUsage}% (threshold: ${this.alertThresholds.maxFallbackUsage}%)`);
    }
    
    if (metrics.aiAccuracy < this.alertThresholds.minAiAccuracy) {
      alerts.push(`⚠️  LOW AI ACCURACY: ${metrics.aiAccuracy}% (threshold: ${this.alertThresholds.minAiAccuracy}%)`);
    }
    
    if (!metrics.mcpEnabled) {
      alerts.push(`ℹ️  MCP DISABLED: Running in fallback mode`);
    }
    
    if (metrics.serversRunning < metrics.totalServers) {
      alerts.push(`⚠️  SERVERS DOWN: ${metrics.serversRunning}/${metrics.totalServers} servers running`);
    }
    
    return alerts;
  }

  shouldTriggerRollback(currentMetrics: HealthMetrics): boolean {
    // Get recent metrics for trend analysis
    const recentMetrics = this.metrics.slice(-5); // Last 5 checks
    
    // Critical conditions that trigger immediate rollback
    if (currentMetrics.errorRate > 5) {
      console.log('🚨 ROLLBACK TRIGGER: Error rate > 5%');
      return true;
    }
    
    if (currentMetrics.responseTime > 5000) {
      console.log('🚨 ROLLBACK TRIGGER: Response time > 5 seconds');
      return true;
    }
    
    // Trend-based rollback triggers
    if (recentMetrics.length >= 3) {
      const avgErrorRate = recentMetrics.reduce((sum, m) => sum + m.errorRate, 0) / recentMetrics.length;
      const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;
      
      if (avgErrorRate > 2) {
        console.log('🚨 ROLLBACK TRIGGER: Average error rate > 2% over recent checks');
        return true;
      }
      
      if (avgResponseTime > 3000) {
        console.log('🚨 ROLLBACK TRIGGER: Average response time > 3 seconds over recent checks');
        return true;
      }
    }
    
    return false;
  }

  displayMetrics(metrics: HealthMetrics): void {
    console.log('\n📊 MCP Health Metrics');
    console.log('=====================');
    console.log(`Timestamp: ${metrics.timestamp}`);
    console.log(`MCP Status: ${metrics.mcpEnabled ? '🟢 ENABLED' : '🔴 DISABLED'}`);
    console.log(`Servers: ${metrics.serversRunning}/${metrics.totalServers} running`);
    console.log(`Response Time: ${metrics.responseTime}ms`);
    console.log(`Error Rate: ${metrics.errorRate.toFixed(2)}%`);
    console.log(`Fallback Usage: ${metrics.fallbackUsage.toFixed(2)}%`);
    console.log(`AI Accuracy: ${metrics.aiAccuracy.toFixed(2)}%`);
  }

  displayAlerts(alerts: string[]): void {
    if (alerts.length > 0) {
      console.log('\n🔔 Active Alerts');
      console.log('================');
      alerts.forEach(alert => console.log(alert));
    } else {
      console.log('\n✅ No alerts - System healthy');
    }
  }

  async triggerRollback(): Promise<void> {
    console.log('\n🚨 TRIGGERING EMERGENCY ROLLBACK');
    console.log('================================');
    
    try {
      // Execute rollback script
      const { spawn } = require('child_process');
      const rollback = spawn('bash', ['./scripts/deploy-mcp-production.sh', 'rollback'], {
        stdio: 'inherit'
      });
      
      rollback.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Emergency rollback completed successfully');
        } else {
          console.log('❌ Rollback script failed');
        }
      });
      
    } catch (error) {
      console.error('❌ Failed to trigger rollback:', error);
    }
  }

  async startMonitoring(intervalSeconds: number = 60): Promise<void> {
    console.log('🚀 Starting MCP Production Health Monitoring');
    console.log('============================================');
    console.log(`Check interval: ${intervalSeconds} seconds`);
    console.log(`Alert thresholds:`);
    console.log(`  - Max response time: ${this.alertThresholds.maxResponseTime}ms`);
    console.log(`  - Max error rate: ${this.alertThresholds.maxErrorRate}%`);
    console.log(`  - Max fallback usage: ${this.alertThresholds.maxFallbackUsage}%`);
    console.log(`  - Min AI accuracy: ${this.alertThresholds.minAiAccuracy}%`);
    console.log('');
    
    const runCheck = async () => {
      try {
        const metrics = await this.runHealthCheck();
        this.metrics.push(metrics);
        
        // Keep only last 100 metrics
        if (this.metrics.length > 100) {
          this.metrics = this.metrics.slice(-100);
        }
        
        this.displayMetrics(metrics);
        
        const alerts = this.checkAlerts(metrics);
        this.displayAlerts(alerts);
        
        // Check for rollback triggers
        if (this.shouldTriggerRollback(metrics)) {
          console.log('\n🚨 AUTOMATIC ROLLBACK TRIGGERED');
          await this.triggerRollback();
          return; // Stop monitoring after rollback
        }
        
        console.log('\n' + '─'.repeat(50));
        
      } catch (error) {
        console.error('❌ Health check error:', error);
      }
    };
    
    // Run initial check
    await runCheck();
    
    // Set up interval
    const interval = setInterval(runCheck, intervalSeconds * 1000);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n👋 Stopping health monitoring...');
      clearInterval(interval);
      process.exit(0);
    });
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'monitor';
  const interval = parseInt(args[1]) || 60;
  
  const monitor = new MCPHealthMonitor();
  
  switch (command) {
    case 'check':
      console.log('🔍 Running single health check...');
      const metrics = await monitor.runHealthCheck();
      monitor.displayMetrics(metrics);
      const alerts = monitor.checkAlerts(metrics);
      monitor.displayAlerts(alerts);
      break;
      
    case 'monitor':
      await monitor.startMonitoring(interval);
      break;
      
    default:
      console.log('Usage:');
      console.log('  npx tsx scripts/monitor-mcp-health.ts check           # Single health check');
      console.log('  npx tsx scripts/monitor-mcp-health.ts monitor [60]    # Continuous monitoring (default: 60s interval)');
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}