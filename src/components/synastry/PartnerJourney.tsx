import React from "react";
import { Sparkles, GitCompare, Layers, Scale, MessageCircleQuestion } from "lucide-react";
import { SynastryResponse } from "../../api/bazodiacClient";
import { PAIR_AXIS_TEXTS } from "../../content/pairAxisTexts";
import { pairAspectInterpretation } from "../../utils/aspectInterpretation";

// P7 Partner Journey — renders the four data-anchored layers under the score.
// Pure presentation of already-derived server data; every statement names the
// concrete data it came from, framed as reflection, never as a couple verdict.

const ELEMENT_ORDER = ["Holz", "Feuer", "Erde", "Metall", "Wasser"] as const;

const BRANCH_REL_LABEL: Record<string, string> = {
  "san-he": "San-He · Dreiecksverbindung",
  "liu-he": "Liu-He · Paarverbindung",
  "chong": "Chong · Gegenüber",
  "gleich": "Gleiches Tier",
  "neutral": "Neutral",
};

const STEM_REL_LABEL: Record<string, string> = {
  "gleich": "Gleiches Element",
  "erzeugt": "nährt (Sheng)",
  "wird-erzeugt": "wird genährt (Sheng)",
  "kontrolliert": "begrenzt (Ke)",
  "wird-kontrolliert": "wird begrenzt (Ke)",
};

function SectionShell({
  testid, icon, title, subtitle, children,
}: { testid: string; icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section data-testid={testid} className="glass-card p-6 rounded-2xl space-y-4">
      <div className="flex items-center gap-3 border-b border-gold-muted/10 pb-3">
        <span className="text-gold-muted shrink-0">{icon}</span>
        <div>
          <h4 className="font-serif text-lg font-bold text-gold-light">{title}</h4>
          <p className="text-[11px] text-stone-400">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-stone-500 italic py-2">{children}</p>;
}

export default function PartnerJourney({ result }: { result: SynastryResponse }) {
  const { interAspects, pillarComparison, comparisonA, comparisonB, pairAxes, elementalA, elementalB } = result;

  const weightOf = (rows: { element: string; weight: number }[], el: string): number | null => {
    const r = rows.find((x) => x.element === el);
    return r && Number.isFinite(r.weight) ? r.weight : null;
  };
  const hasMirror = (elementalA?.length ?? 0) > 0 && (elementalB?.length ?? 0) > 0;
  const maxWeight = Math.max(
    1e-6,
    ...[...(elementalA ?? []), ...(elementalB ?? [])].map((w) => (Number.isFinite(w.weight) ? w.weight : 0)),
  );

  const strongestAxis = pairAxes && pairAxes.length
    ? [...pairAxes].sort((a, b) => b.magnitude - a.magnitude)[0]
    : null;

  return (
    <div className="space-y-6">
      {/* 3 — Paar-Polachsen */}
      <SectionShell
        testid="synastry-axes"
        icon={<Scale className="h-5 w-5" />}
        title="Paar-Polachsen"
        subtitle="Aus dem West-vs-BaZi-Element­feld beider Profile abgeleitet — Ressource oder Wachstumskante."
      >
        {pairAxes && pairAxes.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pairAxes.map((axis) => {
              const texts = PAIR_AXIS_TEXTS[axis.id];
              const text = texts ? texts[axis.mode] : "";
              const reibung = axis.mode === "reibung";
              return (
                <div
                  key={axis.id}
                  data-testid="pair-axis-card"
                  className="rounded-xl border border-gold-muted/20 bg-obsidian-deep/40 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-serif text-sm font-bold text-slate-100">{axis.poleA} ↔ {axis.poleB}</span>
                    {/* Descriptive of the DATA (leanA vs leanB), neutral colour — not a
                        good/bad couple verdict (Watcher Gate E / Critic C1·C4 re-alignment). */}
                    <span className="font-mono text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-gold-muted/15 text-stone-300">
                      {reibung ? "gegensätzliche Neigung" : "gleiche Neigung"}
                    </span>
                  </div>
                  <p className="text-[12px] text-stone-300 leading-relaxed font-light">{text}</p>
                  <p className="text-[10px] text-stone-500 font-mono">
                    Anker: {axis.element} · A neigt zu {axis.leanA} · B neigt zu {axis.leanB}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState>Keine Paar-Polachsen — für beide Profile fehlt das Elementfeld (elemental_comparison).</EmptyState>
        )}
      </SectionShell>

      {/* 4 — Inter-Aspekte */}
      <SectionShell
        testid="synastry-aspects"
        icon={<GitCompare className="h-5 w-5" />}
        title="Western Inter-Aspekte"
        subtitle="Winkelbeziehungen zwischen den Planeten beider Profile, nach Orb sortiert."
      >
        {interAspects && interAspects.length ? (
          <ul className="space-y-2">
            {interAspects.slice(0, 8).map((a, i) => (
              <li key={`${a.planetA}-${a.planetB}-${a.type}-${i}`} data-testid="inter-aspect-row" className="rounded-lg border border-gold-muted/10 bg-obsidian-deep/40 p-3 space-y-1">
                <div className="flex items-center justify-between gap-2 text-[12px]">
                  <span className="font-serif font-bold text-slate-100">{a.planetA} ↔ {a.planetB}</span>
                  <span className="font-mono text-[9px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-gold-muted/15 text-gold-light">{a.type}</span>
                </div>
                <p className="text-[11px] text-stone-300 font-light leading-relaxed">{pairAspectInterpretation(a.planetA, a.planetB, a.type)}</p>
                <p className="text-[9px] text-stone-500 font-mono">Orb {a.orb.toFixed(1).replace(".", ",")}° · exakt bei {a.exact_angle}°</p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>Keine engen Inter-Aspekte — oder es fehlen berechenbare Planetenpositionen in einem Profil.</EmptyState>
        )}
      </SectionShell>

      {/* 5 — BaZi-Säulenvergleich */}
      <SectionShell
        testid="synastry-pillars"
        icon={<Layers className="h-5 w-5" />}
        title="BaZi-Säulenvergleich"
        subtitle="Stamm-Element- und Zweig-/Tier-Beziehung je Säule — Beziehungstypen, kein Gut/Schlecht."
      >
        {pillarComparison && pillarComparison.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pillarComparison.map((p) => (
              <div key={p.pillarKey} data-testid="pillar-compare-card" className="rounded-xl border border-gold-muted/15 bg-obsidian-deep/40 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-serif text-sm font-bold text-gold-light">{p.pillarKey}</span>
                  <span className="font-mono text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-gold-muted/15 text-gold-light">{BRANCH_REL_LABEL[p.branchRelation] ?? p.branchRelation}</span>
                </div>
                <p className="text-[11px] text-stone-300 font-mono">
                  <span className="text-gold-muted">A</span> {p.animalA} ({p.stemElementA}) · <span className="text-sky-300">B</span> {p.animalB} ({p.stemElementB})
                </p>
                <p className="text-[10px] text-stone-500">Stamm: {STEM_REL_LABEL[p.stemRelation] ?? p.stemRelation}</p>
                <p className="text-[12px] text-stone-300 font-light leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>Kein Säulenvergleich — in einem Profil sind nicht alle Säulen aufgelöst.</EmptyState>
        )}
      </SectionShell>

      {/* 6 — WuXing Element-Spiegel */}
      <SectionShell
        testid="synastry-elements"
        icon={<Sparkles className="h-5 w-5" />}
        title="WuXing Element-Spiegel"
        subtitle="Gold = Person A, Blau = Person B. Die Balken zeigen Elementanteile, keine bessere oder schlechtere Seite."
      >
        {hasMirror ? (
          <div className="space-y-2">
            {ELEMENT_ORDER.map((el) => {
              const a = weightOf(elementalA, el);
              const b = weightOf(elementalB, el);
              return (
                <div key={el} data-testid="element-mirror-row" className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-serif text-slate-200">{el}</span>
                    <span className="font-mono text-[9px] text-stone-500">
                      A {a !== null ? a.toFixed(2) : "—"} · B {b !== null ? b.toFixed(2) : "—"}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <div className="flex-1 h-2 rounded-full bg-obsidian-deep/60 overflow-hidden">
                      <div className="h-full bg-gold-muted/80 rounded-full" style={{ width: `${a !== null ? Math.min(100, (a / maxWeight) * 100) : 0}%` }} />
                    </div>
                    <div className="flex-1 h-2 rounded-full bg-obsidian-deep/60 overflow-hidden">
                      <div className="h-full bg-sky-400/80 rounded-full" style={{ width: `${b !== null ? Math.min(100, (b / maxWeight) * 100) : 0}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState>Kein Element-Spiegel — für beide Profile fehlt das Fusions-Elementfeld.</EmptyState>
        )}
      </SectionShell>

      {/* Eure nächste Frage — abgeleitet aus der stärksten Achse */}
      {strongestAxis && (
        <div data-testid="synastry-next-question" className="glass-card p-5 rounded-2xl border border-gold-muted/15">
          <div className="flex items-center gap-2 text-gold-muted">
            <MessageCircleQuestion className="h-4 w-4" />
            <span className="font-mono text-[9px] uppercase tracking-widest font-bold">Eure nächste Frage</span>
          </div>
          <p className="mt-2 text-sm text-slate-100 font-serif leading-relaxed">
            Wo zwischen {strongestAxis.poleA} und {strongestAxis.poleB} liegt heute euer gemeinsamer Rhythmus —
            und wo darf jede:r den eigenen behalten?
          </p>
          <p className="mt-1 text-[10px] text-stone-500 font-mono">Anker: {strongestAxis.element}-Achse, der größte Ausschlag im Paarfeld.</p>
        </div>
      )}
    </div>
  );
}
