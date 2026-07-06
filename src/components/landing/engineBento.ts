// RD-4: "Visible Engine" bento content. Six cards explaining HOW Bazodiac works — each a
// single sentence + a concrete trust anchor, never a fake metric, never a fate/score claim.
// (Lives under components/landing to stay within the confirmed redesign scope.)

export interface EngineCard {
  id: "compute" | "map" | "interpret" | "reflect" | "deepen" | "protect";
  label: string;
  title: string;
  sentence: string;
  /** A concrete, checkable anchor — not a manufactured number. */
  anchor: string;
}

export const ENGINE_CARDS: EngineCard[] = [
  {
    id: "compute",
    label: "Berechnen",
    title: "Compute",
    sentence: "Deine Geburtsdaten werden serverseitig über die FuFirE-Engine in Positionen und Säulen umgerechnet.",
    anchor: "Quelle: FuFirE-Engine, Schlüssel bleibt serverseitig.",
  },
  {
    id: "map",
    label: "Verorten",
    title: "Map",
    sentence: "Westliche Aspekte, BaZi-Säulen und WuXing-Gewichte werden zu einem gemeinsamen Feld zusammengeführt.",
    anchor: "West × BaZi × WuXing — eine Signatur.",
  },
  {
    id: "interpret",
    label: "Deuten",
    title: "Interpret",
    sentence: "Aus dem Feld leitet das Modell lesbare Spannungen ab — beschrieben, nicht über dich behauptet.",
    anchor: "Jede Deutung nennt ihren Datenanker.",
  },
  {
    id: "reflect",
    label: "Reflektieren",
    title: "Reflect",
    sentence: "Eine aktive Spannung wird zur Frage; deine Reaktion verschiebt den Blick, nicht eine Wahrheit über dich.",
    anchor: "Frage statt Festlegung.",
  },
  {
    id: "deepen",
    label: "Vertiefen",
    title: "Deepen",
    sentence: "Wer mehr will, öffnet die tiefere Methodensicht und die Quellenebene — mehr Erklärung, keine Gewissheit.",
    anchor: "Deep Mode: Erklärung, History, Export.",
  },
  {
    id: "protect",
    label: "Schützen",
    title: "Protect",
    sentence: "Fehlende Daten bleiben sichtbar leer; nichts wird erfunden und nichts ungefragt gespeichert.",
    anchor: "Missing-State statt Fake-Wert.",
  },
];
