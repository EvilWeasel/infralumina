## PRD – Infralumina

### 0. Meta

* **Stack:** Next.js (App Router), Tailwind, shadcn/ui, BlockNote + `@blocknote/xl-ai`, Supabase (Auth+DB), Drizzle ORM, Vercel AI SDK, lokaler llama-server (OpenAI-kompatibel) für lokalen Prototyp mit späterem wechsel auf OpenAI-API oder anderer Cloud-Provider
* **Konventionen:** **Server Actions bevorzugt**, keine klassischen Business-API-Routen (Ausnahme: AI-Streaming-Transport), intern (Performance/Caching sekundär), Modularer, Wartbarer Code, Bevorzugt Funktionale Patterns, Composition
* **Auth:** GitHub OAuth only
* **Sprachen:** UI Deutsch, Code Englisch, Projekt-Dokumentation Deutsch, Code-Dokumentation und Kommentare Englisch

---

# 1. Vision

Infralumina ist ein **leichtgewichtiges, intern betriebenes ITSM-System**, das **möglichst wenig Friction** im Alltag erzeugt – speziell in stressigen Situationen (Incident läuft, Telefon klingelt, Slack brennt). Kernidee: **schnell erfassen** → **später sauber dokumentieren** (unterstützt durch AI), ohne dass man einen Prozess-Moloch einführt.

### Langfristige Vision (über Phase 0 hinaus)

Die Plattform soll modular wachsen. Geplante / mögliche Module:

* **Incident Management** (Phase 0 Kern): Intake, Tracking, Doku, Abschluss
* **System Inventory / “Mini-CMDB”**: Systeme, Owner/Team, Kritikalität/Schutzbedarf, Abhängigkeiten, Runbooks
* **Change Management**: Change Requests, Risikoabschätzung, Genehmigungen, Change Windows, Nachweise
* **Service Requests**: standardisierte Anfragen (z. B. Account, VPN, Software) mit Formular + Automatisierung
* **Knowledge Base / Documentation**: Notion-artige rekursive Seitenstruktur (BlockNote) für IT-Prozesse/Runbooks
* **Postmortems / RCA**: strukturierte Incident-Reviews, Maßnahmen, Follow-ups
* **Problem Management**: wiederkehrende Ursachen bündeln, Known Errors, Workarounds
* **Asset/Attachment Handling**: Screenshots, Logs, Links, Diagramme pro Datensatz
* **AI Assistants pro Modul**: Intake → Normalisierung → Dokumentstruktur → Vorschläge → (optional) Automatisierung

**AI ist nicht “Chatbot-Spielerei”, sondern ein Produktivitätswerkzeug**:

* strukturiert Freitext
* erzeugt konsistente Dokumente
* reduziert Schreib-/Nacharbeitszeit
* macht Daten später durchsuchbar und auswertbar

---

# 2. Ziele

## Phase 0 (2 Tage, Demo)

**Ziel:** Ein glaubwürdiges Incident-Management-Modul inkl. AI-Mehrwert, das auch ohne AI gut nutzbar ist.

Muss enthalten:

1. **Landing Page** + GitHub Login
2. **Dashboard Layout** mit collapsible Sidebar (konsistent auf allen App-Seiten)
3. **Rollenmodell**: `user` (read), `operator` (write), `admin` (user mgmt)
4. **Incidents**:

   * Übersicht (Tabelle)
   * Create (Sheet)
   * Detail (Meta + BlockNote Doku)
5. **AI Features**:

   * “AI Create Incident from Text” (mit Follow-up bei fehlenden Pflichtdaten)
   * “AI Improve Document” Mit BlockNote AI integration über `@blocknote/xl-ai`
   * “AI Recompose Incident Document” als stabiler Voll-Neuaufbau in Ziel-Template
6. **Admin Page**: Rollen verwalten

**Explizit nicht in Phase 0:**

* RLS / Policies
* Revision History / Revert (nur als Phase 1 geplant)
* Change Management, Inventory, Knowledge Base (nur Vision/Phase 1)
* Diff View (nur als Phase 1 geplant)

---

## Phase 1 (später)

* Document Tree (rekursive Dokumentation)
* System Inventory / Mini-CMDB + Verlinkung aus Incidents
* Revisionen + Admin Revert
* Audit Log (Append-only)
* Similar Incidents (FTS, oder besser: Embeddings)
* Postmortem Generator (aus Incident + Timeline)
* Voice-to-Text Intake (für Blocknote Document-Edits und "App-Actions" wie neuen incident erstellen)

---

# 3. UI-Konzept

## 3.1 Layout: Public vs. App

### Public (Landing)

* Full-page, ohne Sidebar
* Login Button GitHub
* kurze Erklärung + “Was kann das Tool (Vision)”
* Wenn bereits eingeloggt → redirect nach `/dashboard/incidents`

### App (Dashboard Shell)

* Sidebar links, collapsible
* Main content scrollt normal (kein “scroll locked”)
* Main content hat **max-width** / “reading width”, damit 21:9 nicht unlesbar breit wird

> **[Ergänzung / Empfehlung]**: Maincontent Container z. B. `max-w-6xl mx-auto px-6` und optional “wide mode” toggle.

#### Sidebar Inhalte (konsistent)

* Oben: Firmenlogo
* Section: **ITSM**

  * Incidents
  * (Phase 1) Systems / Inventory
  * (Phase 1) Changes
  * (Phase 1) Requests
* Section: **Knowledge**

  * (Phase 1) Documentation
* Unten: User Avatar + Name/Handle + Dropdown (Logout)

#### Sidebar Controls

* Button zum collapse
* optional Keyboard Shortcut (Ctrl+B / Alt+B)

---

## 3.2 Seiten & Routen

* `/` Landing (public)
* `/dashboard/incidents` Übersicht
* `/dashboard/incidents/[id]` Detail
* `/dashboard/admin` User Management (nur admin)

---

# 4. Rollenmodell & Berechtigungen (Phase 0)

Rollen:

| Rolle    | Beschreibung               | Rechte                  |
| -------- | -------------------------- | ----------------------- |
| user     | Standard nach erstem Login | Lesen                   |
| operator | IT Staff / Schreibrechte   | CRUD Incidents + Doku   |
| admin    | Admin                      | CRUD + Rollen verwalten |

* First login → `user`
* Admin Page nur sichtbar/erreichbar für admin
* Server Actions prüfen Rolle (z. B. wiederverwendbare Guard function)

> **[Ergänzung / Empfehlung]**: UI soll Buttons/Sheets ausblenden, aber **Server Actions sind die echte Autorität**.

---

# 5. Incident Management (Phase 0)

## 5.1 Datenmodell (minimal, aber vollständig)

### incidents

* `id` uuid - auto
* `title` text (required)
* `status` enum: `open | in_progress | resolved` - default open
* `severity` enum: `low | medium | high | critical` - required
* `impact` text (optional für manual create; **AI create kann nachfragen**, siehe 7.1)
* `started_at` timestamp (default now)
* `resolved_at` timestamp nullable
* `reporter_id` user_id (auto aus auth)
* `created_at` timestamp
* `updated_at` timestamp

### incident_documents

* `id` uuid
* `incident_id` uuid
* `content_json` jsonb (BlockNote document)
* `updated_at`
* `updated_by`

> **[Ergänzung / Empfehlung]**: Später (Phase 1) können hier Revisionen dranhängen; Phase 0 bleibt “latest only”.

---

## 5.2 Incident Übersicht (Table Page)

Route: `/dashboard/incidents`

### UI Aufbau

* Header:

  * Titel “Incidents”
  * Actions:

    * `New Incident` (Sheet)
    * `AI Create` (Sheet)
* Data-Table (sortable/filter optional, Phase 0 minimal)

### Spalten (dein Wunsch: “wichtige Felder sichtbar”)

* Title
* Status
* Severity
* Started
* Resolved (falls null: “—” oder “Open”)
* Reporter
* Updated

> **[Ergänzung / Empfehlung]**: Kleine “Badge”-Styles für Status/Severity (shadcn Badge).

### Row Click

* Klick auf Zeile → `/dashboard/incidents/[id]`

---

## 5.3 Manual Create Flow (Sheet)

Button `New Incident` öffnet Sheet rechts.

Pflichtfelder:

* Title
* Severity
* Status = default open
* Started_at = default now

Optional:
* Impact (kurzer Text)

Submit:

* Insert incident
* Create initial incident_document (leer, später mit “Template”)
* Redirect zur Detailseite mit dem Blocknote Dokument

---

## 5.4 Incident Detail Page

Route: `/dashboard/incidents/[id]`

### Layout

**Top Bar**

* Back (“Incidents”)
* Incident updated timestamp
* Compact summary with colored badges for Status + Severity
* Collapsible Meta-Bereich mit:
  * Title editable
  * Status dropdown
  * Severity dropdown
  * Metadata: Reporter, Created, Started, Resolved

**Main Content**

* BlockNote Editor (client-only)
* Debounced Auto-save (3s nach letzter Aenderung)
* Save-state Indikator in der Dokument-Headerzeile (Saving/Unsaved/Last update)
* Unsaved-changes Guard:
  * In-App Navigation via Dialog (Bleiben / Verlassen nach erfolgreichem Save)
  * Browser-Tab-Close/-Reload via nativer `beforeunload` Prompt

**Blocknote /ai Menü Integration**

* `AI: Inkludiere von unstrukturiertem Text`
* `AI: Verbessere / Strukturiere Dokument`

---

# 6. Admin Page (Phase 0)

Route: `/dashboard/admin` (nur admin)

* Data-Table: User (GitHub handle), Role dropdown, Save
* Optional: search

---

# 7. AI Features (Phase 0)

## 7.1 AI Create Incident from Text (mit Follow-up)

Ziel: Aus E-Mail / Slack Paste / Freitext **einen Incident anlegen**. Wenn Informationen fehlen (für required db-fields), wird **gezielt nachgefragt**.

### UI Flow

* User ist auf `/dashboard/incidents`
* Button `AI Create` öffnet Sheet
* Sheet enthält:

  * Textarea: “Füge Beschreibungstext ein”
  * Button: “Analyze”
  * Spinner zeigt loading state bis response ready
* Nach Analyze:

  * entweder: direkt “Create Incident” wenn alle required db-fields extrahiert werden konnten
  * oder: Follow-up Prompt wo explizit nach fehlenden Feldern gefragt wird (frage nach allen fehlenden feldern, aber gibt dem user feedback welche required sind und welche optional)
    * Erneute Analyze.
  * Nach erfolgreichem "Create Incident", weiterleitung auf Detailseite mit initialem Incident-Dokument im Ziel-Template

### Pflichtdaten für Incident Creation (Phase 0)

Minimal erforderlich (identisch für Manual Create und AI Create):

* `title` – muss vorhanden sein
* `severity` – muss vorhanden sein (AI extrahiert aus Text oder fragt nach)

Alles andere defaultet oder ist optional:

* `status` – default `open`
* `started_at` – default `now()`
* `impact` – optional, wird aus AI-Text extrahiert wenn vorhanden

**AI Create Mechanik:**

* Implementierung ueber **Vercel AI SDK** mit **Zod structured output** (kein direkter Low-Level REST-Call im Feature-Code)
* Provider in Phase 0: `@ai-sdk/openai-compatible` gegen lokalen `llama.cpp` Endpoint (`LOCAL_LLM_BASE_URL`, `LOCAL_LLM_MODEL`)
* Spaeterer Wechsel auf Cloud-Provider (z. B. OpenAI) soll nur Provider-Konfiguration aendern, nicht den Workflow
* AI analysiert den Paste/Textarea-Text
* Versucht `title` und `severity` zu extrahieren
* Falls eines oder beide fehlen → Follow-up Fragen (explizit nennen, dass diese erforderlich sind)
* User antwortet → erneute Analyse
* Sobald beide Pflichtfelder gefüllt sind → "Create" Button aktivieren
* Optional extrahierte Felder (`impact`, `started_at`) werden mitgenommen, müssen aber nicht vorhanden sein

**Output Schema (Zod):**

```ts
{
  title?: string,
  severity?: "low"|"medium"|"high"|"critical",
  impact?: string,
  started_at?: string,
  missing_fields?: Array<{
    field: "title" | "severity",
    question: string
  }>
}
```

### Follow-up Mechanik

AI liefert zwei mögliche Ergebnisse:

**A) Enough info → Create**

* Filled fields + summary
* UI zeigt Preview (readonly fields) + “Create”

**B) Missing critical fields → Ask**

* `missing_fields: [...]` mit klaren Fragen
* AI fragt explizit nach fehlenden Informationen für missing fields
* User gibt in Prompt weitere informationen an

**Wichtig:** Das obige Schema ist nur für strukturierte Incident-Felder. Narrative Dokumentinhalte werden nicht als JSON vom Modell erzeugt, sondern über BlockNote AI-Tools in Schritt 2.

### Schritt 2 nach erfolgreicher Incident-Erstellung

Nach `Create Incident`:

1. Incident + initiales `incident_document` persistieren
2. Zur Detailseite navigieren
3. Dokument ist sofort im Incident-Template vorbefuellt, fehlende Inhalte mit Platzhaltern markiert

Damit bleiben DB-Felder deterministisch und das Startdokument konsistent.

### Incident-Dokument Template (AI Create Default)

Das initiale Dokument aus AI Create folgt dieser Struktur:

1. **Title**
   * Enthält Incident-Titel und kurze Problembeschreibung aus dem User-Text
2. **Impact**
   * Auswirkungen aus dem Input; bei fehlenden Daten Platzhalter
3. **Timeline**
   * Liste extrahierter Timeline-Events (mindestens Incident Start / Report-Zeit)
   * Zeitformat: `15.2.2026 23:19`
4. **Investigation**
   * Erste Analyse-/Untersuchungsschritte und Findings
5. **Resolution**
   * Mitigation-/Resolution-Schritte
6. **Follow-ups**
   * Offene Folgeaufgaben

Regeln:
* Fehlende Informationen mit `Noch zu ergänzen` markieren.
* Keine Fakten erfinden.
* `started_at` bleibt editierbar, defaultet bei fehlender Extraktion auf aktuelle Zeit.
* UI-Datumsformat ist Deutsch inkl. 24h-Zeit.

---

## 7.2 AI Improve Incident Document (Template Recompose)

Ziel: Aus bestehendem, ggf. unstrukturiertem Editor-Inhalt ein konsistentes Incident-Dokument im Ziel-Template erzeugen.

### UX Flow

Detailseite Button: `AI verbessern`

1. Client sendet den aktuellen Dokumentinhalt an den Recompose-Flow.
2. Backend ruft Modell via Vercel AI SDK auf und extrahiert/normalisiert in das Incident-Template.
3. Ergebnis ersetzt das aktuelle Dokument als *ein* konsistenter Stand (keine parallelen/duplizierten Templates).
4. Recompose-Ergebnis wird persistiert und als letzter Dokumentstand angezeigt.

### Persistenz

* Nach erfolgreichem Recompose wird `incident_documents.content_json` aktualisiert (`updated_at`, `updated_by`)
* Phase 1: optional Revisionseintrag pro Recompose/Manual Save

### Zielstruktur fuer Recompose

Template ist fuer `AI verbessern` **verbindlich**:

1. **Title**
2. **Impact**
3. **Timeline**
4. **Investigation**
5. **Resolution**
6. **Follow-ups**

**Platzhalterregel bei fehlenden Daten:**

* `Unbekannt` oder `Noch zu ergänzen` explizit kennzeichnen
* Keine fiktiven Zeiten, Systeme oder Ursachen erzeugen
* Timeline-Einträge nur anlegen, wenn aus Input ableitbar; sonst Platzhalter in der Timeline-Sektion
* Recompose darf keine zweite Parallelstruktur erzeugen und keine Inhalte blind duplizieren

---

# 8. Phase 0 Deliverables (Definition of Done)

Am Ende von 2 Tagen:

## Must-have

* GitHub OAuth login
* Redirect logic (logged-in → `/dashboard/incidents`)
* Dashboard shell mit collapsible Sidebar + User Avatar unten
* Rollen: user/operator/admin
* Admin page (role management)
* Incidents list table mit relevanten Spalten inkl. Resolved
* Incident create sheet (minimal)
* Incident detail page mit editor-first Layout, collapsible Meta und BlockNote Auto-save
* AI Create incident from paste (mit Missing field follow-ups)
* AI Improve document als stabiler Template-Recompose ohne Duplikate

## Nice-to-have (nur wenn Zeit)

* Simple search/filter in Incident table
* “Append notes from text” AI action in blocknote `/ai` command

---

# 9. Phase 1 Roadmap (geplant)

## 9.1 Documentation Module (rekursiv)

* documents table (parent_id)
* Tree view in sidebar
* BlockNote pages
* Optional: server-rendered preview HTML für read-only (Performance)

## 9.2 System Inventory / Mini-CMDB

* systems table + BlockNote docs
* later: link incidents → systems

## 9.3 Revision History + Admin Revert

* store revisions on each save
* revert only admin
* later: diff view

## 9.4 Auditability

* audit log (append-only)
* show in admin UI

## 9.5 Similar Incidents

* Phase 1: full-text search
* Phase 2: embeddings + semantic similarity

## 9.6 AI Model Capability Upgrade

Ziel in Phase 1: AI-Features von lokalem Experiment-Setup auf leistungsfaehigere Modelle mit stabileren Capabilities bringen.

* Mehrere Provider/Modelle konfigurierbar machen (lokal + Cloud), ohne Feature-Code umzubauen.
* Capability-Matrix einfuehren (Structured Output, Tool-Calling, Context-Laenge, Latenz).
* Routing/Fallback definieren:
  * bevorzugtes Modell pro AI-Feature
  * Fallback bei Timeouts/invalid output
* Secrets/Provider-Konfiguration fuer Cloud-Betrieb sauber trennen (lokal vs. deployed).

## 9.7 AI Feature Revalidation + Refactor

Nach Modell-Upgrade werden alle bestehenden AI-Features systematisch neu geprueft und bei Bedarf ueberarbeitet:

* `AI Create Incident from Text`
  * Extraktionsqualitaet, Missing-Field Follow-up, Started-At Parsing
* `AI Improve / Recompose Document`
  * Strukturtreue, keine Duplikate, sinnvolle Uebernahme neuer Findings
* Prompting/Parser/Fallback-Strategien auf Basis der neuen Modelle nachziehen.
* Regression-Tests mit Fixture-Corpus erweitern.

Abschlusskriterium:
* Alle Phase-0 AI-Flows sind mit den neuen Modellen reproduzierbar stabil und dokumentiert.

## 9.8 Cloud Agent Delivery (Phase-1 Abschluss)

Letztes Feature in Phase 1 wird bewusst in einer Cloud-Agent-Umgebung umgesetzt, in der lokale Modelle nicht verfuegbar sind.

* Ziel: Verifizieren, dass das Projekt auch mit cloudbasiertem Agent-Workflow sauber weiterentwickelbar ist.
* Fokus:
  * reproduzierbarer Plan-/Branch-/PR-Flow in der Cloud
  * saubere Uebergabe zwischen lokalen und Cloud-Agent-Laeufen
  * AI-Features gegen Cloud-Modelle validieren

---

# 10. Offene Risiken / Hinweise

* BlockNote ist client-only: Detailseiten sind client-lastiger. Für Phase 0 ok.
* AI: lokaler 3B Modell-Server muss Tool-Calling und strukturierte Outputs stabil unterstützen; sonst Fallback auf OpenAI-kompatiblen Cloud-Provider.
* Lokale kleine Modelle koennen bei Recompose/Refinement trotz korrekter Integration qualitativ unzureichend sein; Phase 1 Modell-Upgrade ist eingeplant.
* AI-Feldextraktion kann trotz Schema unvollständig sein: Follow-up Flow bleibt Pflicht.
* BlockNote AI (`@blocknote/xl-ai`) ist XL/dual-lizenziert (u. a. GPL/Commercial). Lizenzentscheidung muss vor produktiver Nutzung geklärt sein.
* Ohne RLS: Demo ok, aber später geg. nachrüsten (Security/Compliance).

> **[Ergänzung / Empfehlung]**: Auch ohne RLS solltest du serverseitig konsequent Rollen prüfen und niemals “nur UI hide” machen.

---

## 11. Architektur-Leitplanken aus Research

* Keine incident-spezifische Zwischenrepräsentation für Narrative bauen; Dokument-Edits laufen über BlockNote AI Tools.
* Trennung strikt halten:
  * Structured Output (Vercel AI SDK) für Incident-DB-Felder
  * BlockNote AI für inhaltliche Dokumentbearbeitung
* Template-Guidance im User Prompt oder als pre-seeded Dokument verwenden, nicht durch harte Schema-Validierung erzwingen.
* Core-Systemprompt von BlockNote AI nur minimal anpassen; domänenspezifische Regeln als zusätzlichen Prompt-Kontext mitgeben.
* Falls später ein eigener Chat neben dem `/ai` Menü gebraucht wird, auf BlockNote AI APIs (`buildAIRequest` / `sendMessageWithAIRequest`) aufsetzen statt das Protokoll neu zu bauen.
