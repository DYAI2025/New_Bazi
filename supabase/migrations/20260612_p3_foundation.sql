-- P3 Foundation. nb_-Präfix wegen bestehendem Astro-Noctum-Schema (profiles-Tabelle
-- hat andere Spalten-Struktur). Additive Migration — kein DROP TABLE, kein RENAME.
-- RLS: Nutzer sehen/schreiben NUR eigene Zeilen; Service-Role umgeht RLS (BFF).

create table if not exists nb_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Mein Profil',
  birth_data jsonb not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists nb_profiles_user_idx on nb_profiles(user_id);
create unique index if not exists nb_profiles_one_default
  on nb_profiles(user_id) where is_default;

create table if not exists nb_partner_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  birth_data jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists nb_partner_profiles_user_idx on nb_partner_profiles(user_id);

alter table nb_profiles enable row level security;
alter table nb_partner_profiles enable row level security;

drop policy if exists nb_profiles_owner_select on nb_profiles;
create policy nb_profiles_owner_select on nb_profiles for select to authenticated using (user_id = auth.uid());
drop policy if exists nb_profiles_owner_write on nb_profiles;
create policy nb_profiles_owner_write on nb_profiles for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists nb_partner_profiles_owner_select on nb_partner_profiles;
create policy nb_partner_profiles_owner_select on nb_partner_profiles for select to authenticated using (user_id = auth.uid());
drop policy if exists nb_partner_profiles_owner_write on nb_partner_profiles;
create policy nb_partner_profiles_owner_write on nb_partner_profiles for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function nb_touch_updated_at() returns trigger language plpgsql as
$$ begin new.updated_at := now(); return new; end $$;
drop trigger if exists nb_profiles_touch on nb_profiles;
create trigger nb_profiles_touch before update on nb_profiles
  for each row execute function nb_touch_updated_at();
