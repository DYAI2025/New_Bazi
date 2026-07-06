<!-- Status: user-confirmed -->
<!-- Confirmed by user: yes (2026-06-14) -->

# Product Canvas — Bazodiac Redesign (Observatorium of Tension)

**Feature slug:** `bazodiac-redesign`  ·  **Branch:** `re-design`
**Status:** user-confirmed  ·  **Confirmed by user:** yes (2026-06-14)
**PRD:** `docs/prd/bazodiac-redesign.prd.md` · **Vision:** `docs/vision/bazodiac-redesign.vision.md`
**Reference plan (user-provided, PRD-equivalent):** the `/agileteam` redesign brief (2026-06-14).
**Source repos (bento/waitlist/insight) + `/mnt/data/...redesign_plan.md`:** NOT accessible to the team → all design claims about them are `ungeprüft`; build from the brief's descriptions + existing New_Bazi assets, never from ported code.

---

## 1. Problem
The live New_Bazi app drops a cold visitor straight into a birth-data form with no framing. In the
first 10 seconds it does not communicate that this is a **reflective tension field, not a
horoscope/score**, and the shell still carries surviving mystique copy ("TRANSCENDENT CLARITY",
"Luxury … Harmony Engine"). There is no premium, trustworthy, legible first impression.

## 2. Target user / customer
The first-time bazodiac visitor (curious, often skeptical of horoscope apps) and the returning
reflective user — German-language.

## 3. Current workaround
Cold-start directly into `InputForm`; the user must infer the product's nature from the form itself.

## 4. Value proposition
A calm, premium, **data-honest "Observatorium"** experience that makes the product legible in 10s and
leads into the live app: a **FusionHero** (stable ring + ONE active tension + ONE question), a 90s
**micro-experience** (input→calculating→tension-question→reaction, demo if no data), a **visible-engine
bento** (Compute/Map/Interpret/Reflect/Deepen/Protect), **method + trust + boundaries**, a
**Fusion-Path** retention view, and a **premium/Deep-Mode** bridge — with NO fate claims, NO fake
values, and NO waitlist gate (CTA flows into the existing sign-up).

## 5. Success signal
First 10s: user understands "kein Horoskop/Score — ein Spannungsfeld". Hero shows a calm ring + 1
active tension + 1 question (no %/score). CTA "Zeige meine erste Spannung" flows into the live
InputForm/magic-link flow. All new copy passes the anti-reification scanner. `lint && test && build`
green; Playwright smoke (hero, CTA-scroll, micro-flow, reduced-motion, mobile) green; live-smoke clean.

## 6. Core use case
Visitor lands → FusionHero (illustrative **demo** tension, clearly labelled) → reads "Dein Chart ist
kein Urteil, es ist ein Spannungsfeld" → optionally runs the 90s micro-experience (demo) → scrolls
bento / method / trust / fusion-path / premium → clicks **"Zeige meine erste Spannung"** → enters the
existing InputForm → real computed profile (the untouched P1–P7 flow).

## 7. Non-goals (hard)
3D/Three.js · new FuFirE endpoint · PDF / voice-agent / quiz / space-weather build · **waitlist
backend (CUT per user 2026-06-14)** · medical/therapeutic/legal/financial flows · **React Router**
(use an additive `landing` activeTab instead) · **replacing or breaking the `InputForm → setBirthData →
activeTab='overview'` entry/auth spine that all of P1–P7 depends on**.

## 8. Risks / contradictions (council Phase 0.16, all belegt vs the codebase)
- **R1 entry-spine regression (legitimate-blocker).** `App.tsx` is one tab-state machine; the
  InputForm→profile spine carries all of P1–P7. → MITIGATION: landing is an **additive `activeTab`
  rendered BEFORE input**; `InputForm.onCalculate` and the auth path are NOT touched; no router.
- **R2 rebuild-vs-reuse the ring (legitimate-blocker).** `TensionNavigator` already owns
  `polar/curvePath/blend/axisColor/ELEMENT_AXIS_MAP/deriveTension/INTENSITY` + the 5-axis ring. →
  MITIGATION: extract these to `src/utils/visual/*` and **reuse**; FusionHero renders a dimmed subset.
  **Hard rule (PR #14): KEINE framer-motion-Transforms auf SVG** — CSS/opacity/stroke only.
- **R3 fake pre-input values.** The landing hero has no viewModel. → MITIGATION: explicit
  **demo / MISSING state**, visibly labelled `Demo`; never fabricated personalized numbers.
- **R4 anti-reification regression.** "Premium observatory" framing risks re-introducing the mystique
  P6 stripped (surviving "TRANSCENDENT CLARITY"/"Luxury Harmony Engine"). → MITIGATION: run + extend
  the wording scanner over all new landing copy AND the surviving shell strings.
- **R5 prefers-reduced-motion absent.** No such rule exists today; it is a HARD goal req for the
  animated micro-experience + Canvas particles. → MITIGATION: ship it as a gating criterion.
- **R6 token/motion expansion is large; blue/cyan have no provenance** (`ungeprüft`, inferred from
  unreadable repos). → MITIGATION: introduce gold/obsidian by extending the existing 6 @theme tokens;
  add fusion-blue/user-cyan as clearly-defined semantic tokens (gold=calc/form, blue=movement/question,
  cyan=user-lens), separately tested.
- **R7 source repos unreadable** → every structural/visual claim from bento/waitlist/insight is
  `ungeprüft`; synthesize from the brief, do not port.

## 9. Evidence needed / verified (baseline 2026-06-14)
- **belegt:** baseline green (598/598 unit, build OK) on `re-design`; only 6 @theme tokens (gold+obsidian);
  no router (single `activeTab` machine); live Supabase magic-link auth + zero waitlist code;
  `TensionNavigator` geometry reusable; no `prefers-reduced-motion` rules yet; PR#14 no-SVG-transform rule.
- **ungeprüft:** the three reference repos' design; new blue/cyan semantics.

## 10. Allowed change scope

Fail-closed (Phase 0.6). Bullet list = machine-parsed scope (mirrored in `docs/scope/bazodiac-redesign.scope.json`).

- src/index.css
- src/styles/
- src/components/design/
- src/components/landing/
- src/utils/visual/
- src/App.tsx
- index.html
- src/components/PageShell.tsx
- src/components/InputForm.tsx
- src/components/wordingHonesty.test.ts
- src/__tests__/
- tests/e2e/
- package.json
- docs/

## 11. Traceability
All top-level REQs trace here via the six mandatory canvas fields in `docs/traceability.md` (Phase 1).

## User decisions (2026-06-14)
- **D-SCOPE = Full plan** (hero + micro-experience + bento + method/trust + fusion-path + premium bridge),
  implemented on the **additive** architecture above (landing `activeTab`, no router, reused geometry).
- **D-WAITLIST = CUT** → hero CTA leads into the existing sign-up / InputForm flow (no new gate/backend).
- **D-LANDING = default first screen for everyone** (landing → CTA → InputForm).
