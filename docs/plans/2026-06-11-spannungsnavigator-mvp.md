# Spannungsnavigator MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Aus dem kalibrierten Fusionsfeld (elemental_comparison + calibration) werden Spannungsachsen mit Leitfragen abgeleitet und als Ring-Visualisierung mit Nutzerreaktionen gerendert — natal, täglich variierend (Fragen-Rotation) und im Synastrie-Paar-Modus.

**Architecture:** Drei Schichten, strikt getrennt (Konzept-Regel 9): (1) Ableitungs-Engine `tensionNavigator.ts` — pure Funktionen von VM-Daten zu `TensionState` (aktiver Pol, Polneigung, Nebenachsen, Signalstufe). (2) Content-Schicht `tensionQuestions.ts` — 45 kuratierte Fragen (5 Pole × 3 Stufen × 3), deterministisch tages-rotiert. (3) Render-Schicht `TensionNavigator.tsx` — SVG-Ring nach Testtool-Geometrie, CSS-Transforms (NICHT framer-motion auf SVG-Transforms — Lehre aus PR #14), Reaktions-Loop verändert das Feld. Paar-Modus nutzt dieselbe Ableitung auf |w_A − w_B|.

**Tech Stack:** React + Vite + TypeScript, reines SVG + CSS, vitest, Playwright + e2e-Mock. Datenquelle: bestehendes `FusionData`-VM (`coherenceCalibrated`, `signalLevel`, `elementalComparison[{element, western, bazi, difference}]`) — kein neuer Engine-Call für den Natal-Modus.

**Bindende Regeln** (aus `1_grundregeln_des_outputs…md` + `ziel_der_visualisierung…md`, beide nach `docs/concept/` kopieren — Task 0):
- Output beginnt nie mit Festlegung; die FRAGE ist der Output, nicht der Wert.
- Keine Prozente/Scores im Visual. Intensität nur sprachlich: leise / spürbar / dominant.
- Jede Karte trägt „Modellergebnis, keine Eigenschaft."
- Vier Reaktionen: Trifft / Teilweise / Widerstand / Passt nicht — mit unterschiedlichem Systemverhalten.
- Farben: Gold=Form/Klarheit/West-Überschuss, Blau=Fluss/Tiefe/BaZi-Überschuss. Nie gut/schlecht.

**Scope-Entscheidungen (mit Benjamin am 2026-06-11 FINAL entschieden):**
1. Pol-Zuordnung (Tabelle Task 1): BESTÄTIGT.
2. Echter Tages-Achsen-Shift: GEWOLLT → Engine-Feature-Issue wird in Task 8b formal angelegt (`daily_elemental_comparison`); MVP rotiert bis dahin nur die Frage (ehrliches MISSING).
3. **Navigator ERSETZT FusionDetail** (kein eigener Tab): Der „Fusion"-Tab rendert den Navigator; die bisherige technische Ansicht (kalibrierter Index + Band, Element-Doppelbalken, Engine-Deutungstext) wandert VOLLSTÄNDIG in den aufklappbaren „Herkunft"-Layer des Navigators (Konzept §12: Premium-Layer klappt in Herkunft auf, nicht in Mystik). FusionDetail.tsx wird danach gelöscht.
4. Quiz-Integration: SEPARATER Sprint (N3, Astro-Noctum) — hier nur der Integrations-Contract im Annex.
5. Keine Reaktions-Persistenz im MVP (Journal = Plus-Feature).
6. Paar-Modus voll im Scope; zweiter Engine-Roundtrip pro Partner ist ok (eigene API).
- Paar-Modus-Visual: 1 Ring mit zweifarbigen Knoten + Brücken (2 verschränkte Ringe = Folge-Iteration), 5 Paar-Fragen (Stufe „spürbar").
- Kein Free/Plus-Gating, kein Bild-Export im MVP. Share = Text-Snippet (Konzept-Regel 6).

---

## Workspace-Hinweis (vor Task 0)

Das lokale Repo hat eine verwaiste Branch-Tracking-Config. Immer so starten:
```bash
cd /Users/benjaminpoersch/Projects/New_Bazi
git checkout main && git fetch origin && git reset --hard origin/main
git checkout -b feat/spannungsnavigator-mvp
```
Gates-Baseline: `npm test` → 190 passed, `npx playwright test` → 10 passed, `npm run lint`, `npm run build` — alle grün. Baseline VOR Task 1 laufen lassen und Zahlen notieren.

### Task 0: Konzept-Dokumente ins Repo

**Files:**
- Create: `docs/concept/spannungsnavigator-grundregeln.md` (Kopie von `/Users/benjaminpoersch/Downloads/FlashDocs/md/1_grundregeln_des_outputs_der_output_darf_niemals.md`)
- Create: `docs/concept/spannungsnavigator-visualisierung.md` (Kopie von `/Users/benjaminpoersch/Downloads/FlashDocs/md/ziel_der_visualisierung_die_spannungsnavigator_sig (1).md`)
- Create: `docs/concept/spannungsnavigator-testtool.html` (Kopie von `/Users/benjaminpoersch/Downloads/bazodiac_spannungsnavigator_testtool_refined (1).html` — Geometrie-Referenz)

**Step 1:** Kopieren, committen: `docs: Spannungsnavigator-Konzept + Testtool-Referenz ins Repo`

---

### Task 1: Ableitungs-Engine `tensionNavigator.ts` (TDD)

**Files:**
- Create: `src/utils/tensionNavigator.ts`
- Test: `src/utils/tensionNavigator.test.ts`

**Step 1: Failing Tests.** Ground truth ist die Fixture `src/__fixtures__/fufire/fusion.json` über den bestehenden Normalizer (`normalizeFusion` bzw. der Weg, den `fufireNormalizer.realshapes.test.ts` nutzt — dort abschauen). Bekannte Fixture-Werte: elementalComparison enthält Metall mit difference ≈ −0.299 (größte |Differenz|, BaZi-Überschuss) und Holz ≈ +0.222 (zweitgrößte, West-Überschuss); signalLevel „spuerbar" (z≈1.015).

```ts
import { describe, it, expect } from "vitest";
import { deriveTension, ELEMENT_AXIS_MAP, type TensionState } from "./tensionNavigator";

// Minimal-Inputs in VM-Form (FusionData.elementalComparison + signalLevel)
const comparison = [
  { element: "Holz",   western: 0.355, bazi: 0.133, difference: 0.222 },
  { element: "Feuer",  western: 0.21,  bazi: 0.15,  difference: 0.06 },
  { element: "Erde",   western: 0.14,  bazi: 0.18,  difference: -0.04 },
  { element: "Metall", western: 0.131, bazi: 0.43,  difference: -0.299 },
  { element: "Wasser", western: 0.164, bazi: 0.107, difference: 0.057 },
];

describe("ELEMENT_AXIS_MAP", () => {
  it("bildet alle 5 Elemente auf die 5 Konzept-Pole ab", () => {
    expect(ELEMENT_AXIS_MAP["Metall"].id).toBe("structure_flow");
    expect(ELEMENT_AXIS_MAP["Wasser"].id).toBe("inner_outer");
    expect(ELEMENT_AXIS_MAP["Erde"].id).toBe("security_freedom");
    expect(ELEMENT_AXIS_MAP["Feuer"].id).toBe("action_being");
    expect(ELEMENT_AXIS_MAP["Holz"].id).toBe("tradition_innovation");
  });
});

describe("deriveTension", () => {
  it("wählt die Achse mit größter |Differenz| als aktiv (Fixture: Metall → Struktur↔Fluss)", () => {
    const t = deriveTension(comparison, "spuerbar");
    expect(t.activeAxis.id).toBe("structure_flow");
    expect(t.signalLevel).toBe("spuerbar");
  });

  it("Polneigung: negative Differenz (BaZi-Überschuss) → Blau-Pol (poleB), positive → Gold-Pol (poleA)", () => {
    const t = deriveTension(comparison, "spuerbar");
    expect(t.activeLean).toBe("b"); // Metall-Differenz negativ → Fluss/Blau
    expect(t.axes.find(a => a.id === "tradition_innovation")!.lean).toBe("a"); // Holz positiv → Tradition? NEIN — siehe Polaritäts-Konvention unten
  });

  it("liefert genau 2 Nebenachsen nach |Differenz|-Rang (Fixture: Holz, dann Feuer)", () => {
    const t = deriveTension(comparison, "spuerbar");
    expect(t.secondaries.map(s => s.id)).toEqual(["tradition_innovation", "action_being"]);
  });

  it("ist degradationssicher: leere comparison → null", () => {
    expect(deriveTension([], "leise")).toBeNull();
    expect(deriveTension([], null)).toBeNull();
  });

  it("normiert Achsen-Stärken auf [0,1] relativ zur größten Differenz", () => {
    const t = deriveTension(comparison, "dominant")!;
    const main = t.axes.find(a => a.id === "structure_flow")!;
    expect(main.strength).toBeCloseTo(1, 5);
    const erde = t.axes.find(a => a.id === "security_freedom")!;
    expect(erde.strength).toBeCloseTo(0.04 / 0.299, 3);
  });
});
```

**WICHTIG — Polaritäts-Konvention (im Code als Kommentar dokumentieren):** `difference = western − bazi`. **Positiv (West-Überschuss) → Gold → Pol A** des Paares; **negativ (BaZi-Überschuss) → Blau → Pol B**. Die Pol-Reihenfolge je Achse ist deshalb semantisch festgelegt: A ist der „Form/West"-nähere Pol: Struktur(A)↔Fluss(B), Außen(A)↔Innen(B), Sicherheit(A)↔Freiheit(B)?? — NEIN: Die A/B-Zuordnung ist eine DESIGN-Entscheidung pro Achse und muss zur Elementqualität passen:

| Element | Achse (id) | Pol A (Gold, West-Überschuss) | Pol B (Blau, BaZi-Überschuss) | Begründung |
|---|---|---|---|---|
| Metall | structure_flow | Struktur | Fluss | Metall=Form; viel West-Metall → Form-Betonung |
| Wasser | inner_outer | Außen | Innen | Wasser=Tiefe/Rückzug; BaZi-Wasser-Überschuss → Innen-Zug |
| Erde | security_freedom | Sicherheit | Freiheit | Erde=Halt; West-Erde-Überschuss → Sicherungs-Betonung |
| Feuer | action_being | Handeln | Sein | Feuer=Impuls; West-Feuer-Überschuss → Handlungs-Betonung |
| Holz | tradition_innovation | Innovation | Tradition | Holz=Wachstum/Erneuerung; West-Holz-Überschuss → Erneuerungs-Zug |

(Der zweite Test oben muss zu DIESER Tabelle passen: Holz difference +0.222 → lean "a" = Innovation-Neigung. Test entsprechend formulieren, nicht raten.)

**Step 2: Run → FAIL** (`npx vitest run src/utils/tensionNavigator.test.ts`).

**Step 3: Implementierung** — `src/utils/tensionNavigator.ts`:

```ts
import type { SignalLevel } from "../viewmodels/profileViewModel";

export interface TensionAxis {
  id: "structure_flow" | "inner_outer" | "security_freedom" | "action_being" | "tradition_innovation";
  element: "Metall" | "Wasser" | "Erde" | "Feuer" | "Holz";
  poleA: string; // Gold-Pol — aktiviert bei West-Überschuss (difference > 0)
  poleB: string; // Blau-Pol — aktiviert bei BaZi-Überschuss (difference < 0)
  angle: number; // feste Ringposition (Grad, 0 = oben)
}

export interface TensionAxisState extends TensionAxis {
  /** |difference| normiert auf [0,1] relativ zur größten Differenz */
  strength: number;
  /** "a" = Gold/West-Überschuss, "b" = Blau/BaZi-Überschuss */
  lean: "a" | "b";
  difference: number;
}

export interface TensionState {
  activeAxis: TensionAxisState;
  activeLean: "a" | "b";
  secondaries: TensionAxisState[]; // genau 2, Rang 2+3 nach |difference|
  axes: TensionAxisState[];        // alle 5, Ring-Reihenfolge
  signalLevel: SignalLevel;        // Sichtbarkeit des Musters (aus Kalibrierung) — NICHT Spannungsqualität
}

/**
 * Element → Spannungsachse. Die Differenz (western − bazi) des Elements IST die
 * Spannung: Sie misst, wo West- und BaZi-System im Fusionsfeld am stärksten
 * auseinanderliegen. Polaritäts-Konvention: positiv → Pol A (Gold), negativ →
 * Pol B (Blau). Konzept: docs/concept/spannungsnavigator-grundregeln.md.
 */
export const ELEMENT_AXIS_MAP: Record<string, TensionAxis> = {
  Metall: { id: "structure_flow",       element: "Metall", poleA: "Struktur",  poleB: "Fluss",     angle: 0 },
  Wasser: { id: "inner_outer",          element: "Wasser", poleA: "Außen",     poleB: "Innen",     angle: 72 },
  Erde:   { id: "security_freedom",     element: "Erde",   poleA: "Sicherheit", poleB: "Freiheit", angle: 144 },
  Feuer:  { id: "action_being",         element: "Feuer",  poleA: "Handeln",   poleB: "Sein",      angle: 216 },
  Holz:   { id: "tradition_innovation", element: "Holz",   poleA: "Innovation", poleB: "Tradition", angle: 288 },
};

export function deriveTension(
  comparison: { element: string; western: number; bazi: number; difference: number }[],
  signalLevel: SignalLevel | null,
): TensionState | null {
  if (!comparison?.length || !signalLevel) return null;
  const mapped = comparison
    .map((c) => {
      const axis = ELEMENT_AXIS_MAP[c.element];
      if (!axis || !Number.isFinite(c.difference)) return null;
      return { axis, difference: c.difference };
    })
    .filter((x): x is { axis: TensionAxis; difference: number } => x !== null);
  if (mapped.length < 2) return null; // ohne mind. 2 Achsen keine sinnvolle Rangordnung

  const maxAbs = Math.max(...mapped.map((m) => Math.abs(m.difference)));
  if (maxAbs === 0) return null; // degeneriert: keine Differenz, keine Spannung

  const states: TensionAxisState[] = mapped
    .map((m) => ({
      ...m.axis,
      difference: m.difference,
      strength: Math.abs(m.difference) / maxAbs,
      lean: (m.difference >= 0 ? "a" : "b") as "a" | "b",
    }))
    .sort((x, y) => x.angle - y.angle);

  const byStrength = [...states].sort((x, y) => Math.abs(y.difference) - Math.abs(x.difference));
  return {
    activeAxis: byStrength[0],
    activeLean: byStrength[0].lean,
    secondaries: byStrength.slice(1, 3),
    axes: states,
    signalLevel,
  };
}
```

**Step 4: Run → PASS**, lint. **Step 5: Commit** `feat: Spannungsachsen-Ableitung aus elemental_comparison (Element→Pol-Mapping)`

---

### Task 2: Fragen-Bibliothek + deterministische Tagesrotation (TDD)

**Files:**
- Create: `src/content/tensionQuestions.ts`
- Test: `src/content/tensionQuestions.test.ts`

**Step 1: Failing Tests:**

```ts
import { describe, it, expect } from "vitest";
import { TENSION_QUESTIONS, selectQuestion, PAIR_QUESTIONS } from "./tensionQuestions";

const AXES = ["structure_flow", "inner_outer", "security_freedom", "action_being", "tradition_innovation"] as const;
const LEVELS = ["leise", "spuerbar", "dominant"] as const;

describe("TENSION_QUESTIONS", () => {
  it("hat 5 Achsen × 3 Stufen × 3 Fragen, alle nicht-leer", () => {
    for (const axis of AXES) for (const level of LEVELS) {
      expect(TENSION_QUESTIONS[axis][level]).toHaveLength(3);
      TENSION_QUESTIONS[axis][level].forEach(q => expect(q.length).toBeGreaterThan(20));
    }
  });
  it("Anti-Reification: keine Frage enthält 'Du bist' oder 'Sie sind'", () => {
    const all = AXES.flatMap(a => LEVELS.flatMap(l => TENSION_QUESTIONS[a][l])).concat(Object.values(PAIR_QUESTIONS));
    all.forEach(q => { expect(q).not.toMatch(/\bDu bist\b/i); expect(q).not.toMatch(/\bSie sind\b/i); });
  });
});

describe("selectQuestion", () => {
  it("ist deterministisch: gleiche (Achse, Stufe, Datum) → gleiche Frage", () => {
    expect(selectQuestion("structure_flow", "spuerbar", "2026-06-11"))
      .toBe(selectQuestion("structure_flow", "spuerbar", "2026-06-11"));
  });
  it("rotiert über aufeinanderfolgende Tage durch alle 3 Fragen ohne Wiederholung", () => {
    const days = ["2026-06-11", "2026-06-12", "2026-06-13"];
    const qs = days.map(d => selectQuestion("inner_outer", "leise", d));
    expect(new Set(qs).size).toBe(3);
  });
});
```

**Step 2: FAIL. Step 3: Implementierung.** 45 kuratierte Fragen — VOLLSTÄNDIG, Ton nach Konzept (Stufe „leise" = Hintergrund-Rahmung, „spürbar" = Standard, „dominant" = Vordergrund-Rahmung):

```ts
export const TENSION_QUESTIONS = {
  structure_flow: {
    leise: [
      "Welche kleine Ordnung trägt dich heute, ohne dass du sie bemerkst?",
      "Wo darf etwas ungeordnet bleiben, ohne dass etwas verloren geht?",
      "Welche Routine könnte heute eine Spur weicher werden?",
    ],
    spuerbar: [
      "Wo gibt dir Struktur Halt – und wo verhindert sie Bewegung?",
      "Welche Form trägt dich, ohne dich einzusperren?",
      "Was will geordnet werden – und was will fließen dürfen?",
    ],
    dominant: [
      "Welche Struktur steht heute im Vordergrund – schützt sie etwas oder hält sie etwas fest?",
      "Wenn heute eine Form nachgeben dürfte: welche wäre es?",
      "Was würde fließen, wenn der Plan eine Stunde Pause hätte?",
    ],
  },
  inner_outer: {
    leise: [
      "Welcher leise Innenraum meldet sich heute am Rand des Tages?",
      "Wo wäre ein kleiner Rückzug heute kein Verlust, sondern ein Sammeln?",
      "Was von dir war heute sichtbar, ohne dass du es zeigen wolltest?",
    ],
    spuerbar: [
      "Was bleibt innen – und was will nach außen sichtbar werden?",
      "Wo schützt dein Innenraum dich – und wo trennt er dich ab?",
      "Wann darfst du sichtbar werden, ohne dich zu verlieren?",
    ],
    dominant: [
      "Die Achse zwischen Rückzug und Ausdruck steht im Vordergrund: Welche Seite bekommt heute zu viel Raum?",
      "Was würde geschehen, wenn das Innere heute einen Satz nach außen spräche?",
      "Welcher Auftritt heute wäre ehrlicher als das Schweigen – und welcher nicht?",
    ],
  },
  security_freedom: {
    leise: [
      "Welche Sicherheit trägt dich heute so selbstverständlich, dass sie unsichtbar ist?",
      "Wo wäre ein kleines Risiko heute eher Spiel als Gefahr?",
      "Welche Absicherung könnte heute eine Handbreit lockerer sitzen?",
    ],
    spuerbar: [
      "Welche Sicherheit trägt dich – und welche hält dich klein?",
      "Was musst du sichern, damit du loslassen kannst?",
      "Wo beginnt Freiheit – und wo wird sie Flucht?",
    ],
    dominant: [
      "Sicherheit und Freiheit ziehen heute deutlich in verschiedene Richtungen: Welche Entscheidung schiebt das Spannungsfeld vor sich her?",
      "Welcher sichere Ort ist heute zu eng geworden?",
      "Wenn Freiheit heute einen Preis hat: Welcher wäre ihn wert – und welcher nicht?",
    ],
  },
  action_being: {
    leise: [
      "Welche kleine Handlung wartet heute geduldig darauf, dass ihr Moment kommt?",
      "Wo ist Nichtstun heute kein Aufschub, sondern Ankommen?",
      "Welcher Moment heute will nur wahrgenommen werden, nicht verbessert?",
    ],
    spuerbar: [
      "Was will getan werden – und was darf erst ankommen?",
      "Wo ist Stille Kraft – und wo ist sie Vermeidung?",
      "Wie klingt ein Tag, der handeln und ruhen darf?",
    ],
    dominant: [
      "Der Zug zum Handeln steht im Vordergrund: Was davon ist Antwort – und was ist Ausweichen vor dem Stillstand?",
      "Welche eine Handlung hätte heute Gewicht – und welche drei wären nur Bewegung?",
      "Was geschieht, wenn du heute zehn Minuten nichts in Bewegung setzt?",
    ],
  },
  tradition_innovation: {
    leise: [
      "Welches Erbe arbeitet heute leise für dich?",
      "Wo könnte ein vertrauter Weg heute eine neue Abzweigung vertragen?",
      "Welche alte Gewohnheit verdient heute einen zweiten, freundlichen Blick?",
    ],
    spuerbar: [
      "Welches Erbe trägt dich – und welches hält dich fest?",
      "Was darf neu werden, ohne das Alte zu verraten?",
      "Wo bist du Brücke – und wo willst du Ufer sein?",
    ],
    dominant: [
      "Herkunft und Erneuerung stehen sich heute deutlich gegenüber: Welcher Schritt ehrt beide?",
      "Welche Neuerung drängt – und was aus dem Alten will mitgenommen werden?",
      "Wenn heute etwas zum letzten Mal auf die alte Weise geschieht: Was wäre es?",
    ],
  },
} as const;

/** Paar-Modus, MVP nur Stufe "spuerbar". Rahmung: Differenz zwischen zwei Feldern, nie Bewertung der Beziehung. */
export const PAIR_QUESTIONS: Record<string, string> = {
  structure_flow: "Wo gibt die Form des einen dem Fluss des anderen Halt – und wo bremst sie ihn?",
  inner_outer: "Was bleibt zwischen euch innen – und was will gemeinsam nach außen sichtbar werden?",
  security_freedom: "Welche Sicherheit baut ihr einander – und wo braucht einer von euch mehr Weite?",
  action_being: "Wer von euch setzt in Bewegung, wer lässt ankommen – und wann tauscht ihr die Rollen?",
  tradition_innovation: "Welches Mitgebrachte trägt euch als Paar – und was wollt ihr gemeinsam neu erfinden?",
};

/** Deterministische Tagesrotation: FNV-1a-Hash über `${axisId}|${dateISO}` → Index.
 *  Aufeinanderfolgende Tage rotieren ohne Wiederholung (dayNumber mod 3 + Achsen-Offset). */
export function selectQuestion(
  axisId: keyof typeof TENSION_QUESTIONS,
  level: "leise" | "spuerbar" | "dominant",
  dateISO: string,
): string {
  const qs = TENSION_QUESTIONS[axisId][level];
  const dayNumber = Math.floor(Date.parse(dateISO + "T00:00:00Z") / 86_400_000);
  let h = 2166136261;
  for (const ch of axisId) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return qs[(((dayNumber + (h >>> 0)) % qs.length) + qs.length) % qs.length];
}
```

(Hinweis Implementierer: `dayNumber mod 3` + fester Achsen-Hash-Offset erfüllt den No-Repeat-über-3-Tage-Test exakt; `Date.parse` mit explizitem UTC-Suffix hält es zeitzonenstabil.)

**Step 4: PASS + lint. Step 5: Commit** `feat: kuratierte Spannungsfragen (5×3×3 + 5 Paar) mit deterministischer Tagesrotation`

---

### Task 3: Reaktions-Logik (TDD)

**Files:**
- Create: `src/utils/tensionReaction.ts`
- Test: `src/utils/tensionReaction.test.ts`

**Verhalten (Konzept-Regel 8):** `applyReaction(state, reaction)` → `{ state, mode }`:
- `trifft` → mode "vertiefung" (Achse bleibt; UI stabilisiert, zeigt Herkunfts-Hinweis: Element + Differenzrichtung in Worten)
- `teilweise` → mode "nuance" (Achse bleibt; UI teilt Bogen)
- `widerstand` → mode "gegenlesart" (Achse bleibt, `activeLean` invertiert ("a"↔"b"); UI betont Gegenpol; Frage wird aus Sicht des Gegenpols NEU gewählt: gleiche Bibliothek, Index+1 mod 3)
- `passt_nicht` → mode "alternative": aktive Achse wird durch die NÄCHSTSTÄRKSTE noch nicht abgelehnte Achse ersetzt (Rang-Reihenfolge nach |difference|); nach 3 Ablehnungen → mode "kalibrierung" (UI: ehrlicher Hinweis „Heute zeigt das Modell keine Achse, die für dich trägt." — KEIN endloses Durchwechseln).

Tests: alle 4 Übergänge + Doppel-passt_nicht wählt Rang 3 + Dreifach → kalibrierung + widerstand invertiert lean und wechselt Frage. (Vollständige Testfälle analog Task 1 ausformulieren; Implementierung als pure Funktion über `TensionState` + `rejectedAxisIds: string[]`.)

**Commit:** `feat: Reaktions-Logik (Trifft/Teilweise/Widerstand/Passt nicht) als pure Transformation`

---

### Task 4: Ring-Visualisierung `TensionNavigator.tsx`

**Files:**
- Create: `src/components/TensionNavigator.tsx`
- Test (render-smoke): über e2e in Task 6 (Repo hat kein Component-Test-Setup; Logik liegt komplett in Tasks 1–3)

**Geometrie aus dem Testtool übernehmen** (docs/concept/spannungsnavigator-testtool.html, Funktionen `polar`, `curvePath`, `blend` — 1:1 portieren, viewBox `0 0 720 720`, Zentrum 360/360, R=240). **WARNUNG aus PR #14:** KEINE framer-motion-Transforms auf SVG-Elementen (motion v12 erzwingt fill-box und ignoriert px-Origins). Animationen ausschließlich CSS (`transition: opacity/stroke-width`) oder SMIL-frei statisch.

**Render-Zustände (Konzept §5 + §12), exakt:**
- Alle 5 Knoten auf Ringpositionen (`angle`), Label = `poleA ↔ poleB`, aktiver Knoten: r×1.25, voll-opak, Glow; Nebenachsen 0.75; Rest 0.4.
- Hauptbogen zwischen `activeAxis.angle` und `angle+180` (Pol A-Seite ↔ Pol B-Seite), Farbe: Gradient Gold→Blau; Krümmung +40…+170 je `signalLevel`; bei `widerstand`-Mode Krümmung negiert; bei `teilweise` zweiter feiner Parallelbogen.
- Max. 2 Nebenbögen (dünn, 35 % Opazität) zur jeweiligen `secondaries[i].angle`.
- Intensitäts-Stufen: leise {stroke 2.5, glow aus, Karte klein}, spürbar {stroke 4.5, Glow an}, dominant {stroke 6.5, andere Knoten auf 0.25 gedimmt}.
- **Zentrale Karte — FRAGE ZUERST:** kleine Kicker-Zeile `AKTIVE SPANNUNG · {poleA} ↔ {poleB} · {signalLevel}` (sprachlich, NIE Zahl), darunter die Frage groß (Serif), darunter Footer `Modellergebnis, keine Eigenschaft.` Reaktions-mode-abhängige Fußnote wie im Testtool (`Widerstand: Der Gegenpol wird mitgeprüft.` etc.).
- Reaktions-Buttons unter der Karte: Trifft / Teilweise / Widerstand / Passt nicht.
- **Share-Button**: kopiert `Meine Bazodiac-Spannung heute: {poleA} ↔ {poleB}. Frage: {frage}` in die Zwischenablage (keine Geburtsdaten, keine Werte — Konzept §6). `navigator.clipboard.writeText` + kurzes „Kopiert"-Feedback.
- **Herkunft (bei „Trifft")**: einklappbarer Block — ehrlich technisch: `Abgeleitet aus der {element}-Differenz deines Fusionsfelds ({westlich|bazi}-betont). Ausprägung: {signalLevel} (kalibriert gegen Zufallsbaseline).` KEINE Zahlen im Visual; Zahlenwerte nur hier im Herkunfts-Text erlaubt? → NEIN, auch hier sprachlich (Konzept §3). Nur Richtung + Stufe.

Props: `{ viewModel: ProfileViewModel }` — zieht `viewModel.fusion.elementalComparison` + `signalLevel`, ruft `deriveTension`, `selectQuestion(axis, level, todayISO)`. `todayISO` = lokales Datum (`new Date().toLocaleDateString("sv")` — sv-Locale liefert YYYY-MM-DD). Wenn `deriveTension` null → ehrlicher Leerzustand („Für dieses Profil liefert das Fusionsfeld keine auswertbare Differenz.").

**Commit:** `feat: Spannungsnavigator-Ring (SVG, CSS-only transforms) mit Reaktions-Loop und Share-Snippet`

---

### Task 5: FusionDetail durch Navigator ersetzen (Entscheidung 3)

**Files:**
- Modify: `src/App.tsx` (switch ~Z. 126: `case "fusion":` rendert jetzt `<TensionNavigator viewModel={viewModel} />`)
- Modify: `src/components/TensionNavigator.tsx` — der „Herkunft"-Layer (aufklappbar, öffnet sich bei Reaktion „Trifft" ODER per expliziten „Herkunft & Methode"-Link unten) übernimmt die KOMPLETTE bisherige FusionDetail-Substanz: kalibrierter Kohärenz-Gauge mit Label „kalibrierte Strukturkongruenz vs. Zufallsbaseline" + `coherenceRating`-Band + `signalLevel`-Badge („Ausprägung des Signals"), Element-Doppelbalken (West vs. BaZi + Δ), „Größte Spannungsfelder", Engine-`integrationText`. Im Herkunfts-Layer SIND Zahlen erlaubt (Konzept §7 Expert-Logik: Herkunft zeigt Ableitung) — im Navigator-Visual selbst weiterhin KEINE.
- Delete: `src/components/FusionDetail.tsx` (erst NACHDEM alle Inhalte verschoben + e2e grün; `grep -rn "FusionDetail" src/` muss leer sein)
- Modify: bestehende e2e-Assertions, die den Fusion-Tab prüfen (61.4%-Gauge etc.) → zeigen jetzt auf den geöffneten Herkunft-Layer.
- PageShell: Tab-Label „Fusion" bleibt (kein neuer Tab); optional Icon-Wechsel zu `Compass`.

**Step:** Umbau, `npm run lint`, volle e2e. **Commit:** `feat: Navigator ersetzt FusionDetail — technische Ansicht wird Herkunfts-Layer`

---

### Task 6: Paar-Modus (Synastrie)

**Files:**
- Modify: `src/server/app.ts` (Synastry-Route ~Z. 306 — LESEN: woher kommen die beiden Profile? Vermutlich orchestriert sie zwei FuFirE-Profile. Response ADDITIV erweitern um `elementalA` + `elementalB`: die per-Element-Verteilungen beider Personen aus deren Fusion-Daten. Falls die Route aktuell nur lokal rechnet (synastry.ts), stattdessen die Fusion-Calls beider Personen ergänzen — Aufwand prüfen, ehrlich berichten falls > erwartet.)
- Create: `src/utils/tensionPair.ts` + Test: `derivePairTension(elementalA, elementalB)` — identische Logik wie `deriveTension`, aber `difference = wA[element] − wB[element]` (Person-A-Überschuss → Gold, Person B → Blau); nutzt `ELEMENT_AXIS_MAP`; Frage aus `PAIR_QUESTIONS[axisId]`.
- Modify: `src/components/Synastry.tsx`: nach erfolgreichem Ergebnis zusätzlich `<TensionNavigator pairMode …>` rendern.
- Modify: `src/components/TensionNavigator.tsx`: `pairMode`-Props (`elementalA/B`, `nameA/B`): Knoten zweifarbig (Halbkreis Gold=A-Gewicht, Blau=B-Gewicht via `stroke-dasharray`-Halbierung oder zwei Halbringe), Hauptbogen an der Top-Differenz-Achse, Karten-Kicker `PAAR-SPANNUNG · {nameA} ↔ {nameB}`, Paar-Frage, gleiche Reaktionen, Share-Text `Unsere Bazodiac-Paar-Spannung: …` (keine Namen im Share! Konzept §6 → Namen durch „wir" ersetzen).

TDD für `tensionPair.ts` (Fixture-basiert: zwei konstruierte Verteilungen mit bekannter Top-Differenz). UI über e2e.

**Commit(s):** `feat: Paar-Spannungsachsen (Synastrie) — Server-Verteilungen + derivePairTension + Paar-Ring`

---

### Task 7: e2e + Mock + Screenshots

**Files:**
- Modify: `tests/e2e/mock-fufire.mjs` (Fusion-Mock liefert bereits Real-Shape mit elemental_comparison — prüfen, dass die Werte eine eindeutige Top-Achse ergeben; ggf. Metall-Differenz betonen)
- Create/Modify: e2e-Spec `tests/e2e/…` (Konvention der bestehenden Specs folgen):
  1. Navigator-Tab öffnen → Karte zeigt Polpaar + Frage + „Modellergebnis, keine Eigenschaft." + KEINE Prozentzeichen im Navigator-DOM (`expect(locator('text=/%/')).toHaveCount(0)` scoped auf den Navigator-Container!)
  2. „Passt nicht" klicken → Polpaar wechselt (anderer Text)
  3. „Widerstand" klicken → Fußnote „Gegenpol" erscheint
  4. Determinismus: Reload → gleiche Frage (gleicher Tag)
  5. Paar-Modus: Synastrie ausfüllen (Mock) → Paar-Karte mit Paar-Frage sichtbar
- Screenshots nach Repo-Konvention (docs/qa/screenshots/...) committen.

**Step:** `npm test && npm run lint && npm run build && npx playwright test` — alles grün (Baseline 190/10 + neue).

**Commit:** `test: e2e Spannungsnavigator (Natal + Reaktionen + Paar) + Screenshots`

---
### Task 8a: PR

`gh pr create --repo DYAI2025/New_Bazi --title "feat: Spannungsnavigator MVP (Element→Pol-Ableitung, Fragen-Rotation, Ring, Paar-Modus)"` — Body: Konzept-Verweis docs/concept/, Polaritäts-Konvention-Tabelle, ehrliche MISSING-Liste (Tages-Achsen-Shift braucht Engine-Erweiterung E1; 2-Ringe-Paar-Visual Folge-Iteration; Premium-Layer nicht gebaut). KEIN Merge ohne Review.

### Task 8b: Engine-Feature-Issue E1 anlegen (Entscheidung 2)

`gh issue create --repo DYAI2025/FuFirE --title "feat: daily_elemental_comparison — Tages-Elementfeld für den Spannungsnavigator"` — Body (vollständig):
- **Was:** `/v1/experience/daily` (oder neuer Endpoint `/v1/experience/tension-field`) liefert zusätzlich `daily_elemental_comparison`: pro Element `{natal, daily, difference}`, wobei `daily` der Wu-Xing-Vektor des Tages-Transits ist (Mathe existiert: `wuxing/analysis.py` + Transit-Pipeline) und `natal` der fusionierte Natal-Vektor. Optional dieselbe Kalibrierungs-Mechanik (Baseline/σ) für eine Tages-Signalstufe.
- **Warum:** Der Spannungsnavigator (New_Bazi `docs/plans/2026-06-11-spannungsnavigator-mvp.md` + `docs/concept/`) braucht für echten Tages-Achsen-Shift ein tägliches elemental_comparison; bis dahin rotiert nur die Frage (dokumentiertes MISSING).
- **Konsument:** New_Bazi `deriveTension()` konsumiert den Tages-Vektor unverändert (gleiche Shape wie elemental_comparison).

---

## Annex: Integrations-Contract für N2/N3 (Astro-Noctum) — BINDEND, hier nicht implementieren

Entschieden 2026-06-11. Gilt für die Folge-Sprints (Ritual-Verzahnung N2, Quiz-Verfeinerung N3); im N1-MVP nur Doku.

**1. Schichtenmodell „Ein Feld, drei Bewegungsquellen":**
- Natal (statisch, Gold/Blau) — dieses MVP.
- Tag (modell-bewegt, Gold/Blau) — nach Engine-Issue E1.
- Nutzer-Antwort (selbst-bewegt, **Cyan/Weiß** = Konzept-Farbe „Kontakt/Erkenntnismoment") — Council-Wahl aus dem Tagespuls-Ritual (Astro-Noctum, live: „Rat der sechs", 1×/Tag, 409 ALREADY_DECIDED).
- **Gewichten-Regel (Benjamin bestätigt 2026-06-11):** Die Nutzer-Linse GEWICHTET die Lesart-Ebene (Frage-Auswahl + Lean-Anzeige + Cyan-Bogen), verändert aber NIE die Modell-Daten; der Herkunfts-Layer zeigt Modell-Bewegung und Nutzer-Bewegung getrennt.

**2. Council-Figur → Element (für die Cyan-Linse):** `day_master` → Stamm-Element (Engine-Tabelle), `jahrestier` → Branch-Element, `wuxing_dom` → direkt, `sonne`/`mond`/`aszendent` → Zeichen → Wu-Xing via Engine `info/wuxing-mapping`. Figur-Element → dessen Achse (ELEMENT_AXIS_MAP) erhält die Nutzer-Betonung.

**3. Aphorismus-Bias (N2, null Content-Aufwand):** `selectAphorism` bevorzugt `element_affinity ∋ aktives Achsen-Element` (Tags existieren in Supabase `aphorisms`).

**4. Quiz-Marker → Achsen-Evidenz (N3):** Marker verfeinern die LESART (Confidence/Schärfe je Achse), überschreiben NIE die Engine-Differenz. Start-Mapping (kuratierbar):

| Marker-Domain/Keyword | Achse (Seite) |
|---|---|
| values.achievement, leadership.* | structure_flow (Struktur) |
| eq.empathy, love.togetherness | inner_outer (Innen) |
| social.extroversion, social.* (Ausdrucks-nah) | inner_outer (Außen) |
| eq.stress_sensitivity | security_freedom (Sicherheit) |
| instinct.*, psyche.* (Sein-nah) | action_being (Sein) |
| energy.*, skills.* (Tat-nah) | action_being (Handeln) |
| flower.*/stone.*/lifestyle.* (Herkunft-nah) | tradition_innovation (kuratieren!) |

**5. Paar-Vertiefung (N3):** Beide Partner-Markerprofile je Achse → entgegengesetzte Leans = „Reibung sichtbar" (Wachstumskante, Gold↔Blau auf einer Achse), gleiche Leans = „Harmonie spürbar" (parallele Bögen, gemeinsame Ressource) — beides positiv, konform partner_match-Contract („Muster, Reibung, Ressourcen, Wachstumskanten; jede Aussage mit Datenanker; keine Seelenverwandten-Behauptung").

**6. Portabilitäts-Regel:** `tensionNavigator.ts`, `tensionQuestions.ts`, `tensionReaction.ts`, `tensionPair.ts` bleiben dependency-frei (pure TS) — sie werden in N2 nach Astro-Noctum portiert.
