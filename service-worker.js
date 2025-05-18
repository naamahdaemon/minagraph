const CACHE_NAME = 'mina-graph-explorer-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/favicon.ico',
  '/style/style.css',
  '/scripts/script.js',
  '/scripts/layoutWorker.js',

  // CDN assets
  'https://fonts.googleapis.com/css2?family=Coda&display=swap',
  'https://cdn.jsdelivr.net/npm/sigma@2.4.0/build/sigma.min.js',
  'https://cdn.jsdelivr.net/npm/graphology@0.26.0/dist/graphology.umd.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.jsdelivr.net/npm/chartjs-plugin-dragdata@2.0.0',
  'https://cdn.jsdelivr.net/npm/nouislider@15.7.0/dist/nouislider.min.js',
  'https://cdn.jsdelivr.net/npm/nouislider@15.7.0/dist/nouislider.min.css',
  'https://cdn.skypack.dev/bs58',
];

// Installation
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activation : suppression anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Interception des requêtes
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // API (Minataur ou proxy) → Network first
  if (
    url.hostname.includes('minataur.net') ||
    url.hostname.includes('akirion.com') ||
    url.pathname.startsWith('/proxy')
  ) {
    event.respondWith(
      fetch(request)
        .then(response => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(request, response.clone());
            return response;
          });
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Autres fichiers → Cache first
  event.respondWith(
    caches.match(request).then(cached =>
      cached || fetch(request).catch(() => {
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      })
    )
  );
});
