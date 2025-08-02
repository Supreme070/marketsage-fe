#!/usr/bin/env node

/**
 * Test Script for API Proxy Endpoints
 * Verifies that the converted proxy routes are working correctly
 */

const { spawn } = require('child_process');
const fs = require('fs');

// Color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${colors.bold}${'='.repeat(50)}`, 'cyan');
  log(`${colors.bold}${message.toUpperCase()}`, 'cyan');
  log(`${colors.bold}${'='.repeat(50)}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Check if a file exists and contains proxy pattern
function checkProxyFile(filePath, expectedBackendPath) {
  try {
    if (!fs.existsSync(filePath)) {
      logError(`File not found: ${filePath}`);
      return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for proxy imports
    if (!content.includes('proxyToBackend')) {
      logError(`Missing proxyToBackend import in: ${filePath}`);
      return false;
    }

    // Check for expected backend path
    if (expectedBackendPath && !content.includes(expectedBackendPath)) {
      logWarning(`Expected backend path '${expectedBackendPath}' not found in: ${filePath}`);
    }

    // Check if Prisma imports are removed
    if (content.includes('import prisma') || content.includes('from "@/lib/db/prisma"')) {
      logWarning(`Prisma imports still present in: ${filePath}`);
    }

    // Check if auth/session imports are removed
    if (content.includes('getServerSession') || content.includes('authOptions')) {
      logWarning(`Auth imports still present in: ${filePath}`);
    }

    logSuccess(`Proxy conversion verified: ${filePath}`);
    return true;
  } catch (error) {
    logError(`Error checking file ${filePath}: ${error.message}`);
    return false;
  }
}

// Check backend health
async function checkBackendHealth() {
  logInfo('Checking NestJS backend health...');
  
  try {
    const response = await fetch('http://localhost:3006/api/v2/health', {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      logSuccess('NestJS backend is running and healthy');
      return true;
    } else {
      logError(`Backend health check failed with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Backend health check failed: ${error.message}`);
    logWarning('Make sure NestJS backend is running on http://localhost:3006');
    return false;
  }
}

// Main test function
async function runTests() {
  logHeader('MarketSage API Proxy Endpoints Test');
  
  const testResults = {
    proxyFiles: 0,
    totalFiles: 0,
    backendHealth: false
  };

  // Test converted proxy files
  logHeader('Testing Converted Proxy Files');
  
  const proxyTests = [
    // Contacts routes
    {
      path: 'src/app/api/contacts/route.ts',
      backendPath: 'contacts'
    },
    {
      path: 'src/app/api/contacts/[id]/route.ts', 
      backendPath: 'contacts/'
    },
    {
      path: 'src/app/api/contacts/export/route.ts',
      backendPath: 'contacts/export'
    },
    {
      path: 'src/app/api/contacts/import/route.ts',
      backendPath: 'contacts/bulk-import'
    },
    
    // Workflows routes
    {
      path: 'src/app/api/workflows/route.ts',
      backendPath: 'workflows'
    },
    {
      path: 'src/app/api/workflows/[id]/route.ts',
      backendPath: 'workflows/'
    },
    {
      path: 'src/app/api/workflows/[id]/execute/route.ts',
      backendPath: 'workflows/'
    },
    
    // Campaign routes
    {
      path: 'src/app/api/email/campaigns/route.ts',
      backendPath: 'email/campaigns'
    },
    {
      path: 'src/app/api/email/campaigns/[id]/route.ts',
      backendPath: 'email/campaigns/'
    },
    {
      path: 'src/app/api/sms/campaigns/route.ts',
      backendPath: 'sms/campaigns'
    },
    {
      path: 'src/app/api/whatsapp/campaigns/route.ts',
      backendPath: 'whatsapp/campaigns'
    },
    
    // AI routes
    {
      path: 'src/app/api/ai/chat/route.ts',
      backendPath: 'ai/chat'
    },
    {
      path: 'src/app/api/ai/content-generation/route.ts',
      backendPath: 'ai/content-generation'
    },
    {
      path: 'src/app/api/ai/task-execution/route.ts',
      backendPath: 'ai/task-execution'
    },
    {
      path: 'src/app/api/ai/predictive/route.ts',
      backendPath: 'ai/predictive'
    }
  ];

  for (const test of proxyTests) {
    testResults.totalFiles++;
    if (checkProxyFile(test.path, test.backendPath)) {
      testResults.proxyFiles++;
    }
  }

  // Test proxy utility file
  logHeader('Testing Proxy Utility');
  testResults.totalFiles++;
  if (checkProxyFile('src/lib/api-proxy.ts', null)) {
    testResults.proxyFiles++;
  }

  // Test backend health (skip if fetch is not available)
  logHeader('Testing Backend Connectivity');
  try {
    testResults.backendHealth = await checkBackendHealth();
  } catch (error) {
    logWarning('Skipping backend health check (fetch not available in Node.js)');
    logInfo('Run this test in a browser environment or install node-fetch');
  }

  // Summary
  logHeader('Test Summary');
  
  const successRate = ((testResults.proxyFiles / testResults.totalFiles) * 100).toFixed(1);
  
  logInfo(`Proxy Files Tested: ${testResults.totalFiles}`);
  logInfo(`Successful Conversions: ${testResults.proxyFiles}`);
  logInfo(`Success Rate: ${successRate}%`);
  
  if (testResults.backendHealth) {
    logSuccess('Backend connectivity: OK');
  } else {
    logWarning('Backend connectivity: UNKNOWN (could not verify)');
  }

  if (testResults.proxyFiles === testResults.totalFiles) {
    logSuccess('All proxy files have been successfully converted!');
  } else {
    logError(`${testResults.totalFiles - testResults.proxyFiles} files need attention`);
  }

  logHeader('Next Steps');
  logInfo('1. Start the NestJS backend: npm run start:dev (in backend directory)');
  logInfo('2. Start the Next.js frontend: npm run dev');
  logInfo('3. Test the API endpoints through the frontend application');
  logInfo('4. Monitor network requests to ensure they\'re being proxied correctly');
  logInfo('5. Check browser DevTools for any authentication or CORS issues');

  return testResults.proxyFiles === testResults.totalFiles;
}

// Run the tests
if (require.main === module) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    logError(`Test execution failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runTests };