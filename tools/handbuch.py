#!/usr/bin/env python3
"""Werkzeuge für das Handbuch (Menü → Handbuch, Inhalt in src/handbuch.html). Braucht Google Chrome.

Aufruf:
  python3 tools/handbuch.py bilder   Screenshots neu erzeugen (src/handbuch/*.jpg): Handy-Format, dunkles Farbschema,
                                     Beispieldaten. Baut vorher die App. Für die Hintergrundkarte wird Internet gebraucht.
  python3 tools/handbuch.py pdf      Handbuch als FireAssist_Handbuch.pdf speichern (nur lokal, steht in der .gitignore)

Chrome wird unter macOS automatisch gefunden, sonst Pfad über die Umgebungsvariable CHROME angeben.
Die JPG-Umwandlung nutzt das macOS-Werkzeug sips.
"""
import functools
import html
import http.server
import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile
import threading

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
WEB = ROOT / "web"
IMG = SRC / "handbuch"
PDF = ROOT / "FireAssist_Handbuch.pdf"

# Handy-Format: 390 × 844 CSS-Pixel, gespeichert mit max. 1200 px Höhe.
# Headless-Chrome hat auf dem Mac mindestens 500 px Fensterbreite, deshalb liegt die App in einem iframe
# in der Mitte eines größeren Fensters (IFRAME_LEFT/TOP) und das Bild wird danach mittig zugeschnitten.
WIDTH, HEIGHT, SCALE, MAX_PX = 390, 844, 2, 1200
WINDOW = (500, 1100)
IFRAME_LEFT, IFRAME_TOP = (WINDOW[0] - WIDTH) // 2, (WINDOW[1] - HEIGHT) // 2


def chrome():
    for c in (os.environ.get("CHROME"), "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
              shutil.which("google-chrome"), shutil.which("chromium")):
        if c and pathlib.Path(c).exists():
            return c
    raise SystemExit("Google Chrome nicht gefunden (Umgebungsvariable CHROME setzen)")


# ---------- Screenshots ----------

# Läuft im Browser: lädt die App in einem iframe (gleiche Herkunft), bedient sie über ihre eigenen Funktionen
# und markiert Knöpfe mit nummerierten gelben Ringen. Der Screenshot entsteht nach Ablauf der virtuellen Zeit.
HARNESS = r"""<!DOCTYPE html><meta charset="utf-8">
<style>
html, body { margin: 0; height: 100%; overflow: hidden; background: #000; }
iframe { border: 0; position: fixed; left: __LEFT__px; top: __TOP__px; width: __W__px; height: __H__px; }
.mk { position: fixed; border: 3px solid #ffd400; border-radius: 14px; box-shadow: 0 0 0 2px rgba(0,0,0,.6); pointer-events: none; }
.mk b { position: absolute; top: -13px; left: -13px; width: 24px; height: 24px; border-radius: 50%; background: #ffd400; color: #111;
  font: 800 14px/24px system-ui, sans-serif; text-align: center; box-shadow: 0 0 0 2px rgba(0,0,0,.6); }
.mk.r b { left: auto; right: -13px; }
</style>
<body><script>
localStorage.clear();
localStorage.setItem('fireassist.settings.v1', JSON.stringify({ theme: 'dark' }));
const shot = new URLSearchParams(location.search).get('shot');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let W;
const run = code => W.eval(code);
const q = s => (typeof s === 'string' ? W.document.querySelector(s) : s);

function mark(sel, n, { pad = 4, right = false } = {}) {
  const e = q(sel);
  if (!e) throw new Error('nicht gefunden: ' + sel);
  const r = e.getBoundingClientRect(), o = f.getBoundingClientRect();
  const m = document.createElement('div');
  m.className = 'mk' + (right ? ' r' : '');
  Object.assign(m.style, { left: o.left + r.left - pad + 'px', top: o.top + r.top - pad + 'px', width: r.width + 2 * pad - 6 + 'px', height: r.height + 2 * pad - 6 + 'px' });
  m.innerHTML = n ? `<b>${n}</b>` : '';
  document.body.appendChild(m);
}

function type(sel, text) {
  const e = q(sel);
  e.value = text;
  e.dispatchEvent(new W.Event('input', { bubbles: true }));
}

const view = (lat, lon, z) => run(`map.setView([${lat}, ${lon}], ${z}, { animate: false })`);

const SHOTS = {
  async karte() {
    view(50.5517, 9.6745, 16); await sleep(2500);
    mark('.topbar [data-act="open-menu"]', 1, { pad: 1 });
    mark('#search', 2, { pad: 2 });
    mark('.topbar [data-act="layers"]', 3, { pad: 1, right: true });
    mark('.fab-radius', 4, { right: true });
    mark('[data-act="locate"]', 5, { right: true });
    mark('#tabbar', 6, { pad: -2 });
  },
  async legende() { run(`ACT['open-legend'](); $('#sheet').classList.add('expanded')`); await sleep(2500); },
  async hydrant() {
    view(50.55163, 9.675484, 18); run(`selectSource('BSP-H-006')`); await sleep(2500);
    mark('#sheet .sh-head', 1, { pad: 0 });
    mark('#sheet .badges', 2, { pad: 2 });
    mark('#sheet .kv-grid', 3, { pad: 2 });
  },
  async ebenen() { view(50.5517, 9.6745, 16); run(`toggleLayerPop(true)`); await sleep(2500); },
  async suche() { view(50.5517, 9.6745, 16); type('#search', 'Haupt'); await sleep(2500); },
  async 'umkreis-setzen'() { view(50.5517, 9.6745, 16); run(`enterPickMode()`); await sleep(2500); mark('.pill-act', 0, { pad: 2 }); },
  async umkreis() {
    run(`setRadiusPoint(50.5521, 9.6738, 'Hauptstraße 10')`); await sleep(1500);
    run(`fitBoundsVisible(L.latLng(ui.radius.lat, ui.radius.lon).toBounds(settings.radius * 2.2), 18)`); await sleep(2000);
    mark('#sheet .chips', 1, { pad: 3 });
    mark('#sheet .summary', 2, { pad: 3 });
    mark('#sheet .res-list .res', 3, { pad: 2 });
  },
  async liste() { run(`ACT['open-list']()`); await sleep(2000); },
  async menue() { run(`ACT['open-menu']()`); await sleep(2000); },
  async funk() {
    run(`openPage('funk')`); await sleep(1500);
    mark('#funk-tools .field-search', 1, { pad: 2 });
    mark('#funk-orte-btn', 2, { pad: 2, right: true });
    mark('[data-act="funk-view"]', 3, { pad: 0 });
    mark('#funk-edit-btn', 4, { pad: 0 });
    mark('[data-act="funk-manage"]', 4, { pad: 0, right: true });
  },
  async 'funk-ansicht'() { run(`openPage('funk')`); await sleep(800); run(`ACT['funk-view']()`); await sleep(1200); },
  async 'funk-orte'() { run(`openPage('funk')`); await sleep(800); run(`ACT['funk-orte']()`); await sleep(1200); },
  async warntafel() { run(`gefState.tab = 'tafel'; gefState.gnr = '33'; gefState.un = '1203'; openPage('gefahr')`); await sleep(1500); },
  async stoffliste() {
    run(`gefState.tab = 'liste'; gefState.q = 'benzin'; openPage('gefahr')`); await sleep(1000);
    run(`$('#gef-list details').open = true`); await sleep(800);
  },
  async daten() { run(`ACT['open-daten']()`); await sleep(2000); mark('#sheet [data-act="toggle-edit"]', 0, { pad: 0 }); },
  async bearbeiten() {
    view(50.5512, 9.6725, 17); run(`setEditMode(true)`); await sleep(2500);
    mark('.pill-edit [data-act="edit-gps"]', 1, { pad: 3 });
    mark('.pill-edit [data-act="edit-off"]', 2, { pad: 3, right: true });
  },
  async neu() {
    view(50.5512, 9.6725, 18); run(`setEditMode(true)`); await sleep(500);
    run(`startNewSource(L.latLng(50.55085, 9.6726))`); await sleep(800);
    run(`focusLatLng([50.55085, 9.6726], 18)`); await sleep(2500);
  },
  async verbinden() {
    view(50.5520, 9.6713, 17); run(`setEditMode(true); startConnect('BSP-H-012')`); await sleep(2500);
    mark('.pill-act', 0, { pad: 2 });
  },
  async leitung() {
    view(50.5519, 9.6712, 18); run(`setEditMode(true); selectPipe(findPipe('BSP-H-012', 'BSP-H-013'))`); await sleep(800);
    run(`focusLatLng([50.552028, 9.6713135], 18)`); await sleep(2500);
  },
  async 'funk-bearbeiten'() {
    run(`openPage('funk')`); await sleep(800); run(`funkState.edit = true; renderFunkPage()`); await sleep(1000);
    mark('#funk-editbar', 0, { pad: -1 });
    mark('#funk-list .veh-add', 0, { pad: 2 });
  },
  async fahrzeug() {
    run(`openPage('funk')`); await sleep(800); run(`funkState.edit = true; renderFunkPage()`); await sleep(500);
    q('#funk-list .veh-add').click(); await sleep(500);
    type('#veh-form [name="funkname"]', 'Florian Musterstadt 17-44-3');
    type('#veh-form [name="art"]', 'LF 10');
    run(`document.activeElement.blur()`); await sleep(800);
  },
  async 'funk-verwalten'() { run(`openPage('funk')`); await sleep(800); run(`ACT['funk-manage']()`); await sleep(1200); },
  async import() {
    run(`state = emptyState(); reindex(); commit()`);
    const files = [];
    for (const n of ['Hydranten_Beispiel.csv', 'Leitungen_Beispiel.csv']) {
      const text = await (await fetch('__beispiel/' + n)).text();
      files.push(new W.File([text], n, { type: 'text/csv' }));
    }
    run('importFiles')(files); await sleep(2500);
  },
  async offline() { view(50.5517, 9.6745, 16); run(`ACT['offline-open']()`); await sleep(3000); },
  async handbuch() {
    run(`openPage('handbuch')`); await sleep(800);
    type('#hb-q', 'knoten'); await sleep(1000);
    mark('#page-handbuch .field-search', 1, { pad: 2 });
    mark('[data-act="hb-toc"]', 2, { pad: 0, right: true });
  },
  async einstellungen() { run(`ACT['open-settings']()`); await sleep(2000); },
};

const f = document.createElement('iframe');
f.src = 'index.html';
f.onload = async () => {
  W = f.contentWindow;
  await sleep(1000);
  const st = W.document.createElement('style');
  st.textContent = '#toast { display: none !important; }';
  W.document.head.appendChild(st);
  run(`const d = normalizeState(DEMO_DATA); state.sources = d.sources; state.pipes = d.pipes;
    state.vehicles = DEMO_VEHICLES.map(cleanVehicle); state.hazmats = DEMO_HAZMATS.map(cleanHazmat);
    commit(); closeSheet(); fitData();`);
  await sleep(800);
  try { await SHOTS[shot](); } catch (e) { document.title = 'FEHLER ' + e.message; console.error(e); }
};
document.body.appendChild(f);
</script>"""

SHOTS = re.findall(r"^  async '?([\w-]+)'?\(\)", HARNESS, flags=re.M)


class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/__shot.html":
            page = HARNESS.replace("__LEFT__", str(IFRAME_LEFT)).replace("__TOP__", str(IFRAME_TOP)) \
                .replace("__W__", str(WIDTH)).replace("__H__", str(HEIGHT))
            return self.send_bytes(page.encode("utf-8"), "text/html; charset=utf-8")
        if path.startswith("/__beispiel/"):
            name = pathlib.Path(path).name
            return self.send_bytes((ROOT / "beispiel" / name).read_bytes(), "text/csv; charset=utf-8")
        return super().do_GET()

    def send_bytes(self, data, ctype):
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, *args):
        pass


def bilder(names):
    subprocess.run([sys.executable, str(ROOT / "build.py")], check=True)
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Handler, directory=str(WEB)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    port = server.server_address[1]
    IMG.mkdir(exist_ok=True)
    exe = chrome()
    try:
        for name in names or SHOTS:
            if name not in SHOTS:
                raise SystemExit(f"Unbekannter Screenshot: {name} (vorhanden: {', '.join(SHOTS)})")
            with tempfile.TemporaryDirectory() as tmp:
                png = pathlib.Path(tmp) / "shot.png"
                subprocess.run([exe, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
                                f"--user-data-dir={tmp}/profil", f"--window-size={WINDOW[0]},{WINDOW[1]}",
                                f"--force-device-scale-factor={SCALE}", "--virtual-time-budget=15000",
                                f"--screenshot={png}", f"http://127.0.0.1:{port}/__shot.html?shot={name}"],
                               check=True, capture_output=True, timeout=120)
                out = IMG / f"{name}.jpg"
                crop = ["-c", str(HEIGHT * SCALE), str(WIDTH * SCALE)]
                subprocess.run(["sips", *crop, str(png)], check=True, capture_output=True)
                subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "60", "-Z", str(MAX_PX),
                                str(png), "--out", str(out)], check=True, capture_output=True)
            print(f"{out.relative_to(ROOT)} ({out.stat().st_size / 1024:.0f} KB)")
    finally:
        server.shutdown()


# ---------- PDF ----------

PDF_CSS = """
@page { size: A5; margin: 14mm 12mm 16mm; }
body { font: 10.5pt/1.45 system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #17181b; }
h1 { font-size: 22pt; margin: 30mm 0 4mm; color: #c8102e; }
.sub { color: #50535a; font-size: 12pt; }
.toc { page-break-before: always; }
.toc ol { padding-left: 18px; } .toc ul { list-style: none; padding-left: 0; margin: 0 0 4px; }
.toc li { margin: 1px 0; } .toc a { color: #17181b; text-decoration: none; } .toc > ol > li > a { font-weight: 700; }
.hb-sec { page-break-before: always; }
h2 { font-size: 16pt; border-top: 2px solid #c8102e; padding-top: 4px; margin: 0 0 4px; }
h3 { font-size: 12.5pt; margin: 14px 0 4px; page-break-after: avoid; }
h4 { font-size: 10.5pt; margin: 10px 0 2px; page-break-after: avoid; }
p, li { color: #2a2c31; } li { margin: 2px 0; }
a { color: #1a5fb4; }
.ui { padding: 0 4px; border-radius: 4px; background: #e9e8e4; font-weight: 650; white-space: nowrap; }
.hb-tip, .hb-warn { border-left: 3px solid #1a5fb4; background: #e5eefb; padding: 6px 9px; border-radius: 6px; margin: 8px 0; page-break-inside: avoid; }
.hb-warn { border-left-color: #b25e00; background: #fdf0dc; }
.hb-tip p, .hb-warn p { margin: 0; }
.hb-shot { text-align: center; margin: 10px 0; page-break-inside: avoid; }
.hb-shot img { height: 105mm; border-radius: 12px; border: 3px solid #000; }
.hb-shot figcaption { font-size: 8.5pt; color: #80838b; }
.hb-legend { list-style: none; padding-left: 0; }
.hb-legend li { display: flex; gap: 6px; }
.hb-num { flex: none; width: 16px; height: 16px; border-radius: 50%; background: #ffd400; font-weight: 800; font-size: 8pt; text-align: center; line-height: 16px; }
table { border-collapse: collapse; width: 100%; font-size: 9.5pt; page-break-inside: avoid; }
th, td { text-align: left; vertical-align: top; padding: 3px 4px; border-bottom: 1px solid #dddcd7; }
th { color: #80838b; }
"""


def pdf():
    body = re.sub(r"<!--.*?-->", "", (SRC / "handbuch.html").read_text(encoding="utf-8"), flags=re.S)
    body = re.sub(r'src="(handbuch/[^"]+)"', lambda m: f'src="{(SRC / m.group(1)).as_uri()}"', body)
    body = re.sub(r'data-act="hb-goto" data-to="([^"]+)"', r'href="#\1"', body)
    body = body.replace(' loading="lazy"', "")
    toc = []
    for sec in re.finditer(r'<section class="hb-sec" id="([^"]+)">\s*<h2>(.*?)</h2>(.*?)</section>', body, flags=re.S):
        topics = re.findall(r'<div class="hb-topic" id="([^"]+)">\s*<h3>(.*?)</h3>', sec.group(3))
        toc.append(f'<li><a href="#{sec.group(1)}">{sec.group(2)}</a><ul>'
                   + "".join(f'<li><a href="#{i}">{t}</a></li>' for i, t in topics) + "</ul></li>")
    doc = f"""<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>FireAssist – Handbuch</title>
<style>{PDF_CSS}</style></head><body>
<h1>FireAssist – Handbuch</h1><p class="sub">Digitaler Hydrantenplan, Funkrufnamen und Gefahrstoffe.<br>Bedienung Schritt für Schritt.</p>
<p class="sub">{html.escape("Alle Angaben ohne Gewähr. Screenshots zeigen erfundene Beispieldaten.")}</p>
<nav class="toc"><h2>Inhalt</h2><ol>{"".join(toc)}</ol></nav>
{body}</body></html>"""
    with tempfile.TemporaryDirectory() as tmp:
        page = pathlib.Path(tmp) / "handbuch.html"
        page.write_text(doc, encoding="utf-8")
        subprocess.run([chrome(), "--headless=new", "--disable-gpu", "--no-first-run", f"--user-data-dir={tmp}/profil",
                        "--no-pdf-header-footer", f"--print-to-pdf={PDF}", page.as_uri()],
                       check=True, capture_output=True, timeout=120)
    print(f"{PDF.name} geschrieben ({PDF.stat().st_size / 1024:.0f} KB)")


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "bilder":
        bilder(sys.argv[2:])
    elif cmd == "pdf":
        pdf()
    else:
        raise SystemExit(__doc__)


if __name__ == "__main__":
    main()
