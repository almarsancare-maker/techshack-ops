// TechShack Ops PWA — Service Worker (v2)
// Bumping cache version flushes stale builds across all client devices
const CACHE_NAME = 'techshack-ops-v2';

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  // Resilient install: cache assets without failing if an individual asset is delayed
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn(`[SW] Pre-cache skipped for ${asset}:`, err.message);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Flush all previous cache versions immediately
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log(`[SW] Purging stale cache: ${key}`);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isHtml = event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html');

  if (isHtml) {
    // Network-First for HTML/Navigation: Ensures user always sees latest live build
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match('./index.html') || caches.match('./'))
    );
    return;
  }

  // Stale-While-Revalidate for static assets (CSS, JS, Icons)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
