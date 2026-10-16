# Mitmachen bei FireAssist

Fehlermeldungen, Ideen und Verbesserungen sind willkommen. Damit FireAssist im Einsatz verlässlich bleibt, gilt:
**Jede Änderung wird vorher mit dem Projektverantwortlichen ([@LinusL2005](https://github.com/LinusL2005)) abgesprochen.**

## So läuft es ab

1. **Issue öffnen:** Fehler oder Idee beschreiben. Was passiert, was sollte passieren, auf welchem Gerät und in welchem Browser?
   Noch keinen Code schreiben.
2. **Absprechen:** Im Issue wird geklärt, ob und wie die Änderung umgesetzt wird.
3. **Pull Request:** erst nach Zustimmung im Issue. Änderung in einer eigenen Kopie (Fork) und einem eigenen Branch machen,
   dann einen Pull Request auf `main` stellen und darin auf das Issue verweisen.
4. **Prüfung:** Jeder Pull Request wird von @LinusL2005 geprüft. Übernommen wird nur, was freigegeben ist.
   Pull Requests ohne vorherige Absprache können ohne weitere Begründung geschlossen werden.

## Regeln

- **Keine echten Daten:** keine Hydranten, Leitungsnetze, Funkrufnamen oder anderen internen Daten einer Feuerwehr,
  weder in Issues noch in Pull Requests, Screenshots oder Beispieldateien. Fehler bitte mit ausgedachten Daten nachstellen (siehe `beispiel/`).
- **Keine Zugangsdaten** oder Schlüssel.
- **Keine externen Abhängigkeiten:** keine Skripte, Schriften oder Dienste von fremden Servern. Die App muss offline starten und datensparsam bleiben.
- **Stil:** wie in den vorhandenen Dateien. Oberfläche und Dokumentation auf Deutsch.
- **Testen:** nach Änderungen in `src/` einmal `python3 build.py` ausführen und die App in der Handy-Ansicht ausprobieren.
- **Lizenz:** Mit einem Pull Request stellst du deinen Beitrag unter die EUPL v. 1.2, wie das ganze Projekt.

## Sicherheitsprobleme

Sicherheitslücken bitte nicht als öffentliches Issue melden, sondern vertraulich über **Security** → **Report a vulnerability**.
