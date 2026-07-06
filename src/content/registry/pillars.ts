/**
 * P5-T2 — Content-Registry: Domain "pillars" (4 BaZi-Säulen / Lebensbereiche).
 *
 * Portiert aus Astro-Noctum
 * (…/codebase/Bazodiac-WebApp/Astro-Noctum/src/i18n/translations.ts:802-805,
 * Feld `pillars.{year,month,day,hour}Desc`). Die Quelltexte sind nur ~25–30 W
 * und im „du/deine"-Register; hier auf 60–120 W expandiert und in deskriptive
 * dritte Person konvertiert. Zusätzliche Bedeutungs-Aspekte stammen aus dem
 * Parallel-Set `BaZiFourPillars.tsx:26-52` (PILLAR_META.desc.de) derselben
 * Astro-Noctum-Quelle — daher `source: "astro-noctum"`.
 *
 * Register-Pass (Amendment D): keine „Du bist…"-Festlegung, keine verbotenen
 * Begriffe (Coaching/Therapie/Diagnose/Heilung/Schicksal); jede Säule wird als
 * Lebensbereichs-FRAME eingeordnet, nicht als Charakter-Urteil. Jedes `long`
 * endet mit dem literalen Slot " {anchor}", den die T3-UI mit dem Profil-
 * Datenanker füllt (einzige Stelle, an der ein „dein"-Datenzeiger erscheint).
 *
 * `symbol` = das chinesische Säulen-Glyph (年柱/月柱/日柱/時柱 → 年/月/日/時),
 * konsistent mit dem `chinese`-Feld in BaZiFourPillars.tsx.
 *
 * Wichtig (siehe content-sources.md, pillar.day): pillar.day bleibt der reine
 * Selbst-/Kernidentitäts-FRAME (Rì Zhù 日主). Das element-spezifische
 * Day-Master-Detail liegt kanonisch in `fufireNormalizer.ts` DAY_MASTER_TEXTS
 * (P1 A14) und wird dort verwendet — hier bewusst NICHT dupliziert.
 */
import { ExplanationEntry } from "./types";

export const PILLARS_ENTRIES: ExplanationEntry[] = [
  {
    id: "pillar.year",
    title: "Jahres-Säule",
    symbol: "年",
    // portedFrom translations.ts:802 (yearDesc) + BaZiFourPillars.tsx:26-31, ~26 W → expandiert, deine→neutral
    short:
      "Die Jahres-Säule steht im BaZi-Modell für Herkunft und gesellschaftliche Prägung — das kosmische Klima der Geburt und die kollektiven Kräfte der frühen Jahre.",
    long:
      "Die Jahres-Säule trägt im BaZi-Modell die Ahnenenergie und die gesellschaftliche Prägung: Sie verweist auf das kosmische Klima der Geburt und auf die kollektiven Kräfte, die eine frühe Weltanschauung mitformen. Als äußerste der vier Säulen beschreibt sie zugleich die nach außen sichtbare Rolle — wie ein Mensch im Kreis der Familie und in Gruppen wahrgenommen wird und welche Position dort eingenommen wird. So liest sich diese Säule weniger als festes Urteil über die Person, sondern als Einordnung von Herkunft, Wurzeln und sozialem Hintergrund — der Resonanzraum, vor dem sich alles Weitere entfaltet. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "pillar.month",
    title: "Monats-Säule",
    symbol: "月",
    // portedFrom translations.ts:803 (monthDesc) + BaZiFourPillars.tsx:32-39, ~28 W → expandiert, deine→neutral
    short:
      "Die Monats-Säule steht im BaZi-Modell für Beruf, soziales Umfeld und die prägenden Bedingungen der Jugend — der Bereich von Antrieb und Leistung.",
    long:
      "Die Monats-Säule regiert im BaZi-Modell den Bereich von Karriere, sozialem Umfeld und Ambition: Sie beschreibt die prägenden Bedingungen der Jugend und die energetische Strömung, die mitbestimmt, welche Rolle ein Mensch in der Welt einnimmt. Eng verbunden ist sie mit der mittleren Lebensphase und dem Antrieb zur Leistung — dem Feld, in dem berufliche Wege, Verpflichtungen und das unmittelbare Umfeld zusammenlaufen. Als zweite der vier Säulen markiert sie weniger eine Charakterfestlegung als vielmehr den Lebensbereich von Arbeit, Streben und gesellschaftlicher Verortung, in dem sich Tatkraft sichtbar ausdrückt. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "pillar.day",
    title: "Tages-Säule",
    symbol: "日",
    // portedFrom translations.ts:804 (dayDesc) + BaZiFourPillars.tsx:40-47, ~24 W → Selbst-FRAME, deine→neutral; element-spez. Day-Master-Detail NICHT dupliziert (fufireNormalizer DAY_MASTER_TEXTS, P1 A14)
    short:
      "Die Tages-Säule steht im BaZi-Modell für das Selbst — die Kernidentität und das innere Wesen, der sogenannte Tagesmeister (Rì Zhù 日主).",
    long:
      "Die Tages-Säule gilt im BaZi-Modell als das Selbst: Sie verweist auf die Kernidentität, das innere Wesen und die elementare Kraft, die im Zentrum der persönlichen Energie steht — der sogenannte Tagesmeister (Rì Zhù 日主). Als Herzstück der vier Säulen ist sie der Bezugspunkt, von dem aus die übrigen Säulen ihre Bedeutung erhalten, und der innerste Ausdruck dessen, was als eigenes Wesen empfunden wird. Diese Säule bildet damit den Rahmen für das Kernselbst, ohne hier ein festes Charakterurteil zu sprechen; das element-spezifische Bild des Tagesmeisters wird gesondert eingeordnet. {anchor}",
    source: "astro-noctum",
  },
  {
    id: "pillar.hour",
    title: "Stunden-Säule",
    symbol: "時",
    // portedFrom translations.ts:805 (hourDesc) + BaZiFourPillars.tsx:48-55, ~28 W → expandiert, deiner→neutral
    short:
      "Die Stunden-Säule steht im BaZi-Modell für Vision, Vermächtnis und spätes Leben — verborgene Beweggründe und die Zukunft, auf die ein Mensch zugeht.",
    long:
      "Die Stunden-Säule offenbart im BaZi-Modell den Bereich von Vision, Vermächtnis und Zukunft: Sie verweist auf das, worauf ein Mensch zugeht, und ist verbunden mit kreativer Kraft, mit Kindern und mit den Träumen, die im Inneren getragen werden. Als letzte der vier Säulen beschreibt sie zugleich das verborgene Selbst — unbewusste Muster, private Bestrebungen und das spätere Leben mit seinem hinterlassenen Vermächtnis. So liest sich diese Säule als Einordnung von Ausblick und innerer Werkstatt: der Lebensbereich von Vorhaben, Nachkommen und stiller Vorstellungskraft, ohne dass damit ein festes Urteil über die Person gefällt würde. {anchor}",
    source: "astro-noctum",
  },
];

/** Alias für den Domain-Aggregator (index.ts). */
export const pillars: ExplanationEntry[] = PILLARS_ENTRIES;
