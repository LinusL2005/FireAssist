# Entwicklung

Diese Seite ist für alle, die an FireAssist mitarbeiten. Für die Nutzung reicht das [README](README.md).
Wie Änderungen abgesprochen werden, steht in [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Aufbau

```
src/index.html      Grundgerüst
src/style.css       Gestaltung
src/js/*.js         App-Logik (util, coords, data, map, importer, exporter, ui, pages, hazmat, pwa, main)
src/js/demo.js      Beispieldaten der App (passend zu beispiel/)
src/sw.js           Service Worker der Web-App (Offline-Start, Offline-Karte)
vendor/             Leaflet 1.9.4 (BSD-2), SheetJS 0.20.3 (Apache 2.0), lokal, damit die App offline startet; Lizenzen in vendor/LICENSE-*.txt
build.py            baut FireAssist.html und den Ordner web/
beispiel/           ausgedachte Beispieldateien
android/            Android-App (Java, ohne Gradle), optional
ios/                iPhone-App (Xcode-Projekt), optional
.github/            Workflow für die Web-App (baut immer ohne Daten), CODEOWNERS
```

## Bauen und testen

Nach Änderungen in `src/` einmal neu bauen und das Ergebnis lokal testen:

```bash
python3 build.py
```

Dabei entstehen `FireAssist.html` (zum Doppelklicken, läuft ohne Server) und `web/` (die Web-App mit Offline-Speicher).
`web/` braucht zum Testen einen lokalen Webserver, z. B. `python3 -m http.server --directory web`.
`src/index.html` lässt sich zum Entwickeln auch direkt öffnen, „App-Datei mit Daten erstellen“ gibt es aber nur in der gebauten Datei.
OpenStreetMap als Hintergrundkarte gibt es nur in der Web-App, weil OpenStreetMap Zugriffe aus lokal geöffneten Dateien sperrt.

Ist Xcode installiert, aber dessen Lizenz noch nicht bestätigt, verweigert macOS den Befehl `python3`.
Dann entweder Xcode einmal öffnen und der Lizenz zustimmen, oder Python direkt aufrufen:

```bash
/Library/Developer/CommandLineTools/usr/bin/python3 build.py
```

## Was nie ins Repository gehört

Im Repository liegt nur der **Quellcode**. Diese Dateien werden nie hochgeladen (festgelegt in `.gitignore`):

| Was | Warum |
|---|---|
| `daten/`, Excel-, CSV- und GeoJSON-Dateien, Sicherungen, Exporte mit Datum | eigene Daten (Leitungsnetz, Funkrufnamen …). Nur `beispiel/` wird hochgeladen. |
| `FireAssist.html`, `web/`, `FireAssist.apk` | gebaute Dateien, können mit `--daten` eingebaute Einsatzdaten enthalten |
| `android/signing/` (Signaturschlüssel und Passwort) | Wer ihn hat, kann „echte“ Updates der Android-App bauen. Getrennt sichern! |

Eigene Daten am besten im Ordner **`daten/`** ablegen, z. B. `daten/FireAssist_Sicherung.json`.
Vor jedem Commit mit `git status` prüfen, dass keine Daten dabei sind. Zusätzlich blockiert GitHub Pushes, die Passwörter oder Schlüssel enthalten.

## Beispieldaten

Alle Beispieldaten sind ausgedachte Daten und als solche erkennbar: Nummern beginnen mit `BSP-`, Orte heißen „Muster…“,
und jede Bemerkung beginnt mit „Beispiel“. `beispiel/*.csv` und `src/js/demo.js` enthalten dieselben Daten. Wer eins ändert, ändert beides.

## Native Apps (optional)

Für die normale Nutzung reicht die Web-App aus der [Installation](README.md#installation).
Das Projekt enthält zusätzlich zwei App-Hüllen um dieselbe Oberfläche. Die Offline-Karte gibt es darin nicht.

- **Android** (`android/`): `python3 build.py`, dann `python3 android/build_apk.py` erzeugt `FireAssist.apk`.
  Benötigt das Android-SDK (`platforms;android-34`, `build-tools`) und ein JDK. Exporte landen unter Downloads/FireAssist.
  ⚠ Beim ersten Bauen entsteht `android/signing/` mit Schlüssel und Passwort. Sichern und nie weitergeben,
  Updates lassen sich nur mit genau diesem Schlüssel über eine installierte App installieren.
- **iPhone** (`ios/`): `python3 build.py`, dann `ios/FireAssist.xcodeproj` in Xcode öffnen und auf ▶ klicken.
  Auf dem eigenen iPhone läuft die App mit einer kostenlosen Apple-ID 7 Tage. Zum Verteilen braucht es ein Apple-Entwicklerkonto und TestFlight.
- `python3 build.py --daten daten/FireAssist_Sicherung.json` baut einen Datenstand fest in `FireAssist.html` und die Apps ein.
  Solche Dateien nur direkt weitergeben, **nie hochladen**.
