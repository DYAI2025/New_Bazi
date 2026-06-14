# Traceability Matrix — New_Bazi

**Status:** confirmed
<!-- Status: confirmed -->
**Confirmed by user:** yes — active feature `bazodiac-redesign` confirmed via "GO — build now (CORE)" (2026-06-14, Vision-GO-Gate); branch `re-design`

This file is the cross-feature traceability spine required by the PRIL context gate
(`plumbline-context-check`). The authoritative, fully-columned matrix for each feature
lives inside that feature's PRD; this file mirrors the active feature's REQ rows and
links back to the source artifacts.

---

## Active feature: `bazodiac-redesign`

- Canvas: [docs/canvas/bazodiac-redesign.canvas.md](canvas/bazodiac-redesign.canvas.md) — `Status: user-confirmed` (2026-06-14; council unanimous additive reframe)
- PRD: [docs/prd/bazodiac-redesign.prd.md](prd/bazodiac-redesign.prd.md) · Vision: [docs/vision/bazodiac-redesign.vision.md](vision/bazodiac-redesign.vision.md) — both user-confirmed
- Scope: `docs/scope/bazodiac-redesign.scope.json` · Reality: `docs/reality/bazodiac-redesign.evidence.jsonl`

**Canvas anchors (all six mandatory fields — shared by every RD REQ):**
- canvas-link: `docs/canvas/bazodiac-redesign.canvas.md`
- canvas-problem: cold-start drops a visitor into a bare form; product nature (reflective tension field, not horoscope/score) is not legible in 10s (Canvas §1)
- canvas-target-user: first-time/skeptical + returning reflective bazodiac visitor, German (Canvas §2)
- canvas-value-claim: a calm, premium, data-honest Observatorium that makes one tension legible+testable and flows into the live app (Canvas §4)
- canvas-success-signal: 10s legibility; calm ring + 1 tension + 1 question (no %); CTA into live flow; anti-reification scanner green; gates+smoke green (Canvas §5)
- canvas-risk-status: **aligned** for all REQ (council R1 additive/no-router, R2 reuse geometry, R3 demo/missing not fake, R4 anti-reification scanner, R5 reduced-motion, R6 defined tokens, R7 repos ungeprüft — all bound as implementation constraints)

| REQ | Iter | Test (real) | evidence-class | wired-in-prod? | true-line-status |
|-----|------|-------------|----------------|----------------|------------------|
| REQ-RD-F-001 FusionHero | RD-2 | polar/tensionFieldVisual unit + e2e (hero, 1 tension+question, demo, no %) | real-boundary-smoke | ja (App landing default) | aligned |
| REQ-RD-F-002 micro-experience | RD-3 | microExperience unit + e2e (start→question→react→note, demo) | real-boundary-smoke | ja | aligned |
| REQ-RD-F-003 visible-engine bento | RD-4 | engineBento unit + e2e (6 cards, no metric) | real-boundary-smoke | ja | aligned |
| REQ-RD-F-004 method/trust/boundaries | RD-5 | redesignWording unit + e2e (4 boundaries) | real-boundary-smoke | ja | aligned |
| REQ-RD-F-005 fusion-path + premium | RD-5 | e2e (fusion-path + premium-bridge); premium=explanation/history/export not truth | real-boundary-smoke | ja | aligned |
| REQ-RD-A-001 additive, no spine break | RD-2 | all 7 form-first e2e traverse landing + pass; no router; InputForm untouched | real-boundary-smoke | ja | aligned |
| REQ-RD-A-002 reuse geometry, no new engine | RD-1/2 | polar.test pins to TensionNavigator; ELEMENT_AXIS_MAP imported; static/demo, no engine call | integration | ja | aligned |
| REQ-RD-S-001 anti-reification | RD-5 | redesignWording (non-boundary + chrome) + e2e rendered-DOM scan | real-boundary-smoke | ja | aligned |
| REQ-RD-NF-001 prefers-reduced-motion | RD-1/2 | index.css @media rule + e2e emulateMedia reduced → hero renders | real-boundary-smoke | ja | aligned |
| REQ-RD-O-001 gates + PR + live-smoke | RD-6/RD-7 | full lint/test/build/playwright + PR #36 merged; **post-merge live-smoke DONE** (prod bundle md5 afc9e7ae… identical to e2e build; 7 markers present + 3 mystique strings gone; hero ring paints 5/6 nodes, outer fill-none by design; CTA→InputForm spine verified via standalone Playwright on prod: inputVisibleAfterClick=true, heroAfter=0) | **production-verified** | prod smoke green | resolved; follow-up #58: PageShell header overflows mobile-360 (pre-existing shared chrome) |

Reality note: the redesign landing is wired-in-prod-path (default `activeTab='landing'`) and is now **production-verified** (RD-7 post-merge Railway live-smoke 2026-06-14: prod-served bundle md5-identical to the e2e-tested build; FusionHero + CTA spine confirmed against the live URL). The 3 reference repos remain `ungeprüft` (unreadable) — built from the brief, no ported code.
**CONTRA-RD-001 (resolved-by-realignment, 2026-06-14):** Gate D flagged HIGH that the surviving shell
mystique ("TRANSCENDENT CLARITY"/"Luxury … Harmony Engine"/"KOSMISCHES SPEKTRUM") rendered in the default
first viewport (Vision contradiction + R4 coverage gap). Re-aligned: shell copy de-mystified +
`redesignWording.test.ts` extended to scan PageShell/InputForm (R4 now enforced, 4/4). See
`docs/contradictions/bazodiac-redesign.contradictions.md`. Gate-C "scanner flakiness" was a false alarm
(parallel-panel mutation race), not a defect. `previewFromTension` + `leanColor` remain implemented +
unit-tested as the §5.3 `computed`-mode / polar contracts but are **not yet wired** into the rendered
landing (a code-review trim was reverted to preserve the contracts for a future personalized landing).
REQ-RD-O-001 is now **production-verified** (RD-7 live-smoke).
**Live-smoke finding (RD-7):** the static `index.html` head still carried the old "Luxury Astrology" title +
`lang="en"` (a mystique surface the de-mystification missed) → fixed to a calc-not-claim title + `lang="de"`
+ anti-reification meta description. Pre-existing PageShell header overflow at mobile-360 logged as follow-up #58.

---

## Previous feature: `bazi-sprint-p7-partner-journey`

- Canvas: [docs/canvas/bazi-sprint-p7-partner-journey.canvas.md](canvas/bazi-sprint-p7-partner-journey.canvas.md) — `Status: user-confirmed` (2026-06-14; council Phase 0.16 hardening folded in)
- PRD: [docs/prd/bazi-sprint-p7-partner-journey.prd.md](prd/bazi-sprint-p7-partner-journey.prd.md) — `Status: user-confirmed` (links the plan as authoritative spec)
- Vision: [docs/vision/bazi-sprint-p7-partner-journey.vision.md](vision/bazi-sprint-p7-partner-journey.vision.md) — `Status: user-confirmed`
- Allowed change list: see `docs/scope/bazi-sprint-p7-partner-journey.scope.json` (consumed by the PRIL scope guard)

**Canvas anchors (all six mandatory fields — shared by every P7 REQ below):**
- canvas-link: `docs/canvas/bazi-sprint-p7-partner-journey.canvas.md`
- canvas-problem: synastry is an opaque two-number score with no anchored substance (Canvas §1)
- canvas-target-user: the couple-curious entertainment/reflection user (Canvas §2)
- canvas-value-claim: a data-anchored partner field — inter-aspects, pillar relations, element mirror, pair pole-axes; each anchored, each reflection not verdict (Canvas §4)
- canvas-success-signal: page read as a sequence; every interpretation visibly anchored; missing-states visible; zero anti-reification/pair-claim regex hits; live-smoke clean (Canvas §5)
- canvas-risk-status: **aligned** for all REQ (council reification risks R1–R4 mitigated by the widened scanner + per-section framing + score demotion; the interim "Kohärenz-Index" name was renamed by the user to "Primus-Aspectus (PA)" — natal-collision resolved)

| REQ | Task | Test (real) | evidence-class | wired-in-prod? | true-line-status |
|-----|------|-------------|----------------|----------------|------------------|
| REQ-F-001 inter-aspects | T2/T6 | interAspects.test.ts (18) + app.test.ts P7 fields + e2e inter-aspect-row | real-boundary-smoke (e2e via mock) | ja | aligned |
| REQ-F-002 ascendantLongitude | T1 | fufireNormalizer.realshapes.test.ts (190.046 real fixture + null legacy/provisional) | real-boundary (real captured fixture) | ja | aligned |
| REQ-F-003 pillar compare | T3/T6 | baziCompare.test.ts (35) + e2e pillar-compare-card (San-He/Chong) | real-boundary-smoke | ja | aligned |
| REQ-F-004 element mirror | T8 | e2e synastry-elements 5 rows (Gold=A/Blau=B) | real-boundary-smoke | ja | aligned |
| REQ-F-005 pair axes | T5/T6 | tensionPair.test.ts derivePairAxes (7) + app.test.ts pairAxes + e2e 5 cards/1 reibung | real-boundary-smoke | ja | aligned |
| REQ-F-006 score → Primus-Aspectus (PA) | T7 | e2e: "Primus-Aspectus" + "kein Messwert" note, old "Harmonie-Wert" gone | real-boundary-smoke | ja | aligned |
| REQ-F-007 partner journey UI | T8 | e2e: journey-header + axes/aspects/pillars/elements + next-question | real-boundary-smoke | ja | aligned |
| REQ-D-001 missing → null/[] | T6/T8 | app.test.ts (FULL_CHART → comparison/pairAxes []) + PartnerJourney empty-states | unit + real-boundary | ja | aligned |
| REQ-D-002 data anchors | T4/T9 | synastryWording.test.ts + pairAxisTexts/baziCompare anchor tests + e2e anchor lines | unit + real-boundary | ja | aligned |
| REQ-A-001 pure utils | T2–T5 | utils carry no React/IO import; code-reviewer Gate on diff | design (code-review) | n/a | aligned |
| REQ-A-002 no new engine call | T6 | app.test.ts: postChart called 2× only; route adds no external call | integration | ja | aligned |
| REQ-S-001 anti-claim | T9 | synastryWording (4) + wordingHonesty + pairAspect/pairAxis regex + e2e forbidden-copy scan | unit + real-boundary | ja | aligned |
| REQ-NF-001/002 calm/reduced-motion | T8 | no red states; CSS-only bars (no framer transforms); e2e no new console errors | review + e2e | ja | aligned |
| REQ-O-001 gates + live-smoke | T11/T12 | lint/test(598)/build/playwright(38) green + PR #35 merged (a33a3c8); prod bundle index-D6CMTeMT.js asset-verified (Primus-Aspectus + journey present, old labels absent) | real-boundary-smoke + **production-served (asset-verified)**; interactive prod render PENDING | live + asset-verified; interactive prod render pending (browser blocked) | aligned |

Reality Ledger note: every P7 feature reaches the real boundary via the e2e render against
the deterministic mock (`real-boundary-smoke`), not just unit fakes. **No REQ is
`production-verified` yet** — that upgrade happens only after the post-merge Railway deploy
live-smoke (T11). REQ-F-002 is `real-boundary` against a verbatim captured FuFirE fixture.
No new FuFirE endpoint (A-002). The two known not-yet-real items are surfaced verbatim, not
laundered: (1) live prod smoke pending; (2) e2e uses the fixture engine, so couple data under
real engine output stays `ungeprüft` until the live smoke.

Reality evidence ledger: `docs/reality/bazi-sprint-p7-partner-journey.evidence.jsonl`
(PRIL `plumbline-reality-check --min-evidence integration` passes).

Contradiction ledger: **CONTRA-P7-001** (`docs/contradictions/bazi-sprint-p7-partner-journey.contradictions.md`)
— Gate E (Watcher) BLOCK on value-line drift (per-couple verdict badges + "Übereinstimmung"
sub-label + narrow rendered-DOM scan + prescriptive advice) → **resolved-by-realignment**
(implementation-only, Vision unchanged); REQ-S-001/F-005/F-006 true-line-status =
`resolved-by-realignment`. REQ-O-001 = production-served (asset-verified) after PR #35 merge
(prod bundle index-D6CMTeMT.js carries the P7 markers); interactive prod synastry render PENDING
(browser automation blocked) — surfaced, not claimed as full production-verified.

---

## Previous feature: `bazi-sprint-p5-content-layer`

- Canvas: [docs/canvas/bazi-sprint-p5-content-layer.canvas.md](canvas/bazi-sprint-p5-content-layer.canvas.md) — `Status: user-confirmed` (v2 + BLOCKER-1 correction, re-confirmed 2026-06-13)
- PRD: [docs/prd/bazi-sprint-p5-content-layer.prd.md](prd/bazi-sprint-p5-content-layer.prd.md) — `Status: user-confirmed` (full matrix REQ-P5-001..010 with all six canvas-* fields, evidence-class, wired-in-prod?, true-line-status)
- Vision: [docs/vision/bazi-sprint-p5-content-layer.vision.md](vision/bazi-sprint-p5-content-layer.vision.md) — `Status: user-confirmed`
- Source coverage gate (T1): [docs/contracts/content-sources.md](contracts/content-sources.md) — 43 port / 12 reuse / **0 invent-from-scratch**. (Two distinct axes: the T1 *disposition* `curate`=no-source-exists=**0**; the registry `source` field is a 2-value enum {astro-noctum | curated}, so the 12 **reuse**-and-expand house entries ship `source:"curated"` — they are New_Bazi's own templates expanded, NOT invented and NOT 1:1 AN ports.)
- Allowed change list: see `docs/scope/` JSON for this feature (consumed by the PRIL scope guard)

| REQ | Task | Test (real) | evidence-class | wired-in-prod? | canvas-link | true-line-status |
|-----|------|-------------|----------------|----------------|-------------|------------------|
| REQ-P5-001 | T1 | content-sources.md struktur + `kuratiert`-Flag + Sign-off-Log (Doc-Gate) | integration-fake | n/a (Doc-Gate) | canvas §9/§10 | aligned |
| REQ-P5-002 | T2 | registry.test.ts: zodiac completeness + 60–120w + anti-reification regex + source enum | unit | ja (Registry build-time) | canvas §4 | aligned |
| REQ-P5-003 | T2 | registry.test.ts: stems(10)+branches(12) consistency vs HEAVENLY_STEMS/EARTHLY_BRANCHES | unit | ja | canvas §4 | aligned |
| REQ-P5-004 | T3 | e2e: card click → ExplanationLayer opens with real profile anchor; Esc/backdrop close | real-boundary-smoke | ja | canvas §6 | aligned |
| REQ-P5-005 | T2 | registry.test.ts: elements(5)+pillars(4) completeness + bounds | unit | ja | canvas §4 | aligned |
| REQ-P5-006 | T5 | BaZiDetail pillar deepening; branch hiddenStems render (existing realshapes.test.ts:103 proves non-empty) | unit + real-boundary | ja | canvas §4/§8 | aligned |
| REQ-P5-007 | T5 | Hidden-Stems already works (canonical EARTHLY_BRANCHES); honest empty-state only for unresolvable defaultBranch | real-boundary | ja | canvas Amendment A | aligned |
| REQ-P5-008 | T4 | WesternAstrology houses deepening; P4 timeKnown:false → note only; P1 label regression stays green | unit + e2e | ja | canvas §4 | aligned |
| REQ-P5-009 | T3 | analytics card_click/layer_open event spy (unit) + beta-smoke ≥1 open; owner = Benjamin | real-boundary-smoke (local) | event fires locally; **beta-smoke ≥1 PENDING** | canvas §4 (Amendment B) | value-risk — beta-smoke not yet run |
| REQ-P5-010 | T6 | gates all green + MISSING list; deployed 235a8d3 (RUNNING); served prod bundle asset-verified (explanation-layer/card_click/Kuratierte Einordnung/registry texts present) | **production-served (asset-verified)** + local e2e | **deployed + served in prod**; interactive prod-click smoke PENDING (Chrome remote-debugging) | canvas §5 | deployed+served+asset-verified; interactive prod-click smoke pending |

Anti-reification (NFR-01, Amendment D): every one of the 55 texts passes the literal-token
regex AND a per-text semantic sign-off (forbidden meaning, not just words). Astro-Noctum
(NFR-06, Amendment E): missing source → curate, flagged `source:"curated"` + sign-off +
Benjamin PR review. (T1 found **0 domains lacking a source** — nothing had to be invented from scratch; the 12 house entries are reuse+expand of New_Bazi's own HOUSE_TEMPLATES, flagged `source:"curated"` because the registry enum has no separate "reuse" value.)
