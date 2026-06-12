/// <reference types="vite/client" />
import React from "react";
import { ProfileViewModel, FusionData, SignalLevel } from "../viewmodels/profileViewModel";
import { Shield, Activity } from "lucide-react";
import {
  deriveTension,
  type TensionAxisState,
  type TensionState,
} from "../utils/tensionNavigator";
import {
  applyReaction,
  type ReactionMode,
  type TensionReaction,
} from "../utils/tensionReaction";
import { TENSION_QUESTIONS, PAIR_QUESTIONS, selectQuestion } from "../content/tensionQuestions";
import { derivePairTension, type ElementalWeight } from "../utils/tensionPair";

interface TensionNavigatorProps {
  /** Natal-Modus: Spannung West↔BaZi aus dem eigenen Fusionsfeld. */
  viewModel?: ProfileViewModel;
  /** Paar-Modus (Synastrie): Spannung zwischen zwei Personen (A→Gold, B→Blau). */
  pairMode?: boolean;
  elementalA?: ElementalWeight[];
  elementalB?: ElementalWeight[];
  nameA?: string;
  nameB?: string;
}

// ---------------------------------------------------------------------------
// Geometrie — 1:1 portiert aus docs/concept/spannungsnavigator-testtool.html
// (Funktionen polar / curvePath / blend). Zentrum 360/360, R=240. Der viewBox ist
// horizontal auf "-150 0 1020 720" erweitert, damit die seitlich verankerten
// Pol-Labels (polar R+52, anchor start/end) nicht am Rand clippen — gemessen
// (getBBox, Chromium, alle 5 Achsen aktiv): x-Extent [-126..773]. WICHTIG: Der
// viewBox muss horizontal symmetrisch um CX=360 bleiben (-150+1020/2 = 360),
// weil die zentrierte HTML-Fragekarte als Overlay über dem Container liegt und
// nur dann mit dem Ringzentrum fluchtet. Alle SVG-Koordinaten bleiben unverändert.
// WARNUNG (Lehre aus PR #14): KEINE framer-motion-Transforms auf SVG-Elementen —
// Animationen ausschließlich über CSS-Transitions (opacity / stroke-width).
// ---------------------------------------------------------------------------

const CX = 360;
const CY = 360;
const R = 240;
const NODE_R = 20;

function polar(cx: number, cy: number, r: number, deg: number): { x: number; y: number } {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function curvePath(p1: { x: number; y: number }, p2: { x: number; y: number }, curv: number): string {
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} Q ${(mx + (-dy / len) * curv).toFixed(1)} ${(my + (dx / len) * curv).toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
}

function clamp(x: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, x));
}

function hex(n: number): string {
  return Math.round(n).toString(16).padStart(2, "0");
}

/** Gold↔Blau-Mischung: t=1 → Gold (Form/West), t=0 → Blau (Fluss/BaZi). Nie gut/schlecht. */
function blend(t: number): string {
  t = clamp(t, 0, 1);
  const gold = [217, 184, 109];
  const blue = [39, 200, 238];
  return `#${hex(blue[0] + (gold[0] - blue[0]) * t)}${hex(blue[1] + (gold[1] - blue[1]) * t)}${hex(blue[2] + (gold[2] - blue[2]) * t)}`;
}

/** Knotenfarbe aus Modell-Lean + Stärke (Analogon zu fieldColor im Testtool). */
function axisColor(axis: TensionAxisState): string {
  const direction = axis.lean === "a" ? 1 : -1;
  return blend(0.5 + direction * axis.strength * 0.5);
}

// Intensitäts-Stufen (Konzept §5): Sichtbarkeit des Musters, NIE als Zahl im Visual.
const INTENSITY: Record<SignalLevel, { stroke: number; glow: boolean; curvature: number; restNodeOpacity: number }> = {
  leise: { stroke: 2.5, glow: false, curvature: 40, restNodeOpacity: 0.4 },
  spuerbar: { stroke: 4.5, glow: true, curvature: 105, restNodeOpacity: 0.4 },
  dominant: { stroke: 6.5, glow: true, curvature: 170, restNodeOpacity: 0.25 },
};

const SIGNAL_LABEL: Record<SignalLevel, string> = {
  leise: "leise",
  spuerbar: "spürbar",
  dominant: "dominant",
};

// Reaktions-mode-abhängige Fußnote (Wortlaut aus dem Testtool).
const MODE_NOTE: Record<ReactionMode, string> = {
  vertiefung: "Bestätigt: Vertiefung kann geöffnet werden.",
  nuance: "Teilweise: Die Achse teilt sich in Nuancen.",
  gegenlesart: "Widerstand: Der Gegenpol wird mitgeprüft.",
  alternative: "Kalibrierung: Alternative Achse angeboten.",
  kalibrierung: "Heute zeigt das Modell keine Achse, die für dich trägt.",
};

const REACTIONS: { id: TensionReaction; label: string }[] = [
  { id: "trifft", label: "Trifft" },
  { id: "teilweise", label: "Teilweise" },
  { id: "widerstand", label: "Widerstand" },
  { id: "passt_nicht", label: "Passt nicht" },
];

// B-010: Anti-Reification-Intro — einmal pro JS-Session (Modul-Flag, bewusst KEIN
// localStorage: Konzept-Entscheid „per session"). Tab-Wechsel remountet die
// Komponente, deshalb reicht React-State allein nicht.
let introDismissedThisSession = false;
export function __resetIntroForTests(): void {
  // Guard: no-op outside test environment; keeps this export inert in production.
  if (import.meta.env.MODE !== "test") return;
  introDismissedThisSession = false;
}

interface LoopState {
  state: TensionState;
  mode: ReactionMode;
  rejectedAxisIds: string[];
  questionOffset: number;
}

function labelAnchor(angle: number): "start" | "middle" | "end" {
  if (angle > 20 && angle < 160) return "start";
  if (angle > 200 && angle < 340) return "end";
  return "middle";
}

export default function TensionNavigator({
  viewModel,
  pairMode = false,
  elementalA,
  elementalB,
  nameA,
  nameB,
}: TensionNavigatorProps) {
  // Lokales Datum (sv-Locale liefert YYYY-MM-DD) für die deterministische Tagesrotation.
  const todayISO = new Date().toLocaleDateString("sv");

  const base = React.useMemo(() => {
    if (pairMode) return derivePairTension(elementalA ?? [], elementalB ?? []);
    if (!viewModel) return null;
    return deriveTension(viewModel.fusion.elementalComparison, viewModel.fusion.signalLevel);
  }, [pairMode, elementalA, elementalB, viewModel]);

  // Paar-Modus: Personengewichte je Element für die zweifarbigen Knoten,
  // normiert auf das größte Gewicht beider Personen (nur Visual-Skalierung).
  const pairWeights = React.useMemo(() => {
    if (!pairMode) return null;
    const byElement = new Map<string, { wA: number; wB: number }>();
    for (const w of elementalA ?? []) byElement.set(w.element, { wA: w.weight, wB: 0 });
    for (const w of elementalB ?? []) {
      const entry = byElement.get(w.element) ?? { wA: 0, wB: 0 };
      entry.wB = w.weight;
      byElement.set(w.element, entry);
    }
    const maxW = Math.max(0.0001, ...[...byElement.values()].flatMap((e) => [e.wA, e.wB]));
    return { byElement, maxW };
  }, [pairMode, elementalA, elementalB]);

  const [loop, setLoop] = React.useState<LoopState | null>(null);
  const [copied, setCopied] = React.useState(false);
  // Herkunft-Layer: öffnet sich bei Reaktion „Trifft" ODER per explizitem
  // „Herkunft & Methode"-Link (Konzept §12: Premium klappt in Herkunft auf).
  const [originOpen, setOriginOpen] = React.useState(false);
  const [introVisible, setIntroVisible] = React.useState(() => !introDismissedThisSession);
  const dismissIntro = () => {
    introDismissedThisSession = true;
    setIntroVisible(false);
  };

  // Profilwechsel → Reaktions-Loop zurücksetzen.
  React.useEffect(() => {
    setLoop(null);
    setCopied(false);
    setOriginOpen(false);
  }, [base]);

  if (!base) {
    const fusionMissing = !pairMode && viewModel?.fusion.source === "missing";
    return (
      <div id="tension-navigator" className="space-y-8">
        <div
          className="glass-card p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-4"
          data-testid={fusionMissing ? "fusion-missing" : "tension-empty"}
        >
          <Activity className="h-10 w-10 text-gold-muted" />
          <h3 className="font-serif text-2xl font-bold text-gold-light">
            {fusionMissing ? "Fusions-Matrix nicht verfügbar" : "Spannungsnavigator"}
          </h3>
          <p className="text-sm text-stone-400 max-w-md">
            {fusionMissing
              ? `FuFirE hat keine Fusionsdaten geliefert. Es werden bewusst keine erfundenen Kohärenzwerte angezeigt (Quelle: ${viewModel?.fusion.source}).`
              : pairMode
                ? "Für diesen Vergleich liefern die beiden Fusionsfelder keine auswertbare Differenz."
                : "Für dieses Profil liefert das Fusionsfeld keine auswertbare Differenz."}
          </p>
        </div>
      </div>
    );
  }

  const current = loop?.state ?? base;
  const mode = loop?.mode ?? null;
  const calibration = mode === "kalibrierung";
  const act = current.activeAxis;
  const inten = INTENSITY[current.signalLevel];
  const signalLabel = SIGNAL_LABEL[current.signalLevel];

  // Frage des Tages (deterministisch) + Reaktions-Offset (Widerstand: Index+1 mod 3).
  // Paar-Modus: eine kuratierte Paar-Frage je Achse (MVP, Stufe „spürbar").
  // MISSING für N2: Im Paar-Modus ist questionOffset wirkungslos — PAIR_QUESTIONS
  // liefert nur 1 Frage pro Achse, „Widerstand" rotiert also keine Alternativfrage.
  const questions = TENSION_QUESTIONS[act.id][current.signalLevel] as readonly string[];
  const baseQuestion = selectQuestion(act.id, current.signalLevel, todayISO);
  const baseIndex = Math.max(0, questions.indexOf(baseQuestion));
  const question = pairMode
    ? PAIR_QUESTIONS[act.id]
    : questions[(baseIndex + (loop?.questionOffset ?? 0)) % questions.length];

  const handleReaction = (reaction: TensionReaction) => {
    const result = applyReaction(current, reaction, loop?.rejectedAxisIds ?? [], loop?.questionOffset ?? 0);
    setLoop({
      state: result.state,
      mode: result.mode,
      rejectedAxisIds: result.rejectedAxisIds,
      questionOffset: result.questionOffset,
    });
    // „Trifft" stabilisiert die Achse und öffnet den Herkunft-Layer (Konzept §12).
    if (reaction === "trifft") setOriginOpen(true);
  };

  // Share = Text-Snippet (Konzept §6): keine Geburtsdaten, keine Werte —
  // im Paar-Modus auch KEINE Namen („wir" statt Personen).
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(
        pairMode
          ? `Unsere Bazodiac-Paar-Spannung: ${act.poleA} ↔ ${act.poleB}. Frage: ${question}`
          : `Meine Bazodiac-Spannung heute: ${act.poleA} ↔ ${act.poleB}. Frage: ${question}`,
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard nicht verfügbar (z. B. ohne HTTPS) — kein Feedback, kein Fehlerwurf.
    }
  };

  // Hauptbogen: Pol-A-Seite (angle) ↔ Pol-B-Seite (angle+180); Krümmung je Signalstufe,
  // bei Widerstand (Gegenlesart) negiert; bei Teilweise zweiter feiner Parallelbogen.
  const curvature = inten.curvature * (mode === "gegenlesart" ? -1 : 1);
  const pA = polar(CX, CY, R * 0.98, act.angle);
  const pB = polar(CX, CY, R * 0.98, act.angle + 180);
  const activeColor = axisColor(act);
  const leanPole = current.activeLean === "a" ? act.poleA : act.poleB;

  // Herkunft (bei „Trifft"): ehrlich technisch, aber sprachlich — Richtung + Stufe, KEINE Zahlen.
  const originDirection = pairMode
    ? act.difference >= 0
      ? `${nameA ?? "Person A"}-betont`
      : `${nameB ?? "Person B"}-betont`
    : act.difference >= 0
      ? "westlich-betont"
      : "BaZi-betont";

  return (
    <div id="tension-navigator" className="space-y-6" data-testid="tension-navigator">
      <div className="glass-card p-4 sm:p-6 rounded-2xl relative overflow-hidden gold-glow-border">
        {introVisible && (
          <div
            className="flex items-start justify-between gap-3 mb-3 px-2 py-2 rounded-lg border border-gold-muted/15 bg-obsidian-deep/40"
            data-testid="tension-intro"
          >
            <p className="text-xs text-stone-400 leading-relaxed">
              Kein Urteil. Das Modell zeigt eine prüfbare Spannungsfrage — du entscheidest,
              ob sie trägt.
            </p>
            <button
              type="button"
              onClick={dismissIntro}
              aria-label="Intro ausblenden"
              className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-gold-muted hover:text-gold-light transition-colors duration-200"
              data-testid="tension-intro-dismiss"
            >
              Verstanden
            </button>
          </div>
        )}
        <div className="relative">
          <svg
            viewBox="-150 0 1020 720"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Spannungsnavigator: Ring der fünf Spannungsachsen"
            className="w-full h-auto block"
          >
            <defs>
              <filter id="tnGoldGlow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="5" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="tnBlueGlow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="6" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="tnMainGrad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#ffd27a" />
                <stop offset="55%" stopColor={activeColor} />
                <stop offset="100%" stopColor="#27c8ee" />
              </linearGradient>
            </defs>

            {/* Leise Führungsringe */}
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="#d9b86d" strokeOpacity={0.18} strokeWidth={1} />
            <circle cx={CX} cy={CY} r={R * 0.62} fill="none" stroke="#27c8ee" strokeOpacity={0.12} strokeWidth={0.8} strokeDasharray="3 8" />

            {/* Max. 2 Nebenbögen — dünn, 35 % Opazität, nie stärker als der Hauptbogen */}
            {!calibration &&
              current.secondaries.slice(0, 2).map((sec, i) => {
                const start = polar(CX, CY, R * 0.93, act.angle + (i ? 10 : -10));
                const end = polar(CX, CY, R * 0.93, sec.angle);
                return (
                  <path
                    key={sec.id}
                    d={curvePath(start, end, 50 + i * 26)}
                    fill="none"
                    stroke={axisColor(sec)}
                    strokeOpacity={0.35}
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                );
              })}

            {/* Hauptbogen: Gradient Gold→Blau, Krümmung je Signalstufe */}
            {!calibration && (
              <path
                d={curvePath(pA, pB, curvature)}
                fill="none"
                stroke="url(#tnMainGrad)"
                strokeWidth={inten.stroke}
                strokeOpacity={0.85}
                strokeLinecap="round"
                filter={inten.glow ? "url(#tnGoldGlow)" : undefined}
                className="transition-all duration-500"
                data-testid="tension-main-arc"
              />
            )}

            {/* Teilweise: zweiter feiner Parallelbogen */}
            {mode === "nuance" && (
              <path
                d={curvePath(pA, pB, curvature + 40)}
                fill="none"
                stroke="#78e8ff"
                strokeWidth={Math.max(1.5, inten.stroke * 0.45)}
                strokeOpacity={0.55}
                strokeDasharray="8 11"
                strokeLinecap="round"
                filter={inten.glow ? "url(#tnBlueGlow)" : undefined}
                className="transition-all duration-500"
                data-testid="tension-parallel-arc"
              />
            )}

            {/* Widerstand: Gegenpol-Markierung */}
            {mode === "gegenlesart" && (
              <circle
                cx={polar(CX, CY, R * 0.9, act.angle + 180).x}
                cy={polar(CX, CY, R * 0.9, act.angle + 180).y}
                r={32}
                fill="none"
                stroke="#78e8ff"
                strokeWidth={1.4}
                strokeOpacity={0.7}
                strokeDasharray="6 7"
                filter="url(#tnBlueGlow)"
              />
            )}

            {/* Alle 5 Knoten auf Ringpositionen */}
            {current.axes.map((ax) => {
              const isAct = ax.id === act.id;
              const isSec = current.secondaries.some((s) => s.id === ax.id);
              const col = axisColor(ax);
              const p = polar(CX, CY, R, ax.angle);
              const label = polar(CX, CY, R + 52, ax.angle);
              const nodeOpacity = isAct ? 1 : isSec ? 0.75 : inten.restNodeOpacity;
              const nr = NODE_R * (isAct ? 1.25 : 1);
              const anchor = labelAnchor(ax.angle);
              return (
                <g key={ax.id} data-testid={`tension-node-${ax.id}`}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={nr + 8}
                    fill="none"
                    stroke={col}
                    strokeOpacity={isAct ? 0.42 : isSec ? 0.26 : 0.08}
                    strokeWidth={1.1}
                    className="transition-all duration-500"
                  />
                  {pairMode && pairWeights ? (
                    (() => {
                      // Zweifarbiger Knoten: Gold-Halbring = Gewicht Person A,
                      // Blau-Halbring = Gewicht Person B (stroke-dasharray-Halbierung;
                      // statisches SVG-rotate, KEINE animierten Transforms — PR #14).
                      const w = pairWeights.byElement.get(ax.element) ?? { wA: 0, wB: 0 };
                      const half = Math.PI * nr;
                      return (
                        <>
                          <circle cx={p.x} cy={p.y} r={nr} fill="#07101acc" stroke="none" />
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={nr}
                            fill="none"
                            stroke="#d9b86d"
                            strokeOpacity={nodeOpacity}
                            strokeWidth={(isAct ? 1.5 : 1) + 2.5 * (w.wA / pairWeights.maxW)}
                            strokeDasharray={`${half} ${half}`}
                            transform={`rotate(-90 ${p.x} ${p.y})`}
                            filter={isAct && inten.glow ? "url(#tnGoldGlow)" : undefined}
                            className="transition-all duration-500"
                          />
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={nr}
                            fill="none"
                            stroke="#27c8ee"
                            strokeOpacity={nodeOpacity}
                            strokeWidth={(isAct ? 1.5 : 1) + 2.5 * (w.wB / pairWeights.maxW)}
                            strokeDasharray={`${half} ${half}`}
                            strokeDashoffset={-half}
                            transform={`rotate(-90 ${p.x} ${p.y})`}
                            className="transition-all duration-500"
                          />
                        </>
                      );
                    })()
                  ) : (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={nr}
                      fill="#07101acc"
                      stroke={col}
                      strokeOpacity={nodeOpacity}
                      strokeWidth={isAct ? 2 : 1}
                      filter={isAct && inten.glow ? "url(#tnGoldGlow)" : undefined}
                      className="transition-all duration-500"
                    />
                  )}
                  <text
                    x={label.x}
                    y={label.y}
                    textAnchor={anchor}
                    fill={isAct ? "#fff1cd" : isSec ? "#d8f8ff" : "#e8e2d2"}
                    fontSize={isAct ? 15 : 12}
                    fontWeight={isAct ? 700 : 500}
                    letterSpacing={1.5}
                    opacity={isAct ? 1 : isSec ? 0.9 : 0.55}
                    className="transition-all duration-500"
                  >
                    {ax.poleA} ↔ {ax.poleB}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Zentrale Karte — FRAGE ZUERST (Konzept-Regel 1: die Frage ist der Output) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className={`max-w-[300px] sm:max-w-[340px] text-center rounded-2xl border border-gold-muted/40 bg-obsidian-deep/85 backdrop-blur-sm shadow-[0_0_30px_rgba(217,184,109,0.12)] ${current.signalLevel === "leise" ? "p-3 sm:p-4" : "p-4 sm:p-6"}`}
              data-testid="tension-card"
            >
              <p
                className="font-mono text-[9px] uppercase tracking-widest text-gold-muted mb-2"
                data-testid="tension-kicker"
              >
                {pairMode
                  ? `Paar-Spannung · ${nameA ?? "Person A"} ↔ ${nameB ?? "Person B"}`
                  : `Aktive Spannung · ${act.poleA} ↔ ${act.poleB} · ${signalLabel}`}
              </p>
              {calibration ? (
                <p
                  className="font-serif text-lg text-gold-light leading-snug"
                  data-testid="tension-calibration"
                >
                  Heute zeigt das Modell keine Achse, die für dich trägt.
                </p>
              ) : (
                <p
                  className={`font-serif text-gold-light leading-snug ${current.signalLevel === "leise" ? "text-lg" : "text-xl sm:text-2xl"}`}
                  data-testid="tension-question"
                >
                  {question}
                </p>
              )}
              {mode && !calibration && (
                <p className="text-[11px] text-sky-300/80 tracking-wide mt-3" data-testid="tension-mode-note">
                  {MODE_NOTE[mode]}
                </p>
              )}
              <p
                className="font-mono text-[9px] uppercase tracking-widest text-stone-500 mt-3"
                data-testid="tension-footer"
              >
                Modellergebnis, keine Eigenschaft.
              </p>
            </div>
          </div>
        </div>

        {/* Reaktions-Buttons unter der Karte (Konzept-Regel 8).
            Im Kalibrierungs-Zustand verschwinden die Buttons BEWUSST: Das Modell
            bietet keine Achse mehr an, ein weiteres Durchwechseln per „Passt nicht"
            soll nicht möglich sein — Reset erst beim Profilwechsel (useEffect auf base). */}
        {!calibration && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            {REACTIONS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleReaction(r.id)}
                className="px-4 py-2 rounded-full border border-gold-muted/30 bg-obsidian-deep/60 text-sm text-stone-300 hover:border-gold-muted hover:text-gold-light transition-colors duration-200"
                data-testid={`tension-reaction-${r.id}`}
              >
                {r.label}
              </button>
            ))}
            <button
              type="button"
              onClick={handleShare}
              className="px-4 py-2 rounded-full border border-sky-400/30 bg-obsidian-deep/60 text-sm text-sky-200 hover:border-sky-300 transition-colors duration-200"
              data-testid="tension-share"
            >
              {copied ? "Kopiert" : "Teilen"}
            </button>
          </div>
        )}

        {/* Herkunft-Layer: öffnet bei „Trifft" oder explizit. Übernimmt die KOMPLETTE
            bisherige technische Fusions-Detailansicht. Im Herkunft-Layer SIND Zahlen
            erlaubt (Konzept §7: Herkunft zeigt die Ableitung) — im Navigator-Visual
            selbst weiterhin KEINE. */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setOriginOpen((o) => !o)}
            className="font-mono text-[10px] uppercase tracking-widest text-gold-muted hover:text-gold-light transition-colors duration-200 underline underline-offset-4 decoration-gold-muted/40"
            data-testid="tension-origin-toggle"
          >
            Herkunft &amp; Methode
          </button>
        </div>
        {originOpen && (
          <div className="mt-4 rounded-xl border border-gold-muted/15 bg-obsidian-deep/40 p-4 sm:p-6 space-y-6 text-left" data-testid="tension-origin">
            {pairMode ? (
              <>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Abgeleitet aus der {act.element}-Differenz eurer beiden Fusionsfelder ({originDirection}).
                  Personengewicht je Element = Mittel aus West- und BaZi-Anteil des eigenen Fusionsfelds;
                  die aktive Achse ist die mit der größten Differenz zwischen euch. Die Lesart neigt
                  aktuell zum Pol {leanPole}.
                </p>
                {pairWeights && (
                  <p className="text-xs text-stone-500 leading-relaxed font-mono" data-testid="tension-pair-weights">
                    {act.element}: {nameA ?? "Person A"}{" "}
                    {(pairWeights.byElement.get(act.element)?.wA ?? 0).toFixed(2)} vs. {nameB ?? "Person B"}{" "}
                    {(pairWeights.byElement.get(act.element)?.wB ?? 0).toFixed(2)}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Abgeleitet aus der {act.element}-Differenz deines Fusionsfelds ({originDirection}).
                  Ausprägung: {signalLabel} (kalibriert gegen Zufallsbaseline). Die Lesart neigt aktuell
                  zum Pol {leanPole}.
                </p>
                {viewModel && <OriginLayer fusion={viewModel.fusion} />}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Herkunft-Layer: die vollständige technische Fusions-Ansicht (vormals eine
// eigene Tab-Komponente). Kalibrierter Kohärenz-Gauge + Band, Signal-Badge,
// Systembrücke, Engine-Deutung, Element-Doppelbalken (West vs. BaZi + Δ) und
// die größten Spannungsfelder. Gauge bewusst ohne framer-motion (PR #14):
// statischer strokeDashoffset, Übergänge nur per CSS.
// ---------------------------------------------------------------------------

function OriginLayer({ fusion }: { fusion: FusionData }) {
  const {
    coherenceIndex,
    coherenceCalibrated,
    signalLevel,
    signalLevelSuffix,
    coherenceRating,
    coherenceExplanation,
    systemBridge,
    elementalComparison,
    topSignals,
    integrationText,
    source,
  } = fusion;
  const signalLabel = signalLevel === "spuerbar" ? "spürbar" : signalLevel;

  return (
    <div className="space-y-6">
      <p className="text-sm text-stone-400 leading-relaxed">
        Die Fusions-Matrix führt das westliche Grad-Koordinatensystem und die chinesischen
        Säulen-Einflüsse der Fünf Elemente zusammen. Sie bewertet, wie nahtlos deine bewussten
        Willensimpulse (Sonne/Zodiak) und deine primären spirituellen Energieleitungen
        (Tagesmeister/BaZi) im Alltagsfluss miteinander verschmelzen.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Kalibrierter Kohärenz-Gauge */}
        <div className="lg:col-span-4">
          <div className="rounded-2xl border border-gold-muted/10 bg-obsidian-deep/30 p-6 flex flex-col items-center justify-center text-center space-y-5 h-full">
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#9A8F80]">
              {coherenceCalibrated ? "Kalibrierter Kohärenzindex" : "System-Kohärenzindex"}
            </span>

            {coherenceIndex === null ? (
              <div
                className="flex flex-col items-center justify-center text-center space-y-2 py-8"
                data-testid="fusion-coherence-missing"
              >
                <span className="font-serif text-xl text-stone-400">nicht verfügbar</span>
                <span className="font-mono text-[8px] uppercase text-[#9A8F80] tracking-wider max-w-[180px] leading-snug">
                  Die Engine lieferte keinen kalibrierten Kohärenzwert — es wird bewusst
                  keine Zahl erfunden.
                </span>
              </div>
            ) : (
              <div className="relative flex items-center justify-center">
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle cx="80" cy="80" r="70" className="stroke-stone-800" strokeWidth="8" fill="transparent" />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    className="stroke-[#D4AF37] transition-all duration-700"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={440}
                    strokeDashoffset={440 - (440 * coherenceIndex) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-4xl font-serif font-bold text-gold-light tracking-tight" data-testid="fusion-coherence-value">
                    {coherenceIndex}%
                  </span>
                  <span className="font-mono text-[8px] uppercase text-[#9A8F80] tracking-wider mt-0.5 max-w-[110px] text-center leading-snug">
                    {coherenceCalibrated ? "kalibrierte Strukturkongruenz vs. Zufallsbaseline" : "Deckung"}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-md font-serif font-bold text-[#E0D8D0] tracking-wide" data-testid="fusion-coherence-rating">
                {coherenceRating}
              </h4>
              {/* Sichtbarkeit des Kongruenz-Musters vs. Zufallsbaseline —
                  KEINE Spannungsqualität (+1σ = harmonischer als zufällig). */}
              {signalLevel && (
                <span
                  data-testid="fusion-signal-level"
                  className="inline-block font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded border text-gold-muted border-gold-muted/30 bg-gold-muted/10"
                >
                  Ausprägung des Signals: {signalLabel}
                </span>
              )}
              {signalLevelSuffix && (
                <span
                  data-testid="fusion-signal-level-suffix"
                  className="inline-block font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded border text-stone-400 border-stone-600/40 bg-stone-700/20"
                >
                  {signalLevelSuffix}
                </span>
              )}
              <p className="text-xs text-stone-400 leading-relaxed font-light">{coherenceExplanation}</p>
              <span
                data-testid="fusion-source"
                className="inline-block font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded border text-emerald-300 border-emerald-500/30 bg-emerald-500/10"
              >
                Quelle: {source}
              </span>
            </div>
          </div>
        </div>

        {/* Systembrücke, Engine-Deutung, Element-Doppelbalken, Spannungsfelder */}
        <div className="lg:col-span-8">
          <div className="rounded-2xl border border-gold-muted/10 bg-obsidian-deep/30 p-6 space-y-6 h-full">
            <h4 className="font-serif text-lg font-bold text-gold-light border-b border-gold-muted/10 pb-3">
              Synthese &amp; Systembrücke
            </h4>

            <p className="text-sm text-stone-300 font-light leading-relaxed">{systemBridge}</p>

            {/* Die ECHTE fusion_interpretation der Engine */}
            {integrationText && (
              <div className="space-y-2 pt-4 border-t border-gold-muted/5">
                <span className="font-mono text-[10px] uppercase font-bold text-gold-muted tracking-widest block">
                  Fusions-Deutung der Engine
                </span>
                <p
                  data-testid="fusion-interpretation"
                  className="text-sm text-stone-300 font-light leading-relaxed whitespace-pre-line"
                >
                  {integrationText}
                </p>
              </div>
            )}

            {/* Per-Element West-vs-BaZi-Vergleich — die Daten, aus denen die Achsen abgeleitet sind */}
            {elementalComparison.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-gold-muted/5">
                <span className="font-mono text-[10px] uppercase font-bold text-gold-muted tracking-widest block">
                  Element-Resonanz: West vs. BaZi
                </span>
                <div className="space-y-3" data-testid="fusion-elemental-comparison">
                  {elementalComparison.map((cmp) => (
                    <div key={cmp.element} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-serif font-bold text-slate-200">{cmp.element}</span>
                        <span className="font-mono text-[9px] text-stone-500">
                          Δ {cmp.difference >= 0 ? "+" : ""}{cmp.difference.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[8px] uppercase text-stone-500 w-8 shrink-0">West</span>
                        <div className="flex-1 h-1.5 rounded-full bg-stone-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#D4AF37]"
                            style={{ width: `${Math.min(100, Math.max(0, cmp.western * 100))}%` }}
                          />
                        </div>
                        <span className="font-mono text-[9px] text-stone-400 w-9 text-right shrink-0">{cmp.western.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[8px] uppercase text-stone-500 w-8 shrink-0">BaZi</span>
                        <div className="flex-1 h-1.5 rounded-full bg-stone-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-stone-400"
                            style={{ width: `${Math.min(100, Math.max(0, cmp.bazi * 100))}%` }}
                          />
                        </div>
                        <span className="font-mono text-[9px] text-stone-400 w-9 text-right shrink-0">{cmp.bazi.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Größte West/Ost-Differenzen — aus elemental_comparison abgeleitet, nie erfunden */}
            {topSignals.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-gold-muted/5">
                <span className="font-mono text-[10px] uppercase font-bold text-gold-muted tracking-widest block">
                  Größte Spannungsfelder (aus dem Element-Vergleich abgeleitet)
                </span>
                <div className="grid grid-cols-1 gap-4">
                  {topSignals.map((sig, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-obsidian-deep/40 border border-gold-muted/10 space-y-2 hover:border-gold-muted/30 duration-300"
                    >
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-gold-muted" />
                        <strong className="text-xs font-serif font-bold text-slate-200">{sig.trigger}</strong>
                      </div>
                      <p className="text-xs text-stone-400 font-sans leading-relaxed">{sig.interpretation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
