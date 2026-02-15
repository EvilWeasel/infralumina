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
