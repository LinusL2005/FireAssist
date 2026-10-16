'use strict';
/* Start der App. Muss das letzte Skript im Dokument sein. */

/* Unveränderte Kopie dieser Seite – Grundlage für „App-Datei mit Daten erstellen“ */
const PRISTINE_HTML = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;

function readEmbedded() {
  try {
    const raw = document.getElementById('fa-data')?.textContent.trim();
    if (!raw || raw === 'null') return null;
    const obj = JSON.parse(raw);
    return obj && obj.stamp && obj.data ? obj : null;
  } catch (e) { return null; }
}

function initialView() {
  if (settings.view) map.setView([settings.view.lat, settings.view.lon], settings.view.z);
  else if (state.sources.length) map.fitBounds(dataBounds(), { padding: [40, 40], maxZoom: 17 });
  else map.setView([51.16, 10.45], 6);
}

async function init() {
  applyTheme();
  initMap();
  bindUI();
  onDataChange(() => {
    renderAll();
    if (sheet.name && sheet.live) renderSheet();
    const page = currentPage();
    if (page) PAGES[page].render();
  });

  const local = loadLocalState();
  const emb = readEmbedded();
  let askEmbedded = false;
  if (emb && emb.stamp !== lsGet(LS_EMBEDDED_SEEN)) {
    if (local && local.sources.length && local.meta.localEdits) {
      state = local;
      askEmbedded = true;
    } else {
      state = normalizeState(emb.data);
      state.meta.updated = emb.stamp;
      state.meta.embeddedStamp = emb.stamp;
      settings.view = null;
      lsSet(LS_EMBEDDED_SEEN, emb.stamp);
      lsSet(LS_DATA, JSON.stringify(state));
    }
  } else {
    state = local || (emb ? Object.assign(normalizeState(emb.data), { meta: { updated: emb.stamp, localEdits: false, embeddedStamp: emb.stamp } }) : emptyState());
  }
  reindex();
  initialView();
  renderAll();
  renderPills();

  if (askEmbedded) {
    const n = emb.data.sources?.length || 0;
    const nv = emb.data.vehicles?.length || 0, nh = emb.data.hazmats?.length || 0;
    const take = await choiceDialog({
      title: 'Neuer Datenstand in dieser Datei',
      text: `<p>Diese App-Datei enthält einen Datenstand vom <b>${fmtDateTime(emb.stamp)}</b> mit ${n} Entnahmestellen${nv ? `, ${nv} Funkrufnamen` : ''}${nh ? `, ${nh} Gefahrstoffen` : ''}.</p>
        <p>Auf diesem Gerät sind eigene Änderungen gespeichert (${state.sources.length} Entnahmestellen). Datenstand aus der Datei übernehmen?</p>
        <p class="muted small">Die bisherigen Daten lassen sich danach über „Rückgängig“ wiederherstellen.</p>`,
      buttons: [{ label: 'Eigene Daten behalten', value: false }, { label: 'Übernehmen', value: true, kind: 'primary' }],
    });
    lsSet(LS_EMBEDDED_SEEN, emb.stamp);
    if (take) {
      pushUndo('Datenstand aus Datei');
      const d = normalizeState(emb.data);
      state.sources = d.sources;
      state.pipes = d.pipes;
      state.vehicles = d.vehicles;
      state.hazmats = d.hazmats;
      state.meta.embeddedStamp = emb.stamp;
      commit({ local: false });
      state.meta.localEdits = false;
      state.meta.updated = emb.stamp;
      fitData();
    }
  }

  initPages();
  initPwa();
  if (!state.sources.length && !currentPage()) openSheet('welcome', welcomeHtml);
}

/* Zurück-Taste der Android-App: erst Dialog, Suche, Seite, Modus oder Panel schließen.
   Gibt false zurück, wenn nichts mehr offen ist (dann geht die App in den Hintergrund). */
window.FireAssistBack = () => {
  if (!$('#modal').hidden) { ACT['modal-close'](); return true; }
  if (!$('#search-results').hidden) { clearSearch(); return true; }
  if (!$('#layer-pop').hidden) { toggleLayerPop(false); return true; }
  if (currentPage()) { closePage(); return true; }
  if (ui.mode !== 'view') { endMode(); return true; }
  if (sheet.name) { ACT['close-sheet'](); return true; }
  return false;
};

init();
