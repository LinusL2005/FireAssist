/* FireAssist Service Worker (Build __BUILD__)
   - App startet auch ohne Netz (zuletzt geladene Version aus dem Speicher, Aktualisierung im Hintergrund)
   - Kartenkacheln von basemap.de: über „Offline-Karte speichern“ geladene Gebiete (TILES_SAVED) und, sofern
     der Schalter „Angesehene Kartenausschnitte offline behalten“ an ist, alles, was die Karte anzeigt (TILES_SEEN)
   - Alle anderen externen Anfragen (z. B. Adresssuche) gehen unverändert ans Netz und werden nicht gespeichert */

const SHELL = 'fireassist-shell';
const TILES_SAVED = 'fireassist-tiles-saved';
const TILES_SEEN = 'fireassist-tiles-v1'; /* Name aus der ersten Version, in der alles automatisch gespeichert wurde */
const SETTINGS = 'fireassist-settings';
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

/* Schalter „Angesehene Kartenausschnitte offline behalten“: Die Seite legt ihn in SETTINGS ab
   (der Service Worker kann jederzeit neu starten) und meldet Änderungen zusätzlich per Nachricht. */
let keepSeen = null;
async function keepSeenTiles() {
  if (keepSeen === null) {
    const r = await (await caches.open(SETTINGS)).match('./__fa/keep-tiles');
    keepSeen = !r || (await r.text()) !== '0';
  }
  return keepSeen;
}
self.addEventListener('message', e => { if (e.data && e.data.type === 'keep-tiles') keepSeen = !!e.data.value; });

async function tile(req) {
  const saved = await caches.open(TILES_SAVED), seen = await caches.open(TILES_SEEN);
  const hit = (await saved.match(req.url)) || (await seen.match(req.url));
  if (hit) return hit;
  const keep = await keepSeenTiles();
  try {
    /* Schalter aus: auch nicht im normalen Browser-Cache ablegen (basemap.de erlaubt dort 3 Tage) */
    const res = await fetch(req.url, { mode: 'cors', credentials: 'omit', cache: keep ? 'default' : 'no-store' });
    if (res.ok && keep) {
      await seen.put(req.url, res.clone());
      if (++puts % 250 === 0) trim(seen);
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
