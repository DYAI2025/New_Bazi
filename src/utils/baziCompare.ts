import { ElementType } from "../types";
import type { ProfileViewModel } from "../viewmodels/profileViewModel";

/**
 * BaZi pillar comparison (REQ-F-003).
 *
 * Pure module: no React, no IO, no Date.now()/Math.random(). Compares two sets
 * of BaZi pillars per matching pillarKey (Jahr/Monat/Tag/Stunde) and derives the
 * Heavenly-Stem element relation (Sheng/Ke cycles) and the Earthly-Branch animal
 * relation (San-He / Liu-He / Chong). Friction (Chong) is framed as a
 * "Wachstumskante", never as a defect.
 */

export type StemRelationType =
  | "gleich"
  | "erzeugt"
  | "wird-erzeugt"
  | "kontrolliert"
  | "wird-kontrolliert";

export type BranchRelationType = "san-he" | "liu-he" | "chong" | "gleich" | "neutral";

export interface PillarComparison {
  pillarKey: string;
  stemElementA: string;
  stemElementB: string;
  animalA: string;
  animalB: string;
  stemRelation: StemRelationType;
  branchRelation: BranchRelationType;
  text: string;
}

type PillarVM = ProfileViewModel["bazi"]["pillars"][number];

const PILLAR_ORDER = ["Jahr", "Monat", "Tag", "Stunde"];

// Sheng (generating) cycle: each element generates the next.
const SHENG_NEXT: Record<string, ElementType> = {
  [ElementType.WOOD]: ElementType.FIRE,
  [ElementType.FIRE]: ElementType.EARTH,
  [ElementType.EARTH]: ElementType.METAL,
  [ElementType.METAL]: ElementType.WATER,
  [ElementType.WATER]: ElementType.WOOD,
};

// Ke (controlling) cycle: each element controls its target.
const KE_TARGET: Record<string, ElementType> = {
  [ElementType.WOOD]: ElementType.EARTH,
  [ElementType.EARTH]: ElementType.WATER,
  [ElementType.WATER]: ElementType.FIRE,
  [ElementType.FIRE]: ElementType.METAL,
  [ElementType.METAL]: ElementType.WOOD,
};

// San-He triads (three-harmony groups).
const SAN_HE_TRIADS: string[][] = [
  ["Affe", "Ratte", "Drache"],
  ["Schwein", "Hase", "Ziege"],
  ["Tiger", "Pferd", "Hund"],
  ["Schlange", "Hahn", "Büffel"],
];

// Liu-He pairs (six-harmony pairs).
const LIU_HE_PAIRS: Array<[string, string]> = [
  ["Ratte", "Büffel"],
  ["Tiger", "Schwein"],
  ["Hase", "Hund"],
  ["Drache", "Hahn"],
  ["Schlange", "Affe"],
  ["Pferd", "Ziege"],
];

// Chong opposition pairs (clash / growth-edge axes).
const CHONG_PAIRS: Array<[string, string]> = [
  ["Ratte", "Pferd"],
  ["Büffel", "Ziege"],
  ["Tiger", "Affe"],
  ["Hase", "Hahn"],
  ["Drache", "Hund"],
  ["Schlange", "Schwein"],
];

function isMissing(value: string | undefined | null): boolean {
  return value === undefined || value === null || value === "" || value === "Unbekannt";
}

function stemRelation(a: string, b: string): StemRelationType {
  if (a === b) return "gleich";
  if (SHENG_NEXT[a] === b) return "erzeugt";
  if (SHENG_NEXT[b] === a) return "wird-erzeugt";
  if (KE_TARGET[a] === b) return "kontrolliert";
  if (KE_TARGET[b] === a) return "wird-kontrolliert";
  return "gleich"; // unreachable for the five canonical elements
}

function inSameTriad(a: string, b: string): boolean {
  return SAN_HE_TRIADS.some((triad) => triad.includes(a) && triad.includes(b));
}

function isPairMember(pairs: Array<[string, string]>, a: string, b: string): boolean {
  return pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

function branchRelation(a: string, b: string): BranchRelationType {
  // Priority: gleich > san-he > liu-he > chong > neutral.
  if (a === b) return "gleich";
  if (inSameTriad(a, b)) return "san-he";
  if (isPairMember(LIU_HE_PAIRS, a, b)) return "liu-he";
  if (isPairMember(CHONG_PAIRS, a, b)) return "chong";
  return "neutral";
}

function branchText(animalA: string, animalB: string, relation: BranchRelationType): string {
  switch (relation) {
    case "gleich":
      return `${animalA} und ${animalB} teilen dasselbe Tierzeichen und treffen sich auf einem vertrauten Resonanzfeld.`;
    case "san-he":
      return `${animalA} und ${animalB} stehen in einer San-He-Dreiergruppe und unterstützen einander mit verwandtem Schwung.`;
    case "liu-he":
      return `${animalA} und ${animalB} bilden ein Liu-He-Paar und ergänzen sich in einer stillen, zugewandten Resonanz.`;
    case "chong":
      return `${animalA} und ${animalB} stehen in einer Chong-Gegenachse, die als Wachstumskante eingeladen werden kann.`;
    default:
      return `${animalA} und ${animalB} stehen in einer neutralen Beziehung und lassen Raum für eigene Akzente.`;
  }
}

export function compareBaziPillars(
  pillarsA: ProfileViewModel["bazi"]["pillars"],
  pillarsB: ProfileViewModel["bazi"]["pillars"],
): PillarComparison[] {
  const byKeyA = new Map<string, PillarVM>();
  for (const p of pillarsA) byKeyA.set(p.pillarKey, p);
  const byKeyB = new Map<string, PillarVM>();
  for (const p of pillarsB) byKeyB.set(p.pillarKey, p);

  const result: PillarComparison[] = [];

  for (const key of PILLAR_ORDER) {
    const a = byKeyA.get(key);
    const b = byKeyB.get(key);
    if (!a || !b) continue;

    const stemA = a.stemElement as string;
    const stemB = b.stemElement as string;
    const animalA = a.branchAnimal;
    const animalB = b.branchAnimal;

    if (isMissing(stemA) || isMissing(stemB) || isMissing(animalA) || isMissing(animalB)) {
      continue;
    }

    const sRel = stemRelation(stemA, stemB);
    const bRel = branchRelation(animalA, animalB);

    result.push({
      pillarKey: key,
      stemElementA: stemA,
      stemElementB: stemB,
      animalA,
      animalB,
      stemRelation: sRel,
      branchRelation: bRel,
      text: branchText(animalA, animalB, bRel),
    });
  }

  return result;
}
