#!/usr/bin/env node

const http = require('http');
const https = require('https');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3006';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'admin@marketsage.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'admin123';
const CONCURRENT_REQUESTS = parseInt(process.env.CONCURRENT_REQUESTS) || 5;
const TIMEOUT = parseInt(process.env.TIMEOUT) || 10000;

// Test credentials
const TEST_CREDENTIALS = {
  email: TEST_USER_EMAIL,
  password: TEST_USER_PASSWORD
};

// Dynamic ID storage
let dynamicIds = {
  contact: null,
  emailCampaign: null,
  smsCampaign: null,
  whatsappCampaign: null,
  user: null,
  organization: null,
  campaign: null
};

// Results tracking
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  categories: {}
};

// Helper function to make HTTP requests
function makeRequest(endpoint) {
  return new Promise((resolve) => {
    const url = new URL(BACKEND_URL + '/api/v2' + endpoint.path);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MarketSage-Test-Suite/1.0'
      },
      timeout: TIMEOUT
    };

    // Add authorization header if required
    if (endpoint.auth && global.authToken) {
      options.headers['Authorization'] = `Bearer ${global.authToken}`;
    }

    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        resolve({
          status: res.statusCode,
          data: data,
          responseTime: responseTime
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        status: 0,
        error: error.message,
        responseTime: Date.now() - startTime
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        status: 0,
        error: 'Request timeout',
        responseTime: TIMEOUT
      });
    });

    const startTime = Date.now();

    // Add body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      const testData = getTestData(endpoint);
      req.write(JSON.stringify(testData));
    }

    req.end();
  });
}

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
    case '/contacts':
      return {
        email: 'contact@example.com',
        firstName: 'Test',
        lastName: 'Contact',
        phone: '+1234567890'
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
        criteria: 'revenue > 1000',
        minSegmentSize: 10,
        features: ['revenue', 'engagement', 'purchase_history']
      };
    case '/ai/customer-journey-optimization':
      return {
        customerId: dynamicIds.user || 'test-customer-id',
        touchpoints: ['email', 'website', 'social'],
        goals: { conversion: 'increase', engagement: 'improve' }
      };
    case '/ai/predictive-analytics':
      return {
        modelType: 'revenue',
        inputData: { customerId: dynamicIds.user || 'test-customer-id', timeframe: '30_days' },
        forecastDays: 30
      };
    case '/ai/feedback':
      return {
        feedbackType: 'positive',
        data: { rating: 5, category: 'general', message: 'Test feedback message' },
        userId: dynamicIds.user
      };
    case '/notifications':
      return {
        title: 'Test Notification',
        message: 'Test message',
        type: 'INFO',
        category: 'GENERAL'
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
    // PATCH endpoints - only send fields that can be updated
    case '/users/' + dynamicIds.user:
      return {
        name: 'Updated Test Admin'
      };
    case '/organizations/' + dynamicIds.organization:
      return {
        name: 'Updated Organization'
      };
    case '/campaigns/' + dynamicIds.campaign:
      return {
        name: 'Updated Campaign',
        description: 'Updated description'
      };
    // PUT endpoints for contacts and campaigns
    case '/contacts/' + dynamicIds.contact:
      return {
        firstName: 'Updated',
        lastName: 'Contact'
      };
    case '/email/campaigns/' + dynamicIds.emailCampaign:
      return {
        name: 'Updated Email Campaign',
        subject: 'Updated Subject'
      };
    case '/sms/campaigns/' + dynamicIds.smsCampaign:
      return {
        name: 'Updated SMS Campaign',
        content: 'Updated SMS content'
      };
    case '/whatsapp/campaigns/' + dynamicIds.whatsappCampaign:
      return {
        name: 'Updated WhatsApp Campaign',
        content: 'Updated WhatsApp content'
      };
    // Campaign send endpoint
    case '/campaigns/' + dynamicIds.campaign + '/send':
      return {
        scheduledFor: null
      };
    default:
      return baseData;
  }
}

// Function to create test resources
async function createTestResources() {
  console.log('🔧 Creating test resources...');
  
  try {
    // Create contact
    const contactResult = await makeRequest({
      method: 'POST',
      path: '/contacts',
      auth: true
    });
    if (contactResult.status === 201) {
      const contactData = JSON.parse(contactResult.data);
      dynamicIds.contact = contactData.data?.id || contactData.id;
      console.log(`✅ Created contact: ${dynamicIds.contact}`);
    } else {
      console.log(`❌ Failed to create contact: ${contactResult.status} - ${contactResult.data}`);
    }

    // Create email campaign
    const emailCampaignResult = await makeRequest({
      method: 'POST',
      path: '/email/campaigns',
      auth: true
    });
    if (emailCampaignResult.status === 201) {
      const emailCampaignData = JSON.parse(emailCampaignResult.data);
      dynamicIds.emailCampaign = emailCampaignData.id;
      console.log(`✅ Created email campaign: ${dynamicIds.emailCampaign}`);
    } else {
      console.log(`❌ Failed to create email campaign: ${emailCampaignResult.status} - ${emailCampaignResult.data}`);
    }

    // Create SMS campaign
    const smsCampaignResult = await makeRequest({
      method: 'POST',
      path: '/sms/campaigns',
      auth: true
    });
    if (smsCampaignResult.status === 201) {
      const smsCampaignData = JSON.parse(smsCampaignResult.data);
      dynamicIds.smsCampaign = smsCampaignData.id;
      console.log(`✅ Created SMS campaign: ${dynamicIds.smsCampaign}`);
    } else {
      console.log(`❌ Failed to create SMS campaign: ${smsCampaignResult.status} - ${smsCampaignResult.data}`);
    }

    // Create WhatsApp campaign
    const whatsappCampaignResult = await makeRequest({
      method: 'POST',
      path: '/whatsapp/campaigns',
      auth: true
    });
    if (whatsappCampaignResult.status === 201) {
      const whatsappCampaignData = JSON.parse(whatsappCampaignResult.data);
      dynamicIds.whatsappCampaign = whatsappCampaignData.id;
      console.log(`✅ Created WhatsApp campaign: ${dynamicIds.whatsappCampaign}`);
    } else {
      console.log(`❌ Failed to create WhatsApp campaign: ${whatsappCampaignResult.status} - ${whatsappCampaignResult.data}`);
    }

    // Get existing user and organization IDs
    const userResult = await makeRequest({
      method: 'GET',
      path: '/auth/profile',
      auth: true
    });
    if (userResult.status === 200) {
      const userData = JSON.parse(userResult.data);
      dynamicIds.user = userData.data?.id || userData.id;
      dynamicIds.organization = userData.data?.organizationId || userData.organizationId;
      console.log(`✅ Retrieved user: ${dynamicIds.user}, organization: ${dynamicIds.organization}`);
    } else {
      console.log(`❌ Failed to retrieve user: ${userResult.status} - ${userResult.data}`);
    }

    // Get existing campaign ID
    const campaignResult = await makeRequest({
      method: 'GET',
      path: '/campaigns',
      auth: true
    });
    if (campaignResult.status === 200) {
      const campaignData = JSON.parse(campaignResult.data);
      if (campaignData.data?.campaigns?.[0]?.id) {
        dynamicIds.campaign = campaignData.data.campaigns[0].id;
        console.log(`✅ Retrieved campaign: ${dynamicIds.campaign}`);
      } else if (campaignData.campaigns?.[0]?.id) {
        dynamicIds.campaign = campaignData.campaigns[0].id;
        console.log(`✅ Retrieved campaign: ${dynamicIds.campaign}`);
      } else {
        console.log(`❌ No campaigns found in response: ${JSON.stringify(campaignData)}`);
      }
    } else {
      console.log(`❌ Failed to retrieve campaigns: ${campaignResult.status} - ${campaignResult.data}`);
    }

  } catch (error) {
    console.error('❌ Error creating test resources:', error.message);
  }
}

// Function to generate dynamic endpoints
function generateDynamicEndpoints() {
  // Filter out endpoints with null IDs
  const baseEndpoints = [
    // Core Health Check
    { method: 'GET', path: '/health', category: 'Core', auth: false },

    // Authentication
    { method: 'POST', path: '/auth/login', category: 'Auth', auth: false },
    { method: 'GET', path: '/auth/profile', category: 'Auth', auth: true },
    { method: 'POST', path: '/auth/refresh', category: 'Auth', auth: false },
    { method: 'POST', path: '/auth/register', category: 'Auth', auth: false },
    { method: 'POST', path: '/auth/logout', category: 'Auth', auth: true },

    // Users Management
    { method: 'GET', path: '/users', category: 'Users', auth: true },
    { method: 'POST', path: '/users', category: 'Users', auth: true },
    ...(dynamicIds.user ? [
      { method: 'GET', path: '/users/' + dynamicIds.user, category: 'Users', auth: true },
      { method: 'PATCH', path: '/users/' + dynamicIds.user, category: 'Users', auth: true },
      { method: 'DELETE', path: '/users/' + dynamicIds.user, category: 'Users', auth: true }
    ] : []),

    // Organizations
    { method: 'GET', path: '/organizations', category: 'Organizations', auth: true },
    { method: 'POST', path: '/organizations', category: 'Organizations', auth: true },
    ...(dynamicIds.organization ? [
      { method: 'GET', path: '/organizations/' + dynamicIds.organization, category: 'Organizations', auth: true },
      { method: 'PATCH', path: '/organizations/' + dynamicIds.organization, category: 'Organizations', auth: true },
      { method: 'DELETE', path: '/organizations/' + dynamicIds.organization, category: 'Organizations', auth: true }
    ] : []),

    // Campaigns
    { method: 'GET', path: '/campaigns', category: 'Campaigns', auth: true },
    { method: 'POST', path: '/campaigns', category: 'Campaigns', auth: true },
    ...(dynamicIds.campaign ? [
      { method: 'GET', path: '/campaigns/' + dynamicIds.campaign, category: 'Campaigns', auth: true },
      { method: 'PATCH', path: '/campaigns/' + dynamicIds.campaign, category: 'Campaigns', auth: true },
      { method: 'DELETE', path: '/campaigns/' + dynamicIds.campaign, category: 'Campaigns', auth: true },
      { method: 'POST', path: '/campaigns/' + dynamicIds.campaign + '/send', category: 'Campaigns', auth: true },
      { method: 'GET', path: '/campaigns/' + dynamicIds.campaign + '/analytics', category: 'Campaigns', auth: true }
    ] : []),

    // Contacts
    { method: 'GET', path: '/contacts', category: 'Contacts', auth: true },
    { method: 'POST', path: '/contacts', category: 'Contacts', auth: true },
    ...(dynamicIds.contact ? [
      { method: 'GET', path: '/contacts/' + dynamicIds.contact, category: 'Contacts', auth: true },
      { method: 'PUT', path: '/contacts/' + dynamicIds.contact, category: 'Contacts', auth: true },
      { method: 'DELETE', path: '/contacts/' + dynamicIds.contact, category: 'Contacts', auth: true }
    ] : []),
    { method: 'POST', path: '/contacts/import', category: 'Contacts', auth: true },
    { method: 'GET', path: '/contacts/export', category: 'Contacts', auth: true },

    // Email Module
    { method: 'GET', path: '/email/campaigns', category: 'Email', auth: true },
    { method: 'POST', path: '/email/campaigns', category: 'Email', auth: true },
    ...(dynamicIds.emailCampaign ? [
      { method: 'GET', path: '/email/campaigns/' + dynamicIds.emailCampaign, category: 'Email', auth: true },
      { method: 'PUT', path: '/email/campaigns/' + dynamicIds.emailCampaign, category: 'Email', auth: true }
    ] : []),
    { method: 'GET', path: '/email/templates', category: 'Email', auth: true },
    { method: 'POST', path: '/email/templates', category: 'Email', auth: true },
    { method: 'GET', path: '/email/providers', category: 'Email', auth: true },
    { method: 'POST', path: '/email/providers', category: 'Email', auth: true },

    // SMS Module
    { method: 'GET', path: '/sms/campaigns', category: 'SMS', auth: true },
    { method: 'POST', path: '/sms/campaigns', category: 'SMS', auth: true },
    ...(dynamicIds.smsCampaign ? [
      { method: 'GET', path: '/sms/campaigns/' + dynamicIds.smsCampaign, category: 'SMS', auth: true },
      { method: 'PUT', path: '/sms/campaigns/' + dynamicIds.smsCampaign, category: 'SMS', auth: true }
    ] : []),
    { method: 'GET', path: '/sms/templates', category: 'SMS', auth: true },
    { method: 'POST', path: '/sms/templates', category: 'SMS', auth: true },
    { method: 'GET', path: '/sms/providers', category: 'SMS', auth: true },
    { method: 'POST', path: '/sms/providers', category: 'SMS', auth: true },

    // WhatsApp Module
    { method: 'GET', path: '/whatsapp/campaigns', category: 'WhatsApp', auth: true },
    { method: 'POST', path: '/whatsapp/campaigns', category: 'WhatsApp', auth: true },
    ...(dynamicIds.whatsappCampaign ? [
      { method: 'GET', path: '/whatsapp/campaigns/' + dynamicIds.whatsappCampaign, category: 'WhatsApp', auth: true },
      { method: 'PUT', path: '/whatsapp/campaigns/' + dynamicIds.whatsappCampaign, category: 'WhatsApp', auth: true }
    ] : []),
    { method: 'GET', path: '/whatsapp/templates', category: 'WhatsApp', auth: true },
    { method: 'POST', path: '/whatsapp/templates', category: 'WhatsApp', auth: true },

    // AI Intelligence Module
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

    // Analytics
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

    // Admin
    { method: 'GET', path: '/admin/dashboard', category: 'Admin', auth: true },
    { method: 'GET', path: '/admin/users', category: 'Admin', auth: true },
    { method: 'GET', path: '/admin/organizations', category: 'Admin', auth: true },
    { method: 'GET', path: '/admin/analytics', category: 'Admin', auth: true },
    { method: 'GET', path: '/admin/system', category: 'Admin', auth: true },
    { method: 'GET', path: '/admin/logs', category: 'Admin', auth: true },
    { method: 'GET', path: '/admin/maintenance', category: 'Admin', auth: true },
    { method: 'GET', path: '/admin/backups', category: 'Admin', auth: true },
    { method: 'GET', path: '/admin/security', category: 'Admin', auth: true },

    // Other modules
    { method: 'GET', path: '/billing', category: 'Billing', auth: true },
    { method: 'POST', path: '/billing', category: 'Billing', auth: true },
    { method: 'GET', path: '/dashboard', category: 'Dashboard', auth: true },
    { method: 'GET', path: '/messages', category: 'Messages', auth: true },
    { method: 'POST', path: '/messages', category: 'Messages', auth: true },
    { method: 'POST', path: '/notifications', category: 'Notifications', auth: true },
    { method: 'GET', path: '/notifications', category: 'Notifications', auth: true },
    { method: 'GET', path: '/settings', category: 'Settings', auth: true },
    { method: 'PUT', path: '/settings', category: 'Settings', auth: true },
    { method: 'GET', path: '/support', category: 'Support', auth: true },
    { method: 'POST', path: '/support', category: 'Support', auth: true },
    { method: 'GET', path: '/leadpulse', category: 'LeadPulse', auth: true },
    { method: 'POST', path: '/leadpulse', category: 'LeadPulse', auth: true },
    { method: 'GET', path: '/workflows', category: 'Workflows', auth: true },
    { method: 'POST', path: '/workflows', category: 'Workflows', auth: true },
    { method: 'GET', path: '/audit', category: 'Audit', auth: true },
    { method: 'GET', path: '/incidents', category: 'Incidents', auth: true },
    { method: 'GET', path: '/security', category: 'Security', auth: true },
    { method: 'GET', path: '/tracing', category: 'Tracing', auth: true }
  ];

  return baseEndpoints;
}

// Test a single endpoint
async function testEndpoint(endpoint) {
  try {
    const result = await makeRequest(endpoint);
    results.total++;
    
    if (result.status >= 200 && result.status < 300) {
      results.passed++;
      console.log(`✅ ${endpoint.method} ${endpoint.path} - ${result.status} (${result.responseTime}ms)`);
    } else {
      results.failed++;
      console.log(`❌ ${endpoint.method} ${endpoint.path} - ${result.status} (${result.responseTime}ms)`);
    }

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
    results.failed++;
    console.log(`❌ ${endpoint.method} ${endpoint.path} - ERROR: ${error.message}`);
  }
}

// Authenticate and get token
async function authenticate() {
  console.log('🔐 Authenticating with real credentials...');
  
  try {
    const url = new URL(BACKEND_URL + '/api/v2/auth/login');
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MarketSage-Test-Suite/1.0'
      },
      timeout: TIMEOUT
    };

    const client = url.protocol === 'https:' ? https : http;
    const authResult = await new Promise((resolve) => {
      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            data: data
          });
        });
      });

      req.on('error', (error) => {
        resolve({
          status: 0,
          error: error.message
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          status: 0,
          error: 'Request timeout'
        });
      });

      req.write(JSON.stringify(TEST_CREDENTIALS));
      req.end();
    });

    if (authResult.status === 200) {
      const authData = JSON.parse(authResult.data);
      global.authToken = authData.data?.token || authData.token;
      console.log('✅ Authentication successful');
      console.log(`   User: ${authData.data?.user?.email || authData.user?.email}`);
      console.log(`   Organization: ${authData.data?.user?.organizationId || authData.user?.organizationId || 'N/A'}`);
      return true;
    } else {
      console.log('❌ Authentication failed:', authResult.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Authentication failed:', error.message);
    return false;
  }
}

// Main test execution
async function runTests() {
  console.log('🚀 MarketSage Backend Endpoint Verification Suite (Dynamic)');
  console.log('============================================================');
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Test User: ${TEST_USER_EMAIL}`);
  console.log(`Concurrent Requests: ${CONCURRENT_REQUESTS}`);
  console.log(`Timeout: ${TIMEOUT}ms`);
  console.log('============================================================\n');

  // Authenticate
  const authSuccess = await authenticate();
  if (!authSuccess) {
    console.log('❌ Authentication failed. Exiting.');
    process.exit(1);
  }

  // Create test resources
  await createTestResources();

  // Generate dynamic endpoints
  const endpoints = generateDynamicEndpoints();
  console.log(`\n📋 Total Endpoints: ${endpoints.length}\n`);

  // Run tests
  const startTime = Date.now();
  
  for (let i = 0; i < endpoints.length; i += CONCURRENT_REQUESTS) {
    const batch = endpoints.slice(i, i + CONCURRENT_REQUESTS);
    await Promise.all(batch.map(testEndpoint));
  }

  const totalTime = Date.now() - startTime;

  // Print results
  console.log('\n📊 TEST RESULTS');
  console.log('============================================================');
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log(`Total Time: ${totalTime}ms`);
  console.log(`Avg Response Time: ${Math.round(totalTime / results.total)}ms`);

  console.log('\n📈 RESULTS BY CATEGORY');
  console.log('============================================================');
  Object.entries(results.categories).forEach(([category, stats]) => {
    const successRate = ((stats.passed / stats.total) * 100).toFixed(1);
    console.log(`${category.padEnd(15)} : ${stats.passed}/${stats.total} (${successRate}%)`);
  });

  console.log('\n🎯 SUCCESS CRITERIA');
  console.log('============================================================');
  if (results.passed / results.total >= 0.9) {
    console.log('🎉 EXCELLENT: Backend is performing exceptionally well');
  } else if (results.passed / results.total >= 0.8) {
    console.log('✅ GOOD: Backend is performing well with minor issues');
  } else if (results.passed / results.total >= 0.7) {
    console.log('⚠️  WARNING: Several endpoints need attention');
  } else {
    console.log('🚨 CRITICAL: Major issues with backend endpoints');
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(console.error);
