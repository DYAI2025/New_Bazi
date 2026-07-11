import React from "react";
import { CalendarRange } from "lucide-react";
import { dayTypeById } from "../../utils/daily/baziLabels";
import { aggregateAll, listReflectionsSince } from "../../utils/daily/reflectionStore";
import { weeklyObservations } from "../../utils/daily/weeklyObservations";

/**
 * Wochenbogen — der ruhige Rückblick (Muster-Spiegel-Payoff, Etappe 2).
 *
 * Zwei Abschnitte:
 *  1. "Deine Woche": die notierten Einträge der letzten 7 Tage — Lücken werden
 *     nicht gerendert, nicht gezählt und nicht erwähnt.
 *  2. "Muster-Spiegel": Beobachtungen über ALLE bisherigen Antworten
 *     (weeklyObservations) — jede mit Datenanker, belastbar erst ab n≥3,
 *     darunter der ehrliche "noch kein Muster belastbar"-Zustand.
 *
 * Bewusst NICHT hier: Streaks, Vollständigkeits-Anzeigen, Prozentwerte,
 * Deutung von Nichtnutzung. Beobachtung, kein Urteil.
 */

/** ISO-Datum (lokal) von heute−6 — der Beginn des 7-Tage-Fensters. */
export function weekStartIso(today: Date): string {
  const d = new Date(today);
  d.setDate(d.getDate() - 6);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shortDate(iso: string): string {
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
}

export default function Wochenbogen() {
  // Store ist synchron (localStorage) — einmal beim Mount lesen reicht;
  // die Komponente wird per Toggle frisch gemountet.
  const [week] = React.useState(() => listReflectionsSince(weekStartIso(new Date())));
  const [observations] = React.useState(() => weeklyObservations(aggregateAll()));

  const empty = week.length === 0 && observations.length === 0;

  return (
    <div className="glass-card rounded-2xl p-6 space-y-5" data-testid="wochenbogen">
      <div className="space-y-1">
        <h5 className="font-serif text-lg font-bold text-gold-light flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-gold-muted" />
          Dein Wochenbogen
        </h5>
        <p className="font-mono text-[10px] uppercase tracking-widest text-stone-500">
          {shortDate(weekStartIso(new Date()))} – heute
        </p>
      </div>

      {empty ? (
        <p className="text-sm text-stone-400" data-testid="wochenbogen-empty">
          Noch keine Antworten notiert — der Wochenbogen füllt sich mit deinen
          Wiedererkennungs-Antworten.
        </p>
      ) : (
        <>
          {week.length > 0 && (
            <div className="space-y-2" data-testid="wochenbogen-week">
              <p className="font-mono text-[9px] uppercase tracking-widest text-gold-muted font-bold">Deine Woche</p>
              <ul className="space-y-1.5">
                {week.map((r) => (
                  <li key={r.date} className="font-mono text-[11px] text-stone-400" data-testid="wochenbogen-day">
                    {shortDate(r.date)} · {dayTypeById(r.dayType).label}
                    {r.encounterChoice && (
                      <span className="text-stone-300"> · {r.encounterChoice}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {observations.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-gold-muted/10" data-testid="wochenbogen-spiegel">
              <p className="font-mono text-[9px] uppercase tracking-widest text-gold-muted font-bold">Muster-Spiegel</p>
              {observations.map((o) => (
                <div key={o.dayType} className="space-y-1" data-testid={`spiegel-${o.dayType}`}>
                  <p className="font-sans text-sm text-stone-300 leading-relaxed">
                    {o.text}
                    {o.invitation && <span className="text-stone-400"> {o.invitation}</span>}
                  </p>
                  <p className="font-mono text-[9px] text-stone-600">{o.anchor}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
