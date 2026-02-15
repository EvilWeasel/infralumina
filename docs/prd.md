## PRD – Infralumina

### 0. Meta

* **Stack:** Next.js (App Router), Tailwind, shadcn/ui, BlockNote, Supabase (Auth+DB), Drizzle ORM, Vercel AI SDK, lokaler llama-server (OpenAI-kompatibel) für lokalen Prototyp mit späterem wechsel auf OpenAI-API oder anderer Cloud-Provider
* **Konventionen:** **Server Actions bevorzugt**, keine klassischen API-Routen, intern (Performance/Caching sekundär), Modularer, Wartbarer Code, Bevorzugt Funktionale Patterns, Composition
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

### Output Schema (Zod)

```ts
{
  title: string,
  severity: "low"|"medium"|"high"|"critical",
  impact?: string,
  started_at?: string, // ISO optional
  summary_blocks: BlockNoteDocDraft, // siehe 7.2
  missing_fields?: Array<{
    field: "impact" | "title" | "started_at",
    question: string
  }>
}
```

---

## 7.2 AI Improve Incident Document (BlockNote Draft + Preview + Accept/Reject)

Dein Ziel:
Aus sloppy Freitext im BlockNote soll AI **das BlockNote-Dokument** anpassen, sodass es sauber strukturiert ist — preferibly **als Draft**, ohne direkt zu überschreiben wenn möglich mit Blocknote AI.

### UX Flow

Blocknote `/ai` Action: Verbessere / Strukturiere Dokument`:

todo: ändere user-flow hierunter um neues design konzept mit nativer blocknote ai wiederzuspiegeln
1. App sendet:

   * current BlockNote JSON
   * incident meta (title, status, severity, started/resolved)
2. AI generiert **BlockNote Draft JSON**
3. UI zeigt **Draft Preview + Compare**
4. User klickt:

   * `Reject` → zurück zum Original, keine Änderungen
   * `Accept` → Original wird ersetzt, Save erfolgt serverseitig

### Preview Design (einfach + erweiterbar)

todo: section anpassen - reflektiert nicht mehr das design - use blocknote ai module instead

**Option 1: Split View Overlay (empfohlen)**

* Beim Klick öffnet sich ein **Full-height Drawer/Overlay** im Main Content (nicht “new page”)
* Oben: “AI Draft Preview”
* Darunter: 2 Spalten:

  * links: “Current” (read-only BlockNote)
  * rechts: “Proposed” (read-only BlockNote)
* Footer: Reject / Accept

> **[Ergänzung / Empfehlung]**: Split View ist die beste Grundlage, um später “Diff View” zu bauen (Phase 1), ohne UX neu zu denken.

**Option 2: Bottom Sheet Compare**

* Von unten fährt ein Pane hoch
* Tabs: Current / Proposed
* Weniger breit, dafür einfacher auf kleinen Screens

Ich empfehle Option 1 für Desktop-first interne Tools.

### Wichtig: Tool-Call statt “LLM spuckt JSON”

Du willst Stabilität und eine zukünftige Diff-Story. Das erreicht man, indem man **nicht** “bitte gib BlockNote JSON aus” als reinen Prompt macht, sondern:

* Modell ruft Tool `compose_blocknote_doc` auf
* Tool nimmt eine **intermediate strukturierte Darstellung** entgegen (sections, bullets, timeline)
* Tool erzeugt daraus deterministisches BlockNote JSON

### Minimum Template für “Schönes Incident Doc”

todo: das ist die "Template" die die ai für neue incident-report blocknote dokumente anstreben soll. falls informationen fehlen diese als platzhalter ohne inhalte einfügen. diese sektion ausformulieren

AI soll typischerweise diese Struktur erzeugen:

1. **Summary**
2. **Impact**
3. **Timeline**
4. **Investigation**
5. **Mitigation / Resolution**
6. **Follow-ups / Next steps**

Das macht Dokus sofort scanbar.

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
todo: nicht mehr split view, blocknotejs ai modul verwenden
* AI Improve document: draft compose → split preview → accept/reject

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
* AI: lokaler 3B Modell → Output muss streng validiert und ggf. retrybar sein. Für lokales testing erstmal okay, fehler zu erwarten aber fehlertolleranz bzw. handling muss bei jedem step mitgedacht werden
* Ohne RLS: Demo ok, aber später geg. nachrüsten (Security/Compliance).

> **[Ergänzung / Empfehlung]**: Auch ohne RLS solltest du serverseitig konsequent Rollen prüfen und niemals “nur UI hide” machen.

---

## Kurze “Design-Entscheidung” für 7.2 (damit du direkt bauen kannst)

todo: refactor section - durch nutzen von blocknote ai modul wahrscheinlich nicht mehr notwendig selbst zu implementieren

Ich würde es so machen:

* **AI Improve** Button öffnet im selben Screen einen **Overlay Split View**.
* Links: aktuelle BlockNote read-only
* Rechts: proposed BlockNote read-only
* Unten sticky: Reject / Accept
* Accept speichert sofort (Server Action) und schließt Overlay.

Das ist für Nutzer “keine Friction” und super erweiterbar Richtung Diff/Revisions.

---

Wenn du möchtest, mache ich als nächsten Schritt direkt noch **zwei konkrete Anhänge** fürs PRD, die Coding-AIs lieben:

1. **Drizzle Schema (TypeScript) + Supabase Auth user mapping**
2. **Tool-Call Design für `compose_blocknote_doc` inkl. konkreter BlockNote JSON Builder-Skeleton** (ohne API Routes, nur Server Actions)

Damit hast du praktisch eine “Bauanleitung” statt nur Spezifikation.
