# Sprint P7 — Synastrie Completion / Partner Journey (authoritative plan, as executed)

Status: executed (2026-06-14) · Branch: `feat/sprint-p7-partner-journey`
Canvas: `docs/canvas/bazi-sprint-p7-partner-journey.canvas.md` · PRD: `docs/prd/bazi-sprint-p7-partner-journey.prd.md` · Vision: `docs/vision/bazi-sprint-p7-partner-journey.vision.md`

> This file is the on-disk authoritative spec the PRD links to. It captures the goal, REQ
> table, the executed task slices, validation strategy, MISSING list, the Phase-0.16 council
> deltas, and the Gate-E re-alignment. The earlier draft `docs/plans/2026-06-11-sprint-p7-synastrie-completion.md`
> is the predecessor analysis; this 2026-06-14 file supersedes it for the shipped work.

## Goal
Extend Synastrie from an opaque two-number score to a **data-anchored partner journey**:
Western inter-aspects (A×B), BaZi pillar comparison (Sheng/Ke + San-He/Liu-He/Chong), a WuXing
element mirror, and five pair pole-axes — each statement naming its data anchor, each framed as
reflection, never a couple verdict. The score is demoted to a small heuristic. All fields are
derived from the two already-resolved profile ViewModels; **no new FuFirE endpoint**.

## Requirements
| ID | Requirement | Verification |
|----|-------------|--------------|
| REQ-F-001 | Western inter-aspects A×B | unit + server + e2e |
| REQ-F-002 | Ascendant used only with real absolute longitude, else null | unit (realshapes) |
| REQ-F-003 | BaZi pillar compare: stem Sheng/Ke + branch San-He/Liu-He/Chong | unit + e2e |
| REQ-F-004 | WuXing element mirror for both people | e2e |
| REQ-F-005 | Five pair pole-axes from signed elementalComparison | unit + e2e |
| REQ-F-006 | Score demoted to heuristic "Primus-Aspectus (PA)" + "kein Messwert" note | e2e |
| REQ-F-007 | Guided partner journey UI (sequence, not data dump) | e2e + review |
| REQ-D-001 | Missing data → null/[]/visible missing-state, never fake | unit + e2e |
| REQ-D-002 | Every interpretation names a data anchor | unit + e2e |
| REQ-A-001 | Calc logic in pure utils; UI renders derived data | code review |
| REQ-A-002 | No new FuFirE call | code review + server test |
| REQ-S-001 | No fate/diagnosis/therapy/healing/soulmate/breakup + widened everyday reifiers | regex + review |
| REQ-NF-001/002 | Calm, non-alarmist; reduced-motion safe | review + e2e |
| REQ-O-001 | PR with red/green proof, gates, live-smoke | PR checklist |

## Architecture (3 layers)
1. **Pure calc** (no React/IO): `interAspects.ts`, `baziCompare.ts`, `tensionPair.derivePairAxes`,
   `aspectInterpretation.pairAspectInterpretation`, `content/pairAxisTexts.ts`.
2. **Server aggregation**: `/api/azodiac/synastry` additively ships `interAspects`,
   `pillarComparison`, `comparisonA/B`, `pairAxes` from the two resolved ViewModels (no new call).
3. **UI/Journey**: `components/synastry/PartnerJourney.tsx` + `Synastry.tsx` (score demotion +
   header + section order), honest empty-states per layer.

## Tasks (as executed)
- T1 — `western.ascendantLongitude` (VM + normalizer, real-source-only) + `ElementalComparisonEntry` export. TDD realshapes RED→GREEN.
- T2 — `interAspects.ts` (computeInterAspects + bodyPositionsFromViewModel). 18 tests.
- T3 — `baziCompare.ts` (stem + branch relations, German labels, skip unknown). 35 tests.
- T4 — `pairAspectInterpretation` (+7) + `content/pairAxisTexts.ts` (10 texts).
- T5 — `derivePairAxes` (5 pole-axes from signed differences). +7 tests.
- T6 — server response additive fields + client `SynastryResponse` types. 2 server tests.
- T7 — score relabel "Harmonie-Wert"→"Primus-Aspectus (PA)", "Match"→"Vergleich", "kein Messwert" note.
- T8 — `PartnerJourney.tsx`: axes / inter-aspects / pillars / element-mirror + journey header + next-question.
- T9 — anti-claim scanner: `src/__tests__/synastryWording.test.ts` (widened reifiers; runtime copy + comment-stripped chrome).
- T10 — e2e: `mock-fufire.mjs` PARTNER_CHART variant pillars (San-He Jahr, Chong Tag) + `synastry-completion.spec.ts` + `e2e` npm script.
- T11 — Gates A–E + traceability + reality ledger + PR + live-smoke.

## Phase-0.16 council deltas (folded into the build)
Widen forbidden-pair regex beyond exotic words to the everyday reifiers (harmonisch/passt
zusammen/kompatibel + Reibung-as-defect); extend the scanner to the synastry chrome; fix the
relabel anchors to the real "Harmonie-Wert" string; **server-derive `pairAxes`** (single source of
truth, e2e-assertable). `comparisonA/B` shipped because `elementalA/B` collapse the sign.

## Gate-E re-alignment (CONTRA-P7-001 — see docs/contradictions/)
The Watcher caught value-line drift (per-axis "Harmonie/Reibung" verdict badges; "Übereinstimmung"
sub-label; narrow rendered-DOM scan; prescriptive `advice`). Re-aligned (implementation-only, Vision
unchanged): badges → descriptive neutral "gegensätzliche/gleiche Neigung"; sub-label → "grober
Vergleich"; e2e rendered scan widened to the C2 set; `advice` reframed reflective.

## Validation strategy
Unit: interAspects (aspect types/orbs/sort/filter), baziCompare (all triads/pairs/chong, Sheng/Ke),
derivePairAxes (harmonie/reibung/ausgeglichen/missing), pairAxisTexts (10 unique), ascendantLongitude
(real→number, missing→null), synastryWording (widened). Server: additive fields present, missing→[],
no extra engine call, backward-compat. E2E: full partner journey, ≥3 inter-aspects, 4 pillars incl
San-He+Chong, 5 element rows, 5 pair axes incl one opposite-lean, Primus-Aspectus (PA) + note, widened
forbidden-copy rendered scan. Gates A–E + human acceptance + post-merge live-smoke.

## MISSING (carried, not laundered)
Remote partner invite (P8) · partner-quiz evidence (P8) · daily/cyan lens (P9) · voice (P11) · PDF
pair report (P12) · 3D signature (P10+) · house-overlay synastry · LLM pair readings · real-world
relationship prediction. No new FuFirE endpoint used. **production-verified PENDING** the post-merge
Railway live-smoke. e2e exercises a deterministic fixture engine, so couple data under real engine
output is not yet observed (carried as `ungeprüft`).

## Open value-risks surfaced to the user (PR)
- Score name = "Primus-Aspectus (PA)" (user-chosen 2026-06-14). The interim "Kohärenz-Index"
  collided with the natal *Kohärenzindex*; the rename resolved it.
- `derivePairAxes` shape divergence from the 2026-06-11 Annex §5 (`leanA/B` pole-strings +
  "ausgeglichen" + `magnitude`) — defensible improvement, for user ratification.
