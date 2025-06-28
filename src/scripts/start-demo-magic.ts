#!/usr/bin/env npx tsx

/**
 * Start Demo Magic Script
 * 
 * Quickly start the real-time demo simulation with predefined scenarios
 * 
 * Usage: 
 *   npm run demo:start
 *   npm run demo:start -- --scenario=high-activity
 *   npm run demo:start -- --duration=15 --visitors=10
 */

import { RealTimeDemoSimulator } from '../src/lib/demo/real-time-simulator';
import { logger } from '../src/lib/logger';

// Predefined demo scenarios
const DEMO_SCENARIOS = {
  'high-activity': {
    duration: 15,
    visitorsPerMinute: 12,
    formSubmissionRate: 20,
    alertFrequency: 10,
    enableNotifications: true,
    enableAlerts: true,
    enableLiveVisitors: true,
  },
  'balanced': {
    duration: 30,
    visitorsPerMinute: 6,
    formSubmissionRate: 12,
    alertFrequency: 6,
    enableNotifications: true,
    enableAlerts: true,
    enableLiveVisitors: true,
  },
  'subtle': {
    duration: 45,
    visitorsPerMinute: 3,
    formSubmissionRate: 8,
    alertFrequency: 2,
    enableNotifications: false,
    enableAlerts: true,
    enableLiveVisitors: true,
  },
  'presentation': {
    duration: 20,
    visitorsPerMinute: 8,
    formSubmissionRate: 15,
    alertFrequency: 8,
    enableNotifications: true,
    enableAlerts: true,
    enableLiveVisitors: true,
  }
};

async function main() {
  const args = process.argv.slice(2);
  let config = DEMO_SCENARIOS.balanced; // Default scenario

  // Parse command line arguments
  for (const arg of args) {
    if (arg.startsWith('--scenario=')) {
      const scenario = arg.split('=')[1] as keyof typeof DEMO_SCENARIOS;
      if (DEMO_SCENARIOS[scenario]) {
        config = DEMO_SCENARIOS[scenario];
        logger.info(`🎬 Using ${scenario} scenario`);
      } else {
        logger.error(`❌ Unknown scenario: ${scenario}`);
        logger.info(`Available scenarios: ${Object.keys(DEMO_SCENARIOS).join(', ')}`);
        process.exit(1);
      }
    } else if (arg.startsWith('--duration=')) {
      config.duration = Number.parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--visitors=')) {
      config.visitorsPerMinute = Number.parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--forms=')) {
      config.formSubmissionRate = Number.parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--alerts=')) {
      config.alertFrequency = Number.parseInt(arg.split('=')[1]);
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }
  }

  logger.info('🎭 Starting LeadPulse Demo Magic...');
  logger.info('');
  logger.info('✨ Real-time simulation features:');
  logger.info('   🚀 Live visitor arrivals');
  logger.info('   📝 Form submissions');
  logger.info('   🚨 Smart alerts');
  logger.info('   🔔 System notifications');
  logger.info('   📊 Real-time analytics updates');
  logger.info('');

  try {
    const simulator = new RealTimeDemoSimulator(config);
    await simulator.startSimulation();

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      logger.info('');
      logger.info('🛑 Stopping demo simulation...');
      simulator.stopSimulation();
      process.exit(0);
    });

    // Keep the script running
    logger.info('💡 Press Ctrl+C to stop the simulation');
    
    // Prevent the script from exiting
    setInterval(() => {
      // Do nothing, just keep alive
    }, 10000);

  } catch (error) {
    logger.error('❌ Failed to start demo simulation:', error);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🎭 LeadPulse Demo Magic - Real-Time Simulation

Usage:
  npm run demo:start [options]

Options:
  --scenario=<name>     Use predefined scenario (high-activity, balanced, subtle, presentation)
  --duration=<minutes>  Simulation duration in minutes (default: 30)
  --visitors=<number>   Visitors per minute (default: 6)
  --forms=<percentage>  Form submission rate percentage (default: 12)
  --alerts=<number>     Alerts per hour (default: 6)
  --help, -h           Show this help message

Examples:
  npm run demo:start
  npm run demo:start -- --scenario=high-activity
  npm run demo:start -- --duration=15 --visitors=10
  npm run demo:start -- --scenario=presentation --duration=20

Available Scenarios:
  high-activity  - Busy demo with lots of action (15 min, 12 visitors/min)
  balanced       - Steady, realistic activity (30 min, 6 visitors/min)
  subtle         - Minimal but noticeable activity (45 min, 3 visitors/min)
  presentation   - Perfect for live presentations (20 min, 8 visitors/min)

Features:
  🚀 Live visitor arrivals with realistic behavior patterns
  📝 Form submissions from engaged visitors
  🚨 Smart alerts for high-value activities
  🔔 System notifications for integrations and reports
  📊 Real-time analytics updates

The simulation will automatically stop after the specified duration.
Press Ctrl+C to stop early.
  `);
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    logger.error('❌ Demo magic script failed:', error);
    process.exit(1);
  });
}

export { main as startDemoMagic };