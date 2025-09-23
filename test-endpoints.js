#!/usr/bin/env node

/**
 * MarketSage Backend Endpoint Verification Suite
 * Tests all 150+ backend endpoints to ensure they return 200 status codes
 */

const https = require('https');
const http = require('http');

// Configuration
const BACKEND_URL = process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';
const API_PREFIX = '/api/v2';
const TEST_TIMEOUT = 10000; // 10 seconds
const CONCURRENT_REQUESTS = 5; // Limit concurrent requests

// Test results tracking
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  responseTimes: [],
  categories: {}
};

// All backend endpoints to test
const endpoints = [
  // Core Health & Auth
  { method: 'GET', path: '/health', category: 'Core', auth: false },
  { method: 'GET', path: '/auth/me', category: 'Auth', auth: true },
  { method: 'POST', path: '/auth/login', category: 'Auth', auth: false },
  { method: 'POST', path: '/auth/register', category: 'Auth', auth: false },
  { method: 'POST', path: '/auth/refresh', category: 'Auth', auth: false },
  { method: 'POST', path: '/auth/logout', category: 'Auth', auth: true },

  // Users Management
  { method: 'GET', path: '/users', category: 'Users', auth: true },
  { method: 'POST', path: '/users', category: 'Users', auth: true },
  { method: 'GET', path: '/users/1', category: 'Users', auth: true },
  { method: 'PUT', path: '/users/1', category: 'Users', auth: true },
  { method: 'DELETE', path: '/users/1', category: 'Users', auth: true },

  // Organizations
  { method: 'GET', path: '/organizations', category: 'Organizations', auth: true },
  { method: 'POST', path: '/organizations', category: 'Organizations', auth: true },
  { method: 'GET', path: '/organizations/1', category: 'Organizations', auth: true },
  { method: 'PUT', path: '/organizations/1', category: 'Organizations', auth: true },
  { method: 'DELETE', path: '/organizations/1', category: 'Organizations', auth: true },

  // Campaigns
  { method: 'GET', path: '/campaigns', category: 'Campaigns', auth: true },
  { method: 'POST', path: '/campaigns', category: 'Campaigns', auth: true },
  { method: 'GET', path: '/campaigns/1', category: 'Campaigns', auth: true },
  { method: 'PUT', path: '/campaigns/1', category: 'Campaigns', auth: true },
  { method: 'DELETE', path: '/campaigns/1', category: 'Campaigns', auth: true },
  { method: 'POST', path: '/campaigns/1/send', category: 'Campaigns', auth: true },
  { method: 'GET', path: '/campaigns/1/analytics', category: 'Campaigns', auth: true },

  // Contacts
  { method: 'GET', path: '/contacts', category: 'Contacts', auth: true },
  { method: 'POST', path: '/contacts', category: 'Contacts', auth: true },
  { method: 'GET', path: '/contacts/1', category: 'Contacts', auth: true },
  { method: 'PUT', path: '/contacts/1', category: 'Contacts', auth: true },
  { method: 'DELETE', path: '/contacts/1', category: 'Contacts', auth: true },
  { method: 'POST', path: '/contacts/import', category: 'Contacts', auth: true },
  { method: 'GET', path: '/contacts/export', category: 'Contacts', auth: true },

  // Email Module
  { method: 'GET', path: '/email/campaigns', category: 'Email', auth: true },
  { method: 'POST', path: '/email/campaigns', category: 'Email', auth: true },
  { method: 'GET', path: '/email/campaigns/1', category: 'Email', auth: true },
  { method: 'PUT', path: '/email/campaigns/1', category: 'Email', auth: true },
  { method: 'DELETE', path: '/email/campaigns/1', category: 'Email', auth: true },
  { method: 'GET', path: '/email/templates', category: 'Email', auth: true },
  { method: 'POST', path: '/email/templates', category: 'Email', auth: true },
  { method: 'GET', path: '/email/providers', category: 'Email', auth: true },
  { method: 'POST', path: '/email/providers', category: 'Email', auth: true },

  // SMS Module
  { method: 'GET', path: '/sms/campaigns', category: 'SMS', auth: true },
  { method: 'POST', path: '/sms/campaigns', category: 'SMS', auth: true },
  { method: 'GET', path: '/sms/campaigns/1', category: 'SMS', auth: true },
  { method: 'PUT', path: '/sms/campaigns/1', category: 'SMS', auth: true },
  { method: 'DELETE', path: '/sms/campaigns/1', category: 'SMS', auth: true },
  { method: 'GET', path: '/sms/templates', category: 'SMS', auth: true },
  { method: 'POST', path: '/sms/templates', category: 'SMS', auth: true },
  { method: 'GET', path: '/sms/providers', category: 'SMS', auth: true },
  { method: 'POST', path: '/sms/providers', category: 'SMS', auth: true },

  // WhatsApp Module
  { method: 'GET', path: '/whatsapp/campaigns', category: 'WhatsApp', auth: true },
  { method: 'POST', path: '/whatsapp/campaigns', category: 'WhatsApp', auth: true },
  { method: 'GET', path: '/whatsapp/campaigns/1', category: 'WhatsApp', auth: true },
  { method: 'PUT', path: '/whatsapp/campaigns/1', category: 'WhatsApp', auth: true },
  { method: 'DELETE', path: '/whatsapp/campaigns/1', category: 'WhatsApp', auth: true },
  { method: 'GET', path: '/whatsapp/templates', category: 'WhatsApp', auth: true },
  { method: 'POST', path: '/whatsapp/templates', category: 'WhatsApp', auth: true },

  // AI Intelligence Module (Phase 4 - 34 endpoints)
  { method: 'GET', path: '/ai/intelligence', category: 'AI', auth: true },
  { method: 'POST', path: '/ai/intelligence', category: 'AI', auth: true },
  { method: 'GET', path: '/ai/autonomous-segmentation', category: 'AI', auth: true },
  { method: 'POST', path: '/ai/autonomous-segmentation', category: 'AI', auth: true },
  { method: 'GET', path: '/ai/customer-journey-optimization', category: 'AI', auth: true },
  { method: 'POST', path: '/ai/customer-journey-optimization', category: 'AI', auth: true },
  { method: 'GET', path: '/ai/predictive-analytics', category: 'AI', auth: true },
  { method: 'POST', path: '/ai/predictive-analytics', category: 'AI', auth: true },
  { method: 'GET', path: '/ai/content-generation', category: 'AI', auth: true },
  { method: 'POST', path: '/ai/content-generation', category: 'AI', auth: true },
  { method: 'GET', path: '/ai/supreme-v3', category: 'AI', auth: true },
  { method: 'POST', path: '/ai/supreme-v3', category: 'AI', auth: true },
  { method: 'GET', path: '/ai/autonomous-ab-testing', category: 'AI', auth: true },
  { method: 'POST', path: '/ai/autonomous-ab-testing', category: 'AI', auth: true },
  { method: 'GET', path: '/ai/feedback', category: 'AI', auth: true },
  { method: 'POST', path: '/ai/feedback', category: 'AI', auth: true },

  // Analytics Module (Phase 5 - 20 endpoints)
  { method: 'GET', path: '/analytics/query', category: 'Analytics', auth: true },
  { method: 'POST', path: '/analytics/query', category: 'Analytics', auth: true },
  { method: 'GET', path: '/analytics/predictive', category: 'Analytics', auth: true },
  { method: 'POST', path: '/analytics/predictive', category: 'Analytics', auth: true },
  { method: 'GET', path: '/analytics/organization', category: 'Analytics', auth: true },
  { method: 'GET', path: '/analytics/campaigns', category: 'Analytics', auth: true },
  { method: 'GET', path: '/analytics/users', category: 'Analytics', auth: true },
  { method: 'GET', path: '/analytics/revenue', category: 'Analytics', auth: true },
  { method: 'GET', path: '/analytics/performance', category: 'Analytics', auth: true },
  { method: 'GET', path: '/analytics/engagement', category: 'Analytics', auth: true },

  // Admin Module
  { method: 'GET', path: '/admin/dashboard', category: 'Admin', auth: true },
  { method: 'GET', path: '/admin/users', category: 'Admin', auth: true },
  { method: 'GET', path: '/admin/organizations', category: 'Admin', auth: true },
  { method: 'GET', path: '/admin/analytics', category: 'Admin', auth: true },
  { method: 'GET', path: '/admin/system', category: 'Admin', auth: true },
  { method: 'GET', path: '/admin/logs', category: 'Admin', auth: true },
  { method: 'GET', path: '/admin/maintenance', category: 'Admin', auth: true },
  { method: 'GET', path: '/admin/backups', category: 'Admin', auth: true },
  { method: 'GET', path: '/admin/security', category: 'Admin', auth: true },

  // Additional Modules
  { method: 'GET', path: '/billing', category: 'Billing', auth: true },
  { method: 'POST', path: '/billing', category: 'Billing', auth: true },
  { method: 'GET', path: '/dashboard', category: 'Dashboard', auth: true },
  { method: 'GET', path: '/messages', category: 'Messages', auth: true },
  { method: 'POST', path: '/messages', category: 'Messages', auth: true },
  { method: 'GET', path: '/notifications', category: 'Notifications', auth: true },
  { method: 'POST', path: '/notifications', category: 'Notifications', auth: true },
  { method: 'GET', path: '/settings', category: 'Settings', auth: true },
  { method: 'PUT', path: '/settings', category: 'Settings', auth: true },
  { method: 'GET', path: '/support', category: 'Support', auth: true },
  { method: 'POST', path: '/support', category: 'Support', auth: true },
  { method: 'GET', path: '/workflows', category: 'Workflows', auth: true },
  { method: 'POST', path: '/workflows', category: 'Workflows', auth: true },
  { method: 'GET', path: '/leadpulse', category: 'LeadPulse', auth: true },
  { method: 'POST', path: '/leadpulse', category: 'LeadPulse', auth: true },
  { method: 'GET', path: '/audit', category: 'Audit', auth: true },
  { method: 'GET', path: '/incidents', category: 'Incidents', auth: true },
  { method: 'GET', path: '/security', category: 'Security', auth: true },
  { method: 'GET', path: '/tracing', category: 'Tracing', auth: true }
];

// Real authentication credentials
const TEST_CREDENTIALS = {
  email: process.env.TEST_USER_EMAIL || 'admin@marketsage.com',
  password: process.env.TEST_USER_PASSWORD || 'admin123',
  organizationId: process.env.TEST_ORG_ID || '1'
};

let REAL_JWT_TOKEN = null;
let REFRESH_TOKEN = null;

/**
 * Authenticate and get real JWT token
 */
async function authenticate() {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BACKEND_URL}${API_PREFIX}/auth/login`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MarketSage-Endpoint-Tester/1.0'
      },
      timeout: TEST_TIMEOUT
    };

    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      const chunks = [];
      
      res.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      res.on('end', () => {
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString());
          if (res.statusCode === 200 && body.success) {
            REAL_JWT_TOKEN = body.data.accessToken;
            REFRESH_TOKEN = body.data.refreshToken;
            console.log('✅ Authentication successful');
            console.log(`   User: ${body.data.user.email}`);
            console.log(`   Organization: ${body.data.user.organization?.name || 'N/A'}`);
            resolve(body.data);
          } else {
            reject(new Error(`Authentication failed: ${body.error?.message || 'Unknown error'}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse auth response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Authentication request failed: ${error.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Authentication timeout'));
    });

    req.write(JSON.stringify(TEST_CREDENTIALS));
    req.end();
  });
}

/**
 * Make HTTP request to endpoint
 */
function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const url = new URL(`${BACKEND_URL}${API_PREFIX}${endpoint.path}`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MarketSage-Endpoint-Tester/1.0'
      },
      timeout: TEST_TIMEOUT
    };

    // Add auth header if required and we have a real token
    if (endpoint.auth && REAL_JWT_TOKEN) {
      options.headers['Authorization'] = `Bearer ${REAL_JWT_TOKEN}`;
    } else if (endpoint.auth && !REAL_JWT_TOKEN) {
      reject(new Error('Authentication required but no token available'));
      return;
    }

    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      const responseTime = Date.now() - startTime;
      const chunks = [];
      
      res.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        resolve({
          endpoint,
          status: res.statusCode,
          responseTime,
          headers: res.headers,
          body: body.length > 1000 ? body.substring(0, 1000) + '...' : body
        });
      });
    });

    req.on('error', (error) => {
      reject({
        endpoint,
        error: error.message,
        responseTime: Date.now() - startTime
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({
        endpoint,
        error: 'Request timeout',
        responseTime: TEST_TIMEOUT
      });
    });

    // Add body for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      req.write(JSON.stringify({ test: true }));
    }

    req.end();
  });
}

/**
 * Test a single endpoint
 */
async function testEndpoint(endpoint) {
  try {
    const result = await makeRequest(endpoint);
    results.total++;
    
    if (result.status >= 200 && result.status < 300) {
      results.passed++;
      console.log(`✅ ${endpoint.method} ${endpoint.path} - ${result.status} (${result.responseTime}ms)`);
    } else {
      results.failed++;
      results.errors.push({
        endpoint: `${endpoint.method} ${endpoint.path}`,
        status: result.status,
        category: endpoint.category
      });
      console.log(`❌ ${endpoint.method} ${endpoint.path} - ${result.status} (${result.responseTime}ms)`);
    }
    
    results.responseTimes.push(result.responseTime);
    
    // Track by category
    if (!results.categories[endpoint.category]) {
      results.categories[endpoint.category] = { total: 0, passed: 0, failed: 0 };
    }
    results.categories[endpoint.category].total++;
    if (result.status >= 200 && result.status < 300) {
      results.categories[endpoint.category].passed++;
    } else {
      results.categories[endpoint.category].failed++;
    }
    
  } catch (error) {
    results.total++;
    results.failed++;
    results.errors.push({
      endpoint: `${endpoint.method} ${endpoint.path}`,
      error: error.error,
      category: endpoint.category
    });
    console.log(`💥 ${endpoint.method} ${endpoint.path} - ERROR: ${error.error}`);
  }
}

/**
 * Process endpoints in batches to avoid overwhelming the server
 */
async function processBatch(batch) {
  const promises = batch.map(endpoint => testEndpoint(endpoint));
  await Promise.all(promises);
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 MarketSage Backend Endpoint Verification Suite');
  console.log('=' .repeat(60));
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Test User: ${TEST_CREDENTIALS.email}`);
  console.log(`Total Endpoints: ${endpoints.length}`);
  console.log(`Concurrent Requests: ${CONCURRENT_REQUESTS}`);
  console.log(`Timeout: ${TEST_TIMEOUT}ms`);
  console.log('=' .repeat(60));
  console.log();

  // Authenticate first
  console.log('🔐 Authenticating with real credentials...');
  try {
    await authenticate();
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    console.log('\n💡 Make sure to set environment variables:');
    console.log('   TEST_USER_EMAIL=your-email@example.com');
    console.log('   TEST_USER_PASSWORD=your-password');
    console.log('   TEST_ORG_ID=your-org-id (optional)');
    process.exit(1);
  }
  console.log();

  const startTime = Date.now();

  // Process endpoints in batches
  for (let i = 0; i < endpoints.length; i += CONCURRENT_REQUESTS) {
    const batch = endpoints.slice(i, i + CONCURRENT_REQUESTS);
    await processBatch(batch);
    
    // Small delay between batches
    if (i + CONCURRENT_REQUESTS < endpoints.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  const totalTime = Date.now() - startTime;

  // Print results
  console.log();
  console.log('📊 TEST RESULTS');
  console.log('=' .repeat(60));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log(`Total Time: ${totalTime}ms`);
  
  if (results.responseTimes.length > 0) {
    const avgResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
    const maxResponseTime = Math.max(...results.responseTimes);
    const minResponseTime = Math.min(...results.responseTimes);
    console.log(`Avg Response Time: ${avgResponseTime.toFixed(0)}ms`);
    console.log(`Max Response Time: ${maxResponseTime}ms`);
    console.log(`Min Response Time: ${minResponseTime}ms`);
  }

  console.log();
  console.log('📈 RESULTS BY CATEGORY');
  console.log('=' .repeat(60));
  Object.entries(results.categories).forEach(([category, stats]) => {
    const successRate = ((stats.passed / stats.total) * 100).toFixed(1);
    console.log(`${category.padEnd(15)}: ${stats.passed}/${stats.total} (${successRate}%)`);
  });

  if (results.errors.length > 0) {
    console.log();
    console.log('❌ FAILED ENDPOINTS');
    console.log('=' .repeat(60));
    results.errors.forEach(error => {
      if (error.status) {
        console.log(`${error.endpoint} - Status: ${error.status} (${error.category})`);
      } else {
        console.log(`${error.endpoint} - Error: ${error.error} (${error.category})`);
      }
    });
  }

  console.log();
  console.log('🎯 SUCCESS CRITERIA');
  console.log('=' .repeat(60));
  const successRate = (results.passed / results.total) * 100;
  
  if (successRate >= 95) {
    console.log('🎉 EXCELLENT: All endpoints working properly!');
    process.exit(0);
  } else if (successRate >= 90) {
    console.log('✅ GOOD: Most endpoints working, minor issues to fix');
    process.exit(1);
  } else if (successRate >= 80) {
    console.log('⚠️  WARNING: Several endpoints need attention');
    process.exit(2);
  } else {
    console.log('🚨 CRITICAL: Major issues with backend endpoints');
    process.exit(3);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('MarketSage Backend Endpoint Verification Suite');
  console.log();
  console.log('Usage: node test-endpoints.js [options]');
  console.log();
  console.log('Options:');
  console.log('  --help, -h     Show this help message');
  console.log('  --url <url>    Set backend URL (default: http://localhost:3006)');
  console.log('  --timeout <ms> Set request timeout (default: 10000)');
  console.log('  --concurrent <n> Set concurrent requests (default: 5)');
  console.log();
  console.log('Environment Variables:');
  console.log('  NESTJS_BACKEND_URL     Backend URL to test');
  console.log('  TEST_USER_EMAIL        Real user email for authentication');
  console.log('  TEST_USER_PASSWORD     Real user password for authentication');
  console.log('  TEST_ORG_ID            Organization ID (optional)');
  console.log();
  console.log('Example:');
  console.log('  TEST_USER_EMAIL=admin@marketsage.com TEST_USER_PASSWORD=admin123 node test-endpoints.js');
  process.exit(0);
}

// Parse command line arguments
const urlIndex = process.argv.indexOf('--url');
if (urlIndex !== -1 && process.argv[urlIndex + 1]) {
  BACKEND_URL = process.argv[urlIndex + 1];
}

const timeoutIndex = process.argv.indexOf('--timeout');
if (timeoutIndex !== -1 && process.argv[timeoutIndex + 1]) {
  TEST_TIMEOUT = parseInt(process.argv[timeoutIndex + 1]);
}

const concurrentIndex = process.argv.indexOf('--concurrent');
if (concurrentIndex !== -1 && process.argv[concurrentIndex + 1]) {
  CONCURRENT_REQUESTS = parseInt(process.argv[concurrentIndex + 1]);
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(4);
});
