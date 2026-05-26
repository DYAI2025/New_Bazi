import React from "react";
import { ProfileViewModel } from "../viewmodels/profileViewModel";
import { BirthData } from "../types";
import { BazodiacClient, DailyPulseResponse } from "../api/bazodiacClient";
import { Activity, RefreshCw, Star, Info, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

interface DailyPulseProps {
  viewModel: ProfileViewModel;
  birthData: BirthData;
}

export default function DailyPulse({ birthData }: DailyPulseProps) {
  const [pulseData, setPulseData] = React.useState<DailyPulseResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const localTime = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const handleChannelPulse = async () => {
    setLoading(true);
    setErrorMsg(null);
    setPulseData(null);
    try {
      const metrics = await BazodiacClient.fetchDailyPulse(birthData);
      setPulseData(metrics);
    } catch (err: any) {
      console.error("Failed to load daily pulse:", err);
      setErrorMsg(err?.message || "Tagespuls konnte nicht von FuFirE geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  const available = pulseData?.available && pulseData.source === "fufire";
  const fmt = (v: string | number | null | undefined) => (v === null || v === undefined || v === "" ? "—" : String(v));

  return (
    <div id="daily-pulse-container" className="space-y-8">
      <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-gold-muted/10 mb-4 flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-3">
            <Activity className="h-6 w-6 text-gold-muted shrink-0" />
            <h3 className="font-serif text-2xl font-bold text-gold-light">Der Tagespuls</h3>
          </div>
          <span className="font-mono text-xs text-gold-muted font-medium bg-gold-muted/5 border border-gold-muted/20 px-3 py-1.5 rounded-lg shrink-0">
            {localTime}
          </span>
        </div>
        <p className="text-sm text-stone-400 leading-relaxed max-w-3xl">
          Der Tagespuls stammt aus der FuFirE-Experience-Schnittstelle (<span className="font-mono">/v1/experience/daily</span>).
          Er wird nicht lokal erzeugt; fehlt die Schnittstelle, erscheint ein klarer Missing-State.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-6 rounded-2xl space-y-6 h-full flex flex-col justify-between">
            <div>
              <h4 className="font-serif text-lg font-bold text-gold-light flex items-center space-x-2 border-b border-gold-muted/10 pb-3">
                <Star className="h-4.5 w-4.5 text-gold-muted" />
                <span>Tages-Resonanz</span>
              </h4>

              <div className="space-y-4 font-sans text-xs mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Quelle:</span>
                  <span className="font-mono text-gold-light font-semibold bg-gold-muted/10 border border-gold-muted/20 px-2 py-0.5 rounded" data-testid="daily-source">
                    {pulseData ? pulseData.source : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Leitelement:</span>
                  <span className="font-mono text-gold-light font-medium">{fmt(pulseData?.dominantPhase)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Resonanzfaktor:</span>
                  <span className="font-mono text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded">
                    {pulseData?.qiResonance !== null && pulseData?.qiResonance !== undefined ? `${pulseData.qiResonance}%` : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Schwingungswort:</span>
                  <span className="font-mono text-red-300 font-medium">{fmt(pulseData?.coachingKeyword)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card p-6 sm:p-8 rounded-2xl min-h-[300px] flex flex-col justify-between space-y-6">
            {!pulseData && !loading && !errorMsg && (
              <div className="flex-grow flex flex-col items-center justify-center text-center space-y-6 py-8">
                <div className="h-20 w-20 rounded-full border border-gold-muted/20 flex items-center justify-center bg-gold-muted/5">
                  <Activity className="h-10 w-10 text-gold-muted" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-serif text-xl font-bold text-slate-100">Tagespuls abrufen</h4>
                  <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed font-sans">
                    Ruft Ihre tagesspezifische Resonanz aus der FuFirE-Experience-Schnittstelle ab.
                  </p>
                </div>
                <button
                  id="channel-pulse-btn"
                  onClick={handleChannelPulse}
                  className="px-6 py-3 bg-gradient-to-r from-gold-muted to-gold-dark hover:from-gold-light hover:to-gold-muted text-stone-950 font-serif font-bold tracking-widest rounded-xl transition duration-300 transform active:scale-95 glow-gold shadow cursor-pointer border border-gold-light/20"
                >
                  TAGESPULS ABRUFEN
                </button>
              </div>
            )}

            {loading && (
              <div className="flex-grow flex flex-col items-center justify-center text-center space-y-6 py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="h-16 w-16 border-2 border-gold-muted border-t-transparent rounded-full glow-gold"
                />
                <p className="text-xs text-stone-400 font-mono italic">FuFirE-Experience wird abgefragt...</p>
              </div>
            )}

            {errorMsg && !loading && (
              <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4 py-10">
                <AlertTriangle className="h-10 w-10 text-red-400" />
                <p className="text-sm text-red-300 max-w-sm font-sans" data-testid="daily-error">{errorMsg}</p>
                <button onClick={handleChannelPulse} className="px-4 py-2 border border-gold-muted/30 text-gold-light rounded text-xs">
                  Erneut versuchen
                </button>
              </div>
            )}

            {pulseData && !loading && !available && (
              <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4 py-10" data-testid="daily-missing">
                <Info className="h-10 w-10 text-gold-muted" />
                <h5 className="font-serif text-lg font-bold text-stone-200">Tagespuls aktuell nicht verfügbar</h5>
                <p className="text-xs text-stone-400 max-w-sm font-sans leading-relaxed">
                  Die FuFirE-Experience-Schnittstelle liefert derzeit keine Tagesdaten. Es werden bewusst keine lokal
                  erfundenen Werte angezeigt (source: {pulseData.source}).
                </p>
              </div>
            )}

            {pulseData && !loading && available && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gold-muted/10 pb-4">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-gold-muted font-bold">
                    FuFirE Tagespuls · {pulseData.date}
                  </span>
                  <button
                    id="re-channel-pulse-btn"
                    onClick={handleChannelPulse}
                    className="p-1.5 rounded hover:bg-gold-muted/5 text-stone-500 hover:text-gold-light transition font-mono text-[10px] uppercase flex items-center space-x-1 border border-transparent hover:border-gold-muted/20 cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Aktualisieren</span>
                  </button>
                </div>
                <div className="font-sans text-sm text-stone-300 space-y-4 leading-relaxed font-light">
                  {fmt(pulseData.description)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
