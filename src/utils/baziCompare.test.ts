import { describe, it, expect } from "vitest";
import { ElementType } from "../types";
import { compareBaziPillars } from "./baziCompare";
import type { ProfileViewModel } from "../viewmodels/profileViewModel";

type Pillar = ProfileViewModel["bazi"]["pillars"][number];

// Forbidden user-facing reification terms (anti-reification guard).
const FORBIDDEN = [
  "Schicksal",
  "Seelenverwandt",
  "Seele",
  "Diagnose",
  "Therapie",
  "Heilung",
  "Trennung",
  "toxisch",
  "soulmate",
  "du bist",
  "ihr seid",
  "füreinander bestimmt",
  "garantiert",
  "perfekt kompatibel",
  "passt perfekt zusammen",
  "passt zusammen",
  "kompatibel",
];

function pillar(
  pillarKey: string,
  stemElement: ElementType | string,
  branchAnimal: string,
): Pillar {
  return {
    title: pillarKey,
    pillarKey,
    stemChinese: "甲",
    stemPinyin: "Jiǎ",
    stemElement: stemElement as ElementType,
    stemPolarity: "Yang",
    branchChinese: "子",
    branchPinyin: "Zǐ",
    branchElement: ElementType.WATER,
    branchAnimal,
    branchPolarity: "Yang",
    hiddenStems: [],
  };
}

function single(
  stemA: ElementType | string,
  animalA: string,
  stemB: ElementType | string,
  animalB: string,
) {
  const a = [pillar("Jahr", stemA, animalA)];
  const b = [pillar("Jahr", stemB, animalB)];
  return compareBaziPillars(a, b)[0];
}

describe("compareBaziPillars - stem relations", () => {
  it("returns 'gleich' for identical stem elements", () => {
    expect(single(ElementType.WOOD, "Ratte", ElementType.WOOD, "Ratte").stemRelation).toBe(
      "gleich",
    );
  });

  it("returns 'erzeugt' when A's element generates B's (Holz -> Feuer)", () => {
    expect(single(ElementType.WOOD, "Ratte", ElementType.FIRE, "Ratte").stemRelation).toBe(
      "erzeugt",
    );
  });

  it("returns 'wird-erzeugt' when B's element generates A's (Feuer <- Holz)", () => {
    expect(single(ElementType.FIRE, "Ratte", ElementType.WOOD, "Ratte").stemRelation).toBe(
      "wird-erzeugt",
    );
  });

  it("returns 'kontrolliert' when A's element controls B's (Holz -> Erde)", () => {
    expect(single(ElementType.WOOD, "Ratte", ElementType.EARTH, "Ratte").stemRelation).toBe(
      "kontrolliert",
    );
  });

  it("returns 'wird-kontrolliert' when B's element controls A's (Erde <- Holz)", () => {
    expect(single(ElementType.EARTH, "Ratte", ElementType.WOOD, "Ratte").stemRelation).toBe(
      "wird-kontrolliert",
    );
  });
});

describe("compareBaziPillars - branch San-He triads", () => {
  const triads: Array<[string, string]> = [
    ["Affe", "Ratte"],
    ["Ratte", "Drache"],
    ["Schwein", "Hase"],
    ["Hase", "Ziege"],
    ["Tiger", "Pferd"],
    ["Pferd", "Hund"],
    ["Schlange", "Hahn"],
    ["Hahn", "Büffel"],
  ];

  it.each(triads)("recognizes San-He between %s and %s", (a, b) => {
    expect(single(ElementType.WOOD, a, ElementType.WOOD, b).branchRelation).toBe("san-he");
  });
});

describe("compareBaziPillars - branch Liu-He pairs", () => {
  const pairs: Array<[string, string]> = [
    ["Ratte", "Büffel"],
    ["Tiger", "Schwein"],
    ["Hase", "Hund"],
    ["Drache", "Hahn"],
    ["Schlange", "Affe"],
    ["Pferd", "Ziege"],
  ];

  it.each(pairs)("recognizes Liu-He between %s and %s", (a, b) => {
    expect(single(ElementType.WOOD, a, ElementType.WOOD, b).branchRelation).toBe("liu-he");
  });
});

describe("compareBaziPillars - branch Chong oppositions", () => {
  const pairs: Array<[string, string]> = [
    ["Ratte", "Pferd"],
    ["Büffel", "Ziege"],
    ["Tiger", "Affe"],
    ["Hase", "Hahn"],
    ["Drache", "Hund"],
    ["Schlange", "Schwein"],
  ];

  it.each(pairs)("recognizes Chong between %s and %s", (a, b) => {
    expect(single(ElementType.WOOD, a, ElementType.WOOD, b).branchRelation).toBe("chong");
  });
});

describe("compareBaziPillars - same and unrelated animals", () => {
  it("returns 'gleich' for the same animal", () => {
    expect(single(ElementType.WOOD, "Drache", ElementType.WOOD, "Drache").branchRelation).toBe(
      "gleich",
    );
  });

  it("returns 'neutral' for unrelated animals (Ratte vs Tiger)", () => {
    expect(single(ElementType.WOOD, "Ratte", ElementType.WOOD, "Tiger").branchRelation).toBe(
      "neutral",
    );
  });
});

describe("compareBaziPillars - skipping unknown pillars", () => {
  it("skips a pair when stemElement is 'Unbekannt'", () => {
    const a = [pillar("Jahr", "Unbekannt", "Ratte")];
    const b = [pillar("Jahr", ElementType.WOOD, "Ratte")];
    expect(compareBaziPillars(a, b)).toHaveLength(0);
  });

  it("skips a pair when branchAnimal is 'Unbekannt'", () => {
    const a = [pillar("Jahr", ElementType.WOOD, "Unbekannt")];
    const b = [pillar("Jahr", ElementType.WOOD, "Ratte")];
    expect(compareBaziPillars(a, b)).toHaveLength(0);
  });

  it("skips a pair when a value is an empty string", () => {
    const a = [pillar("Jahr", "", "Ratte")];
    const b = [pillar("Jahr", ElementType.WOOD, "Ratte")];
    expect(compareBaziPillars(a, b)).toHaveLength(0);
  });
});

describe("compareBaziPillars - structure and ordering", () => {
  it("only compares pillars with the same pillarKey, in fixed order", () => {
    const a = [
      pillar("Stunde", ElementType.WOOD, "Ratte"),
      pillar("Jahr", ElementType.WOOD, "Ratte"),
      pillar("Tag", ElementType.WOOD, "Ratte"),
      pillar("Monat", ElementType.WOOD, "Ratte"),
    ];
    const b = [
      pillar("Jahr", ElementType.WOOD, "Ratte"),
      pillar("Monat", ElementType.WOOD, "Ratte"),
      pillar("Tag", ElementType.WOOD, "Ratte"),
      pillar("Stunde", ElementType.WOOD, "Ratte"),
    ];
    const result = compareBaziPillars(a, b);
    expect(result.map((r) => r.pillarKey)).toEqual(["Jahr", "Monat", "Tag", "Stunde"]);
  });

  it("populates anchor fields on each comparison", () => {
    const r = single(ElementType.WOOD, "Affe", ElementType.FIRE, "Ratte");
    expect(r.stemElementA).toBe(ElementType.WOOD);
    expect(r.stemElementB).toBe(ElementType.FIRE);
    expect(r.animalA).toBe("Affe");
    expect(r.animalB).toBe("Ratte");
    expect(r.pillarKey).toBe("Jahr");
  });
});

describe("compareBaziPillars - text safety and anchors", () => {
  const animals = [
    "Ratte",
    "Büffel",
    "Tiger",
    "Hase",
    "Drache",
    "Schlange",
    "Pferd",
    "Ziege",
    "Affe",
    "Hahn",
    "Hund",
    "Schwein",
  ];

  it("every output text names both animal anchors", () => {
    const cases: Array<[string, string]> = [
      ["Ratte", "Pferd"], // chong
      ["Ratte", "Büffel"], // liu-he
      ["Affe", "Ratte"], // san-he
      ["Drache", "Drache"], // gleich
      ["Ratte", "Tiger"], // neutral
    ];
    for (const [a, b] of cases) {
      const r = single(ElementType.WOOD, a, ElementType.FIRE, b);
      expect(r.text).toContain(a);
      expect(r.text).toContain(b);
    }
  });

  it("no output text contains forbidden reification terms", () => {
    for (const a of animals) {
      for (const b of animals) {
        const r = single(ElementType.WOOD, a, ElementType.FIRE, b);
        const lower = r.text.toLowerCase();
        for (const term of FORBIDDEN) {
          expect(lower).not.toContain(term.toLowerCase());
        }
      }
    }
  });

  it("frames Chong friction as a Wachstumskante", () => {
    const r = single(ElementType.WOOD, "Ratte", ElementType.WOOD, "Pferd");
    expect(r.text).toContain("Wachstumskante");
  });
});
