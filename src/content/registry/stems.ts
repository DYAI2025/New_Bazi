/**
 * P5-T2 — Content-Registry: Domain "stems" (10 Himmlische Stämme 天干).
 *
 * Portiert aus Astro-Noctum
 * (…/codebase/Bazodiac-WebApp/Astro-Noctum-prod/src/lib/astro-data/heavenlyStems.ts,
 * Feld `HEAVENLY_STEMS[].dayMaster.de`). Die Quell-Prosa adressiert „du/deine";
 * hier in deskriptive Platzierung dritter Person über den Stamm selbst
 * konvertiert („Jiǎ … ist der aufragende Baum…", „Menschen mit diesem Tagesmeister
 * zeigen oft…"). Keine „Du bist…"-Festlegung, keine deterministische
 * Charakter-Fixierung, keine verbotenen Begriffe (Coaching/Therapie/Diagnose/
 * Heilung/Schicksal). Jedes `long` endet mit dem literalen Slot " {anchor}",
 * den die T3-UI mit dem Profil-Datenanker füllt (einzige Stelle, an der ein
 * „dein"-Datenzeiger erscheint).
 *
 * Längen-Pass (Amendment D): stem.wu (Berg, ~190 W) und stem.ren (Ozean, ~190 W)
 * sind aus dem mehrabsätzigen dayMaster.de auf das 60–120-Wort-Band getrimmt
 * (Kern: Bild, elementare Identität, stabilisierende Gaben — ohne Schatten-/
 * Wachstums-Absätze, die im Trim entfallen). Die übrigen acht liegen bereits im
 * Band und brauchen nur den Du→deskriptiv-Register-Pass.
 *
 * IDs, Reihenfolge und Pinyin folgen kanonisch HEAVENLY_STEMS in
 * ../../utils/astrology.ts (Jiǎ, Yǐ, Bǐng, Dīng, Wù, Jǐ, Gēng, Xīn, Rén, Guǐ).
 * `symbol` = chinesisches Stamm-Schriftzeichen aus der kanonischen Tabelle.
 *
 * Kein verbatim-Reuse aus fufireNormalizer.ts `DAY_MASTER_TEXTS` (nur 5
 * Element-Texte, fehlt die Yin/Yang-Granularität pro Stamm) — AN-Per-Stamm-Prosa
 * bleibt die Quelle.
 */
import { ExplanationEntry } from "./types";

export const STEMS_ENTRIES: ExplanationEntry[] = [
  {
    id: "stem.jia",
    title: "Jiǎ 甲",
    symbol: "甲",
    // portedFrom heavenlyStems.ts:35 (dayMaster.de), du→deskriptiv
    short:
      "Jiǎ steht für den aufragenden Baum — aufrechtes Yang-Holz, das mit klarem Sinn für Bestimmung nach oben wächst.",
    long:
      "Jiǎ 甲 ist der aufragende Baum, das Yang des Holz-Elements: eine Energie, die aufrecht steht, mit einem klaren Sinn für Bestimmung und einem Drang zum Wachstum nach oben. Die elementare Identität dieses Tagesmeisters liegt in Ambition, Führung und prinzipientreuer Direktheit. Wie eine alte Eiche, deren Wurzeln gefasst haben, lässt sie sich nur schwer biegen. Inspiration entsteht hier weniger aus Kraft als aus sichtbarer Integrität und aus Beharrlichkeit, die andere bemerken. Herausforderungen wirken in dieser Konstellation eher stärkend, und Druck erscheint als etwas, das Dauerhaftigkeit formt statt zu zerbrechen. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "stem.yi",
    title: "Yǐ 乙",
    symbol: "乙",
    // portedFrom heavenlyStems.ts:47 (dayMaster.de), du→deskriptiv
    short:
      "Yǐ steht für die Ranke — flexibles Yin-Holz, das um Hindernisse herumwächst, statt an ihnen zu zerbrechen.",
    long:
      "Yǐ 乙 ist die Ranke, das Yin des Holz-Elements: flexibel, belastbar und still unaufhaltsam. Wo Jiǎ geradeaus nach oben wächst, wächst diese Energie um Hindernisse herum und findet den Weg des geringsten Widerstands, ohne aufzugeben. Die elementare Identität dieses Tagesmeisters zeigt sich als sanfte Beharrlichkeit und adaptive Intelligenz. Sie entfaltet sich in der Zusammenarbeit, biegt sich eher mit anderen, als an ihnen zu zerbrechen. Eine stille Stärke liegt darin, dass diese Kraft oft kaum bemerkt wird, bis sie längst angekommen ist — Wirkung durch Anpassung statt durch Konfrontation. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "stem.bing",
    title: "Bǐng 丙",
    symbol: "丙",
    // portedFrom heavenlyStems.ts:59 (dayMaster.de), du→deskriptiv
    short:
      "Bǐng steht für die Sonne selbst — strahlendes Yang-Feuer, das jeden Raum erhellt und großzügig Energie verschenkt.",
    long:
      "Bǐng 丙 ist die Sonne selbst, das Yang des Feuer-Elements: strahlend, großzügig und schwer zu übersehen. Die elementare Identität dieses Tagesmeisters ist sichtbar gewordene Wärme — eine Energie, die Räume erhellt und ihre Umgebung mit Kraft versorgt, ohne dafür eine Gegenleistung zu erwarten. Der Ausdruck ist hell, optimistisch und großmütig. Umgebungen, die ein Dimmen dieses Lichts verlangen, fallen dieser Konstellation eher schwer, weil das Zurückhalten der eigenen Natur ihrer Grundarchitektur widerspricht. Wo dieses Feuer voll strahlen darf, gedeihen andere oft in seinem Glanz und finden Orientierung in seiner Offenheit. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "stem.ding",
    title: "Dīng 丁",
    symbol: "丁",
    // portedFrom heavenlyStems.ts:71 (dayMaster.de), du→deskriptiv
    short:
      "Dīng steht für die Kerzenflamme — intimes Yin-Feuer, das nach innen brennt, mit scharfer Wahrnehmung und Tiefe.",
    long:
      "Dīng 丁 ist die Kerzenflamme, das Yin des Feuer-Elements: intim, wahrnehmend und still transformativ. Während Bǐng nach außen lodert, brennt dieses Feuer nach innen, mit konzentriertem Fokus und emotionaler Tiefe. Die elementare Identität dieses Tagesmeisters ist die eines Hüters inneren Lichts, der wahrnimmt, was andere im Dunkeln übersehen. Die Intuition gilt hier als außergewöhnlich scharf, und die Welt wird ebenso über das Fühlen wie über das Denken verarbeitet. Wirkung entfaltet sich weniger über große Gesten als über stille Präsenz und emotionale Wahrheit — eine Tiefe, die in kleinen Momenten spürbar wird. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "stem.wu",
    title: "Wù 戊",
    symbol: "戊",
    // portedFrom heavenlyStems.ts:83 (dayMaster.de); ~190 W → auf Band getrimmt (Bild + Identität + stabilisierende Gaben, Schatten-/Wachstums-Absätze entfallen), du→deskriptiv
    short:
      "Wù steht für den Berg — unbewegliches Yang-Erde, verlässlich und befehlend durch pure Präsenz.",
    long:
      "Wù 戊 ist der Berg, das Yang des Erde-Elements: unbeweglich, verlässlich und wirkmächtig durch pure Präsenz. Die elementare Identität dieses Tagesmeisters ist Stabilität selbst — in der Landschaft der zehn Himmelsstämme das Fundament, auf dem anderes errichtet wird. Im Alltag zeigt sich das als erdende Kraft, auf die andere sich instinktiv verlassen: eine Ruhe, die bleibt, wenn Chaos ausbricht, und ein Wort, das Gewicht trägt, gerade weil es nie leichtfertig gegeben wird. Vertrauen bildet sich hier in Schichten, die Bestand haben. Geduld, Ehrlichkeit und ein unerschütterliches Pflichtbewusstsein gelten als die stabilisierenden Gaben dieser Konstellation. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "stem.ji",
    title: "Jǐ 己",
    symbol: "己",
    // portedFrom heavenlyStems.ts:95 (dayMaster.de), du→deskriptiv
    short:
      "Jǐ steht für den fruchtbaren Boden — nährendes Yin-Erde, aufnahmefähig und still unverzichtbar.",
    long:
      "Jǐ 己 ist der fruchtbare Boden, das Yin des Erde-Elements: nährend, aufnahmefähig und still unverzichtbar. Wo Wù der Berg ist, der die Landschaft dominiert, ist diese Energie der Garten, der sie bewohnbar macht. Die elementare Identität dieses Tagesmeisters liegt in Empfänglichkeit und Verwandlung: Es nimmt auf, was das Leben gibt, und formt es in etwas Nährendes um. Empathisch und anpassungsfähig wirkt diese Konstellation oft als emotionaler Anker in ihren Beziehungen. Ihre Kraft zeigt sich in der Fähigkeit, Raum für andere zu halten, ohne die eigene Mitte zu verlieren — eine leise, beständige Form von Großzügigkeit. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "stem.geng",
    title: "Gēng 庚",
    symbol: "庚",
    // portedFrom heavenlyStems.ts:107 (dayMaster.de), du→deskriptiv
    short:
      "Gēng steht für die geschmiedete Klinge — entscheidungsfreudiges Yang-Metall, prinzipientreu und klar in Fragen der Gerechtigkeit.",
    long:
      "Gēng 庚 ist die geschmiedete Klinge, das Yang des Metall-Elements: entscheidungsfreudig, prinzipientreu und unnachgiebig in Fragen der Gerechtigkeit. Die elementare Identität dieses Tagesmeisters ist die von moralischer Klarheit und struktureller Stärke. Mehrdeutigkeit wird hier mit Präzision durchschnitten, und das Gefühl für Richtig und Falsch ist tief empfunden, nicht nur intellektuell gehalten. Loyal und diszipliniert erwartet diese Konstellation von anderen oft dieselben Standards, die sie an sich selbst anlegt. Ihre Herausforderung liegt in der Starrheit — doch richtig gehärtet zeigt sich diese Energie als verlässlichstes Instrument, gerade dort, wo Haltung und Klarheit gefragt sind. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "stem.xin",
    title: "Xīn 辛",
    symbol: "辛",
    // portedFrom heavenlyStems.ts:119 (dayMaster.de), du→deskriptiv
    short:
      "Xīn steht für den polierten Edelstein — raffiniertes Yin-Metall, sensibel und anspruchsvoll in Schönheit und Wahrheit.",
    long:
      "Xīn 辛 ist der polierte Edelstein, das Yin des Metall-Elements: raffiniert, sensibel und anspruchsvoll in Sachen Schönheit und Wahrheit. Während Gēng mit Kraft schneidet, schneidet diese Energie mit Präzision und Eleganz. Die elementare Identität dieses Tagesmeisters liegt in ästhetischem Unterscheidungsvermögen und stillem Perfektionismus. Unvollkommenheiten, die andere übersehen, werden hier wahrgenommen, und der innere Kritiker erscheint zugleich als größtes Werkzeug und als schwerste Last. Im besten Ausdruck verwandelt diese Konstellation rohe Erfahrung in etwas Leuchtendes — einen Standard, dem andere nacheifern, getragen von einem feinen Gespür für Qualität statt für bloße Menge. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "stem.ren",
    title: "Rén 壬",
    symbol: "壬",
    // portedFrom heavenlyStems.ts:131 (dayMaster.de); ~190 W → auf Band getrimmt (Bild + Identität + stabilisierende Qualitäten, Schatten-/Wachstums-Absätze entfallen), du→deskriptiv
    short:
      "Rén steht für den Ozean — weites Yang-Wasser, tief und von Strömungen regiert, die an der Oberfläche unsichtbar bleiben.",
    long:
      "Rén 壬 ist der Ozean, das Yang des Wasser-Elements: weit, tief und von Strömungen regiert, die an der Oberfläche unsichtbar bleiben. Die elementare Identität dieses Tagesmeisters liegt in expansivem Denken und philosophischer Tiefe — unter den zehn Himmelsstämmen die grenzenloseste Energie, die verschiedene Welten verbindet. Im Alltag zeigt sich das als intellektuelle Rastlosigkeit und große emotionale Bandbreite; Ideen, Menschen und Perspektiven fließen hindurch, ohne je oberflächlich zu sein. Vision, Anpassungsfähigkeit und der Blick für Verbindungen, die ganze Systeme umspannen, gelten als die stabilisierenden Qualitäten dieser Konstellation. Wo andere isolierte Fakten sehen, erkennt diese Energie Strömungen und Muster. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "stem.gui",
    title: "Guǐ 癸",
    symbol: "癸",
    // portedFrom heavenlyStems.ts:143 (dayMaster.de), du→deskriptiv
    short:
      "Guǐ steht für den Morgentau — sanftes Yin-Wasser, geheimnisvoll und zutiefst intuitiv.",
    long:
      "Guǐ 癸 ist der Morgentau, das Yin des Wasser-Elements: sanft, geheimnisvoll und zutiefst intuitiv. Wo Rén die Kraft des Ozeans ist, ist diese Energie sein Flüstern — subtil, nährend und auf Weisen präsent, die der beiläufigen Beobachtung entgehen. Die elementare Identität dieses Tagesmeisters liegt in tiefer Empathie und feiner Sensibilität. Die emotionalen Frequenzen eines Raums werden hier aufgenommen und zu Einsicht verarbeitet, die anderen nicht ohne Weiteres zugänglich ist. Die Wirkung ist still, aber verwandelnd — vergleichbar mit Regen, der eine Landschaft über Nacht verändert, ohne dass jemand ihn fallen hört. Leise Tiefe statt lauter Geste. {anchor}",
    source: "astro-noctum",
  },
];

/**
 * Aggregator-Alias: index.ts importiert die Domain als `stems` und spreizt sie
 * in `ALL_ENTRIES`. STEMS_ENTRIES bleibt der kanonische Domain-Export.
 */
export const stems: ExplanationEntry[] = STEMS_ENTRIES;
