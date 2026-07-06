import React from "react";
import { ShieldCheck } from "lucide-react";
import GlassCard from "../design/GlassCard";
import { BOUNDARIES, METHOD_LAYERS, MISSING_BEHAVIOR } from "./trustContent";

// RD-5: method (compute vs interpret vs feedback) + the four explicit boundaries +
// missing-data behaviour. The boundaries are the honesty core of the redesign.
export default function MethodTrustSection() {
  return (
    <div data-testid="method-trust" className="space-y-8">
      {/* Method: what is calculated vs interpreted vs user-driven */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {METHOD_LAYERS.map((m) => (
          <GlassCard key={m.title} className="p-4 space-y-1.5">
            <h4 className="font-serif text-base font-bold text-gold-light">{m.title}</h4>
            <p className="text-[13px] leading-relaxed text-stone-300">{m.text}</p>
          </GlassCard>
        ))}
      </div>

      {/* Missing-data behaviour */}
      <p className="text-sm leading-relaxed text-stone-400">{MISSING_BEHAVIOR}</p>

      {/* The four boundaries */}
      <div>
        <div className="flex items-center gap-2 mb-3 text-gold-muted">
          <ShieldCheck className="h-4 w-4" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em]">Grenzen</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BOUNDARIES.map((b) => (
            <GlassCard key={b.title} data-testid="trust-boundary" className="p-4 space-y-1">
              <h5 className="font-serif text-sm font-bold text-slate-100">{b.title}</h5>
              <p className="text-[13px] leading-relaxed text-stone-400">{b.text}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
