#!/usr/bin/env python3
"""Baut FireAssist aus src/:

- FireAssist.html  eine einzige Datei für PC/Laptop (Doppelklick)
- web/             Version für einen Webserver: auf Handys als App installierbar und offline nutzbar
- ios/             iPhone-App (Xcode-Projekt), enthält FireAssist.html – kein Server nötig

Aufruf:
  python3 build.py                                   App ohne Daten
  python3 build.py --daten FireAssist_Sicherung.json Datenstand fest einbauen (Sicherung aus der App)
"""
import datetime
import hashlib
import json
import pathlib
import re
import struct
import sys
import zlib

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "src"
OUT = ROOT / "FireAssist.html"
WEB = ROOT / "web"


def read(rel):
    return (SRC / rel).resolve().read_text(encoding="utf-8")


def inline_css(block):
    files = re.findall(r'href="([^"]+)"', block)
    css = "\n".join(read(f) for f in files)
    # Leaflet verweist auf Bilddateien, die hier nicht gebraucht werden
    css = re.sub(r"url\(images/[^)]*\)", "none", css)
    return "<style>\n" + css + "\n</style>"


def inline_js(block):
    parts = []
    for f in re.findall(r'src="([^"]+)"', block):
        js = read(f).replace("</script", "<\\/script")
        parts.append(f"<script>/* {pathlib.Path(f).name} */\n{js}\n</script>")
    return "\n".join(parts)


# ---------- App-Symbol als PNG (ohne Zusatzbibliotheken) ----------

RED = (200, 16, 46)
WHITE = (255, 255, 255)


def icon_color(x, y):
    """Hydranten-Symbol im 32er-Raster (wie das Logo in der App)."""
    if (x - 16) ** 2 + (y - 17.2) ** 2 <= 1.6 ** 2:
        return RED
    white = (
        ((x - 16) ** 2 + (y - 11.5) ** 2 <= 3.8 ** 2 and y <= 11.5)
        or (11.2 <= x <= 20.8 and 11.5 <= y <= 13.7)
        or (12.2 <= x <= 19.8 and 13.7 <= y <= 23)
        or (11.1 <= x <= 21 and 23 <= y <= 25.3)
        or (8.6 <= x <= 12.2 and 15.4 <= y <= 18.8)
        or (19.8 <= x <= 23.4 and 15.4 <= y <= 18.8)
    )
    return WHITE if white else RED


def write_icon(path, size, ss=3):
    scale = 32 / size
    rows = []
    for py in range(size):
        row = bytearray()
        for px in range(size):
            acc = [0, 0, 0]
            for sy in range(ss):
                for sx in range(ss):
                    c = icon_color((px + (sx + 0.5) / ss) * scale, (py + (sy + 0.5) / ss) * scale + 0.6)
                    acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2]
            n = ss * ss
            row += bytes((acc[0] // n, acc[1] // n, acc[2] // n))
        rows.append(bytes(row))
    raw = b"".join(b"\x00" + r for r in rows)

    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)) \
        + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
    path.write_bytes(png)


def build_web(html):
    WEB.mkdir(exist_ok=True)
    head = ('<link rel="manifest" href="manifest.webmanifest">\n'
            '<link rel="apple-touch-icon" href="apple-touch-icon.png">\n'
            '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n')
    version = hashlib.sha1(html.encode("utf-8")).hexdigest()[:12]
    head += f'<meta name="fa-build" content="{version}">\n'
    web_html = html.replace("</title>", "</title>\n" + head, 1)
    (WEB / "index.html").write_text(web_html, encoding="utf-8")
    (WEB / "sw.js").write_text(read("sw.js").replace("__BUILD__", version), encoding="utf-8")
    manifest = {
        "name": "FireAssist – Hydrantenplan",
        "short_name": "FireAssist",
        "description": "Digitaler Hydrantenplan, Funkrufnamen und Gefahrstoffe",
        "lang": "de",
        "start_url": "./",
        "scope": "./",
        "display": "standalone",
        "background_color": "#f4f3f0",
        "theme_color": "#c8102e",
        "icons": [
            {"src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
            {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
            {"src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable"},
            {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
        ],
    }
    (WEB / "manifest.webmanifest").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    for name, size in (("icon-192.png", 192), ("icon-512.png", 512), ("apple-touch-icon.png", 180)):
        if not (WEB / name).exists():
            write_icon(WEB / name, size, ss=2 if size > 300 else 3)
    print(f"web/ geschrieben (index.html {len(web_html) / 1024:.0f} KB, sw.js, manifest, Symbole)")


def embed_data(html, path):
    """Baut eine Sicherung (Menü → Sicherung speichern) als Datenstand in die App ein."""
    obj = json.loads(pathlib.Path(path).read_text(encoding="utf-8-sig"))
    data = obj.get("data", obj)
    if not isinstance(data.get("sources"), list):
        raise SystemExit(f"{path}: keine FireAssist-Sicherung")
    stamp = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    payload = json.dumps({"stamp": stamp, "data": data}, ensure_ascii=False).replace("<", "\\u003c")
    html, n = re.subn(r'(<script id="fa-data" type="application/json">).*?(</script>)',
                      lambda m: m.group(1) + payload + m.group(2), html, count=1, flags=re.S)
    if n != 1:
        raise SystemExit("Fehler: Platzhalter für Daten nicht gefunden")
    counts = ", ".join(f"{len(data.get(k) or [])} {label}" for k, label in
                       (("sources", "Entnahmestellen"), ("pipes", "Leitungen"), ("vehicles", "Funkrufnamen"), ("hazmats", "Gefahrstoffe")))
    print(f"Datenstand eingebaut: {counts}")
    return html


def main():
    html = read("index.html")
    html = re.sub(r"<!-- build:css -->(.*?)<!-- /build:css -->", lambda m: inline_css(m.group(1)), html, flags=re.S)
    html = re.sub(r"<!-- build:js -->(.*?)<!-- /build:js -->", lambda m: inline_js(m.group(1)), html, flags=re.S)
    if "<script src=" in html or 'rel="stylesheet"' in html:
        raise SystemExit("Fehler: nicht alle Dateien wurden eingebettet")
    if "--daten" in sys.argv:
        i = sys.argv.index("--daten")
        if i + 1 >= len(sys.argv):
            raise SystemExit("Aufruf: python3 build.py --daten <Sicherung.json>")
        html = embed_data(html, sys.argv[i + 1])
    OUT.write_text(html, encoding="utf-8")
    print(f"{OUT.name} geschrieben ({OUT.stat().st_size / 1024:.0f} KB)")
    build_web(html)
    # iPhone-App (ios/) nutzt FireAssist.html direkt; nur das App-Symbol wird hier erzeugt
    ios_icon = ROOT / "ios" / "FireAssist" / "Assets.xcassets" / "AppIcon.appiconset" / "icon-1024.png"
    if ios_icon.parent.exists() and not ios_icon.exists():
        write_icon(ios_icon, 1024, ss=2)
        print("iOS-App-Symbol erzeugt")


if __name__ == "__main__":
    main()
