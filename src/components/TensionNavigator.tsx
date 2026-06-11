import React from "react";
import { ProfileViewModel, SignalLevel } from "../viewmodels/profileViewModel";
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
import { TENSION_QUESTIONS, selectQuestion } from "../content/tensionQuestions";

interface TensionNavigatorProps {
  viewModel: ProfileViewModel;
}

// ---------------------------------------------------------------------------
// Geometrie — 1:1 portiert aus docs/concept/spannungsnavigator-testtool.html
// (Funktionen polar / curvePath / blend). viewBox 0 0 720 720, Zentrum 360, R=240.
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

export default function TensionNavigator({ viewModel }: TensionNavigatorProps) {
  const { elementalComparison, signalLevel } = viewModel.fusion;

  // Lokales Datum (sv-Locale liefert YYYY-MM-DD) für die deterministische Tagesrotation.
  const todayISO = new Date().toLocaleDateString("sv");

  const base = React.useMemo(
    () => deriveTension(elementalComparison, signalLevel),
    [elementalComparison, signalLevel],
  );

  const [loop, setLoop] = React.useState<LoopState | null>(null);
  const [copied, setCopied] = React.useState(false);

  // Profilwechsel → Reaktions-Loop zurücksetzen.
  React.useEffect(() => {
    setLoop(null);
    setCopied(false);
  }, [base]);

  if (!base) {
    return (
      <div id="tension-navigator" className="space-y-8">
        <div
          className="glass-card p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-4"
          data-testid="tension-empty"
        >
          <h3 className="font-serif text-2xl font-bold text-gold-light">Spannungsnavigator</h3>
          <p className="text-sm text-stone-400 max-w-md">
            Für dieses Profil liefert das Fusionsfeld keine auswertbare Differenz.
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
  const questions = TENSION_QUESTIONS[act.id][current.signalLevel] as readonly string[];
  const baseQuestion = selectQuestion(act.id, current.signalLevel, todayISO);
  const baseIndex = Math.max(0, questions.indexOf(baseQuestion));
  const question = questions[(baseIndex + (loop?.questionOffset ?? 0)) % questions.length];

  const handleReaction = (reaction: TensionReaction) => {
    const result = applyReaction(current, reaction, loop?.rejectedAxisIds ?? [], loop?.questionOffset ?? 0);
    setLoop({
      state: result.state,
      mode: result.mode,
      rejectedAxisIds: result.rejectedAxisIds,
      questionOffset: result.questionOffset,
    });
  };

  // Share = Text-Snippet (Konzept §6): keine Geburtsdaten, keine Werte.
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(
        `Meine Bazodiac-Spannung heute: ${act.poleA} ↔ ${act.poleB}. Frage: ${question}`,
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
  const originDirection = act.difference >= 0 ? "westlich-betont" : "BaZi-betont";

  return (
    <div id="tension-navigator" className="space-y-6" data-testid="tension-navigator">
      <div className="glass-card p-4 sm:p-6 rounded-2xl relative overflow-hidden gold-glow-border">
        <div className="relative">
          <svg
            viewBox="0 0 720 720"
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
                Aktive Spannung · {act.poleA} ↔ {act.poleB} · {signalLabel}
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

        {/* Reaktions-Buttons unter der Karte (Konzept-Regel 8) */}
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

        {/* Herkunft (bei „Trifft"): sprachlich, Richtung + Stufe — keine Zahlen im Visual */}
        {mode === "vertiefung" && (
          <details open className="mt-4 rounded-xl border border-gold-muted/15 bg-obsidian-deep/40 p-4" data-testid="tension-origin">
            <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-widest text-gold-muted">
              Herkunft &amp; Methode
            </summary>
            <p className="text-xs text-stone-400 leading-relaxed mt-2">
              Abgeleitet aus der {act.element}-Differenz deines Fusionsfelds ({originDirection}).
              Ausprägung: {signalLabel} (kalibriert gegen Zufallsbaseline). Die Lesart neigt aktuell
              zum Pol {leanPole}.
            </p>
          </details>
        )}
      </div>
    </div>
  );
}
