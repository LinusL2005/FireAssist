'use strict';
/* Oberfläche: Bottom-Sheet, Dialoge, Auswahl, Bearbeiten, Umkreissuche, Suche, GPS, Menü „Mehr“ (☰), untere Leiste */

const icon = p => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const IC = {
  menu: icon('<path d="M4 6h16M4 12h16M4 18h16"/>'),
  layers: icon('<path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5"/>'),
  search: icon('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  target: icon('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"/>'),
  locate: icon('<path d="M3 11 21 3l-8 18-2-8z"/>'),
  close: icon('<path d="M6 6l12 12M18 6 6 18"/>'),
  edit: icon('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m14 6 4 4"/>'),
  link: icon('<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8 16 16 8"/>'),
  trash: icon('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
  nav: icon('<path d="M12 2 5 20l7-3.5 7 3.5z"/>'),
  copy: icon('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>'),
  list: icon('<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>'),
  upload: icon('<path d="M12 15V4M7 9l5-5 5 5"/><path d="M4 15v5h16v-5"/>'),
  download: icon('<path d="M12 4v11M7 10l5 5 5-5"/><path d="M4 15v5h16v-5"/>'),
  info: icon('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'),
  undo: icon('<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>'),
  chevron: icon('<path d="m9 6 6 6-6 6"/>'),
  back: icon('<path d="m15 6-6 6 6 6"/>'),
  table: icon('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/>'),
  file: icon('<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>'),
  app: icon('<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M11 18h2"/>'),
  legend: icon('<circle cx="6" cy="7" r="2.2"/><path d="M11 7h9M11 17h9"/><path d="M4 15h4v4H4z"/>'),
  pin: icon('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  sparkle: icon('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>'),
  offline: icon('<path d="M2 8.8a15 15 0 0 1 4.2-2.6M10.7 5.1A15 15 0 0 1 22 8.8M5 12.5a10 10 0 0 1 5.2-2.6M16.8 11a10 10 0 0 1 2.2 1.5M8.5 16a5 5 0 0 1 7 0M12 20h.01M3 3l18 18"/>'),
  json: icon('<path d="M8 4H7a2 2 0 0 0-2 2v4l-2 2 2 2v4a2 2 0 0 0 2 2h1M16 4h1a2 2 0 0 1 2 2v4l2 2-2 2v4a2 2 0 0 1-2 2h-1"/>'),
  radio: icon('<circle cx="12" cy="10" r="2"/><path d="M12 12v9M8.5 6.5a5 5 0 0 0 0 7M15.5 6.5a5 5 0 0 1 0 7M5.6 3.6a9 9 0 0 0 0 12.8M18.4 3.6a9 9 0 0 1 0 12.8"/>'),
  hazard: icon('<path d="M12 2.5 21.5 12 12 21.5 2.5 12z"/><path d="M12 8v5M12 16v.5"/>'),
  filter: icon('<path d="M3 5h18l-7 8.5V19l-4 2v-7.5z"/>'),
  map: icon('<path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5V4l-6 2.5z"/><path d="M9 4v13M15 6.5v13"/>'),
  route: icon('<circle cx="5" cy="18" r="2"/><circle cx="19" cy="6" r="2"/><path d="M7 18h5a3 3 0 0 0 0-6h-1a3 3 0 0 1 0-6h6"/>'),
  plus: icon('<path d="M12 5v14M5 12h14"/>'),
  sliders: icon('<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>'),
  code: icon('<path d="m8 7-5 5 5 5M16 7l5 5-5 5"/>'),
  external: icon('<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
};

const LOGO = `<svg viewBox="0 0 32 32" width="40" height="40" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#c8102e"/><path d="M12.2 11.5a3.8 3.8 0 0 1 7.6 0h1v2.2h-1V23h1.2v2.3h-9.9V23h1.1v-9.3h-1v-2.2z" fill="#fff"/><path d="M8.6 15.4h3.6v3.4H8.6zM19.8 15.4h3.6v3.4h-3.6z" fill="#fff"/><circle cx="16" cy="17.2" r="1.6" fill="#c8102e"/></svg>`;
const EINSATZ_SVG = `<svg viewBox="0 0 44 44" width="44" height="44" aria-hidden="true"><circle cx="22" cy="22" r="20" fill="rgba(208,16,46,.18)"/><circle cx="22" cy="22" r="11" fill="#d0102e" stroke="#fff" stroke-width="3"/><path d="M22 15.5c2.6 2.6 4 4.6 4 7a4 4 0 0 1-8 0c0-1.4.6-2.6 1.6-3.6.2 1.2.8 2 1.6 2.3-.4-2 .1-3.9.8-5.7z" fill="#fff"/></svg>`;

/* ---------- Toast ---------- */

let toastTimer;
function toast(msg, { action, ms = 3500 } = {}) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button class="toast-btn">${esc(action.label)}</button>` : ''}`;
  if (action) t.querySelector('button').onclick = () => { hideToast(); action.fn(); };
  t.hidden = false;
  requestAnimationFrame(() => t.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, action ? Math.max(ms, 6500) : ms);
}
function hideToast() {
  const t = $('#toast');
  t.classList.remove('show');
  setTimeout(() => { if (!t.classList.contains('show')) t.hidden = true; }, 250);
}

/* ---------- Dialoge ---------- */

let modalResolve = null, modalChoices = [];

function openModal(html, { wide = false } = {}) {
  if (modalResolve) { const r = modalResolve; modalResolve = null; r(null); }
  const m = $('#modal');
  const card = $('.modal-card', m);
  card.className = 'modal-card' + (wide ? ' wide' : '');
  card.innerHTML = html;
  m.hidden = false;
  requestAnimationFrame(() => m.classList.add('show'));
}

function closeModal(value = null) {
  const m = $('#modal');
  m.classList.remove('show');
  m.hidden = true;
  if (modalResolve) { const r = modalResolve; modalResolve = null; r(value); }
}

function choiceDialog({ title, text, buttons }) {
  return new Promise(resolve => {
    openModal(`<div class="modal-head"><h2>${esc(title)}</h2></div><div class="modal-body">${text}</div>
      <div class="modal-foot">${buttons.map((b, i) => `<button class="btn ${b.kind || ''}" data-act="modal-choice" data-i="${i}">${esc(b.label)}</button>`).join('')}</div>`);
    modalChoices = buttons;
    modalResolve = resolve;
  });
}

function confirmDialog({ title, text, ok = 'OK', danger = false }) {
  return choiceDialog({ title, text, buttons: [{ label: 'Abbrechen', value: false }, { label: ok, value: true, kind: danger ? 'danger' : 'primary' }] })
    .then(v => v === true);
}

function infoDialog(title, html, { action } = {}) {
  const buttons = [];
  if (action) buttons.push({ label: action.label, value: 'action' });
  buttons.push({ label: 'OK', value: 'ok', kind: 'primary' });
  choiceDialog({ title, text: html, buttons }).then(v => { if (v === 'action') action.fn(); });
}

/* ---------- Bottom-Sheet ---------- */

const sheet = { name: null, build: null, live: true };

function openSheet(name, build, { live = true, expand = false } = {}) {
  sheet.name = name; sheet.build = build; sheet.live = live;
  const sh = $('#sheet');
  sh.hidden = false;
  sh.classList.toggle('expanded', expand);
  renderSheet(false);
  void sh.offsetHeight;
  sh.classList.add('open');
  updateSheetOffset();
  renderTabbar();
}

function renderSheet(keepScroll = true) {
  if (!sheet.build) return;
  const html = sheet.build();
  if (html == null) { closeSheet(); return; }
  const body = $('#sheet-body');
  const st = body.scrollTop;
  body.innerHTML = html;
  body.scrollTop = keepScroll ? st : 0;
  updateSheetOffset();
}

function closeSheet() {
  const sh = $('#sheet');
  sh.classList.remove('open', 'expanded');
  sheet.name = null; sheet.build = null;
  if (ui.draft) { ui.draft = null; layers.draft.clearLayers(); }
  clearSelection();
  updateSheetOffset();
  renderTabbar();
  setTimeout(() => { if (!sh.classList.contains('open')) sh.hidden = true; }, 260);
}

function updateSheetOffset() {
  const sh = $('#sheet');
  const h = sh.classList.contains('open') && !isWide() ? sh.offsetHeight : 0;
  document.documentElement.style.setProperty('--sheet-h', h + 'px');
  /* Oberkante für das Panel: unterhalb von Suchleiste und Hinweisleisten */
  const top = $('.topbar')?.getBoundingClientRect().bottom || 70;
  document.documentElement.style.setProperty('--top-h', Math.round(top + 10) + 'px');
  /* Bei hohem Panel ist über ihm kein Platz für die runden Knöpfe */
  $('#app').classList.toggle('sheet-tall', h > 0 && window.innerHeight - tabbarHeight() - h < top + 150);
}

function initSheetDrag() {
  const sh = $('#sheet'), handle = $('#sheet-handle');
  let y0 = null, dy = 0;
  handle.addEventListener('pointerdown', e => { y0 = e.clientY; dy = 0; sh.classList.add('dragging'); handle.setPointerCapture(e.pointerId); });
  handle.addEventListener('pointermove', e => {
    if (y0 == null) return;
    dy = e.clientY - y0;
    if (!isWide()) sh.style.transform = `translateY(${Math.max(0, dy)}px)`;
  });
  const end = () => {
    if (y0 == null) return;
    y0 = null;
    sh.classList.remove('dragging');
    sh.style.transform = '';
    if (dy > 90) ACT['close-sheet']();
    else if (dy < -40) sh.classList.add('expanded');
    else if (Math.abs(dy) < 6) sh.classList.toggle('expanded');
    setTimeout(updateSheetOffset, 260);
  };
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
}

/* ---------- Hinweisleisten oben ---------- */

function renderPills() {
  const out = [];
  if (ui.offline) out.push(`<div class="pill pill-off">${IC.offline}<span>Offline – keine Hintergrundkarte. Hydranten und Leitungen bleiben verfügbar.</span></div>`);
  if (hasDemoSources()) out.push(`<div class="pill pill-demo">${IC.sparkle}<span><b>Beispieldaten</b> – frei erfunden, nicht für den Einsatz</span></div>`);
  if (ui.mode === 'pickRadius') {
    out.push(`<div class="pill pill-act">${IC.target}<span>Einsatzstelle auf der Karte antippen</span><button data-act="radius-gps">Mein Standort</button><button data-act="mode-cancel">Abbrechen</button></div>`);
  } else if (ui.mode === 'connect') {
    out.push(`<div class="pill pill-act">${IC.link}<span>Leitung ab <b>${esc(ui.connectFrom)}</b>: nächste Entnahmestelle antippen – oder eine Leitung für einen Abzweig</span><button data-act="mode-cancel">Fertig</button></div>`);
  } else if (ui.mode === 'addNode') {
    out.push(`<div class="pill pill-act">${IC.route}<span>Knoten: Stelle auf einer Leitung antippen, z. B. an der Kreuzung</span><button data-act="mode-cancel">Abbrechen</button></div>`);
  } else if (ui.editMode) {
    out.push(`<div class="pill pill-edit">${IC.edit}<span>Bearbeiten: Karte antippen = neue Entnahmestelle, Symbole verschiebbar</span><button data-act="edit-off">Fertig</button></div>`);
  }
  $('#pills').innerHTML = out.join('');
  updateSheetOffset();
}

/* ---------- Auswahl ---------- */

function selectSource(id, { focus = false } = {}) {
  if (!byId.has(id)) return;
  const prev = ui.selSource;
  ui.selSource = id;
  ui.selPipe = null;
  refreshMarkers(prev, id);
  renderHighlight();
  openSheet('source', () => sourceSheetHtml(id));
  const s = byId.get(id);
  if (focus) focusLatLng([s.lat, s.lon], Math.max(map.getZoom(), 17));
  else ensureVisible([s.lat, s.lon]);
}

function selectPipe(p) {
  const prev = ui.selSource;
  ui.selSource = null;
  ui.selPipe = pipeKey(p.a, p.b);
  refreshMarkers(prev);
  renderHighlight();
  const key = ui.selPipe;
  openSheet('pipe', () => pipeSheetHtml(key));
  const pts = pipePoints(p);
  if (pts) ensureVisible(pts[Math.floor(pts.length / 2)].map((v, i) => (v + pts[Math.ceil(pts.length / 2) - 1][i]) / 2));
}

function clearSelection() {
  const prev = ui.selSource;
  ui.selSource = null;
  ui.selPipe = null;
  if (prev) refreshMarkers(prev);
  renderHighlight();
}

function onSourceClick(id) {
  if (ui.mode === 'connect') { connectTo(id); return; }
  if (ui.mode === 'addNode') { toast('Bitte eine Leitung antippen – oder „Abbrechen“.'); return; }
  if (ui.mode === 'pickRadius') { const s = byId.get(id); setRadiusPoint(s.lat, s.lon, `bei ${s.id}`); return; }
  selectSource(id);
}

function onPipeClick(p, latlng) {
  if (ui.mode === 'connect') { connectToPipe(p, latlng); return; }
  if (ui.mode === 'addNode') {
    const id = insertNode(p, latlng, 'Knoten eingefügt');
    if (!id) return;
    endMode();
    selectSource(id);
    toast(`Knoten ${id} eingefügt. Mit „Verbinden“ geht ein Abzweig ab.`, { action: { label: 'Rückgängig', fn: undo } });
    return;
  }
  if (ui.mode !== 'view') return;
  selectPipe(p);
}

/* Leitung an der angetippten Stelle teilen; null, wenn die Stelle zu nah an einem Ende liegt */
function insertNode(p, latlng, undoLabel) {
  const sn = snapToPipe(p, latlng);
  if (!sn) return null;
  if (sn.endDist < 16) { toast(`Zu nah an ${sn.end} – dort ist schon ein Punkt.`); return null; }
  pushUndo(undoLabel);
  return splitPipe(p, sn.seg, sn.lat, sn.lon);
}

function onMapClick(e) {
  if (!$('#search-results').hidden) { hideSearch(); return; }
  if (!$('#layer-pop').hidden) { $('#layer-pop').hidden = true; return; }
  if (ui.mode === 'pickRadius') { setRadiusPoint(e.latlng.lat, e.latlng.lng, null); return; }
  if (ui.mode === 'connect') { toast('Bitte eine Entnahmestelle oder Leitung antippen – oder „Fertig“.'); return; }
  if (ui.mode === 'addNode') { toast('Bitte eine Leitung antippen – oder „Abbrechen“.'); return; }
  if (ui.editMode) {
    /* erst offenes Panel schließen, erst der nächste Tipp legt etwas an */
    if (sheet.name && !(sheet.name === 'edit' && ui.draft)) { closeSheet(); return; }
    startNewSource(e.latlng);
    return;
  }
  if (sheet.name && sheet.name !== 'radius') closeSheet();
}

function onSourceDragged(id, ll) {
  pushUndo(`${id} verschoben`);
  updateSource(id, { lat: +ll.lat.toFixed(7), lon: +ll.lng.toFixed(7) });
  const f = $('#edit-form');
  if (f && f.dataset.id === id) setFormCoords(ll.lat, ll.lng);
  toast(`${id} verschoben.`, { action: { label: 'Rückgängig', fn: undo } });
}

/* ---------- Detailansicht Entnahmestelle ---------- */

function kv(label, value, cls = '') {
  return `<div class="kv ${cls}"><span class="k">${label}</span><span class="v">${value}</span></div>`;
}

function statusBadge(s) {
  return `<span class="badge ${STATUS[s.status].cls}">${STATUS[s.status].label}</span>`;
}

/* Navigation: Android öffnet die Karten-App des Geräts (geo:), iPhone Apple Karten, sonst OpenStreetMap */
function navUrl(s) {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return `geo:${s.lat},${s.lon}?q=${s.lat},${s.lon}(${encodeURIComponent(s.id)})`;
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document)) return `https://maps.apple.com/?daddr=${s.lat},${s.lon}`;
  return `https://www.openstreetmap.org/directions?to=${s.lat}%2C${s.lon}`;
}

function connListHtml(id) {
  const conns = pipesOf(id).map(p => ({ p, other: p.a === id ? p.b : p.a, len: pipeLength(p) }))
    .sort((x, y) => naturalCompare(x.other, y.other));
  return `<div class="section-title">Verbunden mit ${conns.length ? `(${conns.length})` : ''}</div>
    ${conns.length ? `<div class="conn-list">${conns.map(c => {
      const o = byId.get(c.other);
      return `<button class="conn" data-act="select-source" data-id="${esc(c.other)}">
        <span class="conn-ic">${o ? sourceSvg(o, 24) : ''}</span>
        <span class="conn-id">${esc(c.other)}</span>
        <span class="conn-meta"><span class="pipe-sw" style="--c:${pipeStyle(c.p.dn).color}"></span>${c.p.dn ? `DN ${c.p.dn}` : 'DN ?'} · ${fmtDist(c.len)}</span>
        ${IC.chevron}</button>`;
    }).join('')}</div>` : '<p class="muted small">Keine Leitungen erfasst.</p>'}`;
}

function nodeSheetHtml(s) {
  return `
    <div class="sh-head">
      <div class="sh-icon">${sourceSvg(s, 44)}</div>
      <div class="sh-title"><h2>${esc(s.id)}</h2><div class="sub">Leitungsknoten (Abzweig, Kreuzung)</div></div>
      <button class="icon-btn" data-act="close-sheet" aria-label="Schließen">${IC.close}</button>
    </div>
    ${connListHtml(s.id)}
    ${ui.editMode ? `
      <p class="muted small">Knoten auf der Karte ziehen = verschieben.</p>
      <div class="actions wrap">
        <button class="btn" data-act="connect-start" data-id="${esc(s.id)}">${IC.link} Verbinden</button>
        <button class="btn danger" data-act="delete-source" data-id="${esc(s.id)}">${IC.trash} Löschen</button>
      </div>` : ''}`;
}

function sourceSheetHtml(id) {
  const s = byId.get(id);
  if (!s) return null;
  if (isNode(s)) return nodeSheetHtml(s);
  const t = TYPES[s.typ];
  let distInfo = '';
  if (ui.radius) {
    const d = distance(ui.radius.lat, ui.radius.lon, s.lat, s.lon);
    distInfo = `<span class="badge info">${fmtDist(d)} zur Einsatzstelle</span>`;
  }
  const sign = t.hydrant ? `<div class="hsign" title="Hinweisschild"><span>${s.typ === 'OFH' ? 'ÜH' : 'H'}</span><b>${s.dn || '?'}</b></div>` : '';
  return `
    ${ui.radius && sheet.name !== 'radius' ? `<button class="backlink" data-act="radius-open">${IC.back} Zurück zur Einsatzstelle</button>` : ''}
    <div class="sh-head">
      <div class="sh-icon">${sourceSvg(s, 44)}</div>
      <div class="sh-title"><h2>${esc(s.id)}</h2><div class="sub">${esc(t.label)}</div></div>
      ${sign}
      <button class="icon-btn" data-act="close-sheet" aria-label="Schließen">${IC.close}</button>
    </div>
    <div class="badges">${statusBadge(s)}${pruefungFaellig(s) ? '<span class="badge warn-soft">Prüfung fällig</span>' : ''}${distInfo}</div>
    <div class="kv-grid">
      ${t.hydrant ? kv('Leitung', s.dn ? `DN ${s.dn}` : '–') : kv('Volumen', s.volumen ? `${fmtNum(s.volumen, 0)} m³` : '–')}
      ${kv('Druck', s.druck != null ? `${fmtNum(s.druck)} bar` : '–')}
      ${kv('Durchfluss', s.durchfluss != null ? `${fmtNum(s.durchfluss, 0)} l/min` : '–')}
      ${kv('Geprüft', s.geprueft ? fmtDate(s.geprueft) : 'nie', pruefungFaellig(s) ? 'warn' : '')}
    </div>
    ${s.adresse ? `<div class="line">${IC.pin}<span>${esc(s.adresse)}</span></div>` : ''}
    ${s.bemerkung ? `<div class="note">${esc(s.bemerkung)}</div>` : ''}
    ${connListHtml(id)}
    <div class="coords"><span>${fmtCoord(s.lat)}, ${fmtCoord(s.lon)}</span><button class="btn sm ghost" data-act="copy-coords" data-id="${esc(s.id)}">${IC.copy} Kopieren</button></div>
    <div class="actions wrap">
      <a class="btn" href="${navUrl(s)}"${navUrl(s).startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${IC.nav} Navigation</a>
      ${ui.editMode ? `
        <button class="btn" data-act="edit-source" data-id="${esc(s.id)}">${IC.edit} Bearbeiten</button>
        <button class="btn" data-act="connect-start" data-id="${esc(s.id)}">${IC.link} Verbinden</button>
        <button class="btn danger" data-act="delete-source" data-id="${esc(s.id)}">${IC.trash} Löschen</button>` : ''}
    </div>`;
}

/* ---------- Leitung ---------- */

function pipeSheetHtml(key) {
  const p = state.pipes.find(x => pipeKey(x.a, x.b) === key);
  if (!p) return null;
  const len = pipeLength(p);
  const nVia = (p.via || []).length;
  const pts = pipePoints(p);
  const air = pts ? distance(pts[0][0], pts[0][1], pts[pts.length - 1][0], pts[pts.length - 1][1]) : NaN;
  const lenText = nVia ? `${fmtDist(len)} Verlauf · ${fmtDist(air)} Luftlinie` : `${fmtDist(len)} Luftlinie`;
  const ends = [p.a, p.b].map(id => {
    const s = byId.get(id);
    return `<button class="conn" data-act="select-source" data-id="${esc(id)}"><span class="conn-ic">${s ? sourceSvg(s, 24) : ''}</span>
      <span class="conn-id">${esc(id)}</span><span class="conn-meta">${s ? esc(TYPES[s.typ].short) + (s.dn ? ` · DN ${s.dn}` : '') : ''}</span>${IC.chevron}</button>`;
  }).join('');
  const dnOpts = p.dn && !DN_OPTIONS.includes(p.dn) ? [...DN_OPTIONS, p.dn].sort((a, b) => a - b) : DN_OPTIONS;
  return `
    <div class="sh-head">
      <div class="sh-icon"><span class="pipe-big" style="--c:${pipeStyle(p.dn).color}"></span></div>
      <div class="sh-title"><h2>Leitung ${p.dn ? `DN ${p.dn}` : '(DN unbekannt)'}</h2><div class="sub">${esc(p.a)} ↔ ${esc(p.b)} · ${lenText}</div></div>
      <button class="icon-btn" data-act="close-sheet" aria-label="Schließen">${IC.close}</button>
    </div>
    <div class="conn-list">${ends}</div>
    ${p.bemerkung && !ui.editMode ? `<div class="note">${esc(p.bemerkung)}</div>` : ''}
    ${ui.editMode ? `
      <div class="grid2">
        <label class="fld">Nennweite<select data-change="pipe-dn"><option value="">unbekannt</option>${dnOpts.map(d => `<option value="${d}"${d === p.dn ? ' selected' : ''}>DN ${d}</option>`).join('')}</select></label>
      </div>
      <label class="fld">Bemerkung<input data-change="pipe-bem" value="${esc(p.bemerkung)}" placeholder="z. B. Material, Baujahr"></label>
      <div class="section-title">Verlauf</div>
      <div class="route-help">${IC.route}<span>${nVia ? `<b>${nVia} Knickpunkt${nVia > 1 ? 'e' : ''}.</b> ` : '<b>Gerade Linie.</b> '}Auf der Karte: <span class="vtx-demo ghost"></span> ziehen oder antippen = neuer Knickpunkt, <span class="vtx-demo"></span> ziehen = verschieben, antippen = löschen.</span></div>
      <div class="actions wrap">
        <button class="btn" data-act="node-add">${IC.link} Knoten einfügen</button>
        ${nVia ? `<button class="btn" data-act="pipe-straight">${IC.route} Verlauf begradigen</button>` : ''}
        <button class="btn danger" data-act="pipe-delete">${IC.trash} Leitung löschen</button>
      </div>` : ''}`;
}

function currentPipe() { return state.pipes.find(x => pipeKey(x.a, x.b) === ui.selPipe); }

/* ---------- Bearbeiten ---------- */

function setEditMode(on) {
  ui.editMode = on;
  if (!on) {
    if (ui.mode === 'connect' || ui.mode === 'addNode') endMode();
    if (ui.draft) closeSheet();
  }
  renderPills();
  renderSources(true);
  renderHighlight();
  if (sheet.name && sheet.live) renderSheet();
  if (on) toast('Bearbeitungsmodus an.');
}

function startNewSource(ll) {
  if (ui.draft) {
    ui.draft.lat = ll.lat; ui.draft.lon = ll.lng;
    drawDraft();
    setFormCoords(ll.lat, ll.lng);
    return;
  }
  clearSelection();
  ui.draft = { lat: ll.lat, lon: ll.lng };
  drawDraft();
  openSheet('edit', () => editFormHtml(null), { live: false, expand: true });
}

function drawDraft() {
  layers.draft.clearLayers();
  if (!ui.draft) return;
  const m = L.marker([ui.draft.lat, ui.draft.lon], {
    draggable: true, zIndexOffset: 3000, keyboard: false,
    icon: L.divIcon({ className: 'si-wrap', html: `<div class="si sel draft" style="width:32px;height:32px">${sourceSvg({ typ: 'UFH', status: 'ok', dn: null }, 32)}</div>`, iconSize: [32, 32], iconAnchor: [16, 16] }),
  });
  m.on('dragend', () => { const p = m.getLatLng(); ui.draft.lat = p.lat; ui.draft.lon = p.lng; setFormCoords(p.lat, p.lng); });
  m.addTo(layers.draft);
}

function setFormCoords(lat, lon) {
  const f = $('#edit-form');
  if (!f) return;
  f.elements.lat.value = fmtCoord(lat);
  f.elements.lon.value = fmtCoord(lon);
}

const numIn = v => (v == null ? '' : String(v).replace('.', ','));

function editFormHtml(id) {
  const s = id ? byId.get(id) : {
    id: nextId('UFH'), typ: 'UFH', lat: ui.draft.lat, lon: ui.draft.lon, dn: null, druck: null, durchfluss: null,
    volumen: null, status: 'ok', geprueft: '', adresse: '', bemerkung: '',
  };
  if (!s) return null;
  const t = TYPES[s.typ];
  const dnOpts = s.dn && !DN_OPTIONS.includes(s.dn) ? [...DN_OPTIONS, s.dn].sort((a, b) => a - b) : DN_OPTIONS;
  return `<form id="edit-form" class="form ${t.hydrant ? 'is-hyd' : 'is-other'}" data-id="${esc(id || '')}" autocomplete="off" novalidate>
    <div class="sh-head">
      <div class="sh-title"><h2>${id ? 'Bearbeiten' : 'Neue Entnahmestelle'}</h2><div class="sub">${id ? esc(id) : 'Position: Symbol verschieben oder Karte antippen'}</div></div>
      <button type="button" class="icon-btn" data-act="cancel-edit" aria-label="Abbrechen">${IC.close}</button>
    </div>
    <div class="grid2">
      <label class="fld">ID / Nummer<input name="sid" value="${esc(s.id)}" autocapitalize="characters" spellcheck="false"></label>
      <label class="fld">Typ<select name="typ" data-change="form-typ">${Object.entries(TYPES).filter(([, v]) => !v.node).map(([k, v]) => `<option value="${k}"${k === s.typ ? ' selected' : ''}>${esc(v.label)}</option>`).join('')}</select></label>
      <label class="fld only-hyd">Leitung DN<select name="dn"><option value="">unbekannt</option>${dnOpts.map(d => `<option value="${d}"${d === s.dn ? ' selected' : ''}>DN ${d}</option>`).join('')}</select></label>
      <label class="fld only-other">Volumen (m³)<input name="volumen" inputmode="decimal" value="${numIn(s.volumen)}"></label>
      <label class="fld">Status<select name="status">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}"${k === s.status ? ' selected' : ''}>${esc(v.label)}</option>`).join('')}</select></label>
      <label class="fld">Druck (bar)<input name="druck" inputmode="decimal" value="${numIn(s.druck)}"></label>
      <label class="fld">Durchfluss (l/min)<input name="durchfluss" inputmode="numeric" value="${numIn(s.durchfluss)}"></label>
    </div>
    <label class="fld">Geprüft am<span class="inline"><input type="date" name="geprueft" value="${esc(s.geprueft)}"><button type="button" class="btn sm" data-act="form-today">Heute</button></span></label>
    <label class="fld">Adresse / Lage<input name="adresse" value="${esc(s.adresse)}" placeholder="z. B. Hauptstraße 12, Gehweg"></label>
    <label class="fld">Bemerkung<textarea name="bemerkung" rows="2" placeholder="z. B. oft zugeparkt">${esc(s.bemerkung)}</textarea></label>
    <div class="grid2">
      <label class="fld">Breitengrad<input name="lat" inputmode="decimal" value="${fmtCoord(s.lat)}"></label>
      <label class="fld">Längengrad<input name="lon" inputmode="decimal" value="${fmtCoord(s.lon)}"></label>
    </div>
    <button type="button" class="btn ghost full" data-act="form-gps">${IC.locate} Meinen Standort übernehmen</button>
    <div class="actions sticky">
      <button type="button" class="btn" data-act="cancel-edit">Abbrechen</button>
      <button type="submit" class="btn primary">Speichern</button>
    </div>
  </form>`;
}

function saveEditForm(form) {
  const id0 = form.dataset.id || null;
  const v = name => form.elements[name]?.value ?? '';
  const id = v('sid').trim();
  if (!id) { toast('Bitte eine ID angeben.'); return; }
  if (id !== id0 && byId.has(id)) { toast(`Die ID „${id}“ ist bereits vergeben.`); return; }
  const lat = parseCoord(v('lat')), lon = parseCoord(v('lon'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) { toast('Ungültige Koordinaten.'); return; }
  const typ = v('typ');
  const hyd = TYPES[typ].hydrant;
  const rec = {
    id, typ, lat, lon,
    dn: hyd ? parseNumber(v('dn')) : null,
    volumen: hyd ? null : parseNumber(v('volumen'), true),
    druck: parseNumber(v('druck')),
    durchfluss: parseNumber(v('durchfluss'), true),
    status: v('status'),
    geprueft: v('geprueft'),
    adresse: v('adresse').trim(),
    bemerkung: v('bemerkung').trim(),
  };
  if (id0) {
    pushUndo(`${id0} bearbeitet`);
    updateSource(id0, rec);
  } else {
    pushUndo(`${id} angelegt`);
    ui.draft = null;
    layers.draft.clearLayers();
    addSource(cleanSource(rec));
  }
  selectSource(id);
  toast('Gespeichert.');
}

/* ---------- Verbinden ---------- */

function startConnect(id) {
  closeSheet();
  ui.mode = 'connect';
  ui.connectFrom = id;
  refreshMarkers(id);
  renderPills();
}

function connectTo(id) {
  const from = ui.connectFrom;
  if (!from || id === from) return;
  if (findPipe(from, id)) {
    toast(`${from} und ${id} sind bereits verbunden.`);
  } else {
    pushUndo('Leitung angelegt');
    const p = addPipe(from, id);
    toast(`Leitung ${from} ↔ ${id}${p && p.dn ? ` (DN ${p.dn})` : ''} angelegt.`, { action: { label: 'Rückgängig', fn: undo } });
  }
  ui.connectFrom = id;
  refreshMarkers(from, id);
  renderPills();
}

/* Beim Verbinden eine Leitung angetippt: dort einen Knoten einfügen und als Abzweig anschließen */
function connectToPipe(p, latlng) {
  const from = ui.connectFrom;
  if (!from) return;
  if (p.a === from || p.b === from) { toast(`Diese Leitung ist schon an ${from} angeschlossen.`); return; }
  const id = insertNode(p, latlng, 'Abzweig angelegt');
  if (!id) return;
  const np = addPipe(from, id);
  endMode();
  toast(`Abzweig ${from} ↔ ${id}${np && np.dn ? ` (DN ${np.dn})` : ''} angelegt.`, { action: { label: 'Rückgängig', fn: undo } });
}

function endMode() {
  const prev = ui.connectFrom;
  ui.mode = 'view';
  ui.connectFrom = null;
  if (prev) refreshMarkers(prev);
  renderPills();
  renderHighlight();
}

/* ---------- Umkreissuche ---------- */

const RADIUS_STEPS = [100, 200, 300, 500, 1000];

function enterPickMode() {
  if (ui.mode === 'connect' || ui.mode === 'addNode') endMode();
  ui.mode = 'pickRadius';
  if (sheet.name === 'radius') closeSheet();
  renderPills();
}

function setRadiusPoint(lat, lon, label) {
  ui.radius = { lat, lon, label: label || null };
  if (ui.mode === 'pickRadius') ui.mode = 'view';
  renderPills();
  clearSelection();
  drawRadius();
  openSheet('radius', radiusSheetHtml);
  fitBoundsVisible(L.latLng(lat, lon).toBounds(settings.radius * 2.2), 18);
}

function clearRadius() {
  ui.radius = null;
  layers.radius.clearLayers();
}

function radiusResults() {
  if (!ui.radius) return { inside: [], outside: [] };
  const all = waterSources().map(s => ({
    s, d: distance(ui.radius.lat, ui.radius.lon, s.lat, s.lon), b: bearing(ui.radius.lat, ui.radius.lon, s.lat, s.lon),
  })).sort((x, y) => x.d - y.d);
  const inside = all.filter(x => x.d <= settings.radius);
  const outside = inside.filter(x => x.s.status !== 'defekt').length < 3 ? all.filter(x => x.d > settings.radius).slice(0, 3) : [];
  return { inside, outside };
}

function drawRadius() {
  layers.radius.clearLayers();
  if (!ui.radius) return;
  const c = [ui.radius.lat, ui.radius.lon];
  L.circle(c, { radius: settings.radius, pane: 'radiusPane', color: '#d0102e', weight: 2, dashArray: '8 6', fillColor: '#d0102e', fillOpacity: 0.07, interactive: false }).addTo(layers.radius);
  radiusResults().inside.filter(x => x.s.status !== 'defekt').slice(0, 5).forEach(x => {
    L.polyline([c, [x.s.lat, x.s.lon]], { pane: 'radiusPane', color: '#d0102e', weight: 2, opacity: 0.8, dashArray: '2 6', interactive: false }).addTo(layers.radius);
  });
  const m = L.marker(c, {
    icon: L.divIcon({ className: 'einsatz-wrap', html: EINSATZ_SVG, iconSize: [44, 44], iconAnchor: [22, 22] }),
    draggable: true, zIndexOffset: 2500, keyboard: false,
  });
  m.on('dragend', () => {
    const p = m.getLatLng();
    setRadiusPointSilently(p.lat, p.lng);
  });
  m.on('click', () => openSheet('radius', radiusSheetHtml));
  m.addTo(layers.radius);
}

function setRadiusPointSilently(lat, lon) {
  ui.radius = { lat, lon, label: null };
  drawRadius();
  if (sheet.name === 'radius') renderSheet();
}

function resultItem(x) {
  const s = x.s, t = TYPES[s.typ];
  const spec = t.hydrant ? (s.dn ? ` · DN ${s.dn}` : '') : (s.volumen ? ` · ${fmtNum(s.volumen, 0)} m³` : '');
  const sub = [
    s.status !== 'ok' ? statusBadge(s) : '',
    s.durchfluss != null ? `${fmtNum(s.durchfluss, 0)} l/min` : '',
    s.adresse ? esc(s.adresse) : '',
  ].filter(Boolean).join(' · ');
  return `<button class="res ${s.status === 'defekt' ? 'dead' : ''}" data-act="select-source" data-id="${esc(s.id)}">
    <span class="res-ic">${sourceSvg(s, 30)}</span>
    <span class="res-main"><span class="res-title">${esc(s.id)} <span class="muted">${esc(t.short)}${spec}</span></span>${sub ? `<span class="res-sub">${sub}</span>` : ''}</span>
    <span class="res-dist"><b>${fmtDist(x.d)}</b><span>${compass(x.b)} · ${Math.ceil(x.d / B_SCHLAUCH_M)}× B</span></span>
  </button>`;
}

function radiusSheetHtml() {
  if (!ui.radius) return null;
  const { inside, outside } = radiusResults();
  const usable = inside.filter(x => x.s.status !== 'defekt').length;
  const r = settings.radius;
  return `
    <div class="sh-head">
      <div class="sh-icon">${EINSATZ_SVG}</div>
      <div class="sh-title"><h2>Einsatzstelle</h2><div class="sub">${esc(ui.radius.label || `${fmtCoord(ui.radius.lat)}, ${fmtCoord(ui.radius.lon)}`)}</div></div>
      <button class="icon-btn" data-act="close-sheet" aria-label="Umkreissuche beenden">${IC.close}</button>
    </div>
    <div class="chips fill" role="group" aria-label="Radius">${RADIUS_STEPS.map(x => `<button class="chip${x === r ? ' on' : ''}" data-act="radius-set" data-r="${x}">${x < 1000 ? `${x} m` : '1 km'}</button>`).join('')}</div>
    <p class="summary">${inside.length
    ? `<b>${usable}</b> einsatzbereite von ${inside.length} Entnahmestellen im Umkreis von ${fmtDist(r)}`
    : `Keine Entnahmestelle im Umkreis von ${fmtDist(r)}.`}</p>
    <div class="res-list">${inside.map(resultItem).join('')}</div>
    ${outside.length ? `<div class="section-title">Nächste außerhalb des Umkreises</div><div class="res-list">${outside.map(resultItem).join('')}</div>` : ''}
    <p class="hint">Entfernung = Luftlinie. „7× B“ = mindestens 7 B-Schläuche à 20 m; die tatsächliche Strecke ist länger.</p>
    <div class="actions wrap">
      <button class="btn" data-act="radius-pick">${IC.target} Neu setzen</button>
      <button class="btn" data-act="radius-gps">${IC.locate} Mein Standort</button>
    </div>`;
}

/* ---------- GPS ---------- */

const gps = { watch: null, pos: null, waiters: [] };

function startGps() {
  if (!('geolocation' in navigator)) { toast('Standortbestimmung wird von diesem Browser nicht unterstützt.'); return false; }
  if (gps.watch != null) return true;
  gps.watch = navigator.geolocation.watchPosition(onGps, onGpsError, { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 });
  return true;
}

function onGps(p) {
  gps.pos = { lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy, t: Date.now() };
  drawGps();
  gps.waiters.splice(0).forEach(fn => fn(gps.pos));
}

function onGpsError(e) {
  const msg = { 1: 'Standortzugriff verweigert. Bitte in den Browser-Einstellungen erlauben.', 2: 'Standort nicht verfügbar.', 3: 'Standortbestimmung dauert zu lange.' }[e.code] || 'Standort konnte nicht ermittelt werden.';
  if (gps.waiters.length) toast(msg, { ms: 5000 });
  gps.waiters = [];
  if (e.code === 1 && gps.watch != null) { navigator.geolocation.clearWatch(gps.watch); gps.watch = null; }
}

function withPosition(fn) {
  if (gps.pos && Date.now() - gps.pos.t < 15000) { fn(gps.pos); return; }
  gps.waiters.push(fn);
  if (startGps()) toast('Standort wird ermittelt …', { ms: 2500 });
}

function drawGps() {
  layers.gps.clearLayers();
  if (!gps.pos) return;
  const c = [gps.pos.lat, gps.pos.lon];
  if (gps.pos.acc < 2000) L.circle(c, { radius: gps.pos.acc, pane: 'radiusPane', color: '#1a73e8', weight: 1, fillColor: '#1a73e8', fillOpacity: 0.1, interactive: false }).addTo(layers.gps);
  L.marker(c, { icon: L.divIcon({ className: 'gps-wrap', html: '<div class="gps-dot"></div>', iconSize: [20, 20], iconAnchor: [10, 10] }), interactive: false, keyboard: false, zIndexOffset: 2000 }).addTo(layers.gps);
}

/* ---------- Suche ---------- */

let geoAbort = null;

async function geocode(q) {
  if (geoAbort) geoAbort.abort();
  geoAbort = new AbortController();
  /* Kartenmitte nur grob (ca. 10 km) mitschicken, damit Treffer in der Nähe zuerst kommen */
  const c = map.getCenter();
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lang=de&limit=6&lat=${c.lat.toFixed(1)}&lon=${c.lng.toFixed(1)}`;
  const r = await fetch(url, { signal: geoAbort.signal });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const j = await r.json();
  return (j.features || []).map(photonLabel);
}

function photonLabel(f) {
  const p = f.properties || {};
  const [lon, lat] = f.geometry.coordinates;
  const street = p.street ? `${p.street}${p.housenumber ? ' ' + p.housenumber : ''}` : '';
  const title = [p.name, street].filter((x, i, a) => x && a.indexOf(x) === i).join(', ') || p.city || '';
  const sub = [p.postcode, p.city || p.town || p.village, p.district].filter(Boolean).join(' ');
  return { lat, lon, title, sub };
}

function localMatches(q) {
  const n = q.toLowerCase();
  const nk = normKey(q);
  const scored = [];
  for (const s of waterSources()) {
    const id = s.id.toLowerCase();
    let score = 0;
    if (id === n || normKey(s.id) === nk) score = 100;
    else if (id.startsWith(n) || normKey(s.id).startsWith(nk)) score = 60;
    else if (id.includes(n)) score = 40;
    else if (s.adresse.toLowerCase().includes(n)) score = 30;
    else if (s.bemerkung.toLowerCase().includes(n)) score = 10;
    if (score) scored.push([score, s]);
  }
  return scored.sort((a, b) => b[0] - a[0] || naturalCompare(a[1].id, b[1].id)).slice(0, 8).map(x => x[1]);
}

function coordMatch(q) {
  const m = q.match(/^\s*(-?\d{1,2}[.,]\d+)\s*[,;\s]\s*(-?\d{1,3}[.,]\d+)\s*$/);
  if (!m) return null;
  const lat = parseCoord(m[1]), lon = parseCoord(m[2]);
  return Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { lat, lon } : null;
}

const searchState = { q: '', geo: null, geoMsg: '', canGeo: false, loading: false };

/* Adresssuche nur auf ausdrücklichen Wunsch: erst dann wird der Suchtext übertragen */
function addressSearchAllowed(q) {
  return q.length >= 3 && !coordMatch(q) && !parseTafel(q) && !/^(UN\s*)?\d{1,4}$/i.test(q);
}

function renderSearchResults() {
  const box = $('#search-results');
  const q = searchState.q;
  if (!q) { box.hidden = true; return; }
  const parts = [];
  const cm = coordMatch(q);
  if (cm) parts.push(`<button class="sr" data-act="sr-point" data-lat="${cm.lat}" data-lon="${cm.lon}" data-label="">${IC.pin}<span><b>Koordinate anzeigen</b><small>${fmtCoord(cm.lat)}, ${fmtCoord(cm.lon)}</small></span></button>`);
  const local = localMatches(q);
  if (local.length) {
    parts.push('<div class="sr-head">Entnahmestellen</div>');
    parts.push(...local.map(s => `<button class="sr" data-act="sr-source" data-id="${esc(s.id)}"><span class="sr-ic">${sourceSvg(s, 24)}</span><span><span><b>${esc(s.id)}</b> <span class="muted">${esc(TYPES[s.typ].short)}${s.dn ? ` · DN ${s.dn}` : ''}</span></span><small>${esc(s.adresse || s.bemerkung || '')}</small></span></button>`));
  }
  const tafel = parseTafel(q);
  const unQuery = /^(UN\s*)?\d{4}$/i.test(q);
  const hazHits = (tafel ? hazmatMatches(tafel.un) : unQuery ? hazmatMatches(q) : q.length >= 3 && !/^\d+$/.test(q) ? hazmatMatches(q) : []).slice(0, 4);
  if (tafel || unQuery || hazHits.length) {
    parts.push('<div class="sr-head">Gefahrstoffe</div>');
    if (tafel) parts.push(`<button class="sr" data-act="sr-gefahr" data-gnr="${esc(tafel.gnr)}" data-un="${esc(tafel.un)}"><span class="sr-ic">${miniTafel(tafel.gnr, tafel.un)}</span><span><b>Warntafel ${esc(tafel.gnr)} / ${esc(tafel.un)} auswerten</b><small>${esc(decodeGefahrnummer(tafel.gnr)?.special || 'Gefahrnummer und Stoff nachschlagen')}</small></span></button>`);
    else if (unQuery && !hazHits.length) {
      const un = q.replace(/\D/g, '');
      parts.push(`<button class="sr" data-act="sr-gefahr" data-un="${un}">${IC.hazard}<span><b>UN ${un} nachschlagen</b><small>Gefahrstoff-Seite öffnen</small></span></button>`);
    }
    parts.push(...hazHits.map(h => `<button class="sr" data-act="sr-gefahr" data-un="${esc(h.un)}" data-gnr="${esc(h.gefahrnr)}"><span class="sr-ic">${miniTafel(h.gefahrnr, h.un)}</span><span><b>${esc(h.name)}</b><small>UN ${esc(h.un)}${h.klasse ? ` · Klasse ${esc(h.klasse)}` : ''}</small></span></button>`));
  }
  const vehHits = q.length >= 2 ? vehicleMatches(q).slice().sort(compareByPlace).slice(0, 6) : [];
  if (vehHits.length) {
    parts.push('<div class="sr-head">Funkrufnamen</div>');
    parts.push(...vehHits.map(v => `<button class="sr" data-act="sr-funk" data-q="${esc(v.funkname)}">${IC.radio}<span><b>${esc(v.funkname)}</b><small>${esc([v.art, v.ort, v.verbund].filter(Boolean).join(' · '))}</small></span></button>`));
  }
  if (searchState.geo && searchState.geo.length) {
    parts.push('<div class="sr-head">Adressen</div>');
    parts.push(...searchState.geo.map(g => `<button class="sr" data-act="sr-point" data-lat="${g.lat}" data-lon="${g.lon}" data-label="${esc([g.title, g.sub].filter(Boolean).join(', '))}">${IC.pin}<span><b>${esc(g.title)}</b><small>${esc(g.sub)}</small></span></button>`));
  }
  if (searchState.geoMsg) parts.push(`<div class="sr-msg">${esc(searchState.geoMsg)}</div>`);
  else if (searchState.canGeo && !searchState.geo) {
    if (!settings.onlineSearch) parts.push('<div class="sr-msg">Online-Adresssuche ist unter Mehr → Einstellungen ausgeschaltet.</div>');
    else if (!navigator.onLine) parts.push('<div class="sr-msg">Offline – Adresssuche nicht verfügbar.</div>');
    else parts.push(`<button class="sr sr-online" data-act="sr-geocode">${IC.search}<span><b>Adresse „${esc(q)}“ suchen</b><small>Online über photon.komoot.io – überträgt nur den Suchtext</small></span></button>`);
  }
  if (!parts.length) parts.push('<div class="sr-msg">Keine Treffer.</div>');
  box.innerHTML = parts.join('');
  box.hidden = false;
}

async function runAddressSearch() {
  const q = searchState.q;
  if (!searchState.canGeo || !settings.onlineSearch || !navigator.onLine) return;
  searchState.geoMsg = 'Adressen werden gesucht …';
  renderSearchResults();
  try {
    const res = await geocode(q);
    if (q !== searchState.q) return;
    searchState.geo = res;
    searchState.geoMsg = res.length ? '' : 'Keine Adresse gefunden.';
  } catch (e) {
    if (e.name === 'AbortError') return;
    searchState.geo = null;
    searchState.geoMsg = 'Adresssuche zurzeit nicht erreichbar.';
  }
  renderSearchResults();
}

function onSearchInput(q) {
  if (geoAbort) geoAbort.abort();
  searchState.q = q.trim();
  searchState.geo = null;
  searchState.geoMsg = '';
  searchState.canGeo = addressSearchAllowed(searchState.q);
  renderSearchResults();
}

function hideSearch() {
  $('#search-results').hidden = true;
  $('#search').blur();
}

function clearSearch() {
  $('#search').value = '';
  searchState.q = '';
  hideSearch();
}

/* ---------- Mehr (Menü), Liste, Legende, Start ---------- */

const menuItem = (act, ic, label, extra = '') => `<button class="menu-item" data-act="${act}">${ic}<span>${label}</span>${extra}</button>`;

/* Unterseiten des Menüs „Mehr“ (☰); „Karte“ in der unteren Leiste schließt sie */
const MEHR_SHEETS = ['menu', 'daten', 'settings', 'list', 'legend', 'about'];

function subHead(title) {
  return `
    <div class="sh-head">
      <div class="sh-title"><h2>${title}</h2></div>
      <button class="icon-btn" data-act="open-menu" aria-label="Zurück">${IC.back}</button>
      <button class="icon-btn" data-act="close-sheet" aria-label="Schließen">${IC.close}</button>
    </div>`;
}

function menuHtml() {
  const ws = waterSources();
  const n = ws.length;
  const defekt = ws.filter(s => s.status === 'defekt').length;
  const faellig = ws.filter(pruefungFaellig).length;
  const status = n
    ? [`${state.pipes.length} Leitungen`, defekt ? `<span class="danger-text">${defekt} defekt</span>` : '', faellig ? `<span class="warn-text">${faellig} Prüfung fällig</span>` : ''].filter(Boolean).join(' · ')
    : 'Unter „Daten und Bearbeiten“ importieren';
  return `
    <div class="sh-head">
      <div class="sh-icon">${LOGO}</div>
      <div class="sh-title"><h2>Mehr</h2><div class="sub">FireAssist · v${APP_VERSION}</div></div>
      <button class="icon-btn" data-act="close-sheet" aria-label="Schließen">${IC.close}</button>
    </div>
    <div class="status-card${n ? '' : ' empty'}">
      <b>${n ? `${n} Entnahmestellen` : 'Noch keine Daten'}</b>
      <span>${status}</span>
      ${n ? `<span class="muted">Stand: ${fmtDateTime(state.meta.updated)}</span>` : ''}
    </div>
    <div class="menu-label">Schnellzugriff</div>
    <div class="menu-group">
      ${menuItem('open-list', IC.list, 'Alle Entnahmestellen', IC.chevron)}
      ${menuItem('open-legend', IC.legend, 'Legende', IC.chevron)}
      ${n ? menuItem('fit-data', IC.target, 'Alle Daten auf der Karte zeigen') : ''}
      ${PWA.enabled ? menuItem('offline-open', IC.download, 'Offline-Karte <small>Karte für Einsatz ohne Netz speichern</small>', IC.chevron) : ''}
    </div>
    <div class="menu-label">Daten und Einstellungen</div>
    <div class="menu-group quiet">
      ${menuItem('open-daten', IC.table, 'Daten und Bearbeiten <small>Importieren, Exportieren, Karte bearbeiten</small>', IC.chevron)}
      ${menuItem('open-settings', IC.sliders, 'Einstellungen <small>Farbschema, Online-Suche, Datenschutz</small>', IC.chevron)}
    </div>
    <div class="menu-group quiet">
      ${menuItem('open-about', IC.info, 'Über FireAssist <small>Version, Lizenz, Haftung</small>', IC.chevron)}
      <a class="menu-item" href="${APP_REPO}" target="_blank" rel="noopener">${IC.code}<span>FireAssist auf GitHub <small>Quellcode, Fehler melden, Ideen</small></span>${IC.external}</a>
    </div>`;
}

function datenHtml() {
  return `
    ${subHead('Daten und Bearbeiten')}
    <div class="menu-group">
      ${menuItem('toggle-edit', IC.edit, ui.editMode ? 'Bearbeitungsmodus beenden' : 'Karte bearbeiten <small>Entnahmestellen anlegen, verschieben, verbinden</small>', `<span class="switch${ui.editMode ? ' on' : ''}" aria-hidden="true"></span>`)}
      ${undoStack.length ? menuItem('undo', IC.undo, `Rückgängig <small>${esc(undoStack[undoStack.length - 1].label)}</small>`) : ''}
    </div>
    <div class="menu-label">Importieren</div>
    <div class="menu-group">
      ${menuItem('import', IC.upload, 'Datei importieren <small>CSV, Excel, JSON, GeoJSON</small>')}
      ${menuItem('export-template', IC.download, 'Excel-Vorlage herunterladen')}
      ${menuItem('load-demo', IC.sparkle, 'Beispieldaten laden')}
    </div>
    <div class="menu-label">Exportieren und verteilen</div>
    <div class="menu-group">
      ${menuItem('export-json', IC.json, 'Sicherung speichern <small>JSON, enthält alles</small>')}
      ${menuItem('export-html', IC.app, 'App-Datei mit Daten erstellen <small>zum Verteilen an Einsatzkräfte</small>')}
      ${menuItem('export-xlsx', IC.table, 'Exportieren als Excel <small>alle Daten in einer Datei</small>')}
      ${menuItem('export-csv-src', IC.file, 'Exportieren als CSV <small>Entnahmestellen</small>')}
      ${menuItem('export-csv-pipes', IC.file, 'Exportieren als CSV <small>Leitungen</small>')}
    </div>
    <p class="muted small">Daten werden <b>nur lokal in diesem Browser</b> gespeichert. Regelmäßig eine Sicherung exportieren.</p>
    ${hasAnyData() ? `<div class="menu-group">${menuItem('delete-all', IC.trash, '<span class="danger-text">Alle Daten löschen</span>')}</div>` : ''}`;
}

function settingsHtml() {
  return `
    ${subHead('Einstellungen')}
    <div class="menu-label">Darstellung</div>
    <div class="seg" role="group" aria-label="Farbschema">
      ${[['auto', 'Automatisch'], ['light', 'Hell'], ['dark', 'Dunkel']].map(([k, l]) => `<button class="${settings.theme === k ? 'on' : ''}" data-act="theme" data-theme="${k}">${l}</button>`).join('')}
    </div>
    <div class="menu-label">Externe Dienste</div>
    <div class="info-text small">
      <p>Hydranten, Leitungen, Funkrufnamen und Stoffliste bleiben <b>nur auf diesem Gerät</b>. Es werden keine Schriften, Skripte oder Statistikdienste von außen geladen.</p>
      <ul class="ext-list">
        <li><b>Hintergrundkarte:</b> ${settings.basemap === 'none' ? 'ausgeschaltet' : esc(BASEMAPS[settings.basemap].label)} – lädt Kartenbilder, der Dienst sieht IP-Adresse und Kartenausschnitt. Umschalten über das Ebenen-Symbol, auch auf „Keine“.</li>
        <li><b>Adresssuche:</b> photon.komoot.io – nur wenn „Adresse suchen“ angetippt wird, übertragen wird nur der Suchtext.</li>
        <li><b>Navigation und Links</b> (GESTIS, ERICards …) – nur beim Antippen.</li>
      </ul>
    </div>
    <label class="check menu-check"><input type="checkbox" data-change="set-onlineSearch"${settings.onlineSearch ? ' checked' : ''}> Online-Adresssuche erlauben</label>
    <div class="menu-label">Hinweise</div>
    <div class="info-text small">
      <p>Entfernungen sind Luftlinie. Angaben ohne Gewähr – vor Ort prüfen.</p>
    </div>`;
}

/* ---------- Untere Leiste ---------- */

function activeTab() {
  return currentPage() || 'karte';
}

function renderTabbar() {
  const cur = activeTab();
  $$('#tabbar [data-tab]').forEach(b => {
    const on = b.dataset.tab === cur;
    b.classList.toggle('on', on);
    if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
}

function openTab(tab) {
  if (tab === 'funk' || tab === 'gefahr') { if (sheet.name) closeSheet(); openPage(tab); return; }
  closePage();
  if (MEHR_SHEETS.includes(sheet.name)) closeSheet();
}

const APP_COPYRIGHT = '© 2026 LinusL2005';
const APP_REPO = 'https://github.com/LinusL2005/FireAssist';
let licenseTexts;

/* Lizenztext aufklappbar; in der ungebauten src/index.html stehen die Texte nicht drin, dann Link */
function licenseHtml(key, label, url) {
  if (licenseTexts === undefined) {
    try { licenseTexts = JSON.parse($('#fa-licenses')?.textContent || 'null'); } catch (e) { licenseTexts = null; }
  }
  const text = licenseTexts?.[key];
  return text
    ? `<details class="lic"><summary>${label}</summary><pre>${esc(text)}</pre></details>`
    : `<p class="small"><a href="${url}" target="_blank" rel="noopener">${label}</a></p>`;
}

function aboutHtml() {
  return `
    <div class="sh-head">
      <div class="sh-icon">${LOGO}</div>
      <div class="sh-title"><h2>Über FireAssist</h2><div class="sub">Version ${APP_VERSION}</div></div>
      <button class="icon-btn" data-act="open-menu" aria-label="Zurück">${IC.back}</button>
      <button class="icon-btn" data-act="close-sheet" aria-label="Schließen">${IC.close}</button>
    </div>
    <p class="muted small">Digitaler Hydrantenplan, Funkrufnamen und Gefahrstoffe für die Feuerwehr.</p>
    <p class="small">Quellcode, Fehlermeldungen und Ideen: <a href="${APP_REPO}" target="_blank" rel="noopener">github.com/LinusL2005/FireAssist</a></p>
    <div class="section-title">Lizenz</div>
    <div class="info-text small">
      <p>${APP_COPYRIGHT}<br>Lizenziert unter der EUPL v. 1.2 (Open-Source-Lizenz für die Europäische Union).</p>
      <p>FireAssist ist freie Software: Du darfst die App nutzen, weitergeben und verändern.
        Wer eine veränderte Fassung weitergibt, muss deren Quellcode ebenfalls unter der EUPL bereitstellen.</p>
    </div>
    ${licenseHtml('eupl', 'Lizenztext (deutsch)', 'https://interoperable-europe.ec.europa.eu/collection/eupl/eupl-text-eupl-12')}
    <div class="section-title">Ohne Gewähr</div>
    <div class="info-text small">
      <p>Die App wird ohne Gewährleistung bereitgestellt, die Haftung ist nach Artikel 7 und 8 der EUPL beschränkt.
        Lage, Zustand und Leistung der Entnahmestellen vor Ort prüfen, Angaben zu Gefahrstoffen mit aktuellen Quellen abgleichen.</p>
    </div>
    <div class="section-title">Enthaltene Software</div>
    <div class="info-text small"><p><b>Leaflet</b> 1.9.4 · © 2010–2023 Volodymyr Agafonkin, © 2010–2011 CloudMade · BSD 2-Clause</p></div>
    ${licenseHtml('leaflet', 'Lizenztext Leaflet', 'https://github.com/Leaflet/Leaflet/blob/v1.9.4/LICENSE')}
    <div class="info-text small"><p><b>SheetJS</b> 0.20.3 · © 2012–heute SheetJS LLC · Apache License 2.0</p></div>
    ${licenseHtml('sheetjs', 'Lizenztext SheetJS', 'https://www.apache.org/licenses/LICENSE-2.0')}
    <div class="section-title">Daten</div>
    <div class="info-text small">
      <p>Hydranten, Leitungen, Funkrufnamen und Stofflisten gehören nicht zur App und fallen nicht unter diese Lizenz.
        Die Rechte an der Hintergrundkarte stehen unten rechts auf der Karte.</p>
    </div>`;
}

const listState = { q: '', f: 'all' };
const LIST_FILTERS = [
  ['all', 'Alle'], ['hyd', 'Hydranten'], ['other', 'Andere'], ['problem', 'Defekt / eingeschränkt'], ['due', 'Prüfung fällig'],
];

function listItems() {
  const q = listState.q.toLowerCase();
  return waterSources().filter(s => {
    if (listState.f === 'hyd' && !isHydrant(s)) return false;
    if (listState.f === 'other' && isHydrant(s)) return false;
    if (listState.f === 'problem' && !['defekt', 'eingeschraenkt'].includes(s.status)) return false;
    if (listState.f === 'due' && !pruefungFaellig(s)) return false;
    if (q && !(`${s.id} ${s.adresse} ${s.bemerkung}`.toLowerCase().includes(q))) return false;
    return true;
  }).sort((a, b) => naturalCompare(a.id, b.id));
}

function listItemsHtml() {
  const items = listItems();
  const shown = items.slice(0, 400);
  if (!items.length) return '<p class="muted small pad">Keine Einträge.</p>';
  return `<p class="muted small">${items.length} Einträge</p>` + shown.map(s => `<button class="res" data-act="select-source" data-id="${esc(s.id)}">
      <span class="res-ic">${sourceSvg(s, 28)}</span>
      <span class="res-main"><span class="res-title">${esc(s.id)} <span class="muted">${esc(TYPES[s.typ].short)}${s.dn ? ` · DN ${s.dn}` : ''}${s.volumen ? ` · ${fmtNum(s.volumen, 0)} m³` : ''}</span></span>
      <span class="res-sub">${s.status !== 'ok' ? statusBadge(s) + ' ' : ''}${pruefungFaellig(s) ? '<span class="badge warn-soft">Prüfung fällig</span> ' : ''}${esc(s.adresse)}</span></span>
      ${IC.chevron}</button>`).join('') + (items.length > shown.length ? `<p class="muted small">… ${items.length - shown.length} weitere – bitte Suche eingrenzen.</p>` : '');
}

function listHtml() {
  return `
    <div class="sh-head">
      <div class="sh-title"><h2>Entnahmestellen</h2></div>
      <button class="icon-btn" data-act="open-menu" aria-label="Zurück">${IC.back}</button>
      <button class="icon-btn" data-act="close-sheet" aria-label="Schließen">${IC.close}</button>
    </div>
    <input class="list-search" type="search" data-input="list-q" placeholder="Nummer, Adresse, Bemerkung …" value="${esc(listState.q)}">
    <div class="chips scroll">${LIST_FILTERS.map(([k, l]) => `<button class="chip${listState.f === k ? ' on' : ''}" data-act="list-filter" data-f="${k}">${l}</button>`).join('')}</div>
    <div id="list-items" class="res-list">${listItemsHtml()}</div>`;
}

function legendHtml() {
  const types = Object.entries(TYPES).filter(([, t]) => !t.node).map(([k, t]) => `<div class="lg-row">${sourceSvg({ typ: k, status: 'ok', dn: t.hydrant ? 100 : null }, 28)}<span>${esc(t.label)}</span></div>`).join('');
  const sts = `
    <div class="lg-row">${sourceSvg({ typ: 'UFH', status: 'eingeschraenkt', dn: 100 }, 28)}<span>eingeschränkt</span></div>
    <div class="lg-row">${sourceSvg({ typ: 'UFH', status: 'defekt', dn: 100 }, 28)}<span>defekt / außer Betrieb</span></div>`;
  const pipes = PIPE_CLASSES.map(c => {
    const st = pipeStyle(c.dn);
    return `<div class="lg-row"><svg width="44" height="14" aria-hidden="true"><line x1="3" y1="7" x2="41" y2="7" stroke="#fff" stroke-width="${st.weight + 3}" stroke-linecap="round"/><line x1="3" y1="7" x2="41" y2="7" stroke="${st.color}" stroke-width="${st.weight}" stroke-linecap="round" ${st.dashArray ? `stroke-dasharray="${st.dashArray}"` : ''}/></svg><span>${c.label}</span></div>`;
  }).join('');
  return `
    <div class="sh-head">
      <div class="sh-title"><h2>Legende</h2></div>
      <button class="icon-btn" data-act="open-menu" aria-label="Zurück">${IC.back}</button>
      <button class="icon-btn" data-act="close-sheet" aria-label="Schließen">${IC.close}</button>
    </div>
    <div class="section-title">Entnahmestellen</div>
    <p class="muted small">Die Zahl im Hydrantensymbol ist die Nennweite (DN) der Versorgungsleitung.</p>
    <div class="lg">${types}</div>
    <div class="section-title">Zustand</div><div class="lg">${sts}</div>
    <div class="section-title">Leitungen</div><div class="lg">${pipes}
      <div class="lg-row">${sourceSvg({ typ: 'KNOTEN', status: 'ok' }, 28)}<span>Leitungsknoten (Abzweig, Kreuzung)</span></div></div>
    <div class="section-title">Umkreissuche</div>
    <div class="lg"><div class="lg-row">${EINSATZ_SVG.replace('width="44" height="44"', 'width="30" height="30"')}<span>Einsatzstelle (verschiebbar)</span></div></div>`;
}

function welcomeHtml() {
  return `
    <div class="sh-head">
      <div class="sh-icon">${LOGO}</div>
      <div class="sh-title"><h2>Willkommen bei FireAssist</h2><div class="sub">Digitaler Hydrantenplan</div></div>
      <button class="icon-btn" data-act="close-sheet" aria-label="Schließen">${IC.close}</button>
    </div>
    <p>Noch sind keine Daten vorhanden. Hydranten können aus einer <b>Excel- oder CSV-Datei</b> eingelesen oder direkt auf der Karte angelegt werden.</p>
    <div class="menu-group">
      <button class="menu-item" data-act="import">${IC.upload}<span>Datei importieren <small>CSV, Excel, JSON, GeoJSON</small></span></button>
      <button class="menu-item" data-act="load-demo">${IC.sparkle}<span>Beispieldaten ansehen <small>fiktives Netz mit 40 Entnahmestellen</small></span></button>
      <button class="menu-item" data-act="export-template">${IC.download}<span>Excel-Vorlage herunterladen</span></button>
      <button class="menu-item" data-act="toggle-edit">${IC.edit}<span>Manuell auf der Karte anlegen</span></button>
    </div>`;
}

/* ---------- Ebenen-Auswahl ---------- */

function layerPopHtml() {
  return `<div class="pop-title">Hintergrundkarte</div>
    ${Object.entries(BASEMAPS).filter(([, b]) => !(b.httpOnly && location.protocol === 'file:')).map(([k, b]) => `
      <label class="radio"><input type="radio" name="bm" value="${k}" data-change="basemap"${settings.basemap === k ? ' checked' : ''}>
      <span>${esc(b.label)}<small>${esc(b.note)}</small></span></label>`).join('')}
    <div class="pop-title">Anzeige</div>
    <label class="check"><input type="checkbox" data-change="set-showPipes"${settings.showPipes ? ' checked' : ''}> Leitungen</label>
    <label class="check"><input type="checkbox" data-change="set-showLabels"${settings.showLabels ? ' checked' : ''}> Nennweiten an Leitungen</label>
    <label class="check"><input type="checkbox" data-change="set-dim"${settings.dim ? ' checked' : ''}> Karte abdunkeln (Nacht)</label>`;
}

function toggleLayerPop(force) {
  const pop = $('#layer-pop');
  const show = force ?? pop.hidden;
  if (show) pop.innerHTML = layerPopHtml();
  pop.hidden = !show;
}

/* ---------- Sonstiges ---------- */

function applyTheme() {
  if (settings.theme === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = settings.theme;
  if (gridLayer) gridLayer.redraw();
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e2) { /* ignorieren */ }
    ta.remove();
  }
  toast('In die Zwischenablage kopiert.');
}

async function loadDemo() {
  if (state.sources.length && !(await confirmDialog({ title: 'Beispieldaten laden', text: '<p>Die vorhandenen Daten werden durch die Beispieldaten ersetzt. (Rückgängig möglich)</p>', ok: 'Ersetzen', danger: true }))) return;
  pushUndo('Beispieldaten');
  const d = normalizeState(DEMO_DATA);
  state.sources = d.sources;
  state.pipes = d.pipes;
  commit();
  closeSheet();
  fitData();
  toast('Beispieldaten geladen (fiktiv).', { action: { label: 'Rückgängig', fn: undo } });
}

async function deleteAll() {
  if (!(await confirmDialog({ title: 'Alle Daten löschen?', text: `<p>${state.sources.length} Entnahmestellen, ${state.pipes.length} Leitungen, ${state.vehicles.length} Funkrufnamen und ${state.hazmats.length} Gefahrstoffe werden aus diesem Browser gelöscht.</p><p class="muted small">Tipp: vorher eine Sicherung exportieren.</p>`, ok: 'Alles löschen', danger: true }))) return;
  pushUndo('Alles gelöscht');
  state.sources = [];
  state.pipes = [];
  state.vehicles = [];
  state.hazmats = [];
  commit();
  closeSheet();
  toast('Alle Daten gelöscht.', { action: { label: 'Rückgängig', fn: undo } });
}

/* ---------- Aktionen (Event-Delegation) ---------- */

const ACT = {
  'close-sheet': () => { if (sheet.name === 'radius') clearRadius(); closeSheet(); },
  'select-source': d => selectSource(d.id, { focus: true }),
  'copy-coords': d => { const s = byId.get(d.id); if (s) copyText(`${fmtCoord(s.lat)}, ${fmtCoord(s.lon)}`); },
  'edit-source': d => { openSheet('edit', () => editFormHtml(d.id), { live: false, expand: true }); },
  'connect-start': d => startConnect(d.id),
  'delete-source': async d => {
    const n = pipesOf(d.id).length;
    if (isNode(byId.get(d.id))) {
      const merge = mergeablePipes(d.id);
      const text = merge ? '<p>Die beiden Leitungen werden wieder zu einer verbunden.</p>'
        : n ? `<p>${n} angeschlossene Leitung${n > 1 ? 'en werden' : ' wird'} mit gelöscht.</p>` : '';
      if (!(await confirmDialog({ title: `Knoten ${d.id} löschen?`, text, ok: 'Löschen', danger: true }))) return;
      pushUndo(`${d.id} gelöscht`);
      deleteNode(d.id);
      closeSheet();
      toast(`${d.id} gelöscht.`, { action: { label: 'Rückgängig', fn: undo } });
      return;
    }
    if (!(await confirmDialog({ title: `${d.id} löschen?`, text: `<p>Die Entnahmestelle${n ? ` und ${n} angeschlossene Leitung${n > 1 ? 'en' : ''}` : ''} werden gelöscht.</p>`, ok: 'Löschen', danger: true }))) return;
    pushUndo(`${d.id} gelöscht`);
    deleteSource(d.id);
    closeSheet();
    toast(`${d.id} gelöscht.`, { action: { label: 'Rückgängig', fn: undo } });
  },
  'cancel-edit': () => {
    const id = $('#edit-form')?.dataset.id;
    if (id && byId.has(id)) selectSource(id); else closeSheet();
  },
  'form-today': () => { const f = $('#edit-form'); if (f) f.elements.geprueft.value = todayISO(); },
  'form-gps': () => withPosition(p => {
    setFormCoords(p.lat, p.lon);
    if (ui.draft) { ui.draft.lat = p.lat; ui.draft.lon = p.lon; drawDraft(); }
    focusLatLng([p.lat, p.lon], Math.max(map.getZoom(), 18));
    toast(`Standort übernommen (Genauigkeit ca. ${Math.round(p.acc)} m).`);
  }),
  'pipe-delete': async () => {
    const p = currentPipe();
    if (!p) return;
    if (!(await confirmDialog({ title: 'Leitung löschen?', text: `<p>Leitung ${esc(p.a)} ↔ ${esc(p.b)} wird gelöscht.</p>`, ok: 'Löschen', danger: true }))) return;
    pushUndo('Leitung gelöscht');
    deletePipe(p);
    closeSheet();
    toast('Leitung gelöscht.', { action: { label: 'Rückgängig', fn: undo } });
  },
  'node-add': () => {
    closeSheet();
    ui.mode = 'addNode';
    renderPills();
    toast('Stelle auf einer Leitung antippen.');
  },
  'pipe-straight': () => {
    const p = currentPipe();
    if (!p || !(p.via || []).length) return;
    pushUndo('Verlauf begradigt');
    p.via = [];
    commit();
    toast('Verlauf begradigt.', { action: { label: 'Rückgängig', fn: undo } });
  },
  'radius-set': d => {
    settings.radius = +d.r;
    saveSettings();
    drawRadius();
    renderSheet();
    if (ui.radius) fitBoundsVisible(L.latLng(ui.radius.lat, ui.radius.lon).toBounds(settings.radius * 2.2), 18);
  },
  'radius-pick': () => enterPickMode(),
  'radius-gps': () => withPosition(p => setRadiusPoint(p.lat, p.lon, 'Mein Standort')),
  'radius-open': () => { if (ui.radius) { clearSelection(); openSheet('radius', radiusSheetHtml); } },
  'radius-fab': () => {
    if (ui.mode === 'pickRadius') { endMode(); return; }
    if (ui.radius && sheet.name !== 'radius') { ACT['radius-open'](); return; }
    enterPickMode();
  },
  'locate': () => withPosition(p => focusLatLng([p.lat, p.lon], Math.max(map.getZoom(), 17))),
  'mode-cancel': () => endMode(),
  'edit-off': () => setEditMode(false),
  'toggle-edit': () => { setEditMode(!ui.editMode); if (sheet.name === 'welcome' || sheet.name === 'daten') closeSheet(); },
  'tab': d => openTab(d.tab),
  'open-menu': () => { clearSelection(); openSheet('menu', menuHtml, { expand: true }); },
  'open-daten': () => openSheet('daten', datenHtml, { expand: true }),
  'open-settings': () => openSheet('settings', settingsHtml, { expand: true }),
  'open-list': () => openSheet('list', listHtml, { live: false, expand: true }),
  'open-legend': () => openSheet('legend', legendHtml),
  'open-about': () => openSheet('about', aboutHtml),
  'list-filter': d => { listState.f = d.f; $$('.chips [data-act="list-filter"]').forEach(b => b.classList.toggle('on', b.dataset.f === d.f)); $('#list-items').innerHTML = listItemsHtml(); },
  'fit-data': () => { closeSheet(); fitData(); },
  'import': () => $('#file-input').click(),
  'export-xlsx': exportXlsx,
  'export-csv-src': () => exportCsv('sources'),
  'export-csv-pipes': () => exportCsv('pipes'),
  'export-json': exportJson,
  'export-html': exportAppHtml,
  'export-template': exportTemplate,
  'load-demo': loadDemo,
  'undo': () => { undo(); if (sheet.name === 'daten') renderSheet(); },
  'delete-all': deleteAll,
  'theme': d => { settings.theme = d.theme; saveSettings(); applyTheme(); renderSheet(); },
  'modal-close': () => { imp = null; closeModal(null); },
  'modal-choice': d => closeModal(modalChoices[+d.i]?.value ?? null),
  'imp-run': runImport,
  'sr-source': d => { clearSearch(); selectSource(d.id, { focus: true }); },
  'sr-geocode': () => runAddressSearch(),
  'sr-point': d => { clearSearch(); setRadiusPoint(+d.lat, +d.lon, d.label || null); },
  'search-clear': () => { clearSearch(); },
  'layers': () => toggleLayerPop(),
};

const CHG = {
  'basemap': t => { setBasemap(t.value); renderPipes(); },
  'set-showPipes': t => { settings.showPipes = t.checked; saveSettings(); renderPipes(); renderSources(true); },
  'set-showLabels': t => { settings.showLabels = t.checked; saveSettings(); renderLabels(); },
  'set-dim': t => { settings.dim = t.checked; saveSettings(); applyDim(); },
  'set-onlineSearch': t => { settings.onlineSearch = t.checked; saveSettings(); },
  'form-typ': t => {
    const f = t.form, hyd = TYPES[t.value].hydrant;
    f.classList.toggle('is-hyd', hyd);
    f.classList.toggle('is-other', !hyd);
    if (!f.dataset.id) {
      const cur = f.elements.sid.value;
      if (/^[A-Z]-\d+$/.test(cur)) f.elements.sid.value = nextId(t.value);
    }
  },
  'pipe-dn': t => { const p = currentPipe(); if (!p) return; pushUndo('DN geändert'); p.dn = t.value ? +t.value : null; commit(); },
  'pipe-bem': t => { const p = currentPipe(); if (!p) return; pushUndo('Bemerkung geändert'); p.bemerkung = t.value.trim(); commit(); },
};

function bindUI() {
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const fn = ACT[b.dataset.act];
    if (!fn) return;
    e.preventDefault();
    fn(b.dataset, b, e);
  });
  document.addEventListener('change', e => {
    const t = e.target.closest('[data-change]');
    if (!t) return;
    if (t.dataset.change.startsWith('imp-')) { onImportChange(t); return; }
    CHG[t.dataset.change]?.(t);
  });
  document.addEventListener('input', e => {
    const k = e.target.dataset.input;
    if (k === 'list-q') { listState.q = e.target.value; $('#list-items').innerHTML = listItemsHtml(); }
    else if (k && k.startsWith('gef-')) onGefahrInput(e.target);
  });
  document.addEventListener('submit', e => {
    if (e.target.matches('#edit-form')) { e.preventDefault(); saveEditForm(e.target); }
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!$('#modal').hidden) { ACT['modal-close'](); return; }
    if (!$('#search-results').hidden) { clearSearch(); return; }
    if (!$('#layer-pop').hidden) { toggleLayerPop(false); return; }
    if (currentPage()) { closePage(); return; }
    if (ui.mode !== 'view') { endMode(); return; }
    if (sheet.name) ACT['close-sheet']();
  });
  document.addEventListener('pointerdown', e => {
    const pop = $('#layer-pop');
    if (!pop.hidden && !e.target.closest('#layer-pop, [data-act="layers"]')) pop.hidden = true;
    const sr = $('#search-results');
    if (!sr.hidden && !e.target.closest('#search-results, .search')) sr.hidden = true;
  });

  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') ACT['modal-close'](); });

  const search = $('#search');
  search.addEventListener('input', () => onSearchInput(search.value));
  search.addEventListener('focus', () => { if (searchState.q) renderSearchResults(); });
  search.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const exact = waterSources().find(s => normKey(s.id) === normKey(searchState.q));
      if (exact) { ACT['sr-source']({ id: exact.id }); return; }
      const online = $('#search-results [data-act="sr-geocode"]');
      const first = $('#search-results .sr');
      (online || first)?.click();
    }
  });

  $('#file-input').addEventListener('change', e => {
    const files = [...e.target.files];
    e.target.value = '';
    if (files.length) importFiles(files);
  });

  /* Dateien per Drag & Drop auf das Fenster ziehen */
  window.addEventListener('dragover', e => { if (e.dataTransfer?.types?.includes('Files')) { e.preventDefault(); document.body.classList.add('drop'); } });
  window.addEventListener('dragleave', e => { if (!e.relatedTarget) document.body.classList.remove('drop'); });
  window.addEventListener('drop', e => {
    document.body.classList.remove('drop');
    if (!e.dataTransfer?.files?.length) return;
    e.preventDefault();
    importFiles([...e.dataTransfer.files]);
  });

  map.on('click', onMapClick);
  window.addEventListener('online', () => { tileHealth.errors = 0; updateOfflineState(); baseLayer?.redraw(); });
  window.addEventListener('offline', updateOfflineState);
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => gridLayer.redraw());
  window.addEventListener('resize', debounce(updateSheetOffset, 100));
  if ('ResizeObserver' in window) new ResizeObserver(() => updateSheetOffset()).observe($('#sheet'));
  initSheetDrag();
  renderTabbar();
}
