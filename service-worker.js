const CACHE_NAME = "mina-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  // Ajoute ici tes fichiers .js, .css, etc.
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) =>
      response || fetch(event.request)
    )
  );
});
