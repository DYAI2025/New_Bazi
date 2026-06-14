import React from "react";
import { polar, curvePath } from "../../utils/visual/polar";
import { ELEMENT_AXIS_MAP } from "../../utils/tensionNavigator";
import { demoPreview, type TensionPreviewState } from "../../utils/visual/tensionFieldVisual";
import GlassCard from "../design/GlassCard";
import GoldLeafText from "../design/GoldLeafText";

// FusionHero (RD-2): the calm Observatorium first screen. A stable SVG ring (reused
// TensionNavigator geometry) with ONE active tension arc + a central question card.
// NO score / % / number in the hero (brief). SVG is static; only opacity fades via CSS
// (PR #14: never framer-motion transforms on SVG geometry). prefers-reduced-motion is
// honoured by the global CSS rule (the fade collapses).

const CX = 360;
const CY = 360;
const R = 240;
const NODE_R = 16;

const AXES = Object.values(ELEMENT_AXIS_MAP);

export default function FusionHero({
  preview = demoPreview(),
  onStart,
}: {
  preview?: TensionPreviewState;
  onStart?: () => void;
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const active = AXES.find((a) => a.id === preview.activeAxis) ?? null;
  const activePoint = active ? polar(CX, CY, R, active.angle) : null;
  const oppositePoint = active ? polar(CX, CY, R, active.angle + 180) : null;
  const arc = activePoint && oppositePoint ? curvePath(activePoint, oppositePoint, 90) : null;

  return (
    <div data-testid="fusion-hero" className="relative w-full">
      <div className="relative mx-auto max-w-[560px]">
        <svg viewBox="0 0 720 720" className="w-full h-auto" role="img" aria-label="Bazodiac Spannungsfeld — ein aktives Spannungspaar">
          {/* faint stable ring */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--color-gold-dark)" strokeOpacity={0.35} strokeWidth={1.5} />
          {/* one active tension arc — bright, fades in via CSS opacity only */}
          {arc && (
            <path
              d={arc}
              fill="none"
              stroke="var(--color-gold-muted)"
              strokeWidth={4}
              strokeLinecap="round"
              style={{ opacity: mounted ? 0.9 : 0, transition: "opacity 900ms ease-out" }}
            />
          )}
          {/* 5 ring nodes — active bright, rest dimmed */}
          {AXES.map((a) => {
            const p = polar(CX, CY, R, a.angle);
            const isActive = active?.id === a.id;
            return (
              <circle
                key={a.id}
                cx={p.x}
                cy={p.y}
                r={isActive ? NODE_R : NODE_R * 0.55}
                fill={isActive ? "var(--color-gold-muted)" : "var(--color-obsidian-card)"}
                stroke={isActive ? "var(--color-gold-light)" : "var(--color-gold-dark)"}
                strokeWidth={isActive ? 2 : 1}
                style={{ opacity: isActive ? 1 : mounted ? 0.4 : 0.25, transition: "opacity 700ms ease-out" }}
              />
            );
          })}
          {/* active pole labels only */}
          {active && activePoint && oppositePoint && (
            <>
              <text x={activePoint.x} y={activePoint.y - 26} textAnchor="middle" className="font-mono" fontSize={20} fill="var(--color-gold-light)">{active.poleA}</text>
              <text x={oppositePoint.x} y={oppositePoint.y + 36} textAnchor="middle" className="font-mono" fontSize={20} fill="var(--color-fusion-blue)">{active.poleB}</text>
            </>
          )}
        </svg>

        {/* central question card overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
          <GlassCard accent="gold" className="pointer-events-auto max-w-[300px] p-5 text-center space-y-3">
            {preview.mode === "demo" && (
              <span data-testid="fusion-hero-demo" className="inline-block font-mono text-[8px] uppercase tracking-[0.2em] text-fusion-blue/80 border border-fusion-blue/30 rounded-full px-2 py-0.5">
                Demo
              </span>
            )}
            {preview.question ? (
              <p data-testid="fusion-hero-question" className="font-serif text-base leading-relaxed text-slate-100">
                {preview.question}
              </p>
            ) : (
              <p data-testid="fusion-hero-question" className="text-xs text-stone-400 leading-relaxed">
                Noch keine Daten — gib deine Geburtsdaten ein, dann zeigt das Modell deine erste Spannung.
              </p>
            )}
            <p className="font-mono text-[9px] text-stone-500">Modellergebnis, keine Eigenschaft.</p>
          </GlassCard>
        </div>
      </div>

      <div className="mt-8 text-center space-y-4">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold leading-tight">
          Dein Chart ist kein Urteil.{" "}
          <GoldLeafText as="span">Es ist ein Spannungsfeld.</GoldLeafText>
        </h1>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-stone-400">
          Bazodiac verbindet westliche Astrologie, BaZi und WuXing zu einer berechneten Signatur, die
          Fragen erzeugt statt Identitäten festzulegen. Kein Horoskop, kein Score — eine prüfbare Frage.
        </p>
        <button
          type="button"
          data-testid="fusion-hero-cta"
          onClick={onStart}
          className="inline-flex items-center justify-center rounded-lg border border-gold-light/20 bg-gradient-to-r from-gold-muted to-gold-dark px-6 py-3 font-serif font-bold text-sm tracking-widest text-stone-950 transition duration-300 active:scale-95 cursor-pointer glow-gold"
        >
          Meine erste Spannung anzeigen
        </button>
      </div>
    </div>
  );
}
