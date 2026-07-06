/**
 * P5-T2 — Content-Registry: Domain "elements" (5 Wu-Xing-Elemente 五行).
 *
 * Portiert aus Astro-Noctum
 * (/Users/benjaminpoersch/Projects/Astro-Noctum/src/lib/astro-data/wuxing.ts,
 * Feld `WUXING_ELEMENTS[].description.de`). Die Quell-Prosa ist bereits
 * neutral-deskriptiv (TCM-Organ-Bezug, Yin/Yang-Bildsprache, kein „du/deine")
 * und wird in dritter Person über das Element selbst gehalten („Holz verkörpert
 * …", „Menschen mit starkem Holz-Einfluss …"). Keine „Du bist…"-Festlegung,
 * keine deterministische Charakter-Fixierung, keine verbotenen Begriffe
 * (Coaching/Therapie/Diagnose/Heilung/Schicksal). Jedes `long` endet mit dem
 * literalen Slot " {anchor}", den die T3-UI mit dem Profil-Datenanker füllt
 * (einzige Stelle, an der ein „dein"-Datenzeiger erscheint).
 *
 * Längen-Pass (Amendment D): Die Quell-Texte liegen bei ~54–63 Wörtern, also
 * knapp unter dem 60–120-Wort-Band. Sie wurden mit realer Bedeutung aus der
 * Quelle erweitert (Element-Phase im Wandlungszyklus, Richtung/Jahreszeit der
 * kanonischen WUXING_ELEMENTS-Tabelle) — keine Floskel-Polsterung. element.metall
 * (~54 W) ist am stärksten expandiert (Herbst/Westen-Bezug, Loslassen-Motiv).
 *
 * `title` = deutscher Anzeigename, `symbol` = chinesisches Element-Schriftzeichen
 * (木/火/土/金/水) konsistent zur kanonischen WUXING_ELEMENTS-Tabelle. Diese Datei
 * dupliziert KEINE Astro-Logik — nur Erklärungstext.
 *
 * Kein Reuse aus fufireNormalizer.ts `ELEMENT_COACHING` (imperativer Coaching-Ton,
 * passt nicht zur neutralen Element-Erklärung) und nicht aus `DAY_MASTER_TEXTS`
 * (Day-Master-Pattern-scoped, nicht Element-als-solches).
 */
import { ExplanationEntry } from "./types";

export const ELEMENTS_ENTRIES: ExplanationEntry[] = [
  {
    id: "element.holz",
    title: "Holz",
    symbol: "木",
    // portedFrom wuxing.ts:40 (description.de), bereits deskriptiv; expandiert ~63→Band
    short:
      "Holz verkörpert Wachstum, Flexibilität und kreative Vision — die aufstrebende Kraft des Frühlings.",
    long:
      "Holz verkörpert Wachstum, Flexibilität und kreative Vision. Wie ein Baum, der nach oben strebt, trägt die Holz-Energie Ausdehnung, Erneuerung und die Verfolgung langfristiger Ziele — sie gilt im Wandlungszyklus als die aufstrebende Phase des Frühlings, dem Osten zugeordnet. In der traditionellen chinesischen Medizin steht es für Leber und Gallenblase und verbindet Körper und Geist über die Fähigkeit, zu planen und sich anzupassen. Menschen mit starkem Holz-Einfluss entfalten sich, wenn sie Neuland betreten und Ideen zum Leben erwecken können; das Element beschreibt eine nach vorn gerichtete, vorausplanende Bewegung, eine Einordnung dieser Energie und keine feste Zuschreibung. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "element.feuer",
    title: "Feuer",
    symbol: "火",
    // portedFrom wuxing.ts:54 (description.de), bereits deskriptiv; expandiert ~62→Band
    short:
      "Feuer steht für Leidenschaft, Wandel und strahlende Ausdruckskraft — die kulminierende Wärme des Sommers.",
    long:
      "Feuer steht für Leidenschaft, Wandel und strahlende Ausdruckskraft. Es bringt Wärme, Begeisterung und das Licht der Klarheit in alles, was es berührt, und gilt im Wandlungszyklus als die kulminierende Phase des Sommers, dem Süden zugeordnet. Die Feuer-Energie beschreibt freudvolle Kommunikation, scharfe Intuition und die Fähigkeit, Menschen in der Umgebung mitzureißen. In der chinesischen Medizin steht es für Herz und Dünndarm und spiegelt damit seine Rolle, Wärme und Unterscheidungsvermögen in den Lebensfluss zu bringen. Das Element zeichnet eine sichtbar nach außen strahlende, verbindende Bewegung — eine Einordnung dieser Energie, kein abschließendes Urteil über einen Menschen. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "element.erde",
    title: "Erde",
    symbol: "土",
    // portedFrom wuxing.ts:68 (description.de), bereits deskriptiv; expandiert ~60→Band
    short:
      "Erde steht für Stabilität, Fürsorge und verlässliche Verwurzelung — die vermittelnde Mitte des Spätsommers.",
    long:
      "Erde steht für Stabilität, Fürsorge und verlässliche Verwurzelung. Sie ist die zentrale vermittelnde Kraft, die alle anderen Elemente harmonisiert und eine beständige Grundlage für Wachstum und Wandel bietet — im Wandlungszyklus die ausgleichende Phase des Spätsommers, der Mitte zugeordnet. Die Erde-Energie beschreibt Fürsorge, Geduld und die Gabe, anderen in schwierigen Zeiten eine Stütze zu sein. Im Körper steht sie für Milz und Magen und spiegelt damit ihre Rolle, Erfahrung in Nahrung umzuwandeln. Das Element zeichnet eine tragende, ausgleichende Bewegung zwischen den Polen — eine ruhige Einordnung dieser Energie und keine festschreibende Zuweisung. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "element.metall",
    title: "Metall",
    symbol: "金",
    // portedFrom wuxing.ts:82 (description.de, ~54 W), bereits deskriptiv; am stärksten expandiert (Herbst/Westen, Loslassen)
    short:
      "Metall verkörpert Struktur, Klarheit und läuternde Stärke — die verdichtende Kraft des Herbstes.",
    long:
      "Metall verkörpert Struktur, Klarheit und entschlossene, läuternde Stärke. Es schneidet durch Verwirrung und legt das Wesentliche frei, destilliert Erfahrung zu Weisheit. Im Wandlungszyklus gilt es als die verdichtende, sammelnde Phase des Herbstes, dem Westen zugeordnet — die Zeit der Ernte und des bewussten Ordnens. Die Metall-Energie beschreibt Disziplin, Präzision und den Mut, zu eigenen Überzeugungen zu stehen. In der chinesischen Medizin steht es für Lunge und Dickdarm und damit für die Fähigkeit, loszulassen, was nicht mehr dient. Das Element zeichnet eine klärende, abgrenzende Bewegung — eine sachliche Einordnung dieser Energie, kein Urteil über einen Menschen. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "element.wasser",
    title: "Wasser",
    symbol: "水",
    // portedFrom wuxing.ts:96 (description.de), bereits deskriptiv; expandiert ~62→Band
    short:
      "Wasser symbolisiert Weisheit, Anpassungsfähigkeit und tiefe Intuition — die ruhende Kraft des Winters.",
    long:
      "Wasser symbolisiert Weisheit, Anpassungsfähigkeit und tiefe Intuition. Wie ein Fluss, der immer einen Weg um Hindernisse findet, erkundet die Wasser-Energie die verborgenen Tiefen der Erfahrung und nährt die Selbstbetrachtung — im Wandlungszyklus die ruhende, sammelnde Phase des Winters, dem Norden zugeordnet. Es trägt den Keim des Potenzials, die stille Kraft, die unter der Oberfläche wartet, bevor sie im Frühling aufbricht. In der chinesischen Medizin steht es für Nieren und Blase, die Speicher der tiefsten Ahnen-Energie. Das Element zeichnet eine fließende, sich anschmiegende Bewegung um jedes Hindernis — eine Einordnung dieser Energie und keine feste Zuschreibung. {anchor}",
    source: "astro-noctum",
  },
];

/** Alias für den Aggregator in ./index (siehe Sibling-Module). */
export const elements: ExplanationEntry[] = ELEMENTS_ENTRIES;
