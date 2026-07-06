import { describe, it, expect } from "vitest";
import { ElementType } from "../types";
import type { ProfileViewModel } from "../viewmodels/profileViewModel";
import { compareProfiles, westernElement, elementRelationship } from "./synastry";

/**
 * Minimal fixture: synastry only reads `bazi.dayMaster.element` and
 * `western.sunSign`, so we provide just those and cast to ProfileViewModel.
 */
function profile(element: ElementType, sunSign: string): ProfileViewModel {
  return {
    bazi: { dayMaster: { element } },
    western: { sunSign }
  } as ProfileViewModel;
}

describe("elementRelationship", () => {
  it("same element → baziScore 85", () => {
    expect(elementRelationship(ElementType.WOOD, ElementType.WOOD)).toEqual({
      relation: "same",
      baziScore: 85
    });
  });

  it("generating pair (Holz→Feuer) → baziScore 78", () => {
    expect(elementRelationship(ElementType.WOOD, ElementType.FIRE)).toEqual({
      relation: "generating",
      baziScore: 78
    });
  });

  it("generating pair reversed (Feuer→Holz) → baziScore 78", () => {
    expect(elementRelationship(ElementType.FIRE, ElementType.WOOD)).toEqual({
      relation: "generating",
      baziScore: 78
    });
  });

  it("controlling pair (Holz→Erde) → baziScore 52", () => {
    expect(elementRelationship(ElementType.WOOD, ElementType.EARTH)).toEqual({
      relation: "controlling",
      baziScore: 52
    });
  });

  it("controlling pair reversed (Erde→Holz) → baziScore 52", () => {
    expect(elementRelationship(ElementType.EARTH, ElementType.WOOD)).toEqual({
      relation: "controlling",
      baziScore: 52
    });
  });

  it("neutral pair (no generating/controlling relation) → baziScore 65", () => {
    // Among the five canonical elements every pair is either same, generating,
    // or controlling, so the neutral branch is only reachable for elements that
    // do not appear in the cycle maps. Pin that default behaviour explicitly.
    expect(
      elementRelationship("Unbekannt" as ElementType, "Anders" as ElementType)
    ).toEqual({
      relation: "neutral",
      baziScore: 65
    });
  });
});

describe("westernElement", () => {
  it("maps fire signs to Feuer", () => {
    expect(westernElement("Widder")).toBe("Feuer");
    expect(westernElement("Löwe")).toBe("Feuer");
    expect(westernElement("Schütze")).toBe("Feuer");
  });

  it("maps earth signs to Erde", () => {
    expect(westernElement("Stier")).toBe("Erde");
    expect(westernElement("Jungfrau")).toBe("Erde");
    expect(westernElement("Steinbock")).toBe("Erde");
  });

  it("maps air signs to Luft", () => {
    expect(westernElement("Zwillinge")).toBe("Luft");
    expect(westernElement("Waage")).toBe("Luft");
    expect(westernElement("Wassermann")).toBe("Luft");
  });

  it("maps water signs (and anything else) to Wasser", () => {
    expect(westernElement("Krebs")).toBe("Wasser");
    expect(westernElement("Skorpion")).toBe("Wasser");
    expect(westernElement("Fische")).toBe("Wasser");
  });
});

describe("compareProfiles — western scoring", () => {
  // Hold baziScore constant at 85 (same element) to isolate western score.
  const FIXED_BAZI = ElementType.WOOD;

  it("same western element → westernScore 82", () => {
    // Widder/Löwe both Feuer.
    const r = compareProfiles(profile(FIXED_BAZI, "Widder"), profile(FIXED_BAZI, "Löwe"));
    expect(r.westernScore).toBe(82);
  });

  it("same polarity group Feuer/Luft → westernScore 70", () => {
    // Widder=Feuer, Waage=Luft.
    const r = compareProfiles(profile(FIXED_BAZI, "Widder"), profile(FIXED_BAZI, "Waage"));
    expect(r.westernScore).toBe(70);
  });

  it("same polarity group Erde/Wasser → westernScore 70", () => {
    // Stier=Erde, Krebs=Wasser.
    const r = compareProfiles(profile(FIXED_BAZI, "Stier"), profile(FIXED_BAZI, "Krebs"));
    expect(r.westernScore).toBe(70);
  });

  it("opposite polarity groups → westernScore 56", () => {
    // Widder=Feuer, Stier=Erde.
    const r = compareProfiles(profile(FIXED_BAZI, "Widder"), profile(FIXED_BAZI, "Stier"));
    expect(r.westernScore).toBe(56);
  });
});

describe("compareProfiles — combined score, harmony and advice", () => {
  it("averages baziScore and westernScore (rounded) and advises ≥75", () => {
    // Same element (85) + same western element (82) → round(83.5) = 84.
    const a = profile(ElementType.WOOD, "Widder");
    const b = profile(ElementType.WOOD, "Löwe");
    const r = compareProfiles(a, b);

    expect(r.baziScore).toBe(85);
    expect(r.westernScore).toBe(82);
    expect(r.score).toBe(84);
    expect(r.harmonyAnalysis).toBe(
      "Lokaler Vergleich der FuFirE-Profile: BaZi-Tagesmeister Holz und Holz ergeben 85%, die westlichen Sonnenelemente Feuer/Feuer 82%."
    );
    expect(r.advice).toBe(
      "Viele Elementeflüsse beider Profile laufen in ähnliche Richtung — das kann gemeinsame Routinen erleichtern."
    );
  });

  it("advice for 60 ≤ score < 75", () => {
    // Generating (78) + opposite groups (56) → round(67) = 67.
    const a = profile(ElementType.WOOD, "Widder"); // Feuer
    const b = profile(ElementType.FIRE, "Stier"); // Erde
    const r = compareProfiles(a, b);

    expect(r.baziScore).toBe(78);
    expect(r.westernScore).toBe(56);
    expect(r.score).toBe(67);
    expect(r.advice).toBe(
      "Die Rhythmen beider Profile unterscheiden sich teils — ein Feld, in dem bewusste Kommunikation Unterschiede sichtbar macht."
    );
  });

  it("advice for score < 60", () => {
    // Controlling (52) + opposite groups (56) → round(54) = 54.
    const a = profile(ElementType.WOOD, "Widder"); // Feuer
    const b = profile(ElementType.EARTH, "Stier"); // Erde
    const r = compareProfiles(a, b);

    expect(r.baziScore).toBe(52);
    expect(r.westernScore).toBe(56);
    expect(r.score).toBe(54);
    expect(r.advice).toBe(
      "Mehrere Element-Kontrollzyklen stehen gegensätzlich — Reibung, die sich als Wachstumskante lesen lässt."
    );
  });
});
