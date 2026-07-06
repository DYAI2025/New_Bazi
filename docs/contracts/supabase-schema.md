# Supabase Schema — New_Bazi P3

**Instanz:** `ykoijifgweoapitabgxx.supabase.co` (geteilt mit Astro-Noctum)
**Präfix:** `nb_` (Kollisionsfreiheit mit bestehendem Astro-Noctum-Schema)
**Migration:** `supabase/migrations/20260612_p3_foundation.sql`

## Tabellen

### `nb_profiles`
Nutzer-Geburtsprofile. Ein User kann mehrere Profile anlegen; max. eines ist `is_default`.

| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| id | uuid PK | Auto-generiert |
| user_id | uuid → auth.users | Eigentümer |
| label | text | Anzeigename (default: „Mein Profil") |
| birth_data | jsonb | `ValidatedBirthInput`-Shape (Datum/Zeit/Ort/placeId/lat/lon/tz/timeKnown) |
| is_default | boolean | Genau eines pro User (Unique-Index `nb_profiles_one_default`) |
| created_at | timestamptz | |
| updated_at | timestamptz | Automatisch via Trigger `nb_profiles_touch` |

### `nb_partner_profiles`
Partner-Geburtsprofile für Synastrie. Kein Default-Konzept.

| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| id | uuid PK | Auto-generiert |
| user_id | uuid → auth.users | Eigentümer |
| label | text | Anzeigename |
| birth_data | jsonb | Analog `nb_profiles.birth_data` |
| created_at | timestamptz | |

## RLS-Prinzip

- Beide Tabellen haben RLS aktiviert.
- Policy `nb_*_owner_select`: `authenticated`-User sehen nur eigene Zeilen (`user_id = auth.uid()`).
- Policy `nb_*_owner_write`: `authenticated`-User schreiben nur eigene Zeilen.
- **Service-Role (BFF) umgeht RLS by design** — deshalb filtert jede BFF-Query IMMER explizit `.eq('user_id', req.userId)`.

## Erweiterungsregel

**Additiv erweitern, nie umbenennen.** Neue Spalten per `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`. Keine RENAME, keine DROP in Produktions-Migrationen. P8/P9/P11 erweitern mit eigenen Migrations-Dateien und eigenem `nb_`-Präfix.

## Zukünftige Tabellen (P8/P9/P11)

- `nb_contribution_events` — Quiz-Marker (P8)
- `nb_daily_reactions` — Tagesreaktionen (P9)
- `nb_agent_conversations` — Voice-Agent-Zusammenfassungen (P11)
