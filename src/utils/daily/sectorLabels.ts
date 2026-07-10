/**
 * sectorLabels — die 12 Lebensbereich-Labels für Transit-Sektoren.
 *
 * Die Engine liefert Sektoren 0-INDIZIERT (live verifiziert 2026-07-10:
 * /v1/transit/now, saturn sector 0). Hier wird auf 1–12 normalisiert und
 * NUR gerendert, was in dieser Tabelle steht — unbekannt → null.
 *
 * VORSCHLAG (PO-Bestätigung offen): klassische Häuser-Semantik, wertfrei.
 */
export const SECTOR_LABELS: string[] = [
  "Selbst & Auftreten",
  "Besitz & Sicherheit",
  "Kommunikation & nahes Umfeld",
  "Familie & Wurzeln",
  "Ausdruck & Kreativität",
  "Alltag & Gesundheit",
  "Beziehungen & Gegenüber",
  "Wandel & Bindungstiefe",
  "Horizont & Sinn",
  "Beruf & Öffentlichkeit",
  "Freundeskreis & Zukunft",
  "Rückzug & Inneres",
];

export function sectorLabel(zeroBased: number | null | undefined): string | null {
  if (zeroBased === null || zeroBased === undefined) return null;
  if (!Number.isInteger(zeroBased) || zeroBased < 0 || zeroBased > 11) return null;
  return `${zeroBased + 1} · ${SECTOR_LABELS[zeroBased]}`;
}
