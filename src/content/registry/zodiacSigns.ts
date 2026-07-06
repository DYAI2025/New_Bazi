/**
 * P5-T2 — Content-Registry: Domain "zodiac" (12 westliche Tierkreiszeichen).
 *
 * Portiert aus Astro-Noctum
 * (…/codebase/Bazodiac-WebApp/Astro-Noctum/src/lib/astro-data/zodiacSigns.ts,
 * Feld `ZODIAC_SIGNS_DATA[].{sun,moon,asc}.de`). Je Zeichen kombiniert dieser
 * Eintrag den Sonnen- mit dem Mond- (und wo nötig dem Aszendenten-)Kontext, um
 * das 60–120-Wort-Band zu treffen.
 *
 * Register-Pass (Amendment D): Die AN-Quelle adressiert „du/deine"; hier in
 * deskriptive Platzierung dritter Person konvertiert („Die Sonne im Widder
 * zeigt…", „Der Mond im … steht für…"). Keine „Du bist…"-Festlegung, keine
 * verbotenen Begriffe. Jedes `long` endet mit dem literalen Slot " {anchor}",
 * den die T3-UI mit dem Profil-Datenanker füllt (einzige Stelle, an der ein
 * „dein"-Datenzeiger erscheint).
 *
 * `symbol` = klassisches Unicode-Tierkreisglyph (AN `emoji`-Feld).
 */
import { ExplanationEntry } from "./types";

export const ZODIAC_ENTRIES: ExplanationEntry[] = [
  {
    id: "zodiac.aries",
    title: "Widder",
    symbol: "♈",
    // portedFrom zodiacSigns.ts:34-44 (sun+moon+asc.de), du→deskriptiv
    short:
      "Die Sonne im Widder steht für das Feuer des Pioniers — Initiative, Neuanfang und der Reiz, einen eigenen Weg zu bahnen.",
    long:
      "Die Sonne im Widder stellt das Feuer des Pioniers in den Kern der Identität: Initiative, Neuanfänge und der Reiz des Wegebauens wirken energetisierend, und der bewusste Wille leuchtet am hellsten, wo nach eigenen Regeln vorangegangen wird — mutig, direkt und leidenschaftlich unabhängig. Der Mond im Widder zeigt Gefühle, die mit sofortiger, ehrlicher Kraft ankommen; instinktive Reaktionen sind unverfälscht und leidenschaftlich, und der emotionale Kern sucht Raum zur Selbstbehauptung, da Einschränkung leicht Unruhe weckt. Nach außen liest die Welt diese Konstellation oft als handlungsbereit und führungswillig, noch bevor ein Wort gefallen ist. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "zodiac.taurus",
    title: "Stier",
    symbol: "♉",
    // portedFrom zodiacSigns.ts:50-60 (sun+moon+asc.de), du→deskriptiv
    short:
      "Die Sonne im Stier verankert die Identität im Sinnlichen, Schönen und Dauerhaften — geduldig, zuverlässig und absichtsvoll.",
    long:
      "Die Sonne im Stier verankert die Identität im Sinnlichen, Schönen und Dauerhaften: ein tiefes Bedürfnis nach bleibenden Werten und sinnlichem Erleben gibt den Ton an. Geduldig, zuverlässig und zutiefst absichtsvoll bewegt sich der Wille langsam, aber mit der unaufhaltsamen Kraft der Erde. Der Mond im Stier sucht emotionale Sicherheit über Beständigkeit, Komfort und vertraute Alltagsrhythmen; der tiefste Instinkt ist, zu sorgen und versorgt zu werden, am wohlsten in einer stabilen, schönen Umgebung. Nach außen wirkt diese Konstellation ruhig und ungehastet — eine warme, ästhetisch feinfühlige Präsenz, die das Schöne in jedem Raum bemerkt. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "zodiac.gemini",
    title: "Zwillinge",
    symbol: "♊",
    // portedFrom zodiacSigns.ts:66-76 (sun+moon+asc.de), du→deskriptiv
    short:
      "Die Sonne in den Zwillingen steht für unaufhörliche Neugier — Ideen, Gespräche und die Freude am Verbinden ungleicher Dinge.",
    long:
      "Die Sonne in den Zwillingen macht die bewusste Identität zu einem Ort unaufhörlicher Neugier: Ideen, Gespräche und die Freude am Verbinden ungleicher Dinge wirken energetisierend. Vielseitig und schlagfertig findet der Wille seinen höchsten Ausdruck im Lernen, Kommunizieren und Brückenbauen zwischen Welten. Der Mond in den Zwillingen zeigt Gefühle, die so schnell und wandelbar sind wie die Gedanken; sie werden im Gespräch verarbeitet, und geistige Anregung zählt so viel wie emotionaler Komfort. Die innere Welt bleibt lebendig und neugierig, selten bereit, zu lange in einem Gefühl zu verweilen — nach außen wirkt das lebendig, redegewandt und voller Ideen. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "zodiac.cancer",
    title: "Krebs",
    symbol: "♋",
    // portedFrom zodiacSigns.ts:82-92 (sun+moon+asc.de), du→deskriptiv
    short:
      "Die Sonne im Krebs verwurzelt den bewussten Willen in Gefühl, Erinnerung und dem Bedürfnis, zu sorgen und umsorgt zu werden.",
    long:
      "Die Sonne im Krebs verwurzelt den bewussten Willen in Gefühl, Erinnerung und dem tiefen Bedürfnis, zu sorgen und umsorgt zu werden. Von Intuition statt Logik geleitet, ordnet sich die Kernidentität um Heim, Familie und emotionale Bindungen — die feine Empathie liest einen Raum oft ohne ein einziges Wort. Der Mond im Krebs ist hier in seinem Zuhause: Emotionen fließen tief, lang und loyal, instinktive Reaktionen wurzeln im Bedürfnis nach Schutz und Zugehörigkeit. Die Eindrücke der Vergangenheit werden mit bemerkenswerter Sensibilität getragen, und emotionale Nahrung kommt über echte Nähe und Fürsorge. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "zodiac.leo",
    title: "Löwe",
    symbol: "♌",
    // portedFrom zodiacSigns.ts:98-108 (sun+moon+asc.de), du→deskriptiv
    short:
      "Die Sonne im Löwen steht für das Sonnenfeuer in voller Glut — Erschaffen, Führen und das Strahlen authentischen Ausdrucks.",
    long:
      "Die Sonne im Löwen steht für das Sonnenfeuer in voller Glut: erschaffen, führen und strahlen, untrennbar vom Bedürfnis, sich vollständig auszudrücken und wirklich gesehen zu werden. Großzügig, warm und magnetisch lebendig bringt diese Konstellation Licht in jeden Raum und inspiriert andere allein durch authentische Gegenwart. Der Mond im Löwen sucht das Gefühl, gefeiert und gewürdigt zu werden; das emotionale Wohlbefinden knüpft sich an Anerkennung und die Freiheit, sich mit Dramatik und Farbe auszudrücken. In bester Form wird die ersehnte Wärme freigiebig verschenkt, und die Herausforderung liegt im Vertrauen, dass Zuneigung nicht schwindet, wenn der Scheinwerfer wandert. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "zodiac.virgo",
    title: "Jungfrau",
    symbol: "♍",
    // portedFrom zodiacSigns.ts:114-124 (sun+moon+asc.de), du→deskriptiv
    short:
      "Die Sonne in der Jungfrau richtet den bewussten Willen auf die Kunst der Unterscheidung — lösen, verfeinern, ordnen.",
    long:
      "Die Sonne in der Jungfrau richtet den bewussten Willen auf die Kunst der Unterscheidung: Lösen, Verfeinern und das Ordnen des Komplexen wirken energetisierend. Analytisch, präzise und der Verbesserung verpflichtet, findet die Kernidentität Bedeutung in der Meisterschaft des Handwerks und der stillen Befriedigung, Dinge besser zu machen. Der Mond in der Jungfrau verarbeitet Gefühle durch Analyse; Empfundenes wird sorgfältig untersucht und emotionale Energie oft in Hilfsbereitschaft und praktische Fürsorge gelenkt. Das tiefste Bedürfnis ist, von echtem Nutzen zu sein und in einer Umgebung von Ordnung und ruhigem Unterscheidungsvermögen zu leben — eine Haltung, die andere als gefasst und aufmerksam wahrnehmen. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "zodiac.libra",
    title: "Waage",
    symbol: "♎",
    // portedFrom zodiacSigns.ts:130-140 (sun+moon+asc.de), du→deskriptiv
    short:
      "Die Sonne in der Waage stellt Harmonie, Fairness und die Kunst der menschlichen Verbindung in den Kern der Identität.",
    long:
      "Die Sonne in der Waage stellt Harmonie, Fairness und die Kunst der menschlichen Verbindung in den Kern der Identität: Zusammenarbeit, Schönheit und die Freude am Finden von Gleichgewicht wirken energetisierend. Anmutig und diplomatisch findet der Wille seinen vollsten Ausdruck, wenn sich jeder im Raum gesehen fühlt. Der Mond in der Waage braucht Harmonie, um sich emotional wohlzufühlen; die innere Welt reagiert empfindlich auf Ungleichgewicht, und der Instinkt ist stets, das Gleichgewicht wiederherzustellen. Am meisten bei sich ist diese Konstellation, wenn Beziehungen gegenseitig und das Umfeld schön gestaltet sind — nach außen wirkt sie charmant, ausgeglichen und rücksichtsvoll. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "zodiac.scorpio",
    title: "Skorpion",
    symbol: "♏",
    // portedFrom zodiacSigns.ts:146-156 (sun+moon+asc.de), du→deskriptiv
    short:
      "Die Sonne im Skorpion treibt den bewussten Willen in Tiefen — Intensität, Wandlung und die Suche nach verborgener Wahrheit.",
    long:
      "Die Sonne im Skorpion treibt den bewussten Willen in Tiefen, die andere zu erkunden zögern: Wandlung, Intensität und die Suche nach verborgener Wahrheit wirken energetisierend. Magnetisch, hellsichtig und dem Schatten gegenüber furchtlos formt sich die Kernidentität im Feuer von Krise, Verlust und tiefgreifender Erneuerung. Der Mond im Skorpion fühlt mit vulkanischer Intensität; nichts bleibt flach in dieser Gefühlswelt, und der Instinkt geht stets tiefer, um Bindungen zu knüpfen, die real sind statt bloß angenehm. Das emotionale Bedürfnis richtet sich auf ein Vertrauen, das so absolut ist, dass es vollständige Verwundbarkeit erlaubt — nach außen wirkt das ruhig und durchdringend. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "zodiac.sagittarius",
    title: "Schütze",
    symbol: "♐",
    // portedFrom zodiacSigns.ts:162-172 (sun+moon+asc.de), du→deskriptiv
    short:
      "Die Sonne im Schützen verankert den bewussten Willen in der Suche nach Bedeutung, Freiheit und einem weiten Horizont.",
    long:
      "Die Sonne im Schützen verankert den bewussten Willen in der Suche nach Bedeutung, Freiheit und einem stets erweiterten Horizont. Von Jupiter regiert, gleicht die Kernidentität der eines Philosophen-Entdeckers — Reisen, Lernen und die Überzeugung, dass das Leben eine möglichst weit gelebte Geschichte ist, wirken energetisierend. Der Mond im Schützen braucht vor allem Freiheit; emotional gedeiht diese Konstellation, wo es offenen Raum, ehrliche Gespräche und Platz für Abenteuer gibt. Die Instinkte sind optimistisch und zukunftsgerichtet, am wohlsten im Wachsen und im Folgen echter Begeisterung statt bloßer Verpflichtung — nach außen wirkt das offen, ehrlich und unbeschwert. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "zodiac.capricorn",
    title: "Steinbock",
    symbol: "♑",
    // portedFrom zodiacSigns.ts:178-188 (sun+moon+asc.de), du→deskriptiv
    short:
      "Die Sonne im Steinbock richtet den bewussten Willen auf den langen Aufstieg zur Meisterschaft — Struktur, Disziplin, Dauer.",
    long:
      "Die Sonne im Steinbock richtet den bewussten Willen auf den langen Aufstieg zur Meisterschaft: Struktur, Disziplin und die Befriedigung, Dauerhaftes aufzubauen, wirken energetisierend. Geduldig und still ehrgeizig zeigt sich die Kernidentität in der Bereitschaft, die schwierige Arbeit zu tun, die andere meiden. Der Mond im Steinbock hält Emotionen unter sorgfältiger Führung; tief gefühlt, doch selten gezeigt, wird emotionale Energie in Leistung und Verantwortung gelenkt. Die innere Welt sehnt sich nach durch Mühe aufgebauter Sicherheit und fühlt sich am ganzheitlichsten, wenn zielgerichtet auf ein bedeutungsvolles Ziel zubewegt wird — nach außen wirkt das gefasst, kompetent und verlässlich. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "zodiac.aquarius",
    title: "Wassermann",
    symbol: "♒",
    // portedFrom zodiacSigns.ts:194-204 (sun+moon+asc.de), du→deskriptiv
    short:
      "Die Sonne im Wassermann stellt die Kernidentität in den Bereich von Vision, Originalität und Zukunft.",
    long:
      "Die Sonne im Wassermann stellt die Kernidentität in den Bereich von Vision, Originalität und Zukunft: Ideen, die Konventionen umstürzen, und die kollektive Möglichkeit von etwas Besserem wirken energetisierend. Unabhängig und humanitär findet der Wille seinen Zweck darin, zu etwas Größerem als dem Selbst beizutragen. Der Mond im Wassermann braucht emotionale Freiheit und intellektuelle Kameradschaft; Gefühle werden am angenehmsten über Ideen und gemeinsame Vision verarbeitet statt über reines Eintauchen in Emotionen. Das tiefste Bedürfnis ist eine Gemeinschaft von Geistern, in der man vollständig und eigenwillig man selbst sein kann — nach außen wirkt das faszinierend, offen und unkonventionell. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "zodiac.pisces",
    title: "Fische",
    symbol: "♓",
    // portedFrom zodiacSigns.ts:210-220 (sun+moon+asc.de), du→deskriptiv
    short:
      "Die Sonne in den Fischen taucht den bewussten Willen in Fantasie, Empathie und spirituelle Sehnsucht.",
    long:
      "Die Sonne in den Fischen taucht den bewussten Willen in den ozeanischen Bereich von Fantasie, Empathie und spiritueller Sehnsucht: Kreativität, Mitgefühl und die Suche nach etwas jenseits des bloß Materiellen wirken energetisierend. Intuitiv und zutiefst sensibel bleibt die Kernidentität untrennbar von den unsichtbaren Strömungen zwischen Seelen. Der Mond in den Fischen fühlt ohne Grenzen; Empathie fließt frei, und die emotionale Atmosphäre jedes Raums wird mit bemerkenswerter Sensibilität aufgenommen. Die innere Welt ist reich an Bildern und spiritueller Resonanz, und das tiefste Bedürfnis ist ein Schutzraum, in dem das grenzenlose Fühlen geschätzt wird, statt zu überwältigen. {anchor}",
    source: "astro-noctum",
  },
];

/**
 * Alias für den Domain-Aggregator (`./index.ts`), der die Module unter
 * kleingeschriebenen Domain-Namen einsammelt.
 */
export const zodiacSigns: ExplanationEntry[] = ZODIAC_ENTRIES;
