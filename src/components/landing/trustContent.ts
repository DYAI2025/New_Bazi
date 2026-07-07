// RD-5 copy: method / trust-boundaries / fusion-path / premium. Boundaries deliberately
// NAME what Bazodiac does NOT do (negated). All other copy must carry no positive
// reification claim — enforced by src/__tests__/redesignWording.test.ts.

export interface Boundary {
  title: string;
  text: string;
}

/** The four explicit boundaries — each a negation, stated plainly. */
export const BOUNDARIES: Boundary[] = [
  {
    title: "Keine Diagnose",
    text: "Bazodiac stellt keine medizinische oder psychologische Diagnose und ersetzt keine Fachperson.",
  },
  {
    title: "Kein Schicksal",
    text: "Das Modell sagt keine Zukunft voraus und legt nicht fest, wer jemand ist.",
  },
  {
    title: "Keine Therapie",
    text: "Dies ist kein Therapie- oder Behandlungsangebot; bei seelischer Belastung trägt ein Mensch, kein Modell.",
  },
  {
    title: "Kein Persönlichkeits-Beweis",
    text: "Ein Spannungsfeld lädt zum Reflektieren ein; es beweist keine Eigenschaft und keine feste Identität.",
  },
];

export interface MethodLayer {
  title: string;
  text: string;
}

/** Computation vs interpretation vs user feedback — what is calculated vs read. */
export const METHOD_LAYERS: MethodLayer[] = [
  {
    title: "Berechnung",
    text: "Positionen, Säulen und Elementgewichte kommen aus der FuFirE-Engine — reproduzierbar, serverseitig.",
  },
  {
    title: "Deutung",
    text: "Aus den berechneten Differenzen leitet das Modell lesbare Spannungen ab — immer mit Datenanker.",
  },
  {
    title: "Deine Reaktion",
    text: "Trifft / Teilweise / Widerstand verschieben den Blick: das Modell bleibt, deine Lesart wächst.",
  },
];

/** How missing data behaves — honest empty, never invented. */
export const MISSING_BEHAVIOR =
  "Fehlt eine Angabe — etwa die genaue Geburtszeit — bleibt das Feld an dieser Stelle sichtbar leer. Es wird nichts erfunden.";

/** Premium = deeper explanation, history and export — never a stronger truth. */
export const PREMIUM_POINTS: string[] = [
  "Tiefere Methodensicht und Quellenebene",
  "Gespeicherte Reflexionen und Verlauf",
  "Export deines Reflexions-Pakets",
];

export const PREMIUM_NOTE = "Deep Mode gibt mehr Erklärung — keine stärkere Wahrheit.";

/** Fusion-path framing — stable signature, changing question; calm review, no streak pressure. */
export const FUSION_PATH_NOTE =
  "Deine Signatur bleibt stabil. Was sich verändert, ist die aktive Spannung und die Frage der Woche — ein ruhiger Rückblick, kein Streak-Zwang.";
