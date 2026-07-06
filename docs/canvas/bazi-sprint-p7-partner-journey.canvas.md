<!-- Status: user-confirmed -->
<!-- Confirmed by user: yes (2026-06-14) -->

# Product Canvas — Sprint P7: Synastrie Completion / Partner Journey

**Feature slug:** `bazi-sprint-p7-partner-journey`
**Status:** user-confirmed  ·  **Confirmed by user:** yes (2026-06-14)
**User decisions (2026-06-14):** D-SCOPE = full 4-layer journey · D-SCORE = keep number, subordinate, rename "Harmonie-Wert" → "Primus-Aspectus (PA)" + "kein Messwert" note (user-chosen 2026-06-14 after the natal-"Kohärenzindex" collision was explained; PA avoids the collision) · GO CORE.
**PRD:** `docs/prd/bazi-sprint-p7-partner-journey.prd.md`
**Vision:** `docs/vision/bazi-sprint-p7-partner-journey.vision.md`
**Reference plan (PRD-equivalent):** `docs/plans/2026-06-14-sprint-p7-partner-journey.md`

> Allowed status values: `draft` | `user-confirmed` | `blocked`. No agent may self-confirm.

---

## 1. Problem
The current Synastrie is a two-input toy: it averages two hardcoded numbers — a BaZi
day-master relation and a sun-sign element bucket (`src/utils/synastry.ts:47-68`,
**belegt**) — into one "Harmonie-Wert". A user comparing themselves with a partner gets a
single opaque score and almost no readable, anchored substance. The score *looks* like a
verdict on the relationship while resting on almost no data.

## 2. Target user / customer
The couple-curious **entertainment/reflection** user of Bazodiac who has already generated
their own profile and now wants to look at a relationship through the same West-astrology ×
BaZi lens — for self-reflection and conversation, **not** as relationship advice or a
compatibility verdict.

## 3. Current workaround
Users read the single score + the existing pair `TensionNavigator` arc and infer the rest
themselves; the underlying inter-aspects, pillar relations and element balance are computed
nowhere and shown nowhere.

## 4. Value proposition
Turn the opaque score into a **data-anchored partner field**: Western inter-aspects,
BaZi pillar relations (Sheng/Ke · San-He/Liu-He/Chong), a WuXing element mirror, and five
pair pole-axes — each statement naming the concrete data it came from, each framed as
reflection, never as a judgment about whether the relationship "works".

## 5. Success signal
Users open the partner sections and read past the score (the page is read as a sequence,
not a verdict); every rendered interpretation carries a visible data anchor; missing data
shows a visible missing-state, never a fake value; **zero** anti-reification / pair-claim
regex hits across generated text **and** UI chrome; live-smoke renders with no new console
errors.

## 6. Core use case
User generates their profile → enters a partner's birth data → sees the heuristic overall
impression (clearly demoted), then the pair TensionNavigator, the five Paar-Polachsen, the
top Western inter-aspects, the four BaZi pillar comparisons, and the five-element mirror —
each anchored, each non-judgmental.

## 7. Non-goals (P8–P12, must not be pulled forward)
Remote partner invite · partner-quiz evidence / ContributionEvents · daily/cyan lens · Eve/Levi
voice guidance · PDF pair report · 3D / Three.js signature · LLM-generated pair readings ·
any new FuFirE endpoint.

## 8. Risks / contradictions
- **R1 (Critic, belegt) — reification by framing.** The unit of interpretation is the
  couple, so users read every axis/aspect card as a verdict "about us". Mitigation:
  per-section framing (not only a page-level disclaimer), and the score demotion (decision
  D-SCORE below).
- **R2 (Critic, belegt) — under-enforced safety regex.** A pair-forbidden list that bans
  soulmate/Schicksal/Trennung but not `harmonisch / passt zusammen / kompatibel` or
  "Reibung"-as-defect does not enforce the positive-framing rule it relies on.
  Mitigation: widen the forbidden set + assert positive-framing.
- **R3 (Critic, belegt) — scanner blind spots.** Anti-claim tests that scan only generated
  strings miss UI chrome, section titles ("Synastrie (Beziehungsvergleich)") and the
  "Harmonie-Wert" label. Mitigation: extend the scanner to the Synastry component chrome +
  pair-text sources.
- **R4 (Critic, belegt) — score contradiction.** Keeping a 0–100 number and the word
  "Harmonie" while labelling it "kein Messwert" is self-contradictory. → user decision
  D-SCORE.
- **R5 (Challenger, ungeprüft) — unproven engagement.** That couple-users want a 5-section
  journey vs a single shareable verdict is unvalidated (same class as P5). Carried as an
  explicit `ungeprüft`; not self-promoted to a fact. → user decision D-SCOPE.
- **R6 (drift) — stale relabel anchors & VM label language** (see §9 evidence): plan
  referenced strings that no longer exist; pillars carry English/Pinyin, not German.

## 9. Evidence needed / verified (TASK-000 + council, 2026-06-14)
- **belegt:** `angles.Ascendant` is a real absolute longitude in fixtures (190.046°);
  `fusion.elementalComparison = {element,western,bazi,difference}` carries the signed
  difference; `elementalA/B` already shipped collapse the sign; both full ViewModels are
  resolved server-side (`Promise.all`); `ELEMENT_AXIS_MAP`, `selectQuestion`,
  `PLANET_KEYWORDS_DE` exist; score label is "Harmonie-Wert" (line 240); pillars are
  English/Pinyin/Chinese, not German; `@playwright/test` installed, no `e2e` npm script.
- **NOT a hard-stop:** `western.ascendantLongitude` is a clean additive sibling field; the
  data exists — buildable.
- **ungeprüft:** real couple-user engagement with a multi-section partner journey; live
  copy staying in-contract under real engine data (only unit gates exist).

## 10. Allowed change scope

Fail-closed (Phase 0.6). Bullet list below is the machine-parsed scope (also mirrored in
`docs/scope/bazi-sprint-p7-partner-journey.scope.json`).

- src/utils/interAspects.ts
- src/utils/interAspects.test.ts
- src/utils/baziCompare.ts
- src/utils/baziCompare.test.ts
- src/utils/tensionPair.ts
- src/utils/tensionPair.test.ts
- src/utils/aspectInterpretation.ts
- src/utils/aspectInterpretation.test.ts
- src/utils/synastry.ts
- src/utils/synastry.test.ts
- src/utils/fufireNormalizer.ts
- src/utils/fufireNormalizer.realshapes.test.ts
- src/content/pairAxisTexts.ts
- src/content/pairAxisTexts.test.ts
- src/viewmodels/profileViewModel.ts
- src/server/app.ts
- src/server/app.test.ts
- src/api/bazodiacClient.ts
- src/components/Synastry.tsx
- src/components/synastry/
- src/components/wordingHonesty.test.ts
- src/__tests__/synastryWording.test.ts
- tests/e2e/mock-fufire.mjs
- tests/e2e/synastry-completion.spec.ts
- package.json
- docs/

## 11. Traceability links
All top-level REQs trace to this canvas via `canvas-link`, `canvas-problem`,
`canvas-target-user`, `canvas-value-claim`, `canvas-success-signal`, `canvas-risk-status`
in `docs/traceability.md` (built in Phase 1 after GO).
