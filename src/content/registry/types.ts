/**
 * P5-T2 — Content-Registry: Typvertrag für einen Erklärungs-Eintrag.
 *
 * Ein ExplanationEntry ist die deskriptive Einordnung EINES Profil-Datenpunkts
 * (Tierkreiszeichen, Himmlischer Stamm, Irdischer Zweig, Wu-Xing-Element,
 * Säule oder westliches Haus). Register: edel, ruhig, präzise — eine
 * Einordnung, kein Urteil und keine „Du bist…"-Festlegung (Amendment D).
 *
 * `long` endet mit dem literalen Slot " {anchor}", den die T3-UI mit einem
 * Profil-Datenanker füllt (z. B. „— in deinem Profil: Sonne 24.1° Zwillinge").
 * Der Anker ist die EINZIGE Stelle, an der „dein/deinem" erlaubt ist
 * (Datenzeiger, keine Charakter-Festlegung).
 */
export interface ExplanationEntry {
  /** Kanonische ID, z. B. "zodiac.aries", "stem.jia", "branch.zi", "house.1". */
  id: string;
  /** Anzeigetitel, z. B. "Widder", "Jiǎ 甲", "Die Ratte (Zǐ 子)". */
  title: string;
  /** Symbol/Glyphe, z. B. "♈", "甲", "子". */
  symbol: string;
  /** Ein deskriptiver Satz für Tooltips. */
  short: string;
  /**
   * 60–120 Wörter, deskriptive Platzierung in dritter Person.
   * Endet mit dem literalen Slot " {anchor}".
   */
  long: string;
  /**
   * Herkunft des Textes:
   *  - "astro-noctum": 1:1 portierte AN-Prosa (ggf. Stil-/Längen-Pass).
   *  - "curated": neu kuratiert ODER aus New_Bazi-Basis erweitert/voiced
   *    (z. B. houses aus HOUSE_TEMPLATES — Herkunft im Code kommentieren,
   *    NICHT als Astro-Noctum ausgeben).
   */
  source: "astro-noctum" | "curated";
}
