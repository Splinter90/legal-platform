// Service Worker — Leyes Digital
// Estrategia: network-first para páginas (HTML), cache-first para estáticos.
// Bump CACHE_NAME cuando cambien estos archivos para forzar refresh.

const CACHE_NAME = "leyes-digital-v1";
const OFFLINE_URL = "/offline";

const STATIC_ASSETS = [
  "/",
  "/offline",
  "/manifest.json",
  "/logo.jpeg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Nunca cachear API, auth, webhooks, ni cosas dinámicas.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/data/") ||
    url.pathname.includes("/auth/") ||
    url.pathname.startsWith("/admin")
  ) {
    return;
  }

  // Navegaciones HTML: network-first, fallback a cache, fallback a /offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          return cached || caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // Estáticos (_next/static, imágenes, fuentes): cache-first.
  if (
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:png|jpe?g|webp|svg|gif|woff2?|ttf|eot|ico|css|js)$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        return (
          cached ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put(req, copy));
            }
            return res;
          })
        );
      })
    );
  }
});
