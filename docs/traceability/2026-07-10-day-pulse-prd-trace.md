# Day Pulse / Day Trace — PRD-Traceability (Stand: Branch feat/tagespuls-etappe2, PR #58)

Validiert gegen: `prd_report (2).json` (prd-output-v1.1, 2026-07-10) + `day_pulse_schema (1).sql`.
Referenzimplementierung: Tagespuls 2.0 Etappe 1 (main, PR #57) + Etappe 2 (PR #58).

**Kernbefund:** Das PRD spezifiziert das **Zwei-Phasen-Aphorismus-Ritual** (Mode aus Harmony-Index,
deterministische Aphorismus-Zuweisung, Council-of-Six-**Wahl**, LLM-Phase-2 mit Backend-Validierung).
Die umgesetzten Etappen 1+2 folgen der Jury-Synthese vom 2026-07-10 (Tagestypen + Wiedererkennungs-Tap +
Begegnungswahl; Aphorismen bewusst nach Etappe 3 verschoben). **Ehrlichkeits-/Anti-Fabrikations-Kern und
Datenbasis sind deckungsgleich; das Kern-Ritual weicht ab.** Zwei echte Design-Konflikte (FR-DP-007,
FR-DP-014) und ein RLS-Musterabweichler sind PO-Entscheidungen.

## Functional Requirements

| FR | Vorgabe (kurz) | Status | Befund |
|---|---|---|---|
| FR-DP-001 | Mode aus H: spannung <0.45, pulse 0.45–0.50, trace ≥0.50 | ✅ (Stufe 1, 2026-07-11) | `natal.harmonyIndex` wird seit Etappe 1 durchgereicht (live 0.7498 → wäre `trace`), aber keine Mode-Ableitung. Trivial nachrüstbar (pure function, BFF). |
| FR-DP-002 | intensity = clamp(\|H−0.45\|/0.55, 0, 1), nie vom LLM | ✅ (Stufe 1) | Keine intensity-Berechnung. Ebenfalls trivial (gleiche Stelle wie FR-001). |
| FR-DP-003 | Slot 1 nur aus approved Aphorismen, Sprach-Text non-empty, Mode-Tag | ❌ fehlt | Kein Aphorismen-Korpus. Jury-Synthese hatte Aphorismen (audit-gated) bewusst in Etappe 3 — PRD macht sie zum Phase-1-Kern. Geist identisch (nur geprüfter Bestand, „lieber kein Satz als ein falscher" ≙ FR-DP-012). |
| FR-DP-004 | Cooldown, Affinity, deterministischer Top-5-Seed (user+local_date), same-day reuse | ❌ fehlt | Kein Assignment-Konzept. Client cached pro Datum (UI-Cache), erfüllt aber weder Determinismus-über-Surfaces noch Persistenz. |
| FR-DP-005 | Phase 1 = 3 Slots (Aphorismus 8–15 W, Bridge 10–20 W, Impuls 10–15 W; 30–50 gesamt) | ❌ fehlt | Stattdessen: Tagestyp-Frame (statisch, test-validiert) + Engine-Prosa. Keine generierten Slots. |
| FR-DP-006 | Phase-0-Orientation (erklären/direkt), Wahl wird gespeichert | ❌ fehlt | Kein Orientation-Schritt. |
| FR-DP-007 | Nach Phase 1 fragt der Agent, WER aus dem Rat arbeiten soll — **nie automatische Figurenwahl** | 🔴 **Konflikt** | `pickSpeaker` (src/utils/daily/dayTypeSelector.ts) wählt den Karten-Sprecher AUTOMATISCH (Day-Master → West-Archetyp → Dominantes Element; Gegenseite-Flip). Kontext verschieden (unsere Wahl = Karten-Label, PRD-Wahl = Phase-2-Einstieg), aber das PRD-Ritualprinzip „User wählt die Figur" ist nicht umgesetzt. |
| FR-DP-008 | Council-Antwort: exakt 6 stabile Keys (sun/moon/ascendant/day_master/year_animal/dominant_wuxing) mit label, Wert, availability, unavailable_reason | ✅ Shape (Stufe 1; Wahl-Flow = Etappe 3) | Geist voll da: „Schweigen ist Feature", leerer Aszendent-Sitz MIT Grund (`daily-ascendant-empty`). Aber keine explizite 6-Key-Struktur; moon/year_animal fehlen als Figuren — **obwohl die Daten vorhanden sind** (`natal.moonSign` im Daily-VM; Jahres-Säule im BaZi-Profil). |
| FR-DP-009 | Phase 2 nur nach expliziter Wahl, 50–90 W, 3–4 Sätze | ❌ fehlt | Keine LLM-Interpretation (bewusst: Jury-Entwurf ohne Generierung). |
| FR-DP-010 | Mode-Figurenregeln (pulse: +1–3 Figuren; trace: nur gewählte; spannung: +genau 1, temporal) | ❌ fehlt | Folgt aus FR-009. |
| FR-DP-011 | Backend validiert Bridge/Impuls/Phase-2 (Länge, Bann-Vokabular, Figuren-Zahl, Mode) | ❌ (n/a) | Keine Generierung → nichts zu validieren. Verwandtschaft: unsere STATISCHEN Texte sind durch Wording-Gates test-validiert (wordingHonesty, VERDICT-Regex in weeklyObservations.test) — dieselbe Bann-Vokabular-Idee, build-time statt runtime. |
| FR-DP-012 | Typed content-unavailable; Eve/Levi erfinden NIE einen Aphorismus | ✅ (Geist) | Durchgängig: `source:"missing"`, `missing-birth-time`, `missing-direction-basis`, 502-typed via sendError, Perturbation/Tagestyp-Missing-States. Aphorismus-Fall selbst n/a. |
| FR-DP-013 | Keine Deep-Dive-Hypothesen-Kopplung; nur non-hypothesis Metadaten oder **explizit user-authored reflection hooks** | ✅ | Kein Hypothesen-System berührt. `nb_daily_reflections` speichert ausschließlich user-authored Antworten (Tap, Begegnungswahl) — exakt die erlaubte Kategorie. |
| FR-DP-014 | EIN DailyPulseService für Dashboard UND Agent | 🔴 **Konflikt/Gap** | Ritual-Logik (Tagestyp, Sprecher, Angebote) liegt CLIENT-seitig (pure functions); Eve/Levi (ElevenLabs) haben **keine** Tagespuls-Anbindung; `/api/agent/daily/:userId` existiert nicht. Verstößt gegen FR-014 + NFR-DP-007 („no selection logic in frontends"). |

## Non-Functional Requirements

| NFR | Status | Befund |
|---|---|---|
| NFR-DP-001 Determinismus (user+date+corpus → gleiches Assignment) | ⚠️ | Tagestyp ist deterministisch aus Engine-Daten; kein Assignment über Surfaces/Sprachen (kein Korpus). |
| NFR-DP-002 Idempotenz via unique + re-read | ⚠️ | `nb_daily_reflections` hat `unique(user_id,date)` + Upsert — Muster vorhanden, aber fürs Reflexions-Objekt, nicht fürs Assignment. |
| NFR-DP-003 Typed degradation, nie stille Fabrikation | ✅ | Kernlinie des gesamten Builds (live verifiziert). |
| NFR-DP-004 p95-Ziele | ❌ (SOURCE_NEEDED auch im PRD) | Offen auf beiden Seiten. |
| NFR-DP-005 A11y (Keyboard/SR; Voice enumeriert Figuren) | ⚠️ | Dashboard: native Buttons (keyboard-ok), aria-labels teils; Voice-Flow n/a (keine Anbindung). |
| NFR-DP-006 i18n (Sprache ändert nur Textfläche) | ❌ | Nur Deutsch. |
| NFR-DP-007 Thin routes, Logik in Domain-Services | ⚠️ | BFF-Routen dünn ✅; aber Ritual-Logik client-seitig statt im Domain-Service (siehe FR-014). |

## API-Anforderungen

| API | Status |
|---|---|
| API-DP-001 `GET /api/agent/daily/:userId` (ElevenLabs-Tool, Secret + UUID) | ❌ fehlt (New_Bazi hat keinen Agent-Webhook; Muster existiert in Astro-Noctum) |
| API-DP-002 `POST /api/agent/daily/interpretation` (Phase 2) | ❌ fehlt |
| API-DP-003 gemeinsamer Domain-Service für experience/daily + agent/daily | ❌ fehlt |
| API-DP-004 `POST /api/agent/conversation` day_pulse-Metadaten, Hypothesen-Reject | ❌ fehlt |
| API-DP-005 Typed errors: code, safe message, **retryable**, **correlation_id** | ✅ (Stufe 1: sendError erweitert, correlationId geloggt) |

## Schema-Abgleich (`day_pulse_schema (1).sql`)

| PRD-Tabelle | Status | Anmerkung |
|---|---|---|
| `aphorisms` (Editorial-Korpus, rights/attribution, mode/tone/element-Tags, 8–15 W, cooldown) | ❌ fehlt | Deutlich reifer als der Etappe-3-Plan der Jury-Synthese (der nur audit_status kannte). Bei Umsetzung: PRD-Schema übernehmen. |
| `daily_aphorism_assignments` (1/user/local_date, seed_hash, harmony_index, intensity) | ❌ fehlt | |
| `daily_pulse_sessions` (Phase 0–2, chosen_figure, Wortzahl-Checks, idempotency_key) | ❌ fehlt | |
| `daily_pulse_events` (append-only, event_key unique) | ❌ fehlt | |
| — unsere `nb_daily_reflections` | ➕ additiv | Kollidiert NICHT (anderes Objekt: user-authored Reflexionen ≙ FR-DP-013-erlaubt). **Aber RLS-Musterabweichung:** PRD schreibt bewusst NUR select-Policies (Writes ausschließlich server-side/Service-Role); unsere Migration legt zusätzlich owner insert/update/delete-Policies an → erlaubt theoretisch direkte Client-Writes am BFF vorbei (Validierung umgangen). **Erledigt (Stufe 1): Migration auf select-only gekürzt** (Writes nur via BFF/Service-Role). |

## Konvergenz-Pfad (Vorschlag, PO-Entscheidung)

Das PRD ist verbindlicher User-Input und detaillierter als die Jury-Synthese. Vorschlag Etappe 3 = PRD-Alignment:

1. **Sofort billig (kein Konflikt):** `deriveMode(H)` + `intensity(H)` als pure functions im BFF (FR-001/002); moon + year_animal als Council-Figuren ergänzen (Daten vorhanden) und die 6-Key-Struktur mit availability/reason als API-Shape (FR-008); typed errors um retryable/correlation_id (API-005); `nb_daily_reflections`-RLS auf select-only.
2. **Ritual-Umbau (Konflikt auflösen):** Council-WAHL vor jeder figurenbezogenen Deutung (FR-007). Kompatibler Schnitt: automatischer Sprecher bleibt als Karten-Stimme der Tagestyp-Karte (beschreibend), jede INTERPRETATION (Phase 2) erfordert explizite Wahl — im PR/PO klären, ob das FR-007 genügt oder die Auto-Stimme ganz fällt.
3. **Aphorismus-Kern (FR-003–005, 009–012):** PRD-Schema 1:1 übernehmen, DailyPulseService im BFF (FR-014), `/api/agent/daily`-Endpunkte für Eve/Levi (API-001–003), Phase-2-Generierung mit Backend-Validierung (FR-011). Größtes Paket; ersetzt den bisherigen Etappe-3/4-Plan.
4. **Bestehendes bleibt:** Wiedererkennungs-Tap/Begegnungswahl/Wochenbogen sind FR-DP-013-konforme user-authored Hooks und können als eigenständige Ebene neben dem Aphorismus-Ritual weiterleben — oder werden in `daily_pulse_events`/Sessions integriert (PO-Frage).

**Score nach Stufe 1 (2026-07-11):** 6 ✅ · 2 🔴 Konflikt (FR-007/014 → Etappe 3) · 4 ⚠️ · 16 ❌ (Aphorismus-Ritual = Etappe 3).
