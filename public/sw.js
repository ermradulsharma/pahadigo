// A dummy service worker to prevent 404 errors in Next.js logs
// This service worker will automatically unregister itself and clean up any old states.

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  self.registration.unregister()
    .then(function() {
      return self.clients.matchAll();
    })
    .then(function(clients) {
      // Unregistered old SW
    });
});
