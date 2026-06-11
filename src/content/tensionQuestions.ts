export const TENSION_QUESTIONS = {
  structure_flow: {
    leise: [
      "Welche kleine Ordnung trägt dich heute, ohne dass du sie bemerkst?",
      "Wo darf etwas ungeordnet bleiben, ohne dass etwas verloren geht?",
      "Welche Routine könnte heute eine Spur weicher werden?",
    ],
    spuerbar: [
      "Wo gibt dir Struktur Halt – und wo verhindert sie Bewegung?",
      "Welche Form trägt dich, ohne dich einzusperren?",
      "Was will geordnet werden – und was will fließen dürfen?",
    ],
    dominant: [
      "Welche Struktur steht heute im Vordergrund – schützt sie etwas oder hält sie etwas fest?",
      "Wenn heute eine Form nachgeben dürfte: welche wäre es?",
      "Was würde fließen, wenn der Plan eine Stunde Pause hätte?",
    ],
  },
  inner_outer: {
    leise: [
      "Welcher leise Innenraum meldet sich heute am Rand des Tages?",
      "Wo wäre ein kleiner Rückzug heute kein Verlust, sondern ein Sammeln?",
      "Was von dir war heute sichtbar, ohne dass du es zeigen wolltest?",
    ],
    spuerbar: [
      "Was bleibt innen – und was will nach außen sichtbar werden?",
      "Wo schützt dein Innenraum dich – und wo trennt er dich ab?",
      "Wann darfst du sichtbar werden, ohne dich zu verlieren?",
    ],
    dominant: [
      "Die Achse zwischen Rückzug und Ausdruck steht im Vordergrund: Welche Seite bekommt heute zu viel Raum?",
      "Was würde geschehen, wenn das Innere heute einen Satz nach außen spräche?",
      "Welcher Auftritt heute wäre ehrlicher als das Schweigen – und welcher nicht?",
    ],
  },
  security_freedom: {
    leise: [
      "Welche Sicherheit trägt dich heute so selbstverständlich, dass sie unsichtbar ist?",
      "Wo wäre ein kleines Risiko heute eher Spiel als Gefahr?",
      "Welche Absicherung könnte heute eine Handbreit lockerer sitzen?",
    ],
    spuerbar: [
      "Welche Sicherheit trägt dich – und welche hält dich klein?",
      "Was musst du sichern, damit du loslassen kannst?",
      "Wo beginnt Freiheit – und wo wird sie Flucht?",
    ],
    dominant: [
      "Sicherheit und Freiheit ziehen heute deutlich in verschiedene Richtungen: Welche Entscheidung schiebt das Spannungsfeld vor sich her?",
      "Welcher sichere Ort ist heute zu eng geworden?",
      "Wenn Freiheit heute einen Preis hat: Welcher wäre ihn wert – und welcher nicht?",
    ],
  },
  action_being: {
    leise: [
      "Welche kleine Handlung wartet heute geduldig darauf, dass ihr Moment kommt?",
      "Wo ist Nichtstun heute kein Aufschub, sondern Ankommen?",
      "Welcher Moment heute will nur wahrgenommen werden, nicht verbessert?",
    ],
    spuerbar: [
      "Was will getan werden – und was darf erst ankommen?",
      "Wo ist Stille Kraft – und wo ist sie Vermeidung?",
      "Wie klingt ein Tag, der handeln und ruhen darf?",
    ],
    dominant: [
      "Der Zug zum Handeln steht im Vordergrund: Was davon ist Antwort – und was ist Ausweichen vor dem Stillstand?",
      "Welche eine Handlung hätte heute Gewicht – und welche drei wären nur Bewegung?",
      "Was geschieht, wenn du heute zehn Minuten nichts in Bewegung setzt?",
    ],
  },
  tradition_innovation: {
    leise: [
      "Welches Erbe arbeitet heute leise für dich?",
      "Wo könnte ein vertrauter Weg heute eine neue Abzweigung vertragen?",
      "Welche alte Gewohnheit verdient heute einen zweiten, freundlichen Blick?",
    ],
    spuerbar: [
      "Welches Erbe trägt dich – und welches hält dich fest?",
      "Was darf neu werden, ohne das Alte zu verraten?",
      "Wo bist du Brücke – und wo willst du Ufer sein?",
    ],
    dominant: [
      "Herkunft und Erneuerung stehen sich heute deutlich gegenüber: Welcher Schritt ehrt beide?",
      "Welche Neuerung drängt – und was aus dem Alten will mitgenommen werden?",
      "Wenn heute etwas zum letzten Mal auf die alte Weise geschieht: Was wäre es?",
    ],
  },
} as const;

/** Paar-Modus, MVP nur Stufe "spuerbar". Rahmung: Differenz zwischen zwei Feldern, nie Bewertung der Beziehung. */
export const PAIR_QUESTIONS: Record<string, string> = {
  structure_flow: "Wo gibt die Form des einen dem Fluss des anderen Halt – und wo bremst sie ihn?",
  inner_outer: "Was bleibt zwischen euch innen – und was will gemeinsam nach außen sichtbar werden?",
  security_freedom: "Welche Sicherheit baut ihr einander – und wo braucht einer von euch mehr Weite?",
  action_being: "Wer von euch setzt in Bewegung, wer lässt ankommen – und wann tauscht ihr die Rollen?",
  tradition_innovation: "Welches Mitgebrachte trägt euch als Paar – und was wollt ihr gemeinsam neu erfinden?",
};

/** Deterministische Tagesrotation: FNV-1a-Hash über `${axisId}` als fester Achsen-Offset + Tagesnummer → Index.
 *  Aufeinanderfolgende Tage rotieren ohne Wiederholung (dayNumber mod 3 + Achsen-Offset). */
export function selectQuestion(
  axisId: keyof typeof TENSION_QUESTIONS,
  level: "leise" | "spuerbar" | "dominant",
  dateISO: string,
): string {
  const qs = TENSION_QUESTIONS[axisId][level];
  const dayNumber = Math.floor(Date.parse(dateISO + "T00:00:00Z") / 86_400_000);
  let h = 2166136261;
  for (const ch of axisId) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return qs[(((dayNumber + (h >>> 0)) % qs.length) + qs.length) % qs.length];
}
