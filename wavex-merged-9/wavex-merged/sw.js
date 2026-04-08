const CACHE = 'wavex-v1';
const STATIC = ['/', '/index.html', '/styles/style.css', '/styles/responsive.css', '/js/app.js', '/js/i18n.js', '/assets/images/logo.svg', '/assets/images/logo-light.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const net = fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});

// Push notification handler
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'Wavex', body: 'إشعار جديد' };
  e.waitUntil(self.registration.showNotification(data.title || 'Wavex', {
    body: data.body || '',
    icon: '/assets/icons/favicon.svg',
    badge: '/assets/icons/favicon.svg',
    data: data.url || '/',
    vibrate: [100, 50, 100],
    dir: 'rtl'
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data || '/'));
});
