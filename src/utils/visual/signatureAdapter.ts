/**
 * signatureAdapter.ts — reine Abbildung ProfileViewModel → SignatureApiInput
 * (Eingangsform der Signatur-Pipeline aus src/lib/signature/signatureData.ts).
 *
 * Ehrlichkeitsregeln wie in deriveTension (src/utils/tensionNavigator.ts):
 * fehlende Fusion oder < 2 Element-Einträge → null → die UI zeigt den
 * Missing-State statt einer erfundenen Signatur.
 */
import type { ProfileViewModel } from "../../viewmodels/profileViewModel";
import type { SignatureApiInput } from "../../lib/signature/signatureData";

export function toSignatureInput(viewModel: ProfileViewModel | null | undefined): SignatureApiInput | null {
  const fusion = viewModel?.fusion;
  if (!fusion || fusion.source === "missing") return null;
  const comparison = fusion.elementalComparison ?? [];
  if (comparison.length < 2) return null;

  const western: Record<string, number> = {};
  const bazi: Record<string, number> = {};
  for (const entry of comparison) {
    if (!Number.isFinite(entry.western) || !Number.isFinite(entry.bazi)) continue;
    western[entry.element] = entry.western;
    bazi[entry.element] = entry.bazi;
  }
  if (Object.keys(western).length < 2) return null;

  const input: SignatureApiInput = {
    wu_xing_vectors: { western_planets: western, bazi_pillars: bazi },
  };

  // coherenceIndex ist 0–100 (Normalizer bevorzugt h_calibrated ×100) —
  // die Shader-Uniform uHarmony erwartet 0..1. Fehlt der Wert, rechnet
  // computeSignature ehrlich lokal (1 − mean(delta) × 0.5) statt zu erfinden.
  if (fusion.coherenceIndex !== null && Number.isFinite(fusion.coherenceIndex)) {
    input.harmony_index = { harmony_index: Math.min(1, Math.max(0, fusion.coherenceIndex / 100)) };
  }

  return input;
}

/**
 * Paar-Variante für den Match-Mode: baut die Partner-Signatur-Eingabe aus
 * dessen eigener West-vs-BaZi-Elementtabelle (SynastryResponse.comparisonB).
 */
export function comparisonToSignatureInput(
  comparison: { element: string; western: number; bazi: number }[] | null | undefined,
): SignatureApiInput | null {
  if (!comparison || comparison.length < 2) return null;
  const western: Record<string, number> = {};
  const bazi: Record<string, number> = {};
  for (const entry of comparison) {
    if (!Number.isFinite(entry.western) || !Number.isFinite(entry.bazi)) continue;
    western[entry.element] = entry.western;
    bazi[entry.element] = entry.bazi;
  }
  if (Object.keys(western).length < 2) return null;
  return { wu_xing_vectors: { western_planets: western, bazi_pillars: bazi } };
}
