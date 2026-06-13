# Traceability Matrix — New_Bazi

**Status:** confirmed
<!-- Status: confirmed -->
**Confirmed by user:** yes — active feature confirmed via "GO" (2026-06-13, Vision-GO-Gate)

This file is the cross-feature traceability spine required by the PRIL context gate
(`plumbline-context-check`). The authoritative, fully-columned matrix for each feature
lives inside that feature's PRD; this file mirrors the active feature's REQ rows and
links back to the source artifacts.

---

## Active feature: `bazi-sprint-p5-content-layer`

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
| REQ-P5-010 | T6 | gates (lint/test/build/playwright) all green + MISSING list; live-smoke 2 open layers PENDING deploy | real-boundary-smoke (local) — **production-verified PENDING deploy** | local only; prod PENDING merge+deploy | canvas §5 | PENDING live-smoke (not yet production-verified) |

Anti-reification (NFR-01, Amendment D): every one of the 55 texts passes the literal-token
regex AND a per-text semantic sign-off (forbidden meaning, not just words). Astro-Noctum
(NFR-06, Amendment E): missing source → curate, flagged `source:"curated"` + sign-off +
Benjamin PR review. (T1 found **0 domains lacking a source** — nothing had to be invented from scratch; the 12 house entries are reuse+expand of New_Bazi's own HOUSE_TEMPLATES, flagged `source:"curated"` because the registry enum has no separate "reuse" value.)
