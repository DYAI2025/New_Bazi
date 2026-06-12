import React from "react";
import { ProfileViewModel } from "../viewmodels/profileViewModel";
import { Sparkles, Sun, Moon, Compass, Compass as AscIcon, Calendar, Award, Printer } from "lucide-react";
import { ElementType } from "../types";

interface OverviewProps {
  viewModel: ProfileViewModel;
  onNavigate: (tabId: string) => void;
}

export default function Overview({ viewModel, onNavigate }: OverviewProps) {
  // Translate element names for German aesthetics with colored icons
  const elementColors: { [key in ElementType]: { border: string; bg: string; text: string; glow: string } } = {
    [ElementType.WOOD]: {
      border: "border-emerald-500/30 hover:border-emerald-500/60",
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      glow: "shadow-[0_0_15px_rgba(16,185,129,0.15)]",
    },
    [ElementType.FIRE]: {
      border: "border-red-500/30 hover:border-red-500/60",
      bg: "bg-red-500/10",
      text: "text-red-400",
      glow: "shadow-[0_0_15px_rgba(239,68,68,0.15)]",
    },
    [ElementType.EARTH]: {
      border: "border-amber-500/30 hover:border-amber-500/60",
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      glow: "shadow-[0_0_15px_rgba(245,158,11,0.15)]",
    },
    [ElementType.METAL]: {
      border: "border-slate-300/30 hover:border-slate-300/60",
      bg: "bg-slate-300/10",
      text: "text-slate-300",
      glow: "shadow-[0_0_15px_rgba(148,163,184,0.15)]",
    },
    [ElementType.WATER]: {
      border: "border-blue-500/30 hover:border-blue-500/60",
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      glow: "shadow-[0_0_15px_rgba(59,130,246,0.15)]",
    },
  };

  const getElementStyle = (el: ElementType) => elementColors[el];

  const pillarsMetadata = [
    { key: "Stunde", purpose: "Träume & Spätes Leben" },
    { key: "Tag", purpose: "Selbst & Partnerschaft" },
    { key: "Monat", purpose: "Eltern & Karriere" },
    { key: "Jahr", purpose: "Großeltern & Erbe" }
  ];

  const pMaps = viewModel.bazi.pillars;

  return (
    <div id="overview-dashboard" className="space-y-8">
      
      {/* High-End Greeting Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 gold-glow-border">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-gold-muted animate-ping" />
            <span className="font-mono text-[10px] tracking-widest text-gold-muted uppercase font-bold">
              Kollationierte Seelensignatur geladen
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-gold-light">
            {viewModel.identity.name}
          </h2>
          <p className="font-sans text-sm text-stone-400 max-w-2xl leading-relaxed">
            Geboren am <span className="text-slate-200 font-mono text-xs">{viewModel.identity.birthDate}</span>
            {viewModel.timeKnown && (
              <> um <span className="text-slate-200 font-mono text-xs">{viewModel.identity.birthTime} Uhr</span></>
            )} in{" "}
            <span className="text-slate-200 font-medium">{viewModel.identity.birthPlace}</span>.
            {viewModel.bazi.available && (
              <> Ihr Tagesmeister ist{" "}
              <span className={`font-semibold underline decoration-dotted decoration-gold-muted ${elementColors[viewModel.bazi.dayMaster.element].text}`}>
                {viewModel.bazi.dayMaster.name} ({viewModel.bazi.dayMaster.polarity})
              </span>.</>
            )}
          </p>
        </div>
        
        {/* Action tags trigger */}
        <div className="flex flex-wrap gap-2.5 shrink-0 print:hidden">
          <button 
            id="print-report-btn"
            onClick={() => window.print()}
            className="px-4 py-2 bg-gradient-to-r from-gold-muted to-gold-dark text-stone-950 font-sans text-xs font-bold rounded-lg hover:shadow-lg hover:shadow-gold-muted/20 transition duration-300 flex items-center space-x-2 cursor-pointer"
          >
            <Printer className="h-4 w-4 text-stone-100" />
            <span>Bericht herunterladen</span>
          </button>
          <button 
            onClick={() => onNavigate("daily")}
            className="px-4 py-2 bg-gold-muted/10 border border-gold-muted/30 rounded-lg text-xs font-mono font-medium text-gold-light hover:bg-gold-muted/20 hover:border-gold-light transition duration-300 cursor-pointer"
          >
            Tagespuls abrufen
          </button>
          <button 
            onClick={() => onNavigate("synastry")}
            className="px-4 py-2 bg-obsidian-card/40 border border-white/5 rounded-lg text-xs font-mono font-medium text-stone-100 hover:border-gold-muted/30 hover:text-gold-light transition duration-300 cursor-pointer"
          >
            Seelenpartner abgleichen
          </button>
        </div>
      </div>

      {/* Berechnungs-Hinweise */}
      {viewModel.warnings.length > 0 && (
        <div className="glass-card p-4 rounded-2xl border border-gold-muted/10 bg-obsidian-deep/40" data-testid="overview-warnings">
          <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500 font-bold block mb-2">
            Hinweise zur Berechnung
          </span>
          <ul className="space-y-1">
            {viewModel.warnings.map((w, i) => (
              <li key={i} className="text-xs text-stone-400 font-sans leading-relaxed">{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Astro Triad Grid */}
      <section className="space-y-4">
        <h3 className="font-serif text-xl font-semibold text-gold-light tracking-wide flex items-center space-x-2">
          <Compass className="h-4.5 w-4.5 text-gold-muted" />
          <span>Die Kosmische Triade (Westliches Zodiak)</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* SUN SIGN */}
          <div className="glass-card p-6 rounded-2xl relative flex items-center space-x-4 hover:glow-gold transition">
            <div className="h-14 w-14 rounded-full bg-amber-500/5 border border-gold-muted/20 flex items-center justify-center shrink-0">
              <Sun className="h-6 w-6 text-gold-muted" />
            </div>
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-gold-muted">Sonne</span>
              <h4 className="font-serif text-lg font-bold text-slate-100">{viewModel.western.sunSign}</h4>
              <p className="text-xs text-stone-400 font-sans mt-0.5">Vitalität, Ego & Lebensfunke</p>
            </div>
          </div>

          {/* MOON SIGN */}
          <div className="glass-card p-6 rounded-2xl relative flex items-center space-x-4 hover:glow-gold transition">
            <div className="h-14 w-14 rounded-full bg-blue-500/5 border border-gold-muted/20 flex items-center justify-center shrink-0">
              <Moon className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-gold-muted">Mond</span>
              <h4 className="font-serif text-lg font-bold text-slate-100">{viewModel.western.moonSign}</h4>
              <p className="text-xs text-stone-400 font-sans mt-0.5">Unterbewusstsein, Seele & Intuition</p>
            </div>
          </div>

          {/* ASCENDANT */}
          <div className="glass-card p-6 rounded-2xl relative flex items-center space-x-4 hover:glow-gold transition">
            <div className="h-14 w-14 rounded-full bg-gold-muted/5 border border-gold-muted/20 flex items-center justify-center shrink-0">
              <AscIcon className="h-6 w-6 text-gold-muted" />
            </div>
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-gold-muted">Aszendent</span>
              <h4 className="font-serif text-lg font-bold text-slate-100">
                {viewModel.western.ascendant ?? "—"}
              </h4>
              {viewModel.western.ascendant === null ? (
                <span className="font-mono text-[9px] uppercase tracking-widest text-stone-500 border border-stone-600/30 bg-stone-700/20 px-1.5 py-0.5 rounded">
                  Zeit unbekannt
                </span>
              ) : (
                <p className="text-xs text-stone-400 font-sans mt-0.5">Maske, Aufstieg & Lebensreise</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* BaZi Columns Grid System */}
      {viewModel.bazi.available && (
      <section className="space-y-4">
        <h3 className="font-serif text-xl font-semibold text-gold-light tracking-wide flex items-center space-x-2">
          <Award className="h-4.5 w-4.5 text-gold-muted" />
          <span>Das östliche BaZi-Spektrum (Vier Säulen des Schicksals)</span>
        </h3>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {pMaps.map((pillar, idx) => {
            const stemStyle = getElementStyle(pillar.stemElement);
            const branchStyle = getElementStyle(pillar.branchElement);
            const purpose = pillarsMetadata[idx]?.purpose || "Lebensaspekt";

            return (
              <div 
                key={pillar.pillarKey} 
                className="glass-card rounded-2xl p-5 flex flex-col justify-between space-y-4 text-center hover:scale-[1.02] active:scale-95 duration-400 transition-all border border-gold-muted/10 relative overflow-hidden"
              >
                {/* Visual colored flow bar */}
                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${pillar.stemElement === ElementType.WOOD ? "from-emerald-600 to-emerald-400" : pillar.stemElement === ElementType.FIRE ? "from-red-600 to-red-400" : pillar.stemElement === ElementType.EARTH ? "from-amber-600 to-amber-400" : pillar.stemElement === ElementType.METAL ? "from-slate-400 to-slate-200" : "from-blue-600 to-blue-400"}`} />

                <div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400 block mb-1">
                    {pillar.pillarKey}
                  </span>
                  <span className="text-[10px] text-stone-500 font-sans block italic mb-4">
                    {purpose}
                  </span>
                </div>

                {/* STEM CALLIGRAPHY */}
                <div className="space-y-2 py-4 border-y border-gold-muted/5">
                  <div className={`h-16 w-16 mx-auto rounded-xl ${stemStyle.bg} border ${stemStyle.border} ${stemStyle.glow} flex flex-col items-center justify-center transition-all duration-300`}>
                    <span className="font-serif text-3xl font-bold leading-none">{pillar.stemChinese}</span>
                    <span className="font-mono text-[9px] leading-tight tracking-wider uppercase font-medium">{pillar.stemPinyin}</span>
                  </div>
                  <span className={`text-[11px] font-mono block ${stemStyle.text} font-semibold tracking-wider`}>
                    {pillar.stemPolarity} {pillar.stemElement}
                  </span>
                </div>

                {/* BRANCH CALLIGRAPHY */}
                <div className="space-y-2 pt-2">
                  <div className={`h-16 w-16 mx-auto rounded-xl ${branchStyle.bg} border ${branchStyle.border} ${branchStyle.glow} flex flex-col items-center justify-center transition-all duration-300`}>
                    <span className="font-serif text-3xl font-bold leading-none">{pillar.branchChinese}</span>
                    <span className="font-mono text-[9px] leading-tight tracking-wider uppercase font-medium">{pillar.branchPinyin}</span>
                  </div>
                  <div className="space-y-1">
                    <span className={`text-[11px] font-mono block ${branchStyle.text} font-semibold tracking-wider`}>
                      {pillar.branchPolarity} {pillar.branchElement}
                    </span>
                    <span className="text-xs font-sans text-stone-300 font-medium tracking-wide">
                      ({pillar.branchAnimal})
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      )}

      {/* Wu Xing Element Balance Row */}
      {viewModel.wuxing.available ? (
      <section className="space-y-4">
        <h3 className="font-serif text-xl font-semibold text-gold-light tracking-wide flex items-center space-x-2">
          <Calendar className="h-4.5 w-4.5 text-gold-muted" />
          <span>Wu Xing Elementenverteilung</span>
        </h3>

        <div className="glass-card p-6 rounded-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-6">
            {Object.entries(viewModel.wuxing.distribution).map(([element, percent]) => {
              const style = getElementStyle(element as ElementType);
              return (
                <div key={element} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`font-serif text-md font-semibold ${style.text}`}>{element}</span>
                    <span className="font-mono text-xs text-stone-300">{percent}%</span>
                  </div>
                  {/* Glass progress bar */}
                  <div className="h-2 w-full bg-obsidian-deep rounded-full overflow-hidden border border-white/5">
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${
                        element === ElementType.WOOD ? "from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : 
                        element === ElementType.FIRE ? "from-red-600 to-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : 
                        element === ElementType.EARTH ? "from-amber-600 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : 
                        element === ElementType.METAL ? "from-slate-400 to-slate-200 shadow-[0_0_10px_rgba(148,163,184,0.5)]" : 
                        "from-blue-600 to-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      ) : (
      <section className="space-y-4">
        <div className="glass-card p-6 rounded-2xl text-center text-sm text-stone-400" data-testid="overview-wuxing-missing">
          Wu-Xing-Wandlungsphasen wurden von FuFirE nicht geliefert (missing). Es werden keine erfundenen Werte angezeigt.
        </div>
      </section>
      )}
    </div>
  );
}
