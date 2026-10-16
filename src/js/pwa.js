'use strict';
/* Installierbare Web-Version (Ordner web/): Service Worker anmelden, Offline-Karte speichern.
   In der Einzeldatei FireAssist.html (Doppelklick) ist das alles abgeschaltet. */

const PWA = {
  enabled: /^https?:$/.test(location.protocol) && 'serviceWorker' in navigator && 'caches' in window
    && !!document.querySelector('link[rel="manifest"]'),
  tileCache: 'fireassist-tiles-v1',
  maxTiles: 12000,
  cancel: null,
};

function initPwa() {
  if (!PWA.enabled) return;
  navigator.serviceWorker.register('sw.js').catch(() => {});
  navigator.serviceWorker.addEventListener('message', e => { if (e.data && e.data.type === 'update') notifyNewVersion(); });
  /* Der Service Worker holt neue Versionen im Hintergrund. Zusätzlich selbst nachsehen,
     weil seine Nachricht beim Start der Seite verloren gehen kann. */
  [3000, 10000, 30000].forEach(ms => setTimeout(checkCachedVersion, ms));
}

const OWN_BUILD = document.querySelector('meta[name="fa-build"]')?.content || null;

async function checkCachedVersion() {
  if (!OWN_BUILD || PWA.notified) return;
  try {
    const res = await (await caches.open('fireassist-shell')).match('./');
    const m = res && (await res.text()).match(/<meta name="fa-build" content="([^"]+)"/);
    if (m && m[1] !== OWN_BUILD) notifyNewVersion();
  } catch (e) { /* nicht kritisch */ }
}

function notifyNewVersion() {
  if (PWA.notified) return;
  PWA.notified = true;
  toast('Neue Version bzw. neuer Datenstand verfügbar.', { action: { label: 'Neu laden', fn: () => location.reload() }, ms: 30000 });
}

function isInstalledApp() {
  return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}

/* ---------- Kacheln berechnen ---------- */

const lon2x = (lon, z) => Math.floor((lon + 180) / 360 * 2 ** z);
const lat2y = (lat, z) => {
  const r = lat * RAD;
  return Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * 2 ** z);
};

/* Offline gespeichert wird nur basemap.de (offene Daten des Bundes, Lizenz erlaubt das Speichern) */
function offlineBasemapKey() { return settings.basemap === 'bmdeGrau' ? 'bmdeGrau' : 'bmde'; }

function tileUrlsFor(bounds, maxZoom) {
  const tpl = BASEMAPS[offlineBasemapKey()].url;
  const urls = [];
  for (let z = 12; z <= maxZoom; z++) {
    const x0 = lon2x(bounds.getWest(), z), x1 = lon2x(bounds.getEast(), z);
    const y0 = lat2y(bounds.getNorth(), z), y1 = lat2y(bounds.getSouth(), z);
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) urls.push(tpl.replace('{z}', z).replace('{x}', x).replace('{y}', y));
  }
  return urls;
}

function offlinePlan(area) {
  let bounds;
  if (area === 'data') {
    const b = dataBounds();
    if (!b) return null;
    const pad = 0.006; /* ca. 500–700 m Rand */
    bounds = L.latLngBounds([b.getSouth() - pad, b.getWest() - pad * 1.6], [b.getNorth() + pad, b.getEast() + pad * 1.6]);
  } else {
    bounds = map.getBounds();
  }
  let maxZoom = 18, urls = tileUrlsFor(bounds, maxZoom);
  while (urls.length > PWA.maxTiles && maxZoom > 14) urls = tileUrlsFor(bounds, --maxZoom);
  return { urls, maxZoom, mb: Math.max(1, Math.round(urls.length * 14 / 1024)) };
}

async function tileCacheInfo() {
  try {
    const c = await caches.open(PWA.tileCache);
    const n = (await c.keys()).length;
    const est = navigator.storage?.estimate ? await navigator.storage.estimate() : null;
    return { n, mb: est ? Math.round(est.usage / 1048576) : null };
  } catch (e) { return { n: 0, mb: null }; }
}

/* ---------- Dialog ---------- */

async function offlineDialogHtml() {
  const info = await tileCacheInfo();
  const data = offlinePlan('data');
  const view = offlinePlan('view');
  const zoomNote = p => (p.maxZoom < 18 ? ` · bis Zoomstufe ${p.maxZoom}` : '');
  return `<div class="modal-head"><h2>Offline-Karte</h2><button class="icon-btn" data-act="modal-close" aria-label="Schließen">${IC.close}</button></div>
    <div class="modal-body">
      <p>Kartenkacheln von <b>basemap.de</b> werden auf diesem Gerät gespeichert. So erscheint die Karte auch ohne Netz.
        Bereits angesehene Kartenausschnitte werden automatisch gespeichert.</p>
      <p class="muted small">Gespeichert: <b>${fmtNum(info.n, 0)}</b> Kacheln${info.mb != null ? ` · App-Speicher gesamt ca. ${fmtNum(info.mb, 0)} MB` : ''}</p>
      ${isInstalledApp() ? '' : '<p class="note small">Tipp: App vorher über „Zum Startbildschirm hinzufügen“ installieren. Sonst kann vor allem iOS gespeicherte Daten nach einigen Tagen ohne Nutzung löschen.</p>'}
      <div class="menu-group">
        ${data ? `<button class="menu-item" data-act="offline-run" data-area="data">${IC.download}<span>Einsatzgebiet speichern <small>alle Hydranten + Umgebung · ${fmtNum(data.urls.length, 0)} Kacheln, ca. ${data.mb} MB${zoomNote(data)}</small></span></button>` : ''}
        <button class="menu-item" data-act="offline-run" data-area="view">${IC.map}<span>Aktuellen Kartenausschnitt speichern <small>${fmtNum(view.urls.length, 0)} Kacheln, ca. ${view.mb} MB${zoomNote(view)}</small></span></button>
        ${info.n ? `<button class="menu-item" data-act="offline-clear">${IC.trash}<span><span class="danger-text">Offline-Karte löschen</span></span></button>` : ''}
      </div>
    </div>`;
}

async function runOfflinePrefetch(area) {
  const plan = offlinePlan(area);
  if (!plan || !plan.urls.length) return;
  if (!navigator.onLine) { toast('Offline – zum Speichern der Karte wird Internet benötigt.'); return; }
  try { await navigator.storage?.persist?.(); } catch (e) { /* optional */ }
  const cache = await caches.open(PWA.tileCache);
  const queue = plan.urls.slice();
  const total = queue.length;
  let done = 0, failed = 0, cancelled = false;
  PWA.cancel = () => { cancelled = true; };
  openModal(`<div class="modal-head"><h2>Offline-Karte wird gespeichert</h2></div>
    <div class="modal-body"><div class="progress"><span id="off-bar"></span></div><p id="off-text" class="small muted">0 von ${fmtNum(total, 0)} Kacheln</p></div>
    <div class="modal-foot"><button class="btn" data-act="offline-cancel">Abbrechen</button></div>`);
  const show = () => {
    const bar = $('#off-bar'), txt = $('#off-text');
    if (bar) bar.style.width = `${Math.round(done / total * 100)}%`;
    if (txt) txt.textContent = `${fmtNum(done, 0)} von ${fmtNum(total, 0)} Kacheln${failed ? ` · ${failed} fehlgeschlagen` : ''}`;
  };
  const worker = async () => {
    while (queue.length && !cancelled) {
      const u = queue.shift();
      try {
        if (!(await cache.match(u))) {
          const r = await fetch(u, { mode: 'cors', credentials: 'omit' });
          if (r.ok) await cache.put(u, r); else failed++;
        }
      } catch (e) { failed++; }
      done++;
      if (done % 15 === 0 || done === total) show();
    }
  };
  await Promise.all([1, 2, 3, 4].map(worker));
  PWA.cancel = null;
  closeModal();
  if (cancelled) toast(`Abgebrochen – ${fmtNum(done, 0)} Kacheln gespeichert.`);
  else toast(`Offline-Karte gespeichert (${fmtNum(total - failed, 0)} Kacheln${failed ? `, ${failed} fehlgeschlagen` : ''}).`, { ms: 6000 });
}

Object.assign(ACT, {
  'offline-open': async () => openModal(await offlineDialogHtml()),
  'offline-run': d => runOfflinePrefetch(d.area),
  'offline-cancel': () => { if (PWA.cancel) PWA.cancel(); },
  'offline-clear': async () => {
    if (!(await confirmDialog({ title: 'Offline-Karte löschen?', text: '<p>Alle gespeicherten Kartenkacheln werden von diesem Gerät entfernt.</p>', ok: 'Löschen', danger: true }))) return;
    await caches.delete(PWA.tileCache);
    toast('Offline-Karte gelöscht.');
  },
});
