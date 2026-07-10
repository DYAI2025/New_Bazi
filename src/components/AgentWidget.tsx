import React, { useEffect, useMemo, useRef, useState } from "react";
import { Phone, PhoneOff, Minimize2, Maximize2 } from "lucide-react";
import type { ProfileViewModel } from "../viewmodels/profileViewModel";

/**
 * AgentWidget — schwebende Sprach-Agenten (Eve & Levi) via ElevenLabs ConvAI.
 *
 * Port des bazodiac.space-Musters (Astro-Noctum AgentFloatingWidget):
 * - Das <elevenlabs-convai>-Custom-Element wird imperativ per
 *   document.body.appendChild gemountet — NICHT via createPortal. Nur so
 *   entkommt das Shadow-DOM-Overlay des Widgets (Mikrofon-Dialog, Call-Screen)
 *   den transform-Stacking-Contexts unserer eigenen UI (Framer Motion).
 * - dynamic-variables werden in-place aktualisiert, um Remounts zu vermeiden.
 * - Agent-IDs sind öffentliche Kennungen (kein Secret) und kommen aus
 *   VITE_ELEVENLABS_AGENT_ID_LEVI / _EVE. Ohne konfigurierte ID erscheint der
 *   jeweilige Agent nicht — kein kaputter Button, ehrlicher Hidden-State.
 * - Personas & System-Prompts leben in der ElevenLabs-Console, nicht im Code.
 */

type AgentId = "levi" | "eve";

interface AgentDef {
  id: AgentId;
  name: string;
  envKey: string;
  accent: string;
  tagline: string;
}

const AGENT_DEFS: AgentDef[] = [
  {
    id: "levi",
    name: "Levi Bazi",
    envKey: "VITE_ELEVENLABS_AGENT_ID_LEVI",
    accent: "#d4af37",
    tagline: "ruhig, bezieht vorhandene Profildaten ein",
  },
  {
    id: "eve",
    name: "Eve",
    envKey: "VITE_ELEVENLABS_AGENT_ID_EVE",
    accent: "#27c8ee",
    tagline: "direkt, verspielt, auf den Punkt",
  },
];

const CONVAI_SCRIPT_URL = "https://elevenlabs.io/convai-widget/index.js";

/**
 * Lädt das ElevenLabs-SDK erst beim ersten Agent-Start (idempotent).
 * Bewusster Trade-off (Review-Finding, high): das SDK ist ein unversioniertes
 * Dritt-Script mit vollem DOM-Zugriff — statisch in index.html liefe es für
 * JEDEN Besucher (auch Landing, auch ohne konfigurierte Agenten). Dynamisch
 * injiziert läuft es nur für Nutzer, die aktiv einen Sprach-Agenten starten.
 * Das Custom Element wird nach Script-Registrierung automatisch upgegradet.
 */
function ensureConvaiScript(): void {
  if (document.querySelector("script[data-convai-loader]")) return;
  const s = document.createElement("script");
  s.src = CONVAI_SCRIPT_URL;
  s.async = true;
  s.type = "text/javascript";
  s.setAttribute("data-convai-loader", "");
  document.head.appendChild(s);
}

function useConvaiWidget(agentId: string | undefined, dynamicVars: string) {
  // Ref statt querySelector: verhindert die Race beim Agent-Wechsel
  // (altes Widget entfernt + neues erzeugt im selben Render).
  const widgetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!agentId) return;

    ensureConvaiScript();
    const widget = document.createElement("elevenlabs-convai");
    widget.setAttribute("agent-id", agentId);
    widget.setAttribute("always-expanded", "");
    widget.setAttribute("dynamic-variables", dynamicVars);
    document.body.appendChild(widget);
    widgetRef.current = widget;

    return () => {
      if (document.body.contains(widget)) {
        document.body.removeChild(widget);
      }
      if (widgetRef.current === widget) {
        widgetRef.current = null;
      }
    };
    // dynamicVars bewusst NICHT in den Deps: Profil lädt asynchron und würde
    // ständige Remounts auslösen; das Update passiert unten in-place.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  useEffect(() => {
    widgetRef.current?.setAttribute("dynamic-variables", dynamicVars);
  }, [dynamicVars]);
}

interface AgentWidgetProps {
  viewModel: ProfileViewModel | null;
}

export const AgentWidget: React.FC<AgentWidgetProps> = ({ viewModel }) => {
  const [activeAgent, setActiveAgent] = useState<AgentId | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Nur Agenten mit konfigurierter ID anbieten.
  const agents = useMemo(
    () => AGENT_DEFS.filter((a) => Boolean(import.meta.env[a.envKey])),
    [],
  );

  // Kompakte Profil-Anker als dynamic-variables — nur was berechnet vorliegt,
  // nichts wird erfunden (leere Strings, wenn kein Profil existiert).
  // Datensparsamkeit (Review-Finding): nur der VORNAME geht an ElevenLabs,
  // nie der volle Name; Geburtsdatum/-zeit/-ort werden nie übertragen.
  const dynamicVars = useMemo(
    () =>
      JSON.stringify({
        user_name: (viewModel?.identity?.name ?? "").trim().split(/\s+/)[0] ?? "",
        sun_sign: viewModel?.western?.sunSign ?? "",
        day_master: viewModel?.bazi?.dayMaster?.element ?? "",
      }),
    [viewModel],
  );

  const activeDef = activeAgent ? agents.find((a) => a.id === activeAgent) : undefined;
  const widgetAgentId = activeDef ? (import.meta.env[activeDef.envKey] as string) : undefined;
  useConvaiWidget(widgetAgentId, dynamicVars);

  if (agents.length === 0) return null;

  const stop = () => setActiveAgent(null);

  return (
    <div
      data-testid="agent-widget"
      className="fixed z-[99999] transition-all duration-300 ease-out"
      style={{ bottom: "calc(16px + env(safe-area-inset-bottom))", right: "16px" }}
    >
      {expanded ? (
        <div className="w-[300px] max-w-[calc(100vw-32px)] rounded-2xl border border-gold-muted/25 bg-obsidian-card/95 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gold-muted/15">
            <span className="font-mono text-[10px] uppercase tracking-widest text-gold-muted font-bold">
              Sprach-Agenten
            </span>
            <button
              onClick={() => setExpanded(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
              aria-label="Minimieren"
              data-testid="agent-widget-minimize"
            >
              <Minimize2 className="w-3.5 h-3.5 text-stone-400" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-xs text-stone-400 leading-relaxed">
              {viewModel
                ? "Sprich mit einem Agenten über dein berechnetes Profil — Reflexionsangebot, kein Urteil."
                : "Noch kein Profil berechnet — die Agenten können sprechen, aber keine Profildaten einbeziehen."}
            </p>
            <p className="text-[10px] text-stone-500 leading-relaxed" data-testid="agent-widget-disclosure">
              Beim Start werden dein Mikrofon-Audio{viewModel ? " sowie Vorname, Sonnenzeichen und Tagesmeister-Element" : ""} an
              ElevenLabs (Drittanbieter, Verarbeitung außerhalb der EU möglich) übertragen.
            </p>
            {agents.map((agent) => {
              const isActive = activeAgent === agent.id;
              return (
                <button
                  key={agent.id}
                  data-testid={`agent-call-${agent.id}`}
                  onClick={() => (isActive ? stop() : setActiveAgent(agent.id))}
                  className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium flex items-center justify-between gap-2 border transition-all ${
                    isActive
                      ? "bg-red-950/40 text-red-300 border-red-800/45 hover:bg-red-900/40"
                      : "hover:bg-gold-muted/10"
                  }`}
                  style={
                    isActive
                      ? undefined
                      : { color: agent.accent, borderColor: `${agent.accent}4D`, background: `${agent.accent}14` }
                  }
                >
                  <span className="flex flex-col items-start">
                    <span>{agent.name}</span>
                    <span className="text-[10px] font-normal text-stone-500">{agent.tagline}</span>
                  </span>
                  {isActive ? <PhoneOff className="w-4 h-4 shrink-0" /> : <Phone className="w-4 h-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          data-testid="agent-widget-pill"
          className="flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg border border-gold-muted/30 bg-obsidian-card/85 backdrop-blur-md transition-all hover:border-gold-muted/50"
          aria-label="Sprach-Agenten öffnen"
        >
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{
              backgroundColor: activeAgent ? (activeDef?.accent ?? "#d4af37") : "#78716c",
              boxShadow: activeAgent ? `0 0 6px ${activeDef?.accent ?? "#d4af37"}` : undefined,
            }}
          />
          <span className="text-xs font-medium text-gold-light tracking-wider">
            {activeDef ? activeDef.name : "Eve & Levi"}
          </span>
          <Maximize2 className="w-3 h-3 text-stone-500" />
        </button>
      )}
    </div>
  );
};

export default AgentWidget;
