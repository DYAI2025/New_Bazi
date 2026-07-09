import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  applyDynamics,
  computeSignature,
  type DynamicsState,
  type SignatureApiInput,
  type SignatureOverlay,
  type WuXingSignature,
} from "../lib/signature/signatureData";
import { startDynamics, type DynamicsHandle } from "../lib/signature/dynamics";
import { SignatureScene } from "../lib/signature/SignatureScene";

/**
 * SignatureCanvas — React-Hülle um die imperative three.js-SignatureScene.
 *
 * Zuständigkeiten:
 * - Szenen-Lebenszyklus (StrictMode-sicher: Cleanup disposed Szene + Dynamik)
 * - Live-Dynamik (NOAA-Space-Weather + simulierte Transits) → Re-Fusion über
 *   das unveränderte applyDynamics/computeSignature aus der Prototyp-Mathematik
 * - Ehrlicher Fallback, wenn WebGL nicht verfügbar ist (kein leerer Screen)
 *
 * Alle sichtbaren Controls (Slider, Live-Button, Quelle-Badge) gehören dem
 * Eltern-Component — dieses meldet den Zustand über onStatus nach oben.
 */

export type CosmicSource = "NOAA" | "SIMULIERT" | "OVERRIDE" | "STATISCH";

export interface SignatureStatus {
  signature: WuXingSignature;
  cosmic: number;
  cosmicSource: CosmicSource;
  overlay: SignatureOverlay | null;
}

interface SignatureCanvasProps {
  input: SignatureApiInput;
  /** Partner-Signatur-Eingabe → Match-Mode (Overlay-Bögen, gespiegeltes Pentagon). */
  partnerInput?: SignatureApiInput | null;
  /** true → NOAA/Transit-Dynamik-Engine läuft (60-s-Takt wie im Prototyp). */
  live?: boolean;
  /** 0..1 — Nutzer-Override des kosmischen Pulses; null = Live-/Basiswert. */
  cosmicOverride?: number | null;
  /** 1..12 — Zeitraffer-Multiplikator. */
  timelapse?: number;
  onStatus?: (status: SignatureStatus) => void;
  className?: string;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  input,
  partnerInput = null,
  live = true,
  cosmicOverride = null,
  timelapse = 1,
  onStatus,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SignatureScene | null>(null);
  const overlayRef = useRef<SignatureOverlay | null>(null);
  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;
  // Letzter Status-Kern (ohne Overlay) — damit onOverlay auch dann einen
  // frischen Status melden kann, wenn sich NUR das Overlay ändert (z. B.
  // partnerInput-Wechsel im Match-Mode ohne neue Signatur/Cosmic-Werte).
  const statusBasicsRef = useRef<Omit<SignatureStatus, "overlay"> | null>(null);

  const [sceneReady, setSceneReady] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
  const [dyn, setDyn] = useState<DynamicsState | null>(null);

  // Szene-Lebenszyklus
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let scene: SignatureScene | null = null;
    try {
      scene = new SignatureScene(container, {
        onOverlay: (overlay) => {
          overlayRef.current = overlay;
          // Overlay-Änderung sofort nach oben melden (Codex-Review-Finding:
          // sonst bliebe status.overlay stale, wenn sich nur der Match-Mode
          // ändert). Kein Loop-Risiko: Eltern memoisieren ihre Inputs, die
          // signature-Identität bleibt stabil, der Status-Effect feuert nicht neu.
          if (statusBasicsRef.current) {
            onStatusRef.current?.({ ...statusBasicsRef.current, overlay });
          }
        },
      });
    } catch (err) {
      console.error("[SignatureCanvas] WebGL nicht verfügbar:", err);
      setWebglFailed(true);
      return;
    }
    sceneRef.current = scene;
    setSceneReady(true);
    return () => {
      setSceneReady(false);
      sceneRef.current = null;
      scene?.dispose();
    };
  }, []);

  // Dynamik-Engine (Layer 1+2): startet nur im Live-Modus.
  useEffect(() => {
    if (!live) {
      setDyn(null);
      return;
    }
    const handle: DynamicsHandle = startDynamics({ intervalMs: 60000, onState: setDyn });
    return () => handle.stop();
  }, [live]);

  // Re-Fusion: Basis-Input + Dynamik (+ Override) → Signatur. Der Override
  // ersetzt nur cosmic_weather.normalized — Transit-Struktur bleibt live.
  const signature = useMemo(() => {
    const effectiveDyn: DynamicsState | null = cosmicOverride !== null
      ? { ...(dyn ?? {}), cosmic_weather: { ...(dyn?.cosmic_weather ?? {}), normalized: cosmicOverride, source: "override" } }
      : dyn;
    return computeSignature(applyDynamics(input, effectiveDyn));
  }, [input, dyn, cosmicOverride]);

  const cosmic = cosmicOverride !== null ? cosmicOverride : signature.cosmicState;
  const cosmicSource: CosmicSource = cosmicOverride !== null
    ? "OVERRIDE"
    : dyn?.cosmic_weather?.source === "noaa"
      ? "NOAA"
      : dyn?.cosmic_weather?.source === "simuliert"
        ? "SIMULIERT"
        : "STATISCH";

  // Signatur + Cosmic in die Szene spielen und Status nach oben melden.
  useEffect(() => {
    statusBasicsRef.current = { signature, cosmic, cosmicSource };
    const scene = sceneRef.current;
    if (scene) {
      scene.applySignature(signature);
      scene.setCosmic(cosmic);
    }
    onStatusRef.current?.({ signature, cosmic, cosmicSource, overlay: overlayRef.current });
  }, [signature, cosmic, cosmicSource, sceneReady]);

  useEffect(() => {
    sceneRef.current?.setTimelapse(timelapse);
  }, [timelapse, sceneReady]);

  // Match-Mode
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (partnerInput) {
      scene.enableMatch(computeSignature(applyDynamics(partnerInput, null)));
    } else {
      scene.disableMatch();
    }
  }, [partnerInput, sceneReady]);

  if (webglFailed) {
    return (
      <div
        data-testid="signature-webgl-fallback"
        className={`flex items-center justify-center text-center p-8 ${className ?? ""}`}
      >
        <p className="text-sm text-stone-400 max-w-md">
          Die 3D-Darstellung ist auf diesem Gerät nicht verfügbar (WebGL fehlt).
          Die zugrunde liegende Berechnung ist davon unberührt — alle Werte
          stehen unter „Herkunft &amp; Methode".
        </p>
      </div>
    );
  }

  return <div ref={containerRef} data-testid="signature-canvas" className={className} />;
};
