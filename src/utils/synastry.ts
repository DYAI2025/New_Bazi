import { ElementType, SynastryResult } from "../types";
import { ProfileViewModel } from "../viewmodels/profileViewModel";

// ---------------------------------------------------------------------------
// Local-only synastry comparison helpers.
//
// Pure functions: no I/O, no env, no FuFirE calls. These operate solely on the
// fields they read (`bazi.dayMaster.element`, `western.sunSign`) so the BFF can
// derive a local synastry comparison from two already-resolved FuFirE profiles.
// ---------------------------------------------------------------------------

const GENERATING: Record<string, string> = {
  [ElementType.WOOD]: ElementType.FIRE,
  [ElementType.FIRE]: ElementType.EARTH,
  [ElementType.EARTH]: ElementType.METAL,
  [ElementType.METAL]: ElementType.WATER,
  [ElementType.WATER]: ElementType.WOOD
};
const CONTROLLING: Record<string, string> = {
  [ElementType.WOOD]: ElementType.EARTH,
  [ElementType.EARTH]: ElementType.WATER,
  [ElementType.WATER]: ElementType.FIRE,
  [ElementType.FIRE]: ElementType.METAL,
  [ElementType.METAL]: ElementType.WOOD
};

export type ElementRelation = "same" | "generating" | "controlling" | "neutral";

/** Classify the BaZi day-master relationship between two elements. */
export function elementRelationship(ea: ElementType, eb: ElementType): {
  relation: ElementRelation;
  baziScore: number;
} {
  if (ea === eb) return { relation: "same", baziScore: 85 };
  if (GENERATING[ea] === eb || GENERATING[eb] === ea) return { relation: "generating", baziScore: 78 };
  if (CONTROLLING[ea] === eb || CONTROLLING[eb] === ea) return { relation: "controlling", baziScore: 52 };
  return { relation: "neutral", baziScore: 65 };
}

export function westernElement(sign: string): string {
  if (["Widder", "Löwe", "Schütze"].includes(sign)) return "Feuer";
  if (["Stier", "Jungfrau", "Steinbock"].includes(sign)) return "Erde";
  if (["Zwillinge", "Waage", "Wassermann"].includes(sign)) return "Luft";
  return "Wasser";
}

export function compareProfiles(a: ProfileViewModel, b: ProfileViewModel): SynastryResult {
  // BaZi day-master element relationship.
  const ea = a.bazi.dayMaster.element;
  const eb = b.bazi.dayMaster.element;
  const { baziScore } = elementRelationship(ea, eb);

  // Western sun-sign element resonance.
  const wa = westernElement(a.western.sunSign);
  const wb = westernElement(b.western.sunSign);
  const compatible = (wa === wb) || (["Feuer", "Luft"].includes(wa) && ["Feuer", "Luft"].includes(wb)) || (["Erde", "Wasser"].includes(wa) && ["Erde", "Wasser"].includes(wb));
  const westernScore = wa === wb ? 82 : compatible ? 70 : 56;

  const score = Math.round((baziScore + westernScore) / 2);
  const harmonyAnalysis = `Lokaler Vergleich der FuFirE-Profile: BaZi-Tagesmeister ${ea} und ${eb} ergeben ${baziScore}%, die westlichen Sonnenelemente ${wa}/${wb} ${westernScore}%.`;
  // Reflective, non-prescriptive: a comparison note, not a relationship verdict or
  // instruction (kept coherent with the "kein Messwert"-Note rendered alongside it).
  const advice = score >= 75
    ? "Viele Elementeflüsse beider Profile laufen in ähnliche Richtung — das kann gemeinsame Routinen erleichtern."
    : score >= 60
      ? "Die Rhythmen beider Profile unterscheiden sich teils — ein Feld, in dem bewusste Kommunikation Unterschiede sichtbar macht."
      : "Mehrere Element-Kontrollzyklen stehen gegensätzlich — Reibung, die sich als Wachstumskante lesen lässt.";

  return { score, westernScore, baziScore, harmonyAnalysis, advice };
}
