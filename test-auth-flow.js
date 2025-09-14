#!/usr/bin/env node

/**
 * Test script to verify NextAuth authentication flow
 * This script simulates the login process and checks each step
 */

const fetch = require('node-fetch');
const { CookieJar } = require('tough-cookie');

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'admin@marketsage.africa';
const TEST_PASSWORD = 'admin123456';

// Create a cookie jar to handle cookies properly
const cookieJar = new CookieJar();

async function testAuthFlow() {
  console.log('🧪 Testing NextAuth Authentication Flow');
  console.log('=====================================');
  
  try {
    // Step 1: Check initial session state
    console.log('\n1️⃣ Checking initial session state...');
    const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`);
    const sessionData = await sessionResponse.json();
    console.log('Initial session:', sessionData);
    
    // Step 2: Test debug endpoint
    console.log('\n2️⃣ Testing debug endpoint...');
    const debugResponse = await fetch(`${BASE_URL}/api/debug-auth`);
    const debugData = await debugResponse.json();
    console.log('Debug data:', debugData);
    
    // Step 3: Get CSRF token first
    console.log('\n3️⃣ Getting CSRF token...');
    const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
    const csrfData = await csrfResponse.json();
    console.log('CSRF token:', csrfData.csrfToken);
    
    // Step 4: Test NextAuth signin endpoint with CSRF token
    console.log('\n4️⃣ Testing NextAuth signin...');
    const signinResponse = await fetch(`${BASE_URL}/api/auth/signin/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': csrfResponse.headers.get('set-cookie') || ''
      },
      body: new URLSearchParams({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        redirect: 'false',
        json: 'true',
        csrfToken: csrfData.csrfToken
      })
    });
    
    console.log('Signin response status:', signinResponse.status);
    console.log('Signin response headers:', Object.fromEntries(signinResponse.headers.entries()));
    const signinData = await signinResponse.json();
    console.log('Signin response:', signinData);
    
    // Step 5: Check session after signin
    console.log('\n5️⃣ Checking session after signin...');
    const sessionAfterResponse = await fetch(`${BASE_URL}/api/auth/session`, {
      headers: {
        'Cookie': signinResponse.headers.get('set-cookie') || ''
      }
    });
    const sessionAfterData = await sessionAfterResponse.json();
    console.log('Session after signin:', sessionAfterData);
    
    // Step 6: Test protected endpoint
    console.log('\n6️⃣ Testing protected endpoint...');
    const protectedResponse = await fetch(`${BASE_URL}/api/debug-auth`, {
      headers: {
        'Cookie': signinResponse.headers.get('set-cookie') || ''
      }
    });
    const protectedData = await protectedResponse.json();
    console.log('Protected endpoint response:', protectedData);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAuthFlow();
