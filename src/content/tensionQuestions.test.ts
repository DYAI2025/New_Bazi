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
    const all = AXES.flatMap(a => LEVELS.flatMap<string>(l => TENSION_QUESTIONS[a][l])).concat(Object.values(PAIR_QUESTIONS));
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
