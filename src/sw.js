import { precacheAndRoute } from 'workbox-precaching';

// This will be replaced by the list of files to precache
self.__WB_MANIFEST;

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
}); 