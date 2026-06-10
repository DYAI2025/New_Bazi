import React from "react";
import { BookOpen, Compass, Flame, Table, Shield } from "lucide-react";
import { ProfileViewModel } from "../viewmodels/profileViewModel";

interface MethodologyProps {
  viewModel: ProfileViewModel;
}

const STATUS_STYLES: Record<string, string> = {
  "server-used": "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
  "fallback-local": "text-amber-300 bg-amber-500/10 border-amber-500/30",
  missing: "text-stone-400 bg-stone-500/10 border-stone-500/30",
  error: "text-red-300 bg-red-500/10 border-red-500/30"
};

const SOURCE_LABELS: Record<string, string> = {
  "fufire-chart": "FuFirE /chart",
  "fufire-orchestrated": "FuFirE /v1/calculate/* (orchestriert)",
  "fallback-local": "Lokaler Fallback (explizit aktiviert)",
  missing: "Nicht verfügbar"
};

export default function Methodology({ viewModel }: MethodologyProps) {
  const provs = viewModel?.provenance || [];
  const overallSource = viewModel?.source || "missing";

  return (
    <div id="method-container" className="space-y-8">

      {/* Intro section */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-gold-muted/10 mb-4 font-serif flex-col sm:flex-row gap-3">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-6 w-6 text-gold-muted shrink-0" />
            <h3 className="text-2xl font-bold text-gold-light">
              Schnittstellen-Herkunft & Capability-Matrix
            </h3>
          </div>
          <span
            data-testid="overall-source"
            className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded border ${overallSource === "fallback-local" ? STATUS_STYLES["fallback-local"] : overallSource === "missing" ? STATUS_STYLES.missing : STATUS_STYLES["server-used"]}`}
          >
            Quelle: {SOURCE_LABELS[overallSource] || overallSource}
          </span>
        </div>
        <p className="text-sm text-stone-400 leading-relaxed max-w-3xl">
          Bazodiac ist ein Same-Origin Backend-for-Frontend. Der Browser ruft ausschließlich <span className="font-mono">/api/*</span>;
          alle astrologischen Daten stammen serverseitig aus der FuFirE-Engine. Diese Matrix zeigt für jedes UI-Feld den
          App-Endpunkt, den FuFirE-Upstream sowie Status und Quelle — ohne jegliche Secrets.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start font-sans text-sm">
        
        {/* Left Column: Astrophysics & Math */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h4 className="font-serif text-lg font-bold text-gold-light flex items-center space-x-2 border-b border-gold-muted/10 pb-3">
              <Compass className="h-4.5 w-4.5 text-gold-muted shrink-0" />
              <span>Westliche Planetenberechnung (Radix-Ephemeriden)</span>
            </h4>
            
            <p className="text-xs text-stone-400 leading-relaxed font-light">
              Zur Bestimmung der planetaren Positionen berechnen wir Julianische Daten (<strong className="text-slate-300">Julian Day</strong>) vom astronomischen Epochen-Nullpunkt J2000.0 (1. Januar 2000, 12:00 Uhr UTC). Die ekliptikalen Längen der Zentralkörper (Sonne, Mond, Merkur, Venus, Mars) werden mittels harmonischer Bahnelement-Gleichungen bestimmt.
            </p>

            <div className="p-3 bg-obsidian-deep/50 rounded-lg border border-gold-muted/5 font-mono text-[11px] text-stone-300 space-y-2">
              <div>
                <span className="text-gold-muted uppercase block text-[9px] font-bold">1. Julian Day (JD) Schlüsselgleichung:</span>
                <code>JD = Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + D + B - 1524.5</code>
              </div>
              <div className="pt-2 border-t border-gold-muted/5">
                <span className="text-gold-muted uppercase block text-[9px] font-bold">2. Ekliptik-Sonne Längengrad-Gleichung:</span>
                <code>Anzahl Tage T = JD - 2451545.0</code>
                <code className="block">L_Sonne = 280.466 + 36000.769 * (T / 36525) + 0.9856 * T</code>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Eastern Kalender Math */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h4 className="font-serif text-lg font-bold text-gold-light flex items-center space-x-2 border-b border-gold-muted/10 pb-3">
              <Flame className="h-4.5 w-4.5 text-gold-muted shrink-0" />
              <span>Östliches BaZi & Wu Xing Gleichheitssystem</span>
            </h4>
            
            <p className="text-xs text-stone-400 leading-relaxed font-light">
              Das altchinesische BaZi (Acht Zeichen) orientiert sich streng am lunisolaren Hia-Kalender. Ein Jahr wechselt hierbei nicht am 1. Januar, sondern exakt zum astronomischen Frühlingsbeginn (<strong className="text-slate-200 font-medium">Li Chun</strong>), der in der Regel auf den 4. Februar fällt.
            </p>

            <p className="text-xs text-stone-400 leading-relaxed font-light">
              Die gewichteten Fünf-Elemente-Prozentwerte repräsentieren den energetischen Einfluss der acht primären Charaktere des Geburtsdiagramms (4 Stämme + 4 Zweige), moduliert durch die jeweiligen Pillar-Stärkenfaktoren (Tagesmeister = 1.5-fache Multiplikation, Jahr = 1.0-fach).
            </p>
          </div>
        </div>

        {/* Linear Provenance Telemetry Grid */}
        <div className="md:col-span-2 space-y-4">
          <h4 className="font-serif text-lg font-bold text-gold-light flex items-center space-x-2">
            <Table className="h-5 w-5 text-gold-muted shrink-0" />
            <span>Aktive Datenpfad-Provenienz (UI-zu-API Matrix)</span>
          </h4>

          <div className="glass-card p-4 rounded-2xl overflow-x-auto border border-gold-muted/10">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="border-b border-gold-muted/15 font-mono text-[9px] uppercase tracking-wider text-[#988F80]">
                  <th className="pb-3 pr-2">UI-Datenfeld</th>
                  <th className="pb-3 pr-2">App API-Endpunkt</th>
                  <th className="pb-3 pr-2">FuFirE Upstream</th>
                  <th className="pb-3 pr-2">Status</th>
                  <th className="pb-3 pr-2">Quelle</th>
                  <th className="pb-3 text-right">Konfidenz</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-muted/5 font-mono text-[11px] text-stone-300">
                {provs.map((prov, index) => (
                  <tr key={index} className="hover:bg-gold-muted/5 duration-200">
                    <td className="py-3 pr-2 text-stone-100 font-sans font-medium">{prov.uiField}</td>
                    <td className="py-3 pr-2 text-gold-muted">{prov.appEndpoint}</td>
                    <td className="py-3 pr-2 text-stone-400">{prov.upstreamEndpoint}</td>
                    <td className="py-3 pr-2">
                      <span className={`px-2 py-0.5 rounded border text-[9px] uppercase ${STATUS_STYLES[prov.status] || STATUS_STYLES.missing}`}>
                        {prov.status}
                      </span>
                    </td>
                    <td className="py-3 pr-2 text-stone-300">{prov.source}</td>
                    <td className="py-3 text-right text-stone-300 font-sans text-xs">{prov.confidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="glass-card p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full border border-gold-muted/20 bg-gold-muted/5 flex items-center justify-center shrink-0">
                <Shield className="h-6 w-6 text-gold-muted" />
              </div>
              <div className="space-y-0.5">
                <h5 className="font-serif text-md font-bold text-gold-light">Datenwahrheit & Provenienz</h5>
                <p className="text-xs text-stone-400 font-sans leading-relaxed max-w-xl">
                  Astrologische Werte werden nicht im Browser berechnet, sondern serverseitig aus FuFirE bezogen.
                  Fehlende Daten erscheinen als Missing-State. Ein lokaler Fallback wird nur dann genutzt, wenn er
                  explizit aktiviert ist, und ist dann durchgehend als <span className="font-mono">fallback-local</span> markiert.
                  Die optionale Gemini-Deutung ist rein poetisch und keine Datenquelle.
                </p>
              </div>
            </div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-gold-muted px-3.5 py-1.5 rounded border border-gold-muted/20 bg-gold-muted/5 font-semibold shrink-0">
              Source of truth: FuFirE
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
