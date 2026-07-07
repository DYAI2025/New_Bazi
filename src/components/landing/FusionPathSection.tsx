import React from "react";
import { Repeat, Sparkles } from "lucide-react";
import GlassCard from "../design/GlassCard";
import { FUSION_PATH_NOTE, PREMIUM_POINTS, PREMIUM_NOTE } from "./trustContent";

// RD-5: the retention loop (stable signature, changing question — no streak pressure) and
// the premium bridge (premium = deeper explanation/history/export, never a stronger truth).
export default function FusionPathSection({ onStart }: { onStart?: () => void }) {
  return (
    <div data-testid="fusion-path" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <GlassCard className="p-5 space-y-2">
        <div className="flex items-center gap-2 text-gold-muted">
          <Repeat className="h-4 w-4" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em]">Wochenrückblick</span>
        </div>
        <h4 className="font-serif text-lg font-bold text-gold-light">Die Signatur bleibt — die Frage bewegt sich</h4>
        <p className="text-[13px] leading-relaxed text-stone-300">{FUSION_PATH_NOTE}</p>
      </GlassCard>

      <GlassCard accent="blue" data-testid="premium-bridge" className="p-5 space-y-3">
        <div className="flex items-center gap-2 text-fusion-blue">
          <Sparkles className="h-4 w-4" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em]">Deep Mode</span>
        </div>
        <ul className="space-y-1.5">
          {PREMIUM_POINTS.map((p) => (
            <li key={p} className="text-[13px] leading-relaxed text-stone-300">· {p}</li>
          ))}
        </ul>
        <p className="font-mono text-[10px] text-stone-400">{PREMIUM_NOTE}</p>
        <button
          type="button"
          data-testid="fusion-path-cta"
          onClick={onStart}
          className="rounded-lg border border-fusion-blue/30 bg-fusion-blue/10 px-5 py-2.5 font-serif text-sm font-bold text-fusion-blue transition active:scale-95 cursor-pointer"
        >
          Mit deinem Feld starten
        </button>
      </GlassCard>
    </div>
  );
}
