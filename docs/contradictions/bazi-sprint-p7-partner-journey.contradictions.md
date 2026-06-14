# Contradiction ledger — `bazi-sprint-p7-partner-journey`

## CONTRA-P7-001 — value-line drift toward a per-couple verdict

- **Raised by:** Gate E (plumbline-watcher), corroborated by Gate D (product-owner) and Gate C
  (production-validator), 2026-06-14. Verdict: **BLOCK**.
- **Type:** value-line contradiction (Vision/Canvas wrong-implementation patterns shipped green).
- **What contradicted the Vision** ("anchored, non-judgmental meeting-field; the score never
  returns as relationship truth"; Canvas R1/R2/R3, Critic C1/C4/C5):
  1. The 5 Paar-Polachsen cards rendered binary, colour-coded **"Harmonie spürbar" / "Reibung
     sichtbar"** verdict badges (emerald-vs-gold good/bad) → read as a per-couple 5-axis scorecard.
  2. The demoted score's circle kept the **"Übereinstimmung"** (=agreement) sub-label under the
     0–100% number → undercut the "kein Messwert" promise.
  3. The only **rendered-DOM** anti-claim scan (e2e) used the OLD narrow exotic-word regex, not the
     widened C2 set → the chrome boundary was not actually covered for the widened reifiers.
  4. The pre-existing prescriptive **`advice`** ("…pflegen Sie gemeinsame Routinen", "…erfordert
     klare Grenzen") rendered directly above the "kein Messwert" note → a soft relationship verdict.

- **Resolution: re-alignment (implementation-only, Vision UNCHANGED).** Per graded escalation
  (G6): the contradiction was correctable in the increment without redefining the Vision goal, so
  the team re-aligned rather than escalating to the user:
  1. Badges → descriptive of the DATA, neutral colour: **"gegensätzliche Neigung" / "gleiche
     Neigung"** (leanA vs leanB), single calm palette; the anchored reflection text
     (Ressource/Wachstumskante) stays. (`PartnerJourney.tsx`)
  2. Circle sub-label **"Übereinstimmung" → "grober Vergleich"** (number kept but de-authoritised,
     per the user's D-SCORE decision to keep the number subordinate). (`Synastry.tsx`)
  3. e2e rendered-DOM scan **widened** to the C2 set (harmonisch/passt zusammen/kompatibel/…).
     (`tests/e2e/synastry-completion.spec.ts`)
  4. `advice` reframed to **reflective, non-prescriptive** comparison notes; label
     "Ratschlag" → "Reflexion zur Lesart". (`src/utils/synastry.ts` + test)
- **Re-verify:** tsc clean; unit 598/598; widened e2e rendered scan green; Gate E re-run after
  re-alignment. true-line-status → `resolved-by-realignment`.
- **Note:** re-alignment modified only the increment/implementation; it did NOT modify, narrow, or
  reinterpret the user-confirmed Vision goal.

## Open value-risk carried to the user (not a contradiction, surfaced not laundered)

- **"Kohärenz-Index" naming collision** with the natal calibrated *Kohärenzindex* — **RESOLVED
  2026-06-14**: the user renamed the synastry score to **"Primus-Aspectus (PA)"** after the collision
  was explained. No "Kohärenz" term remains in the synastry path; the collision is gone.
- **derivePairAxes shape divergence** from the 2026-06-11 plan Annex §5 (`leanA/B` pole-strings +
  "ausgeglichen" bucket + `magnitude` vs the plan's `"a"|"b"`): a defensible improvement, surfaced
  in the PR for user ratification.
- **REQ-O-001 production-verified:** PENDING the post-merge Railway live-smoke (T11). Carried, not
  claimed.
