#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🚀 Auth Endpoint Load Test - Next.js vs NestJS');
console.log('===============================================');

const CONCURRENT_REQUESTS = 10;
const TEST_DURATION = 30; // seconds

// Test configuration
const tests = [
  {
    name: 'Next.js Health Check',
    url: 'http://localhost:3000/api/health',
    expected: 200
  },
  {
    name: 'NestJS Health Check',
    url: 'http://localhost:3006/api/v2/health',
    expected: 200
  },
  {
    name: 'Next.js Auth (Unauthorized)',
    url: 'http://localhost:3000/api/auth/register',
    method: 'POST',
    data: '{"test":"data"}',
    expected: 401
  },
  {
    name: 'NestJS Auth (Rate Limited)',
    url: 'http://localhost:3006/api/v2/auth/register',
    method: 'POST',
    data: '{"test":"data"}',
    expected: [400, 429] // Bad request or rate limited
  }
];

async function runLoadTest(test) {
  console.log(`\n📊 Testing: ${test.name}`);
  console.log(`   URL: ${test.url}`);
  
  const startTime = Date.now();
  let successCount = 0;
  let errorCount = 0;
  let responseTimes = [];
  
  const promises = [];
  
  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    const promise = testSingleRequest(test)
      .then((result) => {
        if (result.success) {
          successCount++;
          responseTimes.push(result.responseTime);
        } else {
          errorCount++;
        }
      })
      .catch(() => {
        errorCount++;
      });
    
    promises.push(promise);
  }
  
  await Promise.all(promises);
  
  const totalTime = Date.now() - startTime;
  const avgResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
    : 0;
  
  console.log(`   ✅ Success: ${successCount}/${CONCURRENT_REQUESTS}`);
  console.log(`   ❌ Errors: ${errorCount}/${CONCURRENT_REQUESTS}`);
  console.log(`   ⏱️  Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`   🏁 Total Time: ${totalTime}ms`);
  console.log(`   📈 Requests/sec: ${(CONCURRENT_REQUESTS / (totalTime / 1000)).toFixed(2)}`);
  
  return {
    name: test.name,
    successCount,
    errorCount,
    avgResponseTime,
    totalTime,
    requestsPerSecond: CONCURRENT_REQUESTS / (totalTime / 1000)
  };
}

async function testSingleRequest(test) {
  const startTime = Date.now();
  
  try {
    let curlCommand = `curl -s -w '%{http_code}' -o /dev/null`;
    
    if (test.method && test.method !== 'GET') {
      curlCommand += ` -X ${test.method}`;
    }
    
    if (test.data) {
      curlCommand += ` -H "Content-Type: application/json" -d '${test.data}'`;
    }
    
    curlCommand += ` "${test.url}"`;
    
    const result = execSync(curlCommand, { encoding: 'utf8', timeout: 5000 });
    const httpCode = parseInt(result.trim());
    const responseTime = Date.now() - startTime;
    
    const expectedCodes = Array.isArray(test.expected) ? test.expected : [test.expected];
    const success = expectedCodes.includes(httpCode);
    
    return {
      success,
      responseTime,
      httpCode
    };
  } catch (error) {
    return {
      success: false,
      responseTime: Date.now() - startTime,
      error: error.message
    };
  }
}

async function main() {
  const results = [];
  
  for (const test of tests) {
    const result = await runLoadTest(test);
    results.push(result);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🏆 LOAD TEST SUMMARY');
  console.log('====================');
  
  results.forEach(result => {
    console.log(`\n${result.name}:`);
    console.log(`  Success Rate: ${((result.successCount / (result.successCount + result.errorCount)) * 100).toFixed(1)}%`);
    console.log(`  Avg Response Time: ${result.avgResponseTime.toFixed(2)}ms`);
    console.log(`  Requests/sec: ${result.requestsPerSecond.toFixed(2)}`);
  });
  
  // Compare Next.js vs NestJS health endpoints
  const nextjsHealth = results.find(r => r.name.includes('Next.js Health'));
  const nestjsHealth = results.find(r => r.name.includes('NestJS Health'));
  
  if (nextjsHealth && nestjsHealth) {
    console.log('\n🔄 Next.js vs NestJS Comparison:');
    console.log(`  Next.js: ${nextjsHealth.avgResponseTime.toFixed(2)}ms (${nextjsHealth.requestsPerSecond.toFixed(2)} req/s)`);
    console.log(`  NestJS:  ${nestjsHealth.avgResponseTime.toFixed(2)}ms (${nestjsHealth.requestsPerSecond.toFixed(2)} req/s)`);
    
    if (nestjsHealth.avgResponseTime < nextjsHealth.avgResponseTime) {
      console.log(`  🏆 NestJS is ${(nextjsHealth.avgResponseTime / nestjsHealth.avgResponseTime).toFixed(2)}x faster`);
    } else {
      console.log(`  🏆 Next.js is ${(nestjsHealth.avgResponseTime / nextjsHealth.avgResponseTime).toFixed(2)}x faster`);
    }
  }
  
  console.log('\n✅ Load test completed successfully!');
}

main().catch(console.error);