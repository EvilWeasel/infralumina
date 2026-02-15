# Infralumina

Leichtgewichtiges, intern betriebenes ITSM-System mit Fokus auf Incident Management.
Der Kernansatz: schnell erfassen, später strukturiert dokumentieren, inklusive AI-Unterstützung ohne Prozess-Overhead.

## Aktueller Stand

Dieses Repository bildet Phase 0 (Demo-Inkrement) ab: ein belastbares Incident-Modul mit Rollen, Admin-Grundfunktionen und ersten AI-Workflows.

Im Fokus stehen:
- Landing + GitHub Login
- Dashboard Shell mit Sidebar
- Rollenmodell (`user`, `operator`, `admin`)
- Incident-Liste, Incident-Erstellung, Incident-Detailansicht
- AI-gestützte Incident-Erstellung aus Freitext
- AI-gestützte Dokumentverbesserung im Editor

## Produktprinzipien

- Wenig Friction im Betrieb, besonders in stressigen Incident-Situationen.
- Serverseitige Autorisierung ist maßgeblich; UI-Restriktionen sind nur ergänzend.
- Trennung von strukturierter Felderkennung und narrativer Dokumentbearbeitung:
  - Strukturierte Incident-Felder via AI Structured Output
  - Dokumentbearbeitung über BlockNote AI

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth + DB) + Drizzle ORM
- BlockNote + `@blocknote/xl-ai`
- Vercel AI SDK

## Schnellstart

Voraussetzungen:
- Node.js 20+ (oder Bun)

Installation und Start:

```bash
npm install
npm run dev
```

App lokal öffnen:
- `http://localhost:3000`

## Scripts

- `npm run dev` startet die Entwicklungsumgebung
- `npm run lint` führt ESLint aus
- `npm run build` erstellt den Production-Build
- `npm run start` startet den Production-Server

## Projektstruktur (Kurzüberblick)

- `app/` App-Router Pages und Layouts
- `components/` UI-Komponenten (inkl. `components/ui`)
- `lib/` Hilfsfunktionen
- `docs/` Produkt- und Research-Dokumentation

## Sprache und Konventionen

- UI-Texte: Deutsch
- Code: Englisch
- Projektdokumentation: Deutsch
- Kommentare und Code-Dokumentation: Englisch

Architekturleitlinie:
- Server Actions bevorzugen; klassische Business-API-Routen vermeiden (Ausnahme: AI-Streaming-Transport).

## Roadmap (Kurz)

Nach Phase 0 sind unter anderem geplant:
- Dokumentationsbaum (rekursiv)
- System Inventory / Mini-CMDB
- Revisionen + Revert
- Audit Log
- Similar Incidents

## Weitere Details

Vollständige fachliche Anforderungen und Entscheidungen:
- `docs/prd.md`
