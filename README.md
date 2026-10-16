# FireAssist – digitaler Hydrantenplan

Unterstützungs-App für die Feuerwehr: Hydrantenplan mit Leitungsnetz und Umkreissuche, Funkrufnamen und Gefahrstoffe.
FireAssist läuft im Browser, lässt sich auf Android und iPhone wie eine App installieren und funktioniert auch ohne Netz.
Die Einsatzdaten bleiben auf den Geräten und werden nie ins Internet hochgeladen.

> [!NOTE]
> **Ohne echte Daten.** FireAssist wird ohne reale Daten ausgeliefert. Weder dieses Repository noch die veröffentlichte App
> enthalten echte Hydranten, Leitungsnetze oder Funkrufnamen einer Feuerwehr.
> Beigelegt sind nur **ausgedachte Beispieldaten** (Ordner [`beispiel/`](beispiel/) und „Beispieldaten laden“ in der App) rund um die erfundene „Musterstadt“.
> Die Beispiel-Hydranten liegen zwar auf einer echten Karte, ihre Lage, Leitungen und Werte sind aber frei erfunden.
> Die Gefahrstoff-Beispielliste enthält gängige Stoffe aus dem Gefahrgutrecht, aber keine Angaben zu realen Betrieben.
> Die eigenen Daten importiert jede Feuerwehr selbst (siehe [Schritt 3](#schritt-3-daten-aufs-handy-bringen)).

> [!WARNING]
> **Alle Angaben ohne Gewähr.** FireAssist ist ein Hilfsmittel und ersetzt weder Ortskenntnis noch Erkundung oder amtliche Pläne.
> Lage, Zustand und Leistung der Entnahmestellen können sich jederzeit ändern, deshalb immer vor Ort prüfen.
> Angaben zu Gefahrstoffen mit aktuellen Quellen abgleichen (ADR, GESTIS, ERICards, Fachberatung).
> Mehr dazu unter [Haftungsausschluss](#haftungsausschluss).

**Inhalt:** [Installation](#installation) · [Beispiele ausprobieren](#beispiele-ausprobieren) · [Funktionen](#funktionen) ·
[Datenformat](#datenformat-für-den-import) · [Datenschutz](#externe-dienste-datenschutz) · [Entwicklung](#entwicklung) ·
[Haftungsausschluss](#haftungsausschluss) · [Lizenz](#lizenz)

## Installation

FireAssist wird kostenlos über **GitHub Pages** veröffentlicht, ein eigener Server ist nicht nötig.
Die Seite enthält nur die App, **niemals Einsatzdaten**. Die Daten kommen in Schritt 3 getrennt auf die Geräte.

| Schritt | Wer | Wie oft |
|---|---|---|
| [1. App veröffentlichen](#schritt-1-app-veröffentlichen) | Admin am PC | einmalig |
| [2. App aufs Handy installieren](#schritt-2-app-aufs-handy-installieren) | jede Einsatzkraft | einmalig |
| [3. Daten aufs Handy bringen](#schritt-3-daten-aufs-handy-bringen) | Admin → Einsatzkräfte | bei jedem neuen Datenstand |
| [4. Offline-Karte speichern (optional)](#schritt-4-offline-karte-speichern-optional) | jede Einsatzkraft | einmalig |

### Schritt 1: App veröffentlichen

Einmalig am PC. Du brauchst ein GitHub-Konto mit Admin-Zugriff auf dieses Repository.

1. Auf github.com das Repository **FireAssist** öffnen.
2. Das Repository öffentlich machen, denn GitHub Pages ist nur für öffentliche Repositories kostenlos:
   **Settings** → ganz unten **Danger Zone** → **Change visibility** → **Change to public** → bestätigen.
   Öffentlich wird dabei nur der Quellcode, Daten liegen nie im Repository (siehe [GitHub-Repository](#github-repository)).
3. **Settings** → links **Pages** → unter *Build and deployment* bei **Source** den Eintrag **GitHub Actions** wählen.
4. Oben auf **Actions** → links **GitHub Pages** → rechts **Run workflow** → grüner Knopf **Run workflow**.
5. Etwa eine Minute warten, bis der Lauf einen grünen Haken hat.
6. Die App ist jetzt erreichbar unter **https://linusl2005.github.io/FireAssist/**
   Den Link einmal am PC öffnen und prüfen, ob die Karte erscheint. Diesen Link bekommen die Einsatzkräfte.

Ab jetzt wird jede Änderung am Quellcode automatisch neu veröffentlicht.
GitHub baut die App dafür selbst, immer ohne Daten (`.github/workflows/pages.yml`).

### Schritt 2: App aufs Handy installieren

Das macht jede Einsatzkraft einmal auf ihrem Handy.

**Android (Chrome):**

1. Den Link in **Chrome** öffnen (einmal mit Internet).
2. Oben rechts Menü **⋮** → **App installieren** (auf manchen Geräten „Zum Startbildschirm hinzufügen“) → **Installieren**.
3. FireAssist ab jetzt über das neue Symbol auf dem Startbildschirm öffnen.

**iPhone (Safari):**

1. Den Link in **Safari** öffnen (einmal mit Internet).
2. Unten auf das **Teilen-Symbol** (Quadrat mit Pfeil nach oben) → **Zum Home-Bildschirm** → **Hinzufügen**.
3. FireAssist ab jetzt **nur noch über das Symbol** auf dem Home-Bildschirm öffnen, nicht mehr in Safari.
   Die installierte App hat ihren eigenen Speicher. Was in Safari importiert wurde, ist in der App nicht zu sehen.

**PC oder Laptop:** Den Link in Chrome oder Edge öffnen. Über das Installieren-Symbol rechts in der Adressleiste lässt sich FireAssist auch dort als App anlegen.

### Schritt 3: Daten aufs Handy bringen

Die Daten (Hydranten, Leitungen, Funkrufnamen, Gefahrstoffe) gehen **nie über GitHub**, sondern als Datei direkt von dir an die Einsatzkräfte.

**Am PC, einmal pro Datenstand:**

1. FireAssist am PC öffnen (Link aus Schritt 1).
2. Menü **☰** → **Importieren** → eure Excel- oder CSV-Dateien auswählen (Aufbau siehe [Datenformat](#datenformat-für-den-import)).
3. Im Fenster „Daten importieren“ prüfen, ob die Spalten richtig erkannt wurden → **Importieren**.
4. Menü **☰** → **Sicherung speichern**. Es entsteht eine Datei wie `FireAssist_Sicherung_2026-10-16.json`.
5. Diese Datei an die Einsatzkräfte geben, z. B. per USB-Stick, interner E-Mail oder Messenger. **Nie auf GitHub hochladen.**

**Am Handy:**

1. Die Datei speichern.
   - **iPhone:** in der Nachricht bzw. Mail auf die Datei tippen → Teilen-Symbol → **In Dateien sichern**.
   - **Android:** Die Datei landet meist automatisch unter **Downloads**.
2. FireAssist über das App-Symbol öffnen → Menü **☰** → **Importieren** → die Datei wählen.
3. Fragt die App „Vorhandene Daten ersetzen oder ergänzen?“: **Ersetzen** wählen.

Bei einem neuen Datenstand diese Schritte wiederholen.

### Schritt 4: Offline-Karte speichern (Optional)

Damit die Karte auch im Einsatz ohne Netz erscheint. Am besten im WLAN machen.

1. FireAssist öffnen → Menü **☰** → **Offline-Karte** → **Einsatzgebiet speichern**.
   Gespeichert werden alle Hydranten mit Umgebung, deshalb erst nach Schritt 3. Die Größe (bis ca. 160 MB) steht vorher dabei.
2. Warten, bis „Offline-Karte gespeichert“ erscheint.

Danach startet FireAssist auch **ohne Netz**, mit Karte für das ganze Einsatzgebiet.

### Updates

- **App:** kommt automatisch. Beim nächsten Start mit Internet lädt FireAssist die neue Version im Hintergrund und zeigt **Neu laden**.
- **Daten:** eine neue Sicherung verteilen und auf den Handys importieren (Schritt 3).

### Gut zu wissen

- Die Daten liegen nur auf dem jeweiligen Gerät. Wer dort etwas ändert, sollte regelmäßig über Menü → **Sicherung speichern** sichern.
- iPhone: Daten von Seiten, die nur in Safari geöffnet werden, löscht iOS nach 7 Tagen ohne Besuch. Die installierte App aus Schritt 2 ist davon nicht betroffen.
- Ohne Internet funktionieren Hydranten, Leitungen, Suche nach Nummer, Umkreissuche, Funkrufnamen und Gefahrstoffe.
  Die Karte erscheint nur dort, wo sie offline gespeichert ist. Sonst ist statt der Karte ein Raster zu sehen.
- Entfernungen sind Luftlinie. Alle Angaben ohne Gewähr, siehe [Haftungsausschluss](#haftungsausschluss).

## Beispiele ausprobieren

Zum Kennenlernen gibt es fiktive Beispieldaten rund um „Musterstadt“. Sie ersetzen vorhandene Daten,
jeder Schritt lässt sich aber mit **Rückgängig** zurücknehmen.

### Schnell: Beispiele direkt in der App laden

Dafür braucht man keine Dateien, das geht auch auf dem Handy.

1. **Hydrantenplan:** FireAssist öffnen. Beim ersten Start auf **Beispieldaten ansehen** tippen, sonst Menü **☰** → **Beispieldaten laden**.
   Die Karte springt zu 40 erfundenen Entnahmestellen mit 36 Leitungen.
2. Ausprobieren:
   - Einen **Hydranten antippen**: Nennweite, Druck, Durchfluss, Zustand und Navigation dorthin.
   - **Umkreis** antippen, dann eine Stelle auf der Karte antippen: Alle Entnahmestellen im Umkreis, sortiert nach Entfernung.
   - Oben in die **Suche** `H-012` eingeben.
   - Menü **☰** → **Legende**: Was die Symbole, Farben und Linien bedeuten.
   - Menü **☰** → **Bearbeitungsmodus**: Hydranten verschieben, neue anlegen und mit **Verbinden** Leitungen ziehen.
3. **Funkrufnamen:** Menü **☰** → **Funkrufnamen** → **Beispiel ansehen**.
   Mit dem Regler-Symbol die Gliederung umschalten, über **Ortschaften** einzelne Orte ausblenden.
4. **Gefahrstoffe:** Menü **☰** → **Gefahrstoffe** → Reiter **Stoffliste** → **Beispielliste**.
   Dann im Reiter **Warntafel** oben `33` und unten `1203` eingeben: Die App erklärt die Gefahrnummer und zeigt den Stoff (Benzin).

### Gründlich: Import mit den Beispieldateien testen

So funktioniert später auch der Import eurer echten Daten. Die Dateien liegen im Ordner [`beispiel/`](beispiel/):

| Datei | Inhalt |
|---|---|
| `Hydranten_Beispiel.csv` | 40 Entnahmestellen mit Koordinaten, Nennweite, Druck, Zustand … |
| `Leitungen_Beispiel.csv` | 36 Leitungen (Von, Nach, DN) |
| `Funkrufnamen_Beispiel.csv` | 18 Fahrzeuge in 5 Ortschaften und 2 Löschverbünden |
| `Gefahrstoffe_Beispiel.csv` | 24 gängige Gefahrstoffe |

1. **Dateien herunterladen:** Auf GitHub den Ordner `beispiel` öffnen → Datei anklicken → rechts oben **Download raw file** (Pfeil nach unten).
   Am PC geht auch **Code** → **Download ZIP** für alles auf einmal.
2. In FireAssist: Menü **☰** → **Importieren** → alle vier Dateien **gleichzeitig** auswählen.
3. Das Fenster „Daten importieren“ zeigt für jede Datei, was erkannt wurde (z. B. „36 Leitungen erkannt“) und welche Spalte wofür steht.
   → **Importieren**.
4. Es erscheint „Import abgeschlossen“ mit 40 Entnahmestellen, 36 Leitungen, 18 Funkrufnamen und 24 Gefahrstoffen → **OK**.

Die Dateien lassen sich mit Excel öffnen und sind eine gute Vorlage für eure eigenen Listen.

**Aufräumen:** Vor dem Import der echten Daten Menü **☰** → **Alle Daten löschen**.

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

## Externe Dienste (Datenschutz)

Die App lädt **keine** Skripte, Schriften oder Statistikdienste von außen. Leaflet und SheetJS sind eingebaut.
Hydranten, Leitungen, Funkrufnamen und Stoffliste verlassen das Gerät nie.

Nur diese Verbindungen gibt es:

| Was | Wohin | Wann | Was wird übertragen |
|---|---|---|---|
| App laden | GitHub Pages | beim Öffnen mit Internet (Suche nach Updates) | IP-Adresse |
| Hintergrundkarte | basemap.de (BKG, Bundesbehörde); optional Esri oder OpenStreetMap | beim Anzeigen der Karte (außer bei „Keine Hintergrundkarte“ oder wenn offline gespeichert) | IP-Adresse, angezeigter Kartenausschnitt |
| Adresssuche | photon.komoot.io | nur wenn „Adresse … suchen“ angetippt wird; im Menü abschaltbar | der Suchtext (Kartenmitte nur grob, auf ca. 10 km gerundet) |
| Navigation | Karten-App des Handys (Android), Apple Karten (iPhone), OpenStreetMap (PC) | nur beim Antippen von „Navigation“ | Ziel-Koordinate |
| Links | GESTIS, ERICards, basemap.de, Leaflet | nur beim Antippen | – |

Mit „Keine Hintergrundkarte“ (Ebenen-Symbol) und ausgeschalteter Adresssuche arbeitet die App nach dem Laden **komplett ohne externe Verbindungen**.

## GitHub-Repository

Im Repository liegt nur der **Quellcode**. Diese Dateien werden nie hochgeladen (festgelegt in `.gitignore`):

| Was | Warum |
|---|---|
| `daten/`, Excel-, CSV- und GeoJSON-Dateien, Sicherungen, Exporte mit Datum | eigene Daten (Leitungsnetz, Funkrufnamen …). Nur `beispiel/` wird hochgeladen. |
| `FireAssist.html`, `web/`, `FireAssist.apk` | gebaute Dateien, können mit `--daten` eingebaute Einsatzdaten enthalten |
| `android/signing/` (Signaturschlüssel und Passwort) | Wer ihn hat, kann „echte“ Updates der Android-App bauen. Getrennt sichern! |

Eigene Daten am besten im Ordner **`daten/`** ablegen, z. B. `daten/FireAssist_Sicherung.json`.
Vor jedem Commit mit `git status` prüfen, dass keine Daten dabei sind.

## Entwicklung

```
src/index.html      Grundgerüst
src/style.css       Gestaltung
src/js/*.js         App-Logik (util, coords, data, map, importer, exporter, ui, pages, hazmat, pwa, main)
src/sw.js           Service Worker der Web-App (Offline-Start, Offline-Karte)
vendor/             Leaflet 1.9.4 (BSD-2), SheetJS 0.20.3 (Apache 2.0), lokal, damit die App offline startet; Lizenzen in vendor/LICENSE-*.txt
build.py            baut FireAssist.html und den Ordner web/ (das veröffentlicht GitHub Pages)
beispiel/           fiktive Beispieldateien
android/            Android-App (Java, ohne Gradle), optional
ios/                iPhone-App (Xcode-Projekt), optional
.github/workflows/  GitHub Pages (Web-App, ohne Daten)
```

Nach Änderungen in `src/` einmal neu bauen und das Ergebnis lokal testen:

```bash
python3 build.py
```

Dabei entstehen `FireAssist.html` (zum Doppelklicken, läuft ohne Server) und `web/` (die Web-App, wie sie GitHub Pages veröffentlicht).
`src/index.html` lässt sich zum Entwickeln auch direkt öffnen, „App-Datei mit Daten erstellen“ gibt es aber nur in der gebauten Datei.
OpenStreetMap als Hintergrundkarte gibt es nur in der Web-App, weil OpenStreetMap Zugriffe aus lokal geöffneten Dateien sperrt.

Ist Xcode installiert, aber dessen Lizenz noch nicht bestätigt, verweigert macOS den Befehl `python3`.
Dann entweder Xcode einmal öffnen und der Lizenz zustimmen, oder Python direkt aufrufen:

```bash
/Library/Developer/CommandLineTools/usr/bin/python3 build.py
```

### Native Apps (optional)

Für die normale Nutzung reicht die Web-App aus der [Installation](#installation).
Das Projekt enthält zusätzlich zwei App-Hüllen um dieselbe Oberfläche. Die Offline-Karte gibt es darin nicht.

- **Android** (`android/`): `python3 build.py`, dann `python3 android/build_apk.py` erzeugt `FireAssist.apk`.
  Benötigt das Android-SDK (`platforms;android-34`, `build-tools`) und ein JDK. Exporte landen unter Downloads/FireAssist.
  ⚠ Beim ersten Bauen entsteht `android/signing/` mit Schlüssel und Passwort. Sichern und nie weitergeben,
  Updates lassen sich nur mit genau diesem Schlüssel über eine installierte App installieren.
- **iPhone** (`ios/`): `python3 build.py`, dann `ios/FireAssist.xcodeproj` in Xcode öffnen und auf ▶ klicken.
  Auf dem eigenen iPhone läuft die App mit einer kostenlosen Apple-ID 7 Tage. Zum Verteilen braucht es ein Apple-Entwicklerkonto und TestFlight.
- `python3 build.py --daten daten/FireAssist_Sicherung.json` baut einen Datenstand fest in `FireAssist.html` und die Apps ein.
  Solche Dateien nur direkt weitergeben, **nie hochladen**.

## Haftungsausschluss

**Alle Angaben ohne Gewähr.** FireAssist ist ein Open-Source-Projekt und kein geprüftes oder zertifiziertes Einsatzführungssystem.
Die App wird ohne Gewährleistung bereitgestellt; die Haftung ist nach Artikel 7 und 8 der EUPL beschränkt.

- **Daten:** FireAssist zeigt nur an, was importiert oder eingegeben wurde. Für Richtigkeit und Aktualität ist verantwortlich, wer die Daten pflegt.
  Lage, Zustand und Leistung von Hydranten und anderen Entnahmestellen können sich jederzeit ändern (Baustellen, Defekte, zugeparkt, Frost).
- **Berechnungen:** Entfernungen sind Luftlinie, die Zahl der B-Schläuche ist eine grobe Mindestangabe.
  Umgerechnete Koordinaten (UTM, Gauß-Krüger) können um einige Meter abweichen.
- **Gefahrstoffe:** Die Erklärung der Gefahrnummern und die Stoffliste sind eine Gedächtnisstütze, keine vollständige Datenbank.
  Maßnahmen immer nach aktuellen Quellen (ADR, GESTIS, ERICards) und mit Fachberatung festlegen.
- **Karten und Dienste:** Hintergrundkarten und Adresssuche stammen von Dritten und können veraltet oder nicht erreichbar sein.
- **Beispieldaten:** Hydranten, Leitungen und Funkrufnamen in `beispiel/` und in der App sind frei erfunden.

Im Einsatz gelten die Vorgaben der Einsatzleitung und die örtlichen Pläne der Wasserversorger.

## Lizenz

© 2026 LinusL2005

Lizenziert unter der **EUPL v. 1.2** (Open-Source-Lizenz für die Europäische Union): [`LIZENZ.txt`](LIZENZ.txt) (deutsch), [`LICENSE`](LICENSE) (englisch).
Alle Sprachfassungen sind gleichwertig. FireAssist darf genutzt, weitergegeben und verändert werden.
Wer eine veränderte Fassung weitergibt, muss deren Quellcode ebenfalls unter der EUPL bereitstellen.
Die App wird ohne Gewähr bereitgestellt (Artikel 7 und 8 der EUPL).

Enthaltene Bibliotheken mit eigener Lizenz: Leaflet 1.9.4 (BSD 2-Clause, [`vendor/LICENSE-leaflet.txt`](vendor/LICENSE-leaflet.txt)),
SheetJS 0.20.3 (Apache 2.0, [`vendor/LICENSE-sheetjs.txt`](vendor/LICENSE-sheetjs.txt)).
`build.py` baut alle drei Lizenztexte in die App ein, sie stehen dort unter Menü → Über FireAssist.

Einsatzdaten (Hydranten, Leitungsnetz, Funkrufnamen) gehören nicht zum Projekt und fallen nicht unter diese Lizenz.
