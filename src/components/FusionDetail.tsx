import React from "react";
import { ProfileViewModel } from "../viewmodels/profileViewModel";
import { Sparkles, Compass, Shield, Activity } from "lucide-react";
import { motion } from "motion/react";

interface FusionDetailProps {
  viewModel: ProfileViewModel;
}

export default function FusionDetail({ viewModel }: FusionDetailProps) {
  const { coherenceIndex, coherenceRating, coherenceExplanation, systemBridge, topSignals, source } = viewModel.fusion;
  const fusionMissing = source === "missing";

  // Visual color accents matching the coherence index
  const getCoherenceGaugeColor = (score: number) => {
    if (score > 80) return "from-gold-light to-gold-muted text-gold-light shadow-gold-muted/20";
    if (score < 60) return "from-gold-dark to-stone-800 text-gold-dark shadow-gold-dark/20";
    return "from-gold-muted to-gold-light text-gold-light shadow-gold-muted/10";
  };

  const ringColor = getCoherenceGaugeColor(coherenceIndex);

  if (fusionMissing) {
    return (
      <div id="fusion-container" className="space-y-8">
        <div className="glass-card p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-4" data-testid="fusion-missing">
          <Activity className="h-10 w-10 text-gold-muted" />
          <h3 className="font-serif text-2xl font-bold text-gold-light">Fusions-Matrix nicht verfügbar</h3>
          <p className="text-sm text-stone-400 max-w-md">
            FuFirE hat keine Fusionsdaten geliefert. Es werden bewusst keine erfundenen Kohärenzwerte angezeigt
            (Quelle: {source}).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="fusion-container" className="space-y-8">
      
      {/* Intro section */}
      <div className="glass-card p-6 sm:p-8 rounded-2xl relative overflow-hidden gold-glow-border">
        <div className="flex items-center space-x-3 pb-4 border-b border-gold-muted/10 mb-4 font-serif">
          <Sparkles className="h-6 w-6 text-gold-muted animate-pulse" />
          <h3 className="text-2xl font-bold text-gold-light">
            Die Fusions-Matrix (West-Ost Synthese)
          </h3>
        </div>
        <p className="text-sm text-stone-400 leading-relaxed max-w-3xl">
          Die Fusions-Matrix führt das westliche Grad-Koordinatensystem und die chinesischen Säulen-Einflüsse der Fünf Elemente zusammen. Sie bewertet, wie nahtlos Ihre bewussten Willensimpulse (Sonne/Zodiak) und Ihre primären spirituellen Energieleitungen (Tagesmeister/BaZi) im Alltagsfluss miteinander verschmelzen.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column: Coherence Gauge visual */}
        <div className="lg:col-span-4 flex flex-col justify-between">
          <div className="glass-card p-6 sm:p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-6 h-full relative overflow-hidden">
            
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#9A8F80]">
              System-Kohärenzindex
            </span>

            {/* Circular Gauge */}
            <div className="relative flex items-center justify-center">
              <svg className="w-40 h-40 transform -rotate-90">
                {/* Background Track circle */}
                <circle 
                  cx="80" 
                  cy="80" 
                  r="70" 
                  className="stroke-stone-800" 
                  strokeWidth="8"
                  fill="transparent" 
                />
                {/* Foreground Arc progress circle */}
                <motion.circle 
                  cx="80" 
                  cy="80" 
                  r="70" 
                  className={`stroke-[#D4AF37]`} 
                  strokeWidth="8"
                  fill="transparent" 
                  strokeDasharray={440}
                  initial={{ strokeDashoffset: 440 }}
                  animate={{ strokeDashoffset: 440 - (440 * coherenceIndex) / 100 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>
              {/* Central Text Score */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-4xl font-serif font-bold text-gold-light tracking-tight">
                  {coherenceIndex}%
                </span>
                <span className="font-mono text-[8px] uppercase text-[#9A8F80] tracking-wider mt-0.5">
                  Deckung
                </span>
              </div>
            </div>

            {/* Rating text info */}
            <div className="space-y-2">
              <h4 className="text-md font-serif font-bold text-[#E0D8D0] tracking-wide">
                {coherenceRating}
              </h4>
              <p className="text-xs text-stone-400 leading-relaxed font-light">
                {coherenceExplanation}
              </p>
              <span
                data-testid="fusion-source"
                className={`inline-block font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded border ${fusionMissing ? "text-stone-400 border-stone-500/30 bg-stone-500/10" : "text-emerald-300 border-emerald-500/30 bg-emerald-500/10"}`}
              >
                Quelle: {source}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Bridges & Resonance signals */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-card p-6 sm:p-8 rounded-2xl space-y-6">
            <h4 className="font-serif text-xl font-bold text-gold-light flex items-center space-x-2 border-b border-gold-muted/10 pb-4">
              <Compass className="h-5 w-5 text-gold-muted shrink-0" />
              <span>Synthese & Systembrücke</span>
            </h4>
            
            <p className="text-sm text-stone-300 font-light leading-relaxed">
              {systemBridge}
            </p>

            <div className="space-y-4 pt-4 border-t border-gold-muted/5">
              <span className="font-mono text-[10px] uppercase font-bold text-gold-muted tracking-widest block">
                Top-Schwingungssignale (Konjunktions-Konvolut)
              </span>

              <div className="grid grid-cols-1 gap-4">
                {topSignals.map((sig, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 rounded-xl bg-obsidian-deep/40 border border-gold-muted/10 space-y-2 hover:border-gold-muted/30 duration-300"
                  >
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-gold-muted" />
                      <strong className="text-xs font-serif font-bold text-slate-200">
                        {sig.trigger}
                      </strong>
                    </div>
                    <p className="text-xs text-stone-400 font-sans leading-relaxed">
                      {sig.interpretation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
