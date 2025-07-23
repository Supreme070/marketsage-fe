#!/usr/bin/env npx tsx

/**
 * MCP Test Runner for MarketSage
 * 
 * This script runs the MCP test suite to verify the integration is working properly.
 */

import { runAllMCPTests } from '../src/mcp/test-mcp-setup.js';

async function main() {
  console.log('🔍 MarketSage MCP Test Suite');
  console.log('=============================\n');
  
  await runAllMCPTests();
}

main().catch((error) => {
  console.error('Test runner failed:', error);
  process.exit(1);
});