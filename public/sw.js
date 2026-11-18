/* Oneklik Biz service worker: lets the app be installed and opened like a mobile app.
   - The app page, CSS and JS are fetched fresh from the server first (so updates arrive at once);
     saved copies are only used when there is no connection.
   - Data (api/) is never cached: sales, orders and reports always come from the server. */
const CACHE = 'oneklik-v2';
const SHELL = ['./', 'manifest.webmanifest', 'assets/css/app.css', 'assets/js/app.js', 'assets/img/login-kantin.webp',
  'assets/icons/icon-192.png', 'assets/icons/icon-512.png', 'assets/icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const networkFirst = (req, key) => fetch(req).then(res => {
  if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
  return res;
}).catch(() => caches.match(key));

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url), scope = new URL(self.registration.scope);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith(scope.pathname + 'api/')) return;
  if (req.mode === 'navigate') { e.respondWith(networkFirst(req, './')); return; }
  if (/\/assets\/(css|js)\//.test(url.pathname)) { e.respondWith(networkFirst(req, url.pathname.slice(scope.pathname.length))); return; }
  // Images, icons and the manifest: saved copy first, refreshed in the background.
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(hit => {
    const net = fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; }).catch(() => hit);
    return hit || net;
  }));
});
