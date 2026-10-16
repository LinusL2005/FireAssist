'use strict';
/* Karte: Hintergrundkarten, Leitungen, Entnahmestellen, Beschriftungen */

const BASEMAPS = {
  bmde: {
    label: 'Karte (basemap.de)', note: 'Amtliche Karte, nur Deutschland',
    url: 'https://sgx.geodatenzentrum.de/wmts_basemapde/tile/1.0.0/de_basemapde_web_raster_farbe/default/GLOBAL_WEBMERCATOR/{z}/{y}/{x}.png',
    maxNativeZoom: 19, attribution: '© <a href="https://basemap.de" target="_blank" rel="noopener">basemap.de</a> / BKG',
  },
  bmdeGrau: {
    label: 'Karte grau (basemap.de)', note: 'Ruhiger Hintergrund, nur Deutschland',
    url: 'https://sgx.geodatenzentrum.de/wmts_basemapde/tile/1.0.0/de_basemapde_web_raster_grau/default/GLOBAL_WEBMERCATOR/{z}/{y}/{x}.png',
    maxNativeZoom: 19, attribution: '© <a href="https://basemap.de" target="_blank" rel="noopener">basemap.de</a> / BKG',
  },
  esriStreet: {
    label: 'Straßenkarte (Esri)', note: 'Weltweit',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    maxNativeZoom: 18, attribution: 'Kartenkacheln © Esri',
  },
  esriSat: {
    label: 'Luftbild (Esri)', note: 'Weltweit',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxNativeZoom: 19, attribution: 'Luftbild © Esri, Maxar, Earthstar Geographics',
  },
  none: {
    label: 'Keine Hintergrundkarte', note: 'Keine Verbindung zu Kartendiensten, nur Raster', url: null,
  },
  osm: {
    label: 'OpenStreetMap', note: 'Nur wenn die App über einen Webserver läuft',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', httpOnly: true,
    maxNativeZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>-Mitwirkende',
  },
};

const DEFAULT_SETTINGS = { basemap: 'bmde', showPipes: true, showLabels: true, dim: false, theme: 'auto', radius: 300, onlineSearch: true, keepTiles: true, hiddenOrte: [], view: null };
let settings = Object.assign({}, DEFAULT_SETTINGS, (() => { try { return JSON.parse(lsGet(LS_SETTINGS) || '{}'); } catch (e) { return {}; } })());
if (!BASEMAPS[settings.basemap] || (BASEMAPS[settings.basemap].httpOnly && location.protocol === 'file:')) settings.basemap = 'bmde';
function saveSettings() { lsSet(LS_SETTINGS, JSON.stringify(settings)); }

/* Zustand der Oberfläche */
const ui = {
  editMode: false,
  mode: 'view',          // 'view' | 'pickRadius' | 'connect'
  connectFrom: null,
  selSource: null,
  selPipe: null,         // pipeKey
  radius: null,          // { lat, lon, label }
  draft: null,           // neue Entnahmestelle vor dem Speichern { lat, lon }
  offline: !navigator.onLine,
};

let map, baseLayer, gridLayer, pipeRenderer, hlRenderer, dotRenderer;
const layers = {};
const shownMarkers = new Map();
let markerSizeClass = null;
const tileHealth = { errors: 0, loads: 0 };

function isDarkTheme() {
  const t = document.documentElement.dataset.theme;
  if (t === 'dark') return true;
  if (t === 'light') return false;
  return matchMedia('(prefers-color-scheme: dark)').matches;
}

/* Dezentes Raster unter der Hintergrundkarte: bleibt sichtbar, wenn offline keine Kacheln laden */
const OfflineGrid = L.GridLayer.extend({
  createTile() {
    const c = document.createElement('canvas');
    const size = this.getTileSize();
    c.width = size.x; c.height = size.y;
    const ctx = c.getContext('2d');
    ctx.strokeStyle = isDarkTheme() ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)';
    ctx.beginPath();
    ctx.moveTo(0.5, 0); ctx.lineTo(0.5, size.y);
    ctx.moveTo(0, 0.5); ctx.lineTo(size.x, 0.5);
    ctx.stroke();
    return c;
  },
});

function createPane(name, z, noPointer) {
  const p = map.createPane(name);
  p.style.zIndex = z;
  if (noPointer) p.style.pointerEvents = 'none';
}

function initMap() {
  map = L.map('map', { zoomControl: false, maxZoom: 20, minZoom: 4, worldCopyJump: true, zoomSnap: 0.5 });
  map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
  L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);
  if (!matchMedia('(pointer: coarse)').matches) L.control.zoom({ position: 'bottomright', zoomInTitle: 'Hineinzoomen', zoomOutTitle: 'Herauszoomen' }).addTo(map);

  createPane('radiusPane', 380, true);
  createPane('hlPane', 395, true);
  createPane('pipePane', 400);
  createPane('dotPane', 450);
  createPane('labelPane', 460, true);

  gridLayer = new OfflineGrid({ zIndex: 0 }).addTo(map);
  pipeRenderer = L.canvas({ pane: 'pipePane', tolerance: 10, padding: 0.3 });
  hlRenderer = L.canvas({ pane: 'hlPane', padding: 0.3 });
  dotRenderer = L.canvas({ pane: 'dotPane', tolerance: 8, padding: 0.3 });

  for (const k of ['radius', 'hl', 'casing', 'pipes', 'dots', 'markers', 'labels', 'gps', 'draft', 'handles']) layers[k] = L.layerGroup().addTo(map);

  setBasemap(settings.basemap, false);
  applyDim();

  map.on('moveend', () => {
    renderSources();
    renderLabels();
    renderPipeHandles();
    settings.view = { lat: +map.getCenter().lat.toFixed(6), lon: +map.getCenter().lng.toFixed(6), z: map.getZoom() };
    saveSettingsSoon();
  });
}

const saveSettingsSoon = debounce(saveSettings, 800);

/* Über einen Webserver werden Kacheln mit CORS geladen, damit die Offline-Version sie speichern kann */
const TILE_CORS = /^https?:$/.test(location.protocol) ? 'anonymous' : undefined;

function setBasemap(key, save = true) {
  if (!BASEMAPS[key]) key = 'bmde';
  const b = BASEMAPS[key];
  if (baseLayer) map.removeLayer(baseLayer);
  baseLayer = null;
  tileHealth.errors = 0;
  if (b.url) {
    baseLayer = L.tileLayer(b.url, { maxZoom: 20, maxNativeZoom: b.maxNativeZoom, attribution: b.attribution, zIndex: 1, className: 'basemap', crossOrigin: TILE_CORS });
    baseLayer.on('tileerror', () => { tileHealth.errors++; updateOfflineState(); });
    baseLayer.on('tileload', () => { tileHealth.loads++; tileHealth.errors = 0; updateOfflineState(); });
    baseLayer.addTo(map);
  }
  settings.basemap = key;
  if (save) saveSettings();
  updateOfflineState();
}

function applyDim() {
  document.getElementById('map').classList.toggle('dim', !!settings.dim);
}

function updateOfflineState() {
  const off = !navigator.onLine || (!!baseLayer && tileHealth.errors >= 4);
  if (off !== ui.offline) { ui.offline = off; renderPills(); }
}

/* ---------- Darstellung ---------- */

function pipeStyle(dn) {
  if (!dn) return { color: '#868b94', weight: 3, dashArray: '7 7' };
  if (dn <= 80) return { color: '#6fb0ea', weight: 3 };
  if (dn <= 100) return { color: '#3489e0', weight: 4 };
  if (dn <= 150) return { color: '#1462c2', weight: 5.5 };
  if (dn <= 250) return { color: '#0b3d8c', weight: 7 };
  return { color: '#062659', weight: 8.5 };
}

const PIPE_CLASSES = [
  { label: 'bis DN 80', dn: 80 },
  { label: 'DN 100', dn: 100 },
  { label: 'DN 125 – 150', dn: 150 },
  { label: 'DN 200 – 250', dn: 200 },
  { label: 'ab DN 300', dn: 300 },
  { label: 'DN unbekannt', dn: null },
];

function sourceSvg(s, size = 32) {
  const t = TYPES[s.typ] || TYPES.SONST;
  const dead = s.status === 'defekt';
  const fill = dead ? '#80858e' : t.color;
  const txt = t.hydrant ? (s.dn ? String(s.dn) : 'H') : t.letter;
  const st = `fill="${fill}" stroke="#fff" stroke-width="2.2"`;
  let shape, ty = 16;
  switch (t.shape) {
    case 'rsquare': shape = `<rect x="3.5" y="3.5" width="25" height="25" rx="6" ${st}/>`; break;
    case 'square': shape = `<rect x="4" y="4" width="24" height="24" rx="1.5" ${st}/>`; break;
    case 'triangle': shape = `<path d="M16 2.5 30 28H2z" ${st} stroke-linejoin="round"/>`; ty = 19.5; break;
    case 'diamond': shape = `<path d="M16 1.5 30.5 16 16 30.5 1.5 16z" ${st} stroke-linejoin="round"/>`; break;
    default: shape = `<circle cx="16" cy="16" r="13.5" ${st}/>`;
  }
  const fs = txt.length >= 3 ? 10.5 : txt.length === 2 ? 12.5 : 14;
  let extra = '';
  if (dead) extra += '<path d="M8 24 24 8" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M8 24 24 8" stroke="#d1112a" stroke-width="2.6" stroke-linecap="round"/>';
  if (s.status === 'eingeschraenkt') extra += '<circle cx="26.5" cy="5.5" r="5" fill="#f59e0b" stroke="#fff" stroke-width="1.6"/><path d="M26.5 3v3.2" stroke="#1b1b1f" stroke-width="1.8" stroke-linecap="round"/><circle cx="26.5" cy="8.2" r=".9" fill="#1b1b1f"/>';
  return `<svg viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true">${shape}`
    + `<text x="16" y="${ty}" dy=".36em" text-anchor="middle" font-size="${fs}" font-weight="700" fill="#fff" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" letter-spacing="-.3">${esc(txt)}</text>${extra}</svg>`;
}

function markerLabel(s) {
  if (!TYPES[s.typ]?.hydrant && s.volumen) return `${s.id} · ${fmtNum(s.volumen, 0)} m³`;
  return s.id;
}

function sizeClass(z) { return z >= 17 ? 'l' : z >= 15 ? 'm' : 's'; }

function makeMarker(s, cls) {
  const size = cls === 'l' ? 32 : 24;
  const selected = ui.selSource === s.id || ui.connectFrom === s.id;
  const label = cls === 'l' ? `<span class="si-lbl">${esc(markerLabel(s))}</span>` : '';
  const icon = L.divIcon({
    className: 'si-wrap',
    html: `<div class="si${selected ? ' sel' : ''}" style="width:${size}px;height:${size}px">${sourceSvg(s, size)}${label}</div>`,
    iconSize: [size, size], iconAnchor: [size / 2, size / 2],
  });
  const m = L.marker([s.lat, s.lon], {
    icon, draggable: ui.editMode, keyboard: false, autoPan: true,
    zIndexOffset: selected ? 1000 : s.status === 'defekt' ? -100 : 0,
  });
  m.on('click', () => onSourceClick(s.id));
  m.on('dragend', () => onSourceDragged(s.id, m.getLatLng()));
  return m;
}

function makeDot(s) {
  const t = TYPES[s.typ] || TYPES.SONST;
  const selected = ui.selSource === s.id || ui.connectFrom === s.id;
  const m = L.circleMarker([s.lat, s.lon], {
    renderer: dotRenderer, radius: selected ? 8 : 5.5,
    color: selected ? '#ffd400' : '#fff', weight: selected ? 4 : 1.5,
    fillColor: s.status === 'defekt' ? '#80858e' : t.color, fillOpacity: 1, bubblingMouseEvents: false,
  });
  m.on('click', () => onSourceClick(s.id));
  return m;
}

function renderSources(force = false) {
  const cls = sizeClass(map.getZoom());
  if (force || cls !== markerSizeClass) {
    layers.markers.clearLayers();
    layers.dots.clearLayers();
    shownMarkers.clear();
    markerSizeClass = cls;
  }
  const bounds = map.getBounds().pad(0.25);
  for (const [id, m] of shownMarkers) {
    const s = byId.get(id);
    if (!s || !bounds.contains([s.lat, s.lon])) {
      layers.markers.removeLayer(m);
      layers.dots.removeLayer(m);
      shownMarkers.delete(id);
    }
  }
  for (const s of state.sources) {
    if (shownMarkers.has(s.id) || !bounds.contains([s.lat, s.lon])) continue;
    const m = cls === 's' ? makeDot(s) : makeMarker(s, cls);
    (cls === 's' ? layers.dots : layers.markers).addLayer(m);
    shownMarkers.set(s.id, m);
  }
}

function refreshMarkers(...ids) {
  for (const id of ids) {
    const m = id && shownMarkers.get(id);
    if (m) { layers.markers.removeLayer(m); layers.dots.removeLayer(m); shownMarkers.delete(id); }
  }
  renderSources();
}

const pipeLayers = new Map();

function renderPipes() {
  layers.casing.clearLayers();
  layers.pipes.clearLayers();
  pipeLayers.clear();
  if (settings.showPipes) {
    const casingColor = settings.basemap === 'esriSat' ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.9)';
    const lines = [];
    for (const p of state.pipes) {
      const pts = pipePoints(p);
      if (!pts) continue;
      const st = pipeStyle(p.dn);
      const casing = L.polyline(pts, { renderer: pipeRenderer, color: casingColor, weight: st.weight + 3, interactive: false, lineCap: 'round', lineJoin: 'round' }).addTo(layers.casing);
      lines.push([p, pts, st, casing]);
    }
    for (const [p, pts, st, casing] of lines) {
      const line = L.polyline(pts, Object.assign({ renderer: pipeRenderer, lineCap: 'round', lineJoin: 'round', opacity: 1, bubblingMouseEvents: false }, st));
      line.on('click', () => onPipeClick(p));
      line.addTo(layers.pipes);
      pipeLayers.set(pipeKey(p.a, p.b), { line, casing });
    }
  }
  renderHighlight();
}

function renderHighlight() {
  layers.hl.clearLayers();
  let list = [];
  if (ui.selPipe) list = state.pipes.filter(p => pipeKey(p.a, p.b) === ui.selPipe);
  else if (ui.selSource) list = pipesOf(ui.selSource);
  if (settings.showPipes) {
    for (const p of list) {
      const pts = pipePoints(p);
      if (!pts) continue;
      L.polyline(pts, {
        renderer: hlRenderer, color: '#ffcc00', weight: pipeStyle(p.dn).weight + 11, opacity: 0.9, interactive: false, lineCap: 'round', lineJoin: 'round',
      }).addTo(layers.hl);
    }
  }
  renderPipeHandles();
  renderLabels();
}

/* Position in der Mitte des Leitungsverlaufs (in Bildschirmpixeln) samt Richtung des dortigen Abschnitts */
function midAlong(pts) {
  const px = pts.map(p => map.latLngToLayerPoint(p));
  const seg = [];
  let total = 0;
  for (let i = 1; i < px.length; i++) { const d = px[i - 1].distanceTo(px[i]); seg.push(d); total += d; }
  let rest = total / 2;
  for (let i = 0; i < seg.length; i++) {
    if (rest <= seg[i] || i === seg.length - 1) {
      const t = seg[i] ? Math.min(1, rest / seg[i]) : 0;
      const p0 = px[i], p1 = px[i + 1];
      return {
        total, segLen: seg[i],
        latlng: map.layerPointToLatLng(L.point(p0.x + (p1.x - p0.x) * t, p0.y + (p1.y - p0.y) * t)),
        ang: Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI,
      };
    }
    rest -= seg[i];
  }
  return null;
}

function renderLabels() {
  layers.labels.clearLayers();
  if (!settings.showLabels || !settings.showPipes || map.getZoom() < 17) return;
  const bounds = map.getBounds().pad(0.1);
  const editing = ui.editMode && ui.selPipe;
  for (const p of state.pipes) {
    if (!p.dn || (editing && pipeKey(p.a, p.b) === ui.selPipe)) continue;
    const pts = pipePoints(p);
    if (!pts || !pts.some(pt => bounds.contains(pt))) continue;
    const m = midAlong(pts);
    if (!m || m.total < 90 || m.segLen < 60 || !bounds.contains(m.latlng)) continue;
    let ang = m.ang;
    if (ang > 90) ang -= 180;
    if (ang < -90) ang += 180;
    const icon = L.divIcon({
      className: 'pl-wrap', iconSize: [0, 0],
      html: `<div class="pipe-lbl" style="transform:translate(-50%,-50%) rotate(${ang.toFixed(1)}deg)">DN ${p.dn}</div>`,
    });
    L.marker(m.latlng, { icon, pane: 'labelPane', interactive: false, keyboard: false }).addTo(layers.labels);
  }
}

/* ---------- Leitungsverlauf bearbeiten: Knickpunkte ziehen, einfügen, löschen ---------- */

function vtxIcon(ghost) {
  return L.divIcon({ className: 'vtx-wrap', html: `<div class="vtx${ghost ? ' ghost' : ''}"></div>`, iconSize: [36, 36], iconAnchor: [18, 18] });
}

function renderPipeHandles() {
  layers.handles.clearLayers();
  if (!ui.editMode || !ui.selPipe || !settings.showPipes) return;
  const key = ui.selPipe;
  const p = state.pipes.find(x => pipeKey(x.a, x.b) === key);
  const pts = p && pipePoints(p);
  if (!pts) return;
  if (!p.via) p.via = [];
  const round = v => +v.toFixed(7);
  const preview = np => {
    const l = pipeLayers.get(key);
    if (l) { l.line.setLatLngs(np); l.casing.setLatLngs(np); }
  };
  p.via.forEach((v, i) => {
    const m = L.marker(v, { icon: vtxIcon(false), draggable: true, keyboard: false, zIndexOffset: 4000 });
    m.on('drag', () => { const ll = m.getLatLng(); const np = pts.slice(); np[i + 1] = [ll.lat, ll.lng]; preview(np); });
    m.on('dragend', () => { const ll = m.getLatLng(); pushUndo('Verlauf geändert'); p.via[i] = [round(ll.lat), round(ll.lng)]; commit(); });
    m.on('click', () => {
      pushUndo('Knickpunkt gelöscht');
      p.via.splice(i, 1);
      commit();
      toast('Knickpunkt gelöscht.', { action: { label: 'Rückgängig', fn: undo } });
    });
    m.addTo(layers.handles);
  });
  for (let i = 0; i < pts.length - 1; i++) {
    const a = map.latLngToLayerPoint(pts[i]), b = map.latLngToLayerPoint(pts[i + 1]);
    if (a.distanceTo(b) < 44) continue;
    const mid = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
    const g = L.marker(mid, { icon: vtxIcon(true), draggable: true, keyboard: false, zIndexOffset: 3900 });
    g.on('drag', () => { const ll = g.getLatLng(); const np = pts.slice(); np.splice(i + 1, 0, [ll.lat, ll.lng]); preview(np); });
    g.on('dragend', () => { const ll = g.getLatLng(); pushUndo('Knickpunkt eingefügt'); p.via.splice(i, 0, [round(ll.lat), round(ll.lng)]); commit(); });
    g.on('click', () => { pushUndo('Knickpunkt eingefügt'); p.via.splice(i, 0, [round(mid[0]), round(mid[1])]); commit(); });
    g.addTo(layers.handles);
  }
}

function renderAll() {
  renderPipes();
  renderSources(true);
  drawRadius();
}

/* ---------- Sichtbereich (Bottom-Sheet / Seitenleiste berücksichtigen) ---------- */

function isWide() { return matchMedia('(min-width: 900px)').matches; }

function viewPadding() {
  const top = ($('.topbar')?.getBoundingClientRect().bottom || 0) + 12;
  let left = 16, bottom = 16;
  const sh = $('#sheet');
  if (sh && sh.classList.contains('open')) {
    /* Maße statt getBoundingClientRect: das Sheet kann gerade noch hereinfahren */
    if (isWide()) left = sh.offsetLeft + sh.offsetWidth + 16;
    else bottom = sh.offsetHeight + 12;
  }
  return { tl: L.point(left, top), br: L.point(16, bottom) };
}

function focusLatLng(latlng, zoom) {
  zoom = zoom ?? map.getZoom();
  const pad = viewPadding(), size = map.getSize();
  const visCenter = L.point((pad.tl.x + size.x - pad.br.x) / 2, (pad.tl.y + size.y - pad.br.y) / 2);
  const offset = visCenter.subtract(size.divideBy(2));
  const target = map.unproject(map.project(latlng, zoom).subtract(offset), zoom);
  map.flyTo(target, zoom, { duration: 0.5 });
}

/* Verschiebt die Karte nur, wenn der Punkt vom Sheet oder der Kopfzeile verdeckt ist */
function ensureVisible(latlng) {
  const pad = viewPadding(), size = map.getSize(), p = map.latLngToContainerPoint(latlng);
  if (p.x < pad.tl.x || p.y < pad.tl.y || p.x > size.x - pad.br.x || p.y > size.y - pad.br.y) focusLatLng(latlng);
}

function fitBoundsVisible(bounds, maxZoom = 18) {
  if (!bounds || !bounds.isValid()) return;
  const pad = viewPadding();
  map.fitBounds(bounds, { paddingTopLeft: pad.tl, paddingBottomRight: pad.br, maxZoom });
}

function dataBounds() {
  if (!state.sources.length) return null;
  return L.latLngBounds(state.sources.map(s => [s.lat, s.lon]));
}

function fitData() {
  const b = dataBounds();
  if (b) fitBoundsVisible(b, 17);
}
