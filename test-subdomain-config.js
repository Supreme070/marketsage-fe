#!/usr/bin/env node

/**
 * Test script to verify admin subdomain deployment configuration
 * This tests the environment and deployment setup without requiring actual deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing MarketSage Subdomain Deployment Configuration...\n');

// Test 1: Environment Configuration
console.log('1. Checking Environment Configuration:');
try {
  require('dotenv').config();
  
  const requiredVars = [
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_ADMIN_URL', 
    'NEXT_PUBLIC_USE_API_ONLY',
    'NEXT_PUBLIC_BACKEND_URL',
    'ADMIN_STAFF_EMAILS',
    'ADMIN_STAFF_DOMAINS'
  ];
  
  let allPresent = true;
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`   ✅ ${varName}: ${process.env[varName]}`);
    } else {
      console.log(`   ❌ ${varName}: Missing`);
      allPresent = false;
    }
  });
  
  if (allPresent) {
    console.log('   🎉 All required environment variables present\n');
  } else {
    console.log('   ⚠️  Some environment variables missing\n');
  }
} catch (error) {
  console.log('   ❌ Error loading environment:', error.message, '\n');
}

// Test 2: Deployment Files
console.log('2. Checking Deployment Files:');
const deploymentFiles = [
  'docker-compose.yml',
  'Dockerfile', 
  'nginx/nginx.conf',
  'nginx/conf.d/marketsage.conf',
  'healthcheck.js'
];

deploymentFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}: Present`);
  } else {
    console.log(`   ❌ ${file}: Missing`);
  }
});

// Test 3: Middleware Configuration
console.log('\n3. Checking Middleware Configuration:');
try {
  const middlewarePath = path.join(__dirname, 'src/middleware.ts');
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
  
  const checks = [
    { name: 'Admin Subdomain Detection', pattern: /isAdminSubdomain.*admin\./ },
    { name: 'Admin Route Rewriting', pattern: /admin\/dashboard/ },
    { name: 'Admin Authentication', pattern: /isAdminRoute/ },
    { name: 'Staff Email Validation', pattern: /staffEmails|ADMIN_STAFF_EMAILS/ }
  ];
  
  checks.forEach(check => {
    if (check.pattern.test(middlewareContent)) {
      console.log(`   ✅ ${check.name}: Configured`);
    } else {
      console.log(`   ❌ ${check.name}: Not found`);
    }
  });
} catch (error) {
  console.log('   ❌ Error reading middleware:', error.message);
}

// Test 4: Admin Layout Check
console.log('\n4. Checking Admin Portal Structure:');
const adminFiles = [
  'src/app/(admin)/layout.tsx',
  'src/components/admin/AdminNav.tsx',
  'src/components/admin/AdminProvider.tsx',
  'src/components/admin/AdminThemeProvider.tsx'
];

adminFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}: Present`);
  } else {
    console.log(`   ❌ ${file}: Missing`);
  }
});

// Test 5: API Proxy Configuration
console.log('\n5. Checking API Proxy Configuration:');
try {
  const proxyPath = path.join(__dirname, 'src/lib/api-proxy.ts');
  if (fs.existsSync(proxyPath)) {
    const proxyContent = fs.readFileSync(proxyPath, 'utf8');
    
    if (proxyContent.includes('proxyToBackend')) {
      console.log('   ✅ API Proxy Function: Present');
    }
    if (proxyContent.includes('requireAuth')) {
      console.log('   ✅ Authentication Support: Present');  
    }
    if (proxyContent.includes('enableLogging')) {
      console.log('   ✅ Logging Support: Present');
    }
  } else {
    console.log('   ❌ API Proxy: Missing');
  }
} catch (error) {
  console.log('   ❌ Error checking API proxy:', error.message);
}

// Test 6: Package.json Scripts
console.log('\n6. Checking Deployment Scripts:');
try {
  const packagePath = path.join(__dirname, 'package.json');
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const deployScripts = ['start:docker', 'deploy:staging', 'deploy:production'];
  deployScripts.forEach(script => {
    if (packageContent.scripts && packageContent.scripts[script]) {
      console.log(`   ✅ ${script}: ${packageContent.scripts[script]}`);
    } else {
      console.log(`   ❌ ${script}: Missing`);
    }
  });
} catch (error) {
  console.log('   ❌ Error checking package.json:', error.message);
}

console.log('\n🏁 Configuration Test Complete!');
console.log('\nNext Steps:');
console.log('1. Add admin.localhost to your hosts file:');
console.log('   echo "127.0.0.1 admin.localhost" | sudo tee -a /etc/hosts');
console.log('2. Start the development server: npm run dev');
console.log('3. Test main app: http://localhost:3000');
console.log('4. Test admin portal: http://admin.localhost:3000');
console.log('5. Deploy with: docker-compose up -d');