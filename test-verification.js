#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🧪 MarketSage System Verification Test');
console.log('======================================');

function testEndpoint(url, description, expectedCode = 200) {
  try {
    const result = execSync(`curl -s -w '%{http_code}' '${url}' -o /dev/null`, { encoding: 'utf8' });
    const httpCode = result.trim();
    
    if (httpCode === expectedCode.toString()) {
      console.log(`✅ ${description} - HTTP ${httpCode}`);
      return true;
    } else {
      console.log(`❌ ${description} - Expected ${expectedCode}, got ${httpCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description} - Error: ${error.message}`);
    return false;
  }
}

function testAuthenticatedEndpoint(url, description, token) {
  try {
    const result = execSync(`curl -s -w '%{http_code}' -H 'Authorization: Bearer ${token}' '${url}' -o /dev/null`, { encoding: 'utf8' });
    const httpCode = result.trim();
    
    if (httpCode === '200') {
      console.log(`✅ ${description} - HTTP ${httpCode}`);
      return true;
    } else {
      console.log(`❌ ${description} - HTTP ${httpCode} (Auth required)`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description} - Error: ${error.message}`);
    return false;
  }
}

let passed = 0;
let total = 0;

console.log('\n🏥 Health Checks:');
total++; if (testEndpoint('http://localhost:3000/api/health', 'Next.js Health')) passed++;
total++; if (testEndpoint('http://localhost:3006/api/v2/health', 'NestJS Health')) passed++;

console.log('\n🔐 Authentication Endpoints:');
total++; if (testEndpoint('http://localhost:3000/api/auth/register', 'Auth Registration', 405)) passed++;
total++; if (testEndpoint('http://localhost:3006/api/v2/auth/register', 'NestJS Registration', 400)) passed++;

console.log('\n📊 Feature Flags:');
total++; if (testEndpoint('http://localhost:3000/api/feature-flags', 'Feature Flags')) passed++;

console.log('\n🔀 Proxy Routes:');
total++; if (testEndpoint('http://localhost:3000/api/v2/health', 'Proxy to NestJS Health')) passed++;

console.log('\n🚀 Campaign Endpoints (Auth Required):');
total++; if (testEndpoint('http://localhost:3000/api/campaigns', 'Campaign List', 401)) passed++;
total++; if (testEndpoint('http://localhost:3000/api/email/templates', 'Email Templates', 401)) passed++;
total++; if (testEndpoint('http://localhost:3000/api/sms/balance', 'SMS Balance', 401)) passed++;

console.log('\n📈 LeadPulse Endpoints (Auth Required):');
total++; if (testEndpoint('http://localhost:3000/api/leadpulse/visitors', 'Visitor List', 401)) passed++;
total++; if (testEndpoint('http://localhost:3000/api/leadpulse/analytics', 'Analytics', 401)) passed++;

console.log('\n📱 MCP Server Status:');
for (let port = 3001; port <= 3005; port++) {
  total++;
  if (testEndpoint(`http://localhost:${port}/health`, `MCP Server ${port}`, [200, 404, 'UNREACHABLE'])) {
    passed++;
  }
}

console.log('\n===============================');
console.log(`🎯 VERIFICATION SUMMARY`);
console.log(`===============================`);
console.log(`Total Tests: ${total}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${total - passed}`);
console.log(`Success Rate: ${Math.round((passed/total) * 100)}%`);

if (passed === total) {
  console.log(`\n🎉 ALL SYSTEMS OPERATIONAL!`);
  console.log(`✅ Multi-channel campaign infrastructure ready`);
  console.log(`✅ LeadPulse visitor tracking operational`);
  console.log(`✅ Authentication systems functioning`);
  process.exit(0);
} else {
  console.log(`\n⚠️  Some systems need attention`);
  console.log(`🔍 Review failed endpoints above`);
  process.exit(1);
}