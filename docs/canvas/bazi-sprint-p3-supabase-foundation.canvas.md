# Product Canvas: BaZi Sprint P3 — Supabase Foundation

**Feature-Slug:** `bazi-sprint-p3-supabase-foundation`
**Status:** user-confirmed
**Erstellt:** 2026-06-12
**Bestätigt von:** Benjamin Pörsch, 2026-06-12 (Re-Confirm nach Council-Scope-B)
**Council-Entscheidung 2026-06-12:** Scope B — nur profiles + partner_profiles in P3; kein Tabellen-Präfix (Instanz clean); contribution_events/daily_reactions/agent_conversations auf P8/P9/P11 verschoben
**Bestätigungsphrase:** „Ich bestätige diese Product Vision als Grundlage für die AgileTeam-Planung."

---

## 1. Problem

**Explicit** (Sprint-Plan P3 + Master §1.4):
New_Bazi ist vollständig anonym — Nutzerinnen können kein Profil speichern. Bei jedem Besuch müssen Geburtsdaten neu eingegeben werden. Für Wiederholungsnutzerinnen und für alle geplanten Personalisierungsfeatures (P8 Quiz-Events, P9 Daily-Reaktionen, P11 Conversation-Memory) fehlt die Persistenz-Grundlage. Ohne Auth-Schicht können keine nutzerbezogenen Daten sicher gespeichert, abgerufen oder isoliert werden.

## 2. Zielnutzer/Kundin

**Explicit** (aus Canvas P1/P2, user-confirmed 2026-06-11):
Neugierige Erwachsene 25–45, keine tiefen BaZi-Vorkenntnisse, nutzen New_Bazi zum Erkunden von Mustern — Entertainment/Reflexion-Positionierung. Kein Zwang zur Registrierung: anonyme Nutzung bleibt Default-Flow; Persistenz ist Opt-in für Wiederkehrerinnen.

## 3. Bisheriger Workaround

**Explicit:** Keine Persistenz vorhanden. Nutzerinnen kopieren/merken sich Geburtsdaten manuell. Alle Personalisierungsfeatures (P8–P11) sind ohne Supabase-Grundlage nicht baubar.

## 4. Value Proposition

**Explicit** (Sprint-Plan P3):
- Nutzerinnen können sich per Magic Link (E-Mail-OTP) anmelden — kein Passwort-Management.
- Angemeldete Nutzerinnen können ihr Profil (Geburtsdaten) speichern und beim nächsten Besuch laden.
- Anonyme Nutzung bleibt vollständig erhalten — Persistenz ist **Opt-in**, kein Gate.
- Serverseitig: Supabase Service-Role-Key bleibt im BFF; Browser bekommt nur das anon-key-basierte Auth-SDK.
- Ehrlicher Disabled-State: ohne konfigurierte Env-Vars zeigt die App „Konto-Funktion derzeit nicht verfügbar" — keine kaputten Buttons, kein Fake.
- Kein Tabellen-Präfix (Instanz New_Bazi-dediziert, keine Kollisionsgefahr).

## 5. Erfolgssignal

**Explicit** (Sprint-Plan P3, Tasks 1–6):
1. TDD-grün für alle Tasks (RED/GREEN-Beweise im Report).
2. `npm run lint && npm test && npm run build` — Zahlen vorher/nachher, kein Regressionen.
3. `npx playwright test` — Disabled-State ohne Env verifiziert; Session-Stub-Test (Profil-speichern-Button sichtbar) grün.
4. Schema in Supabase live: `select tablename from pg_tables where tablename in ('profiles','partner_profiles')` → 2 Zeilen.
5. Gated Live-Spec (Task 6) PASS auf lokalem Server mit echten Env-Werten.
6. Live-Smoke nach Deploy: Disabled-State-Prüfung BZW. Magic-Link-Anmeldung + Profil speichern/laden auf `newbazi-production.up.railway.app`.

## 6. Kern-Use-Case

**Explicit** (Sprint-Plan P3):
Nutzerin gibt Geburtsdaten ein → berechnet Profil → sieht (nur wenn eingeloggt) „Dieses Profil speichern" → klickt → Profil in `nb_profiles` gespeichert. Beim nächsten Besuch: „Gespeichertes Profil laden" → Auswahl → Geburtsdaten in Felder vorausgefüllt → Berechnung startet. Abmelden jederzeit möglich. Ohne Anmeldung: identischer Flow wie bisher — kein Unterschied.

## 7. Non-Goals (explizit)

**Explicit** (Sprint-Plan P3):
- Kein Passwort-Management, kein OAuth, kein Social Login.
- Keine Profil-Sync-Konfliktlösung (zwei Geräte gleichzeitig schreiben → Last-Write-Wins durch Upsert).
- `contribution_events`, `daily_reactions`, `agent_conversations` werden in P3 **nicht** angelegt — kommen erst wenn P8/P9/P11 gebaut werden.
- Kein Tabellen-Präfix (plain names: `profiles`, `partner_profiles`).
- Keine bestehenden Routen ändern — alle bleiben anonym nutzbar.
- Kein Profil-Merge oder Multi-Account-Support.
- E-Mail-Versand-Infrastruktur: Supabase-Default-SMTP reicht für Beta; kein Custom-SMTP in P3.

## 8. Risiken / Widersprüche

**Explicit** (Sprint-Plan P3, Risiken-Abschnitt):
- **[RESOLVED E-DB — User decision 2026-06-12]** Variante A: Instanz `ykoijifgweoapitabgxx.supabase.co`. Astro-Noctum-Daten geleert, Instanz New_Bazi-dediziert, kein geteilter User-State, kein Präfix nötig.
- **supabase-js v2 `auth.getUser(jwt)` macht Netzwerk-Call** → in Unit-Tests IMMER mocken (vi.mock); Timeout-Handling (5 s) in Middleware einbauen.
- **BFF Service-Role-Key umgeht RLS** → jede Query MUSS explizit `eq('user_id', req.userId)` filtern (Test erzwungen in Task 4).
- **Vite Build-Args** → `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` müssen als ARG/ENV in Dockerfile deklariert sein (Astro-Noctum-Lektion: ohne ARG-Deklaration baut Vite blind).
- **Railway-Deploy**: Env-Vars für beide Services (New_Bazi + ggf. FuFirE) via `railway variables --service New_Bazi --set ...`; Werte niemals printen/committen.
- **Variante A Vorcheck**: Falls A gewählt, vor Task 2 prüfen dass keine `nb_`-Tabellen existieren.

## 9. Evidence Needed

**Explicit** (Sprint-Plan P3):
- TDD-Beweise (RED/GREEN) je Task.
- Gate-Zahlen vorher/nachher (vitest + Playwright).
- Live-Schema-Verifikation (2 Tabellen: profiles, partner_profiles).
- Gated-Live-Spec-Output (Task 6) im Report.
- Dockerfile-Build-Args-Check (docker build oder ehrliche Notiz).

## 10. Traceability

- MASTER: `docs/plans/2026-06-11-MASTER-fullfeature-roadmap.md`
- P3-Plan: `docs/plans/2026-06-11-sprint-p3-supabase-foundation.md`
- Erlaubter Änderungs-Scope:
  - `package.json` (+@supabase/supabase-js)
  - `src/server/supabase.ts` (neu)
  - `src/server/requireUserAuth.ts` (neu)
  - `src/server/app.ts` (neue Routen, nach bestehenden)
  - `src/server/supabase.test.ts` (neu)
  - `src/server/requireUserAuth.test.ts` (neu)
  - `src/server/app.test.ts` (erweitert)
  - `src/lib/supabaseClient.ts` (neu, Browser-only)
  - `src/components/AccountMenu.tsx` (neu)
  - `src/App.tsx` (AccountMenu einbinden, Profil-speichern-Button)
  - `src/components/InputForm.tsx` (Profil-laden-Auswahl)
  - `supabase/migrations/20260611_p3_foundation.sql` (neu)
  - `docs/contracts/supabase-schema.md` (neu)
  - `scripts/supabase-live-check.mts` (neu)
  - `Dockerfile` (ARG/ENV für Vite-Supabase-Vars)
  - `.env.example` (neue Var-Namen, ohne Werte)
