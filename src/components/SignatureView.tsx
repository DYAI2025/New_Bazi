import React, { useMemo, useState } from "react";
import { Activity, Radio, ChevronDown, ChevronUp } from "lucide-react";
import { ProfileViewModel, SignalLevel } from "../viewmodels/profileViewModel";
import { deriveTension } from "../utils/tensionNavigator";
import { OriginLayer } from "./TensionNavigator";
import { toSignatureInput } from "../utils/visual/signatureAdapter";
import { ELEMENT_META, type ElementId } from "../lib/signature/signatureData";
import { SignatureCanvas, type SignatureStatus } from "./SignatureCanvas";

/**
 * SignatureView — die Signatur ersetzt den frage-basierten Spannungsnavigator
 * im Fusions-Tab (User-Entscheid 2026-07-08): statt „Frage + Trifft/Teilweise"
 * eine bewegte 3D-Darstellung des Fusionsfelds (Port der Bazodiac-Signatur aus
 * DYAI2025/bazodiac-signature-prototypes).
 *
 * Lesart der Szene (Konzept docs/concept/spannungsnavigator-visualisierung.md
 * sinngemäß übertragen):
 * - 5 Element-Knoten auf festen Pentagon-Positionen (Wiedererkennbarkeit)
 * - rote Halos pulsieren dort, wo West- und BaZi-Gewichtung auseinanderliegen
 *   (|Differenz| > 0.3) — das IST die Spannung, ohne Frage-Mechanik
 * - Wellenkohärenz der Punkthülle folgt dem kalibrierten Kohärenzindex
 * - Farben sind Bewegungsqualitäten, nie Bewertung; keine Zahlen im Visual —
 *   Zahlen nur im aufklappbaren „Herkunft & Methode"-Layer
 */

const SIGNAL_LABEL: Record<SignalLevel, string> = {
  leise: "leise",
  spuerbar: "spürbar",
  dominant: "dominant",
};

const SOURCE_LABEL: Record<string, string> = {
  NOAA: "LIVE (NOAA)",
  SIMULIERT: "SIMULIERT",
  OVERRIDE: "OVERRIDE",
  STATISCH: "STATISCH",
};

interface SignatureViewProps {
  viewModel: ProfileViewModel;
}

export const SignatureView: React.FC<SignatureViewProps> = ({ viewModel }) => {
  const [cosmicOverride, setCosmicOverride] = useState<number | null>(null);
  const [timelapse, setTimelapse] = useState(1);
  const [originOpen, setOriginOpen] = useState(false);
  const [status, setStatus] = useState<SignatureStatus | null>(null);

  const fusion = viewModel.fusion;
  // Stabile Identität ist Pflicht: SignatureCanvas memoisiert auf `input` und
  // meldet Status via setState nach oben. Ein pro Render neu gebautes Objekt
  // erzeugte hier eine Endlosschleife (input → signature → onStatus → setStatus
  // → Re-Render → neues input …) — Regressionstest: SignatureView.renderloop.test.tsx.
  const input = useMemo(() => toSignatureInput(viewModel), [viewModel]);
  const tension = deriveTension(fusion.elementalComparison, fusion.signalLevel);

  if (!input) {
    const fusionMissing = fusion.source === "missing";
    return (
      <div id="signature-view" data-testid="signature-view" className="space-y-8">
        <div
          className="glass-card p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-4"
          data-testid={fusionMissing ? "fusion-missing" : "signature-empty"}
        >
          <Activity className="h-10 w-10 text-gold-muted" />
          <h3 className="font-serif text-2xl font-bold text-gold-light">
            {fusionMissing ? "Fusions-Matrix nicht verfügbar" : "Signatur"}
          </h3>
          <p className="text-sm text-stone-400 max-w-md">
            {fusionMissing
              ? `FuFirE hat keine Fusionsdaten geliefert. Es werden bewusst keine erfundenen Kohärenzwerte angezeigt (Quelle: ${fusion.source}).`
              : "Für dieses Profil liefert das Fusionsfeld keine auswertbare Elementverteilung."}
          </p>
        </div>
      </div>
    );
  }

  const act = tension?.activeAxis ?? null;
  const leanPole = act ? (tension!.activeLean === "a" ? act.poleA : act.poleB) : null;
  const signalLabel = tension ? SIGNAL_LABEL[tension.signalLevel] : null;
  const dominantLabel = status ? ELEMENT_META[status.signature.dominant as ElementId]?.label : null;
  const sourceLabel = status ? SOURCE_LABEL[status.cosmicSource] ?? status.cosmicSource : "STATISCH";

  return (
    <div id="signature-view" data-testid="signature-view" className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-serif text-3xl font-bold text-gold-light">Signatur</h2>
        {act && signalLabel ? (
          <p data-testid="signature-kicker" className="text-sm uppercase tracking-widest text-gold-muted">
            {act.poleA} ↔ {act.poleB} · {signalLabel}
          </p>
        ) : (
          <p data-testid="signature-kicker" className="text-sm uppercase tracking-widest text-stone-500">
            Keine auswertbare Achsen-Differenz
          </p>
        )}
        <p className="text-sm text-stone-400 max-w-2xl mx-auto">
          Dein Fusionsfeld als bewegtes Feld: fünf Element-Knoten, Flüsse dazwischen —
          und rote Halos dort, wo westliche und BaZi-Gewichtung auseinanderliegen.
          {act && leanPole && (
            <> Deutlichste Differenz auf der Achse {act.poleA} ↔ {act.poleB}, mit Zug Richtung {leanPole}.</>
          )}
          {dominantLabel && <> Tragendes Element: {dominantLabel}.</>}
        </p>
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-gold-muted/20 bg-[#050505]">
        <SignatureCanvas
          input={input}
          live
          cosmicOverride={cosmicOverride}
          timelapse={timelapse}
          onStatus={setStatus}
          className="h-[420px] md:h-[540px] w-full"
        />
        <div className="absolute top-3 right-3 flex items-center gap-2 text-[10px] uppercase tracking-widest text-stone-400 bg-black/40 rounded-full px-3 py-1.5">
          <Radio className="h-3 w-3" />
          <span data-testid="signature-cosmic-source">{sourceLabel}</span>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center gap-x-6 gap-y-3 justify-center">
        <label className="flex items-center gap-3 text-xs text-stone-400">
          <span className="uppercase tracking-widest">Kosmischer Puls</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round((cosmicOverride ?? status?.cosmic ?? 0.5) * 100)}
            onChange={(e) => setCosmicOverride(Number(e.target.value) / 100)}
            className="w-36 accent-[#d4af37]"
            data-testid="signature-cosmic-slider"
          />
        </label>
        <button
          onClick={() => setCosmicOverride(null)}
          disabled={cosmicOverride === null}
          className={`px-4 py-1.5 rounded-lg border text-xs uppercase tracking-widest transition-colors ${
            cosmicOverride === null
              ? "border-gold-muted/20 text-stone-500 cursor-default"
              : "border-gold-muted/50 text-gold-light hover:bg-gold-muted/10"
          }`}
          data-testid="signature-live-btn"
        >
          Live
        </button>
        <label className="flex items-center gap-3 text-xs text-stone-400">
          <span className="uppercase tracking-widest">Zeitraffer</span>
          <input
            type="range"
            min={1}
            max={12}
            value={timelapse}
            onChange={(e) => setTimelapse(Number(e.target.value))}
            className="w-36 accent-[#d4af37]"
            data-testid="signature-timelapse-slider"
          />
        </label>
      </div>

      <div className="text-center">
        <button
          onClick={() => setOriginOpen((o) => !o)}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-stone-400 hover:text-gold-light transition-colors"
          data-testid="signature-origin-toggle"
        >
          Herkunft &amp; Methode
          {originOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {originOpen && (
        <div className="glass-card rounded-2xl p-6 space-y-6" data-testid="signature-origin">
          <OriginLayer fusion={fusion} />
          <p className="text-xs text-stone-500 leading-relaxed border-t border-gold-muted/10 pt-4">
            Die 3D-Szene rechnet mit der Prototyp-Mathematik der Bazodiac-Signatur:
            fusionierte Elementstärke √(West·BaZi) + 0.3·max(West, BaZi), Spannung =
            |West − BaZi| je Element (roter Halo ab 0.30), Wellenkohärenz aus dem
            kalibrierten Kohärenzindex. Kosmischer Puls: {sourceLabel} — der
            NOAA-Kp-Index moduliert nur das Animationstempo, nie die Deutung.
            Transit-Einflüsse sind derzeit simuliert und entsprechend markiert.
          </p>
        </div>
      )}

      <p className="text-center text-xs text-stone-500" data-testid="signature-footer">
        Modellergebnis, keine Eigenschaft.
      </p>
    </div>
  );
};

export default SignatureView;
