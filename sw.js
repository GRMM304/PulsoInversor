// Pulso Inversor · Service worker mínimo para instalar el sitio como app.
// Siempre va primero a la red (así nunca muestra contenido viejo); solo si no hay conexión
// responde con la última versión guardada de la página o con el inicio.
const CACHE = 'pulso-v1';
const BASE = ['/', '/assets/css/styles.css', '/assets/js/main.js', '/assets/img/logo-pulso-gmm.webp', '/assets/img/favicon.svg'];

self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  if (/^\/(api|panel|seguimiento)(\/|$)/.test(u.pathname)) return;   // nunca se guardan datos ni páginas privadas
  const esPagina = r.mode === 'navigate';
  if (!esPagina && !/\.(css|js|webp|png|jpg|svg|woff2?)$/.test(u.pathname)) return;
  e.respondWith(fetch(r).then((res) => {
    if (res.ok && res.type === 'basic') { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(r, copia)); }
    return res;
  }).catch(() => caches.match(r).then((m) => m || (esPagina ? caches.match('/') : undefined))));
});
