const VERSION = "1";
const CACHE_NAME = `nsk-team18-v${VERSION}`;

const APP_ASSETS = [
  "./",
  "./index.html?v=1",
  "./version.js?v=1",
  "./deploy.json?v=1",
  "./app.css?v=1",
  "./config.js?v=1",
  "./auth.js?v=1",
  "./login-patch.js?v=1",
  "./db.js?v=1",
  "./app.js?v=1",
  "./manifest.webmanifest?v=1",
  "./icon-192.png",
  "./icon-512.png",
  "./nsk-wallpaper-portrait.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of APP_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn("[SW] Kunde inte cacha:", asset, err);
        }
      }
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== "GET") return;

  if (url.origin !== self.location.origin) return;

  if (
    req.mode === "navigate" ||
    req.destination === "document"
  ) {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          const copy = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put("./index.html", copy).catch(() => {});
          });
          return networkRes;
        })
        .catch(() => caches.match(req))
        .then((res) => res || caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((networkRes) => {
          if (!networkRes || networkRes.status !== 200) {
            return networkRes;
          }

          const copy = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, copy).catch(() => {});
          });

          return networkRes;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
