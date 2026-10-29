'use strict';
/* Datenmodell, Speicherung im Browser, Rückgängig */

const APP_VERSION = '1.0';

const TYPES = {
  UFH: { label: 'Unterflurhydrant', short: 'UH', letter: 'H', hydrant: true, shape: 'circle', color: '#cf1f2e' },
  OFH: { label: 'Überflurhydrant', short: 'ÜH', letter: 'H', hydrant: true, shape: 'rsquare', color: '#cf1f2e' },
  ZIS: { label: 'Löschwasserbehälter / Zisterne', short: 'LWB', letter: 'Z', hydrant: false, shape: 'square', color: '#1d5fbf' },
  TEICH: { label: 'Offenes Gewässer / Saugstelle', short: 'Gewässer', letter: 'S', hydrant: false, shape: 'triangle', color: '#0e7c8c' },
  BRUNNEN: { label: 'Löschwasserbrunnen', short: 'Brunnen', letter: 'B', hydrant: false, shape: 'diamond', color: '#2d7140' },
  SONST: { label: 'Sonstige Entnahmestelle', short: 'Sonstige', letter: '?', hydrant: false, shape: 'circle', color: '#6b6f78' },
  /* keine Entnahmestelle: Abzweig oder Kreuzung im Leitungsnetz */
  KNOTEN: { label: 'Leitungsknoten', short: 'Knoten', letter: '', hydrant: false, node: true, shape: 'node', color: '#3d4450' },
};

const ID_PREFIX = { UFH: 'H', OFH: 'H', ZIS: 'Z', TEICH: 'T', BRUNNEN: 'B', SONST: 'S', KNOTEN: 'K' };

const STATUS = {
  ok: { label: 'in Ordnung', cls: 'ok' },
  eingeschraenkt: { label: 'eingeschränkt', cls: 'warn' },
  defekt: { label: 'defekt', cls: 'bad' },
  unbekannt: { label: 'unbekannt', cls: 'muted' },
};

const DN_OPTIONS = [50, 65, 80, 100, 125, 150, 200, 250, 300, 400, 500];
const PRUEF_INTERVALL_TAGE = 365;
const B_SCHLAUCH_M = 20;

const LS_DATA = 'fireassist.data.v1';
const LS_SETTINGS = 'fireassist.settings.v1';
const LS_EMBEDDED_SEEN = 'fireassist.embeddedSeen.v1';

function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }

function parseTyp(v) {
  if (v == null || v === '') return null;
  const up = String(v).trim().toUpperCase();
  if (TYPES[up]) return up;
  const s = normKey(v);
  if (!s) return null;
  if (s.includes('ueberflur') || s.includes('oberflur')) return 'OFH';
  if (s.includes('unterflur')) return 'UFH';
  if (['ofh', 'oh', 'ueh', 'ue', 'uefh', 'o'].includes(s)) return 'OFH';
  if (['ufh', 'uh', 'u', 'h'].includes(s)) return 'UFH';
  if (/knoten|abzweig|kreuzung/.test(s)) return 'KNOTEN';
  if (/zistern|behaelter|lwb|tank|speicher|becken|reservoir/.test(s)) return 'ZIS';
  if (/teich|gewaesser|see|fluss|bach|saug|weiher|kanal|graben|wasserstelle/.test(s)) return 'TEICH';
  if (/brunnen/.test(s)) return 'BRUNNEN';
  if (/hydrant/.test(s)) return 'UFH';
  return 'SONST';
}

function parseStatus(v) {
  const s = normKey(v);
  if (!s) return 'unbekannt';
  if (STATUS[s]) return s;
  if (/^nicht|defekt|ausserbetrieb|gesperrt|kaputt|unbrauchbar|stillgelegt/.test(s)) return 'defekt';
  if (/eingeschr|mangel|maengel|teilweise|bedingt|reparatur/.test(s)) return 'eingeschraenkt';
  if (/^(ok|io|gut|ja|inordnung|funktionsfaehig|betriebsbereit|einsatzbereit|1|true)/.test(s)) return 'ok';
  return 'unbekannt';
}

function cleanSource(o) {
  const num = (v, t) => { const n = parseNumber(v, t); return n == null ? null : n; };
  const lat = parseCoord(o.lat), lon = parseCoord(o.lon);
  return {
    id: String(o.id ?? '').trim(),
    typ: TYPES[o.typ] ? o.typ : (parseTyp(o.typ) || 'UFH'),
    lat, lon,
    dn: num(o.dn),
    druck: num(o.druck),
    durchfluss: num(o.durchfluss, true),
    volumen: num(o.volumen, true),
    status: STATUS[o.status] ? o.status : parseStatus(o.status),
    geprueft: o.geprueft ? parseDateAny(o.geprueft) : '',
    adresse: String(o.adresse ?? '').trim(),
    bemerkung: String(o.bemerkung ?? '').trim(),
  };
}

function cleanVia(v) {
  if (!Array.isArray(v)) return [];
  return v.filter(Array.isArray).map(p => [parseCoord(p[0]), parseCoord(p[1])])
    .filter(([la, lo]) => Number.isFinite(la) && Number.isFinite(lo) && Math.abs(la) <= 90 && Math.abs(lo) <= 180);
}

function cleanPipe(o) {
  return { a: String(o.a ?? '').trim(), b: String(o.b ?? '').trim(), dn: parseNumber(o.dn), bemerkung: String(o.bemerkung ?? '').trim(), via: cleanVia(o.via) };
}

const str = v => String(v ?? '').trim();

function cleanVehicle(o) {
  return { gemeinde: str(o.gemeinde), verbund: str(o.verbund), ort: str(o.ort), art: str(o.art), funkname: str(o.funkname), kennzeichen: str(o.kennzeichen), bemerkung: str(o.bemerkung) };
}

function cleanUn(v) {
  const s = str(v).replace(/^UN[\s-]*/i, '');
  return /^\d{1,4}$/.test(s) ? s.padStart(4, '0') : s;
}

function cleanHazmat(o) {
  return {
    un: cleanUn(o.un), name: str(o.name), gefahrnr: str(o.gefahrnr).toUpperCase().replace(/\s+/g, ''),
    klasse: str(o.klasse).replace(/(\d),(\d)/g, '$1.$2'), hinweise: str(o.hinweise),
    link: /^https?:\/\//i.test(str(o.link)) ? str(o.link) : '',
  };
}

function emptyState() {
  return { meta: { updated: null, localEdits: false, embeddedStamp: null }, sources: [], pipes: [], vehicles: [], hazmats: [] };
}

/* ---------- Zustand ---------- */

let state = emptyState();
const byId = new Map();
const pipesBySource = new Map();
const changeListeners = [];

function pipeKey(a, b) { return a < b ? a + '\u0001' + b : b + '\u0001' + a; }

function reindex() {
  byId.clear();
  pipesBySource.clear();
  for (const s of state.sources) byId.set(s.id, s);
  for (const p of state.pipes) {
    if (!pipesBySource.has(p.a)) pipesBySource.set(p.a, []);
    if (!pipesBySource.has(p.b)) pipesBySource.set(p.b, []);
    pipesBySource.get(p.a).push(p);
    pipesBySource.get(p.b).push(p);
  }
}

function pipesOf(id) { return pipesBySource.get(id) || []; }
function findPipe(a, b) { const k = pipeKey(a, b); return state.pipes.find(p => pipeKey(p.a, p.b) === k); }

/* Punkte einer Leitung: Start, Knickpunkte, Ende */
function pipePoints(p) {
  const a = byId.get(p.a), b = byId.get(p.b);
  if (!a || !b) return null;
  return [[a.lat, a.lon], ...(p.via || []), [b.lat, b.lon]];
}

function pathLength(pts) {
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += distance(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
  return d;
}

function pipeLength(p) {
  const pts = pipePoints(p);
  return pts ? pathLength(pts) : NaN;
}

function derivedPipeDn(a, b) {
  const da = byId.get(a)?.dn, db = byId.get(b)?.dn;
  if (da && db) return Math.min(da, db);
  return da || db || null;
}

function isHydrant(s) { return !!TYPES[s.typ]?.hydrant; }
function isNode(s) { return !!TYPES[s.typ]?.node; }
function pruefungFaellig(s) { return !isNode(s) && daysSince(s.geprueft) > PRUEF_INTERVALL_TAGE; }
/* Alle Punkte ohne Leitungsknoten */
function waterSources() { return state.sources.filter(s => !isNode(s)); }

function nextId(typ) {
  const prefix = ID_PREFIX[typ] || 'S';
  let max = 0, width = 3;
  const re = new RegExp('^' + prefix + '[-\\s]?(\\d+)$', 'i');
  for (const s of state.sources) {
    const m = s.id.match(re);
    if (m) { max = Math.max(max, +m[1]); width = Math.max(width, m[1].length); }
  }
  let n = max + 1, id;
  do { id = `${prefix}-${String(n).padStart(width, '0')}`; n++; } while (byId.has(id));
  return id;
}

function onDataChange(fn) { changeListeners.push(fn); }

/* Beispieldaten (src/js/demo.js, beispiel/, Vorlagen) haben Nummern mit diesem Präfix */
const DEMO_PREFIX = 'BSP-';
function hasDemoSources() { return state.sources.some(s => String(s.id).startsWith(DEMO_PREFIX)); }

/* Nach jeder Änderung aufrufen: Index, Speichern, Neuzeichnen */
function commit({ local = true } = {}) {
  state.meta.updated = new Date().toISOString();
  if (local) state.meta.localEdits = true;
  reindex();
  saveState();
  changeListeners.forEach(fn => fn());
}

const saveState = debounce(() => {
  if (!lsSet(LS_DATA, JSON.stringify(state))) {
    toast('Speichern im Browser fehlgeschlagen. Bitte Daten exportieren (Mehr → Daten und Bearbeiten → Sicherung).', { ms: 8000 });
  }
}, 250);

function loadLocalState() {
  const raw = lsGet(LS_DATA);
  if (!raw) return null;
  try { return normalizeState(JSON.parse(raw)); } catch (e) { return null; }
}

function normalizeState(obj) {
  const st = emptyState();
  if (!obj || typeof obj !== 'object') return st;
  const src = obj.data && Array.isArray(obj.data.sources) ? obj.data : obj;
  st.meta = Object.assign(st.meta, obj.meta || src.meta || {});
  st.sources = (src.sources || []).map(cleanSource).filter(s => s.id && Number.isFinite(s.lat) && Number.isFinite(s.lon));
  const ids = new Set(st.sources.map(s => s.id));
  const seen = new Set();
  st.pipes = (src.pipes || []).map(cleanPipe).filter(p => {
    const k = pipeKey(p.a, p.b);
    if (p.a === p.b || !ids.has(p.a) || !ids.has(p.b) || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  st.vehicles = (src.vehicles || []).map(cleanVehicle).filter(v => v.funkname);
  st.hazmats = (src.hazmats || []).map(cleanHazmat).filter(h => h.un || h.name);
  return st;
}

function replaceState(newState, opts) {
  state = newState;
  commit(opts);
}

/* ---------- Rückgängig ---------- */

const undoStack = [];

function pushUndo(label) {
  undoStack.push({ label, json: JSON.stringify({ sources: state.sources, pipes: state.pipes, vehicles: state.vehicles, hazmats: state.hazmats }) });
  if (undoStack.length > 15) undoStack.shift();
}

function undo() {
  const u = undoStack.pop();
  if (!u) { toast('Nichts zum Rückgängigmachen.'); return; }
  const d = JSON.parse(u.json);
  state.sources = d.sources;
  state.pipes = d.pipes;
  state.vehicles = d.vehicles || [];
  state.hazmats = d.hazmats || [];
  commit();
  toast(`Rückgängig: ${u.label}`);
}

/* ---------- Änderungen ---------- */

function addSource(s) {
  state.sources.push(s);
  commit();
}

function updateSource(id, patch) {
  const s = byId.get(id);
  if (!s) return;
  const newId = patch.id != null ? String(patch.id).trim() : id;
  Object.assign(s, patch, { id: newId });
  if (newId !== id) {
    for (const p of state.pipes) {
      if (p.a === id) p.a = newId;
      if (p.b === id) p.b = newId;
    }
  }
  commit();
}

function deleteSource(id) {
  state.sources = state.sources.filter(s => s.id !== id);
  state.pipes = state.pipes.filter(p => p.a !== id && p.b !== id);
  commit();
}

function addPipe(a, b, dn) {
  if (a === b || findPipe(a, b)) return null;
  const p = { a, b, dn: dn ?? derivedPipeDn(a, b), bemerkung: '', via: [] };
  state.pipes.push(p);
  commit();
  return p;
}

function deletePipe(p) {
  state.pipes = state.pipes.filter(x => x !== p);
  commit();
}

/* Teilt Leitung p im Abschnitt seg (0 = vom Start bis zum ersten Knickpunkt) mit einem neuen Knoten.
   Beide Teile behalten DN und Bemerkung. Gibt die ID des Knotens zurück. */
function splitPipe(p, seg, lat, lon) {
  const id = nextId('KNOTEN');
  const via = p.via || [];
  state.sources.push(cleanSource({ id, typ: 'KNOTEN', lat, lon, status: 'ok' }));
  state.pipes = state.pipes.filter(x => x !== p);
  state.pipes.push(
    { a: p.a, b: id, dn: p.dn, bemerkung: p.bemerkung, via: via.slice(0, seg) },
    { a: id, b: p.b, dn: p.dn, bemerkung: p.bemerkung, via: via.slice(seg) },
  );
  commit();
  return id;
}

/* Die beiden Leitungen an einem Knoten, falls er sich wieder auflösen lässt */
function mergeablePipes(id) {
  const ps = pipesOf(id);
  if (ps.length !== 2) return null;
  const [o1, o2] = ps.map(p => (p.a === id ? p.b : p.a));
  return o1 !== o2 && !findPipe(o1, o2) ? ps : null;
}

/* Knoten löschen; hängen genau zwei Leitungen daran, werden sie zu einer, der Knoten wird zum Knickpunkt */
function deleteNode(id) {
  const n = byId.get(id), ps = mergeablePipes(id);
  if (!n || !ps) { deleteSource(id); return; }
  const [p1, p2] = ps;
  const via1 = p1.b === id ? (p1.via || []) : (p1.via || []).slice().reverse();
  const via2 = p2.a === id ? (p2.via || []) : (p2.via || []).slice().reverse();
  /* verschiedene Nennweiten: die kleinere ist für die Wasserentnahme maßgeblich */
  const dns = [p1.dn, p2.dn].filter(Boolean);
  state.pipes = state.pipes.filter(x => x !== p1 && x !== p2);
  state.pipes.push({
    a: p1.a === id ? p1.b : p1.a, b: p2.a === id ? p2.b : p2.a,
    dn: dns.length ? Math.min(...dns) : null,
    bemerkung: p1.bemerkung || p2.bemerkung,
    via: [...via1, [n.lat, n.lon], ...via2],
  });
  state.sources = state.sources.filter(s => s.id !== id);
  commit();
}
