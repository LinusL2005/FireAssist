#!/usr/bin/env python3
"""Baut FireAssist.apk (Android-App ohne Server) aus FireAssist.html.

Vorher die App bauen (python3 build.py, ggf. mit --daten), dann:
  python3 android/build_apk.py

Benötigt: Android-SDK (platforms;android-34 und build-tools) und ein JDK.
Beim ersten Lauf wird ein Signaturschlüssel in android/signing/ angelegt.
Diesen Ordner gut aufbewahren: Updates der App lassen sich nur mit demselben Schlüssel installieren.
"""
import datetime
import os
import pathlib
import secrets
import shutil
import struct
import subprocess
import sys
import zipfile
import zlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
AND = ROOT / "android"
BUILD = AND / "build"
SIGNING = AND / "signing"
OUT = ROOT / "FireAssist.apk"
PLATFORM = "android-34"
MIN_SDK, TARGET_SDK = 24, 34
VERSION_NAME = "1.0"

sys.path.insert(0, str(ROOT))
from build import icon_color, write_icon  # noqa: E402  (App-Symbol wie in Web- und iPhone-Version)


def find_sdk():
    for p in (os.environ.get("ANDROID_HOME"), os.environ.get("ANDROID_SDK_ROOT"), pathlib.Path.home() / "Library/Android/sdk"):
        if p and (pathlib.Path(p) / "platforms" / PLATFORM / "android.jar").exists():
            return pathlib.Path(p)
    raise SystemExit(f"Android-SDK mit {PLATFORM} nicht gefunden (ANDROID_HOME setzen).")


def find_java_home():
    if os.environ.get("JAVA_HOME"):
        return pathlib.Path(os.environ["JAVA_HOME"])
    return pathlib.Path(subprocess.check_output(["/usr/libexec/java_home"], text=True).strip())


def run(*cmd):
    print("  ·", pathlib.Path(str(cmd[0])).name, *[c for c in cmd[1:2]])
    subprocess.run([str(c) for c in cmd], check=True, env=ENV)


# ---------- Symbole ----------

def write_foreground(path, size, ss=3):
    """Vordergrund für das Android-„adaptive icon“: weißer Hydrant auf transparentem Grund.
    Die Fläche ist 108 dp groß; das 32er-Logo füllt die inneren 72 dp (sichtbarer Bereich)."""
    white, red = (255, 255, 255), (200, 16, 46)

    def color(x, y):
        if not (0 <= x <= 32 and 0 <= y <= 32):
            return None
        if (x - 16) ** 2 + (y - 17.2) ** 2 <= 1.6 ** 2:
            return red
        return white if icon_color(x, y) == white else None

    rows = []
    for py in range(size):
        row = bytearray()
        for px in range(size):
            hits = []
            for sy in range(ss):
                for sx in range(ss):
                    x = ((px + (sx + 0.5) / ss) / size * 108 - 18) * 32 / 72
                    y = ((py + (sy + 0.5) / ss) / size * 108 - 18) * 32 / 72 + 0.6
                    c = color(x, y)
                    if c:
                        hits.append(c)
            if hits:
                k = len(hits)
                row += bytes((sum(c[0] for c in hits) // k, sum(c[1] for c in hits) // k,
                              sum(c[2] for c in hits) // k, 255 * k // (ss * ss)))
            else:
                row += b"\0\0\0\0"
        rows.append(bytes(row))
    raw = b"".join(b"\x00" + r for r in rows)

    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    path.write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
                     + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))


def make_icons(res):
    for name, scale in (("mdpi", 1), ("hdpi", 1.5), ("xhdpi", 2), ("xxhdpi", 3), ("xxxhdpi", 4)):
        d = res / f"mipmap-{name}"
        d.mkdir(parents=True, exist_ok=True)
        write_icon(d / "ic_launcher.png", int(48 * scale))
        write_foreground(d / "ic_launcher_foreground.png", int(108 * scale))


# ---------- Signatur ----------

def keystore():
    SIGNING.mkdir(exist_ok=True)
    ks, pw_file = SIGNING / "fireassist-release.jks", SIGNING / "passwort.txt"
    if not ks.exists():
        pw = secrets.token_urlsafe(18)
        run(JAVA_HOME / "bin" / "keytool", "-genkeypair", "-keystore", ks, "-alias", "fireassist", "-keyalg", "RSA",
            "-keysize", "3072", "-validity", "10950", "-storepass", pw, "-keypass", pw,
            "-dname", "CN=FireAssist, O=Feuerwehr, C=DE")
        pw_file.write_text(pw + "\n")
        (SIGNING / "LIESMICH.txt").write_text(
            "Signaturschlüssel der FireAssist-Android-App.\n"
            "Diesen Ordner sicher aufbewahren (z. B. Sicherungskopie auf USB-Stick).\n"
            "Ohne diesen Schlüssel lassen sich Updates nicht über die installierte App installieren.\n"
            "Nicht weitergeben: Wer den Schlüssel hat, kann Updates erstellen, die Android als echt ansieht.\n")
        print("  Neuer Signaturschlüssel angelegt: android/signing/ (bitte sichern!)")
    return ks, pw_file.read_text().strip()


def main():
    global ENV, JAVA_HOME
    html = ROOT / "FireAssist.html"
    if not html.exists():
        raise SystemExit("FireAssist.html fehlt – zuerst python3 build.py ausführen.")
    sdk = find_sdk()
    JAVA_HOME = find_java_home()
    ENV = dict(os.environ, JAVA_HOME=str(JAVA_HOME), PATH=f"{JAVA_HOME / 'bin'}:{os.environ.get('PATH', '')}")
    bt = sorted((p for p in (sdk / "build-tools").iterdir() if p.is_dir()), key=lambda p: [int(x) if x.isdigit() else 0 for x in p.name.replace("-", ".").split(".")])[-1]
    android_jar = sdk / "platforms" / PLATFORM / "android.jar"

    print("FireAssist.apk wird gebaut …")
    shutil.rmtree(BUILD, ignore_errors=True)
    (BUILD / "assets").mkdir(parents=True)
    shutil.copy(html, BUILD / "assets" / "FireAssist.html")
    shutil.copytree(AND / "res", BUILD / "res")
    make_icons(BUILD / "res")

    version_code = int(datetime.datetime.now().strftime("%y%m%d%H"))
    run(bt / "aapt2", "compile", "--dir", BUILD / "res", "-o", BUILD / "res.zip")
    run(bt / "aapt2", "link", "-o", BUILD / "base.apk", "-I", android_jar, "--manifest", AND / "AndroidManifest.xml",
        "-A", BUILD / "assets", "--min-sdk-version", MIN_SDK, "--target-sdk-version", TARGET_SDK,
        "--version-code", version_code, "--version-name", f"{VERSION_NAME} ({datetime.date.today():%d.%m.%Y})", BUILD / "res.zip")

    sources = sorted((AND / "src").rglob("*.java"))
    run(JAVA_HOME / "bin" / "javac", "--release", "11", "-nowarn", "-encoding", "UTF-8", "-classpath", android_jar,
        "-d", BUILD / "classes", *sources)
    classes = sorted((BUILD / "classes").rglob("*.class"))
    (BUILD / "dex").mkdir()
    run(bt / "d8", "--release", "--min-api", MIN_SDK, "--lib", android_jar, "--output", BUILD / "dex", *classes)
    with zipfile.ZipFile(BUILD / "base.apk", "a", zipfile.ZIP_DEFLATED) as z:
        z.write(BUILD / "dex" / "classes.dex", "classes.dex")

    run(bt / "zipalign", "-p", "-f", "4", BUILD / "base.apk", BUILD / "aligned.apk")
    ks, pw = keystore()
    run(bt / "apksigner", "sign", "--ks", ks, "--ks-key-alias", "fireassist", "--ks-pass", f"pass:{pw}",
        "--key-pass", f"pass:{pw}", "--v4-signing-enabled", "false", "--out", OUT, BUILD / "aligned.apk")
    run(bt / "apksigner", "verify", OUT)
    print(f"Fertig: {OUT.name} ({OUT.stat().st_size / 1024:.0f} KB, Version {version_code})")


if __name__ == "__main__":
    main()
