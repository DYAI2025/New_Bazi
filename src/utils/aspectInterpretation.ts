/**
 * Local, deterministic aspect interpretations (German).
 *
 * The REAL FuFirE AspectResponse carries no `interpretation` field — the
 * UI used to render the literal placeholder "Lokale abgeleitete Deutung".
 * This generator composes one honest sentence per aspect from
 *   (a) an aspect-type template (Konjunktion = Verschmelzung/Bündelung,
 *       Opposition = Spannungsachse, Trigon = Fluss/Unterstützung,
 *       Quadrat = Reibung/Antrieb, Sextil = Gelegenheit/Anregung, ...)
 *   (b) a planet keyword table (Sonne = Identität, Mond = Gefühlswelt, ...).
 *
 * Tone is anti-reification: "X trifft auf Y: ..." — describing an
 * interplay of themes, never an essential statement about the person
 * ("Du bist ...").
 */

/** Planet keyword table — German planet names (post-normalizer) -> theme. */
const PLANET_KEYWORDS_DE: Record<string, string> = {
  Sonne: "Identität",
  Mond: "Gefühlswelt",
  Merkur: "Denken und Kommunikation",
  Venus: "Werte und Beziehung",
  Mars: "Antrieb",
  Jupiter: "Wachstum",
  Saturn: "Struktur und Grenze",
  Uranus: "Umbruch",
  Neptun: "Auflösung und Intuition",
  Pluto: "Wandlung",
  Chiron: "Verletzlichkeit und Heilung",
  Lilith: "Eigensinn",
  Mondknoten: "Entwicklungsrichtung",
  "Wahrer Mondknoten": "Entwicklungsrichtung",
  Aszendent: "Auftreten",
  MediumCoeli: "Berufung"
};

/**
 * Aspect-type templates keyed by the GERMAN aspect name the normalizer
 * produces (plus a generic fallback). Each composes the two planet themes
 * into one sentence.
 */
const ASPECT_TEMPLATES_DE: Record<string, (p1: string, p2: string, k1: string, k2: string) => string> = {
  Konjunktion: (p1, p2, k1, k2) =>
    `${p1} trifft auf ${p2}: ${k1} und ${k2} verschmelzen hier zu einem gebündelten Impuls, der beide Themen gemeinsam auftreten lässt.`,
  Opposition: (p1, p2, k1, k2) =>
    `${p1} steht ${p2} gegenüber: zwischen ${k1} und ${k2} spannt sich eine Achse, deren Pole nach bewusstem Ausgleich suchen.`,
  Trigon: (p1, p2, k1, k2) =>
    `${p1} trifft auf ${p2}: ${k1} und ${k2} fließen unterstützend ineinander und können einander mühelos tragen.`,
  Quadrat: (p1, p2, k1, k2) =>
    `${p1} trifft auf ${p2}: die Reibung zwischen ${k1} und ${k2} erzeugt Spannung, die als Antrieb nutzbar wird.`,
  Sextil: (p1, p2, k1, k2) =>
    `${p1} trifft auf ${p2}: zwischen ${k1} und ${k2} öffnet sich eine anregende Gelegenheit, die aktives Aufgreifen belohnt.`,
  Quincunx: (p1, p2, k1, k2) =>
    `${p1} trifft auf ${p2}: ${k1} und ${k2} stehen schräg zueinander und verlangen wiederholtes, feines Nachjustieren.`,
  Halbsextil: (p1, p2, k1, k2) =>
    `${p1} trifft auf ${p2}: ${k1} und ${k2} berühren sich leise und tasten sich schrittweise aneinander heran.`
};

const GENERIC_TEMPLATE = (p1: string, p2: string, k1: string, k2: string) =>
  `${p1} trifft auf ${p2}: ${k1} und ${k2} stehen in Wechselwirkung und färben einander ein.`;

/**
 * One deterministic German sentence for an aspect. `planet1`/`planet2` are
 * the German planet names, `type` the German aspect type ("Trigon", ...).
 * Unknown planets fall back to their own name as theme; unknown aspect
 * types to a generic interplay template — never an empty string, never a
 * placeholder.
 */
export function aspectInterpretation(planet1: string, planet2: string, type: string): string {
  const k1 = PLANET_KEYWORDS_DE[planet1] || planet1;
  const k2 = PLANET_KEYWORDS_DE[planet2] || planet2;
  const template = ASPECT_TEMPLATES_DE[type] || GENERIC_TEMPLATE;
  return template(planet1, planet2, k1, k2);
}
