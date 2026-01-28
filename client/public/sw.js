// Service Worker for PWA
// Enhanced with better caching strategies and offline support

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `holger-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `holger-dynamic-${CACHE_VERSION}`;
const API_CACHE = `holger-api-${CACHE_VERSION}`;

// Static assets to pre-cache on install
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/favicon.png',
  '/manifest.json',
];

// API routes to cache with short TTL
const API_PATTERNS = [
  '/api/client/profile',
  '/api/client/sessions',
  '/api/client/actions',
  '/api/client/resources',
  '/api/coach/clients',
  '/api/coach/sessions',
];

// Cache TTL in milliseconds (5 minutes for API data)
const API_CACHE_TTL = 5 * 60 * 1000;

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Pre-caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Install complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Install error:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete caches that don't match current version
            if (!cacheName.includes(CACHE_VERSION)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        return self.clients.claim();
      })
  );
});

// Helper: Check if request is for API
function isApiRequest(request) {
  return request.url.includes('/api/');
}

// Helper: Check if request is for static asset
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(js|css|woff2?|png|jpg|jpeg|gif|svg|ico)$/);
}

// Helper: Network-first strategy with cache fallback
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Helper: Cache-first strategy with network fallback
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    throw error;
  }
}

// Helper: Stale-while-revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  // Fetch fresh version in background
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        caches.open(cacheName).then((cache) => {
          cache.put(request, networkResponse.clone());
        });
      }
      return networkResponse;
    })
    .catch(() => null);
  
  // Return cached version immediately if available
  return cachedResponse || fetchPromise;
}

// Fetch event - apply appropriate caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Skip auth-related API calls (never cache)
  if (request.url.includes('/api/auth/') || request.url.includes('/api/logout')) {
    return;
  }
  
  // API requests: network-first with cache fallback
  if (isApiRequest(request)) {
    event.respondWith(
      networkFirst(request, API_CACHE)
        .catch(() => {
          // Return offline placeholder for API errors
          return new Response(
            JSON.stringify({ error: 'Offline', offline: true }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }
  
  // Static assets: cache-first
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
  
  // Navigation requests: network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request, DYNAMIC_CACHE)
        .catch(() => caches.match('/offline.html'))
    );
    return;
  }
  
  // Default: stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// Background sync for form submissions (when back online)
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);
  
  if (event.tag === 'sync-forms') {
    event.waitUntil(syncPendingForms());
  }
});

// Handle pending form submissions
async function syncPendingForms() {
  // This would be implemented with IndexedDB to store pending submissions
  // For now, just log that sync was triggered
  console.log('[SW] Syncing pending forms...');
}

// Push notifications handler
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/favicon.png',
    badge: '/favicon.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: data.actions || [],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Holger Coaching', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window/tab open
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Open new window if none exists
        return clients.openWindow(url);
      })
  );
});

console.log('[SW] Service worker loaded');
