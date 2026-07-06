/**
 * REQ-P4-005: TimeDependencyNote — Amendment B Versicherungskomponente
 *
 * Two-sentence honest statement: what works fully + what's missing and why.
 * Tone: calm, clear, no alarm language, no apologies.
 */
import React from "react";

interface TimeDependencyNoteProps {
  missingFields: string[];
  workingFields?: string[];
  variant?: "full" | "inline";
}

const DEFAULT_WORKING = ["Tagessäulen (Jahr, Monat, Tag)", "alle Planetenzeichen und -grade", "Wu-Xing-Analyse"];

export function TimeDependencyNote({ missingFields, workingFields, variant = "full" }: TimeDependencyNoteProps) {
  const working = workingFields ?? DEFAULT_WORKING;
  const workingText = working.join(", ");
  const missingText = missingFields.join(", ");

  if (variant === "inline") {
    return (
      <span className="time-dependency-note time-dependency-note--inline" aria-label={`${missingText} ohne Geburtszeit nicht berechenbar`}>
        <span className="time-dependency-note__missing">Zeit unbekannt</span>
        {" — "}
        <span className="time-dependency-note__reason">{missingText} {missingFields.length === 1 ? "erfordert" : "erfordern"} die genaue Geburtszeit.</span>
      </span>
    );
  }

  return (
    <div className="time-dependency-note" role="note" aria-label="Hinweis zur Datenvollständigkeit">
      <p className="time-dependency-note__working">
        <strong>Was vollständig gilt:</strong>{" "}
        {workingText} sind vollständig bestimmt.
      </p>
      <p className="time-dependency-note__missing-reason">
        <strong>{missingText}</strong>{" "}
        {missingFields.length === 1 ? "erfordert" : "erfordern"} die genaue Geburtszeit und {missingFields.length === 1 ? "kann" : "können"} ohne sie nicht berechnet werden.
      </p>
    </div>
  );
}
