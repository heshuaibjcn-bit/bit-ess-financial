/// <reference lib="webworker" />

const CACHE_NAME = 'ess-financial-v1';
const RUNTIME_CACHE = 'ess-runtime-v1';

// Assets to cache immediately
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/demo',
  '/offline.html',
  '/manifest.json',
  // Core styles
  '/index.css',
  // Core scripts
  '/assets/index-[hash].js',
  '/assets/index-[hash].css',
  // Icons
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Assets to cache on demand
const RUNTIME_CACHE_URLS = [
  // API routes
  '/api/*',
  // Dynamic imports
  '/src/components/*',
  '/src/pages/*',
];

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      console.log('[SW] Installing Service Worker...');

      // Precache static assets
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(PRECACHE_URLS);

      console.log('[SW] Precache complete:', PRECACHE_URLS.length);
    })()
  );

  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      console.log('[SW] Activating Service Worker...');

      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
          })
          .map((cacheName) => caches.delete(cacheName))
      );

      console.log('[SW] Old caches cleaned up');

      // Take control of all pages immediately
      await clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(
    (async () => {
      const { request } = event;
      const url = new URL(request.url);

      // Skip non-GET requests
      if (request.method !== 'GET') {
        return fetch(request);
      }

      // Skip external requests
      if (url.origin !== self.location.origin) {
        return fetch(request);
      }

      // Skip WebSocket
      if (url.protocol === 'ws:' || url.protocol === 'wss:') {
        return fetch(request);
      }

      // Network First for API requests (prefer fresh data)
      if (url.pathname.startsWith('/api/')) {
        return networkFirst(request);
      }

      // Cache First for static assets
      if (PRECACHE_URLS.some((precacheUrl) => url.pathname === precacheUrl)) {
        return cacheFirst(request);
      }

      // Network First with cache fallback for pages
      if (url.pathname.startsWith('/project/') || url.pathname === '/') {
        return networkFirst(request);
      }

      // Stale While Revalidate for dynamic content
      return staleWhileRevalidate(request);
    })()
  );
});

/**
 * Cache First strategy - serves from cache, falls back to network
 */
async function cacheFirst(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    console.log('[SW] Cache hit:', request.url);
    return cachedResponse;
  }

  console.log('[SW] Cache miss, fetching:', request.url);
  const networkResponse = await fetch(request);

  // Cache the fresh response
  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone());
  }

  return networkResponse;
}

/**
 * Network First strategy - tries network first, falls back to cache
 */
async function networkFirst(request: Request): Promise<Response> {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    console.log('[SW] Network First, fetching:', request.url);
    const networkResponse = await fetch(request);

    // Cache the fresh response
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, using cache:', request.url);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline fallback
    return caches.match('/offline.html') as Promise<Response>;
  }
}

/**
 * Stale While Revalidate strategy - serves from cache, updates in background
 */
async function staleWhileRevalidate(request: Request): Promise<Response> {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    // Update cache with fresh response
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  });

  // Return cached response immediately, update in background
  return cachedResponse || fetchPromise;
}

/**
 * Background sync for offline actions
 */
self.addEventListener('sync', (event: SyncEvent) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-projects') {
    event.waitUntil(
      (async () => {
        // Sync projects to server
        console.log('[SW] Syncing projects...');
        // Implementation would go here
      })()
    );
  }
});

/**
 * Push notification handling
 */
self.addEventListener('push', (event: PushEvent) => {
  const options = event.data?.json() || {};

  event.waitUntil(
    (async () => {
      console.log('[SW] Push notification:', event);

      // Show notification
      await self.registration.showNotification('ESS Financial', {
        body: event.data?.text() || '您有新的项目更新',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        ...options,
      });
    })()
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  // Handle notification click
  event.waitUntil(
    (async () => {
      // Open the app to the relevant page
      await clients.openWindow(event.notification.data?.url || '/', '_blank');
    })()
  );
});

// Periodic cache cleanup
setInterval(async () => {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    const requests = await cache.keys();
    const now = Date.now();

    // Remove entries older than 1 hour
    await Promise.all(
      requests
        .map((request) => cache.match(request))
        .filter((response) => {
          if (!response) return false;
          const cacheTime = response.headers.get('date');
          if (!cacheTime) return false;
          const age = now - new Date(cacheTime).getTime();
          return age > 60 * 60 * 1000; // 1 hour
        })
        .map((response) => {
          if (response) {
            return cache.delete(response.request);
          }
        })
    );

    console.log('[SW] Cache cleanup complete');
  } catch (error) {
    console.error('[SW] Cache cleanup error:', error);
  }
}, 5 * 60 * 1000); // Every 5 minutes

console.log('[SW] Service Worker loaded');