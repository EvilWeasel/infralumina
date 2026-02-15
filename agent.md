# Infralumina Agent Context

## Projektziel
Infralumina ist ein leichtgewichtiges internes ITSM-System mit Fokus auf Incident Management in stressigen Situationen:
`schnell erfassen -> später sauber dokumentieren`.

Phase 0 ist ein 2-Tage-Demo-Inkrement mit belastbarer Basisfunktion, die auch ohne AI nutzbar bleibt.

## Agentic Workflow (Pflicht fuer Implementierung)
- Primarer Umsetzungsplan: `docs/phase0-implementation-plan.md`
- Persistente Memory-Datei: `docs/agent-learnings.md`
- Kurzzeit-Planung:
  - `current-plan.md` (aktiver Arbeitsplan)
  - `plan-archive.md` (abgeschlossene Plan-Segmente)
- Bei Implementierungsauftraegen immer zuerst dort Feature-ID und Abhaengigkeiten aufloesen.
- Fuer parallele Umsetzung die Lanes und Start-/Finish-Checklist aus dem Plan befolgen.
- Pro Aufgabe genau einen Feature-Branch nach Plan-Schema verwenden (`feat/p0-<id>-<slug>`).
- Feature-Branches werden nach Abschluss standardmaessig **nicht** automatisch geloescht (Historie bleibt fuer Nachvollziehbarkeit erhalten).
- Verbindlicher Ablauf pro Feature (Standard lokal/interaktiv):
  1. User-Auftrag analysieren und Feature im Plan identifizieren (neu oder bestehend).
  2. Feature im eigenen Branch implementieren.
  3. Typecheck + Tests ausfuehren.
  4. Wenn Checks grün sind: Aenderungen kurz zusammenfassen und User um Verifikation bitten.
  5. Nach User-Verifikation committen.
  6. Feature im Plan als done markieren (Status + Delivery Notes + Open Questions).
  7. Learnings in `docs/agent-learnings.md` loggen.
  8. Mit den geloggten Learnings zurueckmelden und nach dem naechsten Task fragen.
- Verbindlicher Ablauf fuer Cloud-Agent-Lauf (ohne Human-in-the-loop):
  1. User-Ziel in `current-plan.md` in konkrete Feature-Pakete zerlegen (inkl. Abhaengigkeiten, Reihenfolge, Parallelisierung).
  2. Features selbststaendig implementieren, testen, committen, pushen und PRs erstellen.
  3. Nach jedem abgeschlossenen Feature den aktiven Abschnitt aus `current-plan.md` nach `plan-archive.md` verschieben.
  4. Ohne Zwischenfreigaben direkt mit dem naechsten angeforderten Feature fortfahren, bis alle User-Features umgesetzt sind.
  5. Erst am Ende Gesamtstatus reporten (inkl. PR-Liste, Tests, offene Risiken).
- `current-plan.md` immer minimal halten:
  - nur aktive/naechste Aufgaben
  - erledigte Abschnitte sofort archivieren
  - keine langen historischen Logs in der aktiven Datei
- Optional spaeter: Branch-Cleanup nur explizit auf User-Wunsch (lokal/remote getrennt bestaetigen).
- Nach Umsetzung den zugehoerigen Feature-Block im Plan aktualisieren:
  - Status
  - Delivery Notes
  - Open Questions
- Wenn PRD und Plan abweichen, gilt `docs/prd.md`; danach den Plan aktualisieren.

## Persistente Memory-Strategie
- Quellen fuer Agent-Memory:
  - `docs/prd.md` (Produktanforderungen)
  - `docs/phase0-implementation-plan.md` (Umsetzungsstatus/Abhaengigkeiten)
  - `docs/agent-learnings.md` (praxisnahe Learnings)
  - `current-plan.md` (kurzfristiger Arbeitskontext)
  - `plan-archive.md` (abgeschlossene Plan-Segmente)
  - Git-Historie (`git log`) als nachvollziehbare Zeitlinie
- Learnings-Log ist append-only (kein Umschreiben alter Eintraege).
- Pro abgeschlossenem Feature genau ein Learning-Block.
- Learnings immer erst nach User-Verifikation + Commit eintragen.

## Phase-0 Scope (Must-Have)
1. Landing Page (`/`) mit GitHub Login und Redirect für eingeloggte User auf `/dashboard/incidents`.
2. Dashboard Shell mit collapsible Sidebar und konsistentem Layout.
3. Rollenmodell: `user` (read), `operator` (write), `admin` (role management).
4. Incident-Modul:
   - Liste (`/dashboard/incidents`)
   - Create Sheet (manual)
   - Detailseite (`/dashboard/incidents/[id]`) mit Meta + BlockNote-Doku
5. AI Features:
   - `AI Create Incident from Text` inkl. Follow-up bei fehlenden Pflichtdaten
   - `AI Improve Document` via `@blocknote/xl-ai` mit Accept/Reject
6. Admin-Seite (`/dashboard/admin`) für Rollenverwaltung (nur admin).

## Nicht Teil von Phase 0
- RLS/Policies
- Revision History / Revert
- Diff View
- Change Management, Inventory, Knowledge Base (erst spätere Phasen)

## Architektur-Leitplanken
- Stack: Next.js App Router, Tailwind, shadcn/ui, BlockNote + `@blocknote/xl-ai`, Supabase (Auth+DB), Drizzle ORM, Vercel AI SDK.
- Konvention: Server Actions bevorzugen; keine klassischen Business-API-Routen.
  - Ausnahme: AI-Streaming-Transport.
- Rollenprüfung serverseitig erzwingen. UI-Hiding ist nur UX, nicht Security.
- AI strikt trennen:
  - Strukturierte Incident-Felder: Vercel AI SDK Structured Output (z. B. Zod Schema).
  - Narrative Dokumentbearbeitung: BlockNote AI Tools.
- Keine eigene narrative Zwischenrepräsentation für Incident-Dokumente einführen.

## Datenmodell (Phase 0)
### `incidents`
- `id` uuid
- `title` text (required)
- `status` enum: `open | in_progress | resolved` (default `open`)
- `severity` enum: `low | medium | high | critical` (required)
- `impact` text (optional)
- `started_at` timestamp (default `now`)
- `resolved_at` timestamp nullable
- `reporter_id` user id
- `created_at`, `updated_at`

### `incident_documents`
- `id` uuid
- `incident_id` uuid
- `content_json` jsonb (BlockNote document)
- `updated_at`
- `updated_by`

## AI Create Incident: Mindestanforderung
Pflichtfelder vor Create:
- `title`
- `severity`

Optional/default:
- `status` default `open`
- `started_at` default `now`
- `impact` optional

Wenn Pflichtfelder fehlen, Follow-up-Fragen gezielt für fehlende Felder stellen und erst dann Create ermöglichen.

## UX-Richtlinien
- Sidebar links, collapsible, auf allen Dashboard-Seiten konsistent.
- Main Content mit begrenzter Lesebreite (z. B. `max-w-6xl mx-auto px-6`).
- Tabelle zeigt mindestens: `title`, `status`, `severity`, `started`, `resolved`, `reporter`, `updated`.
- Status/Severity visuell mit Badges.

## Sprach- und Doku-Regeln
- UI: Deutsch
- Code: Englisch
- Projekt-Dokumentation: Deutsch
- Code-Kommentare/-Doku: Englisch

## Arbeitsmodus für Implementierung
- Kleine, modulare, wartbare Komponenten.
- Funktionale Patterns und Composition bevorzugen.
- Bei neuen Features zuerst Autorisierung + Datenmodell + Server Action festziehen, danach UI/AI-Flow.
- Bei AI-Features deterministische DB-Operationen von generativer Dokumentbearbeitung trennen.

## Lokale Kommandos
- Paketmanager-Standard: **Bun**
- Dev: `bun run dev`
- Lint: `bun run lint`
- Build: `bun run build`
- Typecheck (falls kein Script): `bunx tsc --noEmit`
- Tests:
  - bevorzugt `bun run test`
  - falls keine Tests konfiguriert sind: explizit als Luecke reporten

## Definition of Done (Phase 0, kurz)
- Auth + Redirect funktionieren.
- Rollen und Guards funktionieren serverseitig.
- Incident List/Create/Detail stabil nutzbar.
- Admin-Rollenverwaltung vorhanden.
- AI Create (mit Missing-Field Follow-up) und AI Improve (Accept/Reject) funktionieren.
