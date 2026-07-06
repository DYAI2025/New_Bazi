import React from "react";
import { ProfileViewModel } from "../viewmodels/profileViewModel";
import { BirthData } from "../types";
import { BazodiacClient, DailyPulseResponse, toBirthInputPayload } from "../api/bazodiacClient";
import {
  Activity,
  RefreshCw,
  Info,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Sparkles,
  Zap,
  MessageSquareQuote
} from "lucide-react";
import { motion } from "motion/react";

interface DailyPulseProps {
  viewModel: ProfileViewModel;
  birthData: BirthData;
}

/** Tagesnavigation is bounded to ±7 days around today (engine target_date window). */
const MAX_DAY_OFFSET = 7;

/**
 * In-memory cache keyed by birth payload + target date. Lives at module level
 * so switching tabs (which unmounts the component) does not refetch a day that
 * was already loaded. A refresh click bypasses it explicitly.
 */
const pulseCache = new Map<string, DailyPulseResponse>();

function localDateString(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateLabel(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString("de-DE", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

/** Honest label: a day other than today is a preview/lookback, not "your day". */
function offsetLabel(offset: number): string {
  if (offset === 0) return "Heute";
  if (offset > 0) return `Vorschau (+${offset} ${offset === 1 ? "Tag" : "Tage"})`;
  return `Rückblick (${offset} ${offset === -1 ? "Tag" : "Tage"})`;
}

interface SectionCardProps {
  testId: string;
  title: string;
  icon: React.ReactNode;
  section: { summary: string | null; themes: string[]; caution: string | null; opportunity: string | null };
  reference?: React.ReactNode;
  extraText?: string | null;
}

function SectionCard({ testId, title, icon, section, reference, extraText }: SectionCardProps) {
  return (
    <div className="glass-card p-5 rounded-2xl space-y-4 h-full flex flex-col" data-testid={testId}>
      <h5 className="font-serif text-base font-bold text-gold-light flex items-center space-x-2 border-b border-gold-muted/10 pb-3">
        {icon}
        <span>{title}</span>
      </h5>
      {reference}
      {section.summary && (
        <p className="font-sans text-sm text-stone-300 leading-relaxed font-light">{section.summary}</p>
      )}
      {extraText && (
        <p className="font-sans text-sm text-stone-300 leading-relaxed font-light">{extraText}</p>
      )}
      {section.themes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {section.themes.map((theme) => (
            <span
              key={theme}
              className="font-mono text-[10px] uppercase tracking-wider text-gold-light bg-gold-muted/10 border border-gold-muted/20 px-2 py-0.5 rounded"
            >
              {theme}
            </span>
          ))}
        </div>
      )}
      {section.opportunity && (
        <div className="text-xs font-sans leading-relaxed border-l-2 border-emerald-500/40 pl-3">
          <span className="block font-mono text-[9px] uppercase tracking-widest text-emerald-400/80 mb-1">Chance</span>
          <span className="text-stone-400">{section.opportunity}</span>
        </div>
      )}
      {section.caution && (
        <div className="text-xs font-sans leading-relaxed border-l-2 border-amber-500/40 pl-3">
          <span className="block font-mono text-[9px] uppercase tracking-widest text-amber-400/80 mb-1">Spannungsfeld</span>
          <span className="text-stone-400">{section.caution}</span>
        </div>
      )}
    </div>
  );
}

export default function DailyPulse({ birthData }: DailyPulseProps) {
  const [pulseData, setPulseData] = React.useState<DailyPulseResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [dayOffset, setDayOffset] = React.useState(0);

  const targetDate = localDateString(dayOffset);
  const birthKey = React.useMemo(() => JSON.stringify(toBirthInputPayload(birthData)), [birthData]);
  const cacheKey = `${birthKey}|${targetDate}`;

  const loadPulse = React.useCallback(
    async (force: boolean) => {
      if (!force) {
        const cached = pulseCache.get(cacheKey);
        if (cached) {
          setPulseData(cached);
          setErrorMsg(null);
          return;
        }
      }
      setLoading(true);
      setErrorMsg(null);
      setPulseData(null);
      try {
        const data = await BazodiacClient.fetchDailyPulse(birthData, targetDate);
        pulseCache.set(cacheKey, data);
        setPulseData(data);
      } catch (err: any) {
        console.error("Failed to load daily pulse:", err);
        setErrorMsg(err?.message || "Tagespuls konnte nicht von FuFirE geladen werden.");
      } finally {
        setLoading(false);
      }
    },
    [birthData, cacheKey, targetDate]
  );

  // Auto-load when the tab opens or the selected day changes. Already-loaded
  // days come straight from the cache (no refetch on tab switches).
  React.useEffect(() => {
    void loadPulse(false);
  }, [loadPulse]);

  const available = pulseData?.available && pulseData.source === "fufire";
  const eastern = pulseData?.eastern ?? null;
  const fusion = pulseData?.fusion ?? null;

  return (
    <div id="daily-pulse-container" className="space-y-8">
      <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-gold-muted/10 mb-4 flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-3">
            <Activity className="h-6 w-6 text-gold-muted shrink-0" />
            <h3 className="font-serif text-2xl font-bold text-gold-light">Der Tagespuls</h3>
          </div>
          <div className="flex items-center space-x-2 shrink-0" data-testid="daily-day-nav">
            <button
              data-testid="daily-prev"
              aria-label="Vorheriger Tag"
              onClick={() => setDayOffset((o) => Math.max(o - 1, -MAX_DAY_OFFSET))}
              disabled={dayOffset <= -MAX_DAY_OFFSET || loading}
              className="p-1.5 rounded border border-gold-muted/20 text-gold-muted hover:text-gold-light hover:bg-gold-muted/5 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span
              className="font-mono text-xs text-gold-muted font-medium bg-gold-muted/5 border border-gold-muted/20 px-3 py-1.5 rounded-lg text-center min-w-[230px]"
              data-testid="daily-day-label"
            >
              {offsetLabel(dayOffset)} · {formatDateLabel(targetDate)}
            </span>
            <button
              data-testid="daily-next"
              aria-label="Nächster Tag"
              onClick={() => setDayOffset((o) => Math.min(o + 1, MAX_DAY_OFFSET))}
              disabled={dayOffset >= MAX_DAY_OFFSET || loading}
              className="p-1.5 rounded border border-gold-muted/20 text-gold-muted hover:text-gold-light hover:bg-gold-muted/5 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <p className="text-sm text-stone-400 leading-relaxed max-w-3xl">
          Der Tagespuls stammt aus der FuFirE-Experience-Schnittstelle (<span className="font-mono">/v1/experience/daily</span>).
          Er wird nicht lokal erzeugt; fehlt die Schnittstelle, erscheint ein klarer Missing-State.
        </p>
      </div>

      <div className="glass-card p-6 sm:p-8 rounded-2xl min-h-[300px] flex flex-col space-y-6">
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
            <button
              onClick={() => void loadPulse(true)}
              className="px-4 py-2 border border-gold-muted/30 text-gold-light rounded text-xs cursor-pointer"
            >
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
            <div className="flex items-center justify-between border-b border-gold-muted/10 pb-4 flex-wrap gap-2">
              <span className="font-mono text-[9px] uppercase tracking-widest text-gold-muted font-bold">
                FuFirE Tagespuls · {pulseData.date} · Quelle:{" "}
                <span data-testid="daily-source">{pulseData.source}</span>
              </span>
              <button
                id="re-channel-pulse-btn"
                onClick={() => void loadPulse(true)}
                className="p-1.5 rounded hover:bg-gold-muted/5 text-stone-500 hover:text-gold-light transition font-mono text-[10px] uppercase flex items-center space-x-1 border border-transparent hover:border-gold-muted/20 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Aktualisieren</span>
              </button>
            </div>

            {(pulseData.jieqiNote || pulseData.weekdayNote) && (
              <p className="font-sans text-xs text-stone-500 leading-relaxed" data-testid="daily-context">
                {[pulseData.jieqiNote, pulseData.weekdayNote].filter(Boolean).join(" · ")}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
              {pulseData.western && (
                <SectionCard
                  testId="daily-card-west"
                  title="West"
                  icon={<Sun className="h-4 w-4 text-gold-muted" />}
                  section={pulseData.western}
                />
              )}
              {eastern && (
                <SectionCard
                  testId="daily-card-east"
                  title="Ost"
                  icon={<Moon className="h-4 w-4 text-gold-muted" />}
                  section={eastern}
                  reference={
                    (eastern.dayMaster || eastern.dailyPillar || eastern.relationToDayMaster || eastern.jieqi) ? (
                      <p className="font-mono text-[10px] text-stone-500 leading-relaxed" data-testid="daily-east-reference">
                        {[
                          eastern.dayMaster ? `Day Master ${eastern.dayMaster}` : null,
                          eastern.dailyPillar ? `Tagessäule ${eastern.dailyPillar.stem}–${eastern.dailyPillar.branch}` : null,
                          eastern.relationToDayMaster ? `Bezug: ${eastern.relationToDayMaster}` : null,
                          eastern.jieqi ? `Solarterm ${eastern.jieqi}` : null
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    ) : undefined
                  }
                />
              )}
              {fusion && (
                <SectionCard
                  testId="daily-card-fusion"
                  title="Fusion"
                  icon={<Sparkles className="h-4 w-4 text-gold-muted" />}
                  section={{ summary: fusion.summary, themes: [], caution: null, opportunity: null }}
                  extraText={fusion.synthesis}
                />
              )}
            </div>

            {pulseData.action && (
              <div className="glass-card p-5 rounded-2xl border border-gold-muted/20 bg-gold-muted/5" data-testid="daily-action">
                <h5 className="font-serif text-base font-bold text-gold-light flex items-center space-x-2 mb-2">
                  <Zap className="h-4 w-4 text-gold-muted" />
                  <span>Impuls des Tages</span>
                </h5>
                <p className="font-sans text-sm text-stone-300 leading-relaxed font-light">{pulseData.action}</p>
              </div>
            )}

            {pulseData.pushText && (
              <div className="flex items-start space-x-2 text-stone-400" data-testid="daily-push-text">
                <MessageSquareQuote className="h-4 w-4 text-gold-muted shrink-0 mt-0.5" />
                <p className="font-sans text-xs leading-relaxed">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-gold-muted block mb-1">Tages-Kurzform</span>
                  „{pulseData.pushText}“
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
