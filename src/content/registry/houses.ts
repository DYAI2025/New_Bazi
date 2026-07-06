/**
 * P5-T2 — Content-Registry · Domain "houses" (12 westliche Häuser).
 *
 * Disposition gemäß docs/contracts/content-sources.md (Abschnitt "Domain:
 * houses"): 0/12 PORT (KEINE portierbare Astro-Noctum-Prosa existiert; AN hat
 * nur i18n-UI-Labels), 12/12 REUSE aus der New_Bazi-Eigenbasis. Quelle der
 * wiederverwendeten Basis-Prosa ist HOUSE_TEMPLATES in
 *   src/utils/fufireNormalizer.ts:7-20 (Feld `description`, je ~25–40 W,
 *   "Ihre/Sie"-Anrede).
 * Jeder Text wurde auf 60–120 W erweitert und vom "Ihre/Sie"-Register in eine
 * neutral-deskriptive Dritte-Person-Einordnung überführt (Amendment D: keine
 * „Du bist…"-Festlegung, keine verbotenen Begriffe Coaching/Therapie/Diagnose/
 * Heilung/Schicksal). Da die Basis aus New_Bazi selbst stammt und substanziell
 * erweitert/voiced wurde, ist `source: "curated"` — NICHT "astro-noctum".
 *
 * Titel + Säulen-/Achsen-Bezeichnungen (Aszendent, Imum Coeli, Deszendent,
 * Medium Coeli) folgen den Anzeigetiteln aus HOUSE_TEMPLATES. `symbol` ist die
 * Hausnummer als stabile, layout-unabhängige Glyphe.
 *
 * `long` endet mit dem literalen Slot " {anchor}" (T3-UI füllt den Profil-
 * Datenanker, z. B. „— in deinem Profil: 3. Haus ab Zwillinge 12.4°"). Der
 * Anker ist die einzige Stelle, an der „dein/deinem" erlaubt ist (Datenzeiger).
 */
import { ExplanationEntry } from "./types";

export const HOUSES_ENTRIES: ExplanationEntry[] = [
  {
    id: "house.1",
    title: "Erstes Haus (Aszendent) — Identität & Auftritt",
    symbol: "1",
    short:
      "Das erste Haus (Aszendent) steht für Erscheinung, ersten Eindruck und den instinktiven Auftakt neuer Lebensphasen.",
    long:
      "Das erste Haus, der Aszendent, markiert in der westlichen Astrologie den Auftakt des Horoskops. Es steht für die unmittelbare Erscheinung, die Art des ersten Eindrucks und den instinktiven Impuls, mit dem neue Lebensphasen begonnen werden. Hier zeigt sich, wie Vitalität nach außen tritt und welche Maske die Begegnung mit der Welt einleitet. Das Zeichen am Aszendenten und mögliche Planeten in diesem Feld färben diesen Auftritt: Sie verleihen ihm Tempo, Wärme oder Zurückhaltung. Als Einordnung gelesen beschreibt das erste Haus weniger ein festes Wesen als eine Bühne, auf der das Selbst seine Rolle erprobt und im Wandel der Jahre immer wieder neu betritt. {anchor}",
    source: "curated",
  },
  {
    id: "house.2",
    title: "Zweites Haus — Besitz, Werte & Ressourcen",
    symbol: "2",
    short:
      "Das zweite Haus umfasst persönliche Ressourcen, Talente, Besitz und das innere Gefühl von Wert.",
    long:
      "Das zweite Haus widmet sich in der westlichen Astrologie den persönlichen Ressourcen: materiellem Besitz, Einkommen, Talenten und dem inneren Gefühl von Wert. Es beschreibt, worauf sich jemand stützt, was als sicher und eigen empfunden wird und wie der Umgang mit dem Greifbaren ausfällt. Das Zeichen an der Spitze dieses Feldes und etwaige Planeten geben Hinweise darauf, ob hier eher das Bewahren, das Genießen oder das Aufbauen im Vordergrund steht. Als Einordnung verstanden zeigt das zweite Haus eine Beziehung zur eigenen Substanz – ein Spannungsfeld zwischen Halt und Loslassen, das sich im Laufe des Lebens immer wieder neu austariert. {anchor}",
    source: "curated",
  },
  {
    id: "house.3",
    title: "Drittes Haus — Kommunikation, Intellekt & Alltag",
    symbol: "3",
    short:
      "Das dritte Haus regiert alltägliches Denken, nahen Austausch, Geschwister und den Fluss der Information.",
    long:
      "Das dritte Haus regiert in der westlichen Astrologie das alltägliche Denken, den nahen Austausch und die kurzen Wege. Es umfasst Sprache, Lernen, Geschwister, Nachbarschaft und den ständigen Fluss von Information, der den Tag durchzieht. Hier zeigt sich, wie Eindrücke aufgenommen, sortiert und weitergegeben werden und mit welcher Neugier das unmittelbare Umfeld erkundet wird. Das Zeichen an diesem Feld und mögliche Planeten färben den Stil des Denkens: rasch oder bedächtig, sachlich oder verspielt. Als Einordnung gelesen beschreibt das dritte Haus eine Art geistiger Beweglichkeit – die Brücke zwischen Wahrnehmung und Wort, die das tägliche Verstehen trägt und immer wieder neu geknüpft wird. {anchor}",
    source: "curated",
  },
  {
    id: "house.4",
    title: "Viertes Haus (Imum Coeli) — Heimat, Familie & Wurzeln",
    symbol: "4",
    short:
      "Das vierte Haus (Imum Coeli) beschreibt das emotionale Fundament, Herkunft, Familie und innere Zuflucht.",
    long:
      "Das vierte Haus, das Imum Coeli, bildet in der westlichen Astrologie das emotionale Fundament des Horoskops. Es steht für Herkunft, Familie, Wurzeln, das Zuhause und jene innere Zuflucht, in die man sich zurückzieht. Hier sammeln sich frühe Prägungen, das Gefühl von Geborgenheit und die stille Basis, von der aus das Leben nach außen wächst. Das Zeichen an der Spitze dieses Feldes und etwaige Planeten geben Hinweise auf die Färbung des Heimatlichen – schützend, fordernd oder nährend. Als Einordnung verstanden beschreibt das vierte Haus die Tiefenschicht des Selbst: einen Ort, der weniger gezeigt als bewahrt wird und der im Verlauf des Lebens immer wieder neu erkundet werden darf. {anchor}",
    source: "curated",
  },
  {
    id: "house.5",
    title: "Fünftes Haus — Kreativität, Lust & Erschaffung",
    symbol: "5",
    short:
      "Das fünfte Haus entfaltet schöpferischen Ausdruck, Romantik, Spiel und die Freude des inneren Kindes.",
    long:
      "Das fünfte Haus entfaltet in der westlichen Astrologie den schöpferischen Ausdruck und die Freude am Spiel. Es umfasst Kreativität, Romantik, Vergnügen, Risikolust und das innere Kind, das gestalten und sich zeigen möchte. Hier zeigt sich, wie Lebenslust nach außen drängt, wo Begeisterung aufflammt und auf welche Weise das Eigene in die Welt gesetzt wird – sei es als Kunst, als Liebe oder als heiteres Wagnis. Das Zeichen an diesem Feld und mögliche Planeten färben diesen Ausdruck mit Tempo, Wärme oder Dramatik. Als Einordnung gelesen beschreibt das fünfte Haus den lustvollen Pol des Horoskops, an dem das Selbst sich verschwendet und im Schaffen wiederfindet. {anchor}",
    source: "curated",
  },
  {
    id: "house.6",
    title: "Sechstes Haus — Praxis, Alltag & Gesundheit",
    symbol: "6",
    short:
      "Das sechste Haus ordnet Alltag, Routinen, Arbeit als Dienst und das Verhältnis zur Gesundheit.",
    long:
      "Das sechste Haus ordnet in der westlichen Astrologie den Alltag, die täglichen Routinen und das Verhältnis zur eigenen Gesundheit. Es umfasst Arbeit im Sinne von Dienst und Pflicht, Ernährung, Gewohnheiten und das feine Zusammenspiel von Körper und Lebensrhythmus. Hier zeigt sich, wie Struktur in den Tag gebracht wird, mit welcher Sorgfalt Aufgaben angegangen werden und wo das Bedürfnis nach Ordnung und Nützlichkeit liegt. Das Zeichen an diesem Feld und mögliche Planeten färben den Stil des Wirkens: gewissenhaft, pragmatisch oder unermüdlich. Als Einordnung gelesen beschreibt das sechste Haus die stille Disziplin des Gewöhnlichen – jenen Bereich, in dem das Leben durch beständige kleine Handlungen Gestalt annimmt. {anchor}",
    source: "curated",
  },
  {
    id: "house.7",
    title: "Siebtes Haus (Deszendent) — Begegnung & Partnerschaft",
    symbol: "7",
    short:
      "Das siebte Haus (Deszendent) steht für Partnerschaft, enge Kooperation und die Begegnung mit dem Anderen.",
    long:
      "Das siebte Haus, der Deszendent, führt in der westlichen Astrologie in die Begegnung mit dem Anderen. Es steht für feste Partnerschaft, Ehe, enge Kooperationen und Verträge – und damit für all jene Spiegel, in denen sich das eigene Wesen über das Gegenüber erschließt. Hier zeigt sich, was im Anderen gesucht wird, welche Qualitäten anziehen und wie Nähe und Verbindlichkeit gestaltet werden. Das Zeichen an diesem Feld und mögliche Planeten färben den Stil der Beziehung: ausgleichend, leidenschaftlich oder bedacht. Als Einordnung gelesen beschreibt das siebte Haus die Kunst des Aufeinander-Zugehens – einen Bereich, in dem das Selbst im Dialog mit anderen klarere Konturen gewinnt. {anchor}",
    source: "curated",
  },
  {
    id: "house.8",
    title: "Achtes Haus — Wandel, Tabus & Geteiltes",
    symbol: "8",
    short:
      "Das achte Haus thematisiert Transformation, geteilte Ressourcen, Tabus und tiefgreifende Wendepunkte.",
    long:
      "Das achte Haus thematisiert in der westlichen Astrologie das Tiefgreifende und Verwandelnde. Es umfasst geteilte Ressourcen, Erbe, Intimität, Tabus und jene Wendepunkte, an denen Altes endet und Neues aufbricht. Hier zeigt sich, wie mit Krisen, Bindung und den verborgenen Strömungen unter der Oberfläche umgegangen wird und welche Kraft aus tiefer Erneuerung erwächst. Das Zeichen an diesem Feld und mögliche Planeten färben diese Prozesse: forschend, leidenschaftlich oder kontrolliert. Als Einordnung gelesen beschreibt das achte Haus den Bereich seelischer Transformation – einen Ort, an dem das Leben sich häutet und durch das Loslassen des Vertrauten zu neuer Tiefe findet. {anchor}",
    source: "curated",
  },
  {
    id: "house.9",
    title: "Neuntes Haus — Philosophie, Weite & Sinn",
    symbol: "9",
    short:
      "Das neunte Haus weitet den Horizont durch Philosophie, Ethik, Glaube und die Suche nach Sinn.",
    long:
      "Das neunte Haus erweitert in der westlichen Astrologie den Horizont über das Vertraute hinaus. Es steht für höhere Bildung, Philosophie, Ethik, Glaubensfragen, ferne Länder und die Suche nach übergeordnetem Sinn. Hier zeigt sich, wie das Bedürfnis nach Bedeutung gestillt wird, welche Überzeugungen tragen und mit welcher Offenheit das Fremde und Weite erkundet wird. Das Zeichen an diesem Feld und mögliche Planeten färben diese Suche: dogmatisch oder fragend, abenteuerlich oder gelehrt. Als Einordnung gelesen beschreibt das neunte Haus den geistigen Fernblick des Horoskops – jenen Bereich, in dem aus einzelnen Erfahrungen ein größeres Verständnis gewoben und der eigene Standpunkt immer wieder geweitet wird. {anchor}",
    source: "curated",
  },
  {
    id: "house.10",
    title: "Zehntes Haus (Medium Coeli) — Ruf, Berufung & Stand",
    symbol: "10",
    short:
      "Das zehnte Haus (Medium Coeli) verkörpert Berufung, gesellschaftliche Rolle, Status und sichtbares Wirken.",
    long:
      "Das zehnte Haus, das Medium Coeli, verkörpert in der westlichen Astrologie den höchsten, sichtbarsten Punkt des Horoskops. Es steht für Berufung, gesellschaftliche Rolle, Status, Verantwortung und das, was öffentlich Bestand hat. Hier zeigt sich, wonach im Wirken nach außen gestrebt wird, welche Autorität angenommen wird und wie der Beitrag zur Welt Gestalt gewinnt. Das Zeichen an diesem Feld und mögliche Planeten färben den Weg nach oben: ehrgeizig, pflichtbewusst oder gestaltend. Als Einordnung gelesen beschreibt das zehnte Haus den Bogen einer Lebensleistung – jenen Bereich, in dem sich das Selbst der Gemeinschaft zeigt und über die Jahre ein erkennbares Profil ausformt. {anchor}",
    source: "curated",
  },
  {
    id: "house.11",
    title: "Elftes Haus — Ideale, Kollektiv & Freunde",
    symbol: "11",
    short:
      "Das elfte Haus beheimatet Freundeskreise, Netzwerke, gemeinsame Ideale und Visionen für die Zukunft.",
    long:
      "Das elfte Haus beheimatet in der westlichen Astrologie das Kollektiv und die Zukunft. Es umfasst Freundeskreise, Gleichgesinnte, Netzwerke, gemeinsame Ideale sowie die Hoffnungen und Visionen, die über das Persönliche hinausweisen. Hier zeigt sich, wie Zugehörigkeit zu größeren Gruppen erlebt wird, welche Anliegen geteilt werden und auf welche Weise Wünsche in gemeinsame Vorhaben einfließen. Das Zeichen an diesem Feld und mögliche Planeten färben diese Verbindungen: humanitär, eigenwillig oder loyal. Als Einordnung gelesen beschreibt das elfte Haus den Blick nach vorn und auf das Wir – einen Bereich, in dem das Einzelne sich in größere Zusammenhänge einfügt und an einer offenen Zukunft mitwebt. {anchor}",
    source: "curated",
  },
  {
    id: "house.12",
    title: "Zwölftes Haus — Rückzug, Unbewusstes & Auflösung",
    symbol: "12",
    short:
      "Das zwölfte Haus hütet das Unbewusste, den Rückzug, Träume und die Hingabe an ein größeres Ganzes.",
    long:
      "Das zwölfte Haus hütet in der westlichen Astrologie das Verborgene und Auflösende. Es umfasst das Unbewusste, den Rückzug, die Stille, Träume und jene inneren Räume, die sich dem Tageslicht entziehen. Hier zeigt sich, was im Verborgenen wirkt, wie mit Hingabe, Loslassen und der Sehnsucht nach Verbundenheit mit einem größeren Ganzen umgegangen wird. Das Zeichen an diesem Feld und mögliche Planeten färben diese leise Schicht: mitfühlend, künstlerisch oder kontemplativ. Als Einordnung gelesen beschreibt das zwölfte Haus den auflösenden Pol des Horoskops – einen Bereich, in dem Grenzen durchlässig werden und das Selbst sich für einen Moment in etwas Weiteres öffnet. {anchor}",
    source: "curated",
  },
];

/**
 * Aggregator-Alias: index.ts importiert die Domain unter dem Namen `houses`.
 * Beide Exporte zeigen auf dasselbe Array (keine Duplikation).
 */
export const houses = HOUSES_ENTRIES;
