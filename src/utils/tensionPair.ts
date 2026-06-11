import { deriveTension, type TensionState } from "./tensionNavigator";

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
    .filter((a) => byElementB.has(a.element) && Number.isFinite(a.weight))
    .map((a) => {
      const wB = byElementB.get(a.element)!;
      return { element: a.element, western: a.weight, bazi: wB, difference: a.weight - wB };
    });
  return deriveTension(comparison, "spuerbar");
}
