/**
 * P5-T2 — Content-Registry: Aggregator über die 6 Erklärungs-Domains.
 *
 * Jedes Domain-Modul exportiert ein typisiertes `ExplanationEntry[]`. Dieses
 * Modul fügt sie zu `ALL_ENTRIES` (55 Einträge) zusammen und stellt einen
 * `getEntry(id)`-Lookup bereit. Es enthält KEINE Astro-Logik — nur Re-Export
 * von Erklärungstext. Kanonische IDs/Reihenfolge für stem.* / branch.* stammen
 * aus HEAVENLY_STEMS / EARTHLY_BRANCHES in ../../utils/astrology.
 *
 * Hinweis (TDD/RED): Die 6 Domain-Module existieren in P5-T2 noch NICHT — sie
 * werden in T2-Implementierung (port/reuse/curate gemäß content-sources.md)
 * geschrieben. Solange sie fehlen, schlägt der Import — und damit der
 * Contract-Test — fehl. Das ist die beabsichtigte RED-Stufe.
 */
import { ExplanationEntry } from "./types";
import { zodiacSigns } from "./zodiacSigns";
import { stems } from "./stems";
import { branches } from "./branches";
import { elements } from "./elements";
import { pillars } from "./pillars";
import { houses } from "./houses";

export type { ExplanationEntry } from "./types";

/** Alle 55 Erklärungs-Einträge in stabiler Domain-Reihenfolge. */
export const ALL_ENTRIES: ExplanationEntry[] = [
  ...zodiacSigns,
  ...stems,
  ...branches,
  ...elements,
  ...pillars,
  ...houses,
];

/** Lookup eines Eintrags über seine kanonische ID. */
export function getEntry(id: string): ExplanationEntry | undefined {
  return ALL_ENTRIES.find((entry) => entry.id === id);
}
