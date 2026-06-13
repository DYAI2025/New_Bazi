# PRD: BaZi Ehrlichkeits-Sprints P1 + P2

**Feature-Slug:** `bazi-sprint-p1-p2-ehrlichkeit`
**Status:** user-confirmed
**Bestätigt von:** Benjamin Pörsch, 2026-06-11
**Canvas:** [docs/canvas/bazi-sprint-p1-p2-ehrlichkeit.canvas.md](../canvas/bazi-sprint-p1-p2-ehrlichkeit.canvas.md)
**Vision:** [docs/vision/bazi-sprint-p1-p2-ehrlichkeit.vision.md](../vision/bazi-sprint-p1-p2-ehrlichkeit.vision.md)
**Erstellt:** 2026-06-11
**Quellen:** MASTER-fullfeature-roadmap, sprint-p1-kritische-fixes, sprint-p2-engine-track

---

## Kontext

New_Bazi zeigt an mehreren live-verifizierten Stellen fabrizierte oder irreführende Daten. Diese PRD formalisiert die Behebung aller P1- und P2-Bugs als testbare Requirements mit vollständiger Canvas-Traceability.

Council-Challenge-Gate (Phase 0.16) bestanden — Option A (vollständiger Scope) durch User bestätigt 2026-06-11.

---

## Requirements

### REQ-P1-001 — Coaching/Therapie-Wording entfernen (B-001)

**Quelle:** `docs/plans/2026-06-11-sprint-p1-kritische-fixes.md` §Task 1  
**Scope:** `src/components/WuXingDetail.tsx`

**Acceptance Criteria:**
- Kein String `coachingText`, `Coaching`, `Therapie`, `Diagnose`, `Metaphysischer Ratschlag` in P1-Scope-Dateien
- `viewModel.wuXingDetail.reflection` wird als "Reflexionsvektor" / neutraler Label gerendert
- Vitest: `WuXingDetail.test.tsx` rot vor fix, grün danach
- `npm run lint` fehlerfrei

**Canvas-Traceability:**

| Feld | Wert |
|------|------|
| `canvas-link` | `docs/canvas/bazi-sprint-p1-p2-ehrlichkeit.canvas.md` |
| `canvas-problem` | Coaching/Therapie-Wording widerspricht Entertainment/Reflexion-Positionierung |
| `canvas-target-user` | Neugierige Erwachsene 25-45, keine therapeutischen Erwartungen |
| `canvas-value-claim` | Keine Coaching/Therapie/Diagnose-Sprache in Produkttexten |
| `canvas-success-signal` | P1-Tasks TDD-grün; Keine neuen Browserfehler |
| `canvas-risk-status` | `aligned` |

---

### REQ-P1-002 — coherenceIndex Missing-State statt Hardcode-75 (B-002)

**Quelle:** `docs/plans/2026-06-11-sprint-p1-kritische-fixes.md` §Task 2  
**Scope:** `src/utils/fufireNormalizer.ts`, `src/components/Overview.tsx`

**Acceptance Criteria:**
- `normalizeCoherence(undefined)` → `null` (nicht `75`)
- `normalizeCoherence(null)` → `null`
- `normalizeCoherence(82)` → `82`
- UI rendert bei `null` einen Missing-State-Indicator (z.B. `—` oder `Nicht berechnet`)
- Kein hardkodierter Default `75` in Scope-Dateien
- Vitest rot vor fix, grün danach; E2E: Playwright-Check für Missing-State-Display

**Canvas-Traceability:**

| Feld | Wert |
|------|------|
| `canvas-link` | `docs/canvas/bazi-sprint-p1-p2-ehrlichkeit.canvas.md` |
| `canvas-problem` | Fabrizierter Prozentwert erscheint als berechnet |
| `canvas-target-user` | Neugierige Erwachsene 25-45 |
| `canvas-value-claim` | Jede angezeigte Zahl hat echten Datenanker; fehlt Wert → Missing-State |
| `canvas-success-signal` | P1-Tasks TDD-grün |
| `canvas-risk-status` | `aligned` |

---

### REQ-P1-003 — TensionNavigator Pinning-Test (B-007)

**Quelle:** `docs/plans/2026-06-11-sprint-p1-kritische-fixes.md` §Task 3  
**Scope:** `tests/e2e/tension-navigator.spec.ts`, `src/components/TensionNavigator.tsx`

**Acceptance Criteria:**
- Playwright-Test `tension-navigator.spec.ts` besteht nach REQ-P1-002 (coherenceIndex=null erzwingt keine Pinning-Regression)
- Test prüft: Missing-State korrekt sichtbar, kein JS-Error in Console wenn `coherenceIndex === null`
- Neue Testzeile für `coherenceIndex=null`-Pfad im E2E-Suite

**Canvas-Traceability:**

| Feld | Wert |
|------|------|
| `canvas-link` | `docs/canvas/bazi-sprint-p1-p2-ehrlichkeit.canvas.md` |
| `canvas-problem` | Keine Regressions-Absicherung für null-State in kritischem Component |
| `canvas-target-user` | Neugierige Erwachsene 25-45 |
| `canvas-value-claim` | Keine neuen Browserfehler in betroffenen Tabs |
| `canvas-success-signal` | Playwright-Suite +1 Test; kein Crash |
| `canvas-risk-status` | `aligned` |

---

### REQ-P1-004 — TensionNavigator Intro-Text (B-010)

**Quelle:** `docs/plans/2026-06-11-sprint-p1-kritische-fixes.md` §Task 4  
**Scope:** `src/components/TensionNavigator.tsx`

**Acceptance Criteria:**
- Intro-Text enthält keine „Du bist…"-Festlegung
- Text ist als Reflexionsangebot formuliert (z.B. „Dieses Modell zeigt…" statt „Du bist…")
- Vitest Snapshot-Test rot vor fix, grün danach

**Canvas-Traceability:**

| Feld | Wert |
|------|------|
| `canvas-link` | `docs/canvas/bazi-sprint-p1-p2-ehrlichkeit.canvas.md` |
| `canvas-problem` | Anti-Reification verletzt: feste Charakterzuschreibungen |
| `canvas-target-user` | Neugierige Erwachsene 25-45 |
| `canvas-value-claim` | Anti-Reification-Framing; keine „Du bist…"-Festlegungen |
| `canvas-success-signal` | P1-Tasks TDD-grün |
| `canvas-risk-status` | `aligned` |

---

### REQ-P1-005 — DST-Fehler handlungsleitende Meldung (A8)

**Quelle:** `docs/plans/2026-06-11-sprint-p1-kritische-fixes.md` §Task 5  
**Scope:** `src/server/app.ts`, `src/components/InputForm.tsx`

**Acceptance Criteria:**
- FuFirE 422 `type=dst_error` → BFF antwortet `400` mit Body `{error: "DST_CONFLICT", hint: "Bitte eine Zeit vor 02:00 oder nach 03:00 wählen."}`
- UI zeigt hint-Text, nicht generic „502 FuFirE hat die Geburtsdaten abgelehnt"
- Vitest: BFF-Handler rot vor fix, grün danach
- Playwright: DST-Fehlerpfad-Test

**Canvas-Traceability:**

| Feld | Wert |
|------|------|
| `canvas-link` | `docs/canvas/bazi-sprint-p1-p2-ehrlichkeit.canvas.md` |
| `canvas-problem` | DST-Fehler nicht handlungsleitend → User stuck |
| `canvas-target-user` | Neugierige Erwachsene 25-45 |
| `canvas-value-claim` | Fehlermeldungen sind handlungsleitend |
| `canvas-success-signal` | P1-Tasks TDD-grün; Keine neuen Browserfehler |
| `canvas-risk-status` | `aligned` |

---

### REQ-P1-006 — viewModel.warnings rendern (A13)

**Quelle:** `docs/plans/2026-06-11-sprint-p1-kritische-fixes.md` §Task 6  
**Scope:** `src/components/BaZiDetail.tsx` oder `Overview.tsx`

**Acceptance Criteria:**
- `viewModel.warnings` wird in UI als sichtbarer Hinweis-Block gerendert (wenn nicht leer)
- Vitest: Component-Test mit `warnings: ["…"]` rot vor fix, grün danach
- Kein Warning-Array, das im `viewModel` vorhanden aber unsichtbar ist

**Canvas-Traceability:**

| Feld | Wert |
|------|------|
| `canvas-link` | `docs/canvas/bazi-sprint-p1-p2-ehrlichkeit.canvas.md` |
| `canvas-problem` | Berechnungshinweise unsichtbar → Nutzerin fehlt Kontext |
| `canvas-target-user` | Neugierige Erwachsene 25-45 |
| `canvas-value-claim` | Jede angezeigte Zahl hat echten Datenanker; Missing-State sichtbar |
| `canvas-success-signal` | P1-Tasks TDD-grün |
| `canvas-risk-status` | `aligned` |

---

### REQ-P1-007 — Element-spezifische Tages-Meister-Texte (A14)

**Quelle:** `docs/plans/2026-06-11-sprint-p1-kritische-fixes.md` §Task 7  
**Scope:** `src/utils/fufireNormalizer.ts`, tägliche Text-Rendering-Component

**Acceptance Criteria:**
- Jedes der 5 Elemente (Holz/Feuer/Erde/Metall/Wasser) hat eigenen Tages-Meister-Text
- Einheitstext „Ausgewogenheit, Feinfühligkeit" erscheint nur für genau ein Element (oder gar nicht)
- Vitest: 5 element-spezifische Tests, jeder bestätigt unterschiedlichen Text

**Canvas-Traceability:**

| Feld | Wert |
|------|------|
| `canvas-link` | `docs/canvas/bazi-sprint-p1-p2-ehrlichkeit.canvas.md` |
| `canvas-problem` | Identische Texte für alle Elemente — Engine-Output ignoriert |
| `canvas-target-user` | Neugierige Erwachsene 25-45 |
| `canvas-value-claim` | Element-spezifische Deutungen statt Einheitstext |
| `canvas-success-signal` | P1-Tasks TDD-grün |
| `canvas-risk-status` | `aligned` |

---

### REQ-P2-001 — Western Daily Variation (B-003)

**Quelle:** `docs/plans/2026-06-11-sprint-p2-engine-track.md` §Task 1  
**Repo:** FuFirE  
**Scope:** `bazi_engine/services/daily_western.py`, `tests/test_daily_western.py`

**Acceptance Criteria:**
- `/v1/experience/daily` für Datum D und D+6 liefert nicht-identische `western_text`
- `daily_western.py` nutzt tatsächliches Datum als Seed/Parameter statt statischen Template
- pytest: `test_daily_western.py` rot vor fix, grün danach
- `uv run pytest tests/test_daily_western.py -q` → 0 failed

**Canvas-Traceability:**

| Feld | Wert |
|------|------|
| `canvas-link` | `docs/canvas/bazi-sprint-p1-p2-ehrlichkeit.canvas.md` |
| `canvas-problem` | Byte-identische Western-Texte für Daten 6 Tage auseinander (live verifiziert) |
| `canvas-target-user` | Neugierige Erwachsene 25-45 |
| `canvas-value-claim` | Tages-Puls variiert täglich (Engine-seitig fix) |
| `canvas-success-signal` | P2-Tasks TDD-grün; pytest Zahlen vorher/nachher |
| `canvas-risk-status` | `aligned` |

---

### REQ-P2-002 — daily_elemental_comparison (Issue #133)

**Quelle:** `docs/plans/2026-06-11-sprint-p2-engine-track.md` §Task 2  
**Repo:** FuFirE  
**Scope:** `bazi_engine/services/daily_elements.py` (neu), `bazi_engine/routers/experience.py`, `tests/test_daily_elemental_comparison.py` (neu)

**Acceptance Criteria:**
- `/v1/experience/daily` antwortet mit `elemental_comparison`-Feld (Tages-Element vs. Geburtselement)
- `daily_elements.py` berechnet Vergleich korrekt für alle 5-Element-Kombinationen (25 Fälle)
- pytest: neues `test_daily_elemental_comparison.py` mit ≥25 parametrisierten Tests
- Kein Breaking Change an bestehenden Response-Feldern
- OpenAPI-Spec (`spec/openapi/openapi.json`) aktualisiert

**Canvas-Traceability:**

| Feld | Wert |
|------|------|
| `canvas-link` | `docs/canvas/bazi-sprint-p1-p2-ehrlichkeit.canvas.md` |
| `canvas-problem` | Tages-Elemental-Vergleich fehlt (Issue #133) |
| `canvas-target-user` | Neugierige Erwachsene 25-45 |
| `canvas-value-claim` | Element-spezifische Deutungen; Engine-Daten vollständig |
| `canvas-success-signal` | P2-Tasks TDD-grün |
| `canvas-risk-status` | `aligned` |

---

### REQ-P2-003a — Dayun Engine Verify (B-012)

**Quelle:** `docs/plans/2026-06-11-sprint-p2-engine-track.md` §Task 3a  
**Repo:** FuFirE  
**Scope:** `bazi_engine/routers/dayun.py`, `tests/test_dayun_endpoint.py`

**Acceptance Criteria:**
- `GET /v1/dayun/{birth_data}` antwortet `200` mit vollständigen Dayun-Daten
- Keine 404/501 für valide Eingaben
- pytest: `test_dayun_endpoint.py` rot vor fix (falls Regression), grün danach
- `mypy` + `ruff` sauber

**Canvas-Traceability:**

| Feld | Wert |
|------|------|
| `canvas-link` | `docs/canvas/bazi-sprint-p1-p2-ehrlichkeit.canvas.md` |
| `canvas-problem` | Engine implementiert, aber Endpoint nicht korrekt erreichbar |
| `canvas-target-user` | Neugierige Erwachsene 25-45 |
| `canvas-value-claim` | Implementierte Engine-Features erreichbar |
| `canvas-success-signal` | P2-Tasks TDD-grün |
| `canvas-risk-status` | `aligned` |

---

### REQ-P2-003b — Dayun BFF Client (B-012)

**Quelle:** `docs/plans/2026-06-11-sprint-p2-engine-track.md` §Task 3b  
**Repo:** New_Bazi  
**Scope:** `src/server/app.ts` (Zeilen 469-478 Stub entfernen), `src/api/bazodiacClient.ts`

**Acceptance Criteria:**
- `app.ts:469-478` hardkodierter `missing-capability`-Stub entfernt
- **Fixture-Abhängigkeit (FINDING-003):** Fixture-Capture für vitest-Mocks NACH Deploy von REQ-P2-003a (FuFirE-Engine-PR) neu ausführen — nie gegen lokalen Stand mocken, der vom deployed Schema abweicht
- BFF ruft FuFirE Dayun-Endpoint korrekt auf
- Vitest: BFF-Dayun-Handler rot vor fix, grün danach
- Playwright: Dayun-Tab zeigt echte Engine-Daten (nicht `missing-capability`)

**Canvas-Traceability:**

| Feld | Wert |
|------|------|
| `canvas-link` | `docs/canvas/bazi-sprint-p1-p2-ehrlichkeit.canvas.md` |
| `canvas-problem` | BFF gibt `missing-capability` obwohl Engine vollständig implementiert |
| `canvas-target-user` | Neugierige Erwachsene 25-45 |
| `canvas-value-claim` | Implementierte Features erreichbar; keine fabrizierten Capability-Lügen |
| `canvas-success-signal` | P1+P2-Tasks TDD-grün; Live-Smoke bestanden |
| `canvas-risk-status` | `aligned` |

---

### REQ-P2-004 — Unknown-Time-Contract (Bootstrap quality-flag)

**Quelle:** `docs/plans/2026-06-11-sprint-p2-engine-track.md` §Task 4  
**Repo:** FuFirE  
**Scope:** `bazi_engine/routers/dayun.py`, `tests/test_bootstrap_unknown_time.py` (neu), `docs/contracts/unknown-time.md` (neu)

**Acceptance Criteria:**
- `/v1/experience/bootstrap` mit `birth_time_known=false` → Response enthält `quality_flag: "time_unknown"` und kein `ascendant_sign`
- `/v1/experience/bootstrap` mit `birth_time_known=true` → normaler Pfad unverändert
- pytest: `test_bootstrap_unknown_time.py` ≥6 Cases (known/unknown × diverse birth_data)
- `docs/contracts/unknown-time.md` beschreibt Verhalten als maschinenlesbares Contract-Dokument

**Canvas-Traceability:**

| Feld | Wert |
|------|------|
| `canvas-link` | `docs/canvas/bazi-sprint-p1-p2-ehrlichkeit.canvas.md` |
| `canvas-problem` | `birth_time_known` wird ignoriert → zeitabhängige Felder erscheinen ohne Datenbasis |
| `canvas-target-user` | Neugierige Erwachsene 25-45 |
| `canvas-value-claim` | Fehlende Daten → Missing-State; nie fabrizierte Defaults |
| `canvas-success-signal` | P2-Tasks TDD-grün |
| `canvas-risk-status` | `aligned` |

---

## Traceability Matrix

| REQ-ID | Canvas-Problem | Target-User | Value-Claim | Success-Signal | Risk-Status | Plan-Ref |
|--------|---------------|-------------|-------------|----------------|-------------|----------|
| REQ-P1-001 | Coaching-Wording | Erw. 25-45 | Kein Coaching-Text | P1-TDD-grün | aligned | §Task 1 |
| REQ-P1-002 | Fab. coherenceIndex | Erw. 25-45 | Jede Zahl hat Anker | P1-TDD-grün | aligned | §Task 2 |
| REQ-P1-003 | Null-Regression | Erw. 25-45 | Kein JS-Crash | +1 E2E-Test | aligned | §Task 3 |
| REQ-P1-004 | Anti-Reification | Erw. 25-45 | Keine Du-bist-Festl. | P1-TDD-grün | aligned | §Task 4 |
| REQ-P1-005 | DST 502 | Erw. 25-45 | Handlungs-Fehlertext | P1-TDD-grün | aligned | §Task 5 |
| REQ-P1-006 | Warnings unsichtbar | Erw. 25-45 | Missing-State sichtbar | P1-TDD-grün | aligned | §Task 6 |
| REQ-P1-007 | Einheits-Element-Text | Erw. 25-45 | Element-spez. Texte | P1-TDD-grün | aligned | §Task 7 |
| REQ-P2-001 | Identische Daily-Texts | Erw. 25-45 | Tages-Puls variiert | P2-pytest-grün | aligned | §Task 1 |
| REQ-P2-002 | Fehlender Elem-Vergl. | Erw. 25-45 | Engine-Daten vollst. | P2-pytest-grün | aligned | §Task 2 |
| REQ-P2-003a | Dayun Engine | Erw. 25-45 | Features erreichbar | P2-pytest-grün | aligned | §Task 3a |
| REQ-P2-003b | Dayun BFF-Stub | Erw. 25-45 | Features erreichbar | Live-Smoke | aligned | §Task 3b |
| REQ-P2-004 | Unknown-Time-Flag | Erw. 25-45 | Fehlend→null | P2-pytest-grün | aligned | §Task 4 |

---

## DoD (aus MASTER §3)

> **Spec-Sanity-Note (FINDING-001 korrigiert):** pytest-Baseline live-verifiziert 2026-06-11: **2526 passed, 54 skipped, 1 xfailed**. Spec-Auditor-Zahl (~1954) war grep-Artefakt ohne parametrize-Expansion — plan-Zahl ~2526 korrekt.


1. Alle P1-REQs TDD-grün (RED/GREEN-Beweise im Report)
2. Alle P2-REQs TDD-grün (FuFirE pytest + New_Bazi vitest)
3. `npm run lint && npm test && npm run build && npx playwright test` — Zahlen vorher/nachher
4. `uv run pytest -q` (FuFirE) — Zahlen vorher/nachher
5. Live-Smoke auf `newbazi-production.up.railway.app` + `api.fufire.space` nach Merge+Deploy
6. Keine neuen Browserfehler in betroffenen Tabs
7. Kein neuer Scope jenseits P1/P2 (Non-Goal)

## Sicherheits-Constraints

- NIEMALS Secrets printen oder committen
- Railway-Vars nur via `railway variables --kv` (nur Namen/Längen berichten)
- `.env` ist gitignored
- Ersatzteillager (Astro-Noctum): READ-ONLY
- Verbotene Wörter: „Coaching", „Therapie", „Diagnose", „Du bist…"
