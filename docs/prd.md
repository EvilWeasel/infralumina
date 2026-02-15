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
* Title editable (inline input)
* Status dropdown
* Severity dropdown
* Metadata: Reporter, Created, Started, Resolved

**Main Content**

* BlockNote Editor (client-only)
* Save button (oder Auto-save + “Saved” indicator; Phase 0: Save ist ok)

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
  * Nach erfolgreichem "Create Incident", weiterleitung auf Detailseite mit Blocknote Dokument. Vorhandene Informationen aus vorherigen User-Prompts nutzen um den Incident-Report mit Inhalt zu füllen - Tool-Call Blocknote AI

### Pflichtdaten für Incident Creation (Phase 0)

Minimal erforderlich (identisch für Manual Create und AI Create):

* `title` – muss vorhanden sein
* `severity` – muss vorhanden sein (AI extrahiert aus Text oder fragt nach)

Alles andere defaultet oder ist optional:

* `status` – default `open`
* `started_at` – default `now()`
* `impact` – optional, wird aus AI-Text extrahiert wenn vorhanden

**AI Create Mechanik:**

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

1. Incident + leeres `incident_document` persistieren
2. Zur Detailseite navigieren
3. Im Editor einen AI-Command ausführen, der aus dem bisherigen Input einen ersten Report-Draft erzeugt

Damit bleiben DB-Felder deterministisch, während die Dokumenterstellung frei und editor-nah erfolgt.

---

## 7.2 AI Improve Incident Document (Native BlockNote AI)

Ziel: Aus unstrukturiertem Text im BlockNote-Editor ein besser strukturiertes Incident-Dokument machen, ohne eigenes Composer-Schema.

### UX Flow

BlockNote `/ai` Action: `AI: Verbessere / Strukturiere Dokument`

1. Client ruft `invokeAI({ userPrompt, useSelection, streamToolsProvider })` auf
2. Backend streamt via Vercel AI SDK; Modell arbeitet mit BlockNote Tool-Definitions
3. AIExtension übernimmt Tool-Calls und zeigt den nativen Review-Flow
4. User entscheidet:
   * `Accept` → Änderungen übernehmen und speichern
   * `Reject` → Änderungen verwerfen

### Persistenz bei Accept/Reject

* `Accept`: `incident_documents.content_json` aktualisieren (`updated_at`, `updated_by`)
* `Reject`: keine Persistierung
* Phase 1: optional zusätzlich Revisionseintrag pro Accept/Manual Save

### Operationskontrolle pro Command

Für Sicherheit/UX kann je Command eingeschränkt werden:

* `update only` für reine Umschreibungen
* `add + update + delete` für strukturelle Reorganisation

Standard für `AI Improve`: `add + update + delete`, damit echte Strukturverbesserungen möglich sind.

### Minimum Template für “Schönes Incident Doc”

Template ist eine **Guideline**, kein starres Schema.  
Für `AI Create` und `AI Improve` soll diese Zielstruktur angestrebt werden; fehlende Informationen werden als Platzhalter markiert statt erfunden.

1. **Summary**
2. **Impact**
3. **Timeline**
4. **Investigation**
5. **Mitigation / Resolution**
6. **Follow-ups / Next steps**

**Platzhalterregel bei fehlenden Daten:**

* `Unbekannt` oder `Noch zu ergänzen` explizit kennzeichnen
* Keine fiktiven Zeiten, Systeme oder Ursachen erzeugen
* Timeline-Einträge nur anlegen, wenn aus Input ableitbar; sonst leere Timeline-Sektion mit Hinweis

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
* Incident detail page mit BlockNote editor + Save
* AI Create incident from paste (mit Missing field follow-ups)
* AI Improve document mit nativer BlockNote AI (`@blocknote/xl-ai`) inkl. Accept/Reject

## Nice-to-have (nur wenn Zeit)

* Simple search/filter in Incident table
* Auto-save indicator im BlockNote Editor
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

---

# 10. Offene Risiken / Hinweise

* BlockNote ist client-only: Detailseiten sind client-lastiger. Für Phase 0 ok.
* AI: lokaler 3B Modell-Server muss Tool-Calling und strukturierte Outputs stabil unterstützen; sonst Fallback auf OpenAI-kompatiblen Cloud-Provider.
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
