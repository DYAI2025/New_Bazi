# Sprint P3: Supabase Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> **BINDEND:** Erst `docs/plans/2026-06-11-MASTER-fullfeature-roadmap.md` lesen (Arbeitsregeln §1, DoD §3). Branch-Ritual aus Master §1.1.

**Goal:** New_Bazi bekommt Nutzer-Persistenz: Supabase-Client (serverseitig), Auth, Schema mit RLS, Profil speichern/laden — die Grundlage für P8 (Quiz-Events), P9 (Daily/Reaktionen), P11 (Conversation-Memory).

**Architecture:** Supabase wird AUSSCHLIESSLICH serverseitig angesprochen (Service-Role-Key bleibt im BFF; Browser bekommt nur das Anon-Key-basierte Auth-SDK für Login). Der Express-BFF (`src/server/app.ts`) erhält eine `requireUserAuth`-Middleware (JWT-Verifikation gegen Supabase) nach dem Vorbild von Astro-Noctum (`server/middleware/auth.mjs` — als Referenz LESEN, nicht kopieren: New_Bazi nutzt TypeScript + den bestehenden Error-Envelope). Alle bestehenden Routen bleiben anonym nutzbar — Persistenz ist OPT-IN (eingeloggte User bekommen Speichern/Laden; anonyme Nutzung bleibt der Default-Flow).

**Tech Stack:** `@supabase/supabase-js` v2 (Server + Client), Supabase Auth (Magic-Link/E-Mail-OTP — kein Passwort-Management), vitest mit Supabase-Test-Double, eine gated Live-Integrations-Spec.

**Branch:** `feat/sprint-p3-supabase-foundation`

---

## Task 0: ENTSCHEIDUNGS-GATE E-DB (STOPP — Benjamin fragen, falls nicht beantwortet)

Zwei Varianten; der Plan funktioniert mit beiden, aber die Env-Werte unterscheiden sich:

- **Variante A — Astro-Noctum-Instanz mitnutzen** (`https://ykoijifgweoapitabgxx.supabase.co`, gestern gehärtet): User-Basis geteilt, ABER: New_Bazi-Tabellen bekommen Präfix `nb_` um Schema-Kollisionen mit Astro-Noctum-Tabellen (profiles, astro_profiles, contribution_events, aphorisms, daily_pulses …) auszuschließen. Auth-User sind dieselben (Vorteil: ein Account für beide Apps).
- **Variante B — frische Instanz**: sauber, kein Präfix nötig (Plan nutzt trotzdem `nb_`-Präfix für Konsistenz), getrennte User.

**Step 1:** Falls Benjamin E-DB noch nicht entschieden hat: STOPPEN und fragen. Antwort im Plan-Report dokumentieren.
**Step 2:** Env-Variablen beschaffen (Supabase Dashboard → Settings → API): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (NUR Server!), `SUPABASE_ANON_KEY` (Client-tauglich). In `.env` lokal eintragen + auf Railway-Service `New_Bazi` setzen (`railway variables --service New_Bazi --set ...` — Werte nie printen). `.env.example` um die drei Namen + Kommentare ergänzen (ohne Werte).

## Task 1: Dependencies + Server-Client (TDD)

**Files:**
- Modify: `package.json` (+`@supabase/supabase-js`)
- Create: `src/server/supabase.ts`
- Test: `src/server/supabase.test.ts`

**Step 1: Failing Test** — `src/server/supabase.test.ts`:
```ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { getServerSupabase, isSupabaseConfigured } from "./supabase";

afterEach(() => vi.unstubAllEnvs());

describe("server supabase client", () => {
  it("isSupabaseConfigured false ohne Env (ehrlicher Disabled-State, kein Throw)", () => {
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(isSupabaseConfigured()).toBe(false);
    expect(getServerSupabase()).toBeNull();
  });
  it("liefert Client-Singleton wenn konfiguriert", () => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");
    const a = getServerSupabase();
    expect(a).not.toBeNull();
  });
});
```

**Step 2:** Run → FAIL (module missing). **Step 3: Implementation** `src/server/supabase.ts`:
```ts
// Serverseitiger Supabase-Zugriff. Service-Role-Key NUR hier — niemals in den
// Browser. Fehlt die Konfiguration, läuft New_Bazi vollständig anonym weiter
// (Persistenz-Features zeigen einen ehrlichen Disabled-State, Master §1.4).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null | undefined;

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

export function getServerSupabase(): SupabaseClient | null {
  if (cached !== undefined && process.env.NODE_ENV !== "test") return cached;
  cached = isSupabaseConfigured()
    ? createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;
  return cached;
}
```
(Hinweis: im Test-Modus kein Singleton-Cache, damit Env-Stubs greifen — wie im Code gezeigt.)

**Step 4:** PASS + lint. **Step 5:** Commit `feat: serverseitiger Supabase-Client mit ehrlichem Disabled-State`

## Task 2: Schema-Migration (SQL, idempotent)

**Files:**
- Create: `supabase/migrations/20260611_p3_foundation.sql`
- Create: `docs/contracts/supabase-schema.md` (Kurzdoku: Tabellen, Zweck, RLS-Prinzip)

**Migration (vollständig — Tabellen-Minimum für P3; P8/P9/P11 erweitern später additiv):**
```sql
-- P3 Foundation. Präfix nb_ (Kollisionsfreiheit mit Astro-Noctum bei Variante A).
-- RLS: Nutzer sehen/schreiben NUR eigene Zeilen; Service-Role umgeht RLS (BFF).

create table if not exists nb_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Mein Profil',          -- Anzeigename des Profils
  birth_data jsonb not null,                           -- ValidatedBirthInput-Shape (Datum/Zeit/Ort/placeId/lat/lon/tz/timeKnown)
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists nb_profiles_user_idx on nb_profiles(user_id);
-- genau ein Default-Profil pro User
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

-- Vorbereitete Tabellen (P8/P9/P11 befüllen sie; hier nur DDL + RLS):
create table if not exists nb_contribution_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id text not null,                             -- z.B. quiz.personality.v1
  payload jsonb not null,                              -- markers/tags (sp.contribution.v1)
  occurred_at timestamptz not null default now(),
  unique (user_id, module_id)                          -- Retake überschreibt (Upsert)
);
create table if not exists nb_daily_reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pulse_date date not null,
  selected_figure text check (selected_figure in ('sonne','mond','aszendent','day_master','jahrestier','wuxing_dom')),
  tension_reaction text check (tension_reaction in ('trifft','teilweise','widerstand','passt_nicht')),
  created_at timestamptz not null default now(),
  unique (user_id, pulse_date)                         -- 1×/Tag (Rat-der-6-Regel)
);
create table if not exists nb_agent_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_type text not null check (agent_type in ('levi','eve')),
  summary text not null,
  created_at timestamptz not null default now()
);

-- RLS: an, Policies owner-only für authenticated; Service-Role (BFF) umgeht RLS by design.
alter table nb_profiles enable row level security;
alter table nb_partner_profiles enable row level security;
alter table nb_contribution_events enable row level security;
alter table nb_daily_reactions enable row level security;
alter table nb_agent_conversations enable row level security;

do $$ declare t text;
begin
  foreach t in array array['nb_profiles','nb_partner_profiles','nb_contribution_events','nb_daily_reactions','nb_agent_conversations'] loop
    execute format('drop policy if exists %I_owner_select on %I', t, t);
    execute format('create policy %I_owner_select on %I for select to authenticated using (user_id = auth.uid())', t, t);
    execute format('drop policy if exists %I_owner_write on %I', t, t);
    execute format('create policy %I_owner_write on %I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t, t);
  end loop;
end $$;

-- updated_at Trigger für nb_profiles
create or replace function nb_touch_updated_at() returns trigger language plpgsql as
$$ begin new.updated_at := now(); return new; end $$;
drop trigger if exists nb_profiles_touch on nb_profiles;
create trigger nb_profiles_touch before update on nb_profiles
  for each row execute function nb_touch_updated_at();
```

**Steps:** SQL via Supabase Dashboard SQL-Editor (oder `supabase db push`, falls CLI eingerichtet) anwenden; in `docs/contracts/supabase-schema.md` Tabellenzweck + „additiv erweitern, nie umbenennen" festhalten. Verifikation: `select tablename from pg_tables where tablename like 'nb_%';` → 5 Zeilen. Commit (Migration + Doku) `feat: Supabase-Schema P3 (Profile, Partner, Events, Reaktionen, Conversations) mit owner-only RLS`.

## Task 3: Auth-Middleware (TDD)

**Files:**
- Create: `src/server/requireUserAuth.ts` + Test `src/server/requireUserAuth.test.ts`
- Referenz LESEN: Astro-Noctum `server/middleware/auth.mjs` (Envelope-Shape `{error:{code,message,request_id,recoverable,retry_after}}` — New_Bazi nutzt sein EIGENES bestehendes Fehlerformat aus `src/server/app.ts` (`sendError`-Pattern — exakt nachschauen und das verwenden!)

**Verhalten:** liest `Authorization: Bearer <jwt>`; verifiziert via `supabase.auth.getUser(jwt)` (Server-Client); setzt `req.userId`; 401 `AUTH_REQUIRED` ohne/mit ungültigem Token; **503 `PERSISTENCE_DISABLED`** wenn Supabase nicht konfiguriert (ehrlich, kein Fake). Tests: alle drei Pfade mit gemocktem `getServerSupabase` (vi.mock).

**Commit:** `feat: requireUserAuth-Middleware (Supabase JWT) mit ehrlichem Disabled-State`

## Task 4: Profil-Routen (TDD)

**Files:**
- Modify: `src/server/app.ts` (neue Routen, NACH den bestehenden, alle hinter `requireUserAuth`)
- Test: erweitere `src/server/app.test.ts` (Supabase gemockt — Mock-Pattern: vi.mock von `./supabase`, in-memory Map als Tabellen-Double)

**Routen (Contract):**
- `GET  /api/me/profiles` → `[{id,label,birth_data,is_default,updated_at}]`
- `POST /api/me/profiles` body `{label?, birth_data, makeDefault?}` → validiert birth_data mit der BESTEHENDEN `birthInputValidation` (kein zweiter Validator!), upsert; bei `makeDefault` vorher `is_default=false` auf alle eigenen.
- `DELETE /api/me/profiles/:id` (nur eigene — Service-Role + explizites `eq('user_id', req.userId)`-Filter, da BFF RLS umgeht!)
- `GET/POST/DELETE /api/me/partners` analog für `nb_partner_profiles`.

**WICHTIGSTE REGEL (Test erzwingen!):** Da der BFF mit Service-Role arbeitet (RLS-Bypass), MUSS jede Query explizit `eq('user_id', req.userId)` filtern. Test: User A kann Profil von User B weder lesen noch löschen (Mock mit 2 Usern).

**Commit:** `feat: Profil-/Partner-CRUD hinter Auth (Service-Role mit explizitem Owner-Filter)`

## Task 5: Client-Auth + UI (Magic Link, Opt-in)

**Files:**
- Create: `src/lib/supabaseClient.ts` (Browser, NUR `SUPABASE_URL` + `SUPABASE_ANON_KEY` via Vite-Env `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` — Dockerfile braucht die ARG/ENV-Zeilen! Siehe Astro-Noctum-Lektion: ohne ARG-Deklaration baut Vite blind. Dockerfile prüfen/erweitern wie in deren PR #371-Muster)
- Create: `src/components/AccountMenu.tsx` (Header-Slot in PageShell): ausgeloggt → „Anmelden"-Button → E-Mail-Feld → Magic-Link; eingeloggt → E-Mail-Anzeige + „Profil speichern" / „Profil laden"-Liste + Logout. KEIN eigener Tab — kleines Dropdown.
- Modify: `src/App.tsx`/`src/components/InputForm.tsx`: nach erfolgreichem Profil-Berechnen erscheint (nur eingeloggt) „Dieses Profil speichern"; InputForm bekommt „Gespeichertes Profil laden"-Auswahl (lädt birth_data in die Felder + triggert Berechnung).
- Disabled-State: ohne `VITE_SUPABASE_URL` rendert AccountMenu einen dezenten Hinweis „Konto-Funktion derzeit nicht verfügbar" — NIE kaputte Buttons.

**e2e:** Mock-freier UI-Test schwierig (Magic Link = echte Mail) → e2e prüft nur: Disabled-State ohne Env; eingeloggter Zustand wird mit einem gefakten Session-Stub (localStorage-Injection des supabase-js Session-Formats, dokumentieren!) bis zur „Profil speichern"-Sichtbarkeit getestet; der eigentliche Speicher-Roundtrip ist durch die Server-Tests (Task 4) abgedeckt + eine GATED Live-Spec (Task 6).

**Commit:** `feat: Konto-Menü (Magic-Link), Profil speichern/laden — Persistenz als Opt-in`

## Task 6: Gated Live-Integration + Abschluss

**Files:** Create `scripts/supabase-live-check.mts` — läuft NUR mit echten Env-Werten: legt Test-User-Session via Service-Role an (`auth.admin.createUser` + `generateLink`), macht Profil-CRUD-Roundtrip durch die ECHTEN Routen (lokaler Server), löscht den Test-User. Output PASS/FAIL je Schritt. Nicht in CI; im Plan-Report einmal ausgeführt zeigen.

**Abschluss:** Volle Gates (Master §3) + Dockerfile-Build-Args-Check (`docker build` falls verfügbar, sonst ehrlich notieren) + PR `feat: Supabase Foundation (Auth, Schema+RLS, Profil-Persistenz als Opt-in)` mit MISSING-Liste (kein Passwort-Flow, keine Profil-Sync-Konflikte, Quiz/Daily-Tabellen noch unbefüllt = P8/P9) + Live-Smoke nach Deploy: Disabled-State-Prüfung BZW. Magic-Link-Anmeldung einmal real (Benjamin-Mail) + Profil speichern/laden auf newbazi-production.

## Risiken/Hinweise für den Executor
- supabase-js v2 `auth.getUser(jwt)` macht einen Netzwerk-Call → in Unit-Tests IMMER mocken; Timeout-Handling (5s) einbauen.
- Variante A (geteilte Instanz): VOR Task 2 prüfen, dass keine `nb_`-Tabellen existieren (`select 1 from pg_tables where tablename like 'nb_%'`).
- E-Mail-Versand: Supabase-Default-SMTP reicht für Beta; Rate-Limit 4 Mails/h/User beachten (im UI kommunizieren: „Link verschickt — prüfe dein Postfach").
