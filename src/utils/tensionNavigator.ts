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
 *
 * Polaritäts-Konvention (BINDEND — A/B ist eine Design-Entscheidung pro Achse,
 * passend zur Elementqualität; difference = western − bazi):
 * | Element | Achse                | Pol A (Gold, West-Überschuss) | Pol B (Blau, BaZi-Überschuss) |
 * | Metall  | structure_flow       | Struktur                      | Fluss                         |
 * | Wasser  | inner_outer          | Außen                         | Innen                         |
 * | Erde    | security_freedom     | Sicherheit                    | Freiheit                      |
 * | Feuer   | action_being         | Handeln                       | Sein                          |
 * | Holz    | tradition_innovation | Innovation                    | Tradition                     |
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
