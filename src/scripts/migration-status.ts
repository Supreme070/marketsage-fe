#!/usr/bin/env npx tsx
/**
 * Migration Status Report
 * =======================
 * 
 * Comprehensive status of Phase 2 database separation
 */

import { execSync } from 'child_process';

function runCommand(cmd: string): string {
  return execSync(cmd, { encoding: 'utf-8', cwd: '/Users/supreme/Desktop/marketsage' }).trim();
}

function main() {
  console.log('📊 MarketSage Phase 2 Migration Status Report\n');
  console.log('=============================================\n');

  // Count total API routes
  const totalRoutes = Number.parseInt(runCommand('find src/app/api -name "route.ts" | wc -l'));
  
  // Count converted routes (have proxyToBackend)
  const convertedRoutes = Number.parseInt(runCommand('grep -r "proxyToBackend" src/app/api --include="*.ts" | wc -l'));
  
  // Count routes still using direct DB (have prisma import)
  const directDbRoutes = Number.parseInt(runCommand('grep -r "import.*prisma" src/app/api --include="*.ts" | wc -l'));
  
  // Count routes with no DB access (neither proxy nor direct)
  const noDatabaseRoutes = totalRoutes - convertedRoutes - directDbRoutes;

  const conversionPercent = Math.round((convertedRoutes / totalRoutes) * 100);
  
  console.log('🎯 Overall Progress:');
  console.log(`   📄 Total API routes: ${totalRoutes}`);
  console.log(`   ✅ Converted to proxy: ${convertedRoutes} (${conversionPercent}%)`);
  console.log(`   🔄 Still direct DB: ${directDbRoutes}`);
  console.log(`   📋 No DB access: ${noDatabaseRoutes}\n`);

  // Category breakdown
  console.log('📂 Conversion by Category:\n');

  const categories = [
    { name: 'Auth Routes', path: 'auth' },
    { name: 'Admin Routes', path: 'admin' },
    { name: 'AI Routes', path: 'ai' },
    { name: 'User Routes', path: 'users' },
    { name: 'Campaign Routes', path: 'campaigns' },
    { name: 'Messaging Routes', path: 'messaging' },
    { name: 'Workflow Routes', path: 'workflows' },
    { name: 'Email Routes', path: 'email' },
    { name: 'SMS Routes', path: 'sms' },
    { name: 'WhatsApp Routes', path: 'whatsapp' },
    { name: 'LeadPulse Routes', path: 'leadpulse' },
  ];

  for (const category of categories) {
    try {
      const totalCat = Number.parseInt(runCommand(`find src/app/api/${category.path} -name "route.ts" 2>/dev/null | wc -l`));
      const convertedCat = Number.parseInt(runCommand(`grep -r "proxyToBackend" src/app/api/${category.path} --include="*.ts" 2>/dev/null | wc -l`));
      const directCat = Number.parseInt(runCommand(`grep -r "import.*prisma" src/app/api/${category.path} --include="*.ts" 2>/dev/null | wc -l`));
      
      if (totalCat > 0) {
        const catPercent = Math.round((convertedCat / totalCat) * 100);
        const status = catPercent === 100 ? '✅' : catPercent > 50 ? '🔄' : '⏳';
        console.log(`   ${status} ${category.name}: ${convertedCat}/${totalCat} (${catPercent}%)`);
      }
    } catch (e) {
      // Category doesn't exist, skip
    }
  }

  console.log('\n🎯 Next Priority Actions:');
  
  if (directDbRoutes > 0) {
    console.log(`   1. Convert remaining ${directDbRoutes} routes to proxy pattern`);
    console.log(`   2. Focus on high-traffic routes first (campaigns, messaging, ai)`);
    console.log(`   3. Test each converted endpoint with backend running`);
    console.log(`   4. Remove all Prisma dependencies from frontend once complete\n`);
  } else {
    console.log('   🎉 All routes converted! Ready for Phase 3\n');
  }

  console.log('📋 Migration Commands:');
  console.log('   npx tsx src/scripts/batch-convert-routes.ts    # Systematic conversion');
  console.log('   npx tsx src/scripts/convert-routes-batch.ts    # High-speed batch');
  console.log('   cd ../marketsage-backend && npm run dev        # Start backend');
  console.log('   npm run build                                   # Test build\n');

  // Progress bar
  const progressBar = '█'.repeat(Math.floor(conversionPercent / 5)) + 
                     '░'.repeat(20 - Math.floor(conversionPercent / 5));
  console.log(`📈 Progress: [${progressBar}] ${conversionPercent}%\n`);

  if (conversionPercent >= 80) {
    console.log('🏆 Excellent progress! Database separation nearly complete!');
  } else if (conversionPercent >= 50) {
    console.log('💪 Good progress! Over halfway to complete database separation!');
  } else {
    console.log('🚀 Getting started! Database separation is underway!');
  }
}

if (require.main === module) {
  main();
}