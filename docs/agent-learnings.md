# Agent Learnings (Append-Only)

Zweck:
- Persistente Projekt-Memory zwischen Agent-Runs.
- Kurz, konkret, umsetzbar.
- Nur Eintraege fuer verifizierte + commitete Features.

Regeln:
- Append-only: bestehende Eintraege nicht umschreiben.
- Ein Eintrag pro abgeschlossenem Feature.
- Keine sensiblen Daten/Secrets eintragen.
- Immer auf konkrete Dateien/Flows beziehen.

## Eintrags-Template

### <YYYY-MM-DD> - <Feature-ID/Name>
- Branch: `<branch-name>`
- Commit: `<short-sha>`
- Kontext: <kurzer Problemrahmen>
- Entscheidung: <was wurde umgesetzt>
- Ergebnis: <was hat funktioniert / verifiziert>
- Risiko/Follow-up: <offene Punkte fuer spaeter>

---

### 2026-02-15 - P0-07 Incident Detail + Editor UX
- Branch: `feat/p0-07-incident-detail-editor-save`
- Commit: `8c56139`
- Kontext: Detailseite hatte hohe UI-Friction (zu viel Container-Chrome, Meta-Form-State stale, unklare Save-Rueckmeldung).
- Entscheidung: Editor-first Layout, collapsible Meta, explizite Meta-Update-Action, Debounce-Autosave (3s), Header-basierte Save-Statusanzeige, farbcodierte Status/Severity-Badges.
- Ergebnis: Meta-Werte bleiben nach Save korrekt, BlockNote-Flow stabil, Save-Feedback klarer, Nutzerverifikation positiv.
- Risiko/Follow-up: Notion-naehere Detail-UX (noch weniger Container/Padding), revisionsbewusster save/discard Flow fuer spaetere Phase.

### 2026-02-15 - P0-08 AI Create Incident from Text
- Branch: `feat/p0-08-ai-create-incident`
- Commit: `e9765c6`
- Kontext: AI-Incident-Erstellung brauchte Follow-up-Flow, lokale Modellanbindung und reproduzierbare Testfaelle.
- Entscheidung: Vercel AI SDK + OpenAI-kompatibler lokaler Provider (`llama.cpp`) fuer strukturierte Feldextraktion; separates AI-Create-Sheet mit Analyze/Re-Analyze/Preview/Create; wiederverwendbare Incident-Create-Logik extrahiert.
- Ergebnis: P0-08 End-to-End funktioniert (inkl. Redirect + initialem Dokumentdraft), deutsches DateTime-Handling fuer `Started At` ist validiert, und Fixture-Corpus fuer Regressionstests liegt unter `docs/test-fixtures/`.
- Risiko/Follow-up: Provider-/Modellverhalten bei Structured Output (Warnungen bei lokalem Endpoint) weiterhaerten; fuer P0-09 nativen BlockNote-AI Accept/Reject-Flow anschliessen.

### 2026-02-15 - Workflow Update: Branch-Retention statt Auto-Delete
- Branch: `main`
- Commit: `pending`
- Kontext: Wiederholte Policy-Blocker bei `git branch -d/--delete` im Agent-Runner trotz erfolgreicher Feature-Merges.
- Entscheidung: Standard-Workflow angepasst: Feature-Branches nach Abschluss nicht automatisch loeschen; Cleanup nur auf expliziten User-Wunsch.
- Ergebnis: Agent-Flow ist robuster gegen Runner-Policy-Restriktionen und Merge/Push bleibt unblockiert.
- Risiko/Follow-up: Spaeter optional dedizierten Cleanup-Step einfuehren, sobald Policy/Allowlist fuer Branch-Delete stabil konfiguriert ist.
