import React from "react";
import { Calculator, Layers, Eye, MessageCircleQuestion, BookOpen, ShieldCheck } from "lucide-react";
import GlassCard from "../design/GlassCard";
import { ENGINE_CARDS, type EngineCard } from "./engineBento";

// RD-4: the "visible engine" bento — six cards explaining how Bazodiac works, each with a
// concrete trust anchor (no fake metrics, no fate/score). Readable at 320px.

const ICON: Record<EngineCard["id"], React.ReactNode> = {
  compute: <Calculator className="h-5 w-5" />,
  map: <Layers className="h-5 w-5" />,
  interpret: <Eye className="h-5 w-5" />,
  reflect: <MessageCircleQuestion className="h-5 w-5" />,
  deepen: <BookOpen className="h-5 w-5" />,
  protect: <ShieldCheck className="h-5 w-5" />,
};

export default function VisibleEngineBento() {
  return (
    <div data-testid="engine-bento" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {ENGINE_CARDS.map((c) => (
        <GlassCard key={c.id} accent="gold" data-testid="engine-card" className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-gold-muted">
            <span className="shrink-0">{ICON[c.id]}</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.18em]">{c.label}</span>
          </div>
          <h4 className="font-serif text-base font-bold text-gold-light">{c.title}</h4>
          <p className="text-[13px] leading-relaxed text-stone-300">{c.sentence}</p>
          <p className="font-mono text-[10px] leading-relaxed text-fusion-blue/80">{c.anchor}</p>
        </GlassCard>
      ))}
    </div>
  );
}
