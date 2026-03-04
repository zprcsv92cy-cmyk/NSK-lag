/* NSK Lag - offline cache (FAST) */
const CACHE_NAME = 'nsk-lag-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './nsk-wallpaper-portrait.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Optional: allow page to trigger immediate SW activation
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

// Cache-first for navigations (fast start), then update cache in background.
// Stale-while-revalidate for other same-origin GET requests.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // HTML navigations
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match('./index.html');
      const fetchPromise = fetch(req).then((res) => {
        cache.put('./index.html', res.clone());
        return res;
      }).catch(() => null);

      // Return cached immediately if it exists; otherwise wait for network; fallback to cache.
      return cached || (await fetchPromise) || (await cache.match('./index.html'));
    })());
    return;
  }

  // Static assets: stale-while-revalidate (same origin only)
  if (sameOrigin) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      const fetchPromise = fetch(req).then((res) => {
        cache.put(req, res.clone());
        return res;
      }).catch(() => null);

      return cached || (await fetchPromise) || Response.error();
    })());
  }
});
