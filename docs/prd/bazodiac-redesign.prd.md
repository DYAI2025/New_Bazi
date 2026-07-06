<!-- Status: user-confirmed -->
<!-- Confirmed by user: yes (2026-06-14) -->

# PRD — Bazodiac Redesign (Observatorium of Tension)

**Feature slug:** `bazodiac-redesign`  ·  **Status:** user-confirmed · **Confirmed by user:** yes (2026-06-14)
**Canvas:** `docs/canvas/bazodiac-redesign.canvas.md` · **Vision:** `docs/vision/bazodiac-redesign.vision.md`

## Authoritative spec
The user-provided `/agileteam` redesign brief (2026-06-14) is the source spec: design audit, IA
(hero · micro-experience · visible-engine bento · signature/field explanation · fusion-path · premium ·
trust/ethics · CTA), component architecture (§5), data model (§5.3 `TensionPreviewState`), phases 0–7,
required tests (§7), risks (§9). This PRD records the **user decisions** and the **council deltas** that
amend it; it does not duplicate the brief.

## Baseline (verified 2026-06-14) — GREEN
598/598 unit, build OK on branch `re-design`. Single `activeTab` machine (no router); 6 @theme tokens
(gold+obsidian); live Supabase magic-link auth + zero waitlist code; `TensionNavigator` geometry reusable;
no `prefers-reduced-motion` rules; PR#14 "no framer-motion on SVG" rule in force.

## User decisions (2026-06-14)
- **Full plan** scope (all IA sections), implemented **additively**.
- **Waitlist CUT** — hero CTA → existing sign-up / InputForm flow (no new gate/backend).
- **Landing = default first screen for everyone** (landing → CTA → InputForm).

## Council deltas (Phase 0.16, all belegt) — binding implementation constraints
1. **Additive architecture, no router.** Add a `landing` state to the `App.tsx` tab machine, rendered as
   the initial screen; CTA sets `activeTab='input'`. `InputForm.onCalculate` + auth path untouched (R1).
2. **Reuse TensionNavigator geometry.** Extract `polar/curvePath/blend/axisColor/ELEMENT_AXIS_MAP/
   deriveTension/INTENSITY` to `src/utils/visual/*`; FusionHero renders a dimmed subset. **CSS/opacity/
   stroke animation only — no framer-motion on SVG** (R2, PR#14).
3. **Pre-input hero = explicit demo/MISSING state**, labelled `Demo`; no fabricated values (R3).
4. **Anti-reification gate** over all new copy + the surviving shell strings ("TRANSCENDENT CLARITY",
   "Luxury Harmony Engine", "KOSMISCHES SPEKTRUM ERRECHNEN") (R4).
5. **`prefers-reduced-motion`** is a hard gating criterion; ambient Canvas/animation disabled under it (R5).
6. **Token/motion expansion**: extend existing gold/obsidian @theme; add fusion-blue/user-cyan as defined
   semantic tokens (gold=calc/form · blue=movement/question · cyan=user-lens), separately tested (R6).
7. **Reference repos `ungeprüft`** — synthesize from the brief, never port unseen code (R7).

## Acceptance & DoD
Per the brief's acceptance criteria + §7 tests + the Canvas success signals. Gates A–E + human acceptance
+ live-smoke. Pure visual geometry is TDD-first (`src/utils/visual/*.test.ts`). All top-level REQs carry
the six Canvas traceability fields in `docs/traceability.md`. Multi-iteration build; the planner sets the
iteration count M.
