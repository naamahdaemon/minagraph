const CACHE_NAME = 'mina-graph-explorer-v2';

importScripts("https://www.gstatic.com/firebasejs/10.4.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.4.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDHO1ADBXCoEDheIbti99TZ2dTaDhNVkbE",
  authDomain: "paymentlink-ab03d.firebaseapp.com",
  projectId: "paymentlink-ab03d",
  messagingSenderId: "648184826463",
  appId: "1:648184826463:web:2edefbe49f127e48dae9ea"
});

const messaging = firebase.messaging();

// ? Affiche les notifications reçues quand la PWA est en arrière-plan
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background payload:', payload);

  const notificationTitle = payload.data.title || "Notification";
  const notificationOptions = {
    body: payload.data.body || '',
    icon: '/icons/icon-192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

function saveNotificationToStorage(data) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('notificationDB', 1);

    request.onupgradeneeded = function(event) {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('notifications')) {
        db.createObjectStore('notifications', { keyPath: 'timestamp' });
      }
    };

    request.onsuccess = function(event) {
      const db = event.target.result;
      const tx = db.transaction('notifications', 'readwrite');
      const store = tx.objectStore('notifications');

      try {
        store.add({ ...data, timestamp: Date.now() });
      } catch (e) {
        console.error('[SW] IndexedDB write error:', e);
        reject(e);
        return;
      }

      tx.oncomplete = resolve;
      tx.onerror = (e) => {
        console.error('[SW] TX error', e);
        reject(e);
      };
    };

    request.onerror = (e) => {
      console.error('[SW] DB open error', e);
      reject(e);
    };
  });
}


const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/favicon.ico',
  '/style/style.css',
  '/scripts/script.js',
  '/scripts/forceAtlas.js',
  '/scripts/fruchtermanReingold.js',
  '/scripts/openOrd.js',
  '/img/arbitrum.png',
  '/img/base.png',
  '/img/bsc.png',
  '/img/cronos.png',
  '/img/ethereum.png',
  '/img/mina.png',
  '/img/optimism.png',
  '/img/polygon.png',
  '/img/solana.png',
  '/img/tezos.png',
  '/img/zksync.png',

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
    caches.open(CACHE_NAME).then(async cache => {
      for (const url of STATIC_ASSETS) {
        try {
          await cache.add(url);
          console.log(`[SW] Cached: ${url}`);
        } catch (err) {
          console.warn(`[SW] Skipped: ${url}`, err);
        }
      }
    })
  );
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

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // Open the PWA window or focus if already open
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        // Focus if any window of your origin is already open
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }

      // Else open a new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

self.addEventListener('push', function(event) {
  let data = {};
  try {
    const payload = event.data?.json() || {};
    data = payload.data || payload; // fallback if already flat
  } catch (e) {
    console.warn('Invalid JSON in push event:', e);
  }

  const title = data.title || 'Notification';
  const body = data.body || '';
  const icon = '/icons/icon-192.png';

  const notificationData = { title, body, icon };

  // Skip if payload is clearly incomplete
  if (!title || title === 'Notification') {
    console.warn('[SW] Skipping generic fallback notification');
    return;
  }

  // ?? Affichage + stockage SW + diffusion
  event.waitUntil(
    (async () => {
      await self.registration.showNotification(title, {
        body,
        icon,
        data: notificationData
      });

      // ? Stocker dans IndexedDB (contexte service worker)
      await saveNotificationToStorage(notificationData);

      // ? Informer la page si elle est active
      const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      
      const hasVisibleClient = clientsList.some(client => client.visibilityState === 'visible');

      // âœ… Only save in SW if app is NOT visible
      if (!hasVisibleClient) {
        await saveNotificationToStorage(notificationData);
      }   
      for (const client of clientsList) {
        client.postMessage({ type: 'push-received', payload: notificationData });
      }
    })()
  );
});


