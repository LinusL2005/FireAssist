# FireAssist – digitaler Hydrantenplan

Unterstützungs-App für die Feuerwehr. Läuft komplett aus **einer HTML-Datei**, ohne Installation und ohne Server.

**Starten am PC:** `FireAssist.html` doppelklicken (Chrome, Edge, Firefox oder Safari).
Die Datei entsteht mit `python3 build.py` (siehe [Entwicklung](#entwicklung)).
**Auf Handys:** siehe [Auf Handys installieren](#auf-handys-installieren).

## Funktionen

- **Karte** mit Hydranten und weiteren Löschwasser-Entnahmestellen (Zisterne/Behälter, offenes Gewässer, Brunnen).
  Die Zahl im Hydrantensymbol ist die Nennweite (DN) der Versorgungsleitung.
- **Leitungen** zwischen den Hydranten, Strichstärke und Farbe nach Nennweite. Ab Zoomstufe 17 stehen die Nennweite an der Leitung und die Nummer am Hydranten.
- **Umkreissuche:** Einsatzstelle antippen, eine Adresse suchen oder den eigenen Standort nehmen. Danach zeigt die App alle Entnahmestellen im Radius
  (100 m bis 1 km), sortiert nach Entfernung, mit Himmelsrichtung und Mindestanzahl B-Schläuche. Defekte Hydranten sind ausgegraut.
- **Typ, Zustand, Leistungsdaten:** Über- und Unterflurhydrant, Status (in Ordnung, eingeschränkt, defekt), Druck, Durchfluss, Volumen und Prüfdatum.
  Wenn die letzte Prüfung länger als 12 Monate her ist, wird „Prüfung fällig“ angezeigt.
- **Bearbeiten** (Menü → Bearbeitungsmodus): Karte antippen legt eine neue Entnahmestelle an, Symbole lassen sich verschieben.
  Mit „Verbinden“ legst du Leitungen an. Danach tippst du einfach die nächste Entnahmestelle an und die Kette geht weiter.
  Mit „Meinen Standort übernehmen“ kannst du Hydranten direkt vor Ort erfassen. Jede Änderung lässt sich rückgängig machen.
- **Leitungsverlauf:** Leitungen können Knickpunkte haben, damit sie der Straße folgen oder quer durchs Gelände laufen.
  Im Bearbeitungsmodus die Leitung antippen. Dann:
  - den gestrichelten Punkt ziehen oder antippen = neuer Knickpunkt
  - einen weißen Punkt ziehen = verschieben, antippen = löschen
  - „Verlauf begradigen“ = wieder eine gerade Linie
- **Funkrufnamen** (Menü → Funkrufnamen): Fahrzeuge mit Fahrzeugart und Funkname, gruppiert nach **Löschverbund → Ortschaft**.
  - **Ansicht** (Regler-Symbol): Gliederung wählen – Löschverbund › Ortschaft, nur Ortschaft, nur Löschverbund oder ohne Gliederung –
    und Sortierung nach Funkname oder Fahrzeugart. Was nicht als Überschrift erscheint, steht klein am Eintrag.
  - **Ortschaften:** wählen, welche angezeigt werden – einzelne Ortschaften, ganze Löschverbünde oder mit „nur dieser“ genau einen Verbund.
  - **Bearbeiten** (Stift-Symbol): Fahrzeug antippen zum Ändern oder Löschen, „+ Fahrzeug hinzufügen“ in jeder Gruppe,
    Stift an Ortschaft oder Löschverbund zum Umbenennen bzw. um eine Ortschaft einem anderen Verbund zuzuordnen.
    Doppelte Funknamen werden abgelehnt, jede Änderung lässt sich rückgängig machen.
  - Ansicht und Auswahl werden pro Gerät gespeichert, die Fahrzeugliste selbst gehört zu den Daten (Sicherung, App-Datei, Excel).
  Die Suche durchsucht immer alle Ortschaften, auch ohne Schrägstrich („17442“ oder „44-2“ findet „17-44-2“).
- **Gefahrstoffe** (Menü → Gefahrstoffe):
  - *Warntafel:* Gefahrnummer und UN-Nummer eingeben. Die App erklärt die Gefahrnummer Ziffer für Ziffer (inkl. X = reagiert gefährlich mit Wasser)
    und zeigt den Stoff, wenn er in der Stoffliste steht.
  - *Stoffliste:* wird per CSV/Excel eingerichtet, z. B. mit Stoffen aus Betrieben im Einsatzgebiet. Eine kleine Beispielliste mit gängigen Stoffen ist dabei.
  - *Wissen:* GAMS-Regel, Absperrbereiche (FwDV 500), AAAA-C-EEEE, Warntafel lesen, Gefahrnummern, ADR-Klassen, GHS-Piktogramme, Quellen.
- **Suche oben auf der Karte** findet Hydranten, Adressen, Funkrufnamen und Gefahrstoffe. Auch „33/1203“ wird als Warntafel erkannt.
- **Import:** CSV, Excel (.xlsx/.xls/.ods), FireAssist-Sicherung (.json) und GeoJSON-Punkte. Du kannst die Datei auch einfach ins Fenster ziehen.
- **Export:** Excel (Blätter „Entnahmestellen“, „Leitungen“, „Funkrufnamen“, „Gefahrstoffe“), CSV, JSON-Sicherung und eine Excel-Vorlage.
- **App-Datei mit Daten erstellen:** Das erzeugt eine Kopie von `FireAssist.html`, in der der aktuelle Datenstand fest eingebaut ist.
  Diese eine Datei kann an die Einsatzkräfte verteilt werden. Ist auf einem Gerät schon ein älterer, selbst geänderter Stand gespeichert, fragt die App vorher nach.
- Hell- und Dunkelmodus, Karte abdunkeln für die Nacht, Navigation zum Hydranten (Karten-App des Handys).

## Datenformat für den Import

Eine Tabelle, eine Zeile pro Entnahmestelle. Die Spaltennamen werden automatisch erkannt (auch Varianten wie „Hydrant-Nr.“,
„Rechtswert“ oder „Nennweite (mm)“). Im Import-Dialog lässt sich die Zuordnung prüfen und ändern.

| Spalte | Pflicht | Beispiel |
|---|---|---|
| ID | empfohlen | `H-001` |
| Typ | nein | `Unterflurhydrant`, `Überflurhydrant`, `Löschwasserbehälter`, `Offenes Gewässer`, `Löschwasserbrunnen` |
| Breitengrad / Längengrad | **ja** | `50,5515` / `9,6755` |
| Leitung DN | nein | `150` |
| Druck bar / Durchfluss l/min / Volumen m³ | nein | `5,5` / `1600` / `100` |
| Status | nein | `in Ordnung`, `eingeschränkt`, `defekt` |
| Geprüft am | nein | `14.03.2025` |
| Adresse / Lage, Bemerkung | nein | Freitext |
| Verbunden mit | nein | `H-002, H-005` |

**Verbindungen** gibst du entweder in der Spalte „Verbunden mit“ an (die DN der Leitung ist dann die kleinere der beiden Hydranten)
oder in einer zweiten Tabelle bzw. einem zweiten Excel-Blatt **„Leitungen“** mit den Spalten `Von`, `Nach`, `DN`.
Die Leitungstabelle hat Vorrang.

**Leitungsverlauf:** Optional kann die Leitungstabelle eine Spalte `Verlauf` mit den Knickpunkten haben, entweder als
`50.5524 9.6769; 50.5527 9.6770` (Breite Länge, Punkte durch Semikolon getrennt) oder im GIS-Format `LINESTRING(9.6769 50.5524, 9.6770 50.5527)`.
Die Richtung wird automatisch erkannt. Punkte, die direkt auf den Hydranten liegen, werden weggelassen.

**Koordinaten:** WGS84 in Grad, UTM/ETRS89 (Zone 32 oder 33, auch mit vorangestellter Zone) oder Gauß-Krüger.
Das Koordinatensystem wird automatisch erkannt. Gauß-Krüger wird mit dem bundesweiten Standardparametersatz umgerechnet (Genauigkeit ca. 1–3 m).

Beispieldateien liegen in `beispiel/`. Eine Excel-Vorlage gibt es in der App unter Menü → Excel-Vorlage.

### Funkrufnamen

| Löschverbund (optional) | Ortschaft | Fahrzeugart | Funkname | Bemerkung (optional) |
|---|---|---|---|---|
| Löschverbund Nord | Musterstadt | HLF 20 | Florian Musterstadt 17-46-1 | |
| | | DLK 23/12 | Florian Musterstadt 17-33-1 | leere Zelle = wie Zeile darüber |
| | Neudorf | LF 10 | Florian Musterstadt 18-43-1 | |
| Löschverbund Süd | Talhausen | TSF-W | Florian Musterstadt 20-48-1 | |

Ohne Spalte „Löschverbund“ wird nur nach Ortschaft gruppiert. Sortiert wird alphabetisch nach Löschverbund, dann Ortschaft, dann Funkname.

Ein Import ersetzt die bisherige Liste. Vorlage und Beispiel: Seite Funkrufnamen → ⋮.

### Gefahrstoffe

| UN-Nummer | Bezeichnung | Gefahrnummer | Klasse | Hinweise |
|---|---|---|---|---|
| 1203 | Benzin oder Ottokraftstoff | 33 | 3 | Dämpfe schwerer als Luft |

Ein Import ersetzt die bisherige Liste. Die mitgelieferte Beispielliste (`beispiel/Gefahrstoffe_Beispiel.csv`) enthält nur gängige Stoffe
und ersetzt keine vollständige Datenbank. Vor dem Einsatz mit aktueller Quelle prüfen (ADR, GESTIS, ERICards).

Alle Listen können auch zusammen in einer Excel-Datei stehen (ein Blatt je Liste). Die App erkennt die Blätter anhand der Spalten.

## Auf Handys installieren

### Empfohlen: Web-Version auf einem Webserver

`python3 build.py` erzeugt neben `FireAssist.html` den Ordner **`web/`**. Diesen Ordner auf einen Webserver mit **HTTPS** hochladen,
z. B. als Unterordner `/fireassist/` auf dem Webspace der Feuerwehr-Homepage, oder kostenlos über
[GitHub Pages](#web-version-über-github-pages) veröffentlichen. Danach auf jedem Handy:

1. Adresse im Browser öffnen (einmal mit Internet).
2. Installieren:
   - **Android (Chrome):** Menü ⋮ → „App installieren“ bzw. „Zum Startbildschirm hinzufügen“
   - **iPhone (Safari):** Teilen-Symbol → „Zum Home-Bildschirm“
3. In der App: Menü → **Offline-Karte** → „Einsatzgebiet speichern“.

Danach startet die App auch **ohne Netz**, inklusive Karte für das Einsatzgebiet.
**Updates:** neue Dateien hochladen. Die App holt sie beim nächsten Start im Hintergrund und bietet „Neu laden“ an.

**Daten auf die Handys bringen**, zwei Möglichkeiten:

- **a) Sicherung verteilen (Daten bleiben privat):** Am PC über Menü → „Sicherung speichern“ eine JSON-Datei erzeugen und per Messenger oder E-Mail verschicken.
  Auf dem Handy: App öffnen → Menü → Importieren → Datei wählen. Die App selbst enthält dann keine Daten und darf öffentlich erreichbar sein.
- **b) Daten fest einbauen:** `python3 build.py --daten daten/FireAssist_Sicherung_2026-10-15.json` und danach `web/` hochladen.
  Alle Geräte übernehmen den neuen Stand automatisch. Wer auf dem Gerät selbst etwas geändert hat, wird vorher gefragt.
  ⚠ Nur machen, wenn die Seite **nicht öffentlich** ist (Intranet oder Passwortschutz), denn sonst kann jeder mit der Adresse die Daten sehen.
  Mit GitHub Pages geht das nicht, die Seite ist dort immer öffentlich.

### Besonderheiten auf dem iPhone

- Installieren geht nur über **Safari** (ab iOS 16.4 auch über andere Browser): Teilen-Symbol → „Zum Home-Bildschirm“.
- Die installierte App hat **eigenen Speicher**, getrennt von Safari. Daten deshalb **in der installierten App** importieren, nicht vorher in Safari.
- Dateien aus Messengern zuerst mit „In Dateien sichern“ ablegen. Dann in der App über Menü → Importieren auswählen.
- Installierte Web-Apps behalten ihre Daten. Bei Seiten, die nur in Safari geöffnet werden, kann iOS die gespeicherten Daten nach 7 Tagen ohne Besuch löschen. Deshalb unbedingt installieren.

### iPhone-App ohne Server (Ordner `ios/`)

`ios/FireAssist.xcodeproj` ist eine iPhone-App, die `FireAssist.html` fest enthält. Sie braucht keinen Webserver.
Exporte (Excel, CSV, Sicherung, App-Datei) erscheinen im Teilen-Menü des iPhones, Links öffnen in Safari bzw. Apple Karten.

1. Daten einbauen (optional): `python3 build.py --daten daten/FireAssist_Sicherung.json`, sonst einfach `python3 build.py`.
2. `ios/FireAssist.xcodeproj` in Xcode öffnen.
3. **Im Simulator:** oben ein iPhone wählen und auf ▶ klicken.
4. **Auf dem eigenen iPhone:** iPhone per Kabel anschließen und in Xcode unter *Signing & Capabilities* bei *Team* die eigene Apple-ID wählen.
   Die Bundle-ID `de.fireassist.app` muss dabei eindeutig sein, z. B. `de.feuerwehr-musterstadt.fireassist`.
   Auf dem iPhone den Entwicklermodus einschalten (Einstellungen → Datenschutz & Sicherheit → Entwicklermodus).
   Mit einer kostenlosen Apple-ID läuft die App **7 Tage**, danach erneut aus Xcode installieren.
5. **Für alle Einsatzkräfte:** Apple-Entwicklerkonto (99 €/Jahr; gemeinnützige Organisationen und Behörden können eine Gebührenbefreiung beantragen).
   In Xcode *Product → Archive* und in App Store Connect hochladen, dann per **TestFlight-Link** verteilen.
   Die Einsatzkräfte installieren die App „TestFlight“ und tippen den Link an. Jede Version ist 90 Tage gültig, Updates kommen automatisch.

Neue Daten kommen entweder mit einer neuen App-Version oder per Import in der App (Menü → Importieren, Datei aus „Dateien“ wählen).
Die Offline-Karte (Kacheln speichern) gibt es bisher nur in der Web-Version. In der iPhone-App braucht die Hintergrundkarte Internet.

### Android-App ohne Server (`FireAssist.apk`)

`FireAssist.apk` ist eine Android-App, die FireAssist fest enthält. Es gibt keinen Store, keine Kosten und keinen Ablauf.

**Installieren:**
1. `FireAssist.apk` per Messenger, E-Mail oder USB aufs Handy schicken und antippen.
2. Beim ersten Mal fragt Android, ob diese Quelle (z. B. WhatsApp oder „Dateien“) Apps installieren darf. Einmal erlauben.
3. Warnt Google Play Protect vor einer „unbekannten App“: „Trotzdem installieren“ wählen.

**In der App:**
- Exporte (Excel, CSV, Sicherung, App-Datei) landen unter **Downloads/FireAssist** und werden gleichzeitig zum Teilen angeboten.
- Die **Zurück-Taste** schließt erst Dialoge, Seiten und Panels.
- **Navigation** öffnet die Karten-App des Handys.

**Neue Version oder neuer Datenstand bauen:**

```bash
python3 build.py --daten daten/FireAssist_Sicherung.json
python3 android/build_apk.py
```

Die neue `FireAssist.apk` einfach über die alte installieren. Die Daten auf dem Handy bleiben erhalten.

⚠ **Signaturschlüssel sichern:** Beim ersten Bauen entsteht `android/signing/` (Schlüssel und Passwort).
Updates lassen sich nur mit genau diesem Schlüssel über eine installierte App installieren. Den Ordner sichern und nicht weitergeben.
Benötigt werden das Android-SDK (`platforms;android-34`, `build-tools`) und ein JDK.

### Ohne Webserver

- **PC/Laptop:** `FireAssist.html` doppelklicken.
- **Android:** am besten die Android-App `FireAssist.apk` (siehe oben). Notlösung: über Menü → „App-Datei mit Daten erstellen“ eine HTML-Datei erzeugen und in Chrome öffnen.
- **iPhone:** Lokal gespeicherte HTML-Dateien laufen nicht (auch nicht aus ZIP-Dateien). Ohne Server geht es nur über die iPhone-App (siehe oben).

## Externe Dienste (Datenschutz)

Die App lädt **keine** Skripte, Schriften oder Statistikdienste von außen. Leaflet und SheetJS sind eingebaut.
Hydranten, Leitungen, Funkrufnamen und Stoffliste verlassen das Gerät nie.

Nur diese Verbindungen gibt es:

| Was | Wohin | Wann | Was wird übertragen |
|---|---|---|---|
| Hintergrundkarte | basemap.de (BKG, Bundesbehörde); optional Esri oder OpenStreetMap | beim Anzeigen der Karte (außer bei „Keine Hintergrundkarte“ oder wenn offline gespeichert) | IP-Adresse, angezeigter Kartenausschnitt |
| Adresssuche | photon.komoot.io | nur wenn „Adresse … suchen“ angetippt wird; im Menü abschaltbar | der Suchtext (Kartenmitte nur grob, auf ca. 10 km gerundet) |
| Navigation | Karten-App des Handys (Android), Apple Karten (iPhone), OpenStreetMap (PC) | nur beim Antippen von „Navigation“ | Ziel-Koordinate |
| Links | GESTIS, ERICards, basemap.de, Leaflet | nur beim Antippen | – |
| App laden | der Webserver der Web-Version (z. B. GitHub Pages) | nur Web-Version: beim Öffnen bzw. Suchen nach Updates | IP-Adresse |

Mit „Keine Hintergrundkarte“ (Ebenen-Symbol) und ausgeschalteter Adresssuche arbeitet die App **komplett ohne externe Verbindungen**.

## Gut zu wissen

- **Speicherort:** Die Daten liegen im Browser des jeweiligen Geräts. Deshalb regelmäßig über Menü → Sicherung speichern exportieren.
- **Ohne Internet:** Hydranten, Leitungen, Suche nach Nummer, Umkreissuche, Funkrufnamen und Gefahrstoffe funktionieren.
  Die Karte erscheint nur dort, wo sie offline gespeichert ist (Web-Version). Sonst ist statt der Karte ein Raster zu sehen.
- **OpenStreetMap** sperrt Zugriffe aus lokal geöffneten Dateien. Die Karte wird deshalb nur in der Web-Version angeboten.
- Entfernungen sind Luftlinie. Alle Angaben ohne Gewähr, Lage und Zustand vor Ort prüfen.

## GitHub-Repository

Im Repository liegt nur der **Quellcode**. Diese Dateien werden nie hochgeladen (festgelegt in `.gitignore`):

| Was | Warum |
|---|---|
| `android/signing/` (Signaturschlüssel und Passwort) | Wer ihn hat, kann „echte“ Updates der Android-App bauen. Getrennt sichern! |
| `FireAssist.html`, `web/`, `FireAssist.apk` | gebaute Dateien, können mit `--daten` eingebaute Einsatzdaten enthalten |
| `daten/`, Excel-, CSV- und GeoJSON-Dateien, Sicherungen, Exporte mit Datum | eigene Daten (Leitungsnetz, Funkrufnamen …). Nur `beispiel/` wird hochgeladen. |

Eigene Daten am besten im Ordner **`daten/`** ablegen, z. B. `daten/FireAssist_Sicherung.json`.
Nach dem Herunterladen (`git clone`) einmal `python3 build.py` ausführen, dann ist `FireAssist.html` da.

**Änderungen hochladen:**

```bash
git add -A
git commit -m "Was geändert wurde"
git push
```

Vor dem Commit mit `git status` prüfen, dass keine Daten dabei sind.

### Web-Version über GitHub Pages

Vorbereitet, aber noch nicht eingeschaltet. GitHub Pages ist im kostenlosen Tarif nur für **öffentliche** Repositories verfügbar.
Zum Einschalten:

1. Auf GitHub: *Settings → General → Danger Zone → Change visibility* → Public.
2. *Settings → Pages → Build and deployment → Source:* „GitHub Actions“.
3. *Actions → GitHub Pages → Run workflow* (danach läuft es bei jedem `git push` automatisch).

Die App ist dann unter `https://<benutzername>.github.io/FireAssist/` erreichbar.
GitHub baut sie dafür selbst mit `python3 build.py`, **immer ohne Daten** (`.github/workflows/pages.yml`).
Die Daten kommen per Sicherungsdatei auf die Handys (siehe oben, Möglichkeit a).
Solange das Repository privat ist, wird dieser Schritt übersprungen.

## Entwicklung

```
src/index.html      Grundgerüst
src/style.css       Gestaltung
src/js/*.js         App-Logik (util, coords, data, map, importer, exporter, ui, pages, hazmat, pwa, main)
src/sw.js           Service Worker der Web-Version (Offline-Start, Offline-Karte)
vendor/             Leaflet 1.9.4 (BSD-2), SheetJS 0.20.3 (Apache 2.0), lokal, damit die App offline startet; Lizenzen in vendor/LICENSE-*.txt
build.py            baut FireAssist.html und den Ordner web/
android/            Android-App (Java, ohne Gradle); android/build_apk.py baut FireAssist.apk
ios/                iPhone-App (Xcode-Projekt)
.github/workflows/  GitHub Pages (Web-Version, ohne Daten)
```

Nach Änderungen in `src/` einmal neu bauen:

```bash
python3 build.py
```

Ist Xcode installiert, aber dessen Lizenz noch nicht bestätigt, verweigert macOS den Befehl `python3`.
Dann entweder Xcode einmal öffnen und der Lizenz zustimmen, oder Python direkt aufrufen:

```bash
/Library/Developer/CommandLineTools/usr/bin/python3 build.py
```

`src/index.html` lässt sich zum Entwickeln auch direkt öffnen. Die Funktion „App-Datei mit Daten erstellen“ gibt es aber nur in der gebauten Datei.
