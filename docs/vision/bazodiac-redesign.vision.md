<!-- Status: user-confirmed -->
<!-- Confirmed by user: yes (2026-06-14) -->

# Product Vision — Bazodiac Redesign (Observatorium of Tension)

**Feature slug:** `bazodiac-redesign`  ·  **Status:** user-confirmed · **Confirmed by user:** yes (2026-06-14)
**Canvas:** `docs/canvas/bazodiac-redesign.canvas.md` · **PRD:** `docs/prd/bazodiac-redesign.prd.md`

## Vision statement
A visitor should feel, within ten seconds, that Bazodiac is a **calm, premium observatory that makes
one tension visible enough to test** — not a horoscope, not a score, not a verdict — and should be
able to step from that feeling straight into the live computed app.

## Target user
First-time, often skeptical bazodiac visitor + returning reflective user (German).

## Desired change
Replace the bare cold-start-into-form with a premium obsidian/gold/blue landing: FusionHero (stable
ring + one active tension + one question), a 90s demo micro-experience, a visible-engine bento, method
+ trust + boundaries, a fusion-path view and a premium/Deep-Mode bridge — then a CTA into the existing
sign-up/InputForm flow.

## Core value promise (must not break)
**Calm, premium, and data-honest at once.** No fate / diagnosis / therapy / healing / personality-proof
claim. No fake personalized value — pre-input visuals are explicit demo/MISSING states. The ring never
says "you are"; it says "this is one testable tension". The live entry/auth flow that P1–P7 depends on
is never broken.

## What would count as a wrong / harmful implementation
- A hero/score that reads as a horoscope, a compatibility %, or a fixed identity.
- Any fabricated personalized number on the pre-input landing.
- Re-introducing the mystique P6 stripped (fate/soul/"transcendent" essence copy) under a "premium" excuse.
- A waitlist gate that hides the working sign-up (CUT per user).
- A React-Router rewrite or any change that breaks `InputForm → activeTab='overview'`.
- framer-motion transforms on SVG ring geometry; ignoring `prefers-reduced-motion`.
- A net-new ring that desyncs from the real `deriveTension` output.

## How we know the Vision is fulfilled
Canvas §5 success signals: 10s legibility; calm ring + 1 tension + 1 question (no %); CTA into the live
flow; anti-reification scanner green; lint/test/build + Playwright smoke (hero, CTA-scroll, micro-flow,
reduced-motion, mobile) green; live-smoke clean.

## Out of scope
Canvas §7 (3D, new FuFirE endpoint, PDF/voice/quiz/space-weather, waitlist backend, router, entry-spine
replacement, medical/legal/financial flows).

## True-Line fields
- **vision-link:** this file
- **value-check-id:** VC-RD (every REQ re-pulls the line: does it make the tension legible+testable and
  flow into the live app, or does it drift toward horoscope/score/verdict/mystique theatre?)
- **true-line-status:** confirmed (2026-06-14, GO — CORE)
