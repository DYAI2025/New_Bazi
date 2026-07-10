import React from "react";
import { BirthData } from "../../types";
import { BazodiacClient, DailyPulseResponse, toBirthInputPayload } from "../../api/bazodiacClient";
import {
  Activity,
  RefreshCw,
  AlertTriangle,
  Info,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Sparkles,
  Check,
  PenLine,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion } from "motion/react";
import {
  ElementDe,
  branchInfo,
  jieqiLabel,
  signLabel,
  stemInfo,
} from "../../utils/daily/baziLabels";
import { Reaction, deriveDayType, pickSpeaker } from "../../utils/daily/dayTypeSelector";
import { encounterOffer } from "../../utils/daily/encounterChoices";
import {
  DailyReflection,
  getReflection,
  lastReactionForType,
  saveReflection,
} from "../../utils/daily/reflectionStore";
import { syncReflections } from "../../utils/daily/reflectionSync";
import { sectorLabel } from "../../utils/daily/sectorLabels";
import Wochenbogen from "./Wochenbogen";

/**
 * TagespulsV2 — "Muster-Spiegel an der Signatur" (Etappe 1).
 *
 * Der Tag ist eine Lesung GEGEN die stabile 5D-Signatur, kein Einzelhoroskop:
 * 1. Perturbations-Ansicht: welches der 5 Elemente die Tagessäule anspricht
 * 2. Tagestyp-Karte (Ost, Kapazitätsrahmen — das "Womit")
 * 3. West-Karte (Befindlichkeitsfärbung — das "Wie"), leerer Aszendent-Sitz
 *    bei fehlender Geburtszeit
 * 4. Wiedererkennungs-Tap ("Kennst du das von dir?") — die dritte Antwort
 *    ist der Befehl: nächster gleicher Tagestyp liest von der Gegenseite
 * 5. Begegnungswahl als Zielpunkt ("Womit begegnest du dem Tag?")
 *
 * Jede Karte trägt ihren Provenance-Chip (Beobachtung / Herleitung /
 * Interpretation). Fehlende Daten bleiben sichtbar leer — nichts wird
 * erfunden. Reflexionen bleiben auf diesem Gerät (localStorage) und sind
 * jederzeit löschbar.
 */

const MAX_DAY_OFFSET = 7;
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
  return parsed.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
}

function offsetLabel(offset: number): string {
  if (offset === 0) return "Heute";
  if (offset > 0) return `Vorschau (+${offset} ${offset === 1 ? "Tag" : "Tage"})`;
  return `Rückblick (${offset} ${offset === -1 ? "Tag" : "Tage"})`;
}

// ---------------------------------------------------------------------------
// Provenance-Chip
// ---------------------------------------------------------------------------

type Provenance = "Beobachtung" | "Herleitung" | "Interpretation";

function Chip({ kind, anchor }: { kind: Provenance; anchor: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-stone-500 border border-gold-muted/15 rounded px-1.5 py-0.5"
      title={anchor}
      data-testid={`chip-${kind.toLowerCase()}`}
    >
      {kind}
      <span className="normal-case tracking-normal text-stone-600">· {anchor}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Perturbations-Pentagon (2D, ehrlich): zeigt die stabile 5D-Signatur und
// markiert, WELCHE Dimension die heutige Tagessäule anspricht. Es wird keine
// Stärke der Tages-Wirkung behauptet — nur die Richtung ist Datenlage.
// ---------------------------------------------------------------------------

const ELEMENT_ORDER: ElementDe[] = ["Holz", "Feuer", "Erde", "Metall", "Wasser"];
const ELEMENT_COLOR: Record<ElementDe, string> = {
  Holz: "#7fae6a",
  Feuer: "#c96a4a",
  Erde: "#b08d4f",
  Metall: "#b8b6ad",
  Wasser: "#5f8fb4",
};

function pentagonPoints(elements: Record<string, number>, cx: number, cy: number, rMax: number): string {
  const max = Math.max(...ELEMENT_ORDER.map((e) => elements[e] ?? 0), 0.0001);
  return ELEMENT_ORDER.map((el, i) => {
    const angle = (i * 72 - 90) * (Math.PI / 180);
    const r = rMax * ((elements[el] ?? 0) / max);
    return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
  }).join(" ");
}

function axisPoint(index: number, cx: number, cy: number, r: number): { x: number; y: number } {
  const angle = (index * 72 - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function PerturbationView({
  elements,
  dayElement,
}: {
  elements: Record<string, number>;
  dayElement: ElementDe | null;
}) {
  const cx = 110;
  const cy = 105;
  const rMax = 78;
  const dayIndex = dayElement ? ELEMENT_ORDER.indexOf(dayElement) : -1;
  return (
    <svg
      viewBox="0 0 220 210"
      className="w-full max-w-[260px] mx-auto"
      role="img"
      aria-label="Stabile Fünf-Elemente-Signatur; markiert ist die Dimension, die die heutige Tagessäule anspricht"
      data-testid="perturbation-view"
    >
      {/* Achsen + Außenring */}
      {ELEMENT_ORDER.map((el, i) => {
        const outer = axisPoint(i, cx, cy, rMax + 6);
        const label = axisPoint(i, cx, cy, rMax + 18);
        return (
          <g key={el}>
            <line x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="rgba(212,175,55,0.14)" />
            <text
              x={label.x}
              y={label.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9"
              fill={i === dayIndex ? ELEMENT_COLOR[el] : "rgba(168,162,158,0.8)"}
              fontFamily="ui-monospace, Menlo, monospace"
            >
              {el}
            </text>
          </g>
        );
      })}
      {/* Stabile Signatur */}
      <polygon
        points={pentagonPoints(elements, cx, cy, rMax)}
        fill="rgba(212,175,55,0.13)"
        stroke="#d4af37"
        strokeWidth="1.3"
      />
      {/* Tages-Marker: pulsierender Ring auf der angesprochenen Dimension */}
      {dayIndex >= 0 && (
        <g data-testid="perturbation-day-marker">
          {(() => {
            const max = Math.max(...ELEMENT_ORDER.map((e) => elements[e] ?? 0), 0.0001);
            const r = rMax * ((elements[ELEMENT_ORDER[dayIndex]] ?? 0) / max);
            const p = axisPoint(dayIndex, cx, cy, r);
            const tip = axisPoint(dayIndex, cx, cy, rMax + 6);
            return (
              <>
                <line
                  x1={p.x}
                  y1={p.y}
                  x2={tip.x}
                  y2={tip.y}
                  stroke={ELEMENT_COLOR[ELEMENT_ORDER[dayIndex]]}
                  strokeWidth="1.6"
                  strokeDasharray="4 3"
                />
                <circle cx={p.x} cy={p.y} r="5" fill="none" stroke={ELEMENT_COLOR[ELEMENT_ORDER[dayIndex]]} strokeWidth="1.6">
                  <animate attributeName="r" values="4;7;4" dur="2.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.9;0.35;0.9" dur="2.4s" repeatCount="indefinite" />
                </circle>
              </>
            );
          })()}
        </g>
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Hauptkomponente
// ---------------------------------------------------------------------------

interface TagespulsV2Props {
  birthData: BirthData;
}

export default function TagespulsV2({ birthData }: TagespulsV2Props) {
  const [pulseData, setPulseData] = React.useState<DailyPulseResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [dayOffset, setDayOffset] = React.useState(0);
  const [reflection, setReflection] = React.useState<DailyReflection | null>(null);
  const [freitext, setFreitext] = React.useState("");
  const [freitextOpen, setFreitextOpen] = React.useState(false);
  const [wochenbogenOpen, setWochenbogenOpen] = React.useState(false);

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
    [birthData, cacheKey, targetDate],
  );

  React.useEffect(() => {
    void loadPulse(false);
  }, [loadPulse]);

  React.useEffect(() => {
    setReflection(getReflection(targetDate));
    setFreitext("");
    setFreitextOpen(false);
  }, [targetDate]);

  // Stiller Abgleich einmal beim Öffnen des Tagespuls — bewusst leeres
  // Dep-Array: der Sync gehört zum Betreten der Ansicht, nicht zu Re-Renders.
  // Ohne Session ist er ein No-op; Fehler bleiben unsichtbar (Konsole).
  React.useEffect(() => {
    void syncReflections();
  }, []);

  const available = pulseData?.available && pulseData.source === "fufire";
  const eastern = pulseData?.eastern ?? null;
  const natal = pulseData?.natal ?? null;
  const westEvidence = pulseData?.westEvidence ?? null;

  // Abgeleitete Tages-Größen (pure functions, im Methodik-Tab offengelegt)
  const dayType = deriveDayType(eastern?.relationToDayMaster);
  const dayStem = stemInfo(eastern?.dailyPillar?.stem);
  const dayBranch = branchInfo(eastern?.dailyPillar?.branch);
  const dayElement: ElementDe | null = dayStem?.element ?? null;
  const lastReaction = dayType ? lastReactionForType(dayType.id, targetDate) : null;
  const speaker = pickSpeaker({
    dayMasterStem: eastern?.dayMaster,
    relationRaw: eastern?.relationToDayMaster,
    natalFocus: westEvidence?.natalFocus,
    elements: natal?.elements,
    lastReactionForType: lastReaction,
  });
  const offer = encounterOffer(dayType, dayElement);
  const westArchetyp = (westEvidence?.natalFocus ?? [])
    .map((f) => (f === "sun" ? "Sonne" : f === "ascendant" ? "Aszendent" : f === "moon" ? "Mond" : null))
    .filter(Boolean) as string[];

  const tapReaction = (reaction: Reaction) => {
    if (!dayType) return;
    setReflection(
      saveReflection({
        date: targetDate,
        dayType: dayType.id,
        reaction,
        encounterChoice: reflection?.encounterChoice ?? null,
        vetoChoice: reflection?.vetoChoice ?? null,
      }),
    );
    void syncReflections(); // fire-and-forget: localStorage ist bereits die Wahrheit
  };

  const chooseEncounter = (choice: string | null) => {
    if (!dayType) return;
    setReflection(
      saveReflection({
        date: targetDate,
        dayType: dayType.id,
        reaction: reflection?.reaction ?? null,
        encounterChoice: choice,
        vetoChoice: reflection?.vetoChoice ?? null,
      }),
    );
    setFreitextOpen(false);
    void syncReflections(); // fire-and-forget: localStorage ist bereits die Wahrheit
  };

  const chooseVeto = (veto: string | null) => {
    if (!dayType) return;
    setReflection(
      saveReflection({
        date: targetDate,
        dayType: dayType.id,
        reaction: reflection?.reaction ?? null,
        encounterChoice: reflection?.encounterChoice ?? null,
        vetoChoice: veto,
      }),
    );
    void syncReflections(); // fire-and-forget: localStorage ist bereits die Wahrheit
  };

  return (
    <div id="daily-pulse-container" className="space-y-6" data-testid="tagespuls-v2">
      {/* Kopf + Tagesnavigation */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
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
              className="font-mono text-xs text-gold-muted font-medium bg-gold-muted/5 border border-gold-muted/20 px-3 py-1.5 rounded-lg text-center min-w-[210px]"
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
      </div>

      {loading && (
        <div className="glass-card p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-6 py-14">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="h-14 w-14 border-2 border-gold-muted border-t-transparent rounded-full glow-gold"
          />
          <p className="text-xs text-stone-400 font-mono italic">FuFirE-Experience wird abgefragt...</p>
        </div>
      )}

      {errorMsg && !loading && (
        <div className="glass-card p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 py-10">
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
        <div className="glass-card p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 py-10" data-testid="daily-missing">
          <Info className="h-10 w-10 text-gold-muted" />
          <h5 className="font-serif text-lg font-bold text-stone-200">Tagespuls aktuell nicht verfügbar</h5>
          <p className="text-xs text-stone-400 max-w-sm font-sans leading-relaxed">
            Die FuFirE-Experience-Schnittstelle liefert derzeit keine Tagesdaten. Es werden bewusst keine lokal
            erfundenen Werte angezeigt (source: {pulseData.source}).
          </p>
        </div>
      )}

      {pulseData && !loading && available && (
        <>
          {/* 1. Perturbations-Ansicht + Faktenzeile */}
          <div className="glass-card p-6 rounded-2xl space-y-4" data-testid="daily-perturbation">
            {natal?.elements ? (
              <PerturbationView elements={natal.elements} dayElement={dayElement} />
            ) : (
              <p className="text-sm text-stone-400 text-center py-6" data-testid="perturbation-missing">
                Die stabile 5-Elemente-Signatur liegt für dieses Profil nicht vor — die
                Perturbations-Ansicht bleibt bewusst leer.
              </p>
            )}
            <div className="text-center space-y-2">
              <p className="font-mono text-[11px] text-stone-400" data-testid="daily-facts">
                {[
                  formatDateLabel(pulseData.date),
                  eastern?.jieqi ? jieqiLabel(eastern.jieqi) : null,
                  dayStem && dayBranch
                    ? `Tagessäule ${dayStem.pinyin}-${dayBranch.pinyin} ${dayStem.hanzi}${dayBranch.hanzi} (${dayStem.element} über ${dayBranch.element}, ${dayBranch.animal})`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <Chip kind="Beobachtung" anchor="FuFirE eastern.evidence (Tagessäule, Jieqi)" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
            {/* 2. Tagestyp-Karte (Ost — Kapazitätsrahmen) */}
            <div className="glass-card p-5 rounded-2xl space-y-3" data-testid="daily-daytype-card">
              <h5 className="font-serif text-base font-bold text-gold-light flex items-center space-x-2 border-b border-gold-muted/10 pb-3">
                <Moon className="h-4 w-4 text-gold-muted" />
                <span>Kapazitätsrahmen (Ost)</span>
              </h5>
              {dayType && speaker ? (
                <>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-gold-muted" data-testid="daily-speaker">
                    {speaker.label}
                    {speaker.perspective === "gegenseite" && (
                      <span className="ml-2 text-fusion-blue normal-case tracking-normal" data-testid="daily-gegenseite-badge">
                        · Gegenseiten-Lesart (deine letzte Antwort)
                      </span>
                    )}
                  </p>
                  <p className="font-serif text-lg text-gold-light" data-testid="daily-daytype-label">{dayType.label}</p>
                  <p className="font-sans text-sm text-stone-300 leading-relaxed font-light">{dayType.frame}</p>
                  {eastern?.summary && (
                    <p className="font-sans text-xs text-stone-400 leading-relaxed">{eastern.summary}</p>
                  )}
                  <Chip kind="Herleitung" anchor="Tagessäule + Day-Master (relation_to_day_master)" />
                </>
              ) : (
                <p className="text-sm text-stone-400" data-testid="daily-daytype-missing">
                  Die Engine liefert für diesen Tag keinen auswertbaren Day-Master-Bezug — der
                  Kapazitätsrahmen bleibt leer.
                </p>
              )}
            </div>

            {/* 3. West-Karte (Befindlichkeitsfärbung) */}
            <div className="glass-card p-5 rounded-2xl space-y-3" data-testid="daily-west-card">
              <h5 className="font-serif text-base font-bold text-gold-light flex items-center space-x-2 border-b border-gold-muted/10 pb-3">
                <Sun className="h-4 w-4 text-gold-muted" />
                <span>Befindlichkeitsfärbung (West)</span>
              </h5>
              {westArchetyp.length > 0 ? (
                <p className="font-mono text-[10px] uppercase tracking-widest text-gold-muted" data-testid="daily-west-archetyp">
                  {westArchetyp.join(" + ")}
                  {natal?.sunSign && westArchetyp.includes("Sonne") && (
                    <span className="normal-case tracking-normal text-stone-500"> · Sonne in {signLabel(natal.sunSign)}</span>
                  )}
                </p>
              ) : null}
              {pulseData.western?.summary ? (
                <p className="font-sans text-sm text-stone-300 leading-relaxed font-light">{pulseData.western.summary}</p>
              ) : (
                <p className="text-sm text-stone-400">Für diesen Tag liegt keine westliche Färbung vor.</p>
              )}
              {/* Sektoren-Verortung: nur bekannte Labels — kein Label, keine Zeile */}
              {(westEvidence?.transitSectors ?? []).some((s) => sectorLabel(s)) && (
                <p className="font-mono text-[10px] text-stone-500" data-testid="daily-west-sectors">
                  Aktivierte Bereiche: {(westEvidence!.transitSectors).map(sectorLabel).filter(Boolean).join(" · ")}
                </p>
              )}
              {/* Ehrlichkeit als Interface: leerer Aszendent-Sitz bei fehlender Geburtszeit */}
              {natal && !natal.ascendantSign && (
                <p className="text-xs text-stone-500 border-l-2 border-gold-muted/20 pl-3" data-testid="daily-ascendant-empty">
                  Der Aszendent-Sitz bleibt leer: ohne belastbare Geburtszeit wird hier nichts behauptet.
                </p>
              )}
              <Chip kind="Interpretation" anchor="Transit-Fokus (western.evidence.natal_focus)" />
            </div>
          </div>

          {/* 4. Fusions-Zeile — konservativ: Engine-Synthese zeigen, Divergenz-Urteil erst mit Verortung (Etappe 2) */}
          {pulseData.fusion?.synthesis && (
            <div className="glass-card p-5 rounded-2xl space-y-2" data-testid="daily-fusion-line">
              <h5 className="font-serif text-base font-bold text-gold-light flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-gold-muted" />
                <span>Fusion</span>
              </h5>
              <p className="font-sans text-sm text-stone-300 leading-relaxed font-light">{pulseData.fusion.synthesis}</p>
              <Chip kind="Interpretation" anchor="FuFirE fusion.synthesis (Engine-Text)" />
            </div>
          )}

          {/* 5. Wiedererkennungs-Tap */}
          {dayType && (
            <div className="glass-card p-5 rounded-2xl space-y-3" data-testid="daily-recognition">
              <p className="font-sans text-sm text-stone-300">
                Der Rat liest einen <b className="text-gold-light">{dayType.label}</b>.{" "}
                <span className="text-stone-400">Kennst du das von dir — an Tagen wie diesem?</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {([
                  ["kenne_ich", "Kenne ich"],
                  ["teils", "Teils"],
                  ["gegenseite", "Bei mir anders → zeig die Gegenseite"],
                ] as [Reaction, string][]).map(([value, label]) => (
                  <button
                    key={value}
                    data-testid={`recognition-${value}`}
                    onClick={() => tapReaction(value)}
                    className={`px-4 py-2 rounded-lg border text-xs font-sans transition cursor-pointer ${
                      reflection?.reaction === value
                        ? "border-gold-muted/60 bg-gold-muted/15 text-gold-light"
                        : "border-gold-muted/20 text-stone-300 hover:border-gold-muted/40 hover:bg-gold-muted/5"
                    }`}
                  >
                    {reflection?.reaction === value && <Check className="inline h-3 w-3 mr-1" />}
                    {label}
                  </button>
                ))}
              </div>
              {reflection?.reaction === "gegenseite" && (
                <p className="text-xs text-stone-400" data-testid="recognition-gegenseite-note">
                  Notiert — beim nächsten {dayType.label} liest der Rat von der Gegenseite.
                </p>
              )}
            </div>
          )}

          {/* 6. Begegnungswahl — Zielpunkt des Rituals */}
          <div className="glass-card p-5 rounded-2xl space-y-3 border border-gold-muted/20" data-testid="daily-encounter">
            <h5 className="font-serif text-base font-bold text-gold-light">Womit begegnest du dem Tag?</h5>
            {reflection?.encounterChoice ? (
              <div className="space-y-2" data-testid="encounter-done">
                <p className="font-sans text-sm text-stone-300">
                  Deine Wahl ist notiert: <b className="text-gold-light">{reflection.encounterChoice}</b>
                  {reflection.vetoChoice && (
                    <span className="text-stone-400"> — und heute versuchst du nicht, {reflection.vetoChoice}.</span>
                  )}
                </p>
                <button
                  data-testid="encounter-reset"
                  onClick={() => chooseEncounter(null)}
                  className="text-xs text-stone-500 hover:text-gold-light underline underline-offset-2 cursor-pointer"
                >
                  Wahl ändern
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {(offer?.qualities ?? []).map((q) => (
                    <button
                      key={q}
                      data-testid={`encounter-${q}`}
                      onClick={() => chooseEncounter(q)}
                      className="px-4 py-2 rounded-lg border border-gold-muted/25 text-xs font-sans text-stone-200 hover:border-gold-muted/50 hover:bg-gold-muted/10 transition cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                  <button
                    data-testid="encounter-freitext-toggle"
                    onClick={() => setFreitextOpen((o) => !o)}
                    className="px-4 py-2 rounded-lg border border-gold-muted/15 text-xs font-sans text-stone-400 hover:border-gold-muted/40 transition cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <PenLine className="h-3 w-3" /> Eigene Wahl
                  </button>
                </div>
                {freitextOpen && (
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (freitext.trim()) chooseEncounter(freitext.trim());
                    }}
                  >
                    <input
                      data-testid="encounter-freitext-input"
                      value={freitext}
                      onChange={(e) => setFreitext(e.target.value)}
                      maxLength={60}
                      placeholder="z. B. Gelassenheit"
                      className="flex-grow bg-obsidian-deep/65 text-stone-200 rounded-lg border border-gold-muted/20 px-3 py-2 text-sm focus:border-gold-light focus:outline-none"
                    />
                    <button
                      type="submit"
                      data-testid="encounter-freitext-submit"
                      className="px-4 py-2 rounded-lg border border-gold-muted/30 text-xs text-gold-light cursor-pointer"
                    >
                      Wählen
                    </button>
                  </form>
                )}
                {offer && (
                  <div className="pt-2 border-t border-gold-muted/10 space-y-1.5">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-stone-500">
                      Optional — Ich versuche heute nicht …
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {offer.vetoOptions.map((v) => (
                        <button
                          key={v}
                          data-testid={`veto-${v}`}
                          onClick={() => chooseVeto(reflection?.vetoChoice === v ? null : v)}
                          className={`px-3 py-1.5 rounded-lg border text-[11px] font-sans transition cursor-pointer ${
                            reflection?.vetoChoice === v
                              ? "border-gold-muted/50 bg-gold-muted/10 text-gold-light"
                              : "border-gold-muted/15 text-stone-400 hover:border-gold-muted/35"
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-[11px] text-stone-500">
                  Angebote aus der Chance-Seite des Tagestyps — keine Vorgaben. „Heute keine Wahl“ ist gleichwertig:
                  einfach weiterlesen.
                </p>
                {offer && <Chip kind="Herleitung" anchor={offer.anchor} />}
              </>
            )}
          </div>

          {/* 7. Wochenbogen — ruhiger Rückblick, aufklappbar (kein Pflichtteil des Rituals) */}
          <div className="text-center">
            <button
              onClick={() => setWochenbogenOpen((o) => !o)}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-stone-400 hover:text-gold-light transition-colors cursor-pointer"
              data-testid="wochenbogen-toggle"
            >
              Dein Wochenbogen
              {wochenbogenOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
          {wochenbogenOpen && <Wochenbogen />}

          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-stone-500" data-testid="daily-footer">
              Modellergebnis, keine Eigenschaft. Antworten bleiben auf diesem Gerät und sind jederzeit löschbar.
            </p>
            <button
              onClick={() => void loadPulse(true)}
              className="p-1.5 rounded hover:bg-gold-muted/5 text-stone-500 hover:text-gold-light transition font-mono text-[10px] uppercase flex items-center space-x-1 border border-transparent hover:border-gold-muted/20 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Aktualisieren</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
