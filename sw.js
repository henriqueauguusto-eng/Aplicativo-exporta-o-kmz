/* GeoPonto: guarda o app no aparelho para abrir e funcionar sem internet. */
const CACHE = 'fotos-campo-v5';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
  );
});

/* Responde do aparelho primeiro e atualiza em segundo plano quando há internet. */
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;
  e.respondWith((async function () {
    var cache = await caches.open(CACHE);
    var hit = await cache.match(req, { ignoreSearch: true });
    var net = fetch(req).then(function (res) { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(function () { return null; });
    if (hit) { e.waitUntil(net); return hit; }
    var res = await net;
    if (res) return res;
    if (req.mode === 'navigate') { var idx = await cache.match('./index.html'); if (idx) return idx; }
    return new Response('Sem conexão', { status: 503 });
  })());
});
