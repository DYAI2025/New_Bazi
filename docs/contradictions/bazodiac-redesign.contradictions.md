# Contradiction ledger — `bazodiac-redesign`

## CONTRA-RD-001 — surviving shell mystique in the default first viewport

- **Raised by:** Gate D (product-owner) HIGH, corroborated by Gate C (R4 coverage gap) and
  Gate E (low), 2026-06-14.
- **Type:** value-line contradiction (Vision wrong-implementation pattern reachable by default).
- **What contradicted the Vision** ("first 10s = kein Horoskop, kein Score, kein Urteil"; council R4):
  once the FusionHero landing became the **default first screen**, the app shell that frames it
  still carried mystique copy in the first viewport — `PageShell` header "Luxury Western & Chinese
  Astrology Harmony Engine" + footer "DESIGNED FOR TRANSCENDENT CLARITY", and `InputForm`'s
  "KOSMISCHES SPEKTRUM ERRECHNEN" / "PLANETENGRID WIRD SYNCHRONISIERT". The council R4 had explicitly
  required the anti-reification scan to cover these surviving shell strings; the initial RD-5
  scanner covered only `src/components/landing/*.tsx`, so they passed green — and the traceability
  note classified them "not blocking / light cleanup", a soft laundering of an R4 requirement.
- **Resolution: re-alignment (implementation-only, Vision UNCHANGED).**
  1. Shell copy de-mystified (P6-consistent): "Luxury … Harmony Engine" → "Westliche Astrologie ×
     BaZi × WuXing"; "DESIGNED FOR TRANSCENDENT CLARITY" → "BERECHNET · NICHT BEHAUPTET";
     "KOSMISCHES SPEKTRUM ERRECHNEN" → "PROFIL BERECHNEN"; "PLANETENGRID WIRD SYNCHRONISIERT…" →
     "PROFIL WIRD BERECHNET…". (`PageShell.tsx`, `InputForm.tsx` — in scope.)
  2. `redesignWording.test.ts` **extended** to scan `PageShell.tsx` + `InputForm.tsx` (comment-stripped)
     for a shell-mystique regex (transcendent/luxury/harmony engine/kosmisches spektrum/planetengrid/
     metaphysisch/seele/wahres ich/schicksal) → R4 now genuinely enforced (4/4 green).
- **Re-verify:** mystique grep clean; redesignWording 4/4; tsc clean; full e2e re-run (button is
  clicked by `#submit-calculate-btn` id, not text — no spec breakage). true-line-status →
  `resolved-by-realignment`.

## Notes (surfaced, not laundered)

- **Gate C "scanner flakiness" was a FALSE ALARM**, not a real defect: the cold-run "Du bist in
  FusionPathSection idx 614" was the **code-reviewer agent's M3 mutation** (it injected "Du bist"
  to prove the scanner bites, then reverted) racing Gate C's read in the **parallel** panel. On the
  clean tree the scanner is deterministic — verified green 3/3 twice, then 4/4 after the shell extension.
  "du bist" exists only in `engineBento.test.ts` (a `.test.ts`, which the scanner does not read).
- **`previewFromTension` + `leanColor` TRIMMED** (code-review /code-review-excellence): both were
  exported + unit-tested but unused on the demo-only landing → removed (YAGNI) to kill the
  "looks-done-isn't" surface. The `computed` mode stays only as a TYPE for a future returning-user
  personalized landing; git history preserves the mapper for re-add.
- **SVG colors hardened** (code-review important): FusionHero migrated from `fill="var(--…)"`
  presentation attributes to Tailwind `fill-*`/`stroke-*` classes (CSS `fill: var()` — reliably
  supported); secondary axes now rendered distinctly. Removes the green-while-paint-absent risk
  (still confirmed visually in the post-merge live-smoke).
- **Geometry is a pinned duplicate, not a true extraction** (council R2 wording, Gate C/E low):
  `polar.ts` re-houses TensionNavigator's geometry **byte-identical** + `polar.test.ts` pins it; the
  shipped `TensionNavigator.tsx` (out of the redesign scope) keeps its own copy. Deliberate (avoid
  editing a shipped P1–P7 component); drift is guarded by the pin test + the tension-navigator e2e.
- **REQ-RD-O-001 production-verified DONE** (RD-7 post-merge Railway live-smoke, 2026-06-14): prod-served
  bundle md5-identical to the e2e build; FusionHero renders + CTA→InputForm spine confirmed via standalone
  Playwright against the live URL. Live-smoke also caught the static `index.html` head still carrying the
  old "Luxury Astrology" title + `lang="en"` (a mystique surface the React-copy scanners never read) → fixed
  (de-mystified title/`lang="de"`/meta) and now permanently guarded by a `redesignWording.test.ts` head scan.
