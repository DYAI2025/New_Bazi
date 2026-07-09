import React, { useMemo } from "react";
import { Orbit } from "lucide-react";
import { comparisonToSignatureInput } from "../../utils/visual/signatureAdapter";
import { SignatureCanvas } from "../SignatureCanvas";
import type { ElementalComparisonEntry } from "../../viewmodels/profileViewModel";

/**
 * SignatureMatch — Match-Mode der 3D-Signatur für den Synastrie-Tab.
 *
 * Beide Fusionsfelder werden in EINER Szene gezeigt: Person A als Gold-Schale,
 * Person B als gespiegelte Silber-Blau-Schale, verbunden durch Overlay-Bögen
 * je Element (SignatureScene.enableMatch). Die Eingaben kommen aus den
 * signierten West-vs-BaZi-Elementtabellen der Synastry-Antwort
 * (comparisonA/comparisonB) über comparisonToSignatureInput.
 *
 * Ehrlichkeitsregeln:
 * - Fehlt eine der beiden Elementtabellen (< 2 auswertbare Elemente), zeigt
 *   die Komponente einen sichtbaren Missing-State statt einer erfundenen Szene.
 * - live={false}: keine NOAA-/Transit-Modulation im Paar-Modus — beide Seiten
 *   werden mit derselben statischen Basis gerechnet, keine Scheindynamik.
 * - Die Bögen beschreiben Nähe und Abstand der Elementgewichte, nie eine
 *   Bewertung der Beziehung (Copy wird von synastryWording.test.ts geprüft).
 */

interface SignatureMatchProps {
  comparisonA: ElementalComparisonEntry[] | null | undefined;
  comparisonB: ElementalComparisonEntry[] | null | undefined;
  nameA: string;
  nameB: string;
}

export const SignatureMatch: React.FC<SignatureMatchProps> = ({ comparisonA, comparisonB, nameA, nameB }) => {
  // Stabile Identität wie in SignatureView: SignatureCanvas memoisiert auf den
  // Eingabe-Objekten — pro Render neu gebaute Inputs würden die Szene bei jedem
  // Eltern-Render neu füttern (vgl. SignatureView.renderloop.test.tsx).
  const inputA = useMemo(() => comparisonToSignatureInput(comparisonA), [comparisonA]);
  const inputB = useMemo(() => comparisonToSignatureInput(comparisonB), [comparisonB]);

  if (!inputA || !inputB) {
    return (
      <div
        data-testid="signature-match-missing"
        className="glass-card p-6 rounded-2xl text-center space-y-2"
      >
        <Orbit className="h-6 w-6 text-gold-muted mx-auto" />
        <h4 className="font-serif text-lg font-bold text-gold-light">Paar-Signatur</h4>
        <p className="text-sm text-stone-400 max-w-xl mx-auto">
          Für die Paar-Signatur fehlen auswertbare Elementverteilungen aus beiden
          Fusionsfeldern. Es wird bewusst nichts erfunden — sobald beide Profile ein
          vollständiges Fusionsfeld liefern, erscheint hier die gemeinsame Szene.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="signature-match" className="space-y-3">
      <div className="text-center space-y-1">
        <h4 className="font-serif text-xl font-bold text-gold-light">Paar-Signatur</h4>
        <p className="text-sm text-stone-400 max-w-2xl mx-auto">
          Beide Fusionsfelder in einer Szene: {nameA} in Gold, {nameB} als gespiegelte
          Silber-Blau-Schale. Die Bögen verbinden gleiche Elemente beider Felder — sie
          beschreiben Nähe und Abstand der Gewichtungen, nie ein Urteil über die Beziehung.
        </p>
      </div>
      <div className="relative rounded-2xl overflow-hidden border border-gold-muted/20 bg-[#050505]">
        <SignatureCanvas
          input={inputA}
          partnerInput={inputB}
          live={false}
          className="h-[380px] md:h-[480px] w-full"
        />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-4 text-[10px] uppercase tracking-widest bg-black/40 rounded-full px-4 py-1.5">
          <span className="flex items-center gap-1.5 text-gold-light">
            <span className="h-2 w-2 rounded-full bg-[#d4af37] inline-block" />
            {nameA}
          </span>
          <span className="flex items-center gap-1.5 text-[#9fc5e8]">
            <span className="h-2 w-2 rounded-full bg-[#9fc5e8] inline-block" />
            {nameB}
          </span>
        </div>
      </div>
      <p className="text-center text-xs text-stone-500" data-testid="signature-match-footer">
        Modellergebnis aus zwei berechneten Profilen — Beschreibung, keine Bewertung.
      </p>
    </div>
  );
};

export default SignatureMatch;
