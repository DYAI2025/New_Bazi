import { describe, it, expect } from "vitest";
import { ENGINE_CARDS } from "./engineBento";

describe("engineBento (RD-4) — visible-engine cards", () => {
  it("has the six engine layers, unique ids, in order", () => {
    expect(ENGINE_CARDS.map((c) => c.id)).toEqual(["compute", "map", "interpret", "reflect", "deepen", "protect"]);
  });

  it("every card has a label, title, sentence and a concrete anchor", () => {
    for (const c of ENGINE_CARDS) {
      expect(c.label.length).toBeGreaterThan(2);
      expect(c.title.length).toBeGreaterThan(2);
      expect(c.sentence.length).toBeGreaterThan(20);
      expect(c.anchor.length).toBeGreaterThan(5);
    }
  });

  it("no fate/score/diagnosis claim and no fake metric in any card", () => {
    const forbidden = /du bist|schicksal|diagnose|therapie|heilung|garantiert|beweist|\d+\s?%|score/i;
    for (const c of ENGINE_CARDS) {
      const text = `${c.title} ${c.sentence} ${c.anchor}`;
      expect(text, c.id).not.toMatch(forbidden);
    }
  });
});
