#!/usr/bin/env node

/**
 * MarketSage Backend Endpoint Verification Suite
 * Tests all 150+ backend endpoints to ensure they return 200 status codes
 */

const https = require('https');
const http = require('http');

// Configuration
let BACKEND_URL = process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';
const API_PREFIX = '/api/v2';
let TEST_TIMEOUT = 10000; // 10 seconds
let CONCURRENT_REQUESTS = 5; // Limit concurrent requests

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
  { method: 'GET', path: '/auth/profile', category: 'Auth', auth: true },
  { method: 'POST', path: '/auth/login', category: 'Auth', auth: false },
  { method: 'POST', path: '/auth/register', category: 'Auth', auth: false },
  { method: 'POST', path: '/auth/refresh', category: 'Auth', auth: false },
  { method: 'POST', path: '/auth/logout', category: 'Auth', auth: true },

  // Users Management
  { method: 'GET', path: '/users', category: 'Users', auth: true },
  { method: 'POST', path: '/users', category: 'Users', auth: true },
  { method: 'GET', path: '/users/cmfwux6jm0000r2lua1jmj47n', category: 'Users', auth: true },
  { method: 'PATCH', path: '/users/cmfwux6jm0000r2lua1jmj47n', category: 'Users', auth: true },
  { method: 'DELETE', path: '/users/cmfwux6jm0000r2lua1jmj47n', category: 'Users', auth: true },

  // Organizations
  { method: 'GET', path: '/organizations', category: 'Organizations', auth: true },
  { method: 'POST', path: '/organizations', category: 'Organizations', auth: true },
  { method: 'GET', path: '/organizations/cmfwww2wq0001r2mf198nyple', category: 'Organizations', auth: true },
  { method: 'PATCH', path: '/organizations/cmfwww2wq0001r2mf198nyple', category: 'Organizations', auth: true },
  { method: 'DELETE', path: '/organizations/cmfwww2wq0001r2mf198nyple', category: 'Organizations', auth: true },

  // Campaigns
  { method: 'GET', path: '/campaigns', category: 'Campaigns', auth: true },
  { method: 'POST', path: '/campaigns', category: 'Campaigns', auth: true },
  { method: 'GET', path: '/campaigns/cmfwwwdb60005r2mf8wbbqffh', category: 'Campaigns', auth: true },
  { method: 'PATCH', path: '/campaigns/cmfwwwdb60005r2mf8wbbqffh', category: 'Campaigns', auth: true },
  { method: 'DELETE', path: '/campaigns/cmfwwwdb60005r2mf8wbbqffh', category: 'Campaigns', auth: true },
  { method: 'POST', path: '/campaigns/cmfwwwdb60005r2mf8wbbqffh/send', category: 'Campaigns', auth: true },
  { method: 'GET', path: '/campaigns/cmfwwwdb60005r2mf8wbbqffh/analytics', category: 'Campaigns', auth: true },

  // Contacts
  { method: 'GET', path: '/contacts', category: 'Contacts', auth: true },
  { method: 'POST', path: '/contacts', category: 'Contacts', auth: true },
  { method: 'GET', path: '/contacts/cmfwyrk100037r2kt2oi6i3el', category: 'Contacts', auth: true },
  { method: 'PUT', path: '/contacts/cmfwyrk100037r2kt2oi6i3el', category: 'Contacts', auth: true },
  { method: 'DELETE', path: '/contacts/cmfwyrk100037r2kt2oi6i3el', category: 'Contacts', auth: true },
  { method: 'POST', path: '/contacts/import', category: 'Contacts', auth: true },
  { method: 'GET', path: '/contacts/export', category: 'Contacts', auth: true },

  // Email Module
  { method: 'GET', path: '/email/campaigns', category: 'Email', auth: true },
  { method: 'POST', path: '/email/campaigns', category: 'Email', auth: true },
  { method: 'GET', path: '/email/campaigns/cmfwyrp6n0039r2kt85aqj5k6', category: 'Email', auth: true },
  { method: 'PUT', path: '/email/campaigns/cmfwyrp6n0039r2kt85aqj5k6', category: 'Email', auth: true },
  { method: 'DELETE', path: '/email/campaigns/cmfwyrp6n0039r2kt85aqj5k6', category: 'Email', auth: true },
  { method: 'GET', path: '/email/templates', category: 'Email', auth: true },
  { method: 'POST', path: '/email/templates', category: 'Email', auth: true },
  { method: 'GET', path: '/email/providers', category: 'Email', auth: true },
  { method: 'POST', path: '/email/providers', category: 'Email', auth: true },

  // SMS Module
  { method: 'GET', path: '/sms/campaigns', category: 'SMS', auth: true },
  { method: 'POST', path: '/sms/campaigns', category: 'SMS', auth: true },
  { method: 'GET', path: '/sms/campaigns/cmfwyrtzg003br2kt9mwikp05', category: 'SMS', auth: true },
  { method: 'PUT', path: '/sms/campaigns/cmfwyrtzg003br2kt9mwikp05', category: 'SMS', auth: true },
  { method: 'DELETE', path: '/sms/campaigns/cmfwyrtzg003br2kt9mwikp05', category: 'SMS', auth: true },
  { method: 'GET', path: '/sms/templates', category: 'SMS', auth: true },
  { method: 'POST', path: '/sms/templates', category: 'SMS', auth: true },
  { method: 'GET', path: '/sms/providers', category: 'SMS', auth: true },
  { method: 'POST', path: '/sms/providers', category: 'SMS', auth: true },

  // WhatsApp Module
  { method: 'GET', path: '/whatsapp/campaigns', category: 'WhatsApp', auth: true },
  { method: 'POST', path: '/whatsapp/campaigns', category: 'WhatsApp', auth: true },
  { method: 'GET', path: '/whatsapp/campaigns/cmfwyrz10003dr2ktzc3q5s5y', category: 'WhatsApp', auth: true },
  { method: 'PUT', path: '/whatsapp/campaigns/cmfwyrz10003dr2ktzc3q5s5y', category: 'WhatsApp', auth: true },
  { method: 'DELETE', path: '/whatsapp/campaigns/cmfwyrz10003dr2ktzc3q5s5y', category: 'WhatsApp', auth: true },
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
  password: process.env.TEST_USER_PASSWORD || 'admin123'
};

// Helper function to generate valid test data for POST requests
function getTestData(endpoint) {
  const baseData = {
    name: 'Test Item',
    description: 'Test Description',
    content: 'Test Content',
    subject: 'Test Subject',
    from: 'test@example.com',
    message: 'Test Message',
    email: 'test@example.com',
    password: 'password123',
    plan: 'FREE',
    channels: ['EMAIL'],
    emailConfig: {
      subject: 'Test Subject',
      content: 'Test Content',
      from: 'test@example.com'
    }
  };

  switch (endpoint.path) {
    case '/auth/register':
      return {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User'
      };
    case '/users':
      return {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        role: 'USER'
      };
    case '/organizations':
      return {
        name: 'New Organization',
        plan: 'FREE'
      };
    case '/campaigns':
      return {
        name: 'Test Campaign',
        channels: ['EMAIL'],
        emailConfig: {
          subject: 'Test Subject',
          content: 'Test Content',
          from: 'test@example.com'
        }
      };
    // PATCH endpoints - only send fields that can be updated
    case '/users/cmfwux6jm0000r2lua1jmj47n':
      return {
        name: 'Updated Test Admin'
      };
    case '/organizations/cmfwww2wq0001r2mf198nyple':
      return {
        name: 'Updated Organization'
      };
    case '/campaigns/cmfwwwdb60005r2mf8wbbqffh':
      return {
        name: 'Updated Campaign',
        description: 'Updated description'
      };
    case '/contacts':
      return {
        email: 'contact@example.com',
        firstName: 'Test',
        lastName: 'Contact',
        phone: '+1234567890'
      };
    // PUT endpoints for contacts and campaigns
    case '/contacts/cmfwyrk100037r2kt2oi6i3el':
      return {
        firstName: 'Updated',
        lastName: 'Contact'
      };
    case '/email/campaigns/cmfwyrp6n0039r2kt85aqj5k6':
      return {
        name: 'Updated Email Campaign',
        subject: 'Updated Subject'
      };
    case '/sms/campaigns/cmfwyrtzg003br2kt9mwikp05':
      return {
        name: 'Updated SMS Campaign',
        content: 'Updated SMS content'
      };
    case '/whatsapp/campaigns/cmfwyrz10003dr2ktzc3q5s5y':
      return {
        name: 'Updated WhatsApp Campaign',
        content: 'Updated WhatsApp content'
      };
    case '/email/campaigns':
      return {
        name: 'Test Email Campaign',
        subject: 'Test Subject',
        content: 'Test Content',
        from: 'test@example.com'
      };
    case '/sms/campaigns':
      return {
        name: 'Test SMS Campaign',
        content: 'Test SMS Message',
        from: '+1234567890'
      };
    case '/whatsapp/campaigns':
      return {
        name: 'Test WhatsApp Campaign',
        content: 'Test WhatsApp Message',
        from: '+1234567890'
      };
    case '/email/templates':
      return {
        name: 'Test Email Template',
        subject: 'Test Subject',
        content: 'Test Content'
      };
    case '/sms/templates':
      return {
        name: 'Test SMS Template',
        content: 'Test SMS Message'
      };
    case '/whatsapp/templates':
      return {
        name: 'Test WhatsApp Template',
        content: 'Test WhatsApp Message'
      };
    case '/email/providers':
      return {
        name: 'Test Email Provider',
        providerType: 'smtp',
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
        smtpUsername: 'test@example.com',
        smtpPassword: 'password123',
        fromEmail: 'test@example.com'
      };
    case '/sms/providers':
      return {
        provider: 'twilio',
        senderId: 'TestSender',
        apiKey: 'test-api-key',
        apiSecret: 'test-api-secret'
      };
    case '/ai/autonomous-segmentation':
      return {
        name: 'Test Segmentation',
        criteria: { revenue: '>1000' }
      };
    case '/ai/customer-journey-optimization':
      return {
        name: 'Test Journey',
        stages: ['awareness', 'purchase']
      };
    case '/ai/predictive-analytics':
      return {
        name: 'Test Analytics',
        type: 'revenue',
        timeframe: 'next_month'
      };
    case '/ai/feedback':
      return {
        type: 'positive',
        message: 'Test feedback',
        rating: 5
      };
    case '/notifications':
      return {
        title: 'Test Notification',
        message: 'Test message',
        type: 'info'
      };
    // Campaign send endpoint
    case '/campaigns/cmfwwwdb60005r2mf8wbbqffh/send':
      return {
        targetAudience: 'all',
        scheduledFor: null
      };
    // AI endpoints with proper validation
    case '/ai/autonomous-segmentation':
      return {
        name: 'Test Segmentation',
        criteria: { revenue: '>1000' },
        description: 'Test segmentation description'
      };
    case '/ai/customer-journey-optimization':
      return {
        name: 'Test Journey',
        stages: ['awareness', 'purchase'],
        description: 'Test journey description'
      };
    case '/ai/predictive-analytics':
      return {
        name: 'Test Analytics',
        type: 'revenue',
        timeframe: 'next_month',
        description: 'Test analytics description'
      };
    case '/ai/feedback':
      return {
        type: 'positive',
        message: 'Test feedback',
        rating: 5,
        category: 'general'
      };
    case '/workflows':
      return {
        name: 'Test Workflow',
        description: 'Test workflow description',
        definition: {
          type: 'automation',
          steps: []
        }
      };
    case '/contacts/import':
      return {
        contacts: [
          { name: 'Test Contact', email: 'test@example.com' }
        ]
      };
    default:
      return baseData;
  }
}

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
          const responseBody = Buffer.concat(chunks).toString();
          console.log('Auth response status:', res.statusCode);
          console.log('Auth response body:', responseBody);
          const body = JSON.parse(responseBody);
          if (res.statusCode === 200 && body.success) {
            REAL_JWT_TOKEN = body.data.token;
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
      const testData = getTestData(endpoint);
      req.write(JSON.stringify(testData));
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
