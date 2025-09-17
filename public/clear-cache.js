/**
 * MarketSage Cache Clear Utility
 * Run this in the browser console to clear all caches and service workers
 */

async function clearMarketSageCache() {
  console.log('🧹 MarketSage Cache Clear Started');
  console.log('=' .repeat(50));
  
  try {
    // 1. Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log(`🗄️ Found ${cacheNames.length} caches to clear:`, cacheNames);
      
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
        console.log(`   ✅ Cleared cache: ${cacheName}`);
      }
    }
    
    // 2. Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log(`📱 Found ${registrations.length} service workers to unregister`);
      
      for (const registration of registrations) {
        await registration.unregister();
        console.log(`   ✅ Unregistered service worker: ${registration.scope}`);
      }
    }
    
    // 3. Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    console.log('   ✅ Cleared localStorage and sessionStorage');
    
    // 4. Clear IndexedDB (if any)
    if ('indexedDB' in window) {
      try {
        // This is a simplified approach - in practice you'd need to delete specific databases
        console.log('   ℹ️ IndexedDB detected - manual cleanup may be needed');
      } catch (error) {
        console.log('   ℹ️ IndexedDB cleanup skipped:', error.message);
      }
    }
    
    console.log('\n🎉 Cache clear completed successfully!');
    console.log('🔄 Please refresh the page to see changes');
    
  } catch (error) {
    console.error('❌ Error during cache clear:', error);
  }
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.clearMarketSageCache = clearMarketSageCache;
  console.log('🚀 MarketSage Cache Clear Utility loaded');
  console.log('📝 Run clearMarketSageCache() to clear all caches');
}

export { clearMarketSageCache };
