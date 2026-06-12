import React from "react";
import { ProfileViewModel } from "../viewmodels/profileViewModel";
import { Compass, Orbit, Table, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TimeDependencyNote } from "./TimeDependencyNote";

interface WesternAstrologyProps {
  viewModel: ProfileViewModel;
}

export default function WesternAstrology({ viewModel }: WesternAstrologyProps) {
  // Houses tracking state to keep which index is expanded
  const [expandedHouse, setExpandedHouse] = React.useState<number | null>(null);

  const getAspectColor = (harmony: string) => {
    if (harmony === "harmonisch") return "text-gold-light bg-gold-muted/10 border-gold-muted/25";
    if (harmony === "spannend") return "text-gold-dark bg-gold-dark/15 border-gold-dark/25";
    return "text-stone-400 bg-stone-500/5 border-stone-500/15";
  };

  const toggleHouse = (num: number) => {
    setExpandedHouse(prev => prev === num ? null : num);
  };

  return (
    <div id="western-details" className="space-y-8">
      
      {/* Introduction text */}
      <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
        <div className="flex items-center space-x-3 pb-4 border-b border-gold-muted/10 mb-4">
          <Compass className="h-6 w-6 text-gold-muted animate-spin-slow" />
          <h3 className="font-serif text-2xl font-bold text-gold-light">
            Westlicher Planeten-Kodex
          </h3>
        </div>
        <p className="text-sm text-stone-400 leading-relaxed max-w-3xl">
          Die Stellungen der Himmelskörper zur Sekunde Ihrer Geburt definieren den seelischen Filter Ihres Ausdrucks. Jedes Zeichen, jedes Haus und jede ekliptikale Schwingungskonjunktion prägt Ihre grundlegende Persönlichkeitsmatrix.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: Planetary placements */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card p-6 rounded-2xl">
            <h4 className="font-serif text-xl font-bold text-gold-light mb-4 flex items-center space-x-2">
              <Orbit className="h-4.5 w-4.5 text-gold-muted" />
              <span>Planetare Verteilung</span>
            </h4>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans text-sm">
                <thead>
                  <tr className="border-b border-gold-muted/10 text-stone-500 font-mono text-[9px] uppercase tracking-wider">
                    <th className="pb-2">Körper</th>
                    <th className="pb-2">Ekliptik-Zeichen</th>
                    <th className="pb-2">Haus</th>
                    <th className="pb-2 text-right">Grad-Bogen</th>
                    <th className="pb-2 text-right">Retrograd</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold-muted/5">
                  {viewModel.western.planets.map((p) => (
                    <tr key={p.name} className="hover:bg-gold-muted/5 duration-200">
                      <td className="py-3 flex items-center space-x-3 font-medium text-slate-100">
                        <span className="font-serif text-lg leading-none select-none text-gold-muted">{p.symbol}</span>
                        <span>{p.name}</span>
                      </td>
                      <td className="py-3 text-stone-300">
                        <span>{p.sign}</span>
                        <span className="text-[10px] text-stone-500 ml-1.5 font-mono">({p.element})</span>
                      </td>
                      <td className="py-3 text-mono text-xs text-stone-400">
                        Haus {p.house}
                      </td>
                      <td className="py-3 text-right font-mono text-xs font-semibold text-slate-200">
                        {p.degree.toFixed(1)}°
                      </td>
                      <td className="py-3 text-right">
                        {p.retrograde ? (
                          <span className="text-[10px] font-mono italic text-red-400 bg-red-400/5 px-2 py-0.5 rounded border border-red-400/10">
                            Rx
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono text-stone-600 block">
                            Dir
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sektion Astrologische Häuser (Expandable Accordions) */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h4 className="font-serif text-xl font-bold text-gold-light flex items-center space-x-2 border-b border-gold-muted/10 pb-3">
              <Compass className="h-4.5 w-4.5 text-gold-muted" />
              <span>Die 12 Sektoren des Himmels (Häuser)</span>
            </h4>

            {!viewModel.western.housesAvailable ? (
              <div className="py-2">
                <TimeDependencyNote
                  missingFields={["Aszendent", "Häuser"]}
                  workingFields={["Sonne, Mond und alle Planeten-Zeichen", "Wu-Xing-Analyse", "BaZi Tagessäulen"]}
                />
              </div>
            ) : (
              <>
                <p className="text-xs text-stone-400 leading-relaxed mb-4">
                  Klicken Sie auf ein Lebenshaus, um seine governing Kraft zu offenbaren und zu sehen, welche Ihrer Planeten darin angesiedelt sind.
                </p>

            <div className="space-y-2">
              {viewModel.western.houses.map((house) => {
                const isOpen = expandedHouse === house.number;
                return (
                  <div 
                    key={house.number} 
                    className={`border rounded-xl overflow-hidden transition-all duration-300 font-sans ${
                      isOpen 
                        ? "border-gold-muted/30 bg-gold-muted/5 shadow-inner" 
                        : "border-gold-muted/10 bg-obsidian-deep/30 hover:border-gold-muted/20"
                    }`}
                  >
                    <button
                      onClick={() => toggleHouse(house.number)}
                      className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gold-muted/10 transition-colors cursor-pointer select-none"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-xs text-gold-muted font-bold">
                          Haus {house.number}
                        </span>
                        <span className="font-serif text-sm font-semibold text-stone-200">
                          {house.title}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 shrink-0">
                        {house.planets.length > 0 && (
                          <span className="px-2 py-0.5 text-[9px] font-mono rounded-full bg-gold-muted/10 text-gold-light border border-gold-muted/25">
                            {house.planets.length} {house.planets.length === 1 ? "Himmelskörper" : "Himmelskörper"}
                          </span>
                        )}
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                          className="text-stone-400 hover:text-gold-light"
                        >
                          <ChevronDown className="h-4 w-4 text-stone-400" />
                        </motion.div>
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.04, 0.62, 0.23, 0.98] }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-2 border-t border-gold-muted/5 space-y-3">
                            <div className="text-xs text-stone-400 leading-relaxed space-y-1">
                              <div className="flex flex-wrap gap-x-4 text-[10px] font-mono text-gold-muted uppercase">
                                <span>RESONANZ: {house.signResonance}</span>
                                <span>FOKUS: {house.governs}</span>
                              </div>
                              <p className="text-stone-350">{house.description}</p>
                            </div>

                            {house.planets.length > 0 ? (
                              <div className="pt-2">
                                <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 block mb-1.5">
                                  Aktive Himmelsströme in diesem Haus:
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  {house.planets.map((planet) => (
                                    <div 
                                      key={planet.name} 
                                      className="px-2.5 py-1 rounded bg-gold-muted/5 border border-gold-muted/15 font-mono text-[11px] text-stone-200 flex items-center space-x-1.5"
                                    >
                                      <span className="font-serif select-none text-gold-muted">{planet.symbol}</span>
                                      <span>{planet.name} ({planet.sign} {planet.degree.toFixed(0)}°)</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="text-[10px] font-mono italic text-stone-500 pt-1">
                                Keine markanten Planeten oder Hauptpunkte besetzen dieses Haus. Es verbleibt als ruhige Strömungsbühne.
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
              </>
            )}
          </div>
        </div>

        {/* Right column: Major Planetary Aspects */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-6 rounded-2xl">
            <h4 className="font-serif text-xl font-bold text-gold-light mb-4 flex items-center space-x-2">
              <Table className="h-4.5 w-4.5 text-gold-muted" />
              <span>Geozentrische Aspekt-Muster</span>
            </h4>

            {viewModel.western.aspects.length === 0 ? (
              <p className="text-xs text-stone-500 font-mono italic">Keine markanten Hauptapekte im gewählten Gradbogen gefunden.</p>
            ) : (
              <div className="space-y-4">
                {viewModel.western.aspects.map((asp, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-obsidian-deep/50 border border-gold-muted/10 space-y-2 hover:border-gold-muted/30 duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-serif text-md text-gold-muted font-bold">{asp.symbol}</span>
                        <span className="font-serif text-sm font-semibold text-slate-200">
                          {asp.planet1} {asp.type} {asp.planet2}
                        </span>
                      </div>
                      <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${getAspectColor(asp.harmony)}`}>
                        {asp.harmony}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 font-sans leading-relaxed">
                      {asp.interpretation}
                    </p>
                    <div className="text-[9px] font-mono text-stone-500 text-right">
                      Exaktheit: <span className="font-semibold text-slate-400">{asp.orb.toFixed(1)}° Orb</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
