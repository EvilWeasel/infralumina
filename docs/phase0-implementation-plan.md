# Infralumina Phase 0 Implementation Plan (Living Document)

Stand: 2026-02-15  
Quelle der Anforderungen: `docs/prd.md`  
Zweck: Operativer Umsetzungsplan fuer AI-Agents und Entwickler in klaren, selbststaendigen Feature-Branches.

## 1. Wie dieses Dokument genutzt wird

Dieses Dokument ist die Arbeitsgrundlage fuer Phase 0 Implementierung.  
`docs/prd.md` bleibt das fachliche Master-Dokument.  
Wenn PRD und Plan kollidieren, gilt PRD; der Plan muss dann aktualisiert werden.

Jeder Agent arbeitet immer so:
1. Passendes Feature ueber Feature-ID suchen.
2. Eigenen Branch nach Plan-Namensschema erstellen.
3. Feature komplett (Code + Tests + Doku-Update) umsetzen.
4. Status im Feature-Block aktualisieren.
5. Offene Punkte im Block `Open Questions` dokumentieren.

## 2. Branch- und PR-Standard

- Branch-Name: `feat/p0-<id>-<slug>`
- PR-Titel: `[P0-<id>] <kurzer Titel>`
- Pro Branch genau ein Feature-Block aus diesem Plan.
- Keine Misch-PRs mit mehreren Feature-IDs.
- Jede PR enthaelt:
  - umgesetzte Acceptance Criteria
  - Screenshots/GIF bei UI-Aenderungen
  - Testnachweise (`lint`, Build, ggf. manuelle Flows)

## 3. Globale Engineering-Regeln fuer Agents

- Server Actions sind fuer Business-Logik Standard.
- Rollenpruefung serverseitig erzwingen, niemals nur ueber UI.
- UI-Sprache Deutsch; Code und Kommentare Englisch.
- Keine RLS in Phase 0.
- AI-Aufgaben strikt trennen:
  - Strukturierte Incident-Felder: Structured Output
  - Dokumentbearbeitung: BlockNote AI
- Jede Aenderung muss reversibel und klein genug fuer Review bleiben.

## 4. Status-Legende

- `TODO`: noch nicht gestartet
- `IN_PROGRESS`: aktive Umsetzung
- `BLOCKED`: externer Blocker
- `REVIEW`: fertig, wartet auf Review/Merge
- `DONE`: gemerged in `main`

## 5. Feature-Index (Phase 0)

| ID | Feature | Branch | Depends On | Status |
| --- | --- | --- | --- | --- |
| P0-01 | Datenbasis + Rollenmodell + Auth-Basis | `feat/p0-01-data-auth-roles` | - | DONE |
| P0-02 | Public Landing + Login + Redirects | `feat/p0-02-landing-login-redirect` | P0-01 | DONE |
| P0-03 | Dashboard Shell + Sidebar + Navigation | `feat/p0-03-dashboard-shell-sidebar` | P0-02 | DONE |
| P0-04 | Rollen-Guards + Admin User Management | `feat/p0-04-admin-role-management` | P0-01, P0-03 | DONE |
| P0-05 | Incident Liste (Tabelle + Navigation) | `feat/p0-05-incidents-list` | P0-01, P0-03 | DONE |
| P0-06 | Manual Incident Create (Sheet + Persistenz) | `feat/p0-06-incident-manual-create` | P0-05 | DONE |
| P0-07 | Incident Detail + Meta-Update + Dokument Save | `feat/p0-07-incident-detail-editor-save` | P0-06 | DONE |
| P0-08 | AI Create Incident from Text (Follow-up) | `feat/p0-08-ai-create-incident` | P0-06 | DONE |
| P0-09 | AI Improve Document (BlockNote AI) | `feat/p0-09-ai-improve-document` | P0-07 | TODO |
| P0-10 | End-to-End Hardening + Demo QA | `feat/p0-10-phase0-hardening` | P0-04..P0-09 | TODO |

## 5.1 Parallelisierungs-Lanes (fuer mehrere Agents)

Empfohlene Reihenfolge mit minimalen Konflikten:
- Lane A (Foundation): P0-01 -> P0-02 -> P0-03
- Lane B (RBAC/Admin): P0-04 (startet nach P0-01 + P0-03)
- Lane C (Incident Core): P0-05 -> P0-06 -> P0-07
- Lane D (AI): P0-08 (nach P0-06), P0-09 (nach P0-07)
- Lane E (Stabilisierung): P0-10 am Ende

Regel fuer parallele Arbeit:
- Agent darf ein Feature nur starten, wenn `Depends On` auf `DONE` oder in den Zielbranch gemerged ist.
- Bei unvermeidbarer Abhaengigkeit auf unge-mergte Branches:
  - explizit in `Open Questions` dokumentieren
  - Rebase-Plan im PR-Text nennen

## 5.2 Start-/Finish-Checklist pro Feature

Start:
1. `docs/prd.md` und diesen Feature-Block lesen.
2. Branch gemaess Namensschema erstellen.
3. Feature-Status auf `IN_PROGRESS` setzen.
4. Annahmen direkt im Feature-Block unter `Open Questions` dokumentieren.

Finish:
1. Acceptance Criteria gegenchecken.
2. `lint` und Build ausfuehren.
3. Feature-Status auf `REVIEW` setzen.
4. `Delivery Notes` und Handoff-Template ausfuellen.
5. Nach Merge auf `DONE` setzen.

## 6. Feature Cards (ausfuehrbar durch Agents)

## P0-01 Datenbasis + Rollenmodell + Auth-Basis

Status: DONE  
Branch: `feat/p0-01-data-auth-roles`  
Depends On: -  
Tags: `db`, `supabase`, `drizzle`, `auth`, `roles`

Ziel:
- Minimale persistente Basis fuer User, Rollen, Incidents und Incident-Dokumente bereitstellen.

Scope:
- Tabellen/Enums fuer `incidents`, `incident_documents`, User-Rollen.
- First-login Default-Rolle `user`.
- GitHub OAuth vorbereiten (technische Integration, noch ohne ausgebaute UI).

Implementierungsschritte:
1. DB-Schema und Migrationen fuer Phase 0 Kernmodelle anlegen.
2. Enum-Werte gemaess PRD setzen:
   - status: `open | in_progress | resolved`
   - severity: `low | medium | high | critical`
3. Rollenmodell mit `user | operator | admin` abbilden.
4. Helper fuer current user + role lookup erstellen.
5. Seed/Bootstrap-Mechanismus fuer initialen Admin dokumentieren.

Acceptance Criteria:
- Incident- und Dokument-Tabellen vorhanden und migriert.
- Rollendaten pro User aufloesbar.
- Ohne Rolle wird bei erstem Login `user` zugewiesen.

Tests:
- Migration laeuft lokal fehlerfrei.
- Rollen-lookup liefert erwartete Werte.

Update bei Abschluss:
- Status setzen (`REVIEW` oder `DONE`).
- Migrationsdateien + relevante Module im Abschnitt `Delivery Notes` eintragen.

Delivery Notes:
- Added Supabase and Drizzle dependencies in `package.json`.
- Added environment template in `.env.example`.
- Added SQL migration in `supabase/migrations/202602150001_phase0_foundation.sql`.
- Added Drizzle schema/config in `lib/db/schema.ts` and `drizzle.config.ts`.
- Added auth/session helpers in `lib/auth/session.ts` and `lib/auth/roles.ts`.
- Added Supabase clients in `lib/supabase/*`.
- Added OAuth callback route in `app/auth/callback/route.ts`.
- Added setup/bootstrap guide in `docs/setup-supabase.md`.
- Applied migrations directly on Supabase via MCP:
  - `phase0_foundation`
  - `phase0_foundation_hardening`
- Updated code/docs to use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` with fallback to legacy anon key.
- Checks run: `npm run lint` (passes, one pre-existing warning), `npm run build` (passes).

Open Questions:
- Browser `beforeunload` guard can protect against tab close/refresh with unsaved edits, but an app-internal route-leave save/discard dialog should be added in Phase 1 together with revision-aware save/discard semantics.
- Detail page should move toward a Notion-like editor-first layout in Phase 1: reduce container nesting/padding and make metadata/navigation feel lighter while keeping quick access.

## P0-02 Public Landing + Login + Redirects

Status: DONE  
Branch: `feat/p0-02-landing-login-redirect`  
Depends On: P0-01  
Tags: `landing`, `auth`, `redirect`, `public`

Ziel:
- Public Einstiegsseite mit GitHub Login und sauberer Redirect-Logik.

Scope:
- Route `/` als Public Landing.
- Bei bestehender Session Redirect auf `/dashboard/incidents`.
- Login CTA fuer GitHub OAuth.

Implementierungsschritte:
1. Landing Page Inhalt und CTA in deutscher UI-Sprache umsetzen.
2. Session-Check serverseitig im Einstiegspfad einbauen.
3. Redirect-Logik fuer eingeloggte User implementieren.
4. Fehlerzustand fuer fehlgeschlagenen Login als minimalen UX-State vorsehen.

Acceptance Criteria:
- Nicht eingeloggte User sehen Landing.
- Eingeloggte User landen direkt auf `/dashboard/incidents`.
- GitHub Login startet korrekt.

Tests:
- Manuell: unauthenticated vs authenticated Pfad pruefen.
- Lint + Build.

Delivery Notes:
- Replaced root page filler with real public landing in `app/page.tsx`.
- Added GitHub OAuth CTA wired to server action `signInWithGitHub("/dashboard/incidents")`.
- Added authenticated redirect from `/` to `/dashboard/incidents`.
- Added minimal auth error state for callback failures (`auth_error` query param).
- Added protected placeholder route `app/dashboard/incidents/page.tsx` as redirect target for login validation.
- Updated app metadata/lang in `app/layout.tsx` (`Infralumina`, `de`).
- Switched font setup to local/system-safe fallback to avoid external font fetch dependency in CI/sandbox.
- Fixed anonymous session handling so missing auth session does not throw on `/` (`Auth session missing` now resolves to unauthenticated state).
- Added global `next-themes` provider with default dark mode and light-mode support.
- Checks run: `npm run lint` (passes, one pre-existing warning), `npx next build --webpack` (passes).

Open Questions:
- -

## P0-03 Dashboard Shell + Sidebar + Navigation

Status: DONE  
Branch: `feat/p0-03-dashboard-shell-sidebar`  
Depends On: P0-02  
Tags: `layout`, `sidebar`, `dashboard`, `navigation`

Ziel:
- Einheitliches App-Layout fuer alle Dashboard-Routen.

Scope:
- Collapsible Sidebar links.
- Navigationspunkte mindestens fuer Incidents und Admin (Admin ggf. role-based sichtbar).
- Footer-Bereich mit User-Info + Logout.
- Theme toggle im Sidebar-Footer (light/dark, optional system) als UX-Polish.
- Main Content mit lesbarer max-width.

Implementierungsschritte:
1. Dashboard Layout unter `app/dashboard/...` strukturieren.
2. Sidebar-Komponente mit collapse state bauen.
3. Navigation und aktive Route visuell kennzeichnen.
4. Theme toggle in Sidebar integrieren (auf `next-themes` aufbauen).
5. Content-Container mit Breitenlimit implementieren.

Acceptance Criteria:
- Alle Dashboard-Seiten nutzen die Shell.
- Sidebar ist einklappbar.
- Layout bleibt auf Desktop/Mobile nutzbar.

Tests:
- Manuell auf typischen Breakpoints.
- Lint + Build.

Delivery Notes:
- Added shared authenticated dashboard layout in `app/dashboard/layout.tsx`.
- Implemented responsive/collapsible sidebar shell in `components/dashboard/dashboard-shell.tsx`.
- Added sectioned navigation (`ITSM`, `Knowledge`) with active route styling.
- Added footer with user label, role, logout action, and theme toggle.
- Added theme toggle component in `components/dashboard/theme-toggle.tsx` (built on `next-themes`).
- Reworked footer into user dropdown with GitHub avatar, role context, logout, and account-switch action.
- Added admin placeholder route in `app/dashboard/admin/page.tsx` (admin-only access via `requireRole(\"admin\")`).
- Updated incidents page to render inside the shared shell in `app/dashboard/incidents/page.tsx`.
- Checks run: `npm run lint` (passes, one pre-existing warning), `npm run build` (passes), `npx next build --webpack` (passes).

Open Questions:
- Chrome DevTools MCP timed out in this session, so visual verification needs manual confirmation in browser.

## P0-04 Rollen-Guards + Admin User Management

Status: DONE  
Branch: `feat/p0-04-admin-role-management`  
Depends On: P0-01, P0-03  
Tags: `rbac`, `admin`, `guards`, `user-management`

Ziel:
- Autorisierung zentral und serverseitig absichern.

Scope:
- Reusable Guard-Funktionen fuer `user`, `operator`, `admin`.
- Route `/dashboard/admin` nur fuer admin.
- Admin-Tabelle mit Rollen-Update pro User.

Implementierungsschritte:
1. Guard Utilities fuer Server Actions und Seitenzugriff erstellen.
2. Admin-Seite mit User-Liste und Rollen-Dropdown bauen.
3. Server Action fuer Rollenupdate (nur admin) implementieren.
4. UI-Verhalten auf Rollen abstimmen, aber Autoritaet serverseitig halten.

Acceptance Criteria:
- Nicht-admin kann `/dashboard/admin` nicht nutzen.
- Admin kann Rollen aendern und persistieren.
- Rollenwechsel wirkt unmittelbar in nachfolgenden Requests.

Tests:
- Manuelle Role-Switch-Checks.
- Negative Tests fuer unautorisierte Zugriffe.
- Lint + Build.

Delivery Notes:
- Kept reusable role guard primitives in `lib/auth/roles.ts` and `lib/auth/session.ts`.
- Enforced admin-only access on `/dashboard/admin` with role-based checks.
- Added server action for role mutation in `app/dashboard/admin/actions.ts`.
- Replaced admin placeholder with functional user role table in `app/dashboard/admin/page.tsx`.
- Added per-row role dropdown + save flow, backed by server-side authorization.
- Checks run: `npm run lint` (passes, one pre-existing warning), `npx next build --webpack` (passes).

Open Questions:
- `npm run build` (Turbopack) can fail in restricted sandbox environments with process/port permission errors; webpack build succeeds.

## P0-05 Incident Liste (Tabelle + Navigation)

Status: DONE  
Branch: `feat/p0-05-incidents-list`  
Depends On: P0-01, P0-03  
Tags: `incidents`, `table`, `list`, `routing`

Ziel:
- Incident Uebersichtsseite als zentrale Arbeitsoberflaeche.

Scope:
- Route `/dashboard/incidents`.
- Tabelle mit Spalten:
  - Title, Status, Severity, Started, Resolved, Reporter, Updated
- Klick auf Zeile oeffnet Detailseite.

Implementierungsschritte:
1. Datenabfrage fuer Incident-Liste implementieren.
2. Tabellen-UI mit Badges fuer Status/Severity bauen.
3. Row-Click Routing auf `/dashboard/incidents/[id]` integrieren.
4. Leerzustand sinnvoll darstellen.

Acceptance Criteria:
- Tabelle zeigt geforderte Spalten.
- Row-Click funktioniert.
- Resolved `null` wird als sinnvoller Platzhalter angezeigt.

Tests:
- Manuell mit leerer und befuellter Tabelle.
- Lint + Build.

Delivery Notes:
- Implemented live incidents data query in `app/dashboard/incidents/page.tsx`.
- Added incidents table with required columns:
  - Title, Status, Severity, Started, Resolved, Reporter, Updated
- Added badge styling for status/severity and date formatting for timestamp columns.
- Added row navigation behavior (each row cell links) to `/dashboard/incidents/[id]`.
- Added empty-state UI for zero incidents.
- Added placeholder detail route in `app/dashboard/incidents/[id]/page.tsx` so navigation is functional ahead of P0-07.
- Added staged header actions (`New Incident`, `AI Create`) as disabled controls for upcoming P0-06/P0-08.
- Checks run: `npm run lint` (passes, one pre-existing warning), `npx next build --webpack` (passes).

Open Questions:
- `npm run build` (Turbopack) can fail in restricted sandbox environments with process/port permission errors; webpack build succeeds.

## P0-06 Manual Incident Create (Sheet + Persistenz)

Status: DONE  
Branch: `feat/p0-06-incident-manual-create`  
Depends On: P0-05  
Tags: `incidents`, `create`, `sheet`, `server-action`

Ziel:
- Schnelles manuelles Anlegen eines Incidents aus der Liste heraus.

Scope:
- `New Incident` Button oeffnet Sheet.
- Pflichtfelder: `title`, `severity`.
- Defaults: `status=open`, `started_at=now`.
- Optional: `impact`.
- Nach Create: Incident + initiales `incident_document`, danach Redirect zur Detailseite.

Implementierungsschritte:
1. Sheet-UI und Formularvalidierung implementieren.
2. Server Action fuer atomare Erstellung Incident + initiales Dokument bauen.
3. Reporter-ID aus Auth-Kontext setzen.
4. Erfolgreichen Redirect auf Detailseite implementieren.

Acceptance Criteria:
- Pflichtfelder werden durchgesetzt.
- Incident und zugehoeriges Dokument entstehen zusammen.
- Operator/Admin duerfen schreiben, reine User nur lesen.

Tests:
- Positive/negative Formularfaelle manuell.
- Rollenrestriktion pruefen.
- Lint + Build.

Delivery Notes:
- Added server action for manual incident creation in `app/dashboard/incidents/actions.ts`.
- Enforced server-side write authorization (operator/admin) before create.
- Implemented atomic insert using Drizzle transaction:
  - insert `incidents`
  - insert initial `incident_documents`
- Added right-side create sheet UI in `components/incidents/new-incident-sheet.tsx`.
- Wired `New Incident` control in incidents page for writable roles only.
- Kept `AI Create` as staged control for upcoming P0-08.
- Added DB URL normalization for malformed `%` sequences in `lib/env.ts` to prevent `URI malformed` during incident create.
- Checks run: `npm run lint` (passes, one pre-existing warning), `npx next build --webpack` (passes).

Open Questions:
- `npm run build` (Turbopack) can fail in restricted sandbox environments with process/port permission errors; webpack build succeeds.

## P0-07 Incident Detail + Meta-Update + Dokument Save

Status: DONE  
Branch: `feat/p0-07-incident-detail-editor-save`  
Depends On: P0-06  
Tags: `incident-detail`, `blocknote`, `metadata`, `save`

Ziel:
- Detailseite als Arbeitsflaeche fuer Incident-Dokumentation.

Scope:
- Route `/dashboard/incidents/[id]`.
- Editierbare Meta-Felder:
  - Title (inline), Status (dropdown), Severity (dropdown)
- Metadata-Anzeige: Reporter, Created, Started, Resolved.
- BlockNote Editor (client-only) mit debounced Auto-save und Save-Statusanzeige.

Implementierungsschritte:
1. Detaildaten serverseitig laden und rendern.
2. Meta-Update Actions mit Rollenchecks bauen.
3. BlockNote Editor Client-Komponente integrieren.
4. Save-Action fuer `incident_documents.content_json` implementieren.
5. Save-Status (z. B. gespeichert/fehler) sichtbar machen.

Acceptance Criteria:
- Meta-Aenderungen persistieren.
- Dokument kann gespeichert und neu geladen werden.
- Unautorisierte Schreibzugriffe werden serverseitig geblockt.

Tests:
- Manuell: Meta aendern, reload, Persistenz pruefen.
- Manuell: Dokument speichern, reload, Persistenz pruefen.
- Lint + Build.

Delivery Notes:
- Implemented full detail workspace in `app/dashboard/incidents/[id]/page.tsx` with editor-first layout.
- Added server actions in `app/dashboard/incidents/[id]/actions.ts`:
  - metadata update with role guard
  - document save with role guard
- Added client components:
  - `components/incidents/incident-meta-form.tsx`
  - `components/incidents/incident-document-editor.tsx`
- Added shared incident presentation helpers in `lib/incidents/presentation.ts` for labels and colored badges.
- Added BlockNote dependencies and CSS integration (`package.json`, `bun.lock`, `app/globals.css`).
- Added debounced autosave (3s), compact save-state indicator in document header, and unsaved-change guards:
  - in-app navigation dialog
  - browser native `beforeunload` for tab close/reload
- Checks run: `bun run lint` (passes with one pre-existing warning), `bun run build` (passes).

Open Questions:
- Browser `beforeunload` guard can protect against tab close/refresh with unsaved edits, but custom dialogs are limited by browser APIs.
- Detail page should move toward a Notion-like editor-first layout in Phase 1: reduce container nesting/padding and keep metadata/navigation lighter.

## P0-08 AI Create Incident from Text (Follow-up)

Status: DONE  
Branch: `feat/p0-08-ai-create-incident`  
Depends On: P0-06  
Tags: `ai`, `incident-create`, `structured-output`, `follow-up`

Ziel:
- Incident-Erstellung aus Freitext mit Pflichtfeld-Nachfragen.

Scope:
- `AI Create` Sheet auf Incident-Liste.
- Analyze-Flow mit Structured Output:
  - `title`, `severity`, optional `impact`, `started_at`, `missing_fields`
- Wenn Pflichtfelder fehlen: gezielte Follow-up Fragen.
- Bei ausreichenden Daten: Create und Redirect zur Detailseite.
- Nach Create: initiale Dokument-Befuellung ueber BlockNote-AI-Command vorbereiten/triggern.

Implementierungsschritte:
1. Zod-Schema fuer Extraction-Output implementieren.
2. AI Analyze Server Action mit Modell-Call und Validierung bauen.
3. UI-Flow fuer Analyze, Missing Fields, Re-Analyze und Preview/Create umsetzen.
4. Incident-Erstellung wiederverwendbar auf bestehender Create-Logik aufbauen.
5. Fehlerfaelle robust behandeln (ungueltiges Modelloutput, Timeout, kein Ergebnis).

Acceptance Criteria:
- Fehlende Pflichtfelder fuehren zu klaren Follow-up Fragen.
- Create erst moeglich, wenn `title` + `severity` vorhanden.
- Erfolgreicher Durchlauf legt Incident an und oeffnet Detailseite.

Tests:
- Manuell mit:
  - vollstaendigem Input
  - fehlendem `title`
  - fehlender `severity`
  - beiden fehlend
- Lint + Build.

Delivery Notes:
- Added reusable incident create helper in `lib/incidents/create.ts` and switched manual create action to reuse it.
- Implemented AI extraction pipeline with Vercel AI SDK (`generateText` + `Output.object`) and Zod validation in `lib/incidents/ai-intake.ts`.
- Added OpenAI-compatible local model provider (`llama.cpp`) via `@ai-sdk/openai-compatible` in `lib/ai/provider.ts`.
- Added full `AI Create` flow on incidents list:
  - new sheet component `components/incidents/ai-create-incident-sheet.tsx`
  - server actions `app/dashboard/incidents/ai-actions.ts`
  - analyze, follow-up, editable preview, and create+redirect
- Added regression fixture corpus for P0-08 in `docs/test-fixtures/ai-incident-create-intake-cases.md`.
- Adjusted `Started At` UX:
  - default to current datetime when no explicit temporal signal is present
  - enforce German format `DD.MM.YYYY, HH:mm` in the sheet
- Improved detail editor surface behavior for long documents and consistent background fill in `components/incidents/incident-document-editor.tsx` + `app/globals.css`.
- Updated env template with local LLM vars (`LOCAL_LLM_BASE_URL`, `LOCAL_LLM_MODEL`, optional `LOCAL_LLM_API_KEY`).

Open Questions:
- Local llama.cpp endpoint may emit AI SDK warnings about `responseFormat`; extraction still works, but model/provider tuning should be revisited in Phase 1.

## P0-09 AI Improve Document (BlockNote AI)

Status: TODO  
Branch: `feat/p0-09-ai-improve-document`  
Depends On: P0-07  
Tags: `ai`, `blocknote`, `editor`, `accept-reject`

Ziel:
- Native BlockNote-AI-Verbesserung im Incident-Dokument.

Scope:
- `/ai` Command `Verbessere / Strukturiere Dokument`.
- Streaming ueber AI-Transport.
- Accept/Reject-Flow:
  - Accept persistiert Dokument
  - Reject verwirft Aenderungen

Implementierungsschritte:
1. BlockNote AI Extension konfigurieren.
2. AI-Transport/Streaming-Pfad fuer Editor integrieren.
3. Prompt-Guidance fuer Incident-Struktur bereitstellen:
   - Summary, Impact, Timeline, Investigation, Mitigation/Resolution, Follow-ups
4. Persistenzlogik an Accept koppeln.
5. Reject ohne Persistenz sicherstellen.

Acceptance Criteria:
- AI-Verbesserung kann aus Editor gestartet werden.
- Accept speichert, Reject speichert nicht.
- Ergebnis bleibt im Incident-Dokument konsistent.

Tests:
- Manuelle Accept/Reject Durchlaeufe.
- Persistenzkontrolle ueber Reload.
- Lint + Build.

Delivery Notes:
- -

Open Questions:
- -

## P0-10 End-to-End Hardening + Demo QA

Status: TODO  
Branch: `feat/p0-10-phase0-hardening`  
Depends On: P0-04..P0-09  
Tags: `qa`, `hardening`, `demo`, `stability`

Ziel:
- Demo-stabile Gesamtfunktion fuer Phase 0 herstellen.

Scope:
- End-to-End Durchlaeufe aller Muss-Features.
- Fehlertexte, Loading States, Empty States verbessern.
- Kleine UX-Politur ohne Scope-Expansion.
- Dokumentation finalisieren.

Implementierungsschritte:
1. Test-Matrix fuer Kernflows durchlaufen:
   - Login/Redirect
   - Rollenwechsel/Admin
   - Incident manual create/list/detail
   - AI create follow-up
   - AI improve accept/reject
2. Offene Defekte priorisieren und fixen.
3. Demo-Readiness Checkliste ausfuellen.
4. Finalen Status aller Feature-Cards auf `DONE` bringen oder Restpunkte markieren.

Acceptance Criteria:
- Kein blocker/critical Defekt in Must-have Flows.
- Dokumentierte Known Issues fuer verbleibende Minor-Punkte.
- Phase-0 Demo reproduzierbar.

Tests:
- Vollstaendige manuelle E2E-Pruefung.
- Lint + Build.

Delivery Notes:
- -

Open Questions:
- -

## 7. Agent Handoff Template (bei jedem Feature-Update ausfuellen)

Bei Abschluss eines Feature-Branches im jeweiligen Feature-Block ergaenzen:
- Status: `REVIEW` oder `DONE`
- PR: `<link oder ID>`
- Commit(s): `<sha list>`
- Geaenderte Dateien: `<kurze Liste>`
- Tests ausgefuehrt: `<command + Ergebnis>`
- Risiken/Nacharbeit: `<kurz>`

## 8. Schnellzuordnung: "Implementiere Feature X"

Wenn ein User nur grob formuliert, so zuordnen:
- "Login/Landing" -> P0-02
- "Sidebar/Layout" -> P0-03
- "Admin/Rollen" -> P0-04
- "Incident Tabelle" -> P0-05
- "Incident anlegen" -> P0-06
- "Detailseite/Editor" -> P0-07
- "AI Incident aus Text" -> P0-08
- "AI verbessert Doku" -> P0-09
- "Demo stabilisieren" -> P0-10

## 9. Promptvorlagen fuer Agent-Dispatch

Minimal:
```text
Implementiere P0-05 aus docs/phase0-implementation-plan.md.
Halte dich an Depends On, Acceptance Criteria und Start-/Finish-Checklist.
Aktualisiere danach den Feature-Block (Status, Delivery Notes, Open Questions).
```

Mit Branch-Vorgabe:
```text
Setze Feature P0-08 um.
Erstelle/verwende Branch feat/p0-08-ai-create-incident.
Arbeite ausschliesslich den P0-08 Block aus docs/phase0-implementation-plan.md ab.
Fuehre lint und build aus und dokumentiere Ergebnisse im Feature-Block.
```

Freitext-Mapping:
```text
Implementiere "AI verbessert Doku".
Nutze die Schnellzuordnung in docs/phase0-implementation-plan.md und arbeite das gemappte Feature vollstaendig ab.
```

## 10. Change Log (dieses Dokument)

- 2026-02-15: Initiale Version erstellt.
