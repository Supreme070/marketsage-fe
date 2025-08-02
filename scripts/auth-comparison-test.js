#!/usr/bin/env node

/**
 * Auth Endpoint Comparison Test
 * Tests Next.js vs NestJS authentication endpoints for compatibility
 */

const axios = require('axios');

const NEXT_JS_BASE = 'http://localhost:3007';
const NESTJS_BASE = 'http://localhost:3006';

// Test configuration
const TEST_USER = {
  name: "Test User",
  email: `test${Date.now()}@example.com`,
  password: "TestPass123@",
  company: "Test Company" // Next.js format
};

const TEST_USER_NESTJS = {
  name: "Test User",
  email: `test${Date.now()}@example.com`, 
  password: "TestPass123@",
  organizationName: "Test Company" // NestJS format
};

class AuthComparisonTest {
  constructor() {
    this.results = {
      nextjs: {},
      nestjs: {},
      comparison: {}
    };
  }

  async testNextJsRegistration() {
    console.log('🟦 Testing Next.js Registration...');
    try {
      const response = await axios.post(`${NEXT_JS_BASE}/api/auth/register`, TEST_USER, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      this.results.nextjs.registration = {
        status: response.status,
        success: true,
        data: response.data,
        responseTime: response.headers['x-response-time'] || 'N/A'
      };
      
      console.log('✅ Next.js Registration successful');
      console.log(`   Status: ${response.status}`);
      console.log(`   User ID: ${response.data.user?.id}`);
      
    } catch (error) {
      this.results.nextjs.registration = {
        status: error.response?.status || 'ERROR',
        success: false,
        error: error.response?.data || error.message,
        responseTime: 'N/A'
      };
      
      console.log('❌ Next.js Registration failed');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
    }
  }

  async testNestJsRegistration() {
    console.log('🟨 Testing NestJS Registration...');
    try {
      const response = await axios.post(`${NESTJS_BASE}/api/v2/auth/register`, TEST_USER_NESTJS, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      this.results.nestjs.registration = {
        status: response.status,
        success: true,
        data: response.data,
        responseTime: response.headers['x-response-time'] || 'N/A'
      };
      
      console.log('✅ NestJS Registration successful');
      console.log(`   Status: ${response.status}`);
      console.log(`   User ID: ${response.data.data?.id}`);
      
    } catch (error) {
      this.results.nestjs.registration = {
        status: error.response?.status || 'ERROR',
        success: false,
        error: error.response?.data || error.message,
        responseTime: 'N/A'
      };
      
      console.log('❌ NestJS Registration failed');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async testNextJsLogin() {
    console.log('🟦 Testing Next.js Login...');
    try {
      // Note: Next.js uses NextAuth, so this might be different
      // For now, we'll test the basic auth endpoint structure
      const response = await axios.post(`${NEXT_JS_BASE}/api/auth/signin`, {
        email: TEST_USER.email,
        password: TEST_USER.password
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      this.results.nextjs.login = {
        status: response.status,
        success: true,
        data: response.data
      };
      
      console.log('✅ Next.js Login successful');
      
    } catch (error) {
      this.results.nextjs.login = {
        status: error.response?.status || 'ERROR',
        success: false,
        error: error.response?.data || error.message
      };
      
      console.log('❌ Next.js Login failed (expected - NextAuth handles this differently)');
    }
  }

  async testNestJsLogin() {
    console.log('🟨 Testing NestJS Login...');
    try {
      const response = await axios.post(`${NESTJS_BASE}/api/v2/auth/login`, {
        email: TEST_USER_NESTJS.email,
        password: TEST_USER_NESTJS.password
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      this.results.nestjs.login = {
        status: response.status,
        success: true,
        data: response.data,
        token: response.data.data?.token
      };
      
      console.log('✅ NestJS Login successful');
      console.log(`   Token: ${response.data.data?.token ? 'Generated' : 'Missing'}`);
      
    } catch (error) {
      this.results.nestjs.login = {
        status: error.response?.status || 'ERROR',
        success: false,
        error: error.response?.data || error.message
      };
      
      console.log('❌ NestJS Login failed');
      console.log(`   Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async testNestJsProfile() {
    console.log('🟨 Testing NestJS Profile...');
    
    if (!this.results.nestjs.login?.token) {
      console.log('⏭️  Skipping profile test - no auth token');
      return;
    }

    try {
      const response = await axios.get(`${NESTJS_BASE}/api/v2/auth/profile`, {
        headers: { 
          'Authorization': `Bearer ${this.results.nestjs.login.token}`,
          'Content-Type': 'application/json' 
        }
      });
      
      this.results.nestjs.profile = {
        status: response.status,
        success: true,
        data: response.data
      };
      
      console.log('✅ NestJS Profile successful');
      
    } catch (error) {
      this.results.nestjs.profile = {
        status: error.response?.status || 'ERROR',
        success: false,
        error: error.response?.data || error.message
      };
      
      console.log('❌ NestJS Profile failed');
      console.log(`   Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  compareResults() {
    console.log('\n📊 COMPARISON RESULTS');
    console.log('=' .repeat(50));

    // Registration comparison
    const nextjsReg = this.results.nextjs.registration;
    const nestjsReg = this.results.nestjs.registration;

    console.log('\n🔐 Registration Endpoints:');
    console.log(`Next.js: ${nextjsReg?.success ? '✅' : '❌'} (${nextjsReg?.status})`);
    console.log(`NestJS:  ${nestjsReg?.success ? '✅' : '❌'} (${nestjsReg?.status})`);

    // Response structure comparison
    if (nextjsReg?.success && nestjsReg?.success) {
      console.log('\n📝 Response Structure:');
      console.log('Next.js:', Object.keys(nextjsReg.data));
      console.log('NestJS: ', Object.keys(nestjsReg.data));
    }

    // Login comparison
    const nextjsLogin = this.results.nextjs.login;
    const nestjsLogin = this.results.nestjs.login;

    console.log('\n🔑 Login Endpoints:');
    console.log(`Next.js: ${nextjsLogin?.success ? '✅' : '❌'} (${nextjsLogin?.status})`);
    console.log(`NestJS:  ${nestjsLogin?.success ? '✅' : '❌'} (${nestjsLogin?.status})`);

    // Summary
    console.log('\n📋 SUMMARY:');
    const nextjsScore = (nextjsReg?.success ? 1 : 0) + (nextjsLogin?.success ? 1 : 0);
    const nestjsScore = (nestjsReg?.success ? 1 : 0) + (nestjsLogin?.success ? 1 : 0);
    
    console.log(`Next.js Score: ${nextjsScore}/2`);
    console.log(`NestJS Score:  ${nestjsScore}/2`);

    if (nestjsScore >= nextjsScore) {
      console.log('🎉 NestJS auth endpoints are ready for parallel testing!');
    } else {
      console.log('⚠️  NestJS needs fixes before parallel deployment');
    }
  }

  async run() {
    console.log('🚀 Starting Auth Endpoint Comparison Test');
    console.log('=' .repeat(50));

    // Test both registration endpoints
    await this.testNextJsRegistration();
    await this.testNestJsRegistration();

    // Test both login endpoints  
    await this.testNextJsLogin();
    await this.testNestJsLogin();

    // Test NestJS profile endpoint
    await this.testNestJsProfile();

    // Compare and summarize results
    this.compareResults();

    return this.results;
  }
}

// Run the test if called directly
if (require.main === module) {
  const test = new AuthComparisonTest();
  test.run().catch(console.error);
}

module.exports = AuthComparisonTest;