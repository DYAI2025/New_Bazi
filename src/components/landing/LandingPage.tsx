import React from "react";
import ScrollProgress from "../design/ScrollProgress";
import SectionShell from "../design/SectionShell";
import FusionHero from "./FusionHero";
import SpannungsPreview from "./SpannungsPreview";
import VisibleEngineBento from "./VisibleEngineBento";
import MethodTrustSection from "./MethodTrustSection";
import FusionPathSection from "./FusionPathSection";

// RD-2..5: the additive Observatorium landing. Composes the redesign sections; each RD
// iteration adds one. `onStart` flows into the live InputForm (App activeTab='input').
export default function LandingPage({ onStart }: { onStart?: () => void }) {
  return (
    <div data-testid="landing-page" className="relative">
      <ScrollProgress />

      <SectionShell className="pt-10">
        <FusionHero onStart={onStart} />
      </SectionShell>

      <SectionShell
        eyebrow="Probelauf"
        heading="Teste eine Spannung in 90 Sekunden"
        intro="Kein Konto nötig. Ein Demo-Durchlauf zeigt die Bewegung: aktive Spannung, eine Frage, deine Reaktion."
      >
        <SpannungsPreview onStart={onStart} />
      </SectionShell>

      <SectionShell
        eyebrow="Die Engine"
        heading="Sichtbar gerechnet, nicht behauptet"
        intro="Wie aus Geburtsdaten ein lesbares Spannungsfeld wird — sechs Schichten, jede mit einem konkreten Anker."
      >
        <VisibleEngineBento />
      </SectionShell>

      <SectionShell
        eyebrow="Methode & Grenzen"
        heading="Was berechnet wird — und was nicht"
        intro="Transparent: was die Engine rechnet, was das Modell daraus liest, und wofür Bazodiac ausdrücklich nicht da ist."
      >
        <MethodTrustSection />
      </SectionShell>

      <SectionShell
        eyebrow="Dein Weg"
        heading="Ein ruhiges Feld, das mitwächst"
        intro="Die Signatur bleibt stabil, die Frage bewegt sich. Wer tiefer will, bekommt mehr Erklärung — keine stärkere Wahrheit."
      >
        <FusionPathSection onStart={onStart} />
      </SectionShell>
    </div>
  );
}
