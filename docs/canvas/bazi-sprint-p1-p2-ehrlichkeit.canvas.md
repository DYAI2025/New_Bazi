# Product Canvas: BaZi Ehrlichkeits-Sprints P1 + P2

**Feature-Slug:** `bazi-sprint-p1-p2-ehrlichkeit`
**Status:** user-confirmed
**Erstellt:** 2026-06-11
**Bestätigt von:** Benjamin Pörsch, 2026-06-11
**Bestätigungsphrase:** „Ich bestätige diese Product Vision als Grundlage für die AgileTeam-Planung."

---

## 1. Problem

**Explicit** (Master §1.4 + §5, live verifiziert):
New_Bazi zeigt an mehreren Stellen erfundene oder täuschende Daten:
- `coherenceIndex` fällt bei fehlendem Wert auf `75` (hartkodiert) statt auf `null` — UI zeigt einen erfundenen Prozentsatz als wäre er berechnet.
- Alle Nutzer sehen identische Tagesmeister-Texte (Einheitstext „Ausgewogenheit, Feinfühligkeit") unabhängig vom Element.
- DST-Konflikt-Fehler (FuFirE 422 `type=dst_error`) wird als 502 „FuFirE hat die übermittelten Geburtsdaten abgelehnt" ausgegeben — nicht handlungsleitend.
- `viewModel.warnings` werden nicht gerendert — Berechnungshinweise sind für den Nutzer unsichtbar.
- Coaching/Therapie-Wording in WuXingDetail (`coachingText`, „Metaphysischer Ratschlag (Coaching-Vektor)") widerspricht der Entertainment/Reflexion-Positionierung.
- FuFirE `/v1/experience/daily` liefert für zwei Daten 6 Tage auseinander byte-identische Western-Texte (B-003, live verifiziert).
- New_Bazi gibt `missing-capability` für Dayun zurück obwohl die Engine vollständig implementiert ist (BFF-Stub hartkodiert, `app.ts:469–474`).
- FuFirE `/v1/experience/bootstrap` ignoriert `birth_time_known` — kein Quality-Flag trotz zeitabhängigem `ascendant_sign`.

## 2. Zielnutzer/Kundin

**Explicit** (Master §1.4) + **User decision 2026-06-11 (OQ-1)**:
Neugierige Erwachsene 25–45, keine tiefen BaZi-Vorkenntnisse, nutzen New_Bazi zum Erkunden von Mustern — ähnlich wie Horoskop-Apps, aber tiefgründiger. Keine therapeutischen, diagnostischen oder Coaching-Erwartungen. Entertainment/Reflexion-Positionierung.

## 3. Bisheriger Workaround

**Explicit** (§5 verifizierte Fakten): Kein Workaround vorhanden — die Bugs sind in der Live-App (`newbazi-production.up.railway.app`) aktiv und für Nutzer sichtbar.

## 4. Value Proposition

**Explicit** (Master §1.4, §4 Ehrlichkeits-Regeln):
- **Jede angezeigte Zahl hat einen echten Datenanker** — fehlt ein Wert, zeigt die App den Missing-State, nicht eine erfundene Zahl.
- **Fehlermeldungen sind handlungsleitend** (DST: „Bitte eine Zeit vor 02:00 oder nach 03:00 wählen" statt 502-Generik).
- **Keine Coaching/Therapie/Diagnose-Sprache** in Produkttexten.
- **Element-spezifische Deutungen** statt Einheitstext.
- **Tages-Tagespuls variiert täglich** (Engine-seitig fix).
- **Anti-Reification-Framing**: keine „Du bist…"-Festlegungen, bewusste Rahmung als Modell/Reflexionsangebot.

## 5. Erfolgssignal

**Explicit** (Master §3 DoD):
1. Alle 7 P1-Tasks TDD-grün (RED/GREEN-Beweise im Report).
2. Alle P2-Tasks TDD-grün (FuFirE-Engine-Tests + New_Bazi-Client-Tests).
3. `npm run lint && npm test && npm run build && npx playwright test` — Zahlen vorher/nachher.
4. `uv run pytest -q` (FuFirE) — Zahlen vorher/nachher.
5. Live-Smoke auf `newbazi-production.up.railway.app` + `api.fufire.space` nach Merge+Deploy bestanden.
6. Keine neuen Browserfehler in betroffenen Tabs.

## 6. Kern-Use-Case

**Assumption (aus Plans abgeleitet):**
Nutzerin berechnet ihr BaZi-Profil → App zeigt echte Engine-Daten mit ehrlichen Missing-States wo Daten fehlen, handlungsleitende Fehlertexte bei Eingabefehlern (DST, ungültige Zeit), Anti-Reification-Framing in allen Deutungstexten, element-spezifische Tagesmeister-Beschreibungen, täglich variierende Tages-Lesung.

## 7. Non-Goals (explizit)

**Explicit** (Master §2 Fidelity + Plans):
- Keine neuen Features jenseits P1/P2-Scope.
- Keine neue Dependencies.
- Keine UX-Überarbeitung/Redesign.
- P3–P12 sind explizit spätere Sprints — **kein Scope-Creep**.
- E-DB-Entscheidung (Supabase-Instanz) ist **BLOCKER für P3**, nicht für P1/P2 — hier irrelevant.
- Kein Merge ohne Review (Master §6).

## 8. Risiken / Widersprüche

**Explicit** (Master §1.5 Technische Fallen):
- **Zwei-Repo-Scope**: P1 in `New_Bazi`, P2 primär in `FuFirE` — untypisch für einen /agileteam-Lauf; Koordination zwischen zwei Railway-Services.
- **rtk-Hook-Falle**: Bash-Kommandos werden umgeschrieben; `python3` → `uv run python3`; `rtk proxy curl` für rohe JSON-Ausgaben.
- **framer-motion v12 + SVG**: `transform-box: fill-box` erzwungen — NIEMALS motion-Transforms auf SVG.
- **Deploy-Frische-Trap**: `online`-Status in Railway zeigt auch alten Build; Frische via Asset-Bundle-Hash prüfen.
- **`/health` statisch**: beweist keine Deploy-Frische — Frische über neue Felder verifizieren.
- **Zwei-Repo-Parallelausführung bestätigt (OQ-2, User decision 2026-06-11):** P1 (New_Bazi) und P2 (FuFirE + New_Bazi-Task 3b) laufen gleichzeitig auf getrennten Branches.

## 9. Evidence Needed

**Explicit** (Master §3, Plans):
- TDD-Beweise (RED-Run-Ausgabe + GREEN-Run) je Task.
- Gate-Zahlen vorher/nachher (vitest + Playwright für P1; pytest + mypy + ruff für P2).
- Live-Smoke-Ergebnisse nach Deploy (beide Services).

## 10. Traceability

- MASTER: `docs/plans/2026-06-11-MASTER-fullfeature-roadmap.md`
- P1: `docs/plans/2026-06-11-sprint-p1-kritische-fixes.md`
- P2: `docs/plans/2026-06-11-sprint-p2-engine-track.md`
- Erlaubter Änderungs-Scope (P1): `src/components/WuXingDetail.tsx`, `src/components/TensionNavigator.tsx`, `src/components/Overview.tsx`, `src/components/BaZiDetail.tsx`, `src/components/InputForm.tsx`, `src/utils/fufireNormalizer.ts`, `src/utils/fufireClient.ts`, `src/server/app.ts`, `src/api/bazodiacClient.ts`, `src/__fixtures__/fufire/`, `src/test-utils/`, `tests/e2e/tension-navigator.spec.ts`
- Erlaubter Änderungs-Scope (P2, FuFirE): `bazi_engine/services/daily_western.py`, `bazi_engine/services/daily_templates.py`, `bazi_engine/services/daily_elements.py` (neu), `bazi_engine/routers/experience.py`, `bazi_engine/routers/dayun.py`, `tests/test_daily_western.py`, `tests/test_daily_elemental_comparison.py` (neu), `tests/test_bootstrap_unknown_time.py` (neu), `tests/test_dayun_endpoint.py`, `docs/contracts/unknown-time.md` (neu), `spec/openapi/openapi.json`
