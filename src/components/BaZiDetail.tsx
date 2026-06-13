import React from "react";
import { ProfileViewModel } from "../viewmodels/profileViewModel";
import { Columns, Award, Key, ShieldCheck, AlertCircle, Layers } from "lucide-react";
import { ElementType } from "../types";
import { TimeDependencyNote } from "./TimeDependencyNote";
import { getEntry } from "../content/registry";
import { EARTHLY_BRANCHES } from "../utils/astrology";

interface BaZiDetailProps {
  viewModel: ProfileViewModel;
}

/** Pinyin token (e.g. "Jiǎ", "Zǐ") → ASCII id-suffix (e.g. "jia", "zi"). Mirrors Overview.tsx:31. */
function pinyinToken(pinyin: string | null | undefined): string {
  if (!pinyin) return "";
  return pinyin.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** pillarKey (Jahr/Monat/Tag/Stunde) → registry pillar id suffix (year/month/day/hour). */
const PILLAR_AREA_ID: Record<string, string> = {
  Jahr: "pillar.year",
  Monat: "pillar.month",
  Tag: "pillar.day",
  Stunde: "pillar.hour",
};

/**
 * Resolve a branch's verborgene Stämme. The ViewModel propagates hidden stems
 * from index-based REAL engine responses; for legacy/nested payloads the array
 * arrives empty. In that case fall back to the canonical EARTHLY_BRANCHES table
 * (the SAME authoritative table the normalizer uses) keyed by the resolved
 * branch pinyin — never invented. An unresolvable branch ("Unbekannt") matches
 * nothing → returns [] so the UI shows an honest empty-state.
 */
function resolveHiddenStems(pillar: { branchPinyin: string; hiddenStems: string[] }): string[] {
  if (pillar.hiddenStems && pillar.hiddenStems.length > 0) return pillar.hiddenStems;
  const token = pinyinToken(pillar.branchPinyin);
  if (!token) return [];
  const canonical = EARTHLY_BRANCHES.find((b) => pinyinToken(b.name) === token);
  return canonical ? canonical.hiddenStems : [];
}

/** A pillar is genuinely unresolvable when its branch defaulted to "Unbekannt". */
function isPillarResolved(pillar: { stemPinyin: string; branchPinyin: string }): boolean {
  return pillar.branchPinyin !== "Unbekannt" && pillar.stemPinyin !== "Unbekannt";
}

export default function BaZiDetail({ viewModel }: BaZiDetailProps) {
  // Translate element names for German aesthetics
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

  const dayMaster = viewModel.bazi.dayMaster;
  const dayun = viewModel.bazi.dayun;

  if (!viewModel.bazi.available) {
    return (
      <div id="bazi-details" className="space-y-8">
        <div className="glass-card p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-4" data-testid="bazi-missing">
          <Columns className="h-10 w-10 text-gold-muted" />
          <h3 className="font-serif text-2xl font-bold text-gold-light">BaZi-Säulen nicht verfügbar</h3>
          <p className="text-sm text-stone-400 max-w-md">
            FuFirE hat keine BaZi-Schicksalssäulen geliefert. Es werden keine Platzhalter-Stämme oder -Zweige als
            Wahrheit dargestellt.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="bazi-details" className="space-y-8">
      
      {/* Intro section */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center space-x-3 pb-4 border-b border-gold-muted/10 mb-4">
          <Columns className="h-6 w-6 text-gold-muted animate-pulse" />
          <h3 className="font-serif text-2xl font-bold text-gold-light">
            BaZi Suanming (Die 4 Schicksalssäulen)
          </h3>
        </div>
        <p className="text-sm text-stone-400 leading-relaxed max-w-3xl">
          Das BaZi-System dechiffriert das fundamentale universelle Qi Ihrer physischen Manifestation nach dem chinesischen Bauernkalender (Hia-Kalender). Jede Säule steht für eine Ahnenenergie und einen Lebensbereich.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column: Daymaster Detailed Analysis */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-card p-6 rounded-2xl relative overflow-hidden gold-glow-border">
            <h4 className="font-serif text-xl font-bold text-gold-light mb-4 flex items-center space-x-2">
              <Key className="h-5 w-5 text-gold-muted shrink-0" />
              <span>Ihr innerer Wesenskern: Der Tagesmeister (Daymaster)</span>
            </h4>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-gold-muted/5 border border-gold-muted/15 gap-4 font-sans">
                <div className="flex items-center space-x-3">
                  <div className={`h-14 w-14 rounded-lg flex items-center justify-center font-serif text-2xl font-bold ${getElementStyle(dayMaster.element).bg} ${getElementStyle(dayMaster.element).border} ${getElementStyle(dayMaster.element).text}`}>
                    {dayMaster.chinese}
                  </div>
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-gold-muted block">Tagesmeister</span>
                    <h5 className="font-serif text-md font-bold text-slate-100 block">
                      {dayMaster.pinyin} — {dayMaster.element} ({dayMaster.polarity})
                    </h5>
                    <p className="text-xs text-stone-400 mt-0.5">Repräsentiert Ihre Seele, Ihren materiellen Filter und Ihr wahres Ich.</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-[10px] uppercase font-bold text-gold-muted bg-gold-muted/5 border border-gold-muted/15 px-3 py-1 rounded inline-block">
                    Einflussstärke: 1.5x Wichtung
                  </span>
                </div>
              </div>

              {/* Daymaster Text Analysis */}
              <div className="space-y-3 font-sans text-sm">
                <span className="font-mono text-[9px] uppercase tracking-widest text-stone-600 font-bold block mb-1" data-testid="daymaster-source-label">Kuratierte Element-Deutung (im Modell)</span>
                <p className="text-stone-300 leading-relaxed font-light text-md italic">
                  &quot;{dayMaster.coreInterpretation}&quot;
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gold-muted/5">
                  <div className="p-3.5 rounded-lg bg-gold-light/[0.03] border border-gold-muted/20">
                    <span className="font-mono text-[9px] uppercase font-bold text-gold-light tracking-wider block mb-1">
                      Kosmische Potenziale & Stärken
                    </span>
                    <p className="text-xs text-stone-300 font-light leading-relaxed">
                      {dayMaster.strengths}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-lg bg-black/30 border border-gold-dark/20">
                    <span className="font-mono text-[9px] uppercase font-bold text-gold-dark tracking-wider block mb-1">
                      Kosmische Blockaden & Schatten
                    </span>
                    <p className="text-xs text-stone-350 font-light leading-relaxed">
                      {dayMaster.shadow}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Per-pillar depth: Lebensbereich + Stamm + Zweig + verborgene Stämme (FR-010) */}
          <div className="glass-card p-6 rounded-2xl" data-testid="bazi-pillars-detail">
            <h4 className="font-serif text-xl font-bold text-gold-light mb-4 flex items-center space-x-2">
              <Layers className="h-5 w-5 text-gold-muted shrink-0" />
              <span>Die vier Säulen im Detail</span>
            </h4>
            <p className="text-xs text-stone-400 leading-relaxed mb-5">
              Jede der vier Säulen ordnet einen Lebensbereich ein und verbindet einen Himmlischen Stamm mit einem Irdischen Zweig. Die folgenden Einordnungen stammen aus der kuratierten Inhaltsregistry und sind mit den realen Säulenwerten dieses Profils gefüllt.
            </p>

            <div className="space-y-5">
              {viewModel.bazi.pillars.map((pillar) => {
                const areaEntry = getEntry(PILLAR_AREA_ID[pillar.pillarKey] ?? "");
                const stemEntry = getEntry(`stem.${pinyinToken(pillar.stemPinyin)}`);
                const branchEntry = getEntry(`branch.${pinyinToken(pillar.branchPinyin)}`);
                const hidden = resolveHiddenStems(pillar);
                const resolved = isPillarResolved(pillar);
                const stemStyle = getElementStyle(pillar.stemElement);
                const branchStyle = getElementStyle(pillar.branchElement);

                return (
                  <div
                    key={pillar.pillarKey}
                    data-testid={`pillar-detail-${pillar.pillarKey}`}
                    className="p-4 rounded-xl bg-obsidian-deep/40 border border-gold-muted/10 space-y-4"
                  >
                    {/* Header: pillar + Lebensbereich frame */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-gold-muted/5">
                      <div>
                        <span className="font-mono text-[9px] uppercase tracking-widest text-gold-muted block">
                          {pillar.pillarKey}-Säule
                        </span>
                        <h5 className="font-serif text-md font-bold text-gold-light">
                          {areaEntry ? areaEntry.title : `${pillar.pillarKey}-Säule`}
                        </h5>
                      </div>
                      <span className="font-mono text-[10px] text-stone-400 px-2 py-1 rounded bg-gold-muted/5 border border-gold-muted/15 shrink-0">
                        {pillar.stemChinese}{pillar.branchChinese}
                      </span>
                    </div>

                    {resolved ? (
                      <>
                        {/* Lebensbereich short */}
                        {areaEntry && (
                          <div className="space-y-1">
                            <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold block">Lebensbereich</span>
                            <p className="text-xs text-stone-300 font-light leading-relaxed">{areaEntry.short}</p>
                          </div>
                        )}

                        {/* Stamm */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`h-9 w-9 rounded-lg flex items-center justify-center font-serif text-lg font-bold ${stemStyle.bg} ${stemStyle.border} ${stemStyle.text}`}>
                              {pillar.stemChinese}
                            </span>
                            <div>
                              <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold block">Himmlischer Stamm</span>
                              <span className="text-xs text-stone-200 font-medium">
                                {pillar.stemPinyin} — {pillar.stemElement} ({pillar.stemPolarity})
                              </span>
                            </div>
                          </div>
                          {stemEntry && (
                            <p className="text-xs text-stone-400 font-light leading-relaxed">{stemEntry.short}</p>
                          )}
                        </div>

                        {/* Zweig + animal */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`h-9 w-9 rounded-lg flex items-center justify-center font-serif text-lg font-bold ${branchStyle.bg} ${branchStyle.border} ${branchStyle.text}`}>
                              {pillar.branchChinese}
                            </span>
                            <div>
                              <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold block">Irdischer Zweig</span>
                              <span className="text-xs text-stone-200 font-medium">
                                {pillar.branchPinyin} — {pillar.branchAnimal} ({pillar.branchElement})
                              </span>
                            </div>
                          </div>
                          {branchEntry && (
                            <p className="text-xs text-stone-400 font-light leading-relaxed">{branchEntry.short}</p>
                          )}
                        </div>

                        {/* verborgene Stämme (canonical) */}
                        <div className="space-y-1.5">
                          <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold block">Verborgene Stämme</span>
                          <div className="flex flex-wrap gap-2">
                            {hidden.length > 0 ? (
                              hidden.map((stem) => (
                                <span
                                  key={stem}
                                  data-testid={`pillar-${pillar.pillarKey}-hidden`}
                                  className="px-2.5 py-1 rounded bg-gold-muted/5 border border-gold-muted/15 text-gold-light text-[10px] font-mono"
                                >
                                  {stem}
                                </span>
                              ))
                            ) : (
                              <span className="text-stone-600 text-[10px] font-mono">keine verborgenen Stämme verfügbar</span>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-stone-500 font-light leading-relaxed">
                        Für diese Säule liegen keine bestimmten Stamm- und Zweigwerte vor. Es werden keine Platzhalter als Einordnung dargestellt.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hidden Stems analysis */}
          <div className="glass-card p-6 rounded-2xl">
            <h4 className="font-serif text-xl font-bold text-gold-light mb-4 flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-gold-muted shrink-0" />
              <span>Die verborgenen Schätze (Versteckte Himmlische Stämme)</span>
            </h4>
            <p className="text-xs text-stone-400 leading-relaxed mb-4">
              Jedes Tierzeichen trägt tief unter seiner Oberfläche geheime Elementarströme. Diese versteckten Stämme manifestieren sich als unerwartete Talente, verdeckte Sehnsüchte oder schlummernde Potenziale, die im Laufe des Lebens aktiviert werden.
            </p>

            <div className="space-y-3 font-mono text-xs">
              {!viewModel.bazi.hourAvailable && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-obsidian-deep/50 border border-gold-muted/5 gap-4 opacity-60">
                  <span className="text-stone-500 font-medium">Stunde-Zweig</span>
                  <TimeDependencyNote missingFields={["Stundensäule"]} variant="inline" />
                </div>
              )}
              {viewModel.bazi.pillars.map((pillar) => {
                const hidden = resolveHiddenStems(pillar);
                return (
                  <div key={pillar.pillarKey} className="flex items-center justify-between p-3 rounded-lg bg-obsidian-deep/50 border border-gold-muted/5 gap-4">
                    <span className="text-stone-400 font-medium">{pillar.pillarKey}-Zweig — {pillar.branchAnimal} ({pillar.branchPinyin})</span>
                    <div className="flex flex-wrap gap-2 justify-end">
                      {hidden.length > 0 ? (
                        hidden.map((stem) => (
                          <span key={stem} className="px-2.5 py-1 rounded bg-gold-muted/5 border border-gold-muted/15 text-gold-light text-[10px]">
                            {stem}
                          </span>
                        ))
                      ) : (
                        <span className="text-stone-600 text-[10px]">keine verborgenen Stämme verfügbar</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Luck Pillars (Da Yun) */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="glass-card p-6 rounded-2xl flex flex-col justify-between h-full">
            <div>
              <h4 className="font-serif text-xl font-bold text-gold-light mb-1 flex items-center space-x-2">
                <Award className="h-5 w-5 text-gold-muted shrink-0" />
                <span>Glückszyklen (Da Yun)</span>
              </h4>
              <span className="font-mono text-[9px] uppercase text-stone-500 tracking-widest block mb-4">
                10-Jahres Einflusses-Schwingungen
              </span>
            </div>

            {dayun.available ? (
              <div className="space-y-3 font-mono">
                {dayun.cycles.map((p) => {
                  const style = getElementStyle(p.element);
                  return (
                    <div key={p.age} className="p-3 rounded-xl bg-obsidian-deep/50 border border-gold-muted/10 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-stone-500 block leading-tight">{p.age}</span>
                        <span className="text-xs text-stone-200 block font-sans font-medium">{p.stem}</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${style.bg} ${style.border} ${style.text} block font-semibold`}>
                          {p.branch}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-5 rounded-xl border border-gold-muted/10 bg-gold-muted/5 flex flex-col items-center justify-center text-center space-y-4 my-auto">
                <AlertCircle className="h-8 w-8 text-gold-muted animate-pulse" />
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase font-bold text-gold-light block tracking-wider">
                    {dayun.status}
                  </span>
                  <p className="text-[11px] text-stone-400 font-sans leading-relaxed">
                    {dayun.message}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
