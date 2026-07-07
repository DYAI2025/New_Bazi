import React from "react";
import { polar, curvePath } from "../../utils/visual/polar";
import { ELEMENT_AXIS_MAP } from "../../utils/tensionNavigator";
import { missingPreview, type TensionPreviewState } from "../../utils/visual/tensionFieldVisual";
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
  preview = missingPreview(),
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
          {/* faint stable ring. Colour via Tailwind fill / stroke utility classes (CSS
              "fill: var()" — reliably supported), not a fill="var()" presentation attribute. */}
          <circle cx={CX} cy={CY} r={R} className="fill-none stroke-gold-dark" strokeOpacity={0.35} strokeWidth={1.5} />
          {/* one active tension arc — bright, fades in via CSS opacity only (PR#14) */}
          {arc && (
            <path
              d={arc}
              className="fill-none stroke-gold-muted"
              strokeWidth={4}
              strokeLinecap="round"
              style={{ opacity: mounted ? 0.9 : 0, transition: "opacity 900ms ease-out" }}
            />
          )}
          {/* 5 ring nodes — active bright, the ≤2 secondary axes medium, the rest dim */}
          {AXES.map((a) => {
            const p = polar(CX, CY, R, a.angle);
            const isActive = active?.id === a.id;
            const isSecondary = preview.secondaryAxes.includes(a.id as never);
            const radius = isActive ? NODE_R : isSecondary ? NODE_R * 0.7 : NODE_R * 0.5;
            const cls = isActive
              ? "fill-gold-muted stroke-gold-light"
              : isSecondary
                ? "fill-obsidian-card stroke-gold-muted"
                : "fill-obsidian-card stroke-gold-dark";
            const opacity = isActive ? 1 : mounted ? (isSecondary ? 0.62 : 0.32) : 0.22;
            return (
              <circle
                key={a.id}
                cx={p.x}
                cy={p.y}
                r={radius}
                className={cls}
                strokeWidth={isActive ? 2 : 1}
                style={{ opacity, transition: "opacity 700ms ease-out" }}
              />
            );
          })}
          {/* active pole labels only */}
          {active && activePoint && oppositePoint && (
            <>
              <text x={activePoint.x} y={activePoint.y - 26} textAnchor="middle" className="font-mono fill-gold-light" fontSize={20}>{active.poleA}</text>
              <text x={oppositePoint.x} y={oppositePoint.y + 36} textAnchor="middle" className="font-mono fill-fusion-blue" fontSize={20}>{active.poleB}</text>
            </>
          )}
        </svg>

        {/* central question card overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
          <GlassCard accent="gold" className="pointer-events-auto max-w-[300px] p-5 text-center space-y-3">
            {preview.question ? (
              <p data-testid="fusion-hero-question" className="font-serif text-base leading-relaxed text-slate-100">
                {preview.question}
              </p>
            ) : (
              <p data-testid="fusion-hero-question" className="text-xs text-stone-400 leading-relaxed">
                Noch keine Engine-Daten. Gib deine Geburtsdaten ein, dann zeigt FuFirE dein erstes berechnetes Spannungsfeld.
              </p>
            )}
            <p className="font-mono text-[9px] text-stone-400">Modellergebnis, keine Eigenschaft.</p>
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
