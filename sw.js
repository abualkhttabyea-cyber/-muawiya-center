
const CACHE_NAME = 'muawiya-v1';
const ASSETS = [
  '/',
  '/manifest.webmanifest',
  'https://picsum.photos/seed/muawiya-logo/192/192'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
