import type { TensionAxisState, TensionState } from "./tensionNavigator";

/** Die vier Nutzerreaktionen (Konzept-Regel 8 — Anti-Reification-Loop). */
export type TensionReaction = "trifft" | "teilweise" | "widerstand" | "passt_nicht";

/**
 * System-Antwort auf eine Reaktion:
 * - "vertiefung":   trifft — Achse bleibt, UI stabilisiert, Herkunfts-Hinweis öffnet sich.
 * - "nuance":       teilweise — Achse bleibt, UI teilt den Bogen.
 * - "gegenlesart":  widerstand — Lesart kippt zum Gegenpol, Frage wird neu gewählt.
 * - "alternative":  passt_nicht — nächststärkste, noch nicht abgelehnte Achse.
 * - "kalibrierung": nach 3 Ablehnungen (oder wenn keine Achse mehr übrig ist) —
 *                   ehrlicher Hinweis statt endlosem Durchwechseln.
 */
export type ReactionMode = "vertiefung" | "nuance" | "gegenlesart" | "alternative" | "kalibrierung";

export interface ReactionResult {
  state: TensionState;
  mode: ReactionMode;
  /** Bisher per "passt nicht" abgelehnte Achsen (inkl. der gerade abgelehnten). */
  rejectedAxisIds: string[];
  /**
   * Verschiebung innerhalb der 3er-Fragenbibliothek (Index + Offset mod 3).
   * "widerstand" wählt die Frage aus Sicht des Gegenpols neu (+1); ein
   * Achsenwechsel ("alternative") beginnt wieder bei der Basisfrage (0).
   */
  questionOffset: number;
}

const MAX_REJECTIONS = 3;

function byStrengthDesc(axes: TensionAxisState[]): TensionAxisState[] {
  return [...axes].sort((x, y) => Math.abs(y.difference) - Math.abs(x.difference));
}

/**
 * Pure Transformation: (TensionState, Reaktion) → neuer State + Modus.
 * Wichtig: "widerstand" invertiert NUR die Lesart (`activeLean`) — die
 * Modell-Daten der Achsen (lean aus der Differenz) bleiben unberührt.
 * Konzept: docs/concept/spannungsnavigator-grundregeln.md, Regel 8.
 */
export function applyReaction(
  state: TensionState,
  reaction: TensionReaction,
  rejectedAxisIds: string[] = [],
  questionOffset = 0,
): ReactionResult {
  switch (reaction) {
    case "trifft":
      return { state, mode: "vertiefung", rejectedAxisIds, questionOffset };

    case "teilweise":
      return { state, mode: "nuance", rejectedAxisIds, questionOffset };

    case "widerstand":
      return {
        state: { ...state, activeLean: state.activeLean === "a" ? "b" : "a" },
        mode: "gegenlesart",
        rejectedAxisIds,
        questionOffset: (questionOffset + 1) % 3,
      };

    case "passt_nicht": {
      const rejected = [...rejectedAxisIds, state.activeAxis.id];
      const candidates = byStrengthDesc(state.axes).filter((a) => !rejected.includes(a.id));
      if (rejected.length >= MAX_REJECTIONS || candidates.length === 0) {
        // Ehrlicher Endzustand: keine tragende Achse heute — kein Durchwechseln.
        return { state, mode: "kalibrierung", rejectedAxisIds: rejected, questionOffset };
      }
      const next = candidates[0];
      return {
        state: {
          ...state,
          activeAxis: next,
          activeLean: next.lean,
          secondaries: candidates.slice(1, 3),
        },
        mode: "alternative",
        rejectedAxisIds: rejected,
        questionOffset: 0,
      };
    }
  }
}
