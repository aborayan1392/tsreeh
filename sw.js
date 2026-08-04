/* عامل الخدمة — تشغيل التطبيق بدون إنترنت */
const CACHE = 'class-permit-v1';
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/styles.css",
  "./css/fonts.css",
  "./js/app.js",
  "./vendor/xlsx.full.min.js",
  "./vendor/html2canvas.min.js",
  "./icons/icon.svg",
  "./icons/icon-144.png",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-384.png",
  "./icons/icon-512.png",
  "./icons/maskable-192.png",
  "./icons/maskable-512.png",
  "./fonts/cairo-arabic-400.woff2",
  "./fonts/cairo-arabic-600.woff2",
  "./fonts/cairo-arabic-700.woff2",
  "./fonts/cairo-arabic-900.woff2",
  "./fonts/cairo-latin-400.woff2",
  "./fonts/cairo-latin-600.woff2",
  "./fonts/cairo-latin-700.woff2"
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(req, copy));
    return res;
  }).catch(() => hit)));
});
