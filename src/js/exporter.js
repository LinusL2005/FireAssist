'use strict';
/* Export: Excel, CSV, JSON-Sicherung, App-Datei mit eingebetteten Daten, Vorlage */

const EXPORT_SRC_HEADERS = ['ID', 'Typ', 'Breitengrad', 'Längengrad', 'Leitung DN', 'Druck bar', 'Durchfluss l/min', 'Volumen m³',
  'Status', 'Geprüft am', 'Adresse / Lage', 'Bemerkung', 'Verbunden mit'];
const EXPORT_PIPE_HEADERS = ['Von', 'Nach', 'DN', 'Länge m', 'Verlauf', 'Bemerkung'];
const EXPORT_VEH_HEADERS = ['Löschverbund', 'Ortschaft', 'Fahrzeugart', 'Funkname', 'Kennzeichen', 'Bemerkung'];
const EXPORT_HAZ_HEADERS = ['UN-Nummer', 'Bezeichnung', 'Gefahrnummer', 'Klasse', 'Hinweise'];

const hasAnyData = () => state.sources.length || state.vehicles.length || state.hazmats.length;

function sortedSources() { return state.sources.slice().sort((a, b) => naturalCompare(a.id, b.id)); }

function sourceRow(s) {
  const nb = pipesOf(s.id).map(p => (p.a === s.id ? p.b : p.a)).sort(naturalCompare);
  return [s.id, TYPES[s.typ].label.split(' /')[0], s.lat, s.lon, s.dn ?? '', s.druck ?? '', s.durchfluss ?? '', s.volumen ?? '',
    STATUS[s.status].label, fmtDate(s.geprueft), s.adresse, s.bemerkung, nb.join(', ')];
}

function verlaufText(p) {
  return (p.via || []).map(([la, lo]) => `${la.toFixed(7)} ${lo.toFixed(7)}`).join('; ');
}

function pipeRow(p) {
  const len = pipeLength(p);
  return [p.a, p.b, p.dn ?? '', Number.isFinite(len) ? Math.round(len) : '', verlaufText(p), p.bemerkung];
}

function sortedVehicles() {
  const emptyLast = (x, y) => (x === '') - (y === '') || naturalCompare(x, y);
  return state.vehicles.slice().sort((a, b) => emptyLast(a.verbund, b.verbund) || emptyLast(a.ort, b.ort) || naturalCompare(a.funkname, b.funkname));
}

function sortedHazmats() {
  return state.hazmats.slice().sort((a, b) => naturalCompare(a.un, b.un) || naturalCompare(a.name, b.name));
}

const vehicleRow = v => [v.verbund, v.ort, v.art, v.funkname, v.kennzeichen, v.bemerkung];
const hazmatRow = h => [h.un, h.name, h.gefahrnr, h.klasse, h.hinweise];

function sortedPipes() {
  return state.pipes.slice().sort((x, y) => naturalCompare(x.a, y.a) || naturalCompare(x.b, y.b));
}

function sheetFrom(rows, widths) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = widths.map(w => ({ wch: w }));
  return ws;
}

function buildWorkbook() {
  const wb = XLSX.utils.book_new();
  if (state.sources.length) {
    XLSX.utils.book_append_sheet(wb, sheetFrom([EXPORT_SRC_HEADERS, ...sortedSources().map(sourceRow)],
      [10, 18, 12, 12, 10, 9, 15, 11, 13, 12, 28, 34, 24]), 'Entnahmestellen');
    XLSX.utils.book_append_sheet(wb, sheetFrom([EXPORT_PIPE_HEADERS, ...sortedPipes().map(pipeRow)], [10, 10, 8, 9, 40, 30]), 'Leitungen');
  }
  if (state.vehicles.length) XLSX.utils.book_append_sheet(wb, sheetFrom([EXPORT_VEH_HEADERS, ...sortedVehicles().map(vehicleRow)], [22, 22, 14, 30, 14, 30]), 'Funkrufnamen');
  if (state.hazmats.length) XLSX.utils.book_append_sheet(wb, sheetFrom([EXPORT_HAZ_HEADERS, ...sortedHazmats().map(hazmatRow)], [11, 40, 13, 12, 60]), 'Gefahrstoffe');
  return wb;
}

function xlsxBlob(wb) {
  return new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array', compression: true })],
    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

function exportXlsx() {
  if (!hasAnyData()) { toast('Keine Daten zum Exportieren.'); return; }
  downloadBlob(xlsxBlob(buildWorkbook()), `FireAssist_${fileStamp()}.xlsx`);
}

function csvCell(v) {
  if (typeof v === 'number') v = String(v).replace('.', ',');
  v = String(v ?? '');
  return /[;"\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function csvBlob(rows) {
  return new Blob(['﻿' + rows.map(r => r.map(csvCell).join(';')).join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' });
}

function exportCsv(kind) {
  const spec = {
    sources: [state.sources, EXPORT_SRC_HEADERS, () => sortedSources().map(sourceRow), 'Entnahmestellen'],
    pipes: [state.pipes, EXPORT_PIPE_HEADERS, () => sortedPipes().map(pipeRow), 'Leitungen'],
    vehicles: [state.vehicles, EXPORT_VEH_HEADERS, () => sortedVehicles().map(vehicleRow), 'Funkrufnamen'],
    hazmats: [state.hazmats, EXPORT_HAZ_HEADERS, () => sortedHazmats().map(hazmatRow), 'Gefahrstoffe'],
  }[kind];
  if (!spec[0].length) { toast('Keine Daten zum Exportieren.'); return; }
  downloadBlob(csvBlob([spec[1], ...spec[2]()]), `${spec[3]}_${fileStamp()}.csv`);
}

function allData() {
  return { sources: state.sources, pipes: state.pipes, vehicles: state.vehicles, hazmats: state.hazmats };
}

function exportJson() {
  const payload = { app: 'FireAssist', format: 1, exported: new Date().toISOString(), meta: state.meta, data: allData() };
  downloadBlob(new Blob([JSON.stringify(payload, null, 1)], { type: 'application/json' }), `FireAssist_Sicherung_${fileStamp()}.json`);
}

/* Kopie dieser App-Datei, in der der aktuelle Datenstand fest eingebaut ist */
function exportAppHtml() {
  if (typeof PRISTINE_HTML !== 'string' || document.querySelector('script[src]')) {
    infoDialog('Nicht verfügbar', 'Diese Funktion steht nur in der fertigen Datei <b>FireAssist.html</b> zur Verfügung (nicht in der Entwicklungsversion).');
    return;
  }
  if (!hasAnyData()) { toast('Keine Daten zum Einbetten.'); return; }
  const payload = { stamp: new Date().toISOString(), data: allData() };
  const json = JSON.stringify(payload).replace(/</g, '\\u003c');
  const html = PRISTINE_HTML.replace(/(<script id="fa-data" type="application\/json">)[\s\S]*?(<\/script>)/, (_, a, b) => a + json + b);
  downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), `FireAssist_${fileStamp()}.html`);
  infoDialog('App-Datei erstellt', `<p>Die heruntergeladene Datei enthält die App <b>mit ${waterSources().length} Entnahmestellen, ${state.pipes.length} Leitungen, ${state.vehicles.length} Funkrufnamen und ${state.hazmats.length} Gefahrstoffen</b>.</p>
    <p>Diese eine Datei kann an die Einsatzkräfte verteilt werden. Beim ersten Öffnen wird der Datenstand automatisch übernommen.</p>`);
}

function exportTemplate() {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheetFrom([
    EXPORT_SRC_HEADERS,
    ['BSP-H-001', 'Unterflurhydrant', 50.5515, 9.6755, 150, 5.5, 1600, '', 'in Ordnung', '14.03.2025', 'Hauptstraße 12', 'Beispielzeile, bitte ersetzen – Vor Hausnummer 12', 'BSP-H-002'],
    ['BSP-H-002', 'Überflurhydrant', 50.5521, 9.6768, 150, 5.2, 1400, '', 'eingeschränkt', '02.06.2025', 'Hauptstraße 30', 'Beispielzeile, bitte ersetzen', 'BSP-H-001, BSP-H-003'],
    ['BSP-H-003', 'Unterflurhydrant', 50.5530, 9.6771, 100, '', '', '', 'in Ordnung', '', 'Lindenweg 4', 'Beispielzeile, bitte ersetzen', 'BSP-H-002'],
    ['BSP-Z-01', 'Löschwasserbehälter', 50.5540, 9.6790, '', '', '', 100, 'in Ordnung', '12.06.2025', 'Schulhof', 'Beispielzeile, bitte ersetzen – Saugrohr A', ''],
  ], [10, 18, 12, 12, 10, 9, 15, 11, 13, 12, 28, 34, 24]), 'Entnahmestellen');
  XLSX.utils.book_append_sheet(wb, sheetFrom([
    ['Von', 'Nach', 'DN', 'Verlauf', 'Bemerkung'],
    ['BSP-H-001', 'BSP-H-002', 150, '', 'Beispielzeile, bitte ersetzen'],
    ['BSP-H-002', 'BSP-H-003', 100, '50.552400 9.676900; 50.552700 9.677000', 'Beispielzeile, bitte ersetzen – Abzweig Lindenweg, mit Knick'],
  ], [10, 10, 8, 40, 30]), 'Leitungen');
  XLSX.utils.book_append_sheet(wb, sheetFrom([
    ['Spalte', 'Pflicht', 'Beschreibung'],
    ['ID', 'empfohlen', 'Eindeutige Nummer, z. B. H-001. Wird für „Verbunden mit“ und das Blatt „Leitungen“ benötigt.'],
    ['Typ', 'nein', 'Unterflurhydrant, Überflurhydrant, Löschwasserbehälter, Offenes Gewässer, Löschwasserbrunnen, Sonstige – oder Leitungsknoten für einen Abzweig bzw. eine Kreuzung ohne Entnahmestelle (nur ID und Koordinaten nötig)'],
    ['Breitengrad / Längengrad', 'ja', 'WGS84 in Grad (z. B. 50,5515 und 9,6755). Alternativ UTM (Ostwert/Nordwert) oder Gauß-Krüger (Rechtswert/Hochwert).'],
    ['Leitung DN', 'nein', 'Nennweite der Versorgungsleitung in mm, z. B. 100 oder 150'],
    ['Druck bar / Durchfluss l/min', 'nein', 'Gemessene Leistungsdaten'],
    ['Volumen m³', 'nein', 'Für Behälter, Zisternen, Teiche'],
    ['Status', 'nein', 'in Ordnung, eingeschränkt, defekt, unbekannt'],
    ['Geprüft am', 'nein', 'Datum der letzten Prüfung, z. B. 14.03.2025'],
    ['Verbunden mit', 'nein', 'IDs der direkt verbundenen Entnahmestellen, durch Komma getrennt. Die Leitungs-DN wird dann aus den Hydranten abgeleitet (kleinere Nennweite).'],
    ['Blatt „Leitungen“', 'nein', 'Alternativ oder zusätzlich: jede Leitung als Zeile mit Von, Nach und DN. Hat Vorrang vor der abgeleiteten DN.'],
    ['Verlauf (Blatt „Leitungen“)', 'nein', 'Knickpunkte zwischen Von und Nach, z. B. „50.5524 9.6769; 50.5527 9.6770“ (Breite Länge, Punkte durch Semikolon getrennt) oder WKT „LINESTRING(9.6769 50.5524, 9.6770 50.5527)“. Leer = gerade Linie.'],
  ], [26, 10, 100]), 'Hinweise');
  downloadBlob(xlsxBlob(wb), 'FireAssist_Vorlage.xlsx');
}

function exportListTemplate(kind) {
  if (kind === 'vehicles') {
    downloadBlob(csvBlob([EXPORT_VEH_HEADERS,
      ['Beispiel-Löschverbund Nord', 'Musterstadt', 'HLF 20', 'Florian Musterstadt 17-46-1', 'BSP-FW 461', 'Beispielzeile, bitte ersetzen'],
      ['Beispiel-Löschverbund Nord', 'Musterstadt', 'DLK 23/12', 'Florian Musterstadt 17-33-1', 'BSP-FW 331', 'Beispielzeile, bitte ersetzen'],
      ['Beispiel-Löschverbund Nord', 'Musterdorf', 'LF 10', 'Florian Musterstadt 18-43-1', '', 'Beispielzeile, bitte ersetzen'],
      ['Beispiel-Löschverbund Süd', 'Mustertal', 'TSF-W', 'Florian Musterstadt 20-48-1', '', 'Beispielzeile, bitte ersetzen'],
    ]), 'Funkrufnamen_Vorlage.csv');
  } else {
    downloadBlob(csvBlob([EXPORT_HAZ_HEADERS,
      ['1202', 'Dieselkraftstoff oder Gasöl oder Heizöl, leicht', '30', '3', 'Beispielzeile, bitte ersetzen – Gewässer schützen'],
      ['1203', 'Benzin oder Ottokraftstoff', '33', '3', 'Beispielzeile, bitte ersetzen – Dämpfe schwerer als Luft, Explosionsgefahr'],
    ]), 'Gefahrstoffe_Vorlage.csv');
  }
}
