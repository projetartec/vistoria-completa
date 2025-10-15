// public/sw.js

const CACHE_NAME = 'firecheck-brazil-cache-v1';
const urlsToCache = [
  '/',
  '/styles/globals.css', // Assuming your global css is here
  // Add other important assets here. Be careful not to cache everything.
  // For now, we'll keep it simple to avoid installation errors.
];

self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        // AddAll can fail if one of the resources fails.
        // For a more robust solution, you might want to add them individually
        // and handle failures, but this is a good start.
        return cache.addAll(urlsToCache).catch(function(error) {
          console.error('Failed to add URLs to cache during install.', error);
        });
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
