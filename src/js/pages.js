'use strict';
/* Zusätzliche Seiten (Funkrufnamen, Gefahrstoffe). Navigation über den Adress-Hash (#funk, #gefahr),
   damit die Zurück-Taste des Handys die Seite schließt. */

const PAGES = {
  funk: { title: 'Funkrufnamen', render: () => renderFunkPage() },
  gefahr: { title: 'Gefahrstoffe', render: () => renderGefahrPage() },
};
let pageOpenedInApp = false;

function currentPage() {
  const h = location.hash.replace('#', '');
  return PAGES[h] ? h : null;
}

function openPage(name) {
  if (!PAGES[name]) return;
  if (currentPage()) { history.replaceState(null, '', '#' + name); syncPage(); return; }
  pageOpenedInApp = true;
  location.hash = name;
}

function closePage() {
  if (!currentPage()) return;
  if (pageOpenedInApp) { pageOpenedInApp = false; history.back(); return; }
  history.replaceState(null, '', location.pathname + location.search);
  syncPage();
}

function syncPage() {
  const cur = currentPage();
  for (const name of Object.keys(PAGES)) {
    const el = document.getElementById('page-' + name);
    if (el) el.hidden = name !== cur;
  }
  document.body.classList.toggle('page-open', !!cur);
  renderTabbar();
  if (!cur) { pageOpenedInApp = false; return; }
  hideSearch();
  toggleLayerPop(false);
  PAGES[cur].render();
}

/* Gemeinsamer Dialog zum Verwalten einer per CSV konfigurierten Liste */
function listManageHtml({ title, intro, prefix, count }) {
  const item = (act, ic, label) => `<button class="menu-item" data-act="${act}">${ic}<span>${label}</span></button>`;
  return `<div class="modal-head"><h2>${esc(title)}</h2><button class="icon-btn" data-act="modal-close" aria-label="Schließen">${IC.close}</button></div>
    <div class="modal-body">
      <p class="small muted">${intro}</p>
      <div class="menu-group">
        ${item(prefix + '-import', IC.upload, 'Liste importieren <small>CSV oder Excel – ersetzt die bisherige Liste</small>')}
        ${count ? item(prefix + '-export', IC.download, 'Als CSV exportieren') : ''}
        ${item(prefix + '-template', IC.file, 'CSV-Vorlage herunterladen')}
        ${item(prefix + '-demo', IC.sparkle, 'Beispielliste laden')}
        ${count ? item(prefix + '-clear', IC.trash, `<span class="danger-text">Liste löschen</span> <small>${count} Einträge</small>`) : ''}
      </div>
    </div>`;
}

async function replaceList(key, items, label) {
  if (state[key].length && !(await confirmDialog({ title: label, text: `<p>Die vorhandene Liste (${state[key].length} Einträge) wird ersetzt. (Rückgängig möglich)</p>`, ok: 'Ersetzen', danger: true }))) return;
  pushUndo(label);
  state[key] = items;
  commit();
  closeModal();
  toast(`${label}: ${items.length} Einträge.`, { action: { label: 'Rückgängig', fn: undo } });
}

async function clearList(key, label) {
  if (!(await confirmDialog({ title: `${label} löschen?`, text: `<p>${state[key].length} Einträge werden gelöscht.</p>`, ok: 'Löschen', danger: true }))) return;
  pushUndo(`${label} gelöscht`);
  state[key] = [];
  commit();
  toast(`${label} gelöscht.`, { action: { label: 'Rückgängig', fn: undo } });
}

function startListImport() {
  closeModal();
  $('#file-input').click();
}

/* ---------- Funkrufnamen: Gemeinde → Löschverbund → Ortschaft → Fahrzeuge ---------- */

const funkState = { q: '', edit: false };
let funkTree = [];
let funkRowIndex = new Map();

const ORT_LEER = 'Ohne Ortschaft';
const VERBUND_LEER = 'Ohne Löschverbund';
const GEMEINDE_LEER = 'Ohne Gemeinde';
const LEVEL_LABEL = { gemeinde: 'Gemeinde', verbund: 'Löschverbund', ort: 'Ortschaft' };
const LEVEL_LEER = { gemeinde: GEMEINDE_LEER, verbund: VERBUND_LEER, ort: ORT_LEER };
const FUNK_GROUPS = [
  ['gemeinde-verbund-ort', 'Gemeinde › Löschverbund › Ortschaft'],
  ['verbund-ort', 'Löschverbund › Ortschaft'],
  ['gemeinde-ort', 'Gemeinde › Ortschaft'],
  ['ort', 'Nur Ortschaft'],
  ['verbund', 'Nur Löschverbund'],
  ['gemeinde', 'Nur Gemeinde'],
  ['none', 'Ohne Gliederung (eine Liste)'],
];
const FUNK_SORTS = [['name', 'Funkname'], ['art', 'Fahrzeugart']];

const emptyLast = (a, b) => (a === '') - (b === '') || naturalCompare(a, b);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/* Gemeinde und Löschverbund sind optional, die Ortschaft ist immer eine Ebene */
function hasLevel(level) { return level === 'ort' || state.vehicles.some(v => v[level]); }

function funkView() {
  const fv = Object.assign({ group: 'gemeinde-verbund-ort', sort: 'name' }, settings.funkView || {});
  /* bis zur Einführung der Gemeinden war „Löschverbund › Ortschaft“ die Vorgabe und wurde mitgespeichert */
  if (!fv.mitGemeinde && fv.group === 'verbund-ort') fv.group = 'gemeinde-verbund-ort';
  return fv;
}

/* Welche Gliederungsebenen angezeigt werden (Gemeinde und Löschverbund nur, wenn es welche gibt) */
function funkLevels(group = funkView().group) {
  return group === 'none' ? [] : group.split('-').filter(hasLevel);
}

function compareVehicles(a, b) {
  return (funkView().sort === 'art' ? naturalCompare(a.art, b.art) : 0) || naturalCompare(a.funkname, b.funkname);
}

/* Gruppiert rekursiv nach den Ebenen; ohne Ebenen bleibt eine sortierte Fahrzeugliste */
function groupBy(list, levels) {
  if (!levels.length) return list.slice().sort(compareVehicles);
  const [level, ...rest] = levels;
  const map = new Map();
  for (const v of list) {
    if (!map.has(v[level])) map.set(v[level], []);
    map.get(v[level]).push(v);
  }
  return [...map.keys()].sort(emptyLast).map(key => ({ key, level, children: groupBy(map.get(key), rest) }));
}

const vehiclesIn = node => (node.level ? node.children.flatMap(vehiclesIn) : [node]);

/* Struktur für die Auswahl als flache Zeilenliste: Gemeinden und Löschverbünde (mit den Ortschaften darunter)
   und Ortschaften, jeweils mit Einrücktiefe. Schlüssel einer Ortschaft ist ihr Name. */
function vehicleTree() {
  const rows = [];
  const walk = (nodes, depth) => {
    for (const n of nodes) {
      if (n.level === 'ort') { rows.push({ level: 'ort', key: n.key, label: n.key || ORT_LEER, n: vehiclesIn(n).length, depth }); continue; }
      rows.push({ level: n.level, key: n.key, label: n.key || LEVEL_LEER[n.level], depth, keys: [...new Set(vehiclesIn(n).map(v => v.ort))] });
      walk(n.children, depth + 1);
    }
  };
  walk(groupBy(state.vehicles, ['gemeinde', 'verbund'].filter(hasLevel).concat('ort')), 0);
  return rows;
}

function vehicleOrte() {
  const seen = new Map();
  for (const r of vehicleTree()) if (r.level === 'ort' && !seen.has(r.key)) seen.set(r.key, r);
  return [...seen.values()];
}

function vehicleMatches(q) {
  const n = q.trim().toLowerCase(), nk = normKey(q);
  if (!n) return state.vehicles;
  return state.vehicles.filter(v => `${v.funkname} ${v.art} ${v.ort} ${v.verbund} ${v.gemeinde} ${v.kennzeichen} ${v.bemerkung}`.toLowerCase().includes(n)
    || (nk.length >= 2 && normKey(v.funkname).includes(nk)));
}

/* Sortierung für Trefferlisten außerhalb der Funk-Seite: Gemeinde, Löschverbund, Ortschaft, Funkname */
function compareByPlace(a, b) {
  return emptyLast(a.gemeinde, b.gemeinde) || emptyLast(a.verbund, b.verbund) || emptyLast(a.ort, b.ort) || naturalCompare(a.funkname, b.funkname);
}

/* „Florian Musterstadt 17-44-2“ -> Name normal, Kennzahl hervorgehoben */
function funknameHtml(name) {
  const m = name.match(/^(.*?\D)\s*(\d[\d/\-.\s]*)$/);
  if (!m) return `<b>${esc(name)}</b>`;
  return `<span class="veh-pre">${esc(m[1].trim())}</span> <b>${esc(m[2].trim())}</b>`;
}

function vehRow(v, levels) {
  /* Was nicht als Überschrift erscheint, steht klein im Eintrag */
  const place = [];
  if (!levels.includes('ort') && v.ort) place.push(v.ort);
  if (!levels.includes('verbund') && v.verbund) place.push(v.verbund);
  if (!levels.includes('gemeinde') && v.gemeinde) place.push(v.gemeinde);
  const meta = [place.join(' · '), v.bemerkung].filter(Boolean).join(' – ');
  /* Kennzeichen nur als Zusatzinfo, bewusst unauffällig */
  const kz = v.kennzeichen ? `<span class="veh-kz${meta ? ' sep' : ''}">${esc(v.kennzeichen)}</span>` : '';
  const inner = `<span class="veh-art">${esc(v.art || '–')}</span>
    <span class="veh-main"><span class="veh-name">${funknameHtml(v.funkname)}</span>${meta || kz ? `<span class="veh-bem">${esc(meta)}${kz}</span>` : ''}</span>`;
  return funkState.edit
    ? `<button class="veh veh-edit" data-act="veh-edit" data-i="${funkRowIndex.get(v)}">${inner}${IC.edit}</button>`
    : `<div class="veh">${inner}</div>`;
}

function groupEditBtn(level, key) {
  if (!funkState.edit) return '';
  return `<button class="icon-btn head-edit" data-act="veh-group" data-level="${level}" data-key="${esc(key)}" aria-label="${LEVEL_LABEL[level]} bearbeiten">${IC.edit}</button>`;
}

function renderNodes(nodes, levels, ctx) {
  if (!nodes.length || !nodes[0].level) {
    const add = funkState.edit
      ? `<button class="veh-add" data-act="veh-new" data-gemeinde="${esc(ctx.gemeinde ?? '')}" data-verbund="${esc(ctx.verbund ?? '')}" data-ort="${esc(ctx.ort ?? '')}">${IC.plus} Fahrzeug hinzufügen</button>`
      : '';
    return `<div class="veh-list">${nodes.map(v => vehRow(v, levels)).join('')}${add}</div>`;
  }
  return nodes.map(g => {
    const sub = Object.assign({}, ctx, { [g.level]: g.key });
    const all = vehiclesIn(g);
    if (g.level === 'gemeinde') {
      const count = (level, one, many) => (levels.includes(level) ? `${plural(new Set(all.map(v => v[level])).size, one, many)} · ` : '');
      return `<section class="gemeinde">
        <div class="gemeinde-head"><span class="verbund-title"><span class="gemeinde-name">${esc(g.key || GEMEINDE_LEER)}</span>
          <span class="small">${count('verbund', 'Löschverbund', 'Löschverbünde')}${count('ort', 'Ortschaft', 'Ortschaften')}${plural(all.length, 'Fahrzeug', 'Fahrzeuge')}</span></span>${groupEditBtn('gemeinde', g.key)}</div>
        ${renderNodes(g.children, levels, sub)}</section>`;
    }
    if (g.level === 'verbund') {
      const nOrte = new Set(all.map(v => v.ort)).size;
      return `<section class="verbund">
        <div class="verbund-head"><span class="verbund-title"><span class="verbund-name">${esc(g.key || VERBUND_LEER)}</span>
          <span class="small">${levels.includes('ort') ? `${plural(nOrte, 'Ortschaft', 'Ortschaften')} · ` : ''}${plural(all.length, 'Fahrzeug', 'Fahrzeuge')}</span></span>${groupEditBtn('verbund', g.key)}</div>
        ${renderNodes(g.children, levels, sub)}</section>`;
    }
    const verbundHint = ['verbund', 'gemeinde'].filter(l => !levels.includes(l))
      .flatMap(l => [...new Set(all.map(v => v[l]).filter(Boolean))]).join(', ');
    return `<section class="veh-group">
      <div class="veh-group-head"><span>${esc(g.key || ORT_LEER)}${verbundHint ? ` <small class="muted">${esc(verbundHint)}</small>` : ''}</span>
        <span class="head-right"><span class="muted small">${plural(all.length, 'Fahrzeug', 'Fahrzeuge')}</span>${groupEditBtn('ort', g.key)}</span></div>
      ${renderNodes(g.children, levels, sub)}</section>`;
  }).join('');
}

/* Ist genau eine Gemeinde vollständig ausgewählt und sonst nichts, ihr Name für den Auswahl-Knopf */
function singleShownGemeinde(hidden) {
  const shownG = vehicleTree().filter(r => r.level === 'gemeinde' && r.keys.some(k => !hidden.has(k)));
  if (shownG.length !== 1 || shownG[0].keys.some(k => hidden.has(k))) return null;
  const keep = new Set(shownG[0].keys);
  return vehicleOrte().every(o => keep.has(o.key) || hidden.has(o.key)) ? shownG[0].label : null;
}

function renderFunkPage() {
  const orte = vehicleOrte();
  const nVerbund = new Set(state.vehicles.map(v => v.verbund).filter(Boolean)).size;
  const nGemeinde = new Set(state.vehicles.map(v => v.gemeinde).filter(Boolean)).size;
  const hidden = new Set(settings.hiddenOrte);
  const shown = orte.filter(o => !hidden.has(o.key));
  $('#funk-count').textContent = state.vehicles.length
    ? [plural(state.vehicles.length, 'Fahrzeug', 'Fahrzeuge'), plural(orte.length, 'Ortschaft', 'Ortschaften'),
      nVerbund ? plural(nVerbund, 'Löschverbund', 'Löschverbünde') : '', nGemeinde ? plural(nGemeinde, 'Gemeinde', 'Gemeinden') : ''].filter(Boolean).join(' · ')
    : '';
  const btn = $('#funk-orte-btn');
  btn.hidden = orte.length < 2;
  const onlyG = shown.length < orte.length ? singleShownGemeinde(hidden) : null;
  btn.innerHTML = onlyG
    ? `${IC.filter}<span><b>${esc(onlyG)}</b></span>`
    : `${IC.filter}<span>Ortschaften <b>${shown.length}/${orte.length}</b></span>`;
  btn.classList.toggle('active', shown.length < orte.length);
  $('#funk-tools').hidden = !state.vehicles.length;
  $('#funk-editbar').hidden = !funkState.edit;
  $('#funk-edit-btn').classList.toggle('on', funkState.edit);
  renderFunkList();
}

const FUNK_COLUMNS = '<b>Gemeinde</b> (optional); <b>Löschverbund</b> (optional); <b>Ortschaft; Fahrzeugart; Funkname</b>; <b>Kennzeichen</b> (optional); <b>Bemerkung</b> (optional)';

function renderFunkList() {
  const box = $('#funk-list');
  if (!state.vehicles.length) {
    box.innerHTML = `<div class="empty">
      <div class="empty-ic">${IC.radio}</div>
      <h2>Noch keine Funkrufnamen</h2>
      <p>Fahrzeuge direkt hier anlegen oder eine CSV- bzw. Excel-Datei mit den Spalten ${FUNK_COLUMNS} importieren.</p>
      <div class="actions wrap center">
        <button class="btn primary" data-act="veh-new">${IC.plus} Fahrzeug anlegen</button>
        <button class="btn" data-act="funk-import">${IC.upload} Liste importieren</button>
        <button class="btn" data-act="funk-template">${IC.file} CSV-Vorlage</button>
        <button class="btn" data-act="funk-demo">${IC.sparkle} Beispiel ansehen</button>
      </div></div>`;
    return;
  }
  const q = funkState.q.trim();
  const hidden = new Set(settings.hiddenOrte);
  const list = q ? vehicleMatches(q) : state.vehicles.filter(v => !hidden.has(v.ort));
  const levels = funkLevels();
  funkRowIndex = new Map(state.vehicles.map((v, i) => [v, i]));
  const parts = [];
  if (q) parts.push(`<p class="hint">${list.length} Treffer · Suche in allen Ortschaften</p>`);
  if (!list.length) {
    parts.push(q
      ? '<div class="empty small-empty"><p>Keine Treffer.</p></div>'
      : `<div class="empty small-empty"><p>Keine Ortschaft ausgewählt.</p><button class="btn" data-act="funk-orte">${IC.filter} Ortschaften wählen</button></div>`);
  } else {
    parts.push(renderNodes(groupBy(list, levels), levels, {}));
  }
  const nHidden = vehicleOrte().filter(o => hidden.has(o.key)).length;
  if (!q && nHidden && list.length) {
    parts.push(`<p class="hint center">${plural(nHidden, 'Ortschaft', 'Ortschaften')} ausgeblendet · <button class="linkbtn" data-act="funk-orte">Auswahl ändern</button></p>`);
  }
  box.innerHTML = parts.join('');
}

/* ---------- Ansicht (Gliederung und Sortierung) ---------- */

function funkViewHtml() {
  const fv = funkView();
  /* nur Gliederungen anbieten, deren Ebenen es gibt; ohne Daten für eine Ebene fällt sie weg */
  const groups = FUNK_GROUPS.filter(([k]) => k === 'none' || funkLevels(k).length === k.split('-').length);
  const cur = funkLevels().join('-') || 'none';
  const radio = (name, k, label, on) => `<label class="radio"><input type="radio" name="${name}" value="${k}" data-change="${name}"${on ? ' checked' : ''}><span>${esc(label)}</span></label>`;
  return `<div class="modal-head"><h2>Ansicht</h2><button class="icon-btn" data-act="modal-close" aria-label="Schließen">${IC.close}</button></div>
    <div class="modal-body">
      <div class="section-title">Gliederung</div>
      ${groups.map(([k, l]) => radio('funk-view-group', k, l, k === cur)).join('')}
      <div class="section-title">Fahrzeuge sortieren nach</div>
      ${FUNK_SORTS.map(([k, l]) => radio('funk-view-sort', k, l, k === fv.sort)).join('')}
      <p class="muted small">Die Einstellung wird auf diesem Gerät gespeichert.</p>
    </div>
    <div class="modal-foot"><button class="btn primary" data-act="modal-close">Fertig</button></div>`;
}

function setFunkView(patch) {
  settings.funkView = Object.assign(funkView(), patch, { mitGemeinde: true });
  saveSettings();
  renderFunkPage();
}

/* ---------- Bearbeiten ---------- */

function datalists() {
  const opts = key => [...new Set(state.vehicles.map(v => v[key]).filter(Boolean))].sort(naturalCompare).map(x => `<option value="${esc(x)}"></option>`).join('');
  return ['art', 'ort', 'verbund', 'gemeinde'].map(k => `<datalist id="dl-${k}">${opts(k)}</datalist>`).join('');
}

function vehFormHtml(i, preset = {}) {
  const v = i != null ? state.vehicles[i] : Object.assign({ gemeinde: '', verbund: '', ort: '', art: '', funkname: '', kennzeichen: '', bemerkung: '' }, preset);
  return `<form id="veh-form" class="modal-form" data-i="${i ?? ''}" autocomplete="off" novalidate>
    <div class="modal-head"><h2>${i != null ? 'Fahrzeug bearbeiten' : 'Neues Fahrzeug'}</h2><button type="button" class="icon-btn" data-act="modal-close" aria-label="Schließen">${IC.close}</button></div>
    <div class="modal-body form">
      <label class="fld">Funkname<input name="funkname" value="${esc(v.funkname)}" placeholder="z. B. Florian Musterstadt 17-44-2" spellcheck="false" autocapitalize="words"></label>
      <label class="fld">Fahrzeugart<input name="art" list="dl-art" value="${esc(v.art)}" placeholder="z. B. HLF 20" spellcheck="false"></label>
      <div class="grid2">
        <label class="fld">Ortschaft<input name="ort" list="dl-ort" value="${esc(v.ort)}"></label>
        <label class="fld">Löschverbund<input name="verbund" list="dl-verbund" value="${esc(v.verbund)}" placeholder="optional"></label>
        <label class="fld">Gemeinde<input name="gemeinde" list="dl-gemeinde" value="${esc(v.gemeinde)}" placeholder="optional"></label>
        <label class="fld">Kennzeichen<input name="kennzeichen" value="${esc(v.kennzeichen)}" placeholder="optional" spellcheck="false" autocapitalize="characters"></label>
      </div>
      <label class="fld">Bemerkung<input name="bemerkung" value="${esc(v.bemerkung)}" placeholder="optional"></label>
      ${datalists()}
    </div>
    <div class="modal-foot">
      ${i != null ? `<button type="button" class="btn danger left" data-act="veh-delete" data-i="${i}">${IC.trash} Löschen</button>` : ''}
      <button type="button" class="btn" data-act="modal-close">Abbrechen</button>
      <button type="submit" class="btn primary">Speichern</button>
    </div>
  </form>`;
}

function saveVehForm(form) {
  const val = n => form.elements[n].value.trim();
  const rec = cleanVehicle({ gemeinde: val('gemeinde'), verbund: val('verbund'), ort: val('ort'), art: val('art'), funkname: val('funkname'), kennzeichen: val('kennzeichen'), bemerkung: val('bemerkung') });
  if (!rec.funkname) { toast('Bitte einen Funknamen eingeben.'); return; }
  const i = form.dataset.i === '' ? null : +form.dataset.i;
  const dup = state.vehicles.findIndex((x, j) => j !== i && x.funkname.toLowerCase() === rec.funkname.toLowerCase());
  if (dup >= 0) { toast(`„${rec.funkname}“ gibt es schon (${state.vehicles[dup].ort || ORT_LEER}).`); return; }
  pushUndo(i == null ? 'Fahrzeug angelegt' : 'Fahrzeug geändert');
  if (i == null) state.vehicles.push(rec); else state.vehicles[i] = rec;
  commit();
  closeModal();
  toast(i == null ? `${rec.funkname} angelegt.` : 'Gespeichert.', { action: { label: 'Rückgängig', fn: undo } });
}

/* Übergeordnete Ebenen, die sich beim Bearbeiten einer Gruppe mit ändern lassen */
const LEVEL_PARENTS = { ort: ['verbund', 'gemeinde'], verbund: ['gemeinde'], gemeinde: [] };
const PARENT_LABEL = { verbund: 'Gehört zum Löschverbund', gemeinde: 'Gehört zur Gemeinde' };
const LEVEL_DIESE = { ort: 'dieser Ortschaft', verbund: 'dieses Löschverbunds', gemeinde: 'dieser Gemeinde' };

function vehGroupHtml(level, key) {
  const members = state.vehicles.filter(v => v[level] === key);
  const parentField = p => {
    const vals = [...new Set(members.map(v => v[p]))];
    return `<label class="fld">${PARENT_LABEL[p]}<input name="${p}" list="dl-${p}" value="${esc(vals.length === 1 ? vals[0] : '')}" placeholder="${vals.length > 1 ? 'mehrere – leer lassen = unverändert' : 'optional'}"></label>`;
  };
  return `<form id="veh-group-form" class="modal-form" data-level="${level}" data-key="${esc(key)}" autocomplete="off" novalidate>
    <div class="modal-head"><h2>${LEVEL_LABEL[level]} bearbeiten</h2><button type="button" class="icon-btn" data-act="modal-close" aria-label="Schließen">${IC.close}</button></div>
    <div class="modal-body form">
      <p class="muted small">Gilt für alle ${plural(members.length, 'Fahrzeug', 'Fahrzeuge')} ${LEVEL_DIESE[level]}.</p>
      <label class="fld">Name<input name="name" value="${esc(key)}" placeholder="${LEVEL_LEER[level]}"></label>
      ${LEVEL_PARENTS[level].map(parentField).join('')}
      ${datalists()}
    </div>
    <div class="modal-foot">
      <button type="button" class="btn" data-act="modal-close">Abbrechen</button>
      <button type="submit" class="btn primary">Speichern</button>
    </div>
  </form>`;
}

function saveVehGroupForm(form) {
  const level = form.dataset.level, key = form.dataset.key;
  const name = form.elements.name.value.trim();
  const members = state.vehicles.filter(v => v[level] === key);
  /* bei gemischten Werten bedeutet ein leeres Feld „unverändert“ */
  const parents = LEVEL_PARENTS[level].map(p => ({ p, val: form.elements[p].value.trim(), mixed: new Set(members.map(v => v[p])).size > 1 }))
    .filter(x => !(x.mixed && !x.val));
  pushUndo(`${LEVEL_LABEL[level]} geändert`);
  for (const v of members) {
    v[level] = name;
    for (const x of parents) v[x.p] = x.val;
  }
  if (level === 'ort' && name !== key && settings.hiddenOrte.includes(key)) {
    settings.hiddenOrte = settings.hiddenOrte.map(k => (k === key ? name : k));
    saveSettings();
  }
  commit();
  closeModal();
  toast('Gespeichert.', { action: { label: 'Rückgängig', fn: undo } });
}

/* ---------- Auswahl der angezeigten Ortschaften ---------- */

function funkOrteHtml() {
  funkTree = vehicleTree();
  const hidden = new Set(settings.hiddenOrte);
  const body = funkTree.map((r, i) => {
    if (r.level === 'ort') {
      return `<label class="check ort-check d${r.depth}">
        <input type="checkbox" data-change="funk-ort" data-r="${i}"${hidden.has(r.key) ? '' : ' checked'}>
        <span>${esc(r.label)}</span><span class="muted small">${r.n}</span></label>`;
    }
    const nShown = r.keys.filter(k => !hidden.has(k)).length;
    return `<div class="verbund-check ${r.level}-check d${r.depth}">
        <label class="check"><input type="checkbox" data-change="funk-group" data-r="${i}"${nShown === r.keys.length ? ' checked' : ''}${nShown && nShown < r.keys.length ? ' data-mixed="1"' : ''}>
          <span><b>${esc(r.label)}</b></span></label>
        <button class="btn sm" data-act="funk-only" data-r="${i}">${r.level === 'gemeinde' ? 'nur diese' : 'nur dieser'}</button>
      </div>`;
  }).join('');
  const groupNames = [hasLevel('gemeinde') && 'Gemeinden', hasLevel('verbund') && 'Löschverbünde'].filter(Boolean);
  return `<div class="modal-head"><h2>Anzeige auswählen</h2><button class="icon-btn" data-act="modal-close" aria-label="Schließen">${IC.close}</button></div>
    <div class="modal-body">
      <p class="muted small">Welche ${groupNames.length ? groupNames.join(', ') + ' und ' : ''}Ortschaften angezeigt werden. Die Auswahl wird auf diesem Gerät gespeichert.</p>
      <div class="actions"><button class="btn sm" data-act="funk-orte-all">Alle</button><button class="btn sm" data-act="funk-orte-none">Keine</button></div>
      <div class="ort-list">${body}</div>
    </div>
    <div class="modal-foot"><button class="btn primary" data-act="modal-close">Fertig</button></div>`;
}

function openFunkOrte() {
  const scroll = $('#modal .modal-body')?.scrollTop || 0;
  openModal(funkOrteHtml());
  $$('#modal [data-mixed]').forEach(cb => { cb.indeterminate = true; });
  const body = $('#modal .modal-body');
  if (body) body.scrollTop = scroll;
}

function setHiddenOrte(list) {
  settings.hiddenOrte = [...new Set(list)];
  saveSettings();
  renderFunkPage();
}

function setOrteVisible(keys, visible) {
  const hidden = new Set(settings.hiddenOrte);
  for (const k of keys) { if (visible) hidden.delete(k); else hidden.add(k); }
  setHiddenOrte([...hidden]);
  openFunkOrte();
}

Object.assign(ACT, {
  'open-page': d => { if (sheet.name) closeSheet(); openPage(d.page); },
  'page-close': () => closePage(),
  'sr-funk': d => { clearSearch(); funkState.q = d.q; $('#funk-q').value = d.q; openPage('funk'); },
  'funk-orte': () => openFunkOrte(),
  'funk-orte-all': () => { setHiddenOrte([]); openFunkOrte(); },
  'funk-orte-none': () => { setHiddenOrte(vehicleOrte().map(o => o.key)); openFunkOrte(); },
  'funk-only': d => {
    const r = funkTree[+d.r];
    if (!r) return;
    const keep = new Set(r.keys);
    setHiddenOrte(vehicleOrte().map(o => o.key).filter(k => !keep.has(k)));
    openFunkOrte();
  },
  'funk-view': () => openModal(funkViewHtml()),
  'funk-edit-toggle': () => { funkState.edit = !funkState.edit; renderFunkPage(); },
  'veh-new': d => { openModal(vehFormHtml(null, { gemeinde: d.gemeinde || '', verbund: d.verbund || '', ort: d.ort || '' })); $('#veh-form [name="funkname"]')?.focus(); },
  'veh-edit': d => openModal(vehFormHtml(+d.i)),
  'veh-group': d => openModal(vehGroupHtml(d.level, d.key)),
  'veh-delete': async d => {
    const v = state.vehicles[+d.i];
    if (!v || !(await confirmDialog({ title: 'Fahrzeug löschen?', text: `<p><b>${esc(v.funkname)}</b> (${esc(v.art || '–')}) wird gelöscht.</p>`, ok: 'Löschen', danger: true }))) return;
    pushUndo('Fahrzeug gelöscht');
    state.vehicles.splice(+d.i, 1);
    commit();
    toast(`${v.funkname} gelöscht.`, { action: { label: 'Rückgängig', fn: undo } });
  },
  'funk-manage': () => openModal(listManageHtml({
    title: 'Funkrufnamen verwalten', prefix: 'funk', count: state.vehicles.length,
    intro: `Fahrzeuge lassen sich über <b>Bearbeiten</b> (Stift oben) direkt ändern. Alternativ eine CSV- oder Excel-Datei mit den Spalten ${FUNK_COLUMNS} importieren. Leere Zellen bei Gemeinde, Löschverbund und Ortschaft übernehmen den Wert der Zeile darüber.`,
  })),
  'funk-import': startListImport,
  'funk-export': () => exportCsv('vehicles'),
  'funk-template': () => exportListTemplate('vehicles'),
  'funk-demo': () => replaceList('vehicles', DEMO_VEHICLES.map(cleanVehicle), 'Beispiel-Funkrufnamen'),
  'funk-clear': () => { closeModal(); clearList('vehicles', 'Funkrufnamen'); },
});

Object.assign(CHG, {
  'funk-ort': t => {
    const r = funkTree[+t.dataset.r];
    if (r) setOrteVisible([r.key], t.checked);
  },
  'funk-group': t => {
    const r = funkTree[+t.dataset.r];
    if (r) setOrteVisible(r.keys, t.checked);
  },
  'funk-view-group': t => setFunkView({ group: t.value }),
  'funk-view-sort': t => setFunkView({ sort: t.value }),
});

function initPages() {
  const q = $('#funk-q');
  q.addEventListener('input', () => { funkState.q = q.value; renderFunkList(); });
  document.addEventListener('submit', e => {
    if (e.target.matches('#veh-form')) { e.preventDefault(); saveVehForm(e.target); }
    else if (e.target.matches('#veh-group-form')) { e.preventDefault(); saveVehGroupForm(e.target); }
  });
  window.addEventListener('hashchange', syncPage);
  syncPage();
}
