// Change VERSION on every update so the phone downloads the new files.
var VERSION = 'amin-v2';
var FILES = [
  './', 'index.html', 'app.css', 'app.js', 'data.js', 'manifest.webmanifest',
  'img/pere.jpg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png',
  'fonts/amiri-arabic-400-normal.woff2', 'fonts/amiri-arabic-700-normal.woff2',
  'fonts/tajawal-arabic-400-normal.woff2', 'fonts/tajawal-arabic-700-normal.woff2'
];
for (var i = 1; i <= 15; i++) FILES.push('pages/page-' + String(i).padStart(2, '0') + '.jpg');

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
    return hit || fetch(e.request);
  }));
});
