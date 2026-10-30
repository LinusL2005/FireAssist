'use strict';
/* Handbuch für Nutzer: Inhalt aus src/handbuch.html, beim Bauen in <template id="fa-handbuch"> eingesetzt
   (Bilder als data-URL). Inhaltsverzeichnis und Suche entstehen hier aus den Überschriften. */

PAGES.handbuch = { title: 'Handbuch', render: () => renderHandbuch() };

const hbState = { q: '', ready: false };

function hbTemplate() {
  const t = document.getElementById('fa-handbuch');
  return t && t.content.querySelector('.hb-sec') ? t : null;
}

/* Kapitel (h2) mit Themen (h3) für Inhaltsverzeichnis und Suche */
function hbChapters() {
  return $$('#hb-body .hb-sec').map(sec => ({
    id: sec.id,
    title: sec.querySelector('h2').textContent,
    topics: $$('.hb-topic', sec).map(t => ({ id: t.id, title: t.querySelector('h3').textContent, el: t })),
  }));
}

function hbTocHtml() {
  return `<nav class="hb-toc" id="hb-toc" aria-label="Inhaltsverzeichnis"><div class="section-title">Inhalt</div><ol>${hbChapters().map(c => `
    <li><button class="hb-toc-ch" data-act="hb-goto" data-to="${esc(c.id)}">${esc(c.title)}</button>
      ${c.topics.length ? `<ul>${c.topics.map(t => `<li><button data-act="hb-goto" data-to="${esc(t.id)}">${esc(t.title)}</button></li>`).join('')}</ul>` : ''}</li>`).join('')}
  </ol></nav>`;
}

function renderHandbuch() {
  const body = $('#hb-body');
  if (!hbState.ready) {
    const tpl = hbTemplate();
    if (!tpl) {
      body.innerHTML = '<div class="empty"><p>Das Handbuch ist nur in der fertigen App enthalten (nicht in der Entwicklungsversion).</p></div>';
      return;
    }
    body.innerHTML = '<div id="hb-results" hidden></div><div id="hb-doc"></div>';
    $('#hb-doc').appendChild(tpl.content.cloneNode(true));
    $('#hb-doc').insertAdjacentHTML('afterbegin', hbTocHtml());
    hbState.ready = true;
  }
  hbSearch();
}

/* ---------- Suche ---------- */

const hbNorm = s => s.toLowerCase().replace(/\s+/g, ' ');

/* Text eines Themas für die Suche; nach Absätzen und Tabellenzellen ein Leerzeichen, damit Wörter nicht zusammenkleben */
const hbTexts = new Map();
function hbText(el) {
  if (!hbTexts.has(el)) {
    const c = el.cloneNode(true);
    c.querySelector('h3')?.remove();
    $$('p, li, td, th, h4, figcaption', c).forEach(b => b.append(' '));
    hbTexts.set(el, c.textContent.replace(/\s+/g, ' ').trim());
  }
  return hbTexts.get(el);
}

function hbMark(text, words) {
  let html = esc(text);
  for (const w of words) {
    const re = new RegExp(esc(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    html = html.replace(re, m => `<mark>${m}</mark>`);
  }
  return html;
}

function hbSnippet(text, word) {
  const i = hbNorm(text).indexOf(word);
  let a = Math.max(0, i - 50), b = Math.min(text.length, Math.max(i, 0) + 110);
  /* an Wortgrenzen schneiden */
  if (a) a = text.indexOf(' ', a) + 1 || a;
  if (b < text.length) b = text.lastIndexOf(' ', b) > a ? text.lastIndexOf(' ', b) : b;
  return (a ? '… ' : '') + text.slice(a, b).trim() + (b < text.length ? ' …' : '');
}

function hbSearch() {
  const res = $('#hb-results'), doc = $('#hb-doc');
  if (!res) return;
  const words = hbNorm(hbState.q).trim().split(' ').filter(Boolean);
  if (!words.length) { res.hidden = true; doc.hidden = false; return; }
  const hits = [];
  for (const c of hbChapters()) {
    for (const t of c.topics) {
      const text = hbText(t.el);
      const hay = hbNorm(t.title + ' ' + text);
      if (!words.every(w => hay.includes(w))) continue;
      /* Treffer in der Überschrift zuerst */
      const score = words.filter(w => hbNorm(t.title).includes(w)).length;
      hits.push({ c, t, score, snippet: hbSnippet(text, words[0]) });
    }
  }
  hits.sort((x, y) => y.score - x.score);
  res.innerHTML = `<p class="muted small">${hits.length ? `${plural(hits.length, 'Treffer', 'Treffer')}` : 'Keine Treffer.'}</p>`
    + hits.map(h => `<button class="hb-hit" data-act="hb-goto" data-to="${esc(h.t.id)}">
        <span class="hb-hit-ch">${esc(h.c.title)}</span>
        <b>${hbMark(h.t.title, words)}</b>
        <span class="hb-hit-txt">${hbMark(h.snippet, words)}</span></button>`).join('');
  res.hidden = false;
  doc.hidden = true;
}

function hbGoto(id) {
  if (hbState.q) {
    hbState.q = '';
    $('#hb-q').value = '';
    hbSearch();
  }
  const target = document.getElementById(id);
  if (!target) return;
  const body = $('#hb-body');
  body.scrollTop = target.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop - 8;
  target.classList.remove('hb-flash');
  void target.offsetWidth;
  target.classList.add('hb-flash');
}

Object.assign(ACT, {
  'hb-goto': d => hbGoto(d.to),
  'hb-toc': () => hbGoto('hb-toc'),
});

document.getElementById('hb-q').addEventListener('input', debounce(e => {
  hbState.q = e.target.value;
  hbSearch();
  $('#hb-body').scrollTop = 0;
}, 150));
