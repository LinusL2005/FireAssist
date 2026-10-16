'use strict';
/* Allgemeine Hilfsfunktionen: DOM, Formatierung, Zahlen-/Datumsparser, Geo-Mathematik */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

/* ---------- Formatierung (deutsch) ---------- */

function fmtNum(v, digits = 1) {
  if (v == null || v === '' || !Number.isFinite(+v)) return '–';
  return (+v).toLocaleString('de-DE', { maximumFractionDigits: digits });
}

function fmtDist(m) {
  if (!Number.isFinite(m)) return '–';
  return m < 1000 ? Math.round(m) + ' m' : fmtNum(m / 1000, 2) + ' km';
}

function isoOf(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayISO() { return isoOf(new Date()); }

function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function fmtDateTime(isoStr) {
  if (!isoStr) return '–';
  const d = new Date(isoStr);
  if (isNaN(d)) return '–';
  return d.toLocaleDateString('de-DE') + ', ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function daysSince(iso) {
  if (!iso) return Infinity;
  return (Date.now() - new Date(iso + 'T12:00:00').getTime()) / 864e5;
}

function fmtCoord(v) { return Number.isFinite(v) ? v.toFixed(6) : '–'; }

const naturalCompare = (a, b) => String(a).localeCompare(String(b), 'de', { numeric: true, sensitivity: 'base' });

/* Spaltennamen vergleichbar machen: "Leitung DN (mm)" -> "leitungdnmm" */
function normKey(s) {
  return String(s ?? '').toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/³/g, '3').replace(/²/g, '2')
    .replace(/[^a-z0-9]/g, '');
}

/* ---------- Parser ---------- */

/* Zahl aus Text holen, versteht "5,5 bar", "DN 150", "1.600 l/min" (thousands=true) */
function parseNumber(v, thousands = false) {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const m = String(v).replace(/ /g, ' ').match(/-?\d[\d.,]*/);
  if (!m) return null;
  let t = m[0].replace(/[.,]+$/, '');
  const dots = (t.match(/\./g) || []).length;
  const commas = (t.match(/,/g) || []).length;
  if (dots && commas) {
    t = t.lastIndexOf(',') > t.lastIndexOf('.') ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
  } else if (commas) {
    if (commas > 1 || (thousands && /^-?\d{1,3},\d{3}$/.test(t))) t = t.replace(/,/g, '');
    else t = t.replace(',', '.');
  } else if (dots > 1 || (thousands && /^-?\d{1,3}\.\d{3}$/.test(t))) {
    t = t.replace(/\./g, '');
  }
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

/* Koordinate: Dezimalgrad (auch mit Komma) oder Grad/Minuten/Sekunden */
function parseCoord(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v ?? '').trim();
  if (!s) return null;
  if (s.includes('°')) {
    const m = s.match(/(-?\d+(?:[.,]\d+)?)\s*°\s*(?:(\d+(?:[.,]\d+)?)\s*['′’]\s*)?(?:(\d+(?:[.,]\d+)?)\s*(?:["″”]|''))?\s*([NSEWOnsewo])?/);
    if (!m) return null;
    const f = x => (x ? parseFloat(x.replace(',', '.')) : 0);
    let deg = Math.abs(f(m[1])) + f(m[2]) / 60 + f(m[3]) / 3600;
    if (m[1].startsWith('-') || /[SWsw]/.test(m[4] || '')) deg = -deg;
    return deg;
  }
  if (/^-?\d+(?:[.,]\d+)?$/.test(s.replace(/\s/g, ''))) {
    return parseFloat(s.replace(/\s/g, '').replace(',', '.'));
  }
  return parseNumber(s);
}

function isoParts(y, m, d) {
  y = +y; m = +m; d = +d;
  if (!(y > 1900 && y < 2200 && m >= 1 && m <= 12 && d >= 1 && d <= 31)) return '';
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/* Datum aus Excel-Datum, Excel-Seriennummer, "14.03.2025", "2025-03-14", "03/2025" ... */
function parseDateAny(v) {
  if (v == null || v === '') return '';
  if (v instanceof Date) return isNaN(v) ? '' : isoOf(new Date(v.getTime() + 6 * 36e5));
  if (typeof v === 'number') {
    if (v > 20000 && v < 80000) return new Date(Math.round((v - 25569) * 864e5)).toISOString().slice(0, 10);
    if (v > 1900 && v < 2200) return isoParts(v, 1, 1);
    return '';
  }
  const s = String(v).trim();
  let m;
  if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return isoParts(m[1], m[2], m[3]);
  if ((m = s.match(/^(\d{1,2})\.\s?(\d{1,2})\.\s?(\d{2,4})/))) {
    let y = +m[3];
    if (y < 100) y += y < 70 ? 2000 : 1900;
    return isoParts(y, m[2], m[1]);
  }
  if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/))) {
    let y = +m[3];
    if (y < 100) y += y < 70 ? 2000 : 1900;
    return +m[1] > 12 ? isoParts(y, m[2], m[1]) : isoParts(y, m[1], m[2]);
  }
  if ((m = s.match(/^(\d{1,2})[./](\d{4})$/))) return isoParts(m[2], m[1], 1);
  if ((m = s.match(/^(\d{4})$/))) return isoParts(m[1], 1, 1);
  return '';
}

/* ---------- Geo ---------- */

const RAD = Math.PI / 180;

function distance(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * RAD, dLon = (lon2 - lon1) * RAD;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371008.8 * Math.asin(Math.min(1, Math.sqrt(a)));
}

function bearing(lat1, lon1, lat2, lon2) {
  const y = Math.sin((lon2 - lon1) * RAD) * Math.cos(lat2 * RAD);
  const x = Math.cos(lat1 * RAD) * Math.sin(lat2 * RAD) - Math.sin(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.cos((lon2 - lon1) * RAD);
  return (Math.atan2(y, x) / RAD + 360) % 360;
}

function compass(deg) {
  return ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8];
}

/* ---------- Dateien ---------- */

function downloadBlob(blob, filename) {
  /* In der Android-App gibt es keine Browser-Downloads: Datei an die App übergeben (speichern + teilen) */
  if (window.FireAssistAndroid && typeof window.FireAssistAndroid.saveFile === 'function') {
    const r = new FileReader();
    r.onload = () => window.FireAssistAndroid.saveFile(filename, blob.type || 'application/octet-stream', String(r.result).split(',')[1] || '');
    r.readAsDataURL(blob);
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
}

function readFileBuffer(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsArrayBuffer(file);
  });
}

/* UTF-8 versuchen, bei kaputten Zeichen Windows-1252 (typischer Excel-CSV-Export) */
function decodeText(buf) {
  let t = new TextDecoder('utf-8').decode(buf);
  if (t.includes('�')) {
    try { t = new TextDecoder('windows-1252').decode(buf); } catch (e) { /* utf-8 behalten */ }
  }
  return t.replace(/^﻿/, '');
}

function fileStamp() { return todayISO(); }
