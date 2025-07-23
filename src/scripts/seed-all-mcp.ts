#!/usr/bin/env tsx

/**
 * Combined MCP Seeding Script
 * 
 * This script executes all MCP seed scripts in the correct order with proper error handling:
 * 1. Campaign Analytics - from existing campaign data
 * 2. Customer Predictions - from existing contact data 
 * 3. Visitor Sessions - from LeadPulse patterns
 * 4. Monitoring Metrics - from actual business metrics
 * 
 * Follows the same patterns as existing seed scripts for Docker compatibility.
 */

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import all MCP seed functions
import seedMCPCampaignAnalytics from './seed-mcp-campaign-analytics';
import seedMCPCustomerPredictions from './seed-mcp-customer-predictions';
import seedMCPVisitorSessions from './seed-mcp-visitor-sessions';
import seedMCPMonitoringMetrics from './seed-mcp-monitoring-metrics';

// Script metadata
const SCRIPT_VERSION = '1.0.0';
const SCRIPT_NAME = 'MCP Complete Seeding Suite';

// Seeding configuration
const SEEDING_CONFIG = {
  // Execute in parallel where possible for speed
  parallelExecution: true,
  
  // Retry configuration for robustness
  maxRetries: 3,
  retryDelay: 2000, // 2 seconds
  
  // Progress reporting
  showProgress: true,
  showTimestamps: true
};

/**
 * Seeding step definition
 */
interface SeedingStep {
  name: string;
  description: string;
  fn: () => Promise<void>;
  dependencies?: string[]; // Step names this depends on
  parallel?: boolean; // Can run in parallel with other parallel steps
  critical?: boolean; // If true, failure stops entire process
}

/**
 * Define seeding steps with dependencies and execution order
 */
const SEEDING_STEPS: SeedingStep[] = [
  {
    name: 'campaign-analytics',
    description: 'Seed campaign performance metrics from existing EmailCampaign/SMSCampaign data',
    fn: seedMCPCampaignAnalytics,
    parallel: true,
    critical: true
  },
  {
    name: 'customer-predictions',
    description: 'Generate customer predictions and behavioral insights from Contact data',
    fn: seedMCPCustomerPredictions,
    parallel: true,
    critical: true
  },
  {
    name: 'visitor-sessions',
    description: 'Create realistic visitor session data extending LeadPulse patterns',
    fn: seedMCPVisitorSessions,
    parallel: true,
    critical: true
  },
  {
    name: 'monitoring-metrics',
    description: 'Calculate business and system metrics from actual database counts',
    fn: seedMCPMonitoringMetrics,
    dependencies: ['campaign-analytics', 'customer-predictions'], // Needs other data for accurate metrics
    critical: true
  }
];

/**
 * Utility functions
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

function formatDuration(startTime: number): string {
  const duration = Date.now() - startTime;
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

function logProgress(message: string, level: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
  if (!SEEDING_CONFIG.showProgress) return;
  
  const timestamp = SEEDING_CONFIG.showTimestamps ? `[${getTimestamp()}] ` : '';
  const icon = {
    info: '📋',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  }[level];
  
  console.log(`${timestamp}${icon} ${message}`);
}

function logHeader(): void {
  console.log('='.repeat(80));
  console.log(`🚀 ${SCRIPT_NAME} v${SCRIPT_VERSION}`);
  console.log('='.repeat(80));
  console.log(`📊 Database: ${process.env.DATABASE_URL?.replace(/\/\/.*@/, '//***:***@') || 'Not configured'}`);
  console.log(`⚙️  Parallel Execution: ${SEEDING_CONFIG.parallelExecution ? 'Enabled' : 'Disabled'}`);
  console.log(`🔄 Max Retries: ${SEEDING_CONFIG.maxRetries}`);
  console.log(`📝 Total Steps: ${SEEDING_STEPS.length}`);
  console.log('='.repeat(80));
}

function logSummary(results: Map<string, any>, totalTime: number): void {
  console.log('\n' + '='.repeat(80));
  console.log('📊 SEEDING SUMMARY');
  console.log('='.repeat(80));
  
  let successCount = 0;
  let failureCount = 0;
  
  SEEDING_STEPS.forEach(step => {
    const result = results.get(step.name);
    if (result?.success) {
      successCount++;
      const duration = result.duration ? formatDuration(result.startTime) : 'Unknown';
      logProgress(`${step.name}: ${step.description} (${duration})`, 'success');
    } else {
      failureCount++;
      const error = result?.error?.message || 'Unknown error';
      logProgress(`${step.name}: ${step.description} - ${error}`, 'error');
    }
  });
  
  console.log('-'.repeat(80));
  console.log(`✅ Successful: ${successCount}/${SEEDING_STEPS.length}`);
  console.log(`❌ Failed: ${failureCount}/${SEEDING_STEPS.length}`);
  console.log(`⏱️  Total Time: ${formatDuration(Date.now() - totalTime)}`);
  console.log('='.repeat(80));
  
  if (failureCount === 0) {
    console.log('🎉 All MCP seeding completed successfully!');
    console.log('💡 Your MCP servers now have real data from the MarketSage database');
    console.log('🚀 Ready for production deployment!');
  } else {
    console.log('⚠️  Some seeding steps failed. Please review errors above.');
    console.log('💡 You can run individual seed scripts to retry failed steps');
  }
}

/**
 * Execute a single seeding step with retry logic
 */
async function executeStep(step: SeedingStep, attempt: number = 1): Promise<{ success: boolean; startTime: number; error?: Error }> {
  const startTime = Date.now();
  
  try {
    logProgress(`Starting ${step.name}: ${step.description}`, 'info');
    await step.fn();
    logProgress(`Completed ${step.name} (${formatDuration(startTime)})`, 'success');
    return { success: true, startTime };
  } catch (error) {
    const err = error as Error;
    
    if (attempt < SEEDING_CONFIG.maxRetries) {
      logProgress(`Retry ${attempt}/${SEEDING_CONFIG.maxRetries} for ${step.name}: ${err.message}`, 'warning');
      await new Promise(resolve => setTimeout(resolve, SEEDING_CONFIG.retryDelay));
      return executeStep(step, attempt + 1);
    } else {
      logProgress(`Failed ${step.name} after ${SEEDING_CONFIG.maxRetries} attempts: ${err.message}`, 'error');
      return { success: false, startTime, error: err };
    }
  }
}

/**
 * Check if a step's dependencies are satisfied
 */
function areDependenciesSatisfied(step: SeedingStep, completedSteps: Set<string>): boolean {
  if (!step.dependencies || step.dependencies.length === 0) {
    return true;
  }
  
  return step.dependencies.every(dep => completedSteps.has(dep));
}

/**
 * Get steps that can be executed (dependencies satisfied, not yet completed)
 */
function getExecutableSteps(completedSteps: Set<string>, failedSteps: Set<string>): SeedingStep[] {
  return SEEDING_STEPS.filter(step => 
    !completedSteps.has(step.name) && 
    !failedSteps.has(step.name) &&
    areDependenciesSatisfied(step, completedSteps)
  );
}

/**
 * Main seeding orchestrator
 */
async function seedAllMCP(): Promise<void> {
  const overallStartTime = Date.now();
  logHeader();
  
  const results = new Map<string, any>();
  const completedSteps = new Set<string>();
  const failedSteps = new Set<string>();
  
  try {
    // Execute steps in waves, respecting dependencies
    while (completedSteps.size + failedSteps.size < SEEDING_STEPS.length) {
      const executableSteps = getExecutableSteps(completedSteps, failedSteps);
      
      if (executableSteps.length === 0) {
        // No more steps can be executed (likely due to failed dependencies)
        const remainingSteps = SEEDING_STEPS.filter(step => 
          !completedSteps.has(step.name) && !failedSteps.has(step.name)
        );
        
        if (remainingSteps.length > 0) {
          logProgress(`Cannot execute remaining steps due to failed dependencies: ${remainingSteps.map(s => s.name).join(', ')}`, 'error');
          remainingSteps.forEach(step => {
            failedSteps.add(step.name);
            results.set(step.name, { 
              success: false, 
              startTime: Date.now(), 
              error: new Error('Dependencies failed') 
            });
          });
        }
        break;
      }
      
      // Group steps by parallel execution capability
      const parallelSteps = executableSteps.filter(step => step.parallel && SEEDING_CONFIG.parallelExecution);
      const sequentialSteps = executableSteps.filter(step => !step.parallel || !SEEDING_CONFIG.parallelExecution);
      
      // Execute parallel steps concurrently
      if (parallelSteps.length > 0) {
        logProgress(`Executing ${parallelSteps.length} steps in parallel: ${parallelSteps.map(s => s.name).join(', ')}`, 'info');
        
        const parallelPromises = parallelSteps.map(async step => {
          const result = await executeStep(step);
          results.set(step.name, result);
          
          if (result.success) {
            completedSteps.add(step.name);
          } else {
            failedSteps.add(step.name);
            if (step.critical) {
              throw new Error(`Critical step ${step.name} failed: ${result.error?.message}`);
            }
          }
          
          return { step: step.name, result };
        });
        
        await Promise.all(parallelPromises);
      }
      
      // Execute sequential steps one by one
      for (const step of sequentialSteps) {
        const result = await executeStep(step);
        results.set(step.name, result);
        
        if (result.success) {
          completedSteps.add(step.name);
        } else {
          failedSteps.add(step.name);
          if (step.critical) {
            throw new Error(`Critical step ${step.name} failed: ${result.error?.message}`);
          }
        }
      }
    }
    
    logSummary(results, overallStartTime);
    
    // Exit with error code if any critical steps failed
    const criticalFailures = Array.from(failedSteps).filter(stepName => 
      SEEDING_STEPS.find(step => step.name === stepName)?.critical
    );
    
    if (criticalFailures.length > 0) {
      throw new Error(`Critical seeding steps failed: ${criticalFailures.join(', ')}`);
    }
    
  } catch (error) {
    logProgress(`Seeding process failed: ${(error as Error).message}`, 'error');
    logSummary(results, overallStartTime);
    throw error;
  }
}

// Run the seeding script
if (require.main === module) {
  seedAllMCP()
    .then(() => {
      console.log('\n🎉 MCP seeding process completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 MCP seeding process failed:', error.message);
      process.exit(1);
    });
}

export default seedAllMCP;