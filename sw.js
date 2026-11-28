// Cache dell'app (stale-while-revalidate) per funzionare offline in fuoristrada.
const V = 'roadbook-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  // solo app e librerie da cdnjs (Leaflet, pdf.js); tile e API passano dritte
  if (u.origin !== location.origin && u.hostname !== 'cdnjs.cloudflare.com') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: u.origin === location.origin }).then(hit => {
    const net = fetch(e.request).then(r => {
      if (r.ok) { const cl = r.clone(); caches.open(V).then(c => c.put(e.request, cl)); }
      return r;
    }).catch(() => hit || caches.match('./index.html'));
    return hit || net;
  }));
});
