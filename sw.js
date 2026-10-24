// Network-first with cache fallback: always fresh when online, instant/offline-capable otherwise.
const C = 'pixaquest-v14', FILES = ['./', 'index.html', 'styles.css', 'theme.js', 'i18n.js', 'app.js', 'games.js', 'avatar.js', 'versus.js', 'lang/es.js', 'lang/fr.js', 'lang/de.js', 'lang/pt.js', 'lang/ru.js', 'lang/hi.js', 'lang/ar.js', 'lang/zh.js', 'lang/ja.js', 'assets/logo-mark.png', 'assets/logo-full.png', 'assets/favicon-48.png', 'terms.html', 'privacy.html', 'faq.html'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(C).then((c) => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== C).map((x) => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => { const cp = r.clone(); caches.open(C).then((c) => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
});
