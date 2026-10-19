# FireAssist – Hinweise für Claude

FireAssist ist eine Web-App für die Feuerwehr: Hydrantenplan mit Leitungsnetz und Umkreissuche, Funkrufnamen und Gefahrstoffe.
Sie läuft offline im Browser und als installierte App. Für Nutzer gilt das [README](../README.md),
für Mitarbeit [ENTWICKLUNG.md](../ENTWICKLUNG.md) und [CONTRIBUTING.md](../CONTRIBUTING.md).

## Commits und Pull Requests

- **Keine Claude-Kennzeichnung:** kein `Co-Authored-By: Claude …` in Commits und kein „Generated with Claude Code“
  oder ähnlicher Hinweis in Pull Requests, Issues oder Kommentaren. Autor ist allein der Projektverantwortliche.
- Nie direkt auf `main` arbeiten. Jede Änderung auf einem eigenen Branch, dann Pull Request auf `main`.
  `main` ist geschützt; gemergt wird nur nach Freigabe durch @LinusL2005.
- Commit-Nachrichten auf Deutsch, erste Zeile kurz und sachlich (z. B. „Menü: untere Leiste und aufgeräumtes „Mehr““).
- Vor jedem Commit `git status` prüfen: keine Daten und keine gebauten Dateien (siehe unten).

## Daten

- **Einsatzdaten kommen nie ins Internet**, auch nicht verschlüsselt oder hinter einem Passwort:
  nicht ins Repository, nicht auf GitHub Pages, nicht in Issues, Screenshots oder Artefakte.
- Nie committen: `daten/`, CSV-, Excel-, GeoJSON-Dateien und Sicherungen (außer `beispiel/*.csv`),
  `FireAssist.html`, `web/`, `*.apk`, `android/signing/`. Die `.gitignore` deckt das ab, trotzdem hinsehen.
- Beispieldaten sind ausgedacht und gekennzeichnet: Nummern mit `BSP-`, Orte „Muster…“, Bemerkungen beginnen mit „Beispiel“.
  `beispiel/*.csv` und `src/js/demo.js` enthalten dieselben Daten – wer eins ändert, ändert beides.

## Code

- Quellcode liegt in `src/` (`index.html`, `style.css`, `js/*.js`, `sw.js`). Plain JavaScript ohne Build-Tools,
  ohne Framework, ohne npm. Bibliotheken nur lokal in `vendor/` (Leaflet, SheetJS).
- **Keine externen Abhängigkeiten:** keine Skripte, Schriften oder Dienste von fremden Servern.
  Die App muss offline starten und datensparsam bleiben.
- Oberfläche, Kommentare und Dokumentation auf Deutsch. Stil wie in den vorhandenen Dateien:
  Aktionen über `data-act` und das `ACT`-Objekt, Farben über die CSS-Variablen in `:root`, helles und dunkles Farbschema.
- Bedienung im Einsatz geht vor: Wichtiges groß und mit einem Tipp erreichbar (untere Leiste Karte · Funk · Gefahrstoffe · Mehr),
  Datenpflege und Einstellungen unter „Mehr“. Die Kartenansicht nur nach Absprache ändern.
- Ändert sich ein Menüpfad, die Pfade im README mit anpassen.

## Bauen und testen

```bash
python3 build.py        # erzeugt FireAssist.html und web/
python3 -m http.server --directory web   # Web-App lokal testen
```

Lehnt macOS `python3` wegen der Xcode-Lizenz ab: `/Library/Developer/CommandLineTools/usr/bin/python3 build.py`.
Nach Änderungen in `src/` immer bauen und die App in Handy-Breite ausprobieren, am besten mit Beispieldaten.
