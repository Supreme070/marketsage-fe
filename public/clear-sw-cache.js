/**
 * Service Worker Cache Clearing Utility
 * Run this script in the browser console to clear Service Worker cache
 */

async function clearServiceWorkerCache() {
  console.log('🧹 Starting Service Worker cache clearing...');
  
  try {
    // 1. Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log(`Found ${cacheNames.length} cache(s):`, cacheNames);
      
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      
      console.log('✅ All caches cleared');
    } else {
      console.log('❌ Cache API not supported');
    }

    // 2. Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log(`Found ${registrations.length} service worker(s)`);
      
      await Promise.all(
        registrations.map(registration => registration.unregister())
      );
      
      console.log('✅ All service workers unregistered');
    } else {
      console.log('❌ Service Worker not supported');
    }

    // 3. Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    console.log('✅ Local storage cleared');

    // 4. Clear IndexedDB
    if ('indexedDB' in window) {
      try {
        const databases = await indexedDB.databases();
        await Promise.all(
          databases.map(db => {
            return new Promise((resolve, reject) => {
              const deleteReq = indexedDB.deleteDatabase(db.name);
              deleteReq.onsuccess = () => resolve();
              deleteReq.onerror = () => reject(deleteReq.error);
            });
          })
        );
        console.log('✅ IndexedDB cleared');
      } catch (error) {
        console.log('⚠️ IndexedDB clearing failed:', error);
      }
    }

    console.log('🎉 Service Worker cache clearing complete!');
    console.log('💡 Please refresh the page to see changes');
    
    return true;
  } catch (error) {
    console.error('❌ Error clearing Service Worker cache:', error);
    return false;
  }
}

// Auto-run if called directly
if (typeof window !== 'undefined') {
  console.log('🚀 Service Worker Cache Clearing Utility loaded');
  console.log('📝 Run clearServiceWorkerCache() to clear all caches');
  
  // Make it available globally
  window.clearServiceWorkerCache = clearServiceWorkerCache;
}

export { clearServiceWorkerCache };



