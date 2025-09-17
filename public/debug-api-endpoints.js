/**
 * Comprehensive API Endpoint Debugging Script
 * Run this in the browser console to test all API endpoints
 */

console.log('🔍 Starting comprehensive API endpoint debugging...');

// Test configuration
const API_BASE = 'http://localhost:3000';
const BACKEND_BASE = 'http://localhost:3006';

// Test functions
async function testEndpoint(url, options = {}) {
  console.log(`\n📡 Testing: ${url}`);
  console.log('Options:', options);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    console.log(`✅ Response Status: ${response.status} ${response.statusText}`);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    // Try to get response text first
    const responseText = await response.text();
    console.log('Response Text Length:', responseText.length);
    console.log('Response Text Preview:', responseText.substring(0, 200));
    
    // Try to parse as JSON
    let jsonData = null;
    try {
      jsonData = JSON.parse(responseText);
      console.log('✅ JSON Parsed Successfully');
      console.log('JSON Data:', jsonData);
    } catch (jsonError) {
      console.log('❌ JSON Parse Failed:', jsonError.message);
      console.log('Response appears to be HTML or other format');
    }
    
    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      text: responseText,
      json: jsonData
    };
    
  } catch (error) {
    console.log(`❌ Request Failed:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test NextAuth session endpoint
async function testNextAuthSession() {
  console.log('\n🔐 Testing NextAuth Session Endpoint');
  console.log('=====================================');
  
  const result = await testEndpoint(`${API_BASE}/api/auth/session`);
  
  if (result.json) {
    console.log('✅ NextAuth session endpoint working correctly');
    console.log('Session data:', result.json);
  } else {
    console.log('❌ NextAuth session endpoint returning non-JSON response');
    console.log('This explains the CLIENT_FETCH_ERROR');
  }
  
  return result;
}

// Test authentication endpoints
async function testAuthEndpoints() {
  console.log('\n🔐 Testing Authentication Endpoints');
  console.log('===================================');
  
  // Test login endpoint
  const loginResult = await testEndpoint(`${API_BASE}/api/v2/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'testpassword'
    })
  });
  
  // Test backend auth directly
  const backendAuthResult = await testEndpoint(`${BACKEND_BASE}/api/v2/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'testpassword'
    })
  });
  
  return { loginResult, backendAuthResult };
}

// Test campaign endpoints
async function testCampaignEndpoints() {
  console.log('\n📧 Testing Campaign Endpoints');
  console.log('=============================');
  
  // Test email campaigns via proxy
  const emailCampaignsResult = await testEndpoint(`${API_BASE}/api/v2/email/campaigns`);
  
  // Test WhatsApp campaigns via proxy
  const whatsappCampaignsResult = await testEndpoint(`${API_BASE}/api/v2/whatsapp/campaigns`);
  
  // Test SMS campaigns via proxy
  const smsCampaignsResult = await testEndpoint(`${API_BASE}/api/v2/sms/campaigns`);
  
  // Test backend directly
  const backendEmailResult = await testEndpoint(`${BACKEND_BASE}/api/v2/email/campaigns`);
  
  return {
    emailCampaignsResult,
    whatsappCampaignsResult,
    smsCampaignsResult,
    backendEmailResult
  };
}

// Test notifications endpoint
async function testNotificationsEndpoint() {
  console.log('\n🔔 Testing Notifications Endpoint');
  console.log('================================');
  
  const result = await testEndpoint(`${API_BASE}/api/v2/notifications`);
  
  if (result.json) {
    console.log('✅ Notifications endpoint working correctly');
    console.log('Response structure:', {
      hasSuccess: 'success' in result.json,
      hasData: 'data' in result.json,
      hasNotifications: 'notifications' in result.json,
      dataType: typeof result.json.data,
      dataIsArray: Array.isArray(result.json.data)
    });
  } else {
    console.log('❌ Notifications endpoint returning non-JSON response');
  }
  
  return result;
}

// Test proxy functionality
async function testProxyFunctionality() {
  console.log('\n🔄 Testing Proxy Functionality');
  console.log('==============================');
  
  // Test if proxy is forwarding requests correctly
  const proxyTestResult = await testEndpoint(`${API_BASE}/api/v2/email/campaigns`);
  const directTestResult = await testEndpoint(`${BACKEND_BASE}/api/v2/email/campaigns`);
  
  console.log('Proxy vs Direct comparison:');
  console.log('Proxy Status:', proxyTestResult.status);
  console.log('Direct Status:', directTestResult.status);
  console.log('Proxy Headers:', proxyTestResult.headers);
  console.log('Direct Headers:', directTestResult.headers);
  
  return { proxyTestResult, directTestResult };
}

// Test with authentication token
async function testWithAuthToken() {
  console.log('\n🔑 Testing with Authentication Token');
  console.log('====================================');
  
  // First, try to get a session token
  const sessionResult = await testEndpoint(`${API_BASE}/api/auth/session`);
  
  if (sessionResult.json && sessionResult.json.accessToken) {
    const token = sessionResult.json.accessToken;
    console.log('✅ Found access token in session');
    
    // Test authenticated request
    const authResult = await testEndpoint(`${API_BASE}/api/v2/email/campaigns`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Authenticated request result:', authResult);
    return authResult;
  } else {
    console.log('❌ No access token found in session');
    console.log('Session data:', sessionResult.json);
    return null;
  }
}

// Main test function
async function runAllTests() {
  console.log('🚀 Starting comprehensive API testing...');
  console.log('==========================================');
  
  const results = {};
  
  // Test NextAuth session
  results.nextAuthSession = await testNextAuthSession();
  
  // Test authentication endpoints
  results.authEndpoints = await testAuthEndpoints();
  
  // Test campaign endpoints
  results.campaignEndpoints = await testCampaignEndpoints();
  
  // Test notifications endpoint
  results.notificationsEndpoint = await testNotificationsEndpoint();
  
  // Test proxy functionality
  results.proxyFunctionality = await testProxyFunctionality();
  
  // Test with auth token
  results.authTokenTest = await testWithAuthToken();
  
  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log('NextAuth Session:', results.nextAuthSession.success ? '✅ Working' : '❌ Failed');
  console.log('Email Campaigns:', results.campaignEndpoints.emailCampaignsResult.success ? '✅ Working' : '❌ Failed');
  console.log('Notifications:', results.notificationsEndpoint.success ? '✅ Working' : '❌ Failed');
  console.log('Proxy Functionality:', results.proxyFunctionality.proxyTestResult.success ? '✅ Working' : '❌ Failed');
  
  // Identify issues
  console.log('\n🔍 IDENTIFIED ISSUES:');
  console.log('====================');
  
  if (!results.nextAuthSession.json) {
    console.log('❌ NextAuth session endpoint returning HTML instead of JSON');
    console.log('   This causes CLIENT_FETCH_ERROR');
  }
  
  if (results.campaignEndpoints.emailCampaignsResult.status === 401) {
    console.log('❌ Email campaigns returning 401 - authentication issue');
  }
  
  if (results.notificationsEndpoint.status === 401) {
    console.log('❌ Notifications returning 401 - authentication issue');
  }
  
  if (results.campaignEndpoints.emailCampaignsResult.json && 
      !Array.isArray(results.campaignEndpoints.emailCampaignsResult.json.campaigns)) {
    console.log('❌ Email campaigns response structure mismatch');
    console.log('   Expected: { campaigns: [...] }');
    console.log('   Got:', typeof results.campaignEndpoints.emailCampaignsResult.json.campaigns);
  }
  
  if (results.notificationsEndpoint.json && 
      !Array.isArray(results.notificationsEndpoint.json.data)) {
    console.log('❌ Notifications response structure mismatch');
    console.log('   Expected: { success: true, data: [...] }');
    console.log('   Got:', typeof results.notificationsEndpoint.json.data);
  }
  
  return results;
}

// Export for manual testing
window.debugAPI = {
  testEndpoint,
  testNextAuthSession,
  testAuthEndpoints,
  testCampaignEndpoints,
  testNotificationsEndpoint,
  testProxyFunctionality,
  testWithAuthToken,
  runAllTests
};

console.log('🔍 API debugging functions loaded. Run:');
console.log('  debugAPI.runAllTests() - Run all tests');
console.log('  debugAPI.testNextAuthSession() - Test NextAuth session');
console.log('  debugAPI.testCampaignEndpoints() - Test campaign endpoints');
console.log('  debugAPI.testNotificationsEndpoint() - Test notifications');



