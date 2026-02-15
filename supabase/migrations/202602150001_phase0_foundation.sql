create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('user', 'operator', 'admin');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'incident_status') then
    create type public.incident_status as enum ('open', 'in_progress', 'resolved');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'incident_severity') then
    create type public.incident_severity as enum ('low', 'medium', 'high', 'critical');
  end if;
end $$;

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'user',
  github_username text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status public.incident_status not null default 'open',
  severity public.incident_severity not null,
  impact text,
  started_at timestamptz not null default timezone('utc', now()),
  resolved_at timestamptz,
  reporter_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.incident_documents (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  content_json jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references auth.users(id) on delete set null,
  constraint incident_documents_incident_id_key unique (incident_id)
);

create index if not exists incidents_status_idx on public.incidents(status);
create index if not exists incidents_severity_idx on public.incidents(severity);
create index if not exists incidents_started_at_idx on public.incidents(started_at);
create index if not exists incidents_updated_at_idx on public.incidents(updated_at);
create index if not exists incidents_reporter_id_idx on public.incidents(reporter_id);
create index if not exists incident_documents_updated_by_idx on public.incident_documents(updated_by);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row
execute function public.set_updated_at();

drop trigger if exists incidents_set_updated_at on public.incidents;
create trigger incidents_set_updated_at
before update on public.incidents
for each row
execute function public.set_updated_at();

drop trigger if exists incident_documents_set_updated_at on public.incident_documents;
create trigger incident_documents_set_updated_at
before update on public.incident_documents
for each row
execute function public.set_updated_at();
