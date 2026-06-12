import React from "react";
import { ProfileViewModel } from "../viewmodels/profileViewModel";
import { Flame, ShieldAlert, CheckCircle, Compass, Star } from "lucide-react";
import { ElementType } from "../types";
import { motion } from "motion/react";

interface WuXingDetailProps {
  viewModel: ProfileViewModel;
}

// Map of translations and properties for elements in the SVG cycle nodes
const elementMeta = {
  [ElementType.WOOD]: { name: "Holz", symbol: "木", color: "text-emerald-400 border-emerald-500/30", colorHex: "#10b981", bg: "bg-emerald-500/10" },
  [ElementType.FIRE]: { name: "Feuer", symbol: "火", color: "text-red-400 border-red-500/30", colorHex: "#ef4444", bg: "bg-red-500/10" },
  [ElementType.EARTH]: { name: "Erde", symbol: "土", color: "text-amber-400 border-amber-500/30", colorHex: "#f59e0b", bg: "bg-amber-500/10" },
  [ElementType.METAL]: { name: "Metall", symbol: "金", color: "text-slate-300 border-slate-300/30", colorHex: "#94a3b8", bg: "bg-slate-300/10" },
  [ElementType.WATER]: { name: "Wasser", symbol: "水", color: "text-blue-400 border-blue-500/30", colorHex: "#3b82f6", bg: "bg-blue-500/10" },
};

// Text definitions of cycles for each element
const elementDetailsText = {
  [ElementType.WOOD]: {
    phase: "Holz (Mù) — Frühling & Wachstum",
    productiveDesc: "Holz nährt das Feuer: Es opfert seine organische Substanz, um die lodernde Flamme von Ausdruck und Aktivität anzufachen.",
    destructiveDesc: "Holz kontrolliert die Erde: Seine Wurzeln bohren sich tief in den Boden und beherrschen die Festigkeit der Erdmasse.",
    strengths: "Vision, Flexibilität, Erneuerung, Tatendrang.",
    reflectionText: "Beginnen Sie neue schöpferische Zyklen, aber hüten Sie sich vor blockierender Sturheit oder impulsiven Ausbrüchen."
  },
  [ElementType.FIRE]: {
    phase: "Feuer (Huǒ) — Sommer & Leidenschaft",
    productiveDesc: "Feuer gebiert die Erde: Als Asche sinkt das verglommene Feuer herab und nährt die schützende Erdschicht mit Mineralien.",
    destructiveDesc: "Feuer schmilzt das Metall: Extreme Hitze bricht die Kälte und Festigkeit der Metalle und macht sie formbar.",
    strengths: "Charisma, Transformation, Intuition, Begeisterung.",
    reflectionText: "Lassen Sie Ihr inneres Charisma leuchten, doch meiden Sie die Überhitzung durch emotionale Verausgabung."
  },
  [ElementType.EARTH]: {
    phase: "Erde (Tǔ) — Spätsommer & Stabilität",
    productiveDesc: "Erde birgt das Metall: Fest verdichtet im stillen Schoß der Erde reifen kristalline Erze und Metalle heran.",
    destructiveDesc: "Erde dämmt das Wasser: Feste Ufer fassen die Fluten ein; Erde absorbiert und klärt unkontrollierte Ströme.",
    strengths: "Stabilität, Zuverlässigkeit, Schutz, Balance.",
    reflectionText: "Gewähren Sie anderen Erdung und Halt, ohne dabei in starrer Bequemlichkeit oder passivem Gedankenkreisen zu verharren."
  },
  [ElementType.METAL]: {
    phase: "Metall (Jīn) — Herbst & Struktur",
    productiveDesc: "Metall leitet das Wasser: An kühlen Metallen kondensiert der feine Abendtau und speist die Bäche mit klaren Mineralien.",
    destructiveDesc: "Metall spaltet das Holz: Die geschärfte Klinge des Metalls trennt unkontrollierte Triebe und bringt das Holz in Form.",
    strengths: "Struktur, Präzision, Entschlossenheit, Klarheit.",
    reflectionText: "Schaffen Sie Struktur und Ordnung in Ihren Angelegenheiten, aber meiden Sie mentale Härte oder absolute Unnachgiebigkeit."
  },
  [ElementType.WATER]: {
    phase: "Wasser (Shuǐ) — Winter & Tiefe",
    productiveDesc: "Wasser nährt das Holz: Sänftigende Regenfälle wecken schlummernde Samen im Erdboden und bringen das Holz zum Grünen.",
    destructiveDesc: "Wasser löscht das Feuer: Seine unendliche kühle Tiefe bezwingt und dämpft hitzige, lodernde Feuersignale.",
    strengths: "Weisheit, Wille, Anpassungsfähigkeit, Fluss.",
    reflectionText: "Fließen Sie sanftmütig um klobige Hindernisse herum, ohne sich im Strudel lähmender Ängste zu verlieren."
  },
};

const elementsOrder = [
  ElementType.WOOD,
  ElementType.FIRE,
  ElementType.EARTH,
  ElementType.METAL,
  ElementType.WATER,
];

const transitionGradients = [
  "grad-wood-fire",
  "grad-fire-earth",
  "grad-earth-metal",
  "grad-metal-water",
  "grad-water-wood"
];

export default function WuXingDetail({ viewModel }: WuXingDetailProps) {
  const [selectedElement, setSelectedElement] = React.useState<ElementType>(ElementType.WOOD);
  const [activeCycleTab, setActiveCycleTab] = React.useState<"productive" | "destructive">("productive");
  const [surgeCount, setSurgeCount] = React.useState<number>(0);

  const handleElementClick = (el: ElementType) => {
    setSelectedElement(el);
    setSurgeCount((prev) => prev + 1);
  };

  const elementColors: { [key in ElementType]: { border: string; bg: string; text: string; glow: string } } = {
    [ElementType.WOOD]: {
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      glow: "shadow-[0_0_15px_rgba(16,185,129,0.15)]",
    },
    [ElementType.FIRE]: {
      border: "border-red-500/30",
      bg: "bg-red-500/10",
      text: "text-red-400",
      glow: "shadow-[0_0_15px_rgba(239,68,68,0.15)]",
    },
    [ElementType.EARTH]: {
      border: "border-amber-500/30",
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      glow: "shadow-[0_0_15px_rgba(245,158,11,0.15)]",
    },
    [ElementType.METAL]: {
      border: "border-slate-300/30",
      bg: "bg-slate-300/10",
      text: "text-slate-300",
      glow: "shadow-[0_0_15px_rgba(148,163,184,0.15)]",
    },
    [ElementType.WATER]: {
      border: "border-blue-500/30",
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      glow: "shadow-[0_0_15px_rgba(59,130,246,0.15)]",
    },
  };

  const getElementStyle = (el: ElementType) => elementColors[el];

  // Raw element cards from viewModel
  const cards = viewModel.wuxing.elementCards;

  // Active element statistics and content mapping
  const selectedIndex = elementsOrder.indexOf(selectedElement);
  const rotationAngle = -selectedIndex * 72; // Dynamically rotates the circle group so selected nodes are at top center

  const activeCard = cards.find((c) => c.element === selectedElement) || cards[0];
  const textMeta = elementDetailsText[selectedElement] || elementDetailsText[ElementType.WOOD];
  const metaInfo = elementMeta[selectedElement];

  const nextProductive = elementsOrder[(selectedIndex + 1) % 5];
  const nextDestructive = elementsOrder[(selectedIndex + 2) % 5];

  const nextProductiveMeta = elementMeta[nextProductive];
  const nextDestructiveMeta = elementMeta[nextDestructive];

  // Helper inside SVG to compute unrotated physical coordinates
  const getNodePos = (idx: number) => {
    const angleRad = (idx * 72 - 90) * Math.PI / 180;
    return {
      x: 160 + 100 * Math.cos(angleRad),
      y: 160 + 100 * Math.sin(angleRad),
    };
  };

  if (!viewModel.wuxing.available) {
    return (
      <div id="wuxing-details" className="space-y-8">
        <div className="glass-card p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-4" data-testid="wuxing-missing">
          <Flame className="h-10 w-10 text-gold-muted" />
          <h3 className="font-serif text-2xl font-bold text-gold-light">Wu-Xing-Daten nicht verfügbar</h3>
          <p className="text-sm text-stone-400 max-w-md">
            FuFirE hat keine Wu-Xing-Wandlungsphasen geliefert. Es werden bewusst keine erfundenen
            Elementprozente angezeigt ({viewModel.wuxing.vectorExplanation}).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="wuxing-details" className="space-y-8">
      
      {/* Intro section */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center space-x-3 pb-4 border-b border-gold-muted/10 mb-4 font-serif">
          <Flame className="h-6 w-6 text-gold-muted shrink-0" />
          <h3 className="text-2xl font-bold text-gold-light">
            Die Kosmischen Wandlungsphasen (Wu Xing)
          </h3>
        </div>
        <p className="text-sm text-stone-400 leading-relaxed max-w-3xl">
          Die daoistische Philosophie begreift das Universum als das feine Wechselspiel von fünf Kräften. Diese nähren einander im produktiven Zyklus (Erzeugungsweg) und kontrollieren/bremsen einander im destruktiven Zyklus (Kontrollweg). Perfekte Lebensbalance entsteht, sobald die fünf Kräfte harmonisch fließen.
        </p>
      </div>

      {/* Interactive visual cycle block */}
      <div id="interactive-wuxing-cycle" className="glass-card p-6 sm:p-8 rounded-2xl relative overflow-hidden border border-gold-muted/20">
        <div className="flex flex-col md:flex-row items-center justify-between pb-6 border-b border-gold-muted/10 gap-4 mb-6">
          <div className="space-y-1">
            <span className="font-mono text-[9px] uppercase tracking-widest text-gold-muted font-bold">
              Interaktives Kosmisches Schwingungsrad
            </span>
            <h4 className="font-serif text-xl font-bold text-gold-light">
              Der Fünf-Elemente-Wandel (Sheng- & Ke-Zyklen)
            </h4>
          </div>
          
          {/* Cycle Selection Toggles */}
          <div className="flex space-x-2 bg-stone-900/60 p-1 rounded-lg border border-white/5 print:hidden">
            <button
              onClick={() => setActiveCycleTab("productive")}
              className={`px-3 py-1.5 text-xs font-mono rounded-md border duration-300 cursor-pointer ${
                activeCycleTab === "productive"
                  ? "bg-gold-light/10 border-gold-muted/30 text-gold-light"
                  : "border-transparent text-stone-400 hover:text-slate-100"
              }`}
            >
              Nährung (Sheng-Zyklus)
            </button>
            <button
              onClick={() => setActiveCycleTab("destructive")}
              className={`px-3 py-1.5 text-xs font-mono rounded-md border duration-300 cursor-pointer ${
                activeCycleTab === "destructive"
                  ? "bg-red-500/10 border-red-500/30 text-red-500"
                  : "border-transparent text-stone-400 hover:text-slate-100"
              }`}
            >
              Kontrolle (Ke-Zyklus)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Column 1: The Interactive SVG Circle of 5 Elements */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center py-4">
            <span className="font-mono text-[8px] uppercase tracking-widest text-[#9A8F80] mb-3 text-center block">
              Klicken Sie ein Element zum Rotieren & Dechiffrieren
            </span>
            <div className="relative w-80 h-80 flex items-center justify-center">
              <div className="absolute inset-2 rounded-full border border-white/5 bg-radial-gradient from-stone-950 to-obsidian-deep/30" />
              
              <svg 
                className="w-full h-full relative z-10 select-none overflow-visible" 
                viewBox="0 0 320 320"
              >
                <defs>
                  {/* Arrowheads definitions */}
                  <marker id="arrow-productive" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#D4AF37" />
                  </marker>
                  <marker id="arrow-destructive" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#ef4444" />
                  </marker>

                  {/* High Quality Linear Gradients representing Wood -> Fire -> Earth -> Metal -> Water -> Wood transitions */}
                  <linearGradient id="grad-wood-fire" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                  <linearGradient id="grad-fire-earth" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                  <linearGradient id="grad-earth-metal" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#94a3b8" />
                  </linearGradient>
                  <linearGradient id="grad-metal-water" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#94a3b8" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                  <linearGradient id="grad-water-wood" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>

                {/* Parent group with a smooth CSS rotation.
                    NOTE: deliberately NOT a motion.g — framer-motion forces
                    `transform-box: fill-box; transform-origin: 50% 50%` on SVG elements,
                    which rotates the group around its (animation-dependent) bounding box
                    instead of the wheel centre and lets the nodes slip off the ring.
                    `transformBox: "view-box"` makes the px origin resolve in viewBox
                    coordinates, so the wheel always spins around (160,160). */}
                <g
                  style={{
                    transform: `rotate(${rotationAngle}deg)`,
                    transformOrigin: "160px 160px",
                    transformBox: "view-box",
                    transition: "transform 0.8s ease-in-out",
                  }}
                >
                  
                  {/* Ambient Constant Flowing Sheng (Generative) Cycle Line */}
                  {elementsOrder.map((el, i) => {
                    const nextI = (i + 1) % 5;
                    const p1 = getNodePos(i);
                    const p2 = getNodePos(nextI);
                    
                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const dist = Math.hypot(dx, dy);
                    const startX = p1.x + (dx * 24) / dist;
                    const startY = p1.y + (dy * 24) / dist;
                    const endX = p2.x - (dx * 28) / dist;
                    const endY = p2.y - (dy * 28) / dist;

                    const d = `M ${startX} ${startY} A 130 130 0 0 1 ${endX} ${endY}`;
                    const gradientId = transitionGradients[i];

                    return (
                      <g key={`ambient-sheng-${i}`}>
                        {/* Thin translucent guide line */}
                        <path
                          d={d}
                          fill="none"
                          stroke={`url(#${gradientId})`}
                          strokeWidth={1.5}
                          className="opacity-20"
                        />
                        {/* Soft floating glowing particle along the element paths */}
                        <motion.path
                          d={d}
                          fill="none"
                          stroke={`url(#${gradientId})`}
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeDasharray="20 80"
                          animate={{ strokeDashoffset: [100, -100] }}
                          transition={{
                            duration: 3.5,
                            ease: "linear",
                            repeat: Infinity,
                          }}
                          className="opacity-50"
                        />
                      </g>
                    );
                  })}

                  {/* Bright, click-triggered high-energy surge tracing Erzeugungszyklus */}
                  {elementsOrder.map((_, stepOffset) => {
                    // Start tracing from the selectedIndex
                    const fromIdx = (selectedIndex + stepOffset) % 5;
                    const toIdx = (fromIdx + 1) % 5;
                    
                    const p1 = getNodePos(fromIdx);
                    const p2 = getNodePos(toIdx);
                    
                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const dist = Math.hypot(dx, dy);
                    const startX = p1.x + (dx * 24) / dist;
                    const startY = p1.y + (dy * 24) / dist;
                    const endX = p2.x - (dx * 28) / dist;
                    const endY = p2.y - (dy * 28) / dist;

                    const d = `M ${startX} ${startY} A 130 130 0 0 1 ${endX} ${endY}`;
                    const gradientId = transitionGradients[fromIdx];
                    const fromElObj = elementsOrder[fromIdx];
                    const glowHex = elementMeta[fromElObj].colorHex;

                    return (
                      <motion.path
                        key={`surge-${selectedElement}-${surgeCount}-${stepOffset}`}
                        d={d}
                        fill="none"
                        stroke={`url(#${gradientId})`}
                        strokeWidth={4.5}
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{
                          pathLength: [0, 1, 1, 0],
                          opacity: [0, 1, 1, 0]
                        }}
                        transition={{
                          duration: 0.65,
                          delay: stepOffset * 0.25,
                          ease: "easeInOut",
                          times: [0, 0.4, 0.7, 1.0]
                        }}
                        style={{
                          filter: `drop-shadow(0 0 8px ${glowHex}fe)`,
                        }}
                      />
                    );
                  })}
                  
                  {/* Outer Productive paths (Arcs) */}
                  {elementsOrder.map((el, i) => {
                    const nextI = (i + 1) % 5;
                    const p1 = getNodePos(i);
                    const p2 = getNodePos(nextI);
                    
                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const dist = Math.hypot(dx, dy);
                    const startX = p1.x + (dx * 24) / dist;
                    const startY = p1.y + (dy * 24) / dist;
                    const endX = p2.x - (dx * 28) / dist;
                    const endY = p2.y - (dy * 28) / dist;

                    // Curving paths outwards slightly for premium layout
                    const d = `M ${startX} ${startY} A 130 130 0 0 1 ${endX} ${endY}`;
                    
                    const isHighlighted = activeCycleTab === "productive" && (i === selectedIndex || nextI === selectedIndex);
                    const isDimmed = activeCycleTab !== "productive";

                    return (
                      <path
                        key={`prod-${i}`}
                        d={d}
                        fill="none"
                        stroke={isHighlighted ? "#D4AF37" : "#44403c"}
                        strokeWidth={isHighlighted ? 2.5 : 1}
                        markerEnd="url(#arrow-productive)"
                        className="transition-all duration-500"
                        style={{
                          filter: isHighlighted ? "drop-shadow(0 0 5px rgba(212,175,55,0.7))" : "none",
                          opacity: isHighlighted ? 1 : isDimmed ? 0.15 : 0.45
                        }}
                      />
                    );
                  })}

                  {/* Inner Destructive paths (Pentagram star paths) */}
                  {elementsOrder.map((el, i) => {
                    const nextI = (i + 2) % 5;
                    const p1 = getNodePos(i);
                    const p2 = getNodePos(nextI);
                    
                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const dist = Math.hypot(dx, dy);
                    const startX = p1.x + (dx * 24) / dist;
                    const startY = p1.y + (dy * 24) / dist;
                    const endX = p2.x - (dx * 28) / dist;
                    const endY = p2.y - (dy * 28) / dist;

                    const d = `M ${startX} ${startY} L ${endX} ${endY}`;
                    
                    const isHighlighted = activeCycleTab === "destructive" && (i === selectedIndex || nextI === selectedIndex);
                    const isDimmed = activeCycleTab !== "destructive";

                    return (
                      <path
                        key={`dest-${i}`}
                        d={d}
                        fill="none"
                        stroke={isHighlighted ? "#ef4444" : "#44403c"}
                        strokeWidth={isHighlighted ? 2.2 : 1}
                        strokeDasharray={isHighlighted ? "none" : "3,3"}
                        markerEnd="url(#arrow-destructive)"
                        className="transition-all duration-500"
                        style={{
                          filter: isHighlighted ? "drop-shadow(0 0 5px rgba(239,68,68,0.7))" : "none",
                          opacity: isHighlighted ? 1 : isDimmed ? 0.12 : 0.4
                        }}
                      />
                    );
                  })}

                  {/* Nodes list */}
                  {elementsOrder.map((el, idx) => {
                    const pos = getNodePos(idx);
                    const isElSelected = el === selectedElement;
                    const meta = elementMeta[el];
                    
                    return (
                      <g
                        key={el}
                        // Inverse parent rotation (around the node's own centre, in
                        // viewBox coordinates) keeps the labels upright. Plain <g> +
                        // CSS transition for the same reason as the parent group: see note above.
                        style={{
                          transform: `rotate(${-rotationAngle}deg)`,
                          transformOrigin: `${pos.x}px ${pos.y}px`,
                          transformBox: "view-box",
                          transition: "transform 0.8s ease-in-out",
                        }}
                        onClick={() => handleElementClick(el)}
                        className="cursor-pointer"
                      >
                        {/* Selected Ping Ring */}
                        {isElSelected && (
                          <circle
                            cx={pos.x}
                            cy={pos.y}
                            r={26}
                            fill="none"
                            stroke={meta.colorHex}
                            strokeWidth={1.5}
                            className="animate-ping opacity-25"
                            // animate-ping scales via CSS transform; without fill-box the
                            // SVG circle would scale around the viewBox origin and drift away.
                            style={{ transformBox: "fill-box", transformOrigin: "center" }}
                          />
                        )}

                        {/* Node circle */}
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={21}
                          fill="#1c1917"
                          stroke={isElSelected ? meta.colorHex : "#2e2a24"}
                          strokeWidth={isElSelected ? 2.5 : 1}
                          className="transition-all duration-300 hover:stroke-gold-muted"
                          style={{
                            filter: isElSelected ? `drop-shadow(0 0 8px ${meta.colorHex}cc)` : "none"
                          }}
                        />

                        {/* Node Calligraphy */}
                        <text
                          x={pos.x}
                          y={pos.y - 2}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className={`font-serif text-lg font-bold select-none ${meta.color}`}
                        >
                          {meta.symbol}
                        </text>

                        {/* Node Label Text */}
                        <text
                          x={pos.x}
                          y={pos.y + 11}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="font-sans text-[8px] tracking-wider select-none text-stone-300 uppercase font-bold"
                        >
                          {meta.name}
                        </text>
                      </g>
                    );
                  })}

                </g>
              </svg>
            </div>
          </div>

          {/* Column 2: Selected Element Matrix details */}
          <div className="lg:col-span-7">
            <div className="space-y-4 font-sans text-sm">
              {/* Element Header */}
              <div className="flex items-center space-x-3 pb-3 border-b border-gold-muted/10">
                <span className={`h-11 w-11 rounded-xl flex items-center justify-center font-serif text-2xl font-bold ${metaInfo.bg} border ${metaInfo.color}`}>
                  {metaInfo.symbol}
                </span>
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#D4AF37] block font-bold">Wandlungsphase dechiffriert</span>
                  <h5 className="font-serif text-lg font-bold text-slate-150 tracking-wide">
                    {textMeta.phase}
                  </h5>
                </div>
              </div>

              {/* Description */}
              <p className="text-stone-300 font-light leading-relaxed">
                {activeCard.keynote}
              </p>

              {/* Dynamic cycle flow blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                
                {/* Productive Details */}
                <div className={`p-4 rounded-xl border transition duration-300 ${activeCycleTab === "productive" ? "bg-gold-light/5 border-gold-muted/30 shadow-[inset_0_0_12px_rgba(212,175,55,0.05)]" : "bg-obsidian-deep/50 border-gold-muted/5 opacity-70"}`}>
                  <span className="font-mono text-[9px] uppercase font-bold text-[#D4AF37] tracking-wider block mb-2">
                    Nährungsstrom (Sheng-Zyklus)
                  </span>
                  <div className="space-y-3 text-xs leading-relaxed text-stone-300 font-light">
                    <p>{textMeta.productiveDesc}</p>
                    <div className="flex items-center space-x-1.5 font-mono text-[10px] text-stone-400 pt-1">
                      <span className={metaInfo.color}>{metaInfo.name}</span>
                      <span>→</span>
                      <span className={nextProductiveMeta.color}>{nextProductiveMeta.name}</span>
                      <span className="text-stone-500">({activeCard.percentage}%)</span>
                    </div>
                  </div>
                </div>

                {/* Destructive Details */}
                <div className={`p-4 rounded-xl border transition duration-300 ${activeCycleTab === "destructive" ? "bg-red-500/5 border-red-500/25 shadow-[inset_0_0_12px_rgba(239,68,68,0.05)]" : "bg-obsidian-deep/50 border-gold-muted/5 opacity-70"}`}>
                  <span className="font-mono text-[9px] uppercase font-bold text-red-400 tracking-wider block mb-2">
                    Kontrollstrom (Ke-Zyklus)
                  </span>
                  <div className="space-y-3 text-xs leading-relaxed text-stone-300 font-light">
                    <p>{textMeta.destructiveDesc}</p>
                    <div className="flex items-center space-x-1.5 font-mono text-[10px] text-stone-400 pt-1">
                      <span className={metaInfo.color}>{metaInfo.name}</span>
                      <span>⤇</span>
                      <span className={nextDestructiveMeta.color}>{nextDestructiveMeta.name}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Alltagsimpuls */}
              <div className="p-4 rounded-xl bg-obsidian-deep/70 border border-gold-muted/5 space-y-1">
                <span className="font-mono text-[9px] uppercase font-bold text-gold-muted tracking-wider block">
                  Alltagsimpuls
                </span>
                <p className="text-xs text-stone-350 font-light leading-relaxed italic">
                  &quot;{textMeta.reflectionText}&quot;
                </p>
              </div>

              {/* Foods & Colors */}
              <div className="grid grid-cols-2 gap-4 font-mono text-[10px] pt-1">
                <div className="p-3 rounded-lg bg-stone-900/40 border border-white/5">
                  <span className="text-slate-400 font-bold block mb-0.5">NÄHRSPEISEN:</span>
                  <span className="text-stone-300 block font-sans">{activeCard.foods}</span>
                </div>
                <div className="p-3 rounded-lg bg-stone-900/40 border border-white/5">
                  <span className="text-slate-400 font-bold block mb-0.5">VITALFARBEN:</span>
                  <span className="text-stone-300 block font-sans">{activeCard.colors}</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Two columns: balance sheet and cards detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Visual Elements balance sheet */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-6 rounded-2xl">
            <h4 className="font-serif text-xl font-bold text-gold-light mb-6 flex items-center space-x-2">
              <span>Ausgewerteter Vitalitätsstrom</span>
            </h4>
            
            <div className="space-y-6">
              {cards.map((card) => {
                const style = getElementStyle(card.element);
                const isSelected = selectedElement === card.element;
                return (
                  <div 
                    key={card.element} 
                    onClick={() => handleElementClick(card.element)}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-300 space-y-2 select-none hover:bg-gold-muted/5 ${
                      isSelected 
                        ? "bg-stone-900/80 border-gold-muted ring-1 ring-gold-muted/30 shadow-[0_0_15px_rgba(212,175,55,0.1)]" 
                        : "bg-obsidian-deep/50 border border-gold-muted/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${style.text} bg-current ${isSelected ? "animate-pulse" : ""}`} />
                        <span className="font-serif text-md font-bold text-slate-100">{card.element}</span>
                      </div>
                      <span className="font-mono text-sm font-semibold text-gold-muted">{card.percentage}%</span>
                    </div>

                    {/* Progress slider bar */}
                    <div className="h-2 w-full bg-stone-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${
                          card.element === ElementType.WOOD ? "from-emerald-600 to-emerald-400" : 
                          card.element === ElementType.FIRE ? "from-red-600 to-red-400" : 
                          card.element === ElementType.EARTH ? "from-amber-600 to-amber-400" : 
                          card.element === ElementType.METAL ? "from-slate-400 to-slate-200" : 
                          "from-blue-600 to-blue-400"
                        }`}
                        style={{ width: `${card.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Element-Balance-Hinweise aus dem ViewModel */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card p-6 rounded-2xl space-y-6">
            <h4 className="font-serif text-xl font-bold text-gold-light flex items-center space-x-2 border-b border-gold-muted/10 pb-4">
              <span>Harmonisierung nach Wu Xing (Alltags-Balance)</span>
            </h4>
            
            <p className="text-xs text-stone-400 leading-relaxed">
              {viewModel.wuxing.vectorExplanation}
            </p>

            <div className="space-y-4">
              {cards.map((card) => {
                const style = getElementStyle(card.element);
                const hasExcess = card.status === "Überschuss";
                const hasDeficit = card.status === "Defizit";
                const isSelected = selectedElement === card.element;

                return (
                  <div 
                    key={card.element}
                    onClick={() => handleElementClick(card.element)}
                    className={`rounded-xl p-4 border font-sans space-y-3 cursor-pointer transition-all duration-300 hover:bg-gold-muted/5 hover:border-gold-muted/20 ${
                      isSelected
                        ? "border-gold-light ring-1 ring-gold-light/40 bg-gold-light/[0.03] shadow-[0_0_20px_rgba(212,175,55,0.08)]"
                        : hasExcess 
                        ? "bg-red-500/5 border-red-500/15" 
                        : hasDeficit 
                        ? "bg-amber-500/5 border-amber-500/15" 
                        : "bg-obsidian-deep/30 border-gold-muted/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {hasExcess ? (
                          <ShieldAlert className="h-4 w-4 text-red-400" />
                        ) : hasDeficit ? (
                          <ShieldAlert className="h-4 w-4 text-amber-400" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                        )}
                        <h5 className={`text-sm font-serif font-bold ${style.text}`}>
                          {card.title}
                        </h5>
                      </div>
                      <span className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${
                        hasExcess 
                          ? "bg-red-500/10 border-red-500/20 text-red-300"
                          : hasDeficit
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                      }`}>
                        {card.status} • {card.percentage}%
                      </span>
                    </div>

                    <p className="text-xs text-stone-400 leading-relaxed font-light">
                      {card.keynote}
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gold-muted/5 font-mono text-[10px] text-stone-400">
                      <div>
                        <span className="text-[#988E80] font-bold block mb-0.5">NÄHRSPEISEN:</span>
                        <span className="text-stone-300 block">{card.foods}</span>
                      </div>
                      <div>
                        <span className="text-[#988E80] font-bold block mb-0.5">VITALFARBEN:</span>
                        <span className="text-stone-300 block">{card.colors}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

