/**
 * Kuratierte Paar-Reflexionstexte je Spannungsachse (REQ-D-002 / REQ-S-001).
 *
 * Zu jeder der fünf Achsen (siehe ELEMENT_AXIS_MAP in
 * src/utils/tensionNavigator.ts) gibt es zwei Lesarten:
 *  - `reibung`:  wo die Achse spürbar wird — als Wachstumskante, nie als Defekt.
 *  - `harmonie`: wo dieselbe Achse als gemeinsame Ressource wirkt.
 *
 * Anti-Reifikation (bindend): Reflexionsangebote, niemals Paar-Verdikte.
 * Kein Schicksal, keine Diagnose, keine deterministischen Beziehungsaussagen.
 * Jeder `reibung`-Text enthält das Wort "Wachstumskante", jeder
 * `harmonie`-Text das Wort "Ressource". Alle zehn Texte sind eindeutig.
 */
export const PAIR_AXIS_TEXTS: Record<string, { reibung: string; harmonie: string }> = {
  structure_flow: {
    reibung:
      "Wenn eine Seite nach klarer Struktur sucht und die andere im Fluss bleiben möchte, kann das eine Wachstumskante sein: Ordnung und Offenheit ringen hier sichtbar miteinander.",
    harmonie:
      "Struktur und Fluss können sich ergänzen, sobald beide Seiten das Tempo des Gegenübers achten — Halt und Beweglichkeit werden dann zur gemeinsamen Ressource im Alltag.",
  },
  inner_outer: {
    reibung:
      "Zieht eine Seite die Aufmerksamkeit nach Außen, während die andere ihr Innen schützt, entsteht eine Wachstumskante: Sichtbarkeit und Rückzug suchen ein Maß, das beide tragen.",
    harmonie:
      "Wenn Innen und Außen sich abwechseln dürfen, wird der Unterschied zur Ressource — Resonanz nach Außen und ruhige Tiefe im Innen stützen einander statt zu konkurrieren.",
  },
  security_freedom: {
    reibung:
      "Braucht eine Seite verlässliche Sicherheit, während die andere Freiheit atmet, zeigt sich eine Wachstumskante: Verbindlichkeit und Spielraum wollen hier neu ausgehandelt und immer wieder austariert werden.",
    harmonie:
      "Sicherheit und Freiheit müssen sich nicht ausschließen: Als Ressource gelesen, gibt ein verlässlicher Boden Mut zum Aufbruch, und Spielraum hält die Verbindung lebendig.",
  },
  action_being: {
    reibung:
      "Drängt eine Seite ins Handeln, während die andere im Sein verweilt, wird daraus eine Wachstumskante: Tatkraft und Innehalten suchen ein gemeinsames Tempo, das niemanden überfordert.",
    harmonie:
      "Handeln und Sein werden zur Ressource, wenn Aktivität und Ruhe einander rhythmisieren — die eine Seite bringt Bewegung hinein, die andere Tiefe und Verweildauer.",
  },
  tradition_innovation: {
    reibung:
      "Hält eine Seite an Tradition fest, während die andere Innovation sucht, entsteht eine Wachstumskante: Bewährtes und Neues reiben sich, bis ein Weg dazwischen erkennbar wird.",
    harmonie:
      "Tradition und Innovation können zur Ressource werden, sobald Bewahren und Erneuern als zwei Bewegungen desselben Wandels gelten — Wurzeln geben Halt, frische Impulse geben Weite.",
  },
};
