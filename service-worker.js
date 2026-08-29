const CACHE_NAME = 'mina-graph-explorer-v13';
const APP_BUILD_DATE = '2026-08-29';
const FORCE_ACTIVATE_FROM_CACHE = 'mina-graph-explorer-v12';

// Register this before loading Firebase Messaging. The FCM SDK installs its own
// notification click handling and can otherwise replace the application's one.
self.addEventListener('notificationclick', function(event) {
  const data = event.notification.data || {};

  // This is a notification built below by Minagraph, so its click must have a
  // single owner. In particular, do not let Firebase or another listener apply
  // the notification's default link after a Sender/Receiver action was chosen.
  if (data.message_id) event.stopImmediatePropagation();
  event.notification.close();

  const addressesByAction = {
    show_sender: data.sender,
    show_receiver: data.receiver,
    show_bp: data.creatorAccount,
    show_coinbase: data.coinbaseReceiverAccount,
    show_graph: data.address
  };
  // A click on the notification body has no action identifier. In that case,
  // open the receiver graph, which is the common action offered in-app for
  // transaction notifications. Older/generic payloads fall back to `address`.
  const selectedAddress = event.action
    ? (addressesByAction[event.action] || null)
    : (data.receiver || data.address || null);
  const targetUrl = selectedAddress && data.chain
    ? `/?chain=${encodeURIComponent(data.chain)}&address=${encodeURIComponent(selectedAddress)}`
    : (data.click_action || '/');

  event.waitUntil((async () => {
    const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existingClient = clientList.find(client => client.url.includes(self.location.origin));

    if (existingClient) {
      await existingClient.focus();
      if (selectedAddress && data.chain) {
        existingClient.postMessage({
          type: 'notification-action',
          action: 'show_graph',
          payload: { ...data, address: selectedAddress }
        });
      }
      return;
    }

    if (clients.openWindow) await clients.openWindow(targetUrl);
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'activate-update') {
    event.waitUntil(self.skipWaiting());
    return;
  }

  if (event.data?.type !== 'get-technical-diagnostics') return;

  const response = {
    cacheName: CACHE_NAME,
    buildDate: APP_BUILD_DATE,
    scriptUrl: self.location.href
  };

  if (event.ports?.[0]) event.ports[0].postMessage(response);
});

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
  '/scripts/sigma.umd.js',
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
      const existingCaches = await caches.keys();
      if (existingCaches.includes(FORCE_ACTIVATE_FROM_CACHE)) {
        await self.skipWaiting();
      }
    })
  );
});

// Activation : suppression anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

// Interception des requêtes
async function cacheSuccessfulGet(request, response) {
  if (request.method === 'GET' && (response.ok || response.type === 'opaque')) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, navigationFallback = false) {
  try {
    const response = await fetch(request);
    if (!response.ok && response.type !== 'opaque') {
      return (await caches.match(request)) || response;
    }
    return await cacheSuccessfulGet(request, response);
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (navigationFallback) {
      const fallback = await caches.match('/index.html');
      if (fallback) return fallback;
    }
    throw error;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  return cacheSuccessfulGet(request, response);
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  // API (Minataur ou proxy) → Network first
  if (
    url.hostname.includes('minataur.net') ||
    url.hostname.includes('akirion.com') ||
    url.pathname.startsWith('/proxy')
  ) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Local application files: network-first with an offline cache fallback.
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(request, request.mode === 'navigate'));
    return;
  }

  event.respondWith(cacheFirst(request));
});

function buildNotificationActions(data) {
  if (!data.chain) return [];

  const candidates = [
    { action: 'show_sender', title: 'Sender', address: data.sender },
    { action: 'show_receiver', title: 'Receiver', address: data.receiver },
    { action: 'show_bp', title: 'BP', address: data.creatorAccount },
    { action: 'show_coinbase', title: 'Coinbase', address: data.coinbaseReceiverAccount },
    { action: 'show_graph', title: 'Show Graph', address: data.address }
  ];
  const seenAddresses = new Set();
  const availableActions = candidates.filter(candidate => {
    if (!candidate.address || seenAddresses.has(candidate.address)) return false;
    seenAddresses.add(candidate.address);
    return true;
  });
  const browserLimit = typeof Notification !== 'undefined' && Number.isInteger(Notification.maxActions) && Notification.maxActions > 0
    ? Notification.maxActions
    : availableActions.length;

  return availableActions
    .slice(0, browserLimit)
    .map(({ action, title }) => ({ action, title }));
}

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
  const actions = buildNotificationActions(data);

  const notificationData = {
    title,
    body,
    icon,
    message_id,
    click_action,
    chain: data.chain,
    address: data.address,
    action_primary: data.action_primary,
    action_secondary: data.action_secondary,
    ...(data.sender && { sender: data.sender }),
    ...(data.receiver && { receiver: data.receiver }),
    ...(data.creatorAccount && { creatorAccount: data.creatorAccount }),
    ...(data.coinbase && { coinbase: data.coinbase }),
    ...(data.coinbaseReceiverAccount && { coinbaseReceiverAccount: data.coinbaseReceiverAccount })      
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
        actions,
        data: notificationData
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


