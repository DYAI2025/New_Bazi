import { deriveTension, ELEMENT_AXIS_MAP, type TensionState } from "./tensionNavigator";
import type { ElementalComparisonEntry } from "../viewmodels/profileViewModel";

// ---------------------------------------------------------------------------
// Paar-Spannungsachsen (Synastrie) — pure, dependency-freie Ableitung.
//
// Identische Logik wie deriveTension, aber die Spannung liegt ZWISCHEN zwei
// Personen: difference = wA[element] − wB[element].
// Polaritäts-Konvention (Konzept-Regel: Farben sind nie gut/schlecht):
//   Person-A-Überschuss (difference > 0) → Gold → Pol A
//   Person-B-Überschuss (difference < 0) → Blau → Pol B
// Portabilitäts-Regel (Plan-Annex §6): keine React-/IO-Abhängigkeiten.
// ---------------------------------------------------------------------------

/** Per-Element-Gewicht EINER Person, abgeleitet aus deren Fusionsfeld. */
export interface ElementalWeight {
  element: string;
  weight: number;
}

/**
 * Verdichtet das elemental_comparison einer Person (West- + BaZi-Gewicht je
 * Element) zu EINEM fusionierten Personengewicht: dem Mittel beider Systeme.
 * Wird serverseitig genutzt, um `elementalA`/`elementalB` der Synastrie-
 * Antwort zu bauen — keine neuen Engine-Calls, keine erfundenen Werte.
 */
export function fuseElementalWeights(
  comparison: { element: string; western: number; bazi: number; difference: number }[],
): ElementalWeight[] {
  if (!Array.isArray(comparison)) return [];
  return comparison
    .filter((c) => c && typeof c.element === "string" && Number.isFinite(c.western) && Number.isFinite(c.bazi))
    .map((c) => ({ element: c.element, weight: (c.western + c.bazi) / 2 }));
}

/**
 * Paar-Spannung: Achse mit der größten |wA − wB| wird aktiv. Nutzt dieselbe
 * Ableitung (und damit dasselbe ELEMENT_AXIS_MAP) wie der Natal-Navigator,
 * indem die Paar-Differenz in die comparison-Form gemappt wird.
 *
 * signalLevel ist im MVP fest "spuerbar": Die Paar-Fragen (PAIR_QUESTIONS)
 * existieren nur in dieser Stufe, und es gibt (noch) keine Paar-Kalibrierung,
 * aus der eine ehrliche Stufe ableitbar wäre.
 */
export function derivePairTension(
  elementalA: ElementalWeight[],
  elementalB: ElementalWeight[],
): TensionState | null {
  if (!elementalA?.length || !elementalB?.length) return null;
  const byElementB = new Map(elementalB.map((w) => [w.element, w.weight]));
  const comparison = elementalA
    .filter((a) => byElementB.has(a.element) && Number.isFinite(a.weight) && Number.isFinite(byElementB.get(a.element)!))
    .map((a) => {
      const wB = byElementB.get(a.element)!;
      return { element: a.element, western: a.weight, bazi: wB, difference: a.weight - wB };
    });
  return deriveTension(comparison, "spuerbar");
}

// ---------------------------------------------------------------------------
// Paar-Achsen (REQ-F-005) — pro Achse die Lehne BEIDER Personen nebeneinander.
//
// Im Gegensatz zu derivePairTension (eine aktive Achse aus wA−wB) zeigt
// derivePairAxes pro Element, wohin sich JEDE Person für sich neigt
// (difference = western − bazi innerhalb einer Person) und ob die beiden
// Neigungen auf denselben Pol zeigen ("harmonie") oder strikt gegensätzlich
// sind ("reibung" — eine Wachstumskante, kein Defekt). Reine Ableitung ohne
// Prosa: id/element/poleA/poleB stammen 1:1 aus ELEMENT_AXIS_MAP.
// ---------------------------------------------------------------------------

export interface PairAxis {
  id: string;
  element: string;
  poleA: string;
  poleB: string;
  /** Person-A-Neigung: poleA | poleB | "ausgeglichen" */
  leanA: string;
  /** Person-B-Neigung: poleA | poleB | "ausgeglichen" */
  leanB: string;
  /** "reibung" nur bei strikt gegensätzlichen Polen, sonst "harmonie" */
  mode: "harmonie" | "reibung";
  /** |diffA| + |diffB| — Gesamtausschlag der Achse über beide Personen */
  magnitude: number;
}

const PAIR_AXIS_EPS = 1e-9;

/**
 * Leitet pro Spannungsachse die Neigung beider Personen ab. Iteriert die 5
 * Achsen in Ring-Reihenfolge (nach angle). Fehlt ein Element-Eintrag auf einer
 * Seite, wird genau diese Achse übersprungen (keine erfundenen Werte).
 */
export function derivePairAxes(
  comparisonA: ElementalComparisonEntry[],
  comparisonB: ElementalComparisonEntry[],
): PairAxis[] {
  if (!Array.isArray(comparisonA) || !Array.isArray(comparisonB)) return [];
  if (comparisonA.length === 0 || comparisonB.length === 0) return [];

  const result: PairAxis[] = [];
  const axesInRingOrder = Object.values(ELEMENT_AXIS_MAP).sort((x, y) => x.angle - y.angle);

  for (const axis of axesInRingOrder) {
    const entryA = comparisonA.find((c) => c?.element === axis.element);
    const entryB = comparisonB.find((c) => c?.element === axis.element);
    if (!entryA || !entryB) continue; // Element auf einer Seite nicht vorhanden → Achse auslassen

    const diffA = entryA.difference;
    const diffB = entryB.difference;

    const leanA = lean(diffA, axis.poleA, axis.poleB);
    const leanB = lean(diffB, axis.poleA, axis.poleB);

    const strictlyOpposite =
      (leanA === axis.poleA && leanB === axis.poleB) ||
      (leanA === axis.poleB && leanB === axis.poleA);

    result.push({
      id: axis.id,
      element: axis.element,
      poleA: axis.poleA,
      poleB: axis.poleB,
      leanA,
      leanB,
      mode: strictlyOpposite ? "reibung" : "harmonie",
      magnitude: Math.abs(diffA) + Math.abs(diffB),
    });
  }

  return result;
}

function lean(diff: number, poleA: string, poleB: string): string {
  if (diff > PAIR_AXIS_EPS) return poleA;
  if (diff < -PAIR_AXIS_EPS) return poleB;
  return "ausgeglichen";
}
