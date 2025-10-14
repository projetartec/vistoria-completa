
// This service worker has been intentionally left blank to prevent caching issues
// and errors related to missing files like manifest.json or favicon.ico.
// The core offline functionality is handled by IndexedDB.

self.addEventListener('install', (event) => {
  // console.log('Service Worker installing.');
});

self.addEventListener('activate', (event) => {
  // console.log('Service Worker activating.');
});

self.addEventListener('fetch', (event) => {
  // This will not intercept any network requests.
  // The browser will handle all fetches as it normally would.
});
