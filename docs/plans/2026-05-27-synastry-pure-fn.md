# Synastry Pure-Function Extraction — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (coder → independent code-reviewer per task).

**Goal:** Extract the private `compareProfiles` synastry logic from `src/server/app.ts` into a pure, exported, unit-tested module `src/utils/synastry.ts`, with no change to the `/api/azodiac/synastry` response.

**Architecture:** A pure function `compareProfiles(a, b)` operating only on the fields it reads (`bazi.dayMaster.element`, `western.sunSign`) plus helpers `westernElement(sign)` and `elementRelationship(ea, eb)`. `app.ts` imports them and drops its local copies. Behaviour-preserving refactor — existing `app.test.ts` must stay green.

**Tech Stack:** TypeScript, Vitest (colocated `*.test.ts`), Express BFF.

---

## Definition of Done

- `src/utils/synastry.ts` exists, exports `compareProfiles`, `westernElement`,
  `elementRelationship`; pure (no I/O, no env, no FuFirE).
- `src/utils/synastry.test.ts` covers: all 4 element relationships
  (same / generating / controlling / neutral), all 4 western element buckets
  (Feuer/Erde/Luft/Wasser), western compatibility scoring, and the averaged score.
- `src/server/app.ts` imports from the new module; the local `GENERATING`,
  `CONTROLLING`, `westernElement`, `compareProfiles` definitions are removed.
- **Behaviour unchanged:** identical numeric scores and German `harmonyAnalysis`/
  `advice` strings as before for the same inputs.
- `npm test` → all suites green (baseline 76 tests + new ones).
- `npm run lint` (`tsc --noEmit`) → no errors.

## Edge cases the tests must pin

- Same element (Holz/Holz) → baziScore 85.
- Generating pair (Holz→Feuer) in either direction → 78.
- Controlling pair (Holz→Erde) in either direction → 52.
- Neutral pair (no generating/controlling relation) → 65.
- Western: same sign-element → 82; same "polarity group" (Feuer/Luft or Erde/Wasser) → 70; else 56.
- Combined `score = round((baziScore + westernScore) / 2)`.
- `advice` thresholds: ≥75, ≥60, else.

### Task 1: Extract + test `synastry.ts` (TDD)

**Files:**
- Create: `src/utils/synastry.ts`
- Create: `src/utils/synastry.test.ts`
- Modify: `src/server/app.ts` (import from util, delete local copies)

**Step 1 — Write failing tests** in `src/utils/synastry.test.ts` covering every
row in "Edge cases" above, using minimal `ProfileViewModel` fixtures (only
`bazi.dayMaster.element` + `western.sunSign`, cast `as ProfileViewModel`).

**Step 2 — Run, expect RED:** `npm test -- synastry` → fails (module missing).

**Step 3 — Implement** `src/utils/synastry.ts` by lifting the exact logic from
`app.ts` (GENERATING/CONTROLLING maps, `westernElement`, `compareProfiles`), keeping
the German strings byte-identical. Add `elementRelationship(ea, eb)` returning the
relation + baziScore.

**Step 4 — Run, expect GREEN:** `npm test -- synastry`.

**Step 5 — Refactor `app.ts`:** import `compareProfiles` (+ `westernElement` if used
elsewhere) from `../utils/synastry`; delete the local `GENERATING`, `CONTROLLING`,
`westernElement`, `compareProfiles`.

**Step 6 — Full suite + lint:** `npm test` (all green, incl. `app.test.ts`),
`npm run lint`.

**Step 7 — Commit** on `feat/synastry-pure-fn`.
