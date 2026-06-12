const CACHE_NAME = 'deutsch-kompass-pwa-20260612k';
const APP_SHELL = [
  '/',
  '/index.html',
  '/style.css?v=pwa-20260612k',
  '/data.js?v=pwa-20260612k',
  '/state.js?v=pwa-20260612k',
  '/atlas.js?v=pwa-20260612k',
  '/adjektiv.js?v=pwa-20260612k',
  '/genus.js?v=pwa-20260612k',
  '/pronomen.js?v=pwa-20260612k',
  '/drill.js?v=pwa-20260612k',
  '/stats.js?v=pwa-20260612k',
  '/app.js?v=pwa-20260612k',
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
