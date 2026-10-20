'use strict';
/* Import: CSV, Excel (xlsx/xls/ods), JSON-Sicherung, GeoJSON-Punkte.
   Erkennt Tabellen mit Entnahmestellen, Leitungen, Funkrufnamen und Gefahrstoffen.
   Spalten werden automatisch zugeordnet und können im Dialog angepasst werden. */

const DN_SYN = ['dn', 'leitungdn', 'nennweite', 'leitung', 'nw', 'durchmesser', 'rohrdn', 'rohrdurchmesser', 'leitungsdurchmesser', 'dimension', 'diameter', 'rohr', 'nennweitedn', 'dnmm'];

const SRC_FIELDS = [
  { key: 'id', label: 'ID / Nummer', syn: ['id', 'nr', 'nummer', 'hydrantnr', 'hydrantennr', 'hydrantennummer', 'hydrantnummer', 'hydrant', 'bezeichnung', 'name', 'kennung', 'objektnr', 'objektid', 'fid', 'nummerierung'] },
  { key: 'typ', label: 'Typ / Art', syn: ['typ', 'art', 'type', 'hydranttyp', 'hydrantentyp', 'hydrantenart', 'hydrantart', 'bauart', 'kategorie', 'entnahmestelle'] },
  { key: 'lat', label: 'Breitengrad / Hochwert (Y)', syn: ['lat', 'latitude', 'breite', 'breitengrad', 'hochwert', 'nordwert', 'northing', 'y', 'ycoord', 'ykoordinate', 'koordinatey', 'n', 'nord', 'gpsbreite', 'geobreite'] },
  { key: 'lon', label: 'Längengrad / Rechtswert (X)', syn: ['lon', 'lng', 'long', 'longitude', 'laenge', 'laengengrad', 'rechtswert', 'ostwert', 'easting', 'x', 'xcoord', 'xkoordinate', 'koordinatex', 'e', 'ost', 'gpslaenge', 'geolaenge'] },
  { key: 'coord', label: 'Koordinaten (beide in einer Spalte)', syn: ['koordinaten', 'koordinate', 'coords', 'coordinates', 'position', 'gps', 'gpskoordinaten', 'geometrie', 'geometry', 'wkt', 'latlon', 'latlng', 'geokoordinaten'] },
  { key: 'dn', label: 'Leitung DN', syn: DN_SYN },
  { key: 'druck', label: 'Druck (bar)', syn: ['druck', 'druckbar', 'ruhedruck', 'fliessdruck', 'versorgungsdruck', 'bar', 'pressure'] },
  { key: 'durchfluss', label: 'Durchfluss (l/min)', syn: ['durchfluss', 'durchflusslmin', 'leistung', 'leistunglmin', 'lmin', 'menge', 'entnahmemenge', 'loeschwassermenge', 'flow', 'ergiebigkeit', 'volumenstrom', 'wassermenge'] },
  { key: 'volumen', label: 'Volumen (m³)', syn: ['volumen', 'volumenm3', 'inhalt', 'inhaltm3', 'm3', 'fassungsvermoegen', 'kapazitaet', 'vorrat', 'speichervolumen'] },
  { key: 'status', label: 'Status', syn: ['status', 'zustand', 'funktion', 'funktionsfaehig', 'betriebszustand', 'state', 'einsatzbereit'] },
  { key: 'geprueft', label: 'Geprüft am', syn: ['geprueftam', 'geprueft', 'pruefdatum', 'pruefung', 'letztepruefung', 'kontrolle', 'kontrolliertam', 'wartung', 'wartungam', 'letztewartung', 'datum', 'kontrolliert'] },
  { key: 'verbunden', label: 'Verbunden mit (IDs)', syn: ['verbundenmit', 'verbunden', 'verbindungen', 'verbindung', 'nachbarn', 'nachbar', 'nachbarhydranten', 'anschluss', 'angeschlossen', 'connected', 'connections', 'links'] },
  { key: 'adresse', label: 'Adresse / Lage', syn: ['adresse', 'lage', 'standort', 'strasse', 'ort', 'address', 'lagebeschreibung', 'beschreibung', 'anschrift', 'standortbeschreibung'] },
  { key: 'bemerkung', label: 'Bemerkung', syn: ['bemerkung', 'bemerkungen', 'hinweis', 'hinweise', 'notiz', 'notizen', 'kommentar', 'info', 'anmerkung', 'anmerkungen', 'comment', 'notes'] },
];

const PIPE_FIELDS = [
  { key: 'a', label: 'Von (ID)', syn: ['von', 'start', 'anfang', 'vonid', 'vonhydrant', 'hydranta', 'a', 'from', 'knotena', 'startknoten', 'anfangsknoten', 'idvon'] },
  { key: 'b', label: 'Nach (ID)', syn: ['nach', 'bis', 'ende', 'nachid', 'nachhydrant', 'bishydrant', 'hydrantb', 'b', 'to', 'knotenb', 'endknoten', 'idnach', 'idbis'] },
  { key: 'dn', label: 'DN', syn: DN_SYN },
  { key: 'verlauf', label: 'Verlauf (Knickpunkte)', syn: ['verlauf', 'zwischenpunkte', 'knickpunkte', 'stuetzpunkte', 'geometrie', 'geometry', 'wkt', 'punkte', 'trasse', 'linie', 'linestring', 'shape'] },
  { key: 'bemerkung', label: 'Bemerkung', syn: ['bemerkung', 'bemerkungen', 'hinweis', 'notiz', 'kommentar', 'anmerkung', 'comment'] },
];

const VEH_FIELDS = [
  { key: 'verbund', label: 'Löschverbund', syn: ['loeschverbund', 'loeschverbuende', 'verbund', 'loeschbezirk', 'loeschbereich', 'brandschutzbezirk', 'bezirk', 'ausrueckebereich', 'ausrueckbereich', 'einsatzabschnitt', 'abschnitt', 'gemeindeverbund'] },
  { key: 'ort', label: 'Ortschaft', syn: ['ortschaft', 'ort', 'ortsteil', 'standort', 'wache', 'feuerwehr', 'einheit', 'loeschzug', 'loeschgruppe', 'loescheinheit', 'abteilung', 'gemeinde', 'ortsfeuerwehr', 'ortswehr', 'wehr', 'geraetehaus', 'stadtteil', 'gemeindeteil'] },
  { key: 'art', label: 'Fahrzeugart', syn: ['fahrzeugart', 'fahrzeug', 'fahrzeugtyp', 'fahrzeugbezeichnung', 'typ', 'art', 'kurzbezeichnung', 'fzg', 'fzgart', 'fahrzeugklasse', 'type', 'bezeichnung'] },
  { key: 'funkname', label: 'Funkname', syn: ['funkname', 'funkrufname', 'funkrufnamen', 'funknamen', 'rufname', 'funkkenner', 'funkkennung', 'rufzeichen', 'taktischesrufzeichen', 'funk', 'opta', 'kennung'] },
  { key: 'bemerkung', label: 'Bemerkung', syn: ['bemerkung', 'bemerkungen', 'hinweis', 'hinweise', 'notiz', 'info', 'anmerkung', 'kennzeichen'] },
];

const HAZ_FIELDS = [
  { key: 'un', label: 'UN-Nummer', syn: ['un', 'unnummer', 'unnr', 'unno', 'unnumber', 'stoffnummer'] },
  { key: 'name', label: 'Bezeichnung', syn: ['bezeichnung', 'name', 'stoff', 'stoffname', 'benennung', 'gefahrstoff', 'substanz', 'stoffbezeichnung', 'offiziellebenennung'] },
  { key: 'gefahrnr', label: 'Gefahrnummer', syn: ['gefahrnummer', 'gefahrnr', 'kemler', 'kemlerzahl', 'kemlernummer', 'gefahrzahl', 'gefahrennummer', 'gefahrkennzahl', 'gefahrkennziffer', 'nummerzurkennzeichnungdergefahr'] },
  { key: 'klasse', label: 'Klasse', syn: ['klasse', 'gefahrklasse', 'adrklasse', 'gefahrgutklasse', 'class', 'gefahrzettel', 'zettel'] },
  { key: 'hinweise', label: 'Hinweise / Maßnahmen', syn: ['hinweise', 'hinweis', 'massnahmen', 'bemerkung', 'bemerkungen', 'gefahren', 'eigenschaften', 'info', 'erstmassnahmen', 'merkmale', 'beschreibung'] },
];

const ROLES = {
  sources: { label: 'Entnahmestellen (Hydranten …)', fields: SRC_FIELDS },
  pipes: { label: 'Leitungen (Von → Nach)', fields: PIPE_FIELDS },
  vehicles: { label: 'Funkrufnamen (Fahrzeuge)', fields: VEH_FIELDS },
  hazmats: { label: 'Gefahrstoffliste', fields: HAZ_FIELDS },
  ignore: { label: 'Nicht importieren', fields: [] },
};

const ALL_SYN = new Set([...SRC_FIELDS, ...PIPE_FIELDS, ...VEH_FIELDS, ...HAZ_FIELDS].flatMap(f => f.syn));

function headerMatches(cell) {
  const k = normKey(cell);
  if (!k) return false;
  if (ALL_SYN.has(k)) return true;
  for (const s of ALL_SYN) if (s.length >= 4 && k.startsWith(s)) return true;
  return false;
}

function autoMap(headers, fields) {
  const keys = headers.map(normKey);
  const used = new Set();
  const map = {};
  for (const f of fields) {
    const i = keys.findIndex((k, idx) => !used.has(idx) && f.syn.includes(k));
    if (i >= 0) { map[f.key] = i; used.add(i); }
  }
  for (const f of fields) {
    if (map[f.key] != null) continue;
    const i = keys.findIndex((k, idx) => !used.has(idx) && f.syn.some(s => s.length >= 4 && k.startsWith(s)));
    if (i >= 0) { map[f.key] = i; used.add(i); }
  }
  return map;
}

/* ---------- Dateien lesen ---------- */

function detectDelimiter(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim()).slice(0, 6);
  const count = (line, d) => { let q = false, n = 0; for (const ch of line) { if (ch === '"') q = !q; else if (ch === d && !q) n++; } return n; };
  let best = ';', bestScore = -1;
  for (const d of [';', '\t', ',', '|']) {
    const counts = lines.map(l => count(l, d));
    if (!counts.length || !counts[0]) continue;
    const score = counts[0] * (counts.every(c => c === counts[0]) ? 10 : 1);
    if (score > bestScore) { bestScore = score; best = d; }
  }
  return best;
}

function parseCSV(text) {
  const d = detectDelimiter(text);
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else q = false;
      } else field += ch;
    } else if (ch === '"' && field.trim() === '') { q = true; field = ''; }
    else if (ch === d) { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function geojsonToRows(gj) {
  const feats = (gj.features || []).filter(f => f && f.geometry && /Point/.test(f.geometry.type));
  const keys = [...new Set(feats.flatMap(f => Object.keys(f.properties || {})))].filter(k => !['lat', 'lon', 'latitude', 'longitude'].includes(normKey(k)));
  const rows = [['Breitengrad', 'Längengrad', ...keys]];
  for (const f of feats) {
    let c = f.geometry.coordinates;
    if (f.geometry.type === 'MultiPoint') c = c[0];
    if (!c) continue;
    rows.push([c[1], c[0], ...keys.map(k => { const v = f.properties?.[k]; return v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : v; })]);
  }
  return rows;
}

async function readTables(file) {
  const name = file.name;
  const ext = (name.split('.').pop() || '').toLowerCase();
  const buf = await readFileBuffer(file);
  if (ext === 'json' || ext === 'geojson') {
    let obj;
    try { obj = JSON.parse(decodeText(buf)); } catch (e) { throw new Error('Die JSON-Datei ist fehlerhaft.'); }
    if (obj && obj.type === 'FeatureCollection') return [{ name, rows: geojsonToRows(obj) }];
    const data = obj && (obj.data || obj);
    if (data && Array.isArray(data.sources)) return [{ name, backup: normalizeState(obj) }];
    throw new Error('Unbekanntes JSON-Format (erwartet: FireAssist-Sicherung oder GeoJSON).');
  }
  if (['csv', 'txt', 'tsv'].includes(ext)) return [{ name, rows: parseCSV(decodeText(buf)) }];
  if (typeof XLSX === 'undefined') throw new Error('Excel-Unterstützung nicht geladen.');
  let wb;
  try { wb = XLSX.read(new Uint8Array(buf), { type: 'array', cellDates: true }); } catch (e) {
    throw new Error('Datei konnte nicht gelesen werden. Bitte in Excel als .xlsx oder .csv speichern.');
  }
  return wb.SheetNames.map(sn => ({
    name: wb.SheetNames.length > 1 ? `${name} › ${sn}` : name,
    sheet: sn,
    rows: XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, raw: true, defval: '', blankrows: false }),
  }));
}

function tableMap(t) { return t.maps[t.role] || {}; }

function isComplete(t) {
  const m = tableMap(t);
  switch (t.role) {
    case 'sources': return (m.lat != null && m.lon != null) || m.coord != null;
    case 'pipes': return m.a != null && m.b != null;
    case 'vehicles': return m.funkname != null;
    case 'hazmats': return m.un != null || m.name != null;
    default: return true;
  }
}

function analyzeTable(t) {
  let best = -1, bestScore = -1;
  for (let i = 0; i < Math.min(15, t.rows.length); i++) {
    const row = t.rows[i] || [];
    if (row.filter(c => String(c ?? '').trim() !== '').length < 2) continue;
    const score = row.filter(headerMatches).length;
    if (score > bestScore) { best = i; bestScore = score; }
  }
  if (best < 0) return null;
  const headers = t.rows[best].map((c, i) => String(c ?? '').trim() || `Spalte ${i + 1}`);
  const data = [], lines = [];
  t.rows.slice(best + 1).forEach((r, i) => {
    if (r.some(c => String(c ?? '').trim() !== '')) { data.push(r); lines.push(best + i + 2); }
  });
  if (!data.length) return null;
  const maps = {
    sources: autoMap(headers, SRC_FIELDS), pipes: autoMap(headers, PIPE_FIELDS),
    vehicles: autoMap(headers, VEH_FIELDS), hazmats: autoMap(headers, HAZ_FIELDS),
  };
  const hint = `${t.sheet || ''} ${t.name}`;
  let role;
  if ((maps.sources.lat != null && maps.sources.lon != null) || maps.sources.coord != null) role = 'sources';
  else if (maps.pipes.a != null && maps.pipes.b != null) role = 'pipes';
  else if (maps.vehicles.funkname != null) role = 'vehicles';
  else if (maps.hazmats.un != null) role = 'hazmats';
  else if (/leitung|verbindung|rohr/i.test(hint)) role = 'pipes';
  else if (/funk|fahrzeug/i.test(hint)) role = 'vehicles';
  else if (/gefahr|stoff|adr/i.test(hint)) role = 'hazmats';
  else role = 'ignore';
  const t2 = { name: t.name, headers, data, lines, role, maps, crs: 'auto', swap: null };
  t2.open = !isComplete(t2) || role === 'ignore';
  return t2;
}

/* ---------- Umwandeln ---------- */

function splitCoord(v) {
  const s = String(v ?? '').trim();
  if (!s) return [null, null];
  const wkt = s.match(/POINT\s*Z?\s*\(\s*(-?[\d.]+)\s+(-?[\d.]+)/i);
  if (wkt) return [parseFloat(wkt[2]), parseFloat(wkt[1])];
  let parts;
  if (/[;/|]/.test(s)) parts = s.split(/\s*[;/|]\s*/);
  else if (/,\s/.test(s)) parts = s.split(/,\s+/);
  else if (/\s/.test(s)) parts = s.split(/\s+/);
  else parts = s.split(',');
  if (parts.length < 2) return [null, null];
  return [parseCoord(parts[0]), parseCoord(parts[1])];
}

function rawCoords(t, r) {
  const m = t.maps.sources;
  if (m.lat != null && m.lon != null) return [parseCoord(r[m.lat]), parseCoord(r[m.lon])];
  if (m.coord != null) return splitCoord(r[m.coord]);
  return [null, null];
}

function tableCrs(t) {
  if (t._det == null) t._det = detectCrs(t.data.slice(0, 50).map(r => rawCoords(t, r)));
  return { crs: t.crs === 'auto' ? t._det.crs : t.crs, swap: t.swap == null ? t._det.swap : t.swap };
}

/* Verlauf einer Leitung: "50.55 9.67; 50.56 9.68" (Breite Länge) oder WKT "LINESTRING(9.67 50.55, 9.68 50.56)" */
function parseVerlauf(v) {
  const s = String(v ?? '').trim();
  if (!s) return [];
  let pairs;
  const wkt = s.match(/LINESTRING\s*Z?\s*\(([^)]*)\)/i);
  if (wkt) {
    pairs = wkt[1].split(',').map(t => t.trim().split(/\s+/).map(Number)).map(([x, y]) => [y, x]);
  } else {
    pairs = s.split(/\s*[;|]\s*/).filter(Boolean).map(tok => {
      tok = tok.trim();
      if (/^-?\d+,\d+\s+-?\d+,\d+$/.test(tok)) return tok.split(/\s+/).map(x => parseFloat(x.replace(',', '.')));
      return tok.split(/[\s,]+/).map(Number);
    });
  }
  pairs = pairs.filter(p => p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (!pairs.length) return [];
  const { crs, swap } = detectCrs(pairs);
  return pairs.map(([y, x]) => (swap ? toWgs84(x, y, crs) : toWgs84(y, x, crs))).filter(Boolean);
}

/* Verlauf an die Endpunkte anpassen: Richtung prüfen, Punkte direkt auf den Hydranten entfernen */
function fitVerlauf(pts, a, b) {
  if (!pts.length || !a || !b) return pts;
  const d = (p, s) => distance(p[0], p[1], s.lat, s.lon);
  if (d(pts[0], b) + d(pts[pts.length - 1], a) < d(pts[0], a) + d(pts[pts.length - 1], b)) pts = pts.slice().reverse();
  if (pts.length && d(pts[0], a) < 3) pts = pts.slice(1);
  if (pts.length && d(pts[pts.length - 1], b) < 3) pts = pts.slice(0, -1);
  return pts.map(([la, lo]) => [+la.toFixed(7), +lo.toFixed(7)]);
}

function convertSourceTable(t) {
  const m = t.maps.sources;
  const { crs, swap } = tableCrs(t);
  const items = [], skipped = [];
  t.data.forEach((r, i) => {
    let [y, x] = rawCoords(t, r);
    if (swap) [y, x] = [x, y];
    const ll = toWgs84(y, x, crs);
    if (!ll) { skipped.push({ line: t.lines[i], file: t.name, reason: 'keine gültigen Koordinaten' }); return; }
    const get = k => (m[k] != null ? r[m[k]] : undefined);
    const typRaw = get('typ');
    const src = cleanSource({
      id: get('id'), typ: typRaw !== undefined && typRaw !== '' ? parseTyp(typRaw) : null,
      lat: +ll[0].toFixed(7), lon: +ll[1].toFixed(7),
      dn: get('dn'), druck: get('druck'), durchfluss: get('durchfluss'), volumen: get('volumen'),
      status: get('status'), geprueft: get('geprueft'), adresse: get('adresse'), bemerkung: get('bemerkung'),
    });
    items.push({ src, verbunden: get('verbunden'), line: t.lines[i], file: t.name });
  });
  return { items, skipped };
}

function convertVehicles(t) {
  const m = t.maps.vehicles;
  const items = [], skipped = [];
  let lastVerbund = '', lastOrt = '';
  t.data.forEach((r, i) => {
    const get = k => (m[k] != null ? String(r[m[k]] ?? '').trim() : '');
    /* leere Zellen = wie Zeile darüber (verbundene Zellen in Excel); neuer Löschverbund beginnt ohne Ortschaft */
    let verbund = get('verbund');
    if (verbund && verbund !== lastVerbund) { lastVerbund = verbund; lastOrt = ''; } else verbund = lastVerbund;
    let ort = get('ort');
    if (ort) lastOrt = ort; else ort = lastOrt;
    const v = cleanVehicle({ verbund, ort, art: get('art'), funkname: get('funkname'), bemerkung: get('bemerkung') });
    if (!v.funkname) {
      if (v.art) skipped.push({ line: t.lines[i], file: t.name, reason: 'kein Funkname' });
      return;
    }
    items.push(v);
  });
  return { items, skipped };
}

function convertHazmats(t) {
  const m = t.maps.hazmats;
  const items = [], skipped = [];
  t.data.forEach((r, i) => {
    const get = k => (m[k] != null ? r[m[k]] : '');
    const h = cleanHazmat({ un: get('un'), name: get('name'), gefahrnr: get('gefahrnr'), klasse: get('klasse'), hinweise: get('hinweise') });
    if (!h.un && !h.name) { skipped.push({ line: t.lines[i], file: t.name, reason: 'weder UN-Nummer noch Bezeichnung' }); return; }
    items.push(h);
  });
  return { items, skipped };
}

function convertAll(tables, fn) {
  const out = { items: [], skipped: [] };
  for (const t of tables) { const r = fn(t); out.items.push(...r.items); out.skipped.push(...r.skipped); }
  return out;
}

function splitRefs(v) {
  const s = String(v ?? '').trim();
  if (!s) return [];
  return s.split(/\s*[,;|+&]\s*|\s+und\s+/).map(x => x.trim()).filter(Boolean);
}

function makeResolver(ids) {
  const exact = new Set(ids), lower = new Map(), norm = new Map();
  for (const id of ids) {
    lower.set(id.toLowerCase(), id);
    norm.set(normKey(id), id);
    norm.set(normKey(id).replace(/^([a-z]*)0+(\d)/, '$1$2'), id);
  }
  return tok => {
    tok = String(tok ?? '').trim();
    if (!tok) return null;
    if (exact.has(tok)) return tok;
    if (lower.has(tok.toLowerCase())) return lower.get(tok.toLowerCase());
    const n = normKey(tok);
    return norm.get(n) || norm.get(n.replace(/^([a-z]*)0+(\d)/, '$1$2')) || null;
  };
}

/* Baut aus den Tabellen das Hydrantennetz (ohne den Zustand zu ändern) */
function buildImport(imp) {
  const merge = imp.mode === 'merge';
  const result = { sources: [], pipes: [], added: 0, updated: 0, pipesImported: 0, skipped: [], unknownRefs: [], renamed: [] };
  const srcTables = imp.tables.filter(t => t.role === 'sources');
  const pipeTables = imp.tables.filter(t => t.role === 'pipes');

  const base = merge ? state.sources.map(s => Object.assign({}, s)) : [];
  const baseById = new Map(base.map(s => [s.id, s]));
  const importedIds = new Set();
  const pending = [];

  for (const t of srcTables) {
    const { items, skipped } = convertSourceTable(t);
    result.skipped.push(...skipped);
    const mappedKeys = Object.keys(t.maps.sources).filter(k => !['id', 'lat', 'lon', 'coord', 'verbunden'].includes(k));
    for (const it of items) {
      let s = it.src;
      if (!s.id) s.id = '';
      if (s.id && importedIds.has(s.id)) {
        let n = 2;
        while (importedIds.has(`${s.id}-${n}`) || baseById.has(`${s.id}-${n}`)) n++;
        result.renamed.push({ line: it.line, file: it.file, from: s.id, to: `${s.id}-${n}` });
        s.id = `${s.id}-${n}`;
      }
      if (s.id && merge && baseById.has(s.id)) {
        const ex = baseById.get(s.id);
        ex.lat = s.lat; ex.lon = s.lon;
        for (const k of mappedKeys) ex[k] = s[k];
        if (t.maps.sources.typ != null) ex.typ = s.typ;
        result.updated++;
        s = ex;
      } else {
        base.push(s);
        if (s.id) baseById.set(s.id, s);
        result.added++;
      }
      if (s.id) importedIds.add(s.id);
      pending.push({ s, verbunden: it.verbunden, line: it.line, file: it.file });
    }
  }

  /* fehlende IDs vergeben */
  const counters = {};
  for (const p of pending) {
    if (p.s.id) continue;
    const prefix = ID_PREFIX[p.s.typ] || 'S';
    let n = counters[prefix] || 1, id;
    do { id = `${prefix}-${String(n).padStart(3, '0')}`; n++; } while (baseById.has(id));
    counters[prefix] = n;
    p.s.id = id;
    baseById.set(id, p.s);
  }

  const resolve = makeResolver([...baseById.keys()]);
  const pipeMap = new Map();
  if (merge) for (const p of state.pipes) if (baseById.has(p.a) && baseById.has(p.b)) pipeMap.set(pipeKey(p.a, p.b), Object.assign({}, p, { via: (p.via || []).slice() }));
  const dnOf = id => baseById.get(id)?.dn || null;
  const derive = (a, b) => { const da = dnOf(a), db = dnOf(b); return da && db ? Math.min(da, db) : (da || db || null); };

  for (const p of pending) {
    for (const tok of splitRefs(p.verbunden)) {
      const other = resolve(tok);
      if (!other) { result.unknownRefs.push({ line: p.line, file: p.file, ref: tok, from: p.s.id }); continue; }
      if (other === p.s.id) continue;
      const k = pipeKey(p.s.id, other);
      if (!pipeMap.has(k)) { pipeMap.set(k, { a: p.s.id, b: other, dn: null, bemerkung: '', via: [] }); result.pipesImported++; }
    }
  }

  for (const t of pipeTables) {
    const m = t.maps.pipes;
    t.data.forEach((r, i) => {
      const a = resolve(r[m.a]), b = resolve(r[m.b]);
      if (!a || !b || a === b) {
        result.skipped.push({ line: t.lines[i], file: t.name, reason: `Leitung: ${!a ? `„${r[m.a] ?? ''}“` : `„${r[m.b] ?? ''}“`} nicht gefunden` });
        return;
      }
      const k = pipeKey(a, b);
      const dn = m.dn != null ? parseNumber(r[m.dn]) : null;
      const bem = m.bemerkung != null ? String(r[m.bemerkung] ?? '').trim() : '';
      let via = null;
      if (m.verlauf != null && String(r[m.verlauf] ?? '').trim()) {
        via = parseVerlauf(r[m.verlauf]);
        if (!via.length) result.skipped.push({ line: t.lines[i], file: t.name, reason: 'Verlauf nicht lesbar (Leitung ohne Knickpunkte übernommen)' });
      }
      let ex = pipeMap.get(k);
      if (!ex) { ex = { a, b, dn: null, bemerkung: '', via: [] }; pipeMap.set(k, ex); }
      if (dn) ex.dn = dn;
      if (bem) ex.bemerkung = bem;
      if (via && via.length) ex.via = fitVerlauf(via, baseById.get(ex.a), baseById.get(ex.b));
      result.pipesImported++;
    });
  }

  for (const p of pipeMap.values()) if (!p.dn) p.dn = derive(p.a, p.b);
  result.sources = base;
  result.pipes = [...pipeMap.values()];
  return result;
}

/* ---------- Dialog ---------- */

let imp = null;

async function importFiles(files) {
  const tables = [], backups = [], errors = [];
  for (const f of files) {
    try {
      for (const t of await readTables(f)) {
        if (t.backup) backups.push({ name: t.name, state: t.backup });
        else { const a = analyzeTable(t); if (a) tables.push(a); }
      }
    } catch (e) { errors.push(`${f.name}: ${e.message}`); }
  }
  if (errors.length && !tables.length && !backups.length) {
    infoDialog('Import nicht möglich', `<ul class="plain">${errors.map(e => `<li>${esc(e)}</li>`).join('')}</ul>`);
    return;
  }
  if (backups.length && !tables.length) { importBackup(backups[0]); return; }
  if (!tables.length) {
    infoDialog('Keine Daten gefunden', 'In der Datei wurde keine Tabelle mit Daten erkannt.');
    return;
  }
  imp = { tables, errors, mode: state.sources.length ? 'merge' : 'replace' };
  renderImportDialog();
}

function upsert(list, items, keyOf) {
  const idx = new Map(list.map((x, i) => [keyOf(x), i]));
  for (const it of items) { const k = keyOf(it); if (idx.has(k)) list[idx.get(k)] = it; else { idx.set(k, list.length); list.push(it); } }
}

async function importBackup(b) {
  const n = b.state.sources.filter(s => !isNode(s)).length;
  let mode = 'replace';
  if (state.sources.length || state.vehicles.length || state.hazmats.length) {
    mode = await choiceDialog({
      title: 'Sicherung einlesen',
      text: `<p><b>${esc(b.name)}</b> enthält ${n} Entnahmestellen, ${b.state.pipes.length} Leitungen, ${b.state.vehicles.length} Funkrufnamen und ${b.state.hazmats.length} Gefahrstoffe.</p><p>Vorhandene Daten ersetzen oder ergänzen?</p>`,
      buttons: [{ label: 'Abbrechen', value: null }, { label: 'Ergänzen', value: 'merge' }, { label: 'Ersetzen', value: 'replace', kind: 'primary' }],
    });
    if (!mode) return;
  }
  pushUndo('Import');
  if (mode === 'replace') {
    state.sources = b.state.sources;
    state.pipes = b.state.pipes;
    state.vehicles = b.state.vehicles;
    state.hazmats = b.state.hazmats;
  } else {
    upsert(state.sources, b.state.sources, s => s.id);
    const keys = new Set(state.pipes.map(p => pipeKey(p.a, p.b)));
    for (const p of b.state.pipes) if (!keys.has(pipeKey(p.a, p.b))) state.pipes.push(p);
    upsert(state.vehicles, b.state.vehicles, v => v.funkname);
    upsert(state.hazmats, b.state.hazmats, h => `${h.un}|${h.name}`);
  }
  commit();
  if (!currentPage()) { closeSheet(); fitData(); }
  toast('Sicherung geladen.', { action: { label: 'Rückgängig', fn: undo } });
}

function fieldSelect(t, ti, f, map) {
  const cur = map[f.key];
  return `<label class="map-row"><span>${esc(f.label)}</span>
    <select data-change="imp-map" data-ti="${ti}" data-field="${f.key}">
      <option value="">– nicht vorhanden –</option>
      ${t.headers.map((h, i) => `<option value="${i}"${cur === i ? ' selected' : ''}>${esc(h)}</option>`).join('')}
    </select></label>`;
}

function previewHtml(t) {
  if (t.role === 'ignore') return '<p class="muted small">Wird nicht importiert.</p>';
  if (!isComplete(t)) {
    const need = { sources: 'die Koordinaten', pipes: '„Von“ und „Nach“', vehicles: 'den Funknamen', hazmats: 'UN-Nummer oder Bezeichnung' }[t.role];
    return `<p class="err small">Bitte eine Spalte für ${need} zuordnen.</p>`;
  }
  if (t.role === 'pipes') {
    const m = t.maps.pipes;
    const withVia = m.verlauf != null ? t.data.filter(r => String(r[m.verlauf] ?? '').trim()).length : 0;
    const ex = t.data.slice(0, 3).map(r => `<li>${esc(r[m.a])} → ${esc(r[m.b])}${m.dn != null && r[m.dn] !== '' ? ` · DN ${esc(r[m.dn])}` : ''}</li>`).join('');
    return `<p class="ok small">${t.data.length} Leitungen erkannt${withVia ? `, ${withVia} mit Verlauf` : ''}</p><ul class="plain small">${ex}</ul>`;
  }
  if (t.role === 'vehicles') {
    const { items } = convertVehicles(t);
    const orte = new Set(items.map(v => v.ort));
    const verbuende = new Set(items.map(v => v.verbund).filter(Boolean));
    const ex = items.slice(0, 3).map(v => `<li>${v.verbund ? `${esc(v.verbund)} · ` : ''}${esc(v.ort || '–')} · ${esc(v.art || '–')} · <b>${esc(v.funkname)}</b></li>`).join('');
    return `<p class="${items.length ? 'ok' : 'err'} small">${items.length} Fahrzeuge in ${orte.size} Ortschaft${orte.size === 1 ? '' : 'en'}${verbuende.size ? ` und ${verbuende.size === 1 ? '1 Löschverbund' : `${verbuende.size} Löschverbünden`}` : ''}</p><ul class="plain small">${ex}</ul>
      <p class="muted small">Ersetzt die bisherige Funkrufnamen-Liste${state.vehicles.length ? ` (${state.vehicles.length} Einträge)` : ''}.</p>`;
  }
  if (t.role === 'hazmats') {
    const { items } = convertHazmats(t);
    const ex = items.slice(0, 3).map(h => `<li><b>${esc(h.un ? `UN ${h.un}` : '–')}</b> · ${esc(h.name)}${h.gefahrnr ? ` · ${esc(h.gefahrnr)}` : ''}</li>`).join('');
    return `<p class="${items.length ? 'ok' : 'err'} small">${items.length} Gefahrstoffe erkannt</p><ul class="plain small">${ex}</ul>
      <p class="muted small">Ersetzt die bisherige Gefahrstoffliste${state.hazmats.length ? ` (${state.hazmats.length} Einträge)` : ''}.</p>`;
  }
  const m = t.maps.sources;
  const { items, skipped } = convertSourceTable(t);
  const ex = items.slice(0, 3).map(({ src: s }) => `<li><b>${esc(s.id || '(neue ID)')}</b> · ${esc(TYPES[s.typ].short)}${s.dn ? ` · DN ${s.dn}` : ''} · ${s.lat.toFixed(5)}, ${s.lon.toFixed(5)}</li>`).join('');
  const conn = m.verbunden != null ? ' · mit Verbindungen' : '';
  return `<p class="${items.length ? 'ok' : 'err'} small">${items.length} gültig${skipped.length ? `, <span class="err">${skipped.length} ohne gültige Koordinaten</span>` : ''}${conn}</p><ul class="plain small">${ex}</ul>`;
}

function renderImportDialog() {
  if (!imp) return;
  const tablesHtml = imp.tables.map((t, ti) => {
    const fields = ROLES[t.role].fields;
    const map = tableMap(t);
    const det = t.role === 'sources' ? tableCrs(t) : null;
    const crsLabel = det ? (CRS_OPTIONS.find(c => c.key === det.crs)?.label || det.crs).split(' (')[0].split(' –')[0] : '';
    return `<section class="imp-table">
      <div class="imp-head"><b>${esc(t.name)}</b><span class="muted small">${t.data.length} Zeilen</span></div>
      <label class="map-row"><span>Inhalt</span>
        <select data-change="imp-role" data-ti="${ti}">
          ${Object.entries(ROLES).map(([k, r]) => `<option value="${k}"${t.role === k ? ' selected' : ''}>${esc(r.label)}</option>`).join('')}
        </select></label>
      ${t.role !== 'ignore' ? `<details${t.open ? ' open' : ''}><summary>Spaltenzuordnung</summary>
        <div class="map-grid">${fields.map(f => fieldSelect(t, ti, f, map)).join('')}</div></details>` : ''}
      ${t.role === 'sources' ? `<label class="map-row"><span>Koordinaten&shy;system</span>
        <select data-change="imp-crs" data-ti="${ti}">${CRS_OPTIONS.map(c => `<option value="${c.key}"${t.crs === c.key ? ' selected' : ''}>${esc(c.key === 'auto' ? `Automatisch (erkannt: ${crsLabel})` : c.label)}</option>`).join('')}</select></label>
        <label class="check"><input type="checkbox" data-change="imp-swap" data-ti="${ti}"${det.swap ? ' checked' : ''}> Breite und Länge vertauschen</label>` : ''}
      <div class="imp-preview">${previewHtml(t)}</div>
    </section>`;
  }).join('');
  const net = imp.tables.some(t => t.role === 'sources' || t.role === 'pipes');
  const modeHtml = net && state.sources.length ? `<fieldset class="seg-field"><legend>Vorhandene Hydrantendaten (${waterSources().length} Entnahmestellen)</legend>
      <label class="radio"><input type="radio" name="imp-mode" value="merge" data-change="imp-mode"${imp.mode === 'merge' ? ' checked' : ''}> <span><b>Ergänzen / aktualisieren</b><br><span class="muted small">Gleiche ID wird überschrieben, neue werden hinzugefügt</span></span></label>
      <label class="radio"><input type="radio" name="imp-mode" value="replace" data-change="imp-mode"${imp.mode === 'replace' ? ' checked' : ''}> <span><b>Alles ersetzen</b><br><span class="muted small">Bisherige Entnahmestellen und Leitungen werden gelöscht</span></span></label>
    </fieldset>` : '';
  const errHtml = imp.errors.length ? `<div class="note err small">${imp.errors.map(esc).join('<br>')}</div>` : '';
  const html = `<div class="modal-head"><h2>Daten importieren</h2><button class="icon-btn" data-act="modal-close" aria-label="Schließen">${IC.close}</button></div>
    <div class="modal-body">${errHtml}${tablesHtml}${modeHtml}</div>
    <div class="modal-foot"><button class="btn" data-act="modal-close">Abbrechen</button><button class="btn primary" data-act="imp-run">Importieren</button></div>`;
  const body = $('#modal .modal-body');
  const scroll = body ? body.scrollTop : 0;
  openModal(html, { wide: true });
  const nb = $('#modal .modal-body');
  if (nb) nb.scrollTop = scroll;
}

function onImportChange(target) {
  if (!imp) return;
  const t = imp.tables[+target.dataset.ti];
  switch (target.dataset.change) {
    case 'imp-role': t.role = target.value; t.open = !isComplete(t); break;
    case 'imp-map': {
      const map = tableMap(t);
      if (target.value === '') delete map[target.dataset.field];
      else map[target.dataset.field] = +target.value;
      t._det = null;
      t.open = true;
      break;
    }
    case 'imp-crs': t.crs = target.value; break;
    case 'imp-swap': t.swap = target.checked; break;
    case 'imp-mode': imp.mode = target.value; break;
  }
  renderImportDialog();
}

async function runImport() {
  if (!imp) return;
  const by = role => imp.tables.filter(t => t.role === role);
  const srcT = by('sources'), pipeT = by('pipes'), vehT = by('vehicles'), hazT = by('hazmats');
  if (!srcT.length && !pipeT.length && !vehT.length && !hazT.length) { toast('Keine Tabelle zum Importieren ausgewählt.'); return; }
  const incomplete = imp.tables.find(t => !isComplete(t));
  if (incomplete) { toast(`„${incomplete.name}“: bitte Pflichtspalte zuordnen.`); return; }
  const net = srcT.length || pipeT.length;
  if (net && imp.mode === 'replace' && !srcT.length) { toast('Zum Ersetzen wird eine Tabelle mit Entnahmestellen benötigt.'); return; }

  const r = net ? buildImport(imp) : null;
  const netOk = r && (r.added || r.updated || r.pipesImported);
  const v = vehT.length ? convertAll(vehT, convertVehicles) : null;
  const h = hazT.length ? convertAll(hazT, convertHazmats) : null;
  if (!netOk && !(v && v.items.length) && !(h && h.items.length)) {
    infoDialog('Nichts importiert', 'Es wurden keine gültigen Einträge gefunden. Bitte Spaltenzuordnung und Koordinatensystem prüfen.');
    return;
  }
  pushUndo('Import');
  if (netOk) { state.sources = r.sources; state.pipes = r.pipes; }
  if (v && v.items.length) state.vehicles = v.items;
  if (h && h.items.length) state.hazmats = h.items;
  imp = null;
  closeModal();
  commit();
  if (netOk && !currentPage()) { closeSheet(); fitData(); }

  const issues = [
    ...(r ? r.skipped : []), ...(v ? v.skipped : []), ...(h ? h.skipped : []),
  ].map(s => `${esc(s.file)}, Zeile ${s.line}: ${esc(s.reason)}`);
  if (r) {
    issues.push(...r.unknownRefs.map(u => `${esc(u.file)}, Zeile ${u.line}: Verbindung zu „${esc(u.ref)}“ unbekannt`));
    issues.push(...r.renamed.map(u => `${esc(u.file)}, Zeile ${u.line}: doppelte ID „${esc(u.from)}“ → „${esc(u.to)}“`));
  }
  const lines = [];
  if (netOk) {
    const parts = [`${r.added} neu`];
    if (r.updated) parts.push(`${r.updated} aktualisiert`);
    const nodes = state.sources.length - waterSources().length;
    lines.push(`<p><b>${waterSources().length}</b> Entnahmestellen${nodes ? `, <b>${nodes}</b> Leitungsknoten` : ''} (${parts.join(', ')}) und <b>${state.pipes.length}</b> Leitungen.</p>`);
  }
  if (v && v.items.length) {
    const orte = new Set(v.items.map(x => x.ort)).size;
    const verb = new Set(v.items.map(x => x.verbund).filter(Boolean)).size;
    lines.push(`<p><b>${v.items.length}</b> Funkrufnamen in <b>${orte}</b> Ortschaft${orte === 1 ? '' : 'en'}${verb ? ` und <b>${verb}</b> ${verb === 1 ? 'Löschverbund' : 'Löschverbünden'}` : ''}.</p>`);
  }
  if (h && h.items.length) lines.push(`<p><b>${h.items.length}</b> Gefahrstoffe.</p>`);
  infoDialog('Import abgeschlossen', `${lines.join('')}
    ${issues.length ? `<p class="warn-text">${issues.length} Hinweis${issues.length > 1 ? 'e' : ''}:</p><ul class="plain small issues">${issues.slice(0, 30).map(i => `<li>${i}</li>`).join('')}${issues.length > 30 ? `<li>… und ${issues.length - 30} weitere</li>` : ''}</ul>` : ''}`,
  { action: { label: 'Rückgängig', fn: undo } });
}
