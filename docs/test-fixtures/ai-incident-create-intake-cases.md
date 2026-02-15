# AI Incident Create Intake Cases

Zweck: Regression- und Manuelltests fuer `P0-08` (AI Create Incident aus Freitext).

## Verwendung

1. In `/dashboard/incidents` auf `AI Create` klicken.
2. Einen Case unten in das Feld `Beschreibungstext` pasten.
3. `Analyze` ausfuehren.
4. Ergebnis gegen die jeweilige Checkliste pruefen.

Hinweis: Modell-Antworten koennen leicht variieren. Die Checks fokussieren auf Pflichtverhalten statt Wortlaut.

## Global Checks (jeder Case)

- `title` wird sinnvoll extrahiert oder per Follow-up erfragt.
- `severity` wird sinnvoll extrahiert oder per Follow-up erfragt.
- `started_at` wird nur gesetzt, wenn der Text ein explizites Zeit-/Datums-Signal enthaelt.
- `Create Incident` bleibt erst dann sinnvoll nutzbar, wenn `title` und `severity` vorhanden sind.

## Case P0-08-01: Kurz und vage (Slack)

**Input**

```text
Slack – #it-support
VPN geht schon wieder nicht. Da steht nur „Verbindung fehlgeschlagen“.
Kann das bitte jemand prüfen?
```

**Checks**

- `title` beschreibt VPN-Verbindungsproblem.
- `severity` entweder plausibel gesetzt oder als fehlend nachgefragt.
- `started_at` bleibt leer (kein expliziter Zeitbezug im Text).

## Case P0-08-02: Mehr Kontext (Slack DM)

**Input**

```text
Hi,
seit heute Morgen komme ich nicht mehr auf das gemeinsame Laufwerk (\\fileserver01\\projects). Es kommt „Zugriff verweigert“, obwohl ich eigentlich die Berechtigung haben müsste.
Ich brauche die Dateien dringend für eine Kundenpräsentation heute.
```

**Checks**

- `title` erfasst Dateiserver/Berechtigungsproblem.
- `impact` beschreibt Business-Auswirkung (Praesentation blockiert).
- Zeitbezug `seit heute Morgen` darf als `started_at` interpretiert werden.

## Case P0-08-03: E-Mail dringend/frustriert

**Input**

```text
Betreff: DRINGEND – Produktionssystem nicht erreichbar

Hallo IT,

das ERP-System reagiert nicht mehr. In der Buchhaltung bekommen alle eine Timeout-Meldung beim Buchen von Rechnungen.
Das Problem besteht seit ca. 09:40 Uhr.

Wir haben heute Monatsabschluss, daher ist das ziemlich kritisch.

Bitte mit hoher Priorität behandeln.

Viele Grüße
Sandra
```

**Checks**

- `title` beschreibt ERP-Ausfall.
- `severity` sollte `high` oder `critical` sein.
- `started_at` wird auf Basis von `09:40 Uhr` gesetzt.

## Case P0-08-04: Strukturiert mit Details

**Input**

```text
Betreff: HTTP 500 Fehler im HR-Portal

Hallo IT-Team,

wir erhalten einen HTTP-500-Fehler im HR-Self-Service-Portal.

- URL: https://hr.company.local/selfservice
- Fehlermeldung: „Internal Server Error“
- Erstmalig aufgetreten: ca. 14:15 Uhr
- Getestet auf zwei unterschiedlichen Client-Rechnern

Mitarbeitende können aktuell keine Urlaubsanträge stellen.

Bitte gebt Bescheid, falls weitere Informationen benötigt werden.

Viele Grüße
Daniel
```

**Checks**

- `title` beschreibt HR-Portal HTTP-500.
- `impact` enthält Blockade fuer Urlaubsantraege.
- `started_at` wird aus `14:15 Uhr` erkannt.

## Case P0-08-05: Emotional und unklar (Slack)

**Input**

```text
Ich weiß nicht, was los ist, aber bei mir geht gerade gar nichts mehr. Outlook fragt ständig nach dem Passwort und Teams verbindet sich nicht.
Internet geht aber.
Könnt ihr bitte schauen?
```

**Checks**

- `title` beschreibt Outlook/Teams-Auth bzw. Connectivity.
- Kein erfundenes historisches `started_at` (Default darf auf aktueller Zeit bleiben).
- `impact` kann Kommunikationsausfall widerspiegeln.

## Case P0-08-06: Technisch mit moeglicher Fehlinterpretation

**Input**

```text
Betreff: Datenbank vermutlich kaputt?

Hallo,

unsere interne Reporting-Anwendung lädt extrem langsam und zeigt teilweise „Connection reset by peer“.
Das betrifft mehrere Kollegen im Controlling.

Ich vermute, dass die Datenbank abgestürzt ist.

Könnt ihr das prüfen?

Danke
Michael
```

**Checks**

- `title` beschreibt beobachtetes Symptom, nicht nur Spekulation.
- `severity` plausibel (mindestens `medium`, bei Mehrfachbetroffenheit eher `high`).
- Unsichere Ursachenbehauptung wird nicht als Fakt behandelt.

## Case P0-08-07: Unpraezise Zeit und indirekter Impact

**Input**

```text
Seit heute Vormittag spinnt der Drucker im 2. OG komplett.
Druckaufträge bleiben hängen oder verschwinden einfach.
Wir können aktuell keine Lieferscheine drucken.
```

**Checks**

- `title` beschreibt Drucker/Print-Queue-Problem.
- `impact` enthält fehlende Lieferscheine.
- `started_at` darf aus `seit heute Vormittag` gesetzt werden.
