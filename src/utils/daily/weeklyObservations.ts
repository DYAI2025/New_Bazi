/**
 * weeklyObservations — Sprachschablonen des Wochenbogens.
 *
 * Bindend: Beobachtung, nie Urteil. Jede belastbare Beobachtung (n≥3) nennt
 * ihren Datenanker ("n von m") und endet in der Prüf-Einladung. Unter n=3
 * ehrlicher Empty-State. Die dominante Antwortart bestimmt die Schablone;
 * bei Gleichstand gewinnt deterministisch kenne_ich vor gegenseite vor teils.
 */
import { dayTypeById } from "./baziLabels";
import type { DayTypeAggregate } from "./reflectionStore";

export interface WeeklyObservation {
  dayType: DayTypeAggregate["dayType"];
  text: string;
  invitation: string | null;
  anchor: string;
}

export function weeklyObservations(aggregates: DayTypeAggregate[]): WeeklyObservation[] {
  return aggregates.map((a) => {
    const label = dayTypeById(a.dayType).label;
    const anchor = "Deine Antworten auf dem Wiedererkennungs-Tap (dieses Gerät)";
    if (!a.reliable) {
      return {
        dayType: a.dayType, anchor, invitation: null,
        text: `${label}: ${a.total} ${a.total === 1 ? "Antwort" : "Antworten"} — noch kein Muster belastbar.`,
      };
    }
    const top = Math.max(a.kenneIch, a.teils, a.gegenseite);
    const kind = top === a.kenneIch ? "kenne_ich" : top === a.gegenseite ? "gegenseite" : "teils";
    const count = `${top} von ${a.total}`;
    const text =
      kind === "kenne_ich"
        ? `An Tagen vom Typ ${label} hast du ${count} Mal „Kenne ich“ gewählt.`
        : kind === "gegenseite"
          ? `An Tagen vom Typ ${label} hast du ${count} Mal die Gegenseite angefragt — die Standard-Lesart scheint dort selten zu passen.`
          : `An Tagen vom Typ ${label} hast du ${count} Mal „Teils“ gewählt — dort bleibt es offenbar gemischt.`;
    return { dayType: a.dayType, anchor, text, invitation: "Prüfe, ob das für dich stimmt." };
  });
}
