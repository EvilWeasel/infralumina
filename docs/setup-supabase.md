# Supabase Setup (Phase 0)

Stand: 2026-02-15

## 1. Projekt anlegen

1. Neues Supabase-Projekt erstellen.
2. In Supabase unter `Authentication -> Providers -> GitHub` GitHub OAuth aktivieren.
3. Callback-URL in GitHub App konfigurieren:
   - `<your-site-url>/auth/callback`
   - lokal: `http://localhost:3000/auth/callback`

## 2. Environment Variablen setzen

Kopiere `.env.example` nach `.env.local` und setze:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `DATABASE_URL` (oder `SUPABASE_DB_URL`)

## 3. Migrationen ausfuehren

Option A (Supabase CLI lokal):
```bash
supabase db push
```

Option B (SQL Editor in Supabase):
- Inhalt aus `supabase/migrations/202602150001_phase0_foundation.sql` ausfuehren.

## 4. Ersten Admin setzen (Bootstrap)

Nachdem sich der erste User per GitHub eingeloggt hat:

```sql
update public.user_profiles
set role = 'admin'
where user_id = '<SUPABASE_AUTH_USER_ID>';
```

Die `user_id` findest du unter `Authentication -> Users`.

## 5. Verifikation

Erwartete Tabellen:
- `public.user_profiles`
- `public.incidents`
- `public.incident_documents`

Erwartete Enums:
- `public.user_role`
- `public.incident_status`
- `public.incident_severity`

Hinweis:
- Supabase Advisor wird in Phase 0 erwartungsgemaess RLS-Warnungen melden, da RLS explizit nicht Teil von Phase 0 ist.
