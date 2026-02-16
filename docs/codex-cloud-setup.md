# Codex Cloud Setup fuer Infralumina

Diese Anleitung ist fuer dein Zielbild: **Projekt in Codex Cloud lauffaehig machen**, auch wenn AI-Features vorerst nicht genutzt werden.

## 1) Voraussetzungen ausserhalb von Codex

1. **Supabase Projekt vorhanden** (Auth + DB).
2. **GitHub OAuth in Supabase aktiviert**.
3. **Redirect-URLs gesetzt** fuer beide Umgebungen:
   - Lokal: `http://localhost:3000/auth/callback`
   - Cloud (Codex URL): `https://<dein-codex-deployment>/auth/callback`
4. Migration `supabase/migrations/202602150001_phase0_foundation.sql` ist eingespielt.

Hinweis: Ohne korrekte OAuth-Redirect-URL scheitert Login trotz gueltiger Keys.

## 2) Welche Secrets/Umgebungsvariablen im Codex Web-Interface gesetzt werden muessen

### Pflicht (ohne diese startet die App nicht stabil)

- `NEXT_PUBLIC_SUPABASE_URL`
  - Wert: Supabase Projekt-URL (`https://<project-ref>.supabase.co`)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - Wert: Supabase Publishable Key (nicht Service Role Key)
- `DATABASE_URL`
  - Wert: Postgres Connection String deines Supabase Projekts

### Optional (nur fuer AI-Features)

- `LOCAL_LLM_BASE_URL`
- `LOCAL_LLM_MODEL`
- `LOCAL_LLM_API_KEY`

Wenn du AI vorerst nicht verwenden willst, kannst du diese drei Variablen weglassen. Die Kern-Workflows (Login, Rollen, Incident-Liste, manuelles Incident-Create) bleiben nutzbar.

## 3) Codex Web-Interface To-Do (Checkliste)

1. In deinem Codex Projekt **Environment/Secrets** oeffnen.
2. Folgende Variablen anlegen:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `DATABASE_URL`
3. Sicherstellen, dass **kein Leerzeichen/Quote** im `DATABASE_URL` Wert steckt.
4. Deployment/Runtime neu starten, damit neue ENV-Werte geladen werden.
5. Danach Smoke-Test laufen lassen:
   - `npm run lint`
   - `npm run build`
   - `npm run dev`
6. Login ueber GitHub testen.
7. Ersten Benutzer in Supabase auf `admin` setzen (siehe `docs/setup-supabase.md`).

## 4) Erwartetes Verhalten ohne AI

Auch ohne AI-ENV soll folgendes funktionieren:

- Landing Page laden
- GitHub Login + Callback
- Dashboard Zugriff gemaess Rolle
- Incident-Liste anzeigen
- Incident manuell anlegen und bearbeiten
- Admin Rollenverwaltung (fuer Admin-User)

Nicht testen ohne AI-ENV:

- `AI Create Incident from Text`
- `AI Improve Document`

## 5) Minimaler Verifikationsplan nach Deployment

1. `GET /` liefert Landing Page.
2. Login erfolgreich, Redirect auf `/dashboard/incidents`.
3. Manuelles Incident erstellen.
4. Incident Detailseite speichern/aendern.
5. Admin-Seite: Rollenupdate eines Testusers.

Wenn diese 5 Punkte gruen sind, ist die Cloud-Umgebung fuer weitere Feature-Arbeit ohne AI bereit.
