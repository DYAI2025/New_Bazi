import React from "react";
import { ProfileViewModel } from "../viewmodels/profileViewModel";
import { Sparkles, Sun, Moon, Compass, Compass as AscIcon, Calendar, Award, Printer } from "lucide-react";
import { ElementType } from "../types";
import { WESTERN_ZODIAC } from "../utils/astrology";
import { getEntry, type ExplanationEntry } from "../content/registry";
import { ExplanationLayer, type ExplanationAbsence } from "./ExplanationLayer";
import { trackEvent, type CardKind } from "../utils/analytics";

interface OverviewProps {
  viewModel: ProfileViewModel;
  onNavigate: (tabId: string) => void;
}

/** Canonical english zodiac id-suffixes, index-aligned to WESTERN_ZODIAC. */
const ZODIAC_EN = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
] as const;

/** German sign name (e.g. "Waage") → registry id (e.g. "zodiac.libra"), or null. */
function zodiacId(germanSign: string | null | undefined): string | null {
  if (!germanSign) return null;
  const idx = WESTERN_ZODIAC.findIndex((z) => z.name === germanSign);
  return idx >= 0 ? `zodiac.${ZODIAC_EN[idx]}` : null;
}

/** Pinyin token (e.g. "Jiǎ", "Zǐ") → ASCII id-suffix (e.g. "jia", "zi"). */
function pinyinToken(pinyin: string | null | undefined): string {
  if (!pinyin) return "";
  return pinyin.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
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

  // --- ExplanationLayer ("door") state ---------------------------------------
  const [layerEntry, setLayerEntry] = React.useState<ExplanationEntry | null>(null);
  const [layerAnchor, setLayerAnchor] = React.useState<string | null>(null);
  const [layerAbsence, setLayerAbsence] = React.useState<ExplanationAbsence | null>(null);
  const [layerCard, setLayerCard] = React.useState<CardKind | undefined>(undefined);

  const closeLayer = React.useCallback(() => {
    setLayerEntry(null);
    setLayerAnchor(null);
    setLayerAbsence(null);
    setLayerCard(undefined);
  }, []);

  /**
   * Open a door: resolve the registry entry by id, build the profile anchor,
   * record card_click, then mount the layer. If the id resolves to no entry the
   * door simply does not open (honest: no invented content).
   */
  const openCard = React.useCallback((id: string | null, anchor: string | null, card: CardKind) => {
    if (!id) return;
    const entry = getEntry(id);
    if (!entry) return;
    trackEvent("card_click", { entryId: id, card });
    setLayerAbsence(null);
    setLayerEntry(entry);
    setLayerAnchor(anchor);
    setLayerCard(card);
  }, []);

  /** Open the honest-absence door (e.g. ascendant without a birth time). */
  const openAbsence = React.useCallback((absence: ExplanationAbsence, card: CardKind) => {
    trackEvent("card_click", { entryId: null, card });
    setLayerEntry(null);
    setLayerAnchor(null);
    setLayerAbsence(absence);
    setLayerCard(card);
  }, []);

  /** Keyboard activation for role="button" cards: Enter or Space. */
  const onCardKeyDown = (e: React.KeyboardEvent, activate: () => void) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      activate();
    }
  };

  // Profile-anchor builders (the real datum spliced into the entry's slot).
  const sunPlanet = viewModel.western.planets.find((p) => p.name === "Sonne");
  const moonPlanet = viewModel.western.planets.find((p) => p.name === "Mond");
  const fmtDeg = (d: number | undefined) =>
    typeof d === "number" && Number.isFinite(d) ? `${d}°` : null;

  const sunAnchor = viewModel.western.sunSign
    ? `Sonne ${fmtDeg(sunPlanet?.degree) ? `${fmtDeg(sunPlanet?.degree)} ` : ""}${viewModel.western.sunSign}`.trim()
    : null;
  const moonAnchor = viewModel.western.moonSign
    ? `Mond ${fmtDeg(moonPlanet?.degree) ? `${fmtDeg(moonPlanet?.degree)} ` : ""}${viewModel.western.moonSign}`.trim()
    : null;

  // Honest-absence panel for an unknown-time ascendant. Mirrors the
  // TimeDependencyNote wording/spirit: states WHY, names the missing birth time,
  // invents no sign.
  const ascendantAbsence: ExplanationAbsence = {
    title: "Aszendent",
    symbol: "↑",
    body:
      "Der Aszendent erfordert die genaue Geburtszeit und kann ohne sie nicht bestimmt werden. " +
      "Vollständig gelten weiterhin die Tagessäulen, alle Planetenzeichen und -grade sowie die Wu-Xing-Analyse. " +
      "Es wird hier bewusst kein Zeichen angezeigt, statt eines aus einer angenommenen Uhrzeit zu errechnen.",
  };

  // Dominant Wu-Xing element (top of the distribution), mapped to element.<de>.
  const dominantElement = viewModel.wuxing.available
    ? (Object.entries(viewModel.wuxing.distribution) as [string, number][])
        .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
    : null;

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
            {viewModel.bazi.available && (() => {
              const dm = viewModel.bazi.dayMaster;
              const dmAnchor = `Tagesmeister ${dm.name} (${dm.element})`;
              const activate = () => openCard(`stem.${pinyinToken(dm.pinyin)}`, dmAnchor, "dayMaster");
              return (
                <> Ihr Tagesmeister ist{" "}
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Tagesmeister ${dm.name} — Einordnung öffnen`}
                  onClick={activate}
                  onKeyDown={(e) => onCardKeyDown(e, activate)}
                  className={`font-semibold underline decoration-dotted decoration-gold-muted cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-muted/60 ${elementColors[dm.element].text}`}
                >
                  {dm.name} ({dm.polarity})
                </span>.</>
              );
            })()}
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
          {/* SUN SIGN — clickable door */}
          {(() => {
            const activate = () => openCard(zodiacId(viewModel.western.sunSign), sunAnchor, "sun");
            return (
              <div
                role="button"
                tabIndex={0}
                aria-label={`Sonne ${viewModel.western.sunSign} — Einordnung öffnen`}
                onClick={activate}
                onKeyDown={(e) => onCardKeyDown(e, activate)}
                className="glass-card p-6 rounded-2xl relative flex items-center space-x-4 hover:glow-gold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-muted/60"
              >
                <div className="h-14 w-14 rounded-full bg-amber-500/5 border border-gold-muted/20 flex items-center justify-center shrink-0">
                  <Sun className="h-6 w-6 text-gold-muted" />
                </div>
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-gold-muted">Sonne</span>
                  <h4 className="font-serif text-lg font-bold text-slate-100">{viewModel.western.sunSign}</h4>
                  <p className="text-xs text-stone-400 font-sans mt-0.5">Vitalität, Ego & Lebensfunke</p>
                </div>
              </div>
            );
          })()}

          {/* MOON SIGN — clickable door */}
          {(() => {
            const activate = () => openCard(zodiacId(viewModel.western.moonSign), moonAnchor, "moon");
            return (
              <div
                role="button"
                tabIndex={0}
                aria-label={`Mond ${viewModel.western.moonSign} — Einordnung öffnen`}
                onClick={activate}
                onKeyDown={(e) => onCardKeyDown(e, activate)}
                className="glass-card p-6 rounded-2xl relative flex items-center space-x-4 hover:glow-gold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-muted/60"
              >
                <div className="h-14 w-14 rounded-full bg-blue-500/5 border border-gold-muted/20 flex items-center justify-center shrink-0">
                  <Moon className="h-6 w-6 text-blue-300" />
                </div>
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-gold-muted">Mond</span>
                  <h4 className="font-serif text-lg font-bold text-slate-100">{viewModel.western.moonSign}</h4>
                  <p className="text-xs text-stone-400 font-sans mt-0.5">Unterbewusstsein, Seele & Intuition</p>
                </div>
              </div>
            );
          })()}

          {/* ASCENDANT — clickable door (honest absence when time unknown) */}
          {(() => {
            const ascAnchor = viewModel.western.ascendant ? `Aszendent ${viewModel.western.ascendant}` : null;
            const activate = () =>
              viewModel.western.ascendant === null
                ? openAbsence(ascendantAbsence, "ascendant")
                : openCard(zodiacId(viewModel.western.ascendant), ascAnchor, "ascendant");
            return (
              <div
                role="button"
                tabIndex={0}
                aria-label="Aszendent — Einordnung öffnen"
                onClick={activate}
                onKeyDown={(e) => onCardKeyDown(e, activate)}
                className="glass-card p-6 rounded-2xl relative flex items-center space-x-4 hover:glow-gold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-muted/60"
              >
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
            );
          })()}
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

            // Door: primary id stem.<stemPinyin>; anchor names both stem and
            // branch (chinese + pinyin + element/animal) so the layer references
            // the real pillar datum, e.g. "Tag-Säule: Jiǎ 甲 (Holz) / Zǐ 子 (Ratte)".
            const stemId = `stem.${pinyinToken(pillar.stemPinyin)}`;
            const pillarAnchor =
              `${pillar.pillarKey}-Säule: ${pillar.stemPinyin} ${pillar.stemChinese} (${pillar.stemElement}) / ` +
              `${pillar.branchPinyin} ${pillar.branchChinese} (${pillar.branchAnimal})`;
            const activate = () => openCard(stemId, pillarAnchor, "pillar");

            return (
              <div
                key={pillar.pillarKey}
                role="button"
                tabIndex={0}
                aria-label={`${pillar.pillarKey}-Säule ${pillar.stemPinyin} / ${pillar.branchPinyin} — Einordnung öffnen`}
                onClick={activate}
                onKeyDown={(e) => onCardKeyDown(e, activate)}
                className="glass-card rounded-2xl p-5 flex flex-col justify-between space-y-4 text-center hover:scale-[1.02] active:scale-95 duration-400 transition-all border border-gold-muted/10 relative overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-muted/60"
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
              const isDominant = element === dominantElement;
              // Door: element.<de-lowercase>; anchor names the element + share.
              const elementId = `element.${element.toLowerCase()}`;
              const elementAnchor = `${element}-Anteil ${percent}%${isDominant ? " (dominantes Element)" : ""}`;
              const activate = () => openCard(elementId, elementAnchor, "element");
              return (
                <div
                  key={element}
                  role="button"
                  tabIndex={0}
                  aria-label={`Element ${element} ${percent}% — Einordnung öffnen`}
                  onClick={activate}
                  onKeyDown={(e) => onCardKeyDown(e, activate)}
                  className="space-y-3 rounded-xl p-2 -m-2 cursor-pointer transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-muted/60 hover:bg-white/5"
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-serif text-md font-semibold ${style.text} ${isDominant ? "underline decoration-dotted decoration-gold-muted" : ""}`}>{element}</span>
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

      <ExplanationLayer
        entry={layerEntry}
        anchorText={layerAnchor}
        absence={layerAbsence}
        card={layerCard}
        onClose={closeLayer}
      />
    </div>
  );
}
