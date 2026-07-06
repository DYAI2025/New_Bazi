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
 * GRAMMAR CONTRACT: every keyword is a SINGLE German noun whose dative
 * singular equals its nominative form ("zwischen Identität und Antrieb" is
 * correct; plural or multi-word keywords like "Werte und Beziehung" produced
 * broken chains such as "zwischen Werte und Beziehung und Denken und
 * Kommunikation"). Templates name the planet pair ONCE up front
 * ("X trifft auf Y: ...") and join the two keywords with at most one "und",
 * so the composed sentence stays unambiguous for every pairing.
 *
 * Tone is anti-reification: describing an interplay of themes, never an
 * essential statement about the person ("Du bist ...").
 */

/**
 * Planet keyword table — German planet names (post-normalizer) -> theme.
 * Exported so tests can pin the dative-safety contract (single-word,
 * form-stable nouns only).
 */
export const PLANET_KEYWORDS_DE: Record<string, string> = {
  Sonne: "Identität",
  Mond: "Gefühlswelt",
  Merkur: "Kommunikation",
  Venus: "Beziehungswelt",
  Mars: "Antrieb",
  Jupiter: "Wachstum",
  Saturn: "Strukturkraft",
  Uranus: "Umbruch",
  Neptun: "Intuition",
  Pluto: "Wandlung",
  Chiron: "Verletzlichkeit",
  Lilith: "Eigensinn",
  Mondknoten: "Entwicklungsrichtung",
  "Wahrer Mondknoten": "Entwicklungsrichtung",
  Aszendent: "Auftreten",
  MediumCoeli: "Berufung"
};

/**
 * Aspect-type templates keyed by the GERMAN aspect name the normalizer
 * produces (plus a generic fallback). Each names the pair once and composes
 * the two single-noun themes into one grammatically clean sentence.
 */
const ASPECT_TEMPLATES_DE: Record<string, (p1: string, p2: string, k1: string, k2: string) => string> = {
  Konjunktion: (p1, p2, k1, k2) =>
    `${p1} trifft auf ${p2}: ${k1} und ${k2} verschmelzen zu einem gebündelten Impuls, der beide Themen gemeinsam auftreten lässt.`,
  Opposition: (p1, p2, k1, k2) =>
    `${p1} steht ${p2} gegenüber: zwischen ${k1} und ${k2} spannt sich eine Achse, deren Pole nach bewusstem Ausgleich suchen.`,
  Trigon: (p1, p2, k1, k2) =>
    `${p1} trifft auf ${p2}: ${k1} und ${k2} fließen unterstützend ineinander und können einander mühelos tragen.`,
  Quadrat: (p1, p2, k1, k2) =>
    `${p1} trifft auf ${p2}: die Reibung zwischen ${k1} und ${k2} erzeugt Spannung, die sich als Entwicklungsschub nutzen lässt.`,
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

/**
 * Pair (synastry) aspect interpretation — REQ-D-002/S-001.
 *
 * Unlike `aspectInterpretation`, both bodies belong to DIFFERENT people, so
 * the sentence must name BOTH anchors explicitly and unambiguously:
 * "Sonne (A)" for person A's body, "Mond (B)" for person B's body. The (A)/(B)
 * labels keep it clear whose theme is whose in a two-chart reading.
 *
 * Themes reuse PLANET_KEYWORDS_DE; unknown bodies fall back to their own name.
 *
 * Tone is calibrated per aspect type WITHOUT making a relationship verdict:
 *   - Trigon      -> a shared Ressource (something readily available)
 *   - Sextil      -> an open Gelegenheit (invites active uptake)
 *   - Konjunktion -> Bündelung/Aktivierung (themes activate together)
 *   - Quadrat     -> Reibung framed as a Wachstumskante (a growth edge, never
 *                    a defect, never "doesn't fit")
 *   - Opposition  -> Polarität along a Spannungsachse (two poles seeking
 *                    conscious balance)
 * Unknown types fall back to a safe, generic interplay sentence.
 *
 * ANTI-REIFICATION: never emits fate/soul/diagnosis/relationship-verdict
 * language; friction is always an edge to grow on, never a verdict about
 * the bond ("passt zusammen", "harmonisch", "kompatibel" are all excluded).
 */
export function pairAspectInterpretation(planetA: string, planetB: string, type: string): string {
  const themeA = PLANET_KEYWORDS_DE[planetA] || planetA;
  const themeB = PLANET_KEYWORDS_DE[planetB] || planetB;
  const a = `${planetA} (A)`;
  const b = `${planetB} (B)`;

  switch (type) {
    case "Trigon":
      return `${a} und ${b}: ${themeA} und ${themeB} fließen leicht zusammen und stehen als gemeinsame Ressource bereit, auf die beide Seiten mühelos zugreifen können.`;
    case "Sextil":
      return `${a} und ${b}: zwischen ${themeA} und ${themeB} öffnet sich eine Gelegenheit, die belohnt wird, wenn beide Seiten sie aktiv aufgreifen.`;
    case "Konjunktion":
      return `${a} und ${b}: ${themeA} und ${themeB} treten als Bündelung gemeinsam auf und aktivieren einander, sodass beide Themen im Kontakt zugleich anklingen.`;
    case "Quadrat":
      return `${a} und ${b}: zwischen ${themeA} und ${themeB} entsteht Reibung — eine Wachstumskante, an der beide Seiten lernen, ihre Impulse aufeinander abzustimmen.`;
    case "Opposition":
      return `${a} und ${b}: ${themeA} und ${themeB} bilden eine Polarität entlang einer Spannungsachse, deren Pole nach bewusstem Ausgleich zwischen beiden Seiten suchen.`;
    default:
      return `${a} und ${b}: ${themeA} und ${themeB} stehen in Wechselwirkung und färben einander im Kontakt zwischen beiden Seiten ein.`;
  }
}
