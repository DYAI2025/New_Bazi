<!-- Status: user-confirmed -->
<!-- Confirmed by user: yes (2026-06-14) -->

# Product Vision — Sprint P7: Synastrie Completion / Partner Journey

**Feature slug:** `bazi-sprint-p7-partner-journey`
**Status:** user-confirmed  ·  **Confirmed by user:** yes (2026-06-14)
**Canvas:** `docs/canvas/bazi-sprint-p7-partner-journey.canvas.md`
**PRD:** `docs/prd/bazi-sprint-p7-partner-journey.prd.md`

---

## Vision statement
A user looking at a relationship through Bazodiac should come away with a **readable,
honestly-anchored picture of a meeting field** — what resonates, where there is friction,
and which question that opens — and should *never* come away believing the app rendered a
verdict on whether the relationship is good, fated, or doomed.

## Target user
The couple-curious entertainment/reflection user (Canvas §2).

## Problem (Canvas §1)
The current synastry is one opaque score over two hardcoded numbers; it looks like a
verdict and offers no anchored substance.

## Desired change
Replace the opaque score's dominance with a sequence of data-anchored layers
(inter-aspects · pillar relations · element mirror · pair pole-axes), each citing its source
data, each framed as reflection.

## Core value promise (must not break)
**Every statement is anchored and non-judgmental.** No fate, diagnosis, therapy, healing,
soulmate, or breakup claim. No fake/placeholder value — missing data is shown as missing.
The score never returns as relationship truth.

## What would count as a wrong / harmful implementation
- A section that reads as "you two are compatible / incompatible / harmonisch / passt
  zusammen" — i.e. a per-couple verdict, even implicitly via the 5 pole-axes.
- A safety regex that bans only exotic words (soulmate/Schicksal) while everyday reifiers
  (`harmonisch`, `passt zusammen`, `kompatibel`, "Reibung" as a defect) pass.
- Anti-claim tests that pass because they only scan generated strings, while the UI chrome,
  section titles, or the score label still carry the forbidden framing.
- A demoted score that still shows a 0–100 number labelled "Harmonie" — a labelled-fuzzy
  number is still anchored as a number (Critic C5).
- Any fabricated default where data is missing; any new FuFirE endpoint.

## How we know the Vision is fulfilled
Canvas §5 success signals: page read as a sequence; every interpretation visibly anchored;
missing-states visible; zero anti-reification/pair-claim regex hits across generated text
**and** chrome; live-smoke clean.

## Out of scope
Canvas §7 (all P8–P12 items + new FuFirE endpoints).

## True-Line fields
- **vision-link:** this file
- **value-check-id:** VC-P7 (every REQ re-pulls the line: does it serve the anchored,
  non-judgmental meeting-field value, or does it drift toward a couple-verdict?)
- **true-line-status:** confirmed (2026-06-14)
