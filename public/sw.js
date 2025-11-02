// A version number is used to update the cache when the app is updated.
const CACHE_VERSION = 1;
const CACHE_NAME = `score-counter-cache-v${CACHE_VERSION}`;

// A list of all the essential files the app needs to run offline.
const urlsToCache = [
  '/',
  '/index.html',
  // Since the JS is loaded via import maps, the fetch handler will cache them dynamically.
];

// When the service worker is installed, open a cache and add the core assets.
self.addEventListener('install', event => {
  self.skipWaiting(); // Activate new service worker as soon as it's finished installing.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // We don't cache CDN assets on install as they might fail and break the install step.
        // The fetch handler will cache them on the first successful request.
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Failed to cache resources during install:', error);
      })
  );
});

// When the service worker is activated, remove any old, unused caches.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Take control of all open clients.
});

// Intercept network requests and serve from cache if available (Cache-first strategy).
self.addEventListener('fetch', event => {
  // We only want to handle GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        // Create a fetch promise to get the resource from the network.
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // If we got a valid response, cache it.
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });

        // Return the cached response if it exists, otherwise, wait for the network response.
        return response || fetchPromise;
      });
    })
  );
});