const CACHE_NAME = 'deutsch-kompass-pwa-20260612l';
const APP_SHELL = [
  '/',
  '/index.html',
  '/style.css?v=pwa-20260612l',
  '/data.js?v=pwa-20260612l',
  '/state.js?v=pwa-20260612l',
  '/atlas.js?v=pwa-20260612l',
  '/adjektiv.js?v=pwa-20260612l',
  '/genus.js?v=pwa-20260612l',
  '/pronomen.js?v=pwa-20260612l',
  '/drill.js?v=pwa-20260612l',
  '/stats.js?v=pwa-20260612l',
  '/app.js?v=pwa-20260612l',
  '/manifest.webmanifest',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      }))
      .catch(() => caches.match('/index.html'))
  );
});
