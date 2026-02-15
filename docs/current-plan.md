# Current Plan

Zweck:
- Kurzzeitgedaechtnis fuer den laufenden Agent-Run.
- Nur aktive und naechste Aufgaben halten.

Regeln:
- Vor Implementierungsstart immer aktualisieren.
- Nur offene/in-progress Punkte behalten.
- Erledigte Segmente nach `plan-archive.md` verschieben und hier entfernen.

## Aktiver Run

- Request-ID: `<set-by-agent>`
- Modus: `<interactive|cloud-autonomous>`
- Ziel: `<kurzbeschreibung>`

## Active Work Items

### WI-001 `<feature-id-or-name>`
- Status: `todo|in_progress|blocked`
- Depends On: `<feature(s)>`
- Branch: `<branch-name>`
- Scope:
  - `<item>`
- Checks:
  - `bun run lint`
  - `bunx tsc --noEmit`
  - `<weitere checks>`

