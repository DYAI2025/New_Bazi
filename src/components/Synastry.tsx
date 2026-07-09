import React from "react";
import { ProfileViewModel } from "../viewmodels/profileViewModel";
import { BirthData } from "../types";
import { BazodiacClient, SynastryResponse, ResolvedPlace } from "../api/bazodiacClient";
import { Users, Heart, RefreshCw, ArrowRight, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";
import PlaceAutocomplete from "./PlaceAutocomplete";
import TensionNavigator from "./TensionNavigator";
import PartnerJourney from "./synastry/PartnerJourney";
import SignatureMatch from "./synastry/SignatureMatch";

interface SynastryProps {
  viewModel: ProfileViewModel;
  birthData: BirthData;
}

const EMPTY_PARTNER: BirthData = {
  name: "",
  birthDate: "",
  birthTime: "",
  birthPlace: "",
  birthPlaceLabel: "",
  placeId: "",
  gender: "Divers"
};

export default function Synastry({ viewModel, birthData }: SynastryProps) {
  const [partnerData, setPartnerData] = React.useState<BirthData>({ ...EMPTY_PARTNER });
  const [synastryResult, setSynastryResult] = React.useState<SynastryResponse | null>(null);
  const [calculating, setCalculating] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const partnerResolved = Boolean(
    partnerData.placeId &&
    typeof partnerData.lat === "number" &&
    typeof partnerData.lon === "number" &&
    Boolean(partnerData.tz)
  );
  const canSubmit =
    partnerData.name.trim().length >= 2 &&
    Boolean(partnerData.birthDate) &&
    Boolean(partnerData.birthTime) &&
    partnerResolved;

  const handlePartnerResolved = (place: ResolvedPlace) => {
    setPartnerData((prev) => ({
      ...prev,
      placeId: place.placeId,
      birthPlaceLabel: place.label,
      birthPlace: place.label,
      lat: place.lat,
      lon: place.lon,
      tz: place.tz
    }));
  };

  const handleCalculateSynastry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setCalculating(true);
    setSynastryResult(null);
    setErrorMsg(null);
    try {
      const result = await BazodiacClient.fetchSynastry(birthData, partnerData);
      setSynastryResult(result);
    } catch (err: any) {
      console.error("Failed to compute synastry:", err);
      setErrorMsg(err?.message || "Synastrie konnte nicht berechnet werden.");
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div id="synastry-container" data-testid="synastry-container" className="space-y-8">
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center space-x-3 pb-4 border-b border-gold-muted/10 mb-4 font-serif">
          <Users className="h-6 w-6 text-gold-muted shrink-0" />
          <h3 className="text-2xl font-bold text-gold-light">Synastrie (Beziehungsvergleich)</h3>
        </div>
        <p className="text-sm text-stone-400 leading-relaxed max-w-3xl">
          Beide Profile werden einzeln aus FuFirE bezogen; der Vergleich selbst wird lokal abgeleitet
          (<span className="font-mono">source: fufire-profiles-local-comparison</span>). Sobald FuFirE eine eigene
          Synastrie liefert, kann die Quelle umgestellt werden.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleCalculateSynastry} className="glass-card p-6 rounded-2xl space-y-4 h-full flex flex-col justify-between">
            <div>
              <h4 className="font-serif text-lg font-bold text-gold-light flex items-center space-x-2 border-b border-gold-muted/10 pb-3">
                <Heart className="h-4.5 w-4.5 text-gold-muted" />
                <span>Partnerdaten eingeben</span>
              </h4>

              <div className="space-y-3 font-sans text-xs mt-4">
                <div className="space-y-1">
                  <label className="font-mono text-[9px] uppercase font-bold text-gold-muted tracking-wide block">Name des Partners</label>
                  <input
                    id="partner-name"
                    type="text"
                    required
                    value={partnerData.name}
                    onChange={(e) => setPartnerData({ ...partnerData, name: e.target.value })}
                    className="w-full bg-obsidian-deep/60 text-[#E0D8D0] rounded border border-gold-muted/20 px-3 py-2 text-xs focus:border-gold-light focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[9px] uppercase font-bold text-gold-muted tracking-wide block">Geschlecht</label>
                  <select
                    id="partner-gender"
                    value={partnerData.gender}
                    onChange={(e) => setPartnerData({ ...partnerData, gender: e.target.value as any })}
                    className="w-full bg-obsidian-deep/60 text-[#E0D8D0] rounded border border-gold-muted/20 px-3 py-2 text-xs focus:border-gold-light focus:outline-none"
                  >
                    <option value="Weiblich">Weiblich</option>
                    <option value="Männlich">Männlich</option>
                    <option value="Divers">Divers</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-mono text-[9px] uppercase font-bold text-gold-muted tracking-wide block">Geburtsdatum</label>
                    <input
                      id="partner-date"
                      type="date"
                      required
                      value={partnerData.birthDate}
                      onChange={(e) => setPartnerData({ ...partnerData, birthDate: e.target.value })}
                      className="w-full bg-obsidian-deep/60 text-[#E0D8D0] rounded border border-gold-muted/20 px-3 py-2 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono text-[9px] uppercase font-bold text-gold-muted tracking-wide block">Geburtszeit</label>
                    <input
                      id="partner-time"
                      type="time"
                      required
                      value={partnerData.birthTime}
                      onChange={(e) => setPartnerData({ ...partnerData, birthTime: e.target.value })}
                      className="w-full bg-obsidian-deep/60 text-[#E0D8D0] rounded border border-gold-muted/20 px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>

                <PlaceAutocomplete
                  id="partner-place"
                  label="Geburtsort des Partners"
                  value={partnerData.birthPlaceLabel || ""}
                  resolved={partnerResolved}
                  onResolved={handlePartnerResolved}
                  onClear={() => setPartnerData((prev) => ({ ...prev, placeId: "", lat: undefined, lon: undefined, tz: undefined }))}
                />
              </div>
            </div>

            <div className="pt-6">
              <button
                id="submit-synastry-btn"
                type="submit"
                disabled={calculating || !canSubmit}
                className="w-full relative py-3 bg-gradient-to-r from-gold-muted to-gold-dark hover:from-gold-light hover:to-gold-muted text-stone-950 font-serif font-bold text-sm tracking-widest rounded-lg transition duration-300 transform active:scale-95 cursor-pointer glow-gold border border-gold-light/20 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {calculating ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="h-4 w-4 border-2 border-stone-950 border-t-transparent rounded-full"
                    />
                    <span>VERGLEICH LÄUFT...</span>
                  </>
                ) : (
                  <span>PARTNER VERGLEICHEN</span>
                )}
              </button>
              {!canSubmit && (
                <p className="mt-3 text-[11px] text-stone-500 text-center">Name, Datum, Zeit und aufgelöster Ort des Partners erforderlich.</p>
              )}
            </div>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card p-6 sm:p-8 rounded-2xl min-h-[350px] flex flex-col justify-center h-full">
            {!synastryResult && !calculating && !errorMsg && (
              <div className="text-center space-y-4 py-8">
                <Users className="h-14 w-14 text-stone-600 mx-auto" />
                <div className="space-y-2 font-sans">
                  <h5 className="font-serif text-lg font-bold text-stone-200">Kein Vergleich ermittelt</h5>
                  <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
                    Tragen Sie links die Partnerdaten ein und starten Sie den Abgleich.
                  </p>
                </div>
              </div>
            )}

            {calculating && (
              <div className="text-center space-y-4 py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="h-16 w-16 mx-auto border-2 border-gold-muted border-t-transparent rounded-full glow-gold"
                />
                <h5 className="font-serif text-md font-bold text-gold-light">Profile werden aus FuFirE bezogen...</h5>
              </div>
            )}

            {errorMsg && !calculating && (
              <div className="text-center space-y-4 py-12" data-testid="synastry-error">
                <AlertTriangle className="h-10 w-10 text-red-400 mx-auto" />
                <p className="text-sm text-red-300 max-w-sm mx-auto font-sans">{errorMsg}</p>
              </div>
            )}

            {synastryResult && !calculating && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between p-5 rounded-xl bg-gold-muted/5 border border-gold-muted/15 gap-6">
                  <div className="relative h-24 w-24 shrink-0">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="16" fill="transparent" className="stroke-stone-800" strokeWidth="2.5" />
                      <motion.circle
                        cx="18" cy="18" r="16" fill="transparent"
                        className="stroke-[#D4AF37]" strokeWidth="2.5"
                        strokeDasharray={100}
                        initial={{ strokeDashoffset: 100 }}
                        animate={{ strokeDashoffset: 100 - synastryResult.score }}
                        transition={{ duration: 1 }}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-serif text-2xl font-bold text-slate-100">{synastryResult.score}%</span>
                      <span className="font-mono text-[8px] text-stone-400 uppercase tracking-widest">grober Vergleich</span>
                    </div>
                  </div>

                  <div className="flex-grow space-y-1 font-sans">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#D4AF37] font-bold">Primus-Aspectus (PA)</span>
                    <h5 className="font-serif text-md font-bold text-slate-100">
                      {synastryResult.userRef.name} <ArrowRight className="inline h-4 w-4 mx-1 text-[#D4AF37]" /> {synastryResult.partnerRef.name}
                    </h5>
                    <p className="text-xs text-stone-400 leading-relaxed mt-1">
                      Zodiak-Vergleich: <span className="text-slate-200 font-mono font-medium">{synastryResult.westernScore}%</span> • BaZi-Vergleich: <span className="text-slate-200 font-mono font-medium">{synastryResult.baziScore}%</span>
                    </p>
                    <p className="mt-2 text-[11px] text-stone-500 leading-relaxed" data-testid="synastry-score-note">
                      Dieser Wert ist ein grober Vergleich aus verfügbaren Profilmerkmalen — kein Messwert, keine
                      Bewertung und keine Aussage darüber, ob eine Beziehung gelingen kann.
                    </p>
                    <span className="inline-block mt-1 font-mono text-[9px] text-stone-500" data-testid="synastry-source">Quelle: {synastryResult.source}</span>
                  </div>
                </div>

                <div className="space-y-4 font-sans text-xs p-4 rounded-xl border border-gold-muted/5 bg-obsidian-deep/50">
                  <div className="space-y-1">
                    <span className="font-mono text-[9px] uppercase font-bold text-[#D4AF37] block">Vergleich der Elementekräfte (lokal abgeleitet)</span>
                    <p className="text-stone-300 leading-relaxed font-light text-[13px]">{synastryResult.harmonyAnalysis}</p>
                  </div>
                  <div className="space-y-1 pt-3 border-t border-gold-muted/5">
                    <span className="font-mono text-[9px] uppercase font-bold text-gold-light block">Reflexion zur Lesart</span>
                    <p className="text-stone-400 leading-relaxed font-light text-[13px]">{synastryResult.advice}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* P7 Partner Journey: Begegnungsfeld-Header → Paar-Spannungsnavigator
          (A→Gold, B→Blau) → vier datenverankerte Ebenen (Polachsen, Inter-Aspekte,
          Säulenvergleich, Element-Spiegel). Jede Ebene zeigt ehrliche Leerzustände. */}
      {synastryResult && !calculating && (
        <div className="space-y-6">
          <div data-testid="synastry-journey-header" className="glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-gold-muted shrink-0" />
              <h3 className="font-serif text-xl font-bold text-gold-light">Euer Begegnungsfeld</h3>
            </div>
            <p className="mt-2 text-sm text-stone-400 leading-relaxed max-w-3xl">
              Die folgenden Ebenen zeigen Ressourcen, Reibungen und Fragen aus den beiden berechneten Profilen —
              jede Aussage nennt ihren Datenanker und bleibt Reflexion, kein Urteil über die Beziehung.
            </p>
          </div>
          <TensionNavigator
            pairMode
            elementalA={synastryResult.elementalA}
            elementalB={synastryResult.elementalB}
            nameA={synastryResult.userRef.name}
            nameB={synastryResult.partnerRef.name}
          />
          <SignatureMatch
            comparisonA={synastryResult.comparisonA}
            comparisonB={synastryResult.comparisonB}
            nameA={synastryResult.userRef.name}
            nameB={synastryResult.partnerRef.name}
          />
          <PartnerJourney result={synastryResult} />
        </div>
      )}
    </div>
  );
}
