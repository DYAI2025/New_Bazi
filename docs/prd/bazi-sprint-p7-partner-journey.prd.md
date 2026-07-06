<!-- Status: user-confirmed -->
<!-- Confirmed by user: yes (2026-06-14) -->

# PRD — Sprint P7: Synastrie Completion / Partner Journey

**Feature slug:** `bazi-sprint-p7-partner-journey`
**Status:** user-confirmed  ·  **Confirmed by user:** yes (2026-06-14)
**Canvas:** `docs/canvas/bazi-sprint-p7-partner-journey.canvas.md`
**Vision:** `docs/vision/bazi-sprint-p7-partner-journey.vision.md`

## Authoritative spec
The full, task-level specification is the user-provided plan, which is PRD-grade:
**`docs/plans/2026-06-14-sprint-p7-partner-journey.md`** (REQ-F-001..007, REQ-D-001/002,
REQ-A-001/002, REQ-S-001, REQ-NF-001/002, REQ-O-001; TASK-000..017; validation strategy;
rollback; MISSING list). This PRD does not duplicate it; it links it and records the
TASK-000 baseline + the Phase-0.16 council deltas that amend it.

## TASK-000 baseline (verified 2026-06-14) — GREEN
lint/typecheck clean · vitest 514/514 (30 files) · build OK. No genuine hard-stop;
`western.ascendantLongitude` is an additive sibling field; `angles.Ascendant` real-longitude
present in fixtures; no new FuFirE endpoint needed.

## Council deltas (Phase 0.16) — amendments to the plan
**Folded in as implementation rigor on existing REQ-S-001 / REQ-D-002 (no new request):**
1. **Widen the pair-forbidden set** beyond soulmate/Schicksal/Trennung to include the
   everyday reifiers `harmonisch`, `passt zusammen`, `passt perfekt`, `kompatibel`, and
   "Reibung"-as-defect framing; **assert positive-framing** on friction texts (Critic C2).
2. **Extend the anti-claim scanner** to the Synastry component chrome, section titles, and
   the score label — not only generated strings (Critic C3). The component ESO scanner gains
   relationship terms.
3. **Fix the relabel anchors:** the live target is **"Harmonie-Wert"** (Synastry.tsx:240) +
   circle "Übereinstimmung" (line 235); the plan's "Harmonie-Resonanz"/"Resonanz" no longer
   exist (Advisor; removed in P6). The relabel targets the real strings.
4. **Server-derive `pairAxes`:** `derivePairAxes` runs **server-side** (pure fn over data
   already resolved), shipped as a `pairAxes[]` response field; the UI is a dumb renderer.
   This makes the axes e2e-assertable via the response (Advisor). `comparisonA/B` is still
   required upstream because `elementalA/B` collapse the sign.

**Resolved at the USER GATE (2026-06-14):**
- **D-SCOPE = full 4-layer journey** (user confirmed full scope; the `ungeprüft` couple-engagement
  risk is carried, not promoted).
- **D-SCORE = keep the number, visually subordinate, rename "Harmonie-Wert" → "Primus-Aspectus (PA)"**,
  add the "kein Messwert" note (REQ-F-006 label: plan's "Heuristischer Gesamteindruck" → user's final
  "Primus-Aspectus (PA)", chosen 2026-06-14). The earlier interim name "Kohärenz-Index" collided with
  the natal calibrated *Kohärenzindex*; **renaming to Primus-Aspectus RESOLVES that collision** (no
  "Kohärenz" term in the synastry path). PA = a deliberately surface "first-glance" read of the two
  main character symbols (BaZi day-master element + sun-sign element), not a calibrated metric.
- **GO = CORE** mode.

## Drifts to handle during build (TASK-000)
- BaZi VM labels are English/Pinyin/Chinese, not German — `baziCompare` maps to display
  labels; San-He/Chong keys use the actual VM animal values (verify at build).
- No `e2e` npm script — add one (`"e2e": "playwright test"`) or invoke `npx playwright test`.
- PARTNER_CHART e2e mock is currently a clone of the primary chart — TASK-016 must add
  variant planets/pillars for deterministic inter-aspect + San-He coverage.

## Acceptance & DoD
Per the plan's REQ table + §6 validation strategy + §8 MISSING list. Gates A–E + human
acceptance + live-smoke. All top-level REQs carry the six mandatory Canvas traceability
fields in `docs/traceability.md`.
