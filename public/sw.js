// MarketSage Service Worker for PWA functionality
// Provides offline caching, background sync, and push notifications

const CACHE_NAME = 'marketsage-v1';
const STATIC_CACHE = 'marketsage-static-v1';
const API_CACHE = 'marketsage-api-v1';
const IMAGE_CACHE = 'marketsage-images-v1';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/offline.html',
  // Add critical CSS and JS files here
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/contacts',
  '/api/campaigns',
  '/api/analytics',
  '/api/health'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(STATIC_FILES);
      }),
      caches.open(API_CACHE).then((cache) => {
        // Pre-cache some API endpoints
        return Promise.all(
          API_ENDPOINTS.map(endpoint => {
            return fetch(endpoint)
              .then(response => {
                if (response.ok) {
                  return cache.put(endpoint, response);
                }
              })
              .catch(() => {
                // Ignore errors during pre-caching
              });
          })
        );
      })
    ]).then(() => {
      console.log('Service Worker installed and files cached');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== API_CACHE && 
                cacheName !== IMAGE_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all pages
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker activated');
    })
  );
});

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and external requests
  if (request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return;
  }

  // Different strategies for different types of requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
  } else if (url.pathname.startsWith('/_next/static/') || 
             url.pathname.startsWith('/icons/') ||
             url.pathname === '/manifest.json') {
    event.respondWith(handleStaticRequest(request));
  } else if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp)$/)) {
    event.respondWith(handleImageRequest(request));
  } else {
    event.respondWith(handlePageRequest(request));
  }
});

// Handle API requests with network-first strategy
async function handleAPIRequest(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    // If network fails, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('Serving API request from cache:', request.url);
      return cachedResponse;
    }
    
    // Return error response if both fail
    return new Response(JSON.stringify({
      error: 'Network unavailable',
      message: 'Please check your internet connection'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    // Network error, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('Serving API request from cache (network error):', request.url);
      return cachedResponse;
    }
    
    // Return offline response
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'You are currently offline. Some features may not be available.'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle static files with cache-first strategy
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, fetch from network and cache
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return a fallback response for critical files
    if (request.url.includes('manifest.json')) {
      return new Response(JSON.stringify({
        name: 'MarketSage',
        short_name: 'MarketSage',
        start_url: '/dashboard',
        display: 'standalone'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

// Handle images with cache-first strategy
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Fetch from network and cache
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return a placeholder image or cached fallback
    return new Response('', { status: 404 });
  }
}

// Handle page requests with network-first strategy
async function handlePageRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful page responses
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    // If network fails, try cache
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return await cache.match('/offline.html') || new Response('Offline');
    
  } catch (error) {
    // Network error, try cache
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return await cache.match('/offline.html') || new Response('Offline');
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'marketsage-sync') {
    event.waitUntil(syncOfflineData());
  }
});

// Sync offline data when connection is restored
async function syncOfflineData() {
  try {
    console.log('Syncing offline data...');
    
    // Open IndexedDB and get offline queue
    const db = await openIndexedDB();
    const transaction = db.transaction(['offlineQueue'], 'readonly');
    const store = transaction.objectStore('offlineQueue');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = async () => {
        const offlineItems = request.result.filter(item => !item.synced);
        console.log(`Found ${offlineItems.length} items to sync`);
        
        for (const item of offlineItems) {
          try {
            await syncItem(item);
            
            // Mark as synced
            const updateTransaction = db.transaction(['offlineQueue'], 'readwrite');
            const updateStore = updateTransaction.objectStore('offlineQueue');
            item.synced = true;
            updateStore.put(item);
            
          } catch (error) {
            console.error('Failed to sync item:', error);
          }
        }
        
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
    
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Open IndexedDB connection
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('marketsage-offline', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Sync individual item
async function syncItem(item) {
  const endpoints = {
    'contact': '/api/contacts',
    'campaign': '/api/campaigns',
    'template': '/api/templates',
    'draft': '/api/drafts'
  };
  
  const endpoint = endpoints[item.type];
  if (!endpoint) return;
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(item.data)
  });
  
  if (!response.ok) {
    throw new Error(`Sync failed: ${response.statusText}`);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: data.data,
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view-24x24.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-24x24.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    // Open the app to relevant page
    const urlToOpen = event.notification.data?.url || '/dashboard';
    
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

// Message handling from main app
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      case 'GET_VERSION':
        event.ports[0].postMessage({ version: CACHE_NAME });
        break;
      case 'CACHE_DATA':
        cacheData(event.data.key, event.data.data);
        break;
    }
  }
});

// Cache arbitrary data
async function cacheData(key, data) {
  const cache = await caches.open(API_CACHE);
  const response = new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
  
  await cache.put(key, response);
}