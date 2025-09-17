/**
 * MarketSage Campaign Pages Debugging Script
 * Run this in the browser console to diagnose Service Worker and cache issues
 */

async function debugMarketSageCampaigns() {
  console.log('🔍 MarketSage Campaign Pages Debugging Started');
  console.log('=' .repeat(60));
  
  const results = {
    serviceWorker: {},
    caches: {},
    apiEndpoints: {},
    localStorage: {},
    sessionStorage: {},
    recommendations: []
  };

  // 1. Check Service Worker status
  console.log('📱 Checking Service Worker status...');
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      results.serviceWorker.registered = registrations.length > 0;
      results.serviceWorker.count = registrations.length;
      results.serviceWorker.scope = registrations.map(r => r.scope);
      
      console.log(`✅ Found ${registrations.length} service worker(s)`);
      registrations.forEach((reg, index) => {
        console.log(`   ${index + 1}. Scope: ${reg.scope}`);
        console.log(`      Active: ${reg.active ? 'Yes' : 'No'}`);
        console.log(`      Installing: ${reg.installing ? 'Yes' : 'No'}`);
        console.log(`      Waiting: ${reg.waiting ? 'Yes' : 'No'}`);
      });
    } catch (error) {
      console.error('❌ Error checking service workers:', error);
      results.serviceWorker.error = error.message;
    }
  } else {
    console.log('❌ Service Worker not supported');
    results.serviceWorker.supported = false;
  }

  // 2. Check Cache status
  console.log('\n🗄️ Checking Cache status...');
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      results.caches.count = cacheNames.length;
      results.caches.names = cacheNames;
      
      console.log(`✅ Found ${cacheNames.length} cache(s):`, cacheNames);
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        console.log(`   ${cacheName}: ${keys.length} entries`);
        
        // Check for API-related cached entries
        const apiEntries = keys.filter(request => request.url.includes('/api/'));
        if (apiEntries.length > 0) {
          console.log(`   ⚠️ Found ${apiEntries.length} API entries in ${cacheName}`);
          results.caches.apiEntries = results.caches.apiEntries || {};
          results.caches.apiEntries[cacheName] = apiEntries.length;
        }
      }
    } catch (error) {
      console.error('❌ Error checking caches:', error);
      results.caches.error = error.message;
    }
  } else {
    console.log('❌ Cache API not supported');
    results.caches.supported = false;
  }

  // 3. Test API endpoints
  console.log('\n🌐 Testing API endpoints...');
  const endpoints = [
    '/api/v2/email/campaigns',
    '/api/v2/whatsapp/campaigns',
    '/api/v2/sms/campaigns',
    '/api/v2/notifications'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`   Testing ${endpoint}...`);
      const response = await fetch(endpoint);
      results.apiEndpoints[endpoint] = {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      };
      
      if (response.ok) {
        const data = await response.json();
        results.apiEndpoints[endpoint].dataType = typeof data;
        results.apiEndpoints[endpoint].isArray = Array.isArray(data);
        results.apiEndpoints[endpoint].hasSuccess = data?.success !== undefined;
        
        console.log(`   ✅ ${endpoint}: ${response.status} ${response.statusText}`);
        console.log(`      Data type: ${typeof data}, Is array: ${Array.isArray(data)}`);
      } else {
        console.log(`   ❌ ${endpoint}: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`   ❌ ${endpoint}: Error -`, error.message);
      results.apiEndpoints[endpoint] = { error: error.message };
    }
  }

  // 4. Check localStorage and sessionStorage
  console.log('\n💾 Checking storage...');
  results.localStorage.keys = Object.keys(localStorage);
  results.sessionStorage.keys = Object.keys(sessionStorage);
  
  console.log(`✅ localStorage: ${results.localStorage.keys.length} items`);
  console.log(`✅ sessionStorage: ${results.sessionStorage.keys.length} items`);

  // 5. Generate recommendations
  console.log('\n💡 Generating recommendations...');
  
  if (results.serviceWorker.registered && results.serviceWorker.count > 0) {
    results.recommendations.push('Service Worker is registered - consider unregistering if experiencing cache issues');
  }
  
  if (results.caches.apiEntries && Object.keys(results.caches.apiEntries).length > 0) {
    results.recommendations.push('API entries found in cache - clear all caches to resolve stale data issues');
  }
  
  const failedEndpoints = Object.entries(results.apiEndpoints)
    .filter(([_, result]) => result.error || !result.ok)
    .map(([endpoint, _]) => endpoint);
    
  if (failedEndpoints.length > 0) {
    results.recommendations.push(`API endpoints failing: ${failedEndpoints.join(', ')} - check authentication and backend status`);
  }

  // 6. Print summary
  console.log('\n📊 Debug Summary');
  console.log('=' .repeat(60));
  console.log(`Service Workers: ${results.serviceWorker.count || 0} registered`);
  console.log(`Caches: ${results.caches.count || 0} found`);
  console.log(`API Endpoints: ${Object.keys(results.apiEndpoints).length} tested`);
  console.log(`Recommendations: ${results.recommendations.length}`);
  
  if (results.recommendations.length > 0) {
    console.log('\n🎯 Recommendations:');
    results.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  }

  // 7. Provide quick fix commands
  console.log('\n🛠️ Quick Fix Commands:');
  console.log('   • Clear all caches: await caches.keys().then(names => Promise.all(names.map(name => caches.delete(name))))');
  console.log('   • Unregister service workers: navigator.serviceWorker.getRegistrations().then(regs => Promise.all(regs.map(reg => reg.unregister())))');
  console.log('   • Clear all data: localStorage.clear(); sessionStorage.clear();');
  console.log('   • Use the utility: clearServiceWorkerCache()');

  return results;
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.debugMarketSageCampaigns = debugMarketSageCampaigns;
  console.log('🚀 MarketSage Debugging Script loaded');
  console.log('📝 Run debugMarketSageCampaigns() to diagnose issues');
}

export { debugMarketSageCampaigns };



