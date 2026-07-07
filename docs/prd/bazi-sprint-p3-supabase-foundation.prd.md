# PRD: BaZi Sprint P3 — Supabase Foundation

**Feature-Slug:** `bazi-sprint-p3-supabase-foundation`
**Status:** user-confirmed (2026-06-12)
**Erstellt:** 2026-06-12
**Canvas:** [docs/canvas/bazi-sprint-p3-supabase-foundation.canvas.md](../canvas/bazi-sprint-p3-supabase-foundation.canvas.md)
**Branch:** `feat/sprint-p3-supabase-foundation`
**Supabase-Instanz:** `ykoijifgweoapitabgxx.supabase.co` (New_Bazi-dediziert, kein Präfix)

---

## Zusammenfassung

New_Bazi erhält Nutzer-Persistenz: Supabase-Client (serverseitig), Magic-Link-Auth, Schema mit RLS (`profiles` + `partner_profiles`), Profil speichern/laden. Anonyme Nutzung bleibt Default-Flow — Persistenz ist Opt-in. Kein Passwort-Management.

---

## Anforderungen

### REQ-P3-001 — Serverseitiger Supabase-Client

**Titel:** `getServerSupabase` + `isSupabaseConfigured` — ehrlicher Disabled-State

**Akzeptanzkriterien:**
- `isSupabaseConfigured()` → `false` wenn `SUPABASE_URL` oder `SUPABASE_SERVICE_ROLE_KEY` leer/fehlt — kein Throw.
- `getServerSupabase()` → `null` wenn nicht konfiguriert.
- `getServerSupabase()` → `SupabaseClient`-Singleton wenn konfiguriert (`persistSession: false`, `autoRefreshToken: false`).
- Im Test-Modus kein Singleton-Cache (damit `vi.stubEnv` greift).
- TDD: RED → GREEN bewiesen. Lint clean.

**NFR:** Service-Role-Key NUR in `src/server/supabase.ts` — niemals in Browser-Bundle, niemals geloggt.

**Traceability:**
- canvas-link: `../canvas/bazi-sprint-p3-supabase-foundation.canvas.md`
- canvas-problem: Keine Persistenz-Grundlage im BFF
- canvas-target-user: Wiederkehrende Nutzerinnen 25–45 (Entertainment/Reflexion)
- canvas-value-claim: Sicherer serverseitiger Datenbankzugriff ohne Secret-Leak-Risiko
- canvas-success-signal: Tests grün; Service-Role-Key nicht im Build-Output
- canvas-risk-status: aligned

---

### REQ-P3-002 — Schema-Migration (idempotent, RLS)

**Titel:** `profiles` + `partner_profiles` mit owner-only RLS

**Akzeptanzkriterien:**
- Migration `supabase/migrations/20260612_p3_foundation.sql` ist idempotent (`create table if not exists`, `create index if not exists`).
- Tabellen: `profiles` (id, user_id → auth.users, label, birth_data jsonb, is_default bool, created_at, updated_at) + `partner_profiles` (id, user_id, label, birth_data, created_at).
- Unique-Index `profiles_one_default`: genau ein Default-Profil pro User.
- RLS aktiviert auf beiden Tabellen. Policy `owner_select` + `owner_write` (authenticated, `user_id = auth.uid()`).
- `updated_at`-Trigger auf `profiles`.
- Verifikation: `select tablename from pg_tables where tablename in ('profiles','partner_profiles')` → 2 Zeilen.
- `docs/contracts/supabase-schema.md` dokumentiert Tabellen, Zweck, RLS-Prinzip, „additiv erweitern, nie umbenennen"-Regel.

**NFR:** Kein `DROP TABLE` in Migration. Additive Änderungen only.

**Traceability:**
- canvas-link: `../canvas/bazi-sprint-p3-supabase-foundation.canvas.md`
- canvas-problem: Profildaten können nicht persistent gespeichert werden
- canvas-target-user: Eingeloggte Nutzerinnen mit gespeicherten Profilen
- canvas-value-claim: Profil speichern/laden ohne Datenleck zwischen Usern
- canvas-success-signal: 2 Tabellen live in Supabase; RLS-Policy verhindert Cross-User-Zugriff
- canvas-risk-status: aligned

---

### REQ-P3-003 — Auth-Middleware `requireUserAuth`

**Titel:** JWT-Verifikation via Supabase, 401/503 mit bestehendem Error-Envelope

**Akzeptanzkriterien:**
- Liest `Authorization: Bearer <jwt>`.
- Verifiziert via `supabase.auth.getUser(jwt)` (Server-Client, Netzwerk-Call).
- Setzt `req.userId` (TypeScript: `express.Request` extended).
- 401 `AUTH_REQUIRED` bei fehlendem oder ungültigem Token — im bestehenden `sendError`-Format von `src/server/app.ts`.
- 503 `PERSISTENCE_DISABLED` wenn `isSupabaseConfigured() === false` — ehrlich, kein Fake.
- Timeout 5 s auf `auth.getUser`-Call (AbortController oder Promise.race).
- Tests (vi.mock von `./supabase`): alle drei Pfade (kein Token, ungültiger Token, Supabase nicht konfiguriert). TDD: RED → GREEN. Lint clean.

**NFR:** Kein upstream-Stack-Trace oder JWT-Inhalt in Error-Response. `sendError`-Pattern aus `app.ts` exakt verwenden — kein zweites Error-Format.

**Traceability:**
- canvas-link: `../canvas/bazi-sprint-p3-supabase-foundation.canvas.md`
- canvas-problem: Keine Auth-Schicht → nutzerbezogene Daten nicht isolierbar
- canvas-target-user: Eingeloggte Nutzerinnen
- canvas-value-claim: Nur eigene Daten lesbar/schreibbar; unautorisierte Zugriffe blockiert
- canvas-success-signal: 401/503 korrekt in allen drei Test-Pfaden; kein Secret in Response
- canvas-risk-status: aligned

---

### REQ-P3-004 — Profil-/Partner-CRUD-Routen

**Titel:** `/api/me/profiles` + `/api/me/partners` hinter `requireUserAuth`, expliziter Owner-Filter

**Akzeptanzkriterien:**
- Routen (alle hinter `requireUserAuth`, NACH bestehenden Routen in `app.ts`):
  - `GET  /api/me/profiles` → `[{id, label, birth_data, is_default, updated_at}]`
  - `POST /api/me/profiles` body `{label?, birth_data, makeDefault?}` → validiert `birth_data` mit bestehender `birthInputValidation`; bei `makeDefault` vorher `is_default=false` auf alle eigenen; Upsert.
  - `DELETE /api/me/profiles/:id` → nur eigenes Profil.
  - `GET/POST/DELETE /api/me/partners` analog für `partner_profiles`.
- **KRITISCH:** Jede Query filtert explizit `.eq('user_id', req.userId)` — auch wenn BFF Service-Role RLS umgeht.
- Tests (vi.mock von `./supabase`, in-memory Map als Tabellen-Double): User A kann Profil von User B weder lesen noch löschen (2-User-Mock-Test). TDD: RED → GREEN. Lint clean.
- Kein zweiter Validator — `birthInputValidation` ist die einzige Validierung für `birth_data`.

**NFR:** Service-Role-Key wird nur in `supabase.ts` instanziiert — Routen importieren nur `getServerSupabase()`.

**Traceability:**
- canvas-link: `../canvas/bazi-sprint-p3-supabase-foundation.canvas.md`
- canvas-problem: Profildaten nicht persistierbar
- canvas-target-user: Eingeloggte Nutzerinnen (eigene Profile)
- canvas-value-claim: Profil speichern/laden; Partner-Profile verwalten
- canvas-success-signal: CRUD-Roundtrip testet grün; Cross-User-Leak-Test schlägt vor Fix fehl
- canvas-risk-status: aligned

---

### REQ-P3-005 — Client-Auth + UI (Magic Link, Opt-in)

**Titel:** `AccountMenu` (Magic-Link-Login), Profil speichern/laden, Disabled-State

**Akzeptanzkriterien:**
- `src/lib/supabaseClient.ts`: Browser-Client, NUR `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (Vite-Env).
- `Dockerfile` hat ARG + ENV für beide Vite-Vars deklariert (ohne Deklaration baut Vite blind).
- `AccountMenu.tsx` im Header-Slot von PageShell:
  - Ausgeloggt: „Anmelden"-Button → E-Mail-Feld → Magic-Link senden; Hinweis „Link verschickt — prüfe dein Postfach (Rate-Limit: 4/h)".
  - Eingeloggt: E-Mail-Anzeige + „Profil speichern" / „Profil laden"-Liste + Logout.
  - Ohne `VITE_SUPABASE_URL`: dezenter Hinweis „Konto-Funktion derzeit nicht verfügbar" — kein kaputter Button.
- `App.tsx` / `InputForm.tsx`: nach erfolgreichem Profil-Berechnen erscheint (nur eingeloggt) „Dieses Profil speichern"; `InputForm` bekommt „Gespeichertes Profil laden"-Auswahl.
- e2e (Playwright):
  - Disabled-State ohne Env: AccountMenu zeigt „nicht verfügbar"-Hinweis.
  - Eingeloggter Zustand mit localStorage-Injection (Supabase-Session-Format dokumentiert): „Profil speichern"-Button sichtbar.
- TDD: RED → GREEN. Lint clean. Build clean (`vite build`).

**NFR:** Kein `SUPABASE_SERVICE_ROLE_KEY` in Browser-Bundle — Vite-Env-Prefix `VITE_` erzwingt explizite Aufnahme; Service-Role-Key hat kein `VITE_`-Prefix.

**Traceability:**
- canvas-link: `../canvas/bazi-sprint-p3-supabase-foundation.canvas.md`
- canvas-problem: Nutzerinnen müssen Geburtsdaten bei jedem Besuch neu eingeben
- canvas-target-user: Wiederkehrende Nutzerinnen (Opt-in); anonyme Nutzerinnen unberührt
- canvas-value-claim: Profil einmal anlegen, bei nächstem Besuch laden
- canvas-success-signal: Disabled-State-e2e grün; Session-Stub-Test zeigt „Profil speichern"-Button
- canvas-risk-status: aligned

---

### REQ-P3-006 — Gated Live-Integrations-Spec

**Titel:** `scripts/supabase-live-check.mts` — CRUD-Roundtrip gegen echten lokalen Server

**Akzeptanzkriterien:**
- Läuft NUR mit echten Env-Werten (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, lokaler Server).
- Schritte: Test-User anlegen (`auth.admin.createUser`), Session generieren (`generateLink`), Profil-POST → GET → DELETE durch echte Routen, Test-User löschen.
- Output je Schritt: `PASS` oder `FAIL` mit Fehlertext.
- Nicht in CI; im PR-Report einmal ausgeführt zeigen (Output als Kommentar).

**NFR:** Test-User wird nach Lauf immer gelöscht (auch bei Fehler — try/finally). Kein Hardcode von Secrets.

**Traceability:**
- canvas-link: `../canvas/bazi-sprint-p3-supabase-foundation.canvas.md`
- canvas-problem: Unit-Tests mit Mocks beweisen nicht das Zusammenspiel mit echter Supabase-Instanz
- canvas-target-user: Entwickler / Deployment-Verifikation
- canvas-value-claim: Live-Verifikation vor Deploy — kein stiller Konfigurationsfehler
- canvas-success-signal: Alle Schritte PASS im Report-Output
- canvas-risk-status: aligned

---

## Nicht-funktionale Anforderungen (übergreifend)

- **Secrets:** `SUPABASE_SERVICE_ROLE_KEY` niemals loggen, committen, in Error-Responses senden oder in Browser-Bundle landen. Railway-Vars via `railway variables --service New_Bazi --set ...` setzen.
- **Anonymer Default:** Alle bestehenden Routen bleiben anonym nutzbar — `requireUserAuth` nur auf `/api/me/*`.
- **Fehlender Env-State:** App darf nie mit kaputten Buttons oder Throws auf fehlende Supabase-Konfiguration reagieren — immer ehrlicher Disabled-State.
- **TDD (Red-Green):** Jeder Task: failing test first → RED verifiziert → Implementation → GREEN verifiziert → commit.
- **Kein zweiter Error-Envelope:** `sendError`-Pattern aus `app.ts` exakt verwenden.
- **Dockerfile Build-Args:** Ohne `ARG VITE_SUPABASE_URL` + `ARG VITE_SUPABASE_ANON_KEY` in Dockerfile baut Vite ohne diese Werte.

---

## Traceability-Matrix

| REQ-ID | Titel | Canvas-Problem | Target-User | Value-Claim | Success-Signal | Risk-Status |
|--------|-------|----------------|-------------|-------------|----------------|-------------|
| REQ-P3-001 | Server-Client | Keine Persistenz-Grundlage | Wiederkehrende Nutzerinnen | Secret-sicherer DB-Zugriff | Tests grün, Key nicht im Build | aligned |
| REQ-P3-002 | Schema + RLS | Profile nicht speicherbar | Eingeloggte Nutzerinnen | Datenisolation per RLS | 2 Tabellen live | aligned |
| REQ-P3-003 | Auth-Middleware | Keine Auth-Schicht | Eingeloggte Nutzerinnen | Unautorisierte Zugriffe blockiert | 3 Test-Pfade grün | aligned |
| REQ-P3-004 | Profil-CRUD | Profile nicht persistierbar | Eingeloggte Nutzerinnen | Speichern/Laden/Löschen | Cross-User-Test fehlschlägt vor Fix | aligned |
| REQ-P3-005 | Client-Auth + UI | Jeder Besuch neu eingeben | Wiederkehrende + anonyme | Profil einmal anlegen, später laden | Disabled-State + Session-Stub e2e | aligned |
| REQ-P3-006 | Live-Spec | Mocks ≠ echter Roundtrip | Deployment-Verifikation | Kein stiller Konfigfehler | Alle Schritte PASS im Report | aligned |

---

## Out of Scope (P3)

- `contribution_events`, `daily_reactions`, `agent_conversations` — erst P8/P9/P11
- Passwort-Management, OAuth, Social Login
- Profil-Sync-Konflikte (Last-Write-Wins durch Upsert)
- Custom-SMTP (Supabase-Default reicht für Beta)
- Multi-Account-Support
