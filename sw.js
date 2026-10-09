// Tesela: guarda el juego en el dispositivo para que funcione sin internet.
// Al publicar una versión nueva, cambia VERSION para que los móviles la descarguen.
const VERSION = 'tesela-2026-10-09m';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png', './favicon.png', './menu-bg.jpg'];
const LIB = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await c.addAll(CORE);
    try { const r = await fetch(LIB, { mode: 'cors' }); if (r.ok) await c.put(LIB, r); } catch (_) {}
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const isPage = req.mode === 'navigate' || new URL(req.url).pathname.endsWith('/index.html');
  if (isPage) {
    // el juego: primero la red (para recibir actualizaciones), si no hay conexión, la copia guardada
    e.respondWith((async () => {
      try {
        const r = await fetch(req);
        const c = await caches.open(VERSION); c.put('./index.html', r.clone());
        return r;
      } catch (_) {
        return (await caches.match('./index.html')) || (await caches.match('./')) || Response.error();
      }
    })());
    return;
  }
  // todo lo demás (iconos, motor 3D): primero la copia guardada
  e.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const r = await fetch(req);
      if (r.ok && (req.url.startsWith(self.location.origin) || req.url === LIB)) { const c = await caches.open(VERSION); c.put(req, r.clone()); }
      return r;
    } catch (_) { return Response.error(); }
  })());
});
