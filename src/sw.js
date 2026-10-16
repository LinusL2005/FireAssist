/* FireAssist Service Worker (Build __BUILD__)
   - App startet auch ohne Netz (zuletzt geladene Version aus dem Speicher, Aktualisierung im Hintergrund)
   - Kartenkacheln von basemap.de werden gespeichert (Offline-Karte)
   - Alle anderen externen Anfragen (z. B. Adresssuche) gehen unverändert ans Netz und werden nicht gespeichert */

const SHELL = 'fireassist-shell';
const TILES = 'fireassist-tiles-v1';
const SHELL_FILES = ['./', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
const TILE_HOSTS = ['sgx.geodatenzentrum.de'];
const MAX_TILES = 25000;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (TILE_HOSTS.includes(url.hostname)) { e.respondWith(tile(req)); return; }
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') { e.respondWith(page(e)); return; }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req)));
});

/* Seite: sofort aus dem Speicher, im Hintergrund prüfen, ob es eine neue Version gibt */
async function page(e) {
  const cache = await caches.open(SHELL);
  const cached = await cache.match('./');
  const update = (async () => {
    let res = await fetch(e.request, { cache: 'no-cache' });
    if (!res.ok) return res;
    if (res.redirected) res = new Response(await res.blob(), { headers: res.headers });
    const text = await res.clone().text();
    const old = cached ? await cached.clone().text() : null;
    if (text !== old) {
      await cache.put('./', res.clone());
      if (cached) notifyUpdate();
    }
    return res;
  })();
  if (cached) {
    e.waitUntil(update.catch(() => {}));
    return cached;
  }
  return update.catch(() => new Response('FireAssist ist offline noch nicht verfügbar. Bitte einmal mit Internet öffnen.', {
    status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  }));
}

async function notifyUpdate() {
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach(c => c.postMessage({ type: 'update' }));
}

let puts = 0;

async function tile(req) {
  const cache = await caches.open(TILES);
  const hit = await cache.match(req.url);
  if (hit) return hit;
  try {
    const res = await fetch(req.url, { mode: 'cors', credentials: 'omit' });
    if (res.ok) {
      await cache.put(req.url, res.clone());
      if (++puts % 250 === 0) trim(cache);
    }
    return res;
  } catch (err) {
    return new Response('', { status: 504, statusText: 'offline' });
  }
}

async function trim(cache) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MAX_TILES; i++) await cache.delete(keys[i]);
}
