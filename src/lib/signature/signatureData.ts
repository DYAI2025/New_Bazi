/**
 * signatureData.ts — TypeScript-Port von shared/signature-data.js aus
 * DYAI2025/bazodiac-signature-prototypes (MATHEMATICS.md dort ist die
 * bindende Spezifikation; Formel-Referenzen unten zeigen auf ihre §§).
 *
 * Reine Fusions-Mathematik, keine three.js-Abhängigkeit. Bewusst NICHT
 * portiert: loadSignature() + statisches FALLBACK-Profil — in der App wird
 * ausschließlich aus echten FuFirE-Daten gerechnet (Anti-Fabrication);
 * fehlende Daten führen zum ehrlichen Missing-State, nie zu einem stillen
 * Beispielprofil.
 */

export const ELEMENT_ORDER = ["holz", "feuer", "erde", "metall", "wasser"] as const;
export type ElementId = (typeof ELEMENT_ORDER)[number];

export interface ElementMeta {
  label: string;
  symbol: string;
  color: number;
  desc: string;
}

export const ELEMENT_META: Record<ElementId, ElementMeta> = {
  holz:   { label: "Holz",   symbol: "☳", color: 0x4a7c59, desc: "Wachstum, Expansion, Kreativität" },
  feuer:  { label: "Feuer",  symbol: "☲", color: 0xd43d3d, desc: "Ausdruck, Leidenschaft, Beweis" },
  erde:   { label: "Erde",   symbol: "☶", color: 0x8b6914, desc: "Stabilität, Grounding, Präsenz" },
  metall: { label: "Metall", symbol: "☴", color: 0xc0c0c0, desc: "Struktur, Präzision, Durchsetzung" },
  wasser: { label: "Wasser", symbol: "☵", color: 0x3d6fb4, desc: "Intuition, Tiefe, Anpassung" },
};

export const THEME = {
  bg: 0x050505, obsidian: 0x1a1a1a, gold: 0xd4af37, goldBright: 0xffdf00,
  silver: 0xc0c0c0, friction: 0xff4444, harmony: 0x44ff88, neutral: 0x4488cc,
  generate: 0x44ff88, control: 0xff8844,
} as const;

const GENERATION_CYCLE: [ElementId, ElementId][] = [
  ["holz", "feuer"], ["feuer", "erde"], ["erde", "metall"], ["metall", "wasser"], ["wasser", "holz"],
];
const CONTROL_CYCLE: [ElementId, ElementId][] = [
  ["holz", "erde"], ["erde", "wasser"], ["wasser", "feuer"], ["feuer", "metall"], ["metall", "holz"],
];

export type WuXingVector = Partial<Record<ElementId, number>>;

/** FuFirE-Fusion-Output-Ausschnitt, den die Signatur-Pipeline konsumiert. */
export interface SignatureApiInput {
  wu_xing_vectors: {
    western_planets?: Record<string, number>;
    western?: Record<string, number>;
    bazi_pillars?: Record<string, number>;
    bazi?: Record<string, number>;
  };
  harmony_index?: { harmony_index: number } | null;
  cosmic_state?: number;
  contribution_ledger?: { western?: { planet: string; weight: number }[] };
}

export interface SignatureElement {
  id: ElementId;
  label: string;
  symbol: string;
  color: number;
  strength: number;
  western: number;
  bazi: number;
  delta: number;
  angle: number;
  narrative: string;
}

export interface SignatureEdge {
  from: ElementId;
  to: ElementId;
  type: "generates" | "controls" | "friction";
  strength: number;
  color: number;
  label: string;
}

export interface SignatureNode3D {
  x: number; y: number; z: number;
  weight: number;
  element: ElementId;
}

export interface WuXingSignature {
  elements: SignatureElement[];
  edges: SignatureEdge[];
  nodes3D: SignatureNode3D[];
  vector13D: number[];
  harmony: number;
  cosmicState: number;
  dominant: ElementId;
  growthEdge: ElementId;
  growthEdgeLabel: string;
  narrative: string;
}

/** strength = sqrt(w*b) + 0.3*max(w,b) — MATHEMATICS.md §3.1 */
export function fuseWuXing(western: WuXingVector, bazi: WuXingVector): Record<ElementId, number> {
  const result = {} as Record<ElementId, number>;
  for (const el of ELEMENT_ORDER) {
    const w = western[el] || 0;
    const b = bazi[el] || 0;
    result[el] = Math.min(1, Math.sqrt(w * b) + 0.3 * Math.max(w, b));
  }
  return result;
}

/** delta = |w - b| — MATHEMATICS.md §3.3 */
export function computeDeltas(western: WuXingVector, bazi: WuXingVector): Record<ElementId, number> {
  const deltas = {} as Record<ElementId, number>;
  for (const el of ELEMENT_ORDER) {
    deltas[el] = Math.abs((western[el] || 0) - (bazi[el] || 0));
  }
  return deltas;
}

export function buildElements(
  fused: Record<ElementId, number>,
  western: WuXingVector,
  bazi: WuXingVector,
  deltas: Record<ElementId, number>,
): SignatureElement[] {
  return ELEMENT_ORDER.map((el, i) => {
    const meta = ELEMENT_META[el];
    const strength = fused[el];
    const angle = i * 72;
    const intensity = strength > 0.6 ? "stark präsent" : strength > 0.3 ? "aktiv" : "im Hintergrund";
    const deltaNote = deltas[el] > 0.4 ? " (Spannung: West ≠ Bazi)" : "";
    return {
      id: el, label: meta.label, symbol: meta.symbol, color: meta.color,
      strength, western: western[el] || 0, bazi: bazi[el] || 0, delta: deltas[el], angle,
      narrative: `${meta.label} ${intensity}: ${meta.desc}${deltaNote}`,
    };
  });
}

/** Shēng- + Kè-Zyklus + Friction-Kanten — MATHEMATICS.md §4 */
export function buildEdges(elements: SignatureElement[]): SignatureEdge[] {
  const edges: SignatureEdge[] = [];
  const elMap = Object.fromEntries(elements.map((e) => [e.id, e])) as Record<ElementId, SignatureElement>;

  GENERATION_CYCLE.forEach(([from, to]) => {
    const a = elMap[from], b = elMap[to];
    edges.push({ from, to, type: "generates", strength: Math.min(a.strength, b.strength), color: THEME.generate, label: `${a.label} speist ${b.label}` });
  });

  CONTROL_CYCLE.forEach(([from, to]) => {
    const a = elMap[from], b = elMap[to];
    edges.push({ from, to, type: "controls", strength: a.strength * 0.7, color: THEME.control, label: `${a.label} moduliert ${b.label}` });
  });

  elements.forEach((el) => {
    if (el.delta > 0.3) {
      edges.push({ from: el.id, to: el.id, type: "friction", strength: el.delta, color: THEME.friction, label: `${el.label}: Spannung` });
    }
  });

  return edges;
}

/** Pentagon-Layout, y = strength × 3 — MATHEMATICS.md §5 */
export function build3DPositions(elements: SignatureElement[], radius = 4): SignatureNode3D[] {
  return elements.map((el) => {
    const rad = (el.angle * Math.PI) / 180;
    return { x: Math.cos(rad) * radius, y: el.strength * 3, z: Math.sin(rad) * radius, weight: el.strength, element: el.id };
  });
}

/** harmony = 1 - mean(delta) × 0.5 — MATHEMATICS.md §6.1 (Cross-Check gegen API harmony_index) */
export function computeHarmony(deltas: Record<ElementId, number>): number {
  const mean = ELEMENT_ORDER.reduce((s, el) => s + deltas[el], 0) / ELEMENT_ORDER.length;
  return Math.max(0, Math.min(1, 1 - mean * 0.5));
}

/**
 * 13D-Eingangsvektor (MATHEMATICS.md §1): 7 natale Planetengewichte (echt,
 * aus contribution_ledger.western) + 6 Quiz-Analog-Dimensionen. Solange keine
 * Quiz-Daten existieren, werden die 6 Slots deterministisch aus den fusionierten
 * 5-Element-Stärken + harmony + cosmicState gefüllt (nie zufällig).
 */
function build13DVector(
  apiOutput: SignatureApiInput,
  fused: Record<ElementId, number>,
  harmony: number,
  cosmicState: number,
): number[] {
  const PLANETS = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
  const ledger = apiOutput.contribution_ledger?.western || [];
  const planetWeights = PLANETS.map((name) => {
    const entry = ledger.find((e) => e.planet === name);
    return entry ? Math.min(1, entry.weight / 1.3) : 0.5;
  });
  const tail = [fused.holz, fused.feuer, fused.erde, fused.metall, fused.wasser, (harmony + cosmicState) / 2];
  return [...planetWeights, ...tail];
}

function lowercaseVector(raw: Record<string, number>): WuXingVector {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) out[k.toLowerCase()] = v;
  return out as WuXingVector;
}

/** Volle Pipeline: FuFirE-förmiger API-Output → WuXingSignature (MATHEMATICS.md §6+) */
export function computeSignature(apiOutput: SignatureApiInput): WuXingSignature {
  const rawWestern = apiOutput.wu_xing_vectors.western_planets || apiOutput.wu_xing_vectors.western || {};
  const rawBazi = apiOutput.wu_xing_vectors.bazi_pillars || apiOutput.wu_xing_vectors.bazi || {};

  const western = lowercaseVector(rawWestern);
  const bazi = lowercaseVector(rawBazi);

  const fused = fuseWuXing(western, bazi);
  const deltas = computeDeltas(western, bazi);
  const elements = buildElements(fused, western, bazi, deltas);
  const edges = buildEdges(elements);
  const nodes3D = build3DPositions(elements);

  const sorted = [...elements].sort((a, b) => b.strength - a.strength);
  const dominant = sorted[0];
  const maxDelta = [...elements].sort((a, b) => b.delta - a.delta)[0];

  const apiHarmony = apiOutput.harmony_index && typeof apiOutput.harmony_index === "object"
    ? apiOutput.harmony_index.harmony_index
    : undefined;
  const harmony = typeof apiHarmony === "number" && Number.isFinite(apiHarmony) ? apiHarmony : computeHarmony(deltas);
  const cosmicState = typeof apiOutput.cosmic_state === "number" ? apiOutput.cosmic_state : harmony;
  const vector13D = build13DVector(apiOutput, fused, harmony, cosmicState);

  const narrative =
    `${dominant.label} dominiert (${(dominant.strength * 100).toFixed(0)}% fusionierte Stärke). ` +
    `Harmony: ${(harmony * 100).toFixed(0)}% | Cosmic State: ${(cosmicState * 100).toFixed(0)}%. ` +
    `Wachstumsraum: ${maxDelta.label} (Delta ${(maxDelta.delta * 100).toFixed(0)}%).`;

  return {
    elements, edges, nodes3D, vector13D,
    harmony, cosmicState,
    dominant: dominant.id,
    growthEdge: maxDelta.id,
    growthEdgeLabel: `${maxDelta.label} (Delta ${(maxDelta.delta * 100).toFixed(0)}%)`,
    narrative,
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export interface DynamicsDeltas {
  western?: Record<string, number>;
  bazi?: Record<string, number>;
}

export interface DynamicsState {
  transit_deltas?: DynamicsDeltas;
  quiz_deltas?: DynamicsDeltas & { completed_ratio?: number };
  agent_deltas?: DynamicsDeltas;
  cosmic_weather?: { normalized?: number; kp?: number; source?: string };
  transit_source?: string;
  as_of?: string;
}

/**
 * applyDynamics — DYNAMIC_SIGNATURE_CONCEPT.md §1/§4.
 *
 * Wendet begrenzte Live-Deltas auf die EINGANGS-Vektoren (W₀/B₀) an und gibt
 * eine tiefe Kopie zurück — das fusionierte Ergebnis wird nie direkt berührt.
 * Die Kopie durch das unveränderte computeSignature() schicken, damit alle
 * abgeleiteten Größen konsistent zur kanonischen Mathematik bleiben.
 *
 *   W(t) = clamp01( W₀ + ΔW_transit + ΔW_quiz + ΔW_agent )
 *   B(t) = clamp01( B₀ + ΔB_quiz + ΔB_agent )          (Transits nur W)
 *
 * Bounds pro Layer (Konzeptdoc §1): Transit ±0.10, Quiz ±0.10×completed_ratio,
 * Agent ±0.10. cosmic_weather.normalized überschreibt cosmic_state.
 */
export function applyDynamics(apiOutput: SignatureApiInput, dyn?: DynamicsState | null): SignatureApiInput {
  const copy: SignatureApiInput = typeof structuredClone === "function"
    ? structuredClone(apiOutput)
    : JSON.parse(JSON.stringify(apiOutput));
  if (!dyn) return copy;

  const quizRatio = clamp(dyn.quiz_deltas?.completed_ratio ?? 1, 0, 1);
  // Konzeptdoc §1: Transits modulieren nur W; Quiz + Agent beide Seiten.
  const families: { deltas?: DynamicsDeltas; bound: number; sides: ("western" | "bazi")[] }[] = [
    { deltas: dyn.transit_deltas, bound: 0.10, sides: ["western"] },
    { deltas: dyn.quiz_deltas, bound: 0.10 * quizRatio, sides: ["western", "bazi"] },
    { deltas: dyn.agent_deltas, bound: 0.10, sides: ["western", "bazi"] },
  ];

  const vectors = copy.wu_xing_vectors || ({} as SignatureApiInput["wu_xing_vectors"]);
  const targets: Record<"western" | "bazi", Record<string, number> | undefined> = {
    western: vectors.western_planets || vectors.western,
    bazi: vectors.bazi_pillars || vectors.bazi,
  };

  let vectorsModified = false;
  for (const { deltas, bound, sides } of families) {
    if (!deltas || bound <= 0) continue;
    for (const side of sides) {
      const sideDeltas = deltas[side];
      const target = targets[side];
      if (!sideDeltas || !target) continue;
      const keyMap: Record<string, string> = {};
      for (const k of Object.keys(target)) keyMap[k.toLowerCase()] = k;
      for (const [rawKey, rawDelta] of Object.entries(sideDeltas)) {
        const targetKey = keyMap[rawKey.toLowerCase()];
        if (targetKey === undefined || typeof rawDelta !== "number" || !Number.isFinite(rawDelta)) continue;
        const bounded = clamp(rawDelta, -bound, bound);
        target[targetKey] = clamp((target[targetKey] || 0) + bounded, 0, 1);
        vectorsModified = true;
      }
    }
  }

  // Kalibrierter API-Harmony-Anker und lokales delta-basiertes computeHarmony
  // leben auf unterschiedlichen Skalen — den API-Wert einfach zu löschen würde
  // beim ersten Dynamik-Tick einen Sprung erzeugen. Stattdessen relativ zum
  // lokalen Maß reskalieren: harmony(t) = apiH × h_local(t) / h_local(0).
  if (vectorsModified) {
    const apiH = copy.harmony_index && typeof copy.harmony_index === "object"
      ? copy.harmony_index.harmony_index : undefined;
    if (typeof apiH === "number" && Number.isFinite(apiH)) {
      const localHarmony = (raw: SignatureApiInput) => {
        const rw = raw.wu_xing_vectors?.western_planets || raw.wu_xing_vectors?.western || {};
        const rb = raw.wu_xing_vectors?.bazi_pillars || raw.wu_xing_vectors?.bazi || {};
        return computeHarmony(computeDeltas(lowercaseVector(rw), lowercaseVector(rb)));
      };
      const h0 = localHarmony(apiOutput);
      const ht = localHarmony(copy);
      (copy.harmony_index as { harmony_index: number }).harmony_index =
        h0 > 0 ? clamp(apiH * (ht / h0), 0, 1) : apiH;
    } else {
      delete copy.harmony_index; // kein kalibrierter Anker → computeSignature rechnet lokal
    }
  }

  if (typeof dyn.cosmic_weather?.normalized === "number" && Number.isFinite(dyn.cosmic_weather.normalized)) {
    copy.cosmic_state = clamp(dyn.cosmic_weather.normalized, 0, 1);
  }

  return copy;
}

export interface OverlayElement {
  id: ElementId;
  label: string;
  color: number;
  deltaOverlay: number;
  resonance: number;
  frictionOverlay: number;
}

export interface SignatureOverlay {
  perElement: OverlayElement[];
  coherence: number;
  narrative: string;
}

/**
 * computeOverlay — Overlay/Match-Mode für zwei Signaturen, MATHEMATICS.md §9.1:
 *
 *   delta_overlay[e]    = |strength_A[e] − strength_B[e]|
 *   resonance[e]        = 1 − delta_overlay[e]
 *   friction_overlay[e] = delta_overlay[e] × (1 − harmony_A) × (1 − harmony_B)
 *
 * Plus: coherence = Kosinus-Ähnlichkeit der beiden 5D-Stärkevektoren (0..1).
 */
export function computeOverlay(sigA: WuXingSignature, sigB: WuXingSignature): SignatureOverlay {
  const hA = sigA.harmony ?? 0;
  const hB = sigB.harmony ?? 0;
  const mapA = Object.fromEntries(sigA.elements.map((e) => [e.id, e]));
  const mapB = Object.fromEntries(sigB.elements.map((e) => [e.id, e]));

  const perElement = ELEMENT_ORDER.map((id) => {
    const meta = ELEMENT_META[id];
    const sA = mapA[id]?.strength || 0;
    const sB = mapB[id]?.strength || 0;
    const deltaOverlay = Math.abs(sA - sB);
    return {
      id,
      label: meta.label,
      color: meta.color,
      deltaOverlay,
      resonance: 1 - deltaOverlay,
      frictionOverlay: deltaOverlay * (1 - hA) * (1 - hB),
    };
  });

  let dot = 0, normA = 0, normB = 0;
  for (const id of ELEMENT_ORDER) {
    const a = mapA[id]?.strength || 0;
    const b = mapB[id]?.strength || 0;
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  const coherence = denom > 0 ? clamp(dot / denom, 0, 1) : 0;

  const strongestResonance = perElement.reduce((best, e) => (e.resonance > best.resonance ? e : best));
  const strongestFriction = perElement.reduce((worst, e) => (e.frictionOverlay > worst.frictionOverlay ? e : worst));
  const narrative =
    `Stärkster Gleichklang: ${strongestResonance.label}. ` +
    `Stärkste Reibung: ${strongestFriction.label}. ` +
    `Beide Werte sind Modellergebnisse aus den fusionierten Elementstärken.`;

  return { perElement, coherence, narrative };
}
