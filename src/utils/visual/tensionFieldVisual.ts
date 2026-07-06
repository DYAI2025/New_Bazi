import type { TensionState } from "../tensionNavigator";

// FusionHero preview state (RD-2). Pure: maps a real TensionState (or its absence)
// to the minimal shape the hero renders. The landing has no profile yet, so it
// must render missing until real FuFirE-backed data exists.

export type TensionAxisId =
  | "structure_flow"
  | "inner_outer"
  | "security_freedom"
  | "action_being"
  | "tradition_innovation";

export type PreviewSignal = "leise" | "spuerbar" | "dominant";

export interface TensionPreviewState {
  mode: "computed" | "missing";
  activeAxis: TensionAxisId | null;
  signalLevel: PreviewSignal | null;
  secondaryAxes: TensionAxisId[];
  question: string | null;
  source: "fufire-viewmodel" | "missing";
}

/** One curated reflection question per axis — a question, never an identity claim. */
export const AXIS_QUESTION: Record<TensionAxisId, string> = {
  structure_flow: "Wo gibt dir Struktur Halt — und wo möchte etwas in dir fließen?",
  inner_outer: "Wann zeigst du dich nach außen — und wann ziehst du dich nach innen zurück?",
  security_freedom: "Was brauchst du an Sicherheit — und wo ruft die Freiheit?",
  action_being: "Wo drängt es dich zu handeln — und wo dürfte mehr Sein sein?",
  tradition_innovation: "Was hältst du aus Tradition — und wo lockt das Neue?",
};

/** Neutral missing state — no axis, no signal, no question, no fabricated value. */
export function missingPreview(): TensionPreviewState {
  return {
    mode: "missing",
    activeAxis: null,
    signalLevel: null,
    secondaryAxes: [],
    question: null,
    source: "missing",
  };
}

/** Map a real computed TensionState → preview. Null (no usable tension) → missing. */
export function previewFromTension(state: TensionState | null): TensionPreviewState {
  if (!state || !state.activeAxis) return missingPreview();
  const activeAxis = state.activeAxis.id as TensionAxisId;
  return {
    mode: "computed",
    activeAxis,
    signalLevel: state.signalLevel as PreviewSignal,
    secondaryAxes: state.secondaries.map((s) => s.id as TensionAxisId),
    question: AXIS_QUESTION[activeAxis] ?? null,
    source: "fufire-viewmodel",
  };
}
