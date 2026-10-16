'use strict';
/* Gefahrstoffe: Warntafel auswerten, Stoffliste (per CSV konfiguriert), Grundlagenwissen.
   Alle Angaben sind Hilfen für den Einsatz – maßgeblich sind ADR, FwDV 500 und die Fachberatung. */

/* Bedeutung der Ziffern der Gefahrnummer (ADR 5.3.2.3) */
const KEMLER_FIRST = {
  2: 'Gas (Entweichen von Gas durch Druck oder chemische Reaktion)',
  3: 'Entzündbarer flüssiger Stoff (Dämpfe) oder Gas, oder selbsterhitzungsfähiger flüssiger Stoff',
  4: 'Entzündbarer fester Stoff oder selbsterhitzungsfähiger fester Stoff',
  5: 'Oxidierende (brandfördernde) Wirkung',
  6: 'Giftigkeit oder Ansteckungsgefahr',
  7: 'Radioaktivität',
  8: 'Ätzwirkung',
  9: 'Verschiedene gefährliche Stoffe (Klasse 9), z. B. umweltgefährdend',
};
const KEMLER_EXTRA = {
  2: 'Entweichen von Gas',
  3: 'Entzündbarkeit',
  4: 'Entzündbarkeit (fester Stoff)',
  5: 'Oxidierende (brandfördernde) Wirkung',
  6: 'Giftigkeit',
  7: 'Radioaktivität',
  8: 'Ätzwirkung',
  9: 'Gefahr einer spontanen heftigen Reaktion',
};

/* Häufige Gefahrnummern mit fester Bedeutung */
const KEMLER_SPECIAL = {
  20: 'Erstickendes Gas oder Gas ohne Zusatzgefahr',
  22: 'Tiefgekühlt verflüssigtes Gas, erstickend',
  223: 'Tiefgekühlt verflüssigtes Gas, entzündbar',
  225: 'Tiefgekühlt verflüssigtes Gas, oxidierend (brandfördernd)',
  23: 'Entzündbares Gas',
  239: 'Entzündbares Gas, das spontan zu einer heftigen Reaktion führen kann',
  25: 'Oxidierendes (brandförderndes) Gas',
  26: 'Giftiges Gas',
  263: 'Giftiges Gas, entzündbar',
  265: 'Giftiges Gas, oxidierend (brandfördernd)',
  268: 'Giftiges Gas, ätzend',
  30: 'Entzündbarer flüssiger Stoff (Flammpunkt 23 °C bis 60 °C)',
  33: 'Leicht entzündbarer flüssiger Stoff (Flammpunkt unter 23 °C)',
  333: 'Selbstentzündlicher (pyrophorer) flüssiger Stoff',
  336: 'Leicht entzündbarer flüssiger Stoff, giftig',
  338: 'Leicht entzündbarer flüssiger Stoff, ätzend',
  40: 'Entzündbarer fester Stoff oder selbstzersetzlicher bzw. selbsterhitzungsfähiger Stoff',
  423: 'Fester Stoff, der mit Wasser reagiert und entzündbare Gase bildet',
  X423: 'Fester Stoff, der mit Wasser gefährlich reagiert und entzündbare Gase bildet',
  44: 'Entzündbarer fester Stoff, der sich bei erhöhter Temperatur in geschmolzenem Zustand befindet',
  50: 'Oxidierender (brandfördernder) Stoff',
  539: 'Entzündbares organisches Peroxid',
  58: 'Oxidierender (brandfördernder) Stoff, ätzend',
  60: 'Giftiger oder schwach giftiger Stoff',
  66: 'Sehr giftiger Stoff',
  606: 'Ansteckungsgefährlicher Stoff',
  70: 'Radioaktiver Stoff',
  80: 'Ätzender oder schwach ätzender Stoff',
  X80: 'Ätzender Stoff, der mit Wasser gefährlich reagiert',
  88: 'Stark ätzender Stoff',
  X88: 'Stark ätzender Stoff, der mit Wasser gefährlich reagiert',
  90: 'Umweltgefährdender Stoff; verschiedene gefährliche Stoffe',
  99: 'Verschiedene gefährliche Stoffe in erwärmtem Zustand',
};

const ADR_CLASSES = [
  ['1', 'Explosive Stoffe und Gegenstände mit Explosivstoff'],
  ['2.1', 'Entzündbare Gase'],
  ['2.2', 'Nicht entzündbare, nicht giftige Gase'],
  ['2.3', 'Giftige Gase'],
  ['3', 'Entzündbare flüssige Stoffe'],
  ['4.1', 'Entzündbare feste Stoffe, selbstzersetzliche Stoffe, desensibilisierte explosive Stoffe'],
  ['4.2', 'Selbstentzündliche Stoffe'],
  ['4.3', 'Stoffe, die in Berührung mit Wasser entzündbare Gase entwickeln'],
  ['5.1', 'Entzündend (oxidierend) wirkende Stoffe'],
  ['5.2', 'Organische Peroxide'],
  ['6.1', 'Giftige Stoffe'],
  ['6.2', 'Ansteckungsgefährliche Stoffe'],
  ['7', 'Radioaktive Stoffe'],
  ['8', 'Ätzende Stoffe'],
  ['9', 'Verschiedene gefährliche Stoffe und Gegenstände (z. B. umweltgefährdend, Lithiumbatterien)'],
];
const ADR_CLASS_MAP = new Map(ADR_CLASSES);

const GHS = [
  ['GHS01', 'Explodierende Bombe', 'Explosive Stoffe, Gefahr der Massenexplosion'],
  ['GHS02', 'Flamme', 'Entzündbar (Gase, Flüssigkeiten, Feststoffe), selbsterhitzungsfähig'],
  ['GHS03', 'Flamme über einem Kreis', 'Oxidierend (brandfördernd)'],
  ['GHS04', 'Gasflasche', 'Gase unter Druck (verdichtet, verflüssigt, tiefgekühlt)'],
  ['GHS05', 'Ätzwirkung', 'Hautätzend, schwere Augenschäden, korrosiv gegenüber Metallen'],
  ['GHS06', 'Totenkopf mit gekreuzten Knochen', 'Akute Toxizität (giftig, sehr giftig)'],
  ['GHS07', 'Ausrufezeichen', 'Gesundheitsschädlich, reizend, sensibilisierend'],
  ['GHS08', 'Gesundheitsgefahr', 'Krebserzeugend, erbgutverändernd, Atemwege sensibilisierend, Aspirationsgefahr'],
  ['GHS09', 'Umwelt', 'Gewässergefährdend'],
];

function decodeGefahrnummer(raw) {
  const code = String(raw ?? '').toUpperCase().replace(/\s+/g, '');
  const m = code.match(/^(X?)(\d{2,3})$/);
  if (!m) return null;
  const water = !!m[1], num = m[2];
  const digits = num.split('');
  if (!KEMLER_FIRST[digits[0]]) return { code, water, invalid: true, parts: [] };
  const parts = [{ d: digits[0], t: KEMLER_FIRST[digits[0]] }];
  for (let i = 1; i < digits.length; i++) {
    const d = digits[i];
    if (d === '0') parts.push({ d, t: 'keine weitere Gefahr' });
    else if (d === digits[i - 1]) parts.push({ d, t: 'Verdopplung: Gefahr verstärkt' });
    else if (KEMLER_EXTRA[d]) parts.push({ d, t: 'zusätzlich: ' + KEMLER_EXTRA[d] });
    else parts.push({ d, t: 'unbekannte Ziffer' });
  }
  const special = KEMLER_SPECIAL[code] || (!water ? KEMLER_SPECIAL[num] : null);
  return { code, water, special, parts };
}

function classInfo(klasse) {
  const ks = String(klasse || '').match(/\d(?:\.\d)?/g) || [];
  return ks.map(k => ({ k, t: ADR_CLASS_MAP.get(k) || ADR_CLASS_MAP.get(k.split('.')[0]) || '' }));
}

function hazmatMatches(q) {
  const s = String(q || '').trim();
  if (!s) return [];
  const unq = s.replace(/^UN\s*/i, '');
  if (/^\d{1,4}$/.test(unq)) return state.hazmats.filter(h => h.un.includes(unq) || h.un === unq.padStart(4, '0'));
  const n = s.toLowerCase();
  return state.hazmats.filter(h => h.name.toLowerCase().includes(n));
}

/* Erkennt „33/1203“, „33 1203“, „X423/1428“ */
function parseTafel(q) {
  const m = String(q || '').trim().match(/^(X?\d{2,3})\s*[/ \-]\s*(\d{4})$/i);
  return m ? { gnr: m[1].toUpperCase(), un: m[2] } : null;
}

/* ---------- Darstellung ---------- */

const gefState = { tab: 'tafel', gnr: '', un: '', q: '' };

function miniTafel(gnr, un) {
  return `<span class="mini-tafel" aria-label="Warntafel ${esc(gnr)} ${esc(un)}"><span>${esc(gnr || ' ')}</span><span>${esc(un || ' ')}</span></span>`;
}

function gnrCardHtml(d) {
  if (!d) return '';
  if (d.invalid) return `<div class="card"><p class="err">Gefahrnummer „${esc(d.code)}“ ist ungültig (beginnt mit 2 bis 9).</p></div>`;
  return `<div class="card">
    <div class="card-head"><span class="gnr-code">${esc(d.code)}</span><span class="muted small">Gefahrnummer</span></div>
    ${d.water ? '<div class="water-warn">X = reagiert gefährlich mit Wasser. Wasser nur nach Rücksprache mit Fachberatung einsetzen!</div>' : ''}
    ${d.special ? `<p class="gnr-special">${esc(d.special)}</p>` : ''}
    <ul class="digit-list">${d.parts.map(p => `<li><span class="digit">${esc(p.d)}</span><span>${esc(p.t)}</span></li>`).join('')}</ul>
  </div>`;
}

function hazCardHtml(h, open = true) {
  const cls = classInfo(h.klasse);
  const d = decodeGefahrnummer(h.gefahrnr);
  return `<details class="haz"${open ? ' open' : ''}>
    <summary>${miniTafel(h.gefahrnr, h.un)}<span class="haz-main"><b>${esc(h.name || '(ohne Bezeichnung)')}</b><small>${h.un ? `UN ${esc(h.un)}` : ''}${h.klasse ? ` · Klasse ${esc(h.klasse)}` : ''}</small></span></summary>
    <div class="haz-body">
      ${h.hinweise ? `<div class="note">${esc(h.hinweise)}</div>` : ''}
      ${d && !d.invalid ? `<div class="kv-line"><span class="k">Gefahrnummer ${esc(d.code)}</span><span>${esc(d.special || d.parts.map(p => p.t).join(', '))}</span></div>` : ''}
      ${d && d.water ? '<div class="water-warn">Reagiert gefährlich mit Wasser!</div>' : ''}
      ${cls.map(c => `<div class="kv-line"><span class="k">Klasse ${esc(c.k)}</span><span>${esc(c.t)}</span></div>`).join('')}
    </div>
  </details>`;
}

function tafelResultHtml() {
  const out = [];
  const d = gefState.gnr ? decodeGefahrnummer(gefState.gnr) : null;
  if (gefState.gnr && !d) out.push(`<div class="card"><p class="err">„${esc(gefState.gnr)}“ ist keine gültige Gefahrnummer (2–3 Ziffern, ggf. mit X davor).</p></div>`);
  out.push(gnrCardHtml(d));
  const un = gefState.un;
  if (/^\d{4}$/.test(un)) {
    const hits = state.hazmats.filter(h => h.un === un);
    if (hits.length) out.push(`<div class="section-title">UN ${esc(un)} in der Stoffliste</div>` + hits.map(h => hazCardHtml(h, true)).join(''));
    else out.push(`<div class="card"><p><b>UN ${esc(un)}</b> ist nicht in der Stoffliste${state.hazmats.length ? '' : ' (noch keine Liste importiert)'}.</p>
      <p class="small muted">Nachschlagen z. B. in der <a href="https://gestis.dguv.de" target="_blank" rel="noopener">GESTIS-Stoffdatenbank</a> oder bei der Leitstelle / Fachberatung.</p></div>`);
  } else if (un) {
    out.push('<p class="hint">Die UN-Nummer hat 4 Ziffern.</p>');
  }
  if (!gefState.gnr && !un) {
    out.push(`<div class="card muted-card">
      <p><b>Obere Zahl:</b> Gefahrnummer (Nummer zur Kennzeichnung der Gefahr).<br><b>Untere Zahl:</b> UN-Nummer (Stoffnummer).</p>
      <p class="small muted">Orangefarbene Tafel ohne Zahlen: Gefahrgut ist geladen, der Stoff ist aber nicht angegeben (z. B. Stückgut). Dann Beförderungspapiere und Fahrer befragen.</p>
    </div>`);
  }
  out.push('<p class="hint">Erst Eigenschutz: Abstand halten, Wind im Rücken, GAMS-Regel. Angaben ohne Gewähr.</p>');
  return out.join('');
}

function stoffListHtml() {
  const list = gefState.q ? hazmatMatches(gefState.q) : state.hazmats.slice();
  list.sort((a, b) => naturalCompare(a.un, b.un) || naturalCompare(a.name, b.name));
  if (!list.length) return '<p class="muted small pad">Keine Treffer.</p>';
  return `<p class="muted small">${list.length} Stoffe</p>` + list.slice(0, 300).map(h => hazCardHtml(h, false)).join('')
    + (list.length > 300 ? '<p class="muted small">… bitte Suche eingrenzen.</p>' : '');
}

function wikiHtml() {
  const art = (id, title, body, open = false) => `<details class="wiki" id="wiki-${id}"${open ? ' open' : ''}><summary>${title}</summary><div class="wiki-body">${body}</div></details>`;
  const digitRows = Object.entries(KEMLER_FIRST).map(([d, t]) => `<tr><td class="digit">${d}</td><td>${esc(t)}</td></tr>`).join('');
  const specials = Object.entries(KEMLER_SPECIAL).sort((a, b) => naturalCompare(a[0].replace('X', ''), b[0].replace('X', '')))
    .map(([k, t]) => `<tr><td class="digit">${esc(k)}</td><td>${esc(t)}</td></tr>`).join('');
  return [
    art('gams', 'Erstmaßnahmen: GAMS-Regel', `
      <ol class="steps">
        <li><b>G</b>efahr erkennen – Warntafeln, Gefahrzettel, Geruch, Dämpfe, Beteiligte befragen</li>
        <li><b>A</b>bsperren – Gefahrenbereich festlegen, Zugang verhindern</li>
        <li><b>M</b>enschenrettung durchführen – unter geeignetem Eigenschutz</li>
        <li><b>S</b>pezialkräfte alarmieren – Gefahrstoffzug, Fachberatung, Leitstelle informieren</li>
      </ol>
      <p>Anfahrt möglichst <b>mit dem Wind im Rücken</b> und von oben (Gase können sich in Senken sammeln). Nicht in Dämpfe oder Lachen fahren.</p>`, true),
    art('abstand', 'Absperrbereiche (FwDV 500)', `
      <ul>
        <li><b>Gefahrenbereich:</b> in der Regel <b>50 m</b> um die Gefahrenstelle. Zutritt nur mit geeigneter Schutzausrüstung.</li>
        <li><b>Absperrbereich:</b> in der Regel <b>100 m</b>. Bereitstellung und Dekontamination außerhalb des Gefahrenbereichs.</li>
      </ul>
      <p>Anhaltswerte – bei Explosionsgefahr, großen Mengen oder ungünstigem Wind deutlich vergrößern. Die Umkreissuche auf der Karte hilft beim Abschätzen.</p>`),
    art('aaaa', 'Gefahren an der Einsatzstelle: AAAA-C-EEEE', `
      <ul class="cols">
        <li><b>A</b>temgifte</li><li><b>A</b>ngstreaktion</li><li><b>A</b>usbreitung</li><li><b>A</b>tomare Gefahren</li>
        <li><b>C</b>hemische Stoffe</li>
        <li><b>E</b>rkrankung / Verletzung</li><li><b>E</b>xplosion</li><li><b>E</b>lektrizität</li><li><b>E</b>insturz</li>
      </ul>`),
    art('tafel', 'Warntafel lesen', `
      <div class="tafel-demo">${miniTafel('33', '1203')}<div><p><b>Oben:</b> Gefahrnummer – beschreibt die Gefahr.<br><b>Unten:</b> UN-Nummer – bezeichnet den Stoff.</p></div></div>
      <p>Beispiel: <b>33 / 1203</b> = leicht entzündbarer flüssiger Stoff / Benzin.</p>
      <p>Eine orangefarbene Tafel <b>ohne Zahlen</b> bedeutet: Gefahrgut an Bord, Stoff nicht angegeben (Stückgut). Bei Tankfahrzeugen mit mehreren Kammern können die Tafeln seitlich an den Kammern stehen.</p>`),
    art('gnr', 'Gefahrnummern: Bedeutung der Ziffern', `
      <table class="tbl"><tbody>${digitRows}</tbody></table>
      <ul>
        <li><b>Erste Ziffer:</b> Hauptgefahr. <b>Weitere Ziffern:</b> zusätzliche Gefahren (9 = Gefahr einer spontanen heftigen Reaktion).</li>
        <li><b>Verdopplung</b> einer Ziffer bedeutet eine Verstärkung der Gefahr (z. B. 33, 66, 88).</li>
        <li><b>0 als zweite Ziffer:</b> keine weitere Gefahr (z. B. 30, 60, 80).</li>
        <li><b>X davor:</b> reagiert gefährlich mit Wasser – Wasser nur nach Rücksprache mit Fachberatung.</li>
      </ul>
      <div class="section-title">Häufige Gefahrnummern</div>
      <table class="tbl"><tbody>${specials}</tbody></table>`),
    art('klassen', 'Gefahrgutklassen (ADR)', `
      <table class="tbl"><tbody>${ADR_CLASSES.map(([k, t]) => `<tr><td class="digit">${k}</td><td>${esc(t)}</td></tr>`).join('')}</tbody></table>
      <p class="small muted">2.1, 2.2 und 2.3 bezeichnen die Gefahrzettel der Klasse 2.</p>`),
    art('ghs', 'GHS-Piktogramme (Kennzeichnung von Gebinden)', `
      <div class="ghs-grid">${GHS.map(([c, n, t]) => `<div class="ghs"><span class="ghs-dia"><span>${c.slice(3)}</span></span><span><b>${c} · ${esc(n)}</b><small>${esc(t)}</small></span></div>`).join('')}</div>`),
    art('quellen', 'Weitere Quellen', `
      <ul>
        <li><a href="https://gestis.dguv.de" target="_blank" rel="noopener">GESTIS-Stoffdatenbank</a> (DGUV) – Stoffeigenschaften und Schutzmaßnahmen</li>
        <li><a href="https://www.ericards.net" target="_blank" rel="noopener">ERICards</a> – Notfallmaßnahmen für Einsatzkräfte</li>
        <li>Fachberatung über die Leitstelle, z. B. TUIS (Transport-Unfall-Informations- und Hilfeleistungssystem der chemischen Industrie)</li>
      </ul>
      <p class="small muted">Alle Angaben in dieser App sind Hilfen ohne Gewähr. Maßgeblich sind ADR, FwDV 500, Beförderungspapiere und die Fachberatung.</p>`),
  ].join('');
}

function renderGefahrPage() {
  $$('#page-gefahr [data-act="gef-tab"]').forEach(b => b.classList.toggle('on', b.dataset.tab === gefState.tab));
  $('#gefahr-count').textContent = state.hazmats.length ? `${state.hazmats.length} Stoffe in der Liste` : '';
  const body = $('#gefahr-body');
  if (gefState.tab === 'tafel') {
    body.innerHTML = `<div class="warntafel" role="group" aria-label="Warntafel">
        <input id="gef-gnr" data-input="gef-gnr" value="${esc(gefState.gnr)}" placeholder="33" maxlength="4" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Gefahrnummer (obere Zahl)">
        <input id="gef-un" data-input="gef-un" value="${esc(gefState.un)}" placeholder="1203" maxlength="4" inputmode="numeric" autocomplete="off" aria-label="UN-Nummer (untere Zahl)">
      </div>
      <p class="hint center">Zahlen von der orangefarbenen Warntafel eingeben</p>
      <div id="gef-result">${tafelResultHtml()}</div>`;
  } else if (gefState.tab === 'liste') {
    body.innerHTML = state.hazmats.length ? `<div class="field-search">${IC.search}<input type="search" data-input="gef-q" value="${esc(gefState.q)}" placeholder="UN-Nummer oder Stoffname" autocomplete="off" spellcheck="false"></div>
        <div id="gef-list">${stoffListHtml()}</div>`
      : `<div class="empty">
          <div class="empty-ic">${IC.hazard}</div>
          <h2>Noch keine Stoffliste</h2>
          <p>Die Stoffliste wird über eine CSV- oder Excel-Datei mit den Spalten <b>UN-Nummer; Bezeichnung; Gefahrnummer; Klasse; Hinweise</b> eingerichtet, z. B. mit Stoffen aus Betrieben im Einsatzgebiet.</p>
          <div class="actions wrap center">
            <button class="btn primary" data-act="haz-import">${IC.upload} Liste importieren</button>
            <button class="btn" data-act="haz-template">${IC.file} CSV-Vorlage</button>
            <button class="btn" data-act="haz-demo">${IC.sparkle} Beispielliste</button>
          </div>
          <p class="small muted">Die Beispielliste enthält ${DEMO_HAZMATS.length} gängige Stoffe (Kraftstoffe, Gase, Säuren). Vor dem Einsatz mit aktueller Quelle prüfen.</p>
        </div>`;
  } else {
    body.innerHTML = wikiHtml();
  }
}

Object.assign(ACT, {
  'gef-tab': d => { gefState.tab = d.tab; renderGefahrPage(); $('#gefahr-body').scrollTop = 0; },
  'sr-gefahr': d => {
    clearSearch();
    gefState.tab = 'tafel';
    gefState.gnr = d.gnr || '';
    gefState.un = d.un || '';
    openPage('gefahr');
  },
  'haz-manage': () => openModal(listManageHtml({
    title: 'Stoffliste verwalten', prefix: 'haz', count: state.hazmats.length,
    intro: 'Die Stoffliste wird über eine CSV- oder Excel-Datei mit den Spalten <b>UN-Nummer; Bezeichnung; Gefahrnummer; Klasse; Hinweise</b> eingerichtet.',
  })),
  'haz-import': startListImport,
  'haz-export': () => exportCsv('hazmats'),
  'haz-template': () => exportListTemplate('hazmats'),
  'haz-demo': () => replaceList('hazmats', DEMO_HAZMATS.map(cleanHazmat), 'Beispiel-Stoffliste'),
  'haz-clear': () => { closeModal(); clearList('hazmats', 'Stoffliste'); },
});

function onGefahrInput(t) {
  const k = t.dataset.input;
  if (k === 'gef-gnr') {
    t.value = t.value.toUpperCase().replace(/[^X0-9]/g, '');
    gefState.gnr = t.value;
    if (/^X?\d{2,3}$/.test(t.value) && t.value.replace('X', '').length === 3) $('#gef-un')?.focus();
  } else if (k === 'gef-un') {
    t.value = t.value.replace(/\D/g, '');
    gefState.un = t.value;
  } else if (k === 'gef-q') {
    gefState.q = t.value;
    $('#gef-list').innerHTML = stoffListHtml();
    return;
  }
  $('#gef-result').innerHTML = tafelResultHtml();
}
