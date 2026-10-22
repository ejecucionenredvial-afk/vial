/* Service worker: la app abre aunque no haya internet (usa la última versión guardada). */
var CACHE = 'fotos-lanus-v3';
var FILES = ['./foto-ubicacion.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(FILES.map(function (f) { return c.add(f).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
/* Primero la red; si tarda más de 3,5 s o falla (poca señal), la copia guardada */
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(new Promise(function (resolve) {
    var done = false;
    function finish(r) { if (!done) { done = true; resolve(r); } }
    var t = setTimeout(function () {
      caches.match(e.request, { ignoreSearch: true }).then(function (c) { if (c) finish(c); });
    }, 3500);
    fetch(e.request).then(function (r) {
      clearTimeout(t);
      var copy = r.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      finish(r);
    }).catch(function () {
      clearTimeout(t);
      caches.match(e.request, { ignoreSearch: true }).then(function (c) { finish(c || Response.error()); });
    });
  }));
});
