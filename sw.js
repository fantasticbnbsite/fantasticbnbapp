const CACHE_NAME = 'fantastic-bnb-v9';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/login.html',
  '/client.html',
  '/employee.html',
  '/style.css',
  '/script.js',
  '/client.js',
  '/employee.js',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event: cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event: clean up old caches and force reload all pages
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      // Notify all open pages to reload with new code
      return self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SW_UPDATED' });
        });
      });
    })
  );
  self.clients.claim();
});

// Fetch event: network first, then fallback to cache
self.addEventListener('fetch', (event) => {
  // We only handle GET requests
  if (event.request.method !== 'GET') return;
  // Don't cache API requests
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clonedResponse = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clonedResponse);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  let payload = { title: 'Fantastic BNB', body: 'Nova notificação' };
  if (event.data) {
    try {
      payload = event.data.json();
    } catch(e) {
      payload.body = event.data.text();
    }
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icon-192.png',
      badge: '/icon.svg',
      vibrate: [200, 100, 200]
    })
  );
});

// Click on notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clientsArr => {
      const hadWindowToFocus = clientsArr.some(windowClient => windowClient.url === '/' ? (windowClient.focus(), true) : false);
      if (!hadWindowToFocus) {
        self.clients.openWindow('/');
      }
    })
  );
});
