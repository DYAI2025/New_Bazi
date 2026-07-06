import React from "react";
import GlassCard from "../design/GlassCard";

// Pre-input state: no static tension preview, no sample result. The CTA enters the
// live flow where the BFF either returns FuFirE data or a real error message.

export default function SpannungsPreview({ onStart }: { onStart?: () => void }) {
  return (
    <GlassCard data-testid="spannungs-preview" className="p-6 sm:p-8 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-serif text-xl font-bold text-gold-light">Live-Berechnung starten</h3>
        <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-gold-muted border border-gold-muted/30 rounded-full px-2 py-0.5">
          FuFirE
        </span>
      </div>

      <div className="space-y-4">
        <p data-testid="spannungs-missing" className="text-sm leading-relaxed text-stone-400">
          Ohne Geburtsdaten liegt noch kein berechnetes Spannungsfeld vor. Nach der Eingabe ruft die App
          die Server-Route auf; wenn FuFirE keine Daten liefert, erscheint dort die echte Fehlermeldung.
        </p>
        <button
          type="button"
          data-testid="spannungs-live-cta"
          onClick={onStart}
          className="rounded-lg border border-gold-light/20 bg-gradient-to-r from-gold-muted to-gold-dark px-5 py-2.5 font-serif text-sm font-bold tracking-wide text-stone-950 transition active:scale-95 cursor-pointer glow-gold"
        >
          Geburtsdaten eingeben
        </button>
        <p className="font-mono text-[9px] text-stone-500">Keine Beispielwerte. Keine statischen Ergebnisse.</p>
      </div>
    </GlassCard>
  );
}
