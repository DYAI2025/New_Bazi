-- Tagespuls 2.0 Etappe 2: Sync der Tages-Reflexionen für eingeloggte Nutzer.
-- localStorage bleibt Primärquelle für anonyme Nutzung; dieser Store ist der
-- optionale Sync-Layer (updatedAt-wins-Merge im Client).
-- RLS-Muster (PRD Day Pulse / API-Sicherheitslinie): Clients dürfen NUR lesen;
-- alle Writes laufen ausschließlich über die BFF-Routen mit Service-Role
-- (umgeht RLS) — bewusst KEINE insert/update/delete-Policies, damit kein
-- Client die BFF-Validierung per Direktzugriff umgehen kann.

create table if not exists nb_daily_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  day_type text not null check (day_type in ('ressource','ausdruck','einfluss','struktur','gleichrang')),
  reaction text check (reaction in ('kenne_ich','teils','gegenseite')),
  encounter_choice text,
  veto_choice text,
  updated_at_ms bigint not null,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);
-- Kein separater user_idx nötig: unique (user_id, date) deckt user_id als führende Spalte ab.

alter table nb_daily_reflections enable row level security;

drop policy if exists nb_daily_reflections_owner_select on nb_daily_reflections;
create policy nb_daily_reflections_owner_select on nb_daily_reflections for select to authenticated using (user_id = auth.uid());
