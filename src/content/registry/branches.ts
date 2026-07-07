/**
 * P5-T2 — Content-Registry: Domain "branches" (12 Irdische Zweige 地支).
 *
 * Portiert aus Astro-Noctum
 * (…/codebase/Bazodiac-WebApp/Astro-Noctum/src/lib/astro-data/earthlyBranches.ts,
 * Feld `EARTHLY_BRANCHES[].description.de`). Die Quell-Prosa ist kurz (~53–80 W)
 * und kollektiv-personalisierend („Ratten erkennen…", „Tiger handeln…"); hier in
 * deskriptive Platzierung dritter Person über den Zweig selbst konvertiert
 * („Der Zweig … steht für…", „Menschen dieses Zweiges zeigen oft…") und auf das
 * 60–120-Wort-Band erweitert. Keine „Du bist…"-Festlegung, keine verbotenen
 * Begriffe (Coaching/Therapie/Diagnose/Heilung/Schicksal). Jedes `long` endet mit
 * dem literalen Slot " {anchor}", den die T3-UI mit dem Profil-Datenanker füllt
 * (einzige Stelle, an der ein „dein"-Datenzeiger erscheint).
 *
 * IDs, Reihenfolge und Pinyin folgen kanonisch EARTHLY_BRANCHES in
 * ../../utils/astrology.ts (Zǐ, Chǒu, Yǐn, Mǎo, Chén, Sì, Wǔ, Wèi, Shēn, Yǒu, Xū,
 * Hài). Tiger = Yǐn 寅 (kanonisch New_Bazi), NICHT die AN-Schreibweise „Yín".
 * `symbol` = chinesisches Zweig-Schriftzeichen aus der kanonischen Tabelle.
 */
import { ExplanationEntry } from "./types";

export const BRANCHES_ENTRIES: ExplanationEntry[] = [
  {
    id: "branch.zi",
    title: "Die Ratte (Zǐ 子)",
    symbol: "子",
    // portedFrom earthlyBranches.ts:44 (description.de), kollektiv→deskriptiv, ~53 W expandiert
    short:
      "Der Zweig Zǐ 子 eröffnet als Yang-Wasser den Zwölf-Zweige-Zyklus und steht für Neubeginn und wache Wahrnehmung.",
    long:
      "Der Zweig Zǐ 子 eröffnet als Yang-Wasser den Zwölf-Zweige-Zyklus und steht für Neubeginn und scharfe, bewegliche Intelligenz. Die Wasser-Energie dieses Zweiges richtet die Aufmerksamkeit auf Muster und Gelegenheiten, die im Alltag leicht übersehen werden. Menschen mit dieser Zeichnung zeigen oft Anpassungsfähigkeit und ein schnelles, wendiges Denken, das in wechselnden Umgebungen Halt findet. In seiner reifen Ausprägung verbindet der Zweig Zǐ ruhelose Neugier mit erfinderischen Lösungen, von denen das ganze Umfeld profitiert. Als erster Zweig trägt er die Bildsprache des Anfangs: die stille Stunde der Mitternacht, in der sich neues Leben sammelt, bevor es sichtbar wird. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "branch.chou",
    title: "Der Büffel (Chǒu 丑)",
    symbol: "丑",
    // portedFrom earthlyBranches.ts:59 (description.de), kollektiv→deskriptiv, ~70 W expandiert
    short:
      "Der Zweig Chǒu 丑 steht als Yin-Erde für Fleiß, Verlässlichkeit und geduldige Beharrlichkeit.",
    long:
      "Der Zweig Chǒu 丑 steht als Yin-Erde für Fleiß, Verlässlichkeit und geduldige Beharrlichkeit. In der Erde-Energie verwurzelt, verweist dieser Zweig auf große innere Stärke und eine methodische Herangehensweise an die Herausforderungen des Lebens. Menschen dieses Zweiges bauen durch beständige Arbeit dauerhafte Grundlagen auf und gewinnen Vertrauen durch stille Zuverlässigkeit eher als durch lautes Auftreten. Der Zweig sucht selten das Rampenlicht, hält aber, was er verspricht, und bringt Vorhaben mit zäher Ausdauer zu Ende. Sein Bild ist der pflügende Büffel in der tiefen Winterstunde, der unaufgeregt Furche um Furche zieht und so den Boden für eine spätere Ernte bereitet. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "branch.yin",
    title: "Der Tiger (Yǐn 寅)",
    symbol: "寅",
    // portedFrom earthlyBranches.ts:74 (description.de), AN-„Yín"→kanonisch „Yǐn", kollektiv→deskriptiv, ~65 W expandiert
    short:
      "Der Zweig Yǐn 寅 strahlt als Yang-Holz Mut, Vitalität und entschlossene Tatkraft aus.",
    long:
      "Der Zweig Yǐn 寅 strahlt als Yang-Holz Mut, Vitalität und entschlossene Führungsstärke aus. Von Holz-Energie getragen, verbindet dieser Zweig ausgeprägte Unabhängigkeit mit einem instinktiven Drang, Schwächere zu schützen. Menschen dieser Zeichnung zeigen oft eine magnetische Ausstrahlung, die andere auf natürliche Weise anzieht, auch wenn ihre Intensität ebenso herausfordernd wie inspirierend wirken kann. Wo sich Geduld zur natürlichen Tapferkeit gesellt, entfaltet der Zweig eine wahrhaft bewegende, vorwärtsweisende Kraft. Sein Bild ist der erste Frühlingsmonat, in dem das aufsteigende Holz durch den letzten Frost bricht — ungestüm, aufbruchsfroh und voller frischer Energie. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "branch.mao",
    title: "Der Hase (Mǎo 卯)",
    symbol: "卯",
    // portedFrom earthlyBranches.ts:89 (description.de), kollektiv→deskriptiv, ~60 W expandiert
    short:
      "Der Zweig Mǎo 卯 verkörpert als Yin-Holz Anmut, Diplomatie und einen feinen Sinn für Schönheit.",
    long:
      "Der Zweig Mǎo 卯 verkörpert als Yin-Holz Anmut, Diplomatie und einen verfeinerten Sinn für Schönheit. Mit Holz-Energie verbunden, verweist dieser Zweig auf einen Lebensstil voller Eleganz und auf gepflegte, harmonische Beziehungen. Hinter einer ruhigen Oberfläche zeigt sich oft ein aufmerksamer, strategischer Geist, der still und beharrlich auf seine Ziele hinarbeitet. Menschen dieser Zeichnung gelten als begabte Friedensstifter, die Konflikte durch Takt und echtes Einfühlungsvermögen entschärfen können. Sein Bild ist der zweite Frühlingsmonat, in dem das Holz weich und biegsam wächst — geschmeidig statt erzwingend, eher umschmeichelnd als drängend, und gerade darin von leiser Wirksamkeit. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "branch.chen",
    title: "Der Drache (Chén 辰)",
    symbol: "辰",
    // portedFrom earthlyBranches.ts:104 (description.de), kollektiv→deskriptiv, ~65 W expandiert
    short:
      "Der Zweig Chén 辰 gilt als günstigstes Zeichen des Zyklus und strahlt als Yang-Erde Kraft, Ehrgeiz und Größe aus.",
    long:
      "Der Zweig Chén 辰 gilt als das günstigste Zeichen des chinesischen Zyklus und strahlt als Yang-Erde Macht, Ehrgeiz und mythische Größe aus. Die Erde-Energie erdet die feurige Natur dieses Zweiges und gibt großen Visionen eine solide Grundlage zum Handeln. Menschen dieser Zeichnung zeigen sich oft als geborene Innovatoren, die erhebliches kreatives Potenzial in bleibende Leistungen umwandeln. Eine gewisse Präsenz erregt dabei Aufmerksamkeit, und Kühnheit öffnet Türen, an die sich andere nicht heranwagen. Sein Bild ist der späte Frühling, in dem feuchte Erde alles Wachstum bündelt — ein Zweig, in dem mehrere Kräfte zugleich gespeichert liegen und auf ihren Moment warten. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "branch.si",
    title: "Die Schlange (Sì 巳)",
    symbol: "巳",
    // portedFrom earthlyBranches.ts:119 (description.de), kollektiv→deskriptiv, ~65 W expandiert
    short:
      "Der Zweig Sì 巳 ist als Yin-Feuer mit Weisheit, Intuition und subtiler Verfeinerung verbunden.",
    long:
      "Der Zweig Sì 巳 ist als Yin-Feuer mit Weisheit, Intuition und subtiler Verfeinerung verbunden. Mit Feuer-Energie verknüpft, verweist dieser Zweig auf ein durchdringendes Verständnis menschlicher Beweggründe und auf eine natürliche Eleganz im Auftreten. Menschen dieser Zeichnung denken oft gründlich nach, bevor sie handeln, sodass Entscheidungen präzise und zielgerichtet wirken. Eine stille Intensität und philosophische Tiefe machen den Zweig zu einer der überzeugendsten Erscheinungen in einem Raum, gerade weil er sich nicht aufdrängt. Sein Bild ist das frühe, verborgene Feuer des Sommers, das nicht lodert, sondern beständig glüht — eine konzentrierte, nach innen gewandte Wärme von feiner Strahlkraft. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "branch.wu",
    title: "Das Pferd (Wǔ 午)",
    symbol: "午",
    // portedFrom earthlyBranches.ts:134 (description.de), kollektiv→deskriptiv, ~65 W expandiert
    short:
      "Der Zweig Wǔ 午 verkörpert als Yang-Feuer Freiheit, Begeisterung und rastlose Lebendigkeit.",
    long:
      "Der Zweig Wǔ 午 verkörpert als Yang-Feuer Freiheit, Begeisterung und rastlose Lebendigkeit. Von der Feuer-Energie auf ihrem Höhepunkt getragen, verweist dieser Zweig auf lebhafte Mitteilsamkeit und eine ansteckende Energie, die andere auf natürliche Weise anzieht. Menschen dieser Zeichnung gedeihen oft dort, wo ihnen Raum zum Erkunden bleibt — gedanklich, schöpferisch und körperlich. Eine besondere Stärke des Zweiges liegt darin, Schwung zu wecken und ein Umfeld auf der Kraft der eigenen Begeisterung mitzuziehen. Sein Bild ist die helle Mittagsstunde des Sommers, in der das Feuer am offensten brennt — voller Bewegung, Wärme und einem unbändigen Drang nach vorn. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "branch.wei",
    title: "Die Ziege (Wèi 未)",
    symbol: "未",
    // portedFrom earthlyBranches.ts:149 (description.de), kollektiv→deskriptiv, ~70 W expandiert
    short:
      "Der Zweig Wèi 未 steht als Yin-Erde für Kreativität, Einfühlungsvermögen und stille innere Stärke.",
    long:
      "Der Zweig Wèi 未 steht als Yin-Erde für Kreativität, Einfühlungsvermögen und stille innere Stärke. Von Erde-Energie genährt, verweist dieser Zweig auf eine natürliche künstlerische Feinfühligkeit und auf einen sanften, fürsorglichen Grundton. Menschen dieser Zeichnung suchen oft Schönheit und Harmonie in ihrer Umgebung und nehmen die emotionalen Bedürfnisse der Nahestehenden mit feinem Gespür wahr. Wo dieser Zweig dem eigenen leisen Wissen vertraut, entstehen Räume von bemerkenswerter Wärme und Inspiration, in denen sich andere geborgen fühlen. Sein Bild ist der weiche Boden des Spätsommers, der Reifendes hält und nährt — ein Zweig, dessen Stärke nicht im Drängen liegt, sondern im geduldigen Sorgen. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "branch.shen",
    title: "Der Affe (Shēn 申)",
    symbol: "申",
    // portedFrom earthlyBranches.ts:164 (description.de), kollektiv→deskriptiv, ~65 W expandiert
    short:
      "Der Zweig Shēn 申 steht als Yang-Metall für Einfallsreichtum, Witz und vielseitige Anpassungsfähigkeit.",
    long:
      "Der Zweig Shēn 申 steht als Yang-Metall für Einfallsreichtum, Witz und vielseitige Anpassungsfähigkeit. Mit Metall-Energie verbunden, verweist dieser Zweig auf eine geborene Lust am Lösen von Problemen, deren spielerische Neugier den Dingen gern einen Schritt voraus ist. Menschen dieser Zeichnung zeigen oft einen schnellen Verstand und eine soziale Ausstrahlung, die in unterschiedlichsten Umfeldern überzeugt und Herausforderungen scheinbar mühelos in Gelegenheiten verwandelt. Die besondere Gabe des Zweiges liegt darin, neuartige Verbindungen zu erkennen, wo andere nur Verwicklung sehen. Sein Bild ist der frühe Herbst, in dem reifes Metall klar und beweglich wird — funkelnd, vielseitig und stets zum nächsten Einfall bereit. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "branch.you",
    title: "Der Hahn (Yǒu 酉)",
    symbol: "酉",
    // portedFrom earthlyBranches.ts:179 (description.de), kollektiv→deskriptiv, ~65 W expandiert
    short:
      "Der Zweig Yǒu 酉 verkörpert als Yin-Metall Präzision, Selbstvertrauen und offene Aufrichtigkeit.",
    long:
      "Der Zweig Yǒu 酉 verkörpert als Yin-Metall Präzision, Selbstvertrauen und offene Aufrichtigkeit. Im Einklang mit Metall-Energie verweist dieser Zweig auf ein scharfes Auge für Details und auf ein ausgeprägtes Pflichtbewusstsein, das zur Sorgfalt antreibt. Menschen dieser Zeichnung zeigen sich oft fleißig und arbeitsam, mit einer Direktheit, die manche zunächst herausfordernd finden und der sie schließlich vertrauen. Eine besondere Tugend des Zweiges liegt im Mut, Dinge klar beim Namen zu nennen, auch wenn Schweigen bequemer wäre. Sein Bild ist der klare Herbst der Ernte, in dem das Metall fein geschliffen ist — ordnend, prüfend und auf eine reine, unbestechliche Form bedacht. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "branch.xu",
    title: "Der Hund (Xū 戌)",
    symbol: "戌",
    // portedFrom earthlyBranches.ts:194 (description.de), kollektiv→deskriptiv, ~80 W (im Band, leicht gestrafft)
    short:
      "Der Zweig Xū 戌 steht als Yang-Erde für Treue, Gerechtigkeit und unerschütterliche Verlässlichkeit.",
    long:
      "Der Zweig Xū 戌 steht als Yang-Erde für Treue, Gerechtigkeit und unerschütterliche Integrität. In Erde-Energie verwurzelt, verweist dieser Zweig auf hingebungsvolle Verbundenheit, die für Wahrheit einsteht und fest zu den Nahestehenden hält. Menschen dieser Zeichnung gelten oft als allgemein vertrauenswürdig, weil Aufrichtigkeit und ein tiefes Gerechtigkeitsgefühl ihr Handeln tragen — auch wenn sie an erlebter Ungerechtigkeit schwer tragen können. In seiner reifen Ausprägung erinnert der Zweig daran, dass beständige Treue und moralischer Mut zu den großzügigsten Gesten zählen, die ein Mensch einem anderen anbieten kann. Sein Bild ist der späte Herbst, in dem die Erde alles Geerntete wachsam hütet und bewahrt. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "branch.hai",
    title: "Das Schwein (Hài 亥)",
    symbol: "亥",
    // portedFrom earthlyBranches.ts:209 (description.de), kollektiv→deskriptiv, ~75 W (im Band)
    short:
      "Der Zweig Hài 亥 steht als Yin-Wasser für Großzügigkeit, Aufrichtigkeit und herzliche Lebensfreude.",
    long:
      "Der Zweig Hài 亥 steht als Yin-Wasser für Großzügigkeit, Aufrichtigkeit und das unbeschwerte Genießen der schönen Seiten des Lebens. Von Wasser-Energie geleitet, verweist dieser Zweig auf eine mitfühlende, großherzige Wesensart, die Freude und Fülle in ihr Umfeld trägt. Das Vertrauen in die grundlegende Güte der Welt zählt zu seinen liebenswertesten Zügen — und zugleich zu der Offenheit, die zu schützen es zu lernen gilt. Wo sich natürliche Wärme mit gesundem Unterscheidungsvermögen verbindet, wird der Zweig zu einer Quelle echter Fülle für alle ringsum. Sein Bild ist der stille Frühwinter, in dem das ruhende Wasser tief und nährend unter der Oberfläche steht. {anchor}",
    source: "astro-noctum",
  },
];

// Lowercase alias to match the index.ts aggregator convention (peer modules
// zodiacSigns/stems/elements/pillars/houses all export the same lowercase shape).
export const branches: ExplanationEntry[] = BRANCHES_ENTRIES;
