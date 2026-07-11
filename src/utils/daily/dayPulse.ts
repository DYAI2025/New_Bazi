/**
 * dayPulse — PRD-Alignment Stufe 1 (prd_report v1.1, Day Pulse / Day Trace).
 *
 * FR-DP-001: Mode aus dem autoritativen Harmony-Index —
 *   spannung für H < 0.45, pulse für 0.45 ≤ H < 0.50, trace für H ≥ 0.50.
 * FR-DP-002: intensity = clamp(|H − 0.45| / 0.55, 0, 1) — deterministisch
 *   serverseitig berechnet, nie von einem Modell geschätzt.
 * FR-DP-008 (Shape): Rat der Sechs als exakt sechs stabile Keys mit Label,
 *   autoritativem Profilwert, availability-Flag und Grund bei Fehlen.
 *   Fehlendes bleibt ehrlich unavailable — nichts wird erfunden.
 *
 * Reine Funktionen, vom BFF (normalizeDaily) konsumiert; die Nutzer-WAHL
 * einer Figur (FR-DP-007) ist bewusst NICHT Teil dieser Stufe.
 */

import { dominantElement } from "./dayTypeSelector";

export type DayPulseMode = "spannung" | "pulse" | "trace";

/** FR-DP-001 — Schwellen exakt wie spezifiziert; kein H → ehrlich null. */
export function deriveMode(harmonyIndex: number | null | undefined): DayPulseMode | null {
  if (harmonyIndex === null || harmonyIndex === undefined || !Number.isFinite(harmonyIndex)) return null;
  if (harmonyIndex < 0.45) return "spannung";
  if (harmonyIndex < 0.5) return "pulse";
  return "trace";
}

/** FR-DP-002 — clamp(|H − 0.45| / 0.55, 0, 1); kein H → ehrlich null. */
export function deriveIntensity(harmonyIndex: number | null | undefined): number | null {
  if (harmonyIndex === null || harmonyIndex === undefined || !Number.isFinite(harmonyIndex)) return null;
  const raw = Math.abs(harmonyIndex - 0.45) / 0.55;
  return Math.min(1, Math.max(0, raw));
}

export type CouncilKey = "sun" | "moon" | "ascendant" | "day_master" | "year_animal" | "dominant_wuxing";

export interface CouncilEntry {
  key: CouncilKey;
  label: string;
  /** Autoritativer Profilwert; null wenn nicht verfügbar. */
  value: string | null;
  available: boolean;
  /** Pflicht bei available:false — ehrlicher Grund statt stiller Lücke. */
  unavailableReason: string | null;
}

export interface CouncilInput {
  sunSign: string | null | undefined;
  moonSign: string | null | undefined;
  ascendantSign: string | null | undefined;
  dayMaster: string | null | undefined;
  elements: Record<string, number> | null | undefined;
}

function entry(key: CouncilKey, label: string, value: string | null, missingReason: string): CouncilEntry {
  const available = Boolean(value && value.trim() !== "");
  return {
    key,
    label,
    value: available ? value : null,
    available,
    unavailableReason: available ? null : missingReason,
  };
}

/**
 * FR-DP-008 — exakt sechs stabile Keys, Reihenfolge fix.
 * year_animal bleibt in dieser Stufe ehrlich unavailable: der Daily-/Bootstrap-
 * Response trägt keine Jahres-Säule; sobald sie dort ankommt, wird der Sitz
 * besetzt statt geraten.
 */
export function councilOfSix(input: CouncilInput): CouncilEntry[] {
  const dom = dominantElement(input.elements);
  return [
    entry("sun", "Sonne", input.sunSign ?? null, "Kein Sonnenzeichen im Profil-Response."),
    entry("moon", "Mond", input.moonSign ?? null, "Kein Mondzeichen im Profil-Response."),
    entry(
      "ascendant",
      "Aszendent",
      input.ascendantSign ?? null,
      "Ohne belastbare Geburtszeit wird kein Aszendent behauptet.",
    ),
    entry("day_master", "Day-Master", input.dayMaster ?? null, "Kein Day-Master im Profil-Response."),
    entry(
      "year_animal",
      "Jahrestier",
      null,
      "Die Jahres-Säule ist im Tages-Response nicht enthalten — der Sitz bleibt leer, bis die Engine sie liefert.",
    ),
    entry(
      "dominant_wuxing",
      "Dominantes Element",
      dom,
      "Keine auswertbare 5-Elemente-Signatur im Profil-Response.",
    ),
  ];
}
