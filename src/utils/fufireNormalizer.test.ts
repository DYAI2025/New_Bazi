import { describe, it, expect } from "vitest";
import { normalizeFuFireProfile } from "./fufireNormalizer";
import { ElementType } from "../types";

const INPUT = { name: "Hannah Arendt", birthDate: "1906-10-14", birthTime: "21:15", birthPlaceLabel: "Linden", gender: "Weiblich" };

const FULL = {
  western: { sunSign: "Waage", moonSign: "Stier", ascendant: "Krebs", planets: [], aspects: [], houses: [] },
  bazi: { dayMaster: ElementType.WOOD, dayMasterName: "Jiǎ", pillars: { Tag: { stem: { name: "Jiǎ", chinese: "甲", element: ElementType.WOOD, yinYang: "Yang" }, branch: { name: "Zǐ", chinese: "子", element: ElementType.WATER, animal: "Ratte", hiddenStems: [], yinYang: "Yang" } } } },
  wuxing: { wu_xing_vector: { [ElementType.WOOD]: 30, [ElementType.FIRE]: 10, [ElementType.EARTH]: 20, [ElementType.METAL]: 10, [ElementType.WATER]: 30 } },
  fusion: { coherenceIndex: 82 }
};

function provFor(vm: any, field: string) {
  return vm.provenance.find((p: any) => p.uiField.includes(field));
}

describe("normalizeFuFireProfile honesty for missing sections (real FuFirE source)", () => {
  it("marks every section available on a complete chart", () => {
    const vm = normalizeFuFireProfile(FULL, INPUT, "fufire-chart");
    expect(vm.source).toBe("fufire-chart");
    expect(vm.bazi.available).toBe(true);
    expect(vm.wuxing.available).toBe(true);
    expect(vm.fusion.source).toBe("fufire");
    expect(vm.wuxing.distribution[ElementType.WOOD]).toBe(30);
  });

  it("does NOT fabricate an even Wu-Xing distribution when wuxing is missing", () => {
    const { wuxing, ...rest } = FULL;
    const vm = normalizeFuFireProfile(rest, INPUT, "fufire-chart");
    expect(vm.wuxing.available).toBe(false);
    // No fabricated 20%-each product values.
    const values = Object.values(vm.wuxing.distribution);
    expect(values.every((v) => v === 0)).toBe(true);
    expect(vm.wuxing.elementCards).toHaveLength(0);
    expect(provFor(vm, "Wu Xing").status).toBe("missing");
  });

  it("does NOT fabricate a coherence index when fusion is missing", () => {
    const { fusion, ...rest } = FULL;
    const vm = normalizeFuFireProfile(rest, INPUT, "fufire-chart");
    expect(vm.fusion.source).toBe("missing");
    expect(vm.fusion.coherenceIndex).toBeNull();
  });

  it("marks bazi unavailable when bazi is missing", () => {
    const { bazi, ...rest } = FULL;
    const vm = normalizeFuFireProfile(rest, INPUT, "fufire-chart");
    expect(vm.bazi.available).toBe(false);
    expect(provFor(vm, "BaZi").status).toBe("missing");
  });

  it("treats local fallback as available and labelled fallback-local", () => {
    const { wuxing, ...rest } = FULL;
    const vm = normalizeFuFireProfile({ ...rest, wuxing }, INPUT, "fallback-local");
    expect(vm.source).toBe("fallback-local");
    expect(vm.wuxing.available).toBe(true);
    expect(provFor(vm, "Wu Xing").source).toBe("fallback-local");
  });
});
