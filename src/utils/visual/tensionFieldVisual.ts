// FusionHero preview state (RD-2). The landing has no profile → it renders the static `demo`
// (or `missing`) state; NO fabricated personalized values. The `computed` mode + a
// TensionState→preview mapper were trimmed (code-review: unused on a demo-only landing); the
// type keeps the mode so a future returning-user personalized landing can re-add the mapper.

export type TensionAxisId =
  | "structure_flow"
  | "inner_outer"
  | "security_freedom"
  | "action_being"
  | "tradition_innovation";

export type PreviewSignal = "leise" | "spuerbar" | "dominant";

export interface TensionPreviewState {
  mode: "demo" | "computed" | "missing";
  activeAxis: TensionAxisId | null;
  signalLevel: PreviewSignal | null;
  secondaryAxes: TensionAxisId[];
  question: string | null;
  source: "static-demo" | "fufire-viewmodel" | "missing";
}

/** One curated reflection question per axis — a question, never an identity claim. */
export const AXIS_QUESTION: Record<TensionAxisId, string> = {
  structure_flow: "Wo gibt dir Struktur Halt — und wo möchte etwas in dir fließen?",
  inner_outer: "Wann zeigst du dich nach außen — und wann ziehst du dich nach innen zurück?",
  security_freedom: "Was brauchst du an Sicherheit — und wo ruft die Freiheit?",
  action_being: "Wo drängt es dich zu handeln — und wo dürfte mehr Sein sein?",
  tradition_innovation: "Was hältst du aus Tradition — und wo lockt das Neue?",
};

/** Static, deterministic demo field for the pre-input hero. Clearly labelled `Demo` in UI. */
export function demoPreview(): TensionPreviewState {
  return {
    mode: "demo",
    activeAxis: "structure_flow",
    signalLevel: "spuerbar",
    secondaryAxes: ["tradition_innovation", "action_being"],
    question: AXIS_QUESTION.structure_flow,
    source: "static-demo",
  };
}

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

