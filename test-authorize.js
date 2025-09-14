#!/usr/bin/env node

/**
 * Test script to directly test the NextAuth authorize function
 */

const fetch = require('node-fetch');

const TEST_EMAIL = 'admin@marketsage.africa';
const TEST_PASSWORD = 'admin123456';

async function testAuthorizeFunction() {
  console.log('🧪 Testing NextAuth Authorize Function');
  console.log('=====================================');
  
  try {
    // Test the backend directly
    console.log('\n1️⃣ Testing backend authentication directly...');
    const backendUrl = 'http://localhost:3006';
    const response = await fetch(`${backendUrl}/api/v2/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });
    
    console.log('Backend response status:', response.status);
    const result = await response.json();
    console.log('Backend response:', JSON.stringify(result, null, 2));
    
    if (result.success && result.data?.user) {
      console.log('✅ Backend authentication successful');
      console.log('User:', result.data.user);
      console.log('Token:', result.data.token);
    } else {
      console.log('❌ Backend authentication failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAuthorizeFunction();

