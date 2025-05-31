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
/*messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background payload:', payload);

  const notificationTitle = payload.data.title || "Notification";
  const notificationOptions = {
    body: payload.data.body || '',
    icon: '/icons/icon-192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});*/

function saveNotificationToStorage(data) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('notificationDB', 2); // ?? bump version to trigger upgrade

    request.onupgradeneeded = function(event) {
      const db = event.target.result;
      if (db.objectStoreNames.contains('notifications')) {
        db.deleteObjectStore('notifications'); // clean old store (was keyed by timestamp)
      }
      db.createObjectStore('notifications', { keyPath: 'message_id' });
    };

    request.onsuccess = function(event) {
      const db = event.target.result;
      const tx = db.transaction('notifications', 'readwrite');
      const store = tx.objectStore('notifications');

      if (!data.message_id) {
        console.warn('[Storage] Missing message_id, cannot save');
        resolve();
          return;
        }

      const entry = { ...data, timestamp: Date.now() };

      const getReq = store.get(data.message_id);
      getReq.onsuccess = function() {
        if (getReq.result) {
          console.log('[Storage] Duplicate message_id, skip store');
          resolve();
        } else {
      try {
          store.add(entry);
      } catch (e) {
          console.error('[Storage] IndexedDB add error:', e);
        reject(e);
        return;
      }
        }
      };

      tx.oncomplete = resolve;
      tx.onerror = (e) => {
          console.error('[Storage] Transaction error:', e);
        reject(e);
      };
    };

    request.onerror = (e) => {
      console.error('[Storage] DB open error', e);
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

  const action = event.action;
  const data = event.notification.data || {};
  const click_action = data.click_action || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // ? Focus and post action if needed
          client.focus();
          // ? Envoie les données au client via postMessage
          client.postMessage({ type: 'notification-action', payload: data, action });

          return;
        }
      }

      // ? If no client open, open new tab
      if (clients.openWindow) {
        const url = new URL(click_action, self.location.origin);

        if (action === 'show_graph' && data.chain && data.address) {
          url.searchParams.set('chain', data.chain);
          url.searchParams.set('address', data.address);
          url.searchParams.set('firstiterationlimit', "1");
          url.searchParams.set('depth', "2");
          url.searchParams.set('iterationlimit', "10");
          url.searchParams.set('autostart', '1'); // facultatif selon ton usage
        }
        return clients.openWindow(url.toString());
      }
    })
  );
});

self.addEventListener('push', function(event) {
  let data = {};
  try {
    const payload = event.data?.json() || {};
    data = payload.data || payload;
  } catch (e) {
    console.warn('Invalid JSON in push event:', e);
  }

  const title = data.title || 'Notification';
  const body = data.body || '';
  const icon = '/icons/icon-192.png';
  const message_id = data.message_id;
  const click_action = data.click_action || '/'; // ? URL à ouvrir
  const actions = [];

  // ? Ajouter des boutons si présents dans le payload
  if (data.action_primary === 'show_graph' && data.chain && data.address) {
    actions.push({ action: 'show_graph', title: 'Show Graph' });
  }
  if (data.action_secondary) {
    actions.push({ action: data.action_secondary, title: 'Dismiss' });
  }

  const notificationData = {
    title,
    body,
    icon,
    message_id,
    click_action,
    chain: data.chain,
    address: data.address,
    action_primary: data.action_primary,
    action_secondary: data.action_secondary
  };

  if (!title || !message_id) {
    console.warn('[SW] Skipping notification due to missing title or message_id');
    return;
  }

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(title, {
        body,
        icon,
        data: notificationData,
        actions // ? ajout des boutons dans l’affichage natif
      });

      const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      
      const hasVisibleClient = clientsList.some(client => client.visibilityState === 'visible');

      // ? Only save in background (not if app is visible)
      if (!hasVisibleClient) {
        console.log('[SW] App in background: saving notification');
        await saveNotificationToStorage(notificationData);
      }   

      // ? Inform foreground clients
      for (const client of clientsList) {
        client.postMessage({ type: 'push-received', payload: notificationData });
      }
    })()
  );
});


